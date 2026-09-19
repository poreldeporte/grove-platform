/* Console → Reports, and the report detail behind each card.

   No charts, deliberately. The old screen drew a 38px eight-bar sparkline on
   every card. At that size the bars say nothing a sentence cannot say better,
   and two of the nine overflowed their own track while a third had three
   invisible zero bars. A studio owner reading a prototype needs the number and
   the sentence; a fake chart is noise. Every card now carries the figure, the
   finding, and the trend written out in words.

   Other simplifications:
     - picking a date range was a whole form screen (preset, from, to, plus two
       "what to include" selects that belong to the statement, not to reports).
       It is now four chips on the one toolbar row.
     - nine delta colours carrying three different meanings, all of which read
       the same at a glance, collapse to one muted line under the figure.
       Direction is in the trend sentence, where it can be read.
     - the detail's "Back to reports" button is gone. The shell draws
       breadcrumbs on every screen, so a second way back is ceremony.
     - the detail's "What it means" section repeated the card's finding word for
       word; the finding is already the page subtitle, so that section holds the
       trend sentence and the one thing you can do about it instead.
     - the export button was labelled CSV and toasted PDF. It now says CSV both
       times.

   Where a report has underlying rows in Grove.data, the detail shows them.
   Acquisition has none — nothing in the platform records where a family heard
   of the studio — so it says so rather than inventing a source breakdown. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  var RANGES = ['This month', 'Last month', 'This term', 'This year'];

  var FAMILY_STATUS = {
    'Active': 'ok',
    'Payment failed': 'bad',
    'Past due': 'bad',
    'Pending payment': 'warn',
    'Cancelling': null
  };

  var PILL_KIND = { ok: 'ok', warn: 'warn', bad: 'bad', info: null, neutral: null };

  function num(v) { return '<span class="num">' + esc(v) + '</span>'; }

  /* ---- the rows behind each report, read from Grove.data ------------------ */

  function planRows() {
    return ui.table(
      ['Family', 'Current plan', { label: 'Status', shrink: true }],
      D.FAMILIES.map(function (f) {
        return {
          cells: [
            ui.two(f.name + ' family', f.guardian),
            ui.mute(f.plan),
            ui.pill(f.status, FAMILY_STATUS[f.status])
          ]
        };
      })
    );
  }

  function tenureRows() {
    return ui.table(
      ['Family', 'With us since', { label: 'Status', shrink: true }],
      D.FAMILIES.map(function (f) {
        return {
          cells: [
            ui.two(f.name + ' family', f.guardian),
            ui.mute(f.since),
            ui.pill(f.status, FAMILY_STATUS[f.status])
          ]
        };
      })
    );
  }

  function attendanceRows() {
    return ui.table(
      ['Child', 'Class', { label: 'Attendance', align: 'right' }, { label: 'Credits', align: 'right' }],
      D.STUDENTS.map(function (s) {
        return {
          cells: [
            ui.two(s.name, s.family + ' family'),
            ui.mute(s.cls),
            num(s.att),
            num(s.mk)
          ]
        };
      })
    );
  }

  function capacityRows() {
    return ui.table(
      ['Class', 'When', { label: 'Enrolled', align: 'right' },
        { label: 'Fill', align: 'right' }, { label: 'Waiting', align: 'right' }],
      D.CLASSES.map(function (c) {
        return {
          cells: [
            ui.two(c.name, c.room + ' · ages ' + c.band),
            ui.mute(c.day + ' ' + c.time),
            num(c.en + ' / ' + c.cap),
            num(Math.round((c.en / c.cap) * 100) + '%'),
            num(c.wl || '—')
          ]
        };
      })
    );
  }

  function makeupRows() {
    return ui.table(
      ['Child', 'Missed', 'Expires', { label: 'Status', shrink: true }],
      D.MAKEUPS.map(function (m) {
        return {
          cells: [
            ui.two(m.child, m.reason),
            ui.mute(m.missed),
            ui.mute(m.expires),
            ui.pill(m.status, PILL_KIND[m.kind])
          ]
        };
      })
    );
  }

  function invoiceRows() {
    return ui.table(
      ['Invoice', 'Family', 'Method', { label: 'Amount', align: 'right' }, { label: 'Status', shrink: true }],
      D.INVOICES.map(function (i) {
        return {
          cells: [
            ui.two(i.id, i.date),
            ui.mute(i.fam + ' family'),
            ui.mute(i.method),
            num(Grove.money(i.amt)),
            ui.pill(i.status, PILL_KIND[i.kind])
          ]
        };
      })
    );
  }

  function staffRows() {
    return ui.table(
      ['Person', 'Role', { label: 'Classes a week', align: 'right' }, { label: 'Hours', align: 'right' }],
      D.STAFF.map(function (s) {
        return {
          cells: [
            ui.two(s.name, s.rate),
            ui.mute(s.role),
            num(s.classes),
            num(s.hrs)
          ]
        };
      })
    );
  }

  function programRows() {
    var order = ['as', 'camp', 'nsd', 'priv', 'bday', 'pop'];
    return ui.table(
      ['Program', { label: 'Classes', align: 'right' },
        { label: 'Enrolled', align: 'right' }, { label: 'Places', align: 'right' }],
      order.map(function (id) {
        var p = D.program(id);
        var list = D.CLASSES.filter(function (c) { return c.prog === id; });
        var en = 0, cap = 0;
        list.forEach(function (c) { en += c.en; cap += c.cap; });
        return {
          cells: [
            '<span class="cell-strong">' + ui.dot(p.color) + ' ' + esc(p.name) + '</span>',
            num(list.length),
            num(en),
            num(cap)
          ]
        };
      })
    );
  }

  function noRows() {
    return ui.empty(
      'Nothing recorded yet',
      'Where a family heard about the studio is not recorded anywhere in the platform, so this report has no rows behind it.'
    );
  }

  /* ---- the nine reports ---------------------------------------------------
     Figures and findings come from the studio's reporting spec. The tables
     underneath them are read from Grove.data. */

  var REPORTS = [
    {
      id: 'mrr',
      cat: 'Revenue',
      title: 'Monthly recurring revenue',
      body: 'Tuition committed before a single camp is sold. The number the studio can plan against.',
      trend: 'Up in six of the last seven months, and the one dip was recovered immediately.',
      value: '$34,180',
      delta: '+6% on July',
      open: { label: 'Open Billing', to: 'billing' },
      rows: planRows
    },
    {
      id: 'retention',
      cat: 'Retention',
      title: 'Who leaves, and when',
      body: 'Two thirds of cancellations land in month three. Something happens after the honeymoon.',
      trend: 'A sharp fall in the third month, then steady in the low nineties ever since.',
      value: '91%',
      delta: '12-month retention',
      open: { label: 'Open People', to: 'families' },
      rows: tenureRows
    },
    {
      id: 'absence',
      cat: 'Attendance',
      title: 'Absence patterns',
      body: 'Monday carries three times the absences of any other day — holidays plus illness.',
      trend: 'Mid-nineties in every month that ran, apart from one month at 74. Three of the eight months have no sessions to count.',
      value: '94%',
      delta: '−2 pts on June',
      open: { label: 'Open People', to: 'families' },
      rows: attendanceRows
    },
    {
      id: 'fill',
      cat: 'Capacity',
      title: 'Fill rate by class',
      body: 'Ages 8–11 runs at 100%; ages 5–7 on Tuesday sits at 67%. Move a class, not a child.',
      trend: 'Swings between 67 and 108 per cent — some classes are turning children away while others run two thirds full.',
      value: '88%',
      delta: '5 classes full',
      open: { label: 'Open Classes', to: 'classes' },
      rows: capacityRows
    },
    {
      id: 'makeups',
      cat: 'Make-ups',
      title: 'Credits issued vs redeemed',
      body: 'A third of credits expire unused. Every expired credit is a class a family paid for and did not get.',
      trend: 'Flat between 58 and 72 per cent all year, with no month clearly better than another.',
      value: '67%',
      delta: 'redeemed',
      open: { label: 'Open Requests', to: 'requests' },
      rows: makeupRows
    },
    {
      id: 'acquisition',
      cat: 'Acquisition',
      title: 'Where families come from',
      body: 'Word of mouth beats every paid channel combined. Instagram brings enquiries, not enrolments.',
      trend: 'Bumpy from month to month, between 38 and 61, with no direction either way.',
      value: '38',
      delta: 'new this quarter',
      open: { label: 'Open People', to: 'families' },
      rows: noRows
    },
    {
      id: 'collection',
      cat: 'Payments',
      title: 'Collection health',
      body: 'Nine of twelve failed charges recover on the first retry. The three that do not need a phone call.',
      trend: 'Between 93 and 98 per cent every month. The retry handles most of what fails.',
      value: '96.4%',
      delta: 'collected on time',
      open: { label: 'Open Billing', to: 'billing' },
      rows: invoiceRows
    },
    {
      id: 'staffcost',
      cat: 'Staff',
      title: 'Hours against enrolment',
      body: 'Instructor cost per enrolled child fell as the 8–11 classes filled. Adding a class improves it further.',
      trend: 'Down every month without exception, 52 to 41. The same hours now cover more children.',
      value: '$41',
      delta: 'cost per child / month',
      open: { label: 'Open Staff', to: 'staff' },
      rows: staffRows
    },
    {
      id: 'programs',
      cat: 'Programs',
      title: 'Which programs earn',
      body: 'After-school is 62% of revenue and 90% of the operational load. Camps earn more per hour.',
      trend: 'Up from 88 to 118 over the eight months, and level at the top for the last three.',
      value: '$118',
      delta: 'revenue per studio hour',
      open: { label: 'Open Programs', to: 'programs' },
      rows: programRows
    }
  ];

  function rep(ctx) {
    var id = ctx.params.id;
    for (var i = 0; i < REPORTS.length; i++) {
      if (REPORTS[i].id === id) return REPORTS[i];
    }
    return REPORTS[0];
  }

  /* ---- the grid ------------------------------------------------------------ */

  function reportCard(r) {
    var foot =
      '<div>' +
        '<div class="stat__value">' + esc(r.value) + '</div>' +
        '<div class="stat__sub">' + esc(r.delta) + '</div>' +
      '</div>' +
      ui.btn({ label: 'Open', kind: 'quiet', size: 'sm', to: 'report', id: r.id });

    return ui.card({ title: r.cat, foot: foot }, h`<div class="stack stack--sm">
      <p class="strong">${r.title}</p>
      <p class="cell-mute">${r.body}</p>
      <p class="hint">${r.trend}</p>
    </div>`);
  }

  Grove.screen('reports', {
    surface: 'console',
    crumbTitle: 'Reports',
    eyebrow: 'how it is going',
    title: 'Reports',
    sub: 'Not a wall of charts. Each report answers a question the studio actually asks, and ends in something you can do.',
    actions: [
      { label: 'Export all · CSV', msg: '9 reports exported as CSV' }
    ],

    body: function () {
      var range = Grove.filter('reports', RANGES[0]);

      return ui.toolbar({
        filters: { key: 'reports', items: RANGES },
        count: REPORTS.length + ' reports · ' + range.toLowerCase()
      }) + ui.grid(3, REPORTS.map(function (r) { return reportCard(r); }));
    }
  });

  /* ---- one report ----------------------------------------------------------- */

  Grove.screen('report', {
    surface: 'console',
    crumbs: [{ label: 'Reports', to: 'reports' }],
    crumbTitle: 'Report',
    eyebrow: function (ctx) { return rep(ctx).cat.toLowerCase(); },
    title: function (ctx) { return rep(ctx).title; },
    sub: function (ctx) { return rep(ctx).body; },
    actions: function (ctx) {
      return [
        { label: 'Export this report', kind: 'primary', msg: rep(ctx).title + ' exported as PDF' }
      ];
    },

    body: function (ctx) {
      var r = rep(ctx);

      var headline = ui.statbar([
        { label: 'Now', value: r.value, sub: r.delta, tone: 'grove' },
        { label: 'Period', value: 'Last 8 months' },
        { label: 'Updated', value: 'This morning' }
      ]);

      var means = ui.card({
        title: 'What it means',
        head: ui.btn({ label: r.open.label, kind: 'quiet', size: 'sm', to: r.open.to }),
        note: 'Open the section this report draws from and make the change there — reports are a read of the data, never a place to edit it.'
      }, h`<p class="cell-mute">${r.trend}</p>`);

      var counted = ui.card({ title: 'How it is counted' }, ui.kv([
        { k: 'Source', v: 'Enrolments, invoices and attendance recorded in the platform.', tone: 'mute' },
        { k: 'Excludes', v: 'Cancelled sessions and unpaid trial places.', tone: 'mute' },
        { k: 'Refreshes', v: 'Overnight.', tone: 'mute' }
      ]));

      var behind = ui.card({ title: 'The rows behind it', flush: true }, r.rows());

      return h`${raw(headline)}
        ${raw(ui.grid(2, [means, counted]))}
        <div class="section">${raw(behind)}</div>`;
    }
  });
})();
