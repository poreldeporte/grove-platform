/* ==========================================================================
   Grove Platform — shared components

   Screens compose from these. If a screen needs a shape that is not here,
   add it here rather than hand-rolling markup in the screen file — that is
   how the old prototype ended up with four different card paddings and three
   different container widths.
   ========================================================================== */

(function () {
  'use strict';
  var Grove = window.Grove;
  var h = Grove.html;
  var esc = Grove.esc;
  var raw = Grove.raw;

  var C = (Grove.ui = {});

  function attrs(map) {
    return Object.keys(map || {})
      .filter(function (k) { return map[k] !== undefined && map[k] !== null && map[k] !== false; })
      .map(function (k) { return ' ' + k + '="' + esc(map[k]) + '"'; })
      .join('');
  }
  C.attrs = attrs;

  /* Turn {to} / {act,...} into the data attributes the delegated handler reads. */
  function act(o) {
    if (!o) return '';
    if (o.to) return attrs({ 'data-act': 'go', 'data-to': o.to, 'data-id': o.id });
    if (o.act) {
      var m = { 'data-act': o.act };
      Object.keys(o).forEach(function (k) {
        if (k !== 'act' && k !== 'label' && k !== 'kind') m['data-' + k] = o[k];
      });
      return attrs(m);
    }
    if (o.msg) return attrs({ 'data-act': 'toast', 'data-msg': o.msg });
    return '';
  }
  C.act = act;

  /* --- card --------------------------------------------------------------- */

  /**
   * @param {{title?:string, head?:string, note?:string, foot?:string,
   *          flush?:boolean, kind?:string, span?:number}} o
   */
  C.card = function (o, body) {
    o = o || {};
    var cls = 'card' + (o.kind ? ' card--' + o.kind : '') + (o.flush ? ' card--table' : '') + (o.cls ? ' ' + o.cls : '');
    var style = o.span ? ' style="grid-column: span ' + o.span + '"' : '';
    var head = '';
    if (o.title || o.head) {
      head = h`<div class="card__head">
        <h2 class="card__title">${o.title || ''}</h2>
        ${raw(o.head || '')}
      </div>`;
    }
    return h`<section class="${raw(cls)}"${raw(style)}>
      ${raw(head)}
      <div class="card__body${raw(o.flush ? ' card__body--flush' : '')}">${raw(body || '')}</div>
      ${raw(o.note ? '<p class="card__note">' + esc(o.note) + '</p>' : '')}
      ${raw(o.foot ? '<div class="card__foot">' + o.foot + '</div>' : '')}
    </section>`;
  };

  C.grid = function (cols, cards) {
    var cls = 'grid' + (cols ? ' grid--' + cols : '');
    return h`<div class="${raw(cls)}">${raw([].concat(cards).join(''))}</div>`;
  };

  /* --- toolbar ------------------------------------------------------------
     Tabs, search, filters and count on a single row. */

  /**
   * @param {{tabs?:{key,value,items:[{label,count?}]},
   *          search?:{key,placeholder},
   *          filters?:{key,value,items:string[]},
   *          count?:string, right?:string}} o
   */
  C.toolbar = function (o) {
    o = o || {};
    var parts = [];

    if (o.tabs) {
      parts.push(C.tabs(o.tabs));
    }
    if (o.search) {
      parts.push(h`<div class="search">
        ${raw(Grove.icon('search', 'search__icon'))}
        <input class="search__input" type="search" data-search="${o.search.key}"
               value="${Grove.query(o.search.key)}"
               placeholder="${o.search.placeholder || 'Search…'}"
               aria-label="${o.search.placeholder || 'Search'}">
      </div>`);
    }
    if (o.filters) {
      var cur = Grove.filter(o.filters.key, o.filters.items[0]);
      parts.push(h`<div class="chips" role="group">${raw(o.filters.items.map(function (label) {
        return h`<button class="chip" type="button" aria-pressed="${label === cur}"
          data-act="filter" data-filter-key="${o.filters.key}" data-filter-value="${label}">${label}</button>`;
      }).join(''))}</div>`);
    }

    parts.push('<span class="toolbar__spacer"></span>');
    if (o.count) parts.push(h`<span class="toolbar__count">${o.count}</span>`);
    if (o.right) parts.push(o.right);

    return h`<div class="toolbar">${raw(parts.join(''))}</div>`;
  };

  C.tabs = function (o) {
    var cur = Grove.tab(o.key, o.value || (o.items[0] && o.items[0].label));
    return h`<div class="tabs" role="tablist">${raw(o.items.map(function (t) {
      var label = typeof t === 'string' ? t : t.label;
      var count = typeof t === 'string' ? null : t.count;
      return h`<button class="tabs__btn" role="tab" type="button" aria-selected="${label === cur}"
        data-act="tab" data-tab-key="${o.key}" data-tab-value="${label}">${label}${raw(
          count === null || count === undefined ? '' : ' <span class="tabs__count">' + esc(count) + '</span>'
        )}</button>`;
    }).join(''))}</div>`;
  };

  /* --- stats --------------------------------------------------------------- */

  /** @param {Array<{label,value,sub?,tone?}>} items */
  C.statbar = function (items) {
    return h`<div class="statbar">${raw(items.map(function (s) {
      return h`<div class="stat">
        <div class="stat__label">${s.label}</div>
        <div class="stat__value${raw(s.tone ? ' stat__value--' + s.tone : '')}">${s.value}</div>
        ${raw(s.sub ? '<div class="stat__sub">' + esc(s.sub) + '</div>' : '')}
      </div>`;
    }).join(''))}</div>`;
  };

  /* --- table --------------------------------------------------------------- */

  /**
   * @param {Array<string|{label,align?,shrink?}>} cols
   * @param {Array<{cells:string[], to?:string, id?:string, act?:string}>} rows
   */
  C.table = function (cols, rows, o) {
    o = o || {};
    var head = cols.map(function (c) {
      var label = typeof c === 'string' ? c : c.label;
      var cls = (typeof c === 'object' && c.align === 'right' ? 'num ' : '') +
                (typeof c === 'object' && c.shrink ? 'shrink' : '');
      return h`<th class="${raw(cls.trim())}" scope="col">${label}</th>`;
    }).join('');

    if (!rows.length) {
      return h`<div class="empty">
        <p class="empty__title">${o.emptyTitle || 'Nothing here yet'}</p>
        <p class="empty__text">${o.emptyText || 'Try a different search or filter.'}</p>
      </div>`;
    }

    var body = rows.map(function (r) {
      var clickable = r.to || r.act;
      return h`<tr class="${raw(clickable ? 'is-clickable' : '')}"${raw(clickable ? act(r) : '')}>${raw(
        r.cells.map(function (cell, i) {
          var c = cols[i];
          var cls = (typeof c === 'object' && c.align === 'right' ? 'num ' : '') +
                    (typeof c === 'object' && c.shrink ? 'shrink' : '');
          return '<td class="' + cls.trim() + '">' + cell + '</td>';
        }).join('')
      )}</tr>`;
    }).join('');

    return h`<div class="table-wrap"><table class="table">
      <thead><tr>${raw(head)}</tr></thead>
      <tbody>${raw(body)}</tbody>
    </table></div>`;
  };

  /* Two-line table cell: strong title over a muted sub. */
  C.two = function (title, sub) {
    return h`<div class="cell-strong">${title}</div>${raw(sub ? '<div class="cell-sub">' + esc(sub) + '</div>' : '')}`;
  };
  C.mute = function (t) { return h`<span class="cell-mute">${t}</span>`; };

  /* --- key/value ------------------------------------------------------------ */

  /** @param {Array<[string,string]|{k,v,tone?}>} rows */
  C.kv = function (rows) {
    return h`<div class="kv">${raw(rows.map(function (r) {
      var k = Array.isArray(r) ? r[0] : r.k;
      var v = Array.isArray(r) ? r[1] : r.v;
      var tone = Array.isArray(r) ? null : r.tone;
      return h`<div class="kv__row">
        <span class="kv__k">${k}</span>
        <span class="kv__v${raw(tone ? ' kv__v--' + tone : '')}">${raw(String(v))}</span>
      </div>`;
    }).join(''))}</div>`;
  };

  /* --- pills, dots ---------------------------------------------------------- */

  C.pill = function (label, kind) {
    return h`<span class="pill${raw(kind ? ' pill--' + kind : '')}">${label}</span>`;
  };
  C.dot = function (color) {
    return '<span class="dot" style="background:' + esc(color) + '"></span>';
  };
  C.meter = function (value, max) {
    var pct = Math.min(100, Math.round((value / max) * 100));
    var mod = value > max ? ' meter__fill--over' : (value === max ? ' meter__fill--full' : '');
    return '<div class="meter"><div class="meter__fill' + mod + '" style="width:' + pct + '%"></div></div>';
  };

  /* --- buttons -------------------------------------------------------------- */

  /** @param {{label, to?, act?, msg?, kind?, size?}} o */
  C.btn = function (o) {
    var cls = 'btn' + (o.kind ? ' btn--' + o.kind : '') + (o.size ? ' btn--' + o.size : '');
    return h`<button type="button" class="${raw(cls)}"${raw(act(o))}>${o.label}</button>`;
  };
  C.btns = function (list) {
    return h`<div class="btn-group">${raw(list.map(C.btn).join(''))}</div>`;
  };

  /* --- rows ------------------------------------------------------------------ */

  /** @param {Array<{lead?,title,sub?,end?,to?,act?,msg?,id?}>} items */
  C.rows = function (items) {
    return h`<div class="rows">${raw(items.map(function (r) {
      var clickable = r.to || r.act || r.msg;
      var tag = clickable ? 'button' : 'div';
      return '<' + tag + ' class="row' + (clickable ? ' row--link' : '') + '"' +
        (clickable ? ' type="button"' + act(r) : '') + '>' +
        (r.lead ? '<div class="row__lead">' + r.lead + '</div>' : '') +
        '<div class="row__main">' +
          '<div class="row__title">' + r.title + '</div>' +
          (r.sub ? '<div class="row__sub">' + r.sub + '</div>' : '') +
        '</div>' +
        (r.end ? '<div class="row__end">' + r.end + '</div>' : '') +
        '</' + tag + '>';
    }).join(''))}</div>`;
  };

  C.timechip = function (time, tone) {
    var parts = String(time).split(' ');
    return h`<div class="timechip${raw(tone ? ' timechip--' + tone : '')}">
      <div class="timechip__h">${parts[0]}</div>
      <div class="timechip__m">${parts[1] || ''}</div>
    </div>`;
  };

  /* --- notices ---------------------------------------------------------------- */

  /** @param {{title, text?, kind?, action?:{label,to?,act?,msg?}}} o */
  C.notice = function (o) {
    return h`<div class="notice${raw(o.kind ? ' notice--' + o.kind : '')}">
      <div class="notice__body">
        <p class="notice__title">${o.title}</p>
        ${raw(o.text ? '<p class="notice__text">' + esc(o.text) + '</p>' : '')}
      </div>
      ${raw(o.action ? C.btn(Object.assign({ size: 'sm' }, o.action)) : '')}
    </div>`;
  };

  /* --- forms -------------------------------------------------------------------- */

  /** @param {{label, hint?, span?, control:string}} o */
  C.field = function (o) {
    return h`<div class="field${raw(o.span ? ' field--span' : '')}">
      <label class="label">${o.label}</label>
      ${raw(o.control)}
      ${raw(o.hint ? '<p class="hint">' + esc(o.hint) + '</p>' : '')}
    </div>`;
  };
  C.fields = function (cols, list) {
    return h`<div class="fields${raw(cols ? ' fields--' + cols : '')}">${raw([].concat(list).join(''))}</div>`;
  };
  C.input = function (o) {
    o = o || {};
    return '<input class="input" type="' + esc(o.type || 'text') + '" placeholder="' +
      esc(o.placeholder || '') + '" value="' + esc(o.value || '') + '">';
  };
  C.textarea = function (o) {
    o = o || {};
    return '<textarea class="textarea" placeholder="' + esc(o.placeholder || '') + '">' +
      esc(o.value || '') + '</textarea>';
  };
  C.select = function (o) {
    return '<select class="select">' + (o.options || []).map(function (op) {
      var label = typeof op === 'string' ? op : op.label;
      var sel = (typeof op === 'object' && op.selected) || label === o.value;
      return '<option' + (sel ? ' selected' : '') + '>' + esc(label) + '</option>';
    }).join('') + '</select>';
  };
  C.dropzone = function (o) {
    return h`<div class="dropzone" role="button" tabindex="0" data-act="toast" data-msg="Prototype — no upload">
      <p class="dropzone__title">${o.title || 'Drop a photo here, or choose a file'}</p>
      ${raw(o.hint ? '<p class="dropzone__hint">' + esc(o.hint) + '</p>' : '')}
    </div>`;
  };

  /** @param {{id, title, sub?, price?, on?, group?}} */
  C.choice = function (o) {
    var on = o.on;
    return h`<button type="button" class="choice" aria-pressed="${!!on}"
      data-act="${o.act || 'flip'}" data-id="${o.id}" data-on="${!!on}">
      <span class="choice__mark">${raw(Grove.icon('check'))}</span>
      <span class="choice__body">
        <span class="choice__title">${o.title}</span>
        ${raw(o.sub ? '<span class="choice__sub">' + esc(o.sub) + '</span>' : '')}
      </span>
      ${raw(o.price ? '<span class="choice__price">' + esc(o.price) + '</span>' : '')}
    </button>`;
  };
  C.choices = function (cols, list) {
    return h`<div class="choices${raw(cols ? ' choices--' + cols : '')}">${raw([].concat(list).join(''))}</div>`;
  };

  /** @param {{id, title, sub?, on?}} o */
  C.toggleRow = function (o) {
    var on = Grove.toggle(o.id, o.on);
    return h`<div class="toggle">
      <div class="toggle__body">
        <p class="toggle__title">${o.title}</p>
        ${raw(o.sub ? '<p class="toggle__sub">' + esc(o.sub) + '</p>' : '')}
      </div>
      <button type="button" class="switch" aria-pressed="${on}" aria-label="${o.title}"
        data-act="flip" data-id="${o.id}" data-on="${!!o.on}"><span class="switch__knob"></span></button>
    </div>`;
  };

  C.formActions = function (list) {
    return h`<div class="form-actions">${raw(list.map(C.btn).join(''))}</div>`;
  };

  /* --- steps ---------------------------------------------------------------------- */

  C.steps = function (items, current) {
    return h`<div class="steps">${raw(items.map(function (label, i) {
      var state = i < current ? 'done' : (i === current ? 'current' : 'todo');
      return (i ? '<span class="step__arrow">' + Grove.icon('chevron') + '</span>' : '') +
        '<span class="step' + (state === 'done' ? ' step--done' : '') + '"' +
        (state === 'current' ? ' aria-current="step"' : '') + '>' +
        '<span class="step__num">' + (state === 'done' ? Grove.icon('check') : (i + 1)) + '</span>' +
        esc(label) + '</span>';
    }).join(''))}</div>`;
  };

  /* --- empty ------------------------------------------------------------------------ */

  C.empty = function (title, text) {
    return h`<div class="empty">
      <p class="empty__title">${title}</p>
      ${raw(text ? '<p class="empty__text">' + esc(text) + '</p>' : '')}
    </div>`;
  };
})();
