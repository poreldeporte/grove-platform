/* ==========================================================================
   Grove Platform — shell

   Draws the prototype chrome, the portal rail, and — crucially — the page
   container, breadcrumb trail and page header for EVERY screen. A screen
   supplies only its body, so no screen can drift from the layout contract.
   ========================================================================== */

(function () {
  'use strict';
  var Grove = window.Grove;
  var h = Grove.html;
  var raw = Grove.raw;
  var esc = Grove.esc;
  var ui = Grove.ui;

  /* --- chrome --------------------------------------------------------------- */

  function chrome() {
    var S = Grove.state;
    var role = Grove.role();
    var tabs = ['registration', 'family', 'studio', 'console'].filter(function (id) {
      return id === 'registration' || role.surfaces.indexOf(id) !== -1;
    });

    return h`<header class="chrome">
      <span class="chrome__brand">Symplian</span>
      <span class="chrome__tag">PROTOTYPE</span>
      <nav class="segmented" aria-label="Portal">${raw(tabs.map(function (id) {
        return h`<button class="segmented__btn" type="button" aria-pressed="${id === S.surface}"
          data-act="surface" data-surface="${id}">${Grove.nav.surface(id).name}</button>`;
      }).join(''))}</nav>
      <span class="chrome__spacer"></span>
      <div class="segmented" role="group" aria-label="Viewport">${raw(
        [['desktop', 'Desktop'], ['tablet', 'Tablet'], ['phone', 'Phone']].map(function (v) {
          return h`<button class="segmented__btn" type="button" aria-pressed="${v[0] === S.viewport}"
            data-act="viewport" data-vp="${v[0]}">${v[1]}</button>`;
        }).join('')
      )}</div>
      <div class="chrome__role">
        <span class="chrome__role-label">Signed in as</span>
        <select data-role-select aria-label="Signed in as">${raw(Grove.data.ROLES.map(function (r) {
          return h`<option value="${r.id}"${raw(r.id === S.roleId ? ' selected' : '')}>${r.label}</option>`;
        }).join(''))}</select>
      </div>
    </header>`;
  }

  /* --- rail ------------------------------------------------------------------ */

  function railItem(item, current) {
    if (item.gap) return '<div class="rail__gap"></div>';
    var isCurrent = item.k === current;
    return h`<button class="rail__item" type="button"${raw(isCurrent ? ' aria-current="page"' : '')}
      data-act="go" data-to="${item.k}">
      <span class="rail__item-label">${item.l}</span>
      ${raw(item.badge ? '<span class="rail__badge' + (item.urgent ? ' rail__badge--urgent' : '') +
        '">' + esc(item.badge) + '</span>' : '')}
    </button>`;
  }

  function rail() {
    var S = Grove.state;
    var surface = Grove.nav.surface(S.surface);
    if (!surface.rail) return '';
    var role = Grove.role();
    var current = Grove.nav.currentFor(S.screen);
    var foot = Grove.nav.footItems(S.surface);

    return h`<nav class="rail" aria-label="${surface.name} navigation">
      <div class="rail__head">
        <img class="rail__logo" src="assets/logo.png" alt="The Grove Art Studio">
        <p class="rail__hand">${surface.hand}</p>
      </div>
      <div class="rail__nav">${raw(Grove.nav.items(S.surface).map(function (i) {
        return railItem(i, current);
      }).join(''))}</div>
      ${raw(foot.length ? '<div class="rail__foot">' + foot.map(function (i) {
        return railItem(i, current);
      }).join('') + '</div>' : '')}
      <div class="rail__user">
        <span class="rail__avatar">${role.init}</span>
        <span class="rail__user-text">
          <span class="rail__user-name">${role.name}</span>
          <span class="rail__user-role">${role.role}</span>
        </span>
      </div>
    </nav>`;
  }

  /* --- breadcrumbs ------------------------------------------------------------
     Always rendered. The first crumb is the portal, and it is always a link
     back to that portal's home, so every screen has a way out. */

  function crumbs(def) {
    var S = Grove.state;
    var surface = Grove.nav.surface(S.surface);
    var trail = [{ label: surface.crumbRoot, to: surface.home }];

    (def.crumbs || []).forEach(function (c) {
      trail.push(typeof c === 'string' ? { label: c } : c);
    });
    // The screen's own title closes the trail unless it already did.
    var last = trail[trail.length - 1];
    if (!def.crumbs || !def.crumbs.length || last.to) {
      trail.push({ label: def.crumbTitle || def.title });
    }

    return h`<nav class="crumbs" aria-label="Breadcrumb">${raw(trail.map(function (c, i) {
      var sep = i ? '<span class="crumbs__sep" aria-hidden="true">›</span>' : '';
      if (i === trail.length - 1 || !c.to) {
        return sep + '<span class="crumbs__current"' +
          (i === trail.length - 1 ? ' aria-current="page"' : '') + '>' + esc(c.label) + '</span>';
      }
      return sep + '<button class="crumbs__link" type="button" data-act="go" data-to="' +
        esc(c.to) + '">' + esc(c.label) + '</button>';
    }).join(''))}</nav>`;
  }

  /* --- page header ------------------------------------------------------------- */

  function pageHead(def, ctx) {
    var actions = typeof def.actions === 'function' ? def.actions(ctx) : def.actions;
    var sub = typeof def.sub === 'function' ? def.sub(ctx) : def.sub;
    var title = typeof def.title === 'function' ? def.title(ctx) : def.title;
    var eyebrow = typeof def.eyebrow === 'function' ? def.eyebrow(ctx) : def.eyebrow;

    return h`<div class="page-head">
      <div>
        ${raw(eyebrow ? '<p class="eyebrow">' + esc(eyebrow) + '</p>' : '')}
        <h1 class="page-title">${title}</h1>
        ${raw(sub ? '<p class="page-sub">' + esc(sub) + '</p>' : '')}
      </div>
      ${raw(actions && actions.length
        ? '<div class="page-actions">' + actions.map(ui.btn).join('') + '</div>'
        : '<div></div>')}
    </div>`;
  }

  /* --- shell ---------------------------------------------------------------------- */

  Grove.shell = function (def) {
    var S = Grove.state;
    var ctx = { params: S.params, state: S, role: Grove.role() };
    var body = def.body ? def.body(ctx) : '';

    return h`<div class="app">
      ${raw(chrome())}
      <div class="frame-wrap">
        <div class="frame">
          ${raw(rail())}
          <main class="scroll">
            <div class="page"${raw(def.wide ? ' style="max-width:none"' : '')}>
              ${raw(crumbs(def))}
              ${raw(pageHead(def, ctx))}
              <div class="page-body">${raw(body)}</div>
            </div>
          </main>
        </div>
      </div>
      ${raw(S.toast ? '<div class="toast" role="status">' + esc(S.toast) + '</div>' : '')}
    </div>`;
  };
})();
