/* NoirGlass companion | MIT. Loaded by the NoirGlass Jellyfin Web plugin.
   All metadata requests use Jellyfin's authenticated client in memory. */
(() => {
  'use strict';
  window.__NoirGlassCompanion?.destroy?.();
  const DEFAULT_FEATURED = 10;
  const ROOT_CLASS = 'ng-feature';
  const SELECTOR = '#indexPage:not(.hide) #homeTab.is-active';
  const isJellyfinWebPath = /\/web\/(?:index\.html)?$/i.test(location.pathname);
  if (!isJellyfinWebPath) return;

  let request = 0;
  let scheduled = false;
  let scheduleTimer = null;
  let destroyed = false;
  let loading = false;
  let currentPage = null;
  let currentFeature = null;
  let detailRequest = 0;
  let detailId = null;
  let detailItem = null;
  let detailLoading = null;
  let detailAttempted = null;
  let pluginSettings = null;
  let settingsLoading = null;
  let settingsRetryAfter = 0;
  let settingsUser = null;
  let settingsFetchedAt = 0;
  let lineup = [];
  let lineupAt = 0;
  let lineupKey = null;
  let lineupRevision = null;
  let navigationKey = null;
  let navigationHost = null;
  let navigationLoading = false;
  let navigationFinished = false;
  let navigationRequest = 0;
  let preferencesTimer = null;
  let publicBrandingAt = 0;
  let publicBrandingLoading = false;
  let publicBranding = null;
  let loginBrand = null;
  let loginBrandKey = null;
  let loginBrandRequest = 0;
  let publicBrandingRequest = 0;
  let dashboardRequest = 0;
  let dashboardKey = null;
  let dashboardTimer = null;
  let dashboardProbe = null;
  let dashboardRetryAfter = 0;
  let observedUser = null;
  let observedApi = null;

  const themeReady = () => getComputedStyle(document.documentElement).getPropertyValue('--ng-companion-contract').trim() === '1';
  const dashboardThemeReady = () => themeReady() && getComputedStyle(document.documentElement).getPropertyValue('--ng-dashboard-contract').trim() === '1';
  async function loadSettings(api, force = false) {
    const userId = api.getCurrentUserId();
    if (!userId) return null;
    if (settingsUser !== userId) {
      settingsUser = userId;
      pluginSettings = settingsLoading = null;
      settingsRetryAfter = 0;
    }
    if (pluginSettings && !force && Date.now() - settingsFetchedAt < 60000) return pluginSettings;
    if (settingsLoading) return settingsLoading;
    if (Date.now() < settingsRetryAfter || typeof api.getJSON !== 'function' || typeof api.getUrl !== 'function') return pluginSettings;
    const pending = Promise.resolve().then(() => api.getJSON(api.getUrl('NoirGlass/Settings')))
      .then(value => {
        if (destroyed || window.ApiClient !== api || settingsUser !== userId || api.getCurrentUserId() !== userId) return null;
        pluginSettings = {
          enabled: value?.enabled === true,
          themeDashboard: value?.themeDashboard === true,
          pinnedItemIds: Array.isArray(value?.pinnedItemIds) ? value.pinnedItemIds : [],
          intervalSeconds: Number.isInteger(value?.intervalSeconds) && (value.intervalSeconds === 0 || (value.intervalSeconds >= 5 && value.intervalSeconds <= 60))
            ? value.intervalSeconds : 10,
          featuredItemCount: Number.isSafeInteger(value?.featuredItemCount) && value.featuredItemCount > 0 ? value.featuredItemCount : DEFAULT_FEATURED,
          lineupRefreshMinutes: Number.isSafeInteger(value?.lineupRefreshMinutes) && value.lineupRefreshMinutes >= 0 ? value.lineupRefreshMinutes : 360,
          rotationRevision: typeof value?.rotationRevision === "string" ? value.rotationRevision : "",
          homeLinksEnabled: value?.homeLinksEnabled === true,
          homeLinks: Array.isArray(value?.homeLinks) ? value.homeLinks : [],
          hideBranding: value?.hideBranding === true
        };
        settingsFetchedAt = Date.now();
        document.documentElement.classList.toggle("ng-hide-branding", pluginSettings.enabled && pluginSettings.hideBranding);
        schedule();
        return pluginSettings;
      })
      .catch(() => {
        if (window.ApiClient === api && settingsUser === userId) settingsRetryAfter = Date.now() + 10000;
        return window.ApiClient === api && settingsUser === userId ? pluginSettings : null;
      })
      .finally(() => { if (settingsLoading === pending) settingsLoading = null; });
    settingsLoading = pending;
    return settingsLoading;
  }

  // Mirrors Jellyfin CustomCss.tsx: server CSS, then this user's local CSS.
  // userSettings uses appSettings.get(name, userId) for both CSS preferences.
  // Read only these two keys; never enumerate or persist authentication data.
  const onDashboard = () => document.body?.classList.contains('dashboardDocument') &&
    /^#\/(?:dashboard(?:\/|$)|metadata(?:\?|$)|configurationpage(?:\?|$))/i.test(location.hash);
  function dashboardPreferences(userId) {
    try {
      return {
        disabled: localStorage.getItem(`${userId}-disableCustomCss`) === 'true',
        css: localStorage.getItem(`${userId}-customCss`) || ''
      };
    } catch { return null; }
  }
  const noirGlassConfigured = css =>
    /@import\s+(?:url\(\s*)?["']?https:\/\/cdn\.jsdelivr\.net\/gh\/iammarxg\/NoirGlass@[^\s"')]+\/dist\/noirglass\.min\.css/i.test(css) ||
    (/--ng-companion-contract\s*:\s*1\s*[;}]/.test(css) && /--ng-field-|--ng-bg\s*:/.test(css));
  function clearDashboard() {
    dashboardRequest += 1;
    dashboardKey = null;
    clearTimeout(dashboardProbe);
    clearTimeout(dashboardTimer);
    dashboardProbe = dashboardTimer = null;
    document.querySelectorAll('style[data-noirglass-dashboard]').forEach(node => node.remove());
  }
  function syncIdentity() {
    const userId = typeof window.ApiClient?.getCurrentUserId === 'function' ? window.ApiClient.getCurrentUserId() || null : null;
    if (observedUser === userId && observedApi === window.ApiClient) return;
    observedUser = userId;
    observedApi = window.ApiClient;
    request += 1;
    removeFeature();
    clearDetailBadges();
    clearDashboard();
    dashboardRetryAfter = 0;
    settingsUser = null;
    pluginSettings = settingsLoading = null;
    settingsRetryAfter = settingsFetchedAt = 0;
    lineup = []; lineupAt = 0; lineupKey = lineupRevision = null;
    clearNavigation(); clearLoginBranding(); publicBrandingAt = 0; publicBranding = null; publicBrandingRequest++; publicBrandingLoading = false;
    document.documentElement.classList.remove("ng-hide-branding");
  }
  async function syncDashboard() {
    const api = window.ApiClient;
    const userId = typeof api?.getCurrentUserId === 'function' ? api.getCurrentUserId() : null;
    if (destroyed || !onDashboard() || !userId) {
      if (dashboardKey || dashboardTimer || dashboardProbe) clearDashboard();
      if (!userId) { settingsUser = null; pluginSettings = settingsLoading = null; }
      return;
    }
    if (typeof api.getCurrentUser !== 'function' || typeof api.getJSON !== 'function' || typeof api.getUrl !== 'function') return;
    const preferences = dashboardPreferences(userId);
    if (!preferences) { clearDashboard(); return; }
    const key = JSON.stringify([userId, preferences.disabled, preferences.css]);
    if (key === dashboardKey || Date.now() < dashboardRetryAfter) return;
    clearDashboard();
    dashboardKey = key;
    const turn = dashboardRequest;
    let ready = false;
    const current = () => !destroyed && turn === dashboardRequest && onDashboard() &&
      window.ApiClient === api && api.getCurrentUserId() === userId &&
      JSON.stringify([userId, dashboardPreferences(userId)?.disabled, dashboardPreferences(userId)?.css]) === key;
    const fail = () => {
      if (turn !== dashboardRequest) return;
      clearDashboard();
      dashboardRetryAfter = Date.now() + 10000;
    };
    try {
      const user = await api.getCurrentUser();
      if (!current()) return;
      // Administration styling is not an authorization mechanism; Jellyfin still
      // owns access control. Only inject for its positively identified admin.
      if (user?.Policy?.IsAdministrator !== true) { fail(); return; }
      const settings = await loadSettings(api);
      if (!current()) return;
      if (!settings?.enabled || !settings.themeDashboard) { fail(); return; }
      const server = preferences.disabled ? '' : (await api.getJSON(api.getUrl('Branding/Configuration')))?.CustomCss || '';
      if (!current()) return;
      const css = [typeof server === 'string' ? server : '', preferences.css];
      if (!css.some(noirGlassConfigured)) { fail(); return; }
      for (const [index, value] of css.entries()) {
        if (!value.trim()) continue;
        const node = document.createElement('style');
        node.dataset.noirglassDashboard = index === 0 ? 'server' : 'user';
        node.textContent = value;
        document.head.append(node);
      }
      const deadline = Date.now() + 6000;
      const probe = () => {
        if (!current()) { if (turn === dashboardRequest) clearDashboard(); return; }
        if (dashboardThemeReady()) { ready = true; return; }
        if (Date.now() >= deadline) { fail(); return; }
        dashboardProbe = setTimeout(probe, 100);
      };
      probe();
    } catch { fail(); } // Network/CSP/client failures leave native Dashboard usable.
    finally {
      if (turn === dashboardRequest && !current()) { clearDashboard(); schedule(); }
      if (current()) {
        // Detect sign-out or changed local preferences even when no DOM changes.
        const monitor = () => {
          dashboardTimer = null;
          if (!current()) { clearDashboard(); schedule(); return; }
          if (ready && !dashboardThemeReady()) { fail(); return; }
          dashboardTimer = setTimeout(monitor, 1000);
        };
        dashboardTimer = setTimeout(monitor, 1000);
      }
    }
  }

  function removeFeature() {
    currentFeature?.__ngCleanup?.();
    currentFeature?.remove();
    currentFeature = currentPage = null;
  }

  const visible = element => !!element && element.getBoundingClientRect().width > 0;
  const client = () => {
    const candidate = window.ApiClient;
    return candidate && typeof candidate.getCurrentUserId === 'function' &&
      typeof candidate.getItems === 'function' && typeof candidate.getImageUrl === 'function'
      ? candidate : null;
  };
  const safeImage = url => {
    try {
      const parsed = new URL(url, location.href);
      return parsed.origin === location.origin ? parsed.href : '';
    } catch { return ''; }
  };
  const art = (api, item, type) => {
    const id = type === 'Backdrop' && !item.BackdropImageTags?.length
      ? item.ParentBackdropItemId : item.Id;
    const tag = type === 'Backdrop'
      ? item.BackdropImageTags?.[0] || item.ParentBackdropImageTags?.[0]
      : item.ImageTags?.Logo;
    if (!id || !tag) return '';
    return safeImage(api.getImageUrl(id, { type, index: 0, tag, maxWidth: Math.min(3840, Math.ceil(innerWidth * Math.min(devicePixelRatio || 1, 2) / 320) * 320) }));
  };
  const canFeature = (api, item) => item && /^(Movie|Series)$/.test(item.Type || '') &&
    !!art(api, item, 'Backdrop');
  const imageLoads = url => new Promise(resolve => {
    if (!url) { resolve(false); return; }
    const probe = new Image();
    let settled = false;
    const finish = result => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      probe.onload = probe.onerror = null;
      resolve(result);
    };
    const timer = setTimeout(() => finish(false), 10000);
    probe.onload = () => finish(probe.naturalWidth > 0);
    probe.onerror = () => finish(false);
    probe.src = url;
  });
  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = String(text);
    return node;
  };
  function clearDetailBadges() {
    document.querySelectorAll('#itemDetailPage .ng-format-badges').forEach(node => node.remove());
    detailId = detailItem = null;
    detailLoading = detailAttempted = null;
    detailRequest += 1;
  }
  function formatBadges(form, item) {
    const sourceId = form.querySelector('.selectSource')?.value;
    const source = sourceId ? item.MediaSources?.find(x => x.Id === sourceId) : item.MediaSources?.[0];
    if (!source) { form.querySelectorAll('.ng-format-badges').forEach(n => n.remove()); return; }
    const streams = source.MediaStreams || [];
    const selected = (selector, type) => {
      const field = form.querySelector(selector);
      if (!field || field.value === '') return null;
      return streams.find(x => x.Type === type && x.Index === Number(field.value));
    };
    const video = selected('.selectVideo', 'Video'), audio = selected('.selectAudio', 'Audio');
    const key = JSON.stringify([item.Id, source.Id, video?.Index, audio?.Index, item.Tags, source.Name, source.Path]);
    if (form.dataset.ngFormatsKey === key && form.querySelector('.ng-format-badges')) return;
    form.querySelectorAll('.ng-format-badges').forEach(n => n.remove());
    const formats = new Map();
    const add = (id, label, evidence = 'Selected stream metadata') => formats.set(id, { label, evidence });
    if (video) {
      if (Number(video.Width) >= 3800) add('4k', '4K');
      const range = [video.VideoRangeType, video.VideoRange, video.VideoDoViTitle].filter(Boolean).join(' ');
      if (/dovi|dolby.?vision/i.test(range) || Number(video.DvProfile) > 0) add('dv', 'Dolby Vision');
      if (video.Hdr10PlusPresentFlag === true || /hdr10plus|hdr10\+/i.test(range)) add('hdr10plus', 'HDR10+');
      if (/hdr10(?!plus|\+)/i.test(range)) add('hdr10', 'HDR10');
      if (/hlg/i.test(range)) add('hlg', 'HLG');
      if (!formats.has('dv') && !formats.has('hdr10plus') && !formats.has('hdr10') && !formats.has('hlg') && /\bhdr\b/i.test(range)) add('hdr', 'HDR');
      if (!formats.has('dv') && !/hdr|hlg/i.test(range) && /\bsdr\b/i.test(range)) add('sdr', 'SDR');
    }
    if (audio) {
      const codec = (audio.Codec || '').toLowerCase();
      const info = [audio.Profile, audio.AudioSpatialFormat, audio.Title, audio.DisplayTitle].filter(Boolean).join(' ');
      if (/atmos|\bjoc\b/i.test(info)) add('da', 'Dolby Atmos');
      if (/dts.?x\b/i.test(info)) add('dtsx', 'DTS:X');
      if (/truehd|mlp/.test(codec)) add('truehd', 'Dolby TrueHD');
      else if (/^(eac3|ec-3)$/.test(codec)) add('ddp', 'Dolby Digital+');
      else if (/^(ac3|ac-3)$/.test(codec)) add('dd', 'Dolby Digital');
      else if (/dts/.test(codec)) {
        if (/dts.?hd.?ma|master audio/i.test(info)) add('dtshdma', 'DTS-HD MA');
        else if (/dts.?hd.?hra|high resolution/i.test(info)) add('dtshdhr', 'DTS-HD HR');
        else if (/dts.?hd/i.test(info)) add('dtshd', 'DTS-HD');
        else add('dts', 'DTS');
      }
      const layout = (audio.ChannelLayout || '').trim();
      if (layout) add('channels', /^(mono|stereo)$/i.test(layout) ? layout.replace(/^./, c => c.toUpperCase()) : layout);
      else if (Number(audio.Channels) > 0) add('channels', audio.Channels + ' channels');
    }
    const sourceText = [source.Name, source.Path?.split(/[\\/]/).pop(), ...(item.Tags || [])].filter(x => typeof x === 'string').join(' ');
    for (const [id, label, pattern] of [
      ['remux','REMUX',/\bremux\b/i], ['webdl','WEB-DL',/\bweb[ ._-]?dl\b/i],
      ['webrip','WEBRip',/\bweb[ ._-]?rip\b/i], ['bluray','Blu-ray',/\bblu[ ._-]?ray\b/i],
      ['openmatte','Open Matte',/\bopen[ ._-]?matte\b/i], ['35mm','35mm',/\b35[ ._-]?mm\b/i],
      ['70mm','70mm',/\b70[ ._-]?mm\b/i], ['imax','IMAX',/\bimax\b/i], ['dcp','DCP',/\bdcp\b/i]
    ]) if (pattern.test(sourceText)) add(id, label, 'Explicit source filename/name or Jellyfin tag');
    if (formats.size) {
      const group = make('div', 'ng-format-badges');
      group.setAttribute('aria-label', 'Source and selected track formats');
      for (const [id, info] of formats) {
        const badge = make('span', 'ng-format-badge', info.label);
        badge.dataset.format = id; badge.dataset.evidence = info.evidence;
        badge.title = info.evidence + ': ' + info.label + '; this is a source label, not a guarantee of browser playback quality';
        group.append(badge);
      }
      if (document.documentElement.classList.contains('layout-desktop')) form.prepend(group);
      else form.append(group);
    }
    form.dataset.ngFormatsKey = key;
  }

  async function syncDetail() {
    if (destroyed) return;
    if (!themeReady()) { clearDetailBadges(); return; }
    const initialApi = client();
    if (!initialApi || !initialApi.getCurrentUserId() || !(await loadSettings(initialApi))?.enabled) { clearDetailBadges(); return; }
    const page = document.querySelector('#itemDetailPage:not(.hide)');
    const form = page?.querySelector('.trackSelections');
    const id = new URLSearchParams(location.hash.split('?')[1] || '').get('id');
    if (!page || !visible(page) || !form || !/^[a-f0-9]{32}$/i.test(id || '')) {
      if (detailId || document.querySelector('#itemDetailPage .ng-format-badges')) clearDetailBadges();
      return;
    }
    const api = client();
    if (!api || !api.getCurrentUserId() || typeof api.getItem !== 'function') return;
    const owner = api.getCurrentUserId();
    if (detailId !== id) {
      clearDetailBadges();
      detailId = id;
    }
    if (detailItem) { formatBadges(form, detailItem); return; }
    if (detailLoading === id || detailAttempted === id) return;
    detailLoading = detailAttempted = id;
    const turn = ++detailRequest;
    try {
      const item = await api.getItem(owner, id);
      if (destroyed || !themeReady() || api.getCurrentUserId() !== owner || turn !== detailRequest || detailId !== id || !form.isConnected ||
          !document.querySelector('#itemDetailPage:not(.hide)')) return;
      detailItem = item?.MediaSources?.length ? item : null;
      if (detailItem) formatBadges(form, detailItem);
    } catch {
      // Missing metadata leaves Jellyfin's native selectors untouched.
    } finally { if (detailLoading === id) detailLoading = null; }
  }
  const detailsHash = item => `#/details?id=${encodeURIComponent(item.Id)}`;
  const openDetails = item => { location.hash = detailsHash(item); };
  const play = item => {
    openDetails(item);
    const wanted = item.Id;
    const deadline = Date.now() + 10000;
    const tryPlay = () => {
      if (!location.hash.includes(`id=${encodeURIComponent(wanted)}`)) return true;
      const button = document.querySelector('#itemDetailPage:not(.hide) .mainDetailButtons .btnPlay:not(.hide)');
      if (visible(button)) { button.click(); return true; }
      return Date.now() > deadline;
    };
    if (tryPlay()) return;
    const observer = new MutationObserver(() => { if (tryPlay()) observer.disconnect(); });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    setTimeout(() => observer.disconnect(), 10000);
  };

  async function loadItems(api, rotating, turn) {
    const owner = api.getCurrentUserId(), count = pluginSettings.featuredItemCount;
    const pool = [], seen = new Set();
    let offset = 0;
    // Stable pages avoid independently randomized pagination duplicates.
    for (;;) {
      const response = await api.getItems(owner, {
        Recursive: true, IncludeItemTypes: 'Movie,Series',
        SortBy: 'SortName', SortOrder: 'Ascending', StartIndex: offset, Limit: 200,
        Fields: 'Overview,Genres,ProductionYear,RunTimeTicks,BackdropImageTags,ImageTags'
      });
      if (destroyed || turn !== request || api.getCurrentUserId() !== owner || !document.querySelector(SELECTOR)) throw new DOMException('Stale lineup', 'AbortError');
      const batch = Array.isArray(response) ? response : response?.Items || [];
      let added = 0;
      for (const item of batch) if (!seen.has(item.Id)) {
        seen.add(item.Id); added++;
        if (canFeature(api, item)) pool.push(item);
      }
      offset += batch.length;
      if (!added || batch.length < 200 || (Number.isFinite(response?.TotalRecordCount) && offset >= response.TotalRecordCount)) break;
    }
    const selected = [], selectedIds = new Set();
    const add = item => { if (canFeature(api, item) && !selectedIds.has(item.Id)) { selected.push(item); selectedIds.add(item.Id); } };
    for (const id of pluginSettings.pinnedItemIds) {
      if (selected.length >= count) break;
      if (!/^[a-f0-9]{32}$/i.test(id)) continue;
      let item = pool.find(x => x.Id === id);
      if (!item && typeof api.getItem === 'function') try { item = await api.getItem(owner, id); } catch { /* inaccessible */ }
      if (destroyed || turn !== request || api.getCurrentUserId() !== owner) throw new DOMException('Stale pins', 'AbortError');
      add(item);
    }
    if (rotating) {
      for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
      const old = new Set(lineup.map(x => x.Id));
      pool.sort((a, b) => Number(old.has(a.Id)) - Number(old.has(b.Id)));
    }
    for (const item of pool) { if (selected.length >= count) break; add(item); }
    let probes = 0;
    while (selected.length && !await imageLoads(art(api, selected[0], 'Backdrop'))) {
      if (++probes >= 8) return []; // Bounded failure recovery, independent of requested lineup size.
      selected.shift();
      for (const item of pool) { if (selected.length >= count) break; add(item); }
      if (destroyed || turn !== request || api.getCurrentUserId() !== owner) throw new DOMException('Stale artwork', 'AbortError');
    }
    return selected;
  }


  function createFeature(page, api, items) {
    const root = make('section', ROOT_CLASS);
    root.setAttribute('aria-label', 'Featured titles');
    const track = make('div', 'ng-feature__track');
    const pager = make('div', 'ng-feature__pager');
    const previous = make('button', 'ng-feature__arrow', '\u2039');
    const next = make('button', 'ng-feature__arrow', '\u203a');
    const status = make('span', 'ng-feature__status');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    previous.type = next.type = 'button';
    previous.setAttribute('aria-label', 'Previous featured title');
    next.setAttribute('aria-label', 'Next featured title');

    function makeSlide(item) {
      const slide = make('div', 'ng-feature__slide');
      slide.inert = true;
      slide.setAttribute('aria-hidden', 'true');
      const image = make('img', 'ng-feature__art');
      image.alt = '';
      image.setAttribute('aria-hidden', 'true');
      image.addEventListener('error', () => image.removeAttribute('src'));
      image.src = art(api, item, 'Backdrop');
      const scrim = make('div', 'ng-feature__scrim');
      const content = make('div', 'ng-feature__content');
      const logo = make('img', 'ng-feature__logo');
      logo.alt = '';
      logo.setAttribute('aria-hidden', 'true');
      const title = make('h1', 'ng-feature__title', item.Name || 'Untitled');
      logo.addEventListener('error', () => {
        logo.hidden = true;
        title.classList.remove('ng-feature__title--visually-hidden');
      });
      const logoUrl = art(api, item, 'Logo');
      logo.hidden = true;
      if (logoUrl) {
        logo.addEventListener('load', () => {
          if (logo.naturalWidth > 0) {
            logo.hidden = false;
            title.classList.add('ng-feature__title--visually-hidden');
          }
        });
        logo.src = logoUrl;
      }
      const meta = make('div', 'ng-feature__meta');
      const parts = [item.ProductionYear, item.Type === 'Series' ? 'TV Show' : 'Movie', ...(item.Genres || []).slice(0, 2)];
      for (const part of parts.filter(Boolean)) meta.append(make('span', '', part));
      const overview = make('p', 'ng-feature__overview', (item.Overview || '').replace(/<[^>]*>/g, ''));
      overview.hidden = !overview.textContent;
      const actions = make('div', 'ng-feature__actions');
      const playButton = make('button', 'ng-feature__action ng-feature__action--primary', '\u25b6  Play');
      const infoButton = make('button', 'ng-feature__action', 'Details');
      playButton.type = infoButton.type = 'button';
      playButton.addEventListener('click', () => play(item));
      infoButton.addEventListener('click', () => openDetails(item));
      actions.append(playButton, infoButton);
      content.append(logo, title, meta, overview, actions);
      slide.append(image, scrim, content);
      return slide;
    }
    const slides = new Map();
    const slideAt = index => { if (!slides.has(index)) slides.set(index, makeSlide(items[index])); return slides.get(index); };
    root.dataset.total = String(items.length);
    let active = 0;
    let activeSlide = slideAt(0);
    let transitionCleanup = null;
    let timer = null;
    let disposed = false;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const hoverCapable = matchMedia('(hover: hover)');
    const interval = pluginSettings?.intervalSeconds ?? 10;
    let dots = [];
    function updateDots() {
      const focused = document.activeElement;
      const focusedIndex = focused?.classList.contains('ng-feature__dot') ? Number(focused.dataset.index) : null;
      dots.forEach(dot => dot.remove());
      dots = [];
      const windowSize = innerWidth < 380 ? 1 : innerWidth <= 768 ? 3 : 7;
      const start = items.length <= windowSize ? 0 : Math.max(0, Math.min(active - Math.floor(windowSize / 2), items.length - windowSize));
      const stop = Math.min(items.length, start + windowSize);
      for (let index = start; index < stop; index++) {
        const dot = make('button', 'ng-feature__dot');
        dot.type = 'button'; dot.dataset.index = String(index);
        dot.setAttribute('aria-label', 'Show featured title ' + (index + 1) + ': ' + (items[index].Name || 'Untitled'));
        dot.setAttribute('aria-current', String(index === active));
        dot.addEventListener('click', () => show(index, true));
        dots.push(dot); pager.insertBefore(dot, next);
      }
      if (focusedIndex !== null) (dots.find(d => Number(d.dataset.index) === focusedIndex) || dots.find(d => d.getAttribute('aria-current') === 'true'))?.focus({ preventScroll: true });
    }

    function canAutoplay() {
      const bounds = root.getBoundingClientRect();
      const visibleHeight = Math.min(bounds.bottom, innerHeight) - Math.max(bounds.top, 0);
      return !disposed && root.isConnected && !transitionCleanup && interval > 0 && items.length > 1 &&
        !reducedMotion.matches && !document.hidden &&
        bounds.height > 0 && visibleHeight / bounds.height >= 0.15 && bounds.right > 0 && bounds.left < innerWidth &&
        !(hoverCapable.matches && root.matches(':hover')) && !root.contains(document.activeElement);
    }
    function scheduleAutoplay() {
      if (timer) clearTimeout(timer);
      timer = null;
      if (!canAutoplay()) return;
      timer = setTimeout(() => {
        timer = null;
        if (canAutoplay()) show(active + 1, false);
      }, interval * 1000);
    }
    function finishTransition() { transitionCleanup?.(); }
    function show(index, manual) {
      if (disposed) return;
      finishTransition();
      const target = (index + items.length) % items.length;
      if (target === active) { scheduleAutoplay(); return; }
      const outgoing = activeSlide;
      const incoming = slideAt(target);
      const direction = index === active - 1 || (index >= 0 && target === active - 1) ? -1 : 1;
      const moveFocus = outgoing.contains(document.activeElement);
      active = target;
      activeSlide = incoming;
      updateDots();
      if (moveFocus) pager.querySelector("[aria-current=true]")?.focus({ preventScroll: true });
      if (manual) status.textContent = `Featured title ${active + 1} of ${items.length}: ${items[active].Name || 'Untitled'}`;
      if (timer) clearTimeout(timer);
      timer = null;
      outgoing.inert = true;
      outgoing.setAttribute('aria-hidden', 'true');
      incoming.inert = false;
      incoming.setAttribute('aria-hidden', 'false');
      incoming.style.transition = 'none';
      incoming.style.transform = `translate3d(${direction * 100}%, 0, 0)`;
      track.append(incoming);
      const durationValue = getComputedStyle(root).getPropertyValue('--ng-feature-slide-duration').trim();
      const parsedDuration = parseFloat(durationValue) || 0;
      const duration = durationValue.endsWith('ms') ? parsedDuration : parsedDuration * 1000;
      if (reducedMotion.matches || duration <= 0) {
        outgoing.remove();
        slides.delete([...slides.entries()].find(([, node]) => node === outgoing)?.[0]);
        incoming.style.transform = 'translate3d(0, 0, 0)';
        incoming.style.transition = '';
        preloadNext();
        scheduleAutoplay();
        return;
      }
      void incoming.offsetWidth;
      incoming.style.transition = '';
      incoming.style.transform = 'translate3d(0, 0, 0)';
      outgoing.style.transform = `translate3d(${-direction * 100}%, 0, 0)`;
      let fallback;
      const finish = () => {
        if (transitionCleanup !== finish) return;
        incoming.removeEventListener('transitionend', onEnd);
        clearTimeout(fallback);
        outgoing.remove();
        slides.delete([...slides.entries()].find(([, node]) => node === outgoing)?.[0]);
        outgoing.style.transform = '';
        incoming.style.transform = 'translate3d(0, 0, 0)';
        transitionCleanup = null;
        preloadNext();
        scheduleAutoplay();
      };
      const onEnd = event => { if (event.target === incoming && event.propertyName === 'transform') finish(); };
      transitionCleanup = finish;
      incoming.addEventListener('transitionend', onEnd);
      fallback = setTimeout(finish, duration + 100);
    }
    previous.addEventListener('click', () => show(active - 1, true));
    next.addEventListener('click', () => show(active + 1, true));
    root.addEventListener('keydown', event => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        show(active + (event.key === 'ArrowRight' ? 1 : -1), true);
      }
    });
    let touchStart;
    root.addEventListener('touchstart', event => {
      const touch = event.changedTouches[0];
      touchStart = { x: touch.clientX, y: touch.clientY };
    }, { passive: true });
    root.addEventListener('touchend', event => {
      if (!touchStart) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - touchStart.x;
      const dy = touch.clientY - touchStart.y;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        event.stopPropagation();
        show(active + (dx < 0 ? 1 : -1), true);
      }
      touchStart = null;
    }, { passive: true });
    root.addEventListener('pointerenter', scheduleAutoplay);
    root.addEventListener('pointerleave', scheduleAutoplay);
    root.addEventListener('focusin', scheduleAutoplay);
    root.addEventListener('focusout', () => queueMicrotask(scheduleAutoplay));
    const resized = () => { updateDots(); scheduleAutoplay(); };
    window.addEventListener('resize', resized);
    document.addEventListener('visibilitychange', scheduleAutoplay);
    window.addEventListener('scroll', scheduleAutoplay, { passive: true });
    reducedMotion.addEventListener('change', scheduleAutoplay);
    const intersection = typeof IntersectionObserver === 'function'
      ? new IntersectionObserver(scheduleAutoplay, { threshold: [0, 0.15] })
      : null;
    pager.append(previous, next);
    activeSlide.inert = false;
    activeSlide.setAttribute('aria-hidden', 'false');
    track.append(activeSlide);
    root.append(track, pager, status);
    updateDots();
    page.insertBefore(root, page.firstChild);
    intersection?.observe(root);
    function preloadNext() { if (!disposed && items.length > 1) { const image = new Image(); image.src = art(api, items[(active + 1) % items.length], "Backdrop"); } }
    preloadNext();
    scheduleAutoplay();
    root.__ngIdle = () => !root.contains(document.activeElement) && !(hoverCapable.matches && root.matches(":hover")) && !document.hidden && !transitionCleanup;
    root.addEventListener("pointerleave", schedule);
    root.addEventListener("focusout", schedule);
    root.__ngCleanup = () => {
      disposed = true;
      if (timer) clearTimeout(timer);
      timer = null;
      finishTransition();
      intersection?.disconnect();
      document.removeEventListener('visibilitychange', scheduleAutoplay);
      window.removeEventListener('scroll', scheduleAutoplay);
      window.removeEventListener('resize', resized);
      reducedMotion.removeEventListener('change', scheduleAutoplay);
    };
    return root;
  }

  function clearNavigation() {
    navigationRequest++; navigationKey = null; navigationHost = null; navigationLoading = false; navigationFinished = false;
    document.querySelectorAll('.ng-home-links').forEach(node => node.remove());
  }
  async function syncNavigation() {
    const api = client(), owner = api?.getCurrentUserId(), page = document.querySelector('#indexPage:not(.hide)');
    if (!owner || !page || !themeReady()) { clearNavigation(); return; }
    const settings = await loadSettings(api);
    if (!settings?.enabled || !settings.homeLinksEnabled || typeof api.getUserViews !== 'function') { clearNavigation(); return; }
    const host = document.querySelector('.skinHeader:not(.osdHeader) .headerTabs');
    if (!host) return;
    const key = JSON.stringify([owner, settings.homeLinks]);
    if (key === navigationKey && host === navigationHost && (navigationLoading || navigationFinished)) return;
    clearNavigation(); navigationKey = key; navigationHost = host; navigationLoading = true;
    const turn = navigationRequest;
    try {
      const response = await api.getUserViews(owner), views = response?.Items || [];
      if (destroyed || turn !== navigationRequest || api.getCurrentUserId() !== owner || !document.querySelector('#indexPage:not(.hide)') || !host.isConnected) return;
      const nav = make('nav', 'ng-home-links'); nav.setAttribute('aria-label', 'Additional Home destinations');
      const destinations = new Set();
      for (const link of settings.homeLinks) {
        let hash, name;
        if (link.kind === 'collections') { hash = '#/list?type=BoxSet'; name = 'Collections'; }
        else {
          const library = views.find(view => view.Id === link.libraryId);
          if (!library) continue;
          name = library.Name || 'Library';
          const type = library.CollectionType || '';
          const route = type === 'movies' ? 'movies' : type === 'tvshows' ? 'tv' : 'list';
          hash = '#/' + route + '?' + (route === 'list' ? 'parentId' : 'topParentId') + '=' + encodeURIComponent(library.Id) + '&collectionType=' + encodeURIComponent(type);
        }
        if (destinations.has(hash)) continue;
        destinations.add(hash);
        const anchor = make('a', 'ng-home-link', typeof link.label === 'string' && link.label.trim() ? link.label.trim() : name);
        anchor.href = hash; nav.append(anchor);
      }
        if (nav.childElementCount) host.append(nav);
        navigationFinished = true;
    } catch { if (turn === navigationRequest) navigationKey = null; }
    finally { if (turn === navigationRequest) navigationLoading = false; }
  }
  function clearLoginBranding() {
    loginBrandRequest++;
    loginBrand?.remove();
    loginBrand = null; loginBrandKey = null;
    document.documentElement.classList.remove('ng-login-brand-ready');
    document.querySelectorAll('[data-ng-login-header-brand]').forEach(node => {
      node.removeAttribute('data-ng-login-header-brand');
      if (node.dataset.ngLoginOldLabel !== undefined) {
        const label = node.dataset.ngLoginOldLabel;
        if (label) node.setAttribute('aria-label', label); else node.removeAttribute('aria-label');
        delete node.dataset.ngLoginOldLabel;
      }
    });
  }
  function syncLoginBranding() {
    const flags = client()?.getCurrentUserId() ? pluginSettings : publicBranding;
    const card = document.querySelector('#loginPage:not(.hide) > .padded-left.padded-right.padded-bottom-page');
    const heading = [...(card?.querySelectorAll('h1') || [])].find(visible);
    if (destroyed || !themeReady() || !document.documentElement.classList.contains('layout-desktop') ||
        !card || !heading || !visible(card) || !flags?.enabled || flags.hideBranding) {
      if (loginBrand || loginBrandKey) clearLoginBranding();
      return;
    }
    const icon = document.querySelector('.MuiAppBar-root a[href="#/"] img[src*="icon-transparent"]');
    const legacy = document.querySelector('.skinHeader .pageTitleWithDefaultLogo');
    const sourceNode = icon || legacy;
    const background = legacy && getComputedStyle(legacy).backgroundImage;
    const asset = icon?.currentSrc || icon?.src || background?.match(/url\(["']?(.+?)["']?\)/)?.[1];
    if (!sourceNode || !asset) { if (loginBrandKey) clearLoginBranding(); return; }
    if (loginBrandKey?.card === card && loginBrandKey.heading === heading && loginBrandKey.asset === asset && loginBrandKey.source === sourceNode && (!loginBrand || loginBrand.isConnected)) return;
    clearLoginBranding();
    loginBrandKey = { card, heading, asset, source: sourceNode };
    const turn = ++loginBrandRequest;
    const row = make('div', 'ng-login-brand');
    row.setAttribute('aria-label', 'Jellyfin');
    const image = new Image();
    image.alt = icon ? '' : 'Jellyfin'; image.decoding = 'async';
    row.append(image);
    if (icon) row.append(make('span', 'ng-login-wordmark', 'Jellyfin'));
    image.onload = async () => {
      try { await image.decode(); } catch { return; }
      if (destroyed || turn !== loginBrandRequest || !card.isConnected || !heading.isConnected || !sourceNode.isConnected || !visible(heading) ||
          !image.naturalWidth || !image.naturalHeight) return;
      const currentFlags = client()?.getCurrentUserId() ? pluginSettings : publicBranding;
      if (!currentFlags?.enabled || currentFlags.hideBranding || !themeReady() ||
          !document.documentElement.classList.contains('layout-desktop') || !visible(card)) return;
      loginBrand = row;
      heading.before(row);
      const headerBrand = icon?.closest('a') || legacy;
      headerBrand.setAttribute('data-ng-login-header-brand', '');
      if (icon) {
        headerBrand.dataset.ngLoginOldLabel = headerBrand.getAttribute('aria-label') || '';
        headerBrand.setAttribute('aria-label', 'Home');
      }
      document.documentElement.classList.add('ng-login-brand-ready');
    };
    // Failed assets retain native branding; retry on a new source or route.
    image.onerror = () => {};
    image.src = asset;
  }
  async function syncPublicBranding() {
    if (destroyed || client()?.getCurrentUserId() || publicBrandingLoading || Date.now() - publicBrandingAt < 60000) return;
    publicBrandingLoading = true; publicBrandingAt = Date.now();
    const turn = ++publicBrandingRequest;
    try {
      const base = location.pathname.replace(/\/web\/(?:index\.html)?$/i, '');
      const response = await fetch(base + '/NoirGlass/Branding', { credentials: 'same-origin', cache: 'no-store' });
      if (!response.ok) return;
      const value = await response.json();
      if (!destroyed && turn === publicBrandingRequest && !client()?.getCurrentUserId()) {
        publicBranding = { enabled: value.enabled === true, hideBranding: value.hideBranding === true };
        document.documentElement.classList.toggle('ng-hide-branding', publicBranding.enabled && publicBranding.hideBranding);
        schedule();
      }
    } catch { /* presentation flags are optional */ }
    finally { if (turn === publicBrandingRequest) publicBrandingLoading = false; }
  }
  async function sync() {
    if (destroyed) return;
    if (!themeReady()) { request++; removeFeature(); return; }
    const page = document.querySelector(SELECTOR);
    if (!page || !visible(page)) { request++; removeFeature(); return; }
    const api = client(), owner = api?.getCurrentUserId();
    if (!owner) return;
    const settings = await loadSettings(api);
    if (!settings?.enabled) { removeFeature(); return; }
    if (destroyed || page !== document.querySelector(SELECTOR)) return;
    const key = JSON.stringify([settings.featuredItemCount, settings.pinnedItemIds, settings.intervalSeconds]);
    const periodic = settings.lineupRefreshMinutes > 0 && lineupAt > 0 && Date.now() - lineupAt >= settings.lineupRefreshMinutes * 60000;
    const rotating = periodic || (lineupRevision !== null && settings.rotationRevision !== lineupRevision);
    const needsLineup = !lineup.length || rotating || key !== lineupKey;
    if (currentFeature?.isConnected && !needsLineup) return;
    if (loading || (currentFeature?.isConnected && !currentFeature.__ngIdle())) return;
    if (!page.querySelector('.card')) return;
    loading = true;
    const turn = ++request;
    try {
      const items = needsLineup ? await loadItems(api, rotating, turn) : lineup;
      if (destroyed || !themeReady() || api.getCurrentUserId() !== owner || turn !== request || page !== document.querySelector(SELECTOR) || !visible(page) || !items.length || (currentFeature?.isConnected && !currentFeature.__ngIdle())) return;
      removeFeature();
      lineup = items; lineupKey = key; lineupRevision = settings.rotationRevision;
      if (needsLineup) lineupAt = Date.now();
      currentFeature = createFeature(page, api, items); currentPage = page;
    } catch (error) {
      if (error?.name !== 'AbortError') console.warn('[NoirGlass] Featured titles unavailable:', error?.message || error);
    } finally { loading = false; }
  }

  function schedule() {
    if (destroyed || scheduled) return;
    scheduled = true;
    scheduleTimer = setTimeout(() => {
      scheduleTimer = null;
      scheduled = false;
      if (!destroyed) { syncIdentity(); syncDashboard(); sync(); syncDetail(); syncNavigation(); syncPublicBranding(); syncLoginBranding(); }
    }, 150);
  }
  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  addEventListener('hashchange', schedule);
  addEventListener('popstate', schedule);
  addEventListener('storage', schedule);
  document.addEventListener('change', schedule, true);
  window.__NoirGlassCompanion = {
    destroy() {
      destroyed = true;
      request += 1;
      if (scheduleTimer) clearTimeout(scheduleTimer);
      scheduleTimer = null;
      clearTimeout(preferencesTimer);
      clearNavigation();
      clearLoginBranding(); publicBrandingRequest++;
      document.documentElement.classList.remove("ng-hide-branding");
      observer.disconnect();
      removeEventListener('hashchange', schedule);
      removeEventListener('popstate', schedule);
      removeEventListener('storage', schedule);
      document.removeEventListener('change', schedule, true);
      removeFeature();
      clearDetailBadges();
      clearDashboard();
      delete window.__NoirGlassCompanion;
    }
  };
  function monitorPreferences() {
    preferencesTimer = setTimeout(async () => {
      if (destroyed) return;
      const api = client();
      if (!document.hidden && api?.getCurrentUserId() && themeReady() && document.querySelector("#indexPage:not(.hide)")) await loadSettings(api, true);
      if (!document.hidden) schedule();
      if (!destroyed) monitorPreferences();
    }, 60000);
  }
  monitorPreferences();
  schedule();
})();
