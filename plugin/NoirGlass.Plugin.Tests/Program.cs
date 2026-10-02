using System.Reflection;
using System.Text;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using NoirGlass.Plugin;
using NoirGlass.Plugin.Configuration;

static void Check(bool value, string name)
{
    if (!value) throw new Exception(name);
    Console.WriteLine("PASS " + name);
}

Check(WebScriptStartupFilter.IsWebIndex("/web/"), "Web root recognized");
Check(WebScriptStartupFilter.IsWebIndex("/WEB/INDEX.HTML"), "Web index recognized case-insensitively");
Check(!WebScriptStartupFilter.IsWebIndex("/Videos/stream"), "Playback paths excluded");
var html = "<html><head><title>Web</title></head><body></body></html>";
var once = WebScriptStartupFilter.Inject(html, "/base/NoirGlass/companion.js?v=1.0.0");
Check(once.Contains("src=\"/base/NoirGlass/companion.js?v=1.0.0\""), "Base URL script added");
Check(WebScriptStartupFilter.Inject(once, "/base/NoirGlass/companion.js") == once, "Duplicate insertion prevented");
Check(WebScriptStartupFilter.Inject("<html><body></body></html>", "/script.js") == "<html><body></body></html>", "Unknown HTML left untouched");
Check(WebScriptStartupFilter.Inject(html, "/base/\"evil\".js").Contains("&quot;evil&quot;"), "Script URL HTML-encoded");
var pins = SettingsController.ParsePinnedIds("1234567890abcdef1234567890abcdef, invalid, 1234567890ABCDEF1234567890ABCDEF\nabcdefabcdefabcdefabcdefabcdefab");
Check(pins.Length == 2, "Pinned item IDs validate and deduplicate");
Check(SettingsController.NormalizeInterval(0) == 0, "Zero disables autoplay");
Check(SettingsController.NormalizeInterval(15) == 15, "Default interval is retained");
Check(SettingsController.NormalizeInterval(-4) == 5 && SettingsController.NormalizeInterval(90) == 60, "Out-of-range intervals are clamped");
Check(Plugin.PluginId == "72f7ec75-08a4-4f5b-90fa-df751666c621", "Plugin GUID survives rename");
Check(typeof(SettingsController).IsDefined(typeof(AuthorizeAttribute)), "Settings route requires authentication");
Check(new PluginConfiguration().ThemeDashboard, "Dashboard styling defaults to enabled");
Check(new PluginConfiguration().FeaturedIntervalSeconds == 10 && new PluginConfiguration().FeaturedItemCount == 10 && new PluginConfiguration().LineupRefreshMinutes == 360, "New configurations use ten-second slides, ten titles and six-hour rotation");
Check(SettingsController.NormalizeCount(2500) == 2500 && SettingsController.NormalizeCount(0) == 1, "Featured count has no arbitrary theme cap");
var manyPins = string.Join('\n', Enumerable.Range(1, 12).Select(value => value.ToString("x32")));
Check(SettingsController.ParsePinnedIds(manyPins).Length == 12, "Pins are not capped at five");
var rotationConfig = new PluginConfiguration();
var firstRevision = SettingsController.RotateConfiguration(rotationConfig);
Check(firstRevision != SettingsController.RotateConfiguration(rotationConfig), "Each manual rotation changes its revision");
var rotateMethod = typeof(SettingsController).GetMethod(nameof(SettingsController.Rotate))!;
Check(rotateMethod.GetCustomAttributes<AuthorizeAttribute>().Any(attribute => attribute.Policy == "RequiresElevation"), "Rotate endpoint requires administrator elevation");
Check(typeof(SettingsController).GetMethod(nameof(SettingsController.Branding))!.IsDefined(typeof(AllowAnonymousAttribute)), "Login branding has an explicit public presentation-only endpoint");
var settingsSerializer = new System.Xml.Serialization.XmlSerializer(typeof(PluginConfiguration));
using (var serialized = new StringWriter())
{
    settingsSerializer.Serialize(serialized, new PluginConfiguration { ThemeDashboard = false });
    using var reader = new StringReader(serialized.ToString());
    Check(!((PluginConfiguration)settingsSerializer.Deserialize(reader)!).ThemeDashboard, "Explicit Dashboard opt-out survives configuration serialization");
}

