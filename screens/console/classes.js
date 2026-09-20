/* Console → Classes (list + week calendar), one class record, a new class, an
   edited class, and cancelling one dated session.

   THIS PASS — EVERY ACTION OPENS A REAL SCREEN

   'New class', 'Edit class' and 'Assign an instructor' were toasts. A class is
   a row the studio will keep in a table, so each is now a form that asks for
   exactly the columns that row carries: program, day, start and end time, room,
   age band, places, instructor. Assigning an instructor is the instructor field
   on the edit form rather than a screen of its own, and the record's action
   opens that form with everything else already answered.

   Neither form asks for a price. The program decides how a place in it is paid
   for — one of the five models in D.PRICING_MODELS — and the form states which
   one this program uses and what it charges, read from D.PRICING, beside a
   button to the program where those figures are set. That is the whole answer
   to why one program reads "4 hours a month", another "a week" and another
   "Clay Night": the owner picks how a program is priced, and the price table
   follows. A class priced by the hour is never asked for a week price because
   no class is asked for a price at all.

   Simplified while writing them, and said here so nothing looks lost:
     - no class name field where the program names its classes by their length.
       '1 hour · After-School' names itself; a camp week, a dated no-school day,
       a pop-up and a birthday do not, so only those are asked
     - no age band on a program booked one child or one party at a time
     - no empty form. Choosing the program fills the day, the hour, the room,
       the places and the band with what that program already runs, and each
       field says what it ran into — which class already holds that room at that
       hour, which days the program has nothing on

   Fitted to Sabrina, the owner. She is at a desk with a keyboard, she reads
   tables, and she comes here for two things: who is in a room, and whether a
   room is over its capacity. Density is right on this screen. Ceremony is not.

   This pass moves the screen onto the final pricing model. A plan is HOURS A
   MONTH — 4, 8, 12 or 16 — and only After-School has one. A class spends its
   own length: an hour class spends an hour, the Thursday two-hour class spends
   two, so a child on sixteen hours comes eight times or sixteen depending on
   how the parent split them. Everything else in the studio — camp, no-school
   days, private classes, pop-ups, birthdays — is a one-off booking with no
   plan and no cycle. What that changed here:

     - the roster's "Pack" column. It read D.pack, which no longer carries
       anything (a child carries planHours now), so it was printing a blank
       column while still talking about packs. It is now "Plan", read off
       D.plan: the hours the child buys a month, and how many of them this
       cycle has used
     - the pack vocabulary everywhere else — "spends a session", "renews when
       its last session is used", "a number of classes away". An invoice is
       raised on a child's last class of the cycle and covers the next one, so
       the roster counts the children whose cycle ends in this room
     - the Absences card, which said a session "stays in the pack". The signed
       rule is simpler and harder: cancel in the portal at least 24 hours ahead
       and the child gets a make-up; later than that, or a no-show, and the
       class counts as attended. The notice period, where a make-up may be
       taken, what a late cancellation costs and the make-up window all come
       from D.RULES word for word — the window reads whichever of the two
       settings is current — so Settings decides them and this file does not
     - the cancel screen, which promised the pack would last a week longer. The
       studio called the date off, so no hours come off anybody's plan

   Exceptions are not modelled here. A child whose school runs a week later
   than the programme, a private class that comes up, an event — each of those
   is one manual charge on the family's billing, which is exactly why this
   screen carries no control for any of them.

   What earlier passes cut, and this one keeps cut:
     - the seven programme chips. Twelve classes fit on one screen without
       scrolling, so the answer was always "All programs". The programme is
       already named in full under every class name
     - "The class" card on the record — a third printing of the eyebrow, the sub
       and the flag pills sitting directly above it
     - "What a place costs" on the record: four plan prices she cannot change
       here and that are identical for every class in the programme. The record
       states once, in the sub, how a place is paid for and where prices live
     - the header's "Lesson plan" button, which opened the plan the Lesson plans
       card already lists: two controls, one decision
     - "64 of 80 places" under each calendar day, which adds up five unrelated
       rooms. The day foot reads "15 places left" — the part she can sell

   Everything counted here is counted off the rows being shown. The roster is
   the class — D.roster(id) returns the children on the roll — so "12 enrolled"
   is the length of the list printed underneath it, the invoice pill counts the
   children in that same list whose cycle ends in this room, and the waitlist
   pill counts the rows in its own card. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  var WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var WEEK_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];

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

  /* A rule in D.RULES is written as its own sentence. This drops one into the
     middle of another sentence without restating it in different words. */
  function lowerFirst(text) {
    var s = String(text);
    return s.charAt(0).toLowerCase() + s.slice(1);
  }

  /* '2:15–3:15pm' -> '2:15pm'; '10:00am–1:00pm' -> '10:00am'. */
  function startTime(c) {
    var parts = String(c.time).split('–');
    var a = String(parts[0] || '').toLowerCase();
    if (a.indexOf('am') !== -1 || a.indexOf('pm') !== -1) return a;
    var b = String(parts[1] || '').toLowerCase();
    return a + (b.indexOf('am') !== -1 ? 'am' : (b.indexOf('pm') !== -1 ? 'pm' : ''));
  }
  function endTime(c) {
    var parts = String(c.time).split('–');
    return String(parts[parts.length - 1] || '').toLowerCase();
  }

  /* '3:15pm' -> 915, so a day column can be read straight down. */
  function minutesOf(text) {
    var m = /^(\d{1,2}):(\d{2})(am|pm)$/.exec(String(text));
    if (!m) return null;
    var hour = parseInt(m[1], 10) % 12;
    if (m[3] === 'pm') hour += 12;
    return hour * 60 + parseInt(m[2], 10);
  }
  function startMinutes(c) {
    var n = minutesOf(startTime(c));
    return n === null ? 0 : n;
  }

  /* How long one class runs, read off the same When column the table prints:
     '4:30–6:30pm' is two hours, and two hours is what it takes off a plan. */
  function spanHours(from, to) {
    var a = minutesOf(from), b = minutesOf(to);
    if (a === null || b === null || b <= a) return 0;
    return Math.round(((b - a) / 60) * 10) / 10;
  }
  function classHours(c) {
    return spanHours(startTime(c), endTime(c));
  }
  function hoursPhrase(n) { return plural(n, 'hour', 'hours'); }

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

  /* The next few dates a class runs, walked forward from today across the
     class's own days. */
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

  /* Somewhere else in the same programme that takes the same ages and still has
     a place free. Read off the class rows, so the answer changes when they do. */
  function elsewhereFor(c) {
    return D.CLASSES.filter(function (o) {
      return o.id !== c.id && o.prog === c.prog && o.band === c.band && placesLeft(o) > 0;
    });
  }

  /* What an over-capacity room leaves her to decide, written off the rows. The
     thirteenth child is an ordinary enrollment, so the choice is the room or the
     roll — and whether another class in the band could take the place. */
  function overOptions(c) {
    var alt = elsewhereFor(c);
    if (!alt.length) {
      var band = bandLine(c);
      return 'No other ' + prog(c).name + ' class takes ' +
        (band ? band.charAt(0).toLowerCase() + band.slice(1) : 'these ages') +
        ', so the place has nowhere to move. Either the room takes ' + c.en +
        ' or the roll comes down.';
    }
    return 'A place could move to ' + alt.map(function (o) {
      return o.day + ' ' + startTime(o) + ' · ' + o.room + ', ' + plural(placesLeft(o), 'place free', 'places free');
    }).join('; ') + '.';
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
        text: c.en + ' children hold a place in a room set for ' + c.cap + '. ' + overOptions(c) +
          ' The roster names every child holding one.',
        action: { label: 'Open the class', to: 'classRecord', id: c.id }
      });
    }
    return ui.notice({
      kind: 'bad',
      title: plural(list.length, 'class is over capacity', 'classes are over capacity'),
      text: list.map(function (c) {
        return c.room + ' · ' + c.day + ' ' + startTime(c) + ' · ' + c.en + ' of ' + c.cap;
      }).join('; ') + '. Open each one to see the roll and where a place could go.'
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
      { label: 'New class', kind: 'primary', to: 'newClass' }
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
     the three flag pills; the old price card listed four plan prices she cannot
     change from here, so the record states in one line how a place is paid for
     and where the prices live. */

  /* How a place here is paid for. After-School is the only programme with a
     plan, and a plan is hours a month: this class takes its own length out of
     them. Everything else is booked and paid for once. */
  function priceLine(c) {
    var hrs = classHours(c);
    if (c.prog === 'as') {
      return 'A class here uses ' + (hrs ? hoursPhrase(hrs) : 'hours') +
        ' of the child’s monthly plan, and a plan runs to ' + D.PLAN_YEAR.ends +
        ' and ends there. Plan prices are set under Programs.';
    }
    return 'A place here is a one-off booking on ' + prog(c).name +
      ' — no plan and no cycle — paid for when it is booked, the same for every class in the ' +
      'programme, and the prices are set under Programs.';
  }

  var recordDef = {
    surface: 'console',
    crumbs: [{ label: 'Classes', to: 'classes' }],
    eyebrow: function (ctx) { return prog(cls(ctx)).name; },
    title: function (ctx) { return cls(ctx).name; },
    sub: function (ctx) {
      var c = cls(ctx);
      return c.day + ' · ' + c.time + ' · ' + c.room + '. ' + priceLine(c);
    },

    /* The class already has an instructor on almost every record, so asking for
       one is only the primary action when there is nobody teaching it. Both
       open the same form — assigning an instructor is one field on it, not a
       screen of its own. */
    actions: function (ctx) {
      var c = cls(ctx);
      return [
        { label: 'Cancel a session', kind: 'danger', to: 'classCancel', id: c.id },
        c.staff === 'Unassigned'
          ? { label: 'Assign an instructor', kind: 'primary', to: 'editClass', id: c.id }
          : { label: 'Edit class', kind: 'primary', to: 'editClass', id: c.id }
      ];
    },

    body: function (ctx) {
      var c = cls(ctx);
      var kids = roster(c);
      var waiting = waitlist(c);
      var plans = lessonsFor(c);
      var missed = absencesIn(c);

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
            text: c.en + ' children hold a place in ' + c.room + ', which is set for ' + c.cap +
              '. ' + overOptions(c) + ' Nobody has been turned away and no money moves either way.',
            action: {
              label: 'Set the room to ' + c.en,
              msg: 'Saved · ' + c.room + ' is set for ' + c.en + (c.en === 1 ? ' place' : ' places')
            }
          })
        : '';

      /* Eight to eighteen children, so the roll is a table: one line each, and
         age, attendance, the child's plan and the safety note read down their
         columns rather than being folded into a sentence under the name. */
      var flagged = kids.filter(function (k) { return !!k.flag; });
      var urgent = flagged.some(function (k) { return k.flagKind === 'bad'; });

      /* Only After-School runs on a plan. On a camp or a pop-up roll the column
         would say nothing about what that class cost, so it is left off. */
      var planCol = c.prog === 'as' && kids.some(function (k) { return D.plan(k).isPlan; });
      var invoicing = !planCol ? [] : kids.filter(function (k) { return invoicedHere(k, c); });

      var cols = ['Child',
                  { label: 'Age', align: 'right', shrink: true },
                  { label: 'Attendance', align: 'right', shrink: true }];
      if (planCol) cols.push('Plan');
      cols.push('Safety note');

      var rosterNote = [];
      if (flagged.length) {
        rosterNote.push('Safety notes here are the ones every teacher sees on this roster and on the attendance sheet.');
      }
      if (planCol) {
        rosterNote.push('A plan is hours a month, not classes, and a class here uses ' +
          (classHours(c) ? hoursPhrase(classHours(c)) : 'hours') + ' of them. The invoice is raised ' +
          'on a child’s last class of the cycle and covers the dates of the next one.');
      }

      var rosterCard = ui.card({
        title: 'Roster',
        head: '<span class="inline">' +
          (flagged.length
            ? ui.pill(plural(flagged.length, 'safety note', 'safety notes'), urgent ? 'bad' : 'warn')
            : '') +
          (invoicing.length
            ? ui.pill(plural(invoicing.length, 'invoice raised in this class', 'invoices raised in this class'))
            : '') +
          '<span class="mute">' + esc(kids.length + ' enrolled') + '</span></span>',
        flush: true,
        note: rosterNote.join(' ')
      }, kids.length
        ? ui.table(cols, kids.map(function (k) { return kidRow(k, planCol); }))
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

      /* There is nothing to settle here, so this card is a record, not a queue.
         The only thing worth reading on a row is whether the class was counted
         as attended, which is the one thing 24 hours of notice decides. */
      var counted = missed.filter(function (a) { return !!a.spent; });
      var absences = ui.card({
        title: 'Absences',
        head: '<span class="inline">' +
          (counted.length ? ui.pill(counted.length + ' counted as attended', 'warn') : '') +
          '<span class="mute">' + esc(plural(missed.length, 'absence', 'absences')) + '</span></span>',
        flush: true,
        note: 'Cancelled in the portal at least ' + D.RULES.cancelNotice +
          ' before the class, the child gets a make-up. ' + D.RULES.makeupWhere +
          ' Later than that, or a no-show: ' + lowerFirst(D.RULES.lateCancel) +
          ' Make-up window: ' + D.RULES.makeupWindow + ', set under Settings.'
      }, ui.rows(missed.map(function (a) {
        return {
          title: esc(a.child),
          sub: esc(a.date + ' · ' + a.reason),
          end: a.spent
            ? ui.pill('Counted as attended', 'warn')
            : ui.pill('Make-up offered', 'ok')
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
      if (missed.length) extra.push(absences);

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

  /* A family that has given notice keeps its hours to the end of the school
     year; there is simply no invoice after this cycle. The dataset says so on
     the family's plan, so a child of that family is never counted as an
     invoice about to be raised. */
  function billsAgain(k) {
    var fam = D.FAMILIES.filter(function (f) { return f.name === k.family; })[0];
    return !fam || String(fam.plan).indexOf('not renewing') === -1;
  }

  /* The invoice for the next cycle is raised on the child's last class of this
     one. Sophia's last class is her Thursday two-hour, so she is counted on
     that roster and not on the two she also attends. */
  function invoicedHere(k, c) {
    var p = D.plan(k);
    return p.isPlan && billsAgain(k) && !!p.renewsOn && p.renewsOn.classId === c.id;
  }

  /* Where one child's plan stands: the hours they buy a month, and how many of
     them this cycle has already used. Hours, never classes — this class takes
     its own length out of them. */
  function planCell(k) {
    var p = D.plan(k);
    if (!p.isPlan) return ui.mute('—');
    return ui.two(plural(p.hours, 'hour a month', 'hours a month'),
      p.usedHours + ' of ' + p.hours + ' hours used this cycle');
  }

  /* One line of the roll. The family is under the name because two children
     on the same roster can share a first name. */
  function kidRow(k, planCol) {
    var cells = [
      ui.two(k.name, k.family + ' family'),
      ui.mute(String(k.age)),
      ui.mute(k.att)
    ];
    if (planCol) cells.push(planCell(k));
    cells.push(k.flag ? ui.pill(k.flag, k.flagKind) : '<span class="mute">—</span>');
    return { to: 'studentRecord', id: k.id, cells: cells };
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

  /* ---- new class, and editing one -------------------------------------------
     'New class', 'Edit class' and 'Assign an instructor' were three toasts. A
     class is a row the studio will keep in a table, so each of them is now a
     screen that asks for exactly what that row carries: the program it belongs
     to, the day, the start and end time, the room, the age band, how many
     places, and who teaches it.

     Assigning an instructor is not a screen of its own. It is the instructor
     field on this form, and the record's 'Assign an instructor' action opens the
     form with everything else already filled in.

     What the form does not ask for, and why:
       - a price. The program decides how a place in it is paid for — one of the
         five ways in D.PRICING_MODELS — and the card states which one this
         program uses and what it charges, read from D.PRICING, with a button to
         the program where those figures are set. A class priced by the hour is
         never asked for a week price, because no class is asked for a price
       - a name, where the program names its classes by their length. An
         After-School class is '1 hour · After-School'. A camp week, a no-school
         day, a pop-up and a birthday each carry something a length cannot say,
         so only those are asked for a name
       - an age band on a program booked one child at a time
       - anything the program already answers. Choosing the program fills in the
         day, the time, the room, the places and the band with what that program
         already runs, so the owner changes what differs instead of typing a
         class out from nothing

     Every option comes off the rows: the rooms and the clock are the ones the
     studio already uses, the instructors are D.STAFF, and an instructor who has
     not accepted their invitation is not on the list. */

  var PROG_KEY = 'newClassProg';
  var NOBODY = 'Nobody yet';

  Grove.on('pickClassProg', function (d) { Grove.setFilter(PROG_KEY, d.id); });

  function uniq(list) {
    var out = [];
    list.forEach(function (v) {
      if (v === '' || v === null || v === undefined) return;
      if (out.indexOf(v) === -1) out.push(v);
    });
    return out;
  }

  /* The value a set of rows holds most often — how every default on this form
     is arrived at, so a suggestion is always something the studio already does. */
  function modeOf(list, get) {
    var counts = {}, order = [], best = '', top = 0;
    list.forEach(function (x) {
      var v = get(x);
      if (v === '' || v === null || v === undefined) return;
      if (counts[v] === undefined) { counts[v] = 0; order.push(v); }
      counts[v] += 1;
    });
    order.forEach(function (v) { if (counts[v] > top) { top = counts[v]; best = v; } });
    return best;
  }

  function classesIn(progId) {
    return D.CLASSES.filter(function (c) { return c.prog === progId; });
  }
  function classesInRoom(room) {
    return D.CLASSES.filter(function (c) { return c.room === room; });
  }
  function money(n) {
    return Grove.money(n, { cents: n !== Math.round(n) });
  }

  /* ---- the lists every field chooses from --------------------------------- */

  function roomOptions() {
    return uniq(D.CLASSES.map(function (c) { return c.room; }));
  }
  function bandOptions() {
    return uniq(D.CLASSES.map(function (c) { return c.band; })).filter(function (b) {
      return b !== '—';
    });
  }
  /* The studio's own clock: every hour a class already starts or ends at. */
  function timeOptions() {
    var all = [];
    D.CLASSES.forEach(function (c) { all.push(startTime(c)); all.push(endTime(c)); });
    return uniq(all).sort(function (a, b) { return minutesOf(a) - minutesOf(b); });
  }
  function dayOptions() {
    return WEEK.concat(uniq(D.CLASSES.map(function (c) { return c.day; })).filter(function (d) {
      return WEEK.indexOf(d) === -1;
    }));
  }
  function teaches(s) {
    return s.role === 'Instructor' && s.status !== 'Invitation sent';
  }
  function invitedStaff() {
    return D.STAFF.filter(function (s) {
      return s.role === 'Instructor' && s.status === 'Invitation sent';
    });
  }
  function staffOptions() {
    return [NOBODY].concat(D.STAFF.filter(teaches).map(function (s) { return s.name; }));
  }
  function staffValue(c) {
    return !c || c.staff === 'Unassigned' ? NOBODY : c.staff;
  }

  function dayWord(day) {
    var i = WEEK.indexOf(day);
    return i === -1 ? day : 'a ' + WEEK_LONG[i];
  }

  /* ---- what the program already answers ------------------------------------ */

  /* runsOn answers for one day. A class being written may carry a pattern —
     'Mon–Fri' — so these two spread that pattern back out into its days and ask
     whether an existing class stands on any of them. */
  function daysOf(pattern) {
    var t = String(pattern).split(/[^A-Za-z]+/).filter(Boolean);
    if (t.length < 2) return t;
    var from = WEEK.indexOf(t[0]), to = WEEK.indexOf(t[t.length - 1]);
    if (from === -1 || to === -1) return t;
    return WEEK.slice(from, to + 1);
  }
  function sharesADay(c, pattern) {
    return daysOf(pattern).some(function (d) { return runsOn(c, d); });
  }

  /* Two classes in one room at one hour is the one thing a suggestion must not
     walk into, so the hour a class is offered is checked against the room. */
  function overlaps(from, to, otherFrom, otherTo) {
    var a = minutesOf(from), b = minutesOf(to);
    var x = minutesOf(otherFrom), y = minutesOf(otherTo);
    if (a === null || b === null || x === null || y === null) return false;
    return a < y && x < b;
  }
  function firstFreeDay(list) {
    var free = WEEK.filter(function (d) {
      return !list.some(function (c) { return runsOn(c, d); });
    });
    return free.length ? free[0] : '';
  }

  /* A program whose classes all run one multi-day pattern keeps it. A program
     with one class copies that class. Anything else is offered the first day of
     the week it has nothing on. */
  function suggestedDay(list) {
    var patterns = uniq(list.map(function (c) { return c.day; }));
    if (patterns.length === 1 && dayTokens({ day: patterns[0] }).length > 1) return patterns[0];
    if (list.length < 2) return patterns[0] || WEEK[0];
    return firstFreeDay(list) || modeOf(list, function (c) { return c.day; }) || WEEK[0];
  }

  /* A program booked one child at a time writes its band as '—', so it is never
     asked for one. */
  function oneToOne(progId) {
    var list = classesIn(progId);
    return !!list.length && list.every(function (c) { return c.band === '—'; });
  }

  /* An After-School class is named by its length. A camp week, a dated
     no-school day, a pop-up and a birthday are not, so those are asked. */
  function namedByLength(c) {
    var hrs = classHours(c);
    return !!hrs && String(c.name).indexOf(hrs + ' hour') === 0;
  }
  function needsName(progId) {
    var list = classesIn(progId);
    return !list.length || !list.every(namedByLength);
  }

  function suggested(progId) {
    var list = classesIn(progId);
    var times = timeOptions();
    var room = modeOf(list, function (c) { return c.room; }) || roomOptions()[0];
    var band = modeOf(list, function (c) { return c.band; });
    var day = suggestedDay(list);
    var from = modeOf(list, startTime) || times[0];
    var to = modeOf(list, endTime) || times[times.length - 1];

    /* Copying the program's own hour into its own room would hand her the class
       she already has, so where that happens the day moves to one the program
       has free. */
    var taken = daysOf(day).length === 1 && classesInRoom(room).some(function (x) {
      return sharesADay(x, day) && overlaps(from, to, startTime(x), endTime(x));
    });
    if (taken) day = firstFreeDay(list) || day;

    return {
      prog: progId,
      name: '',
      day: day,
      from: from,
      to: to,
      room: room,
      band: band && band !== '—' ? band : bandOptions()[0],
      cap: modeOf(list, function (c) { return String(c.cap); }) ||
           modeOf(classesInRoom(room), function (c) { return String(c.cap); }) ||
           modeOf(D.CLASSES, function (c) { return String(c.cap); }),
      staff: NOBODY
    };
  }

  function held(c) {
    return {
      prog: c.prog,
      name: c.name,
      day: c.day,
      from: startTime(c),
      to: endTime(c),
      room: c.room,
      band: c.band,
      cap: String(c.cap),
      staff: staffValue(c)
    };
  }

  /* ---- what each answer runs into ------------------------------------------ */

  function dayHint(progId, day, skipId) {
    var name = prog({ prog: progId }).name;
    var clash = classesIn(progId).filter(function (c) {
      return c.id !== skipId && sharesADay(c, day);
    });
    if (!clash.length) return 'Nothing else in ' + name + ' runs on ' + dayWord(day) + '.';
    return plural(clash.length, 'other class', 'other classes') + ' in ' + name + ' ' +
      (clash.length === 1 ? 'runs' : 'run') + ' on ' + dayWord(day) + ', at ' +
      uniq(clash.map(startTime)).join(' and ') + '.';
  }

  /* What else is in that room on that day, and whether any of it is at this
     hour — stated as a fact, because two camp weeks share a room legitimately
     and only the calendar knows which week is which. */
  function roomHint(v, skipId) {
    var sameDay = classesInRoom(v.room).filter(function (c) {
      return c.id !== skipId && sharesADay(c, v.day);
    });
    if (!sameDay.length) return v.room + ' has nothing else on ' + dayWord(v.day) + '.';
    var at = sameDay.filter(function (c) {
      return overlaps(v.from, v.to, startTime(c), endTime(c));
    });
    var times = uniq((at.length ? at : sameDay).map(function (c) { return c.time; })).join(', ');
    return v.room + ' already holds ' + times + ' on ' + dayWord(v.day) +
      (at.length ? ', which is this hour.' : ', none of it at this hour.');
  }

  function bandHint(progId, skipId) {
    var bands = uniq(classesIn(progId).filter(function (c) {
      return c.id !== skipId;
    }).map(function (c) { return c.band; })).filter(function (b) { return b !== '—'; });
    if (!bands.length) return 'No other class in this program names an age band.';
    return prog({ prog: progId }).name + ' already covers ' + bands.join(', ') + '.';
  }

  /* On a new class the room says what it usually holds. On one with children in
     it, the roll says how far the number can come down. */
  function placesHint(v, c) {
    if (!c) {
      var inProg = classesIn(v.prog);
      var usual = modeOf(inProg, function (x) { return String(x.cap); });
      if (usual) {
        return prog({ prog: v.prog }).name + ' runs ' + usual +
          (usual === '1' ? ' place a class.' : ' places a class.');
      }
      usual = modeOf(classesInRoom(v.room), function (x) { return String(x.cap); });
      return usual
        ? v.room + ' is set for ' + usual + (usual === '1' ? ' place' : ' places') +
          ' on the classes it already holds.'
        : 'The room decides the number.';
    }
    var kids = roster(c), waiting = waitlist(c);
    var line = kids.length
      ? plural(kids.length, 'child holds a place', 'children hold a place') +
        ', so the room cannot go below ' + kids.length + ' without turning somebody away.'
      : 'Nobody is enrolled, so this number is free to change.';
    if (waiting.length) {
      line += ' ' + plural(waiting.length, 'child is waiting', 'children are waiting') +
        ' — raising it offers the first name on the list a place, at the usual price.';
    }
    return line;
  }

  function staffHint() {
    var inv = invitedStaff();
    if (!inv.length) return 'Whoever holds it sees the roster and the safety notes on it.';
    return inv.map(function (s) { return s.name; }).join(' and ') + ' has not accepted ' +
      (inv.length === 1 ? 'their invitation' : 'their invitations') +
      ' yet, so they are not on this list.';
  }

  /* ---- what a place here costs ---------------------------------------------
     The program's pricing model decides what the price table holds, which is why
     this screen has no price field: every class in a program is paid for the
     same way, and the figures live on the program. */

  function planTiers(p) {
    return Object.keys(p.plans).map(function (k) {
      return parseInt(String(k).slice(1), 10);
    }).sort(function (a, b) { return a - b; });
  }

  function priceRows(progId) {
    var p = D.PRICING[progId] || {};
    var m = D.pricingModel(progId);
    var rows = [];
    if (m.id === 'plan') {
      planTiers(p).forEach(function (hours) {
        rows.push([plural(hours, 'hour a month', 'hours a month'), esc(money(p.plans['p' + hours]))]);
      });
    } else if (m.id === 'perWeek') {
      rows.push(['A full week', esc(money(p.week))]);
      rows.push(['A single day', esc(money(p.day))]);
      rows.push(['An extra hour', esc(money(p.extraHour))]);
    } else if (m.id === 'perHour') {
      if (p.hourly) {
        rows.push(['An hour', esc(money(p.hourly))]);
      } else {
        rows.push(['A standard day', esc(money(p.base))]);
        rows.push(['Each hour after that', esc(money(p.extraHour))]);
      }
      if (p.maxHours) rows.push(['Longest booking', esc(plural(p.maxHours, 'hour', 'hours'))]);
    } else if (m.id === 'perEvent') {
      (p.events || []).forEach(function (e) {
        rows.push([e.label, esc(money(e.amount))]);
      });
    }
    rows.push(['Registration fee', p.regFee
      ? esc(money(p.regFee) + (p.regFeePer ? ' per ' + p.regFeePer : ''))
      : 'None']);
    return rows;
  }

  /* The shortest true statement of a program's price, in its own unit — which is
     the answer to why these read differently from one program to the next. */
  function priceSummary(progId) {
    var p = D.PRICING[progId] || {};
    var m = D.pricingModel(progId);
    if (m.id === 'plan') {
      var tiers = planTiers(p);
      return money(p.plans['p' + tiers[0]]) + '–' + money(p.plans['p' + tiers[tiers.length - 1]]);
    }
    if (m.id === 'perWeek') return money(p.week) + ' ' + m.unit;
    if (m.id === 'perHour') return money(p.hourly || p.base) + ' ' + (p.hourly ? m.unit : 'a day');
    if (m.id === 'perEvent') return money((p.events[0] || {}).amount) + ' ' + m.unit;
    return 'Quoted';
  }

  function priceCard(progId) {
    var m = D.pricingModel(progId);
    var name = prog({ prog: progId }).name;
    return ui.card({
      title: 'What a place here costs',
      head: ui.pill(m.name),
      note: m.asks + ' Prices belong to the program, so this page never asks for one — every ' +
        'class in ' + name + ' is paid for the same way.',
      foot: '<span class="hint">Set under Programs</span>' +
        ui.btn({ label: 'Open ' + name, kind: 'quiet', size: 'sm', to: 'programBuilder', id: progId })
    }, m.id === 'quoted' ? ui.empty('Nothing to set', m.asks) : ui.kv(priceRows(progId)));
  }

  /* ---- the questions -------------------------------------------------------
     One card, one question, in the order they would be asked at the desk. A
     class that already exists arrives with every answer filled in. */

  function nameCard(v, progId) {
    var example = classesIn(progId)[0];
    return ui.card({
      title: 'What is it called?',
      note: 'Families see this name on the schedule and at registration.'
    }, ui.fields(null, [
      ui.field({
        label: 'Class name',
        hint: example
          ? 'The others in this program read ' +
            uniq(classesIn(progId).map(function (c) { return c.name; })).join(', ') + '.'
          : 'The first class in this program, so the name is yours to pick.',
        control: ui.input({
          value: v.name,
          placeholder: example ? 'For example, ' + example.name : 'What families will see'
        })
      })
    ]));
  }

  function whenCard(v, c) {
    var progId = v.prog;
    var hrs = spanHours(v.from, v.to);
    var note = needsName(progId)
      ? 'The schedule, the week calendar and every roster read the day and the hour from here.'
      : 'Classes in ' + prog({ prog: progId }).name + ' are named by their length — ' +
        uniq(classesIn(progId).map(function (x) { return x.name; })).join(', ') +
        ' — so this one takes its name the same way.';
    return ui.card({
      title: 'When does it run?',
      head: hrs ? ui.pill(hoursPhrase(hrs)) : '',
      note: note
    }, ui.fields(2, [
      ui.field({
        label: 'Day',
        span: true,
        hint: dayHint(progId, v.day, c ? c.id : ''),
        control: ui.select({ options: dayOptions(), value: v.day })
      }),
      ui.field({
        label: 'Starts',
        control: ui.select({ options: timeOptions(), value: v.from })
      }),
      ui.field({
        label: 'Ends',
        hint: progId === 'as'
          ? 'The length is what a class takes off a monthly plan.'
          : 'The studio’s own hours, as the schedule already reads them.',
        control: ui.select({ options: timeOptions(), value: v.to })
      })
    ]));
  }

  function whereCard(v, c) {
    var progId = v.prog;
    var noBand = c ? c.band === '—' : oneToOne(progId);
    var list = [
      ui.field({
        label: 'Room',
        hint: roomHint(v, c ? c.id : ''),
        control: ui.select({ options: roomOptions(), value: v.room })
      })
    ];
    if (!noBand) {
      list.push(ui.field({
        label: 'Age band',
        hint: bandHint(progId, c ? c.id : ''),
        control: ui.select({ options: bandOptions(), value: v.band })
      }));
    }
    list.push(ui.field({
      label: 'How many places',
      hint: placesHint(v, c),
      control: ui.input({ type: 'number', value: v.cap })
    }));

    return ui.card({
      title: noBand ? 'Where it happens' : 'Where it happens, and who it is for',
      note: noBand
        ? prog({ prog: progId }).name + ' is booked one child or one party at a time, so it ' +
          'carries no age band. The places are how many the room takes.'
        : 'The band is how the room is grouped, and it is what a family is offered at registration.'
    }, ui.fields(2, list));
  }

  function whoCard(v, c) {
    var none = v.staff === NOBODY;
    var lead = c && none
      ? ui.notice({
          kind: 'bad',
          title: 'Nobody is teaching this class',
          text: 'It is flagged on the Classes list and on the day it runs until somebody holds it. ' +
            'Choose an instructor and they see it as soon as you save.'
        })
      : '';
    return ui.card({
      title: 'Who teaches it?',
      note: none
        ? (c ? 'Choose one and the class moves onto their week the moment you save.'
             : 'A class can be created without one — it reads as unassigned until somebody holds it.')
        : 'The class goes on their schedule, with the roster and the safety notes on it.',
      foot: '<span class="hint">' + esc(staffHint()) + '</span>' +
        ui.btn(invitedStaff().length
          ? { label: 'Invite a teacher', kind: 'quiet', size: 'sm', to: 'inviteStaff' }
          : { label: 'Open Staff', kind: 'quiet', size: 'sm', to: 'staff' })
    }, lead + (lead ? '<div class="card-split">' : '') + ui.fields(null, [
      ui.field({
        label: 'Instructor',
        control: ui.select({ options: staffOptions(), value: v.staff })
      })
    ]) + (lead ? '</div>' : ''));
  }

  /* Only the edit form carries this as a field: on a new class the program is
     the choice that opens the form, and on an existing one it is a column like
     any other — one the owner can see, with what moving it would mean. */
  function programCard(v, c) {
    var m = D.pricingModel(v.prog);
    var name = prog({ prog: v.prog }).name;
    var kids = c ? roster(c) : [];
    return ui.card({
      title: 'Which program is it part of?',
      head: ui.pill(m.name),
      note: 'The program decides how a place in this class is paid for.' + (kids.length
        ? ' The ' + plural(kids.length, 'child', 'children') + ' on the roll are paid up on ' +
          name + '’s terms, so moving the class to another program is something to settle ' +
          'at the desk first.'
        : ' Move it and a place here is charged the way that program charges.')
    }, ui.fields(null, [
      ui.field({
        label: 'Program',
        hint: m.name + ' · ' + priceSummary(v.prog) + '. The figures are on the card below.',
        control: ui.select({
          options: Object.keys(D.PROGRAMS).map(function (id) { return D.PROGRAMS[id].name; }),
          value: name
        })
      })
    ]));
  }

  function questionCards(v, c) {
    var cards = [];
    if (c) cards.push(programCard(v, c));
    if (needsName(v.prog)) cards.push(nameCard(v, v.prog));
    cards.push(whenCard(v, c));
    cards.push(whereCard(v, c));
    cards.push(whoCard(v, c));
    return cards;
  }

  /* ---- new class ------------------------------------------------------------ */

  /* A program can be handed in — Programs opens this with one already chosen —
     and after that the owner's own pick wins. */
  function pickedProg(ctx) {
    var id = ctx && ctx.params ? ctx.params.id : '';
    var v = Grove.filter(PROG_KEY, D.PROGRAMS[id] ? id : '');
    return D.PROGRAMS[v] ? v : '';
  }

  function programChoices(picked) {
    return ui.choices(3, Object.keys(D.PROGRAMS).map(function (id) {
      return ui.choice({
        id: id,
        act: 'pickClassProg',
        title: D.PROGRAMS[id].name,
        sub: D.pricingModel(id).name,
        price: priceSummary(id),
        on: id === picked
      });
    }));
  }

  /* The week as she reads it: down the days first, then down the clock. */
  function byDayTime(a, b) {
    var d = WEEK.indexOf(dayTokens(a)[0]) - WEEK.indexOf(dayTokens(b)[0]);
    return d ? d : byTime(a, b);
  }

  function alreadyCard(progId) {
    var list = classesIn(progId).slice().sort(byDayTime);
    var name = prog({ prog: progId }).name;
    return ui.card({
      title: 'What ' + name + ' already runs',
      head: '<span class="mute">' + esc(plural(list.length, 'class', 'classes')) + '</span>',
      flush: true,
      note: 'The new one is added to these. Nothing here changes.'
    }, list.length
      ? ui.rows(list.map(function (c) {
          return {
            title: esc(c.day + ' · ' + c.time),
            sub: esc(c.room + ' · ' +
              (c.band === '—' ? 'one at a time' : 'ages ' + c.band) + ' · ' + c.staff),
            end: ui.pill(c.en + '/' + c.cap, fillKind(c)),
            to: 'classRecord', id: c.id
          };
        }))
      : ui.empty('No classes yet', 'This will be the first one in ' + name + '.'));
  }

  function afterCard(v) {
    var name = prog({ prog: v.prog }).name;
    return ui.card({ title: 'What happens when you save', flush: true }, ui.rows([
      {
        title: 'It goes on the schedule straight away',
        sub: esc('On the Classes list and on the week calendar: ' + v.day + ' · ' + v.from +
          '–' + v.to + ' · ' + v.room + '.')
      },
      {
        title: esc(plural(parseInt(v.cap, 10) || 0, 'place opens', 'places open')),
        sub: esc('Nobody is enrolled and nothing is billed. A family chooses it at registration ' +
          'and pays on ' + name + '’s terms.')
      },
      v.staff === NOBODY
        ? {
            title: 'It has no instructor yet',
            sub: 'It reads as unassigned on Classes, and the day it runs carries the flag, ' +
              'until somebody holds it.'
          }
        : {
            title: esc(v.staff + ' picks it up'),
            sub: 'It appears on their day with the roster and the safety notes on it.'
          }
    ]));
  }

  Grove.screen('newClass', {
    surface: 'console',
    crumbs: [{ label: 'Classes', to: 'classes' }],
    crumbTitle: 'New class',
    eyebrow: 'a room, a day, an hour',
    title: 'New class',
    sub: function (ctx) {
      var id = pickedProg(ctx);
      if (!id) {
        return 'A class belongs to a program, and the program decides how a place in it is paid ' +
          'for. Choose that first and the rest of this page fills in with what the program ' +
          'already runs.';
      }
      return prog({ prog: id }).name + ' · ' + D.pricingModel(id).name.toLowerCase() +
        '. Everything below is filled in with what this program already runs — change what ' +
        'differs. No class is asked for a price.';
    },

    body: function (ctx) {
      var progId = pickedProg(ctx);

      var pick = ui.card({
        title: 'Which program is it part of?',
        note: 'Six programs, and five ways of pricing them. The one you pick decides what a ' +
          'place in this class costs and how a family is charged for it.'
      }, programChoices(progId));

      if (!progId) {
        return ui.grid(null, [pick]) +
          ui.formActions([
            { label: 'Create class', kind: 'primary', msg: 'Choose a program first' },
            { label: 'Cancel', to: 'classes' }
          ], {
            sticky: true,
            hint: 'Choose a program first — it decides how a place here is paid for'
          });
      }

      var v = suggested(progId);

      return ui.grid(null, [pick]) +
        '<div class="section">' + ui.grid(2, [priceCard(progId), alreadyCard(progId)]) + '</div>' +
        '<div class="section">' + ui.grid(null, questionCards(v, null)) + '</div>' +
        '<div class="section">' + ui.grid(null, [afterCard(v)]) + '</div>' +
        ui.formActions([
          { label: 'Create class', kind: 'primary', msg: 'Class created · no sessions yet, nobody enrolled' },
          { label: 'Cancel', to: 'classes' }
        ], {
          sticky: true,
          hint: 'It goes on the schedule with nobody enrolled and nothing billed'
        });
    }
  });

  /* ---- edit class -----------------------------------------------------------
     The same questions, every one of them already answered, and one thing this
     screen must say that the new one cannot: children are already coming on this
     day, at this hour, to this room. The roll says how many. */

  function familiesOn(c) {
    return uniq(roster(c).map(function (k) { return k.family; }));
  }

  function changesCard(c) {
    var kids = roster(c);
    var fams = familiesOn(c);
    var waiting = waitlist(c);
    var rows = [];

    rows.push(kids.length
      ? {
          title: esc(plural(fams.length, 'family is told', 'families are told')),
          sub: esc('A message goes out naming the day, the time and the room. ' +
            plural(kids.length, 'child holds a place', 'children hold a place') +
            ', and there is nothing for them to do.')
        }
      : {
          title: 'Nobody is enrolled yet',
          sub: 'No message goes out, and nothing you change here reaches a family.'
        });

    rows.push({
      title: 'The schedule follows it',
      sub: 'The Classes list, the week calendar and every roster read the day, the time and ' +
        'the room from this record.'
    });

    rows.push({
      title: 'No money moves',
      sub: esc(c.prog === 'as'
        ? 'A class here uses ' + (classHours(c) ? hoursPhrase(classHours(c)) : 'hours') +
          ' of a child’s monthly plan, and that does not change with the day or the room.'
        : 'A place here is a one-off booking that is already paid for. Prices are set under ' +
          'Programs and nothing on this page changes one.')
    });

    rows.push(c.staff === 'Unassigned'
      ? {
          title: 'Whoever you choose sees it straight away',
          sub: 'It appears on their day, with the roster and the safety notes on it.'
        }
      : {
          title: esc(c.staff + ' has it on their schedule'),
          sub: 'Change the instructor and the class moves off their week and onto the new ' +
            'one’s.'
        });

    if (waiting.length) {
      rows.push({
        title: esc(plural(waiting.length, 'child is waiting', 'children are waiting')),
        sub: 'Raising the places offers the first name on the list a place, at the usual price.',
        end: ui.btn({ label: 'Open Requests', kind: 'quiet', size: 'sm', to: 'requests' })
      });
    }

    return ui.card({
      title: 'What saving changes',
      flush: true,
      note: 'Calling off one date, rather than changing the class, is a different thing and it ' +
        'is done from the class record.'
    }, ui.rows(rows));
  }

  var editDef = {
    surface: 'console',
    crumbs: [{ label: 'Classes', to: 'classes' }],
    crumbTitle: 'Edit class',
    eyebrow: function (ctx) { return prog(cls(ctx)).name; },
    title: 'Edit class',
    sub: function (ctx) {
      var c = cls(ctx);
      var kids = roster(c);
      return c.name + ' · ' + c.day + ' · ' + c.time + ' · ' + c.room + '. ' +
        (kids.length
          ? plural(kids.length, 'child holds a place', 'children hold a place') +
            ', so changing the day, the hour or the room changes when they come — and their ' +
            'families are told.'
          : 'Nobody is enrolled yet, so nothing here reaches a family.');
    },

    actions: function (ctx) {
      return [{ label: 'Open the class', to: 'classRecord', id: cls(ctx).id }];
    },

    body: function (ctx) {
      var c = cls(ctx);
      var v = held(c);
      var kids = roster(c);
      var fams = familiesOn(c);

      var lead = kids.length
        ? ui.notice({
            kind: 'warn',
            title: plural(fams.length, 'family is told when you save',
                          'families are told when you save'),
            text: 'The day, the hour and the room are the ones ' +
              plural(kids.length, 'child comes', 'children come') +
              ' to. Nothing they pay changes, and there is nothing for them to do.',
            action: { label: 'See the roster', to: 'classRecord', id: c.id }
          })
        : '';

      var body = ui.grid(null, questionCards(v, c)) +
        '<div class="section">' + ui.grid(2, [priceCard(c.prog), changesCard(c)]) + '</div>' +
        ui.formActions([
          { label: 'Save changes', kind: 'primary',
            msg: 'Saved · the change shows on the schedule and on every roster' },
          { label: 'Cancel', to: 'classRecord', id: c.id }
        ], {
          sticky: true,
          hint: c.staff === 'Unassigned'
            ? 'The instructor you choose sees the class as soon as you save'
            : (kids.length
                ? plural(fams.length, 'family is told', 'families are told') + ' · nothing is billed'
                : 'Nobody is enrolled, so nothing is sent')
        });

      return lead ? lead + '<div class="section">' + body + '</div>' : body;
    }
  };

  Grove.screen('editClass', editDef);

  /* ---- cancel one session ---------------------------------------------------
     This was a small red button in a card header that fired a toast. It calls
     off an hour for a room full of children and messages every family, and
     Sabrina has nobody to undo it for her — so it asks which date and states,
     before she commits, exactly what will happen. The studio called it off, so
     it costs nobody their hours. The button sits in a bar pinned to the bottom
     of the viewport, never below the explanation. */

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
      var onPlan = c.prog === 'as';
      var hrs = classHours(c);
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
          title: onPlan ? 'No hours come off a plan' : 'Nothing is used up',
          sub: esc(onPlan
            ? 'The ' + (hrs ? hoursPhrase(hrs) : 'time') + ' is not counted against anybody’s monthly ' +
              'hours. ' + whoLine(c) + '.'
            : 'A place here is a one-off booking, not a plan, so there is nothing to spend. ' +
              whoLine(c) + '.')
        });
        lines.push({
          title: c.en === 1 ? 'Their family is told' : 'Their families are told',
          sub: esc('A message goes out naming ' + (when ? longLabel(when) : 'the date') +
            '. There is nothing for them to do.')
        });
        lines.push({
          title: 'No money moves',
          sub: esc(onPlan
            ? 'Nothing is refunded and nothing is charged. The next invoice is still raised on the ' +
              'child’s last class of this cycle.'
            : 'Nothing is charged for a date the studio called off. Anything you decide to give back ' +
              'goes through the family’s billing.')
        });
      } else {
        lines.push({
          title: 'Nobody is enrolled yet',
          sub: 'No message goes out and no money moves either way.'
        });
      }
      lines.push({
        title: esc(c.room + ' frees up'),
        sub: esc(c.time + ' on that date opens for a private class or an extra class.')
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
        ? plural(c.en, 'child', 'children') +
          (onPlan ? ' · no hours used' : ' · nothing used up') + ' · no money moves'
        : 'Nobody is enrolled, so nothing is sent';

      var done = c.en
        ? 'Cancelled · ' + plural(c.en, 'family told', 'families told') +
          (onPlan ? ' and no hours used' : ' and no money moved')
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

  /* An absence names the session it was missed against ("Mon 20 Jul · 3:15pm"),
     which is this class when the day and the start time both match. */
  function absencesIn(c) {
    return D.absences().filter(function (a) {
      var text = String(a.date).toLowerCase();
      var dayHit = dayTokens(c).some(function (d) { return text.indexOf(d.toLowerCase()) !== -1; });
      return dayHit && text.indexOf(startTime(c)) !== -1;
    });
  }
})();
