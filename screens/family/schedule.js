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
       never filtered anything) are cut. Every row names its child
     - the month grid is NOT rendered. It needs a 7-column cell grid, four
       pip colours and a legend, none of which exist in app.css. Its dated
       content is the "After this week" card instead
     - the two "Studio closed" rows are dropped: the only closure on the books
       is announcement an4, which is still Scheduled and therefore not yet
       visible to families. The closed-day rule is stated once, in the
       make-up card

   Read off the roll, not out of the words on a timetable line:
     - the week is every class each child of the family is on the roll for
       (D.classesOf), sorted by day and then start time. It used to name one
       after-school class and one camp week by id and read the second child's
       day out of his `cls` string, which meant a child moved between classes
       kept showing the old one. A child put into a third class now simply
       shows a third row
     - the birthday party row is gone. It named class c12 outright and no
       child of this family is on that roll — it is another family's party
     - a make-up looks for the class it was earned in among that child's own
       classes, so the room and the teacher shown on the booking screen are
       the ones she actually misses
     - every figure is counted off the rows on screen: the week count, the
       "1 available · 1 booked" tally, the expiry dates
     - two rows linked to screens that do not exist (fEvent, fNews) and only
       ever raised "No screen yet". The announcement now reads as a plain row,
       the way the studio's news reads on Home

   Fixed after the visual review:
     - the first session read "Emma Johnson · 1 hour · After-School". The
       After-School class records are named by their length, which is a
       duration and not a class name, so the class-name slot carries the
       programme name and the length stays on the time line underneath
     - the "classes to make up" heading counted itself twice ("1 One class to
       make up") because plural() already writes the number
     - Book a make-up offered "Fri 31 Jul · 11:00am · Studio 1" although camp
       week 4 holds Studio 1 from 10:00 to 1:00 every day that week, and it
       offered Emma the 10:00 hour her own other credit is already booked
       into. An hour already holding one of the family's credits now says so
       rather than looking free */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  var FAMILY = 'johnson';

  /* The two extra hours the studio opened this Friday (announcement an2).
     Both the schedule and the booking screen read this one list, so the hours
     and the places left cannot disagree between them. */
  var HOURS = [
    { id: 'slot-10', at: '10:00am', label: '10:00 – 11:00am', places: '3 places left' },
    { id: 'slot-11', at: '11:00am', label: '11:00am – 12:00pm', places: '2 places left' }
  ];

  var DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  function ann(id) {
    return D.ANNOUNCEMENTS.filter(function (a) { return a.id === id; })[0];
  }
  function kids() {
    var name = D.family(FAMILY).name;
    return D.STUDENTS.filter(function (s) { return s.family === name; });
  }
  function childNamed(name) {
    return kids().filter(function (s) { return s.name === name; })[0] || null;
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
  /* With nothing to make up there is no date to name, and a rule that reads
     "Use it before —" is worse than the rule stated plainly. */
  function useBy(list) {
    var when = expiry(list);
    return when === '—' ? 'Use one before the term ends' : 'Use it before ' + when;
  }

  /* The Friday the extra hours sit on. The family's booked credit names the
     date, so the schedule and the booking screen cannot drift apart. */
  function friday() {
    var b = credits().filter(function (m) { return m.booked && m.booked.indexOf('Fri') === 0; })[0];
    return b ? b.booked.split(' · ')[0] : 'Fri 31 Jul';
  }
  function dayOff(when) {
    return String(when).replace(/^[A-Za-z]+ /, '');
  }

  /* An announcement carries its own date in its headline. "Autumn enrollment
     opens 10 August" gives the lead "10 Aug" and the title "Autumn enrollment
     opens" — neither is typed here. */
  var MONTH = /\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\b/;
  function dateIn(text) {
    var m = MONTH.exec(String(text));
    return m ? m[1] + ' ' + m[2].slice(0, 3) : '';
  }
  function headline(text) {
    return String(text).replace(MONTH, '').replace(/\s{2,}/g, ' ').replace(/\s+$/, '');
  }

  /* The class a credit was earned in. The credit names the day and the start
     time ("Mon 13 Jul · 3:15pm"); the child's own roll says which of her
     classes that is, so no class she is not on can ever match. */
  function missedClass(m) {
    var child = childNamed(m.child);
    if (!child) return null;
    var bits = String(m.missed).split(' · ');
    var day = bits[0].split(' ')[0];
    var start = (bits[1] || '').replace(/(am|pm)/i, '');
    if (!start) return null;
    return D.classesOf(child).filter(function (c) {
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

  /* The same reading, as minutes past midnight, so the week can be put in the
     order it happens rather than the order the records were written. */
  function startMinutes(range) {
    var parts = String(range).split('–');
    var mark = /(am|pm)/i.exec(parts[0]) || /(am|pm)/i.exec(parts[1] || '');
    var hm = parts[0].replace(/(am|pm)/i, '').split(':');
    var hr = (parseInt(hm[0], 10) || 0) % 12;
    if (mark && /pm/i.test(mark[1])) hr += 12;
    return hr * 60 + (parseInt(hm[1], 10) || 0);
  }
  function dayIndex(day) {
    var i = DAY_ORDER.indexOf(String(day).split('–')[0]);
    return i === -1 ? DAY_ORDER.length : i;
  }

  /* The family's week: every class each child is on the roll for. The roll is
     the join, so a child in three classes shows three rows and a child in
     none shows none. */
  function sessions() {
    var list = [];
    kids().forEach(function (s) {
      D.classesOf(s).forEach(function (c) {
        list.push({
          child: s.name,
          day: c.day,
          time: c.time,
          prog: c.prog,
          title: s.name + ' · ' + className(c),
          sub: c.day + ' · ' + c.time + ' · ' + c.room + ' · ' + c.staff
        });
      });
    });
    return list.sort(function (a, b) {
      return dayIndex(a.day) - dayIndex(b.day) || startMinutes(a.time) - startMinutes(b.time);
    });
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

    var week = ui.card({ title: 'Your week', flush: true }, list.length
      ? ui.rows(list.map(function (s) {
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
                  msg: 'Absence reported · ' + s.child + ' · a make-up class is on the way'
                })
          };
        }))
      : ui.empty('No classes booked', 'Nobody in the family is on a class roll at the moment. Book a place and it will show here.'));

    var open = byStatus(credits(), 'Available');
    var autumn = ann('an1');
    var soon = [];

    if (open.length) {
      soon.push({
        lead: esc(dayOff(friday())),
        title: 'Extra make-up hours',
        sub: esc(HOURS.map(function (s) { return s.at; }).join(' and ') + ' · ' +
                 plural(open.length, 'class still to make up', 'classes still to make up')),
        to: 'fBookMakeup'
      });
    }
    soon.push({
      lead: esc(dateIn(autumn.head)),
      title: esc(headline(autumn.head)),
      sub: esc(autumn.body)
    });

    var later = ui.card({ title: 'After this week', flush: true }, ui.rows(soon));

    var different = ui.notice({
      title: 'Need a different day?',
      text: 'Your day and time are your place for the term. If a different day would work better, call or message the studio and we will see what is possible.'
    });

    return h`
      ${raw(ui.toolbar({
        tabs: scheduleTabs(),
        count: list.length
          ? plural(weekly, 'weekly class', 'weekly classes') +
            (camps ? ' · ' + plural(camps, 'camp week', 'camp weeks') : '')
          : ''
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
  function atMissed(m) {
    return String(m.missed).split(' · ')[1] || '';
  }
  function whyMissed(m) {
    var why = String(m.reason).split(',')[0].toLowerCase();
    return why.indexOf('requested') === 0 ? 'you asked to move it' : why;
  }

  function absenceTab() {
    var list = credits();
    var open = byStatus(list, 'Available');

    var lead = open.length
      ? ui.notice({
          kind: 'warn',
          title: plural(open.length, 'class to make up', 'classes to make up'),
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
        sub: esc('The ' + atMissed(m) + ' class — ' + whyMissed(m)),
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
        title: useBy(list),
        sub: 'Classes cannot be carried into the autumn term.'
      },
      {
        title: 'If the studio closes, we do it for you',
        sub: 'You do not have to ask, and it lands the same day.'
      }
    ]));

    return h`
      ${raw(ui.toolbar({ tabs: scheduleTabs(), count: tallies(list) }))}
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
    return byStatus(list, 'Available')[0] || list[0] || null;
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
      if (!c) {
        return h`${raw(ui.notice({
          kind: 'ok',
          title: 'Nothing to book',
          text: 'Every missed class has been made up. If one is coming up, tell us at least 24 hours ahead and we will add it.',
          action: { label: 'Back to your schedule', to: 'fSchedule' }
        }))}`;
      }

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
        ? h`<div class="card-split stack stack--sm">
            <p class="label">Which days could you manage?</p>
            <p class="hint">Tick as many as you like. We will write back with what we can find.</p>
            <div class="choices choices--3">${raw(WEEK.map(function (d) {
              return ui.choice({ id: d, act: 'pickDay', title: d, on: Grove.toggle('mkday-' + d, false) });
            }).join(''))}</div>
          </div>`
        : '';

      var choose = ui.card({
        title: 'Pick an hour',
        note: 'A place showing here is not held until we confirm it, so no room is ever overbooked.'
      }, ui.choices(null, options) + days);

      /* A few plain lines. The old card listed child, missed, room, teacher,
         reason, expiry, status and the family's other credit — eight rows of
         the studio's bookkeeping in front of a parent making one choice. The
         room and the teacher are the ones on the class she missed, read off
         her own roll. */
      var facts = [
        ['Who', esc(c.child)],
        ['Class missed', esc(whenMissed(c) + ' · ' + atMissed(c))]
      ];
      var room = where(c);
      if (room) facts.push(['Usually in', esc(room)]);
      facts.push(['Book before', esc(c.expires)]);

      var about = ui.card({ title: 'What this is for' }, ui.kv(facts));

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
        <div class="stack">
          <p class="hint">Ring the desk on ${D.STUDIO.phone} or send a message and we will
          book it for you. Nothing is charged for a make-up class.</p>
          <div class="btn-group">
            ${raw(ui.btn({ label: 'Message the studio', to: 'fMessages' }))}
          </div>
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
