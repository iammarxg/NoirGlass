/* NoirGlass companion | MIT. Loaded by the NoirGlass Jellyfin Web plugin.
   All metadata requests use Jellyfin's authenticated client in memory. */
(() => {
  'use strict';
  window.__NoirGlassCompanion?.destroy?.();
  const MAX_FEATURED = 5;
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

  const themeReady = () => getComputedStyle(document.documentElement).getPropertyValue('--ng-companion-contract').trim() === '1';
  async function loadSettings(api) {
    if (pluginSettings) return pluginSettings;
    if (settingsLoading) return settingsLoading;
    if (Date.now() < settingsRetryAfter || typeof api.getJSON !== 'function' || typeof api.getUrl !== 'function') return null;
    settingsLoading = api.getJSON(api.getUrl('NoirGlass/Settings'))
      .then(value => {
        pluginSettings = {
          enabled: value?.enabled === true,
          pinnedItemIds: Array.isArray(value?.pinnedItemIds) ? value.pinnedItemIds : [],
          intervalSeconds: Number.isInteger(value?.intervalSeconds) && (value.intervalSeconds === 0 || (value.intervalSeconds >= 5 && value.intervalSeconds <= 60))
            ? value.intervalSeconds : 15
        };
        schedule();
        return pluginSettings;
      })
      .catch(() => {
        settingsRetryAfter = Date.now() + 10000;
        return null;
      })
      .finally(() => { settingsLoading = null; });
    return settingsLoading;
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
    return safeImage(api.getImageUrl(id, { type, index: 0, tag, maxWidth: 1920 }));
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
    const source = sourceId
      ? item.MediaSources?.find(candidate => candidate.Id === sourceId)
      : item.MediaSources?.[0];
    const streams = source?.MediaStreams || [];
    const selected = (selector, type) => {
      const value = form.querySelector(selector)?.value;
      if (value == null || value === '') return null;
      const index = Number(value);
      return streams.find(stream => stream.Type === type && stream.Index === index);
    };
    const video = selected('.selectVideo', 'Video');
    const audio = selected('.selectAudio', 'Audio');
    const key = [item.Id, source?.Id, video?.Index, audio?.Index].join(':');
    const videoFormats = [];
    if (Number(video?.Width) >= 3800 && Number(video?.Height) >= 1600) videoFormats.push(['4k', '4K']);
    const range = `${video?.VideoRangeType || ''} ${video?.VideoRange || ''} ${video?.VideoDoViTitle || ''}`;
    if (/dovi|dolby vision/i.test(range) || Number(video?.DvProfile) > 0) videoFormats.push(['dv', 'Dolby Vision']);
    else if (/hdr|hlg/i.test(range)) videoFormats.push(['hdr', 'HDR']);
    const audioFormats = [];
    const audioInfo = `${audio?.Codec || ''} ${audio?.Profile || ''} ${audio?.Title || ''} ${audio?.DisplayTitle || ''}`;
    if (/atmos|\bjoc\b/i.test(audioInfo)) audioFormats.push(['da', 'Dolby Atmos']);
    else if (/\beac3\b|\bec-3\b|dolby digital\s*\+/i.test(audioInfo)) audioFormats.push(['ddp', 'Dolby Digital+']);
    const groups = form.querySelectorAll('.ng-format-badges');
    const expected = Number(videoFormats.length > 0) + Number(audioFormats.length > 0);
    if (form.dataset.ngFormatsKey === key && groups.length === expected) return;
    groups.forEach(node => node.remove());
    for (const [container, formats] of [
      [form.querySelector('.selectVideoContainer:not(.hide)'), videoFormats],
      [form.querySelector('.selectAudioContainer:not(.hide)'), audioFormats]
    ]) {
      if (!container || !formats.length) continue;
      const group = make('div', 'ng-format-badges');
      group.dataset.ngKey = key;
      group.setAttribute('aria-label', 'Available source formats');
      for (const [format, label] of formats) {
        const badge = make('span', 'ng-format-badge', label);
        badge.dataset.format = format;
        badge.title = `${label} in the source file; playback quality depends on the client`;
        group.append(badge);
      }
      container.append(group);
    }
    form.dataset.ngFormatsKey = key;
  }
  async function syncDetail() {
    if (destroyed) return;
    if (!themeReady()) { clearDetailBadges(); return; }
    const initialApi = client();
    if (!initialApi || !initialApi.getCurrentUserId() || !(await loadSettings(initialApi))?.enabled) return;
    const page = document.querySelector('#itemDetailPage:not(.hide)');
    const form = page?.querySelector('.trackSelections');
    const id = new URLSearchParams(location.hash.split('?')[1] || '').get('id');
    if (!page || !visible(page) || !form || !/^[a-f0-9]{32}$/i.test(id || '')) {
      if (detailId || document.querySelector('#itemDetailPage .ng-format-badges')) clearDetailBadges();
      return;
    }
    const api = client();
    if (!api || !api.getCurrentUserId() || typeof api.getItem !== 'function') return;
    if (detailId !== id) {
      clearDetailBadges();
      detailId = id;
    }
    if (detailItem) { formatBadges(form, detailItem); return; }
    if (detailLoading === id || detailAttempted === id) return;
    detailLoading = detailAttempted = id;
    const turn = ++detailRequest;
    try {
      const item = await api.getItem(api.getCurrentUserId(), id);
      if (turn !== detailRequest || detailId !== id || !form.isConnected ||
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

  async function loadItems(api) {
    const userId = api.getCurrentUserId();
    if (!userId) return [];
    const response = await api.getItems(userId, {
      Recursive: true,
      IncludeItemTypes: 'Movie,Series',
      SortBy: 'DateCreated',
      SortOrder: 'Descending',
      Limit: 60,
      Fields: 'Overview,Genres,ProductionYear,RunTimeTicks,BackdropImageTags,ImageTags'
    });
    const recent = Array.isArray(response) ? response : response?.Items || [];
    const selected = [];
    const seen = new Set();
    async function add(item) {
      if (!canFeature(api, item) || seen.has(item.Id)) return;
      selected.push(item);
      seen.add(item.Id);
    }
    for (const id of pluginSettings?.pinnedItemIds || []) {
      if (selected.length === MAX_FEATURED) break;
      if (typeof id !== 'string' || !/^[a-f0-9]{32}$/i.test(id)) continue;
      let item = recent.find(candidate => candidate.Id === id);
      if (!item && typeof api.getItem === 'function') {
        try { item = await api.getItem(userId, id); } catch { /* inaccessible item */ }
      }
      await add(item);
    }
    for (const item of recent) {
      if (selected.length === MAX_FEATURED) break;
      await add(item);
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
    const pause = make('button', 'ng-feature__pause', 'Pause');
    const status = make('span', 'ng-feature__status');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    previous.type = next.type = pause.type = 'button';
    previous.setAttribute('aria-label', 'Previous featured title');
    next.setAttribute('aria-label', 'Next featured title');
    pause.setAttribute('aria-label', 'Pause featured titles');
    pause.setAttribute('aria-pressed', 'false');
    pause.dataset.state = 'playing';

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
    const slides = items.map(makeSlide);
    let active = 0;
    let activeSlide = slides[0];
    let transitionCleanup = null;
    let timer = null;
    let disposed = false;
    let manuallyPaused = false;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const hoverCapable = matchMedia('(hover: hover)');
    const interval = pluginSettings?.intervalSeconds ?? 15;
    const dots = items.map((item, index) => {
      const dot = make('button', 'ng-feature__dot');
      dot.type = 'button';
      dot.setAttribute('aria-label', `Show featured title ${index + 1}: ${item.Name || 'Untitled'}`);
      dot.addEventListener('click', () => show(index, true));
      return dot;
    });
    function updateDots() {
      dots.forEach((dot, index) => dot.setAttribute('aria-current', String(index === active)));
    }
    function canAutoplay() {
      const bounds = root.getBoundingClientRect();
      const visibleHeight = Math.min(bounds.bottom, innerHeight) - Math.max(bounds.top, 0);
      return !disposed && root.isConnected && !transitionCleanup && interval > 0 && items.length > 1 &&
        !manuallyPaused && !reducedMotion.matches && !document.hidden &&
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
      const incoming = slides[target];
      const direction = index === active - 1 || (index >= 0 && target === active - 1) ? -1 : 1;
      if (outgoing.contains(document.activeElement)) dots[target].focus({ preventScroll: true });
      active = target;
      activeSlide = incoming;
      updateDots();
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
        incoming.style.transform = 'translate3d(0, 0, 0)';
        incoming.style.transition = '';
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
        outgoing.style.transform = '';
        incoming.style.transform = 'translate3d(0, 0, 0)';
        transitionCleanup = null;
        scheduleAutoplay();
      };
      const onEnd = event => { if (event.target === incoming && event.propertyName === 'transform') finish(); };
      transitionCleanup = finish;
      incoming.addEventListener('transitionend', onEnd);
      fallback = setTimeout(finish, duration + 100);
    }
    previous.addEventListener('click', () => show(active - 1, true));
    next.addEventListener('click', () => show(active + 1, true));
    pause.hidden = interval === 0 || items.length < 2;
    pause.addEventListener('click', () => {
      manuallyPaused = !manuallyPaused;
      pause.textContent = manuallyPaused ? 'Resume' : 'Pause';
      pause.setAttribute('aria-label', manuallyPaused ? 'Resume featured titles' : 'Pause featured titles');
      pause.setAttribute('aria-pressed', String(manuallyPaused));
      pause.dataset.state = manuallyPaused ? 'paused' : 'playing';
      scheduleAutoplay();
    });
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
    document.addEventListener('visibilitychange', scheduleAutoplay);
    window.addEventListener('scroll', scheduleAutoplay, { passive: true });
    reducedMotion.addEventListener('change', scheduleAutoplay);
    const intersection = typeof IntersectionObserver === 'function'
      ? new IntersectionObserver(scheduleAutoplay, { threshold: [0, 0.15] })
      : null;
    pager.append(previous, ...dots, next, pause);
    activeSlide.inert = false;
    activeSlide.setAttribute('aria-hidden', 'false');
    track.append(activeSlide);
    root.append(track, pager, status);
    updateDots();
    page.insertBefore(root, page.firstChild);
    intersection?.observe(root);
    scheduleAutoplay();
    root.__ngCleanup = () => {
      disposed = true;
      if (timer) clearTimeout(timer);
      timer = null;
      finishTransition();
      intersection?.disconnect();
      document.removeEventListener('visibilitychange', scheduleAutoplay);
      window.removeEventListener('scroll', scheduleAutoplay);
      reducedMotion.removeEventListener('change', scheduleAutoplay);
    };
    return root;
  }

  async function sync() {
    if (destroyed) return;
    if (!themeReady()) { removeFeature(); return; }
    const page = document.querySelector(SELECTOR);
    if (!page || !visible(page)) {
      request += 1;
      removeFeature();
      return;
    }
    if (page === currentPage && currentFeature?.isConnected) return;
    if (loading || !page.querySelector('.card')) return;
    const api = client();
    if (!api || !api.getCurrentUserId()) return;
    if (!(await loadSettings(api))?.enabled) { removeFeature(); return; }
    if (destroyed || loading || page !== document.querySelector(SELECTOR) || !visible(page)) return;
    loading = true;
    const turn = ++request;
    try {
      const candidates = await loadItems(api);
      const loaded = await Promise.all(candidates.map(item => imageLoads(art(api, item, 'Backdrop'))));
      const items = candidates.filter((item, index) => loaded[index]);
      if (destroyed || turn !== request || page !== document.querySelector(SELECTOR) || !visible(page) || !items.length) return;
      removeFeature();
      currentFeature = createFeature(page, api, items);
      currentPage = page;
    } catch (error) {
      // A failed or unsupported API call must leave Jellyfin's native home intact.
      console.warn('[NoirGlass] Featured titles unavailable:', error?.message || error);
    } finally { loading = false; }
  }
  function schedule() {
    if (destroyed || scheduled) return;
    scheduled = true;
    scheduleTimer = setTimeout(() => {
      scheduleTimer = null;
      scheduled = false;
      if (!destroyed) { sync(); syncDetail(); }
    }, 150);
  }
  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  addEventListener('hashchange', schedule);
  addEventListener('popstate', schedule);
  document.addEventListener('change', schedule, true);
  window.__NoirGlassCompanion = {
    destroy() {
      destroyed = true;
      request += 1;
      if (scheduleTimer) clearTimeout(scheduleTimer);
      scheduleTimer = null;
      observer.disconnect();
      removeEventListener('hashchange', schedule);
      removeEventListener('popstate', schedule);
      document.removeEventListener('change', schedule, true);
      removeFeature();
      clearDetailBadges();
      delete window.__NoirGlassCompanion;
    }
  };
  schedule();
})();
