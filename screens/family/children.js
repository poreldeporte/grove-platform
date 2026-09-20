/* Family → Children, one child's page, and Add a child.

   Written for the parent this portal is actually for: someone in their
   sixties doing the school run, wary of getting something wrong online, who
   will ring the studio rather than hunt for a control. Three things are true
   of all three screens — the thing they came to do is on screen before they
   scroll, they are asked one question at a time, and asking a person is an
   option they can see.

   WHAT CHANGED IN THIS PASS: THE BILLING MODEL WAS WRONG

   A family buys a pack of sessions for one child. The child attends. When the
   last session in the pack is used, the pack renews — it charges again and
   grants another pack the same size. There is no date in any of it: the next
   charge is a number of classes away, not a day on the calendar. Two children
   hold two packs, of whatever sizes they hold, and they renew at different
   times for two separate charges.

   Three things follow, and all three delete machinery rather than rename it:

     - a session cancelled in time is simply not spent. Tell us more than 24
       hours ahead and it stays in the child's pack, so the pack lasts a week
       longer; inside 24 hours it is spent exactly as if they had come. So
       there is no make-up credit to issue, book, chase or approve. The whole
       make-up apparatus is gone from this file — MAKEUPS, the Available /
       Booked / Expiring vocabulary, stillToBook, useBy, the "Classes to make
       up" card, the "Book a make-up" button on the card and in the pinned bar.
       A family who wants to catch up books an extra class, and that spends a
       session like any other class
     - sessions never expire. The pack is paid for, so it is theirs until used.
       Every expiry date, expiry rule and expiry warning is deleted — including
       "Book before 31 Jul", "none of them can be carried into the autumn term",
       and the one line under the list that used to carry the date
     - a child's pack is now one of the two most useful facts on their card, so
       it sits on the card beside where they are on a Monday, and it has a card
       of its own on the child's page

   Nothing on these screens is a month, a monthly rate, a billing date, a
   billing cycle or a membership. A family is not a member — they hold
   sessions. The price shown is the pack price PRICING.as.plans holds, read by
   pack size, so "another pack of 8, $540" is the studio's own figure.

   Where a child's day comes from: a placement is read from the class the child
   is enrolled in — D.classesOf(s) — rather than by parsing the free-text line
   on their record. The day, the room and the teacher are the ones the class
   itself carries, a child who holds more than one place gets a line for each,
   and a child with no place is either named on the waitlist or has no day
   chosen yet. Nothing here counts children by hand either: the family is
   whoever STUDENTS holds against the household, so the page reads the same for
   a family of one as for a family of four.

   What earlier passes settled, and this one keeps:
     - a child's card is two or three lines — when they are in, how many
       classes are left in their pack, and what a teacher must not get wrong —
       with anything that needs the parent on a footer bar of its own. The
       button sits on the child it belongs to
     - "In an emergency we call" is one card at the foot of the list, because
       that number belongs to the family rather than to either child
     - the list and the child page each end in a card that offers a person: the
       desk number and a message button, so a parent who cannot find what they
       came for can see that asking is allowed
     - Safety is the first card on the child page, across the full width, with
       the allergy in a red notice and the number we ring in the sentence under
       it
     - the child page carries a bar pinned to the bottom of the viewport when
       something needs the parent, and it names the thing. The children list
       does not, because with two children a single bar could only name one
     - Add a child is three questions — their name and birthday, is there
       anything a teacher must know, and who do we ring — each asking for more
       only once it has been answered, with Save pinned to the bottom

   Removed, and why a parent does not need it:
     - "Attendance · 96%". A percentage is the studio's measure of a term. The
       facts a parent can act on are which classes were missed and whether the
       session was spent, and both are now said in words, one line each
     - "Age band · 8–11". The band is how the studio groups a room. It is said
       as part of a sentence — "in the group for ages 8 to 11" — and Add a
       child no longer asks for it, because it follows from the date of birth
     - "Family · Johnson family" and "Guardian · Sabrina Moore" from the child
       page. A parent knows their own surname, and the guardian is the person
       reading the page — they appear once, as the number we ring

   Kept although it looks like clutter:
     - the allergy and the medical note, at the top of the child page in red.
       It is the one thing on this screen that can hurt somebody
     - the emergency name, number and email, in full, on both screens
     - the unsigned photo permission for Lucas. It is paperwork the studio is
       waiting on and the only place the children screens show it
     - "with us since Aug 2024". One clause on a line that was already there,
       and the parent's own check that the record is theirs

   The desk number is the one Console → Settings gives families. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;
  var money = Grove.money;

  /* The signed-in parent is the Johnson household. Their children are whoever
     STUDENTS holds against that family — the page never names them itself. */
  var FAMILY_ID = 'johnson';

  /* The studio's number, as Console → Settings gives it to families. */
  var DESK = D.STUDIO.phone;

  /* A weekly place is said as a recurring day — "Mondays at 3:15pm" — rather
     than the class record's "Mon". A camp runs the whole week, so its day is
     said as one. Dates are left exactly as they are written elsewhere, so a
     missed class reads here the way it reads on Schedule. */
  var DAYS = {
    Mon: 'Mondays', Tue: 'Tuesdays', Wed: 'Wednesdays', Thu: 'Thursdays',
    Fri: 'Fridays', Sat: 'Saturdays', Sun: 'Sundays', 'Mon–Fri': 'Every weekday'
  };

  /* A safety flag of kind "warn" has no pill of its own; amber is the nearest. */
  var FLAG = { bad: 'bad', warn: 'amber', ok: 'ok' };

  function household() {
    return D.family(FAMILY_ID) || D.FAMILIES[0];
  }
  function mine() {
    var name = household().name;
    return D.STUDENTS.filter(function (s) { return s.family === name; });
  }
  function kid(ctx) {
    var s = D.student(ctx.params.id);
    return s && s.family === household().name ? s : mine()[0];
  }
  function first(s) {
    return String(s.name).split(' ')[0];
  }
  function andList(names) {
    if (names.length < 2) return names.join('');
    return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
  }

  /* ---- the pack of sessions ---------------------------------------------------
     A pack belongs to one child, not to the family. It is bought, spent class
     by class, and on the last session it renews: it charges again and grants
     another pack the same size. Nothing here is a date. The size, the sessions
     used and the number of classes until the next charge all come from
     D.pack(), and the price comes from the studio's own pack prices, read by
     size — so a screen can never quote a rate the studio does not hold. */

  function packPrice(size) {
    return ((D.PRICING.as || {}).plans || {})['p' + size];
  }
  /* "the 8th class" — the class the charge lands on. */
  function ordinal(n) {
    var tail = n % 100;
    if (tail >= 11 && tail <= 13) return n + 'th';
    var last = n % 10;
    return n + (last === 1 ? 'st' : (last === 2 ? 'nd' : (last === 3 ? 'rd' : 'th')));
  }

  function packRows(s) {
    var p = D.pack(s);
    if (!p.isPack) {
      return [{
        title: 'No pack of sessions',
        sub: esc(first(s) + ' comes to camp and to classes you book one at a time, so there is ' +
          'nothing here that renews.')
      }];
    }
    var price = packPrice(p.size);
    return [
      {
        title: esc(p.left
          ? p.left + (p.left === 1 ? ' class' : ' classes') + ' left of ' + p.size
          : 'The pack renews with the next class'),
        sub: esc(p.used + ' of ' + p.size + ' used. It renews on the ' + ordinal(p.size) +
          ' class — another pack of ' + p.size + (price ? ', ' + money(price, { cents: false }) : '') + '.')
      },
      {
        title: 'Yours until you use them',
        sub: esc('The pack is paid for, so the sessions stay with ' + first(s) +
          ' however long they take. There is no date on them.')
      }
    ];
  }

  /* A missed class is not a thing to chase. Either the session stayed in the
     pack or it was spent, and the row says which. */
  function absences(s) {
    return D.absencesFor(s.name);
  }
  function absenceRow(s, a) {
    var bits = String(a.date).split(' · ');
    return {
      title: esc(first(s) + ' missed ' + bits[0]),
      sub: esc((bits[1] ? 'The ' + bits[1] + ' class. ' : '') + a.reason + ' — ' +
        (a.spent
          ? 'that was inside 24 hours, so the session was spent.'
          : 'the session stayed in the pack.'))
    };
  }

  /* A class booked on top of a weekly place, to catch up or just for the love
     of it. It spends a session like any other class. */
  function extras(s) {
    return D.EXTRA_CLASSES.filter(function (x) { return x.child === s.name; });
  }
  function extraRow(x) {
    var bits = String(x.when).split(' · ');
    return {
      title: esc('Extra class on ' + bits[0]),
      sub: esc((bits[1] ? bits[1] + ', in ' : 'In ') + x.room +
        (x.staff && x.staff !== 'Unassigned' ? ' with ' + x.staff : '') +
        '. It spends a session from the pack, like any other class.'),
      end: ui.btn({ label: 'Change', kind: 'quiet', size: 'sm', to: 'fMessages' })
    };
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

  /* Where a child actually is. The places come from the classes they are
     enrolled in — D.classesOf(s) — so the day, the room and the teacher on
     this page are the ones the class itself carries, and a child who holds
     more than one place gets a line for each. A child with no place at all is
     either on a list or waiting to choose a day, and both are said plainly. */
  function places(s) {
    return D.classesOf(s);
  }
  function waiting(s) {
    return D.WAITLIST.filter(function (w) { return w.child === s.name; });
  }

  /* "3:15–4:15pm" → "3:15pm". Only the end of a range carries the meridiem. */
  function startTime(range) {
    var parts = String(range).split('–');
    var mark = /(am|pm)/i.exec(parts[0]) || /(am|pm)/i.exec(parts[1] || '');
    return parts[0].replace(/(am|pm)/i, '') + (mark ? mark[1].toLowerCase() : '');
  }

  /* An After-School record is named by its length, which the time already
     says, so only the other programmes are worth naming to a parent. A class
     nobody is teaching yet says the room and stops. */
  function whenWords(c) {
    return (DAYS[c.day] || c.day) + ' at ' + startTime(c.time);
  }
  function whereWords(c) {
    var who = c.staff && c.staff !== 'Unassigned' ? c.staff : '';
    var line = (c.prog === 'as' ? 'In ' : c.name + ', in ') + c.room;
    return who ? line + ' with ' + who : line;
  }

  function placeRows(s) {
    var held = places(s);
    if (held.length) {
      return held.map(function (c) {
        return { title: esc(whenWords(c)), sub: esc(whereWords(c)) };
      });
    }
    var list = waiting(s);
    if (list.length) {
      return [{
        title: 'Waiting for a place',
        sub: esc('Number ' + list[0].pos + ' on the list for ' + list[0].cls.split(' · ')[0] +
          ' — we ring you the moment one comes free.')
      }];
    }
    return [{
      title: 'Not in a class yet',
      sub: 'Tell us the day you would like and we will find them a place.'
    }];
  }

  /* "8–11" → "8 to 11", "12+" → "12 and over". */
  function bandWords(band) {
    var b = String(band);
    if (b.indexOf('–') !== -1) return b.split('–').join(' to ');
    if (b.charAt(b.length - 1) === '+') return b.slice(0, -1) + ' and over';
    return b;
  }

  /* ---- the one thing that can need the parent ---------------------------------
     A pack renewing is not a job for anybody — it happens on the class it
     happens on — and a missed class is settled the moment it is missed. What
     is left is paperwork nobody has signed, so there is one of these or none,
     and the card foot and the pinned bar both read from it. */

  function todo(s) {
    var doc = consentDoc(s);
    if (!doc || doc.signed) return null;
    return {
      label: 'Read and sign the photo permission for ' + first(s),
      short: 'Read and sign',
      line: 'Photo permission still to sign',
      hint: 'One page, and a tick — nothing changes until you sign it',
      to: 'fDocument',
      id: doc.id
    };
  }

  /* ---- the children ---------------------------------------------------------- */

  function childCard(s) {
    var t = todo(s);

    /* Where they are on a Monday, then how many classes are left in the pack,
       then the thing a teacher must not get wrong. */
    var rows = placeRows(s).concat([packRows(s)[0]]).concat([
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
    ]);

    var foot = t
      ? h`<span class="strong">${t.line}</span>` +
        ui.btn({ label: t.short, kind: 'primary', size: 'sm', to: t.to, id: t.id })
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
      var kids = mine();
      var names = kids.map(first);
      if (!names.length) return 'Nobody is on your family yet. Add a child and they will appear here.';
      var packs = kids.filter(function (s) { return D.pack(s).isPack; });
      return andList(names) + (names.length === 1 ? ' is' : ' are') + ' with us. Open a child to ' +
        'see when they are in, how many classes are left in their pack, and what a teacher must ' +
        'know about them.' +
        (packs.length > 1 ? ' Each pack belongs to one child and renews on its own.' : '');
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
        <span class="strong">${f.phone}</span>${kids.length > 1 ? ', whichever child is in' : ''}.</p>
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
     this page that can hurt somebody. Under it, when they are in, what is left
     in their pack, and how to have any of it changed by a person. */

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
      var doc = consentDoc(s);
      var held = places(s);
      var t = todo(s);

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

      var rows = placeRows(s).concat([
        {
          title: esc(first(s) + ' is ' + s.age),
          sub: esc('In the group for ages ' + bandWords(s.band) + ', with us since ' + f.since)
        }
      ]);
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
        note: held.length > 1
          ? 'These are their ' + held.length + ' weekly places. If a day stops working for you, ' +
            'tell us and we will see what is possible.'
          : (held.length
              ? 'This is their weekly place. If the day stops working for you, tell us and we ' +
                'will see what is possible.'
              : 'No class is booked yet. Tell us the day you would like and we will see what ' +
                'is possible.')
      }, ui.rows(rows));

      /* The pack, then every class that has been counted against it: a missed
         class says whether the session stayed, an extra class says that it
         spends one. No dates, because there are none to give. */
      var sessions = ui.card({
        title: first(s) + '’s pack',
        flush: true,
        head: ui.btn({ label: 'Book an extra class', kind: 'quiet', size: 'sm', to: 'fSchedule' }),
        note: 'Tell us more than 24 hours before a class and the session stays in the pack — the ' +
              'pack simply lasts a week longer. Inside 24 hours it is spent, exactly as if they ' +
              'had come.'
      }, ui.rows(packRows(s)
        .concat(absences(s).map(function (a) { return absenceRow(s, a); }))
        .concat(extras(s).map(extraRow))));

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
      var bar = t
        ? ui.formActions([
            { label: t.label, kind: 'primary', to: t.to, id: t.id }
          ], { sticky: true, hint: t.hint })
        : '';

      return h`
        ${raw(care)}
        <div class="section">${raw(ui.grid(2, [atStudio, ui.col([sessions, help])]))}</div>
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
          title: 'No class is booked, and nothing is charged',
          sub: 'A charge only happens when you buy them a pack of sessions. When you know the ' +
               'day you would like, this is where you choose it.',
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
            ? 'Nothing is charged by saving — you choose their day next'
            : 'Tell us about allergies above before you save'
        }))}
      `;
    }
  });
})();
