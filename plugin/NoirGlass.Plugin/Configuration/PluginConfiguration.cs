using MediaBrowser.Model.Plugins;

namespace NoirGlass.Plugin.Configuration;

public sealed class PluginConfiguration : BasePluginConfiguration
{
    public bool Enabled { get; set; } = true;

    public bool ThemeDashboard { get; set; } = true;

    public string PinnedItemIds { get; set; } = string.Empty;

    public int FeaturedIntervalSeconds { get; set; } = 15;
}
