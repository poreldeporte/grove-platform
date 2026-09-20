/* Console → Settings. Four tabs: Studio, Pricing, Policies, Messages.

   WHO THIS IS FOR
   Sabrina, at a desk, with a keyboard. Density is right here — a rule sheet
   should read as a rule sheet. What was wrong was not the density, it was
   that nothing on the screen did anything.

   THIS PASS — HOURS A MONTH, AND ONE MANUAL CHARGE FOR EVERY EXCEPTION

   A plan is a number of HOURS a month for one child, and only after-school has
   one. The parent says at registration how they want the hours split, so a
   16-hour plan is sixteen one-hour classes or eight two-hour ones. The plan
   runs to the end of the school year and ends there. Everything else the
   studio sells — camp, no-school days, private classes, pop-ups, birthdays —
   is a one-off booking with no plan, no cycle and no renewal.

   1. PRICING. The four tiers are hours a month, not packs of sessions: $280
      buys four hours, and the hour costs less as the plan grows. The rate is
      divided out of the plan price rather than read from PRICING.as
      extraClassRate — the two agree to the cent, and printing both would have
      read as two prices for the same hour. The registration fee is annual and
      per child, and the 50% sibling relief is shown on the fee it actually
      reduces rather than in a list of tuition discounts.

   2. THE PACK VOCABULARY IS GONE. No pack, no sessions used, no "renews on
      the 8th class", no expiring credit. An invoice is raised on the last
      class of a cycle and covers the next one, and it lists the dates it pays
      for — that listing is the thing the owner did by hand, so the merge field
      that writes it is named on the Messages tab.

   3. "Multi-class · 10%" and "Staff family · 100%" left the price sheet. Both
      were tuition reductions invented by an earlier pass; under a settled
      model the hour already costs less as the plan grows, and the one real
      reduction — issued against one family, with a reason, from Billing — is
      stated where the manual charges are.

   4. ONE MANUAL CHARGE, NOT A RULE PER EXCEPTION. A child whose school
      finishes a week after the program, a private class that comes up, an
      event: the studio picks the family, says what it is for, enters the
      amount and charges the card on file. The Pricing tab shows what has been
      charged that way, off Grove.data.SALES, and opens Post a sale, the
      owner's own “make sale”, which owns the action. No school end dates, no
      event billing, no extra-class rules are modelled here, because the whole
      point of the manual charge is that they do not need to be.

   5. THE MAKE-UP WINDOW IS A REAL CHOICE, because it is the one rule the owner
      is actively weighing: the policy families have signed says the same
      billing cycle, and she wants to move to 30 days from the missed class.
      Both options come from D.RULES.makeupWindowOptions and neither is written
      into this file. Every other make-up rule is rendered from D.RULES as the
      family signed it, so no screen invents a second version.

   6. The Friday "extra classes only" hours left the Class times card. A
      make-up is taken in any age-appropriate class with a free place, so a
      make-up-only hour on the timetable contradicted the rule three cards
      away. The extra class itself still lives on the family and class screens.

   WHAT CARRIES OVER FROM THE EARLIER PASSES
   - Twenty-two buttons that all opened the same toast are gone. The screen
     edits what it owns, in the card, and routes to the screen that owns the
     rest: a price -> Programs, a class time -> Classes, a reduction or a
     manual charge for one family -> Billing. A template row is itself the
     control.
   - ONE THING, ONE BAR. Every tab ends in ui.formActions(..., {sticky:true}),
     with a state line saying what saving does to families. Pricing is the
     exception and says so: it sets no prices, so its bar opens the program
     that charges the price rather than pretending to save.
   - A control whose answer was always the same is a stated fact in the card
     note: the retry cadence, the three registration questions that cannot be
     switched off, text messages having no provider connected.
   - The grace period and the late fee it triggers are one rule in one card.

   FACTS DERIVED, NOT TYPED
   - Class times and the length of a class come from Grove.data.CLASSES; the
     payment methods from INVOICES; every amount from PRICING; the program
     count from PROGRAMS; the emails under the automatic switch from the
     template rows above it; the policy counts from one list plus the
     per-program adds and drops; the make-ups given and the classes counted as
     attended from ABSENCES; the manual charges from SALES; the year and its
     end date from PLAN_YEAR; every make-up and cancellation rule from RULES.
   - A plan key counts the hours it buys, so the tier, the hour rate and the
     split into classes are arithmetic on the key and cannot drift apart.

   NOT BUILT HERE
   - No policy editor and no template editor beyond the wording screen below.
   - No studio address: Grove.data has none, and a receipt needs a real one.
   - The per-family "Billing settings" form (key fBilling) belongs to the
     family portal's Billing screen in nav.js, and is not registered here.

   The amounts PRICING does not hold — the late fee, the pick-up grace and its
   per-minute rate — are named constants below, worded verbatim as the
   registration flow's policy text words them, so this screen and the document
   a family signs cannot disagree. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, esc = Grove.esc, D = Grove.data;

  var P = D.PRICING;
  var R = D.RULES;

  /* Verbatim from the policy text in screens/registration/flow.js. */
  var GRACE_DAYS = 7;          // "a 7-day grace period"
  var LATE_FEE = 25;           // "a $25 late fee after the seven-day grace"
  var PICKUP_GRACE = 10;       // "a 10-minute grace period"
  var PICKUP_RATE = 1;         // "a late fee of $1 per minute"
  var NSD_BASE_HOURS = 3;      // the no-school block PRICING.nsd.base buys
  var RETRY_DAYS = [1, 3, GRACE_DAYS];

  /* A plan key counts the hours it buys a month: p8 is eight hours. */
  var PLAN_KEYS = ['p4', 'p8', 'p12', 'p16'];

  /* The make-up window is the one rule the studio is still deciding, so it is
     a control rather than a sentence. The options come from the data. */
  var MK_KEY = 'mkWindow';
  Grove.on('setMkWindow', function (d) { Grove.setFilter(MK_KEY, d.id); });

  function money(n) { return Grove.money(n, { cents: false }); }
  /* A rate that may carry cents — $67.50 must not round to $68. */
  function rate(n) { return n % 1 === 0 ? Grove.money(n, { cents: false }) : Grove.money(n); }
  function cap(s) { return String(s).charAt(0).toUpperCase() + String(s).slice(1); }

  /* A signed rule is often two sentences: the rule, then what follows from it.
     The first belongs in a value column, the rest in the note beside it. */
  function firstOf(s) {
    var i = String(s).indexOf('. ');
    return i === -1 ? String(s) : String(s).slice(0, i);
  }
  function restOf(s) {
    var i = String(s).indexOf('. ');
    return i === -1 ? '' : String(s).slice(i + 2);
  }

  /* One stated fact: name on the left, value on the right. A note is divided
     from the value by a middot so the two never read as one phrase, and
     anything long enough to push the value out of its column belongs in the
     label or the card note instead. */
  function row(k, v, note, tone) {
    return {
      k: k,
      v: esc(v) + (note ? ' <span class="cell-sub">· ' + esc(note) + '</span>' : ''),
      tone: tone || null
    };
  }

  /* The bar at the foot of every tab. One action, and a line saying what it
     does to families — she has nobody to undo it for her. */
  function bar(action, hint) {
    return ui.formActions([action], { sticky: true, hint: hint });
  }
  function save(done) {
    return { label: 'Save changes', kind: 'primary', msg: done };
  }
  function route(label, screen) {
    return { label: label, kind: 'primary', to: screen };
  }
  function link(label, screen) {
    return ui.btn({ label: label, kind: 'quiet', size: 'sm', to: screen });
  }

  /* ---- small derivations over Grove.data ----------------------------------- */

  function distinct(list) {
    var out = [];
    list.forEach(function (v) { if (out.indexOf(v) === -1) out.push(v); });
    return out;
  }

  function andList(a) {
    if (a.length < 2) return a.join('');
    return a.slice(0, a.length - 1).join(', ') + ' and ' + a[a.length - 1];
  }
  function orList(a) {
    if (a.length < 2) return a.join('');
    return a.slice(0, a.length - 1).join(', ') + ' or ' + a[a.length - 1];
  }

  /* "Mon–Fri 9:00–19:00" -> "9:00–19:00". */
  function hoursOnly(s) {
    var parts = String(s).split(' ');
    return parts[parts.length - 1];
  }

  /* "2:15–3:15pm" -> "2:15pm"; "10:00am–1:00pm" -> "10:00am". */
  function startOf(t) {
    var parts = String(t).split('–');
    if (/am|pm/.test(parts[0])) return parts[0];
    var m = /(am|pm)/.exec(parts[1] || '');
    return parts[0] + (m ? m[1] : '');
  }

  function classesIn(progId) {
    return D.CLASSES.filter(function (c) { return c.prog === progId; });
  }

  /* "2 hour · After-School" -> 2. How long one class runs, which is what a
     plan's hours are spent on. */
  function lengthOf(cls) {
    var m = /^(\d+)\s*hour/.exec(String(cls.name));
    return m ? Number(m[1]) : 0;
  }
  function hourWord(n) {
    if (n === 1) return 'one-hour';
    if (n === 2) return 'two-hour';
    return n + '-hour';
  }

  var DAY_NAME = {
    Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday',
    Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday'
  };
  var DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  function afterSchoolOn(day) {
    return classesIn('as').filter(function (c) { return c.day === day; });
  }

  /* One row per weekday the studio teaches after school: when the classes
     start, and how long a class runs — because the hours a plan buys are
     spent on these. */
  function dayRows() {
    return DAY_ORDER.filter(function (d) {
      return afterSchoolOn(d).length > 0;
    }).map(function (d) {
      var mine = afterSchoolOn(d);
      var starts = distinct(mine.map(function (c) { return startOf(c.time); }));
      var lens = distinct(mine.map(lengthOf)).filter(function (n) { return n > 0; });
      var note = lens.length ? andList(lens.map(hourWord)) + ' classes' : null;
      return row(DAY_NAME[d] || d, starts.join(' · '), note);
    });
  }

  /* The block a camp or a no-school day runs, straight out of CLASSES. */
  function blockFor(progId) {
    return distinct(classesIn(progId).map(function (c) { return c.time; })).join(' · ');
  }

  /* Card brands and bank transfer, as they appear on invoices already paid. */
  function methodsInUse() {
    return distinct(D.INVOICES.map(function (i) {
      return String(i.method).split(' ')[0];
    })).filter(function (m) { return m !== 'None'; });
  }

  /* What the notice rule has done, counted off the absences on record.
     `spent: false` is a class that came back as a make-up. */
  function absences(spent) {
    return D.ABSENCES.filter(function (a) { return !!a.spent === spent; }).length;
  }

  /* A pop-up is priced per event; print one figure only while they agree. */
  function popPrice() {
    var amounts = distinct(P.pop.events.map(function (e) { return e.amount; }));
    amounts.sort(function (a, b) { return a - b; });
    if (amounts.length === 1) return money(amounts[0]) + ' / child';
    return money(amounts[0]) + '–' + money(amounts[amounts.length - 1]) + ' / child';
  }

  /* p12 buys twelve hours a month; $780 across twelve hours is $65 an hour. */
  function planHours(key) { return Number(key.slice(1)); }
  function perHour(key) { return P.as.plans[key] / planHours(key); }

  function planRow(key) {
    return row(planHours(key) + ' hours a month', money(P.as.plans[key]),
      rate(perHour(key)) + ' an hour');
  }

  /* "16 hours a month is 16 one-hour classes or 8 two-hour classes" — the
     split the registration form asks about, worked out from the class lengths
     the studio actually runs. */
  function splitLine() {
    var top = planHours(PLAN_KEYS[PLAN_KEYS.length - 1]);
    var lens = distinct(classesIn('as').map(lengthOf)).filter(function (n) {
      return n > 0 && top % n === 0;
    });
    lens.sort(function (a, b) { return a - b; });
    if (!lens.length) return '';
    return top + ' hours a month is ' + orList(lens.map(function (n) {
      return (top / n) + ' ' + hourWord(n) + ' classes';
    })) + ', whichever the parent picks at registration.';
  }

  /* The registration fee shared by everything that is neither after-school
     nor a birthday — printed only once the four agree. */
  function sharedRegFee() {
    var fees = distinct(['camp', 'nsd', 'priv', 'pop'].map(function (id) {
      return P[id].regFee;
    }));
    return fees.length === 1 ? fees[0] : null;
  }

  /* ---- the screen ---------------------------------------------------------- */

  Grove.screen('settings', {
    surface: 'console',
    eyebrow: 'how the studio runs',
    title: 'Settings',
    sub: 'The rules the studio runs on: what it is called, how a plan of hours is billed, and the wording of every message that goes out. A price itself is set on the program that charges it.',
    actions: [
      { label: 'Preview what families see',
        msg: 'Preview opened — prices, policies and message wording exactly as a family sees them' }
    ],

    body: function () {
      var tab = Grove.tab('settings', 'Studio');
      var cards;

      if (tab === 'Pricing') cards = pricingTab();
      else if (tab === 'Policies') cards = policiesTab();
      else if (tab === 'Messages') cards = messagesTab();
      else cards = studioTab();

      return ui.toolbar({
        tabs: { key: 'settings', value: tab, items: ['Studio', 'Pricing', 'Policies', 'Messages'] }
      }) + cards;
    }
  });

  /* ---- 1 · Studio ----------------------------------------------------------
     What the studio is called and when it is open — the only things on this
     tab the studio can type. The times it teaches are read from the classes
     that are running, and the processor reports its own state. */

  function studioTab() {
    var studio = ui.card({
      title: 'The studio',
      note: 'Shown on every receipt, every email and the portal footer. The logo and the ' +
        Object.keys(D.PROGRAMS).length + ' program colours are set once and are not changed here.'
    }, ui.fields(2, [
      ui.field({
        label: 'Studio name',
        span: true,
        control: ui.input({ value: D.STUDIO.name }),
        hint: 'Invoices are issued as ' + D.STUDIO.legal + '.'
      }),
      ui.field({ label: 'Reply-to address', control: ui.input({ value: D.STUDIO.email, type: 'email' }) }),
      ui.field({ label: 'Phone', control: ui.input({ value: D.STUDIO.phone }) }),
      ui.field({ label: 'Open, Monday to Friday', control: ui.input({ value: hoursOnly(D.STUDIO.hours) }) }),
      ui.field({ label: 'Open, Saturday', control: ui.input({ value: hoursOnly(D.STUDIO.hoursWeekend) }) })
    ]));

    var times = ui.card({
      title: 'Class times',
      head: link('Open Classes', 'classes'),
      note: 'Read from the classes that are running, so this card and the schedule cannot drift apart. A time is changed on the class itself. A plan buys hours a month and these are the classes that spend them — a two-hour class spends two. Extra camp hours are charged by the hour, see Pricing.'
    }, ui.kv(dayRows().concat([
      row('Camp day', blockFor('camp')),
      row('No-school day', blockFor('nsd'))
    ])));

    var terms = ui.card({
      title: 'Term dates and closures',
      head: ui.btn({
        label: 'Add a closure', kind: 'quiet', size: 'sm',
        msg: 'Closure added — no class that day, and everyone booked is offered a make-up'
      }),
      note: 'No classes run on these dates. A child booked that day keeps the hour: the class comes back to them as a class to make up, booked in the portal. Nobody has to ask.'
    }, ui.kv([
      row('Labor Day', '7 Sep 2026', 'Monday'),
      row('Thanksgiving', '26–27 Nov 2026', 'Thursday and Friday'),
      row('Winter break', '21 Dec – 2 Jan', 'Two weeks'),
      row('Spring break', '15–19 Mar 2027', 'One week')
    ]));

    var payments = ui.card({
      title: 'Payments',
      note: 'ACH costs the studio less than a card, and every invoice and every charge made by hand goes to the method the family has saved, so families setting up autopay are pointed at it first.'
    }, ui.kv([
      row('Processor', 'Connected'),
      row('Methods accepted', methodsInUse().join(' · ')),
      row('Payouts', 'Daily')
    ]));

    return ui.grid(2, [studio, times, terms, payments]) +
      bar(save('Saved — receipts, emails and the portal show the new details'),
        'The name and reply-to address here are on every message a family receives.');
  }

  /* ---- 2 · Pricing ---------------------------------------------------------
     A one-page price sheet. Nothing on this tab is typed here: a price is set
     on the program that charges it, which is the whole point of the tab —
     seeing all six programs' money in one place without opening six records.
     The fees that used to sit here (late payment, late pick-up) are rules
     about paying late, not prices, and have moved to Policies to sit with the
     grace period that triggers them. */

  function pricingTab() {
    var plans = ui.card({
      title: 'After-school plans',
      note: 'The ' + PLAN_KEYS.length + ' plans a family picks from at registration, and the only plans the studio sells. A plan is hours a month, not classes: ' +
        splitLine() + ' The hour costs less as the plan grows, from ' +
        rate(perHour(PLAN_KEYS[0])) + ' down to ' + rate(perHour(PLAN_KEYS[PLAN_KEYS.length - 1])) +
        '. A plan belongs to one child rather than to the family, and it runs to ' +
        D.PLAN_YEAR.ends + ' and ends there. A new price applies to the next plan bought; a plan already running is untouched.'
    }, ui.kv(PLAN_KEYS.map(planRow)));

    var fee = sharedRegFee();
    var reliefPct = Math.round(P.as.siblingFeeRelief * 100);

    var fees = ui.card({
      title: 'Registration fee',
      note: 'Charged per ' + P.as.regFeePer + ' for the after-school program, and on each separate booking of anything else. The relief is on this fee and not on tuition, so a second child pays the same for their hours as the first.'
    }, ui.kv([
      row(D.program('as').name + ' · per ' + P.as.regFeePer, money(P.as.regFee)),
      row('Second and third child · ' + reliefPct + '% off',
        money(P.as.regFee * (1 - P.as.siblingFeeRelief))),
      row('Every other program · per booking', fee === null ? 'Set per program' : money(fee)),
      row(D.program('bday').name, 'None', null, 'mute')
    ]));

    var rest = ui.card({
      title: 'One-off bookings',
      note: 'None of these has a plan, a cycle or a renewal — each booking is paid for once. A full week of camp costs the same as ' +
        Math.round(P.camp.week / P.camp.day) +
        ' single days, so book the week once a child is coming more often than that. A birthday party is quoted from the enquiry.'
    }, ui.kv([
      row('Seasonal camp · full week', money(P.camp.week)),
      row('Seasonal camp · single day', money(P.camp.day)),
      row('Camp · each extra hour', money(P.camp.extraHour) + ' / hour'),
      row('No-school day · first ' + NSD_BASE_HOURS + ' hours', money(P.nsd.base)),
      row('No-school day · each extra hour, ' + P.nsd.maxHours + ' hours in all',
        money(P.nsd.extraHour) + ' / hour'),
      row('Private class · up to ' + P.priv.maxHours + ' hours', money(P.priv.hourly) + ' / hour'),
      row('Pop-up event', popPrice()),
      row(D.program('bday').name, 'Quoted', null, 'mute')
    ]));

    /* The one mechanism for everything the price sheet does not cover. A
       couple of classes because a school finishes later, a private class that
       comes up, an event: pick the family, say what it is for, enter the
       amount, charge the card on file. Billing owns the action; this card
       shows what has gone through it. */
    var sales = ui.card({
      title: 'Charges outside a plan',
      head: link('Post a sale', 'postSale'),
      flush: true,
      note: 'Made by hand from Billing — the family, what it was for, the amount, on the card already on file. It is the “make sale” you do now, and it is the only mechanism for an exception: a class or two when a child’s school finishes after the program does, a private class that comes up, an event, any other service. Extra classes are charged at the family’s own hourly rate from the plans above. A reduction works the same way in reverse, against one family, with your approval and the reason recorded. None of it needs a rule of its own, which is why an exception never waits for one.'
    }, ui.rows(D.SALES.map(function (s) {
      return {
        title: esc(s.what),
        sub: esc(s.fam + ' · ' + s.when + ' · ' + s.by),
        end: esc(money(s.amt))
      };
    })));

    return ui.grid(2, [plans, fees, rest, sales]) +
      bar(route('Open Programs', 'programs'),
        'A price is set on the program that charges it, so there is one place to change it.');
  }

  /* ---- 3 · Policies --------------------------------------------------------
     The studio-wide rules, and the only tab where every control changes
     something no other screen owns. Each card states in its note the part of
     the rule that has no second sensible answer, so the answer is written
     once rather than offered as a choice nobody makes. The exception is the
     make-up window, which genuinely has two answers and is being weighed. */

  /* What each window means to a family. Keyed by the option, so an option the
     data adds still renders — with no sub rather than with the wrong one. */
  var WINDOW_SUB = {
    'same cycle': 'It must be taken before the next invoice. This is the wording families have signed.',
    '30 days from the missed class': 'Thirty days from the class that was missed, whichever cycle that lands in.'
  };

  function windowChoice() {
    var current = Grove.filter(MK_KEY, R.makeupWindow);
    return ui.choices(2, R.makeupWindowOptions.map(function (opt) {
      return ui.choice({
        id: opt,
        act: 'setMkWindow',
        title: cap(opt),
        sub: WINDOW_SUB[opt] || '',
        on: opt === current
      });
    }));
  }

  function policiesTab() {
    var billing = ui.card({
      title: 'Billing rules',
      note: 'Applied to every family, whatever their join date. The invoice is raised on the last class of a cycle and covers the next one, listing the dates it pays for. A plan belongs to one child, so a family with two children receives two invoices. A failed card is retried on day ' +
        andList(RETRY_DAYS.map(String)) + ' and then left for you.'
    }, ui.fields(2, [
      ui.field({
        label: 'Grace period before a late fee',
        control: ui.select({
          value: GRACE_DAYS + ' days',
          options: [GRACE_DAYS + ' days', '14 days', 'No grace period']
        })
      }),
      ui.field({
        label: 'Late fee, once the grace runs out',
        control: ui.input({ value: money(LATE_FEE) })
      }),
      ui.field({
        label: 'Late pick-up · after ' + PICKUP_GRACE + ' minutes',
        span: true,
        control: ui.input({ value: money(PICKUP_RATE) + ' a minute' })
      })
    ]) + '<div class="card-split">' + ui.kv([
      row('Program year', D.PLAN_YEAR.label),
      row('Plans end', D.PLAN_YEAR.ends, restOf(D.PLAN_YEAR.note)),
      row('Cancelling a plan', firstOf(R.cancelPlan), restOf(R.cancelPlan))
    ]) + '</div>');

    /* The rules as the family signed them, in the family's words, plus the one
       decision still open. Nothing here is issued, approved or queued: a
       make-up is booked in the portal in any class with a free place. */
    var signed = [
      { title: esc('Cancel at least ' + R.cancelNotice + ' before the class'),
        sub: esc('In the portal, so a family never has to ask the desk for it.') },
      { title: esc('Later than that, or a no-show'), sub: esc(R.lateCancel) },
      { title: esc('Where a make-up can be taken'), sub: esc(R.makeupWhere) },
      { title: esc('Hours you do not book'), sub: esc(R.unusedHours) },
      { title: esc('Freezing a plan'), sub: esc(R.freeze) }
    ];

    var makeups = ui.card({
      title: 'Missing a class',
      note: 'What families sign on the registration form, in their words. Whichever window is chosen here is the one every screen and every message shows.'
    },
      ui.fields(null, [
        ui.field({
          label: 'A make-up expires',
          control: windowChoice(),
          hint: 'The signed policy says the same billing cycle. Thirty days from the missed class is the fairer, more consistent rule the studio is weighing.'
        })
      ]) +
      '<div class="card-split">' + ui.rows(signed) + '</div>' +
      '<div class="card-split"><p class="hint">A make-up cannot</p>' +
      ui.rows(R.makeupNever.map(function (t) { return { title: esc(t) }; })) + '</div>' +
      '<div class="card-split">' + ui.kv([
        row('Make-ups given so far', String(absences(false)), 'told us in time'),
        row('Counted as attended', String(absences(true)), 'told us too late')
      ]) + '</div>'
    );

    /* The clauses themselves, which is where the wording lives. Which
       programmes carry which is set on the programme; this is the library. */
    var progIds = Object.keys(D.PROGRAMS);
    function carriedBy(name) {
      return progIds.filter(function (pid) { return Grove.policyOn(pid, name); });
    }

    var docs = ui.card({
      title: 'Policy documents',
      flush: true,
      note: 'Open one to change its wording. Publishing a new version asks every family who has ' +
        'signed it to sign again at their next visit, and never blocks a child from attending. ' +
        'Attach or detach a clause on the program itself.'
    }, ui.rows(D.POLICY_ALL.map(function (name) {
      var doc = D.policy(name);
      var on = carriedBy(name);
      return {
        title: esc(name),
        sub: esc('Version ' + doc.version + ' · updated ' + doc.updated),
        end: on.length
          ? ui.mute(on.length === progIds.length
              ? 'On every program'
              : 'On ' + on.map(function (pid) { return D.program(pid).short; }).join(', '))
          : ui.pill('Not in use'),
        to: 'policyDoc', id: name
      };
    })));

    var form = ui.card({
      title: 'Registration form',
      note: 'Every registration asks for allergies and medical notes, at least one authorised pick-up, photo permission for each child separately, and how the family wants to split their hours. Those cannot be switched off.'
    },
      ui.toggleRow({
        id: 'set-referral',
        title: 'Ask how they heard about us',
        sub: 'One question at the end of the form. The answers are in Reports.',
        on: true
      }) +
      ui.toggleRow({
        id: 'set-guardian2',
        title: 'Offer a second guardian',
        sub: 'Optional. A second name and phone number on the family record.',
        on: true
      })
    );

    return ui.grid(2, [billing, makeups, docs, form]) +
      bar(save('Saved — the new rules apply to every family from today'),
        'A rule saved here applies to every family, whatever their join date.');
  }

  /* ---- 4 · Messages --------------------------------------------------------
     The wording the studio sends, and the two decisions about when it sends.
     The channel sits in the lead column, which is what tells the two
     "Waitlist place offered" templates apart, and the row is the control —
     there is no Edit button beside a row whose whole job is to be opened.

     The two pack emails are gone. A cycle ends on a class, not on a date, and
     one email says so: the invoice raised on that last class, with the dates
     it covers written out. */

  var TEMPLATES = [
    { c: 'Email', n: 'Registration confirmed', s: 'The plan, the day and time, the first charge and what to bring' },
    { c: 'Email', n: 'Invoice raised', s: 'Sent on the last class of the cycle, listing the dates it covers' },
    { c: 'Email', n: 'Payment receipt', s: 'For an invoice, or for a charge made by hand at the desk' },
    { c: 'Email', n: 'Payment failed', s: '' },
    { c: 'Email', n: 'Schedule change', s: '' },
    { c: 'Email', n: 'Waitlist place offered', s: 'Includes the 24-hour acceptance window', onAsk: true },
    { c: 'Text', n: 'Studio closed today', s: 'Weather, power, anything urgent' },
    { c: 'Text', n: 'Waitlist place offered', s: 'The same offer, short enough to read on a lock screen', onAsk: true }
  ];

  function channel(c) {
    return TEMPLATES.filter(function (t) { return t.c === c; });
  }

  function messagesTab() {
    var templates = ui.card({
      title: 'Templates',
      flush: true,
      note: 'What the studio actually sends. Open one to change its wording — the merge fields stay intact, so nothing you write can break a name, a date or an amount.'
    }, ui.rows(TEMPLATES.map(function (t) {
      return {
        lead: esc(t.c),
        title: esc(t.n),
        sub: esc(t.s),
        msg: t.n + ' — ' + t.c.toLowerCase() + ' template opened'
      };
    })));

    /* The switch covers exactly the templates listed beside it, so the list
       under the switch is those rows rather than a sentence typed twice. A
       waitlist offer is not on it: that one goes out when you offer the
       place, from Requests. */
    var automatic = channel('Email').filter(function (t) { return !t.onAsk; });
    var texts = channel('Text');

    var when = ui.card({
      title: 'When they go out',
      note: 'A waitlist offer goes out when you offer the place, from Requests. Everything else is composed by hand in Messages or Announcements.'
    },
      ui.toggleRow({
        id: 'set-auto-email',
        title: 'Email the family automatically',
        sub: andList(automatic.map(function (t) { return t.n; })) + '.',
        on: true
      }) +
      ui.toggleRow({
        id: 'set-announce-copy',
        title: 'Email a copy of every announcement',
        sub: 'Otherwise an announcement only appears in the portal.',
        on: false
      }) +
      '<div class="card-split"><p class="hint">Text messages are not switched on — no provider is connected. The ' +
      texts.length + ' text templates above are written and ready, and go out as soon as one is.</p></div>'
    );

    /* One group per thing a template writes about. The plan group counts
       hours, and {{cycle_dates}} writes out the classes an invoice covers —
       the line the studio used to type by hand. */
    var merge = ui.card({
      title: 'Merge fields',
      note: 'Available in every template, on email and text alike.'
    }, ui.kv([
      row('Family', '{{family_name}} · {{contact_first}} · {{balance}}'),
      row('Child', '{{child_first}} · {{child_class}} · {{next_class}}'),
      row('Plan', '{{plan_hours}} · {{hours_left}} · {{cycle_dates}}'),
      row('Billing', '{{invoice_total}} · {{due_date}} · {{pay_link}}'),
      row('Waitlist', '{{waitlist_position}} · {{offer_expires}}'),
      row('Studio', '{{studio_name}} · {{studio_phone}} · {{portal_link}}')
    ]));

    /* The template list cannot be balanced by two short cards stacked beside
       it, so it takes the full width and the two reference cards sit under it
       as an ordinary pair. */
    return ui.grid(null, [templates]) +
      '<div class="section">' + ui.grid(2, [when, merge]) + '</div>' +
      bar(save('Saved — the next message that goes out uses the new wording'),
        'Nothing is sent while you edit. Changes reach the next message that goes out.');
  }

  /* ---- one policy clause ----------------------------------------------------
     Restored. It was deleted earlier in the rebuild because it rendered four
     empty placeholder inputs under a title that never said which clause was
     being edited — but the answer to an empty form is to fill it in, not to
     remove the only place the wording can be changed. */

  Grove.screen('policyDoc', {
    surface: 'console',
    crumbs: [{ label: 'Settings', to: 'settings' }],
    crumbTitle: 'Policy',
    title: function (ctx) { return D.policy(ctx.params.id || D.POLICY_ALL[0]).name; },
    sub: function (ctx) {
      var d = D.policy(ctx.params.id || D.POLICY_ALL[0]);
      return 'Version ' + d.version + ', last changed ' + d.updated +
        '. Families see this wording on the registration form and in their Documents.';
    },
    actions: [
      { label: 'See who has signed', to: 'families' }
    ],

    body: function (ctx) {
      var name = ctx.params.id || D.POLICY_ALL[0];
      var doc = D.policy(name);
      var progIds = Object.keys(D.PROGRAMS);
      var on = progIds.filter(function (pid) { return Grove.policyOn(pid, name); });

      var wording = ui.card({ title: 'Wording', fill: true }, ui.fields(null, [
        ui.field({
          label: 'What the family reads',
          grow: true,
          hint: 'Plain sentences. This is shown as written, with no heading added.',
          control: ui.textarea({ value: doc.body })
        })
      ]));

      var where = ui.card({
        title: 'Where it applies',
        note: 'A clause is attached or detached on the program itself, not here.'
      }, ui.kv(progIds.map(function (pid) {
        return {
          k: D.program(pid).name,
          v: Grove.policyOn(pid, name) ? 'Required' : 'Not attached',
          tone: Grove.policyOn(pid, name) ? null : 'mute'
        };
      })));

      var history = ui.card({ title: 'Version' }, ui.kv([
        ['Current version', String(doc.version)],
        ['Last changed', doc.updated],
        { k: 'Signed by', v: on.length ? 'Every family on ' + on.length + ' of ' + progIds.length + ' programs' : 'Nobody — not in use', tone: on.length ? null : 'mute' }
      ]));

      return ui.grid('sidebar', [wording, ui.col([where, history])]) +
        ui.formActions([
          { label: 'Save wording', kind: 'primary', msg: 'Saved — version ' + doc.version + ' updated, nobody is asked to sign again' },
          { label: 'Publish as version ' + (doc.version + 1), msg: 'Published — families sign this at their next visit' },
          { label: 'Cancel', to: 'settings' }
        ], {
          sticky: true,
          hint: 'Editing the wording leaves existing signatures alone. Publishing a new version asks for them again.'
        });
    }
  });
})();
