/* Console → Teaching (lesson plans, tutorials, training) and the lesson-plan
   record.

   Simplifications against the previous build:
     - the three-card stats band appeared on the Lesson plans tab only, so the
       table jumped when you switched tabs. The per-tab totals now sit on the
       tabs themselves and the table never moves.
     - the Training table carried a Status column reading "Published" on every
       row. A column with one value is not a column, so it is gone.
     - the lesson-plan record's six sections are three. Written instructions
       are left to the staff-facing plan rather than duplicated here, the
       three-row room-variation table is one line on the plan it actually
       affects, and the roll-call section is folded in as the plan's
       instructor.
     - materials read the studio store in Grove.data.INVENTORY instead of a
       fixed clay list that was shown on every plan, painting or not.

   Changes from the visual review:
     - every list is in a stated order. Lesson plans run by date, earliest
       first; tutorials and training documents are A to Z, which is what the
       tutorials tab already looked like and the training tab did not.
     - Training folded a video's running time into the Kind column, so one
       column held two different facts and four rows read "PDF" beside two
       that read "Video · 11 min". Kind and Length are now two columns, the
       same way the Tutorials tab models them.
     - the Materials card listed only the items under their minimum, under a
       footnote saying so, and then coloured one of them black — Smocks at 18
       against a minimum of 20 is below minimum, the same as the other two.
       The card now lists the whole store, keys the red off the numbers the
       way the Inventory screen does, and counts the low items rather than
       asserting a number.
     - the plans index promised "instructions and students" that the record
       never held. The subtitle now describes what a plan actually carries;
       the register lives on the attendance sheet.
     - "Room note" was a sentence in a right-aligned value, so it wrapped into
       a ragged two-line block. It is the card's footnote now.
     - the three cards ended in 110–140px of dead band because one card had
       six rows and the others four. They carry comparable content, and the
       page closes with the other plans written for the same room instead of
       stopping short.
     - a plan with no tutorial left that card all but empty beside a full
       materials card. It now lists what attaching would actually offer —
       the tutorials linked to no class yet.

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
  SUB[T_PLANS] = 'One plan per session: what the class makes, where and when, who teaches it, what the store holds and the tutorial video. Admin writes these — staff read them, and the register stays on the attendance sheet.';
  SUB[T_TUTS]  = 'Tutorials are reusable videos. Link one to a class and it appears inside that class’s lesson plan automatically — the teacher never has to go looking.';
  SUB[T_TRAIN] = 'SOPs, manuals and responsibilities for the team. Staff read these; only admin uploads them.';

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

  /* ---- ordering ------------------------------------------------------------
     Three tables in one screen looked unsorted because none of them said what
     they were sorted by. Dates sort as dates, names sort A to Z. */

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

  /* ---- cells ---------------------------------------------------------------- */

  function teacherCell(name) {
    if (name === 'Unassigned') return h`<span class="clay strong">${name}</span>`;
    return ui.mute(name);
  }

  function linkCell(name, blank) {
    if (name === blank) return ui.mute(name);
    return h`<span class="grove">${name}</span>`;
  }

  /* The dataset stores "Updated 4 Jul 2026"; the column header already says
     Updated, so the cell only needs the date. */
  function updatedOn(when) { return String(when).replace(/^Updated\s+/, ''); }

  /* A training row's kind is written "PDF" or "Video · 11 min". The Tutorials
     tab gives running time its own column; this splits the same fact out so
     the two tabs model it the same way. */
  function kindParts(doc) { return String(doc.kind).split('·'); }
  function docKind(doc) { return kindParts(doc)[0].trim(); }
  function docLength(doc) {
    var parts = kindParts(doc);
    return parts.length > 1 ? parts[1].trim() : '';
  }

  /* Below the minimum is the numbers, not the status word — the same test the
     Inventory screen applies, so the two screens agree on which items are low. */
  function isBelow(i) { return i.on < i.min; }

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

    var rows = all.filter(function (p) {
      return Grove.match(q, p.lesson, p.cls, p.date, p.room, p.teacher, p.tut, p.status);
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
            linkCell(p.tut, 'None'),
            ui.pill(p.status, p.kind)
          ]
        };
      }),
      { emptyTitle: 'No lesson plans match', emptyText: 'Clear the search to see every plan.' }
    );

    return ui.toolbar({
      tabs: tabsConfig(),
      search: { key: 'plans', placeholder: 'Search lesson plans…' },
      count: rows.length + ' of ' + all.length + ' plans'
    }) + ui.card({
      flush: true,
      note: 'In date order, the next session first.'
    }, table);
  }

  function tutorialsTab() {
    var q = Grove.query('tutorials');
    var all = byName(D.TUTORIALS);

    var rows = all.filter(function (t) {
      return Grove.match(q, t.name, t.len, t.linked, t.by, t.date);
    });

    var table = ui.table(
      ['Name', { label: 'Length', shrink: true }, 'Linked to', 'Added by', 'Date'],
      rows.map(function (t) {
        return {
          cells: [
            ui.two(t.name),
            ui.mute(t.len),
            linkCell(t.linked, 'Not linked'),
            ui.mute(t.by),
            ui.mute(t.date)
          ]
        };
      }),
      { emptyTitle: 'No tutorials match', emptyText: 'Clear the search to see the whole archive.' }
    );

    return ui.toolbar({
      tabs: tabsConfig(),
      search: { key: 'tutorials', placeholder: 'Search tutorials…' },
      count: rows.length + ' of ' + all.length + ' tutorials'
    }) + ui.card({
      flush: true,
      note: 'Sorted A to Z. Staff see this same list in the tutorial archive, read-only — they cannot upload.'
    }, table);
  }

  function trainingTab() {
    var q = Grove.query('training');
    var all = byName(D.TRAINING);

    var rows = all.filter(function (d) {
      return Grove.match(q, d.name, d.cat, d.kind, d.when);
    });

    var table = ui.table(
      [
        'Document',
        'Category',
        { label: 'Kind', shrink: true },
        { label: 'Length', shrink: true },
        'Updated'
      ],
      rows.map(function (d) {
        return {
          cells: [
            ui.two(d.name),
            ui.mute(d.cat),
            ui.mute(docKind(d)),
            ui.mute(docLength(d) || '—'),
            ui.mute(updatedOn(d.when))
          ]
        };
      }),
      { emptyTitle: 'No documents match', emptyText: 'Clear the search to see every document.' }
    );

    return ui.toolbar({
      tabs: tabsConfig(),
      search: { key: 'training', placeholder: 'Search documents…' },
      count: rows.length + ' of ' + all.length + ' documents'
    }) + ui.card({
      flush: true,
      note: 'Sorted A to Z. A document is only as good as the day it was last read — the Updated column is the one to watch.'
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
    /* Two header buttons, not three: attaching a tutorial is the tutorial
       card's business and sits in that card's head. */
    actions: function (ctx) {
      var p = plan(ctx);
      var list = [{ label: 'Edit plan', msg: 'Prototype — no form yet' }];
      if (p.status === 'Draft') {
        list.push({ label: 'Publish to staff', kind: 'primary', msg: 'Published · the instructor can see it now' });
      } else {
        list.push({ label: 'Unpublish', msg: 'Unpublished' });
      }
      return list;
    },

    body: function (ctx) {
      var p = plan(ctx);
      var t = tutorialFor(p);
      var below = D.INVENTORY.filter(isBelow);

      var flags = h`<div class="inline">
        ${raw(ui.pill(p.status, p.kind))}
        ${raw(p.tut === 'None' ? ui.pill('No tutorial') : ui.pill('Tutorial attached', 'ok'))}
        ${raw(p.teacher === 'Unassigned' ? ui.pill('Needs an instructor', 'bad') : ui.pill(p.teacher))}
      </div>`;

      /* The room note is a sentence. In a right-aligned value it wrapped into
         a ragged block, so it reads as the card's footnote instead. */
      var lessonNote = 'Plans are written by the office; staff read them and cannot edit them.';
      if (p.room === 'Clay Room') {
        lessonNote = 'The Clay Room has no sink — there is a wash bucket by the door. ' + lessonNote;
      }

      var lesson = ui.card({ title: 'The lesson', note: lessonNote }, ui.kv([
        ['Activity', esc(p.lesson)],
        ['Class', esc(p.cls)],
        ['Date', esc(p.date)],
        ['Room', esc(p.room)],
        { k: 'Instructor', v: esc(p.teacher), tone: p.teacher === 'Unassigned' ? 'clay' : null }
      ]));

      var materials = ui.card({
        title: 'Materials',
        head: ui.btn({ label: 'Open inventory', kind: 'quiet', size: 'sm', to: 'inventory' }),
        note: 'Read from the studio store, so a plan keeps no list of its own. ' +
          below.length + ' of ' + D.INVENTORY.length +
          ' items are under their minimum today, in red.'
      }, ui.kv(D.INVENTORY.map(function (i) {
        return {
          k: i.item,
          v: esc(i.on + ' of ' + i.min),
          tone: isBelow(i) ? 'clay' : null
        };
      })));

      /* With nothing attached, an empty card sat beside a full materials card.
         It now shows what attaching would offer: the tutorials that belong to
         no class yet. One already linked is that class's, and taking it would
         empty their plans. */
      var free = D.TUTORIALS.filter(function (x) { return x.linked === 'Not linked'; });

      var tutorial = p.tut === 'None'
        ? ui.card({
            title: 'Tutorial video',
            head: ui.btn({ label: 'Attach a tutorial', kind: 'quiet', size: 'sm', act: 'teachTutorials' }),
            note: free.length
              ? 'Nothing attached yet. The tutorials above are linked to no class — attach one and it shows in every plan for ' + p.cls + '.'
              : 'A tutorial is linked to the class, not to the day, so every plan for that class picks it up.'
          }, free.length
            ? ui.rows(byName(free).map(function (x) {
                return {
                  lead: esc(x.len),
                  title: esc(x.name),
                  sub: 'Added by ' + esc(x.by) + ' · ' + esc(x.date)
                };
              }))
            : ui.empty(
                'No tutorial on this plan',
                'Every tutorial in the archive already belongs to a class, so there is none spare to attach.'
              ))
        : ui.card({
            title: 'Tutorial video',
            head: ui.btn({ label: 'Change tutorial', kind: 'quiet', size: 'sm', act: 'teachTutorials' }),
            note: 'Staff assigned to this class see the video inside their lesson plan without searching for it.'
          }, ui.kv([
            ['Attached', esc(p.tut)],
            ['Length', esc(t ? t.len : '—')],
            ['Added', esc(t ? t.date : '—')],
            ['Added by', esc(t ? t.by : '—')],
            {
              k: 'Linked to',
              v: esc(t ? t.linked : '—'),
              tone: t && t.linked === 'Not linked' ? 'mute' : null
            }
          ]));

      var sameRoom = byDate(D.LESSON_PLANS.filter(function (o) {
        return o.room === p.room && o.id !== p.id;
      }));

      /* Studio 2 holds a single plan, so that record closed on the card row
         and half a screen of nothing. Where the room has no sibling, the rest
         of the diary is the honest close — and the row carries the room. */
      var others = sameRoom.length ? sameRoom : byDate(D.LESSON_PLANS.filter(function (o) {
        return o.id !== p.id;
      }));

      var roomCard = others.length
        ? ui.card({
            title: sameRoom.length ? 'Other plans for ' + p.room : 'The rest of the diary',
            flush: true,
            note: sameRoom.length
              ? 'Every other plan the office has written for this room, in date order.'
              : 'No other plan is written for ' + p.room + ', so this is the whole diary, in date order.'
          }, ui.table(
            ['Date', 'Lesson', 'Class', 'Teacher', { label: 'Status', shrink: true }],
            others.map(function (o) {
              return {
                to: 'lessonPlan', id: o.id,
                cells: [
                  ui.mute(o.date),
                  ui.two(o.lesson, sameRoom.length ? null : o.room),
                  ui.mute(o.cls),
                  teacherCell(o.teacher),
                  ui.pill(o.status, o.kind)
                ]
              };
            })
          ))
        : '';

      return h`${raw(flags)}
        <div class="section">${raw(ui.grid(3, [lesson, materials, tutorial]))}</div>
        ${raw(roomCard ? '<div class="section">' + roomCard + '</div>' : '')}`;
    }
  });

  function plan(ctx) {
    var id = ctx && ctx.params ? ctx.params.id : null;
    return D.LESSON_PLANS.filter(function (p) { return p.id === id; })[0] || byDate(D.LESSON_PLANS)[0];
  }

  function tutorialFor(p) {
    return D.TUTORIALS.filter(function (t) { return t.name === p.tut; })[0];
  }

  Grove.on('teachTutorials', function () {
    Grove.setTab(TAB_KEY, T_TUTS);
    Grove.go('teaching');
  });
})();
