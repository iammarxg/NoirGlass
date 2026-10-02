using MediaBrowser.Model.Plugins;

namespace NoirGlass.Plugin.Configuration;

public sealed class PluginConfiguration : BasePluginConfiguration
{
    public bool Enabled { get; set; } = true;

    public bool ThemeDashboard { get; set; } = true;

    public string PinnedItemIds { get; set; } = string.Empty;

    public int FeaturedIntervalSeconds { get; set; } = 10;

    public int FeaturedItemCount { get; set; } = 10;

    public int LineupRefreshMinutes { get; set; } = 360;

    public string RotationRevision { get; set; } = string.Empty;

    public bool HomeLinksEnabled { get; set; }

    public List<HomeNavigationLink> HomeLinks { get; set; } = [];

    public bool HideBranding { get; set; }
}

public sealed class HomeNavigationLink
{
    public string Kind { get; set; } = "library";

    public string LibraryId { get; set; } = string.Empty;

    public string Label { get; set; } = string.Empty;
}
