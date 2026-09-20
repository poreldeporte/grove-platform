/* Family → Children, one child's page, and Add a child.

   Written for the parent this portal is actually for: someone in their
   sixties doing the school run, wary of getting something wrong online, who
   will ring the studio rather than hunt for a control. Three things are true
   of all three screens after this pass — the thing they came to do is on
   screen before they scroll, they are asked one question at a time, and
   asking a person is an option they can see.

   What changed in this pass:
     - a child's card was seven rows of the studio's record: Age, Age band,
       Class, Attendance, Make-up credits, Safety, In an emergency we call.
       It is now two lines — when they are in, and what a teacher must not get
       wrong — with anything that needs the parent on a footer bar of its own:
       "One class to make up · Book a make-up", "Photo permission still to
       sign · Read and sign". The button sits on the child it belongs to
     - "In an emergency we call" was printed on both children's cards, the
       same sentence twice. It is one card at the foot of the page, because
       that number belongs to the family rather than to either child
     - the children list ends in "Something not right?", with the desk number
       and a message button, so a parent who cannot find what they came for
       can see that asking is allowed
     - the child page opened with About them (Age, Age band, Family, Guardian,
       With us since, Photo permission) and put the allergy in the second
       column. Safety is now the first card, across the full width, with the
       allergy in a red notice and the number we ring in the sentence under it
     - the child page ends in "If something needs changing", with the desk
       number and a message button, and its header is down to one button: on a
       phone the header is a two-column grid, and a second button squeezed the
       child's name into one word a line
     - the child page carries a bar pinned to the bottom of the viewport when
       something needs the parent, and it names the thing: "Book the class
       Emma missed", "Read and sign the photo permission for Lucas". The
       children list does not carry one, because with two children a single
       bar could only name one of them — there, the button is on the card
     - Add a child showed seven fields at once with Save underneath them all,
       which is the complaint that started this pass. It is three questions:
       their name and birthday, is there anything a teacher must know, and who
       do we ring. The last two are answered with two big choices, and each
       asks for more only once it has been answered — the notes box appears
       when you say there is something to tell us, the name and number appear
       when you say somebody other than the contact we already hold. Save is
       pinned to the bottom of the viewport and says what happens next in one
       line: nothing is booked yet
     - those three questions run down the page one card each rather than two
       abreast, because a form is a sequence and a second column reads as a
       second thing to deal with. The pair of cards under them is a ui.grid,
       so they still end level

   Jargon removed from the parent's side: credit and make-up credit (a parent
   has a class to make up; the credit is the studio's bookkeeping), attendance
   percentages, age band, guardian, roster, attendance sheet, the status
   vocabulary Available / Booked / Expiring, and the summary line
   "1 available · 1 booked".

   Removed, and why a parent does not need it:
     - "Attendance · 96%". A percentage is the studio's measure of a term. The
       fact a parent can act on is which classes were missed and whether one
       still needs booking, and that is now said in words, one line each
     - "Age band · 8–11". The band is how the studio groups a room. It is said
       as part of a sentence — "in the group for ages 8 to 11" — and Add a
       child no longer asks for it at all, because it follows from the date of
       birth the form already asks for
     - "Family · Johnson family" and "Guardian · Sabrina Moore" from the child
       page. A parent knows their own surname, and the guardian is the person
       reading the page — they appear once, as the number we ring
     - the status pills against each missed class. "Booked for Fri 31 Jul ·
       10:00am" says more than a pill reading Booked, and takes the same room
     - "expires 31 Jul" on every row, replaced by one line under the list

   Kept although it looks like clutter:
     - the allergy and the medical note, at the top of the child page in red.
       It is the one thing on this screen that can hurt somebody
     - the emergency name, number and email, in full, on both screens
     - the date a missed class must be booked by. It is a date a parent has to
       act on, so it stays, in words, under the list
     - the unsigned photo permission for Lucas. It is paperwork the studio is
       waiting on and the only place the children screens show it
     - "with us since Aug 2024". One clause on a line that was already there,
       and the parent's own check that the record is theirs

   The desk number is the one Console → Settings gives families, which is the
   number Documents quotes as well. Billing and Book a make-up quote
   a different number instead; those files are not mine to change, but a parent
   should not be given two numbers for one studio. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  /* The signed-in parent is the Johnson household. */
  var FAMILY = 'Johnson';

  /* The studio's number, as Console → Settings gives it to families. */
  var DESK = D.STUDIO.phone;

  /* A weekly place is said as a recurring day — "Mondays at 3:15pm" — rather
     than the record's "Mon 3:15pm". Dates are left exactly as the dataset
     writes them, so a missed class reads here the way it reads on Schedule. */
  var DAYS = {
    Mon: 'Mondays', Tue: 'Tuesdays', Wed: 'Wednesdays', Thu: 'Thursdays',
    Fri: 'Fridays', Sat: 'Saturdays', Sun: 'Sundays'
  };

  /* A safety flag of kind "warn" has no pill of its own; amber is the nearest,
     and it is the mapping the make-up rows use elsewhere. */
  var FLAG = { bad: 'bad', warn: 'amber', ok: 'ok' };

  function mine() {
    return D.STUDENTS.filter(function (s) { return s.family === FAMILY; });
  }
  function kid(ctx) {
    var s = D.student(ctx.params.id);
    return s && s.family === FAMILY ? s : mine()[0];
  }
  function household() {
    return D.FAMILIES.filter(function (f) { return f.name === FAMILY; })[0] || D.FAMILIES[0];
  }
  function first(s) {
    return String(s.name).split(' ')[0];
  }
  function andList(names) {
    if (names.length < 2) return names.join('');
    return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
  }

  /* ---- what the dataset holds about one child --------------------------------
     Every figure on these screens is counted off the rows shown. A child's
     missed classes come from MAKEUPS, never from STUDENTS.mk, because a class
     already booked back in is not one the family still has to do anything
     about — which is exactly what Schedule → Absences & make-ups shows. */

  function missedClasses(s) {
    return D.MAKEUPS.filter(function (m) { return m.child === s.name; });
  }
  function stillToBook(s) {
    return missedClasses(s).filter(function (m) { return m.status === 'Available'; });
  }
  function useBy(list) {
    var seen = [];
    list.forEach(function (m) {
      if (seen.indexOf(m.expires) === -1) seen.push(m.expires);
    });
    return andList(seen);
  }

  /* The child's own paperwork — a photo permission is held per child. */
  function consentDoc(s) {
    var name = first(s);
    return D.DOCUMENTS.filter(function (d) { return d.name.indexOf(name) !== -1; })[0];
  }
  function signedLine(d) {
    var parts = String(d.who).split(' · ');
    var me = Grove.persona('family');
    if (!parts[1]) return parts[0];
    return (me && parts[0] === me.name ? 'You signed this on ' : parts[0] + ' signed this on ') +
      parts[1];
  }

  /* The class record behind a child's enrollment string, when there is one.
     Both Johnson children sit in a class CLASSES holds, so each gets a
     teacher. An enrollment string that is not a day-and-room pair — a
     waitlisted place, or several days at once — comes back empty. */
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

  /* "Mon 3:15pm · Studio 2" said the way a parent would say it. */
  function whenLine(s) {
    var parts = String(s.cls).split(' · ');
    var head = parts[0].split(' ');
    var day = DAYS[head[0]];
    var c = classFor(s);
    var who = c ? c.staff : '';
    if (!day || !head[1]) {
      return { title: s.cls, sub: who ? 'With ' + who : '' };
    }
    var sub = parts[1] ? 'In ' + parts[1] : '';
    if (who) sub += sub ? ' with ' + who : 'With ' + who;
    return { title: day + ' at ' + head[1], sub: sub };
  }

  /* "8–11" → "8 to 11", "12+" → "12 and over". */
  function bandWords(band) {
    var b = String(band);
    if (b.indexOf('–') !== -1) return b.split('–').join(' to ');
    if (b.charAt(b.length - 1) === '+') return b.slice(0, -1) + ' and over';
    return b;
  }

  /* ---- the things that need the parent ---------------------------------------
     Most pressing first: a class with a date to book it by, then paperwork,
     which has no date on it. Each one carries the sentence it is announced
     with, the short label for a button beside it, and the full label for a
     bar that has to name it on its own. */

  function todos(s) {
    var list = [];
    var open = stillToBook(s);
    var doc = consentDoc(s);

    if (open.length) {
      list.push({
        name: open.length === 1
          ? 'the class ' + first(s) + ' missed'
          : 'the ' + open.length + ' classes ' + first(s) + ' missed',
        verb: 'Book',
        short: 'Book a make-up',
        line: open.length === 1 ? 'One class to make up' : open.length + ' classes to make up',
        hint: 'Book before ' + useBy(open) + ' — a make-up class costs nothing',
        to: 'fBookMakeup'
      });
    }
    if (doc && !doc.signed) {
      list.push({
        name: 'the photo permission for ' + first(s),
        verb: 'Read and sign',
        short: 'Read and sign',
        line: 'Photo permission still to sign',
        hint: 'One page, and a tick — nothing changes until you sign it',
        to: 'fDocument',
        id: doc.id
      });
    }
    return list;
  }
  function fullLabel(t) {
    return t.verb + ' ' + t.name;
  }

  /* ---- the children ---------------------------------------------------------- */

  function childCard(s) {
    var w = whenLine(s);
    var t = todos(s);

    var rows = [
      { title: esc(w.title), sub: esc(w.sub) },
      s.flag
        ? {
            title: esc(s.flag),
            sub: 'Every teacher sees this before class starts.',
            end: ui.pill('Safety', FLAG[s.flagKind] || 'bad')
          }
        : {
            title: 'Nothing to avoid',
            sub: 'You have not told us about an allergy or anything medical.',
            end: ui.pill('Safety', 'ok')
          }
    ];

    /* Whatever needs the parent sits on this child's own card, with the
       button on the same line as the sentence that explains it. */
    var foot = t.length
      ? h`<span class="strong">${t[0].line}</span>` +
        ui.btn({ label: t[0].short, kind: 'primary', size: 'sm', to: t[0].to, id: t[0].id })
      : '<span class="mute">Nothing needs you</span>';

    return ui.card({
      title: s.name,
      flush: true,
      head: ui.btn({ label: 'Open ' + first(s), kind: 'quiet', size: 'sm', to: 'fChild', id: s.id }),
      foot: foot
    }, ui.rows(rows));
  }

  Grove.screen('fChildren', {
    surface: 'family',
    crumbTitle: 'Children',
    eyebrow: 'who you have with us',
    title: 'My children',
    sub: function () {
      var names = mine().map(first);
      if (!names.length) return 'Nobody is on your family yet. Add a child and they will appear here.';
      return andList(names) + (names.length === 1 ? ' is' : ' are') + ' with us. Open a child to ' +
        'see when they are in, what a teacher must know about them, and who we ring first.';
    },
    actions: [
      { label: 'Add a child', kind: 'primary', to: 'fAddChild' }
    ],

    body: function () {
      var kids = mine();
      if (!kids.length) {
        return ui.card({}, ui.empty('Nobody on file yet', 'Add a child and they will appear here.'));
      }
      var f = household();

      /* The number is the family's, not either child's, so it is said once
         rather than printed at the foot of every card. */
      var ring = ui.card({
        title: 'If we need you',
        note: 'Staff check this at the door and ring it first if anything happens.'
      }, h`<div class="stack stack--sm">
        <p>We ring <span class="strong">${f.guardian}</span> on
        <span class="strong">${f.phone}</span>, whichever child is in.</p>
        <p class="hint">Anything we write goes to ${f.email}.</p>
      </div>`);

      var wrong = ui.card({
        title: 'Something not right?',
        foot: '<span class="hint">Or ring the desk on ' + esc(DESK) + '</span>' +
          ui.btn({ label: 'Message the studio', to: 'fMessages' })
      }, h`<p class="hint">Names, birthdays, allergies, the number we ring — tell us what needs
        changing and we will put it right. You cannot break anything on this page.</p>`);

      return h`
        ${raw(ui.grid(2, kids.map(childCard)))}
        <div class="section">${raw(ui.grid(2, [ring, wrong]))}</div>
      `;
    }
  });

  /* ---- one child ---------------------------------------------------------------
     Safety first and across the full width, because it is the only thing on
     this page that can hurt somebody. Under it, when they are in, what is
     left to make up, and how to have any of it changed by a person. */

  function makeupRow(s, m) {
    var bits = String(m.missed).split(' · ');
    var why = String(m.reason).split(',')[0].toLowerCase();
    if (why.indexOf('requested') === 0) why = 'you asked to move it';

    var end;
    if (m.status === 'Available') {
      end = ui.btn({ label: 'Book a make-up', kind: 'primary', size: 'sm', to: 'fBookMakeup' });
    } else if (m.booked) {
      end = h`<span class="strong">${m.status === 'Booked' ? 'Booked for ' + m.booked : m.booked}</span>` +
        ui.btn({ label: 'Change', kind: 'quiet', size: 'sm', to: 'fMessages' });
    } else {
      end = ui.btn({ label: 'Ask the studio', kind: 'quiet', size: 'sm', to: 'fMessages' });
    }

    return {
      title: esc(first(s) + ' missed ' + bits[0]),
      sub: esc(bits[1] ? 'The ' + bits[1] + ' class — ' + why : why),
      end: end
    };
  }

  var childScreen = {
    surface: 'family',
    crumbs: [{ label: 'Children', to: 'fChildren' }],
    eyebrow: 'your young artist',
    title: function (ctx) { return kid(ctx).name; },
    sub: function (ctx) {
      return 'Everything the studio holds for ' + first(kid(ctx)) +
        ', and what a teacher sees at the door.';
    },
    /* One header action. On a phone the header is a two-column grid, so a
       second button squeezes the child's name into a single word a line. Ways
       to reach a person are on the cards, where the thing to change is. */
    actions: [
      { label: 'See their schedule', kind: 'primary', to: 'fSchedule' }
    ],

    body: function (ctx) {
      var s = kid(ctx);
      var f = household();
      var list = missedClasses(s);
      var doc = consentDoc(s);
      var w = whenLine(s);
      var t = todos(s);

      var flag = s.flag
        ? ui.notice({
            kind: 'bad',
            title: s.flag,
            text: 'Every teacher sees this before class starts, and it is on the sheet they carry.'
          })
        : ui.notice({
            kind: 'ok',
            title: 'Nothing to avoid',
            text: 'You have not told us about an allergy, a medicine or anything medical. ' +
                  'Tell us if that changes and we will pass it to every teacher.'
          });

      /* Across the full width and on its own, above the grid rather than
         spanning it: a card that spans two columns still asks for two on a
         phone, where every grid collapses to one. */
      var care = ui.card({
        title: 'What a teacher must know',
        head: ui.btn({ label: 'Tell us a change', kind: 'quiet', size: 'sm', to: 'fMessages' }),
        note: 'Staff check this at the door and ring that number before anyone else.'
      }, h`<div class="stack">
        ${raw(flag)}
        <p>If anything happens we ring <span class="strong">${f.guardian}</span> on
        <span class="strong">${f.phone}</span>, then write to ${f.email}.</p>
      </div>`);

      var rows = [
        { title: esc(w.title), sub: esc(w.sub) },
        {
          title: esc(first(s) + ' is ' + s.age),
          sub: esc('In the group for ages ' + bandWords(s.band) + ', with us since ' + f.since)
        }
      ];
      if (doc) {
        rows.push(doc.signed
          ? { title: 'Photo permission signed', sub: esc(signedLine(doc)) }
          : {
              title: 'Photo permission still to sign',
              sub: 'One page, and a tick.',
              end: ui.btn({
                label: 'Read and sign', kind: 'primary', size: 'sm', to: 'fDocument', id: doc.id
              })
            });
      }

      var atStudio = ui.card({
        title: first(s) + ' at the studio',
        flush: true,
        note: 'This is their place for the term. If the day stops working for you, tell us and ' +
              'we will see what is possible.'
      }, ui.rows(rows));

      var makeups = ui.card({
        title: 'Classes to make up',
        flush: true,
        note: list.length
          ? 'Use them before ' + useBy(list) + '. A make-up class costs nothing, and none of ' +
            'them can be carried into the autumn term.'
          : 'Tell us more than 24 hours before a class and ' + first(s) +
            ' can take another hour instead.'
      }, list.length
        ? ui.rows(list.map(function (m) { return makeupRow(s, m); }))
        : ui.empty('Nothing to book', 'There is no class waiting to be made up.'));

      /* Nothing on this page has to be done online, and a parent who cannot
         see the control they want should be able to see that. */
      var help = ui.card({
        title: 'If something needs changing',
        foot: '<span class="hint">Or ring the desk on ' + esc(DESK) + '</span>' +
          ui.btn({ label: 'Message the studio', to: 'fMessages' })
      }, h`<p class="hint">An allergy, a new number, a day that has stopped working — send us a
        message and we will change it for you. You do not have to do any of it yourself.</p>`);

      /* One child, so a bar can name what needs doing without guessing which
         of them was meant. Nothing outstanding, no bar. */
      var bar = t.length
        ? ui.formActions(t.map(function (x, i) {
            return { label: fullLabel(x), kind: i === 0 ? 'primary' : null, to: x.to, id: x.id };
          }), { sticky: true, hint: t[0].hint })
        : '';

      return h`
        ${raw(care)}
        <div class="section">${raw(ui.grid(2, [atStudio, ui.col([makeups, help])]))}</div>
        ${raw(bar)}
      `;
    }
  };

  /* The trail has to close on the child's name, and the shell reads
     `crumbTitle` as a value rather than calling it. */
  Object.defineProperty(childScreen, 'crumbTitle', {
    get: function () { return kid({ params: Grove.state.params }).name; }
  });

  Grove.screen('fChild', childScreen);

  /* ---- add a child --------------------------------------------------------------
     Three questions, in the order a parent would be asked them at the desk.
     The two that only sometimes need an answer ask for it only once they have
     been answered, so nobody is handed an empty box they may not need, and
     Save is pinned to the bottom of the viewport from the first question on. */

  Grove.on('kidCare', function (d) { Grove.setFilter('kidCare', d.id); });
  Grove.on('kidCall', function (d) { Grove.setFilter('kidCall', d.id); });

  Grove.screen('fAddChild', {
    surface: 'family',
    crumbs: [{ label: 'Children', to: 'fChildren' }],
    crumbTitle: 'Add a child',
    eyebrow: 'a new young artist',
    title: 'Add a child',
    sub: 'A name and a birthday are all we need to put them on a list. Everything else on this ' +
         'page you can tell us now or leave until later.',
    actions: [
      { label: 'Message the studio', to: 'fMessages' }
    ],

    body: function () {
      var f = household();
      /* Nothing is chosen for the parent on the safety question: a child with
         an allergy and a parent who never reached the bottom of the form is
         the one mistake this page must not make. Who we ring does have one
         sensible answer, so it is the one already selected. */
      var care = Grove.filter('kidCare', '');
      var call = Grove.filter('kidCall', 'same');

      var who = ui.card({
        title: 'Their name and birthday',
        note: 'The photo is the only thing here that can wait. The name and the birthday are ' +
              'what put them on a list.'
      }, ui.fields(2, [
        ui.field({
          label: 'First name',
          control: ui.input({ placeholder: 'What you call them' })
        }),
        ui.field({
          label: 'Last name',
          hint: 'Change it if theirs is different',
          control: ui.input({ value: f.name })
        }),
        ui.field({
          label: 'Date of birth',
          hint: 'This is how we put them with children their own age — 5 to 7, 8 to 11, or 12 and over.',
          control: ui.input({ placeholder: 'e.g. 14 Mar 2018' })
        }),
        ui.field({
          label: 'Photo (you can add this later)',
          span: true,
          hint: 'It helps a teacher put a face to the name on the first day. Only the studio sees it.',
          control: ui.dropzone({
            title: 'Drop a photo here, or choose a file',
            hint: 'Nothing is shown to other families.'
          })
        })
      ]));

      var notes = ui.card({
        title: 'Is there anything a teacher must know?',
        note: 'If you are not sure, tell us anyway. We would far rather know.'
      }, ui.choices(null, [
        ui.choice({
          id: 'none', size: 'lg', act: 'kidCare',
          title: 'No, nothing',
          sub: 'No allergy, no medicine, nothing to avoid',
          on: care === 'none'
        }),
        ui.choice({
          id: 'notes', size: 'lg', act: 'kidCare',
          title: 'Yes, there is something',
          sub: 'An allergy, asthma, a medicine — anything at all',
          on: care === 'notes'
        })
      ]) + (care === 'notes'
        ? h`<div class="card-split">${raw(ui.field({
            label: 'What should a teacher know?',
            hint: 'Every teacher sees this before class starts.',
            control: ui.textarea({ placeholder: 'For example: allergic to peanuts, carries an inhaler' })
          }))}</div>`
        : ''));

      var call_ = ui.card({
        title: 'Who do we ring if something happens?',
        note: 'We ring this number first, before anyone else.'
      }, ui.choices(null, [
        ui.choice({
          id: 'same', size: 'lg', act: 'kidCall',
          title: f.guardian + ' · ' + f.phone,
          sub: 'The name and number we already hold for your family',
          on: call === 'same'
        }),
        ui.choice({
          id: 'other', size: 'lg', act: 'kidCall',
          title: 'Somebody else',
          sub: 'A different name and number, for this child only',
          on: call === 'other'
        })
      ]) + (call === 'other'
        ? h`<div class="card-split">${raw(ui.fields(2, [
            ui.field({
              label: 'Their name',
              control: ui.input({ placeholder: 'For example, a grandparent' })
            }),
            ui.field({
              label: 'Their phone',
              hint: 'A number somebody answers during the day',
              control: ui.input({ placeholder: '(000) 000-0000' })
            })
          ]))}</div>`
        : ''));

      var after = ui.card({ title: 'What happens when you save', flush: true }, ui.rows([
        {
          title: 'They join your family straight away',
          sub: 'You will see them on Children with the others.'
        },
        {
          title: 'No class is booked yet',
          sub: 'When you know the day you would like, this is where you choose it.',
          end: ui.btn({ label: 'Book & enroll', kind: 'quiet', size: 'sm', to: 'rPick' })
        }
      ]));

      var help = ui.card({
        title: 'If you are not sure',
        foot: '<span class="hint">Or ring the desk on ' + esc(DESK) + '</span>' +
          ui.btn({ label: 'Message the studio', to: 'fMessages' })
      }, h`<p class="hint">Ring the desk and we will fill this in with you over the phone, or
        send a message and we will write back. You can leave anything blank and tell us the
        rest later — nothing here is final.</p>`);

      /* The questions run down the page in the order they would be asked at
         the desk, one card each, rather than sitting two abreast where the
         second column reads as something else to deal with. The pair under
         them is a ui.grid so the two end level. */
      return h`
        ${raw(ui.grid(null, [who, notes, call_]))}
        <div class="section">${raw(ui.grid(2, [after, help]))}</div>
        ${raw(ui.formActions([
          { label: 'Save this child', kind: 'primary', msg: 'Saved — they are on your family now' },
          { label: 'Cancel', to: 'fChildren' }
        ], {
          sticky: true,
          hint: care
            ? 'No class is booked yet — you choose their day next'
            : 'Tell us about allergies above before you save'
        }))}
      `;
    }
  });
})();
