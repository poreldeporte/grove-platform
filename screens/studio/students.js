/* Studio → Students, the child record, and the note form.

   Fitted to Lauren Ortiz, the instructor: a tablet propped against a shelf, a
   room full of children, three minutes between classes and clay on her hands.
   She needs to know who has an allergy and what to do about it. She does not
   need the studio's telemetry.

   WHOSE CHILDREN THESE ARE
   The children on the rolls of the classes she teaches. Every class whose
   staff is the persona the shell hands in, D.roster(class) for each, a child
   named once however many of her hours they are in. A child the office has
   registered but not yet placed, or who is waiting for a seat, is on nobody's
   roll and so is not on her screen: she meets a child in a room, and the
   office's own screens carry the ones she will not meet yet.

   What this pass changed
     - the make-up credit is gone, because the thing it counted never existed.
       A family buys a pack of sessions for one child, and the pack renews when
       the last session in it is used. Tell the studio more than 24 hours ahead
       and the session simply stays in the pack. So there is no credit to hold,
       none to book, none to approve and none to expire, and the card that
       pilled four credit states has gone with them. What replaces it is the
       two facts a teacher can act on: the classes a child has missed, and any
       extra class booked on top of their weekly place — which is a child
       arriving in an hour that is not theirs.
     - the roster is the join. Nothing here reads the free-text class sentence
       on a child any more. The list, the register button, the safety lines,
       the record and the note picker all go through D.roster and
       D.classesOf, so a child cannot be shown against an hour they are not in
       and a child in three classes says three.
     - the list is her own rolls rather than every child on the books, and it
       is grouped by age band, because two lists of twenty read where one
       long list scrolls. A chip for each class she teaches narrows it to one
       room, and the search still covers the lot.
     - the note picker is searchable and grouped the same way. A whole roll of
       tap targets needs a way in.
     - "Not in a class yet" is gone with the children it held. It was a card
       that existed to explain why a name had no class.

   Carried over from the earlier passes
     - safety is the first thing on the page, on both tabs. "Your children"
       opens with a clay band naming every child with a medical alert and the
       condition, and its button moves to the Safety tab.
     - the per-child attendance percentage is gone, from the list and from the
       record. It is the owner's number and it is still on the owner's screen
       (Console → Families → the child).
     - rows are large, because the finger tapping them may have clay on it,
       and age leads the row the way it leads the register.
     - the conditions are followed immediately by what to do about one, and
       the procedure is written as instruction with the office number on it.
     - the Safety tab has no search box. It filtered a handful of rows.
     - the note form is one question. Opened from a child it is a single box
       with a sticky Save; opened with nobody chosen it asks who first.
     - a note's "Visible to" select stays dropped. Every note goes to the
       assigned staff and the office, which the screen says once, in words.

   Written here, because Grove.data does not carry it
     - a condition carries no action plan, so every medical alert gets the
       studio's standing rule, and the office number comes from D.STUDIO.
     - the two staff notes on a record are this file's own sentences, picked
       from a short set by the child's place in the dataset so a record reads
       like itself. Only the author and the date are real, and the author is
       read from the persona and D.STAFF.
     - photo permission is a signed document, and D.DOCUMENTS holds one per
       child it covers. The row appears on a record that has one, and says
       nothing where there is nothing signed either way. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, esc = Grove.esc, D = Grove.data;

  var SAFETY_NOTE = 'You see this because you need it to teach safely. It goes no further than assigned staff.';

  /* Small numbers read better as words in a sentence: "Five children have a
     medical alert" is a fact, "5" is a statistic. */
  var WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven',
               'eight', 'nine', 'ten', 'eleven', 'twelve'];

  /* Staff notes. Two on every record, picked by the child's place in the
     book, so a record reads like itself rather than like every other one. */
  var FIRST_NOTES = [
    'Loves the wheel — worth saving the front spot.',
    'Works better standing than sitting. Give the tall bench.',
    'Quick with a brush, slow to tidy. Start the clean-down early.',
    'Asked to take the piece home wet. Showed them the drying rack.'
  ];
  var SECOND_NOTES = [
    'Struggled with scoring — worth a second demo.',
    'Needed the coil join shown twice before it held.',
    'Sat with a new child all session without being asked.',
    'Mixed a good secondary palette with no help at all.'
  ];

  function word(n) { return WORDS[n] === undefined ? String(n) : WORDS[n]; }
  function cap(s) { return String(s).charAt(0).toUpperCase() + String(s).slice(1); }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  function firstName(name) { return String(name).split(' ')[0]; }
  function byName(a, b) { return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0); }

  function famByName(name) {
    return D.FAMILIES.filter(function (f) { return f.name === name; })[0] || D.FAMILIES[0];
  }
  function stu(ctx) {
    return D.student(ctx.params.id) || D.STUDENTS[0];
  }

  /* ---- whose room this is -----------------------------------------------------
     Never a literal. The shell hands the persona to every screen and the rail
     shows the same person, so this screen and My classes cannot disagree
     about whose week it is. */

  function teacherName(ctx) {
    var who = (ctx && ctx.persona) || Grove.persona('studio');
    return (who && who.name) || '';
  }
  function myClasses(ctx) {
    var name = teacherName(ctx);
    return D.CLASSES.filter(function (c) { return c.staff === name; });
  }

  /* The union of her rolls, a child once however many of her hours they are
     in, alphabetical because she is looking a name up. */
  function myChildren(ctx) {
    var seen = {}, out = [];
    myClasses(ctx).forEach(function (c) {
      D.roster(c.id).forEach(function (s) {
        if (!seen[s.id]) { seen[s.id] = true; out.push(s); }
      });
    });
    return out.sort(byName);
  }

  function flagged(ctx) {
    return myChildren(ctx).filter(function (s) { return !!s.flag; });
  }
  function medical(ctx) {
    return flagged(ctx).filter(function (s) { return s.flagKind === 'bad'; });
  }
  function worthKnowing(ctx) {
    return flagged(ctx).filter(function (s) { return s.flagKind !== 'bad'; });
  }

  /* Brothers and sisters are read off the whole book, not off her rolls: a
     sibling may well be in somebody else's hour. */
  function siblingsOf(s) {
    return D.STUDENTS.filter(function (k) { return k.family === s.family && k.id !== s.id; });
  }

  /* ---- naming a class ----------------------------------------------------------
     '2:15–3:15pm' → '2:15pm'. Only the end of a range carries the meridiem in
     this dataset, so a start time borrows it. */

  function startTime(c) {
    var parts = String(c.time).split('–');
    var from = parts[0], to = parts[1] || '';
    var mark = to.match(/(am|pm)$/i);
    return /am|pm$/i.test(from) ? from : from + (mark ? mark[1] : '');
  }

  /* The way a teacher says a class: the day and the hour for a weekly class,
     with the programme in front of it where the programme is the point, and
     the class's own name for anything that runs all week — camp week 4 and
     camp week 5 share a day, an hour and a room, and differ only by name. */
  function classShort(c) {
    var prog = D.program(c.prog);
    /* A class that runs all week is known by its name — camp week 4 and camp
       week 5 share a day, an hour and a room, and differ only there. */
    if (String(c.day).indexOf('–') !== -1) {
      var tail = c.name.split(' · ').pop();
      return !prog || tail === c.name ? c.name : prog.short + ' ' + tail.toLowerCase();
    }
    var when = c.day + ' ' + startTime(c);
    return c.prog === 'as' || !prog ? when : prog.short + ' · ' + when;
  }
  function classFull(c) { return classShort(c) + ' · ' + c.room; }

  /* Every hour a child is in, named. D.classesOf is the join. */
  function classText(s) {
    var list = D.classesOf(s);
    return list.length ? list.map(classShort).join(', ') : 'No class yet';
  }
  function classTextFull(s) {
    return D.classesOf(s).map(classFull).join(', ');
  }

  /* The hour this teacher would take a register for. A child in two of her
     hours gets the first of them; a child in none gets no button rather than
     somebody else's register. */
  function registerClass(ctx, s) {
    var name = teacherName(ctx);
    return D.classesOf(s).filter(function (c) { return c.staff === name; })[0] || null;
  }

  /* Photo permission is answered per child on the registration form and kept
     as a signed document. Where there is one, it is the answer. */
  function photoDoc(s) {
    return D.DOCUMENTS.filter(function (d) {
      return d.name === 'Photo permission — ' + firstName(s.name);
    })[0];
  }

  /* What the child has missed, and any class booked on top of their weekly
     place. Both are read off the rows this screen lists, never off STUDENTS.mk,
     which still carries a count of a thing that no longer exists. */
  function missedBy(s) {
    return D.absencesFor(s.name);
  }
  function extrasFor(s) {
    return D.EXTRA_CLASSES.filter(function (x) { return x.child === s.name; });
  }

  /* The other instructor who teaches, for the second note on the record. */
  function otherInstructor(name) {
    return D.STAFF.filter(function (t) {
      return t.role === 'Instructor' && t.name !== name && t.classes > 0;
    })[0];
  }

  /* What to do, rather than what the flag says. A child's record carries the
     condition and no action plan, so a medical alert gets the studio's
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

  function studentTabs(ctx) {
    return {
      key: 'sStudents',
      items: [
        { label: 'Your children', count: myChildren(ctx).length },
        { label: 'Safety', count: flagged(ctx).length }
      ]
    };
  }

  /* Two lists of twenty read where one long list scrolls, and age is how a
     teacher already thinks about a room. Groups come out youngest first. */
  function bandGroups(list) {
    var out = [];
    list.forEach(function (s) {
      var found = null;
      out.forEach(function (g) { if (g.band === s.band) found = g; });
      if (!found) { found = { band: s.band, kids: [], youngest: s.age }; out.push(found); }
      found.kids.push(s);
      if (s.age < found.youngest) found.youngest = s.age;
    });
    return out.sort(function (a, b) { return a.youngest - b.youngest; });
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
    sub: 'Every child on your rolls, with the hours they are in and the safety flag you need at the door. ' + SAFETY_NOTE,
    actions: [
      { label: 'Add a note', kind: 'primary', to: 'sStudentNote' }
    ],

    body: function (ctx) {
      return Grove.tab('sStudents', 'Your children') === 'Safety' ? safetyTab(ctx) : allTab(ctx);
    }
  });

  /* Named children and their conditions, in clay, above everything else on
     the page — not a badge on a tab and not a pill in the fourth column. */
  function safetyBand(ctx) {
    var list = medical(ctx);
    if (!list.length) return '';

    return ui.notice({
      kind: 'bad',
      title: list.length === 1
        ? 'One child you teach has a medical alert'
        : cap(word(list.length)) + ' children you teach have a medical alert',
      text: list.map(function (s) { return s.name + ' — ' + s.flag; }).join('. ') + '.',
      action: { label: 'What to do', act: 'tab', 'tab-key': 'sStudents', 'tab-value': 'Safety' }
    });
  }

  function allTab(ctx) {
    var kids = myChildren(ctx);
    var q = Grove.query('sStudentsAll');

    /* One chip per class she teaches, named the way the class is named
       everywhere else on this surface. */
    var classes = myClasses(ctx);
    var chips = ['All classes'].concat(classes.map(classShort));
    var chosen = Grove.filter('sStudentsClass', chips[0]);

    /* The chip is matched back to her own class record, so a chip means that
       roll and not every class in the studio that happens to share a name. */
    var only = null;
    classes.forEach(function (c) { if (classShort(c) === chosen) only = c; });

    var rows = kids.filter(function (s) {
      var inChosen = !only || D.roster(only.id).indexOf(s) !== -1;
      return inChosen && Grove.match(q, s.name, s.family, classText(s), s.flag);
    });

    function line(s) {
      return {
        lead: esc('Age ' + s.age),
        title: esc(s.name),
        sub: esc(classText(s) + ' · ' + s.family + ' family'),
        end: s.flag ? ui.pill(s.flag, s.flagKind) : '',
        to: 'sStudent', id: s.id
      };
    }

    var cards = bandGroups(rows).map(function (g) {
      return ui.card({
        title: 'Ages ' + g.band,
        head: ui.pill(plural(g.kids.length, 'child', 'children')),
        flush: true
      }, ui.rows(g.kids.map(line)));
    });

    if (!cards.length) {
      cards.push(ui.card({ flush: true }, kids.length
        ? ui.empty('No children match', 'Clear the search and try again.')
        : ui.empty('No classes assigned to you yet', 'Your children appear here as soon as the office puts a class in your name.')));
    }

    var toolbar = ui.toolbar({
      tabs: studentTabs(ctx),
      search: { key: 'sStudentsAll', placeholder: 'Search child, family, class…' },
      filters: classes.length > 1 ? { key: 'sStudentsClass', items: chips } : null,
      count: plural(rows.length, 'child', 'children')
    });

    var band = safetyBand(ctx);
    return band
      ? band + '<div class="section">' + toolbar + stacked(cards) + '</div>'
      : toolbar + stacked(cards);
  }

  /* A medical alert and a way of working are different facts, so they are two
     groups rather than one stack of look-alike cards — and what to do sits
     between them, where it is read rather than scrolled past. */
  function safetyTab(ctx) {
    var urgent = medical(ctx);
    var watch = worthKnowing(ctx);
    var proc = D.TRAINING.filter(function (t) { return t.name === 'Allergy and EpiPen procedure'; })[0];

    var alerts = urgent.length
      ? ui.card({
          title: 'Medical alerts',
          head: ui.pill(plural(urgent.length, 'child', 'children'), 'bad'),
          note: 'Read this before the doors open, not when something happens. An allergy, a condition or a medication travels with the child to camp and to any extra class.'
        }, urgent.map(function (s) {
          return ui.notice({
            kind: 'bad',
            title: s.name + ' — ' + s.flag,
            text: 'In ' + classText(s) + '. Emergency contact ' + contactOf(s) + '.',
            action: { label: 'Open ' + firstName(s.name), to: 'sStudent', id: s.id }
          });
        }).join(''))
      : ui.card({
          title: 'Medical alerts',
          head: ui.pill('None', 'ok')
        }, ui.empty('Nothing on file', 'No child on your rolls has an allergy, a condition or a medication recorded.'));

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
            sub: esc('Set the room up for it before the doors open. ' + classText(s) + ' · ' + contactOf(s) + '.'),
            to: 'sStudent', id: s.id
          };
        })))
      : '';

    return ui.toolbar({
      tabs: studentTabs(ctx),
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
      return 'Age ' + s.age + ' · ' + classText(s) + ' · ' + s.family + ' family. ' + SAFETY_NOTE;
    },
    actions: function (ctx) {
      var s = stu(ctx);
      var c = registerClass(ctx, s);
      var list = [];
      /* Only where one of her own hours holds this child. A button that opens
         somebody else's register is worse than no button. */
      if (c) list.push({ label: 'Take the register', to: 'sAttendance', id: c.id });
      list.push({ label: 'Add a note', kind: 'primary', to: 'sStudentNote', id: s.id });
      return list;
    },

    body: function (ctx) {
      var s = stu(ctx);
      var f = famByName(s.family);
      var kin = siblingsOf(s);
      var photo = photoDoc(s);
      var hours = D.classesOf(s);

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

      var kvRows = [
        ['Age', esc(s.age + ' · ages ' + s.band)],
        {
          k: hours.length === 1 ? 'Class' : 'Classes',
          v: esc(hours.length ? classTextFull(s) : 'No class yet'),
          tone: hours.length ? null : 'mute'
        },
        ['Family', esc(f.guardian + ' · ' + s.family + ' family')],
        kin.length
          ? {
              k: kin.length === 1 ? 'Brother or sister' : 'Brothers and sisters',
              v: esc(kin.map(function (k) { return k.name + ' · age ' + k.age; }).join(', '))
            }
          : { k: 'Brothers and sisters', v: 'None on the books', tone: 'mute' }
      ];
      /* Where a photo permission has been published for this child, it is the
         answer and it belongs on the record. */
      if (photo) {
        kvRows.push({
          k: 'Photographs',
          v: photo.signed ? 'Allowed' : 'Do not photograph',
          tone: photo.signed ? 'grove' : 'clay'
        });
      }

      var about = ui.card({ title: 'About ' + firstName(s.name) }, ui.kv(kvRows));

      var me = (ctx && ctx.persona && ctx.persona.name) || Grove.persona('studio').name;
      var other = otherInstructor(me);
      var seat = Math.max(0, D.STUDENTS.indexOf(s));

      var notes = ui.card({
        title: 'Notes from staff',
        head: ui.btn({ label: 'Add a note', kind: 'quiet', size: 'sm', to: 'sStudentNote', id: s.id }),
        flush: true,
        note: 'A note reaches the assigned staff and the office. Anything medical belongs on the safety record, where it travels with the child.'
      }, ui.rows([
        {
          lead: '24 Jul',
          title: esc(me),
          sub: esc(FIRST_NOTES[seat % FIRST_NOTES.length])
        },
        {
          lead: '17 Jul',
          title: esc(other ? other.name : me),
          sub: esc(SECOND_NOTES[seat % SECOND_NOTES.length])
        }
      ]));

      /* Only where there is something to show. An absence is just an absence
         now — nothing is issued and nothing is owed — so it is recorded and left
         alone. An extra class is the one that changes her afternoon: a child
         arriving in an hour that is not theirs. */
      var missed = missedBy(s);
      var extras = extrasFor(s);

      var missedCard = missed.length
        ? ui.card({
            title: 'Classes missed',
            head: ui.pill(plural(missed.length, 'class', 'classes')),
            flush: true,
            note: 'There is nothing to issue and nothing to book back. A family catching up books an extra class, and it shows beside this.'
          }, ui.rows(missed.map(function (a) {
            return { title: esc(a.date), sub: esc(a.reason) };
          })))
        : '';

      var extraCard = extras.length
        ? ui.card({
            title: 'Extra classes',
            head: ui.pill(plural(extras.length, 'class', 'classes')),
            flush: true,
            note: 'Booked on top of the weekly place, so ' + firstName(s.name) +
              ' turns up in a room that is not usually theirs.'
          }, ui.rows(extras.map(function (x) {
            return {
              title: esc(x.when),
              sub: esc(x.room + ' · ' + x.staff),
              end: x.staff === me ? ui.pill('In your hour', 'ok') : ''
            };
          })))
        : '';

      var sessions = [missedCard, extraCard].filter(Boolean);

      return safety +
        '<div class="section">' + ui.grid(2, [about, notes]) + '</div>' +
        (sessions.length
          ? '<div class="section">' + ui.grid(sessions.length > 1 ? 2 : null, sessions) + '</div>'
          : '');
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
        : 'Pick the child this is about. Every note reaches the assigned staff and the office, so there is no visibility setting to remember.';
    },

    body: function (ctx) {
      var s = D.student(ctx.params.id);
      if (!s) return pickChild(ctx);

      var flagLine = s.flag
        ? ui.notice({
            kind: s.flagKind,
            title: s.name + ' — ' + s.flag,
            text: 'Anything medical belongs on the safety record, where it travels with the child to camp and to any extra class. A note does not travel.'
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

  /* Her own children, thumb-sized, with the hours underneath and the flag
     beside it — so a note about the wrong child is hard to start. Grouped by
     age and searchable, because a whole roll is a lot of names to walk. */
  function pickChild(ctx) {
    var q = Grove.query('sNoteWho');
    var kids = myChildren(ctx).filter(function (k) {
      return Grove.match(q, k.name, k.family, classText(k));
    });

    var cards = bandGroups(kids).map(function (g) {
      return ui.card({
        title: 'Ages ' + g.band,
        head: ui.pill(plural(g.kids.length, 'child', 'children'))
      }, ui.choices(2, g.kids.map(function (k) {
        return ui.choice({
          id: k.id,
          size: 'lg',
          act: 'sNoteAbout',
          title: k.name,
          sub: classText(k) + (k.flag ? ' · ' + k.flag : '')
        });
      })));
    });

    if (!cards.length) {
      cards.push(ui.card({ flush: true },
        ui.empty('No children match', 'Clear the search and try again.')));
    }

    return ui.toolbar({
      search: { key: 'sNoteWho', placeholder: 'Search child, family, class…' },
      count: plural(kids.length, 'child', 'children')
    }) + stacked(cards);
  }
})();
