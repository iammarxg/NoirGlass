using MediaBrowser.Common.Api;
using NoirGlass.Plugin.Configuration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace NoirGlass.Plugin;

[ApiController]
[Authorize]
[Route("NoirGlass/Settings")]
public sealed class SettingsController : ControllerBase
{
    private static readonly object RotationLock = new();

    public static int NormalizeInterval(int seconds) => seconds == 0 ? 0 : Math.Clamp(seconds, 5, 60);

    public static int NormalizeCount(int count) => Math.Max(1, count);

    public static string[] ParsePinnedIds(string? text) =>
        (text ?? string.Empty)
            .Split([',', ';', '\r', '\n', ' ', '\t'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(value => Guid.TryParseExact(value, "N", out _))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

    public static object Settings(PluginConfiguration config) => new
    {
        enabled = config.Enabled,
        themeDashboard = config.ThemeDashboard,
        pinnedItemIds = ParsePinnedIds(config.PinnedItemIds),
        intervalSeconds = NormalizeInterval(config.FeaturedIntervalSeconds),
        featuredItemCount = NormalizeCount(config.FeaturedItemCount),
        lineupRefreshMinutes = Math.Max(0, config.LineupRefreshMinutes),
        rotationRevision = config.RotationRevision,
        homeLinksEnabled = config.HomeLinksEnabled,
        homeLinks = (config.HomeLinks ?? []).Where(link => link.Kind == "collections" ||
            (link.Kind == "library" && Guid.TryParseExact(link.LibraryId, "N", out _)))
            .Select(link => new { kind = link.Kind, libraryId = link.LibraryId, label = link.Label }),
        hideBranding = config.HideBranding
    };

    public static string RotateConfiguration(PluginConfiguration config)
    {
        config.RotationRevision = Guid.NewGuid().ToString("N");
        return config.RotationRevision;
    }

    [HttpGet]
    public IActionResult Get()
    {
        var config = Plugin.Instance?.Configuration;
        if (config is null) return StatusCode(503);
        Response.Headers.CacheControl = "private, no-store";
        return Ok(Settings(config));
    }

    // Only this non-sensitive presentation flag is public, so login branding
    // can follow the administrator's choice without exposing library settings.
    [AllowAnonymous]
    [HttpGet("/NoirGlass/Branding")]
    public IActionResult Branding()
    {
        var config = Plugin.Instance?.Configuration;
        Response.Headers.CacheControl = "no-store";
        return Ok(new { enabled = config?.Enabled == true, hideBranding = config?.Enabled == true && config.HideBranding });
    }

    [HttpPost("/NoirGlass/Rotate")]
    [Authorize(Policy = Policies.RequiresElevation)]
    public IActionResult Rotate()
    {
        var plugin = Plugin.Instance;
        if (plugin is null) return StatusCode(503);
        lock (RotationLock)
        {
            var revision = RotateConfiguration(plugin.Configuration);
            plugin.SaveConfiguration();
            Response.Headers.CacheControl = "private, no-store";
            return Ok(new { rotationRevision = revision });
        }
    }
}
