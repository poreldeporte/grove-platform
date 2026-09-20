/* Studio → My classes, and the register.

   WHO THESE TWO SCREENS ARE FOR
   Lauren Ortiz teaches. She reads this on a tablet propped against a shelf or
   on a phone in her apron, with clay on her hands and about three minutes
   before the doors open. She needs, in this order: who in this room has an
   allergy, the register, what she is teaching, and now and then her hours.
   Enrolment against capacity, fill rate, waiting lists and a child's
   attendance percentage are the studio's numbers, and they belong on the
   owner's screens. This pass takes them off hers.

   Cut in this pass
     - the five stat tiles above the register — Enrolled / On the register /
       Marked / Present / Absent. Five tiles of telemetry stood above the list.
       Marked and unmarked are now a line in the save bar, counted from the
       rows; enrolled against capacity is the owner's number and is gone
     - every capacity figure on My classes: "18 of 20", "12 of 12 · 3
       waiting", "1 place left", "Full", and the meter under each one. A
       teacher taking a register does not act on any of them
     - the per-child attendance percentage on the register row. It is a
       judgement about the child, not a fact about this hour
     - the five class cards. A card with a three-row key/value table and a
       progress bar, five times over, is a filing cabinet. Time is what
       organises a teacher's week, so the classes are now two lists: what is
       on today, then the rest of the week
     - the family name on the register row, to keep the row to one line of
       state. It is on the child's own record, one tap away
     - the line under the register explaining that the list was shorter than
       the room. It is not. The register is the class.

   Changes this pass
     - the roll is a join, not a guess. A child's record carries the classes
       that child is in, so the roster comes from D.roster(c.id) and a child's
       own hours from D.classesOf. Nothing here reads a placement out of the
       free-text line on a child's record any more
     - a camp register is eighteen children, so the list is in name order —
       at that length she is looking for one name, not reading top to bottom —
       and the card head carries how many children are in the room, counted
       off the rows beneath it
     - safety is the first thing on both screens, in clay, by name, with the
       condition spelled out. On My classes it also says which of her hours
       each child is in, grouped so a child in two of her classes is named
       once
     - "Mark all present" has come out of the page header and sits on the
       register itself as "Everyone is here", because the common case is that
       everybody came except one, and because a header button is the wrong
       place for the thing she taps first
     - Save is in a bar pinned to the bottom of the viewport with a line
       beside it saying how many children are still unmarked — the pattern
       the parent pass put on any screen whose whole purpose is one action
     - the Present and Absent buttons are full size rather than small, and
       each row says in words where the child stands: here, away today, or
       not marked yet
     - the page is called The register rather than Attendance, because that is
       what she is holding, and the card head carries the date she is marking.
       A class opened out of its own day says so rather than quietly writing
       Tuesday against Wednesday's room
     - an After-School class is titled by its programme name. The record's
       name, "1 hour · After-School", is a duration, and the two Monday
       classes were told apart only by small grey time text. The day is now
       the headline of the time chip and the age band is on the title, so no
       two rows read alike

   Every figure is derived from the rows on screen or read from Grove.data;
   nothing is written down. Whose classes these are comes from ctx.persona, so
   this screen and Today can never disagree about whose week this is. Names,
   ages, safety flags, rooms, hours, rolls and lesson plans all come from
   Grove.data — there is no list of children in this file. */
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

  /* The time chip wants a headline and a small line under it. Today's classes
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
  function oneToOne(c) { return c.cap <= 1 || c.band === '—'; }

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

  /* ---- who is in the room ----------------------------------------------------
     The roll is held on the children: each child's record carries the classes
     that child is in, and D.roster hands back the class's children. Read in
     name order, because a register of eighteen is scanned for one name rather
     than read from the top. */

  function byName(a, b) { return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0); }
  function roster(c) { return D.roster(c.id).sort(byName); }

  function flagged(list, kind) {
    return list.filter(function (s) { return s.flagKind === kind; });
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

  function tally(c, people) {
    var t = { present: 0, absent: 0, toMark: 0 };
    people.forEach(function (s) {
      var m = markOf(c.id, s.id);
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
    roster(c).forEach(function (s) { next[markKey(c.id, s.id)] = 'Present'; });
    Grove.set({ filters: next });
    Grove.toast('All marked present');
  });

  /* Counted from the marks against the list shown. Never a literal. */
  function registerState(c) {
    var people = roster(c);
    if (!people.length) return '';
    var t = tally(c, people);
    if (t.toMark === people.length) return ui.pill('Register not taken', 'amber');
    if (t.toMark) return ui.pill((people.length - t.toMark) + ' of ' + people.length + ' marked', 'amber');
    return ui.pill('Register taken', 'ok');
  }

  /* ---- my classes -------------------------------------------------------------
     Time is the organising principle: today, then the rest of the week. Every
     row is the tap target for its own register, which is the biggest target a
     row can be. */

  Grove.screen('sClasses', {
    surface: 'studio',
    crumbTitle: 'Classes',
    eyebrow: 'your week',
    title: 'My classes',
    sub: 'Today first, then the rest of the week. Tap a class to take its register. Only the classes you are assigned to — ask the office if one is missing.',
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
      var week = today.concat(rest);

      /* Safety before anything else, in clay, by name, with the hours she will
         be standing in front of that child. Grouped by child, so a child in
         two of her classes is named once, and read in teaching order, so the
         child she sees this morning is named first. */
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

      var onToday = today.length
        ? ui.card({ title: 'Today', flush: true }, ui.rows(today.map(function (c) {
            var plan = planFor(ctx, c);
            var bits = [c.room, plural(roster(c).length, 'child', 'children')];
            if (spansWeek(c)) bits.push('every day this week');
            if (plan) bits.push(plan.lesson);
            else if (oneToOne(c)) bits.push('one to one');
            return {
              lead: ui.timechip(clockChip(c.time)),
              title: ui.dot(D.program(c.prog).color) + ' ' + esc(titleOf(c)),
              sub: esc(bits.join(' · ')),
              end: registerState(c),
              to: 'sAttendance',
              id: c.id
            };
          })))
        : '';

      var later = ui.card({
        title: today.length ? 'The rest of your week' : 'Your week',
        flush: true
      }, rest.length
        ? ui.rows(rest.map(function (c) {
            var bits = [c.room, plural(roster(c).length, 'child', 'children')];
            if (oneToOne(c)) bits.push('one to one');
            return {
              lead: ui.timechip(dayChip(c)),
              title: ui.dot(D.program(c.prog).color) + ' ' + esc(titleOf(c)),
              sub: esc(bits.join(' · ')),
              to: 'sAttendance',
              id: c.id
            };
          }))
        : ui.empty('Nothing else this week', 'Everything you are assigned to runs today.'));

      /* The constraint, stated where she would go looking for a way around it. */
      var help = ui.notice({
        title: 'Something not right with a class?',
        text: 'Missing materials go through a supply request and the office picks it up. Rosters and lesson plans are set by the office, so ask the desk rather than working around them.',
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
     Sophia Martinez is named once and not once per class. The child's own
     classes come from the dataset; only the ones this teacher takes are
     named, because those are the hours she is responsible for. */
  function byChild(classes, kind) {
    var order = [], seen = {}, teaches = {};
    classes.forEach(function (c) { teaches[c.id] = true; });
    classes.forEach(function (c) {
      flagged(roster(c), kind).forEach(function (s) {
        if (!seen[s.id]) {
          seen[s.id] = { who: s, when: [] };
          order.push(seen[s.id]);
          D.classesOf(s).forEach(function (k) {
            if (teaches[k.id]) seen[s.id].when.push(dayTokens(k).join('–') + ' ' + startOf(k.time));
          });
        }
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
      var people = roster(c);
      var t = tally(c, people);

      var alerts = flagged(people, 'bad');
      var watch = flagged(people, 'warn');

      /* Safety before anything else, by name, in clay. This is the one place
         the allergy is spelled out — the rows below do not repeat it. */
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

      var lines = [];
      if (!runsOn(c, TODAY_DAY)) lines.push('This class does not run today.');
      lines.push('If a child is here and not on the list, tell the office and they will add them.');

      /* How many are in the room, counted off the rows beneath it, beside the
         button she taps first. On a register of eighteen the number is what
         tells her whether she is looking at the whole class. A one-to-one
         lesson has nothing to count and nothing to mark in bulk. */
      var head = people.length > 1
        ? '<div class="inline">' +
            ui.pill(plural(people.length, 'child', 'children')) +
            ui.btn({ label: 'Everyone is here', act: 'sMarkAll', cid: c.id }) +
          '</div>'
        : '';

      var register = ui.card({
        /* The card head carries the date being marked, so the page title can
           say what the screen is and the card can say which sitting it is. */
        title: runsOn(c, TODAY_DAY) ? D.today : c.day + ' · ' + c.time,
        flush: true,
        head: head,
        note: lines.join(' ')
      }, people.length
        ? ui.rows(people.map(function (s) {
            var m = markOf(c.id, s.id);
            var where = m === 'Present'
              ? '<span class="grove">Here</span>'
              : (m === 'Absent' ? '<span class="clay">Away today</span>' : 'Not marked yet');
            return {
              lead: esc('Age ' + s.age),
              title: esc(s.name),
              sub: where,
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
        <div class="section">${raw(register)}</div>
        ${raw(save)}
      `;
    }
  });
})();
