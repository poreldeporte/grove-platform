/* Registration → Confirmation. The last screen of the enrolment flow.

   Simplified against the old confirmation:
     - the filled hero card, the character SVG and the loose button row are
       gone. The page header, two equal cards and one notice say the same
       things, and the screen is now built like every other screen here.
     - "A new parent portal is coming" is gone — the portal exists, and the
       first button opens it.
     - "Lucas is not enrolled yet" is gone. The rebuilt flow puts every child
       you added on the same plan, so that row can no longer be true.
     - the hard-coded $540 a month, "Monday 3:15pm for the whole school year"
       and "next charge is 1 September" were written for the after-school
       story and rendered on camp, pop-up and party bookings too. Every figure
       here is recomputed from Grove.data.PRICING and the class actually
       chosen, and one-off bookings say plainly that there is nothing more to
       pay.
     - "prorated first invoice" dropped: the rebuilt flow does not prorate.

   Fixed after the visual review:
     - the title named only the first child ("Emma is enrolled") on a booking
       that had put two children on the same plan. It now names every child
       the booking covers, and the verb agrees with how many there are.
     - the screen declared the child enrolled, dated the first class and
       showed a $1,275.00 invoice while steps 2 and 3 said the class was full,
       the family had joined the waitlist and nothing had been charged. Every
       line — title, sub-heading, card title, rows, footer and the next-steps
       list — now reads the same asWaiting() state flow.js reads, from the
       same class record, so the three screens cannot disagree.
     - a private class said "Paid today" beside an amount, while step 3 says
       nothing is charged until the studio approves the request and agrees a
       time. It now says "Cost once approved", with "Due today" at zero, which
       is what the running total on step 3 says.
     - every amount is still derived from Grove.data.PRICING and the rows on
       screen: the next-steps card spells the invoice out line by line and the
       arithmetic lands on the same figure as the card beside it.
     - the clip-art bird in the card footer is gone. It was the only off-palette
       image in the prototype.
     - "what to bring on the first day" is the studio's Seasonal Camp
       announcement and tells you to send a snack. After-school families sign a
       policy that forbids food in class, so the reminder now shows only on the
       programmes whose policy set includes the food policy — camp, no-school
       days and pop-ups.
     - the two cards are balanced by content, so neither ends in dead space.

   The selections are read back from the same keys the flow writes, so the
   figures here and on the review step agree. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;
  var P = D.PRICING;

  var DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  var FIRST_CLASS = 'Monday 17 Aug 2026';   /* the program year opens then */
  var NEXT_MONTH = '1 Sep 2026';
  var BDAY_DATE = 'Sat 12 Sep 2026';        /* the date step 2 asks for */
  var REF = 'GRV-8841';

  /* ---- small helpers -------------------------------------------------------- */

  function pick(key, fallback) { return Grove.tab(key, fallback); }
  function m(n) { return Grove.money(n); }
  function m0(n) { return Grove.money(n, { cents: false }); }
  function plural(n, one, many) { return n === 1 ? one : many; }
  function row(k, v, tone) { return { k: k, v: esc(v), tone: tone || null }; }
  function strongRow(k, v) {
    return { k: k, v: h`<span class="strong">${v}</span>`, tone: 'grove' };
  }
  function byId(list, id) {
    var i;
    for (i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function classesFor(p) {
    return D.CLASSES.filter(function (c) { return c.prog === p; });
  }
  function places(c) { var n = c.cap - c.en; return n > 0 ? n : 0; }
  function when(c) { return c.day + ' ' + c.time + ' · ' + c.room; }

  function progId(ctx) {
    var id = ctx && ctx.params ? ctx.params.id : null;
    return D.PROGRAMS[id] ? id : 'as';
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
    if (names.length === 1) return names[0];
    return names.slice(0, names.length - 1).join(', ') + ' and ' + names[names.length - 1];
  }
  function isAre(names) { return names.length === 1 ? ' is' : ' are'; }

  /* ---- what was chosen, per program ------------------------------------------ */

  var PLAN_KEYS = ['p4', 'p8', 'p12', 'p16'];
  function planKey() {
    var cur = pick('rPlan', 'p8');
    return PLAN_KEYS.indexOf(cur) === -1 ? 'p8' : cur;
  }
  function planLabel(key) { return key.slice(1) + ' Classes / Month'; }
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
  function asClass() {
    var list = classesFor('as').filter(function (c) { return c.band === asBand(); });
    var found = byId(list, pick('rClass', '')), i;
    if (found) return found;
    for (i = 0; i < list.length; i++) if (places(list[i]) > 0) return list[i];
    return list[0] || null;
  }
  /* The same two functions step 2 and step 3 use. A class with no place left
     is a waitlist place: nothing is booked and nothing is charged. */
  function asWaiting() {
    var c = asClass();
    return !!c && !places(c);
  }
  function asWaitPosition() {
    var c = asClass();
    return c ? c.wl + 1 : 0;
  }

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

  /* After-school, itemised exactly as the running total on step 3 itemises it,
     so the two screens land on the same number from the same arithmetic. */
  function asMoney() {
    var n = kidCount();
    var base = P.as.plans[planKey()] * n;
    var fee = P.as.regFee * n;
    var relief = P.as.regFee * 0.5 * (n - 1);
    return { n: n, base: base, fee: fee, relief: relief, invoice: base + fee - relief };
  }
  function asBreakdown() {
    var q = asMoney();
    return q.n + plural(q.n, ' child', ' children') + ' on the ' + planLabel(planKey()) +
      ' plan, ' + m(q.base) + ', plus ' + m(q.fee) + ' registration' +
      (q.relief ? ' less ' + m(q.relief) + ' sibling discount' : '') + ' — ' + m(q.invoice) + '.';
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
        row(asWaiting() ? 'First invoice, if a place opens' : 'First invoice', m(asMoney().invoice)),
        strongRow('Due today', m(0))
      ];
    }
    if (p === 'camp') return [strongRow('Paid today', m(campTotal()))];
    if (p === 'nsd') return [strongRow('Paid today', m(nsdTotal()))];
    if (p === 'pop') return [strongRow('Paid today', m(popTotal()))];
    /* A private is approved before it is scheduled, so nothing is taken on
       submit — the same two rows step 3 shows. */
    if (p === 'priv') {
      return [row('Cost once approved', m(privTotal())), strongRow('Due today', m(0))];
    }
    return [strongRow('Cost', 'Quote to follow')];
  }

  /* ---- the one-line summary under the title ----------------------------------- */

  function bookedLine(p) {
    var c, ev, hrs, days;

    if (p === 'as') {
      c = asClass();
      if (!c) return 'Your place is being held while we find the right class.';
      if (asWaiting()) {
        return c.day + ' ' + c.time + ' in ' + c.room + ' with ' + c.staff +
          ', number ' + asWaitPosition() + ' on the list.';
      }
      return c.day + ' ' + c.time + ' in ' + c.room + ' with ' + c.staff +
        ', every week from ' + FIRST_CLASS + '.';
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
    var pr = D.program(p), rows = [], c, ev, hrs;

    rows.push({ k: 'Program', v: h`${raw(ui.dot(pr.color))} ${pr.name}` });

    if (p === 'as') {
      c = asClass();
      rows.push(row('Plan', planLabel(planKey())));
      rows.push(row('Age group', 'Ages ' + asBand()));
      rows.push(c ? row('Class', when(c)) : row('Class', 'Not chosen', 'mute'));
      if (asWaiting()) {
        rows.push(row('Waitlist', 'Number ' + asWaitPosition() + ' on the list'));
        rows.push(row('First class', 'The week after a place is offered'));
      } else {
        rows.push(row('First class', FIRST_CLASS));
      }

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

    } else if (p === 'nsd') {
      c = nsdClass();
      rows.push(c ? row('Date', c.name) : row('Date', 'Not chosen', 'mute'));
      rows.push(c ? row('Hours', nsdStart(c) + ' to ' + nsdEnd(c))
                  : row('Hours', nsdHours() + ' hours'));
      rows.push(c ? row('Room', c.room) : row('Room', 'To be confirmed', 'mute'));

    } else if (p === 'priv') {
      hrs = privHours();
      rows.push(row('Hours', hrs + plural(hrs, ' hour', ' hours') + ' at ' +
        m0(P.priv.hourly) + ' an hour, per child'));
      rows.push(row('Scheduling', 'Approved, then agreed with you'));

    } else if (p === 'pop') {
      ev = popEvent();
      c = popClass(ev);
      rows.push(row('Event', ev.label));
      rows.push(row('When', popWhen(ev)));
      rows.push(c ? row('Ages', c.band) : row('Ages', 'All ages'));

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

  function nextRows(p) {
    var color = D.program(p).color, q;

    if (p === 'as') {
      q = asMoney();
      if (asWaiting()) {
        return [
          step(color, 'Waitlist confirmation, by email',
            'The class you asked for, your place on the list and what the invoice would be.'),
          step(color, 'Nothing has been charged',
            'Joining the list is free, and nothing is charged while you wait.'),
          step(color, 'Number ' + asWaitPosition() + ' on the list',
            'Places are offered in the order families join. Nobody is turned away.'),
          step(color, 'If a place opens you have 24 hours',
            'We email you the moment one does. Accept, and a secure payment link follows.'),
          step(color, 'What that first invoice covers', asBreakdown()),
          step(color, 'Then ' + m(q.base) + ' a month, billed on the 1st',
            'The full plan price, from the month after you start. 30 days notice to cancel.')
        ];
      }
      return [
        step(color, 'Enrolment confirmation, by email',
          'Your plan, your weekly schedule, the first class date and the amount that follows.'),
        step(color, 'A secure payment link for ' + m(q.invoice), asBreakdown()),
        step(color, 'First class ' + FIRST_CLASS,
          'The program year opens then. All materials are provided — dress for mess.'),
        step(color, 'Then ' + m(q.base) + ' a month from ' + NEXT_MONTH,
          'Billed on the 1st, at the full plan price. 30 days written notice to cancel.'),
        step(color, 'Cancel a class 24 hours ahead',
          'Do it in the portal and the class becomes a make-up credit for that month.')
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
        step(color, 'Then a payment link for ' + m(privTotal()),
          'Nothing is charged until the class is confirmed.')
      ];
    }

    return [
      step(color, 'Check your email',
        'Receipt, a copy of the policies you signed, and what to bring on the first day.'),
      step(color, 'Your place is held',
        'It is on the roster from today. Nobody else can take it.'),
      step(color, 'Nothing further to pay',
        'A single payment. Camps, day camps and pop-ups are non-refundable.'),
      step(color, 'A booked day is a held place',
        'Missing it does not create a make-up class, a refund or a credit.')
    ];
  }

  /* The first-session reminder is the studio's own announcement, word for
     word. It asks you to send a snack, so it is shown only on the programmes
     whose policies expect food — after-school families agree to the opposite. */
  function bringText() {
    var a = D.ANNOUNCEMENTS.filter(function (x) {
      return x.head.toLowerCase().indexOf('what to bring') !== -1;
    })[0];
    return a ? a.body : '';
  }

  function reminder(p) {
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
          { label: 'Open the family portal', kind: 'primary', to: 'fHome' },
          { label: 'Book something else', to: 'rPick' }
        ]))}`;
    }
  });
})();
