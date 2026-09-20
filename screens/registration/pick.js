/* Registration → what would you like to book.

   The public entry point. Six programme cards, one per programme in
   Grove.data.PROGRAMS, each dropping straight into the enrollment flow.

   Simplified against the spec:
     - the per-card tag repeated whatever the price unit already said two
       inches below it, so the unit says it once
     - the per-card availability line ("2 weeks left", "8 dates") is not in
       Grove.data and would be a promise we cannot keep. The flow shows the
       real places on the class you pick
     - the camp card no longer arrives pre-seeded with week 5 and a full week
       of days. A parent landing from an ad has not chosen a week yet, and the
       next screen asks properly.

   Corrected: the spec's fine print claimed every price shown includes the
   fees that apply to it. It does not — the flow adds a registration fee from
   PRICING — so the fine print now says what is actually charged.

   PRICING MODEL — A PLAN IS HOURS A MONTH, AND ONLY AFTER-SCHOOL HAS ONE
     This card used to sell a "pack of sessions" that "renews when the last one
     is used" and whose "sessions do not expire". None of that is the studio's
     model, so all three claims are gone.
     - After-School is a plan measured in HOURS A MONTH. PRICING.as.plans p4 …
       p16 is the number of hours the plan buys, and the amount is the price of
       those hours, so the card counts the rungs off PRICING rather than
       writing them down and cannot drift from what the studio bills. The rate
       per hour is price ÷ hours, which is why it falls as the plan grows.
     - how the hours are split is the parent's choice, not a rule this screen
       enforces: the same 16 hours is eight two-hour classes or sixteen
       one-hour ones, so the card says that instead of counting classes.
     - the price foot no longer reads "a pack of 4". It reads what $280 buys.
     - camp, no-school days, private classes, pop-ups and birthdays are ONE-OFF
       bookings. They have no plan, no cycle and nothing to renew, and the
       fine print says so once for all five rather than on each card.
     - a plan ends by itself with the school year (PLAN_YEAR), hours not booked
       are lost (RULES.unusedHours) and a class cancelled a day ahead comes
       back as a make-up (RULES.cancelNotice).

   FINAL PRICING PASS — WHAT THIS SCREEN STILL OWED THE PARENT
     The cards were already on the hours-a-month model, so the prices, the
     rungs and the one-off line are unchanged. Three facts a parent needs
     BEFORE they commit were only being said later, inside the signing flow,
     and they are now said here:
     - WHEN THE MONEY MOVES. The plan notice used to describe the plan year and
       say nothing about billing. It now says the invoice for a cycle is raised
       on the child's last class of the one before and names the dates it
       covers — the same sentence the family screens use. It deliberately does
       NOT say "billed on the 1st", because the studio does not bill that way.
     - THE MAKE-UP WINDOW. A make-up was mentioned with no expiry. The window
       is a studio setting with two options, so it is rendered from
       RULES.makeupWindow through the same phrasing family/billing.js uses and
       neither option is written into this file.
     - LEAVING. A plan is a commitment to the school year, so RULES.cancelPlan
       (30 days' written notice) belongs on the page where the parent takes the
       commitment on, not only on the page where they try to end it.
     Those went into a second notice rather than onto the end of the first one,
     which was already a five-sentence paragraph. The rest of the signed rules
     — where a make-up may be taken, the four things it can never do, that
     plans are not frozen — stay in the flow and in Family → Documents. A
     landing page that recites the whole policy is a policy page.

     Not on this screen, on purpose: the manual charge ("make sale / post
     sale") for an extra class, a private class or an event. That is the
     owner's till in the console, and the point of it is that the exceptions
     do not need a rule here.

   FIXED AFTER VISUAL REVIEW
     - The six badge PNGs are gone. Their lettering was an illegible smudge at
       the size they rendered and their fills (hot magenta, bright violet) are
       in no palette this product owns. A program is now marked the way it is
       marked on Console -> Programs and on every other screen in the app:
       ui.dot(program.color), which is the --prog-* token for that program.
     - The fee note said "$130 for After-School Art" and "$15 for everything
       else" as though both were flat. The flow bills either fee per child,
       so the note says "per child". The name of the charge is unchanged: the
       running total, the package footnote and the sibling banner in
       registration/flow.js all call it a registration fee too.
     - "forty-four activities" on the birthday card and "nearly gone" on the
       pop-up card were figures no row in Grove.data carries. The birthday
       blurb no longer counts, and the pop-up names the next event from
       PRICING.pop.events instead of promising it is nearly sold out. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  var ORDER = ['as', 'camp', 'nsd', 'priv', 'bday', 'pop'];

  function m0(n) { return Grove.money(n, { cents: false }); }
  /* An hourly rate shows cents only when it has them: $70, but $67.50. */
  function rate(n) { return Grove.money(n, { cents: n % 1 !== 0 }); }

  /* The plans on sale, counted off PRICING.as.plans. p4 … p16 is the number of
     HOURS A MONTH the plan buys and the amount is what those hours cost, so
     the rate per hour is the amount divided by the hours. */
  function rungs() {
    return Object.keys(D.PRICING.as.plans).map(function (key) {
      var hours = parseInt(key.slice(1), 10);
      var price = D.PRICING.as.plans[key];
      return { hours: hours, price: price, perHour: price / hours };
    }).sort(function (a, b) { return a.hours - b.hours; });
  }

  function joinList(parts) {
    if (parts.length < 2) return parts[0] || '';
    return parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1];
  }

  /* The five programmes that are booked one at a time, named from PROGRAMS. */
  function oneOffNames() {
    return joinList(ORDER.filter(function (id) { return id !== 'as'; })
      .map(function (id) { return D.program(id).name; }));
  }

  /* How long a make-up lasts is a studio setting with two options, so the
     sentence is built round whichever one is set. Same phrasing as the
     family billing screen, so a parent reads one rule in two places. */
  function makeupWindow() {
    var w = String(D.RULES.makeupWindow);
    return w === 'same cycle' ? 'in the same cycle' : 'within ' + w;
  }

  /* The same words the console shows on Programs, so a parent and the owner
     are reading one description of the same thing. Every figure in them comes
     from PRICING. */
  function blurbOf(id) {
    var P = D.PRICING;
    if (id === 'as') {
      var top = rungs()[rungs().length - 1];
      return 'A fixed day and time for the whole school year, on a plan measured in hours a month ' +
        'rather than in classes. How you split the hours is your choice: a child on ' + top.hours +
        ' hours comes ' + (top.hours / 2) + ' times a month for two-hour classes, or ' + top.hours +
        ' times for one-hour ones.';
    }
    if (id === 'camp') {
      return 'Full days of making through the summer and school breaks. Take a whole week, or pick ' +
        'individual days at ' + m0(P.camp.day) + ' a day.';
    }
    if (id === 'nsd') {
      return 'For teacher workdays and county holidays. Book the day, and add extra hours at ' +
        m0(P.nsd.extraHour) + ' an hour if you need them.';
    }
    if (id === 'priv') {
      return 'One-to-one time with an instructor, on a subject your child chooses. Up to ' +
        P.priv.maxHours + ' hours in a session.';
    }
    if (id === 'bday') {
      return 'A party built round a theme and a project you choose. Tell us what you want and we ' +
        'will price it.';
    }
    return 'One-off evenings for a single project. ' + P.pop.events[0].label + ' is the next one.';
  }

  /* Only After-School has more than one price, because only After-School has a
     plan. The card foot shows the smallest plan; this says what the rest cost
     and why the bigger ones are cheaper by the hour. */
  function noteOf(id) {
    if (id !== 'as') return '';
    var list = rungs();
    var rest = list.slice(1).map(function (r) { return r.hours + ' hours ' + m0(r.price); });
    return 'Also ' + joinList(rest) + '. The rate per hour falls as the plan grows, from ' +
      rate(list[0].perHour) + ' an hour to ' + rate(list[list.length - 1].perHour) + '.';
  }

  /* What a family pays, read from PRICING. After-School is priced by the hours
     a month it buys; everything else is a one-off price for one booking. */
  function priceOf(id) {
    var P = D.PRICING;
    if (id === 'as') {
      var first = rungs()[0];
      return { amount: m0(first.price), unit: 'for ' + first.hours + ' hours a month' };
    }
    if (id === 'camp') return { amount: m0(P.camp.week),   unit: 'a week' };
    if (id === 'nsd')  return { amount: m0(P.nsd.base),    unit: 'a day' };
    if (id === 'priv') return { amount: m0(P.priv.hourly), unit: 'an hour' };
    if (id === 'bday') return { amount: 'Tell us',         unit: 'and we quote' };
    return { amount: m0(P.pop.events[0].amount), unit: 'a child' };
  }

  /* What a plan is: a year, a fixed day and time, hours a month, and an
     invoice that arrives on a class rather than on a date in the month. */
  function planLine() {
    return oneOffNames() + ' are one-off bookings: you pay for what you book, and there is nothing ' +
      'to renew or cancel. ' + D.PLAN_YEAR.note + ' The ' + D.PLAN_YEAR.label + ' year ends ' +
      D.PLAN_YEAR.ends + '. You pick your day and time when you register and they stay yours for ' +
      'the year. The invoice for each cycle is raised on your child’s last class of the one before ' +
      'and it names the dates it covers. ' + D.RULES.unusedHours;
  }

  /* A rule read out of D.RULES is a sentence of its own, so joining one onto
     the end of another needs its first letter dropped to lower case. */
  function lcFirst(text) {
    return String(text).charAt(0).toLowerCase() + String(text).slice(1);
  }

  /* The two rules a parent should read before they commit, not after: what a
     missed class costs, and what leaving costs. Both come from D.RULES. */
  function ruleLine() {
    return 'Cancel at least ' + D.RULES.cancelNotice + ' before a class, in the portal, and your ' +
      'child gets a make-up, taken ' + makeupWindow() + '. Later than that, or a no-show, and ' +
      lcFirst(D.RULES.lateCancel) + ' Leaving a plan before the year ends takes ' + D.RULES.cancelPlan;
  }

  function feeLine() {
    var P = D.PRICING;
    return 'A registration fee is added at the end: ' + m0(P.as.regFee) + ' per ' + P.as.regFeePer +
      ' for ' + D.program('as').name + ', with ' + P.as.siblingRelief + '. ' + m0(P.camp.regFee) +
      ' a child for everything else' + (P.bday.regFee ? '' : ', and none for a birthday') + '.';
  }

  function programCard(id) {
    var p = D.program(id);
    var price = priceOf(id);

    return ui.card({
      title: p.name,
      head: ui.dot(p.color),
      note: noteOf(id),
      foot: h`<span><span class="strong num">${price.amount}</span> <span class="mute">${price.unit}</span></span>` +
        ui.btn({ label: 'Book this', kind: 'quiet', size: 'sm', to: 'rFlow', id: id })
    }, h`<p class="hint">${blurbOf(id)}</p>`);
  }

  Grove.screen('rPick', {
    surface: 'registration',
    keepSurface: true,
    crumbTitle: 'Book & enroll',
    eyebrow: 'let’s get you booked',
    title: 'What would you like to book?',
    sub: 'One form, five minutes. Everything we ask for is kept, so the next thing you book is quicker.',

    body: function () {
      var cards = ui.grid(3, ORDER.map(programCard));

      var plan = ui.notice({
        title: 'Only ' + D.program('as').name + ' runs on a plan.',
        text: planLine()
      });

      var rules = ui.notice({
        title: 'Missing a class, and leaving a plan.',
        text: ruleLine()
      });

      var fine = ui.notice({
        title: 'Ages 5–7, 8–11 and 12+. All materials provided.',
        text: feeLine()
      });

      return h`${raw(cards)}<div class="section">${raw(plan)}${raw(rules)}${raw(fine)}</div>`;
    }
  });
})();
