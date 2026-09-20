/* Studio → Lesson plans (Plans · Tutorials · Training) and one lesson plan.

   Simplifications against the previous build:
     - "Lesson plans" and "Library" were two rail items holding three lists a
       teacher reads before a session. They are one screen with three tabs.
       Library was itself two screens sharing the heading "Library", told
       apart only by a second strip of tabs; that second strip is gone.
     - Every row in the old tutorial archive carried the same "Video" tag, so
       the tag column said nothing. Length and what it is linked to say more.
     - The plan detail had five header buttons and five section cards. Two
       buttons stay in the header, the rest sit in the card they belong to.
     - The plan's numbered "What to do" steps and its medical-alert count were
       written for one lesson only and repeat what the attendance sheet shows
       every teacher on the roster. The plan sends you to attendance instead.
     - Materials are read from the studio store in Grove.data.INVENTORY. The
       old per-plan list was three hard-coded lines nothing kept current.

   Changes from the visual review:
     - The heading follows the tab. A table of training documents is no longer
       headed "Lesson plans", in the title or in the breadcrumb.
     - The Plans tab lists every plan the office has written, yours first, then
       the unassigned ones, then the rest of the studio. A plan you can open is
       never missing from the list you opened it from, and "who teaches it" is
       its own column, so the line under the lesson name means one thing (the
       class) on every row.
     - Tutorials and training documents are both sorted A to Z, which is what
       the tutorials tab always claimed.
     - The plan's metadata card repeated the page header word for word, and was
       titled "What the class makes" over a table of dates and rooms. It is
       gone: the header carries the class, date, room and whose session it is,
       the published/draft state is the notice at the top, and the page keeps the
       two things the header cannot hold — the store and the tutorial — plus
       the other plans written for the same room.
     - The tutorial card's note about video hosting was a build note showing in
       the product. Removed.
     - The tutorial card's 'Also used in' row printed the tutorial's own linked
       class, which for every attached tutorial is the class you are already
       looking at. It now derives the OTHER plans written around the same
       tutorial, so the row can only ever name a session that is not this one.
     - The store card's footnote said the desk lays out what a session needs.
       Nothing in the data says what a single lesson uses, and the card is the
       studio store — as its title says — so the note says that instead, and
       anything under its minimum sorts to the top where the request lives. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  /* Whose portal this is. Never a literal — the shell hands the persona to
     every screen and the rail shows the same person. */
  function me(ctx) {
    var who = (ctx && ctx.persona) || Grove.persona('studio');
    return (who && who.name) || '';
  }

  var MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

  /* '29 Jul 2026' → a sortable number. The dataset writes every date this way. */
  function dayNum(s) {
    var p = String(s).split(' ');
    var m = MONTHS[p[1]];
    return (parseInt(p[2], 10) || 0) * 10000 + (m === undefined ? 0 : m) * 100 + (parseInt(p[0], 10) || 0);
  }

  function byName(list) {
    return list.slice().sort(function (a, b) { return a.name.localeCompare(b.name); });
  }
  function byDate(list) {
    return list.slice().sort(function (a, b) { return dayNum(a.date) - dayNum(b.date); });
  }

  /* Yours first, then the ones the desk has not handed to anybody, then the
     rest of the studio — each group in date order. */
  function orderedPlans(who) {
    function rank(p) { return p.teacher === who ? 0 : (p.teacher === 'Unassigned' ? 1 : 2); }
    return D.LESSON_PLANS.slice().sort(function (a, b) {
      return (rank(a) - rank(b)) || (dayNum(a.date) - dayNum(b.date));
    });
  }

  function teacherCell(p) {
    return p.teacher === 'Unassigned' ? ui.mute('Unassigned') : ui.mute(p.teacher);
  }

  function currentTab() { return Grove.tab('sLessons', 'Plans'); }

  var TITLE = {
    Plans: 'Lesson plans',
    Tutorials: 'Tutorials',
    Training: 'Training documents'
  };

  var EYEBROW = {
    Plans: 'yours first, then the studio',
    Tutorials: 'every tutorial we have',
    Training: 'how we do things here'
  };

  var SUB = {
    Plans: 'Every plan the office has written, yours at the top. Each one gives you the activity, the room, the materials and the tutorial video — the register and the medical notes sit on the attendance sheet.',
    Tutorials: 'The full collection, sorted A to Z. The tutorial for today’s lesson already sits inside your lesson plan — this is for everything else.',
    Training: 'SOPs, the employee manual, responsibilities and safety procedures, sorted A to Z. Read-only — the office keeps these current.'
  };

  var CAT_KIND = {
    'SOP': 'ok',
    'Safety': 'bad',
    'Employee manual': null,
    'Responsibilities': null
  };

  /* ---- the one list screen ------------------------------------------------- */

  Grove.screen('sLessons', {
    surface: 'studio',
    /* The breadcrumb names what is on the page, the same as the title does.
       The shell reads this as a string, so it is a getter rather than the
       function the title may be. */
    get crumbTitle() { return TITLE[currentTab()]; },
    eyebrow: function () { return EYEBROW[currentTab()]; },
    title: function () { return TITLE[currentTab()]; },
    sub: function () { return SUB[currentTab()]; },
    actions: [
      { label: 'Message the desk', msg: 'The desk has been messaged' },
      { label: 'Request supplies', kind: 'primary', to: 'sSupplies' }
    ],

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

  function plansTab(ctx) {
    var all = orderedPlans(me(ctx));
    var q = Grove.query('sPlans');

    var rows = all.filter(function (p) {
      return Grove.match(q, p.lesson, p.cls, p.date, p.room, p.teacher, p.tut, p.status);
    });

    var table = ui.table(
      ['Lesson', 'Date', 'Room', 'Teacher', 'Tutorial', { label: 'Status', shrink: true }],
      rows.map(function (p) {
        return {
          to: 'sLessonPlan', id: p.id,
          cells: [
            ui.two(p.lesson, p.cls),
            ui.mute(p.date),
            ui.mute(p.room),
            teacherCell(p),
            p.tut === 'None' ? '<span class="cell-mute">—</span>' : ui.mute(p.tut),
            ui.pill(p.status, p.kind)
          ]
        };
      }),
      { emptyTitle: 'No plans match', emptyText: 'Clear the search to see every plan the office has written.' }
    );

    return ui.toolbar({
      tabs: lessonTabs(),
      search: { key: 'sPlans', placeholder: 'Search lesson, class, teacher…' },
      count: rows.length + ' of ' + all.length + ' plans'
    }) + ui.card({
      flush: true,
      note: 'Plans are written by the office. If something is missing or wrong, message the desk rather than editing it here.'
    }, table);
  }

  function tutorialsTab() {
    var q = Grove.query('sTutorials');
    var all = byName(D.TUTORIALS);

    var rows = all.filter(function (t) {
      return Grove.match(q, t.name, t.len, t.linked, t.by);
    });

    var table = ui.table(
      ['Name', 'Length', 'Linked to', 'Added by', { label: '', shrink: true }],
      rows.map(function (t) {
        return {
          cells: [
            ui.two(t.name, 'Added ' + t.date),
            ui.mute(t.len),
            t.linked === 'Not linked' ? '<span class="cell-mute">Not linked</span>' : ui.mute(t.linked),
            ui.mute(t.by),
            ui.btn({ label: 'Play', kind: 'quiet', size: 'sm', msg: 'Tutorial opened' })
          ]
        };
      }),
      { emptyTitle: 'No tutorials match', emptyText: 'Clear the search to see the whole collection.' }
    );

    return ui.toolbar({
      tabs: lessonTabs(),
      search: { key: 'sTutorials', placeholder: 'Search tutorial, class, author…' },
      count: rows.length + ' of ' + all.length + ' tutorials'
    }) + ui.card({
      flush: true,
      note: 'Tutorials are created by the office. If a lesson would benefit from one, ask the desk.'
    }, table);
  }

  function trainingTab() {
    var q = Grove.query('sTraining');
    var all = byName(D.TRAINING);

    var rows = all.filter(function (d) {
      return Grove.match(q, d.name, d.cat, d.kind, d.when);
    });

    var table = ui.table(
      ['Document', { label: 'Category', shrink: true }, 'Kind', 'Updated', { label: '', shrink: true }],
      rows.map(function (d) {
        return {
          cells: [
            '<span class="cell-strong">' + esc(d.name) + '</span>',
            ui.pill(d.cat, CAT_KIND[d.cat]),
            ui.mute(d.kind),
            ui.mute(String(d.when).replace('Updated ', '')),
            ui.btn({ label: 'Open', kind: 'quiet', size: 'sm', msg: 'Opening ' + d.name })
          ]
        };
      }),
      { emptyTitle: 'No documents match', emptyText: 'Clear the search to see everything the office keeps here.' }
    );

    return ui.toolbar({
      tabs: lessonTabs(),
      search: { key: 'sTraining', placeholder: 'Search document, category…' },
      count: rows.length + ' of ' + all.length + ' documents'
    }) + ui.card({
      flush: true,
      note: 'Staff read these; only the office edits them. Ask the desk rather than guessing.'
    }, table);
  }

  /* ---- one lesson plan ----------------------------------------------------- */

  Grove.screen('sLessonPlan', {
    surface: 'studio',
    crumbs: [{ label: 'Lesson plans', to: 'sLessons' }],
    crumbTitle: 'Lesson plan',
    eyebrow: function (ctx) {
      var p = plan(ctx);
      if (p.teacher === me(ctx)) return 'your assignment';
      if (p.teacher === 'Unassigned') return 'nobody assigned yet';
      return 'another teacher’s session';
    },
    title: function (ctx) { return plan(ctx).lesson; },
    sub: function (ctx) {
      var p = plan(ctx);
      var line = p.cls + ' · ' + p.date + ' · ' + p.room;
      /* The eyebrow already says a plan is yours, or that nobody has it. Only
         another teacher's name needs saying twice over. */
      return p.teacher === me(ctx) || p.teacher === 'Unassigned'
        ? line
        : line + ' · taught by ' + p.teacher;
    },
    actions: [
      { label: 'Request supplies', to: 'sSupplies' },
      { label: 'Take attendance', kind: 'primary', to: 'sAttendance' }
    ],

    body: function (ctx) {
      var p = plan(ctx);
      var tut = p.tut === 'None' ? null : tutorial(p.tut);

      /* Where else this tutorial is taught. Derived from the plans, never from
         the tutorial's own linked class — that is this plan's class, which the
         page header has already said. */
      var alsoIn = (tut ? D.LESSON_PLANS.filter(function (o) {
        return o.id !== p.id && o.tut === p.tut;
      }) : []).map(function (o) { return o.cls; });

      var notice = ui.notice(p.status === 'Draft'
        ? {
            kind: 'warn',
            title: 'This plan is still a draft',
            text: 'The office has not finished writing it. Check with the desk before you teach from it.',
            action: { label: 'Message the desk', msg: 'The desk has been messaged about this plan' }
          }
        : {
            title: 'Plans are written by the office',
            text: 'You read the plan here and teach from it. If something is missing, message the desk.',
            action: { label: 'Message the desk', msg: 'The desk has been messaged about this plan' }
          });

      /* The studio store, which is what the title promises — no per-lesson list
         exists to show. The rows that need acting on sort to the top. */
      var stock = D.INVENTORY.slice().sort(function (a, b) {
        return (a.on < a.min ? 0 : 1) - (b.on < b.min ? 0 : 1);
      });

      var materials = ui.card({
        title: 'What the store holds today',
        head: ui.btn({ label: 'Request supplies', kind: 'quiet', size: 'sm', to: 'sSupplies' }),
        note: 'The whole store, short items first — not a list of what this one lesson uses. Anything in red is under the minimum the studio keeps, so raise a supply request before you teach.'
      }, ui.kv(stock.map(function (i) {
        return {
          k: i.item,
          v: esc(i.on + ' on hand'),
          tone: i.on < i.min ? 'clay' : null
        };
      })));

      var video = ui.card({
        title: 'Tutorial video',
        head: tut
          ? ui.btn({ label: 'Play', kind: 'quiet', size: 'sm', msg: 'Tutorial opened' })
          : ui.btn({ label: 'Browse tutorials', kind: 'quiet', size: 'sm', act: 'sLessonsTab', tab: 'Tutorials' }),
        note: 'The office attaches a tutorial when a lesson needs one. The Tutorials tab has everything else.'
      }, tut
        ? ui.kv([
            ['Attached', esc(tut.name)],
            ['Length', esc(tut.len)],
            ['Added', esc(tut.date)],
            ['Added by', esc(tut.by)],
            {
              k: 'Also used in',
              v: alsoIn.length ? esc(alsoIn.join(' · ')) : 'No other session',
              tone: alsoIn.length ? null : 'mute'
            },
            { k: 'Watch', v: 'Before you teach it', tone: 'mute' }
          ])
        : ui.empty('No tutorial for this one', 'Teach it from the plan, or watch something close in the Tutorials tab.')
      );

      var alsoHere = byDate(D.LESSON_PLANS.filter(function (o) {
        return o.room === p.room && o.id !== p.id;
      }));

      var roomCard = alsoHere.length
        ? ui.card({
            title: 'Other plans for ' + p.room,
            flush: true,
            note: 'Every other plan the office has written for this room, in date order.'
          }, ui.table(
            ['Date', 'Lesson', 'Teacher', { label: 'Status', shrink: true }],
            alsoHere.map(function (o) {
              return {
                to: 'sLessonPlan', id: o.id,
                cells: [
                  ui.mute(o.date),
                  ui.two(o.lesson, o.cls),
                  teacherCell(o),
                  ui.pill(o.status, o.kind)
                ]
              };
            })
          ))
        : '';

      return h`${raw(notice)}
        <div class="section">${raw(ui.grid(2, [materials, video]))}</div>
        ${raw(roomCard ? '<div class="section">' + roomCard + '</div>' : '')}`;
    }
  });

  function plan(ctx) {
    var id = ctx && ctx.params ? ctx.params.id : null;
    var found = D.LESSON_PLANS.filter(function (p) { return p.id === id; })[0];
    return found || orderedPlans(me(ctx))[0];
  }

  function tutorial(name) {
    return D.TUTORIALS.filter(function (t) { return t.name === name; })[0] || null;
  }

  /* Opening the list on a named tab, so "Browse tutorials" lands where it says. */
  Grove.on('sLessonsTab', function (d) {
    Grove.setTab('sLessons', d.tab || 'Plans');
    Grove.go('sLessons');
  });
})();
