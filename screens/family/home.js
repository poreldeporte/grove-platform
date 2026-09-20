/* Family → Home. The parent's landing page, in the order a parent reads it:
   what is waiting on you, the next class, where each child's hours stand, and
   what the studio has said.

   THE PRICING MODEL, AS IT IS NOW SETTLED. A plan is HOURS A MONTH, and only
   After-School has one. The parent picks their day and time at registration
   and it is fixed for the program year, so a cycle is a set of dates and the
   month's hours are spent by those dated classes. The invoice is raised on the
   last class of the cycle and covers the next cycle. Hours not booked are
   lost. The plan runs to the end of the school year and ends by itself.

   What that cost this file:

     - the pack vocabulary is gone. No pack, no "sessions used", no "renews on
       the 8th class", no "sessions never expire". The unit is an hour, the
       cycle is a set of dates, and both are read off Grove.data
     - "Tomorrow" has been replaced by "Next class". Tomorrow was a guess made
       by matching a weekday against a timetable line; the dated schedule now
       says which classes are booked and when, so the page reads dates instead
       of inferring them. The "can't come" button moved with it
     - "Sessions" is now "This cycle": hours used of hours bought, per child,
       with the one sentence the owner asked for in her own terms — when the
       next invoice comes, and the dates it covers
     - the dates of the next cycle are projected from the last class of this
       one, because the day and time are fixed for the year. That is the only
       figure on the page not read straight from a row, and it is derived from
       the child's own last class, their plan hours and the length of their
       class, never written down
     - the invoice sentence is written in the tense the calendar says. A class
       is marked after it is taught, so the last class of a cycle can be a day
       or two behind us; the page then says that class WAS, and still names
       the dates the invoice covers. It never calls a past day a coming one
     - the dates the invoice covers read as one list with one "and" at the end,
       even when the cycle crosses a month: "12, 19, 26 August and 2 September"
     - the make-up wording comes from D.RULES, including the expiry window,
       which is a studio setting with two options and is rendered rather than
       hard-coded. No screen should invent its own version of a rule a family
       has signed. When the next class is itself a make-up, the card adds the
       one rule that then applies — a make-up missed is used, not rebooked
     - a class the studio added on top of the plan is called a MAKE-UP class,
       not an extra class. "Extra classes" now means the paid ones the studio
       charges for by hand, and the two must not wear the same word
     - one notice for hours left with no class booked, because that is the only
       place rule "hours not booked are lost" actually bites a parent. If it
       ever fires, the answer is to book or to ring the desk

   Deliberately NOT built here: extra classes when a school finishes later than
   the studio's program, a private class, an event, any other service. Those
   are the owner's one "make sale / post sale" — she picks the family, says
   what it is for, and charges the card on file. On this page they arrive as a
   line on the bill, which is why the money notice says a charge of that kind
   is charged on its own and does not come out of the plan hours.

   Kept: the studio's announcements in the studio's own words, and the two ways
   to reach a person pinned to the foot of the page. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  /* The portal is signed in as the Johnson family. */
  var FAMILY = 'johnson';

  /* The studio's own number, so two screens cannot name different desks. */
  var DESK = D.STUDIO.phone;

  var DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
               'August', 'September', 'October', 'November', 'December'];
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* ---- dates ------------------------------------------------------------------
     Every date on this page is worked out from Grove.data.today or from a dated
     row, so no date is written down twice and none can drift from the dataset. */

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

  function longDate(d) { return DAY[d.getDay()] + ' ' + d.getDate() + ' ' + MONTH[d.getMonth()]; }
  function behindUs(d) { return iso(d) < iso(today()); }

  /* 'Mon 13 Jul' → 'Monday 13 July'. A parent reads a day, not an abbreviation. */
  function spell(text) {
    var out = String(text);
    ABBR.forEach(function (a, i) { out = out.replace(new RegExp('\\b' + a + '\\b'), DAY[i]); });
    MON.forEach(function (m, i) { out = out.replace(new RegExp('\\b' + m + '\\b'), MONTH[i]); });
    return out;
  }
  /* The year is never in doubt on a page about this week. */
  function plainDate(text) { return spell(String(text).replace(/\s\d{4}$/, '')); }

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

  /* '3, 10, 17 and 24 August', and across a month boundary as '12, 19, 26
     August and 2 September'. This is the line the owner used to write by hand.
     The month rides on the last day of its own run, so the sentence carries
     one "and", at the very end, however many months it crosses. */
  function dateList(dates) {
    var groups = [];
    dates.forEach(function (d) {
      var name = MONTH[d.getMonth()];
      var last = groups[groups.length - 1];
      if (last && last.name === name) last.days.push(d.getDate());
      else groups.push({ name: name, days: [d.getDate()] });
    });
    var parts = [];
    groups.forEach(function (g) {
      g.days.forEach(function (day, i) {
        parts.push(i === g.days.length - 1 ? day + ' ' + g.name : String(day));
      });
    });
    return andList(parts);
  }

  /* ---- words and figures --------------------------------------------------- */

  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
  function lower(text) { return String(text).charAt(0).toLowerCase() + String(text).slice(1); }
  /* Cents on a whole number are noise on a page a parent skims. */
  function price(n) { return Grove.money(n, { cents: n % 1 !== 0 }); }

  /* ---- the family --------------------------------------------------------- */

  function fam() { return D.family(FAMILY); }
  function kids() {
    var name = fam().name;
    return D.STUDENTS.filter(function (s) { return s.family === name; });
  }
  function firstName(name) { return String(name).split(' ')[0]; }
  function andList(list) {
    if (list.length < 2) return list.join('');
    return list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1];
  }
  /* 'Visa ···1183 · exp 04/29' → 'Visa ···1183'. The expiry belongs to Billing. */
  function cardName() { return String(fam().card).split(' · ')[0]; }

  function classOf(id) {
    return D.CLASSES.filter(function (c) { return c.id === id; })[0];
  }
  /* An After-School record is named by its length ("1 hour · After-School"),
     which is a duration and not a class name, so those rows carry the
     programme name instead. Schedule does the same. */
  function className(c) { return c.prog === 'as' ? D.program(c.prog).name : c.name; }

  /* Only the end of a range carries the meridiem in this dataset, so both the
     sort key and the time chip have to look at the whole range. */
  function meridiem(range) {
    var parts = String(range).split('–');
    var mark = /(am|pm)/i.exec(parts[0]) || /(am|pm)/i.exec(parts[1] || '');
    return mark ? mark[1] : '';
  }
  function minutes(range) {
    var hm = String(range).split('–')[0].replace(/(am|pm)/i, '').split(':');
    var hour = Number(hm[0]) % 12;
    if (/pm/i.test(meridiem(range))) hour += 12;
    return hour * 60 + Number(hm[1] || 0);
  }
  function chipTime(range) {
    return String(range).split('–')[0].replace(/(am|pm)/i, '') + ' ' + meridiem(range);
  }

  /* ---- the rules the family signed ------------------------------------------
     Read from D.RULES, never restated. The make-up window is a studio setting
     with two options, so the page renders whichever one is set. */

  function makeupWindow() {
    var w = String(D.RULES.makeupWindow);
    return /^\d/.test(w) ? w : 'the ' + w;
  }
  /* The one thing a family needs told when the class in front of them is
     itself a make-up. Found in the list rather than counted off it, so the
     sentence cannot come loose if the studio reorders the rules. */
  function neverRebooked() {
    var hits = D.RULES.makeupNever.filter(function (t) { return /rebooked/i.test(t); });
    return hits.length ? hits[0] : '';
  }

  /* ---- hours ------------------------------------------------------------------
     A plan is hours a month. The hours are spent by the dated classes, so what
     is left and what is booked are two different numbers, and the gap between
     them is the only thing on this page a parent can lose. */

  function dated(s) {
    return D.SESSIONS.filter(function (x) {
      return x.child === s.id && x.state === 'scheduled';
    });
  }
  function bookedHours(s) {
    return dated(s).reduce(function (n, x) { return n + x.hours; }, 0);
  }
  function looseHours(s) {
    var p = D.plan(s);
    if (!p.isPlan) return 0;
    return Math.max(0, p.leftHours - bookedHours(s));
  }

  /* The dates the next invoice covers. The day and time are fixed for the
     program year, so the next cycle is the same class, the same number of
     hours on, counted from the last class of this one. */
  function nextCycleDates(p) {
    var last = p.renewsOn;
    if (!last) return [];
    var per = last.hours || 1;
    var count = Math.max(1, Math.round(p.hours / per));
    var from = isoDate(last.date);
    var out = [];
    for (var i = 1; i <= count; i++) out.push(plus(from, 7 * i));
    return out;
  }

  /* ---- money ---------------------------------------------------------------- */

  function sum(list) { return list.reduce(function (n, l) { return n + l.amt; }, 0); }
  function unpaid() { return D.LEDGER.filter(function (l) { return !l.paid; }); }

  /* ---- what is waiting on the parent ---------------------------------------
     One notice for each thing to do, each carrying its own button. */

  function ours(list) {
    var names = kids().map(function (s) { return s.name; });
    return list.filter(function (m) { return names.indexOf(m.child) !== -1; });
  }
  function unsigned() { return D.DOCUMENTS.filter(function (d) { return !d.signed; }); }

  /* Money leads, because it is the only one with a day already behind it. */
  function todos() {
    var list = [];

    var owing = sum(unpaid());
    if (owing > 0) {
      var oldest = unpaid()[0];
      list.push({
        kind: 'warn',
        title: price(owing) + ' is still to pay',
        text: oldest.what + ', from ' + plainDate(oldest.d) + '. It is charged on its own ' +
              'and does not come out of your plan hours.',
        action: { label: 'See billing', kind: 'primary', to: 'fBilling' }
      });
    }

    kids().forEach(function (s) {
      var spare = looseHours(s);
      if (!spare) return;
      list.push({
        kind: 'warn',
        title: firstName(s.name) + ' has ' + plural(spare, 'hour') + ' left with no class booked',
        text: D.RULES.unusedHours + ' Book them on your schedule, or ring the desk and we ' +
              'will do it for you.',
        action: { label: 'See your schedule', kind: 'primary', to: 'fSchedule' }
      });
    });

    var papers = unsigned();
    if (papers.length === 1) {
      list.push({
        kind: 'warn',
        title: papers[0].name + ' is waiting for your signature',
        text: 'Two minutes to read, one tap to sign.',
        action: { label: 'Read and sign', kind: 'primary', to: 'fDocument', id: papers[0].id }
      });
    } else if (papers.length) {
      list.push({
        kind: 'warn',
        title: papers.length + ' documents are waiting for your signature',
        text: andList(papers.map(function (d) { return d.name; })) + '. Each one has its own ' +
              'Read and sign button, and none of them takes more than two minutes.',
        action: { label: 'See what to sign', kind: 'primary', to: 'fDocuments' }
      });
    }
    return list;
  }

  /* ---- the dated classes still to come ---------------------------------------
     Straight off the dated schedule, plus anything the studio has added on top
     of the plan. A class already behind us is not something still to come. */

  function coming() {
    var from = iso(today());
    var items = [];

    ours(D.EXTRA_CLASSES).forEach(function (x) {
      var bits = String(x.when).split(' · ');
      var at = dateFrom(bits[0]);
      if (!at || iso(at) < from) return;
      items.push({
        key: iso(at), mins: minutes(bits[1]), on: at, who: firstName(x.child),
        lead: ui.timechip(chipTime(bits[1])),
        makeup: true,
        title: firstName(x.child) + ' · make-up class',
        sub: longDate(at) + ' · ' + bits[1] + ' · ' + x.room + ' · with ' + x.staff +
             ' — already booked, nothing to do'
      });
    });

    kids().forEach(function (s) {
      dated(s).forEach(function (x) {
        if (x.date < from) return;
        var c = classOf(x.classId);
        var at = isoDate(x.date);
        items.push({
          key: x.date, mins: minutes(x.at), on: at, who: firstName(s.name),
          lead: ui.timechip(chipTime(c ? c.time : x.at)),
          title: firstName(s.name) + ' · ' + (c ? className(c) : 'Class'),
          sub: longDate(at) + ' · ' + (c ? c.time : x.at) + ' · ' + plural(x.hours, 'hour') +
               (c ? ' · ' + c.room + ' · with ' + c.staff : '')
        });
      });
    });

    items.sort(function (a, b) {
      if (a.key === b.key) return a.mins - b.mins;
      return a.key < b.key ? -1 : 1;
    });
    return items;
  }

  /* The soonest class, with the one button that can change it. */
  function nextClassCard(list) {
    var first = list.length ? list[0] : null;
    var same = first ? list.filter(function (x) { return x.key === first.key; }) : [];

    var rows = same.map(function (x) {
      return {
        lead: x.lead,
        title: esc(x.title),
        sub: esc(x.sub),
        end: ui.btn({
          label: x.who + ' can’t come',
          kind: 'quiet',
          size: 'sm',
          msg: 'Thank you — we have told the studio that ' + x.who +
               ' will not be in on ' + longDate(x.on)
        })
      };
    });

    /* When the class in front of you is itself a make-up, the cancel rule
       below would promise something the signed policy does not give. */
    var isMakeup = same.filter(function (x) { return x.makeup; }).length > 0;

    return ui.card({
      title: 'Next class',
      flush: true,
      note: rows.length
        ? 'Cancel at least ' + D.RULES.cancelNotice + ' before the class, here in the portal, ' +
          'and you can take a make-up. Later than that, or a no-show, and ' +
          lower(D.RULES.lateCancel) +
          (isMakeup ? ' A make-up cannot ' + lower(neverRebooked()) + '.' : '')
        : null
    }, rows.length
      ? ui.rows(rows)
      : ui.empty('No class booked',
          'Nothing is booked for ' + andList(kids().map(function (s) { return firstName(s.name); })) +
          ' yet. Your schedule will show the days you chose.'));
  }

  /* ---- coming up ------------------------------------------------------------ */

  function comingCard(list) {
    var rest = list.length
      ? list.filter(function (x) { return x.key !== list[0].key; })
      : [];

    return ui.card({
      title: 'Coming up',
      head: ui.btn({ label: 'See your schedule', kind: 'quiet', size: 'sm', to: 'fSchedule' }),
      flush: true,
      note: 'A make-up is taken within ' + makeupWindow() + ', in ' + lower(D.RULES.makeupWhere)
    }, rest.length
      ? ui.rows(rest.map(function (x) {
          return { lead: x.lead, title: esc(x.title), sub: esc(x.sub) };
        }))
      : ui.empty('Nothing else booked', 'The next class above is the only one on your schedule.'));
  }

  /* ---- this cycle -------------------------------------------------------------
     Hours used of hours bought, per child, and the sentence the owner asked
     for: when the next invoice comes and the dates it covers. A plan belongs
     to one child, so two children bill on different days — which is the whole
     reason this is a row per child and not one line about the family. */

  function cycleRows() {
    var stopping = String(fam().plan).indexOf('not renewing') !== -1;

    return kids().map(function (s) {
      var p = D.plan(s);
      var who = firstName(s.name);
      var end = ui.btn({ label: 'See ' + who, kind: 'quiet', size: 'sm', to: 'fChild', id: s.id });

      if (!p.isPlan) {
        return {
          lead: ui.mute('—'),
          title: esc(who + ' · no plan'),
          sub: esc('Camp, no-school days, private classes and pop-ups are paid for when you ' +
                   'book them. There is no plan and nothing to renew.'),
          end: end
        };
      }

      var spare = looseHours(s);
      var last = p.renewsOn;
      var text = p.hours + ' hours a month · ' + price(p.price) + '. ';

      if (stopping) {
        text += 'This plan is not renewing' +
                (last ? ', and ' + who + '’s last class ' +
                        (behindUs(isoDate(last.date)) ? 'was ' : 'is ') +
                        longDate(isoDate(last.date))
                      : '') +
                '. Nothing more is charged.';
      } else if (last) {
        /* The invoice is raised on the last class of the cycle. A class is
           marked after it is taught, so that date can be a day or two behind
           us — and a page dated today must not call a past day a coming one. */
        var on = isoDate(last.date);
        var covers = dateList(nextCycleDates(p));
        var how = fam().autopay ? ' It is taken from ' + cardName() + '.'
                                : ' We will ask you for it.';
        text += behindUs(on)
          ? who + '’s last class of this cycle was ' + longDate(on) + ', so your next ' +
            'invoice, ' + price(p.price) + ', covers ' + covers + '.' + how
          : 'Your next invoice, ' + price(p.price) + ', comes on ' + who +
            '’s last class of this cycle, ' + longDate(on) + ', and covers ' + covers + '.' + how;
      } else {
        text += 'No class is booked for the rest of this cycle, so there is no invoice date yet.';
      }

      if (spare) {
        text += ' ' + plural(spare, 'hour') + (spare === 1 ? ' is' : ' are') + ' not booked.';
      }

      return {
        lead: ui.timechip(p.leftHours + 'h left', spare ? 'amber' : null),
        title: esc(who + ' · ' + p.usedHours + ' of ' + p.hours + ' hours used this cycle'),
        sub: esc(text),
        end: end
      };
    });
  }

  function cycleCard() {
    var rows = cycleRows();
    return ui.card({
      title: 'This cycle',
      head: ui.btn({ label: 'See billing', kind: 'quiet', size: 'sm', to: 'fBilling' }),
      flush: true,
      note: D.RULES.unusedHours + ' Your plan runs to ' + D.PLAN_YEAR.ends + ' and ends there.'
    }, rows.length
      ? ui.rows(rows)
      : ui.empty('No plan yet', 'Choose your hours and your day, and this is where they will show.'));
  }

  /* ---- the studio's news --------------------------------------------------- */

  function stamp(when) {
    var p = String(when).split(' ');
    return Number(p[2]) * 10000 + (MON.indexOf(p[1]) + 1) * 100 + Number(p[0]);
  }
  /* A scheduled announcement has not gone out yet, so the family cannot see
     it. Everything else the studio has published is here, newest first. */
  function published() {
    return D.ANNOUNCEMENTS.filter(function (a) {
      return a.status !== 'Scheduled';
    }).sort(function (a, b) { return stamp(b.when) - stamp(a.when); });
  }

  function newsCard() {
    return ui.card({
      title: 'From the studio',
      flush: true,
      note: 'Announcements are one-way. If you need to reply, send a message and we will ' +
            'answer you directly.'
    }, ui.rows(published().map(function (a) {
      return { lead: esc(plainDate(a.when)), title: esc(a.head), sub: esc(a.body) };
    })));
  }

  /* ---- home -------------------------------------------------------------------
     The header carries one button. The two ways to reach a person are in a bar
     pinned to the foot of the page, where they cannot be scrolled past. */

  Grove.screen('fHome', {
    surface: 'family',
    crumbTitle: 'Home',
    eyebrow: function () { return longDate(today()).toLowerCase(); },
    title: function (ctx) { return 'Morning, ' + firstName(ctx.persona.name); },
    sub: function () {
      var n = todos().length;
      if (!n) return 'Nothing needs you today. Here is what is coming up.';
      return n + ' thing' + (n === 1 ? '' : 's') + ' need' + (n === 1 ? 's' : '') +
        ' you. Everything else is in hand.';
    },
    actions: [
      { label: 'Billing', to: 'fBilling' }
    ],

    body: function () {
      var list = todos();
      var soon = coming();

      var waiting = list.length
        ? list.map(ui.notice).join('')
        : ui.notice({
            kind: 'ok',
            title: 'Nothing needs you today',
            text: 'Nothing to sign and nothing to pay. Here is what is coming up.'
          });

      var hint = list.length === 1
        ? '1 thing still needs you, at the top of this page'
        : (list.length
            ? list.length + ' things still need you, at the top of this page'
            : 'Nothing needs you today');

      return h`
        <div class="section">${raw(waiting)}</div>
        <div class="section">${raw(nextClassCard(soon))}</div>
        <div class="section">${raw(comingCard(soon))}</div>
        <div class="section">${raw(cycleCard())}</div>
        <div class="section">${raw(newsCard())}</div>
        ${raw(ui.formActions([
          { label: 'Message the studio', kind: 'primary', to: 'fMessages' },
          { label: 'Call ' + DESK, msg: 'Ring the desk on ' + DESK + ' and we will do it for you' }
        ], { sticky: true, hint: hint }))}
      `;
    }
  });
})();
