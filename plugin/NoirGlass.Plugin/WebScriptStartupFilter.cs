using System.Net;
using System.Text;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.Extensions.Primitives;

namespace NoirGlass.Plugin;

public sealed class WebScriptStartupFilter : IStartupFilter
{
    private const string AssetPath = "/NoirGlass/companion.js";
    private const string Marker = "data-noirglass-plugin";
    private static readonly byte[] Script = LoadScript();

    public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next) => app =>
    {
        app.Use(async (context, downstream) =>
        {
            if (HttpMethods.IsGet(context.Request.Method) || HttpMethods.IsHead(context.Request.Method))
            {
                if (context.Request.Path.Equals(AssetPath, StringComparison.OrdinalIgnoreCase))
                {
                    context.Response.ContentType = "application/javascript; charset=utf-8";
                    context.Response.Headers.CacheControl = "public, max-age=3600";
                    context.Response.ContentLength = Script.Length;
                    if (HttpMethods.IsGet(context.Request.Method)) await context.Response.Body.WriteAsync(Script);
                    return;
                }

                if (HttpMethods.IsGet(context.Request.Method) && Plugin.Instance?.Configuration.Enabled == true && IsWebIndex(context.Request.Path))
                {
                    await TransformIndex(context, _ => downstream());
                    return;
                }
            }
            await downstream();
        });
        next(app);
    };

    public static bool IsWebIndex(PathString path) =>
        path.Equals("/web/", StringComparison.OrdinalIgnoreCase) ||
        path.Equals("/web/index.html", StringComparison.OrdinalIgnoreCase);

    public static string Inject(string html, string scriptUrl)
    {
        if (html.Contains(Marker, StringComparison.Ordinal)) return html;
        var index = html.IndexOf("</head>", StringComparison.OrdinalIgnoreCase);
        if (index < 0) return html;
        var element = "<script " + Marker + " src=\"" + WebUtility.HtmlEncode(scriptUrl) + "\" defer></script>\n";
        return html.Insert(index, element);
    }

    private static async Task TransformIndex(HttpContext context, RequestDelegate downstream)
    {
        var originalFeature = context.Features.Get<IHttpResponseBodyFeature>();
        if (originalFeature is null) { await downstream(context); return; }
        var acceptEncoding = context.Request.Headers.AcceptEncoding;
        var ifNoneMatch = context.Request.Headers.IfNoneMatch;
        var ifModifiedSince = context.Request.Headers.IfModifiedSince;
        context.Request.Headers.Remove("Accept-Encoding");
        context.Request.Headers.Remove("If-None-Match");
        context.Request.Headers.Remove("If-Modified-Since");

        using var buffer = new MemoryStream();
        context.Features.Set<IHttpResponseBodyFeature>(new StreamResponseBodyFeature(buffer, originalFeature));
        try { await downstream(context); }
        finally
        {
            context.Features.Set(originalFeature);
            Restore(context.Request.Headers, "Accept-Encoding", acceptEncoding);
            Restore(context.Request.Headers, "If-None-Match", ifNoneMatch);
            Restore(context.Request.Headers, "If-Modified-Since", ifModifiedSince);
        }

        buffer.Position = 0;
        if (context.Response.StatusCode == StatusCodes.Status200OK &&
            context.Response.ContentType?.StartsWith("text/html", StringComparison.OrdinalIgnoreCase) == true &&
            buffer.Length < 4 * 1024 * 1024)
        {
            using var reader = new StreamReader(buffer, Encoding.UTF8, detectEncodingFromByteOrderMarks: true, leaveOpen: true);
            var html = await reader.ReadToEndAsync();
            var basePath = context.Request.PathBase.Value?.TrimEnd('/') ?? string.Empty;
            var version = typeof(WebScriptStartupFilter).Assembly.GetName().Version?.ToString(3) ?? "0.0.0";
            var updated = Inject(html, basePath + AssetPath + "?v=" + version);
            if (updated != html)
            {
                context.Response.Headers.Remove("ETag");
                context.Response.Headers.Remove("Last-Modified");
                context.Response.Headers.Remove("Content-Encoding");
                context.Response.ContentLength = null;
                await context.Response.Body.WriteAsync(Encoding.UTF8.GetBytes(updated));
                return;
            }
        }
        buffer.Position = 0;
        context.Response.ContentLength = buffer.Length;
        await buffer.CopyToAsync(context.Response.Body);
    }

    private static void Restore(IHeaderDictionary headers, string name, StringValues value)
    {
        if (value.Count == 0) headers.Remove(name);
        else headers[name] = value;
    }

    private static byte[] LoadScript()
    {
        using var stream = typeof(WebScriptStartupFilter).Assembly.GetManifestResourceStream("NoirGlass.Plugin.Browser.companion.js")
            ?? throw new InvalidOperationException("NoirGlass browser script is missing from the plugin assembly.");
        using var output = new MemoryStream();
        stream.CopyTo(output);
        return output.ToArray();
    }
}
