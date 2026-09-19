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
       fixed clay list that was shown on every plan, painting or not. */
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
  SUB[T_PLANS] = 'One plan per session: activity, materials, instructions, room, students and the tutorial video. Admin writes these — staff read them.';
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

    var rows = D.LESSON_PLANS.filter(function (p) {
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
      count: rows.length + ' of ' + D.LESSON_PLANS.length + ' plans'
    }) + ui.card({ flush: true }, table);
  }

  function tutorialsTab() {
    var q = Grove.query('tutorials');

    var rows = D.TUTORIALS.filter(function (t) {
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
      count: rows.length + ' of ' + D.TUTORIALS.length + ' tutorials'
    }) + ui.card({
      flush: true,
      note: 'Staff see this same list in the tutorial archive, read-only. They cannot upload.'
    }, table);
  }

  function trainingTab() {
    var q = Grove.query('training');

    var rows = D.TRAINING.filter(function (d) {
      return Grove.match(q, d.name, d.cat, d.kind, d.when);
    });

    var table = ui.table(
      ['Document', 'Category', { label: 'Kind', shrink: true }, 'Updated'],
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
      count: rows.length + ' of ' + D.TRAINING.length + ' documents'
    }) + ui.card({ flush: true }, table);
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
    actions: function (ctx) {
      var p = plan(ctx);
      var list = [
        { label: 'Edit plan', msg: 'Prototype — no form yet' },
        { label: p.tut === 'None' ? 'Attach a tutorial' : 'Change tutorial', act: 'teachTutorials' }
      ];
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

      var flags = h`<div class="inline">
        ${raw(ui.pill(p.status, p.kind))}
        ${raw(p.tut === 'None' ? ui.pill('No tutorial') : ui.pill('Tutorial attached', 'ok'))}
        ${raw(p.teacher === 'Unassigned' ? ui.pill('Needs an instructor', 'bad') : ui.pill(p.teacher))}
      </div>`;

      var lessonRows = [
        ['Activity', esc(p.lesson)],
        ['Class', esc(p.cls)],
        ['Date', esc(p.date)],
        ['Room', esc(p.room)]
      ];
      if (p.room === 'Clay Room') {
        lessonRows.push({ k: 'Room note', v: esc('No sink — use the wash bucket by the door'), tone: 'mute' });
      }
      lessonRows.push({
        k: 'Instructor',
        v: esc(p.teacher),
        tone: p.teacher === 'Unassigned' ? 'clay' : null
      });

      var lesson = ui.card({
        title: 'The lesson',
        note: 'Written by the office. Staff read this — they cannot edit it.'
      }, ui.kv(lessonRows));

      var short = D.INVENTORY.filter(function (i) { return i.kind !== 'ok'; });
      var materials = ui.card({
        title: 'Materials',
        head: ui.btn({ label: 'Open inventory', kind: 'quiet', size: 'sm', to: 'inventory' }),
        note: 'Materials come out of the studio store. These are the items below their minimum today — everything else is on the shelf.'
      }, ui.kv(short.map(function (i) {
        return {
          k: i.item,
          v: esc(i.on + ' of ' + i.min),
          tone: i.kind === 'bad' ? 'clay' : null
        };
      }).concat([{ k: 'Everything else', v: esc('In stock'), tone: 'grove' }])));

      var tutorial = p.tut === 'None'
        ? ui.card({ title: 'Tutorial video' }, ui.kv([
            { k: 'Attached', v: esc('None'), tone: 'mute' },
            { k: 'Add one', v: esc('Link a tutorial and it shows here for staff'), tone: 'mute' }
          ]))
        : ui.card({
            title: 'Tutorial video',
            note: 'Staff assigned to this class see the video inside their lesson plan without searching for it.'
          }, ui.kv([
            ['Attached', esc(p.tut)],
            ['Length', esc(t ? t.len : '—')],
            ['Added by', esc(t ? t.by : '—')],
            ['Appears in', esc('The staff lesson plan, automatically')]
          ]));

      return flags + '<div class="section">' + ui.grid(3, [lesson, materials, tutorial]) + '</div>';
    }
  });

  function plan(ctx) {
    var id = ctx && ctx.params ? ctx.params.id : null;
    return D.LESSON_PLANS.filter(function (p) { return p.id === id; })[0] || D.LESSON_PLANS[0];
  }

  function tutorialFor(p) {
    return D.TUTORIALS.filter(function (t) { return t.name === p.tut; })[0];
  }

  Grove.on('teachTutorials', function () {
    Grove.setTab(TAB_KEY, T_TUTS);
    Grove.go('teaching');
  });
})();
