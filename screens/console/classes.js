/* Console → Classes (list + week calendar), one class record, and cancelling
   one dated session.

   Fitted to Sabrina, the owner. She is at a desk with a keyboard, she reads
   tables, and she comes here for two things: who is in a room, and whether a
   room is over its capacity. Density is right on this screen. Ceremony is not.

   What this pass cut:
     - the seven programme chips. Twelve classes fit on one screen without
       scrolling, so the answer was always "All programs". The programme is
       already named in full under every class name, which is what the chips
       were being read for
     - "The class" card on the record. Programme, When, Room, Ages, Teacher and
       Places were a third printing of the eyebrow, the sub and the flag pills
       sitting directly above them
     - "What a place costs" on the record — five rows of prices she cannot
       change here and that are identical for every class in the programme. The
       record states once, in the sub, that it follows the programme price
     - the header's "Lesson plan" button. It opened the same plan the Lesson
       plans card already lists: two controls, one decision
     - the over-capacity line that sat as a note UNDER the twelve-row table.
       It is now a notice above the table, naming the room, with the way in
     - "64 of 80 places" under each calendar day, which adds up five unrelated
       rooms. The day foot now reads "15 places left" — the part she can sell —
       and a day holding an over-capacity class is flagged in its own head

   What this pass added:
     - over capacity is unmistakable in every view: a clay notice above the
       table and above the week, a pill on the day card that holds it, a clay
       line on the row itself, and the count in the toolbar
     - "Cancel a session" was a small red button that fired a toast. It is now
       a screen that asks which date and says plainly what cancelling does —
       how many children get a class to make up, who is told, that no money
       moves, whose shift disappears — with the action in a sticky bar
     - the week is no longer a literal list of dates. Monday, the six day
       columns, "Today" and every session date are worked out from
       Grove.data.today, so moving the dataset's today moves the calendar
     - the roster is a table, not a list of rows. A class carries eight to
       eighteen children, and at that size age, attendance, classes to make up
       and the safety note read straight down their own columns instead of
       being crushed onto one detail line

   Everything counted here is counted off the rows being shown. The roster is
   the class — D.roster(id) returns the children on the roll — so "12 enrolled"
   is the length of the list printed underneath it, and the waitlist pill
   counts the rows in its own card. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  var WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var WEEK_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];

  /* The mapping the Requests screen uses, so a credit reads the same colour on
     both screens. */
  var MAKEUP_PILL = {
    'Awaiting approval': 'warn',
    'Available': 'ok',
    'Booked': null,
    'Expiring': 'bad'
  };

  Grove.on('pickSession', function (d) { Grove.setFilter('cancelSession', d.id); });

  /* ---- the calendar --------------------------------------------------------
     The dataset states its own today, so Monday, the six day columns, the
     "Today" pill and every session date are worked out from it rather than
     written down. */

  function today() {
    var m = /(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/.exec(String(D.today));
    var mo = m ? MONTHS.indexOf(m[2].slice(0, 3)) : -1;
    if (!m || mo === -1) return new Date();
    return new Date(parseInt(m[3], 10), mo, parseInt(m[1], 10));
  }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function monday() { var t = today(); return addDays(t, -((t.getDay() + 6) % 7)); }
  function shortDate(d) { return d.getDate() + ' ' + MONTHS[d.getMonth()]; }
  /* Sunday is not a studio day, so it never indexes into WEEK. */
  function dayOf(d) { return WEEK[(d.getDay() + 6) % 7] || 'Sun'; }
  function weekDates() {
    var m = monday();
    return WEEK.map(function (day, i) { return shortDate(addDays(m, i)); });
  }
  function weekLabel() {
    var m = monday();
    return m.getDate() + ' ' + MONTHS_LONG[m.getMonth()] + ' ' + m.getFullYear();
  }
  function longLabel(d) {
    var i = WEEK.indexOf(dayOf(d));
    return (i === -1 ? 'Sunday' : WEEK_LONG[i]) + ' ' + shortDate(d);
  }
  function awayText(d) {
    var n = Math.round((d.getTime() - today().getTime()) / 86400000);
    if (n <= 0) return 'today';
    if (n === 1) return 'tomorrow';
    if (n < 7) return 'in ' + n + ' days';
    var w = Math.round(n / 7);
    return 'in ' + w + (w === 1 ? ' week' : ' weeks');
  }

  /* ---- small helpers ------------------------------------------------------- */

  function prog(c) { return D.program(c.prog) || { name: c.prog, short: c.prog, color: 'var(--ink-45)' }; }

  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  /* '2:15–3:15pm' -> '2:15pm'; '10:00am–1:00pm' -> '10:00am'. */
  function startTime(c) {
    var parts = String(c.time).split('–');
    var a = String(parts[0] || '').toLowerCase();
    if (a.indexOf('am') !== -1 || a.indexOf('pm') !== -1) return a;
    var b = String(parts[1] || '').toLowerCase();
    return a + (b.indexOf('am') !== -1 ? 'am' : (b.indexOf('pm') !== -1 ? 'pm' : ''));
  }

  /* '3:15pm' -> 915, so a day column can be read straight down. */
  function startMinutes(c) {
    var m = /^(\d{1,2}):(\d{2})(am|pm)$/.exec(startTime(c));
    if (!m) return 0;
    var hour = parseInt(m[1], 10) % 12;
    if (m[3] === 'pm') hour += 12;
    return hour * 60 + parseInt(m[2], 10);
  }

  /* Clock time first; room and name only break a tie. */
  function byTime(a, b) {
    var d = startMinutes(a) - startMinutes(b);
    if (d) return d;
    if (a.room !== b.room) return a.room < b.room ? -1 : 1;
    return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0);
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

  /* A class that carries a calendar date in its name — "No-School Day · 3 Nov"
     — happens on that date and nowhere else, so it is not drawn into a July
     week. It still appears in the List tab, and the page sub says so. */
  function datedFor(c) {
    var m = /(\d{1,2}\s[A-Z][a-z]{2})\b/.exec(String(c.name));
    return m ? m[1] : null;
  }
  function datedAt(c) {
    var text = datedFor(c);
    var m = text ? /(\d{1,2})\s([A-Z][a-z]{2})/.exec(text) : null;
    var mo = m ? MONTHS.indexOf(m[2]) : -1;
    if (!m || mo === -1) return null;
    return new Date(today().getFullYear(), mo, parseInt(m[1], 10));
  }

  function thisWeek(c) {
    var d = datedFor(c);
    return !d || weekDates().indexOf(d) !== -1;
  }

  function datedElsewhere() {
    return D.CLASSES.filter(function (c) { return !thisWeek(c); });
  }

  /* The next few dates a class runs. There are no session rows to read, so the
     dates are walked forward from today across the class's own days. */
  function sessionDates(c, limit) {
    var one = datedAt(c);
    if (one) return [one];
    var out = [], start = today();
    for (var i = 0; i < 28 && out.length < limit; i++) {
      var d = addDays(start, i);
      if (runsOn(c, dayOf(d))) out.push(d);
    }
    return out;
  }
  function dateKey(d) {
    return 'd' + d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  function isOver(c) { return c.en > c.cap; }
  function overBy(c) { return c.en - c.cap; }
  function placesLeft(c) { return Math.max(0, c.cap - c.en); }

  function fillKind(c) {
    return isOver(c) ? 'bad' : (c.en === c.cap ? 'amber' : null);
  }

  function fill(c) {
    return h`<div class="stack stack--sm">
      <div>${raw(ui.pill(c.en + '/' + c.cap, fillKind(c)))}</div>
      ${raw(ui.meter(c.en, c.cap))}
      ${raw(isOver(c)
        ? '<div class="cell-sub clay">' +
          esc(plural(overBy(c), 'child over capacity', 'children over capacity')) + '</div>'
        : '')}
    </div>`;
  }

  function teacher(c) {
    return c.staff === 'Unassigned'
      ? '<span class="clay strong">Unassigned</span>'
      : ui.mute(c.staff);
  }

  /* "12 of 12 places", but "1 of 1 place" on a private class. */
  function placesLine(c) {
    return c.en + ' of ' + c.cap + (c.cap === 1 ? ' place' : ' places');
  }

  /* The dataset writes an open age band as "All" and a one-to-one class as
     "—", so the band is only worth a chip when it names an actual band. */
  function bandLine(c) {
    if (c.band === '—') return '';
    return c.band === 'All' ? 'All ages' : 'Ages ' + c.band;
  }

  /* The one thing she must act on, written off the rows on screen: it names
     the room, and it goes away when the class it is talking about does. */
  function overNotice(list) {
    if (!list.length) return '';
    if (list.length === 1) {
      var c = list[0];
      return ui.notice({
        kind: 'bad',
        title: 'Over capacity · ' + c.room + ' · ' + c.day + ' ' + c.time,
        text: c.en + ' children booked into a room set for ' + c.cap +
          '. A make-up booking landed after the last enrollment, so moving the make-up ' +
          'clears the room and no enrolled child loses their place.',
        action: { label: 'Open the class', to: 'classRecord', id: c.id }
      });
    }
    return ui.notice({
      kind: 'bad',
      title: plural(list.length, 'class is over capacity', 'classes are over capacity'),
      text: list.map(function (c) {
        return c.room + ' · ' + c.day + ' ' + startTime(c) + ' · ' + c.en + ' of ' + c.cap;
      }).join('; ') + '. Moving the make-up booking clears each one without touching an enrolled child.'
    });
  }

  /* ---- Classes ------------------------------------------------------------ */

  function tabRail() {
    return {
      key: 'classes',
      items: [{ label: 'List', count: D.CLASSES.length }, { label: 'Calendar' }]
    };
  }

  Grove.screen('classes', {
    surface: 'console',
    eyebrow: 'what runs, and when',
    title: 'Classes',
    sub: function () {
      if (Grove.tab('classes', 'List') !== 'Calendar') {
        return 'Every class across all ' + Object.keys(D.PROGRAMS).length +
          ' programs. A class generates dated sessions; enrollments attach to the class, attendance to the session.';
      }
      var away = datedElsewhere();
      var base = 'Week of ' + weekLabel() +
        '. A room over its capacity is flagged on the day that holds it, and a session with nobody teaching it on its own block.';
      if (!away.length) return base;
      return base + ' ' + away.map(function (c) { return c.name; }).join(' and ') +
        (away.length === 1 ? ' is dated outside this week, so it is' : ' are dated outside this week, so they are') +
        ' in the List tab only.';
    },
    actions: [
      { label: 'Export', msg: 'CSV exported' },
      { label: 'New class', kind: 'primary', msg: 'Class created · no sessions yet, nobody enrolled' }
    ],

    body: function () {
      return Grove.tab('classes', 'List') === 'Calendar' ? calendarTab() : listTab();
    }
  });

  function listTab() {
    var rows = D.CLASSES;
    var over = rows.filter(isOver);
    var unstaffed = rows.filter(function (c) { return c.staff === 'Unassigned'; });

    var table = ui.table(
      ['Class', 'When', 'Room', 'Ages', 'Teacher', 'Enrolled', { label: 'Waitlist', align: 'right', shrink: true }],
      rows.map(function (c) {
        return {
          to: 'classRecord', id: c.id,
          /* No programme dot in this cell: it indented the class name away
             from both the programme under it and the column header. The
             programme is named in full on the second line instead. */
          cells: [
            ui.two(c.name, prog(c).name),
            ui.mute(c.day + ' · ' + c.time),
            ui.mute(c.room),
            ui.mute(c.band),
            teacher(c),
            fill(c),
            c.wl ? ui.pill(String(c.wl), 'warn') : '<span class="mute">—</span>'
          ]
        };
      })
    );

    var bar = ui.toolbar({
      tabs: tabRail(),
      count: plural(rows.length, 'class', 'classes') +
        (unstaffed.length ? ' · ' + plural(unstaffed.length, 'needs a teacher', 'need a teacher') : '')
    });
    var lead = overNotice(over);
    var card = ui.card({ flush: true }, table);

    return bar + lead + (lead ? '<div class="section">' + card + '</div>' : card);
  }

  function entryRow(c) {
    var p = prog(c);
    var who = c.staff === 'Unassigned'
      ? '<span class="clay">Unassigned</span>'
      : esc(c.staff);
    return {
      lead: esc(startTime(c)),
      title: ui.dot(p.color) + ' ' + esc(c.name),
      sub: esc(c.room) + ' · ' + who + (isOver(c)
        ? ' · <span class="clay strong">' + esc(overBy(c) + ' over capacity') + '</span>'
        : ''),
      end: ui.pill(c.en + '/' + c.cap, fillKind(c)),
      to: 'classRecord', id: c.id
    };
  }

  /* Two columns rather than three: the six days hold 5, 6, 4, 4, 3 and 1
     sessions, and pairing them that way roughly halves the white a short day
     leaves under a tall neighbour. Each card closes on its own footer, so what
     is left reads as the end of the card. */
  function calendarTab() {
    var dates = weekDates();
    var here = D.CLASSES.filter(thisWeek);
    var over = here.filter(isOver);
    var total = 0;

    var days = WEEK.map(function (day, i) {
      var list = here.filter(function (c) { return runsOn(c, day); }).sort(byTime);
      total += list.length;

      var left = 0;
      list.forEach(function (c) { left += placesLeft(c); });
      var heavy = list.filter(isOver);

      var head = h`<span class="inline">
        ${raw(heavy.length ? ui.pill(heavy.length + ' over capacity', 'bad') : '')}
        ${raw(day === dayOf(today()) ? ui.pill('Today', 'ok') : '')}
        <span class="mute">${dates[i]}</span>
      </span>`;

      var foot = list.length
        ? '<span class="mute">' + esc(plural(list.length, 'session', 'sessions')) + '</span>' +
          '<span class="num">' + esc(left ? plural(left, 'place left', 'places left') : 'No places left') + '</span>'
        : null;

      return ui.card({
        title: WEEK_LONG[i],
        head: head,
        flush: true,
        foot: foot
      }, list.length ? ui.rows(list.map(entryRow)) : ui.empty('Studio closed'));
    });

    var bar = ui.toolbar({
      tabs: tabRail(),
      count: plural(total, 'session this week', 'sessions this week') +
        (over.length ? ' · ' + over.length + ' over capacity' : '')
    });
    var lead = overNotice(over);
    var grid = ui.grid(2, days);

    return bar + lead + (lead ? '<div class="section">' + grid + '</div>' : grid);
  }

  /* ---- class record --------------------------------------------------------
     What she came for is the roster, so the roster is the first and widest
     card. The old "The class" card under it repeated the eyebrow, the sub and
     the three flag pills; the old price card listed four monthly rates she
     cannot change from here, so the record states in one line that it follows
     the programme's prices. */

  var recordDef = {
    surface: 'console',
    crumbs: [{ label: 'Classes', to: 'classes' }],
    eyebrow: function (ctx) { return prog(cls(ctx)).name; },
    title: function (ctx) { return cls(ctx).name; },
    sub: function (ctx) {
      var c = cls(ctx);
      return c.day + ' · ' + c.time + ' · ' + c.room + '. A place here is priced on ' +
        prog(c).name + ' — the same for every class in the programme — and the prices are set under Programs.';
    },

    /* The class already has an instructor on almost every record, so asking
       for one is only the primary action when there is nobody teaching it. */
    actions: function (ctx) {
      var c = cls(ctx);
      return [
        { label: 'Cancel a session', kind: 'danger', to: 'classCancel', id: c.id },
        c.staff === 'Unassigned'
          ? { label: 'Assign an instructor', kind: 'primary', msg: 'Assigned · the instructor sees the class now' }
          : { label: 'Edit class', kind: 'primary', msg: 'Saved · the change shows on the schedule and on every roster' }
      ];
    },

    body: function (ctx) {
      var c = cls(ctx);
      var kids = roster(c);
      var waiting = waitlist(c);
      var plans = lessonsFor(c);
      var credits = makeupsFor(c);

      var flags = h`<div class="flags">
        ${raw(ui.pill(placesLine(c), fillKind(c)))}
        ${raw(bandLine(c) ? ui.pill(bandLine(c)) : '')}
        ${raw(c.staff === 'Unassigned'
          ? ui.pill('No instructor assigned', 'bad')
          : ui.pill(c.staff, 'ok'))}
      </div>`;

      var over = isOver(c)
        ? ui.notice({
            kind: 'bad',
            title: 'Over capacity by ' + overBy(c),
            text: c.en + ' children are booked into ' + c.room + ', which is set for ' + c.cap +
              '. A make-up booking landed here after the last enrollment. Moving the make-up clears ' +
              'the room; no enrolled child loses their place and no money moves.',
            action: { label: 'Move the make-up', msg: 'Make-up moved · the room is back inside its capacity' }
          })
        : '';

      /* Eight to eighteen children, so the roll is a table: one line each, and
         age, attendance, credits and the safety note read down their columns
         rather than being folded into a sentence under the name. */
      var flagged = kids.filter(function (k) { return !!k.flag; });
      var urgent = flagged.some(function (k) { return k.flagKind === 'bad'; });

      var rosterCard = ui.card({
        title: 'Roster',
        head: '<span class="inline">' +
          (flagged.length
            ? ui.pill(plural(flagged.length, 'safety note', 'safety notes'), urgent ? 'bad' : 'warn')
            : '') +
          '<span class="mute">' + esc(kids.length + ' enrolled') + '</span></span>',
        flush: true,
        note: flagged.length
          ? 'Safety notes here are the ones every teacher sees on this roster and on the attendance sheet.'
          : ''
      }, kids.length
        ? ui.table(
            ['Child',
             { label: 'Age', align: 'right', shrink: true },
             { label: 'Attendance', align: 'right', shrink: true },
             { label: 'To make up', align: 'right', shrink: true },
             'Safety note'],
            kids.map(kidRow)
          )
        : ui.empty('Nobody enrolled yet', 'The first child to register for this class appears here.')
      );

      var waitCard = ui.card({
        title: 'Waitlist',
        head: ui.pill(waiting.length + ' waiting', 'warn'),
        flush: true,
        note: 'Nobody is turned away. A place that frees up goes to the first name on the list, at the usual price.'
      }, ui.rows(waiting.map(waitRow)));

      var lessons = ui.card({
        title: 'Lesson plans',
        head: '<span class="mute">' + esc(plural(plans.length, 'plan', 'plans')) + '</span>',
        flush: true,
        note: 'Plans are written under Teaching and published to the instructor before the session.'
      }, ui.rows(plans.map(function (lp) {
        return {
          title: esc(lp.lesson),
          sub: esc(lp.date + ' · ' + lp.room + ' · ' + lp.teacher),
          end: ui.pill(lp.status, lp.kind),
          to: 'lessonPlan', id: lp.id
        };
      })));

      /* Of the four credit states, two are waiting on her — one to approve,
         one with nowhere left to place it. That pair is the head of the card;
         the rest of the vocabulary stays on the rows, coloured the way
         Requests colours it, because Requests is where a credit is settled. */
      var needs = credits.filter(function (m) {
        return m.status === 'Awaiting approval' || m.status === 'Expiring';
      });
      var makeups = ui.card({
        title: 'Make-ups from this class',
        head: '<span class="inline">' +
          (needs.length ? ui.pill(needs.length + ' need you', 'warn') : '') +
          '<span class="mute">' + esc(plural(credits.length, 'credit', 'credits')) + '</span></span>',
        flush: true,
        note: 'A missed session becomes a credit counted in classes, never in money. Credits are placed from Requests.'
      }, ui.rows(credits.map(function (m) {
        return {
          title: esc(m.child),
          sub: esc(m.missed + ' · ' + m.reason),
          end: ui.pill(m.status, MAKEUP_PILL[m.status]),
          to: 'makeupRequest', id: m.id
        };
      })));

      /* The roster runs the full width on its own: it is what she came for, it
         is a table, and at eighteen rows it would tower over whatever card was
         put beside it. The three supporting cards — none of them more than a
         handful of rows — share the row underneath, and only the ones holding
         something are drawn. */
      var extra = [];
      if (waiting.length) extra.push(waitCard);
      if (plans.length) extra.push(lessons);
      if (credits.length) extra.push(makeups);

      var body = ui.grid(null, [rosterCard]) +
        (extra.length
          ? '<div class="section">' +
            (extra.length === 1 ? ui.grid(null, extra) : ui.grid(extra.length, extra)) +
            '</div>'
          : '');

      return flags +
        (over ? over + '<div class="section">' + body + '</div>' : body);
    }
  };

  /* The trail has to close on the record, and the shell reads crumbTitle as a
     value rather than calling it, so it is defined as a getter. */
  Object.defineProperty(recordDef, 'crumbTitle', {
    get: function () { return cls({ params: Grove.state.params }).name; }
  });

  Grove.screen('classRecord', recordDef);

  /* One line of the roll. The family is under the name because two children
     on the same roster can share a first name. */
  function kidRow(k) {
    return {
      to: 'studentRecord', id: k.id,
      cells: [
        ui.two(k.name, k.family + ' family'),
        ui.mute(String(k.age)),
        ui.mute(k.att),
        k.mk ? ui.pill(String(k.mk), 'warn') : '<span class="mute">—</span>',
        k.flag ? ui.pill(k.flag, k.flagKind) : '<span class="mute">—</span>'
      ]
    };
  }

  /* The queue itself is managed on Requests, so every entry goes there. */
  function waitRow(w) {
    return {
      lead: '#' + w.pos,
      title: esc(w.child),
      sub: esc(w.fam + ' family · joined ' + w.joined),
      to: 'requests'
    };
  }

  /* ---- cancel one session ---------------------------------------------------
     This was a small red button in a card header that fired a toast. It
     cancels an hour for a room full of children, issues every one of them a
     class to make up and messages every family, and Sabrina has nobody to undo
     it for her — so it asks which date and states, before she commits, exactly
     what will happen. The button sits in a bar pinned to the bottom of the
     viewport, never below the explanation. */

  Grove.screen('classCancel', {
    surface: 'console',
    crumbs: [{ label: 'Classes', to: 'classes' }],
    crumbTitle: 'Cancel a session',
    eyebrow: 'one date, not the class',
    title: 'Cancel a session',
    sub: function (ctx) {
      var c = cls(ctx);
      return c.name + ' · ' + c.day + ' · ' + c.time + ' · ' + c.room +
        '. The class keeps running. Only the date you pick here is called off.';
    },

    body: function (ctx) {
      var c = cls(ctx);
      var dates = sessionDates(c, 4);
      var keys = dates.map(dateKey);
      var picked = Grove.filter('cancelSession', keys[0]);
      if (keys.indexOf(picked) === -1) picked = keys[0];
      var when = dates[keys.indexOf(picked)] || null;

      var pick = ui.card({
        title: 'Which session?',
        note: dates.length
          ? 'The next dates this class runs, worked out from its day and time.'
          : ''
      }, dates.length
        ? ui.choices(null, dates.map(function (d, i) {
            return ui.choice({
              id: keys[i],
              act: 'pickSession',
              title: longLabel(d),
              /* The hour and the room are the same on every option and are
                 already in the page sub, so the only thing that differs
                 between these four lines is how far off the date is. */
              sub: awayText(d),
              on: keys[i] === picked
            });
          }))
        : ui.empty('No dated session', 'This class has no further date in the studio calendar.')
      );

      var lines = [];
      if (c.en) {
        lines.push({
          title: esc(plural(c.en, 'child gets a class to make up', 'children get a class to make up')),
          sub: esc(whoLine(c))
        });
        lines.push({
          title: c.en === 1 ? 'Their family is told' : 'Their families are told',
          sub: esc('A message goes out naming ' + (when ? longLabel(when) : 'the date') +
            ', with how to book the make-up.')
        });
        lines.push({
          title: 'No money moves',
          sub: 'A make-up credit is counted in classes, never in money. Nothing is refunded and nothing is charged.'
        });
      } else {
        lines.push({
          title: 'Nobody is enrolled yet',
          sub: 'No message goes out, no credit is issued and no money moves either way.'
        });
      }
      lines.push({
        title: esc(c.room + ' frees up'),
        sub: esc(c.time + ' on that date opens for a private class or a make-up hour.')
      });
      if (c.staff !== 'Unassigned') {
        lines.push({
          title: esc(c.staff + ' loses the shift'),
          sub: 'The hour comes off their schedule. Check it against their week before you confirm.'
        });
      }

      var what = ui.card({
        title: 'What cancelling does',
        flush: true,
        note: 'Cancelling the whole class, rather than one date, is done from Programs — it releases the room for the term.'
      }, ui.rows(lines));

      var hint = c.en
        ? plural(c.en, 'child', 'children') + ' · ' +
          plural(c.en, 'class to make up', 'classes to make up') + ' · no money moves'
        : 'Nobody is enrolled, so nothing is sent';

      var done = c.en
        ? 'Cancelled · ' + plural(c.en, 'family told', 'families told') + ' and ' +
          plural(c.en, 'class to make up issued', 'classes to make up issued')
        : 'Cancelled · nobody was enrolled, so nothing was sent';

      var buttons = when
        ? [
            { label: 'Cancel ' + longLabel(when), kind: 'danger', msg: done },
            { label: 'Keep the session', to: 'classRecord', id: c.id }
          ]
        : [{ label: 'Back to the class', to: 'classRecord', id: c.id }];

      return ui.grid('sidebar', [pick, what]) +
        ui.formActions(buttons, {
          sticky: true,
          hint: when ? hint : 'There is no dated session to cancel'
        });
    }
  });

  /* The children a cancellation reaches. Eighteen names will not sit on one
     line, so a long roll names the first three and counts the rest off the
     same list — the roster card above has every one of them. */
  function whoLine(c) {
    var names = roster(c).map(function (k) { return k.name; });
    if (names.length <= 4) return names.join(', ');
    return names.slice(0, 3).join(', ') + ' and ' + plural(names.length - 3, 'other', 'others');
  }

  /* ---- matching ------------------------------------------------------------ */

  function cls(ctx) {
    var id = ctx && ctx.params ? ctx.params.id : null;
    return D.CLASSES.filter(function (c) { return c.id === id; })[0] ||
           D.CLASSES.filter(function (c) { return c.id === 'c2'; })[0];
  }

  /* The children on this class's roll, in the order a roll is read. A child
     carries the ids of the classes they are in, so this is a lookup, not a
     guess at what their timetable line meant. */
  function roster(c) {
    return D.roster(c.id).slice().sort(function (a, b) {
      return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0);
    });
  }

  function weekOf(name) {
    var m = /week \d+/.exec(String(name).toLowerCase());
    return m ? m[0] : null;
  }

  /* The child a private class is named for: "Private · Zara Okafor" → "zara". */
  function namedChild(c) {
    var parts = String(c.name).split('· ');
    var who = String(parts[parts.length - 1] || '').split(' ')[0];
    return who.toLowerCase();
  }

  /* A waitlist row names its class by the day and the hour it starts ("Mon
     3:15pm · Ages 8–11"), which is the same key the dataset counts class.wl
     on, so the card and the count cannot disagree. */
  function waitlist(c) {
    var key = c.day + ' ' + startTime(c);
    return D.WAITLIST.filter(function (w) { return String(w.cls).indexOf(key) === 0; });
  }

  /* A lesson plan names its class in free text too ("Mon 3:15pm · ages 8–11",
     "Camp week 4 · Wed", "Private · Zara O."), so it is matched the same way:
     the camp week and its room, the child a private class is named for, or the
     day plus the start time. */
  function lessonsFor(c) {
    var week = weekOf(c.name);
    var child = c.prog === 'priv' ? namedChild(c) : null;
    return D.LESSON_PLANS.filter(function (lp) {
      var text = String(lp.cls).toLowerCase();
      if (week) return text.indexOf(week) !== -1 && lp.room === c.room;
      if (child) return text.indexOf(child) !== -1;
      var dayHit = dayTokens(c).some(function (d) { return text.indexOf(d.toLowerCase()) !== -1; });
      return dayHit && text.indexOf(startTime(c)) !== -1;
    });
  }

  /* A make-up credit names the session it was missed against ("Mon 20 Jul ·
     3:15pm"), which is this class when the day and the start time both match. */
  function makeupsFor(c) {
    return D.MAKEUPS.filter(function (m) {
      var text = String(m.missed).toLowerCase();
      var dayHit = dayTokens(c).some(function (d) { return text.indexOf(d.toLowerCase()) !== -1; });
      return dayHit && text.indexOf(startTime(c)) !== -1;
    });
  }
})();
