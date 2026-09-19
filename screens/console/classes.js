/* Console → Classes (list + week calendar) and the class record.

   Simplifications against the previous build:
     - the separate "This week" calendar page is now the Calendar tab of this
       screen, so one header, one tab rail and one container serve both views
     - the two chip groups (eight chips on one line) are one group: programme.
       The status chips — "Has space", "Full or over", "Unassigned" — only
       restated what the Enrolled and Teacher columns already say, and the old
       programme group silently dropped Private, Birthday and Pop-Up
     - the week stepper (‹ Today ›) is gone; it never changed the grid, it only
       raised a toast
     - the record's four header actions are two. "Cancel this session" sits in
       the session card it belongs to, and the roster is on the page rather
       than a jump into the Studio portal
     - "Term", "Sessions generated" and the four-week attendance block were the
       same hardcoded numbers on every class, so they are not shown */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  var WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var WEEK_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  /* The week that contains Grove.data.today — Tuesday 28 July 2026. */
  var WEEK_DATES = ['27 Jul', '28 Jul', '29 Jul', '30 Jul', '31 Jul', '1 Aug'];
  var TODAY_DAY = 'Tue';

  /* ---- small helpers ------------------------------------------------------ */

  function prog(c) { return D.program(c.prog) || { name: c.prog, short: c.prog, color: 'var(--ink-45)' }; }

  /* '2:15–3:15pm' -> '2:15pm'; '10:00am–1:00pm' -> '10:00am'. */
  function startTime(c) {
    var parts = String(c.time).split('–');
    var a = String(parts[0] || '').toLowerCase();
    if (a.indexOf('am') !== -1 || a.indexOf('pm') !== -1) return a;
    var b = String(parts[1] || '').toLowerCase();
    return a + (b.indexOf('am') !== -1 ? 'am' : (b.indexOf('pm') !== -1 ? 'pm' : ''));
  }

  function dayTokens(c) {
    return String(c.day).split(/[^A-Za-z]+/).filter(Boolean);
  }

  /* Does this class run on that day? Handles 'Mon' and ranges like 'Mon–Fri'. */
  function runsOn(c, day) {
    var t = dayTokens(c);
    if (!t.length) return false;
    if (t.length === 1) return t[0] === day;
    var from = WEEK.indexOf(t[0]), to = WEEK.indexOf(t[t.length - 1]), i = WEEK.indexOf(day);
    if (from === -1 || to === -1) return false;
    return i >= from && i <= to;
  }

  function fillKind(c) {
    return c.en > c.cap ? 'bad' : (c.en === c.cap ? 'amber' : null);
  }

  function fill(c) {
    return h`<div class="stack stack--sm">
      <div>${raw(ui.pill(c.en + '/' + c.cap, fillKind(c)))}</div>
      ${raw(ui.meter(c.en, c.cap))}
    </div>`;
  }

  function teacher(c) {
    return c.staff === 'Unassigned'
      ? '<span class="clay strong">Unassigned</span>'
      : ui.mute(c.staff);
  }

  /* ---- Classes ------------------------------------------------------------ */

  function tabRail() {
    return {
      key: 'classes',
      items: [{ label: 'List', count: D.CLASSES.length }, { label: 'Calendar' }]
    };
  }

  function chipItems() {
    var items = ['All programs'];
    Object.keys(D.PROGRAMS).forEach(function (k) { items.push(D.PROGRAMS[k].short); });
    return items;
  }

  Grove.screen('classes', {
    surface: 'console',
    eyebrow: 'what runs, and when',
    title: 'Classes',
    sub: function () {
      return Grove.tab('classes', 'List') === 'Calendar'
        ? 'Week of 27 July 2026 · camp week 4. A session with nobody teaching it is flagged on its block.'
        : 'Every class across all six programs. A class generates dated sessions; enrolments attach to the class, attendance to the session.';
    },
    actions: [
      { label: 'Export', msg: 'CSV exported' },
      { label: 'New class', kind: 'primary', msg: 'Prototype — no form yet' }
    ],

    body: function () {
      return Grove.tab('classes', 'List') === 'Calendar' ? calendarTab() : listTab();
    }
  });

  function listTab() {
    var q = Grove.query('classes');
    var chip = Grove.filter('classes', 'All programs');

    var rows = D.CLASSES.filter(function (c) {
      var p = prog(c);
      if (!Grove.match(q, c.name, c.room, c.staff, c.day, c.time, c.band, p.name)) return false;
      if (chip !== 'All programs') return p.short === chip;
      return true;
    });

    var table = ui.table(
      ['Class', 'When', 'Room', 'Ages', 'Teacher', 'Enrolled', { label: 'Waitlist', align: 'right', shrink: true }],
      rows.map(function (c) {
        var p = prog(c);
        return {
          to: 'classRecord', id: c.id,
          cells: [
            ui.two(raw(ui.dot(p.color) + ' ' + esc(c.name)), p.name),
            ui.mute(c.day + ' · ' + c.time),
            ui.mute(c.room),
            ui.mute(c.band),
            teacher(c),
            fill(c),
            c.wl ? ui.pill(String(c.wl), 'warn') : '<span class="mute">—</span>'
          ]
        };
      }),
      {
        emptyTitle: 'No classes match those filters',
        emptyText: 'Try clearing the programme filter or the search.'
      }
    );

    return ui.toolbar({
      tabs: tabRail(),
      search: { key: 'classes', placeholder: 'Search class, room, instructor…' },
      filters: { key: 'classes', items: chipItems() },
      count: rows.length + ' of ' + D.CLASSES.length + ' classes'
    }) + ui.card({
      flush: true,
      note: 'Thursday 4:30pm is over capacity because a make-up booking landed in a full class. Rebalancing moves the make-up rather than the enrolled child.'
    }, table);
  }

  function calendarTab() {
    var total = 0;
    var days = WEEK.map(function (day, i) {
      var list = D.CLASSES.filter(function (c) { return runsOn(c, day); });
      total += list.length;

      var head = h`<span class="inline">
        ${raw(day === TODAY_DAY ? ui.pill('Today', 'ok') : '')}
        <span class="mute">${WEEK_DATES[i] + ' · ' + (list.length === 1 ? '1 session' : list.length + ' sessions')}</span>
      </span>`;

      var body = list.length
        ? ui.rows(list.map(function (c) {
            var p = prog(c);
            return {
              lead: esc(startTime(c)),
              title: ui.dot(p.color) + ' ' + esc(c.name),
              sub: esc(c.room) + ' · ' + (c.staff === 'Unassigned'
                ? '<span class="clay">Unassigned</span>'
                : esc(c.staff)),
              to: 'classRecord', id: c.id
            };
          }))
        : ui.empty('Studio closed');

      return ui.card({ title: WEEK_LONG[i], head: head, flush: true }, body);
    });

    return ui.toolbar({
      tabs: tabRail(),
      count: total + ' sessions this week'
    }) + ui.grid(3, days);
  }

  /* ---- class record -------------------------------------------------------- */

  Grove.screen('classRecord', {
    surface: 'console',
    crumbs: [{ label: 'Classes', to: 'classes' }],
    crumbTitle: 'Class',
    eyebrow: function (ctx) { return prog(cls(ctx)).name; },
    title: function (ctx) { return cls(ctx).name; },
    sub: function (ctx) {
      var c = cls(ctx);
      return c.day + ' · ' + c.time + ' · ' + c.room;
    },
    actions: [
      { label: 'Lesson plan', to: 'teaching' },
      { label: 'Assign instructor', kind: 'primary', msg: 'Class assigned · the instructor sees it now' }
    ],

    body: function (ctx) {
      var c = cls(ctx);
      var p = prog(c);
      var kids = roster(c);
      var waiting = waitlist(c);

      var flags = h`<div class="inline">
        ${raw(ui.pill(c.en + ' of ' + c.cap + ' places', fillKind(c)))}
        ${raw(ui.pill('Ages ' + c.band))}
        ${raw(c.staff === 'Unassigned'
          ? ui.pill('No instructor assigned', 'bad')
          : ui.pill(c.staff, 'ok'))}
      </div>`;

      var over = c.en > c.cap
        ? ui.notice({
            kind: 'bad',
            title: 'Over capacity by ' + (c.en - c.cap),
            text: 'A make-up booking landed here after the last enrolment. Rebalancing moves the make-up, not the enrolled child.',
            action: { label: 'Rebalance', msg: 'Prototype — nothing was moved' }
          })
        : '';

      var session = ui.card({
        title: 'The session',
        head: ui.btn({
          label: 'Cancel this session',
          kind: 'danger',
          size: 'sm',
          msg: 'Prototype — nothing was cancelled'
        })
      }, ui.kv([
        ['Programme', p.name],
        ['When', c.day + ' · ' + c.time],
        ['Room', c.room],
        ['Ages', c.band],
        { k: 'Teacher', v: c.staff, tone: c.staff === 'Unassigned' ? 'clay' : null },
        { k: 'Places', v: c.en + ' of ' + c.cap, tone: c.en > c.cap ? 'clay' : null },
        c.wl
          ? { k: 'Waitlist', v: c.wl + ' waiting' }
          : { k: 'Waitlist', v: 'Empty', tone: 'mute' }
      ]));

      var rosterCard = ui.card({
        title: 'Roster',
        head: '<span class="mute">' + kids.length + ' on file</span>',
        flush: true,
        note: 'Safety notes are shown to every teacher on this roster and on the attendance sheet.'
      }, kids.length
        ? ui.rows(kids.map(function (k) {
            return {
              title: esc(k.name),
              sub: esc('Age ' + k.age + ' · attendance ' + k.att),
              end: k.flag ? ui.pill(k.flag, 'bad') : '<span class="mute">—</span>',
              to: 'studentRecord', id: k.id
            };
          }))
        : ui.empty('No children linked yet', 'Enrolment counts come from the class; children are linked as they register.')
      );

      var waitCard = ui.card({
        title: 'Waitlist',
        head: c.wl ? ui.pill(c.wl + ' waiting', 'warn') : '<span class="mute">Empty</span>',
        flush: true,
        note: 'Nobody is turned away. A place that frees up goes to the first name on the list.'
      }, waiting.length
        ? ui.rows(waiting.map(function (w) {
            return {
              lead: '#' + w.pos,
              title: esc(w.child),
              sub: esc(w.fam + ' family · joined ' + w.joined)
            };
          }))
        : ui.empty('Nobody waiting', 'Every child who asked for this class has a place.')
      );

      return flags +
        (over ? '<div class="section">' + over + '</div>' : '') +
        '<div class="section">' + ui.grid(3, [session, rosterCard, waitCard]) + '</div>';
    }
  });

  function cls(ctx) {
    var id = ctx && ctx.params ? ctx.params.id : null;
    return D.CLASSES.filter(function (c) { return c.id === id; })[0] ||
           D.CLASSES.filter(function (c) { return c.id === 'c2'; })[0];
  }

  /* The dataset writes a child's placement as free text ("Mon 3:15pm · Studio
     2", "Camp week 4 · Clay Room", "Mon, Wed, Thu"), so the roster is matched
     on the signals those strings carry rather than on a class id. */
  function roster(c) {
    return D.STUDENTS.filter(function (s) { return onRoster(c, s); });
  }

  function onRoster(c, s) {
    var text = String(s.cls).toLowerCase();
    if (text.indexOf('waitlisted') !== -1 || text.indexOf('not yet enrolled') !== -1) return false;

    var name = String(c.name).toLowerCase();
    if (name.indexOf(String(s.name).toLowerCase()) !== -1) return true;   /* private classes */

    var roomHit = text.indexOf(String(c.room).toLowerCase()) !== -1;

    /* Camp runs Mon–Fri, so a weekday alone proves nothing: a camp roster is
       the children recorded against that week AND that room. */
    var week = weekOf(name);
    if (week) return text.indexOf(week) !== -1 && roomHit;

    var dayHit = dayTokens(c).some(function (d) { return text.indexOf(d.toLowerCase()) !== -1; });
    if (!dayHit) return false;

    /* A child recorded by days alone joins any class on one of those days in
       their own age band. */
    if (text.indexOf('·') === -1) return s.band === c.band;

    return roomHit || text.indexOf(startTime(c)) !== -1;
  }

  function weekOf(name) {
    var m = /week \d+/.exec(String(name).toLowerCase());
    return m ? m[0] : null;
  }

  /* The waitlist writes its class the same free-text way ("Wed 4:30pm · Ages
     8–11"), so it is matched on the day plus either the start time or the age
     band. Camp is matched on its week, and nobody waits on camp. */
  function waitlist(c) {
    if (weekOf(c.name)) return [];
    return D.WAITLIST.filter(function (w) {
      var text = String(w.cls).toLowerCase();
      var dayHit = dayTokens(c).some(function (d) { return text.indexOf(d.toLowerCase()) !== -1; });
      if (!dayHit) return false;
      return text.indexOf(startTime(c)) !== -1 ||
             text.indexOf('ages ' + String(c.band).toLowerCase()) !== -1;
    });
  }
})();
