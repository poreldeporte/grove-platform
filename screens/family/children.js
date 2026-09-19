/* Family → Children, a child's own page, and Add a child.

   Simplifications against the previous build:
     - every child was a hand-built card of four bands (head, alert strip, a
       zero-gap facts grid with hanging borders, emergency footer). Each child
       is now one ordinary card in ui.grid(2), so the two of them end level
     - the three buttons repeated on every card — 'Change their schedule',
       'Edit' and the emergency 'Update' — are one 'Open'. They all led to the
       same subject, which is now the child's own page
     - school, date of birth, grade, medications and the photo date are not in
       the dataset, so they are not shown. The emergency contact is the
       guardian and number already held on the family record
     - 'Add a child' was three cards holding one, four and two fields, which is
       exactly what gave the client three different heights. It is two cards in
       ui.grid(2), which stretch equal — the photo now sits with safety
     - the separate emergency-contact form asked for two identical contacts and
       typed one into the other. One contact is enough, and it lives on the
       child's safety card */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  /* The signed-in parent is the Johnson household. */
  var FAMILY = 'Johnson';

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
  function credits(n) {
    return n ? n + ' available' : 'None';
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
    sub: 'Keep allergies and emergency details current — instructors see them on every roster. ' +
         'Every child needs a photo so staff can match a name to a face.',
    actions: [
      { label: 'Add a child', kind: 'primary', to: 'fAddChild' }
    ],

    body: function () {
      var kids = mine();
      if (!kids.length) {
        return ui.card({}, ui.empty('Nobody on file yet', 'Add a child and they will appear here.'));
      }

      return ui.grid(2, kids.map(function (s) {
        return ui.card({
          title: s.name,
          head: ui.btn({ label: 'Open', kind: 'quiet', size: 'sm', to: 'fChild', id: s.id })
        }, ui.kv([
          { k: 'Age', v: esc(s.age) },
          { k: 'Age band', v: esc(s.band) },
          { k: 'Enrolled in', v: esc(s.cls) },
          { k: 'Attendance', v: esc(s.att) },
          { k: 'Make-up credits', v: esc(credits(s.mk)), tone: s.mk ? null : 'mute' },
          { k: 'Safety', v: safety(s) }
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
      var s = kid(ctx);
      return 'Age ' + s.age + ' · ages ' + s.band + ' · ' + s.cls;
    },
    actions: [
      { label: 'Message the studio', to: 'fMessages' },
      { label: 'Change their schedule', kind: 'primary', to: 'fSchedule' }
    ],

    body: function (ctx) {
      var s = kid(ctx);
      var f = household(s.family);
      var makeups = D.MAKEUPS.filter(function (m) { return m.child === s.name; });

      var about = ui.card({ title: 'About them' }, ui.kv([
        { k: 'Age', v: esc(s.age) },
        { k: 'Age band', v: esc(s.band) },
        { k: 'Family', v: esc(f.name + ' family') },
        { k: 'Guardian', v: esc(f.guardian) },
        { k: 'With us since', v: esc(f.since) }
      ]));

      var schedule = ui.card({
        title: 'Their schedule',
        head: ui.btn({ label: 'Full calendar', kind: 'quiet', size: 'sm', to: 'fSchedule' }),
        note: 'Tell us more than 24 hours ahead and the missed class becomes a make-up credit.'
      }, ui.kv([
        { k: 'Class', v: esc(s.cls) },
        { k: 'Attendance', v: esc(s.att) },
        { k: 'Make-up credits', v: esc(credits(s.mk)), tone: s.mk ? null : 'mute' }
      ].concat(makeups.map(function (m) {
        return { k: m.missed, v: esc(m.booked || m.status), tone: 'mute' };
      }))));

      var note = s.flag
        ? ui.notice({
            kind: 'bad',
            title: s.flag,
            text: 'Shown to every teacher on the roster and on the attendance sheet.'
          })
        : ui.empty('Nothing on file', 'No allergies or medical notes have been recorded.');

      var care = ui.card({
        title: 'Safety',
        head: ui.btn({ label: 'Update', kind: 'quiet', size: 'sm', msg: 'Prototype — no form yet' }),
        note: 'Staff check this at the door and call it first if anything happens.'
      }, h`<div class="stack">
        ${raw(note)}
        ${raw(ui.kv([
          { k: 'In an emergency we call', v: esc(f.guardian) },
          { k: 'Phone', v: esc(f.phone) },
          { k: 'Email', v: esc(f.email) }
        ]))}
      </div>`);

      return ui.grid(3, [about, schedule, care]);
    }
  };

  /* The trail has to close on the child's name, and the shell reads
     `crumbTitle` as a value rather than calling it. */
  Object.defineProperty(childScreen, 'crumbTitle', {
    get: function () { return kid({ params: Grove.state.params }).name; }
  });

  Grove.screen('fChild', childScreen);

  /* ---- add a child ----------------------------------------------------------
     Two cards, both in ui.grid(2), so they stretch to the same height — the
     inconsistency the client photographed. */

  Grove.screen('fAddChild', {
    surface: 'family',
    crumbs: [{ label: 'Children', to: 'fChildren' }],
    crumbTitle: 'Add a child',
    eyebrow: 'a new young artist',
    title: 'Add a child',
    sub: 'The photo helps teachers learn names quickly and confirms who is in the room.',

    body: function () {
      var about = ui.card({ title: 'About them' }, ui.fields(2, [
        ui.field({ label: 'First name', control: ui.input({}) }),
        ui.field({ label: 'Last name', control: ui.input({}) }),
        ui.field({ label: 'Date of birth', control: ui.input({ placeholder: 'e.g. 14 Mar 2018' }) }),
        ui.field({ label: 'Age band', control: ui.select({ options: ['5–7', '8–11', '12+'] }) })
      ]));

      var care = ui.card({ title: 'Photo and safety' }, ui.fields(2, [
        ui.field({
          label: 'Photo',
          span: true,
          control: ui.dropzone({
            title: 'Drop a photo here, or choose a file',
            hint: 'Required. Used on rosters and attendance only.'
          })
        }),
        ui.field({
          label: 'Allergies and medical notes',
          span: true,
          control: ui.textarea({ placeholder: 'Anything a teacher must know' })
        }),
        ui.field({
          label: 'Emergency contact',
          span: true,
          control: ui.input({ placeholder: 'Name and phone' })
        })
      ]));

      return ui.grid(2, [about, care]) + ui.formActions([
        { label: 'Save child', kind: 'primary', msg: 'Child added' },
        { label: 'Cancel', to: 'fChildren' }
      ]);
    }
  });
})();
