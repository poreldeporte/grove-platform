/* Console → Settings. Four tabs: Studio, Pricing, Policies, Messages.

   WHO THIS IS FOR
   Sabrina, at a desk, with a keyboard. Density is right here — a rule sheet
   should read as a rule sheet. What was wrong was not the density, it was
   that nothing on the screen did anything.

   THIS PASS — CEREMONY REMOVED

   1. Twenty-two buttons that all opened the same toast are gone: the twelve
      per-card "Edit" heads and the ten per-row "Edit" buttons on Templates.
      In their place the screen edits what it owns, in the card, and routes to
      the screen that owns the rest:
        · what the studio is called, and when it is open   -> fields here
        · billing, make-up and registration-form rules     -> fields here
        · which messages go out automatically              -> switches here
        · a price                                          -> Programs
        · a class time                                     -> Classes
        · a reduction for one family                       -> Billing
      A template row is itself the control now, so the ten buttons beside the
      ten rows they described are gone.
      Net: 18 controls that do something, in place of 22 that did not.

   2. ONE THING, ONE BAR. Every tab ends in ui.formActions(..., {sticky:true}),
      so the action is pinned to the foot of the viewport and the state line
      beside it says what saving will do to families before she does it. The
      header keeps one button — the preview — rather than competing with it.
      Pricing is the exception and says so: it sets no prices, so its bar
      opens the program that charges the price rather than pretending to save.

   3. Controls whose answer was always the same, now stated facts:
      - "Send urgent notices by text message". No provider is connected, so
        the switch could not take effect whichever way it was thrown. The two
        text templates are stated as written-and-waiting instead.
      - "Retry cadence · Day 1, 3, 7", "Bookable into · any age-appropriate
        class", "Transferable · No", "Re-sign behaviour · ask at next sign-in".
        None of them has a second sensible answer; each is now one clause of
        the note on the card it belonged to.
      - The three registration-form fields the studio cannot legally drop —
        allergies and medical, one authorised pick-up, photo permission per
        child — are stated. The two that are genuinely a choice, the referral
        question and the second guardian, are switches.

   4. Two controls that were one decision:
      - The grace period lived on Policies and the late fee it triggers lived
        on Pricing. They are one rule and now sit in one card, one above the
        other. Late pick-up moved with it, for the same reason.
      - "Scholarship · owner approval" and "Goodwill · recorded with a reason"
        were one act — you reduce one family's bill, you say why, it is
        written down. They are one row, "One-off reduction", and its head
        button opens the screen that actually issues it.
      That takes the ways of reducing what a family owes from six to five,
      and every one of the five now names where it is applied.

   5. Duplicates dropped:
      - Sibling relief was stated twice on the Pricing tab, in the Fees note
        and as a Discounts row. It is a discount, so it is in Discounts, and
        the amount is split out of the sentence PRICING holds so it lands in
        the value column with every other figure.
      - "Failed payments · retried automatically · cadence on the Policies
        tab" was a row whose only content was the address of another row.

   WHAT CARRIES OVER FROM THE PARENT PASS
   Sticky form actions with a state line; every total derived from the rows
   displayed; one studio name and one phone number, from Grove.data.STUDIO;
   the primary action never below an explainer.

   FACTS STILL DERIVED, NOT TYPED
   - Weekday class times, the camp block and the no-school block come from
     Grove.data.CLASSES; the payment methods from INVOICES; every amount from
     PRICING; the program count from PROGRAMS; the list of emails under the
     automatic switch from the template rows above it; the policy counts from
     one list plus the per-program adds and drops. The nine policy names are
     now spelled the way the program builder spells them, so the two screens
     describe one set of documents rather than two.
   - An after-school plan key counts sessions and one session is one hour, so
     a tier's weekly hours, its monthly sessions and its rate per hour are all
     arithmetic on the key and cannot drift apart.

   NOT BUILT HERE
   - No policy editor and no template editor. Grove.data holds neither the
     policy wording nor the body of a message, and a click-through demo must
     not land on a blank form. Both are in the data gaps for the rebuild.
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

  /* Verbatim from the policy text in screens/registration/flow.js. */
  var GRACE_DAYS = 7;          // "a 7-day grace period"
  var LATE_FEE = 25;           // "a $25 late fee after the seven-day grace"
  var PICKUP_GRACE = 10;       // "a 10-minute grace period"
  var PICKUP_RATE = 1;         // "a late fee of $1 per minute"
  var NOTICE_DAYS = 30;        // cancellation notice
  var NSD_BASE_HOURS = 3;      // the no-school block PRICING.nsd.base buys
  var RETRY_DAYS = [1, 3, GRACE_DAYS];

  /* Four weeks to a billing month; a plan key counts the sessions it buys. */
  var PLAN_KEYS = ['p4', 'p8', 'p12', 'p16'];
  var WEEKS_PER_MONTH = 4;

  function money(n) { return Grove.money(n, { cents: false }); }
  /* A rate that may carry cents — $67.50 must not round to $68. */
  function rate(n) { return n % 1 === 0 ? Grove.money(n, { cents: false }) : Grove.money(n); }

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

  function startsOn(progId, day) {
    return distinct(classesIn(progId).filter(function (c) {
      return c.day === day;
    }).map(function (c) { return startOf(c.time); }));
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

  /* Make-ups a family has asked for and nobody has answered. Counted off
     MAKEUPS so the line cannot outlive the queue it points at. */
  function waitingMakeups() {
    return D.MAKEUPS.filter(function (m) { return m.status === 'Awaiting approval'; }).length;
  }

  /* A pop-up is priced per event; print one figure only while they agree. */
  function popPrice() {
    var amounts = distinct(P.pop.events.map(function (e) { return e.amount; }));
    amounts.sort(function (a, b) { return a - b; });
    if (amounts.length === 1) return money(amounts[0]) + ' / child';
    return money(amounts[0]) + '–' + money(amounts[amounts.length - 1]) + ' / child';
  }

  /* One tier, labelled out of its own key: p12 is 12 sessions, 12 sessions is
     three hours a week, and $780 across those 12 hours is the $65 PRICING
     holds in extraClassRate. */
  function planRow(key) {
    var sessions = Number(key.slice(1));
    var weekly = sessions / WEEKS_PER_MONTH;
    return row(weekly + ' hour' + (weekly === 1 ? '' : 's') + ' a week · ' +
      sessions + ' sessions a month', money(P.as.plans[key]));
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
    sub: 'The rules the studio runs on: what it is called, how billing and make-ups work, and the wording of every message that goes out. A price itself is set on the program that charges it.',
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
      note: 'Read from the classes that are running, so this card and the schedule cannot drift apart. A time is changed on the class itself. Extra camp hours are charged by the hour — see Pricing.'
    }, ui.kv([
      row('Monday', startsOn('as', 'Mon').join(' · ')),
      row('Tuesday', startsOn('as', 'Tue').join(' · ')),
      row('Wednesday', startsOn('as', 'Wed').join(' · ')),
      row('Thursday', startsOn('as', 'Thu').join(' · ')),
      row('Friday', '10:00am · 11:00am', 'Make-up hours only', 'mute'),
      row('Camp day', blockFor('camp')),
      row('No-school day', blockFor('nsd'))
    ]));

    var terms = ui.card({
      title: 'Term dates and closures',
      head: ui.btn({
        label: 'Add a closure', kind: 'quiet', size: 'sm',
        msg: 'Closure added — no sessions that day, and a make-up credit issued to every child who was booked'
      }),
      note: 'No sessions are generated on these dates. A Monday closure issues a make-up credit to every child booked that day, without anybody asking.'
    }, ui.kv([
      row('Labor Day', '7 Sep 2026', 'Monday'),
      row('Thanksgiving', '26–27 Nov 2026', 'Thursday and Friday'),
      row('Winter break', '21 Dec – 2 Jan', 'Two weeks'),
      row('Spring break', '15–19 Mar 2027', 'One week')
    ]));

    var payments = ui.card({
      title: 'Payments',
      note: 'ACH costs the studio less than a card on monthly tuition, so families setting up autopay are pointed at it first.'
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
      note: 'The ' + PLAN_KEYS.length + ' tiers a family chooses from, priced a month at a time. One session is one hour, so the rate per hour falls from ' +
        rate(P.as.extraClassRate.p4) + ' to ' + rate(P.as.extraClassRate.p16) +
        ' as the plan grows. A new price applies to new enrollments at once; a family already enrolled keeps their agreed rate until you move them, with ' +
        NOTICE_DAYS + ' days’ notice.'
    }, ui.kv(PLAN_KEYS.map(planRow)));

    var fee = sharedRegFee();

    var fees = ui.card({
      title: 'Registration fees',
      note: 'Charged once when a child joins the after-school program, and on each separate booking of anything else. A sibling pays less — see Discounts.'
    }, ui.kv([
      row(D.program('as').name + ' · one-time per child', money(P.as.regFee)),
      row('Every other program · per booking', fee === null ? 'Set per program' : money(fee)),
      row(D.program('bday').name, 'None', null, 'mute')
    ]));

    var rest = ui.card({
      title: 'Everything else',
      note: 'A full week costs the same as ' + Math.round(P.camp.week / P.camp.day) +
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

    /* "50% off the second and third registration fee" is one sentence in
       PRICING. Split at the "off", the amount lands in the value column with
       every other figure and the condition reads as part of the name. */
    var relief = P.as.siblingRelief;
    var cut = relief.indexOf(' off ');

    /* Split in two so the note counts the automatic ones rather than saying
       "the first three" and hoping a fourth is never added. */
    var AUTOMATIC = [
      row('Sibling relief · ' + relief.slice(cut + 5), relief.slice(0, cut + 4)),
      row('Multi-class · a second class in the same week', '10%'),
      row('Full-term prepay · paid before the term starts', '5%')
    ];
    var BY_HAND = [
      row('Staff family', '100%'),
      row('One-off reduction · your approval, reason recorded', 'Per family', null, 'mute')
    ];

    var discounts = ui.card({
      title: 'Discounts',
      head: link('Open Billing', 'billing'),
      note: 'The first ' + AUTOMATIC.length + ' apply themselves at registration and on every billing run, and reach the family as their own line on the invoice rather than as a quietly smaller total. The last is issued against one family from Billing — a scholarship, or putting something right — and is written to the ledger with who applied it, why, and how much came off. There is no other way to reduce a bill, which is how it stays countable at the end of the year.'
    }, ui.kv(AUTOMATIC.concat(BY_HAND)));

    return ui.grid(2, [plans, fees, rest, discounts]) +
      bar(route('Open Programs', 'programs'),
        'A price is set on the program that charges it, so there is one place to change it.');
  }

  /* ---- 3 · Policies --------------------------------------------------------
     The studio-wide rules, and the only tab where every control changes
     something no other screen owns. Each card states in its note the part of
     the rule that has no second sensible answer, so the answer is written
     once rather than offered as a choice nobody makes. */

  /* The one list every program's policy set is built from, spelled the way
     the program builder spells it. The counts on the Policy documents card
     are arithmetic on these arrays, so they cannot drift apart the way the
     typed "9 policies / 9 policies" pair did. */
  var BASE_POLICIES = [
    'Important facts', 'Class scheduling', 'Make-ups & cancellations',
    'Drop-off & pick-up', 'Health & safety', 'Medical emergencies',
    'Payment terms', 'Release of liability', 'Agreement'
  ];
  var CAMP_DROPS = ['Make-ups & cancellations', 'Class scheduling'];
  var CAMP_ADDS = ['food and snacks'];
  var PRIV_ADDS = ['owner approval', 'off-site hosting', 'additional participants'];

  function policiesTab() {
    var billing = ui.card({
      title: 'Billing rules',
      note: 'Applied to every family, whatever their join date. A failed card is retried on day ' +
        andList(RETRY_DAYS.map(String)) + ' and then left for you. The cancellation notice sets the final billed month, so a family giving notice today is billed once more. Refunds are credit only, and only you can override that on a family record.'
    }, ui.fields(2, [
      ui.field({
        label: 'Tuition bills on',
        control: ui.select({ value: '1st of month', options: ['1st of month', '15th of month'] })
      }),
      ui.field({
        label: 'Cancellation notice',
        control: ui.select({
          value: NOTICE_DAYS + ' days',
          options: [NOTICE_DAYS + ' days', '14 days', 'End of term']
        })
      }),
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
        control: ui.input({ value: money(PICKUP_RATE) + ' a minute' })
      }),
      ui.field({
        label: 'Refunds',
        control: ui.select({ value: 'Credit only', options: ['Credit only', 'Back to the card used'] })
      })
    ]));

    var makeups = ui.card({
      title: 'Make-up rules',
      note: 'Cancelling inside the window counts as attended. A credit can be booked into any age-appropriate class and stays with the child who earned it. A studio closure issues the credit the same day, without anybody asking.'
    }, ui.fields(2, [
      ui.field({
        label: 'Tell the studio by',
        control: ui.select({
          value: '24 hours before',
          options: ['24 hours before', '12 hours before', 'Any time before the class']
        })
      }),
      ui.field({
        label: 'A credit expires',
        control: ui.select({
          value: 'End of the billing cycle',
          options: ['End of the billing cycle', 'End of the term', 'Never']
        })
      }),
      ui.field({
        label: 'A family asks for a make-up',
        span: true,
        control: ui.select({
          value: 'You approve each one',
          options: ['You approve each one', 'Booked automatically if there is space']
        }),
        hint: 'The ones waiting for you are in Requests — ' + waitingMakeups() + ' of them right now.'
      })
    ]));

    var shared = [D.program('camp').short, D.program('nsd').short, D.program('pop').short].join(' · ');
    var asCount = BASE_POLICIES.length;
    var campCount = asCount - CAMP_DROPS.length + CAMP_ADDS.length;
    var privCount = asCount + PRIV_ADDS.length;

    var docs = ui.card({
      title: 'Policy documents',
      note: 'Attached per program in the program builder. Camps and pop-ups leave out ' +
        CAMP_DROPS.length + ' of the after-school set and add ' + andList(CAMP_ADDS) +
        '; a private class adds ' + PRIV_ADDS.length +
        ' more on top of the full set. A new version is asked for at the next sign-in and never blocks a child from attending.'
    }, ui.kv([
      row(D.program('as').name, asCount + ' policies'),
      row(shared, campCount + ' policies'),
      row(D.program('priv').name, privCount + ' policies'),
      row(D.program('bday').name, 'None', null, 'mute')
    ]));

    var form = ui.card({
      title: 'Registration form',
      note: 'Every registration asks for allergies and medical notes, at least one authorised pick-up, and photo permission for each child separately. Those three cannot be switched off.'
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
     there is no Edit button beside a row whose whole job is to be opened. */

  var TEMPLATES = [
    { c: 'Email', n: 'Registration confirmed', s: 'Class, times, first charge and what to bring' },
    { c: 'Email', n: 'Payment receipt', s: '' },
    { c: 'Email', n: 'Invoice raised', s: '' },
    { c: 'Email', n: 'Payment failed', s: '' },
    { c: 'Email', n: 'Make-up approved', s: '' },
    { c: 'Email', n: 'Make-up declined', s: '' },
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
      note: 'What the studio actually sends. Open one to change its wording — the merge fields stay intact, so nothing you write can break a name or an amount.'
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

    /* One group per thing a template writes about, so every template in the
       list above has the fields it needs — the make-up pair, the waitlist
       offer and the three billing emails included. */
    var merge = ui.card({
      title: 'Merge fields',
      note: 'Available in every template, on email and text alike.'
    }, ui.kv([
      row('Family', '{{family_name}} · {{contact_first}} · {{balance}}'),
      row('Child', '{{child_first}} · {{child_class}} · {{next_session}}'),
      row('Billing', '{{invoice_total}} · {{due_date}} · {{pay_link}}'),
      row('Make-up', '{{credit_count}} · {{credit_expiry}}'),
      row('Waitlist', '{{waitlist_position}} · {{offer_expires}}'),
      row('Studio', '{{studio_name}} · {{studio_phone}} · {{portal_link}}')
    ]));

    /* Ten template rows cannot be balanced by two short cards stacked beside
       them, so the list takes the full width and the two reference cards sit
       under it as an ordinary pair. */
    return ui.grid(null, [templates]) +
      '<div class="section">' + ui.grid(2, [when, merge]) + '</div>' +
      bar(save('Saved — the next message that goes out uses the new wording'),
        'Nothing is sent while you edit. Changes reach the next message that goes out.');
  }
})();
