/* Console → Staff (list) and the staff record.

   Simplifications against the previous build:
     - NO statbar, deliberately. The old screen sat a four-tile stats band
       directly under the header for a list of six rows, and every tile just
       restated something the table already says ("6 people", "3 on shift",
       "1 pending invitation"). Six rows do not need a summary of themselves,
       and they do not need tabs or filter chips either — search alone finds
       anyone on a team this size.
     - Sabrina's status was a pill whose only content was an em dash, which
       read as a broken pill beside its siblings. It is now plain muted text.
     - The separate "Invite a staff member" form screen is gone. It asked for
       eleven fields — nine of which only ever have one sensible answer for a
       six-person studio — so the header action sends the invitation directly
       and says so.
     - The record's three header buttons are two; "Revoke access" moved into
       the Access card, where the consequence is spelled out next to it.
     - The old drawer hard-coded the same assigned-class list onto every
       person, including the front desk and the owner, who teach nothing.
       The record now reads the timetable from Grove.data.CLASSES. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  /* The data carries the tone on each row; this is the only place it is read. */
  var PILL_KIND = { ok: 'ok', neutral: null, warn: 'warn' };

  function statusCell(s) {
    if (s.status === '—') return '<span class="mute">—</span>';
    return ui.pill(s.status, PILL_KIND[s.kind]);
  }

  /* ---- list ------------------------------------------------------------- */

  Grove.screen('staff', {
    surface: 'console',
    eyebrow: 'who teaches what',
    title: 'Staff',
    sub: 'The team, their assignments and their hours.',
    actions: [
      { label: 'Export timesheet', msg: 'Timesheet exported' },
      { label: 'Invite a teacher', kind: 'primary', msg: 'Invitation sent' }
    ],

    body: function () {
      var q = Grove.query('staff');

      var rows = D.STAFF.filter(function (s) {
        return Grove.match(q, s.name, s.role, s.status, s.rate);
      });

      var table = ui.table(
        [
          'Name',
          'Role',
          { label: 'Classes', align: 'right' },
          { label: 'Hours this week', align: 'right' },
          'Rate',
          { label: 'Status', shrink: true }
        ],
        rows.map(function (s) {
          return {
            to: 'staffRecord', id: s.id,
            cells: [
              ui.two(s.name),
              ui.mute(s.role),
              String(s.classes),
              esc(s.hrs),
              ui.mute(s.rate),
              statusCell(s)
            ]
          };
        }),
        { emptyTitle: 'Nobody matches', emptyText: 'Clear the search to see the whole team.' }
      );

      return ui.toolbar({
        search: { key: 'staff', placeholder: 'Search staff…' },
        count: rows.length + ' of ' + D.STAFF.length + ' people'
      }) + ui.card({ flush: true }, table);
    }
  });

  /* ---- staff record -------------------------------------------------------- */

  Grove.screen('staffRecord', {
    surface: 'console',
    crumbs: [{ label: 'Staff', to: 'staff' }],
    crumbTitle: 'Staff record',
    title: function (ctx) { return person(ctx).name; },
    sub: function (ctx) {
      var s = person(ctx);
      return s.rate === '—' ? s.role : s.role + ' · ' + s.rate;
    },
    actions: [
      { label: 'Open timesheet', msg: 'Prototype — no timesheet in this build' },
      { label: 'Assign a class', kind: 'primary', to: 'classes' }
    ],

    body: function (ctx) {
      var s = person(ctx);
      var mine = D.CLASSES.filter(function (c) { return c.staff === s.name; });

      var who = ui.card({ title: 'The person' }, ui.kv([
        ['Role', esc(s.role)],
        { k: 'Rate', v: esc(s.rate), tone: s.rate === '—' ? 'mute' : null },
        { k: 'Status', v: statusCell(s) },
        ['Sessions a week', String(s.classes)]
      ]));

      var timetable = ui.card({
        title: 'Classes this week',
        note: 'An instructor only sees the classes assigned here — their Today, roster, attendance, students and lesson plans are all filtered to this list.'
      }, mine.length
        ? ui.kv(mine.map(function (c) {
            return {
              k: c.day + ' ' + c.time,
              v: ui.dot(D.program(c.prog).color) + ' ' + esc(D.program(c.prog).short) + ' · ' + esc(c.room)
            };
          }))
        : ui.empty('No classes assigned', 'Nothing on the timetable for them this week.')
      );

      var time = ui.card({ title: 'Time' }, ui.kv([
        { k: 'Hours this week', v: s.hrs === '—' ? 'Not tracked' : esc(s.hrs) + ' hours', tone: s.hrs === '—' ? 'mute' : null },
        { k: 'On the clock', v: s.status === '—' ? 'Not clocked' : esc(s.status), tone: s.status === '—' ? 'mute' : null }
      ]));

      var access = ui.card({ title: 'Access' }, h`
        <div class="spread">
          <p class="hint">Revoking takes their sign-in away straight away. Their hours, lesson plans and attendance history stay on file.</p>
          ${raw(ui.btn({ label: 'Revoke access', kind: 'danger', msg: 'Prototype — nothing was revoked' }))}
        </div>
      `);

      return ui.grid(3, [who, timetable, time]) +
        '<div class="section">' + access + '</div>';
    }
  });

  function person(ctx) {
    var id = ctx.params.id;
    return D.STAFF.filter(function (p) { return p.id === id; })[0] || D.STAFF[0];
  }
})();
