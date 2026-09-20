/* Studio → My time. Lauren's own clock entries for the pay week.

   WHO THIS SCREEN IS FOR
   Lauren Ortiz teaches. She opens this once a fortnight, off the floor, to
   answer one question: have I been paid for what I worked. She is not
   managing anything here — she cannot edit a clock entry, only the desk can —
   so the shape is: what is wrong, what the week came to, the days it came
   from, and who fixes it. Nothing on this screen is the studio's telemetry.
   Her sessions, her attendance rate and what her classes are worth are the
   owner's numbers and they live on the owner's screens.

   Cut in this pass
     - "Classes taught · 9" led the stat strip. A teacher checking her pay
       does not count her own sessions, and the figure contradicted Console →
       Staff, which prints Lauren's "Sessions a week" as the 5 weekly classes
       her STAFF record carries, not the 9 class-days this week happened to
       hold. The classes stay where they earn their place — one plain line
       per day, so she can recognise the day she is checking
     - the "2 sessions / 3 sessions" counts under those class names: the same
       tally again, per row
     - "Days counted · 4 of 5" as a stat of its own. It said what the clay
       notice at the top of the page already says, and what the line under
       the table says while it is doing the arithmetic. The strip is now the
       two figures she came for: the hours, and the money
     - "Average day · 5.6 hrs" was a statistic about her, of no use to her
     - the Pay card was eight key/value rows restating the strip. It is a
       short paragraph of plain sentences that does the arithmetic out loud
     - the missing day was named five times over, twice of them saying only
       that the desk will fix it. It is named where it does work: in clay at
       the top, with the button that fixes it; as its own row; and in the two
       places where a total would otherwise not add up — under the table,
       which ties 22.5 hours to the rows above it, and in the pay card, which
       has to say why the figure is short

   Carried over from the parent pass
     - every figure is derived, and now so is every figure in every row. The
       hours in a row are the distance between the two clock times printed
       beside them, the week's total is the sum of those rows, and the pay is
       that total at the rate on her staff record. Nothing is a literal, so
       an edited clock time moves the table, the strip and the sentences
       together
     - the right-hand column is a ui.col pair, so it does not end in dead
       space beside a five-row table
     - one studio phone number, read from Grove.data.STUDIO
     - no sticky action bar. That pattern belongs on a screen whose whole
       purpose is to complete one action; this screen's purpose is to be
       read, and its one action — clocking out — is the header button it
       shares with Studio → Today

   What is the spec's, not the dataset's
     - the clock entries themselves. Grove.data holds no timesheet, so the
       five rows below are this file's own. They are pinned to the rest of
       the app: their hours sum to 22.5, which is exactly what
       STAFF['lauren'] carries and what Console → Staff prints as "Hours this
       week", and today's 9:58am clock-in is the one in Grove.data.ACTIVITY,
       which the console dashboard also renders. Change a row here and
       js/data.js must change with it
     - "as of 2:10pm" on the open entry. A running day needs a now, and the
       dataset has a date but no clock
     - the pay week is Wed–Tue, ending on today, Tuesday 28 July 2026. The
       dataset carries no pay period

   Each day is worked against real classes from Grove.data.CLASSES, all of
   them Lauren's: the week 4 camp every weekday, plus the after-school hours
   and the private lesson her record carries. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  /* Newest first. A day carries only what the tablet recorded: the time she
     clocked in, and the time she clocked out. `outAt` is null where no
     clock-out was taken. `asOf` is the running day's now — the one entry
     that is still open has a now instead of an end. Hours are never stored;
     they are the distance between the two times. */
  var ENTRIES = [
    { day: 'Tue 28 Jul', note: 'Today', inAt: '9:58am', outAt: null,     asOf: '2:10pm', cls: ['c6', 'c11'] },
    { day: 'Mon 27 Jul', note: '',      inAt: '9:28am', outAt: '4:40pm', asOf: null,     cls: ['c6', 'c1', 'c2'] },
    { day: 'Fri 24 Jul', note: '',      inAt: '9:35am', outAt: '1:23pm', asOf: null,     cls: ['c6'] },
    { day: 'Thu 23 Jul', note: '',      inAt: '9:30am', outAt: null,     asOf: null,     cls: ['c6'] },
    { day: 'Wed 22 Jul', note: '',      inAt: '9:30am', outAt: '4:48pm', asOf: null,     cls: ['c6', 'c4'] }
  ];

  /* The table writes a day short, because five of them stand in a column. A
     sentence writes it long, because it is being read aloud. */
  var WEEKDAY = {
    Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday',
    Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday'
  };
  var MONTH = {
    Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April',
    May: 'May', Jun: 'June', Jul: 'July', Aug: 'August',
    Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December'
  };

  /* The studio portal is always looked at as the teacher on shift, so the
     screen reads her off the persona rather than naming her in the file. */
  function teacher(ctx) {
    var who = (ctx && ctx.persona) || Grove.persona('studio');
    return (who && who.name) || '';
  }
  function me(ctx) {
    var name = teacher(ctx);
    return D.STAFF.filter(function (s) { return s.name === name; })[0] ||
           D.STAFF.filter(function (s) { return s.id === 'lauren'; })[0] || D.STAFF[0];
  }

  /* Who actually corrects a clock entry. Read from the staff list so the
     screen does not invent a name for the front desk. */
  function deskName() {
    var d = D.STAFF.filter(function (s) { return s.role === 'Front desk'; })[0];
    return d ? String(d.name).split(' ')[0] : '';
  }

  function klass(id) {
    return D.CLASSES.filter(function (c) { return c.id === id; })[0];
  }
  function longDay(day) {
    var bits = String(day).split(' ');
    return bits.map(function (bit, i) {
      if (i === 0) return WEEKDAY[bit] || bit;
      return MONTH[bit] || bit;
    }).join(' ');
  }
  function round1(n) { return Math.round(n * 10) / 10; }

  /* --- the hours are the clock times, never a stored figure ---------------- */

  /* "4:40pm" → minutes past midnight. */
  function clock(t) {
    var m = /^(\d{1,2}):(\d{2})(am|pm)$/i.exec(String(t || '').replace(/\s+/g, ''));
    if (!m) return null;
    var hh = parseInt(m[1], 10) % 12;
    if (/pm/i.test(m[3])) hh += 12;
    return hh * 60 + parseInt(m[2], 10);
  }
  function isOpen(e) { return !e.outAt && !!e.asOf; }
  function isMissing(e) { return !e.outAt && !e.asOf; }

  /* What the row shows in its Hours column, and therefore what the week is
     summed from. A day with no clock-out has no hours at all. */
  function hoursOf(e) {
    var from = clock(e.inAt), to = clock(e.outAt || e.asOf);
    if (from === null || to === null) return null;
    return round1((to - from) / 60);
  }
  function hoursLogged() {
    var total = 0;
    ENTRIES.forEach(function (e) {
      var n = hoursOf(e);
      if (n !== null) total += n;
    });
    return round1(total);
  }
  function daysCounted() {
    return ENTRIES.filter(function (e) { return hoursOf(e) !== null; }).length;
  }
  function openEntry() { return ENTRIES.filter(isOpen)[0]; }
  function missingEntry() { return ENTRIES.filter(isMissing)[0]; }

  function hourlyRate(staff) {
    return parseFloat(String(staff.rate).replace(/[^0-9.]/g, '')) || 0;
  }
  function payFor(hours, staff) {
    return Grove.money(hours * hourlyRate(staff));
  }

  /* An After-School record is named by its length ("1 hour · After-School").
     That is a duration and not a class name, so the programme name is what
     goes in the row. */
  function className(c) {
    return c.prog === 'as' ? D.program(c.prog).name : c.name;
  }

  /* What she taught that day, as a phrase rather than a count. */
  function listify(list) {
    if (!list.length) return '';
    if (list.length === 1) return list[0];
    return list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1];
  }
  function classNames(e) {
    var names = [];
    e.cls.forEach(function (id) {
      var c = klass(id);
      if (!c) return;
      var name = className(c);
      if (names.indexOf(name) === -1) names.push(name);
    });
    return listify(names);
  }

  Grove.screen('sTime', {
    surface: 'studio',
    crumbTitle: 'My time',
    eyebrow: 'your pay week',
    title: 'My time',
    sub: 'Every entry below came from the studio tablet when you clocked in and out. You cannot change one from here — if a day looks wrong, the desk corrects it.',
    actions: function (ctx) {
      var on = me(ctx).status === 'Clocked in';
      var open = openEntry();
      var run = open ? hoursOf(open) : null;
      return [{
        label: on ? 'Clock out' : 'Clock in',
        kind: 'primary',
        msg: on && run !== null
          ? 'Clocked out · ' + run.toFixed(1) + ' hours logged today'
          : 'Clocked in'
      }];
    },

    body: function (ctx) {
      var staff = me(ctx);
      var open = openEntry();
      var gap = missingEntry();

      var hours = hoursLogged();
      var counted = daysCounted();
      var period = ENTRIES[ENTRIES.length - 1].day + ' – ' + ENTRIES[0].day;
      var pay = payFor(hours, staff);

      /* The one thing on this screen that costs her money, so it leads the
         page in clay and carries the only button that fixes it. */
      var alert = gap
        ? ui.notice({
            kind: 'bad',
            title: longDay(gap.day) + ' has no clock-out',
            text: 'The tablet has you in at ' + gap.inAt + ' and nothing after it. That day is not in the hours below and earns nothing until the desk records the time you left.',
            action: { label: 'Ask the desk to fix it', msg: 'Sent — the desk will add ' + gap.day + '’s clock-out' }
          })
        : '';

      /* Two figures, because she came with one question. How many days made
         them up is the table's business, one line under the table. */
      var stats = ui.statbar([
        { label: 'Hours logged', value: hours.toFixed(1) + ' hrs', sub: period },
        { label: 'Estimated pay', value: pay, tone: 'grove', sub: 'At ' + staff.rate + ', before tax' }
      ]);

      /* Column widths. A date, a clock time and an hours figure each have one
         shape, so the four fixed-shape columns are shrink columns — they take
         their content's width and hold it on one line, which is what stops
         "Tue 28 Jul" breaking after the weekday and "Still clocked in"
         running to two lines. What she taught is the one column with prose in
         it, so it takes whatever width is left and wraps there. */
      var table = ui.table(
        [
          { label: 'Day', shrink: true },
          { label: 'In', shrink: true },
          { label: 'Out', shrink: true },
          { label: 'Hours', align: 'right', shrink: true },
          'What you taught'
        ],
        ENTRIES.map(function (e) {
          var n = hoursOf(e);
          var out;
          if (isMissing(e)) out = '<span class="clay strong">' + esc('Not recorded') + '</span>';
          else if (isOpen(e)) out = '<span class="grove strong">' + esc('Still clocked in') + '</span>';
          else out = esc(e.outAt);

          return {
            cells: [
              ui.two(e.day, e.note),
              esc(e.inAt),
              out,
              n === null ? '<span class="clay strong">—</span>' : esc(n.toFixed(1)),
              ui.mute(classNames(e))
            ]
          };
        }),
        { emptyTitle: 'No entries this pay week', emptyText: 'Clock in when you arrive and the day will appear here.' }
      );

      var days = ui.card({
        title: 'This pay week',
        flush: true,
        note: gap
          ? 'The ' + counted + ' days here with a clock-out add up to ' + hours.toFixed(1) +
            ' hours. ' + gap.day + ' has none, so it adds nothing yet.'
          : 'These ' + counted + ' days add up to ' + hours.toFixed(1) + ' hours.'
      }, table);

      /* The arithmetic said out loud, so she can check it against her own
         memory of the week rather than trust a total. */
      var said = ['Your rate is ' + staff.rate + '. The ' + hours.toFixed(1) +
        ' hours in the table come to ' + pay + ' before tax.'];
      if (open) {
        said.push('Today is still running. Its ' + hoursOf(open).toFixed(1) +
          ' hours are counted up to ' + open.asOf + ' and will change when you clock out.');
      }
      if (gap) {
        said.push(longDay(gap.day) + ' is not in that figure. With a clock-out it would add hours at the same rate.');
      }
      said.push('The desk confirms the final figure before payroll.');

      var sums = ui.card({ title: 'How your pay adds up' }, h`
        <div class="stack stack--sm">${raw(said.map(function (line) {
          return '<p class="hint">' + esc(line) + '</p>';
        }).join(''))}</div>
      `);

      var desk = deskName();
      var who = desk
        ? 'so tell ' + desk + ' at the front desk, or ring ' + D.STUDIO.phone
        : 'so ring the desk on ' + D.STUDIO.phone;
      var help = ui.card({
        title: 'If a day looks wrong',
        foot: ui.btn({ label: 'Message the front desk', msg: 'Sent — the front desk will take a look' })
      }, h`
        <div class="stack stack--sm">
          <p class="hint">Clock entries cannot be changed from here, ${who}. Say which day and what
            time you left, and they will correct the entry.</p>
          <p class="hint">Only this pay week is here. If you are checking back over a fortnight, ask
            the desk for the week before.</p>
        </div>
      `);

      return h`
        ${raw(alert)}
        <div class="section">${raw(stats)}${raw(ui.grid('sidebar', [days, ui.col([sums, help])]))}</div>
      `;
    }
  });
})();