var configurationDirectory = Path.Combine(Path.GetTempPath(), "noirglass-migration-" + Guid.NewGuid().ToString("N"));
Directory.CreateDirectory(configurationDirectory);
try
{
    var oldPath = Path.Combine(configurationDirectory, "NoirLucent.Plugin.xml");
    var newPath = Path.Combine(configurationDirectory, "NoirGlass.Plugin.xml");
    await File.WriteAllTextAsync(oldPath, "<PluginConfiguration><Enabled>false</Enabled><PinnedItemIds>1234567890abcdef1234567890abcdef</PinnedItemIds></PluginConfiguration>");
    Plugin.MigrateConfiguration(configurationDirectory);
    var serializer = new System.Xml.Serialization.XmlSerializer(typeof(PluginConfiguration));
    using (var reader = File.OpenRead(newPath))
    {
        var restored = (PluginConfiguration)serializer.Deserialize(reader)!;
        Check(!restored.Enabled && restored.PinnedItemIds == "1234567890abcdef1234567890abcdef" && restored.FeaturedIntervalSeconds == 10 && restored.ThemeDashboard,
            "Pre-rename settings migrate with the default autoplay interval");
    }
    Check(File.Exists(oldPath), "Migration preserves the previous configuration");
    await File.WriteAllTextAsync(newPath, "existing NoirGlass settings");
    Plugin.MigrateConfiguration(configurationDirectory);
    Check(await File.ReadAllTextAsync(newPath) == "existing NoirGlass settings", "Migration never overwrites NoirGlass settings");
}
finally { Directory.Delete(configurationDirectory, true); }

using (var reader = new StringReader("<PluginConfiguration><FeaturedIntervalSeconds>15</FeaturedIntervalSeconds></PluginConfiguration>"))
{
    var restored = (PluginConfiguration)settingsSerializer.Deserialize(reader)!;
    Check(restored.FeaturedIntervalSeconds == 15 && restored.FeaturedItemCount == 10 && restored.LineupRefreshMinutes == 360, "Existing saved autoplay survives additive configuration defaults");
}
var configured = new PluginConfiguration { HomeLinksEnabled = true, HideBranding = true, HomeLinks = [new HomeNavigationLink { LibraryId = "1234567890abcdef1234567890abcdef", Label = "Cinema" }] };
using (var serialized = new StringWriter())
{
    settingsSerializer.Serialize(serialized, configured);
    using var reader = new StringReader(serialized.ToString());
    var restored = (PluginConfiguration)settingsSerializer.Deserialize(reader)!;
    Check(restored.HomeLinksEnabled && restored.HideBranding && restored.HomeLinks[0].Label == "Cinema", "Ordered navigation and branding settings round-trip");
}

var services = new ServiceCollection().BuildServiceProvider();
var builder = new ApplicationBuilder(services);
new WebScriptStartupFilter().Configure(app => app.Run(async context =>
{
    context.Response.ContentType = "text/plain";
    await context.Response.WriteAsync("downstream");
}))(builder);
var pipeline = builder.Build();
var asset = new DefaultHttpContext();
asset.Request.Method = "GET";
asset.Request.Path = "/NoirGlass/companion.js";
asset.Response.Body = new MemoryStream();
await pipeline(asset);
asset.Response.Body.Position = 0;
var script = await new StreamReader(asset.Response.Body).ReadToEndAsync();
Check(asset.Response.ContentType?.StartsWith("application/javascript", StringComparison.Ordinal) == true && script.Contains("NoirGlass companion"), "Embedded browser asset served");
var unrelated = new DefaultHttpContext();
unrelated.Request.Method = "GET";
unrelated.Request.Path = "/Videos/stream";
unrelated.Response.Body = new MemoryStream();
await pipeline(unrelated);
unrelated.Response.Body.Position = 0;
Check(await new StreamReader(unrelated.Response.Body).ReadToEndAsync() == "downstream", "Unrelated requests pass through");

var method = typeof(WebScriptStartupFilter).GetMethod("TransformIndex", BindingFlags.NonPublic | BindingFlags.Static)
    ?? throw new Exception("TransformIndex missing");
