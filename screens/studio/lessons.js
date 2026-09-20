/* Studio → Lesson plans (Plans · Tutorials · Training) and one lesson plan.

   WHO THIS SCREEN IS FOR
   Lauren Ortiz teaches. She reads this on a tablet propped against a shelf or
   on a phone in her apron, with about three minutes before the doors open and
   clay on her hands. She needs four things, in this order: who in the room has
   a medical note, the register, what she is teaching and what it needs, and
   now and then her hours. Enrolment against capacity, fill rates, attendance
   percentages and what a class is worth are the owner's numbers and they live
   on the owner's screens.

   Cut in this pass
     - the six-column admin table on Plans — Lesson / Date / Room / Teacher /
       Tutorial / Status — sorted by nothing a teacher thinks in. Time is the
       organising principle now: Today, then Coming up, then the rest of the
       studio in a quieter card. Rows are full width and the whole row is the
       target, so it can be pressed with a knuckle
     - the Status column. A published plan is the normal case and says nothing
       by saying nothing; only a draft carries a badge, because she must not
       teach from one
     - the Teacher column on her own sessions. Her name on her own plan is the
       one fact she already knows. It is printed only where the plan is not hers
     - "What the store holds today", which listed all six shelf lines with four
       of them fully stocked. That is the owner's stock report. What is left is
       only what is under the amount the office keeps, each line a sentence,
       and the Reorder now / Low pills are gone with it — every line in the card
       is short, so a pill saying so is a second copy of the same fact
     - the tutorial card's six rows of bookkeeping — attached, length, added,
       added by, also used in, watch. Two of those six are useful before a
       class, and they are now one row she can press
     - "Other plans for Clay Room", a table of other teachers' sessions. One
       row of it matters, which is what the room did last, because a lesson
       like "Glazing yesterday's pots" depends on the session before it. That
       row stays; the rest is the Plans tab's job
     - the "Plans are written by the office" notice card, which competed with
       the top of the page. The constraint is real and it stays visible, as the
       state line on the bar pinned to the bottom of the viewport
     - the second strip of tabs under Library. "Lesson plans" and "Library"
       were two rail items holding three lists she reads before a session; they
       are one screen with three tabs
     - the Tutorials "added" date, which is bookkeeping. Who recorded one stays,
       because that is who she would ask

   Carried over from the parent pass
     - the plan page has one thing she does next, so that action is pinned to
       the bottom of the viewport with a state line beside it, not left at the
       foot of a column she has to scroll back up from
     - no column ends in dead space. The plan page is one column read top to
       bottom, because it is a sequence and not a dashboard
     - every figure is counted from the rows on screen: the plan counts, the
       children in a room, the tutorial length, the shelf line. None of them is
       written down
     - one studio name and one studio phone number, from Grove.data.STUDIO

   Changes from the visual review
     - who is in the room is now worked out with the rules the register itself
       uses. It disagreed before: this page put Mia Chen, six, in the Clay Room
       for camp week 4, while the register Lauren opens from the same page
       holds Emma, Sophia and Zara — camp runs two rooms at the same hour and
       the age band on the room decides which. A safety line that names the
       wrong child is worse than no safety line
     - "Take the register" hands the register the class this plan belongs to,
       so the button opens the room the page is about rather than whichever
       class happens to be first in her week
     - a second, quieter line for the children who are not an allergy but are
       worth knowing about, which is what the register already does
     - the Plans tab opens with today's medical notes, by name, in clay. The
       first thing she needs should not be three taps away
     - a plan the office has not linked to a class says so, and says the
       register is the list. The page never implies a room is clear

   What is the spec's, not the dataset's
     - which children hold a camp week 4 record, by child id. Nothing in the
       dataset joins a child to a class. Which camp room takes each of them is
       derived from the age band on the room, not written down
     - nothing else. The lesson, the room, the tutorial, the shelf and the
       training documents are all read from Grove.data */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  var WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  /* The children the prototype holds a camp week 4 record for, by child id —
     the same list the register uses, for the same reason: nothing in the
     dataset joins a child to a class. */
  var CAMP_WEEK = 'week 4';
  var CAMP_CHILDREN = ['mia', 'emma', 'noah', 'sophia', 'iker', 'zara'];

  /* ---- words ----------------------------------------------------------------
     A teacher reads a sentence faster than she reads a tile. "Two children in
     this room have a medical note" beats a stat cell reading 2. */

  var WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
  function some(n, one, many) { return (WORDS[n] || String(n)) + ' ' + (n === 1 ? one : many); }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  function cap(s) { return String(s).charAt(0).toUpperCase() + String(s).slice(1); }
  function sentence(items) {
    if (items.length < 2) return items.join('');
    return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
  }

  /* Whose portal this is. Never a literal — the shell hands the persona to
     every screen and the rail shows the same person. */
  function teacher(ctx) {
    var who = (ctx && ctx.persona) || Grove.persona('studio');
    return (who && who.name) || '';
  }

  /* ---- dates ----------------------------------------------------------------- */

  var MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

  /* '29 Jul 2026' and '28 July 2026' → a sortable number. */
  function dayNum(s) {
    var p = String(s).split(' ');
    var m = MONTHS[String(p[1]).slice(0, 3)];
    return (parseInt(p[2], 10) || 0) * 10000 + (m === undefined ? 0 : m) * 100 + (parseInt(p[0], 10) || 0);
  }

  /* Today is read from the dataset, so "Today" on this screen can never
     disagree with the date the rest of the prototype is set on. */
  function todayNum() { return dayNum(String(D.today).replace(/^[A-Za-z]+,\s*/, '')); }

  /* '29 Jul 2026' → '29 Jul', which is what the date chip holds. */
  function shortDate(s) {
    var p = String(s).split(' ');
    return p[0] + ' ' + String(p[1]).slice(0, 3);
  }

  function byName(list) {
    return list.slice().sort(function (a, b) { return a.name.localeCompare(b.name); });
  }
  function byDate(list) {
    return list.slice().sort(function (a, b) { return dayNum(a.date) - dayNum(b.date); });
  }

  /* ---- who is in the room ----------------------------------------------------
     A child's class is the free text on their own record ("Mon 3:15pm · Studio
     2", "Camp week 4 · Clay Room"), so membership is matched on the signals
     that string carries. These are the register's rules, repeated here on
     purpose: a child must not appear in this page's safety line and be missing
     from the register the same page opens. Camp is the exception — it runs two
     rooms at the same hour, so a weekday proves nothing about which room a
     child is in and the age band on the room decides. */

  function dayTokens(c) { return String(c.day).split(/[^A-Za-z]+/).filter(Boolean); }

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
  function enrolled(s) {
    return s.cls.indexOf('Waitlisted') === -1 && s.cls.indexOf('Not yet enrolled') === -1;
  }

  function onRoster(c, s) {
    if (!enrolled(s)) return false;

    var text = String(s.cls).toLowerCase();
    if (String(c.name).toLowerCase().indexOf(String(s.name).toLowerCase()) !== -1) return true;

    var roomHit = text.indexOf(String(c.room).toLowerCase()) !== -1;
    var dayHit = dayTokens(c).filter(function (d) {
      return text.indexOf(d.toLowerCase()) !== -1;
    }).length > 0;
    if (!dayHit) return false;

    if (text.indexOf('·') === -1) return s.band === c.band;
    return roomHit || text.indexOf(startTime(c)) !== -1;
  }

  function campRoster(c) {
    if (weekOf(c.name) !== CAMP_WEEK) return [];
    return CAMP_CHILDREN
      .map(function (id) { return D.student(id); })
      .filter(function (s) { return s && enrolled(s) && s.band === c.band; });
  }

  function childrenIn(c) {
    if (weekOf(c.name)) return campRoster(c);
    return D.STUDENTS.filter(function (s) { return onRoster(c, s); });
  }

  /* ---- which class a plan belongs to ------------------------------------------
     A plan names its class in free text — 'Camp week 4 · Wed', 'Mon 3:15pm ·
     ages 8–11', 'Private · Zara O.' — and there is no class id on it, so the
     two are matched on what the strings share: the camp week plus the room, the
     day plus the start time, or the child a private lesson is for. The day and
     the hour are what identifies a weekly class, so a plan that moves the
     Monday group into another room still finds its register. Where nothing
     matches, the page says the register is the list. */

  function privateName(s) {
    var m = /private\s*·\s*([A-Za-z]+)/i.exec(String(s));
    return m ? m[1].toLowerCase() : '';
  }

  function classForPlan(p) {
    var text = String(p.cls).toLowerCase();
    var week = weekOf(text);
    return D.CLASSES.filter(function (c) {
      if (week) return weekOf(c.name) === week && c.room === p.room;
      var day = String(dayTokens(c)[0] || '').toLowerCase();
      if (day && text.indexOf(day) !== -1 && text.indexOf(startTime(c)) !== -1) return true;
      var who = privateName(c.name);
      return !!who && who === privateName(text) && c.room === p.room;
    })[0] || null;
  }

  function roomChildren(p) {
    var c = classForPlan(p);
    return c ? childrenIn(c) : [];
  }
  function flaggedIn(list, kind) {
    return list.filter(function (s) { return s.flagKind === kind; });
  }
  function noteLines(list) {
    return list.map(function (s) { return s.name + ' — ' + s.flag; });
  }

  /* ---- the one list screen ------------------------------------------------- */

  function currentTab() { return Grove.tab('sLessons', 'Plans'); }

  var TITLE = {
    Plans: 'Lesson plans',
    Tutorials: 'Tutorials',
    Training: 'Training documents'
  };

  var EYEBROW = {
    Plans: 'today, then what is next',
    Tutorials: 'every tutorial we have',
    Training: 'how we do things here'
  };

  var SUB = {
    Plans: 'Your sessions first, in the order you teach them, then the rest of the studio. Open one for the tutorial, the room and any medical notes.',
    Tutorials: 'The full collection, sorted A to Z. The tutorial for today’s lesson already sits inside your lesson plan — this is for everything else.',
    Training: 'Safety first, then SOPs, the employee manual and responsibilities, A to Z. Read-only — the office keeps these current.'
  };

  var CAT_KIND = {
    'SOP': 'ok',
    'Safety': 'bad',
    'Employee manual': null,
    'Responsibilities': null
  };

  Grove.screen('sLessons', {
    surface: 'studio',
    /* The breadcrumb names what is on the page, the same as the title does. */
    crumbTitle: function () { return TITLE[currentTab()]; },
    eyebrow: function () { return EYEBROW[currentTab()]; },
    title: function () { return TITLE[currentTab()]; },
    sub: function () { return SUB[currentTab()]; },
    /* Supplies belong to the tab that talks about teaching a session. On a
       page of training documents there is nothing to request. */
    actions: function () {
      var list = [{ label: 'Message the desk', msg: 'The desk has been messaged' }];
      if (currentTab() === 'Plans') {
        list.push({ label: 'Request supplies', kind: 'primary', to: 'sSupplies' });
      }
      return list;
    },

    body: function (ctx) {
      var t = currentTab();
      if (t === 'Tutorials') return tutorialsTab();
      if (t === 'Training') return trainingTab();
      return plansTab(ctx);
    }
  });

  function lessonTabs() {
    return {
      key: 'sLessons',
      items: [
        { label: 'Plans', count: D.LESSON_PLANS.length },
        { label: 'Tutorials', count: D.TUTORIALS.length },
        { label: 'Training', count: D.TRAINING.length }
      ]
    };
  }

  /* Cards after the first one get the standard section gap. */
  function stackCards(cards) {
    return cards.map(function (c, i) {
      return i ? '<div class="section">' + c + '</div>' : c;
    }).join('');
  }

  /* ---- plans --------------------------------------------------------------- */

  var BUCKETS = ['Today', 'Coming up', 'Already taught'];

  function bucketOf(p, now) {
    var n = dayNum(p.date);
    return n === now ? 'Today' : (n > now ? 'Coming up' : 'Already taught');
  }

  function tutorial(name) {
    return D.TUTORIALS.filter(function (t) { return t.name === name; })[0] || null;
  }

  /* One row per plan. The teacher is named only when the plan is not hers —
     on her own sessions the name is the one fact she already knows. */
  function planRow(p, withTeacher) {
    var bits = [p.cls, p.room];
    if (withTeacher) bits.push(p.teacher === 'Unassigned' ? 'Nobody assigned yet' : p.teacher);
    var tut = p.tut === 'None' ? null : tutorial(p.tut);
    if (tut) bits.push(tut.len + ' tutorial');

    return {
      to: 'sLessonPlan', id: p.id,
      lead: ui.timechip(shortDate(p.date)),
      title: esc(p.lesson),
      sub: esc(bits.join(' · ')),
      /* A published plan is the normal case and says nothing by saying
         nothing. Only a draft needs a badge, because she must not teach it. */
      end: p.status === 'Draft' ? ui.pill('Draft', 'warn') : ''
    };
  }

  /* The first thing on the page: what she needs to know before the doors open,
     for the sessions she is teaching today. Counted from the children the
     register will show her, never written down. */
  function todayNotice(ctx) {
    var now = todayNum();
    var who = teacher(ctx);
    var mine = D.LESSON_PLANS.filter(function (p) {
      return p.teacher === who && dayNum(p.date) === now;
    });
    if (!mine.length) return '';

    var seen = {}, room = [], rooms = [];
    mine.forEach(function (p) {
      if (rooms.indexOf(p.room) === -1) rooms.push(p.room);
      roomChildren(p).forEach(function (s) {
        if (seen[s.id]) return;
        seen[s.id] = true;
        room.push(s);
      });
    });

    var notes = flaggedIn(room, 'bad');
    if (notes.length) {
      return ui.notice({
        kind: 'bad',
        title: notes.length === 1
          ? noteLines(notes)[0]
          : cap(some(notes.length, 'child you teach today has a medical note',
                     'children you teach today have a medical note')),
        text: (notes.length === 1 ? '' : noteLines(notes).join('. ') + '. ') +
              'Read the register before the doors open — it carries the whole room.'
      });
    }

    if (!room.length) return '';

    return ui.notice({
      title: 'No medical notes for today',
      text: 'Nothing is recorded for ' + some(room.length, 'child', 'children') +
            ' in ' + sentence(rooms) + ' today. The register is still the list.'
    });
  }

  function plansTab(ctx) {
    var who = teacher(ctx);
    var q = Grove.query('sPlans');
    var now = todayNum();

    var all = D.LESSON_PLANS.filter(function (p) {
      return Grove.match(q, p.lesson, p.cls, p.date, p.room, p.teacher, p.tut, p.status);
    });
    var mine = byDate(all.filter(function (p) { return p.teacher === who; }));
    var rest = byDate(all.filter(function (p) { return p.teacher !== who; }));

    var cards = [];
    BUCKETS.forEach(function (name) {
      var list = mine.filter(function (p) { return bucketOf(p, now) === name; });
      if (!list.length) return;
      cards.push(ui.card({ title: name, flush: true }, ui.rows(list.map(function (p) {
        return planRow(p, false);
      }))));
    });

    if (rest.length) {
      cards.push(ui.card({
        title: 'Elsewhere in the studio',
        flush: true,
        note: 'Who teaches a session is the office’s call. Yours are above.'
      }, ui.rows(rest.map(function (p) { return planRow(p, true); }))));
    }

    if (!cards.length) {
      cards.push(ui.card({ flush: true },
        ui.empty('No plans match', 'Clear the search to see every plan the office has written.')));
    }

    var lead = Grove.query('sPlans') ? '' : todayNotice(ctx);

    return ui.toolbar({
      tabs: lessonTabs(),
      search: { key: 'sPlans', placeholder: 'Search lesson, class, teacher…' },
      count: plural(mine.length, 'plan of yours', 'plans of yours') + ' · ' + rest.length + ' elsewhere'
    }) + lead + (lead ? '<div class="section">' + stackCards(cards) + '</div>' : stackCards(cards));
  }

  /* ---- tutorials ------------------------------------------------------------ */

  /* The whole row is the target, so it can be pressed with a knuckle. The
     length leads, because that is what she checks before starting one. */
  function tutorialRow(t) {
    return {
      msg: 'Tutorial opened',
      lead: ui.timechip(t.len),
      title: esc(t.name),
      sub: esc(t.linked === 'Not linked'
        ? 'Not linked to a class · ' + t.by + ' recorded it'
        : 'For ' + t.linked + ' · ' + t.by + ' recorded it'),
      end: '<span class="grove strong">Play</span>'
    };
  }

  function tutorialsTab() {
    var q = Grove.query('sTutorials');
    var all = byName(D.TUTORIALS);

    var rows = all.filter(function (t) {
      return Grove.match(q, t.name, t.len, t.linked, t.by);
    });

    return ui.toolbar({
      tabs: lessonTabs(),
      search: { key: 'sTutorials', placeholder: 'Search tutorial, class, author…' },
      count: rows.length + ' of ' + all.length + ' tutorials'
    }) + ui.card({
      flush: true,
      note: 'Tutorials are recorded by the office. If a lesson would benefit from one, ask the desk.'
    }, rows.length
      ? ui.rows(rows.map(tutorialRow))
      : ui.empty('No tutorials match', 'Clear the search to see the whole collection.'));
  }

  /* ---- training ------------------------------------------------------------- */

  /* Safety above everything else, then A to Z. The document she needs in an
     emergency should not depend on where its name falls in the alphabet. */
  function trainingOrder(list) {
    return list.slice().sort(function (a, b) {
      return ((a.cat === 'Safety' ? 0 : 1) - (b.cat === 'Safety' ? 0 : 1)) || a.name.localeCompare(b.name);
    });
  }

  function safetyDoc() {
    return byName(D.TRAINING.filter(function (d) { return d.cat === 'Safety'; }))[0] || null;
  }
  function openingDoc() {
    return D.TRAINING.filter(function (d) { return d.cat === 'SOP' && /open/i.test(d.name); })[0] || null;
  }

  function trainingRow(d) {
    return {
      msg: 'Opening ' + d.name,
      title: esc(d.name),
      sub: esc(d.kind + ' · ' + d.when),
      end: ui.pill(d.cat, CAT_KIND[d.cat])
    };
  }

  function trainingTab() {
    var q = Grove.query('sTraining');
    var all = trainingOrder(D.TRAINING);

    var rows = all.filter(function (d) {
      return Grove.match(q, d.name, d.cat, d.kind, d.when);
    });

    var doc = safetyDoc();
    var lead = doc ? ui.notice({
      kind: 'bad',
      title: 'If a child has a reaction',
      text: 'Follow the ' + doc.name + '. The desk is on ' + D.STUDIO.phone +
            ' and somebody is there through studio hours.',
      action: { label: 'Open it', msg: 'Opening ' + doc.name }
    }) : '';

    return ui.toolbar({
      tabs: lessonTabs(),
      search: { key: 'sTraining', placeholder: 'Search document, category…' },
      count: rows.length + ' of ' + all.length + ' documents'
    }) + lead + '<div class="section">' + ui.card({
      flush: true,
      note: 'Staff read these; only the office edits them. Ask the desk rather than guessing.'
    }, rows.length
      ? ui.rows(rows.map(trainingRow))
      : ui.empty('No documents match', 'Clear the search to see everything the office keeps here.')) + '</div>';
  }

  /* ---- what she needs before she teaches -------------------------------------- */

  /* Only what is under the amount the office keeps. The four lines that are
     fully stocked are the owner's stock report, not a teacher's. */
  function shortOfStock() {
    return D.INVENTORY.filter(function (i) { return i.on < i.min; })
      .sort(function (a, b) { return (a.on / a.min) - (b.on / b.min); });
  }

  /* A request already in for an item, so she does not raise a second one. The
     request names the item as free text, which is how the two are matched. */
  function pendingFor(item) {
    return D.SUPPLY_REQUESTS.filter(function (r) {
      return r.status === 'Pending' &&
        (r.item === item || String(item).indexOf(r.item) === 0 || String(r.item).indexOf(item) === 0);
    })[0] || null;
  }

  function shelfCard() {
    var list = shortOfStock();
    return ui.card({
      title: 'What the shelf is short of',
      head: ui.btn({ label: 'Request supplies', kind: 'quiet', size: 'sm', to: 'sSupplies' }),
      flush: true,
      note: 'Not a list for this lesson — the office does not keep materials against a plan, so this is the whole shelf. If the room is missing something today, ask the desk.'
    }, list.length ? ui.rows(list.map(function (i) {
      var req = pendingFor(i.item);
      return {
        title: esc(i.item),
        sub: esc(i.on + ' left on the shelf — under the ' + i.min + ' the office keeps.' +
          (req ? ' ' + req.by + ' asked for ' + req.qty + ' more on ' + req.when + '.' : ''))
      };
    })) : ui.empty('The shelf is stocked', 'Nothing is under the amount the office keeps.'));
  }

  /* The order she does it in: watch it, set the room out, then take the
     register from the bar at the foot of the page. */
  function beforeCard(p, room) {
    var tut = p.tut === 'None' ? null : tutorial(p.tut);
    var sop = openingDoc();

    var watch = tut ? {
      msg: 'Tutorial opened',
      lead: '1',
      title: esc('Watch ' + tut.name),
      sub: esc(tut.len + ' · ' + tut.by + ' recorded it'),
      end: '<span class="grove strong">Play</span>'
    } : {
      lead: '1',
      title: 'No tutorial for this one',
      sub: 'Teach it from the plan, or find something close under Tutorials.'
    };

    var set = {
      lead: '2',
      title: esc(room.length
        ? 'Set out ' + p.room + ' for ' + some(room.length, 'child', 'children')
        : 'Set out ' + p.room),
      sub: sop ? esc('The rest is in the ' + sop.name) : esc(p.cls)
    };
    if (sop) set.msg = 'Opening ' + sop.name;

    return ui.card({
      title: 'Before the doors open',
      head: ui.btn({ label: 'Browse tutorials', kind: 'quiet', size: 'sm', act: 'sLessonsTab', tab: 'Tutorials' }),
      flush: true,
      note: 'Then take the register — the button at the foot of the page opens it.'
    }, ui.rows([watch, set]));
  }

  /* ---- one lesson plan ------------------------------------------------------- */

  function plan(ctx) {
    var id = ctx && ctx.params ? ctx.params.id : null;
    var found = D.LESSON_PLANS.filter(function (p) { return p.id === id; })[0];
    if (found) return found;
    var who = teacher(ctx);
    return byDate(D.LESSON_PLANS.filter(function (p) { return p.teacher === who; }))[0] || D.LESSON_PLANS[0];
  }

  /* Safety, in clay, naming the child and the condition. Where the plan cannot
     be matched to a class the page says the register is the list — it never
     implies a room is clear. */
  function safetyNotice(p, room) {
    var notes = flaggedIn(room, 'bad');

    if (notes.length) {
      var lines = noteLines(notes);
      return ui.notice({
        kind: 'bad',
        title: notes.length === 1
          ? lines[0]
          : cap(some(notes.length, 'child in this room has a medical note',
                     'children in this room have a medical note')),
        text: (notes.length === 1 ? '' : lines.join('. ') + '. ') +
              'Read the register before the doors open — it carries the whole room.'
      });
    }

    if (room.length) {
      return ui.notice({
        title: 'No medical notes for this room',
        text: 'Nothing is recorded for ' + some(room.length, 'child', 'children') +
              ' in this session. The register is still the list.'
      });
    }

    return ui.notice({
      title: 'Check the register for this room',
      text: 'The office has not linked this plan to a class, so who is coming — and what they need — is on the register. Read it before the doors open.'
    });
  }

  Grove.screen('sLessonPlan', {
    surface: 'studio',
    crumbs: [{ label: 'Lesson plans', to: 'sLessons' }],
    crumbTitle: 'Lesson plan',
    eyebrow: function (ctx) {
      var p = plan(ctx);
      if (p.teacher === teacher(ctx)) return 'your session';
      if (p.teacher === 'Unassigned') return 'nobody assigned yet';
      return 'another teacher’s session';
    },
    title: function (ctx) { return plan(ctx).lesson; },
    sub: function (ctx) {
      var p = plan(ctx);
      var line = p.cls + ' · ' + p.date + ' · ' + p.room;
      /* The eyebrow already says a plan is yours, or that nobody has it. Only
         another teacher's name needs saying twice over. */
      return p.teacher === teacher(ctx) || p.teacher === 'Unassigned'
        ? line
        : line + ' · taught by ' + p.teacher;
    },
    actions: [
      { label: 'Message the desk', msg: 'The desk has been messaged about this plan' }
    ],

    body: function (ctx) {
      var p = plan(ctx);
      var cls = classForPlan(p);
      var room = cls ? childrenIn(cls) : [];

      var watch = flaggedIn(room, 'warn');
      var watching = watch.length ? ui.notice({
        kind: 'warn',
        title: 'Worth knowing before you start',
        text: noteLines(watch).join('. ') + '.'
      }) : '';

      var draft = p.status === 'Draft' ? ui.notice({
        kind: 'warn',
        title: 'This plan is still a draft',
        text: 'The office has not finished writing it. Check with the desk before you teach from it.'
      }) : '';

      /* What the room did last. A lesson like "Glazing yesterday's pots"
         depends on the session before it; the rest of the room's diary is the
         Plans tab's job, not this page's. */
      var before = byDate(D.LESSON_PLANS.filter(function (o) {
        return o.room === p.room && o.id !== p.id && dayNum(o.date) < dayNum(p.date);
      }));
      var last = before.length ? before[before.length - 1] : null;

      var lastCard = last ? ui.card({
        title: 'Last time in this room',
        flush: true,
        note: 'The session before this one in ' + p.room + ', in case today builds on it.'
      }, ui.rows([planRow(last, true)])) : '';

      /* One column, read top to bottom, in the order she does it: what the
         room needs to know, what she is teaching, what the last session left
         her, then what she may be short of. A two-column grid put a two-row
         card beside a five-row one and left a hand's width of nothing under
         it on any plan with no session before it. */
      var cards = [beforeCard(p, room)];
      if (lastCard) cards.push(lastCard);
      cards.push(shelfCard());

      /* The register is the thing she does next, so it is pinned to the bottom
         of the viewport, and it opens the class this plan belongs to. */
      var go = cls
        ? { label: 'Take the register', kind: 'primary', to: 'sAttendance', id: cls.id }
        : { label: 'Take the register', kind: 'primary', to: 'sClasses' };

      return h`${raw(safetyNotice(p, room))}${raw(watching)}${raw(draft)}
        <div class="section">${raw(stackCards(cards))}</div>
        ${raw(ui.formActions([go], {
          sticky: true,
          hint: 'The office writes these plans. You read them here — you cannot edit one.'
        }))}`;
    }
  });

  /* Opening the list on a named tab, so "Browse tutorials" lands where it says. */
  Grove.on('sLessonsTab', function (d) {
    Grove.setTab('sLessons', d.tab || 'Plans');
    Grove.go('sLessons');
  });
})();
