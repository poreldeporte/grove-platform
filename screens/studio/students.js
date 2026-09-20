/* Studio → Students, the child record, and the note form.

   Simplifications against the previous build:
     - the rail item "Medical alerts" (badge 4) is merged into this screen as
       its second tab, "Safety". The two lists held the same four children,
       and disagreed with each other about Sophia's age and about three
       emergency contacts. Safety now sits where a teacher already looks for
       a child, and there is one set of facts, read from Grove.data.
     - the "Add a note" form that sat inline above the list is its own screen,
       reached from the header action and from the child's notes card, so the
       list is a list again.
     - the note's "Visible to" select is dropped. Every note goes to the
       assigned staff and the office, which the screen says once, in words.
     - the record's "Medical alert" / "No alerts" flag sits in the Safety card
       head instead of a chip row of its own above the cards.
     - the record's "Photo on file" row and its invented "Last 4 sessions"
       line were literals that disagreed with Grove.data — photo permission
       now reads the child's own document, and the attendance card lists the
       child's real make-up credits from D.MAKEUPS.

   Changes from the visual review:
     - make-up credits are counted off the D.MAKEUPS rows this screen lists,
       never off STUDENTS.mk. The record used to print s.mk as a total above
       those rows, and the two disagree in the dataset: Ava Smith's record
       says three credits where MAKEUPS holds two, Cillian Brennan's says one
       where it holds none, and Emma's two are one available and one already
       booked. Family → Children counts the same rows the same way, so the
       portals now tell one story.
     - those rows were the last two lines of a key/value list, with nothing to
       say which side was the missed class and which the make-up. Each is now
       a row that says it was missed, why, when the credit expires and where
       it stands.
     - "About" ended in about 100px of white beside a card that finished with
       a footnote. It carries the age band, the brothers and sisters and the
       date the family joined that it had room for, and the four cards are
       within 30px of each other now. The record stays two rows of two rather
       than two ui.col columns: stacking the pairs put the second card in each
       column at a different height, which is the misalignment the review was
       about in the first place.
     - the safety list ran three clay medical alerts and one plum "needs to
       know" together in one stack, where the odd one out read as a styling
       slip rather than a different kind of fact. They are two groups now,
       each with its own heading and count.
     - the Procedure card's footnote — "You see alerts only for children in
       classes you are assigned to" — was not true of the list under it. This
       screen lists every child on the books, and Lucas Johnson is in nobody's
       class but his own record. The footnote is gone, the screen's own
       sentence says what the list actually holds, and the card now points at
       the procedure document the rules come from.

   The dataset holds no staff notes, so the two note lines on the record are
   the spec's copy. Who wrote them is read from the persona and D.STAFF, never
   from a literal name. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  var SAFETY_NOTE = 'You see this because you need it to teach safely. It is not shared beyond assigned staff.';

  /* The four make-up states, pilled the way Console → Requests pills them, so
     a credit looks the same in the studio as it does in the office. */
  var MAKEUP_PILL = {
    'Awaiting approval': 'warn',
    'Available': 'ok',
    'Booked': null,
    'Expiring': 'bad'
  };

  function famByName(name) {
    return D.FAMILIES.filter(function (f) { return f.name === name; })[0] || D.FAMILIES[0];
  }
  function flagged() {
    return D.STUDENTS.filter(function (s) { return !!s.flag; });
  }
  function stu(ctx) {
    return D.student(ctx.params.id) || D.STUDENTS[0];
  }
  function firstName(name) { return String(name).split(' ')[0]; }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  /* Photo permission is answered per child on the registration form, so it is
     read from the child's own document in Grove.data, never assumed. */
  function photoDoc(s) {
    return D.DOCUMENTS.filter(function (d) {
      return d.name === 'Photo permission — ' + firstName(s.name);
    })[0];
  }

  function siblingsOf(s) {
    return D.STUDENTS.filter(function (k) { return k.family === s.family && k.id !== s.id; });
  }

  /* Every make-up credit this child holds, and the line that counts them.
     Counted off these rows rather than taken from STUDENTS.mk, because a
     credit that has already been booked is not one the family can still use
     and STUDENTS.mk disagrees with the rows for two children. */
  function credits(s) {
    return D.MAKEUPS.filter(function (m) { return m.child === s.name; });
  }
  function creditLine(s) {
    var list = credits(s);
    if (!list.length) return 'none';
    var order = [], count = {};
    list.forEach(function (m) {
      if (count[m.status] === undefined) { count[m.status] = 0; order.push(m.status); }
      count[m.status] += 1;
    });
    return order.map(function (k) { return count[k] + ' ' + k.toLowerCase(); }).join(' · ');
  }

  /* The other instructor who teaches, for the second note on the record. */
  function otherInstructor(name) {
    return D.STAFF.filter(function (t) {
      return t.role === 'Instructor' && t.name !== name && t.classes > 0;
    })[0];
  }

  function studentTabs() {
    return {
      key: 'sStudents',
      items: [
        { label: 'All children', count: D.STUDENTS.length },
        { label: 'Safety', count: flagged().length }
      ]
    };
  }

  /* ---- list ---------------------------------------------------------------- */

  Grove.screen('sStudents', {
    surface: 'studio',
    eyebrow: 'the young artists',
    title: 'Students',
    sub: 'Every child on the books, with the class, age band and safety flag you need at the door. ' +
         'Safety details are here because you need them to teach safely — they are not shared beyond assigned staff.',
    actions: [
      { label: 'Add a note', kind: 'primary', to: 'sStudentNote' }
    ],

    body: function () {
      return Grove.tab('sStudents', 'All children') === 'Safety' ? safetyTab() : allTab();
    }
  });

  function allTab() {
    var q = Grove.query('sStudentsAll');

    var rows = D.STUDENTS.filter(function (s) {
      return Grove.match(q, s.name, s.family, s.cls, s.flag);
    });

    var table = ui.table(
      ['Child', { label: 'Age', shrink: true }, 'Class', 'Safety', { label: 'Attendance', align: 'right' }],
      rows.map(function (s) {
        return {
          to: 'sStudent', id: s.id,
          cells: [
            ui.two(s.name, s.family + ' family · ages ' + s.band),
            ui.mute(s.age),
            ui.mute(s.cls),
            s.flag ? ui.pill(s.flag, s.flagKind) : '<span class="mute">—</span>',
            '<span class="num">' + esc(s.att) + '</span>'
          ]
        };
      }),
      { emptyTitle: 'No children match', emptyText: 'Clear the search and try again.' }
    );

    return ui.toolbar({
      tabs: studentTabs(),
      search: { key: 'sStudentsAll', placeholder: 'Search child, family, class…' },
      count: rows.length + ' of ' + D.STUDENTS.length + ' children'
    }) + ui.card({ flush: true }, table);
  }

  /* A medical alert and a way of working are two different facts, so they are
     two groups rather than one stack of look-alike cards. */
  function safetyTab() {
    var q = Grove.query('sStudentsSafety');
    var all = flagged();

    var list = all.filter(function (s) {
      return Grove.match(q, s.name, s.family, s.cls, s.flag);
    });
    var urgent = list.filter(function (s) { return s.flagKind === 'bad'; });
    var watch = list.filter(function (s) { return s.flagKind !== 'bad'; });

    function contactLine(s) {
      var f = famByName(s.family);
      return s.cls + ' · emergency contact ' + f.guardian + ', ' + f.phone;
    }

    var blocks = [];

    if (!list.length) {
      blocks.push(ui.card({ flush: true }, ui.empty('No children match', 'Clear the search and try again.')));
    }

    if (urgent.length) {
      blocks.push(ui.card({
        title: 'Medical alerts',
        head: ui.pill(plural(urgent.length, 'child', 'children'), 'bad'),
        note: 'Check these at the door. An allergy, a condition or a medication travels with the child to camp and to any make-up class.'
      }, urgent.map(function (s) {
        return ui.notice({
          kind: 'bad',
          title: s.name + ' · ' + s.flag,
          text: contactLine(s),
          action: { label: 'Open the child', to: 'sStudent', id: s.id }
        });
      }).join('')));
    }

    if (watch.length) {
      blocks.push(ui.card({
        title: 'Good to know',
        head: ui.pill(plural(watch.length, 'child', 'children'), 'warn'),
        flush: true,
        note: 'Nothing medical. It is how the child works best, and it is worth knowing before the room fills.'
      }, ui.rows(watch.map(function (s) {
        return {
          title: esc(s.name),
          sub: esc(contactLine(s)),
          end: ui.pill(s.flag, 'warn'),
          to: 'sStudent', id: s.id
        };
      }))));
    }

    var proc = D.TRAINING.filter(function (t) { return t.name === 'Allergy and EpiPen procedure'; })[0];

    blocks.push(ui.card({
      title: 'Procedure',
      flush: true,
      note: proc
        ? 'The full procedure is kept with the staff training documents: ' + proc.name + ' · ' + proc.when + '.'
        : 'Ask the office if you are unsure. Nobody is expected to decide this alone.'
    }, ui.rows([
      {
        title: esc('An EpiPen travels with the child'),
        sub: esc('It lives in the child’s own bag and goes wherever they go — the sink, the yard, pickup. It is never left in a cupboard or behind the desk.')
      },
      {
        title: esc('Staff cannot administer any medication'),
        sub: esc('Not without written authorisation on file. The child takes it themselves, and you call the office if they need help.')
      }
    ])));

    return ui.toolbar({
      tabs: studentTabs(),
      search: { key: 'sStudentsSafety', placeholder: 'Search child, allergy…' },
      count: list.length + ' of ' + all.length + ' with a flag'
    }) + blocks.map(function (card, i) {
      return i === 0 ? ui.grid(null, [card]) : '<div class="section">' + ui.grid(null, [card]) + '</div>';
    }).join('');
  }

  /* ---- the child ------------------------------------------------------------ */

  Grove.screen('sStudent', {
    surface: 'studio',
    crumbs: [{ label: 'Students', to: 'sStudents' }],
    crumbTitle: 'Child',
    eyebrow: 'one of the young artists',
    title: function (ctx) { return stu(ctx).name; },
    sub: function (ctx) {
      var s = stu(ctx);
      return 'Age ' + s.age + ' · ' + s.family + ' family · ' + s.cls;
    },
    actions: function (ctx) {
      return [
        { label: 'Take attendance', to: 'sAttendance' },
        { label: 'Add a note', kind: 'primary', to: 'sStudentNote', id: stu(ctx).id }
      ];
    },

    body: function (ctx) {
      var s = stu(ctx);
      var f = famByName(s.family);
      var started = s.att !== '—';
      var missed = credits(s);
      var kin = siblingsOf(s);
      var photo = photoDoc(s);

      var flag = s.flag
        ? ui.pill(s.flagKind === 'bad' ? 'Medical alert' : 'Needs to know', s.flagKind)
        : ui.pill('No alerts', 'ok');

      var safety = ui.card({
        title: 'Safety first',
        head: flag,
        note: SAFETY_NOTE
      }, h`<div class="stack">
        ${raw(s.flag
          ? ui.notice({
              kind: s.flagKind,
              title: s.flag,
              text: 'Shown to every teacher on the roster, and on the attendance sheet for each class this child attends.'
            })
          : ui.empty('Nothing on file', 'No allergy, condition or medication has been recorded.'))}
        ${raw(ui.kv([
          ['Emergency contact', esc(f.guardian)],
          ['Phone', esc(f.phone)]
        ]))}
      </div>`);

      var about = ui.card({ title: 'About' }, ui.kv([
        ['Age', String(s.age)],
        ['Age band', 'ages ' + esc(s.band)],
        ['Family', esc(s.family) + ' family'],
        ['Class', esc(s.cls)],
        kin.length
          ? {
              k: kin.length === 1 ? 'Brother or sister' : 'Brothers and sisters',
              v: esc(kin.map(function (k) { return k.name + ' · age ' + k.age; }).join(', '))
            }
          : { k: 'Brothers and sisters', v: 'None on the books', tone: 'mute' },
        ['With us since', esc(f.since)],
        photo
          ? { k: 'Photo permission', v: photo.signed ? 'Signed' : 'Not signed', tone: photo.signed ? 'grove' : 'clay' }
          : { k: 'Photo permission', v: 'No form on file', tone: 'mute' }
      ]));

      /* The percentage is the child's record; the rows and the credit count
         are the make-up rows this card is showing, not STUDENTS.mk. */
      var attendance = ui.card({
        title: 'Recent attendance',
        flush: true,
        head: ui.pill(started ? s.att + ' attended' : 'Not started yet'),
        note: started
          ? 'Make-up credits: ' + creditLine(s) +
            '. A class missed with more than 24 hours notice becomes a credit, and it lapses on the date shown.'
          : 'A class missed with more than 24 hours notice becomes a make-up credit.'
      }, !started
        ? ui.empty('No sessions yet', 'This child has not started classes, so there is nothing to show.')
        : (missed.length
            ? ui.rows(missed.map(function (m) {
                return {
                  title: esc('Missed ' + m.missed),
                  sub: esc(m.reason + ' · credit expires ' + m.expires),
                  end: ui.pill(m.status, MAKEUP_PILL[m.status]) +
                       (m.booked ? '<div class="cell-sub">' + esc(m.booked) + '</div>' : '')
                };
              }))
            : ui.empty('Nothing missed', 'No absence has been recorded against this child.')));

      var me = (ctx && ctx.persona && ctx.persona.name) || Grove.persona('studio').name;
      var other = otherInstructor(me);

      var notes = ui.card({
        title: 'Notes from staff',
        head: ui.btn({ label: 'Add a note', kind: 'quiet', size: 'sm', to: 'sStudentNote', id: s.id }),
        flush: true,
        note: 'A note reaches the assigned staff and the office. Anything medical belongs on the safety card, where it travels with the child.'
      }, started
        ? ui.rows([
            { lead: '24 Jul', title: esc(me), sub: esc('Loves the wheel — worth saving the front spot.') },
            { lead: '17 Jul', title: esc(other ? other.name : me), sub: esc('Struggled with scoring — worth a second demo.') }
          ])
        : ui.empty('No notes yet', 'Notes appear here once this child has been in a class.'));

      return ui.grid(2, [safety, about]) +
        '<div class="section">' + ui.grid(2, [attendance, notes]) + '</div>';
    }
  });

  /* ---- the note ------------------------------------------------------------- */

  Grove.screen('sStudentNote', {
    surface: 'studio',
    crumbs: [{ label: 'Students', to: 'sStudents' }],
    crumbTitle: 'Add a note',
    eyebrow: 'on the record',
    title: 'Add a note',
    sub: 'Notes stay on the student record and are visible to assigned staff and the office.',

    body: function (ctx) {
      var picked = D.student(ctx.params.id);
      var names = D.STUDENTS.map(function (s) { return s.name; });

      var card = ui.card({
        title: 'The note',
        note: 'Every note reaches the assigned staff and the office. There is no separate visibility setting to remember.'
      }, ui.fields(2, [
        ui.field({
          label: 'Student',
          control: ui.select({ options: names, value: picked ? picked.name : names[0] })
        }),
        ui.field({
          label: 'Note',
          span: true,
          hint: 'Written after class, read before the next one.',
          control: ui.textarea({ placeholder: 'What happened, and anything the next teacher should know' })
        })
      ]));

      return ui.grid(null, [card]) + ui.formActions([
        { label: 'Save note', kind: 'primary', msg: 'Note saved to the student record' },
        { label: 'Cancel', to: 'sStudents' }
      ]);
    }
  });
})();
