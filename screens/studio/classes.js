/* Studio → My classes, and the register.

   Simplifications against the spec:
     - no toolbar. Lauren teaches five classes; a search box, a tab rail and a
       result count over five cards is furniture, not navigation. The cards are
       ordered with today's classes first, which is the only sort a teacher
       wants
     - the staffClass overlay is gone. Its four sections held the when, the
       room, the fill, the roster size, the allergy count and two lines of
       "ask the office". The first four are already on the class card, the
       allergy count is now a clay pill in the card foot and again at the top
       of the register, and the two lines are one notice at the foot of the
       screen. Every card goes where the overlay's primary button went —
       straight to the register
     - three marks (Present, Absent, Late) are two. A child who arrives late is
       in the room, and nothing downstream — billing, make-up credits, the
       family portal — reads the difference
     - the avatar circles are dropped. There is no avatar in the component set
       outside the rail, and a coloured initial carries nothing the name does
       not

   Changes from the visual review:
     - the register said "on the roster 6" under a class the whole app reports
       as 18 of 20 enrolled. Nothing on this screen now states a total it has
       not derived: the strip carries the class fact (18 of 20, from
       Grove.data.CLASSES) beside the length of the list actually shown ("6 of
       18"), "marked" counts that same list, and the card says in words why the
       two differ. It is the sentence Console → Classes already uses about the
       same gap, so the two screens tell one story
     - which children are on a class roster is now worked out with the same
       rules Console → Classes uses, so a child cannot appear on a register
       here and be missing from the same class's roster there. The camp week is
       still the spec's named list, because the dataset links no child to a
       camp class; it is the same six ids Today reads
     - who "my classes" belongs to is read from ctx.persona, never from a
       literal name, so this screen and Today can never disagree about whose
       classes these are
     - the footer button was quiet, so its label floated 13px inside the card's
       content edge while every row label above it sat flush. It is an ordinary
       small button now: its border starts where the card's content starts
     - a one-to-one lesson is no longer dressed as a warning. "1 of 1" was clay
       with a full amber bar, the same treatment as a genuinely over-subscribed
       class. A private lesson reads "one to one", carries no capacity bar, and
       nothing on it is red
     - the two after-school cards were told apart only by the small grey time
       in their headers. The room is in the header now and the age band leads
       the card, so the two differ on their first line and their title
     - the fifth class card sat alone in the last row. The "ask the office"
       notice is the sixth cell of the same grid, so the grid closes out
     - the same two allergy facts were stated three times: a banner, a stat
       cell and a pill on the child's row. The pill also made the one row
       without a flag 6px shorter than its neighbours, so the list's rhythm
       broke on Noah Rivera. The facts are stated once, by name, in the clay
       banner at the top; the stat cell and the row pills are gone and every
       register row is now the same height

   Roster membership: the camp register is the spec's, by child id. Everything
   shown about each child — name, age, family, safety flag, attendance — is read
   from Grove.data.STUDENTS. Every other class works its roster out from the
   dataset the way Console → Classes does: the child's recorded class has to
   match this class's day and then its room, its start time or its age band. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  var TODAY_DAY = 'Tue';                    /* Grove.data.today — Tuesday 28 July 2026 */
  var WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  /* The camp register is the spec's, by child id — the dataset does not link a
     child to a class id. Today reads the same six. */
  var CAMP_REGISTER = { c6: ['mia', 'emma', 'noah', 'sophia', 'iker', 'zara'] };

  /* ---- helpers ------------------------------------------------------------ */

  /* Whose portal this is. Never a literal — the shell hands the persona to
     every screen and the rail shows the same person. */
  function teacher(ctx) {
    var who = (ctx && ctx.persona) || Grove.persona('studio');
    return (who && who.name) || '';
  }

  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  /* "6 of 18" when the list is short of the enrolment, "18" when it is not. */
  function countOf(shown, total) {
    return shown === total ? String(shown) : shown + ' of ' + total;
  }

  function dayTokens(c) { return String(c.day).split(/[^A-Za-z]+/).filter(Boolean); }

  /* Handles 'Mon' and ranges like 'Mon–Fri'. */
  function runsOn(c, day) {
    var t = dayTokens(c);
    if (!t.length) return false;
    if (t.length === 1) return t[0] === day;
    var from = WEEK.indexOf(t[0]), to = WEEK.indexOf(t[t.length - 1]), i = WEEK.indexOf(day);
    if (from === -1 || to === -1) return false;
    return i >= from && i <= to;
  }

  /* '2:15–3:15pm' → '2:15pm', the form a child's record writes. */
  function startTime(c) {
    var parts = String(c.time).split('–');
    var a = String(parts[0] || '').toLowerCase();
    if (a.indexOf('am') !== -1 || a.indexOf('pm') !== -1) return a;
    var b = String(parts[1] || '').toLowerCase();
    return a + (b.indexOf('am') !== -1 ? 'am' : (b.indexOf('pm') !== -1 ? 'pm' : ''));
  }

  function weekOf(name) {
    var m = /week \d+/.exec(String(name).toLowerCase());
    return m ? m[0] : null;
  }

  function classOf(id) {
    return D.CLASSES.filter(function (c) { return c.id === id; })[0];
  }

  function oneToOne(c) { return c.cap <= 1; }

  /* The signed-in teacher's classes, the ones running today first. */
  function mine(ctx) {
    var who = teacher(ctx);
    return D.CLASSES.filter(function (c) { return c.staff === who; })
      .sort(function (a, b) {
        var ra = runsOn(a, TODAY_DAY) ? 0 : 1;
        var rb = runsOn(b, TODAY_DAY) ? 0 : 1;
        if (ra !== rb) return ra - rb;
        return WEEK.indexOf(dayTokens(a)[0]) - WEEK.indexOf(dayTokens(b)[0]);
      });
  }

  function enrolled(s) {
    return s.cls.indexOf('Waitlisted') === -1 && s.cls.indexOf('Not yet enrolled') === -1;
  }

  /* The dataset writes a child's placement as free text ("Mon 3:15pm · Studio
     2", "Camp week 4 · Clay Room", "Mon, Wed, Thu"), so membership is matched
     on the signals those strings carry. Same rules as Console → Classes, so a
     child is on the same rosters in both portals. */
  function onRoster(c, s) {
    if (!enrolled(s)) return false;

    var text = String(s.cls).toLowerCase();
    if (String(c.name).toLowerCase().indexOf(String(s.name).toLowerCase()) !== -1) return true;

    var roomHit = text.indexOf(String(c.room).toLowerCase()) !== -1;

    /* Camp runs Mon–Fri, so a weekday alone proves nothing: a camp roster is
       the children recorded against that week AND that room. */
    var week = weekOf(c.name);
    if (week) return text.indexOf(week) !== -1 && roomHit;

    var dayHit = dayTokens(c).filter(function (d) {
      return text.indexOf(d.toLowerCase()) !== -1;
    }).length > 0;
    if (!dayHit) return false;

    /* A child recorded by days alone joins any class on one of those days in
       their own age band. */
    if (text.indexOf('·') === -1) return s.band === c.band;

    return roomHit || text.indexOf(startTime(c)) !== -1;
  }

  function roster(c) {
    var named = CAMP_REGISTER[c.id];
    if (named) {
      return named.map(function (id) { return D.student(id); }).filter(Boolean);
    }
    return D.STUDENTS.filter(function (s) { return onRoster(c, s); });
  }

  function allergies(list) {
    return list.filter(function (s) { return s.flagKind === 'bad'; });
  }
  function worthKnowing(list) {
    return list.filter(function (s) { return s.flagKind === 'warn'; });
  }

  /* ---- marks --------------------------------------------------------------
     Held in Grove.state so the register survives a redraw. */

  function markKey(cid, sid) { return 'att-' + cid + '-' + sid; }
  function markOf(cid, sid) { return Grove.filter(markKey(cid, sid), ''); }

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

  /* ---- my classes ---------------------------------------------------------- */

  Grove.screen('sClasses', {
    surface: 'studio',
    crumbTitle: 'Classes',
    eyebrow: 'yours this term',
    title: 'My classes',
    sub: 'Only the classes you are assigned to. Ask an administrator if something is missing.',
    actions: [
      { label: 'Today', to: 'sToday' },
      { label: 'Take the register', kind: 'primary', to: 'sAttendance' }
    ],

    body: function (ctx) {
      var cards = mine(ctx).map(function (c) {
        var people = roster(c);
        var alert = allergies(people).length;
        var solo = oneToOne(c);
        var left = c.cap - c.en;

        /* A private lesson at 1 of 1 is its normal state, not a warning. */
        var tag = runsOn(c, TODAY_DAY)
          ? ui.pill('Today', 'ok')
          : (solo
              ? ui.pill('One to one', null)
              : (left > 0 ? ui.pill(plural(left, 'place left', 'places left'), null)
                          : ui.pill('Full', 'amber')));

        var facts = ui.kv([
          ['Ages', solo || c.band === '—' ? 'One to one' : esc(c.band)],
          ['Class', esc(c.name)],
          {
            k: 'Enrolled',
            v: esc(c.en + ' of ' + c.cap + (c.wl ? ' · ' + c.wl + ' waiting' : '')),
            tone: !solo && c.en >= c.cap ? 'clay' : null
          }
        ]);

        return ui.card({
          title: c.day + ' · ' + c.time + ' · ' + c.room,
          head: tag,
          foot: ui.btn({ label: 'Take the register', size: 'sm', to: 'sAttendance', id: c.id }) +
            (alert ? ui.pill(plural(alert, 'allergy', 'allergies'), 'bad') : '')
        }, h`<div class="stack stack--sm">${raw(facts)}${raw(solo ? '' : ui.meter(c.en, c.cap))}</div>`);
      });

      /* The last cell of the same grid, so the class cards never end on a row
         with one card and an empty half. */
      var help = ui.notice({
        title: 'Something not right with a class?',
        text: 'Missing materials go through a supply request and the office picks it up. Rosters and lesson plans are set by the office, so ask the desk rather than working around them.',
        action: { label: 'Request supplies', to: 'sSupplies' }
      });

      return ui.grid(2, cards.concat([help]));
    }
  });

  /* ---- the register --------------------------------------------------------- */

  function current(ctx) {
    return classOf(ctx.params.id) || mine(ctx)[0];
  }

  Grove.screen('sAttendance', {
    surface: 'studio',
    crumbs: [{ label: 'Classes', to: 'sClasses' }],
    crumbTitle: 'Attendance',
    eyebrow: 'who is in the room',
    title: 'Attendance',
    sub: function (ctx) {
      var c = current(ctx);
      return c.name + ' · ' + c.day + ' ' + c.time + ' · ' + c.room +
        '. Mark every child present or absent, then save.';
    },
    actions: function (ctx) {
      return [
        { label: 'Mark all present', act: 'sMarkAll', cid: current(ctx).id },
        { label: 'Save attendance', kind: 'primary', msg: 'Attendance saved' }
      ];
    },

    body: function (ctx) {
      var c = current(ctx);
      var people = roster(c);

      var present = 0, absent = 0;
      people.forEach(function (s) {
        var m = markOf(c.id, s.id);
        if (m === 'Present') present++;
        else if (m === 'Absent') absent++;
      });
      var toMark = people.length - present - absent;

      var flagged = allergies(people);
      var watch = worthKnowing(people);

      /* Safety before anything else, by name, in clay. This is the one place
         the allergy is spelled out — the register rows below do not repeat it. */
      var safety = flagged.length
        ? ui.notice({
            kind: 'bad',
            title: plural(flagged.length,
              'child in this room has an allergy',
              'children in this room have an allergy'),
            text: flagged.map(function (s) { return s.name + ' — ' + s.flag; }).join('. ') + '.',
            action: { label: 'Safety notes', to: 'sStudents' }
          })
        : '';

      var watching = watch.length
        ? ui.notice({
            kind: 'warn',
            title: 'Worth knowing before you start',
            text: watch.map(function (s) { return s.name + ' — ' + s.flag; }).join('. ') + '.'
          })
        : '';

      /* Every figure here is either the class fact from Grove.data or a count
         of the rows printed below — never a number of its own. */
      var short = people.length < c.en;

      var stats = ui.statbar([
        {
          label: 'Enrolled',
          value: c.en + ' of ' + c.cap,
          sub: oneToOne(c)
            ? 'One to one'
            : (c.en >= c.cap
                ? (c.wl ? plural(c.wl, 'child waiting', 'children waiting') : 'Full')
                : plural(c.cap - c.en, 'place free', 'places free'))
        },
        {
          label: 'On the register',
          value: countOf(people.length, c.en),
          sub: short ? 'records on file' : 'everyone enrolled'
        },
        {
          label: 'Marked',
          value: (present + absent) + ' of ' + people.length,
          sub: toMark ? plural(toMark, 'still to mark', 'still to mark') : 'All marked'
        },
        { label: 'Present', value: String(present), tone: present ? 'grove' : null, sub: 'In the room' },
        { label: 'Absent', value: String(absent), tone: absent ? 'clay' : null, sub: 'Not in today' }
      ]);

      var register = ui.card({
        title: 'The register',
        flush: true,
        note: (short
          ? 'The prototype carries records for ' + people.length + ' of the ' + c.en +
            ' children enrolled, so the register is shorter than the class. '
          : '') +
          'This is the class record. If a child is in the room but not on the list, tell the office and they will add them.'
      }, people.length
        ? ui.rows(people.map(function (s) {
            var m = markOf(c.id, s.id);
            return {
              lead: esc('Age ' + s.age),
              title: esc(s.name),
              sub: esc(s.family + ' family' + (s.att === '—' ? '' : ' · ' + s.att + ' attendance')),
              end: ui.btns([
                {
                  label: 'Present', size: 'sm', kind: m === 'Present' ? 'primary' : null,
                  act: 'sMark', cid: c.id, id: s.id, mark: 'Present'
                },
                {
                  label: 'Absent', size: 'sm', kind: m === 'Absent' ? 'danger' : null,
                  act: 'sMark', cid: c.id, id: s.id, mark: 'Absent'
                }
              ])
            };
          }))
        : ui.empty('Nobody on this register yet',
            'The office adds children to a class when they enrol.'));

      var top = safety + watching;

      return (top ? '<div class="stack">' + top + '</div>' : '') +
        '<div class="section">' + stats + register + '</div>';
    }
  });
})();
