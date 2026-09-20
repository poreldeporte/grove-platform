/* Studio → My time. A teacher's own clock entries for the pay week.

   Simplified against the spec:
     - the "Week to date" card was a rollup dressed up as a list item, sitting
       in the same stack as real entries. The week's numbers now live in the
       slim stat strip and the pay card, so the list holds only real entries.
     - the per-entry drawer carried three facts: the two times, the class, and
       who logged it. The times and the classes are columns in the table and
       the logging line is the screen's own subtitle, so the drawer earns
       nothing and is gone.
     - the incomplete Thursday is one notice with the single action that
       mattered, instead of a status a teacher has to open a drawer to read.

   Numbers. Clock entries are the one thing on this screen Grove.data does not
   hold, so the five rows below are this file's own — but they are the rows the
   rest of the app is costed against. Their recorded hours sum to 22.5 and the
   classes they were worked against come to 9 sessions, which is exactly what
   STAFF['lauren'] carries and what Console → Staff prints as "Hours this week"
   and "Sessions a week". Every figure on the screen is summed from these rows;
   not one is written as a literal. Change an entry and the strip, the table
   and the pay card all move together — and they will then disagree with
   js/data.js, so change that record too.

   The period is the Wed–Tue pay week, Wed 22 Jul – Tue 28 Jul. Today is
   Tuesday 28 July, so the week ends on today's open entry. Each day is worked
   against real classes from Grove.data.CLASSES, all of them Lauren's: the
   week 4 camp every weekday, plus the after-school hours and the private
   lesson her record carries.

   Today's clock-in is held to Grove.data.ACTIVITY, which has Lauren clocking
   in at 09:58. Do not drift it: the console dashboard renders that same row,
   so a different time here makes the two screens contradict each other. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  /* Newest first. `cls` holds the class ids worked against that day. `hrs` is
     null where no clock-out was recorded, so that day counts no hours. */
  var ENTRIES = [
    { day: 'Tue 28 Jul', note: 'Today', inAt: '9:58am', outAt: 'Still clocked in', hrs: 4.2,  open: true, cls: ['c6', 'c11'] },
    { day: 'Mon 27 Jul', note: '',      inAt: '9:28am', outAt: '4:40pm',           hrs: 7.2,  cls: ['c6', 'c1', 'c2'] },
    { day: 'Fri 24 Jul', note: '',      inAt: '9:35am', outAt: '1:23pm',           hrs: 3.8,  cls: ['c6'] },
    { day: 'Thu 23 Jul', note: '',      inAt: '9:30am', outAt: 'Not recorded',     hrs: null, missing: true, cls: ['c6'] },
    { day: 'Wed 22 Jul', note: '',      inAt: '9:30am', outAt: '4:48pm',           hrs: 7.3,  cls: ['c6', 'c4'] }
  ];

  function me() {
    return D.STAFF.filter(function (s) { return s.id === 'lauren'; })[0] || D.STAFF[0];
  }

  function klass(id) {
    return D.CLASSES.filter(function (c) { return c.id === id; })[0];
  }

  function openEntry() {
    return ENTRIES.filter(function (e) { return e.open; })[0] || ENTRIES[0];
  }

  function missingEntry() {
    return ENTRIES.filter(function (e) { return e.missing; })[0];
  }

  function round1(n) { return Math.round(n * 10) / 10; }

  /* --- every figure on the screen is summed from ENTRIES ------------------ */

  function hoursLogged() {
    var total = 0;
    ENTRIES.forEach(function (e) { if (e.hrs !== null) total += e.hrs; });
    return round1(total);
  }

  function daysCounted() {
    return ENTRIES.filter(function (e) { return e.hrs !== null; }).length;
  }

  function classesTaught() {
    var n = 0;
    ENTRIES.forEach(function (e) { n += e.cls.length; });
    return n;
  }

  function hourlyRate(staff) {
    return parseFloat(String(staff.rate).replace(/[^0-9.]/g, '')) || 0;
  }

  function sessions(n) { return n === 1 ? '1 session' : n + ' sessions'; }

  /* The classes a day was worked against, named once each. */
  function classNames(e) {
    var names = [];
    e.cls.forEach(function (id) {
      var c = klass(id);
      if (c && names.indexOf(c.name) === -1) names.push(c.name);
    });
    return names.join(', ');
  }

  Grove.screen('sTime', {
    surface: 'studio',
    crumbTitle: 'My time',
    eyebrow: 'hours and cover',
    title: 'My time',
    sub: 'Clock in when you arrive, out when you leave. Every entry below came from the studio tablet and none have been edited.',
    actions: [
      { label: 'Clock out', kind: 'primary', msg: 'Clocked out · ' + openEntry().hrs.toFixed(1) + ' hours logged' }
    ],

    body: function () {
      var staff = me();
      var open = openEntry();
      var gap = missingEntry();

      var hours = hoursLogged();
      var classes = classesTaught();
      var counted = daysCounted();
      var period = ENTRIES[ENTRIES.length - 1].day + ' – ' + ENTRIES[0].day;

      var stats = ui.statbar([
        { label: 'Hours logged',   value: hours.toFixed(1) + ' hrs', sub: period },
        { label: 'Classes taught', value: String(classes), sub: 'Across ' + ENTRIES.length + ' days' },
        { label: 'Status',         value: staff.status, tone: 'grove', sub: 'In at ' + open.inAt }
      ]);

      var alert = gap
        ? ui.notice({
            kind: 'warn',
            title: gap.day + ' has no clock-out',
            text: 'No clock-out was recorded, so that day counts no hours yet. Message the desk and they will correct it.',
            action: { label: 'Ask the desk to fix it', msg: 'The desk will correct Thursday’s entry' }
          })
        : '';

      var table = ui.table(
        ['Day', 'In', 'Out', { label: 'Hours', align: 'right' }, 'Classes'],
        ENTRIES.map(function (e) {
          var out;
          if (e.missing) out = '<span class="clay strong">' + esc(e.outAt) + '</span>';
          else if (e.open) out = '<span class="grove strong">' + esc(e.outAt) + '</span>';
          else out = ui.mute(e.outAt);

          return {
            cells: [
              ui.two(e.day, e.note),
              ui.mute(e.inAt),
              out,
              e.hrs === null ? ui.mute('—') : esc(e.hrs.toFixed(1)),
              ui.two(classNames(e), sessions(e.cls.length))
            ]
          };
        }),
        { emptyTitle: 'No entries this pay week', emptyText: 'Clock in when you arrive and the day will appear here.' }
      );

      var entries = ui.card({ title: 'Clock entries', flush: true }, table);

      var payRows = [
        ['Rate', esc(staff.rate)],
        ['Pay week', esc(period)],
        ['Hours logged', esc(hours.toFixed(1))],
        ['Classes taught', String(classes)],
        ['Days counted', counted + ' of ' + ENTRIES.length]
      ];
      if (gap) payRows.push({ k: 'Not yet counted', v: esc(gap.day), tone: 'clay' });
      payRows.push(['Average day', round1(hours / counted).toFixed(1) + ' hrs']);
      payRows.push({ k: 'Estimated pay', v: Grove.money(hours * hourlyRate(staff)), tone: 'grove' });

      var pay = ui.card({
        title: 'Pay',
        note: 'An estimate at your hourly rate. A day with no clock-out earns nothing until the desk records one, and the desk confirms the final figure before payroll.'
      }, ui.kv(payRows));

      return h`
        ${raw(alert ? '<div class="stack">' + alert + '</div>' : '')}
        <div class="section">${raw(stats)}${raw(ui.grid('sidebar', [entries, pay]))}</div>
      `;
    }
  });
})();
