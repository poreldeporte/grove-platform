/* Studio → Today, and Today → Request supplies.

   Simplifications against the spec:
     - the clock control was a two-state toggle carrying its own label, colour
       and a remembered time. It is one header button and a toast; a clock-in
       is recorded in the console, not on a teacher's landing page. Which half
       of the pair it offers is read from Grove.data.STAFF
     - the safety banner's two hand-built rows are one bad notice. The names,
       the flags and which children carry one are read from Grove.data.STUDENTS
     - every class row opens Classes. The old build sent one row to Attendance
       and the other two to a toast that said nothing
     - the supply-request drawer is gone. Past what the row already shows it
       held a reorder point, a supplier and a lead time. The first two are on
       the row now, read from the store; nothing in the studio produces a lead
       time, so it is not claimed
     - the back button under the Supplies title is gone. The breadcrumb is the
       way back here as on every other screen
     - "Item" and "Which class" were free-text boxes. Both read from the data
       now, so a request cannot arrive naming something the studio does not
       stock, or a class nobody teaches

   Changes from the visual review:
     - the greeting is built from ctx.persona, never from a literal, so the
       name in the title is the name in the rail. Every "whose classes",
       "whose requests" filter on both screens reads the same persona
     - Today listed a 4:00pm Pop-Up taught by Marisol. Classes says "only the
       classes you are assigned to" and badges two sessions as today, so Today
       claimed a third session the rest of the portal does not have. Today's
       list is now the classes whose staff is the signed-in teacher, and the
       session count in the subtitle is the length of that list
     - "Request supplies" counted every pending request in the studio while
       the screen it opens is filtered to this teacher. It counts this
       teacher's pending requests, which is the list you land on
     - the time chip was tinted per programme, which set a plum chip beside a
       blue-violet dot on the same row. The chip is the plain one the Family
       schedule uses; the programme colour is carried once, by the dot
     - "not yet marked" was a literal that stayed put after you took the
       register. It reads the marks the register writes
     - Supplies was titled "Supplies" under a crumb reading "Request
       supplies", had no header action while its primary button sat at the
       foot of a card, clipped the "Which class" value in a half-width select,
       and left the "Your requests" card stretched and two-thirds empty. It is
       titled the one thing it is called everywhere else, the primary action is
       in the header where every other studio screen keeps it, the class select
       spans the form, and both columns are ui.col pairs so neither ends in
       dead space. The second right-hand card is the shelf running below its
       minimum, read from Grove.data.INVENTORY — the thing a teacher is about
       to ask for
     - the "All classes" link sat in the classes card's head, where a quiet
       small button's own padding left its label short of the 18/20 column
       directly beneath it. Classes keeps its "Today" link in the page header
       actions, so this one is there too and the pair reads the same way round.
       Every row in the card already opens Classes
     - the four quick cards' footer links were quiet buttons, whose padding
       started the label inside the title and the line above it, so the card's
       left edge broke at the footer. They are ordinary small buttons now, and
       a button's border is the edge

   Today's roster (c6, c11), the camp register and the camp room's
   lesson-focus phrase are the spec's, because the dataset holds no equivalent.
   Every other field on those rows comes from Grove.data.CLASSES,
   Grove.data.STUDENTS and Grove.data.LESSON_PLANS. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  var TODAY_DATE = '28 Jul 2026';
  var TODAY_DAY = 'Tue';                    /* Grove.data.today — Tuesday 28 July 2026 */
  var WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  /* Whose portal this is. Never a literal — the shell hands the persona to
     every screen and the rail shows the same person. */
  function teacher(ctx) {
    var who = (ctx && ctx.persona) || Grove.persona('studio');
    return (who && who.name) || '';
  }

  function firstName(name) { return String(name).split(' ')[0]; }

  /* What the camp room is making. The dataset publishes no plan for it today,
     so this one phrase is the spec's; every other room reads its focus from
     Grove.data.LESSON_PLANS. */
  var FOCUS = { c6: 'clay coil pots' };

  /* The camp register is the spec's, by child id — the dataset does not link a
     child to a class id. It is the same register the Classes screen uses.
     Which of them carries a safety flag is read from STUDENTS. */
  var CAMP_REGISTER = { c6: ['mia', 'emma', 'noah', 'sophia', 'iker', 'zara'] };

  function dayTokens(c) { return String(c.day).split(/[^A-Za-z]+/).filter(Boolean); }

  /* Handles 'Tue' and ranges like 'Mon–Fri'. Same rule as the Classes screen,
     so the two screens agree about what runs today. */
  function runsToday(c) {
    var t = dayTokens(c);
    if (!t.length) return false;
    if (t.length === 1) return t[0] === TODAY_DAY;
    var from = WEEK.indexOf(t[0]), to = WEEK.indexOf(t[t.length - 1]), i = WEEK.indexOf(TODAY_DAY);
    if (from === -1 || to === -1) return false;
    return i >= from && i <= to;
  }

  /* '10:00am' → 1000, '1:00pm' → 1300, so the day reads in order. */
  function minutes(range) {
    var s = startOf(range);
    var m = /^(\d+):(\d+)(am|pm)$/.exec(s);
    if (!m) return 0;
    var hour = parseInt(m[1], 10) % 12;
    if (m[3] === 'pm') hour += 12;
    return hour * 60 + parseInt(m[2], 10);
  }

  /* The signed-in teacher's sittings today, in the order she teaches them.
     Derived, so it can never name a class the Classes screen does not list. */
  function roster(ctx) {
    return D.CLASSES.filter(function (c) {
      return c.staff === teacher(ctx) && runsToday(c);
    }).sort(function (a, b) { return minutes(a.time) - minutes(b.time); });
  }

  /* "10:00am–1:00pm" → "10:00am". "1:00–2:00pm" → "1:00pm". */
  function startOf(range) {
    var parts = String(range).split('–');
    var m = /(am|pm)/.exec(parts[0]) || /(am|pm)/.exec(parts[1] || '');
    return parts[0].replace(/(am|pm)/, '') + (m ? m[1] : '');
  }

  /* The time chip wants a clock and a suffix: "10:00 AM". */
  function chipTime(range) {
    var s = startOf(range);
    var m = /(am|pm)$/.exec(s);
    return (m ? s.slice(0, -2) : s) + ' ' + (m ? m[1].toUpperCase() : '');
  }

  function me(ctx) {
    var name = teacher(ctx);
    return D.STAFF.filter(function (s) { return s.name === name; })[0] || D.STAFF[0];
  }

  /* Who is in the room. The camp register is named; a private lesson names its
     child in the class itself, which is how the Classes screen reads it too. */
  function childrenIn(c) {
    var named = CAMP_REGISTER[c.id];
    if (named) {
      return named.map(function (sid) { return D.student(sid); }).filter(Boolean);
    }
    return D.STUDENTS.filter(function (s) { return c.name.indexOf(s.name) !== -1; });
  }

  /* A medical alert, as the register screen counts one. */
  function alertsIn(c) {
    return childrenIn(c).filter(function (s) { return s.flagKind === 'bad'; });
  }

  /* The register is held in shared state under the key the Classes screen
     writes, so Today stops saying "not yet marked" once it has been taken. */
  function markedIn(c) {
    var n = 0;
    childrenIn(c).forEach(function (s) {
      if (Grove.filter('att-' + c.id + '-' + s.id, '')) n += 1;
    });
    return n;
  }

  /* The plan the office published for a room today, if there is one. */
  function planFor(ctx, c) {
    return D.LESSON_PLANS.filter(function (p) {
      return p.date === TODAY_DATE && p.room === c.room && p.teacher === teacher(ctx);
    })[0];
  }

  function myRequests(ctx) {
    var name = teacher(ctx);
    return D.SUPPLY_REQUESTS.filter(function (r) { return r.by === name; });
  }

  /* The count the tile shows has to be the count of the list it opens, which
     is this teacher's requests, not the studio's. */
  function myPending(ctx) {
    return myRequests(ctx).filter(function (r) { return r.status === 'Pending'; });
  }

  /* Below the minimum the office reorders at — the same test the console
     inventory screen uses, so the two never disagree. */
  function belowMinimum() {
    return D.INVENTORY.filter(function (i) { return i.on < i.min; });
  }

  /* A request sometimes names the shelf item more briefly ("Brushes · medium"
     for "Brushes · medium round"), so match on either prefix. */
  function stockFor(name) {
    return D.INVENTORY.filter(function (i) {
      return i.item === name || i.item.indexOf(name) === 0 || name.indexOf(i.item) === 0;
    })[0];
  }

  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  /* ---- today ----------------------------------------------------------------- */

  Grove.screen('sToday', {
    surface: 'studio',
    crumbTitle: 'Today',
    eyebrow: 'tuesday 28 july',
    title: function (ctx) { return 'Good morning, ' + firstName(teacher(ctx)); },
    sub: function (ctx) {
      return plural(roster(ctx).length, 'session', 'sessions') +
        ' today, camp week 4. Read the safety line before the doors open.';
    },
    /* Grove.data.STAFF already has Lauren clocked in at 09:58, and My time
       renders that same entry, so the button has to be the other half of the
       pair or the two screens contradict each other. */
    actions: function (ctx) {
      var on = me(ctx).status === 'Clocked in';
      return [
        { label: 'All classes', to: 'sClasses' },
        { label: on ? 'Clock out' : 'Clock in', kind: 'primary', msg: on ? 'Clocked out' : 'Clocked in' }
      ];
    },

    body: function (ctx) {
      var today = roster(ctx);

      /* Safety first — the one thing a teacher must read before the room
         fills. Every word of it is a fact from STUDENTS and CLASSES. */
      var lines = [];
      today.forEach(function (c) {
        var flagged = alertsIn(c);
        if (!flagged.length) return;
        lines.push(c.room + ' at ' + startOf(c.time) + '. ' + flagged.map(function (s) {
          return s.name + ' — ' + s.flag;
        }).join('. ') + '.');
      });

      var safety = lines.length
        ? ui.notice({
            kind: 'bad',
            title: 'Safety — today’s rooms',
            text: lines.join(' '),
            action: { label: 'Check the roster', to: 'sStudents' }
          })
        : ui.notice({
            kind: 'ok',
            title: 'Safety — today’s rooms',
            text: 'No medical alerts on today’s registers.',
            action: { label: 'Check the roster', to: 'sStudents' }
          });

      var classes = ui.card(
        {
          title: 'Your classes today',
          flush: true
        },
        today.length
          ? ui.rows(today.map(function (c) {
              var flags = alertsIn(c).length;
              var left = c.cap - c.en;
              var state = flags
                ? plural(flags, 'allergy', 'allergies')
                : (c.cap <= 1 ? '' : (left > 0 ? plural(left, 'place left', 'places left') : 'Full'));
              var p = planFor(ctx, c);
              var focus = (p && p.lesson) || FOCUS[c.id] || (c.band === '—' ? 'One to one' : c.band + ' group');

              return {
                lead: ui.timechip(chipTime(c.time)),
                title: ui.dot(D.program(c.prog).color) + ' ' + esc(c.name) +
                  (c.band && c.band !== '—' ? esc(' · ages ' + c.band) : ''),
                sub: esc(c.room + ' · ' + focus),
                end: '<div class="num strong">' + c.en + '/' + c.cap + '</div>' +
                  (state ? '<div class="row__sub' + (flags ? ' clay' : '') + '">' + esc(state) + '</div>' : ''),
                to: 'sClasses'
              };
            }))
          : ui.empty('Nothing on today', 'You are not assigned to a class that runs today.')
      );

      var next = today[0];
      var marked = next ? markedIn(next) : 0;

      var plan = D.LESSON_PLANS.filter(function (p) {
        return p.teacher === teacher(ctx) && p.date === TODAY_DATE;
      })[0];

      var pending = myPending(ctx).length;

      var quick = [
        {
          title: 'Take attendance',
          sub: next
            ? next.name + ' · ' + (marked ? plural(marked, 'child marked', 'children marked') : 'not yet marked')
            : 'No register to take today',
          cta: 'Mark the register',
          to: 'sAttendance',
          id: next ? next.id : null
        },
        {
          title: 'Lesson plan',
          sub: plan ? plan.lesson : 'Nothing published for today',
          cta: 'Open the plan',
          to: 'sLessons'
        },
        {
          title: 'Request supplies',
          sub: plural(pending, 'request pending', 'requests pending'),
          cta: 'Ask the office',
          to: 'sSupplies'
        },
        {
          title: 'Student notes',
          sub: 'Add a note after class',
          cta: 'Write a note',
          to: 'sStudents'
        }
      ].map(function (q) {
        return ui.card(
          { title: q.title, foot: ui.btn({ label: q.cta, size: 'sm', to: q.to, id: q.id }) },
          h`<p class="hint">${q.sub}</p>`
        );
      });

      return h`
        <div class="stack">${raw(safety)}</div>
        <div class="section">${raw(classes)}</div>
        <div class="section">${raw(ui.grid(2, quick))}</div>
      `;
    }
  });

  /* ---- request supplies --------------------------------------------------------- */

  Grove.screen('sSupplies', {
    surface: 'studio',
    crumbs: [{ label: 'Today', to: 'sToday' }],
    eyebrow: 'what the room needs',
    title: 'Request supplies',
    sub: 'Ask for what you need. An administrator approves, and stock updates when it arrives.',
    actions: [
      { label: 'Send request', kind: 'primary', msg: 'Request sent to the office' }
    ],

    body: function (ctx) {
      var items = D.INVENTORY.map(function (i) { return i.item; });

      var classOptions = D.CLASSES.filter(function (c) { return c.staff === teacher(ctx); })
        .map(function (c) { return c.name + ' · ' + c.day + ' ' + startOf(c.time); })
        .concat(['Everyday stock']);

      /* "Which class" spans the form. At half width the value it builds is
         longer than the control and the studio's own class names get cut. */
      var request = ui.card(
        { title: 'New request' },
        ui.fields(2, [
          ui.field({
            label: 'Item',
            hint: 'If it is not on the list, say so in your notes.',
            control: ui.select({ options: items })
          }),
          ui.field({
            label: 'Quantity',
            hint: 'Units, as the shelf counts them.',
            control: ui.input({ type: 'number', placeholder: 'e.g. 24' })
          }),
          ui.field({
            label: 'Which class',
            span: true,
            hint: 'Everyday stock if it is not for one room.',
            control: ui.select({ options: classOptions })
          })
        ])
      );

      var notes = ui.card(
        {
          title: 'Notes for the office',
          fill: true,
          note: 'The office approves requests once a day, usually before noon.'
        },
        ui.field({
          grow: true,
          label: 'What it is for',
          control: ui.textarea({ placeholder: 'What it is for, and when you need it by' })
        })
      );

      var mine = myRequests(ctx);

      var open = ui.card(
        {
          title: 'Your requests',
          flush: true,
          note: 'Pending is with the office. Fulfilled is on the shelf in Studio 1.'
        },
        mine.length
          ? ui.rows(mine.map(function (r) {
              var stock = stockFor(r.item);
              return {
                lead: esc(r.when),
                title: esc(r.item + ' · ' + plural(r.qty, 'unit', 'units')),
                sub: esc(stock
                  ? 'Stock is at ' + stock.on + ' against a minimum of ' + stock.min + ' · ' + stock.supplier
                  : 'Not tracked on the shelf.'),
                end: ui.pill(r.status, r.kind)
              };
            }))
          : ui.empty('Nothing outstanding', 'Requests you send appear here until the office fulfils them.')
      );

      var low = belowMinimum();

      var shelf = ui.card(
        {
          title: 'Running low on the shelf',
          head: low.length
            ? ui.pill(plural(low.length, 'below minimum', 'below minimum'), 'bad')
            : ui.pill('All stocked', 'ok'),
          flush: true,
          note: 'The minimum is the point at which an item joins the next purchase order. Asking here is how it gets on to one.'
        },
        low.length
          ? ui.rows(low.map(function (i) {
              return {
                title: esc(i.item),
                sub: esc(i.on + ' on hand against a minimum of ' + i.min + ' · ' + i.supplier),
                end: ui.pill(i.status, i.kind)
              };
            }))
          : ui.empty('Nothing is short', 'Every tracked item is at or above its minimum.')
      );

      return ui.grid(2, [ui.col([request, notes]), ui.col([open, shelf])]);
    }
  });
})();
