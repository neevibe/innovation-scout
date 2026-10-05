// <scout-daily-feed> / <scout-daily-date> — render the Freshness Agent's live
// edition of The Scout Daily from /api/daily. Shadow DOM keeps the console's
// React tree from ever reconciling over the injected content.
(function () {
  if (window.customElements && customElements.get('scout-daily-feed')) return;

  let edition = null;
  let inflight = null;
  const listeners = new Set();
  function load() {
    if (edition) return Promise.resolve(edition);
    if (inflight) return inflight;
    return (inflight = fetch('/api/daily')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        edition = d;
        listeners.forEach((fn) => fn(d));
        return d;
      })
      .catch(() => null));
  }

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeUrl = (u) => (/^(https?:)?\/\//.test(u || '') || /^\/[^/]/.test(u || '') ? u : '#');
  const MONO = "font-family:'JetBrains Mono',monospace;";
  const SERIF = "font-family:'Instrument Serif',serif;font-weight:400;";
  const label = (t, c) => '<div style="' + MONO + 'font-size:10px;letter-spacing:.28em;color:' + (c || '#6E7A8A') + ';border-bottom:1px solid rgba(255,255,255,.14);padding-bottom:8px;">' + t + '</div>';

  function img(i, h) {
    if (!i) return '';
    return '<figure style="margin:0 0 18px;">' +
      '<div style="height:' + h + 'px;background:#0B0F16 center/cover no-repeat;overflow:hidden;"><img src="' + esc(safeUrl(i.url)) + '" alt="" referrerpolicy="no-referrer" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.parentNode.parentNode.style.display=\'none\'"></div>' +
      '<figcaption style="' + MONO + 'font-size:8.5px;letter-spacing:.16em;color:#5C6675;margin-top:6px;">IMAGE · <a href="' + esc(safeUrl(i.sourceUrl)) + '" target="_blank" rel="noopener" style="color:#5C6675;">' + esc(String(i.credit).toUpperCase()) + '</a></figcaption></figure>';
  }

  function item(it) {
    return '<a href="' + esc(safeUrl(it.url)) + '" target="_blank" rel="noopener" style="display:block;text-decoration:none;color:#B4BDC8;">' +
      '<span style="color:#F4F0E8;">' + esc(it.title) + '</span>' +
      '<span style="display:block;' + MONO + 'font-size:9px;letter-spacing:.14em;color:#5C6675;margin-top:4px;">' + esc(String(it.publisher).toUpperCase()) + ' · ' + esc(it.age) + ' · ' + esc(it.category) + '</span></a>';
  }

  function render(d) {
    if (!d || !d.topStory) return '';
    const t = d.topStory;
    const mobile = window.matchMedia && matchMedia('(max-width: 900px)').matches;
    return '<div style="display:grid;grid-template-columns:' + (mobile ? 'minmax(0,1fr)' : 'minmax(0,1.7fr) minmax(0,1fr)') + ';gap:38px;margin-top:32px;font-family:\'Instrument Sans\',sans-serif;">' +
      '<article style="min-width:0;">' +
        '<div style="' + MONO + 'font-size:10px;letter-spacing:.28em;color:#F0B429;">' + esc(t.kicker) + '</div>' +
        '<h3 style="' + SERIF + 'font-size:clamp(30px,3.6vw,52px);line-height:1.04;margin:10px 0 16px;color:#F4F0E8;"><a href="' + esc(safeUrl(t.url)) + '" target="_blank" rel="noopener" style="color:inherit;text-decoration:none;">' + esc(t.headline) + '</a></h3>' +
        img(t.image, 320) +
        '<div style="columns:' + (mobile ? 1 : 2) + ';column-gap:28px;font-size:14.5px;line-height:1.75;color:#B4BDC8;">' +
          t.paragraphs.map((p) => '<p style="margin:0 0 14px;">' + esc(p) + '</p>').join('') +
        '</div>' +
        (t.related && t.related.length ? '<div style="margin-top:14px;">' + label('ALSO REPORTING') + '<div style="display:flex;flex-direction:column;gap:10px;margin-top:10px;font-size:13px;">' + t.related.map(item).join('') + '</div></div>' : '') +
      '</article>' +
      '<aside style="display:flex;flex-direction:column;gap:26px;min-width:0;overflow-wrap:anywhere;">' +
        (d.india.length ? '<div>' + label('INDIA NOW · ' + d.india.length + ' MOVEMENTS') + '<div style="display:flex;flex-direction:column;gap:12px;margin-top:12px;font-size:14px;line-height:1.5;">' + d.india.map(item).join('') + '</div></div>' : '') +
        (d.global.length ? '<div>' + label('GLOBAL NOW · ' + d.global.length + ' MOVEMENTS') + '<div style="display:flex;flex-direction:column;gap:12px;margin-top:12px;font-size:14px;line-height:1.5;">' + d.global.map(item).join('') + '</div></div>' : '') +
        '<div>' + label('CATEGORY WATCH · STORIES TODAY') + '<div style="display:flex;flex-wrap:wrap;gap:7px;margin-top:12px;">' +
          d.categoryWatch.map((c) => '<span style="' + MONO + 'font-size:10px;letter-spacing:.14em;border:1px solid rgba(255,255,255,.14);padding:6px 10px;color:#EDE9E1;">' + esc(c.category) + ' <span style="color:#F0B429;">' + c.count + '</span></span>').join('') +
        '</div></div>' +
        '<div style="border:1px solid rgba(240,180,41,.3);padding:16px 18px;">' +
          '<div style="' + MONO + 'font-size:10px;letter-spacing:.28em;color:#F0B429;">BLR OPPORTUNITIES · ' + d.opportunities.length + '</div>' +
          '<div style="display:flex;flex-direction:column;gap:14px;margin-top:12px;">' +
          d.opportunities.map((o) =>
            '<div style="display:grid;grid-template-columns:' + (o.image ? '54px ' : '') + '1fr auto;gap:12px;align-items:center;">' +
              (o.image ? '<img src="' + esc(safeUrl(o.image.url)) + '" alt="" referrerpolicy="no-referrer" loading="lazy" title="Image: ' + esc(o.image.credit) + '" style="width:54px;height:54px;object-fit:cover;background:#0B0F16;" onerror="this.style.visibility=\'hidden\'">' : '') +
              '<div><div style="' + MONO + 'font-size:11.5px;letter-spacing:.08em;color:#C6CDD7;">' + esc(o.brand.toUpperCase()) + '</div>' +
              '<div style="' + MONO + 'font-size:8.5px;letter-spacing:.14em;color:#5C6675;margin-top:3px;">' + esc(o.city.toUpperCase()) + ' · ' + (o.freshMentions ? o.freshMentions + ' FRESH MENTIONS · 30D' : 'NO FRESH COVERAGE') + '</div></div>' +
              '<span style="' + MONO + 'font-size:12px;color:#F0B429;">' + o.score + '</span>' +
            '</div>').join('') +
          '</div></div>' +
        '<div style="' + MONO + 'font-size:8.5px;letter-spacing:.16em;color:#4A5463;line-height:1.7;">COMPILED BY THE FRESHNESS AGENT · ' + esc(new Date(d.generatedAt).toUTCString().slice(5, 22).toUpperCase()) + ' UTC</div>' +
      '</aside></div>';
  }

  class ScoutDailyFeed extends HTMLElement {
    connectedCallback() {
      if (this._root) return;
      this._root = this.attachShadow({ mode: 'open' });
      this._root.innerHTML = '<div style="font-family:\'JetBrains Mono\',monospace;font-size:10px;letter-spacing:.24em;color:#6E7A8A;margin-top:32px;">COMPILING TODAY’S EDITION…</div>';
      const paint = (d) => {
        const html = render(d);
        this._root.innerHTML = html || '<div style="font-family:\'JetBrains Mono\',monospace;font-size:10px;letter-spacing:.24em;color:#FF7A45;margin-top:32px;">TODAY’S EDITION IS UNAVAILABLE — THE FRESHNESS AGENT WILL RETRY ON ITS NEXT RUN.</div>';
      };
      if (edition) paint(edition);
      else { listeners.add(paint); load(); }
    }
  }

  class ScoutDailyDate extends HTMLElement {
    connectedCallback() {
      if (this._root) return;
      this._root = this.attachShadow({ mode: 'open' });
      const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
      this._root.textContent = today;
      const paint = (d) => { if (d && d.date) this._root.textContent = d.date; };
      if (edition) paint(edition);
      else { listeners.add(paint); load(); }
    }
  }

  const KIND_COLOR = { 'NEW STORE DETECTED': '#6FE3A8', 'AIRPORT ENTRY': '#F0B429', 'MARKET EXPANSION': '#7FD4FF' };

  // "Brand movement — evidence layer": the three strongest brand-led moves in
  // today's edition. Keeps the original cards (light DOM fallback) until live
  // data arrives, then swaps in the agent's version.
  class ScoutBrandMoves extends HTMLElement {
    connectedCallback() {
      if (this._root) return;
      this._root = this.attachShadow({ mode: 'open' });
      this._root.innerHTML = '<slot></slot>';
      const paint = (d) => {
        const moves = d && d.brandMoves;
        if (!moves || !moves.length) return;
        const mobile = window.matchMedia && matchMedia('(max-width: 760px)').matches;
        this._root.innerHTML = '<div style="display:grid;grid-template-columns:' + (mobile ? 'minmax(0,1fr)' : 'repeat(' + moves.length + ',minmax(0,1fr))') + ';gap:18px;font-family:\'Instrument Sans\',sans-serif;">' +
          moves.map((m) =>
            '<a href="' + esc(safeUrl(m.url)) + '" target="_blank" rel="noopener" style="display:block;text-decoration:none;border:1px solid rgba(255,255,255,.09);background:rgba(7,10,16,.7);backdrop-filter:blur(12px);">' +
              (m.image ? '<div style="height:' + (mobile ? 140 : 190) + 'px;background:#0B0F16;overflow:hidden;"><img src="' + esc(safeUrl(m.image.url)) + '" alt="" referrerpolicy="no-referrer" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.parentNode.style.display=\'none\'"></div>' : '') +
              '<div style="padding:16px 18px 18px;">' +
                '<div style="' + MONO + 'font-size:9px;letter-spacing:.2em;color:' + (KIND_COLOR[m.kind] || '#6FE3A8') + ';">' + esc(m.kind) + ' · ' + esc(m.age) + '</div>' +
                '<div style="' + SERIF + 'font-size:26px;color:#F4F0E8;margin:6px 0 2px;">' + esc(m.brand) + '</div>' +
                '<div style="' + MONO + 'font-size:10px;letter-spacing:.16em;color:#6E7A8A;">' + esc(m.place) + ' · ' + esc(m.category) + '</div>' +
                '<p style="font-size:13px;line-height:1.6;color:#98A2B1;margin:12px 0 0;">' + esc(m.headline) + '</p>' +
                '<div style="' + MONO + 'font-size:8.5px;letter-spacing:.16em;color:#5C6675;margin-top:10px;">' + esc(String(m.publisher).toUpperCase()) + (m.image && m.image.credit !== m.publisher ? ' · IMAGE ' + esc(String(m.image.credit).toUpperCase()) : '') + '</div>' +
              '</div></a>').join('') +
          '</div>';
      };
      if (edition) paint(edition);
      else { listeners.add(paint); load(); }
    }
  }

  customElements.define('scout-brand-moves', ScoutBrandMoves);
  customElements.define('scout-daily-feed', ScoutDailyFeed);
  customElements.define('scout-daily-date', ScoutDailyDate);
})();
