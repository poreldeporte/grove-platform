/* Family → Children, one child's page, and Add a child.

   Written for the parent this portal is actually for: someone in their
   sixties doing the school run, wary of getting something wrong online, who
   will ring the studio rather than hunt for a control. Three things are true
   of all three screens — the thing they came to do is on screen before they
   scroll, they are asked one question at a time, and asking a person is an
   option they can see.

   WHAT CHANGED IN THIS PASS: A PLAN IS HOURS A MONTH

   The pack of sessions is gone. After-School is the only programme with a
   plan, and a plan is a number of HOURS a month — 4, 8, 12 or 16 — at a rate
   per hour that falls as the plan grows. The parent chose the day and the time
   at registration and it is fixed for the program year; the month's hours are
   spent by those dated classes. So this file now says "4 hours a month · $280"
   and "3 of 4 hours used this cycle", and it reads all of it from D.plan(s),
   which counts the hours off D.SESSIONS. Nothing here is a pack, a session, a
   month-to-month membership or a charge on the 1st.

   Five things follow, and each deletes machinery rather than renaming it:

     - the invoice has a date again, and it is a class rather than a day of the
       month: it is raised on the last class of the cycle and it covers the
       next one. The child page names that class and lists the dates the next
       invoice covers, because listing the dates is how the owner keeps
       control. The dates are the child's own weekly slots carried forward —
       one slot for each class they hold, each carried as many weeks as the
       month's hours pay for — so a child who splits eight hours across two
       one-hour days gets both days for four weeks, and nothing is typed in
     - hours not booked are lost. There is no balance, no rollover and no
       credit to chase, so there is nothing on this page that carries one
     - a missed class is a make-up, on the studio's signed terms: cancel at
       least 24 hours ahead in the portal and you get one, later than that or a
       no-show and the class counts as attended. The rule is stated once, from
       D.RULES, and the window is whatever Settings holds — this file renders
       the setting and never decides it
     - the plan ends by itself with the school year, so the card says the date
       D.PLAN_YEAR carries rather than implying something renews in the summer
     - an exception is a message, not a control. A school that finishes a week
       after the program, a private class, an event — the parent asks, and the
       studio makes one charge on the card already on file. So this page gained
       no switch for any of it; it says who to ask and what happens next

   Dated classes stay on Schedule, which already owns them: the missed classes,
   the make-ups and the extra class Emma has on Friday are all listed there,
   with the header action and the card's own button leading straight to it.
   Two screens telling the same story in different words is what the client
   complained about, so this one keeps the plan and the weekly place and points
   at the other for the diary.

   Where a child's day comes from: a placement is read from the class the child
   is enrolled in — D.classesOf(s) — rather than by parsing the free-text line
   on their record. The day, the room and the teacher are the ones the class
   itself carries, a child who holds more than one place gets a line for each,
   and a child with no place is either named on the waitlist or has no day
   chosen yet. Nothing here counts children by hand either: the family is
   whoever STUDENTS holds against the household, so the page reads the same for
   a family of one as for a family of four.

   What earlier passes settled, and this one keeps:
     - a child's card is three lines — when they are in, the hours on their
       plan, and what a teacher must not get wrong — with anything that needs
       the parent on a footer bar of its own. The button sits on the child it
       belongs to
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
     - "Attendance · 96%". A percentage is the studio's measure of a term. What
       a parent can act on is how many hours are left this cycle and when the
       next invoice lands, and both are now said in words
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
     said as one. */
  var DAYS = {
    Mon: 'Mondays', Tue: 'Tuesdays', Wed: 'Wednesdays', Thu: 'Thursdays',
    Fri: 'Fridays', Sat: 'Saturdays', Sun: 'Sundays', 'Mon–Fri': 'Every weekday'
  };

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
                'August', 'September', 'October', 'November', 'December'];

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

  /* ---- dates ------------------------------------------------------------------
     A cycle is a set of dates, and D.SESSIONS holds them as '2026-07-27'. The
     parts are read off the string rather than through a Date, so the day a
     parent reads is the day the studio wrote down, whatever their clock says.
     Only the projection forward needs arithmetic, and that runs in UTC. */

  function parts(iso) {
    var p = String(iso).split('-');
    return { y: +p[0], m: +p[1], d: +p[2] };
  }
  function dayMonth(iso) {
    var t = parts(iso);
    return t.d + ' ' + MONTHS[t.m - 1];
  }
  /* One weekly slot carried forward: the same day of the week, a week at a
     time, as many times as asked for. */
  function weeksAfter(iso, count) {
    var t = parts(iso);
    var base = Date.UTC(t.y, t.m - 1, t.d);
    var out = [];
    for (var i = 1; i <= count; i++) {
      var dt = new Date(base + i * 7 * 24 * 60 * 60 * 1000);
      out.push({ key: dt.getTime(), d: dt.getUTCDate(), m: dt.getUTCMonth() });
    }
    return out;
  }
  /* "3, 10, 17 and 24 August", and across a month end "26 August and 2
     September" — the month is named once for each run of days inside it. */
  function datesWords(list) {
    var groups = [];
    list.forEach(function (x) {
      var g = groups[groups.length - 1];
      if (!g || g.m !== x.m) { g = { m: x.m, days: [] }; groups.push(g); }
      g.days.push(x.d);
    });
    return andList(groups.map(function (g) {
      return andList(g.days.map(String)) + ' ' + MONTHS[g.m];
    }));
  }

  /* ---- the plan ---------------------------------------------------------------
     A plan is HOURS a month, and only After-School has one. The hours, the
     price, the hours already used and the class the next invoice is raised on
     all come from D.plan(), which counts them off the child's own dated
     classes — so a screen can never quote a figure the studio does not hold.
     Camp, a pop-up, a private class and a birthday are one-off bookings with
     no plan, no cycle and nothing that renews. */

  function hoursWord(n) {
    return (n === 1 ? 'one' : (n === 2 ? 'two' : n)) + '-hour';
  }
  /* The length of one of this child's classes, if they are all the same. A
     child splitting their hours across a one-hour and a two-hour class has no
     single class length, and the sentence simply leaves that clause out. */
  function classLength(p) {
    var len = null, mixed = false;
    (p.dates || []).forEach(function (x) {
      if (len === null) len = x.hours;
      else if (x.hours !== len) mixed = true;
    });
    return mixed ? null : len;
  }
  function rateWords(p) {
    var rate = p.price / p.hours;
    return money(rate, { cents: rate !== Math.round(rate) });
  }
  /* A rule from D.RULES is a sentence of its own. Dropping its capital and its
     full stop lets it be joined to the one before it without either screen
     rewriting the rule itself. */
  function lower(text) {
    var s = String(text);
    return s.charAt(0).toLowerCase() + s.slice(1);
  }
  function unstop(text) {
    var s = String(text);
    return s.charAt(s.length - 1) === '.' ? s.slice(0, -1) : s;
  }
  function makeupWindowWords(w) {
    var s = String(w);
    if (s === 'same cycle') return 'inside the same billing cycle';
    if (s.indexOf('from the missed class') !== -1) {
      return 'within ' + s.split('from the missed class').join('of the missed class');
    }
    return s;
  }

  function planHeadline(s, p) {
    if (!p.isPlan) {
      return {
        title: 'No plan',
        sub: esc(first(s) + ' comes to camp and to classes you book one at a time. Each is paid ' +
          'for when you book it, so there is nothing here that renews.')
      };
    }
    var len = classLength(p);
    return {
      title: esc(p.hours + ' hours a month · ' + money(p.price, { cents: false })),
      sub: esc(p.usedHours + ' of ' + p.hours + ' hours used this cycle' +
        (len ? ', taken as ' + (p.hours / len) + ' ' + hoursWord(len) + ' classes a month' : '') +
        '. That works out at ' + rateWords(p) + ' an hour.')
    };
  }

  /* A child holds one weekly slot for each class they are in. Each slot is
     read off their own dated classes — how long it runs, and the last date
     they hold in it — so nothing about the pattern is typed in. */
  function slots(p) {
    var byClass = {}, order = [];
    (p.dates || []).forEach(function (x) {
      var slot = byClass[x.classId];
      if (!slot) {
        byClass[x.classId] = { hours: x.hours, last: x.date };
        order.push(x.classId);
      } else if (x.date > slot.last) {
        slot.last = x.date;
      }
    });
    return order.map(function (id) { return byClass[id]; });
  }
  /* How many weeks of those slots the month's hours pay for. Eight hours
     split across two one-hour days is four weeks, not eight. */
  function cycleWeeks(p) {
    var perWeek = 0;
    slots(p).forEach(function (slot) { perWeek += slot.hours; });
    return perWeek ? Math.round(p.hours / perWeek) : 0;
  }
  /* Every slot carried forward that many weeks and merged into one list in
     date order: the dates the next invoice covers. */
  function nextCycleDates(p) {
    var weeks = cycleWeeks(p), seen = {}, out = [];
    slots(p).forEach(function (slot) {
      weeksAfter(slot.last, weeks).forEach(function (x) {
        if (seen[x.key]) return;
        seen[x.key] = true;
        out.push(x);
      });
    });
    out.sort(function (a, b) { return a.key - b.key; });
    return out;
  }

  /* The invoice is raised on the last class of the cycle and covers the next
     one, and the owner wants the dates it covers written out. */
  function invoiceRow(s, p) {
    if (!p.isPlan || !p.renewsOn) return null;
    var covers = nextCycleDates(p);
    return {
      title: esc('Your next invoice comes on ' + first(s) + '’s last class of this cycle, ' +
        dayMonth(p.renewsOn.date)),
      sub: covers.length
        ? esc('It covers ' + datesWords(covers) + ' — the same ' +
            (slots(p).length > 1 ? 'days and times' : 'day and time') + ', every week.')
        : esc('It covers the next cycle of ' + first(s) + '’s classes.')
    };
  }

  /* The studio's own rules, read from D.RULES so that no screen invents a
     version of them, and the make-up window is whatever Settings holds. */
  function ruleRows(p) {
    if (!p.isPlan) return [];
    var r = D.RULES;
    return [
      {
        title: esc('Cancel ' + r.cancelNotice + ' ahead and you get a make-up'),
        sub: esc('Later than that, or a no-show: ' + lower(r.lateCancel) +
          ' A make-up goes in ' + lower(unstop(r.makeupWhere)) + ', ' +
          makeupWindowWords(r.makeupWindow) + '.'),
        end: ui.btn({ label: 'Book a make-up', kind: 'quiet', size: 'sm', to: 'fBookMakeup' })
      },
      { title: 'Nothing rolls over', sub: esc(r.unusedHours) },
      {
        title: esc('The plan runs to ' + D.PLAN_YEAR.ends + ' and ends there'),
        sub: esc(D.PLAN_YEAR.note + ' To stop it before then, ' + lower(r.cancelPlan) + ' ' +
          r.freeze)
      }
    ];
  }

  /* The child's own paperwork — a photo permission is held per child. */
  function consentDoc(s) {
    var name = first(s);
    return D.DOCUMENTS.filter(function (d) { return d.name.indexOf(name) !== -1; })[0];
  }
  function signedLine(d) {
    var bits = String(d.who).split(' · ');
    var me = Grove.persona('family');
    if (!bits[1]) return bits[0];
    return (me && bits[0] === me.name ? 'You signed this on ' : bits[0] + ' signed this on ') +
      bits[1];
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
    var bits = String(range).split('–');
    var mark = /(am|pm)/i.exec(bits[0]) || /(am|pm)/i.exec(bits[1] || '');
    return bits[0].replace(/(am|pm)/i, '') + (mark ? mark[1].toLowerCase() : '');
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
     An invoice lands on a class rather than needing anybody, and a missed class
     is settled by the 24-hour rule the moment it is missed. What is left is
     paperwork nobody has signed, so there is one of these or none, and the card
     foot and the pinned bar both read from it. */

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
    var p = D.plan(s);
    var head = planHeadline(s, p);
    var inv = invoiceRow(s, p);

    /* Where they are on a Monday, then the hours on their plan, then the thing
       a teacher must not get wrong. */
    var rows = placeRows(s).concat([{
      title: head.title,
      sub: p.isPlan && inv
        ? esc(p.usedHours + ' of ' + p.hours + ' hours used this cycle. Next invoice on ' +
            dayMonth(p.renewsOn.date) + '.')
        : head.sub
    }]).concat([
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
      var plans = kids.filter(function (s) { return D.plan(s).isPlan; });
      return andList(names) + (names.length === 1 ? ' is' : ' are') + ' with us. Open a child to ' +
        'see the hours on their plan, when they are in, and what a teacher must know about them.' +
        (plans.length > 1 ? ' Each child has their own hours and their own invoice.' : '');
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
     this page that can hurt somebody. Under it, the day and time they hold for
     the year, the hours on their plan, and how to have any of it changed by a
     person. */

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
      var p = D.plan(s);
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
        note: held.length
          ? 'You chose ' + (held.length > 1 ? 'these days and times' : 'this day and time') +
            ' when you registered, and ' + (held.length > 1 ? 'they are' : 'it is') +
            ' held for the whole program year. If a day stops working for you, tell us and we ' +
            'will see what is possible.'
          : 'No class is booked yet. Tell us the day you would like and we will see what ' +
            'is possible.'
      }, ui.rows(rows));

      /* The plan: the hours, the class the next invoice is raised on and the
         dates it covers, then the three rules a parent actually asks about.
         The dated classes themselves — what was missed, what is still to come,
         a make-up already booked — are on Schedule, and the button goes there
         rather than repeating them here in other words. */
      var planCard = ui.card({
        title: first(s) + '’s plan',
        flush: true,
        head: ui.btn({ label: 'See their classes', kind: 'quiet', size: 'sm', to: 'fSchedule' }),
        note: p.isPlan
          ? 'The hours are used up by the classes on their schedule, and the invoice is raised ' +
            'on the last class of the cycle rather than on a day of the month.'
          : 'One-off bookings are paid for when you book them. Camp, a pop-up, a private class ' +
            'and a birthday party have no plan and no cycle.'
      }, ui.rows([planHeadline(s, p)]
        .concat(invoiceRow(s, p) ? [invoiceRow(s, p)] : [])
        .concat(ruleRows(p))));

      /* Nothing on this page has to be done online, and a parent who cannot
         see the control they want should be able to see that. */
      var help = ui.card({
        title: 'If something needs changing',
        foot: '<span class="hint">Or ring the desk on ' + esc(DESK) + '</span>' +
          ui.btn({ label: 'Message the studio', to: 'fMessages' })
      }, h`<p class="hint">An allergy, a new number, a day that has stopped working, an extra
        class or two because their school finishes later than our program — send us a message
        and we will add it and charge the card we already hold. You do not have to do any of it
        yourself.</p>`);

      /* One child, so a bar can name what needs doing without guessing which
         of them was meant. Nothing outstanding, no bar. */
      var bar = t
        ? ui.formActions([
            { label: t.label, kind: 'primary', to: t.to, id: t.id }
          ], { sticky: true, hint: t.hint })
        : '';

      return h`
        ${raw(care)}
        <div class="section">${raw(ui.grid(2, [atStudio, ui.col([planCard, help])]))}</div>
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
          control: ui.date({})
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
          sub: 'A charge starts when you choose how many hours a month they come and which day ' +
               'they hold. When you know, this is where you choose it.',
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
            ? 'Nothing is charged by saving — you choose their hours and their day next'
            : 'Tell us about allergies above before you save'
        }))}
      `;
    }
  });
})();
