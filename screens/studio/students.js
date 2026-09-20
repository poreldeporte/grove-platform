/* Studio → Students, the child record, and the note form.

   Fitted to Lauren Ortiz, the instructor: a tablet propped against a shelf,
   twelve children in the room, three minutes between classes and clay on her
   hands. She needs to know who has an allergy and what to do about it. She
   does not need the studio's telemetry.

   What this pass changed
     - safety is the first thing on the page, on both tabs. "All children"
       opens with a clay band naming every child with a medical alert and the
       condition, and its button moves to the Safety tab. It was three taps
       away before: read the table, spot a pill, open a child.
     - the per-child attendance percentage is gone, from the list and from the
       record. It is the owner's number and it is still on the owner's screen
       (Console → Families → the child). A teacher taking a register does not
       need telling that a child attends 96% of the time.
     - the dense five-column table is two lists of large rows now, because the
       finger tapping them may have clay on it. Age leads the row the way it
       leads the register, so the two screens read alike.
     - children who are not in a class — waitlisted, or registered and not yet
       placed — are their own short list. Lauren will not meet them in a room,
       and the table never said why they had no class.
     - the conditions are followed immediately by what to do about one. The
       procedure used to be the last card on the page and was written as
       description ("An EpiPen travels with the child"). It is written as
       instruction now and it carries the office number.
     - the Safety tab's search box is gone. It filtered four rows.
     - the note form is one question. Opened from a child it is a single box
       with a sticky Save; opened from the list with nobody chosen it asks who
       first, as large tap targets, and then asks the question. The inert
       Student dropdown and the "About <child>" card beside it are gone — a
       panel of age, class, family, safety and attendance is not needed to
       write one sentence about the class that has just finished.
     - "Take the register" on a child record opens that child's own class,
       where the class can be identified at all.

   Carried over from the earlier passes
     - the rail item "Medical alerts" is this screen's second tab. One set of
       facts, read from Grove.data, rather than two lists that disagreed.
     - a note's "Visible to" select stays dropped. Every note goes to the
       assigned staff and the office, which the screen says once, in words.
     - make-ups are counted off the D.MAKEUPS rows this screen lists, never
       off STUDENTS.mk, so the count on screen is the count of the rows on
       screen and a booked credit is not mistaken for a spare one.

   Faked here, because Grove.data does not carry it
     - a child's class is the free-text STUDENTS.cls. classOf() parses a day
       and a start time out of it to find the CLASSES row. That resolves six
       of the eleven children; the other five lose the register button rather
       than link to the wrong class.
     - a condition carries no action plan, so every medical alert gets the
       studio's standing rule, written here as copy.
     - the two staff notes on a record are this file's own strings. Only the
       author is read, from the persona and D.STAFF.
     - "has started classes" is STUDENTS.att !== '—'. There is no attendance
       record behind it. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, esc = Grove.esc, D = Grove.data;

  var SAFETY_NOTE = 'You see this because you need it to teach safely. It goes no further than assigned staff.';

  /* The four make-up states, pilled the way Console → Requests pills them, so
     a credit looks the same in the studio as it does in the office. */
  var MAKEUP_PILL = {
    'Awaiting approval': 'warn',
    'Available': 'ok',
    'Booked': null,
    'Expiring': 'bad'
  };

  /* Small numbers read better as words in a sentence: "Three children have a
     medical alert" is a fact, "3" is a statistic. */
  var WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven',
               'eight', 'nine', 'ten', 'eleven', 'twelve'];

  function word(n) { return WORDS[n] === undefined ? String(n) : WORDS[n]; }
  function cap(s) { return String(s).charAt(0).toUpperCase() + String(s).slice(1); }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  function firstName(name) { return String(name).split(' ')[0]; }

  function famByName(name) {
    return D.FAMILIES.filter(function (f) { return f.name === name; })[0] || D.FAMILIES[0];
  }
  function stu(ctx) {
    return D.student(ctx.params.id) || D.STUDENTS[0];
  }
  function flagged() {
    return D.STUDENTS.filter(function (s) { return !!s.flag; });
  }
  function medical() {
    return flagged().filter(function (s) { return s.flagKind === 'bad'; });
  }
  function worthKnowing() {
    return flagged().filter(function (s) { return s.flagKind !== 'bad'; });
  }
  function siblingsOf(s) {
    return D.STUDENTS.filter(function (k) { return k.family === s.family && k.id !== s.id; });
  }

  /* STUDENTS.cls is a sentence, not a foreign key: "Mon 3:15pm · Studio 2",
     but also "Waitlisted · Mon 3:15pm", "Camp week 4 · Clay Room", "Mon, Wed,
     Thu" and "Not yet enrolled". A day and a start time are enough to find
     the class record for six of the eleven children; the rest return nothing,
     and the screen drops the register button rather than guess. */
  function classOf(s) {
    var head = String(s.cls).split(' · ')[0].split(' ');
    var day = head[0];
    var start = (head[1] || '').replace(/(am|pm)/i, '');
    if (!start) return null;
    return D.CLASSES.filter(function (c) {
      return c.day === day && c.time.indexOf(start) === 0;
    })[0] || null;
  }

  /* A child the office has not placed in a class yet. Lauren will not meet
     them in a room, so they are listed apart rather than mixed in. */
  function inAClass(s) {
    var c = String(s.cls);
    return c.indexOf('Not yet enrolled') !== 0 && c.indexOf('Waitlisted') !== 0;
  }

  /* Photo permission is answered per child on the registration form, so it is
     read from the child's own document in Grove.data, never assumed. */
  function photoDoc(s) {
    return D.DOCUMENTS.filter(function (d) {
      return d.name === 'Photo permission — ' + firstName(s.name);
    })[0];
  }

  /* Every make-up this child holds. Counted off these rows rather than taken
     from STUDENTS.mk: a credit already booked is not one still to spend. */
  function credits(s) {
    return D.MAKEUPS.filter(function (m) { return m.child === s.name; });
  }

  /* The other instructor who teaches, for the second note on the record. */
  function otherInstructor(name) {
    return D.STAFF.filter(function (t) {
      return t.role === 'Instructor' && t.name !== name && t.classes > 0;
    })[0];
  }

  /* What to do, rather than what the flag says. The dataset holds one string
     per child and no action plan, so a medical alert gets the studio's
     standing rule and a way of working gets the one line that matters. */
  function whatToDo(s) {
    if (s.flagKind === 'bad') {
      return 'Any medication stays in the child’s own bag and goes where the child goes. ' +
        'Staff cannot give it — the child takes it themselves. Stay with them and ring the office on ' +
        D.STUDIO.phone + '.';
    }
    return 'Nothing medical. Set the room up for it before the doors open.';
  }

  function contactOf(s) {
    var f = famByName(s.family);
    return f.guardian + ', ' + f.phone;
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

  /* Cards down a page, each in its own grid row, with the standard gap. */
  function stacked(cards) {
    return cards.filter(Boolean).map(function (card, i) {
      return i === 0
        ? ui.grid(null, [card])
        : '<div class="section">' + ui.grid(null, [card]) + '</div>';
    }).join('');
  }

  /* ---- list ---------------------------------------------------------------- */

  Grove.screen('sStudents', {
    surface: 'studio',
    eyebrow: 'the young artists',
    title: 'Students',
    sub: 'Every child on the books, with the class and the safety flag you need at the door. ' + SAFETY_NOTE,
    actions: [
      { label: 'Add a note', kind: 'primary', to: 'sStudentNote' }
    ],

    body: function () {
      return Grove.tab('sStudents', 'All children') === 'Safety' ? safetyTab() : allTab();
    }
  });

  /* Named children and their conditions, in clay, above everything else on
     the page — not a badge on a tab and not a pill in the fourth column. */
  function safetyBand() {
    var list = medical();
    if (!list.length) return '';

    return ui.notice({
      kind: 'bad',
      title: list.length === 1
        ? 'One child on the books has a medical alert'
        : cap(word(list.length)) + ' children on the books have a medical alert',
      text: list.map(function (s) { return s.name + ' — ' + s.flag; }).join('. ') + '.',
      action: { label: 'What to do', act: 'tab', 'tab-key': 'sStudents', 'tab-value': 'Safety' }
    });
  }

  function allTab() {
    var q = Grove.query('sStudentsAll');

    var rows = D.STUDENTS.filter(function (s) {
      return Grove.match(q, s.name, s.family, s.cls, s.flag);
    });
    var here = rows.filter(inAClass);
    var waiting = rows.filter(function (s) { return !inAClass(s); });

    function line(s) {
      return {
        lead: esc('Age ' + s.age),
        title: esc(s.name),
        sub: esc(s.cls + ' · ' + s.family + ' family'),
        end: s.flag ? ui.pill(s.flag, s.flagKind) : '',
        to: 'sStudent', id: s.id
      };
    }

    var cards = [];

    if (!rows.length) {
      cards.push(ui.card({ flush: true }, ui.empty('No children match', 'Clear the search and try again.')));
    }
    if (here.length) {
      cards.push(ui.card({
        title: 'In a class',
        head: ui.pill(plural(here.length, 'child', 'children')),
        flush: true
      }, ui.rows(here.map(line))));
    }
    if (waiting.length) {
      cards.push(ui.card({
        title: 'Not in a class yet',
        head: ui.pill(plural(waiting.length, 'child', 'children')),
        flush: true,
        note: 'Waitlisted, or registered and waiting for a place. You will not see them in a room until the office puts them in one.'
      }, ui.rows(waiting.map(line))));
    }

    var toolbar = ui.toolbar({
      tabs: studentTabs(),
      search: { key: 'sStudentsAll', placeholder: 'Search child, family, class…' },
      count: q
        ? rows.length + ' of ' + D.STUDENTS.length + ' children'
        : plural(D.STUDENTS.length, 'child', 'children')
    });

    var band = safetyBand();
    return band
      ? band + '<div class="section">' + toolbar + stacked(cards) + '</div>'
      : toolbar + stacked(cards);
  }

  /* A medical alert and a way of working are different facts, so they are two
     groups rather than one stack of look-alike cards — and what to do sits
     between them, where it is read rather than scrolled past. */
  function safetyTab() {
    var urgent = medical();
    var watch = worthKnowing();
    var proc = D.TRAINING.filter(function (t) { return t.name === 'Allergy and EpiPen procedure'; })[0];

    var alerts = urgent.length
      ? ui.card({
          title: 'Medical alerts',
          head: ui.pill(plural(urgent.length, 'child', 'children'), 'bad'),
          note: 'Read this before the doors open, not when something happens. An allergy, a condition or a medication travels with the child to camp and to any make-up class.'
        }, urgent.map(function (s) {
          return ui.notice({
            kind: 'bad',
            title: s.name + ' — ' + s.flag,
            text: 'In ' + s.cls + '. Emergency contact ' + contactOf(s) + '.',
            action: { label: 'Open ' + firstName(s.name), to: 'sStudent', id: s.id }
          });
        }).join(''))
      : ui.card({
          title: 'Medical alerts',
          head: ui.pill('None', 'ok')
        }, ui.empty('Nothing on file', 'No child on the books has an allergy, a condition or a medication recorded.'));

    var howTo = ui.card({
      title: 'If a child reacts',
      flush: true,
      note: proc
        ? 'The full procedure is kept with the staff training documents: ' + proc.name + ' · ' + proc.when + '.'
        : 'Ask the office if you are unsure. Nobody is expected to decide this alone.'
    }, ui.rows([
      {
        title: esc('Keep the medication with the child'),
        sub: esc('An EpiPen or an inhaler lives in the child’s own bag and goes wherever they go — the sink, the yard, pickup. Never a cupboard, never behind the desk.')
      },
      {
        title: esc('Never give it to them yourself'),
        sub: esc('Staff cannot administer any medication without written authorisation on file. The child takes it themselves. Stay with them and ring the office on ' + D.STUDIO.phone + '.')
      }
    ]));

    var know = watch.length
      ? ui.card({
          title: 'Good to know',
          head: ui.pill(plural(watch.length, 'child', 'children'), 'warn'),
          flush: true,
          note: 'Nothing medical. It is how the child works best, and it is worth knowing before the room fills.'
        }, ui.rows(watch.map(function (s) {
          /* The card's note already says these are not medical, so the row
             carries only the instruction and where to find the child. */
          return {
            title: esc(s.name + ' — ' + s.flag),
            sub: esc('Set the room up for it before the doors open. ' + s.cls + ' · ' + contactOf(s) + '.'),
            to: 'sStudent', id: s.id
          };
        })))
      : '';

    return ui.toolbar({
      tabs: studentTabs(),
      count: plural(urgent.length, 'medical alert', 'medical alerts') +
        (watch.length ? ' · ' + watch.length + ' more to know about' : '')
    }) + stacked([alerts, howTo, know]);
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
      return 'Age ' + s.age + ' · ' + s.cls + ' · ' + s.family + ' family. ' + SAFETY_NOTE;
    },
    actions: function (ctx) {
      var s = stu(ctx);
      var c = classOf(s);
      var list = [];
      /* Only where the class record can be identified from STUDENTS.cls. A
         button that opens somebody else's register is worse than no button. */
      if (c) list.push({ label: 'Take the register', to: 'sAttendance', id: c.id });
      list.push({ label: 'Add a note', kind: 'primary', to: 'sStudentNote', id: s.id });
      return list;
    },

    body: function (ctx) {
      var s = stu(ctx);
      var f = famByName(s.family);
      var started = s.att !== '—';
      var kin = siblingsOf(s);
      var photo = photoDoc(s);

      /* Full width, above everything, and it answers the question she opened
         the record with: what do I do about this child. */
      var safety = s.flag
        ? ui.notice({
            kind: s.flagKind,
            title: s.name + ' — ' + s.flag,
            text: whatToDo(s) + ' Emergency contact ' + f.guardian + ', ' + f.phone + '.'
          })
        : ui.notice({
            kind: 'ok',
            title: 'Nothing on file',
            text: 'No allergy, condition or medication has been recorded for ' + firstName(s.name) +
              '. Emergency contact ' + f.guardian + ', ' + f.phone + '.'
          });

      var photoRow = photo
        ? { k: 'Photographs', v: photo.signed ? 'Allowed' : 'Do not photograph', tone: photo.signed ? 'grove' : 'clay' }
        : { k: 'Photographs', v: 'No form on file — ask the office', tone: 'mute' };

      var about = ui.card({ title: 'About ' + firstName(s.name) }, ui.kv([
        ['Age', esc(s.age + ' · ages ' + s.band)],
        ['Class', esc(s.cls)],
        ['Family', esc(f.guardian + ' · ' + s.family + ' family')],
        kin.length
          ? {
              k: kin.length === 1 ? 'Brother or sister' : 'Brothers and sisters',
              v: esc(kin.map(function (k) { return k.name + ' · age ' + k.age; }).join(', '))
            }
          : { k: 'Brothers and sisters', v: 'None on the books', tone: 'mute' },
        photoRow
      ]));

      var me = (ctx && ctx.persona && ctx.persona.name) || Grove.persona('studio').name;
      var other = otherInstructor(me);

      var notes = ui.card({
        title: 'Notes from staff',
        head: ui.btn({ label: 'Add a note', kind: 'quiet', size: 'sm', to: 'sStudentNote', id: s.id }),
        flush: true,
        note: 'A note reaches the assigned staff and the office. Anything medical belongs on the safety record, where it travels with the child.'
      }, started
        ? ui.rows([
            { lead: '24 Jul', title: esc(me), sub: esc('Loves the wheel — worth saving the front spot.') },
            { lead: '17 Jul', title: esc(other ? other.name : me), sub: esc('Struggled with scoring — worth a second demo.') }
          ])
        : ui.empty('No notes yet', 'Notes appear here once this child has been in a class.'));

      /* Only where there is something to show. A make-up matters to a teacher
         for one reason: a child turning up in an hour that is not theirs. */
      var missed = credits(s);
      var booked = missed.filter(function (m) { return m.status === 'Booked' && m.booked; });

      var makeups = missed.length
        ? ui.card({
            title: 'Classes missed',
            flush: true,
            note: booked.length
              ? 'Expect ' + firstName(s.name) + ' on ' +
                booked.map(function (m) { return m.booked; }).join(' and ') + ', making one of these up.'
              : 'A class missed with more than 24 hours notice becomes a make-up. The office books it.'
          }, ui.rows(missed.map(function (m) {
            var isBooked = m.status === 'Booked' && m.booked;
            return {
              title: esc(isBooked ? 'Making it up on ' + m.booked : 'Missed ' + m.missed),
              sub: esc(isBooked
                ? 'Missed ' + m.missed + ' · ' + m.reason
                : m.reason + ' · lapses ' + m.expires),
              end: ui.pill(m.status, MAKEUP_PILL[m.status])
            };
          })))
        : '';

      return safety +
        '<div class="section">' + ui.grid(2, [about, notes]) + '</div>' +
        (makeups ? '<div class="section">' + ui.grid(null, [makeups]) + '</div>' : '');
    }
  });

  /* ---- the note -------------------------------------------------------------
     Written standing up, after the class, on the tablet she already has in
     her hand. One question on the page and a Save she cannot scroll past.
     Picking a child navigates to this same screen carrying that child, so the
     page never has to hold a half-answered form. */

  Grove.on('sNoteAbout', function (d) { Grove.go('sStudentNote', { id: d.id }); });

  Grove.screen('sStudentNote', {
    surface: 'studio',
    crumbs: [{ label: 'Students', to: 'sStudents' }],
    crumbTitle: 'Add a note',
    eyebrow: 'after the class',
    title: 'Add a note',
    sub: function (ctx) {
      return D.student(ctx.params.id)
        ? 'Say what happened and what the next teacher should do about it. It stays on the child’s record, with the assigned staff and the office.'
        : 'Pick the child this is about.';
    },

    body: function (ctx) {
      var s = D.student(ctx.params.id);
      if (!s) return pickChild();

      var flagLine = s.flag
        ? ui.notice({
            kind: s.flagKind,
            title: s.name + ' — ' + s.flag,
            text: 'Anything medical belongs on the safety record, where it travels with the child to camp and to any make-up class. A note does not travel.'
          })
        : '';

      var note = ui.card({
        title: 'Note about ' + s.name,
        head: ui.btn({ label: 'A different child', kind: 'quiet', size: 'sm', to: 'sStudentNote' }),
        note: 'Written after class, read before the next one.'
      }, ui.field({
        label: 'What happened?',
        control: ui.textarea({ placeholder: 'Loves the wheel — worth saving the front spot' })
      }));

      return (flagLine ? flagLine + '<div class="section">' : '') +
        ui.grid(null, [note]) +
        (flagLine ? '</div>' : '') +
        ui.formActions([
          { label: 'Save note', kind: 'primary', msg: 'Note saved to ' + s.name + '’s record' },
          { label: 'Cancel', to: 'sStudent', id: s.id }
        ], {
          sticky: true,
          hint: 'Goes to ' + firstName(s.name) + '’s record and to the office'
        });
    }
  });

  /* Eleven names, thumb-sized, with the class underneath and the flag beside
     it — so a note about the wrong child is hard to start. */
  function pickChild() {
    return ui.grid(null, [ui.card({
      title: 'Who is the note about?',
      note: 'Every note reaches the assigned staff and the office. There is no visibility setting to remember.'
    }, ui.choices(2, D.STUDENTS.map(function (k) {
      return ui.choice({
        id: k.id,
        size: 'lg',
        act: 'sNoteAbout',
        title: k.name,
        sub: k.cls + (k.flag ? ' · ' + k.flag : '')
      });
    })))]);
  }
})();
