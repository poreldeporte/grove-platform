/* Console → Teaching (lesson plans, tutorials, training documents) and the
   lesson-plan record.

   WHO THIS SCREEN IS FOR
   Sabrina Yanguas owns the studio. She writes the plans her two instructors
   teach from, records the tutorials and keeps the SOPs current, at a desk with
   a keyboard. Three dense tables are right for her; what was wrong was the
   ceremony around them.

   CUT IN THIS PASS
     - the lesson-plan record opened with a card called "The lesson" whose five
       rows were Activity, Class, Date, Room and Instructor. Four of those five
       are the page header verbatim — the title IS the activity and the sub
       line IS class · date · room. That card is now the class the plan belongs
       to, read from the class record: when it runs, the age band, how many
       children are enrolled and where the class normally sits. Every row is
       something the header does not already say
     - the three-pill band under the title. "Published" repeated the header
       button, "Tutorial attached" repeated the tutorial card and the teacher
       pill repeated a row of the card underneath it. Where a plan is fine,
       nothing shows; where it is not, one notice says what is wrong and what
       staff currently see
     - the Materials card, which pasted all six shelf lines onto every plan.
       Nothing in the data links a plan to a material, and "Brushes 42 of 24"
       is not a number she can act on. What is left is only what is under the
       minimum she keeps — the same list, the same test and the same framing
       the Studio portal shows a teacher, so the two portals cannot disagree
     - a plan's own tutorial field is no longer read as a second source. A
       tutorial carries the class it is linked to, and that link is what a
       teacher actually sees, so the plan shows the tutorial its class carries.
       Two places to set one relationship is one too many
     - "Other plans for Clay Room" and its fallback "The rest of the diary"
       were two titles, two notes and a branch for one table. A room with one
       plan hit the fallback, so the card said different things on different
       records. It is one card now: the rest of the diary, in date order, with
       the room on the row
     - the Training tab's Length column, which read "—" on four of six rows. A
       column empty two-thirds of the time is not a column; PDF and
       "Video · 11 min" are one Format. Tutorials keep their Length column,
       because every tutorial has one
     - the Tutorials tab's Added by and Date columns, which are one fact: who
       recorded it and when
     - "6 of 6 plans". A total of itself says nothing. The count line now
       carries the figure she can act on — how many plans are not ready, how
       many tutorials are linked to no class — and only falls back to a
       matched-of-total figure while a search is narrowing the table

   THE ONE THING SHE CAME TO DO
     - the index is a find-and-open screen, so the primary action stays in the
       header, per tab: New lesson plan, New tutorial, Upload document
     - the record exists to get a plan ready for staff, so that action is in a
       bar pinned to the bottom of the viewport with the consequence beside it.
       It no longer says "Publish to staff", because staff can already open a
       draft in the Studio portal — it carries a warning there not to teach
       from it, and marking a plan ready is what removes that warning. The old
       label promised a visibility change that does not happen

   KEPT DELIBERATELY
     - the three tables. A studio owner reconciling her week wants rows, not
       friendly cards, and every column here is one she reads across
     - Published and Draft. Two states, acted on differently, and the second is
       the reason the notice and the pinned bar exist
     - the index's primary action stays in the header. Nothing on that screen
       is completed — it is where she finds the one record she came for

   READ RATHER THAN RE-TYPED
     - a plan's class is matched to a class record the way Console → Classes
       matches it, so a plan and a class cannot claim each other on one screen
       and not the other. A private hour is matched to the child on its roll,
       not to the name somebody typed on the class. That gives the record its
       room, its hours, its age band and its places, counted off the roll
     - an After-School class is named by its length in the dataset — "1 hour ·
       After-School" — which is a duration, not a name. The programme name is
       what the family portal shows a parent, so it is what shows here

   WHAT THE TWO PORTALS AGREE ON
     Same three lists, the same records in each. The Studio portal reads plans,
     tutorials and training documents and cannot edit any of them; this screen
     says so in the same words. Both sides show only the shelf lines under the
     minimum, and both say plainly that no plan carries a materials list.

   EVERY FIGURE HERE IS COUNTED FROM THE ROWS ON SCREEN — the tab counts, the
   plans not ready, the spare tutorials, the children on a class's roll, the
   short shelf lines. None is typed.

   Not fixable from this file: on the lesson-plan record the console rail
   lights nothing, because js/nav.js maps a detail screen to its rail item in
   its own OWNER table and has no entry for this one. One line there
   (lessonPlan: 'teaching') fixes it; nothing in a screen file can. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  var TAB_KEY = 'teaching';
  var T_PLANS = 'Lesson plans';
  var T_TUTS  = 'Tutorials';
  var T_TRAIN = 'Training';

  var EYEBROW = {};
  EYEBROW[T_PLANS] = 'what happens in the room';
  EYEBROW[T_TUTS]  = 'the video library';
  EYEBROW[T_TRAIN] = 'how we do things here';

  var SUB = {};
  SUB[T_PLANS] = 'One plan per session — what the class makes, who teaches it and the tutorial staff see. You write these; the Studio portal reads them and cannot edit one.';
  SUB[T_TUTS]  = 'Reusable videos. A tutorial is linked to a class, not to a day, so every lesson plan for that class shows it.';
  SUB[T_TRAIN] = 'SOPs, manuals and responsibilities. Staff read these in the Studio portal, safety first; only you upload them.';

  var NEW = {};
  NEW[T_PLANS] = 'New lesson plan';
  NEW[T_TUTS]  = 'New tutorial';
  NEW[T_TRAIN] = 'Upload document';

  function tab() { return Grove.tab(TAB_KEY, T_PLANS); }

  function tabsConfig() {
    return {
      key: TAB_KEY,
      items: [
        { label: T_PLANS, count: D.LESSON_PLANS.length },
        { label: T_TUTS,  count: D.TUTORIALS.length },
        { label: T_TRAIN, count: D.TRAINING.length }
      ]
    };
  }

  /* ---- words and dates -------------------------------------------------------
     Three tables in one screen looked unsorted because none of them said what
     it was sorted by. Dates sort as dates, names sort A to Z. */

  var MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

  /* '29 Jul 2026' — and 'Updated 4 Jul 2026' — to a sortable number. */
  function dayNum(when) {
    var p = String(when).replace(/^Updated\s+/, '').split(' ');
    var m = MONTHS[p[1]];
    return (parseInt(p[2], 10) || 0) * 10000 + (m === undefined ? 0 : m) * 100 + (parseInt(p[0], 10) || 0);
  }

  function byDate(list) {
    return list.slice().sort(function (a, b) { return dayNum(a.date) - dayNum(b.date); });
  }
  function byName(list) {
    return list.slice().sort(function (a, b) { return a.name.localeCompare(b.name); });
  }

  /* "One plan is not ready" / "2 plans are not ready". */
  function count(n, one, many) { return n === 1 ? one : n + ' ' + many; }

  /* ---- cells ---------------------------------------------------------------- */

  function teacherCell(name) {
    if (name === 'Unassigned') return h`<span class="clay strong">${name}</span>`;
    return ui.mute(name);
  }

  function linkCell(name, blank) {
    if (!name || name === blank) return ui.mute(blank);
    return h`<span class="grove">${name}</span>`;
  }

  /* The dataset stores "Updated 4 Jul 2026"; the column header already says
     Updated, so the cell only needs the date. */
  function updatedOn(when) { return String(when).replace(/^Updated\s+/, ''); }

  /* Below the minimum is the numbers, not the status word — the same test the
     Inventory screen applies and the same one the Studio portal applies, so
     all three screens agree on which lines are short. */
  function isBelow(i) { return i.on < i.min; }
  function shortOfStock() {
    return D.INVENTORY.filter(isBelow).sort(function (a, b) { return (a.on / a.min) - (b.on / b.min); });
  }

  /* ---- a plan's tutorial ------------------------------------------------------
     A tutorial carries the class it is linked to, and that link is what puts a
     video inside a teacher's lesson plan. The plan's own tut field is the same
     relationship written a second time, so the link is read first and the name
     on the plan is only a fallback for a tutorial linked to nothing. */

  function tutorialFor(p) {
    var linked = D.TUTORIALS.filter(function (t) { return t.linked === p.cls; })[0];
    if (linked) return linked;
    if (!p.tut || p.tut === 'None') return null;
    return D.TUTORIALS.filter(function (t) { return t.name === p.tut; })[0] || null;
  }
  function tutorialName(p) {
    var t = tutorialFor(p);
    return t ? t.name : 'None';
  }
  function spareTutorials() {
    return byName(D.TUTORIALS.filter(function (t) { return t.linked === 'Not linked'; }));
  }

  /* ---- a plan's class ---------------------------------------------------------
     A plan names its class in free text — 'Camp week 4 · Wed', 'Mon 3:15pm ·
     ages 8–11', 'Private · Zara O.' — and carries no class id, so the two are
     matched on what the strings share. These are the rules Console → Classes
     already uses to find the plans for a class, run the other way round, so a
     plan and a class cannot claim each other on one screen and not the other.
     Children are the exception: a class carries its roll now, so the private
     hour is matched to the child on it and nothing here reads a name out of a
     class title. */

  function dayTokens(c) { return String(c.day).split(/[^A-Za-z]+/).filter(Boolean); }

  /* '2:15–3:15pm' → '2:15pm'; '10:00am–1:00pm' → '10:00am'. */
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
  /* A private class is one child's hour, and the roll says which child. The
     plan is matched against the name on the roll — 'Zara Okafor' → 'zara' —
     rather than against the name somebody typed on the class. */
  function privateChild(c) {
    var kid = D.roster(c.id)[0];
    return kid ? String(kid.name).split(' ')[0].toLowerCase() : null;
  }

  /* An After-School record is named by its length — "1 hour · After-School" —
     which is a duration and not a class name, and the length is already legible
     in the hours. The programme name is what the rest of the product calls it. */
  function className(c) {
    return c.prog === 'as' ? D.program(c.prog).name : c.name;
  }

  function classForPlan(p) {
    var text = String(p.cls).toLowerCase();
    var week = weekOf(text);
    return D.CLASSES.filter(function (c) {
      /* Camp runs Mon–Fri in two rooms at the same hour, so the week alone
         proves nothing and the room decides. */
      if (week) return weekOf(c.name) === week && c.room === p.room;
      if (c.prog === 'priv') {
        var kid = privateChild(c);
        return !!kid && text.indexOf(kid) !== -1;
      }
      var dayHit = dayTokens(c).filter(function (d) {
        return text.indexOf(d.toLowerCase()) !== -1;
      }).length > 0;
      return dayHit && text.indexOf(startTime(c)) !== -1;
    })[0] || null;
  }

  /* ---- what is not ready ------------------------------------------------------
     Two states, both acted on differently: a draft carries a warning in the
     Studio portal, and a plan with nobody assigned has no one to read it. */

  function notReady(list) {
    return list.filter(function (p) {
      return p.status === 'Draft' || p.teacher === 'Unassigned';
    });
  }
  function whyNotReady(p) {
    var bits = [];
    if (p.status === 'Draft') bits.push('still a draft');
    if (p.teacher === 'Unassigned') bits.push('nobody assigned');
    return p.lesson + ' (' + p.date + ') — ' + bits.join(', ');
  }

  var DRAFT_LINE = 'Staff can open a draft in the Studio portal, where it carries a warning not to teach from it.';

  /* ---- Teaching ----------------------------------------------------------- */

  Grove.screen('teaching', {
    surface: 'console',
    eyebrow: function () { return EYEBROW[tab()]; },
    title: 'Teaching',
    sub: function () { return SUB[tab()]; },
    actions: function () {
      return [{ label: NEW[tab()], kind: 'primary', msg: 'Prototype — no form yet' }];
    },

    body: function () {
      var t = tab();
      if (t === T_TUTS) return tutorialsTab();
      if (t === T_TRAIN) return trainingTab();
      return plansTab();
    }
  });

  function plansTab() {
    var q = Grove.query('plans');
    var all = byDate(D.LESSON_PLANS);
    var waiting = byDate(notReady(all));

    var rows = all.filter(function (p) {
      return Grove.match(q, p.lesson, p.cls, p.date, p.room, p.teacher, tutorialName(p), p.status);
    });

    var table = ui.table(
      ['Lesson', 'Class', 'Date', 'Teacher', 'Tutorial', { label: 'Status', shrink: true }],
      rows.map(function (p) {
        return {
          to: 'lessonPlan', id: p.id,
          cells: [
            ui.two(p.lesson, p.room),
            ui.mute(p.cls),
            ui.mute(p.date),
            teacherCell(p.teacher),
            linkCell(tutorialName(p), 'None'),
            ui.pill(p.status, p.kind)
          ]
        };
      }),
      { emptyTitle: 'No lesson plans match', emptyText: 'Clear the search to see every plan.' }
    );

    /* Named, dated and counted off the rows themselves, so it cannot outlive
       the thing it is warning about. Hidden while a search is narrowing the
       table, where it would describe rows that are not on screen. */
    var lead = (!q && waiting.length)
      ? ui.notice({
          kind: 'warn',
          title: count(waiting.length, 'One plan is not ready to teach', 'plans are not ready to teach'),
          text: waiting.map(whyNotReady).join('. ') + '. ' + DRAFT_LINE
        })
      : '';

    var card = ui.card({
      flush: true,
      note: 'In date order, the next session first.'
    }, table);

    return ui.toolbar({
      tabs: tabsConfig(),
      search: { key: 'plans', placeholder: 'Search lesson plans…' },
      count: q
        ? rows.length + ' of ' + all.length + ' plans'
        : all.length + ' plans' + (waiting.length ? ' · ' + waiting.length + ' not ready' : '')
    }) + (lead ? lead + '<div class="section">' + card + '</div>' : card);
  }

  function tutorialsTab() {
    var q = Grove.query('tutorials');
    var all = byName(D.TUTORIALS);
    var spare = spareTutorials();

    var rows = all.filter(function (t) {
      return Grove.match(q, t.name, t.len, t.linked, t.by, t.date);
    });

    var table = ui.table(
      ['Name', { label: 'Length', shrink: true }, 'Linked to', 'Recorded by'],
      rows.map(function (t) {
        return {
          cells: [
            ui.two(t.name),
            ui.mute(t.len),
            linkCell(t.linked, 'Not linked'),
            ui.mute(t.by + ' · ' + t.date)
          ]
        };
      }),
      { emptyTitle: 'No tutorials match', emptyText: 'Clear the search to see the whole library.' }
    );

    return ui.toolbar({
      tabs: tabsConfig(),
      search: { key: 'tutorials', placeholder: 'Search tutorials…' },
      count: q
        ? rows.length + ' of ' + all.length + ' tutorials'
        : all.length + ' tutorials' + (spare.length ? ' · ' + spare.length + ' linked to no class' : '')
    }) + ui.card({
      flush: true,
      note: 'Sorted A to Z. A tutorial linked to no class shows in no lesson plan. Staff read this same list in the Studio portal and cannot add to it.'
    }, table);
  }

  function trainingTab() {
    var q = Grove.query('training');
    var all = byName(D.TRAINING);

    var rows = all.filter(function (d) {
      return Grove.match(q, d.name, d.cat, d.kind, d.when);
    });

    var table = ui.table(
      ['Document', 'Category', { label: 'Format', shrink: true }, 'Updated'],
      rows.map(function (d) {
        return {
          cells: [
            ui.two(d.name),
            ui.mute(d.cat),
            ui.mute(d.kind),
            ui.mute(updatedOn(d.when))
          ]
        };
      }),
      { emptyTitle: 'No documents match', emptyText: 'Clear the search to see every document.' }
    );

    return ui.toolbar({
      tabs: tabsConfig(),
      search: { key: 'training', placeholder: 'Search documents…' },
      count: q
        ? rows.length + ' of ' + all.length + ' documents'
        : all.length + ' documents'
    }) + ui.card({
      flush: true,
      note: 'Sorted A to Z here; the Studio portal puts safety first. A document is only as good as the day it was last read — the Updated column is the one to watch.'
    }, table);
  }

  /* ---- Lesson plan record --------------------------------------------------- */

  Grove.screen('lessonPlan', {
    surface: 'console',
    crumbs: [{ label: 'Teaching', to: 'teaching' }],
    crumbTitle: 'Lesson plan',
    eyebrow: 'what happens that day',
    title: function (ctx) { return plan(ctx).lesson; },
    sub: function (ctx) {
      var p = plan(ctx);
      return p.cls + ' · ' + p.date + ' · ' + p.room;
    },

    body: function (ctx) {
      var p = plan(ctx);
      var c = classForPlan(p);
      var draft = p.status === 'Draft';

      var lead = readiness(p, c);

      /* Three cards of comparable depth. Stacking the tutorial and the store
         in one column beside the class left a hand's width of nothing inside
         the class card, which is the fault this pass is meant to remove. */
      var cards = [classCard(p, c), tutorialCard(p), shelfCard()];

      /* The plan is one of a set she is writing, so the record closes on the
         rest of the diary rather than stopping short. */
      var others = byDate(D.LESSON_PLANS.filter(function (o) { return o.id !== p.id; }));

      var diary = others.length
        ? ui.card({
            title: 'The rest of the diary',
            flush: true,
            note: 'Every other plan you have written, in date order. Drafts included.'
          }, ui.table(
            ['Date', 'Lesson', 'Class', 'Teacher', { label: 'Status', shrink: true }],
            others.map(function (o) {
              return {
                to: 'lessonPlan', id: o.id,
                cells: [
                  ui.mute(o.date),
                  ui.two(o.lesson, o.room),
                  ui.mute(o.cls),
                  teacherCell(o.teacher),
                  ui.pill(o.status, o.kind)
                ]
              };
            })
          ))
        : '';

      /* One bar, pinned, with the consequence written beside it. Nothing here
         takes money or removes a person, but a plan going out to two
         instructors with the wrong day on it is her mistake to unpick. */
      var bar = ui.formActions(draft
        ? [
            { label: 'Mark ready to teach', kind: 'primary', msg: 'Marked ready to teach · the draft warning is gone from the Studio portal' },
            { label: 'Edit plan', to: 'editLessonPlan', id: p.id }
          ]
        : [
            { label: 'Edit plan', kind: 'primary', to: 'editLessonPlan', id: p.id },
            { label: 'Move back to draft', msg: 'Moved back to draft · staff now see a warning not to teach from it' }
          ], {
        sticky: true,
        hint: draft
          ? DRAFT_LINE
          : 'Ready to teach · ' + (p.teacher === 'Unassigned' ? 'nobody is assigned to it' : p.teacher + ' sees it with no warning')
      });

      return h`${raw(lead)}
        <div class="section">${raw(ui.grid(3, cards))}</div>
        ${raw(diary ? '<div class="section">' + diary + '</div>' : '')}
        ${raw(bar)}`;
    }
  });

  /* Where a plan is ready, nothing shows. Where it is not, one line says what
     is wrong and what staff are looking at in the meantime. */
  function readiness(p, c) {
    var draft = p.status === 'Draft';
    var open = p.teacher === 'Unassigned';
    if (!draft && !open) return '';

    var title = draft && open
      ? 'A draft with nobody to teach it'
      : (draft ? 'This plan is still a draft' : 'Nobody is assigned to teach this');

    var bits = [];
    if (draft) bits.push(DRAFT_LINE + ' Marking it ready removes that warning.');
    if (open) {
      bits.push(c && c.staff !== 'Unassigned'
        ? c.staff + ' teaches ' + className(c) + ' on ' + c.day + ', so the plan has a reader as soon as you put a name on it.'
        : 'Nobody teaches this class either, so no one in the Studio portal is looking for it.');
    }

    return ui.notice({ kind: 'warn', title: title, text: bits.join(' ') });
  }

  /* The class, not the header again. Every row here is something the title and
     the sub line do not already carry. */
  function classCard(p, c) {
    if (!c) {
      return ui.card({
        title: 'The class',
        note: 'A plan names its class as text. Until that text matches a class you keep, there is no room booked, no register and no places to read.'
      }, ui.empty(
        'No class record matches this plan',
        'Nothing in Classes is written as “' + p.cls + '”.'
      ));
    }

    var rows = [
      ['Class', esc(className(c))],
      ['Runs', esc(c.day + ' · ' + c.time)],
      { k: 'Room', v: esc(c.room), tone: c.room === p.room ? null : 'clay' }
    ];
    if (c.band && c.band !== '—') rows.push(['Ages', esc(c.band)]);
    rows.push(['Enrolled', esc(D.roster(c.id).length + ' of ' + c.cap)]);
    rows.push({
      k: 'Instructor',
      v: esc(p.teacher),
      tone: p.teacher === 'Unassigned' ? 'clay' : null
    });

    /* Where the plan and the class differ, that is the note. Where they
       agree, the note is why these rows can be trusted. */
    var note = 'Everything but the instructor is read from the class record, so the plan and the timetable cannot drift apart.';
    if (c.room !== p.room) {
      note = 'This session is in ' + p.room + '; the class normally runs in ' + c.room + '.';
    } else if (p.teacher !== 'Unassigned' && c.staff !== p.teacher) {
      note = c.staff + ' normally teaches this class, so tell them both.';
    }

    return ui.card({
      title: 'The class',
      head: ui.btn({ label: 'Open the class', kind: 'quiet', size: 'sm', to: 'classRecord', id: c.id }),
      note: note
    }, ui.kv(rows));
  }

  /* A tutorial belongs to the class, not to the day, so this card says what
     changing one would do to every other plan for the same class. */
  function tutorialCard(p) {
    var t = tutorialFor(p);
    var spare = spareTutorials();

    if (t) {
      var rows = [{
        lead: ui.timechip(t.len),
        title: esc(t.name),
        sub: esc('Recorded by ' + t.by + ' · ' + t.date),
        msg: 'Tutorial opened'
      }];
      if (spare.length) {
        rows.push({
          title: esc(count(spare.length, 'One tutorial is linked to no class', 'tutorials are linked to no class')),
          sub: 'No lesson plan shows one until it is linked.',
          end: ui.btn({ label: 'See them', kind: 'quiet', size: 'sm', act: 'teachTutorials' })
        });
      }
      return ui.card({
        title: 'Tutorial video',
        note: 'Linked to ' + p.cls + ', not to this day, so changing it changes every plan for that class.'
      }, ui.rows(rows));
    }

    return ui.card({
      title: 'Tutorial video',
      note: spare.length
        ? 'No tutorial is linked to this class. Link one of these and it shows in every plan for ' + p.cls + ', this one included.'
        : 'No tutorial is linked to this class, and every tutorial you have already belongs to another one.'
    }, spare.length
      ? ui.rows(spare.map(function (x) {
          return {
            title: esc(x.name),
            sub: esc(x.len + ' · recorded by ' + x.by),
            end: ui.btn({
              label: 'Link',
              kind: 'quiet',
              size: 'sm',
              msg: 'Linked · every plan for ' + p.cls + ' shows it now'
            })
          };
        }))
      : ui.empty(
          'No tutorial for this class',
          'Record one and link it, and every plan for ' + p.cls + ' picks it up.'
        ));
  }

  /* Only what is under the minimum she keeps. The fully stocked lines are the
     Inventory screen's job, and they are not numbers she can act on today. */
  function shelfCard() {
    var short = shortOfStock();
    return ui.card({
      title: 'Under the minimum',
      head: ui.btn({ label: 'Open inventory', kind: 'quiet', size: 'sm', to: 'inventory' }),
      flush: true,
      note: 'Nothing links a plan to its materials, so this is the whole store: ' +
        short.length + ' of ' + D.INVENTORY.length + ' lines are under the minimum you keep.'
    }, short.length
      ? ui.rows(short.map(function (i) {
          return {
            title: esc(i.item),
            sub: esc(i.on + ' on the shelf, under the ' + i.min + ' you keep · ' + i.supplier + ' · ' + i.cost),
            to: 'inventoryItem',
            id: i.id
          };
        }))
      : ui.empty('The store is stocked', 'Nothing is under the minimum you keep.'));
  }

  function plan(ctx) {
    var id = ctx && ctx.params ? ctx.params.id : null;
    return D.LESSON_PLANS.filter(function (p) { return p.id === id; })[0] || byDate(D.LESSON_PLANS)[0];
  }

  Grove.on('teachTutorials', function () {
    Grove.setTab(TAB_KEY, T_TUTS);
    Grove.go('teaching');
  });

  /* ---- editing a plan --------------------------------------------------------
     The last action in this file that raised a toast instead of opening a
     screen. A plan is what an instructor reads before a session, so the form
     asks for what the class makes, what it needs and which tutorial goes with
     it — and nothing about billing, because a plan carries no price. */

  Grove.screen('editLessonPlan', {
    surface: 'console',
    crumbs: [{ label: 'Teaching', to: 'teaching' }],
    crumbTitle: 'Edit plan',
    title: function (ctx) { return plan(ctx).lesson; },
    sub: function (ctx) {
      var p = plan(ctx);
      return p.cls + ' \u00b7 ' + p.date + ' \u00b7 ' + p.room +
        (p.teacher === 'Unassigned' ? ' \u00b7 nobody assigned yet' : ' \u00b7 ' + p.teacher);
    },

    body: function (ctx) {
      var p = plan(ctx);
      var draft = p.status === 'Draft';
      var classes = D.CLASSES.map(function (c) {
        return c.name + ' \u00b7 ' + c.day + ' ' + c.time.split('\u2013')[0];
      });
      var tutorials = ['None'].concat(D.TUTORIALS.map(function (t) { return t.name; }));
      var teachers = ['Unassigned'].concat(D.STAFF
        .filter(function (x) { return x.role === 'Instructor' && x.status !== 'Invitation sent'; })
        .map(function (x) { return x.name; }));

      var what = ui.card({
        title: 'The lesson',
        note: 'This is the wording an instructor reads in the Studio portal, so write it as an instruction.'
      }, ui.fields(null, [
        ui.field({ label: 'What the class makes', control: ui.input({ value: p.lesson }) }),
        ui.field({
          label: 'How the session runs',
          hint: 'What to set out, what to demonstrate, and what to do with the work at the end.',
          control: ui.textarea({ placeholder: 'Set out the boards and the water pots before the doors open\u2026' })
        })
      ]));

      var where = ui.card({ title: 'When and who' }, ui.fields(2, [
        ui.field({ label: 'Class', control: ui.select({ value: p.cls, options: classes }) }),
        ui.field({ label: 'Date', control: ui.date({ value: p.date }) }),
        ui.field({ label: 'Room', control: ui.select({ value: p.room, options: rooms() }) }),
        ui.field({
          label: 'Instructor',
          hint: p.teacher === 'Unassigned' ? 'Nobody is assigned, so nobody sees this plan yet.' : '',
          control: ui.select({ value: p.teacher, options: teachers })
        })
      ]));

      var extras = ui.card({
        title: 'What it needs',
        note: 'A tutorial is optional. Attaching one puts it beside the plan in the Studio portal.'
      }, ui.fields(null, [
        ui.field({
          label: 'Tutorial',
          control: ui.select({ value: p.tut === 'None' ? 'None' : p.tut, options: tutorials })
        }),
        ui.field({
          label: 'Materials',
          hint: 'The studio does not keep a materials list against a plan, so write what this session needs.',
          control: ui.textarea({ placeholder: 'Air-dry clay, boards, water pots, wire tools\u2026' })
        })
      ]));

      return ui.grid('sidebar', [ui.col([what, extras]), where]) +
        ui.formActions([
          { label: 'Save the plan', kind: 'primary', msg: 'Saved \u00b7 ' +
            (p.teacher === 'Unassigned' ? 'nobody is assigned, so nobody sees it yet' : p.teacher + ' sees it in the Studio portal') },
          { label: 'Cancel', to: 'lessonPlan', id: p.id }
        ], {
          sticky: true,
          hint: draft ? DRAFT_LINE : 'This plan is live \u2014 a change shows in the Studio portal straight away.'
        });
    }
  });

  function rooms() {
    var out = [];
    D.CLASSES.forEach(function (c) { if (out.indexOf(c.room) === -1) out.push(c.room); });
    return out;
  }
})();
