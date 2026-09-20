/* ==========================================================================
   Grove Platform — core runtime

   A deliberately small click-through engine. No build step, no framework, no
   fetch — so the prototype opens by double-clicking index.html and also works
   unchanged on GitHub Pages.

   The important idea: a screen NEVER renders its own page chrome. It declares
   `crumbs`, `eyebrow`, `title`, `sub` and `actions` as data, and returns only
   its body. The shell draws the container, the breadcrumbs and the header for
   every screen identically. That is what keeps forty screens looking like one
   product.
   ========================================================================== */

(function () {
  'use strict';

  var Grove = (window.Grove = window.Grove || {});

  /* --- escaping ---------------------------------------------------------- */

  var ENT = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  function esc(v) {
    if (v === null || v === undefined) return '';
    return String(v).replace(/[&<>"']/g, function (c) { return ENT[c]; });
  }
  Grove.esc = esc;

  /* Tagged template that escapes interpolations by default. Wrap a value in
     Grove.raw() to opt out (used when composing nested component output). */
  function html(strings) {
    var out = strings[0];
    for (var i = 1; i < arguments.length; i++) {
      out += render(arguments[i]) + strings[i];
    }
    return out;
  }
  function render(v) {
    if (v === null || v === undefined || v === false) return '';
    if (Array.isArray(v)) return v.map(render).join('');
    if (v && v.__raw) return v.value;
    return esc(v);
  }
  Grove.html = html;
  Grove.raw = function (value) { return { __raw: true, value: value == null ? '' : String(value) }; };

  /* --- icons -------------------------------------------------------------- */

  var ICONS = {
    search: '<circle cx="7" cy="7" r="5.2"/><path d="m11 11 3.2 3.2"/>',
    check: '<path d="M2.5 6.2 5 8.7l4.5-5"/>',
    chevron: '<path d="m4 2.5 4 4-4 4"/>',
    back: '<path d="m7 2.5-4 4 4 4"/>',
    plus: '<path d="M7 2.5v9M2.5 7h9"/>',
    alert: '<path d="M7 4v3.6M7 10.2v.1"/><circle cx="7" cy="7" r="5.6"/>',
    send: '<path d="M7 11.5v-9M3.2 6.3 7 2.5l3.8 3.8"/>'
  };

  Grove.icon = function (name, cls) {
    var body = ICONS[name];
    if (!body) return '';
    return '<svg class="' + esc(cls || '') + '" viewBox="0 0 14 14" width="14" height="14" ' +
      'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" ' +
      'stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
  };

  /* --- registry ----------------------------------------------------------- */

  var screens = {};

  /**
   * Register a screen.
   * @param {string} key
   * @param {{
   *   surface: 'console'|'family'|'studio'|'registration',
   *   keepSurface?: boolean,    // render inside whatever portal you came from
   *   title: string,            // page title (rendered uppercase)
   *   crumbs?: Array,           // trail after the portal root: strings, or {label, to}
   *   eyebrow?: string,         // handwritten line above the title
   *   sub?: string,             // one-paragraph explanation under the title
   *   actions?: Array,          // header buttons: {label, to?, onClick?, kind?}
   *   wide?: boolean,           // opt out of the reading-width cap
   *   body: function(ctx): string
   * }} def
   */
  Grove.screen = function (key, def) {
    def.key = key;
    screens[key] = def;
  };
  Grove.getScreen = function (key) { return screens[key]; };
  Grove.allScreens = function () { return Object.keys(screens); };

  /* --- state -------------------------------------------------------------- */

  var state = {
    roleId: 'admin',
    surface: 'console',
    screen: 'dashboard',
    params: {},
    viewport: 'desktop',
    tabs: {},      // per-screen selected tab
    queries: {},   // per-screen search text
    filters: {},   // per-screen filter chip
    toggles: {},   // switch state by id
    toast: ''
  };
  Grove.state = state;

  var toastTimer = null;

  Grove.set = function (patch) {
    Object.keys(patch).forEach(function (k) { state[k] = patch[k]; });
    Grove.draw();
  };

  Grove.go = function (screen, params) {
    var def = screens[screen];
    if (!def) { Grove.toast('No screen "' + screen + '" yet'); return; }
    state.screen = screen;
    state.params = params || {};
    /* The booking flow belongs to whichever portal you entered it from: a
       parent booking a second child stays inside the family portal, rail and
       breadcrumbs intact, while a visitor arriving from the public
       Registration tab stays there. Screens marked keepSurface therefore
       adopt the current surface rather than forcing their own. */
    if (!def.keepSurface || !Grove.nav.surface(state.surface)) state.surface = def.surface;
    var sc = document.querySelector('.scroll');
    if (sc) sc.scrollTop = 0;
    Grove.draw();
  };

  Grove.goSurface = function (surface) {
    state.surface = surface;
    state.screen = Grove.nav.homeFor(surface);
    state.params = {};
    Grove.draw();
  };

  Grove.toast = function (msg) {
    state.toast = msg;
    Grove.draw();
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { state.toast = ''; Grove.draw(); }, 2400);
  };

  Grove.setTab = function (key, value) { state.tabs[key] = value; Grove.draw(); };
  Grove.tab = function (key, fallback) {
    return state.tabs[key] === undefined ? fallback : state.tabs[key];
  };
  Grove.setQuery = function (key, value) { state.queries[key] = value; Grove.draw(); };
  Grove.query = function (key) { return state.queries[key] || ''; };
  Grove.setFilter = function (key, value) { state.filters[key] = value; Grove.draw(); };
  Grove.filter = function (key, fallback) {
    return state.filters[key] === undefined ? fallback : state.filters[key];
  };
  Grove.toggle = function (id, fallback) {
    return state.toggles[id] === undefined ? !!fallback : state.toggles[id];
  };
  Grove.flip = function (id, fallback) {
    state.toggles[id] = !Grove.toggle(id, fallback);
    Grove.draw();
  };

  Grove.role = function () {
    return Grove.data.ROLES.filter(function (r) { return r.id === state.roleId; })[0] || Grove.data.ROLES[0];
  };

  Grove.setRole = function (id) {
    var role = Grove.data.ROLES.filter(function (r) { return r.id === id; })[0];
    if (!role) return;
    state.roleId = id;
    if (role.surfaces.indexOf(state.surface) === -1) {
      state.surface = role.surfaces[0];
    }
    state.screen = Grove.nav.homeFor(state.surface);
    state.params = {};
    Grove.draw();
  };

  Grove.setViewport = function (vp) { state.viewport = vp; Grove.draw(); };

  /* Whose view the current portal shows. */
  var PERSONA = { console: 'admin', studio: 'teacher', family: 'parent' };
  Grove.persona = function (surface) {
    var id = PERSONA[surface || state.surface];
    return Grove.data.ROLES.filter(function (r) { return r.id === id; })[0] || Grove.role();
  };

  /* Which clauses a programme currently carries. The dataset holds the default
     for each programme type; the owner attaches or detaches on the programme
     itself, and both the builder and Settings read the result here so they
     cannot report different numbers. */
  Grove.policyKey = function (programId, name) {
    return 'pol-' + programId + '-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  };
  Grove.policyOn = function (programId, name) {
    var def = Grove.data.policiesFor(programId).indexOf(name) !== -1;
    return Grove.toggle(Grove.policyKey(programId, name), def);
  };
  Grove.policiesFor = function (programId) {
    return Grove.data.POLICY_ALL.filter(function (name) {
      return Grove.policyOn(programId, name);
    });
  };

  /* --- text search helper -------------------------------------------------- */

  Grove.match = function (q) {
    if (!q) return true;
    var hay = Array.prototype.slice.call(arguments, 1).join(' ').toLowerCase();
    return hay.indexOf(String(q).toLowerCase()) !== -1;
  };

  Grove.money = function (n, opts) {
    var o = opts || {};
    var sign = n < 0 ? '−' : '';
    var abs = Math.abs(n);
    var s = abs.toLocaleString('en-US', {
      minimumFractionDigits: o.cents === false ? 0 : 2,
      maximumFractionDigits: o.cents === false ? 0 : 2
    });
    return sign + '$' + s;
  };

  /* --- delegated events ----------------------------------------------------
     Screens emit plain HTML strings, so behaviour is wired by data-attribute
     rather than by attaching listeners to nodes that are about to be replaced. */

  var actions = {};
  Grove.on = function (name, fn) { actions[name] = fn; };

  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-act]');
    if (!el) return;
    var name = el.getAttribute('data-act');
    var fn = actions[name];
    if (!fn) return;
    ev.preventDefault();
    fn(el.dataset, el, ev);
  });

  document.addEventListener('input', function (ev) {
    var el = ev.target.closest('[data-search]');
    if (!el) return;
    var key = el.getAttribute('data-search');
    state.queries[key] = el.value;
    var focusKey = key;
    Grove.draw();
    var next = document.querySelector('[data-search="' + focusKey + '"]');
    if (next) { next.focus(); next.setSelectionRange(next.value.length, next.value.length); }
  });

  document.addEventListener('change', function (ev) {
    var el = ev.target.closest('[data-role-select]');
    if (el) { Grove.setRole(el.value); return; }
  });

  /* --- built-in actions ----------------------------------------------------- */

  Grove.on('go', function (d) { Grove.go(d.to, d.id ? { id: d.id } : {}); });
  Grove.on('surface', function (d) { Grove.goSurface(d.surface); });
  Grove.on('viewport', function (d) { Grove.setViewport(d.vp); });
  Grove.on('tab', function (d) { Grove.setTab(d.tabKey, d.tabValue); });
  Grove.on('filter', function (d) { Grove.setFilter(d.filterKey, d.filterValue); });
  Grove.on('flip', function (d) { Grove.flip(d.id, d.on === 'true'); });
  Grove.on('toast', function (d) { Grove.toast(d.msg || 'Saved'); });

  /* --- draw ----------------------------------------------------------------- */

  Grove.draw = function () {
    var root = document.getElementById('app');
    if (!root) return;
    var def = screens[state.screen];
    if (!def) {
      root.innerHTML = '<div class="empty">Unknown screen: ' + esc(state.screen) + '</div>';
      return;
    }
    root.setAttribute('data-viewport', state.viewport);
    root.setAttribute('data-surface', state.surface);
    root.innerHTML = Grove.shell(def);

    /* A conversation opens on its newest message, the way every chat app does.
       The pane is the only scrolling region on a chat screen, so this is the
       one place scroll position has to be set by hand. */
    var chat = root.querySelector('.chat__body');
    if (chat) chat.scrollTop = chat.scrollHeight;
  };

  document.addEventListener('DOMContentLoaded', function () {
    Grove.setRole('admin');
  });
})();
