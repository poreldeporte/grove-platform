/* Registration → Confirmation. The last screen of the enrollment flow.

   MOVED ONTO THE SETTLED PRICING MODEL. A plan is HOURS A MONTH and only
   After-School has one. The parent picks the day and time at registration and
   it is fixed for the program year, so a cycle is a set of dates, the month's
   hours are spent by those dated classes, the invoice is raised on the last
   class of a cycle and covers the next one, and the plan runs to the end of
   the school year and ends by itself.

   What that cost this file:

     - the pack vocabulary is gone. No pack, no "sessions", no "renews on the
       8th class", no "nothing expires". The unit is an hour: the screen
       confirms the hours a month, what they cost, the rate an hour those
       hours work out at, and how the parent chose to split them
     - the confirmation now names the DATES. The first cycle is listed day by
       day, and so is the cycle the next invoice covers, because that is the
       line the owner wrote by hand and the reason she keeps control. The
       dates are projected from the class the parent actually ticked and the
       hours they actually bought, never written down
     - the rules a family signs — 24 hours notice, what a late cancellation
       costs, where a make-up may be taken, how long it lasts, no freezing,
       hours not booked are lost, 30 days notice to cancel — are read from
       Grove.data.RULES, and the plan year from Grove.data.PLAN_YEAR, so this
       screen cannot invent its own version of a rule. The make-up window is a
       studio setting with two options and is rendered, not hard-coded
     - camp, no-school days, private classes, pop-ups and parties say plainly
       that they are one-off bookings with no plan, no cycle and no renewal
     - the sibling discount is read off PRICING.as.siblingFeeRelief and applies
       to the registration fee, which is per child per year, not to tuition

   One honest notice rather than a control: if the day and time chosen do not
   cover the hours bought — four fewer, or four more — the screen says so and
   points at the desk. Hours not booked in a cycle are lost, so a parent should
   not find that out later, and moving a day is a phone call, not a feature.

   Kept from the previous pass: the title names every child the booking covers;
   a full class is a waitlist place where nothing at all is charged and every
   line says so; a private class is approved before it is scheduled, so it
   shows a cost once approved and zero due today; the "what to bring" reminder
   appears only on the programmes whose policies expect food.

   The selections are read back from the keys the flow writes, so the figures
   here and on the review step agree. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;
  var P = D.PRICING;

  var DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  var DAY_NAME = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
               'August', 'September', 'October', 'November', 'December'];

  /* The one date on this screen that is not derived: the Monday the program
     year opens. Every other date here is counted from it. flow.js shows the
     same day, so the two steps cannot name different first classes. */
  var OPENS = new Date(2026, 7, 17);
  /* Four class weeks is the studio's month, the same four the review step
     counts: a child on 4 hours taking one one-hour class comes four times, a
     child on 16 taking two-hour classes comes eight. */
  var CYCLE_WEEKS = 4;
  var BDAY_DATE = 'Sat 12 Sep 2026';        /* the date step 2 asks for */
  var REF = 'GRV-8841';

  /* ---- small helpers -------------------------------------------------------- */

  function pick(key, fallback) { return Grove.tab(key, fallback); }
  /* Cents on a whole number are noise. $540, and $67.50 where it matters. */
  function price(n) { return Grove.money(n, { cents: n % 1 !== 0 }); }
  function plural(n, one, many) { return n === 1 ? one : many; }
  function lower(t) { return String(t).charAt(0).toLowerCase() + String(t).slice(1); }
  function cap(t) { return String(t).charAt(0).toUpperCase() + String(t).slice(1); }
  function countWord(n) {
    var words = ['no', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'];
    return words[n] || String(n);
  }
  function row(k, v, tone) { return { k: k, v: esc(v), tone: tone || null }; }
  function strongRow(k, v) {
    return { k: k, v: h`<span class="strong">${v}</span>`, tone: 'grove' };
  }
  function byId(list, id) {
    var i;
    for (i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function andList(list) {
    if (list.length < 2) return list.join('');
    return list.slice(0, list.length - 1).join(', ') + ' and ' + list[list.length - 1];
  }
  function classesFor(p) {
    return D.CLASSES.filter(function (c) { return c.prog === p; });
  }
  function places(c) { var n = c.cap - c.en; return n > 0 ? n : 0; }
  function when(c) { return c.day + ' ' + c.time + ' · ' + c.room; }
  function dayName(c) {
    var i = DAY_ABBR.indexOf(c.day);
    return i === -1 ? c.day : DAY_NAME[i];
  }

  function progId(ctx) {
    var id = ctx && ctx.params ? ctx.params.id : null;
    return D.PROGRAMS[id] ? id : 'as';
  }

  /* ---- dates ------------------------------------------------------------------
     A cycle is a set of dates, so this screen has to be able to count them. It
     counts from the day the program year opens and from the class the parent
     ticked — nothing here is a written-down date. */

  function plusDays(d, n) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  }
  function longDate(d) { return DAY_NAME[d.getDay()] + ' ' + d.getDate() + ' ' + MONTH[d.getMonth()]; }
  function fullDate(d) { return longDate(d) + ' ' + d.getFullYear(); }

  /* '6, 8, 13, 15, 20, 22, 27 and 29 November', and across a month boundary
     '17, 24, 31 August and 7 September' — the line the owner writes by hand.
     The month is named once, at the end of its run, and only the last date in
     the list takes the "and", so a cycle that crosses a month does not read
     with two of them. */
  function dateList(dates) {
    return andList(dates.map(function (d, i) {
      var next = dates[i + 1];
      var endsRun = !next || next.getMonth() !== d.getMonth();
      return d.getDate() + (endsRun ? ' ' + MONTH[d.getMonth()] : '');
    }));
  }

  /* How long a class is, measured off its own time range rather than written
     down a second time: '3:15–4:15pm' is an hour, '4:30–6:30pm' is two. */
  function minutesOf(text, mer) {
    var hm = String(text).replace(/(am|pm)/i, '').split(':');
    var hour = Number(hm[0]) % 12;
    if (/pm/i.test(mer)) hour += 12;
    return hour * 60 + Number(hm[1] || 0);
  }
  function hoursOf(c) {
    var parts = String(c.time).split('–');
    if (parts.length < 2) return 1;
    var endMer = (/(am|pm)/i.exec(parts[1]) || [''])[0];
    var startMer = (/(am|pm)/i.exec(parts[0]) || [endMer])[0];
    var n = (minutesOf(parts[1], endMer) - minutesOf(parts[0], startMer)) / 60;
    return n > 0 ? n : 1;
  }

  /* ---- who is enrolling ------------------------------------------------------ */

  function seedKids() {
    return D.STUDENTS.filter(function (s) { return s.family === 'Johnson'; });
  }
  function kidCount() {
    var n = Number(pick('rKids', 2));
    if (!(n > 0)) n = 1;
    return n > 3 ? 3 : n;
  }
  function kidNames() {
    var seed = seedKids(), out = [], i;
    for (i = 0; i < kidCount(); i++) {
      out.push(seed[i] ? seed[i].name.split(' ')[0] : 'Child ' + (i + 1));
    }
    return out;
  }
  /* A pop-up is bought per ticket, so it can cover fewer children than the
     family added. Everything else covers all of them. */
  function bookedNames(p) {
    var names = kidNames();
    return p === 'pop' ? names.slice(0, popQty()) : names;
  }
  function nameLine(names) {
    if (!names.length) return 'Your child';
    return andList(names);
  }
  function isAre(names) { return names.length === 1 ? ' is' : ' are'; }

  /* ---- the plan: hours a month ------------------------------------------------ */

  var PLAN_KEYS = ['p4', 'p8', 'p12', 'p16'];
  function planKey() {
    /* The flow names the plan on one key; the older key is still read so a
       part-finished booking does not lose the plan the parent chose. */
    var cur = pick('rPlan', pick('rPack', 'p8'));
    return PLAN_KEYS.indexOf(cur) === -1 ? 'p8' : cur;
  }
  function planHours() { return Number(planKey().slice(1)); }
  function planPrice() { return P.as.plans[planKey()]; }
  /* The rate falls as the plan grows. It is the plan's own arithmetic, so it
     is divided out rather than quoted from anywhere. */
  function hourRate() { return planPrice() / planHours(); }
  function planLine() {
    return planHours() + ' hours a month · ' + price(planPrice()) +
      (kidCount() > 1 ? ', per child' : '');
  }

  function asBands() {
    var out = [];
    classesFor('as').forEach(function (c) { if (out.indexOf(c.band) === -1) out.push(c.band); });
    return out;
  }
  function asBand() {
    var seed = seedKids()[0];
    var fallback = seed ? seed.band : asBands()[0];
    var cur = pick('rBand', fallback);
    return asBands().indexOf(cur) === -1 ? fallback : cur;
  }
  function asClassList() {
    return classesFor('as').filter(function (c) { return c.band === asBand(); });
  }
  /* How many days after the program year opens this class first runs. */
  function shiftOf(c) {
    var wd = DAY_ABBR.indexOf(c.day);
    return wd === -1 ? 0 : (wd - OPENS.getDay() + 7) % 7;
  }
  function firstOn(c) { return plusDays(OPENS, shiftOf(c)); }

  /* The weekly places the parent chose, one place per class ticked. The
     defaults are the flow's own: tiles start filled up to the plan wherever
     the age group allows it, classes with places before full ones, so a family
     that changed nothing sees here exactly what the review step showed. */
  function asDefaultIds() {
    var list = asClassList(), want = planHours(), got = 0, out = [], order;
    order = list.filter(function (c) { return places(c); })
      .concat(list.filter(function (c) { return !places(c); }));
    order.forEach(function (c) {
      if (got + hoursOf(c) * CYCLE_WEEKS > want) return;
      out.push(c.id);
      got += hoursOf(c) * CYCLE_WEEKS;
    });
    if (!out.length && order.length) out.push(order[0].id);
    return out;
  }
  function asClasses() {
    var def = asDefaultIds();
    var out = asClassList().filter(function (c) {
      return Grove.toggle('rClass-' + c.id, def.indexOf(c.id) !== -1);
    });
    out.sort(function (a, b) { return shiftOf(a) - shiftOf(b); });
    return out;
  }
  function weeklyHours() {
    return asClasses().reduce(function (n, c) { return n + hoursOf(c); }, 0);
  }
  function monthHours() { return weeklyHours() * CYCLE_WEEKS; }

  /* How the parent split the hours — read off the classes, not asked twice. */
  function splitLine() {
    var list = asClasses(), lens = [], i;
    if (!list.length) return 'Not chosen yet';
    for (i = 0; i < list.length; i++) {
      if (lens.indexOf(hoursOf(list[i])) === -1) lens.push(hoursOf(list[i]));
    }
    if (lens.length === 1) {
      return countWord(list.length) + ' ' + lens[0] + '-hour ' +
        plural(list.length, 'class', 'classes') + ' a week';
    }
    return countWord(list.length) + ' classes a week, ' + weeklyHours() + ' hours in all';
  }

  function classesLine() {
    var list = asClasses();
    if (!list.length) return '';
    if (list.length === 1) return when(list[0]);
    return andList(list.map(function (c) { return c.day + ' ' + c.time; }));
  }
  function classesProse() {
    var list = asClasses();
    if (!list.length) return '';
    if (list.length === 1) {
      return dayName(list[0]) + ' ' + list[0].time + ' in ' + list[0].room +
        ' with ' + list[0].staff;
    }
    return andList(list.map(function (c) { return dayName(c) + ' ' + c.time; }));
  }

  /* ---- the cycle ---------------------------------------------------------------
     The day and time are fixed for the program year, so a cycle is simply four
     weeks of them. Two are projected the way the review step projects them:
     the cycle the family starts on, and the one the next invoice covers. */

  function cycleDates(cycle) {
    var out = [];
    asClasses().forEach(function (c) {
      var w;
      for (w = 0; w < CYCLE_WEEKS; w++) {
        out.push(plusDays(firstOn(c), (cycle * CYCLE_WEEKS + w) * 7));
      }
    });
    out.sort(function (a, b) { return a - b; });
    return out;
  }
  function firstCycle() { return cycleDates(0); }
  function nextCycle() { return cycleDates(1); }
  function lastOfCycle() {
    var list = firstCycle();
    return list.length ? list[list.length - 1] : null;
  }
  function firstClassDate() {
    var list = firstCycle();
    return list.length ? list[0] : null;
  }

  /* ---- the rules the family signed --------------------------------------------
     Every one of these is read from Grove.data.RULES. The expiry window is a
     studio setting with two options, so it is rendered rather than chosen. */

  function makeupWindow() {
    var w = String(D.RULES.makeupWindow);
    return /^\d/.test(w) ? w : 'the ' + w;
  }

  /* A class with no place left is a waitlist place: nothing is booked and
     nothing is charged. */
  function asFull() {
    return asClasses().filter(function (c) { return !places(c); });
  }
  function asWaiting() { return asFull().length > 0; }
  function asWaitText() {
    var full = asFull();
    if (!full.length) return '';
    if (full.length === 1) return 'number ' + (full[0].wl + 1) + ' on the list';
    return andList(full.map(function (c) {
      return 'number ' + (c.wl + 1) + ' on ' + dayName(c);
    }));
  }

  /* ---- the one-off programmes --------------------------------------------------- */

  function campClass() {
    var list = classesFor('camp');
    return byId(list, pick('rWeek', '')) || list[0] || null;
  }
  function campDays() {
    return DAYS.filter(function (d) { return Grove.toggle('rcDay-' + d, true); });
  }
  function campExtra() {
    var n = Number(pick('rXhr', 0));
    return n > 0 ? (n > 3 ? 3 : n) : 0;
  }

  function nsdClass() {
    var list = classesFor('nsd');
    return byId(list, pick('rDate', '')) || list[0] || null;
  }
  function nsdHours() {
    var n = Number(pick('rHours', 3));
    return n >= 3 && n <= P.nsd.maxHours ? n : 3;
  }
  function nsdStart(c) { return String(c.time).split('–')[0]; }
  function nsdEnd(c) {
    var end = (parseInt(c.time, 10) || 9) + nsdHours();
    return (end > 12 ? end - 12 : end) + ':00pm';
  }

  function privHours() {
    var n = Number(pick('rPhours', 1));
    return n >= 1 && n <= P.priv.maxHours ? n : 1;
  }

  function popEvent() {
    return byId(P.pop.events, pick('rEvent', '')) || P.pop.events[0];
  }
  function popQty() {
    var n = Number(pick('rQty', 1));
    if (!(n > 0)) n = 1;
    return n > kidCount() ? kidCount() : n;
  }
  function popClass(ev) {
    var list = classesFor('pop'), i;
    for (i = 0; i < list.length; i++) if (list[i].name.indexOf(ev.label) !== -1) return list[i];
    return null;
  }
  function popWhen(ev) {
    var c = popClass(ev);
    return c ? when(c) : String(ev.sub).split(' · ')[0];
  }

  /* ---- what it costs — every figure from Grove.data.PRICING ------------------- */

  /* After-school, itemised exactly as the running total on step 3 itemises it.
     The registration fee is per child per year and the sibling relief comes
     off that fee, never off the tuition. */
  function asMoney() {
    var n = kidCount();
    var base = planPrice() * n;
    var fee = P.as.regFee * n;
    var relief = P.as.regFee * P.as.siblingFeeRelief * (n - 1);
    return { n: n, base: base, fee: fee, relief: relief, invoice: base + fee - relief };
  }
  function asBreakdown() {
    var q = asMoney();
    var plans = q.n === 1
      ? planHours() + ' hours a month, ' + price(q.base)
      : q.n + ' plans of ' + planHours() + ' hours at ' + price(planPrice()) + ' each, ' + price(q.base);
    return plans + ', plus ' + price(q.fee) + ' registration for ' +
      plural(q.n, 'one child', q.n + ' children') +
      (q.relief ? ' less ' + price(q.relief) + ' sibling discount' : '') +
      ' — ' + price(q.invoice) + '.';
  }

  function campTotal() {
    var n = kidCount(), days = campDays().length;
    var base = (days === DAYS.length ? P.camp.week : days * P.camp.day) * n;
    return base + campExtra() * P.camp.extraHour * days * n + P.camp.regFee * n;
  }
  function nsdTotal() {
    var n = kidCount();
    return (P.nsd.base + (nsdHours() - 3) * P.nsd.extraHour) * n + P.nsd.regFee * n;
  }
  function privTotal() {
    var n = kidCount();
    return P.priv.hourly * privHours() * n + P.priv.regFee * n;
  }
  function popTotal() {
    var q = popQty();
    return popEvent().amount * q + P.pop.regFee * q;
  }

  function moneyRows(p) {
    if (p === 'as') {
      return [
        row(asWaiting() ? 'First invoice, if a place opens' : 'First invoice', price(asMoney().invoice)),
        strongRow('Due today', price(0))
      ];
    }
    if (p === 'camp') return [strongRow('Paid today', price(campTotal()))];
    if (p === 'nsd') return [strongRow('Paid today', price(nsdTotal()))];
    if (p === 'pop') return [strongRow('Paid today', price(popTotal()))];
    /* A private is approved before it is scheduled, so nothing is taken on
       submit — the same two rows step 3 shows. */
    if (p === 'priv') {
      return [row('Cost once approved', price(privTotal())), strongRow('Due today', price(0))];
    }
    return [strongRow('Cost', 'Quote to follow')];
  }

  /* ---- the one-line summary under the title ----------------------------------- */

  function bookedLine(p) {
    var c, ev, hrs, days, first;

    if (p === 'as') {
      if (!asClasses().length) return 'Your place is being held while we find the right class.';
      if (asWaiting()) {
        return planLine() + ' · ' + classesProse() + ', ' + asWaitText() + '.';
      }
      first = firstClassDate();
      return planLine() + ' · ' + classesProse() +
        (first ? ', every week from ' + fullDate(first) + '.' : '.');
    }
    if (p === 'camp') {
      c = campClass();
      if (!c) return '';
      days = campDays().length;
      return c.name + ', ' +
        (days === DAYS.length || !days ? c.day : days + plural(days, ' day', ' days')) + ', ' +
        c.time + ' in ' + c.room + '.';
    }
    if (p === 'nsd') {
      c = nsdClass();
      return c ? c.name + ', ' + nsdStart(c) + ' to ' + nsdEnd(c) + ' in ' + c.room + '.' : '';
    }
    if (p === 'priv') {
      hrs = privHours();
      return hrs + plural(hrs, ' hour', ' hours') +
        ' one-to-one. We will approve the request and call to agree the time.';
    }
    if (p === 'pop') {
      ev = popEvent();
      c = popClass(ev);
      return c
        ? ev.label + ', ' + c.day + ' ' + c.time + ' in ' + c.room + '.'
        : ev.label + ', ' + popWhen(ev) + '.';
    }
    /* The title carries the first half of this sentence. */
    return 'We will read it and reply with a written quote and a deposit request.';
  }

  /* ---- the two cards ------------------------------------------------------------ */

  function bookedTitle(p) {
    if (p === 'as' && asWaiting()) return 'What you asked for';
    if (p === 'priv' || p === 'bday') return 'What you asked for';
    return 'What you booked';
  }
  function footLabel(p) {
    if (p === 'bday' || p === 'priv') return 'Request received';
    if (p === 'as' && asWaiting()) return 'On the waitlist';
    return 'Confirmed';
  }

  function bookedRows(p) {
    var pr = D.program(p), rows = [], c, ev, hrs, list, first;

    rows.push({ k: 'Program', v: h`${raw(ui.dot(pr.color))} ${pr.name}` });

    if (p === 'as') {
      list = asClasses();
      rows.push(row('Plan', planLine()));
      rows.push(row('Rate', price(hourRate()) + ' an hour'));
      rows.push(row('Your split', splitLine()));
      rows.push(row('Age group', 'Ages ' + asBand()));
      rows.push(list.length
        ? row(plural(list.length, 'Class', 'Classes'), classesLine())
        : row('Class', 'Not chosen', 'mute'));

      if (asWaiting()) {
        rows.push(row('Waitlist', cap(asWaitText())));
        rows.push(row('First class', plural(asFull().length,
          'The week after a place is offered', 'The week after the places are offered')));
      } else {
        first = firstClassDate();
        rows.push(first ? row('First class', fullDate(first))
                        : row('First class', 'To be confirmed', 'mute'));
        rows.push(firstCycle().length
          ? row('This cycle', dateList(firstCycle()))
          : row('This cycle', 'Dated once you have a class', 'mute'));
      }
      rows.push(row('Plan year', D.PLAN_YEAR.label + ' · ends ' + D.PLAN_YEAR.ends));

    } else if (p === 'camp') {
      c = campClass();
      rows.push(c ? row('Camp', c.name) : row('Camp', 'Not chosen', 'mute'));
      rows.push(c ? row('Each day', c.time + ' · ' + c.room) : row('Each day', 'Not chosen', 'mute'));
      rows.push(campDays().length
        ? row('Days', campDays().length === DAYS.length ? 'Full week' : campDays().join(', '))
        : row('Days', 'None chosen', 'mute'));
      if (campExtra()) {
        rows.push(row('Extra hours', '+' + campExtra() + plural(campExtra(), ' hr', ' hrs') + ' a day'));
      }
      rows.push(row('Plan', 'None — a one-off booking'));

    } else if (p === 'nsd') {
      c = nsdClass();
      rows.push(c ? row('Date', c.name) : row('Date', 'Not chosen', 'mute'));
      rows.push(c ? row('Hours', nsdStart(c) + ' to ' + nsdEnd(c))
                  : row('Hours', nsdHours() + ' hours'));
      rows.push(c ? row('Room', c.room) : row('Room', 'To be confirmed', 'mute'));
      rows.push(row('Plan', 'None — a one-off booking'));

    } else if (p === 'priv') {
      hrs = privHours();
      rows.push(row('Hours', hrs + plural(hrs, ' hour', ' hours') + ' at ' +
        price(P.priv.hourly) + ' an hour, per child'));
      rows.push(row('Scheduling', 'Approved, then agreed with you'));
      rows.push(row('Plan', 'None — a one-off booking'));

    } else if (p === 'pop') {
      ev = popEvent();
      c = popClass(ev);
      rows.push(row('Event', ev.label));
      rows.push(row('When', popWhen(ev)));
      rows.push(c ? row('Ages', c.band) : row('Ages', 'All ages'));
      rows.push(row('Plan', 'None — a one-off booking'));

    } else {
      rows.push(row('Where', 'At the studio'));
      rows.push(row('Preferred date', BDAY_DATE));
    }

    if (p !== 'bday') rows.push(row('Children', nameLine(bookedNames(p))));

    return rows.concat(moneyRows(p));
  }

  function step(color, title, text) {
    return { title: h`${raw(ui.dot(color))} ${title}`, sub: esc(text) };
  }

  /* The two rules every after-school family signs, in the studio's own words
     rather than this screen's. */
  function makeupStep(color) {
    return step(color, 'Cancel ' + D.RULES.cancelNotice + ' ahead and you get a make-up',
      'Later than that, or a no-show, and ' + lower(D.RULES.lateCancel) +
      ' A make-up is taken within ' + makeupWindow() + ', in ' + lower(D.RULES.makeupWhere));
  }
  function yearStep(color) {
    return step(color, 'Your plan runs to ' + D.PLAN_YEAR.ends + ' and ends there',
      D.PLAN_YEAR.note + ' To stop before then: ' + D.RULES.cancelPlan);
  }

  function nextRows(p) {
    var color = D.program(p).color, q, first, last, who;

    if (p === 'as') {
      q = asMoney();
      if (asWaiting()) {
        return [
          step(color, 'Waitlist confirmation, by email',
            plural(asFull().length,
              'The class you asked for, your place on the list and what the invoice would be.',
              'The classes you asked for, your places on the list and what the invoice would be.')),
          step(color, 'Nothing has been charged',
            'Joining the list is free, and nothing is charged while you wait.'),
          step(color, cap(asWaitText()),
            'Places are offered in the order families join. Nobody is turned away.'),
          step(color, 'If a place opens you have 24 hours',
            'We email you the moment one does. Accept, and a secure payment link follows.'),
          step(color, 'What that first invoice covers', asBreakdown()),
          step(color, 'Your dates start when your place does',
            'Your day and time are then fixed for the program year, and the first cycle is ' +
            'dated from your first class. Nothing is charged, and nothing renews, while you wait.'),
          yearStep(color)
        ];
      }

      first = firstClassDate();
      last = lastOfCycle();
      who = bookedNames('as');

      return [
        step(color, 'Enrollment confirmation, by email',
          'Your hours, your day and time, the dates of this cycle and the day the next ' +
          'invoice comes.'),
        step(color, 'A secure payment link for ' + price(q.invoice), asBreakdown()),
        step(color, first ? 'First class ' + fullDate(first) : 'Your first class',
          first
            ? 'The program year opens then. This cycle is ' + dateList(firstCycle()) +
              '. All materials are provided — dress for mess.'
            : 'We will confirm the day and time, and date your first cycle from it. All ' +
              'materials are provided — dress for mess.'),
        step(color, 'Your next invoice comes on ' +
          (last && who.length === 1 ? who[0] + '’s' : 'the') + ' last class of this cycle',
          (last ? 'That is ' + longDate(last) + ', ' + price(q.base) + ', and it covers ' +
                  dateList(nextCycle()) + '. '
                : 'We date it as soon as your day and time are set. ') +
          'Your day and time are fixed for the program year, so every cycle after this one ' +
          'is the same class on the same day.'),
        makeupStep(color),
        step(color, 'Book your hours inside the cycle',
          D.RULES.unusedHours + ' ' + D.RULES.freeze),
        yearStep(color)
      ];
    }

    if (p === 'bday') {
      return [
        step(color, 'A written quote, by email',
          'It lists everything you ticked, priced individually.'),
        step(color, 'A deposit request with it',
          'The date is held once the deposit is paid.'),
        step(color, 'Your date, ' + BDAY_DATE,
          'We confirm what is free when we quote.')
      ];
    }

    if (p === 'priv') {
      return [
        step(color, 'Check your email',
          'A copy of the request and of the policies you signed.'),
        step(color, 'We review the request',
          'Sending it does not reserve an instructor or a room.'),
        step(color, 'We call to agree the time',
          'Once the request is approved we contact you to set the day and the hour.'),
        step(color, 'Then a payment link for ' + price(privTotal()),
          'Nothing is charged until the class is confirmed. A private class is a one-off ' +
          'booking: there is no plan and nothing renews.')
      ];
    }

    return [
      step(color, 'Check your email',
        'Receipt, a copy of the policies you signed, and what to bring on the first day.'),
      step(color, 'Your place is held',
        'It is on the roster from today. Nobody else can take it.'),
      step(color, 'Nothing further to pay',
        'A single payment. There is no plan, no cycle and nothing renews.'),
      step(color, 'A booked day is a held place',
        'Missing it does not move the day. Camps, day camps and pop-ups are non-refundable.')
    ];
  }

  /* The first-day reminder is the studio's own announcement, word for
     word. It asks you to send a snack, so it is shown only on the programmes
     whose policies expect food — after-school families agree to the opposite. */
  function bringText() {
    var a = D.ANNOUNCEMENTS.filter(function (x) {
      return x.head.toLowerCase().indexOf('what to bring') !== -1;
    })[0];
    return a ? a.body : '';
  }

  /* Hours not booked in a cycle are lost, so if the day and time chosen do not
     cover the hours bought, the screen says so once and points at the desk.
     Moving a day is a phone call, not a control on this page. */
  function splitNotice() {
    var want = planHours(), got = monthHours();
    if (!asClasses().length || asWaiting() || got === want) return '';
    if (got < want) {
      return ui.notice({
        kind: 'warn',
        title: 'Not all of your hours are on a day yet',
        text: 'Your plan buys ' + want + ' hours a month and your day and time cover ' + got +
          '. ' + D.RULES.unusedHours + ' Ring the desk on ' + D.STUDIO.phone +
          ' and we will add the day that suits you.'
      });
    }
    return ui.notice({
      kind: 'warn',
      title: 'Your days use more hours than the plan buys',
      text: 'Your plan buys ' + want + ' hours a month and your day and time cover ' + got +
        '. Ring the desk on ' + D.STUDIO.phone + ' and we will either move you up a plan or ' +
        'take a day off.'
    });
  }

  function reminder(p) {
    if (p === 'as') return splitNotice();
    if (p === 'bday') {
      return ui.notice({
        kind: 'ok',
        title: 'Nothing is charged today',
        text: 'We price parties individually and reply with a written quote.'
      });
    }
    if (p !== 'camp' && p !== 'nsd' && p !== 'pop') return '';
    var bring = bringText();
    if (!bring) return '';
    return ui.notice({ kind: 'ok', title: 'What to bring on the first day', text: bring });
  }

  /* ---- the screen ----------------------------------------------------------------- */

  Grove.screen('rDone', {
    surface: 'registration',
    keepSurface: true,
    crumbTitle: 'Confirmation',
    eyebrow: function (ctx) {
      var p = progId(ctx);
      if (p === 'bday' || p === 'priv') return 'request sent';
      return p === 'as' && asWaiting() ? 'on the waitlist' : 'all booked';
    },
    title: function (ctx) {
      var p = progId(ctx);
      if (p === 'bday') return 'Your party request is with us';
      if (p === 'priv') return 'Your private class request is with us';
      var names = bookedNames(p);
      if (p === 'as') {
        return nameLine(names) + isAre(names) + (asWaiting() ? ' on the waitlist' : ' enrolled');
      }
      return nameLine(names) + isAre(names) + ' booked in';
    },
    sub: function (ctx) {
      var p = progId(ctx);
      if (p === 'bday') return bookedLine(p);
      if (p === 'as' && asWaiting()) {
        return bookedLine(p) + ' Nothing has been charged, and a copy of everything you ' +
          'signed is on its way to you.';
      }
      return bookedLine(p) + ' A copy of everything you signed is on its way to you.';
    },

    body: function (ctx) {
      var p = progId(ctx);
      var note = reminder(p);

      var booked = ui.card({
        title: bookedTitle(p),
        foot: h`<span class="mute">${footLabel(p)} · ${REF}</span>`
      }, ui.kv(bookedRows(p)));

      var next = ui.card({ title: 'What happens next', flush: true }, ui.rows(nextRows(p)));

      return h`${raw(ui.grid(2, [booked, next]))}
        ${raw(note ? '<div class="section">' + note + '</div>' : '')}
        ${raw(ui.formActions([
          /* A parent who booked from inside the portal is already in it. */
          Grove.state.surface === 'family'
            ? { label: 'Back to home', kind: 'primary', to: 'fHome' }
            : { label: 'Open the family portal', kind: 'primary', to: 'fHome' },
          { label: 'Book something else', to: 'rPick' }
        ]))}`;
    }
  });
})();
