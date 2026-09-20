/* Family → Schedule (Upcoming + Absences) and Book an extra class.

   The billing model changed and this screen carried most of the old one.
   A family buys a pack of sessions for one child; the child attends; when the
   last session in the pack is used the pack renews and charges again. There is
   no month, no billing cycle and no date the next charge lands on — the next
   charge is a number of classes away.

   Deleted outright, not renamed:
     - the make-up credit. A session cancelled in time is simply not spent, so
       there is no credit to issue, nothing to approve and no queue. The
       "Absences & make-ups" tab is now just "Absences", and each row says the
       one thing that matters: did that session come back to the pack or not
     - every expiry. Sessions are paid for, so they are the family's until
       used. The "Use it before 31 Aug" rule, the expiry column, the
       "cannot be carried into the autumn term" line and the `expires` field
       on the booking screen are all gone
     - the "credit" framing on the booking screen. Booking a catch-up is
       booking an extra class, and it spends a session from the pack like any
       other class. The day/time picker and the "a different day" escape are
       unchanged; what the card explains underneath them is not
     - the gate that only let you open the booking screen if you held a credit.
       A family can book an extra class whenever they have sessions

   Kept from the previous build, and why:
     - the screen key stays `fBookMakeup` because js/nav.js and the sibling
       family screens route to it. It is a route id, not a word a parent reads
     - "Absences" is a schedule event, so it stays the second tab rather than a
       second rail item
     - the week is read off the roll (D.classesOf), not out of a timetable
       string, so a child moved between classes shows the class she is in
     - the month grid is still not rendered: it needs a 7-column cell grid,
       four pip colours and a legend, none of which exist in app.css

   Every figure is counted off the rows on screen or read from js/data.js: the
   week count, the sessions used and left, the renewal price, the hours already
   holding one of the family's bookings. */
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
  function plural(n, one, many) {
    return n + ' ' + (n === 1 ? one : many);
  }
  function firstName(name) {
    return String(name).split(' ')[0];
  }
  function owns(name) {
    return firstName(name) + '’s';
  }
  function lower(text) {
    var s = String(text);
    return s.charAt(0).toLowerCase() + s.slice(1);
  }
  function ordinal(n) {
    var tens = n % 100, unit = n % 10;
    if (tens >= 11 && tens <= 13) return n + 'th';
    return n + (unit === 1 ? 'st' : unit === 2 ? 'nd' : unit === 3 ? 'rd' : 'th');
  }
  function money(n) {
    var v = Math.round(n * 100) / 100;
    return '$' + (v % 1 === 0 ? String(v) : v.toFixed(2));
  }

  /* ---- the family's sessions ------------------------------------------------
     A pack belongs to one child, so Emma's pack and Lucas's pack renew
     independently and are counted independently. */

  function packOf(student) {
    return D.pack(student);
  }
  function packPrice(size) {
    return D.PRICING.as.plans['p' + size];
  }
  function onPack() {
    return kids().filter(function (s) { return packOf(s).isPack; });
  }
  /* "5 of 8 used · renews on the 8th class and charges $540" — the size, the
     count and the price all come from the record, never from a sentence. */
  function packLine(student) {
    var p = packOf(student);
    var price = packPrice(p.size);
    return p.used + ' of ' + p.size + ' used · renews on the ' + ordinal(p.size) + ' class' +
      (price ? ' and charges ' + money(price) : '');
  }

  function absences() {
    var out = [];
    kids().forEach(function (s) {
      D.absencesFor(s.name).forEach(function (a) { out.push(a); });
    });
    return out;
  }
  function spentOnes(list) {
    return list.filter(function (a) { return a.spent; });
  }
  function keptOnes(list) {
    return list.filter(function (a) { return !a.spent; });
  }
  function extras() {
    var names = kids().map(function (s) { return s.name; });
    return D.EXTRA_CLASSES.filter(function (x) { return names.indexOf(x.child) !== -1; });
  }

  /* Counted from the rows on screen, so the count above the list cannot
     disagree with the list. */
  function tallies(list) {
    var parts = [];
    var kept = keptOnes(list).length;
    var used = spentOnes(list).length;
    if (kept) parts.push(plural(kept, 'session kept', 'sessions kept'));
    if (used) parts.push(plural(used, 'session spent', 'sessions spent'));
    return parts.join(' · ');
  }

  /* The Friday the studio opened those extra hours on. A catch-up class
     already booked that day names the date, so the schedule and the booking
     screen cannot drift apart; the fallback is this Friday, today being
     Tuesday 28 July. */
  function friday() {
    var x = extras()[0];
    return x ? String(x.when).split(' · ')[0] : 'Fri 31 Jul';
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

  /* The class an absence happened in. The absence names the day and the start
     time ("Mon 13 Jul · 3:15pm"); the child's own roll says which of her
     classes that is, so no class she is not on can ever match. */
  function whenMissed(a) {
    return String(a.date).split(' · ')[0];
  }
  function atMissed(a) {
    return String(a.date).split(' · ')[1] || '';
  }
  function missedClass(a) {
    var child = childNamed(a.child);
    if (!child) return null;
    var day = whenMissed(a).split(' ')[0];
    var start = atMissed(a).replace(/(am|pm)/i, '');
    if (!start) return null;
    return D.classesOf(child).filter(function (c) {
      return c.day === day && c.time.indexOf(start) === 0;
    })[0] || null;
  }
  function where(a) {
    var c = missedClass(a);
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
          onPack: packOf(s).isPack,
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
    sub: 'Your weekly place is held for you. Change one and we release it to the waitlist, so please only do that if you mean it.',
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
        { label: 'Absences', count: absences().length }
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
                  msg: s.onPack
                    ? 'Told the studio · the session stays in ' + owns(s.child) + ' pack'
                    : 'Told the studio · ' + firstName(s.child) + ' is off the list for that day'
                })
          };
        }))
      : ui.empty('No classes booked', 'Nobody in the family is on a class roll at the moment. Book a place and it will show here.'));

    var holders = onPack();
    var packs = holders.length
      ? ui.card({ title: 'Sessions left', flush: true, note: 'A pack renews when the last session in it is used. There is no date to watch — it is a number of classes away.' },
          ui.rows(holders.map(function (s) {
            var p = packOf(s);
            return {
              title: esc(s.name),
              sub: esc(packLine(s)),
              end: ui.pill(plural(p.left, 'class left', 'classes left'), p.left <= 1 ? 'amber' : 'ok')
            };
          })))
      : '';

    var autumn = ann('an1');
    var free = slots().filter(function (s) { return !s.taken; });
    var soon = [];

    extras().forEach(function (x) {
      soon.push({
        lead: esc(dayOff(String(x.when).split(' · ')[0])),
        title: esc(owns(x.child) + ' extra class'),
        sub: esc(x.when + ' · ' + x.room + ' · ' + x.staff +
                 ' · spends one session from the pack')
      });
    });
    if (free.length && holders.length) {
      soon.push({
        lead: esc(dayOff(friday())),
        title: free.length === 1 ? 'An extra hour this Friday' : 'Extra hours this Friday',
        sub: esc(free.map(function (s) { return s.at; }).join(' and ') +
                 ' · an extra class spends a session from the pack'),
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
      text: 'Your day and time are your place each week. If a different day would work better, call or message the studio and we will see what is possible.'
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
      ${raw(packs ? '<div class="section">' + packs + '</div>' : '')}
      <div class="section">${raw(later)}</div>
      <div class="section">${raw(different)}</div>
    `;
  }

  /* ---- absences --------------------------------------------------------------
     Written for a parent who is not confident with a screen. One fact per
     absence: the session came back to the pack, or it did not. That is the
     whole rule now, so the old five blocks — a stat strip, an absence form, a
     credits table, an approvals queue and a filtered history — are one list
     and one card of rule. "Can’t make it" lives on the session itself, which
     is where a parent looks for it. */

  function absenceTab() {
    var list = absences();
    var used = spentOnes(list);
    var kept = keptOnes(list);

    var lead;
    if (!list.length) {
      lead = ui.notice({
        kind: 'ok',
        title: 'No classes missed',
        text: 'If one is coming up, tell us at least 24 hours ahead and the session stays in the pack.'
      });
    } else if (used.length) {
      lead = ui.notice({
        kind: 'warn',
        title: plural(used.length, 'session spent', 'sessions spent'),
        text: firstName(used[0].child) + ' missed ' + whenMissed(used[0]) + ' inside the 24 hours, so that ' +
              'session counted as attended. Tell us a day ahead and the session stays in the pack instead.',
        action: { label: 'Book an extra class', kind: 'primary', to: 'fBookMakeup' }
      });
    } else {
      lead = ui.notice({
        kind: 'ok',
        title: 'Nothing lost',
        text: 'You told us in time every time, so ' + plural(kept.length, 'session', 'sessions') +
              ' stayed in the pack. To catch a class up, book an extra one and it spends a session like any other class.',
        action: { label: 'Book an extra class', kind: 'primary', to: 'fBookMakeup' }
      });
    }

    var rows = list.map(function (a) {
      var room = where(a);
      return {
        title: esc(firstName(a.child) + ' missed ' + whenMissed(a)),
        sub: esc('The ' + atMissed(a) + ' class' + (room ? ' in ' + room : '') + ' — ' + lower(a.reason)),
        end: ui.pill(a.spent ? 'Session spent' : 'Session kept', a.spent ? 'warn' : 'ok')
      };
    });

    var rule = ui.card({ title: 'How an absence works', flush: true }, ui.rows([
      {
        title: 'Tell us 24 hours ahead',
        sub: 'The session is not spent. It stays in the pack, and the pack simply lasts a week longer.'
      },
      {
        title: 'Inside 24 hours the session is spent',
        sub: 'It counts exactly as if they had come, because the place was held and the room was staffed.'
      },
      {
        title: 'Sessions never expire',
        sub: 'The pack is paid for, so it is yours until you have used it.'
      },
      {
        title: 'If the studio closes, nothing is spent',
        sub: 'You do not have to ask us, and you will see it here.'
      },
      {
        title: 'Catching the class up',
        sub: 'Book an extra class on top of the weekly place. It spends a session from the pack, like any other class.',
        to: 'fBookMakeup'
      }
    ]));

    return h`
      ${raw(ui.toolbar({ tabs: scheduleTabs(), count: tallies(list) }))}
      ${raw(lead)}
      <div class="section">${raw(ui.card({ title: 'Classes missed', flush: true },
        rows.length ? ui.rows(rows) : ui.empty('Nothing missed', 'Every class has been attended.')))}</div>
      <div class="section">${raw(rule)}</div>
    `;
  }

  /* ---- book an extra class ----------------------------------------------------
     One question: which hour? The hours the studio has opened come first, and
     "a different day" is the last option in the same list rather than a third
     radio dressed as a slot, so a parent who needs another day can see that
     asking is allowed. The button sits in a bar pinned to the bottom of the
     screen, because on the old layout it was below a three-step explainer and
     people missed it.

     The screen no longer asks whether the family holds a credit, because no
     credit exists. It asks which hour, and says what the hour costs: one
     session out of the pack. */

  Grove.on('pickSlot', function (d) { Grove.setFilter('makeupSlot', d.id); });
  Grove.on('pickDay', function (d) { Grove.flip('mkday-' + d.id, false); });

  var ASK = 'slot-ask';
  var WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  /* An hour already holding one of this family's extra classes says so rather
     than looking free. */
  function slots() {
    var booked = extras();
    return HOURS.map(function (s) {
      return {
        id: s.id,
        at: s.at,
        label: s.label,
        places: s.places,
        taken: booked.filter(function (x) { return String(x.when).indexOf(s.at) !== -1; })[0] || null
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
  function chosenDays() {
    return WEEK.filter(function (d) { return Grove.toggle('mkday-' + d, false); });
  }

  /* Who the class is for: the child with a class to catch up, otherwise the
     first child holding a pack. The other children are named in the help card
     rather than put behind a second question. */
  function catchUp() {
    return absences().filter(function (a) {
      var child = childNamed(a.child);
      return child && packOf(child).isPack;
    })[0] || null;
  }
  function subject() {
    var a = catchUp();
    return (a && childNamed(a.child)) || onPack()[0] || kids()[0] || null;
  }
  function others(child) {
    return kids().filter(function (s) {
      return s.name !== child.name && packOf(s).isPack;
    }).map(function (s) { return firstName(s.name); });
  }

  Grove.screen('fBookMakeup', {
    surface: 'family',
    crumbs: [{ label: 'Schedule', to: 'fSchedule' }],
    crumbTitle: 'Book an extra class',
    eyebrow: 'nothing changes until we confirm',
    title: 'Book an extra class',
    sub: function () {
      var child = subject();
      return child && packOf(child).isPack
        ? 'Choose an hour below. An extra class spends one session out of ' + owns(child.name) +
          ' pack, the same as any other class.'
        : 'Choose an hour below. We check the room by hand and write back, usually the same day.';
    },
    actions: [
      { label: 'Message the studio', to: 'fMessages' }
    ],

    body: function () {
      var child = subject();
      if (!child) {
        return h`${raw(ui.notice({
          kind: 'ok',
          title: 'Nothing to book yet',
          text: 'Nobody in the family is on a class roll. Message the studio and we will find a place first.',
          action: { label: 'Back to your schedule', to: 'fSchedule' }
        }))}`;
      }

      var p = packOf(child);
      var a = catchUp();
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
         the studio's bookkeeping in front of a parent making one choice. What
         is left is who it is for, what it costs and where the pack stands
         afterwards, all counted from the child's own record. */
      var facts = [['Who', esc(child.name)]];
      if (a) {
        facts.push(['Catching up', esc(whenMissed(a) + ' · ' + atMissed(a))]);
        var room = where(a);
        if (room) facts.push(['Usually in', esc(room)]);
      }
      if (p.isPack) {
        var price = packPrice(p.size);
        var after = p.used + 1;
        facts.push(['What it spends', 'One session out of the pack of ' + p.size]);
        facts.push(['Pack afterwards', after >= p.size
          ? esc('This is the ' + ordinal(p.size) + ' class, so the pack renews' +
                (price ? ' — ' + money(price) + ' for another ' + p.size : ''))
          : esc(after + ' of ' + p.size + ' used · ' +
                plural(p.size - after, 'class', 'classes') + ' before it renews')]);
      } else {
        facts.push(['What it costs', 'Booked as a one-off and invoiced afterwards']);
      }

      var about = ui.card({ title: 'What you are booking' }, ui.kv(facts));

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
      var siblings = others(child);
      var help = ui.card({ title: 'If you are not sure' }, h`
        <div class="stack">
          <p class="hint">Ring the desk on ${D.STUDIO.phone} or send a message and we will
          book it for you. ${p.isPack
            ? 'This is not a new charge — it uses a session you have already paid for, so the next renewal comes one class sooner.'
            : 'We will tell you what it costs before anything is booked.'}</p>
          ${raw(siblings.length
            ? '<p class="hint">Booking for ' + esc(siblings.join(' or ')) +
              ' instead? Send a message and we will set it up from their own pack.</p>'
            : '')}
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
