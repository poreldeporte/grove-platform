/* Family → Schedule (Upcoming + Absences & make-ups) and Book a make-up.

   Simplifications against the previous build:
     - "Absences & make-ups" was a second rail item. An absence is a schedule
       event, so it is now the second tab of Schedule. One rail item, one
       subject
     - the old attendance page opened with a 4-up stat strip, then an absence
       form, then a credits card, then a requests card, then a filtered
       history card — five blocks saying the same thing. It is one credits
       table, one card of where the family stands, one card of rule. "Can’t
       make it" now lives on the session itself, which is where a parent
       looks for it, so the separate absence form is gone
     - the decorative child pills on the old schedule (they set state but
       never filtered anything) are cut. The list is short and names the
       child on every row
     - the month grid is NOT rendered. It needs a 7-column cell grid, four
       pip colours and a legend, none of which exist in app.css. Its dated
       content — the make-up Friday, the party, autumn enrollment — is the
       "After this week" card, so the three Family → Home tiles that link
       here still land on a page that names them
     - the two "Studio closed" rows are dropped: the only closure in the
       dataset is announcement an4, which is still Scheduled and therefore not
       yet visible to families. The closed-day credit rule is stated once, in
       the make-up card

   Fixed after the visual review:
     - the first session read "Emma Johnson · 1 hour · After-School". The
       After-School class records are named by their length, which is a
       duration and not a class name, so the class-name slot now carries the
       programme name and the length stays on the time line underneath
     - "3 regular sessions" counted a Mon–Fri camp week as a weekly class. The
       count is derived from the rows and names both kinds, and the camp row
       asks the studio instead of offering one "Can’t make it" link to cover
       five days
     - "2 make-up credits" sat above one Available and one Booked row. Every
       figure on the tab is now tallied from the rows shown, so the toolbar
       reads "1 available · 1 booked"
     - Book a make-up offered "Fri 31 Jul · 11:00am · Studio 1" although camp
       week 4 holds Studio 1 from 10:00 to 1:00 every day that week, and it
       offered Emma the 10:00 hour her own other credit is already booked
       into. The room and the teacher are now read from the class the credit
       came from, and an hour already holding one of the family's credits
       says so rather than looking free */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  var FAMILY = 'johnson';

  /* MAKEUPS carries a fifth status kind, "info", which has no pill of its
     own. A booked credit is settled, so it reads as the plain pill. */
  var PILL = { ok: 'ok', warn: 'amber', bad: 'bad', info: null };

  /* The two extra hours the studio opened this Friday (announcement an2).
     The hours are the studio's; the places left are the only figures the
     dataset does not carry, because it has no slot table. Both the schedule
     and the booking screen read this one list so they cannot disagree. */
  var HOURS = [
    { id: 'slot-10', at: '10:00am', label: '10:00 – 11:00am', places: '3 places left' },
    { id: 'slot-11', at: '11:00am', label: '11:00am – 12:00pm', places: '2 places left' }
  ];

  function cls(id) {
    return D.CLASSES.filter(function (c) { return c.id === id; })[0];
  }
  function ann(id) {
    return D.ANNOUNCEMENTS.filter(function (a) { return a.id === id; })[0];
  }
  function kids() {
    var name = D.family(FAMILY).name;
    return D.STUDENTS.filter(function (s) { return s.family === name; });
  }
  function credits() {
    var names = kids().map(function (s) { return s.name; });
    return D.MAKEUPS.filter(function (m) { return names.indexOf(m.child) !== -1; });
  }
  function byStatus(list, status) {
    return list.filter(function (m) { return m.status === status; });
  }
  function plural(n, one, many) {
    return n + ' ' + (n === 1 ? one : many);
  }
  function firstName(name) {
    return String(name).split(' ')[0];
  }

  /* Counted from the rows on screen, never written down: "1 available ·
     1 booked" has to survive somebody editing js/data.js. */
  function tallies(list) {
    var order = [], n = {};
    list.forEach(function (m) {
      if (n[m.status] === undefined) { n[m.status] = 0; order.push(m.status); }
      n[m.status] += 1;
    });
    return order.map(function (s) { return n[s] + ' ' + s.toLowerCase(); }).join(' · ');
  }
  function expiry(list) {
    var seen = [];
    list.forEach(function (m) { if (seen.indexOf(m.expires) === -1) seen.push(m.expires); });
    return seen.join(' · ') || '—';
  }

  /* The Friday the extra hours sit on. The family's booked credit names the
     date, so the schedule and the booking screen cannot drift apart. */
  function friday() {
    var b = credits().filter(function (m) { return m.booked && m.booked.indexOf('Fri') === 0; })[0];
    return b ? b.booked.split(' · ')[0] : 'Fri 31 Jul';
  }

  /* The class a credit was earned in. The credit carries the day and the
     start time ("Mon 13 Jul · 3:15pm"), which is enough to find it, and with
     it the room and the teacher the make-up hour belongs to. */
  function missedClass(m) {
    var bits = String(m.missed).split(' · ');
    var day = bits[0].split(' ')[0];
    var start = (bits[1] || '').replace(/(am|pm)/i, '');
    if (!start) return null;
    return D.CLASSES.filter(function (c) {
      return c.day === day && c.time.indexOf(start) === 0;
    })[0] || null;
  }
  function where(m) {
    var c = missedClass(m);
    return c ? c.room + ' · ' + c.staff : '';
  }

  /* An After-School record is named by its length ("1 hour · After-School").
     That is a duration, not a class name, and the length is already legible
     in the time, so a row title carries the programme name instead. */
  function className(c) {
    return c.prog === 'as' ? D.program(c.prog).name : c.name;
  }
  function spansWeek(day) {
    return String(day).indexOf('–') !== -1;
  }

  /* "3:15–4:15pm" → "3:15 pm", "10:00am–1:00pm" → "10:00 am", "4:30pm" →
     "4:30 pm". Only the end of a range carries the meridiem in this dataset. */
  function chipTime(range) {
    var parts = String(range).split('–');
    var mark = /(am|pm)/i.exec(parts[0]) || /(am|pm)/i.exec(parts[1] || '');
    return parts[0].replace(/(am|pm)/i, '') + ' ' + (mark ? mark[1] : '');
  }

  /* The family's regular week. Emma's after-school place and her camp week
     are read from their class records; Lucas's Wednesday hour is read from
     his own student record, which carries his day, time and room. */
  function sessions() {
    var emma = D.student('emma');
    var lucas = D.student('lucas');
    var after = cls('c2');
    var camp = cls('c6');
    var his = lucas.cls.split(' · ')[0].split(' ');

    return [
      {
        child: emma.name,
        day: after.day,
        time: after.time,
        prog: after.prog,
        title: emma.name + ' · ' + className(after),
        sub: after.day + ' · ' + after.time + ' · ' + after.room + ' · ' + after.staff
      },
      {
        child: lucas.name,
        day: his[0],
        time: his[1],
        prog: 'as',
        title: lucas.name + ' · ' + D.program('as').name,
        sub: lucas.cls
      },
      {
        child: emma.name,
        day: camp.day,
        time: camp.time,
        prog: camp.prog,
        title: emma.name + ' · ' + className(camp),
        sub: camp.day + ' · ' + camp.time + ' · ' + camp.room + ' · ' + camp.staff
      }
    ];
  }

  /* ---- schedule ------------------------------------------------------------ */

  Grove.screen('fSchedule', {
    surface: 'family',
    crumbTitle: 'Schedule',
    eyebrow: 'your week',
    title: 'Schedule',
    sub: 'Your weekly places are fixed for the term. Change one and we release it to the waitlist, so please only do that if you mean it.',
    actions: [
      { label: 'Message the studio', to: 'fMessages' }
    ],

    body: function () {
      return Grove.tab('fSchedule', 'Upcoming') === 'Upcoming' ? upcomingTab() : absenceTab();
    }
  });

  function scheduleTabs() {
    return {
      key: 'fSchedule',
      items: [
        { label: 'Upcoming' },
        { label: 'Absences & make-ups', count: credits().length }
      ]
    };
  }

  function upcomingTab() {
    var list = sessions();
    var camps = list.filter(function (s) { return spansWeek(s.day); }).length;
    var weekly = list.length - camps;

    var week = ui.card({ title: 'Your week', flush: true }, ui.rows(list.map(function (s) {
      var whole = spansWeek(s.day);
      return {
        lead: ui.timechip(chipTime(s.time)),
        title: ui.dot(D.program(s.prog).color) + ' ' + esc(s.title),
        sub: esc(s.sub),
        /* A camp week is five days. One "Can’t make it" link cannot mean
           five of them, so that row asks the studio instead. */
        end: whole
          ? ui.btn({ label: 'Missing a day?', kind: 'quiet', size: 'sm', to: 'fMessages' })
          : ui.btn({
              label: 'Can’t make it',
              kind: 'quiet',
              size: 'sm',
              msg: 'Absence reported · ' + s.child + ' · a make-up credit is on the way'
            })
      };
    })));

    var open = byStatus(credits(), 'Available');
    var party = cls('c12');
    var autumn = ann('an1');

    var later = ui.card({ title: 'After this week', flush: true }, ui.rows([
      {
        lead: esc(friday().replace(/^[A-Za-z]+ /, '')),
        title: 'Extra make-up hours',
        sub: esc(HOURS.map(function (s) { return s.at; }).join(' and ') + ' · ' +
                 plural(open.length, 'credit still to book', 'credits still to book')),
        to: 'fBookMakeup'
      },
      {
        lead: '1 Aug',
        title: esc(party.name),
        sub: esc(party.time + ' · ' + party.room),
        to: 'fEvent'
      },
      {
        lead: '10 Aug',
        title: 'Autumn enrollment opens',
        sub: esc(autumn.body),
        to: 'fNews',
        id: autumn.id
      }
    ]));

    var different = ui.notice({
      title: 'Need a different day?',
      text: 'Your day and time are your place for the term. If a different day would work better, call or message the studio and we will see what is possible.'
    });

    return h`
      ${raw(ui.toolbar({
        tabs: scheduleTabs(),
        count: plural(weekly, 'weekly class', 'weekly classes') +
               (camps ? ' · ' + plural(camps, 'camp week', 'camp weeks') : '')
      }))}
      ${raw(week)}
      <div class="section">${raw(later)}</div>
      <div class="section">${raw(different)}</div>
    `;
  }

  /* ---- classes to make up ---------------------------------------------------
     Written for a parent who is not confident with a screen. Every missed
     class states, in a sentence, what happened and what to do about it, with
     the button on the same line. The old version was an admin table — Missed
     / Reason / Expires / Status — above a six-figure tally, with the only
     action hidden in the header of an explainer card halfway down the page.

     "Credit" is gone from the parent's side of the product. It is the
     studio's word for the entitlement; a parent has "a class to make up". */

  function whenMissed(m) {
    return String(m.missed).split(' · ')[0];
  }
  function whyMissed(m) {
    var why = String(m.reason).split(',')[0].toLowerCase();
    return why.indexOf('requested') === 0 ? 'you asked to move it' : why;
  }

  function absenceTab() {
    var list = credits();
    var open = byStatus(list, 'Available');
    var booked = byStatus(list, 'Booked');

    var lead = open.length
      ? ui.notice({
          kind: 'warn',
          title: plural(open.length, 'One class to make up', open.length + ' classes to make up'),
          text: firstName(open[0].child) + ' can take an extra class to make up for the one missed on ' +
                whenMissed(open[0]) + '. Please book it before ' + expiry(open) + '.',
          action: { label: 'Book a make-up class', kind: 'primary', to: 'fBookMakeup' }
        })
      : ui.notice({
          kind: 'ok',
          title: 'Nothing to book',
          text: 'Every missed class has been made up. If one is coming up, tell us at least 24 hours ahead.'
        });

    var rows = list.map(function (m) {
      var isOpen = m.status === 'Available';
      return {
        title: esc(firstName(m.child) + ' missed ' + whenMissed(m)),
        sub: esc('Her ' + String(m.missed).split(' · ')[1] + ' class — ' + whyMissed(m)),
        end: isOpen
          ? ui.btn({ label: 'Book a make-up', kind: 'primary', size: 'sm', to: 'fBookMakeup' })
          : h`<span class="strong">${'Booked for ' + m.booked}</span>` +
            ui.btn({ label: 'Change', kind: 'quiet', size: 'sm', to: 'fMessages' })
      };
    });

    var rule = ui.card({ title: 'How a make-up class works', flush: true }, ui.rows([
      {
        title: 'Tell us 24 hours ahead',
        sub: 'Then the missed class comes back to you and you can book another hour instead.'
      },
      {
        title: 'Use it before ' + expiry(list),
        sub: 'Classes cannot be carried into the autumn term.'
      },
      {
        title: 'If the studio closes, we do it for you',
        sub: 'You do not have to ask, and it lands the same day.'
      }
    ]));

    return h`
      ${raw(ui.toolbar({ tabs: scheduleTabs() }))}
      ${raw(lead)}
      <div class="section">${raw(ui.card({ title: 'Classes missed this term', flush: true },
        rows.length ? ui.rows(rows) : ui.empty('Nothing missed', 'There is nothing to make up.')))}</div>
      <div class="section">${raw(rule)}</div>
    `;
  }

  /* ---- book a make-up --------------------------------------------------------
     One question: which hour? The hours the studio has opened come first, and
     "a different day" is the last option in the same list rather than a third
     radio dressed as a slot, so a parent who needs another day can see that
     asking is allowed. The button sits in a bar pinned to the bottom of the
     screen, because on the old layout it was below a three-step explainer and
     people missed it. */

  Grove.on('pickSlot', function (d) { Grove.setFilter('makeupSlot', d.id); });
  Grove.on('pickDay', function (d) { Grove.flip('mkday-' + d.id, false); });

  var ASK = 'slot-ask';
  var WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  function slots() {
    var taken = credits().filter(function (m) { return m.status === 'Booked' && m.booked; });
    return HOURS.map(function (s) {
      return {
        id: s.id,
        label: s.label,
        places: s.places,
        taken: taken.filter(function (m) { return m.booked.indexOf(s.at) !== -1; })[0] || null
      };
    });
  }
  function firstOpen() {
    var free = slots().filter(function (s) { return !s.taken; })[0];
    return free ? free.id : ASK;
  }
  function chosenSlot() {
    return Grove.filter('makeupSlot', firstOpen());
  }
  function credit() {
    var list = credits();
    return byStatus(list, 'Available')[0] || list[0];
  }
  function chosenDays() {
    return WEEK.filter(function (d) { return Grove.toggle('mkday-' + d, false); });
  }

  Grove.screen('fBookMakeup', {
    surface: 'family',
    crumbs: [{ label: 'Schedule', to: 'fSchedule' }],
    crumbTitle: 'Book a make-up',
    eyebrow: 'nothing changes until we confirm',
    title: 'Book a make-up class',
    sub: 'Choose an hour below. We check the room by hand and write back, usually the same day.',
    actions: [
      { label: 'Message the studio', to: 'fMessages' }
    ],

    body: function () {
      var c = credit();
      var picked = chosenSlot();
      var day = friday();
      var asking = picked === ASK;

      var options = slots().map(function (s) {
        return ui.choice({
          id: s.id,
          size: 'lg',
          act: 'pickSlot',
          title: day + ', ' + s.label,
          sub: s.taken
            ? firstName(s.taken.child) + ' is already booked into this hour'
            : s.places,
          on: s.id === picked
        });
      });
      options.push(ui.choice({
        id: ASK,
        size: 'lg',
        act: 'pickSlot',
        title: 'A different day would suit us better',
        sub: 'Tell us which days work and we will look for an hour',
        on: asking
      }));

      /* Only asked once "a different day" is chosen, so the screen never puts
         two questions in front of someone at the same time. */
      var days = asking
        ? h`<div class="card-split">
            <p class="label">Which days could you manage?</p>
            <p class="hint">Tick as many as you like. We will write back with what we can find.</p>
            <div class="choices choices--3" style="margin-top:var(--s-3)">${raw(WEEK.map(function (d) {
              return ui.choice({ id: d, act: 'pickDay', title: d, on: Grove.toggle('mkday-' + d, false) });
            }).join(''))}</div>
          </div>`
        : '';

      var choose = ui.card({
        title: 'Pick an hour',
        note: 'A place showing here is not held until we confirm it, so no room is ever overbooked.'
      }, ui.choices(null, options) + days);

      /* Three plain lines. The old card listed child, missed, room, teacher,
         reason, expiry, status and the family's other credit — eight rows of
         the studio's bookkeeping in front of a parent making one choice. */
      var about = ui.card({ title: 'What this is for' }, ui.kv([
        ['Who', esc(c.child)],
        ['Class missed', esc(whenMissed(c) + ' · ' + String(c.missed).split(' · ')[1])],
        ['Book before', esc(c.expires)]
      ]));

      var label = asking ? 'Ask for another day' : 'Request this hour';
      var hint = asking
        ? (chosenDays().length
            ? 'You have picked ' + chosenDays().join(', ')
            : 'Tick at least one day above')
        : 'Nothing on your schedule changes until the studio confirms';
      var sent = asking
        ? 'Sent — we will look for another day and write back'
        : 'Sent — the studio will confirm, usually the same day';

      /* A short reassurance beside the choice, rather than a column of white.
         Someone unsure whether they are allowed to ask should be able to see
         that they are, without leaving the page. */
      var help = ui.card({ title: 'If you are not sure' }, h`
        <p class="hint">Ring the desk on ${D.STUDIO.phone} or send a message and we will
        book it for you. Nothing is charged for a make-up class.</p>
        <div class="btn-group" style="margin-top:var(--s-4)">
          ${raw(ui.btn({ label: 'Message the studio', to: 'fMessages' }))}
        </div>
      `);

      return h`
        ${raw(ui.grid('sidebar', [choose, ui.col([about, help])]))}
        ${raw(ui.formActions([
          { label: label, kind: 'primary', msg: sent },
          { label: 'Cancel', to: 'fSchedule' }
        ], { sticky: true, hint: hint }))}
      `;
    }
  });
})();
