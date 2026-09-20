/* Console → Classes (list + week calendar), one class record, and cancelling
   one dated session.

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
  function classHours(c) {
    var a = minutesOf(startTime(c)), b = minutesOf(endTime(c));
    if (a === null || b === null || b <= a) return 0;
    return Math.round(((b - a) / 60) * 10) / 10;
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
    return D.ABSENCES.filter(function (a) {
      var text = String(a.date).toLowerCase();
      var dayHit = dayTokens(c).some(function (d) { return text.indexOf(d.toLowerCase()) !== -1; });
      return dayHit && text.indexOf(startTime(c)) !== -1;
    });
  }
})();
