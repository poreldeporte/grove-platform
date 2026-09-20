/* Studio → My classes, and the register.

   WHO THESE TWO SCREENS ARE FOR
   Lauren Ortiz teaches. She reads this on a tablet propped against a shelf or
   on a phone in her apron, with clay on her hands and about three minutes
   before the doors open. She needs, in this order: who in this room has an
   allergy, the register, what she is teaching, and now and then her hours.
   Enrolment against capacity, fill rate, waiting lists and a child's
   attendance percentage are the studio's numbers, and they belong on the
   owner's screens. An earlier pass took them off hers.

   WHAT THE PRICING MODEL CHANGES HERE, AND WHAT IT DOES NOT

   A plan is hours a month, the plan ends with the school year, and hours not
   booked are lost. None of that is a teacher's business and none of it has
   come onto these screens: she is not selling anything, she is counting heads.
   Two things do reach her, and both are about make-ups, because a make-up is
   the one part of the model that walks into her room.

     - a make-up is an extra hour the studio opens for one child on top of
       their weekly place. It is booked against a room, an hour and a teacher
       rather than against a class, so it is not on her timetable. It is still
       an hour she is teaching and it still carries a child, so her week now
       lists it — the child named, in amber, in the order she teaches it — and
       that child's allergy is scanned with everybody else's. Lauren has one
       this week and would otherwise have found out about it on the day
     - a child taking a make-up inside a timetabled class is on that class's
       register, flagged, because she does not know them and because a booked
       make-up the child does not turn up for is used. The rule she is quoting
       when a parent asks at the door — cancel in the portal 24 hours ahead and
       there is a make-up, later than that and the class counts as attended —
       is on the register card, read from D.RULES so that it cannot drift from
       what families actually signed

   The third thing is a silence. Only After-School has a plan, and a make-up
   belongs to a plan, so a camp week, a no-school day, a pop-up and a private
   class have none: they are booked and paid one at a time. A camp register
   therefore does not quote the make-up rule at a parent, it says the true thing
   instead, and which of the two it says is read off the price list rather than
   written down here.

   The match is the one the console already uses for absences and lesson plans:
   a booking names a room, a day and an hour in free text, so it belongs to a
   class when the room and the hour are the same and the class runs on that day.
   A booking that finds a class is a visitor on that class's register; a booking
   that finds none is an hour of its own — one or the other, never both, so no
   child is counted twice in a week. On the current dataset the studio's one
   booked make-up is a Friday hour in Studio 2, which is not a timetabled class,
   so it shows in Lauren's week and no register carries a visitor. That is the
   truth of the data rather than a decoration.

   Nothing here is a pack, a session, a credit or a renewal.

   Cut in earlier passes, and still cut
     - the five stat tiles above the register — Enrolled / On the register /
       Marked / Present / Absent. Marked and unmarked are a line in the save
       bar, counted from the rows; enrolled against capacity is the owner's
       number and is gone
     - every capacity figure on My classes: "18 of 20", "12 of 12 · 3
       waiting", "1 place left", "Full", and the meter under each one
     - the per-child attendance percentage on the register row. It is a
       judgement about the child, not a fact about this hour
     - the five class cards. Time is what organises a teacher's week, so the
       classes are two lists: what is on today, then the rest of the week
     - the family name on the register row, to keep the row to one line of
       state. It is on the child's own record, one tap away

   Cut in this pass
     - a card of its own for make-up hours. A make-up hour is an hour in her
       week, so it sits in the week she already has, in time order, rather than
       in a second list she would have to remember to read
     - any control over it. She cannot grant a make-up, move one or price one,
       so nothing here pretends she can: the hour appears, the child is named,
       the rule is stated once, and the office is named as the place to ask

   Every figure is derived from the rows on screen or read from Grove.data;
   nothing is written down. Whose classes these are comes from ctx.persona, so
   this screen and Today can never disagree about whose week this is. Names,
   ages, safety flags, rooms, hours, rolls, make-ups, the make-up rules and
   lesson plans all come from Grove.data — there is no list of children in
   this file. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  var TODAY_DAY = 'Tue';                    /* Grove.data.today — Tuesday 28 July 2026 */
  var TODAY_DATE = '28 Jul 2026';
  var WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  /* ---- words ----------------------------------------------------------------
     A sentence reads faster than a tile. "Three children you teach have an
     allergy" beats a stat cell reading 3. */

  var WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];
  function words(n) { return WORDS[n] || String(n); }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  function sentenceList(items) {
    if (items.length < 2) return items.join('');
    return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
  }

  /* A rule out of D.RULES is a sentence of its own. Dropping its capital lets
     it be joined to the clause before it without this screen rewriting the
     rule itself. */
  function lower(text) {
    var s = String(text);
    return s.charAt(0).toLowerCase() + s.slice(1);
  }

  /* ---- whose portal this is -------------------------------------------------
     Never a literal. The shell hands the persona to every screen and the rail
     shows the same person. */

  function teacher(ctx) {
    var who = (ctx && ctx.persona) || Grove.persona('studio');
    return (who && who.name) || '';
  }

  /* ---- time ------------------------------------------------------------------ */

  function dayTokens(c) { return String(c.day).split(/[^A-Za-z]+/).filter(Boolean); }
  function spansWeek(c) { return dayTokens(c).length > 1; }

  /* Handles 'Tue' and ranges like 'Mon–Fri'. Same rule as Today, so the two
     screens agree about what runs when. */
  function runsOn(c, day) {
    var t = dayTokens(c);
    if (!t.length) return false;
    if (t.length === 1) return t[0] === day;
    var from = WEEK.indexOf(t[0]), to = WEEK.indexOf(t[t.length - 1]), i = WEEK.indexOf(day);
    if (from === -1 || to === -1) return false;
    return i >= from && i <= to;
  }

  /* '10:00am–1:00pm' → '10:00am'. '1:00–2:00pm' → '1:00pm'. Only the end of a
     range carries the meridiem in this dataset. */
  function startOf(range) {
    var parts = String(range).split('–');
    var m = /(am|pm)/.exec(parts[0]) || /(am|pm)/.exec(parts[1] || '');
    return parts[0].replace(/(am|pm)/, '') + (m ? m[1] : '');
  }

  /* '10:00am' → 1000, '1:00pm' → 1300, so a day reads in the order she teaches
     it rather than alphabetically. */
  function minutes(range) {
    var m = /^(\d+):(\d+)(am|pm)$/.exec(startOf(range));
    if (!m) return 0;
    var hour = parseInt(m[1], 10) % 12;
    if (m[3] === 'pm') hour += 12;
    return hour * 60 + parseInt(m[2], 10);
  }

  /* The time chip wants a headline and a small line under it. Today's hours
     lead with the clock; the rest of the week leads with the day, because that
     is the thing she is looking for. */
  function clockChip(range) {
    var s = startOf(range);
    var m = /(am|pm)$/.exec(s);
    return (m ? s.slice(0, -2) : s) + ' ' + (m ? m[1].toUpperCase() : '');
  }
  function dayChip(c) { return dayTokens(c)[0] + ' ' + startOf(c.time); }

  function byTime(a, b) { return minutes(a.time) - minutes(b.time); }
  function byDayThenTime(a, b) {
    var d = WEEK.indexOf(dayTokens(a)[0]) - WEEK.indexOf(dayTokens(b)[0]);
    return d || byTime(a, b);
  }

  /* An After-School record is named by its length ("1 hour · After-School"),
     which is a duration and not a class name, so those rows carry the
     programme name instead. Same rule as Today and the family schedule. */
  function className(c) {
    return c.prog === 'as' ? D.program(c.prog).name : c.name;
  }
  /* A private class, the only hour that is genuinely one to one. The age band
     is blank on a birthday party as well, and a party is not. */
  function oneToOne(c) { return c.prog === 'priv'; }

  function classOf(id) {
    return D.CLASSES.filter(function (c) { return c.id === id; })[0];
  }

  /* The signed-in teacher's classes. */
  function mine(ctx) {
    var who = teacher(ctx);
    return D.CLASSES.filter(function (c) { return c.staff === who; });
  }
  function myToday(ctx) {
    return mine(ctx).filter(function (c) { return runsOn(c, TODAY_DAY); }).sort(byTime);
  }
  function myRest(ctx) {
    return mine(ctx).filter(function (c) { return !runsOn(c, TODAY_DAY); }).sort(byDayThenTime);
  }

  /* ---- make-ups ---------------------------------------------------------------
     A make-up is an hour the studio opens for a child who cancelled a class in
     time. It is booked against a room, an hour and a teacher — never a class —
     so it is read out of the free-text line the booking carries, the same way
     the console reads an absence or a lesson plan.

     'Fri 31 Jul · 10:00am' → day 'Fri', date 'Fri 31 Jul', time '10:00am'. */

  function mkDay(x) { return String(x.when).split(' ')[0]; }
  function mkDate(x) { return String(x.when).split(' · ')[0]; }
  function mkTime(x) {
    var bits = String(x.when).split('· ');
    return (bits[1] || '').replace(/^\s+|\s+$/g, '');
  }
  function mkLabel(x) { return mkDay(x) + ' ' + startOf(mkTime(x)); }

  function studentNamed(name) {
    return D.STUDENTS.filter(function (s) { return s.name === name; })[0];
  }

  /* The make-up hours booked with this teacher that are not already one of her
     classes. A make-up that falls inside a class of hers is on that class's
     register and is counted in its roll, so listing it again as an hour of its
     own would have her teaching the same child twice. What is left is the hour
     that is genuinely not on her timetable, which is the whole reason it is
     worth saying out loud. */
  function myMakeups(ctx) {
    var who = teacher(ctx);
    var classes = mine(ctx);
    return D.EXTRA_CLASSES.filter(function (x) {
      if (x.staff !== who) return false;
      return !classes.filter(function (c) {
        return makeupsIn(c).filter(function (y) { return y.id === x.id; }).length > 0;
      }).length;
    });
  }
  function makeupsToday(ctx) {
    return myMakeups(ctx)
      .filter(function (x) { return mkDay(x) === TODAY_DAY; })
      .sort(function (a, b) { return minutes(mkTime(a)) - minutes(mkTime(b)); });
  }
  function makeupsRest(ctx) {
    return myMakeups(ctx)
      .filter(function (x) { return mkDay(x) !== TODAY_DAY; })
      .sort(function (a, b) {
        var d = WEEK.indexOf(mkDay(a)) - WEEK.indexOf(mkDay(b));
        return d || (minutes(mkTime(a)) - minutes(mkTime(b)));
      });
  }

  /* A make-up taken inside a timetabled class: the booking names this room,
     this hour and a day this class runs, and the child is not already on its
     roll. All three have to agree — a booking in the same room earlier in the
     day is somebody else's hour, not a visitor on this register. */
  function makeupsIn(c) {
    var roll = {};
    D.roster(c.id).forEach(function (s) { roll[s.name] = true; });
    return D.EXTRA_CLASSES.filter(function (x) {
      return x.room === c.room &&
             runsOn(c, mkDay(x)) &&
             startOf(mkTime(x)) === startOf(c.time) &&
             !roll[x.child];
    });
  }

  /* Whether make-ups reach this hour at all. Only After-School has a plan, and
     a make-up belongs to a plan — camp, no-school days, private classes and
     pop-ups are booked one at a time. Read off the price list, so that giving
     another programme a plan changes what this screen says with it. */
  function hasPlan(c) {
    var p = D.PRICING[c.prog];
    return !!(p && p.plans);
  }

  /* The one make-up rule a teacher taking a register changes the outcome of: a
     booked make-up the child does not turn up for is used. Picked out of
     D.RULES by what it says rather than by where it sits in the list. */
  function noShowRule() {
    return D.RULES.makeupNever.filter(function (t) {
      return String(t).indexOf('not attended') !== -1;
    })[0];
  }

  /* ---- who is in the room ----------------------------------------------------
     The roll is held on the children: each child's record carries the classes
     that child is in, and D.roster hands back the class's children. Read in
     name order, because a register of eighteen is scanned for one name rather
     than read from the top. Anyone taking a make-up in this hour follows the
     roll, so she can see at a glance that the list has grown by one. */

  function byName(a, b) { return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0); }
  function roster(c) { return D.roster(c.id).sort(byName); }

  function register(c) {
    var out = roster(c).map(function (s) { return { who: s, makeup: null }; });
    makeupsIn(c).forEach(function (x) {
      var s = studentNamed(x.child);
      if (s) out.push({ who: s, makeup: x });
    });
    return out;
  }
  function whoOf(e) { return e.who; }
  function visiting(entries) {
    return entries.filter(function (e) { return !!e.makeup; });
  }
  function flagged(entries, kind) {
    return entries.filter(function (e) { return e.who.flagKind === kind; }).map(whoOf);
  }

  /* Every hour she teaches this week, today first, each with the children who
     will be standing in it. A make-up hour carries one child, and that child's
     allergy matters exactly as much as anyone else's. */
  function hourLabel(c) { return dayTokens(c).join('–') + ' ' + startOf(c.time); }

  function myHours(ctx) {
    var out = [];
    function addClass(c) {
      out.push({ label: hourLabel(c), people: register(c).map(whoOf) });
    }
    function addMakeup(x) {
      var s = studentNamed(x.child);
      out.push({ label: mkLabel(x), people: s ? [s] : [] });
    }
    myToday(ctx).forEach(addClass);
    makeupsToday(ctx).forEach(addMakeup);
    myRest(ctx).forEach(addClass);
    makeupsRest(ctx).forEach(addMakeup);
    return out;
  }

  /* ---- the office's published work -------------------------------------------
     She reads a plan, she cannot write one. A plan is matched to a room on a
     date, which is as close as the dataset allows. */

  function planFor(ctx, c) {
    var who = teacher(ctx);
    return D.LESSON_PLANS.filter(function (p) {
      return p.date === TODAY_DATE && p.teacher === who && p.room === c.room;
    })[0];
  }

  /* ---- marks ------------------------------------------------------------------
     Held in Grove.state under the key Today reads, so once she has taken a
     register Today stops saying it has not been taken. */

  function markKey(cid, sid) { return 'att-' + cid + '-' + sid; }
  function markOf(cid, sid) { return Grove.filter(markKey(cid, sid), ''); }

  function tally(c, entries) {
    var t = { present: 0, absent: 0, toMark: 0 };
    entries.forEach(function (e) {
      var m = markOf(c.id, e.who.id);
      if (m === 'Present') t.present += 1;
      else if (m === 'Absent') t.absent += 1;
      else t.toMark += 1;
    });
    return t;
  }

  Grove.on('sMark', function (d) { Grove.setFilter(markKey(d.cid, d.id), d.mark); });

  Grove.on('sMarkAll', function (d) {
    var c = classOf(d.cid);
    if (!c) return;
    var cur = Grove.state.filters, next = {};
    Object.keys(cur).forEach(function (k) { next[k] = cur[k]; });
    register(c).forEach(function (e) { next[markKey(c.id, e.who.id)] = 'Present'; });
    Grove.set({ filters: next });
    Grove.toast('All marked present');
  });

  /* Counted from the marks against the list shown. Never a literal. */
  function registerState(c) {
    var people = register(c);
    if (!people.length) return '';
    var t = tally(c, people);
    if (t.toMark === people.length) return ui.pill('Register not taken', 'amber');
    if (t.toMark) return ui.pill((people.length - t.toMark) + ' of ' + people.length + ' marked', 'amber');
    return ui.pill('Register taken', 'ok');
  }

  /* ---- my classes -------------------------------------------------------------
     Time is the organising principle: today, then the rest of the week. A
     timetabled class and a make-up hour sit in the same list, in the order she
     teaches them. Every class row is the tap target for its own register,
     which is the biggest target a row can be; a make-up hour is not a class
     and has no register, so it does not pretend to be tappable. */

  var MAKEUP_NOTE = 'A make-up hour is an extra hour opened for one child on top of their ' +
    'weekly place. It is not a class, so it has no register of its own.';

  function classRow(ctx, c, onToday) {
    var bits = [c.room, plural(register(c).length, 'child', 'children')];
    if (onToday && spansWeek(c)) bits.push('every day this week');
    var plan = onToday ? planFor(ctx, c) : null;
    if (plan) bits.push(plan.lesson);
    else if (oneToOne(c)) bits.push('one to one');
    return {
      lead: ui.timechip(onToday ? clockChip(c.time) : dayChip(c)),
      title: ui.dot(D.program(c.prog).color) + ' ' + esc(titleOf(c)),
      sub: esc(bits.join(' · ')),
      end: onToday ? registerState(c) : '',
      to: 'sAttendance',
      id: c.id
    };
  }

  /* A make-up answers a class the family cancelled in time — the absence is on
     the child's record and nothing was spent for it. An hour bought on top of
     the weekly place answers nothing, and the record says which, so the row
     says which rather than calling both a make-up. A child joining a class
     that is not theirs is always the first kind, because that is the only
     thing the studio opens a free place for. */
  function owedMakeup(name) {
    return D.absencesFor(name).filter(function (a) { return !a.spent; }).length > 0;
  }

  function makeupRow(x, onToday) {
    var owed = owedMakeup(x.child);
    return {
      lead: ui.timechip(onToday ? clockChip(mkTime(x)) : mkLabel(x), 'amber'),
      title: esc(x.child),
      sub: esc(x.room + ' · ' + mkDate(x) + ' · ' +
        (owed ? 'making up a class they missed' : 'an hour on top of their usual week')),
      end: ui.pill(owed ? 'Make-up' : 'Extra hour', 'amber')
    };
  }

  /* Classes and make-up hours interleaved, in the order she teaches them. */
  function ordered(items) {
    return items
      .sort(function (a, b) { return (a.d - b.d) || (a.m - b.m); })
      .map(function (i) { return i.row; });
  }

  Grove.screen('sClasses', {
    surface: 'studio',
    crumbTitle: 'Classes',
    eyebrow: 'your week',
    title: 'My classes',
    sub: 'Today first, then the rest of the week. Tap a class to take its register. Only the hours you are assigned to — ask the office if one is missing.',
    actions: function (ctx) {
      var next = myToday(ctx)[0];
      return [
        { label: 'Today', to: 'sToday' },
        next
          ? { label: 'Take the register', kind: 'primary', to: 'sAttendance', id: next.id }
          : { label: 'Take the register', kind: 'primary', to: 'sAttendance' }
      ];
    },

    body: function (ctx) {
      var today = myToday(ctx);
      var rest = myRest(ctx);
      var mkToday = makeupsToday(ctx);
      var mkRest = makeupsRest(ctx);

      /* Safety before anything else, in clay, by name, with the hours she will
         be standing in front of that child. Grouped by child, so a child in
         two of her hours is named once, and read in teaching order, so the
         child she sees this morning is named first. A make-up hour is one of
         her hours, so a child coming in for one is scanned here as well. */
      var week = myHours(ctx);
      var alerts = byChild(week, 'bad');
      var watch = byChild(week, 'warn');

      var safety = alerts.length
        ? ui.notice({
            kind: 'bad',
            title: alerts.length === 1
              ? 'One child you teach has an allergy'
              : words(alerts.length) + ' children you teach have an allergy',
            text: alerts.map(saying).join(' '),
            action: { label: 'Safety notes', to: 'sStudents' }
          })
        : ui.notice({
            kind: 'ok',
            title: 'No allergies in your classes',
            text: 'Nothing is flagged on the children you teach. The full notes are on the students screen.',
            action: { label: 'Safety notes', to: 'sStudents' }
          });

      var watching = watch.length
        ? ui.notice({
            kind: 'warn',
            title: 'Worth knowing before you start',
            text: watch.map(saying).join(' ')
          })
        : '';

      var todayItems = [];
      today.forEach(function (c) {
        todayItems.push({ d: 0, m: minutes(c.time), row: classRow(ctx, c, true) });
      });
      mkToday.forEach(function (x) {
        todayItems.push({ d: 0, m: minutes(mkTime(x)), row: makeupRow(x, true) });
      });

      var onToday = todayItems.length
        ? ui.card({
            title: 'Today',
            flush: true,
            note: mkToday.length ? MAKEUP_NOTE : ''
          }, ui.rows(ordered(todayItems)))
        : '';

      var restItems = [];
      rest.forEach(function (c) {
        restItems.push({
          d: WEEK.indexOf(dayTokens(c)[0]), m: minutes(c.time), row: classRow(ctx, c, false)
        });
      });
      mkRest.forEach(function (x) {
        restItems.push({
          d: WEEK.indexOf(mkDay(x)), m: minutes(mkTime(x)), row: makeupRow(x, false)
        });
      });

      var later = ui.card({
        title: todayItems.length ? 'The rest of your week' : 'Your week',
        flush: true,
        note: (!mkToday.length && mkRest.length) ? MAKEUP_NOTE : ''
      }, restItems.length
        ? ui.rows(ordered(restItems))
        : ui.empty('Nothing else this week', 'Everything you are assigned to runs today.'));

      /* The constraint, stated where she would go looking for a way around it. */
      var help = ui.notice({
        title: 'Something not right with your week?',
        text: 'Missing materials go through a supply request and the office picks it up. Rosters, make-up hours and lesson plans are set by the office, so ask the desk rather than working around them.',
        action: { label: 'Request supplies', to: 'sSupplies' }
      });

      return h`
        ${raw(safety)}${raw(watching)}
        ${raw(onToday ? '<div class="section">' + onToday + '</div>' : '')}
        <div class="section">${raw(later)}</div>
        <div class="section">${raw(help)}</div>
      `;
    }
  });

  function titleOf(c) {
    return className(c) + (c.band && c.band !== '—' && c.band !== 'All' ? ' · ages ' + c.band : '');
  }

  /* One entry per child, carrying every one of her hours that child is in, so
     Sophia Martinez is named once and not once per class. The hours are the
     ones this teacher is standing in — a class of hers, or a make-up hour
     booked with her — because those are the hours she is responsible for. */
  function byChild(hours, kind) {
    var order = [], seen = {};
    hours.forEach(function (hr) {
      hr.people.forEach(function (s) {
        if (s.flagKind !== kind) return;
        var got = seen[s.id];
        if (!got) { got = seen[s.id] = { who: s, when: [] }; order.push(got); }
        if (got.when.indexOf(hr.label) === -1) got.when.push(hr.label);
      });
    });
    return order;
  }
  function saying(e) {
    return e.who.name + ' — ' + e.who.flag + ' (' + sentenceList(e.when) + ').';
  }

  /* ---- the register ------------------------------------------------------------
     The one job of this screen. Safety, then the list, then Save in a bar
     pinned to the bottom saying how many children are still unmarked. Nothing
     else is on it. */

  function current(ctx) {
    return classOf(ctx.params.id) || myToday(ctx)[0] || mine(ctx)[0];
  }

  Grove.screen('sAttendance', {
    surface: 'studio',
    crumbs: [{ label: 'Classes', to: 'sClasses' }],
    crumbTitle: 'Attendance',
    eyebrow: 'who is in the room',
    title: 'The register',
    sub: function (ctx) {
      var c = current(ctx);
      return titleOf(c) + ' · ' + c.room + ' · ' + c.day + ' ' + c.time + '.';
    },
    actions: [{ label: 'My classes', to: 'sClasses' }],

    body: function (ctx) {
      var c = current(ctx);
      var people = register(c);
      var guests = visiting(people);
      var t = tally(c, people);

      var alerts = flagged(people, 'bad');
      var watch = flagged(people, 'warn');

      /* Safety before anything else, by name, in clay. This is the one place
         the allergy is spelled out — the rows below do not repeat it. A child
         here for a make-up is in this notice like anybody else. */
      var safety = alerts.length
        ? ui.notice({
            kind: 'bad',
            title: alerts.length === 1
              ? 'One child in this room has an allergy'
              : words(alerts.length) + ' children in this room have an allergy',
            text: alerts.map(function (s) { return s.name + ' — ' + s.flag + '.'; }).join(' '),
            action: { label: 'Safety notes', to: 'sStudents' }
          })
        : ui.notice({
            kind: 'ok',
            title: 'No allergies in this room',
            text: 'Nothing is flagged on the children on this register. The full notes are on the students screen.',
            action: { label: 'Safety notes', to: 'sStudents' }
          });

      var watching = watch.length
        ? ui.notice({
            kind: 'warn',
            title: 'Worth knowing before you start',
            text: watch.map(function (s) { return s.name + ' — ' + s.flag + '.'; }).join(' ')
          })
        : '';

      /* The make-up rules, in the words families signed them in, read from
         D.RULES. Two sentences and no control: she is the person a parent asks
         at the door, and marking a child away is the moment the rule bites. */
      var r = D.RULES;
      var noShow = noShowRule();
      var lines = [];
      if (!runsOn(c, TODAY_DAY)) lines.push('This class does not run today.');
      if (guests.length) {
        lines.push((guests.length === 1
          ? 'One child is here for a make-up and is flagged on the list.'
          : words(guests.length) + ' children are here for a make-up and are flagged on the list.') +
          (noShow ? ' A make-up cannot ' + lower(noShow) + '.' : ''));
      }
      lines.push(hasPlan(c)
        ? 'A class cancelled in the portal ' + r.cancelNotice +
          ' ahead gets a make-up; marked away on the day, ' + lower(r.lateCancel)
        : D.program(c.prog).name + ' is a one-off booking rather than a plan, so a ' +
          'missed day is not made up.');
      lines.push('If a child is here and not on the list, tell the office and they will add them.');

      /* How many are in the room, counted off the rows beneath it, beside the
         button she taps first. On a register of eighteen the number is what
         tells her whether she is looking at the whole class. A one-to-one
         lesson has nothing to count and nothing to mark in bulk. */
      var head = people.length > 1
        ? '<div class="inline">' +
            ui.pill(plural(people.length, 'child', 'children')) +
            (guests.length
              ? ui.pill(guests.length === 1
                  ? 'One is a make-up'
                  : words(guests.length) + ' are make-ups', 'amber')
              : '') +
            ui.btn({ label: 'Everyone is here', act: 'sMarkAll', cid: c.id }) +
          '</div>'
        : '';

      var sheet = ui.card({
        /* The card head carries the date being marked, so the page title can
           say what the screen is and the card can say which sitting it is. */
        title: runsOn(c, TODAY_DAY) ? D.today : c.day + ' · ' + c.time,
        flush: true,
        head: head,
        note: lines.join(' ')
      }, people.length
        ? ui.rows(people.map(function (e) {
            var s = e.who;
            var m = markOf(c.id, s.id);
            var where = m === 'Present'
              ? '<span class="grove">Here</span>'
              : (m === 'Absent' ? '<span class="clay">Away today</span>' : 'Not marked yet');
            return {
              lead: esc('Age ' + s.age),
              title: esc(s.name) + (e.makeup ? ' ' + ui.pill('Make-up', 'amber') : ''),
              sub: where + (e.makeup ? ' · not on this class’s roll' : ''),
              end: ui.btns([
                {
                  label: 'Present', kind: m === 'Present' ? 'primary' : null,
                  act: 'sMark', cid: c.id, id: s.id, mark: 'Present'
                },
                {
                  label: 'Absent', kind: m === 'Absent' ? 'danger' : null,
                  act: 'sMark', cid: c.id, id: s.id, mark: 'Absent'
                }
              ])
            };
          }))
        : ui.empty('Nobody on this register yet',
            'The office adds children to a class when they enroll.'));

      var hint = t.toMark
        ? plural(t.toMark, 'child still to mark', 'children still to mark')
        : (t.absent
            ? plural(t.absent, 'child away', 'children away') + ', everyone else is here'
            : 'Everyone is here');

      var save = people.length
        ? ui.formActions(
            [{ label: 'Save the register', kind: 'primary', msg: 'Register saved' }],
            { sticky: true, hint: hint }
          )
        : '';

      return h`
        ${raw(safety)}${raw(watching)}
        <div class="section">${raw(sheet)}</div>
        ${raw(save)}
      `;
    }
  });
})();
