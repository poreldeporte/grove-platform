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
     - the record's four header actions are two. "Cancel a session" sits in the
       class card it belongs to, and the roster is on the page rather than a
       jump into the Studio portal
     - "Term", "Sessions generated" and the four-week attendance block were the
       same hardcoded numbers on every class, so they are not shown
     - the List tab's search box is gone. Twelve rows behind seven programme
       chips do not need full-text search, and while it was there the toolbar
       wrapped: the result count fell onto a thin band of its own, while the
       Calendar tab put the same count on the toolbar row. Both tabs now read
       the same way, and the placeholder can no longer be clipped mid-word

   Everything counted here is counted off the rows being shown. Where the
   dataset holds fewer records than the class enrolls, the card says so ("3 of
   12 enrolled") rather than printing a total it cannot stand behind. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  var WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var WEEK_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  /* The week that contains Grove.data.today — Tuesday 28 July 2026. */
  var WEEK_DATES = ['27 Jul', '28 Jul', '29 Jul', '30 Jul', '31 Jul', '1 Aug'];
  var TODAY_DAY = 'Tue';

  /* The mapping the Requests screen uses, so a credit reads the same colour on
     both screens. */
  var MAKEUP_PILL = {
    'Awaiting approval': 'warn',
    'Available': 'ok',
    'Booked': null,
    'Expiring': 'bad'
  };

  /* ---- small helpers ------------------------------------------------------ */

  function prog(c) { return D.program(c.prog) || { name: c.prog, short: c.prog, color: 'var(--ink-45)' }; }

  function money(n) { return Grove.money(n, { cents: false }); }

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

  function thisWeek(c) {
    var d = datedFor(c);
    return !d || WEEK_DATES.indexOf(d) !== -1;
  }

  function datedElsewhere() {
    return D.CLASSES.filter(function (c) { return !thisWeek(c); });
  }

  function fillKind(c) {
    return c.en > c.cap ? 'bad' : (c.en === c.cap ? 'amber' : null);
  }

  function fill(c) {
    var over = c.en - c.cap;
    return h`<div class="stack stack--sm">
      <div>${raw(ui.pill(c.en + '/' + c.cap, fillKind(c)))}</div>
      ${raw(ui.meter(c.en, c.cap))}
      ${raw(over > 0 ? '<div class="cell-sub">' + esc(over + ' over · a make-up booking') + '</div>' : '')}
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

  /* "3 of 12 enrolled" when the dataset holds fewer records than the class
     enrolls, plain "12 enrolled" when it holds them all. */
  function countOf(shown, total, word) {
    return shown === total ? total + ' ' + word : shown + ' of ' + total + ' ' + word;
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
      if (Grove.tab('classes', 'List') !== 'Calendar') {
        return 'Every class across all ' + Object.keys(D.PROGRAMS).length +
          ' programs. A class generates dated sessions; enrollments attach to the class, attendance to the session.';
      }
      var away = datedElsewhere();
      var base = 'Week of 27 July 2026. A session with nobody teaching it is flagged on its block.';
      if (!away.length) return base;
      return base + ' ' + away.map(function (c) { return c.name; }).join(' and ') +
        (away.length === 1 ? ' is dated outside this week, so it is' : ' are dated outside this week, so they are') +
        ' in the List tab only.';
    },
    actions: [
      { label: 'Export', msg: 'CSV exported' },
      { label: 'New class', kind: 'primary', msg: 'Prototype — no form yet' }
    ],

    body: function () {
      return Grove.tab('classes', 'List') === 'Calendar' ? calendarTab() : listTab();
    }
  });

  /* The over-capacity line is written off the rows on screen, so it names the
     class it is talking about and disappears when that class is filtered out. */
  function overNote(list) {
    if (!list.length) return null;
    var names = list.map(function (c) { return c.day + ' ' + startTime(c); }).join(', ');
    return names + (list.length === 1 ? ' is ' : ' are ') +
      'over capacity: a make-up booking landed in a full class. Rebalancing moves the make-up rather than the enrolled child.';
  }

  function listTab() {
    var chip = Grove.filter('classes', 'All programs');

    var rows = D.CLASSES.filter(function (c) {
      return chip === 'All programs' || prog(c).short === chip;
    });

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
      }),
      {
        emptyTitle: 'No classes in that program',
        emptyText: 'Choose another programme, or go back to all programs.'
      }
    );

    return ui.toolbar({
      tabs: tabRail(),
      filters: { key: 'classes', items: chipItems() },
      count: rows.length + ' of ' + D.CLASSES.length + ' classes'
    }) + ui.card({
      flush: true,
      note: overNote(rows.filter(function (c) { return c.en > c.cap; }))
    }, table);
  }

  function entryRow(c) {
    var p = prog(c);
    return {
      lead: esc(startTime(c)),
      title: ui.dot(p.color) + ' ' + esc(c.name),
      sub: esc(c.room) + ' · ' + (c.staff === 'Unassigned'
        ? '<span class="clay">Unassigned</span>'
        : esc(c.staff)),
      end: ui.pill(c.en + '/' + c.cap, fillKind(c)),
      to: 'classRecord', id: c.id
    };
  }

  /* Two columns rather than three: the six days hold 6, 5, 4, 4, 3 and 1
     sessions, and pairing them that way roughly halves the white a short day
     leaves under a tall neighbour. Each card closes on its own footer, so what
     is left reads as the end of the card. */
  function calendarTab() {
    var total = 0;

    var days = WEEK.map(function (day, i) {
      var list = D.CLASSES.filter(function (c) {
        return thisWeek(c) && runsOn(c, day);
      }).sort(byTime);
      total += list.length;

      var en = 0, cap = 0;
      list.forEach(function (c) { en += c.en; cap += c.cap; });

      var head = h`<span class="inline">
        ${raw(day === TODAY_DAY ? ui.pill('Today', 'ok') : '')}
        <span class="mute">${WEEK_DATES[i]}</span>
      </span>`;

      var foot = list.length
        ? '<span class="mute">' + esc(list.length === 1 ? '1 session' : list.length + ' sessions') + '</span>' +
          '<span class="num">' + esc(en + ' of ' + cap + ' places') + '</span>'
        : null;

      return ui.card({
        title: WEEK_LONG[i],
        head: head,
        flush: true,
        foot: foot
      }, list.length ? ui.rows(list.map(entryRow)) : ui.empty('Studio closed'));
    });

    return ui.toolbar({
      tabs: tabRail(),
      count: total + ' sessions this week'
    }) + ui.grid(2, days);
  }

  /* ---- class record -------------------------------------------------------- */

  var recordDef = {
    surface: 'console',
    crumbs: [{ label: 'Classes', to: 'classes' }],
    eyebrow: function (ctx) { return prog(cls(ctx)).name; },
    title: function (ctx) { return cls(ctx).name; },
    sub: function (ctx) {
      var c = cls(ctx);
      return c.day + ' · ' + c.time + ' · ' + c.room;
    },

    /* The class already has an instructor on almost every record, so asking
       for one is only the primary action when there is nobody teaching it. */
    actions: function (ctx) {
      var c = cls(ctx);
      var plans = lessonsFor(c);
      return [
        plans.length
          ? { label: 'Lesson plan', to: 'lessonPlan', id: plans[0].id }
          : { label: 'Lesson plans', to: 'teaching' },
        c.staff === 'Unassigned'
          ? { label: 'Assign an instructor', kind: 'primary', msg: 'Assigned · the instructor sees the class now' }
          : { label: 'Edit class', kind: 'primary', msg: 'Prototype — no form yet' }
      ];
    },

    body: function (ctx) {
      var c = cls(ctx);
      var p = prog(c);
      var kids = roster(c);
      var waiting = waitlist(c);
      var plans = lessonsFor(c);
      var credits = makeupsFor(c);

      var flags = h`<div class="inline">
        ${raw(ui.pill(placesLine(c), fillKind(c)))}
        ${raw(bandLine(c) ? ui.pill(bandLine(c)) : '')}
        ${raw(c.staff === 'Unassigned'
          ? ui.pill('No instructor assigned', 'bad')
          : ui.pill(c.staff, 'ok'))}
      </div>`;

      var over = c.en > c.cap
        ? ui.notice({
            kind: 'bad',
            title: 'Over capacity by ' + (c.en - c.cap),
            text: 'A make-up booking landed here after the last enrollment. Rebalancing moves the make-up, not the enrolled child.',
            action: { label: 'Rebalance', msg: 'Prototype — nothing was moved' }
          })
        : '';

      /* Class-level facts, so the card says class. The button cancels one
         dated session, which is the only cancellation this page can mean. */
      var details = ui.card({
        title: 'The class',
        head: ui.btn({
          label: 'Cancel a session',
          kind: 'danger',
          size: 'sm',
          msg: 'Prototype — nothing was cancelled'
        })
      }, ui.kv([
        ['Programme', esc(p.name)],
        ['When', esc(c.day + ' · ' + c.time)],
        ['Room', esc(c.room)],
        ['Ages', esc(c.band)],
        { k: 'Teacher', v: esc(c.staff), tone: c.staff === 'Unassigned' ? 'clay' : null },
        { k: 'Places', v: esc(c.en + ' of ' + c.cap), tone: c.en > c.cap ? 'clay' : null }
      ]));

      var rosterCard = ui.card({
        title: 'Roster',
        head: '<span class="mute">' + esc(countOf(kids.length, c.en, 'enrolled')) + '</span>',
        flush: true,
        note: (kids.length && kids.length < c.en
          ? 'The prototype carries records for ' + kids.length + ' of the ' + c.en +
            ' children enrolled. '
          : '') +
          'Safety notes are shown to every teacher on this roster and on the attendance sheet.'
      }, kids.length
        ? ui.rows(kids.map(kidRow))
        : ui.empty('No children linked yet', 'Enrollment counts come from the class; children are linked as they register.')
      );

      var waitCard = ui.card({
        title: 'Waitlist',
        head: c.wl ? ui.pill(countOf(waiting.length, c.wl, 'waiting'), 'warn') : '',
        flush: true,
        note: 'Nobody is turned away. A place that frees up goes to the first name on the list.' +
          (waiting.length && waiting.length < c.wl
            ? ' The prototype names the first ' + waiting.length + ' of the ' + c.wl + '.'
            : '')
      }, waiting.length
        ? ui.rows(waiting.map(waitRow))
        : ui.empty('Nobody waiting', 'Every child who asked for this class has a place.')
      );

      var cost = ui.card({
        title: 'What a place costs',
        note: 'Prices are set on the program, so every ' + p.name +
          ' class charges the same. They are edited under Programs.'
      }, ui.kv(costRows(c)));

      var lessons = ui.card({
        title: 'Lesson plans',
        head: '<span class="mute">' + esc(plans.length === 1 ? '1 plan' : plans.length + ' plans') + '</span>',
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

      var makeups = ui.card({
        title: 'Make-ups from this class',
        head: '<span class="mute">' + esc(credits.length === 1 ? '1 credit' : credits.length + ' credits') + '</span>',
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

      /* Only the cards that have something in them. Price is always there, so
         the row is never empty; when all three are, the two short ones stack
         in one cell so the row finishes level. */
      var extras = [];
      if (plans.length) extras.push(lessons);
      extras.push(cost);
      if (credits.length) extras.push(makeups);

      var second = extras.length === 1
        ? ui.grid(null, extras)
        : (extras.length === 2
            ? ui.grid(2, extras)
            : ui.grid(2, [ui.col([extras[0], extras[1]]), extras[2]]));

      return flags +
        (over ? '<div class="section">' + over + '</div>' : '') +
        '<div class="section">' + ui.grid(3, [details, rosterCard, waitCard]) + '</div>' +
        '<div class="section">' + second + '</div>';
    }
  };

  /* The trail has to close on the record, and the shell reads crumbTitle as a
     value rather than calling it, so it is defined as a getter. */
  Object.defineProperty(recordDef, 'crumbTitle', {
    get: function () { return cls({ params: Grove.state.params }).name; }
  });

  Grove.screen('classRecord', recordDef);

  /* A child with nothing to flag carries their make-up credits rather than a
     bare dash floating in the white. */
  function kidRow(k) {
    var row = {
      title: esc(k.name),
      sub: esc('Age ' + k.age + ' · attendance ' + k.att),
      to: 'studentRecord', id: k.id
    };
    if (k.flag) row.end = ui.pill(k.flag, k.flagKind);
    else if (k.mk) row.end = ui.mute(k.mk === 1 ? '1 make-up credit' : k.mk + ' make-up credits');
    return row;
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

  /* The child a private class is named for: "Private · Zara Okafor" → "zara". */
  function namedChild(c) {
    var parts = String(c.name).split('· ');
    var who = String(parts[parts.length - 1] || '').split(' ')[0];
    return who.toLowerCase();
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

  /* What a place costs, read from the program's own prices — the same figures
     the registration flow charges. */
  function costRows(c) {
    var P = D.PRICING[c.prog] || {};
    var rows = [];

    if (c.prog === 'as') {
      Object.keys(P.plans).forEach(function (k) {
        rows.push([k.slice(1) + ' sessions / month', money(P.plans[k])]);
      });
    } else if (c.prog === 'camp') {
      rows.push(['A full week', money(P.week)]);
      rows.push(['A single day', money(P.day)]);
      rows.push(['Extra hour', money(P.extraHour)]);
    } else if (c.prog === 'nsd') {
      rows.push(['The day', money(P.base)]);
      rows.push(['Extra hour', money(P.extraHour)]);
      rows.push(['Longest day', P.maxHours + ' hours']);
    } else if (c.prog === 'priv') {
      rows.push(['An hour', money(P.hourly)]);
      rows.push(['Longest booking', P.maxHours + ' hours']);
    } else if (c.prog === 'pop') {
      var here = P.events.filter(function (e) { return String(c.name).indexOf(e.label) !== -1; });
      (here.length ? here : P.events).forEach(function (e) {
        rows.push([esc(e.label), money(e.amount)]);
      });
    } else if (c.prog === 'bday') {
      rows.push(['This party', 'By quote']);
    }

    rows.push({
      k: 'Registration fee',
      v: P.regFee ? money(P.regFee) + ' once, per child' : 'None',
      tone: 'mute'
    });
    return rows;
  }
})();
