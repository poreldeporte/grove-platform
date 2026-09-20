/* Family → Children, a child's own page, and Add a child.

   Simplifications against the previous build:
     - every child was a hand-built card of four bands (head, alert strip, a
       zero-gap facts grid with hanging borders, emergency footer). Each child
       is now one ordinary card in ui.grid(2), so the two of them end level
     - the three buttons repeated on every card — 'Change their schedule',
       'Edit' and the emergency 'Update' — are one 'Open'. They all led to the
       same subject, which is now the child's own page
     - school, grade, medications and the photo date are not in the dataset,
       so they are not shown. The emergency contact is the guardian and number
       already held on the family record
     - 'Add a child' was three cards holding one, four and two fields, which is
       exactly what gave the client three different heights
     - the separate emergency-contact form asked for two identical contacts and
       typed one into the other. One contact is enough, and it lives with the
       safety notes

   After the visual review:
     - make-up credits are counted off the MAKEUPS rows the child actually
       holds, never off STUDENTS.mk. Emma's two credits are one available and
       one already booked, which is exactly what Schedule → Absences & make-ups
       shows, so the two screens now say the same thing
     - those credits used to be two unlabelled rows tacked onto the end of a
       key/value list. They are their own card, with the reason and the status
       against each one
     - the child page is two columns of two cards (ui.col) rather than one row
       of three, so no card is left with a hole in it
     - 'Add a child' no longer asks for the age band. It follows from the date
       of birth, which the form already asks for, and asking twice is the sort
       of duplicated rule the client wanted gone
     - the children list said "every child needs a photo" and "keep emergency
       details current" beside cards that showed neither. The emergency contact
       is now on the card, and the photo is asked for where it can actually be
       given — on Add a child */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  /* The signed-in parent is the Johnson household. */
  var FAMILY = 'Johnson';

  /* MAKEUPS carries an "info" kind, which has no pill of its own. A booked
     credit is settled, so it reads as the plain pill — the same mapping the
     Absences & make-ups tab uses, so a status looks the same on both. */
  var PILL = { ok: 'ok', warn: 'amber', bad: 'bad', info: null };

  function mine() {
    return D.STUDENTS.filter(function (s) { return s.family === FAMILY; });
  }
  function kid(ctx) {
    var s = D.student(ctx.params.id);
    return s && s.family === FAMILY ? s : mine()[0];
  }
  function household(name) {
    return D.FAMILIES.filter(function (f) { return f.name === name; })[0] || D.FAMILIES[0];
  }
  function first(s) {
    return String(s.name).split(' ')[0];
  }

  /* Every make-up credit this child holds. The summary line is counted off
     these rows rather than taken from STUDENTS.mk, because a credit that has
     already been booked is not one the family can still use. */
  function credits(s) {
    return D.MAKEUPS.filter(function (m) { return m.child === s.name; });
  }
  function creditLine(s) {
    var list = credits(s);
    if (!list.length) return 'None';
    var order = [], count = {};
    list.forEach(function (m) {
      if (count[m.status] === undefined) { count[m.status] = 0; order.push(m.status); }
      count[m.status] += 1;
    });
    return order.map(function (k) { return count[k] + ' ' + k.toLowerCase(); }).join(' · ');
  }
  function bookable(s) {
    return credits(s).filter(function (m) { return m.status === 'Available'; });
  }

  /* The child's own paperwork — the photo permission is held per child. */
  function consentDoc(s) {
    var name = first(s);
    return D.DOCUMENTS.filter(function (d) { return d.name.indexOf(name) !== -1; })[0];
  }

  /* The class record behind a child's enrolment string, when there is one.
     Both Johnson children sit in a class CLASSES holds, so each gets a teacher
     row. An enrolment string that is not a day-and-room pair — a waitlisted
     place, or several days at once — comes back empty and the row is dropped. */
  function classFor(s) {
    var parts = String(s.cls).split(' · ');
    var head = parts[0].split(' ');
    var start = (head[1] || '').replace(/(am|pm)/i, '');
    var room = parts[1] || '';
    if (!start || !room) return null;
    return D.CLASSES.filter(function (c) {
      return c.day === head[0] && c.room === room && c.time.indexOf(start) === 0;
    })[0] || null;
  }

  function safety(s) {
    return s.flag ? ui.pill(s.flag, s.flagKind || 'bad') : '<span class="mute">Nothing on file</span>';
  }

  /* ---- the children -------------------------------------------------------- */

  Grove.screen('fChildren', {
    surface: 'family',
    crumbTitle: 'Children',
    eyebrow: 'who you have with us',
    title: 'My children',
    sub: 'What the studio holds for each child — every teacher sees all of it on the roster. ' +
         'Open a child to check their allergies, the number we call first and their make-up credits.',
    actions: [
      { label: 'Add a child', kind: 'primary', to: 'fAddChild' }
    ],

    body: function () {
      var kids = mine();
      if (!kids.length) {
        return ui.card({}, ui.empty('Nobody on file yet', 'Add a child and they will appear here.'));
      }

      return ui.grid(2, kids.map(function (s) {
        var f = household(s.family);
        return ui.card({
          title: s.name,
          head: ui.btn({ label: 'Open', kind: 'quiet', size: 'sm', to: 'fChild', id: s.id })
        }, ui.kv([
          { k: 'Age', v: esc(s.age) },
          { k: 'Age band', v: esc(s.band) },
          { k: 'Class', v: esc(s.cls) },
          { k: 'Attendance', v: esc(s.att) },
          { k: 'Make-up credits', v: esc(creditLine(s)), tone: credits(s).length ? null : 'mute' },
          { k: 'Safety', v: safety(s) },
          { k: 'In an emergency we call', v: esc(f.guardian + ' · ' + f.phone) }
        ]));
      }));
    }
  });

  /* ---- one child ------------------------------------------------------------ */

  var childScreen = {
    surface: 'family',
    crumbs: [{ label: 'Children', to: 'fChildren' }],
    eyebrow: 'your young artist',
    title: function (ctx) { return kid(ctx).name; },
    sub: function (ctx) {
      return 'Everything the studio holds for ' + first(kid(ctx)) +
             ', and everything a teacher sees on the roster.';
    },
    actions: [
      { label: 'Message the studio', to: 'fMessages' },
      { label: 'Change their schedule', kind: 'primary', to: 'fSchedule' }
    ],

    body: function (ctx) {
      var s = kid(ctx);
      var f = household(s.family);
      var list = credits(s);
      var open = bookable(s);
      var consent = consentDoc(s);
      var c = classFor(s);

      var aboutRows = [
        { k: 'Age', v: esc(s.age) },
        { k: 'Age band', v: esc(s.band) },
        { k: 'Family', v: esc(f.name + ' family') },
        { k: 'Guardian', v: esc(f.guardian) },
        { k: 'With us since', v: esc(f.since) }
      ];
      if (consent) {
        aboutRows.push({
          k: 'Photo permission',
          v: consent.signed ? ui.pill('Signed', 'ok') : ui.pill('Not signed', 'bad')
        });
      }

      var about = ui.card({
        title: 'About them',
        head: consent && !consent.signed
          ? ui.btn({ label: 'Read and sign', kind: 'quiet', size: 'sm', to: 'fDocument', id: consent.id })
          : ''
      }, ui.kv(aboutRows));

      var scheduleRows = [{ k: 'Class', v: esc(s.cls) }];
      if (c) scheduleRows.push({ k: 'Teacher', v: esc(c.staff) });
      scheduleRows.push({ k: 'Attendance', v: esc(s.att) });
      scheduleRows.push({
        k: 'Make-up credits',
        v: esc(creditLine(s)),
        tone: list.length ? null : 'mute'
      });

      var schedule = ui.card({
        title: 'Their schedule',
        head: ui.btn({ label: 'Full calendar', kind: 'quiet', size: 'sm', to: 'fSchedule' }),
        note: 'Tell us more than 24 hours ahead and the missed class becomes a make-up credit.'
      }, ui.kv(scheduleRows));

      var flag = s.flag
        ? ui.notice({
            kind: 'bad',
            title: s.flag,
            text: 'Shown to every teacher on the roster and on the attendance sheet.'
          })
        : ui.empty('Nothing on file', 'No allergies or medical notes have been recorded.');

      var care = ui.card({
        title: 'Safety',
        head: ui.btn({ label: 'Tell us a change', kind: 'quiet', size: 'sm', to: 'fMessages' }),
        note: 'Staff check this at the door and call it first if anything happens.'
      }, h`<div class="stack">
        ${raw(flag)}
        ${raw(ui.kv([
          { k: 'In an emergency we call', v: esc(f.guardian) },
          { k: 'Phone', v: esc(f.phone) },
          { k: 'Email', v: esc(f.email) }
        ]))}
      </div>`);

      var makeups = ui.card({
        title: 'Make-up credits',
        flush: true,
        head: open.length
          ? ui.btn({ label: 'Book a make-up', kind: 'primary', size: 'sm', to: 'fBookMakeup' })
          : '',
        note: list.length
          ? 'A credit is a class, not money, and it lapses on the date it expires.'
          : 'Tell us more than 24 hours before a class and it comes back as a credit.'
      }, list.length
        ? ui.rows(list.map(function (m) {
            return {
              title: esc(m.missed),
              sub: esc(m.reason + ' · expires ' + m.expires),
              end: ui.pill(m.status, PILL[m.kind]) +
                   (m.booked ? '<div class="cell-sub">' + esc(m.booked) + '</div>' : '')
            };
          }))
        : ui.empty('No credits to use', 'Nothing has been missed, so there is nothing to rebook.'));

      return ui.grid(2, [ui.col([about, schedule]), ui.col([care, makeups])]);
    }
  };

  /* The trail has to close on the child's name, and the shell reads
     `crumbTitle` as a value rather than calling it. */
  Object.defineProperty(childScreen, 'crumbTitle', {
    get: function () { return kid({ params: Grove.state.params }).name; }
  });

  Grove.screen('fChild', childScreen);

  /* ---- add a child ----------------------------------------------------------
     Two cards in ui.grid(2) holding a comparable amount, so neither ends in a
     block of empty white: the child and their photo on one side, what a
     teacher must know and who we ring on the other. */

  Grove.screen('fAddChild', {
    surface: 'family',
    crumbs: [{ label: 'Children', to: 'fChildren' }],
    crumbTitle: 'Add a child',
    eyebrow: 'a new young artist',
    title: 'Add a child',
    sub: 'A name and a birthday are all we need to put them on a roster. The photo, the allergies ' +
         'and the number we call first are what a teacher needs at the door.',
    actions: [
      { label: 'Message the studio', to: 'fMessages' }
    ],

    body: function () {
      var f = household(FAMILY);

      var about = ui.card({ title: 'About them' }, ui.fields(2, [
        ui.field({ label: 'First name', control: ui.input({}) }),
        ui.field({ label: 'Last name', control: ui.input({ value: f.name }) }),
        ui.field({
          label: 'Date of birth',
          hint: 'The age group follows from this — 5–7, 8–11 or 12+.',
          control: ui.input({ placeholder: 'e.g. 14 Mar 2018' })
        }),
        ui.field({
          label: 'Photo',
          span: true,
          control: ui.dropzone({
            title: 'Drop a photo here, or choose a file',
            hint: 'Used on rosters and the attendance sheet only.'
          })
        })
      ]));

      var care = ui.card({
        title: 'Safety and who we call',
        note: 'Staff check this at the door and call it first if anything happens.'
      }, ui.fields(2, [
        ui.field({
          label: 'Allergies and medical notes',
          span: true,
          hint: 'Every teacher sees this on the roster and on the attendance sheet.',
          control: ui.textarea({ placeholder: 'Anything a teacher must know' })
        }),
        ui.field({
          label: 'In an emergency we call',
          control: ui.input({ value: f.guardian })
        }),
        ui.field({
          label: 'Phone',
          control: ui.input({ value: f.phone })
        })
      ]));

      return ui.grid(2, [about, care]) + ui.formActions([
        { label: 'Save child', kind: 'primary', msg: 'Child added' },
        { label: 'Cancel', to: 'fChildren' }
      ]);
    }
  });
})();
