/* Family → Schedule (Upcoming + Make-ups) and Book a make-up.

   THE OWNER'S POINT OF THE PORTAL. She said the whole reason for it is seeing
   the dates each child is assigned and tracking any change to them. So this
   screen is the diary: the dated classes from D.SESSIONS, every one of them,
   with what happened to it — attended, booked, missed with a make-up earned,
   missed inside the notice period and used.

   THE PRICING MODEL, AS IT IS NOW SETTLED. A plan is HOURS A MONTH and only
   After-School has one. The parent chose the day and the time at registration
   and it is fixed for the program year, so a cycle is a set of dates and the
   month's hours are spent by those dated classes. The invoice is raised on the
   last class of the cycle and covers the next one, and it names the dates it
   covers because that is how the owner keeps control. Hours not booked are
   lost. The plan runs to the end of the school year and ends by itself.

   What that cost this file — deleted, not renamed:

     - the pack. No "pack of 8", no "sessions used", no "renews on the 8th
       class", no "sessions never expire". The unit is an hour and the cycle is
       a set of dates, both read from D.plan and D.SESSIONS
     - "Absences" as a tab of its own. A missed class is only interesting
       because of what it earns, so the tab is "Make-ups" and each row says
       which of the two things happened
     - the invented list of Friday hours with invented places left. The hours a
       make-up can go into are now counted off D.CLASSES: an age-appropriate
       After-School class with a free place, exactly as the signed policy says.
       Where the studio has announced extra make-up hours, the announcement
       appears in its own words rather than being parsed into slots the dataset
       does not hold
     - the day-of-the-week picker on the booking screen. It was a second
       question behind the first one; "none of these suit us" now sends the
       request and the desk answers it, which is what happened anyway

   The consequence of cancelling is on the row BEFORE the parent presses
   anything: a class more than 24 hours away says the day and time to cancel by
   and that a make-up follows, a class inside the notice period says the class
   is used, and a make-up already booked says it cannot be booked twice. Each
   sentence is worked out from that class's own date and time against
   Grove.data.today, and both the wording AND the length of the notice come
   from D.RULES — "24 hours" is read as a length, so the deadline under a row
   and the sentence above the list cannot disagree if the studio ever changes
   it. No screen invents a version of something a family has signed, and the
   make-up window is a studio setting rendered as it is set, never hard-coded.

   With no clock in the dataset, "now" is the start of today. A class this
   afternoon is inside the notice period and a class tomorrow afternoon is not,
   which is the reading that errs in the family's favour.

   Deliberately NOT built here: extra classes because a school finishes later,
   a private class, an event. Those are one manual charge the studio raises on
   the card on file — a Console action, not a control on a parent's schedule.

   Home gives one line per child about the cycle; this screen gives the dates
   behind it. That is the division: one for the glance, one for the diary. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;
  var money = Grove.money;

  /* The portal is signed in as the Johnson family. */
  var FAMILY = 'johnson';

  /* The studio's own number, so two screens cannot name different desks. */
  var DESK = D.STUDIO.phone;

  var DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
               'August', 'September', 'October', 'November', 'December'];
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* A weekly place is said as a recurring day, the way Children says it. */
  var DAYS = {
    Mon: 'Mondays', Tue: 'Tuesdays', Wed: 'Wednesdays', Thu: 'Thursdays',
    Fri: 'Fridays', Sat: 'Saturdays', Sun: 'Sundays', 'Mon–Fri': 'Every weekday'
  };

  var DAY_MINUTES = 24 * 60;

  /* ---- dates ------------------------------------------------------------------
     Every date is worked out from Grove.data.today or from a dated row, so no
     date is written down twice and none can drift from the dataset. */

  function today() {
    var p = String(D.today).replace(',', '').split(' ');   /* Tuesday 28 July 2026 */
    return new Date(Number(p[3]), MONTH.indexOf(p[2]), Number(p[1]));
  }
  function plus(date, n) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
  }
  /* '2026-08-05' in the dated schedule, and back again for comparing. */
  function isoDate(text) {
    var p = String(text).split('-');
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }
  function iso(d) {
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day);
  }
  function daysBetween(from, to) {
    return Math.round((to - from) / 86400000);
  }
  function longDate(d) { return DAY[d.getDay()] + ' ' + d.getDate() + ' ' + MONTH[d.getMonth()]; }
  function dayMon(d) { return d.getDate() + ' ' + MON[d.getMonth()]; }

  /* 'Fri 31 Jul' or '31 Jul' → a real date in the season we are in. */
  function dateFrom(text) {
    var p = String(text).split(' ');
    if (p.length === 3) p.shift();
    var day = Number(p[0]);
    var mon = MON.indexOf(p[1]);
    if (!day || mon === -1) return null;
    var t = today();
    return new Date(t.getFullYear() + (mon < t.getMonth() ? 1 : 0), mon, day);
  }

  function andList(list) {
    if (list.length < 2) return list.join('');
    return list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1];
  }
  /* '3, 10, 17 and 24 August', and across a month boundary as '12, 19, 26
     August and 2 September'. This is the line the owner used to write by hand.
     The month rides on the last day of its own run, so the sentence carries
     one "and", at the very end, however many months it crosses — which is the
     same sentence Home builds, rather than a second wording of it. */
  function dateList(dates) {
    var groups = [], parts = [];
    dates.forEach(function (d) {
      var name = MONTH[d.getMonth()];
      var last = groups[groups.length - 1];
      if (last && last.name === name) last.days.push(d.getDate());
      else groups.push({ name: name, days: [d.getDate()] });
    });
    groups.forEach(function (g) {
      g.days.forEach(function (day, i) {
        parts.push(i === g.days.length - 1 ? day + ' ' + g.name : String(day));
      });
    });
    return andList(parts);
  }

  /* ---- words ------------------------------------------------------------------
     A rule is quoted from D.RULES and only ever joined to a sentence, never
     rewritten. */

  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
  function lower(text) { return String(text).charAt(0).toLowerCase() + String(text).slice(1); }
  function upper(text) { return String(text).charAt(0).toUpperCase() + String(text).slice(1); }
  function unstop(text) {
    var s = String(text);
    return s.charAt(s.length - 1) === '.' ? s.slice(0, -1) : s;
  }
  /* Cents on a whole number are noise on a page a parent skims. */
  function price(n) { return money(n, { cents: n % 1 !== 0 }); }
  function firstName(name) { return String(name).split(' ')[0]; }
  /* '8–11' → '8 to 11'. The band is how the studio groups a room, so a parent
     reads it as a sentence rather than as a code. */
  function bandWords(band) { return String(band).split('–').join(' to '); }
  /* The window is a studio setting with two options. Render whichever is set. */
  function makeupWindowWords(w) {
    var s = String(w);
    if (s === 'same cycle') return 'inside the same billing cycle';
    if (s.indexOf('from the missed class') !== -1) {
      return 'within ' + s.split('from the missed class').join('of the missed class');
    }
    return s;
  }

  /* ---- the family -------------------------------------------------------------- */

  function fam() { return D.family(FAMILY); }
  function kids() {
    var name = fam().name;
    return D.STUDENTS.filter(function (s) { return s.family === name; });
  }
  function stopping() { return String(fam().plan).indexOf('not renewing') !== -1; }

  function classOf(id) {
    return D.CLASSES.filter(function (c) { return c.id === id; })[0];
  }
  /* An After-School record is named by its length ("1 hour · After-School"),
     which is a duration and not a class name, so those rows carry the
     programme name instead. Home and Children do the same. */
  function className(c) { return c.prog === 'as' ? D.program(c.prog).name : c.name; }

  /* Only the end of a range carries the meridiem in this dataset. */
  function meridiem(range) {
    var parts = String(range).split('–');
    var mark = /(am|pm)/i.exec(parts[0]) || /(am|pm)/i.exec(parts[1] || '');
    return mark ? mark[1] : '';
  }
  function startTime(range) {
    var first = String(range).split('–')[0];
    return /(am|pm)/i.test(first) ? first : first + meridiem(range);
  }
  function minutes(range) {
    var hm = String(range).split('–')[0].replace(/(am|pm)/i, '').split(':');
    var hour = Number(hm[0]) % 12;
    if (/pm/i.test(meridiem(range))) hour += 12;
    return hour * 60 + Number(hm[1] || 0);
  }

  /* ---- the dated schedule -------------------------------------------------------
     The diary is D.SESSIONS: one row per child per date, carrying the hours it
     spends and what became of it. */

  function sessionsOf(s) {
    return D.SESSIONS.filter(function (x) { return x.child === s.id; })
      .slice()
      .sort(function (a, b) { return a.date < b.date ? -1 : (a.date > b.date ? 1 : 0); });
  }
  function scheduled(s) {
    return sessionsOf(s).filter(function (x) { return x.state === 'scheduled'; });
  }
  function bookedHours(s) {
    return scheduled(s).reduce(function (n, x) { return n + x.hours; }, 0);
  }
  /* Hours bought, not spent and not booked either. The one place the studio's
     "hours not booked are lost" actually bites a parent. */
  function looseHours(s) {
    var p = D.plan(s);
    if (!p.isPlan) return 0;
    return Math.max(0, p.leftHours - bookedHours(s));
  }
  /* The interval that class already runs at, read off its own dates rather
     than assumed to be a week. */
  function stepDays(p) {
    var rows = (p.dates || []).filter(function (x) {
      return x.classId === p.renewsOn.classId;
    });
    if (rows.length < 2) return 7;
    var gap = daysBetween(isoDate(rows[rows.length - 2].date),
                          isoDate(rows[rows.length - 1].date));
    return gap > 0 ? gap : 7;
  }
  /* The day and time are fixed for the program year, so the next cycle is the
     same class, the same number of hours on, counted from the last class of
     this one. */
  function nextCycleDates(p) {
    var last = p.renewsOn;
    if (!last) return [];
    var per = last.hours || 1;
    var count = Math.max(1, Math.round(p.hours / per));
    var step = stepDays(p);
    var from = isoDate(last.date);
    var out = [], i;
    for (i = 1; i <= count; i++) out.push(plus(from, step * i));
    return out;
  }

  /* ---- missed classes ------------------------------------------------------------
     An absence carries the one fact that matters under the signed policy: told
     us in time and a make-up follows, later than that and the class is used. */

  function absencesOf(s) { return D.absencesFor(s.name); }
  function keptOf(s) {
    return absencesOf(s).filter(function (a) { return !a.spent; });
  }
  function missedWhen(a) { return String(a.date).split(' · ')[0]; }
  function missedAt(a) { return String(a.date).split(' · ')[1] || ''; }
  /* The class an absence happened in, read off the child's own roll, so no
     class she is not on can ever match. */
  function missedClass(s, a) {
    var day = missedWhen(a).split(' ')[0];
    var start = missedAt(a).replace(/(am|pm)/i, '');
    if (!start) return null;
    return D.classesOf(s).filter(function (c) {
      return c.day === day && c.time.indexOf(start) === 0;
    })[0] || null;
  }
  /* The absence sitting on one dated class, so the diary and the make-up list
     cannot tell two different stories about the same Monday. */
  function absenceOn(s, date) {
    return absencesOf(s).filter(function (a) {
      var on = dateFrom(missedWhen(a));
      return on && iso(on) === date;
    })[0] || null;
  }

  /* A make-up already booked on top of the weekly place. */
  function extrasOf(s) {
    return D.EXTRA_CLASSES.filter(function (x) { return x.child === s.name; });
  }
  function allExtras() {
    var out = [];
    kids().forEach(function (s) {
      extrasOf(s).forEach(function (x) { out.push({ child: s, row: x }); });
    });
    return out;
  }
  /* In the order the classes were missed. Every other list on this screen is a
     diary read forwards, and a family with two children would otherwise get
     one child's absences before the other's whatever the dates said. */
  function allMissed() {
    var out = [];
    kids().forEach(function (s) {
      absencesOf(s).forEach(function (a) { out.push({ child: s, row: a }); });
    });
    return out.sort(function (a, b) {
      var ad = dateFrom(missedWhen(a.row)), bd = dateFrom(missedWhen(b.row));
      if (!ad || !bd) return 0;
      return ad - bd;
    });
  }
  /* Earned, less the ones already sitting on the schedule. */
  function toBook() {
    var earned = allMissed().filter(function (m) { return !m.row.spent; }).length;
    return Math.max(0, earned - allExtras().length);
  }

  /* ---- what is still to come ------------------------------------------------------ */

  function coming() {
    var from = iso(today());
    var items = [];

    kids().forEach(function (s) {
      extrasOf(s).forEach(function (x) {
        var bits = String(x.when).split(' · ');
        var on = dateFrom(bits[0]);
        if (!on || iso(on) < from) return;
        items.push({
          key: iso(on), on: on, at: bits[1], mins: minutes(bits[1]),
          who: firstName(s.name), makeup: true,
          title: firstName(s.name) + ' · make-up class',
          where: x.room + ' · with ' + x.staff,
          hours: 0
        });
      });
      scheduled(s).forEach(function (x) {
        if (x.date < from) return;
        var c = classOf(x.classId);
        items.push({
          key: x.date, on: isoDate(x.date), at: x.at, mins: minutes(x.at),
          who: firstName(s.name), makeup: false,
          title: firstName(s.name) + ' · ' + (c ? className(c) : 'Class'),
          where: c ? c.room + ' · with ' + c.staff : '',
          hours: x.hours,
          time: c ? c.time : x.at
        });
      });
    });

    items.sort(function (a, b) {
      if (a.key === b.key) return a.mins - b.mins;
      return a.key < b.key ? -1 : 1;
    });
    return items;
  }

  /* The notice the family signed, read as a LENGTH rather than assumed to be a
     day. The sentence above the list quotes D.RULES.cancelNotice, so the
     arithmetic under each row has to come from the same place or the two
     would disagree the moment the studio changed it. */
  function noticeMinutes() {
    var s = String(D.RULES.cancelNotice);
    var n = Number((/(\d+)/.exec(s) || [])[1]) || 0;
    if (/week/i.test(s)) return n * 7 * DAY_MINUTES;
    if (/day/i.test(s)) return n * DAY_MINUTES;
    return n * 60;
  }
  /* Minutes past midnight back into the time of day a parent reads. */
  function clock(mins) {
    var m = ((mins % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
    var hour = Math.floor(m / 60) % 12;
    var mark = Math.floor(m / 60) >= 12 ? 'pm' : 'am';
    return (hour || 12) + ':' + (m % 60 < 10 ? '0' : '') + (m % 60) + mark;
  }
  /* How far off the class is, in minutes, counting from the start of today —
     the only reading available with no clock in the dataset. */
  function noticeAway(item) {
    return daysBetween(today(), item.on) * DAY_MINUTES + item.mins;
  }
  function inTime(item) { return noticeAway(item) >= noticeMinutes(); }
  /* The moment the notice runs out: that much before the class starts. */
  function cancelBy(item) {
    var mins = item.mins - noticeMinutes();
    return { on: plus(item.on, Math.floor(mins / DAY_MINUTES)), at: clock(mins) };
  }

  /* Said on the row, before anything is pressed. */
  function consequence(item) {
    if (item.makeup) {
      return 'A make-up not attended is used, and it cannot be booked again.';
    }
    if (inTime(item)) {
      var by = cancelBy(item);
      return 'Cancel by ' + longDate(by.on) + ' at ' + by.at + ' and ' +
        item.who + ' gets a make-up.';
    }
    return 'This class is inside the ' + D.RULES.cancelNotice + ', so telling us now uses it — ' +
      lower(D.RULES.lateCancel);
  }
  function cancelMsg(item) {
    if (item.makeup) return 'Told the studio — the make-up is used and cannot be booked again';
    if (inTime(item)) {
      return 'Told the studio — ' + item.who + ' gets a make-up to book in an age-appropriate class';
    }
    return 'Told the studio — the class counts as attended and no make-up is given';
  }

  /* ---- schedule ------------------------------------------------------------------- */

  Grove.screen('fSchedule', {
    surface: 'family',
    crumbTitle: 'Schedule',
    eyebrow: 'the dates you are booked',
    title: 'Schedule',
    sub: function () {
      return 'Every class each child is booked into, and what became of it. Your day and time ' +
        'were chosen at registration and they stay the same until ' + D.PLAN_YEAR.ends + '.';
    },
    actions: function () {
      var list = [{ label: 'Message the studio', to: 'fMessages' }];
      if (toBook()) list.push({ label: 'Book a make-up', kind: 'primary', to: 'fBookMakeup' });
      return list;
    },

    body: function () {
      return Grove.tab('fSchedule', 'Upcoming') === 'Upcoming' ? upcomingTab() : makeupTab();
    }
  });

  function scheduleTabs() {
    return {
      key: 'fSchedule',
      items: [
        { label: 'Upcoming', count: coming().length },
        { label: 'Make-ups', count: allMissed().length }
      ]
    };
  }

  /* ---- upcoming --------------------------------------------------------------------
     Two cards. What is still to come, each row carrying the consequence of
     cancelling it; then the cycle itself, one card per child, every date with
     what became of it and the invoice sentence underneath. */

  function comingCard(list) {
    return ui.card({
      title: 'Still to come',
      flush: true,
      note: 'Cancel at least ' + D.RULES.cancelNotice + ' before the class, here in the portal, ' +
        'and you can take a make-up. Later than that, or a no-show: ' + lower(D.RULES.lateCancel)
    }, list.length
      ? ui.rows(list.map(function (x) {
          var bits = [longDate(x.on), x.time || x.at];
          if (x.hours) bits.push(plural(x.hours, 'hour'));
          if (x.where) bits.push(x.where);
          return {
            lead: ui.timechip(dayMon(x.on), x.makeup ? 'plum' : (inTime(x) ? null : 'amber')),
            title: esc(x.title),
            sub: esc(bits.join(' · ') + '. ' + consequence(x)),
            end: ui.btn({
              label: x.who + ' can’t come',
              kind: 'quiet',
              size: 'sm',
              msg: cancelMsg(x)
            })
          };
        }))
      : ui.empty('Nothing booked ahead',
          'No class is booked for the rest of this cycle. Message the studio and we will put ' +
          'the hours you have left back on the calendar.'));
  }

  /* One card per child: the dates, then the sentence the owner asked for. */
  function cycleCard(s) {
    var p = D.plan(s);
    var who = firstName(s.name);

    if (!p.isPlan) {
      return ui.card({
        title: who + ' · no plan',
        note: 'Camp, no-school days, private classes and pop-ups are paid for when you book ' +
          'them. There is no cycle and nothing renews.'
      }, ui.empty('No plan dates',
        who + ' comes to the things you book one at a time, so there are no cycle dates here.'));
    }

    var rows = sessionsOf(s).map(function (x) {
      var on = isoDate(x.date);
      var a = absenceOn(s, x.date);
      var c = classOf(x.classId);
      var bits = [plural(x.hours, 'hour')];
      if (c) bits.push(c.room + ' · with ' + c.staff);

      var label = x.state === 'attended' ? 'Attended' : 'Booked';
      var kind = x.state === 'attended' ? 'ok' : null;
      var tone = null;

      if (a) {
        label = a.spent ? 'Class used' : 'Make-up earned';
        kind = a.spent ? 'bad' : 'amber';
        tone = a.spent ? null : 'amber';
        bits.push(lower(a.reason));
      }

      return {
        lead: ui.timechip(dayMon(on), tone),
        title: esc(longDate(on) + ' · ' + x.at),
        sub: esc(bits.join(' · ')),
        end: ui.pill(label, kind)
      };
    });

    return ui.card({
      title: who + ' · ' + plural(p.hours, 'hour') + ' a month · ' + price(p.price),
      head: ui.pill(p.usedHours + ' of ' + p.hours + ' hours used', p.leftHours ? null : 'ok'),
      flush: true,
      note: invoiceLine(s, p)
    }, rows.length
      ? ui.rows(rows)
      : ui.empty('No dates yet', 'The day and time you chose will show here as dated classes.'));
  }

  function invoiceLine(s, p) {
    var who = firstName(s.name);
    if (!p.renewsOn) {
      return 'No class is booked for the rest of this cycle, so there is no invoice date yet. ' +
        D.RULES.unusedHours;
    }
    var last = longDate(isoDate(p.renewsOn.date));
    if (stopping()) {
      return 'This plan is not renewing. ' + who + '’s last class is ' + last +
        ', and nothing more is charged.';
    }
    var covers = nextCycleDates(p);
    return 'Your next invoice, ' + price(p.price) + ', comes on ' + who +
      '’s last class of this cycle, ' + last +
      (covers.length ? ', and covers ' + dateList(covers) + '.' : '.');
  }

  function upcomingTab() {
    var list = coming();

    var loose = kids().filter(function (s) { return looseHours(s) > 0; }).map(function (s) {
      var spare = looseHours(s);
      return ui.notice({
        kind: 'warn',
        title: firstName(s.name) + ' has ' + plural(spare, 'hour') + ' left with no class booked',
        text: D.RULES.unusedHours + ' Message the studio and we will put them on the calendar.',
        action: { label: 'Message the studio', kind: 'primary', to: 'fMessages' }
      });
    }).join('');

    var cards = kids().map(cycleCard);

    var different = ui.notice({
      title: 'Need a different day?',
      text: 'Your day and time are your place for the whole program year. If a different day ' +
        'would work better, ring the desk on ' + DESK + ' or send a message and we will see ' +
        'what is possible.',
      action: { label: 'Message the studio', to: 'fMessages' }
    });

    return h`
      ${raw(ui.toolbar({
        tabs: scheduleTabs(),
        count: plural(list.length, 'class still to come', 'classes still to come')
      }))}
      ${raw(loose)}
      ${raw(comingCard(list))}
      <div class="section">${raw(ui.grid(cards.length > 1 ? 2 : null, cards))}</div>
      <div class="section">${raw(different)}</div>
    `;
  }

  /* ---- make-ups ----------------------------------------------------------------------
     One fact per missed class: a make-up was earned, or the class was used.
     Then the rule itself, quoted from D.RULES rather than restated. */

  function missedRows() {
    return allMissed().map(function (m) {
      var s = m.child, a = m.row;
      var on = dateFrom(missedWhen(a));
      var c = missedClass(s, a);
      return {
        lead: ui.timechip(on ? dayMon(on) : missedWhen(a), a.spent ? null : 'amber'),
        title: esc(firstName(s.name) + ' missed ' + (on ? longDate(on) : missedWhen(a))),
        sub: esc('The ' + missedAt(a) + ' class' + (c ? ' in ' + c.room + ' with ' + c.staff : '') +
          ' — ' + lower(a.reason)),
        end: ui.pill(a.spent ? 'Class used' : 'Make-up earned', a.spent ? 'bad' : 'amber')
      };
    });
  }

  function makeupNotices() {
    var missed = allMissed();
    var earned = missed.filter(function (m) { return !m.row.spent; });
    var used = missed.filter(function (m) { return m.row.spent; });
    var booked = allExtras();
    var left = toBook();
    var out = [];

    if (!missed.length) {
      return ui.notice({
        kind: 'ok',
        title: 'No classes missed',
        text: 'If one is coming up, cancel at least ' + D.RULES.cancelNotice + ' ahead in the ' +
          'portal and you can take a make-up.'
      });
    }

    if (left) {
      var bookedLine = '';
      if (booked.length === 1) {
        var one = booked[0];
        var on = dateFrom(String(one.row.when).split(' · ')[0]);
        bookedLine = ' One is already booked, for ' + firstName(one.child.name) + ' on ' +
          (on ? longDate(on) : String(one.row.when).split(' · ')[0]) + '.';
      } else if (booked.length) {
        bookedLine = ' ' + booked.length + ' are already booked and show on Upcoming.';
      }
      out.push(ui.notice({
        kind: 'ok',
        title: plural(left, 'make-up still to book', 'make-ups still to book'),
        text: (earned.length === 1
          ? 'One class came back as a make-up because you told us in time.'
          : earned.length + ' classes came back as make-ups because you told us in time.') +
          bookedLine + ' A make-up goes in ' + lower(unstop(D.RULES.makeupWhere)) + ', ' +
          makeupWindowWords(D.RULES.makeupWindow) + '.',
        action: { label: 'Book a make-up', kind: 'primary', to: 'fBookMakeup' }
      }));
    } else if (earned.length) {
      out.push(ui.notice({
        kind: 'ok',
        title: 'Every make-up is booked',
        text: 'Nothing is waiting on you. The booked ones are on Upcoming with the date and ' +
          'the room.'
      }));
    }

    if (used.length) {
      var first = used[0];
      out.push(ui.notice({
        kind: 'warn',
        title: plural(used.length, 'class used', 'classes used'),
        text: firstName(first.child.name) + ' missed ' + missedWhen(first.row) + ' inside the ' +
          D.RULES.cancelNotice + ', so ' + lower(D.RULES.lateCancel) +
          ' Tell us a day ahead and a make-up follows instead.'
      }));
    }

    return out.join('');
  }

  function ruleCard() {
    var r = D.RULES;
    return ui.card({ title: 'How a make-up works', flush: true }, ui.rows([
      {
        title: esc('Cancel ' + r.cancelNotice + ' ahead and you get a make-up'),
        sub: esc('Later than that, or a no-show: ' + lower(r.lateCancel)),
        end: ui.btn({ label: 'Book a make-up', kind: 'quiet', size: 'sm', to: 'fBookMakeup' })
      },
      {
        title: 'Where a make-up goes',
        sub: esc(r.makeupWhere + ' It must be taken ' + makeupWindowWords(r.makeupWindow) + '.')
      },
      {
        title: 'What a make-up cannot do',
        sub: esc('A make-up cannot: ' + r.makeupNever.map(lower).join('; ') + '.')
      },
      {
        title: 'Hours not booked are lost',
        sub: esc(r.unusedHours + ' ' + r.freeze)
      }
    ]));
  }

  function makeupTab() {
    var rows = missedRows();
    var left = toBook();

    return h`
      ${raw(ui.toolbar({
        tabs: scheduleTabs(),
        count: plural(rows.length, 'class missed', 'classes missed') +
          (left ? ' \u00b7 ' + left + ' to book' : '')
      }))}
      ${raw(makeupNotices())}
      <div class="section">${raw(ui.card({ title: 'Classes missed', flush: true },
        rows.length
          ? ui.rows(rows)
          : ui.empty('Nothing missed', 'Every class on your schedule has been attended.')))}</div>
      <div class="section">${raw(ruleCard())}</div>
    `;
  }

  /* ---- book a make-up -------------------------------------------------------------------
     One question: which class? The signed policy says a make-up goes in any
     age-appropriate class with a free place, so the options are counted off
     D.CLASSES — After-School only, the child's own age band, and a place the
     roll has not already taken. When every one of them is full, that is the
     answer the policy gives, and the screen says so and offers a person.

     The screen key stays fBookMakeup because js/nav.js and the sibling family
     screens route to it. It is a route id, not a word a parent reads. */

  Grove.on('pickMakeup', function (d) { Grove.setFilter('makeupPick', d.id); });

  var ASK = 'ask';

  function openClasses(child) {
    return D.CLASSES.filter(function (c) {
      return c.prog === 'as' && c.band === child.band && c.cap - c.en > 0;
    });
  }
  /* Whoever has a make-up still to book, otherwise whoever is on a plan. The
     other children are named in the help card rather than put behind a second
     question. */
  function subject() {
    var waiting = kids().filter(function (s) {
      return keptOf(s).length > extrasOf(s).length;
    });
    return waiting[0] ||
      kids().filter(function (s) { return D.plan(s).isPlan; })[0] ||
      kids()[0] || null;
  }
  /* The studio's own words about extra make-up hours, if it has published any.
     The dataset holds no places-left for them, so the announcement is shown as
     written and the desk confirms the hour. */
  function makeupNews() {
    return D.ANNOUNCEMENTS.filter(function (a) {
      return a.status !== 'Scheduled' && /make-?up/i.test(a.head);
    })[0] || null;
  }

  Grove.screen('fBookMakeup', {
    surface: 'family',
    crumbs: [{ label: 'Schedule', to: 'fSchedule' }],
    crumbTitle: 'Book a make-up',
    eyebrow: 'nothing changes until we confirm',
    title: 'Book a make-up',
    sub: function () {
      return D.RULES.makeupWhere + ' Pick one below and the studio confirms it, usually the ' +
        'same day.';
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
          text: 'Nobody in the family is on a class roll. Message the studio and we will find a ' +
            'place first.',
          action: { label: 'Back to your schedule', to: 'fSchedule' }
        }))}`;
      }

      var p = D.plan(child);
      var open = openClasses(child);
      var picked = Grove.filter('makeupPick', open.length ? open[0].id : ASK);
      var asking = picked === ASK || !open.length;

      var options = open.map(function (c) {
        return ui.choice({
          id: c.id,
          size: 'lg',
          act: 'pickMakeup',
          title: (DAYS[c.day] || c.day) + ' at ' + startTime(c.time) + ' · ' + c.room,
          sub: plural(c.cap - c.en, 'place free', 'places free') + ' · with ' + c.staff +
            ' · ages ' + bandWords(c.band),
          on: c.id === picked
        });
      });
      options.push(ui.choice({
        id: ASK,
        size: 'lg',
        act: 'pickMakeup',
        title: open.length ? 'None of these suit us' : 'Ask the studio to find an hour',
        sub: open.length
          ? 'Tell us and we will look for another hour'
          : 'We will look for a class with a free place and write back',
        on: asking
      }));

      var choose = ui.card({
        title: open.length ? 'Pick a class' : 'Ask us for an hour',
        note: 'A place showing here is not held until we confirm it, so no room is ever ' +
          'overbooked.'
      }, ui.choices(null, options));

      /* Who it is for, what it uses, and the two rules that decide whether it
         can happen at all. Every figure is the child's own. */
      var kept = keptOf(child);
      var booked = extrasOf(child);
      var mine = Math.max(0, kept.length - booked.length);
      var facts = [['Who', esc(child.name)]];

      if (p.isPlan) {
        facts.push(['This cycle', esc(p.usedHours + ' of ' + p.hours + ' hours used')]);
      }
      if (kept.length) {
        var bookedWhen = booked.length
          ? dateFrom(String(booked[0].when).split(' · ')[0])
          : null;
        facts.push(['Make-ups to use', esc(mine + ' of ' + kept.length +
          (booked.length
            ? ' · ' + (booked.length === 1 ? 'one is booked for ' : booked.length + ' are booked, the first for ') +
              (bookedWhen ? longDate(bookedWhen) : String(booked[0].when).split(' · ')[0])
            : ''))]);
      }
      facts.push(['What it costs', 'Nothing more — it uses the hour the missed class did not']);
      facts.push(['Take it', esc(upper(makeupWindowWords(D.RULES.makeupWindow)))]);
      facts.push(['Where it can go', esc(unstop(D.RULES.makeupWhere))]);

      var about = ui.card({ title: 'What you are booking' }, ui.kv(facts));

      var siblings = kids().filter(function (s) {
        return s.name !== child.name && D.plan(s).isPlan;
      }).map(function (s) { return firstName(s.name); });

      var help = ui.card({ title: 'If you are not sure' }, h`
        <div class="stack">
          <p class="hint">Ring the desk on ${DESK} or send a message and we will book it for
          you. Nothing on your schedule changes until the studio confirms.</p>
          ${raw(siblings.length
            ? '<p class="hint">A make-up cannot transfer to a sibling, so ' +
              esc(andList(siblings)) + (siblings.length === 1 ? ' would need' : ' would each need') +
              ' one of their own.</p>'
            : '')}
          <div class="btn-group">
            ${raw(ui.btn({ label: 'Message the studio', to: 'fMessages' }))}
          </div>
        </div>
      `);

      var full = open.length ? '' : ui.notice({
        kind: 'warn',
        title: 'Every after-school class for ages ' + bandWords(child.band) + ' is full',
        text: 'A make-up cannot be guaranteed when every class is full. Ask us below and we ' +
          'will look for an hour, or ring the desk on ' + DESK + '.'
      });

      var news = makeupNews();
      var extra = news ? ui.notice({
        kind: 'ok',
        title: news.head,
        text: news.body,
        action: {
          label: 'Ask for one of these hours',
          kind: 'primary',
          msg: 'Sent — the studio will confirm an hour and write back'
        }
      }) : '';

      return h`
        ${raw(full)}
        ${raw(extra)}
        <div class="section">${raw(ui.grid('sidebar', [choose, ui.col([about, help])]))}</div>
        ${raw(ui.formActions([
          {
            label: asking ? 'Ask for an hour' : 'Request this class',
            kind: 'primary',
            msg: asking
              ? 'Sent — we will look for an hour and write back'
              : 'Sent — the studio will confirm, usually the same day'
          },
          { label: 'Cancel', to: 'fSchedule' }
        ], {
          sticky: true,
          hint: 'Nothing on your schedule changes until the studio confirms'
        }))}
      `;
    }
  });
})();
