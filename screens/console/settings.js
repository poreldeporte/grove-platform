/* Console → Settings. Four tabs: Studio, Pricing, Policies, Messages.

   WHO THIS IS FOR
   Sabrina, at a desk, with a keyboard. Density is right here — a rule sheet
   should read as a rule sheet. What was wrong was not the density, it was
   that nothing on the screen did anything.

   THIS PASS — A PACK, NOT A MONTH

   A family buys a pack of sessions for one child. The child attends. When the
   last session in the pack is used, the pack is charged again and the next one
   begins. There is no billing date, so the next charge is a number of classes
   away rather than a day on the calendar. Everything below follows from that.

   1. PRICING. The four tiers are pack sizes, not monthly rates: $280 buys four
      sessions, and each tier says which class the renewal lands on. The "hours
      a week / sessions a month" arithmetic, and the four-weeks-to-a-month
      constant it rested on, are deleted. What one class works out at is now
      divided out of the pack price rather than read from PRICING.extraClassRate
      — the two agree to the cent, but under this model booking an extra class
      is not a separate charge, it spends a session like any other class, so
      quoting that key here would have read as a second price.

   2. POLICIES. "Tuition bills on · 1st of month" is gone; nothing bills on a
      date. In its place sits the only decision a renewal has: what happens when
      the last session is used. The 30-day cancellation notice went with it — a
      family that is stopping simply uses what it has paid for and the pack does
      not renew — and so did the sentence about a final billed month. The word
      membership does not appear: a family holds sessions, it is not a member.

   3. THE MAKE-UP MACHINERY IS DELETED, NOT RENAMED. Tell the studio more than
      24 hours ahead and the session is not spent: it stays in the child's pack,
      which then simply lasts a week longer. Inside the window it is spent,
      exactly as if they had come. Nothing is issued, approved, queued or
      expired, so: the card collapses to that one rule; "A credit expires · end
      of the billing cycle" and "A family asks for a make-up · you approve each
      one" are gone; the two make-up templates and the {{credit_*}} merge fields
      are gone; and the count of make-ups awaiting approval is gone with them —
      it read D.MAKEUPS, a table that no longer exists, so this screen threw on
      every Policies tab render. A catch-up is now an ordinary extra class, and
      the Friday hours on the Studio tab are labelled as such and read off
      Grove.data.EXTRA_CLASSES rather than being typed.
      The card earns its place by showing what the rule did: sessions returned
      and sessions spent, counted off ABSENCES.

   4. SESSIONS NEVER EXPIRE, so no expiry is offered anywhere — not even as the
      option a select would have had to list. A paid-for session is the child's
      until it is used, and that is stated on the card rather than chosen.

   5. "Full-term prepay · 5%" left the Discounts card. A pack is paid before its
      sessions are used and a larger pack already costs less a class, so the row
      was paying for the same thing twice.

   WHAT CARRIES OVER FROM THE EARLIER PASSES
   - Twenty-two buttons that all opened the same toast are gone. The screen
     edits what it owns, in the card, and routes to the screen that owns the
     rest: a price -> Programs, a class time -> Classes, a reduction for one
     family -> Billing. A template row is itself the control.
   - ONE THING, ONE BAR. Every tab ends in ui.formActions(..., {sticky:true}),
     with a state line saying what saving does to families. Pricing is the
     exception and says so: it sets no prices, so its bar opens the program
     that charges the price rather than pretending to save.
   - A control whose answer was always the same is a stated fact in the card
     note: the retry cadence, the three registration questions that cannot be
     switched off, text messages having no provider connected.
   - The grace period and the late fee it triggers are one rule in one card.
     Scholarship and goodwill are one row, "One-off reduction".

   FACTS DERIVED, NOT TYPED
   - Weekday class times, the camp block and the no-school block come from
     Grove.data.CLASSES; the extra-class hours from EXTRA_CLASSES; the payment
     methods from INVOICES; every amount from PRICING; the program count from
     PROGRAMS; the emails under the automatic switch from the template rows
     above it; the policy counts from one list plus the per-program adds and
     drops; the returned and spent session counts from ABSENCES.
   - A pack key counts the sessions it buys, so the pack size, the class the
     renewal lands on and the price a class works out at are all arithmetic on
     the key and cannot drift apart.

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
  var NSD_BASE_HOURS = 3;      // the no-school block PRICING.nsd.base buys
  var RETRY_DAYS = [1, 3, GRACE_DAYS];

  /* A pack key counts the sessions it buys: p8 is a pack of eight. */
  var PACK_KEYS = ['p4', 'p8', 'p12', 'p16'];

  function money(n) { return Grove.money(n, { cents: false }); }
  /* A rate that may carry cents — $67.50 must not round to $68. */
  function rate(n) { return n % 1 === 0 ? Grove.money(n, { cents: false }) : Grove.money(n); }
  /* "the 8th class" — which class in the pack the renewal lands on. */
  function ordinal(n) {
    var tail = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (tail[(v - 20) % 10] || tail[v] || tail[0]);
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

  /* An extra class is a catch-up booked on top of a weekly place. It spends a
     session from the pack like any other class, so the hours it runs belong on
     the class-times card beside the weekly ones — read off the extras on the
     books rather than typed, so the card cannot advertise an hour nobody runs. */
  var DAY_NAME = {
    Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday',
    Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday'
  };
  function extraRows() {
    var days = distinct(D.EXTRA_CLASSES.map(function (x) {
      return String(x.when).split(' ')[0];
    }));
    return days.map(function (d) {
      var times = distinct(D.EXTRA_CLASSES.filter(function (x) {
        return String(x.when).indexOf(d + ' ') === 0;
      }).map(function (x) {
        var parts = String(x.when).split('·');
        return (parts[parts.length - 1] || '').replace(/^\s+|\s+$/g, '');
      }));
      return row(DAY_NAME[d] || d, times.join(' · '), 'Extra classes only', 'mute');
    });
  }

  /* What the notice rule actually did, counted off the absences on record.
     `spent: false` is a session that stayed in the child's pack. */
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

  /* What one class works out at inside a pack: $780 across 12 sessions is $65.
     Divided out of the pack price, never typed. */
  function perClass(key) {
    return P.as.plans[key] / Number(key.slice(1));
  }

  /* One tier, labelled out of its own key: p12 buys twelve sessions and
     charges again on the twelfth class. */
  function packRow(key) {
    var sessions = Number(key.slice(1));
    return row('Pack of ' + sessions + ' · renews on the ' + ordinal(sessions) + ' class',
      money(P.as.plans[key]), rate(perClass(key)) + ' a class');
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
    sub: 'The rules the studio runs on: what it is called, how a pack of sessions renews, and the wording of every message that goes out. A price itself is set on the program that charges it.',
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
      note: 'Read from the classes that are running, so this card and the schedule cannot drift apart. A time is changed on the class itself. An extra class is a catch-up on top of a weekly place — it spends a session from the pack rather than costing anything extra. Extra camp hours are charged by the hour — see Pricing.'
    }, ui.kv([
      row('Monday', startsOn('as', 'Mon').join(' · ')),
      row('Tuesday', startsOn('as', 'Tue').join(' · ')),
      row('Wednesday', startsOn('as', 'Wed').join(' · ')),
      row('Thursday', startsOn('as', 'Thu').join(' · '))
    ].concat(extraRows()).concat([
      row('Camp day', blockFor('camp')),
      row('No-school day', blockFor('nsd'))
    ])));

    var terms = ui.card({
      title: 'Term dates and closures',
      head: ui.btn({
        label: 'Add a closure', kind: 'quiet', size: 'sm',
        msg: 'Closure added — no sessions that day, and nobody who was booked spends one'
      }),
      note: 'No sessions are generated on these dates. A child booked that day does not spend a session for it — it stays in their pack, so the pack simply lasts a week longer. Nobody has to ask.'
    }, ui.kv([
      row('Labor Day', '7 Sep 2026', 'Monday'),
      row('Thanksgiving', '26–27 Nov 2026', 'Thursday and Friday'),
      row('Winter break', '21 Dec – 2 Jan', 'Two weeks'),
      row('Spring break', '15–19 Mar 2027', 'One week')
    ]));

    var payments = ui.card({
      title: 'Payments',
      note: 'ACH costs the studio less than a card, and a pack renews on the method the family has saved, so families setting up autopay are pointed at it first.'
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
    var packs = ui.card({
      title: 'After-school packs',
      note: 'The ' + PACK_KEYS.length + ' packs a family buys from. A pack belongs to one child, not to the family, so a family with two children holds two packs and they renew at different times. One session is one hour, and the bigger the pack the less a class works out at — from ' +
        rate(perClass(PACK_KEYS[0])) + ' down to ' + rate(perClass(PACK_KEYS[PACK_KEYS.length - 1])) +
        '. A new price applies to the next pack bought; a pack already paid for is untouched.'
    }, ui.kv(PACK_KEYS.map(packRow)));

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
      row('Multi-class · a second class in the same week', '10%')
    ];
    var BY_HAND = [
      row('Staff family', '100%'),
      row('One-off reduction · your approval, reason recorded', 'Per family', null, 'mute')
    ];

    var discounts = ui.card({
      title: 'Discounts',
      head: link('Open Billing', 'billing'),
      note: 'The first ' + AUTOMATIC.length + ' apply themselves at registration and again every time a pack renews, and reach the family as their own line on the invoice rather than as a quietly smaller total. The last is issued against one family from Billing — a scholarship, or putting something right — and is written to the ledger with who applied it, why, and how much came off. There is no other way to reduce a bill, which is how it stays countable at the end of the year.'
    }, ui.kv(AUTOMATIC.concat(BY_HAND)));

    return ui.grid(2, [packs, fees, rest, discounts]) +
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

  function policiesTab() {
    var billing = ui.card({
      title: 'Billing rules',
      note: 'Applied to every family, whatever their join date. Nothing bills on a date: a pack is charged again the moment its last session is used, so the next charge is a number of classes away. A pack belongs to one child, so a family with two children is charged twice, at two different times. A failed card is retried on day ' +
        andList(RETRY_DAYS.map(String)) + ' and then left for you. A family that is stopping simply does not renew — they use what they have already paid for, and a session they have paid for is theirs until they use it.'
    }, ui.fields(2, [
      ui.field({
        label: 'When the last session is used',
        span: true,
        control: ui.select({
          value: 'Charge again and start the next pack',
          options: ['Charge again and start the next pack', 'Ask the family before charging']
        }),
        hint: 'The same size pack as the one that just ran out, unless the family asks you to change it.'
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
        span: true,
        control: ui.input({ value: money(PICKUP_RATE) + ' a minute' })
      })
    ]));

    /* One rule, and what it has done. Told in time, the session is not spent;
       inside the window it is, exactly as if the child had come. There is
       nothing to issue, approve or expire, so there is nothing else to set. */
    var cancelling = ui.card({
      title: 'Cancelling a class',
      note: 'Tell us in time and the session is not spent — it stays in the child’s pack, so the pack lasts a week longer. Inside the window it is spent, exactly as if they had come. A studio closure never spends a session. To catch the class up, the family books an extra class, and that spends a session like any other.'
    }, ui.fields(null, [
      ui.field({
        label: 'Tell the studio by',
        control: ui.select({
          value: '24 hours before',
          options: ['24 hours before', '12 hours before', 'Any time before the class']
        }),
        hint: 'The only rule there is. Everything else follows from it.'
      })
    ]) + '<div class="card-split">' + ui.kv([
      row('Sessions returned so far', String(absences(false)), 'told us in time'),
      row('Sessions spent anyway', String(absences(true)), 'told us too late')
    ]) + '</div>');

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
        sub: esc('Version ' + doc.version + ' \u00b7 updated ' + doc.updated),
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

    return ui.grid(2, [billing, cancelling, docs, form]) +
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
    { c: 'Email', n: 'Last class in the pack', s: 'The next class renews the pack, and what it will cost' },
    { c: 'Email', n: 'Pack renewed', s: 'The charge, the new pack, and the class it runs to' },
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
       list above has the fields it needs — the two pack emails, the waitlist
       offer and the three billing emails included. A pack field counts classes
       rather than days, because that is what the next charge is measured in. */
    var merge = ui.card({
      title: 'Merge fields',
      note: 'Available in every template, on email and text alike.'
    }, ui.kv([
      row('Family', '{{family_name}} · {{contact_first}} · {{balance}}'),
      row('Child', '{{child_first}} · {{child_class}} · {{next_session}}'),
      row('Pack', '{{pack_size}} · {{sessions_left}} · {{renews_in}}'),
      row('Billing', '{{invoice_total}} · {{due_date}} · {{pay_link}}'),
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
        { k: 'Signed by', v: on.length ? 'Every family on ' + on.length + ' of ' + progIds.length + ' programs' : 'Nobody \u2014 not in use', tone: on.length ? null : 'mute' }
      ]));

      return ui.grid('sidebar', [wording, ui.col([where, history])]) +
        ui.formActions([
          { label: 'Save wording', kind: 'primary', msg: 'Saved \u2014 version ' + doc.version + ' updated, nobody is asked to sign again' },
          { label: 'Publish as version ' + (doc.version + 1), msg: 'Published \u2014 families sign this at their next visit' },
          { label: 'Cancel', to: 'settings' }
        ], {
          sticky: true,
          hint: 'Editing the wording leaves existing signatures alone. Publishing a new version asks for them again.'
        });
    }
  });
})();