var index = new DefaultHttpContext();
index.Request.Path = "/web/index.html";
index.Request.PathBase = "/jelly";
index.Request.Headers.AcceptEncoding = "gzip";
index.Request.Headers.IfNoneMatch = "old-tag";
index.Response.Body = new MemoryStream();
RequestDelegate serveIndex = async context =>
{
    Check(!context.Request.Headers.ContainsKey("Accept-Encoding"), "Index served without compressed bytes");
    Check(!context.Request.Headers.ContainsKey("If-None-Match"), "Index served with fresh body");
    context.Response.ContentType = "text/html; charset=utf-8";
    context.Response.Headers.ETag = "old-tag";
    var bytes = Encoding.UTF8.GetBytes(html);
    context.Response.ContentLength = bytes.Length;
    await context.Response.Body.WriteAsync(bytes);
};
await (Task)method.Invoke(null, [index, serveIndex])!;
index.Response.Body.Position = 0;
var transformed = await new StreamReader(index.Response.Body).ReadToEndAsync();
var pluginVersion = typeof(WebScriptStartupFilter).Assembly.GetName().Version?.ToString(3);
Check(transformed.Contains("/jelly/NoirGlass/companion.js?v=" + pluginVersion), "Index middleware honors base URL");
Check(index.Response.ContentLength is null && !index.Response.Headers.ContainsKey("ETag"), "Stale response validators removed");
Check(index.Request.Headers.AcceptEncoding == "gzip" && index.Request.Headers.IfNoneMatch == "old-tag", "Request headers restored");

var fixturePath = Path.GetTempFileName();
try
{
    await File.WriteAllTextAsync(fixturePath, html);
    var staticIndex = new DefaultHttpContext();
    staticIndex.Request.Path = "/web/";
    staticIndex.Response.Body = new MemoryStream();
    RequestDelegate sendFile = async context =>
    {
        context.Response.ContentType = "text/html; charset=utf-8";
        await context.Features.Get<IHttpResponseBodyFeature>()!.SendFileAsync(fixturePath, 0, null, CancellationToken.None);
    };
    await (Task)method.Invoke(null, [staticIndex, sendFile])!;
    staticIndex.Response.Body.Position = 0;
    Check((await new StreamReader(staticIndex.Response.Body).ReadToEndAsync()).Contains("data-noirglass-plugin"), "Static SendFile response is transformed");
}
finally { File.Delete(fixturePath); }

// An isolated controller host verifies authorization without starting Jellyfin
// or constructing its plugin/configuration services.
var hostBuilder = WebApplication.CreateBuilder();
hostBuilder.Logging.ClearProviders();
hostBuilder.WebHost.UseUrls("http://127.0.0.1:0");
hostBuilder.Services.AddControllers().AddApplicationPart(typeof(SettingsController).Assembly);
hostBuilder.Services.AddAuthentication("fixture").AddScheme<AuthenticationSchemeOptions, FixtureAuthenticationHandler>("fixture", _ => { });
hostBuilder.Services.AddAuthorization(options => options.AddPolicy("RequiresElevation", policy => policy.RequireAuthenticatedUser().RequireClaim("fixture-admin", "true")));
await using (var app = hostBuilder.Build())
{
    app.UseAuthentication(); app.UseAuthorization(); app.MapControllers();
    await app.StartAsync();
    var address = app.Services.GetRequiredService<IServer>().Features.Get<IServerAddressesFeature>()!.Addresses.Single();
    using var client = new HttpClient { BaseAddress = new Uri(address) };
    Check((await client.GetAsync("/NoirGlass/Settings")).StatusCode == System.Net.HttpStatusCode.Unauthorized, "HTTP settings rejects anonymous requests");
    using var publicResponse = await client.GetAsync("/NoirGlass/Branding");
    var publicJson = System.Text.Json.JsonDocument.Parse(await publicResponse.Content.ReadAsStringAsync());
    Check(publicResponse.IsSuccessStatusCode && publicJson.RootElement.EnumerateObject().Count() == 2 && publicJson.RootElement.TryGetProperty("hideBranding", out _), "Public branding exposes only presentation flags");
    Check((await client.PostAsync("/NoirGlass/Rotate", null)).StatusCode == System.Net.HttpStatusCode.Unauthorized, "HTTP rotation rejects anonymous requests");
    client.DefaultRequestHeaders.Add("X-NoirGlass-Test-Role", "viewer");
    Check((await client.PostAsync("/NoirGlass/Rotate", null)).StatusCode == System.Net.HttpStatusCode.Forbidden, "HTTP rotation rejects non-administrators");
    client.DefaultRequestHeaders.Remove("X-NoirGlass-Test-Role"); client.DefaultRequestHeaders.Add("X-NoirGlass-Test-Role", "admin");
    Check((await client.PostAsync("/NoirGlass/Rotate", null)).StatusCode == System.Net.HttpStatusCode.ServiceUnavailable, "Authorized rotation degrades safely without plugin services");
    await app.StopAsync();
}
