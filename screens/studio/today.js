/* Studio → Today, and Today → Request supplies.

   WHO THIS SCREEN IS FOR
   Lauren Ortiz teaches. She reads this on a tablet propped against a shelf, or
   on a phone in her apron, with about three minutes before the doors open and
   clay on her hands. She needs four things, in this order: who in the room has
   an allergy, the register, what she is teaching, and now and then her hours.
   The studio's own numbers — fill against capacity, places left, attendance
   percentages, what a class is worth — are the owner's, and they live on the
   owner's screens.

   Cut in this pass
     - "18/20" and "2 places left" from every class row. A teacher taking a
       register does not need to know that eighteen of twenty places are sold.
       The row's end carries the one fact she does need from it: whether the
       register has been taken yet
     - the four quick-action cards at the foot. Four titled cards, each with a
       body and a footer button, for four one-line shortcuts, filled half the
       page. They are four rows in one card, because that is what a shortcut
       list is
     - "Take attendance" as a shortcut. The register is the header's primary
       action and every class row opens it, so a third route to it was noise
     - the supplier and the stock line on the supply-request rows, and the
       whole "Running low on the shelf" card. What is left of an item now
       rides on the item you are choosing, so the screen says it once; who the
       studio buys from is the office's business, not a teacher's
     - the item dropdown. Choosing a supply is picking one thing off a shelf,
       which is a finger job, so it is a column of large choices carrying what
       is left of each one, with "something else" as the last of them. A
       request can still not name something the studio does not stock
     - "It is on the shelf in Studio 1" from a fulfilled request. Nothing in
       the studio records where a delivered item lands, and a teacher sent to
       the wrong room by a line the screen invented is worse off than one who
       was only told it had arrived

   Carried over from the parent pass
     - Supplies has one purpose, which is to send one request, so its primary
       action is in a bar pinned to the bottom of the viewport with a line
       beside it saying what is about to be asked for. It is no longer a
       header button sitting above a form the eye has to travel back up to
     - the shelf is picked with ui.choice({size:'lg'}), not a select
     - both columns are ui.col pairs, so neither ends in dead space
     - every figure is counted from the rows on screen. The session count, the
       allergy count, the register state, the pending-request count and the
       hours are all derived; none of them is written down

   Changes from the visual review
     - who is in a room comes off the class roll, Grove.data.roster, so the
       safety line names the children Lauren will actually be standing in
       front of and the register she opens from the same row holds exactly
       that list
     - a second, quieter line for the children who are not an allergy but are
       worth knowing about, which is what the register screen already does
     - "not yet marked" reads the marks the register writes, and says so in
       the register's own words
     - the supply request's "Which class" list put Tuesday's private lesson
       above Monday's after-school hour, because it sorted on the clock alone.
       It reads down her week now: the day first, then the hour

   Now the rolls are full
     - every class row carries how many children are on its roll. A full camp
       room and a one-to-one hour are not the same morning, and the headcount
       is the first thing the row is asked for. It is the length of the roll,
       counted; how many places were sold is still the owner's business
     - the safety line reads every child on every roll she has today, and it
       is drawn per child: a child in two of her rooms is one warning naming
       both rooms, not the same warning twice
     - the row's second line used to fall back to the age band when the office
       had published no plan, which is what the row's own title already says.
       The repeat is gone and the headcount stands in its place

   What the screen decides, because the office has not
     - the camp room's lesson focus. Every other room reads its focus from
       Grove.data.LESSON_PLANS. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  var TODAY_DATE = '28 Jul 2026';
  var TODAY_DAY = 'Tue';                    /* Grove.data.today — Tuesday 28 July 2026 */
  var WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  /* What the camp room is making. The office has published no plan for it
     today, so this one phrase is the spec's. */
  var FOCUS = { c6: 'clay coil pots' };

  /* ---- words ---------------------------------------------------------------
     A teacher reads a sentence faster than she reads a tile. "Two children in
     your rooms today" beats a stat cell reading 2. */

  var WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];
  function words(n) { return WORDS[n] || String(n); }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  function firstName(name) { return String(name).split(' ')[0]; }

  function sentenceList(items) {
    if (items.length < 2) return items.join('');
    return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
  }

  /* ---- whose portal this is ------------------------------------------------
     Never a literal. The shell hands the persona to every screen and the rail
     shows the same person. */

  function teacher(ctx) {
    var who = (ctx && ctx.persona) || Grove.persona('studio');
    return (who && who.name) || '';
  }
  function me(ctx) {
    var name = teacher(ctx);
    return D.STAFF.filter(function (s) { return s.name === name; })[0] || D.STAFF[0];
  }

  /* ---- time ----------------------------------------------------------------- */

  function dayTokens(c) { return String(c.day).split(/[^A-Za-z]+/).filter(Boolean); }

  /* Handles 'Tue' and ranges like 'Mon–Fri'. Same rule as the Classes screen,
     so the two screens agree about what runs when. */
  function runsOn(c, day) {
    var t = dayTokens(c);
    if (!t.length) return false;
    if (t.length === 1) return t[0] === day;
    var from = WEEK.indexOf(t[0]), to = WEEK.indexOf(t[t.length - 1]), i = WEEK.indexOf(day);
    if (from === -1 || to === -1) return false;
    return i >= from && i <= to;
  }

  /* "10:00am–1:00pm" → "10:00am". "1:00–2:00pm" → "1:00pm". */
  function startOf(range) {
    var parts = String(range).split('–');
    var m = /(am|pm)/.exec(parts[0]) || /(am|pm)/.exec(parts[1] || '');
    return parts[0].replace(/(am|pm)/, '') + (m ? m[1] : '');
  }

  /* '10:00am' → 1000, '1:00pm' → 1300, so the day reads in the order she
     teaches it. */
  function minutes(range) {
    var m = /^(\d+):(\d+)(am|pm)$/.exec(startOf(range));
    if (!m) return 0;
    var hour = parseInt(m[1], 10) % 12;
    if (m[3] === 'pm') hour += 12;
    return hour * 60 + parseInt(m[2], 10);
  }

  /* The time chip wants a clock and a suffix: "10:00 AM". */
  function chipTime(range) {
    var s = startOf(range);
    var m = /(am|pm)$/.exec(s);
    return (m ? s.slice(0, -2) : s) + ' ' + (m ? m[1].toUpperCase() : '');
  }

  function byTime(a, b) { return minutes(a.time) - minutes(b.time); }

  /* Her week in the order she teaches it: the day first, then the hour.
     Sorted on the clock alone, Monday's 2:15 lands after Tuesday's 1:00. */
  function dayIndex(c) {
    var i = WEEK.indexOf(dayTokens(c)[0]);
    return i === -1 ? WEEK.length : i;
  }
  function byDayTime(a, b) { return (dayIndex(a) - dayIndex(b)) || byTime(a, b); }

  /* An After-School record is named by its length ("1 hour · After-School"),
     which is a duration and not a class name, so those rows carry the
     programme name instead. Same rule as the family schedule. */
  function className(c) {
    return c.prog === 'as' ? D.program(c.prog).name : c.name;
  }

  /* The signed-in teacher's sittings on a given day, in teaching order. */
  function classesOn(ctx, day) {
    var who = teacher(ctx);
    return D.CLASSES.filter(function (c) {
      return c.staff === who && runsOn(c, day);
    }).sort(byTime);
  }
  function roster(ctx) { return classesOn(ctx, TODAY_DAY); }
  function tomorrow() { return WEEK[WEEK.indexOf(TODAY_DAY) + 1] || ''; }

  /* ---- who is in the room --------------------------------------------------
     A class's roll is a fact, not an inference: Grove.data.roster(classId)
     returns the children enrolled in it. The register reads the same call, so
     the safety line and the register can never disagree about who is in the
     room. A child's own record still writes their class in words — that is
     for reading, not for joining. */

  function childrenIn(c) { return D.roster(c.id); }

  function flagged(c, kind) {
    return childrenIn(c).filter(function (s) { return s.flagKind === kind; });
  }

  /* A child can be on two of her rolls in one day — Oscar Zamora is in the
     camp room at ten and the pop-up at four — so the safety line is drawn per
     child and names every room she will have them in. Walking the rooms
     instead would count the same child twice and put the same warning on
     screen twice. */
  function flaggedToday(classes, kind) {
    var seen = {}, out = [];
    classes.forEach(function (c) {
      var where = c.room + ' from ' + startOf(c.time);
      flagged(c, kind).forEach(function (s) {
        if (seen[s.id]) { seen[s.id].where.push(where); return; }
        seen[s.id] = { who: s, where: [where] };
        out.push(seen[s.id]);
      });
    });
    return out;
  }

  function safetyLine(e) {
    return e.who.name + ' — ' + e.who.flag + '. ' + sentenceList(e.where) + '.';
  }

  /* The register is held in shared state under the key the Classes screen
     writes, so Today stops saying "not taken" once it has been taken. */
  function markedIn(c) {
    var n = 0;
    childrenIn(c).forEach(function (s) {
      if (Grove.filter('att-' + c.id + '-' + s.id, '')) n += 1;
    });
    return n;
  }

  /* ---- the office's published work ------------------------------------------ */

  function plansToday(ctx) {
    var who = teacher(ctx);
    return D.LESSON_PLANS.filter(function (p) {
      return p.date === TODAY_DATE && p.teacher === who;
    });
  }
  function planFor(ctx, c) {
    return plansToday(ctx).filter(function (p) { return p.room === c.room; })[0];
  }

  function myRequests(ctx) {
    var who = teacher(ctx);
    return D.SUPPLY_REQUESTS.filter(function (r) { return r.by === who; });
  }
  function myPending(ctx) {
    return myRequests(ctx).filter(function (r) { return r.status === 'Pending'; });
  }

  /* ---- today ----------------------------------------------------------------- */

  Grove.screen('sToday', {
    surface: 'studio',
    crumbTitle: 'Today',
    eyebrow: 'tuesday 28 july',
    title: function (ctx) { return 'Good morning, ' + firstName(teacher(ctx)); },
    sub: function (ctx) {
      var n = roster(ctx).length;
      if (!n) return 'You are not teaching today. Your classes, your students and your hours are in the rail.';
      if (n === 1) return 'One session today. Read the safety line before the doors open.';
      return words(n) + ' sessions today, in the order you teach them. Read the safety line before the doors open.';
    },

    /* The register is what she is here to do, so it is the primary action and
       it goes straight to the room she is about to stand in. Her hours matter
       occasionally, so the clock is the quiet button beside it — and
       Grove.data.STAFF already has Lauren clocked in at 09:58, so it has to
       offer the other half of the pair or My time contradicts it. */
    actions: function (ctx) {
      var on = me(ctx).status === 'Clocked in';
      var next = roster(ctx)[0];
      return [
        { label: on ? 'Clock out' : 'Clock in', msg: on ? 'Clocked out' : 'Clocked in' },
        next
          ? { label: 'Take the register', kind: 'primary', to: 'sAttendance', id: next.id }
          : { label: 'All classes', kind: 'primary', to: 'sClasses' }
      ];
    },

    body: function (ctx) {
      var today = roster(ctx);

      /* Safety first, by name, in clay. Every word of it is a fact from the
         class rolls and the children's own records. The children carrying a
         red flag are not all allergies — an inhaler and a care plan are on
         the same list — so the line counts safety notes, which is what they
         all are and what the screen they open is called. */
      var alerts = flaggedToday(today, 'bad');
      var watch = flaggedToday(today, 'warn');

      var safety = alerts.length
        ? ui.notice({
            kind: 'bad',
            title: alerts.length === 1
              ? 'One child in your rooms today has a safety note'
              : words(alerts.length) + ' children in your rooms today have safety notes',
            text: alerts.map(safetyLine).join(' '),
            action: { label: 'All safety notes', to: 'sStudents' }
          })
        : ui.notice({
            kind: 'ok',
            title: 'No safety notes in your rooms today',
            text: 'Nothing flagged on the children you have. The full notes are on the students screen.',
            action: { label: 'All safety notes', to: 'sStudents' }
          });

      var watching = watch.length
        ? ui.notice({
            kind: 'warn',
            title: 'Worth knowing before the doors open',
            text: watch.map(safetyLine).join(' ')
          })
        : '';

      /* The day, in the order she teaches it. Each row opens its own register,
         which is the biggest tap target a row can be, and the end of the row
         says whether that register has been taken. */
      var day = ui.card(
        {
          title: 'Your day',
          flush: true,
          /* Only worth saying when there is a row to tap. */
          note: today.length
            ? 'Tap a class to take its register. What you are teaching is set by the office — ' +
              'you can read a plan here, not change it.'
            : ''
        },
        today.length
          ? ui.rows(today.map(function (c) {
              var p = planFor(ctx, c);
              var focus = (p && p.lesson) || FOCUS[c.id] || '';
              return {
                lead: ui.timechip(chipTime(c.time)),
                title: ui.dot(D.program(c.prog).color) + ' ' + esc(className(c)) +
                  (c.band && c.band !== '—' ? esc(' · ages ' + c.band) : ''),
                sub: esc([c.room, focus, plural(childrenIn(c).length, 'child', 'children')]
                  .filter(Boolean).join(' · ')),
                end: registerState(c),
                to: 'sAttendance',
                id: c.id
              };
            }))
          : ui.empty('Nothing on today', 'You are not assigned to a class that runs today.')
      );

      var next = tomorrow() ? classesOn(ctx, tomorrow()) : [];
      var later = ui.notice({
        title: 'After today',
        text: next.length
          ? 'Tomorrow you have ' + sentenceList(next.map(function (c) {
              return className(c) + ' at ' + startOf(c.time);
            })) + '.'
          : 'Nothing on your schedule tomorrow.',
        action: { label: 'All classes', to: 'sClasses' }
      });

      var plans = plansToday(ctx);
      var pending = myPending(ctx).length;
      var staff = me(ctx);

      var shortcuts = ui.card({ title: 'Shortcuts', flush: true }, ui.rows([
        {
          title: 'Lesson plans',
          sub: plans.length === 1
            ? esc(plans[0].lesson)
            : (plans.length ? esc(words(plans.length) + ' published for today') : 'Nothing published for today'),
          to: 'sLessons'
        },
        {
          title: 'Request supplies',
          sub: pending
            ? esc(plural(pending, 'request with the office', 'requests with the office'))
            : 'Nothing outstanding',
          to: 'sSupplies'
        },
        {
          title: 'Student notes',
          sub: 'Allergies, who collects them, and a note after class',
          to: 'sStudents'
        },
        {
          title: 'My hours',
          sub: esc(staff.hrs + ' hours this week · ' + staff.status),
          to: 'sTime'
        }
      ]));

      return h`
        ${raw(safety)}${raw(watching)}
        <div class="section">${raw(day)}</div>
        <div class="section">${raw(later)}</div>
        <div class="section">${raw(shortcuts)}</div>
      `;
    }
  });

  /* Counted from the marks the register writes, against the list the register
     shows. Never a literal. */
  function registerState(c) {
    var people = childrenIn(c);
    if (!people.length) return '';
    var marked = markedIn(c);
    if (!marked) return ui.pill('Register not taken', 'amber');
    if (marked < people.length) return ui.pill(marked + ' of ' + people.length + ' marked', 'amber');
    return ui.pill('Register taken', 'ok');
  }

  /* ---- request supplies ---------------------------------------------------
     One purpose, one action. The shelf is the question, so the shelf is the
     list: what is left of each item is on the item itself, and the answer is
     tapped rather than chosen from a dropdown. The button that sends it is
     pinned to the bottom of the viewport with a line beside it naming what is
     about to be asked for. */

  var OTHER = 'other';

  Grove.on('pickSupply', function (d) { Grove.setFilter('supplyItem', d.id); });

  function chosen() { return Grove.filter('supplyItem', ''); }
  function itemOf(id) {
    return D.INVENTORY.filter(function (i) { return i.id === id; })[0];
  }

  /* What a teacher needs to know about an item: whether it is there. The
     supplier and the unit cost are the office's business. */
  function shelfLine(i) {
    return i.on < i.min
      ? i.on + ' left on the shelf — under the ' + i.min + ' the office keeps'
      : i.on + ' on the shelf';
  }

  Grove.screen('sSupplies', {
    surface: 'studio',
    crumbs: [{ label: 'Today', to: 'sToday' }],
    crumbTitle: 'Request supplies',
    eyebrow: 'what the room needs',
    title: 'Request supplies',
    sub: 'Tap what you need. An administrator approves it, and the shelf updates when it arrives.',

    body: function (ctx) {
      var picked = chosen();

      var options = D.INVENTORY.map(function (i) {
        return ui.choice({
          id: i.id,
          size: 'lg',
          act: 'pickSupply',
          title: i.item,
          sub: shelfLine(i),
          on: i.id === picked
        });
      });
      options.push(ui.choice({
        id: OTHER,
        size: 'lg',
        act: 'pickSupply',
        title: 'Something else',
        sub: 'Name it in your notes below and the office will find it',
        on: picked === OTHER
      }));

      var what = ui.card({ title: 'What do you need?' }, ui.choices(null, options));

      /* Her own classes, named the way the studio names them. "Everyday stock"
         is the last option because most of what a room runs out of belongs to
         no single class. */
      var classOptions = D.CLASSES.filter(function (c) { return c.staff === teacher(ctx); })
        .sort(byDayTime)
        .map(function (c) { return D.program(c.prog).short + ' · ' + c.day + ' ' + startOf(c.time); })
        .concat(['Everyday stock']);

      var details = ui.card(
        { title: 'How many, and what for' },
        ui.fields(2, [
          ui.field({
            label: 'How many',
            hint: 'Units, as the shelf counts them.',
            control: ui.input({ type: 'number', placeholder: 'e.g. 24' })
          }),
          ui.field({
            label: 'Which class',
            hint: 'Everyday stock if it is not for one room.',
            control: ui.select({ options: classOptions })
          }),
          ui.field({
            label: 'What it is for',
            span: true,
            control: ui.textarea({ placeholder: 'What it is for, and when you need it by' })
          })
        ])
      );

      var mine = myRequests(ctx);

      var open = ui.card(
        {
          title: 'Your requests',
          flush: true,
          note: 'These are yours. The office sees every teacher’s.'
        },
        mine.length
          ? ui.rows(mine.map(function (r) {
              return {
                title: esc(r.item + ' · ' + plural(r.qty, 'unit', 'units')),
                sub: esc(r.status === 'Fulfilled'
                  ? 'Asked for on ' + r.when + '. It is on the shelf.'
                  : 'Asked for on ' + r.when + '. The office has not answered yet.'),
                end: ui.pill(r.status, r.kind)
              };
            }))
          : ui.empty('Nothing outstanding', 'Requests you send appear here until the office fulfils them.')
      );

      var help = ui.card({ title: 'If it cannot wait' }, h`
        <p class="hint">Requests are approved once a day, usually before noon. If you need
        something for this morning, ring the desk on ${D.STUDIO.phone} instead.</p>
      `);

      var item = itemOf(picked);
      var hint = item
        ? 'Asking for ' + item.item
        : (picked === OTHER ? 'Say what you need in your notes' : 'Tap what you need above');
      var sent = item
        ? 'Request sent to the office — ' + item.item
        : 'Request sent to the office';

      return h`
        ${raw(ui.grid('sidebar', [ui.col([what, details]), ui.col([open, help])]))}
        ${raw(ui.formActions([
          { label: 'Send the request', kind: 'primary', msg: sent },
          { label: 'Cancel', to: 'sToday' }
        ], { sticky: true, hint: hint }))}
      `;
    }
  });
})();
