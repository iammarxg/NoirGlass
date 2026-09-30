using MediaBrowser.Common.Configuration;
using MediaBrowser.Common.Plugins;
using MediaBrowser.Model.Plugins;
using MediaBrowser.Model.Serialization;
using Microsoft.Extensions.Logging;
using NoirGlass.Plugin.Configuration;

namespace NoirGlass.Plugin;

public sealed class Plugin : BasePlugin<PluginConfiguration>, IHasWebPages
{
    public const string PluginId = "72f7ec75-08a4-4f5b-90fa-df751666c621";

    public Plugin(IApplicationPaths applicationPaths, IXmlSerializer xmlSerializer, ILogger<Plugin> logger)
        : base(applicationPaths, xmlSerializer)
    {
        try
        {
            MigrateConfiguration(applicationPaths.PluginConfigurationsPath);
        }
        catch (Exception error) when (error is IOException or UnauthorizedAccessException)
        {
            logger.LogWarning(error, "Could not migrate the previous NoirLucent configuration to NoirGlass");
        }
        Instance = this;
    }

    public static void MigrateConfiguration(string directory)
    {
        var previous = Path.Combine(directory, "NoirLucent.Plugin.xml");
        var current = Path.Combine(directory, "NoirGlass.Plugin.xml");
        if (!File.Exists(current) && File.Exists(previous)) File.Copy(previous, current);
    }

    public static Plugin? Instance { get; private set; }

    public override string Name => "NoirGlass";

    public override Guid Id => Guid.Parse(PluginId);

    public IEnumerable<PluginPageInfo> GetPages() =>
    [
        new PluginPageInfo
        {
            Name = Name,
            EmbeddedResourcePath = "NoirGlass.Plugin.Configuration.configPage.html"
        }
    ];
}
