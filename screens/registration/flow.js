/* Registration → the enrollment flow, for all six programmes.

   FIVE STEPS BECAME THREE, for every programme.
     1. Who      the old step 1 (your family) and step 2 (children) merged.
                 They asked for the same kind of thing on two screens.
     2. What     the old step 3 — the one programme-specific decision.
     3. Confirm  the old step 4 (safety questions and policies) and step 5
                 (review and pay) merged, so what you are agreeing to and what
                 it costs sit on one screen.
   Birthday already ran three steps and keeps them, renamed to match.

   Also cut, and why:
     - "Contact 2" on the old step 1 asked for the same person as the
       "Emergency contact" on the old step 4. It is one card now, on step 3.
     - Home phone, work phone, confirm email and confirm password are gone.
       One number and one address per person is enough to reach someone.
     - After-school asked for a plan, an age group, how to split the hours,
       and then a day-and-time chip builder. It now asks for the plan, the age
       group and the actual classes, so the places shown are the real ones.
     - "Add individual classes" left registration — an extra class is
       arranged with the studio once a child is enrolled and charged as a
       one-off to the card on file.
     - Camp asked for a week, then full week or days, then the days. Choosing
       the days is the same decision: five days is the week.
     - Camp extra hours are chosen once for the booking, not day by day.
     - The birthday cake block only appeared once Cake was ticked and asked
       three questions the notes field already covers.
     - The scripted card decline on first submit is gone.
     - The three right-hand aside boxes became notes on the cards they explain.
     - "Cell" on the main contact asked for the household number a second
       time. One number per family, asked once.
     - All four after-school plans ended "· assigned by age group". The
       age-group card says it once.

   Every amount is computed from Grove.data.PRICING.

   AFTER-SCHOOL IS A PLAN OF HOURS A MONTH. This file has billed it two wrong
   ways — as a monthly subscription of hours a week, and then as a pack of
   sessions that renewed on a class. Neither is what families sign. A plan is
   HOURS A MONTH — 4, 8, 12 or 16, priced from PRICING.as.plans, the rate per
   hour falling as the plan grows — and the parent then chooses how to split
   those hours across the week, which is the question the live registration
   form asks. Only after-school has a plan. Camp, no-school days, privates,
   pop-ups and parties are one-off bookings with no plan, no cycle and no
   renewal, and nothing about them changed here.

   What the hours model deleted, rather than renamed:
     - the pack. PACK_KEYS, packSize(), packPerClass(), packLabel(),
       renewsText(), ORDS and ordinal() went with it, and with them every
       "pack of 8", "sessions used" and "renews on the eighth class" line.
     - the idea that a session is a class. A class spends its own length, so
       classHours() reads that off the class's own time: a 16-hour plan is
       eight visits a month taken two hours at a time and sixteen taken one
       hour at a time, and both are right.
     - "sessions never expire". Hours not booked in a cycle are lost, which is
       D.RULES.unusedHours, said on the card where the hours are split.
     - the make-up credit, and its opposite. Cancel 24 hours ahead and you get
       a make-up; later than that the class is used. That sentence, and the
       four things a make-up cannot do, are read from D.RULES so this screen
       cannot invent a version of them. The expiry window is
       D.RULES.makeupWindow, rendered as it is set rather than hard-coded,
       because the studio is moving from "same cycle" to "30 days from the
       missed class" and the setting is the one that decides.
     - "there is no billing date". A cycle is a SET OF DATES. The day and time
       are picked at registration and fixed for the program year, so the
       cycle's dates are counted forward from the first class, and the review
       step names the class the next invoice falls on and lists the dates it
       covers. The owner did this by hand; it is how she keeps control.
     - "stopping is the pack not renewing". The plan is an annual commitment:
       it runs to D.PLAN_YEAR.ends and ends there by itself, and leaving early
       is D.RULES.cancelPlan.

   Not built, on purpose: extra classes when a school finishes later than the
   program, an event, a private that comes up. Those are one manual charge the
   studio posts against the card on file, so this screen only has to say they
   exist rather than model them.

   A plan belongs to one child, so tuition is charged per child and the review
   step names each of them. The registration fee is PRICING.as.regFee per
   child per year with PRICING.as.siblingFeeRelief off it for the second and
   third child — relief on the fee, never on tuition.

   A waitlisted place is charged nothing. When a class you chose is full the
   running total itemises the invoice that would follow a place being offered
   and then says, in the same card, that today's figure is zero — so the plum
   banner and the money can no longer disagree. Everything else on the screen
   (the sub-heading, the review rows, the dates card, the commitment card and
   the footnote) reads that one state from asWaiting().

   A private class is the same shape: the policies, the "How a private is
   booked" card and the step-2 note all say it is approved before it is
   scheduled and charged, so the money card itemises the invoice, shows zero
   due today, and the button sends a request instead of asking for money the
   page says is not taken. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;
  var P = D.PRICING;

  var DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  var GRADES = ['1st grade', '2nd grade', '3rd grade', '4th grade', '5th grade', '6th grade'];

  /* The day the program year opens, kept word for word with the confirmation
     screen so the two cannot drift apart. Every other date on this screen is
     counted forward from it rather than written down. */
  var FIRST_CLASS = 'Monday 17 Aug 2026';

  /* A cycle is four weeks of the days the parent chose, so one one-hour class
     a week is four hours a month. */
  var CYCLE_WEEKS = 4;
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var WEEKDAY = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  /* ---- small helpers ------------------------------------------------------ */

  function m(n) { return Grove.money(n); }
  function m0(n) { return Grove.money(n, { cents: false }); }
  /* An hourly rate carries cents only when it has them: $70, but $67.50. The
     programme picker prints the same rates the same way. */
  function rate(n) { return Grove.money(n, { cents: n % 1 !== 0 }); }
  function sec(inner) { return '<div class="section">' + inner + '</div>'; }
  function head(title, right) {
    return '<div class="section-head"><h2 class="section-title">' + esc(title) + '</h2>' +
      (right || '<span></span>') + '</div>';
  }
  function row(k, v, tone) { return { k: k, v: esc(v), tone: tone || null }; }
  function plural(n, one, many) { return n === 1 ? one : many; }
  function hint(text) { return '<p class="hint">' + esc(text) + '</p>'; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function uniq(list) {
    var out = [];
    list.forEach(function (x) { if (out.indexOf(x) === -1) out.push(x); });
    return out;
  }
  function hoursWord(n) { return n + plural(n, ' hour', ' hours'); }
  function lowerFirst(s) { return s.charAt(0).toLowerCase() + s.slice(1); }

  /* ---- dates, because a cycle is a set of them ---------------------------
     The parent picks their day and time once and keeps it for the program
     year, so every date here is the same weekday counted forward from the day
     the year opens. Nothing is written down twice. */

  function yearStart() {
    var p = FIRST_CLASS.split(' ');
    return new Date(Number(p[3]), MONTHS.indexOf(p[2]), Number(p[1]));
  }
  /* The nth weekly occurrence of a class, from the first one on or after the
     day the program year opens. */
  function dateOf(c, week) {
    var d = yearStart();
    while (d.getDay() !== WEEKDAY[c.day]) d.setDate(d.getDate() + 1);
    d.setDate(d.getDate() + week * 7);
    return d;
  }
  function dayMonth(d) { return d.getDate() + ' ' + MONTHS[d.getMonth()]; }
  function datesOf(c, cycle) {
    var out = [], w;
    for (w = 0; w < CYCLE_WEEKS; w++) out.push(dateOf(c, cycle * CYCLE_WEEKS + w));
    return out;
  }
  /* Every date in one cycle, across every class ticked, in order. */
  function cycleDates(cycle) {
    var out = [];
    asClasses().forEach(function (c) { out = out.concat(datesOf(c, cycle)); });
    out.sort(function (a, b) { return a - b; });
    return out;
  }
  function dateList(list) {
    var parts = list.map(dayMonth);
    if (parts.length < 2) return parts.join('');
    return parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1];
  }

  /* ---- flow state ---------------------------------------------------------- */

  function progId(ctx) {
    var id = ctx && ctx.params ? ctx.params.id : null;
    return D.PROGRAMS[id] ? id : 'as';
  }
  function pick(key, fallback) { return Grove.tab(key, fallback); }
  function stepNo() {
    var n = Number(pick('rStep', 0));
    if (!(n > 0)) return 0;
    return n > 2 ? 2 : n;
  }

  Grove.on('rChoose', function (d) {
    var id = String(d.id), i = id.indexOf(':');
    Grove.setTab(id.slice(0, i), id.slice(i + 1));
  });
  Grove.on('rStep', function (d) { Grove.setTab('rStep', Number(d.n)); });
  Grove.on('rKids', function (d) { Grove.setTab('rKids', Number(d.n)); });

  function tile(key, value, cur, o) {
    return ui.choice({
      id: key + ':' + value,
      act: 'rChoose',
      title: o.title,
      sub: o.sub,
      price: o.price,
      on: String(cur) === String(value)
    });
  }
  function check(id, title, sub, def, price) {
    return ui.choice({
      id: id, title: title, sub: sub, price: price, on: Grove.toggle(id, !!def)
    });
  }

  /* ---- the family and the children ------------------------------------------ */

  function fam() { return D.family('johnson'); }
  function seedKids() {
    return D.STUDENTS.filter(function (s) { return s.family === 'Johnson'; });
  }
  function kidCount() {
    var n = Number(pick('rKids', 2));
    if (!(n > 0)) n = 1;
    return n > 3 ? 3 : n;
  }
  function kidList() {
    var seed = seedKids(), out = [], i;
    for (i = 0; i < kidCount(); i++) out.push(seed[i] || null);
    return out;
  }
  function kidNames() {
    return kidList().map(function (k, i) {
      return k ? k.name.split(' ')[0] : 'Child ' + (i + 1);
    });
  }

  /* ---- programme lookups, all read from Grove.data ---------------------------- */

  function classesFor(p) {
    return D.CLASSES.filter(function (c) { return c.prog === p; });
  }
  function places(c) { var n = c.cap - c.en; return n > 0 ? n : 0; }
  function placeLabel(c) {
    var n = places(c);
    return n ? n + plural(n, ' place left', ' places left') : 'Full · join waitlist';
  }
  function byId(list, id) {
    var i;
    for (i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  /* A plan is HOURS A MONTH for one child. The rate per hour falls as the plan
     grows, and that figure is divided out of the plan price rather than
     written down a second time. */
  var PLAN_KEYS = ['p4', 'p8', 'p12', 'p16'];
  function planHours(k) { return Number(k.slice(1)); }
  function planPrice(k) { return P.as.plans[k]; }
  function planRate(k) { return planPrice(k) / planHours(k); }
  function planLabel(k) { return hoursWord(planHours(k)) + ' a month'; }

  /* How long one class runs, read off the time on its own record: after-school
     runs in the afternoon, so a bare hour before noon is a pm hour. A class
     spends its own length, which is why a two-hour class spends two. */
  function hourAt(t) {
    var mm = /(\d+):(\d+)/.exec(String(t));
    var hr = Number(mm[1]), min = Number(mm[2]);
    if (hr < 12) hr += 12;
    return hr + min / 60;
  }
  function classHours(c) {
    var parts = String(c.time).split('\u2013');
    var n = hourAt(parts[1]) - hourAt(parts[0]);
    return n > 0 ? n : 1;
  }
  /* What one weekly place contributes to a month. */
  function monthHours(c) { return classHours(c) * CYCLE_WEEKS; }

  function asBands() {
    var out = [];
    classesFor('as').forEach(function (c) {
      if (out.indexOf(c.band) === -1) out.push(c.band);
    });
    return out;
  }
  function asBand() {
    var seed = seedKids()[0];
    var fallback = seed ? seed.band : asBands()[0];
    var cur = pick('rBand', fallback);
    return asBands().indexOf(cur) === -1 ? fallback : cur;
  }
  function asClassList() {
    var b = asBand();
    return classesFor('as').filter(function (c) { return c.band === b; });
  }
  /* Every plan is offered to every age group. The plan and the split are two
     separate questions: 8 hours a month is one two-hour class a week or two
     one-hour classes a week, and the parent decides which. */
  function planKey() {
    var cur = pick('rPlan', 'p8');
    return PLAN_KEYS.indexOf(cur) === -1 ? 'p8' : cur;
  }

  /* One weekly place per class ticked. The tiles start filled up to the plan
     wherever the age group allows it, so a family that changes nothing has a
     split that already adds up; classes with places left are offered before
     full ones. */
  function classKey(c) { return 'rClass-' + c.id; }
  function asDefaultIds() {
    var list = asClassList();
    var order = list.filter(function (c) { return places(c); })
      .concat(list.filter(function (c) { return !places(c); }));
    var want = planHours(planKey()), got = 0, out = [];
    order.forEach(function (c) {
      if (got + monthHours(c) > want) return;
      out.push(c.id);
      got += monthHours(c);
    });
    if (!out.length && order.length) out.push(order[0].id);
    return out;
  }
  function asClasses() {
    var def = asDefaultIds();
    return asClassList().filter(function (c) {
      return Grove.toggle(classKey(c), def.indexOf(c.id) !== -1);
    });
  }
  function asPerWeek() { return asClasses().length; }
  /* What the split actually comes to. Short of the plan and the difference is
     lost; over it and there is nothing to book the extra hours against. */
  function asChosenHours() {
    return asClasses().reduce(function (t, c) { return t + monthHours(c); }, 0);
  }
  function asSplitText() {
    return asChosenHours() + ' of ' + planHours(planKey()) + ' hours a month';
  }
  function classLabel(c) { return c ? c.day + ' ' + c.time + ' · ' + c.room : 'No place chosen'; }
  function classesLabel() {
    var list = asClasses();
    if (!list.length) return 'No place chosen';
    if (list.length === 1) return classLabel(list[0]);
    return list.map(function (c) { return c.day + ' ' + c.time; }).join(' and ');
  }

  /* True when any class in the booking has no place left, which is the one
     state where nothing at all is charged today. */
  function asFull() {
    return asClasses().filter(function (c) { return !places(c); });
  }
  function asWaiting() { return asFull().length > 0; }
  /* Lower case, so it reads as the tail of a sentence; cap() it where it
     starts one. Positions come from each class's own waitlist length. */
  function asWaitText() {
    var full = asFull();
    if (full.length === 1) return 'number ' + (full[0].wl + 1) + ' on the list';
    return full.map(function (c) {
      return 'number ' + (c.wl + 1) + ' on ' + c.day;
    }).join(' and ');
  }

  function campClass() {
    var list = classesFor('camp');
    return byId(list, pick('rWeek', '')) || list[0] || null;
  }
  function campDays() {
    return DAYS.filter(function (d) { return Grove.toggle('rcDay-' + d, true); });
  }
  function campEndHour() {
    var c = campClass();
    if (!c) return 1;
    return parseInt(String(c.time).split('–')[1], 10) || 1;
  }
  function campHours() {
    var c = campClass();
    return c ? String(c.time).replace('–', ' to ') : 'the same hours';
  }
  function campExtra() {
    var n = Number(pick('rXhr', 0));
    return n > 0 ? (n > 3 ? 3 : n) : 0;
  }

  function nsdClass() {
    var list = classesFor('nsd');
    return byId(list, pick('rDate', '')) || list[0] || null;
  }
  function nsdStartHour() {
    var c = nsdClass();
    return c ? (parseInt(c.time, 10) || 9) : 9;
  }
  function nsdHours() {
    var n = Number(pick('rHours', 3));
    return n >= 3 && n <= P.nsd.maxHours ? n : 3;
  }
  function clockPm(hour24) {
    var hr = hour24 > 12 ? hour24 - 12 : hour24;
    return hr + ':00pm';
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

  /* ---- birthday checklists ------------------------------------------------------ */

  var BTHEMES = ['Squishmallows', 'Unicorns', 'Season of the Year', 'Cowgirl', 'Movie Party',
    'Character Theme', 'Safari / Spa', 'Games & Activities', 'Dance / Disco', 'Glow in the Dark'];
  var BACTS = ['Painting Shoes', 'Tie-Dye', 'Slime', 'Masks', 'Picture Frames',
    'Decorating Jean Jackets', 'Painting Tote Bags', 'Painting Ceramics', 'Bedazzling'];
  var BINCS = ['Cake', 'Goodie Bags', 'Décor', 'Backdrop', 'Balloons', 'Digital Invitation',
    'DJ', 'Food', 'Drinks', 'Plates', 'Napkins'];

  function ticked(prefix, list) {
    return list.filter(function (x) { return Grove.toggle(prefix + x, false); });
  }

  /* ---- pricing — every figure comes from Grove.data.PRICING ------------------------ */

  function quote(p) {
    var n = kidCount(), rows = [], total = 0, label = 'Due today', note = '', value;
    var relief, fee, base, extra, c, ev, q, hrs, days, full, due = null;

    if (p === 'as') {
      var key = planKey();
      base = planPrice(key) * n;
      fee = P.as.regFee * n;
      /* Relief is on the registration fee and never on tuition, and it is the
         studio's own rate rather than a number typed here. */
      relief = P.as.regFee * P.as.siblingFeeRelief * (n - 1);
      total = base + fee - relief;
      var asList = asClasses();
      var short_ = planHours(key) - asChosenHours();
      rows.push(row('Plan', planLabel(key) + (n > 1 ? ' for each child' : '')));
      rows.push(row('Age group', 'Ages ' + asBand()));
      rows.push(asList.length
        ? row(plural(asList.length, 'Day', 'Days'), classesLabel())
        : row('Day', 'Not chosen', 'clay'));
      /* The split is the parent's answer to the plan, so the row shows the two
         against each other rather than either on its own. */
      rows.push(row('Split', asSplitText(), short_ === 0 ? null : 'clay'));
      rows.push(row('Children', String(n)));
      rows.push(row('Tuition', m(base)));
      rows.push(row('Registration fee', m(fee)));
      if (relief) rows.push(row('Sibling discount', '−' + m(relief), 'grove'));
      /* A waitlisted place is not billed. The itemised lines still add up to
         the invoice that would follow a place being offered, so the two
         figures cannot disagree — but today's figure is zero. */
      if (asWaiting()) {
        rows.push(row('First invoice, if a place opens', m(total)));
        label = 'Due today';
        due = 0;
        note = 'Nothing is charged while you are on the waitlist. If a place is offered you ' +
          'have 24 hours to accept, and the invoice above is emailed as a secure payment link.';
      } else {
        label = 'First charge';
        note = 'Emailed as a secure payment link. ' + m0(planPrice(key)) + ' covers ' +
          hoursWord(planHours(key)) + ' a month for ' + (n > 1 ? 'each child' : 'them') +
          ', at ' + rate(planRate(key)) + ' an hour. The next invoice comes on the last class of ' +
          'this cycle and covers the next one. Your plan runs to ' + D.PLAN_YEAR.ends +
          ' and ends there.';
      }

    } else if (p === 'camp') {
      c = campClass();
      days = campDays().length;
      full = days === DAYS.length;
      base = (full ? P.camp.week : days * P.camp.day) * n;
      extra = campExtra() * P.camp.extraHour * days * n;
      fee = P.camp.regFee * n;
      total = base + extra + fee;
      rows.push(c ? row('Camp', c.name) : row('Camp', 'Not chosen', 'mute'));
      rows.push(days ? row('Days', full ? 'Full week' : days + plural(days, ' day', ' days'))
        : row('Days', 'None chosen', 'mute'));
      rows.push(row('Children', String(n)));
      rows.push(row('Camp fee', m(base)));
      rows.push(campExtra()
        ? row('Extra hours', '+' + campExtra() + plural(campExtra(), ' hr', ' hrs') + ' · ' + m(extra))
        : row('Extra hours', 'None', 'mute'));
      rows.push(row('Registration fee', m(fee)));

    } else if (p === 'nsd') {
      c = nsdClass();
      hrs = nsdHours();
      base = (P.nsd.base + (hrs - 3) * P.nsd.extraHour) * n;
      fee = P.nsd.regFee * n;
      total = base + fee;
      rows.push(c ? row('Date', c.name) : row('Date', 'Not chosen', 'mute'));
      rows.push(row('Length', hrs + ' hours'));
      rows.push(row('Children', String(n)));
      rows.push(row('Day rate', m(base)));
      rows.push(row('Registration fee', m(fee)));

    } else if (p === 'priv') {
      hrs = privHours();
      base = P.priv.hourly * hrs * n;
      fee = P.priv.regFee * n;
      total = base + fee;
      rows.push(row('Hours', hrs + plural(hrs, ' hour', ' hours') + ' at ' + m0(P.priv.hourly) + ' an hour'));
      rows.push(row('Children', String(n)));
      /* "Scheduling" was said here and again on the review card beside it. The
         money card keeps the money; the review card keeps the arrangement. */
      rows.push(row('Session', m(base)));
      rows.push(row('Registration fee', m(fee)));
      /* A private is a request, not a booking: the approval policy, the
         "How a private is booked" card and the step-2 note all say nothing is
         charged until the time is agreed, so the money card says it too. The
         itemised lines still add up to the invoice that follows approval. */
      rows.push(row('Cost once approved', m(total)));
      due = 0;
      note = 'Nothing is charged until we approve the request and agree a time. The amount ' +
        'above is then emailed as a secure payment link.';

    } else if (p === 'pop') {
      ev = popEvent();
      q = popQty();
      base = ev.amount * q;
      fee = P.pop.regFee * q;
      total = base + fee;
      rows.push(row('Event', ev.label));
      rows.push(row('Children', q + ' × ' + m0(ev.amount)));
      rows.push(row('Tickets', m(base)));
      rows.push(row('Registration fee', m(fee)));

    } else {
      var th = ticked('rbTheme-', BTHEMES).length;
      var ac = ticked('rbAct-', BACTS).length;
      var inc = ticked('rbInc-', BINCS).length;
      rows.push(row('Where', 'At the studio'));
      rows.push(row('Guests', 'Up to 12 · 4 adults'));
      rows.push(th ? row('Themes', th + ' chosen') : row('Themes', 'None yet', 'mute'));
      rows.push(ac ? row('Activities', ac + ' of 44') : row('Activities', 'None yet', 'mute'));
      rows.push(inc ? row('We provide', inc + ' items') : row('We provide', 'Nothing yet', 'mute'));
      label = 'Cost';
      note = 'We price parties individually and reply with a written quote.';
    }

    /* priv keeps its own note: it is the one paid programme where nothing is
       charged on submit, so "a single payment" would be wrong beside it. */
    if (p !== 'as' && p !== 'bday' && p !== 'priv') {
      note = 'A single payment. Camps, day camps, privates and pop-ups are non-refundable.';
    }
    value = p === 'bday' ? 'Quote' : m(due === null ? total : due);
    return { rows: rows, label: label, total: total, due: due === null ? total : due,
      value: value, note: note };
  }

  function priceCard(p) {
    var q = quote(p), pr = D.program(p);
    var rows = q.rows.concat([{
      k: q.label,
      v: '<span class="strong">' + esc(q.value) + '</span>',
      tone: 'grove'
    }]);
    return ui.card({
      title: 'Running total',
      head: '<span class="mute">' + ui.dot(pr.color) + ' ' + esc(pr.name) + '</span>',
      note: q.note
    }, ui.kv(rows));
  }

  /* ---- policies — every rule is read from D.RULES ---------------------------------
     The studio's own wording is kept word for word wherever it is still true.
     The clauses about money, hours and make-ups are not written out here at
     all: they are assembled from D.RULES and D.PLAN_YEAR, so the screen a
     family signs and the rule the studio keeps cannot drift apart. The make-up
     window is D.RULES.makeupWindow, so this screen renders whichever of the
     two options the studio has set rather than choosing one of its own. */

  var POL = {
    asFacts: {
      name: 'Important Facts to Take Into Consideration',
      sum: 'The program follows the school-year calendar, a plan is hours a month, and payment comes before class.',
      det: [
        'Our program follows the school-year calendar, operating from the date of enrollment through the end of the academic school year.',
        'Your plan is a number of hours a month. You choose how to split those hours across the week when you register, and your days and times are held for the program year.',
        'Plans end with the school year, on ' + D.PLAN_YEAR.ends + '. They end by themselves — nothing renews into the summer.',
        'Payment must be completed before your child attends class. Students will not be allowed to enter class without payment.',
        'Please be on time for drop-off and pick-up, as other classes may be scheduled before or after your child’s session. We appreciate your punctuality and cooperation.',
        'Children with runny noses, coughs, or signs of illness may not participate in class. Tell us at least ' + D.RULES.cancelNotice + ' before the class and you are given a make-up.',
        'The Grove Art Studio maintains a clean and safe environment. All surfaces and materials are disinfected before, during, between, and after each class.',
        'All art materials are provided during our sessions. Please dress children in comfortable clothing that can get messy, as paint and other art materials may stain.',
        'Please label personal items such as water bottles or belongings brought to the studio.',
        'Thank you for helping us maintain a safe, organized, and creative environment for all students.',
        'During After School we do not allow food during class.'
      ]
    },
    asSched: {
      name: 'Class Scheduling',
      sum: 'Mondays are often affected by holidays. Your day and time are picked at registration and held for the program year.',
      det: [
        'When selecting your weekly class day, please note that Mondays are often affected by holidays.',
        'You pick your day and time when you register, and we hold them for the whole program year.',
        'The month’s hours are used up by the dated classes on that schedule.',
        D.RULES.unusedHours,
        'All classes are booked by parents in advance, through the portal.',
        'During school-year holiday breaks (such as Spring Break/Easter and Christmas Break), classes are booked through the parent portal based on your child’s specific school calendar.',
        'If the studio is closed on your day, message us and we will find your child another class that week.',
        'The Grove Art Studio is not responsible for booking or managing schedules.'
      ]
    },
    /* Assembled from D.RULES rather than written out, so this is the same
       make-up rule the portal and the desk work from, expiry window and all. */
    asCancel: {
      name: 'Cancellations',
      sum: 'Cancel at least ' + D.RULES.cancelNotice + ' before the class and you get a make-up. Later than that, the class is used.',
      det: [
        'Cancellations must be made at least ' + D.RULES.cancelNotice + ' before the class, in the portal, whether for illness, a trip or any other reason.',
        'Later than that, or a no-show: ' + lowerFirst(D.RULES.lateCancel),
        'Where a make-up can be taken: ' + lowerFirst(D.RULES.makeupWhere),
        'When a make-up expires: ' + D.RULES.makeupWindow + '.'
      ].concat(D.RULES.makeupNever.map(function (line) {
        return '— A make-up cannot ' + lowerFirst(line) + '.';
      })).concat([
        D.RULES.freeze,
        D.RULES.unusedHours,
        'To end the plan itself: ' + D.RULES.cancelPlan + ' Write to contact@thegroveartstudio.com or tell us in the portal.'
      ])
    },
    asPickup: {
      name: 'Drop Off & Pick Up',
      sum: 'Door-to-door with a parent or guardian, and a 10-minute grace period either side.',
      det: [
        'For safety reasons, children must be dropped off and picked up at the studio door by a parent or guardian.',
        'We are not responsible for children arriving or leaving unaccompanied via elevator or stairs.',
        'Please be punctual for both drop-off and pick-up to ensure a smooth flow of classes and transitions.',
        'A 10-minute grace period is allowed for both drop-off and pick-up. After this window, a late fee of $1 per minute will be charged and invoiced via email.',
        'Late drop-offs will be allowed to participate for the remaining time of the class only. Missed time will not be made up or extended.',
        'Please respect class times, as we have back-to-back sessions and must maintain our schedule.'
      ]
    },
    asHealth: {
      name: 'Health & Safety Guidelines',
      sum: 'Unwell children stay home, and ' + D.RULES.cancelNotice + ' notice gives you a make-up. The studio is cleaned between every class.',
      det: [
        'Children with runny noses, coughs, or other illness symptoms will not be permitted in class. Tell us as soon as you can — at least ' + D.RULES.cancelNotice + ' before the class and you are given a make-up.',
        'The studio is cleaned and disinfected before, during, and after each class.',
        'Children should be dressed appropriately; art can get messy!'
      ]
    },
    asMedical: {
      name: 'Medical Emergencies & Safety Policy',
      sum: 'What we do in an emergency, and what you authorise us to do if we cannot reach you.',
      det: [
        'At The Grove Art Studio, the safety and well-being of all children is our top priority. In the event of a medical emergency, our staff will take immediate action to ensure the child receives appropriate care.',
        'If a child becomes seriously ill or injured during class or camp, 911 will be contacted immediately if necessary. Parents or guardians will be notified as soon as possible using the emergency contact information provided during registration.',
        'In the case of an emergency situation (such as a building emergency or unsafe conditions), children will be safely escorted to a designated safe location while parents or guardians are contacted and further instructions are provided.',
        'By enrolling your child in our programs, you authorize The Grove Art Studio staff to seek emergency medical treatment for your child if a parent or guardian cannot be reached in a timely manner.',
        'Parents/guardians are responsible for providing accurate medical information, including allergies, medical conditions, and emergency contact details on the registration form.',
        'The Grove Art Studio staff cannot administer medication unless prior written authorization has been provided by a parent or guardian.'
      ]
    },
    asPayment: {
      name: 'Payment Terms',
      /* Our own summary line says "registration fee", the name the running
         total and the plan footnote use. The studio's text below calls the
         same charge an initiation fee, and is left as written. */
      sum: 'Tuition is the hours on your plan, invoiced on the last class of each cycle for the next one, with a 7-day grace period and a registration fee each year.',
      det: [
        'Enrollment is confirmed only after payment is received.',
        'Students will not be admitted to class without prior payment.',
        'All payments are non-refundable.',
        'All payments must be made through the parent portal. Please note that our software includes specific payment policies that will apply once payment is submitted.',
        'An initiation fee (covering materials and software) is required for each child, once a program year. Second and third children receive ' + (P.as.siblingFeeRelief * 100) + '% off this fee.',
        'The invoice for the next cycle is raised on the last class of the current cycle, and it lists the dates it covers.',
        'Payment must be completed within a 7-day grace period.',
        'If payment is not received within this timeframe, an automatic late fee will be applied to your account.',
        'Additional Payment Policy',
        '— ' + D.RULES.unusedHours,
        '— A plan belongs to one child. Two children on plans are two plans, and two amounts on the invoice.',
        '— Plans run to the end of the school year and end there, on ' + D.PLAN_YEAR.ends + '. Nothing renews into the summer.',
        '— To leave before then: ' + D.RULES.cancelPlan,
        '— Anything outside your plan — an extra class at the end of term, a private lesson, an event — is charged separately to the card on file, and we tell you what it is for.'
      ]
    },
    asLiability: {
      name: 'Release of Liability',
      sum: 'You release the studio from liability for injuries, accidents or lost belongings.',
      det: [
        'By enrolling my child, I agree to release and hold harmless The Grove Art Studio, its owners, staff, and instructors from any liability for injuries, accidents, or loss of personal belongings that may occur during participation in studio activities.',
        'I acknowledge that I am responsible for informing the studio of any medical conditions, allergies, or special needs that may affect my child’s participation.',
        'By completing registration, I confirm that I understand and accept this policy and grant permission for my child to participate in all studio activities.',
        'I give permission for my child to participate in all activities associated with classes, camps, and events at The Grove Art Studio. I understand that participation in art activities may involve certain risks.',
        'I understand and agree that while every precaution will be taken to ensure the safety of my child during participation in The Grove Art Studio classes, there are inherent risks involved.',
        'I release The Grove Art Studio LLC and its employees from any liability for injuries or accidents that may occur during the art class.'
      ]
    },
    asAgreement: {
      name: 'Agreement',
      sum: 'The final acknowledgement, including that the registration fee is non-refundable.',
      det: [
        'I have read and agree to the terms outlined above for The Grove Art Studio’s After-School Art Program.',
        'I understand that the registration fee is non-refundable.',
        'I accept the studio’s policies on hours, payment, cancellations and safety.',
        'I understand that my plan runs to ' + D.PLAN_YEAR.ends + ' and that leaving earlier needs ' + lowerFirst(D.RULES.cancelPlan)
      ]
    },

    food: {
      name: 'Food & snacks',
      sum: 'Bring a filling lunch and a snack. We provide no food, and children do not share.',
      det: [
        'Please send a filling lunch and a snack — camp days are long and active.',
        'The studio does not provide food or drink of any kind.',
        'Children do not share food with one another, for allergy reasons.',
        'Label everything with your child’s name.',
        'Tell us about every allergy on this form, even a mild one.'
      ]
    },
    norefund: {
      name: 'A booked day is not refundable',
      sum: 'A booked day is a held place. Missing it does not give the day back.',
      det: [
        'Camp days, no-school days and pop-up events are booked as a place, not as attendance.',
        'Missing a booked day does not entitle you to another one.',
        'Payments for these programs are not refundable.',
        'Nothing is returned for an unused day.',
        'This is different from after-school, where telling us ' + D.RULES.cancelNotice + ' before a class gives you a make-up.'
      ]
    },
    regfee: {
      name: 'Registration fee',
      sum: 'The {FEE} registration fee is per child, per booking, and is not refundable.',
      det: [
        'A {FEE} registration fee applies to each child on each booking.',
        'The fee is not refundable under any circumstances, including cancellation by you.',
        'It is separate from the program cost shown above.'
      ]
    },
    pickup: {
      name: 'Drop-off & pick-up',
      sum: 'Door-to-door with an adult. Ten-minute grace, then $1 per minute.',
      det: [
        'Children must be dropped off and collected at the studio door by a parent or guardian.',
        'We are not responsible for children arriving or leaving unaccompanied.',
        'A ten-minute grace period applies at both ends; after that a late fee of $1 per minute is invoiced.',
        'Late arrivals join for the remaining time only; missed time is not extended.',
        'Only people on your authorised pickup list may collect a child.'
      ]
    },
    health: {
      name: 'Health & safety',
      sum: 'Unwell children stay home. Surfaces disinfected between every class.',
      det: [
        'Children with runny noses, coughs or other symptoms may not attend. Please tell us as early as you can.',
        'The studio is cleaned and disinfected before, during and after each class.',
        'Art gets messy — please dress children accordingly. All materials are provided.',
        'No food during after-school classes.'
      ]
    },
    medical: {
      name: 'Medical emergencies',
      sum: 'We call 911 if needed, then you. You authorise emergency treatment if we cannot reach you.',
      det: [
        'In a medical emergency, staff act immediately and call 911 if necessary.',
        'Parents are contacted using the emergency details on this form.',
        'By enrolling you authorise staff to seek emergency treatment if you cannot be reached in time.',
        'You are responsible for keeping allergies, conditions and contacts accurate.',
        'Staff cannot administer medication without prior written authorisation.'
      ]
    },
    liability: {
      name: 'Release of liability',
      sum: 'Art activities carry some risk. You release the studio from liability for accidents and lost belongings.',
      det: [
        'You release The Grove Art Studio LLC, its owners, staff and instructors from liability for injuries, accidents or lost belongings during studio activities.',
        'You confirm you have told us about any medical condition, allergy or need affecting participation.',
        'You give permission for your child to take part in all studio activities.'
      ]
    },
    photo: {
      name: 'Photo permission',
      sum: 'Optional. You choose whether we may photograph your child, and can withdraw it at any time.',
      det: [
        'Permission is optional and does not affect enrollment.',
        'Photographs may be used on our website and Instagram.',
        'You can withdraw permission at any time in the portal, and we will stop using new images.'
      ]
    },
    approval: {
      name: 'Approval before scheduling',
      sum: 'Private classes are approved by the studio before a time is set. Requesting does not reserve a slot.',
      det: [
        'Every private class request is reviewed by the studio before it is scheduled.',
        'Submitting this form does not reserve an instructor or a room.',
        'We contact you to agree the time once the request is approved.',
        'Nothing is charged until the class is confirmed.'
      ]
    },
    offsite: {
      name: 'Classes held at your location',
      sum: 'If we come to you, the host provides the space and supervises anyone not taking part.',
      det: [
        'The host is responsible for providing a suitable space, surfaces and access.',
        'The host supervises any children present who are not taking part in the class.',
        'The studio is not responsible for damage to the host’s property.',
        'Travel outside our usual area may carry an additional charge, agreed in advance.'
      ]
    },
    extraKids: {
      name: 'Additional participants',
      sum: 'Each additional child in a private class is charged separately at the same hourly rate.',
      det: [
        'The hourly rate covers one child.',
        'Each additional child is charged at the same hourly rate.',
        'Tell us the number of children when you request, so we bring enough materials.'
      ]
    }
  };

  var SHORT_SET = ['food', 'norefund', 'regfee', 'pickup', 'health', 'medical', 'liability', 'photo'];
  var SETS = {
    as: ['asFacts', 'asSched', 'asCancel', 'asPickup', 'asHealth', 'asMedical', 'asPayment', 'asLiability', 'asAgreement'],
    camp: SHORT_SET,
    nsd: SHORT_SET,
    pop: SHORT_SET,
    priv: ['approval', 'offsite', 'extraKids', 'regfee', 'pickup', 'health', 'medical', 'liability', 'photo'],
    bday: []
  };

  function regFeeFor(p) { return P[p] && P[p].regFee ? P[p].regFee : 0; }
  function fillFee(text, p) { return text.split('{FEE}').join(m0(regFeeFor(p))); }
  function polSet(p) { return SETS[p] || []; }
  function polAgreed(p) {
    return polSet(p).filter(function (id) {
      return Grove.toggle('rPol-' + p + '-' + id, false);
    }).length;
  }

  Grove.on('rPolOpen', function (d) {
    Grove.setTab('rPolOpen', pick('rPolOpen', '') === d.id ? '' : d.id);
  });

  function policyCard(p, id, span) {
    var pol = POL[id];
    var open = pick('rPolOpen', '') === id;
    var body = check('rPol-' + p + '-' + id, pol.name, fillFee(pol.sum, p));
    if (open) {
      body += '<div class="stack stack--sm">' + pol.det.map(function (line) {
        return hint(fillFee(line, p));
      }).join('') + '</div>';
    }
    return ui.card({
      span: span,
      head: ui.btn({
        label: open ? 'Hide the full text' : 'Read the full text',
        kind: 'quiet', size: 'sm', act: 'rPolOpen', id: id
      })
    }, '<div class="stack stack--sm">' + body + '</div>');
  }

  function policySection(p) {
    var set = polSet(p), n = set.length, done = polAgreed(p);
    var pr = D.program(p);
    var intro = ui.notice({
      kind: done === n ? 'ok' : null,
      title: done + ' of ' + n + ' agreed',
      text: n + ' policies for ' + pr.name + ', each summarised in a line. Open each one, ' +
        'read it, and tick to agree. Every program carries its own terms.'
    });
    var cards = set.map(function (id, i) {
      var last = i === n - 1 && n % 2 === 1;
      return policyCard(p, id, last ? 2 : null);
    });
    return sec(head('Policies for ' + pr.name) + intro + '<div class="section">' +
      ui.grid(2, cards) + '</div>');
  }

  /* ---- step 1 — who ------------------------------------------------------------- */

  /* Every answer on this card is filled in, because the whole point of the
     card is that we already know the family. Three of them used to be grey
     placeholders, which read as a half-finished form. */
  function householdCard() {
    var f = fam();
    var first = f.guardian.split(' ')[0];
    return ui.card({
      title: 'Household',
      /* Sabrina Moore is the parent in the Johnson family — the data says so,
         and the note says so, rather than leaving two surnames unexplained. */
      note: 'The family name everything is filed under, and the number we ring first. ' +
        'The main contact beside it may have a different surname — ' + f.guardian +
        ' is the parent in the ' + f.name + ' family.'
    }, ui.fields(2, [
      ui.field({ label: 'Family last name', control: ui.input({ value: f.name }) }),
      ui.field({
        label: 'Primary phone', control: ui.input({ value: f.phone }),
        hint: 'One number per family. It reaches ' + first + ' first in an emergency.'
      }),
      ui.field({
        label: 'Street address', span: true,
        control: ui.input({ value: '2911 Grand Avenue, Apt 12' })
      }),
      ui.field({ label: 'City', span: true, control: ui.input({ value: 'Miami' }) }),
      ui.field({
        label: 'State', control: ui.select({ options: ['FL', 'GA', 'NY', 'Other'] })
      }),
      ui.field({ label: 'ZIP', control: ui.input({ value: '33133' }) })
    ]));
  }

  /* "Cell" is gone: it asked for the household number a second time, and the
     same number twice is not two facts. */
  function contactCard() {
    var f = fam();
    var first = f.guardian.split(' ')[0];
    var last = f.guardian.split(' ').slice(1).join(' ');
    return ui.card({
      title: 'Main contact',
      note: 'The person who will manage the account and receive receipts. We reach them on ' +
        'the household number above.'
    }, ui.fields(2, [
      ui.field({ label: 'First name', control: ui.input({ value: first }) }),
      ui.field({ label: 'Last name', control: ui.input({ value: last }) }),
      ui.field({
        label: 'Relationship to child',
        control: ui.select({ options: ['Mother', 'Father', 'Guardian', 'Grandparent', 'Other'] })
      }),
      ui.field({
        label: 'How did you hear about us?',
        control: ui.select({
          options: ['Word of mouth', 'Instagram', 'Google', 'A school', 'Flyer', 'Other']
        })
      }),
      ui.field({
        label: 'Email', span: true, control: ui.input({ value: f.email, type: 'email' }),
        hint: 'Where we send your confirmation and payment link'
      }),
      ui.field({
        label: 'Referral name', span: true,
        control: ui.input({ placeholder: 'Who told you about us?' }),
        hint: 'Optional. So we can thank them.'
      })
    ]));
  }

  function childCard(kid, i, span) {
    var f = fam();
    var who = kid ? kid.name.split(' ')[0] : '';
    var title = 'Child ' + (i + 1) + (kid ? ' · ' + who : '');
    var notes = kid && kid.flag ? kid.flag : '';
    /* The age and the band are facts on the child's record, so they sit in the
       card head where the record speaks. They used to hang under the empty
       date-of-birth box, where they read as something that box had told us. */
    var flags = [];
    if (kid) {
      flags.push('<span class="mute">' + esc('Age ' + kid.age + ' · ages ' + kid.band + ' band') + '</span>');
    }
    /* Only the last card offers Remove, so the button does what it says. */
    if (kidCount() > 1 && i === kidCount() - 1) {
      flags.push(ui.btn({ label: 'Remove', kind: 'quiet', size: 'sm', act: 'rKids', n: kidCount() - 1 }));
    }
    return ui.card({
      span: span,
      title: title,
      head: flags.length ? '<span class="inline">' + flags.join('') + '</span>' : null
    }, ui.fields(2, [
      ui.field({
        label: 'First name',
        control: ui.input({ value: kid ? kid.name.split(' ')[0] : '', placeholder: 'First name' })
      }),
      ui.field({
        label: 'Last name',
        control: ui.input({ value: kid ? kid.name.split(' ').slice(1).join(' ') : f.name, placeholder: 'Last name' })
      }),
      /* Date of birth, gender and grade are the three things the studio does
         not hold, so they are the three blanks on an otherwise filled card.
         The selects open on a prompt rather than on their first option, which
         had the CHILD 2 · LUCAS card answering "Girl" on his behalf. */
      ui.field({
        label: 'Date of birth', control: ui.date({}),
        hint: kid
          ? 'Not on file yet — the age above comes from ' + who + '’s record.'
          : 'We use this to place them in the right age group.'
      }),
      ui.field({
        label: 'Gender',
        control: ui.select({
          options: ['Choose…', 'Girl', 'Boy', 'Non-binary', 'Prefer not to say']
        })
      }),
      ui.field({ label: 'Grade', control: ui.select({ options: ['Choose…'].concat(GRADES) }) }),
      ui.field({ label: 'School', control: ui.input({ placeholder: 'Coconut Grove Elem.' }) }),
      ui.field({
        label: 'Permission to use their image', span: true,
        control: ui.select({
          options: ['Yes — photos may be used', 'No — do not photograph']
        }),
        hint: 'Asked per child, not per family. Email the studio any time to change it.'
      }),
      ui.field({
        label: 'Allergies and medication', span: true,
        control: ui.input({ value: notes, placeholder: 'Leave blank if none' }),
        hint: notes
          ? 'Shown to instructors on every roster. Staff cannot administer medication without written authorisation.'
          : 'Shown to instructors on every roster'
      }),
      ui.field({
        label: 'Anything that helps us teach them well', span: true,
        control: ui.textarea({
          placeholder: 'Sensory, learning, physical — things that help, things to avoid'
        })
      })
    ]));
  }

  function stepWho(p) {
    var out = '';
    if (p === 'bday') {
      var f = fam();
      var child = seedKids()[0];
      var ages = [], a;
      for (a = 4; a <= 13; a++) ages.push(String(a));
      out += ui.grid(2, [
        ui.card({ title: 'Host', note: 'The person we reply to and invoice.' }, ui.fields(2, [
          ui.field({ label: 'Host name', span: true, control: ui.input({ value: f.guardian }) }),
          ui.field({ label: 'Phone', control: ui.input({ value: f.phone }) }),
          ui.field({ label: 'Email', control: ui.input({ value: f.email, type: 'email' }) })
        ])),
        ui.card({
          title: 'Birthday child',
          note: 'They do not need to be a Grove student.'
        }, ui.fields(2, [
          ui.field({
            label: 'Name', span: true,
            control: ui.input({ value: child ? child.name : '' })
          }),
          ui.field({
            label: 'Turning',
            control: ui.select({ options: ages, value: child ? String(child.age + 1) : '9' })
          })
        ]))
      ]);
      return out;
    }

    out += ui.grid(2, [householdCard(), contactCard()]);

    var n = kidCount();
    var addBtn = ui.btns([
      { label: 'Add another child', kind: 'quiet', size: 'sm', act: 'rKids', n: n + 1 }
    ]);
    var cards = kidList().map(function (kid, i) {
      var last = i === n - 1 && n % 2 === 1;
      return childCard(kid, i, last ? 2 : null);
    });

    var notice = p === 'as'
      ? ui.notice({
        kind: 'ok',
        title: 'Two children means a discount',
        text: P.as.siblingRelief + ' — applied automatically at review. Tuition is per ' +
          'child: the relief is on the fee, not on the hours.'
      })
      : '';

    out += sec(head('Children', n < 3 ? addBtn : null) + notice +
      (notice ? '<div class="section">' + ui.grid(2, cards) + '</div>' : ui.grid(2, cards)));
    return out;
  }

  /* ---- step 2 — what ------------------------------------------------------------- */

  function stepAs() {
    var cur = planKey();
    var planCard = ui.card({
      title: 'Choose a plan',
      note: 'A plan is hours a month for one child, and the rate per hour falls as the plan ' +
        'grows. Registration fee ' + m0(P.as.regFee) + ' per ' + P.as.regFeePer + ' · ' +
        P.as.siblingRelief + '. ' + D.PLAN_YEAR.note
    }, ui.choices(null, PLAN_KEYS.map(function (k) {
      return tile('rPlan', k, cur, {
        title: planLabel(k),
        sub: rate(planRate(k)) + ' an hour',
        price: m0(planPrice(k))
      });
    })));

    var band = asBand();
    var bandCard = ui.card({
      title: 'Age group',
      note: 'Required. Classes are assigned by age group, so we place your child in the right room.'
    }, ui.choices(null, asBands().map(function (b) {
      var open = classesFor('as').filter(function (c) { return c.band === b; });
      var free = open.reduce(function (t, c) { return t + places(c); }, 0);
      return tile('rBand', b, band, {
        title: 'Ages ' + b,
        sub: open.length + plural(open.length, ' class', ' classes') + ' · ' +
          (free ? free + plural(free, ' place open', ' places open') : 'all full, waitlist only')
      });
    })));

    /* The question the live registration form asks, word for word. Hours are
       the unit; the split is the parent's. The meter is the whole answer —
       what has been split against what was bought — so the card does not need
       a second row of arithmetic to explain itself. */
    var list = asClassList();
    var def = asDefaultIds();
    var want = planHours(cur);
    var got = asChosenHours();
    var splitCard = ui.card({
      title: 'How would you like to split these hours?',
      head: '<span class="mute">' + esc(asSplitText()) + '</span>',
      note: 'Each day you tick is that class every week, and it is yours for the program year. ' +
        (got > want
          ? 'That is more than ' + planLabel(cur) + ' — untick a day, or take a bigger plan.'
          : (got < want
            ? hoursWord(want - got) + plural(want - got, ' a month is', ' a month are') +
              ' still unsplit. ' + D.RULES.unusedHours
            : 'That is exactly ' + planLabel(cur) + '.')) +
        ' Places update live.'
    }, list.length
      ? '<div class="stack stack--sm">' + ui.meter(got, want) +
        ui.choices(null, list.map(function (c) {
          return check(classKey(c), c.day + ' ' + c.time,
            hoursWord(monthHours(c)) + ' a month · ' + c.room + ' · ' + c.staff,
            def.indexOf(c.id) !== -1, placeLabel(c));
        })) + '</div>'
      : ui.empty('No class open for this age group', 'Choose a different age group, or message the studio.'));

    /* The waitlist banner sits above the money rather than under it: it is the
       reason the running total says nothing is due today.
       Two stacked columns rather than two rows of one card: the running total
       carries more rows than the plan list, and stacking lets each card end
       where its content ends instead of leaving a hollow band above the note. */
    var main = ui.grid(2, [
      ui.col([planCard, bandCard]),
      ui.col([priceCard('as'), splitCard])
    ]);

    if (!asWaiting()) return main;

    var full = asFull();
    return ui.notice({
      kind: 'warn',
      title: plural(full.length, 'That class is full', 'Those classes are full') +
        ' — you would be ' + asWaitText(),
      text: 'Join the waitlist and nothing is charged. When a place opens you get 24 hours ' +
        'to accept it. Nobody is turned away.'
    }) + sec(main);
  }

  function stepCamp() {
    var list = classesFor('camp');
    var chosen = campClass();
    var weekCard = ui.card({
      title: 'Which week',
      note: 'Camp runs ' + (chosen ? chosen.time : '') + ' every day. Each week is grouped ' +
        'by age, so pick the group your child belongs in.'
    }, list.length
      ? ui.choices(null, list.map(function (c) {
        return tile('rWeek', c.id, chosen ? chosen.id : '', {
          title: c.name + ' · ages ' + c.band,
          sub: c.room + ' · ' + placeLabel(c),
          price: m0(P.camp.week)
        });
      }))
      : ui.empty('No camp weeks open', 'Message the studio and we will tell you what is next.'));

    var days = campDays();
    var dayCard = ui.card({
      title: 'Which days',
      note: 'A full week is ' + m0(P.camp.week) + '. Individual days are ' + m0(P.camp.day) +
        ' each, so four days or more is always worth taking the week.'
    }, ui.choices(2, DAYS.map(function (d) {
      /* campDays() starts every day on, so the tiles have to start ticked too
         — otherwise the total says "Full week" over five empty boxes. */
      return check('rcDay-' + d, d,
        days.length === DAYS.length ? 'Part of the full week' : m0(P.camp.day), true);
    })));

    var end = campEndHour();
    var xh = campExtra();
    var extraCard = ui.card({
      title: 'Extra hours',
      note: m0(P.camp.extraHour) + ' an hour, on every day you have booked. Need a different ' +
        'pickup on one day? Tell us in the comments and we will set it up.'
    }, ui.choices(null, [0, 1, 2, 3].map(function (x) {
      return tile('rXhr', x, xh, {
        title: 'To ' + clockPm(end + x),
        sub: x ? '+' + x + plural(x, ' hour', ' hours') + ' a day' : 'Included',
        price: x ? m0(x * P.camp.extraHour) : 'Included'
      });
    })));

    return ui.grid(2, [weekCard, priceCard('camp')]) +
      sec(ui.grid(2, [dayCard, extraCard]));
  }

  function stepNsd() {
    var list = classesFor('nsd');
    var chosen = nsdClass();
    var start = nsdStartHour();
    var dateCard = ui.card({
      title: 'Which date',
      note: 'Eight no-school days are scheduled across the year. Each is booked separately, ' +
        'and only the dates the studio has opened appear here.'
    }, list.length
      ? ui.choices(null, list.map(function (c) {
        return tile('rDate', c.id, chosen ? chosen.id : '', {
          title: c.name,
          sub: c.day + ' · ' + c.time + ' · ' + c.room,
          price: placeLabel(c)
        });
      }))
      : ui.empty('No dates open yet', 'The next no-school days go up with the school calendar.'));

    var hrs = nsdHours();
    var opts = [], hh;
    for (hh = 3; hh <= P.nsd.maxHours; hh++) opts.push(hh);
    var lenCard = ui.card({
      title: 'How long',
      note: m0(P.nsd.base) + ' covers ' + (chosen ? String(chosen.time).replace('–', ' to ') : '') +
        '. Each additional hour is ' + m0(P.nsd.extraHour) + '.'
    }, ui.choices(2, opts.map(function (x) {
      return tile('rHours', x, hrs, {
        title: x + ' hours',
        sub: 'Finishes at ' + clockPm(start + x),
        price: m0(P.nsd.base + (x - 3) * P.nsd.extraHour)
      });
    })));

    return ui.grid(2, [dateCard, priceCard('nsd')]) +
      sec(ui.grid(2, [lenCard, ui.card({
        title: 'Good to know',
        note: 'Your day and time are your place. If you need a different date later, call or ' +
          'message the studio and we will see what is possible.'
      }, ui.kv([
        row('Runs', chosen ? chosen.time : '—'),
        row('Room', chosen ? chosen.room : '—'),
        row('Places', chosen ? placeLabel(chosen) : '—'),
        row('Longest day', P.nsd.maxHours + ' hours')
      ]))]));
  }

  function stepPriv() {
    var hrs = privHours();
    var opts = [], x;
    for (x = 1; x <= P.priv.maxHours; x++) opts.push(x);
    var hourCard = ui.card({
      title: 'How many hours',
      note: m0(P.priv.hourly) + ' an hour. ' + P.priv.maxHours +
        ' hours is the maximum in one session.'
    }, ui.choices(null, opts.map(function (n) {
      var sub = n === 1 ? 'A focused single session'
        : (n === 2 ? 'Room to finish a piece' : 'A full project, start to finish');
      return tile('rPhours', n, hrs, {
        title: n + plural(n, ' hour', ' hours'),
        sub: sub,
        price: m0(P.priv.hourly * n)
      });
    })));

    var whenCard = ui.card({
      title: 'When suits you',
      note: 'Pick your preferences. Private classes are approved before they are scheduled, ' +
        'and nothing is charged until the time is agreed.'
    }, ui.fields(2, [
      ui.field({
        label: 'Preferred day',
        control: ui.select({
          options: ['Any weekday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        })
      }),
      ui.field({
        label: 'Preferred time',
        control: ui.select({ options: ['Mornings', 'Early afternoon', 'After 4pm'] })
      }),
      ui.field({
        label: 'Starting from', span: true, control: ui.date({})
      }),
      ui.field({
        label: 'What would they like to work on?', span: true,
        control: ui.textarea({
          placeholder: 'e.g. portrait drawing, finishing a canvas from camp, preparing a portfolio piece'
        })
      })
    ]));

    return ui.grid(2, [hourCard, priceCard('priv')]) + sec(ui.grid(2, [whenCard, ui.card({
      title: 'How a private is booked',
      note: 'Requests are read by the studio, not booked automatically.'
    }, ui.kv([
      row('Rate', m0(P.priv.hourly) + ' an hour'),
      row('Longest session', P.priv.maxHours + ' hours'),
      row('Additional children', 'Charged at the same hourly rate'),
      row('Charged', 'Once the time is agreed')
    ]))]));
  }

  function stepPop() {
    var ev = popEvent();
    var eventCard = ui.card({
      title: 'Which event',
      note: 'One-off evenings. The studio names each event and sets its price when it creates ' +
        'it — this list is whatever is currently open.'
    }, ui.choices(null, P.pop.events.map(function (e) {
      return tile('rEvent', e.id, ev.id, {
        title: e.label, sub: e.sub, price: m0(e.amount)
      });
    })));

    var names = kidNames();
    var q = popQty();
    var qtyCard = ui.card({
      title: 'How many children',
      note: 'From the children you added on step 1.'
    }, ui.choices(null, names.map(function (nm, i) {
      var count = i + 1;
      var who = count === 1 ? names[0] + ' only' : names.slice(0, count).join(' and ');
      var kidsHere = kidList().slice(0, count);
      var agesText = kidsHere.filter(function (k) { return k; })
        .map(function (k) { return String(k.age); }).join(' and ');
      return tile('rQty', count, q, {
        title: who,
        sub: agesText ? (count === 1 ? 'Age ' : 'Ages ') + agesText + ' · eligible' : 'Eligible',
        price: m0(ev.amount * count)
      });
    })));

    return ui.grid(2, [eventCard, priceCard('pop')]) + sec(ui.grid(2, [qtyCard, ui.card({
      title: 'What you get',
      note: 'One evening, one project, all materials provided.'
    }, ui.kv([
      row('Event', ev.label),
      row('When', ev.sub),
      row('Per child', m0(ev.amount)),
      row('Registration fee', m0(P.pop.regFee) + ' per child')
    ]))]));
  }

  function stepBday() {
    var whereCard = ui.card({
      title: 'Where and when',
      note: 'Tell us your first choice. We confirm what is free when we quote.'
    }, ui.fields(2, [
      ui.field({
        label: 'Where', span: true,
        control: ui.select({ options: ['At the studio', 'At our location'] })
      }),
      ui.field({ label: 'Preferred date', control: ui.date({}) }),
      ui.field({
        label: 'Preferred time',
        control: ui.select({ options: ['11:00am', '1:00pm', '3:00pm', '5:00pm'] })
      }),
      ui.field({
        label: 'Children',
        control: ui.select({ options: ['Up to 12', '13–16', '17–20', '21–24', 'More than 24'] })
      }),
      ui.field({
        label: 'Adults staying',
        control: ui.select({ options: ['1', '2', '3', '4'] }),
        hint: 'A maximum of four adults can stay when the party is held at the studio. ' +
          'Everyone else drops off. At your location there is no limit — put the numbers in the notes.'
      })
    ]));

    var themeCard = ui.card({
      title: 'Theme',
      note: 'Pick as many as you like, or none at all.'
    }, ui.choices(2, BTHEMES.map(function (t) { return check('rbTheme-' + t, t); })));

    var actCard = ui.card({
      title: 'Activities',
      note: 'Nine of the popular ones. There are forty-four in total — we send the full list as ' +
        'a PDF with your quote. Not sure? Tell us the ages in the notes and we will suggest the ' +
        'ones that land best for that group.'
    }, ui.choices(2, BACTS.map(function (t) { return check('rbAct-' + t, t); })));

    var incCard = ui.card({
      title: 'What should we provide?',
      note: 'Anything you do not tick, you are welcome to bring yourself. We do not do ice cream ' +
        'cakes — they will not survive two hours in a studio.'
    }, ui.choices(2, BINCS.map(function (t) { return check('rbInc-' + t, t); })));

    var notesCard = ui.card({
      title: 'Anything else',
      note: 'Allergies among the guests, a sibling who wants to join in, a surprise you are planning.'
    }, ui.fields(null, [
      ui.field({
        label: 'Notes for us',
        control: ui.textarea({
          placeholder: 'Two of the guests have nut allergies. My younger son is 4 — can he take part?'
        })
      }),
      ui.field({
        label: 'Cake, if we are doing it',
        control: ui.input({ placeholder: 'Flavour, servings, and a colour or character' })
      })
    ]));

    return ui.grid(2, [whereCard, priceCard('bday')]) +
      sec(ui.grid(2, [themeCard, actCard])) +
      sec(ui.grid(2, [incCard, notesCard]));
  }

  function stepWhat(p) {
    if (p === 'camp') return stepCamp();
    if (p === 'nsd') return stepNsd();
    if (p === 'priv') return stepPriv();
    if (p === 'pop') return stepPop();
    if (p === 'bday') return stepBday();
    return stepAs();
  }

  /* ---- step 3 — confirm ----------------------------------------------------------- */

  function bookingRows(p) {
    var rows = [], names = kidNames(), c, ev, hrs;
    if (p === 'as') {
      var asList = asClasses();
      var key = planKey();
      /* The room and the instructor are named once, on their own rows, rather
         than repeated after every child's days and times. The plan, though, is
         named per child: a plan belongs to one child, so two children here are
         two plans and two amounts. */
      var days = asList.map(function (x) { return x.day + ' ' + x.time; }).join(' and ');
      names.forEach(function (nm) {
        rows.push(asList.length
          ? row(nm, days + ' · ' + planLabel(key))
          : row(nm, 'No place chosen', 'clay'));
      });
      rows.push(row('Plan', planLabel(key) + ' · ' + m0(planPrice(key)) +
        (names.length > 1 ? ' a child' : '')));
      rows.push(row('Split', asSplitText()));
      rows.push(row('Age group', 'Ages ' + asBand()));
      if (asList.length) {
        var rooms = uniq(asList.map(function (x) { return x.room; }));
        var staff = uniq(asList.map(function (x) { return x.staff; }));
        rows.push(row(plural(rooms.length, 'Room', 'Rooms'), rooms.join(' and ')));
        rows.push(row(plural(staff.length, 'Instructor', 'Instructors'), staff.join(' and ')));
        var placeLabels = uniq(asList.map(function (x) { return placeLabel(x); }));
        rows.push(row('Places', placeLabels.length === 1
          ? placeLabels[0]
          : asList.map(function (x) { return x.day + ' ' + placeLabel(x); }).join(' · ')));
      }
      if (asWaiting()) {
        rows.push(row('Waitlist', cap(asWaitText())));
        rows.push(row('First class', plural(asFull().length,
          'The week after a place is offered', 'The week after the places are offered')));
      } else {
        rows.push(row('First class', FIRST_CLASS));
      }
      /* The commitment, on the card that reviews the booking: a plan is
         annual and it ends by itself. */
      rows.push(row('Plan year', D.PLAN_YEAR.label + ' · runs to ' + D.PLAN_YEAR.ends));
    } else if (p === 'camp') {
      c = campClass();
      names.forEach(function (nm) { rows.push(row(nm, c ? c.name : 'No week chosen', c ? null : 'clay')); });
      rows.push(row('Days', campDays().length === DAYS.length ? 'Full week' : campDays().join(', ') || 'None chosen'));
      rows.push(row('Each day', c ? c.time : '—'));
      rows.push(row('Extra hours', campExtra() ? 'To ' + clockPm(campEndHour() + campExtra()) : 'None'));
      rows.push(row('Room', c ? c.room : '—'));
    } else if (p === 'nsd') {
      c = nsdClass();
      names.forEach(function (nm) { rows.push(row(nm, c ? c.name : 'No date chosen', c ? null : 'clay')); });
      rows.push(row('Starts', clockPm(nsdStartHour()).replace('pm', 'am')));
      rows.push(row('Length', nsdHours() + ' hours'));
      rows.push(row('Finishes', clockPm(nsdStartHour() + nsdHours())));
      rows.push(row('Room', c ? c.room : '—'));
    } else if (p === 'priv') {
      hrs = privHours();
      names.forEach(function (nm) {
        rows.push(row(nm, hrs + plural(hrs, ' hour', ' hours') + ', by appointment'));
      });
      rows.push(row('Scheduling', 'We agree the exact slot once the request is approved'));
      rows.push(row('Rate', m0(P.priv.hourly) + ' an hour, per child'));
      rows.push(row('Charged', 'Once the request is approved and the time is agreed'));
    } else if (p === 'pop') {
      ev = popEvent();
      rows.push(row('Event', ev.label));
      rows.push(row('When', ev.sub));
      rows.push(row('Children', String(popQty())));
    } else {
      var th = ticked('rbTheme-', BTHEMES);
      var ac = ticked('rbAct-', BACTS);
      var inc = ticked('rbInc-', BINCS);
      rows.push(row('Where', 'At the studio'));
      rows.push(row('Guests', 'Up to 12 children, 4 adults'));
      rows.push(row('Themes', th.length ? th.join(', ') : 'No preference'));
      rows.push(row('Activities', ac.length ? ac.join(', ') : 'Open to suggestions'));
      rows.push(row('We provide', inc.length ? inc.join(', ') : 'You bring everything'));
      rows.push(row('Cost', 'Quoted, not charged', 'grove'));
    }
    return rows;
  }

  function safetyCards() {
    return ui.grid(2, [
      ui.card({
        title: 'Emergency contact',
        note: 'Someone other than you, who we can reach quickly. This is the second contact on ' +
          'your account — we no longer ask for them twice.'
      }, ui.fields(2, [
        ui.field({ label: 'Full name', span: true, control: ui.input({ placeholder: 'Marcus Johnson' }) }),
        ui.field({ label: 'Relationship', control: ui.input({ placeholder: 'Father' }) }),
        ui.field({ label: 'Mobile', control: ui.input({ placeholder: '(786) 340-1199' }) })
      ])),
      ui.card({
        title: 'Authorised pickup',
        note: 'Only these people may collect your children. Staff check photo ID the first time.'
      }, ui.fields(2, [
        ui.field({ label: 'Name', span: true, control: ui.input({ placeholder: 'Gloria Moore' }) }),
        ui.field({ label: 'Relationship', control: ui.input({ placeholder: 'Grandmother' }) }),
        ui.field({ label: 'Mobile', control: ui.input({ placeholder: '(305) 887-2201' }) })
      ]))
    ]);
  }

  /* The box grows to whatever height its neighbour needs, so the pair does not
     end in dead space. */
  function commentsCard(span) {
    return ui.card({
      span: span,
      fill: true,
      title: 'Comments',
      note: 'Anything we have not asked about. This goes to the office, not onto the roster.'
    }, ui.field({
      grow: true,
      label: 'Anything else',
      control: ui.textarea({
        placeholder: 'A question about the schedule, a detail about drop-off, a note about a sibling'
      })
    }));
  }

  /* The dates the cycle is actually made of, and the one sentence the owner
     keeps control with: which class the next invoice falls on, and which dates
     it covers. She did this by hand. */
  function datesCard() {
    if (asWaiting()) {
      return ui.card({
        title: 'Your dates',
        note: 'A place on the waitlist is held in the order people join it. Nobody is turned away.'
      }, ui.empty('Dated once a place is offered',
        'Your first cycle is counted from your first class, and the invoice for the next cycle ' +
        'comes on the last class of this one.'));
    }
    var list = asClasses();
    if (!list.length) {
      return ui.card({ title: 'Your dates' },
        ui.empty('No day chosen yet', 'Step back and tick the days your child comes.'));
    }
    var here = cycleDates(0);
    var last = here[here.length - 1];
    return ui.card({
      title: 'Your dates',
      head: '<span class="mute">' + esc(here.length + plural(here.length, ' class', ' classes') +
        ' · ' + asSplitText()) + '</span>',
      note: 'Your next invoice comes on ' + dayMonth(last) + ', ' + kidNames()[0] +
        '’s last class of this cycle, and covers ' + dateList(cycleDates(1)) + '.'
    }, ui.rows(list.map(function (c) {
      return {
        lead: esc(c.day),
        title: esc(c.time + ' · ' + c.room),
        sub: esc(dateList(datesOf(c, 0))),
        end: esc(hoursWord(monthHours(c)) + ' a month')
      };
    })));
  }

  /* What the family is signing, in the order it matters: what is paid, what
     happens when a class is missed, what happens to hours nobody booked, and
     how the plan ends. Every rule is read from D.RULES and D.PLAN_YEAR — the
     make-up window included, so no wording here is this screen's own. */
  function commitmentCard() {
    var key = planKey();
    var items = [];
    if (asWaiting()) {
      items.push({
        title: 'Nothing is charged today',
        sub: 'If a place opens we email you and you have 24 hours to accept. The invoice is ' +
          m(quote('as').total) + ', by secure payment link.'
      });
    } else {
      items.push({
        title: 'A secure payment link, emailed to you',
        sub: 'Your schedule is confirmed once payment has been received. First class ' +
          FIRST_CLASS + '.'
      });
    }
    items.push({
      title: planLabel(key) + ' · ' + m0(planPrice(key)) + ' a child',
      sub: 'Invoiced on the last class of each cycle, for the next cycle, listing the dates it covers.'
    });
    items.push({
      title: 'Registration fee ' + m0(P.as.regFee) + ' per ' + P.as.regFeePer,
      sub: cap(P.as.siblingRelief) + ' — relief on the fee, not on the hours.'
    });
    items.push({
      title: 'Cancel ' + D.RULES.cancelNotice + ' ahead and you get a make-up',
      sub: 'Later than that, ' + lowerFirst(D.RULES.lateCancel) +
        ' Take it in ' + lowerFirst(D.RULES.makeupWhere) +
        ' Make-up window: ' + D.RULES.makeupWindow + '.'
    });
    items.push({ title: D.RULES.unusedHours, sub: D.RULES.freeze });
    items.push({
      title: 'Your plan runs to ' + D.PLAN_YEAR.ends + ' and ends there',
      sub: D.PLAN_YEAR.note
    });
    items.push({ title: 'Leaving before then', sub: D.RULES.cancelPlan });
    return ui.card({
      title: 'What you are committing to',
      note: 'These are the terms on the form you are signing, not a summary of them.'
    }, ui.rows(items.map(function (r) {
      return { title: esc(r.title), sub: esc(r.sub) };
    })));
  }

  function signInCard() {
    var f = fam();
    return ui.card({
      title: 'Create your sign-in',
      /* "Paying creates your account" was not true of the private path, where
         nothing is paid on submit. Submitting is true of all of them. */
      note: 'Submitting this form creates your family account. Use it next time and everything ' +
        'above is already filled in.'
    }, ui.fields(2, [
      ui.field({
        label: 'Email', control: ui.input({ value: f.email, type: 'email' }),
        hint: 'This is your username'
      }),
      ui.field({ label: 'Mobile', control: ui.input({ value: f.phone }) }),
      ui.field({
        label: 'Password', span: true, control: ui.input({ type: 'password', placeholder: '••••••••••' }),
        hint: 'At least 10 characters'
      })
    ]));
  }

  function paymentCard(p) {
    return ui.card({
      title: 'Payment',
      note: 'Card details go straight to the processor. The studio never sees your full number.' +
        (p === 'priv'
          ? ' Nothing is charged until we approve the request and agree a time.'
          : '')
    }, ui.fields(2, [
      ui.field({
        label: 'Card number', span: true,
        control: ui.input({ placeholder: '4242 4242 4242 4242' })
      }),
      ui.field({ label: 'Expiry', control: ui.month({}) }),
      ui.field({ label: 'CVC', control: ui.input({ placeholder: '···' }) }),
      ui.field({ label: 'ZIP', control: ui.input({ placeholder: '33133' }) }),
      ui.field({
        label: 'Or pay by bank',
        control: ui.select({ options: ['Use a card', 'Bank transfer (ACH)'] }),
        hint: 'Bank payments also cut the studio’s fees'
      })
    ]));
  }

  function stepConfirm(p) {
    var review = ui.card({
      title: 'What you are booking',
      note: p === 'bday'
        ? 'We will send all forty-four activity options as a PDF with the quote.'
        : 'Check this against what you chose. Step back if anything is wrong.'
    }, ui.kv(bookingRows(p)));

    var out = ui.grid(2, [review, priceCard(p)]);

    if (p === 'bday') {
      var f = fam();
      return out + sec(ui.grid(2, [
        ui.card({ title: 'Confirm your details', note: 'We reply to this address.' }, ui.fields(2, [
          ui.field({ label: 'Email', control: ui.input({ value: f.email, type: 'email' }) }),
          ui.field({ label: 'Mobile', control: ui.input({ value: f.phone }) })
        ])),
        commentsCard()
      ]));
    }

    /* The dates and the commitment sit with the review, before the policies,
       because they are what the policies are about. */
    if (p === 'as') out += sec(ui.grid(2, [datesCard(), commitmentCard()]));

    out += sec(head('Safety') + safetyCards());
    out += policySection(p);

    /* After-school is paid by a link the studio emails, so it has no card
       fields here — the other paid programmes take payment on submit. */
    if (p !== 'as') out += sec(ui.grid(2, [signInCard(), paymentCard(p)]));
    out += sec(ui.grid(null, [commentsCard()]));
    return out;
  }

  /* ---- labels --------------------------------------------------------------------- */

  /* The stepper says "and", like every page title it leads to. */
  var STEP_LABELS = {
    as: ['Family and children', 'Hours and days', 'Review and submit'],
    camp: ['Family and children', 'Which week', 'Review and pay'],
    nsd: ['Family and children', 'Date and hours', 'Review and pay'],
    priv: ['Family and children', 'Hours and when', 'Review and send'],
    pop: ['Family and children', 'Which event', 'Review and pay'],
    bday: ['Host and child', 'The party', 'Review and send']
  };

  var TITLES = {
    as: ['Who is enrolling?', 'Choose your hours', 'Review and submit'],
    camp: ['Who is enrolling?', 'Pick a week', 'Review and pay'],
    nsd: ['Who is enrolling?', 'Pick a date and how long', 'Review and pay'],
    priv: ['Who is enrolling?', 'How many hours, and when', 'Review and send'],
    pop: ['Who is enrolling?', 'Reserve a place', 'Review and pay'],
    bday: ['Who is hosting?', 'Plan the party', 'Check your request']
  };

  function subFor(p, s) {
    var whoSub = 'We ask once. Next time you book anything at the studio, this is already ' +
      'filled in. Add every child you want to enroll — allergies and medical notes travel with ' +
      'them onto every roster.';
    if (s === 0) {
      return p === 'bday'
        ? 'Three lines and we can get back to you. No account, no policies, nothing charged.'
        : whoSub;
    }
    if (s === 1) {
      if (p === 'as') return 'A plan is hours a month for one child, and the rate per hour ' +
        'falls as the plan grows. Choose the plan, then how you would like to split those hours ' +
        'across the week — the days you pick are yours for the program year. Places update ' +
        'live; if a class you want is full you can join the waitlist, and we do not turn families away.';
      if (p === 'camp') return 'Camp runs ' + campHours() + ' every day. Add extra hours on any day if you need a longer one.';
      if (p === 'nsd') return 'For teacher workdays and county holidays. Three hours is standard; extend by the hour if you need to.';
      if (p === 'priv') return 'One-to-one with an instructor at ' + m0(P.priv.hourly) + ' an hour, up to ' +
        P.priv.maxHours + ' hours. Requests are approved by the studio before a time is set.';
      if (p === 'pop') return 'One-off evenings for a single project. Places are limited and go quickly.';
      return 'A planning checklist, not a booking form. Tell us what you want and we send a written quote — nothing is charged today.';
    }
    if (p === 'as') {
      return asWaiting()
        ? 'Tick the policies, check what you are booking, and submit. Nothing is charged while ' +
          'you are on the waitlist — we email you the moment a place opens.'
        : 'Tick the policies, check what you are booking, and submit. You will receive an email ' +
          'with a secure payment link; the schedule is confirmed once payment has been received, ' +
          'and the plan runs to ' + D.PLAN_YEAR.ends + '.';
    }
    if (p === 'bday') return 'Send this to us and we reply with a written quote and a deposit request. Nothing is charged now.';
    return 'The policies, the safety details and everything you are committing to, before anything is charged.';
  }

  function nextButton(p, s) {
    if (s === 0) {
      return {
        label: p === 'bday' ? 'Continue to the party' : 'Continue to program',
        kind: 'primary', act: 'rStep', n: 1
      };
    }
    if (s === 1) {
      if (p === 'as') {
        /* The split is the one thing that has to add up: hours short of the
           plan are lost, which the card says, but hours over it are hours
           there is nothing to book against. */
        if (!asPerWeek()) {
          return { label: 'Choose your days', msg: 'Choose at least one day and time' };
        }
        if (asChosenHours() > planHours(planKey())) {
          return {
            label: 'That is more than your plan',
            msg: 'Those days come to ' + asChosenHours() + ' hours a month, more than your ' +
              'plan of ' + planHours(planKey())
          };
        }
        if (asWaiting()) {
          return { label: 'Join the waitlist', kind: 'primary', act: 'rStep', n: 2 };
        }
      }
      return {
        label: p === 'bday' ? 'Continue to the review' : 'Continue to policies',
        kind: 'primary', act: 'rStep', n: 2
      };
    }
    var set = polSet(p), n = set.length, done = polAgreed(p);
    if (n && done < n) {
      return { label: 'Agree to all ' + n + ' to continue', msg: 'Please agree to all ' + n + ' policies' };
    }
    if (p === 'as') {
      return {
        label: asWaiting() ? 'Submit and join the waitlist' : 'Submit registration',
        kind: 'primary', to: 'rDone', id: p
      };
    }
    if (p === 'bday') return { label: 'Send my party request', kind: 'primary', to: 'rDone', id: p };
    /* A private is approved before it is scheduled and charged, so the button
       cannot ask for money the same page says is not taken today. */
    if (p === 'priv') return { label: 'Send the request', kind: 'primary', to: 'rDone', id: p };
    return {
      label: m(quote(p).due) + ' — confirm and pay',
      kind: 'primary', to: 'rDone', id: p
    };
  }

  function footNote(p, s) {
    if (s === 2) {
      if (p === 'as') {
        return asWaiting()
          ? 'Nothing is charged now, and nothing is charged for waiting.'
          : 'Nothing is charged now — we email you a secure payment link.';
      }
      if (p === 'bday') return 'Nothing is charged when you send this.';
      if (p === 'priv') {
        return 'You are agreeing to the ' + polSet(p).length + ' policies above. Nothing is ' +
          'charged until we approve the request and agree a time.';
      }
      return 'You are agreeing to the ' + polSet(p).length + ' policies above.';
    }
    return 'Your answers are kept as you move between steps.';
  }

  /* ---- the screen ------------------------------------------------------------------- */

  Grove.screen('rFlow', {
    surface: 'registration',
    keepSurface: true,
    crumbTitle: 'Enrollment',
    eyebrow: function (ctx) { return 'step ' + (stepNo() + 1) + ' of 3'; },
    title: function (ctx) { return TITLES[progId(ctx)][stepNo()]; },
    sub: function (ctx) { return subFor(progId(ctx), stepNo()); },
    /* On every step, including the last one: the policies step is where a
       parent is most likely to want to stop and come back. */
    actions: [{ label: 'Save and finish later', msg: 'Saved · we emailed you a link to finish' }],

    body: function (ctx) {
      var p = progId(ctx);
      var s = stepNo();
      var out = ui.steps(STEP_LABELS[p], s);

      if (s === 0) out += stepWho(p);
      else if (s === 1) out += stepWhat(p);
      else out += stepConfirm(p);

      var back = s === 0
        ? { label: 'Back to the programmes', to: 'rPick' }
        : { label: 'Back', act: 'rStep', n: s - 1 };

      out += ui.formActions([nextButton(p, s), back]);
      out += hint(footNote(p, s));
      return out;
    }
  });
})();
