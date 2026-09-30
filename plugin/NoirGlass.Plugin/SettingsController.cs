using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace NoirGlass.Plugin;

[ApiController]
[Authorize]
[Route("NoirGlass/Settings")]
public sealed class SettingsController : ControllerBase
{
    public static int NormalizeInterval(int seconds) => seconds == 0 ? 0 : Math.Clamp(seconds, 5, 60);

    public static string[] ParsePinnedIds(string? text) =>
        (text ?? string.Empty)
            .Split([',', ';', '\r', '\n', ' ', '\t'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(value => Guid.TryParseExact(value, "N", out _))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(5)
            .ToArray();

    [HttpGet]
    public IActionResult Get()
    {
        var config = Plugin.Instance?.Configuration;
        if (config is null) return StatusCode(503);
        var pins = ParsePinnedIds(config.PinnedItemIds);
        Response.Headers.CacheControl = "private, no-store";
        return Ok(new { enabled = config.Enabled, pinnedItemIds = pins, intervalSeconds = NormalizeInterval(config.FeaturedIntervalSeconds) });
    }
}
