/* Console → Settings.

   The client's complaint — "i think we are over complicating some processes
   and maybe adding to many custom rules." — was pointed at this screen. Eight
   tabs are now four.

   WHERE THE OLD TABS WENT
     Studio + Class times                                 -> Studio
     Memberships & prices + Discounts
       + the fee half of Policies & fees                  -> Pricing
     the rules half of Policies & fees                    -> Policies
     Email & SMS + Notifications                          -> Messages
     Programs                                             -> dropped

   TABS AND CONTROLS REMOVED, AND WHY
   - Tab "Programs", entirely. Default capacity, default waitlist, age bands,
     session lengths and Rooms & locations are all set on the Programs screen
     in the rail and in the program builder; keeping a second copy here meant
     two places to change one number. Two cards were not program settings at
     all and moved rather than died: "Registration form" is studio-wide, so it
     sits on Policies, and "Studio closures" is the studio's term dates, so it
     sits on Studio.
   - Tab "Notifications". Its "Automatic emails" card was seven rows that all
     read "To the family" — one decision written seven times. It is one switch
     whose sub-line still names every email it covers.
   - The per-row "Edit" button. There were sixty-odd, each firing the same
     toast. One quiet Edit sits in each card head instead — except on
     Templates, where the row is the thing you edit.
   - Cards "Standing discounts" and "Manual discounts" are one Discounts card.
   - Card "Camp and no-school days" folded into Class times, "Branding" into
     The studio, "SMS templates" into Templates.
   - The policy editor form (key fPolicy). See the note at the foot of this
     comment.

   WHAT THE VISUAL REVIEW CHANGED

   Layout
   - A value and its grey annotation used to be concatenated with a space, so
     "Not uploaded Placeholder in use" read as one phrase. `row()` now puts a
     middot between them.
   - Better still, an annotation that made the value column ragged has moved
     into the label, so every amount and every count now right-aligns into a
     real column. That is why several labels carry a "· ..." tail.
   - Pricing put a 4-row card beside an 8-row card and the grid stretched the
     short one, leaving ~160px of white above its footer. Pairing the 4-row
     plans card with the 5-row Fees card instead lets all four cards sit in
     one plain ui.grid, so both card tops in a row are level by construction
     rather than by luck — which stacking two ui.col columns could not
     promise, and did not deliver. Studio and Policies pair cards of near
     enough the same length for the same reason.
   - Messages now puts the ten-row Templates card across the full width and
     the two short reference cards side by side beneath it. Stacked in one
     ui.col column they could not reach the height of a ten-row list, and
     Merge fields ended more than half empty.
   - A card note that runs to six or seven lines stretches its own card and
     hollows out the card opposite. Policy documents used to enumerate all
     nine after-school policies in its note; it states the arithmetic only
     now, and Registration form opposite has no hole in it.

   Facts corrected against js/data.js
   - Class times claimed Tuesday ran at 2:15pm, but CLASSES holds a 2:00pm
     Tuesday after-school class. Every weekday row is now derived from
     Grove.data.CLASSES rather than typed.
   - It also claimed the camp core day was 9:00am–12:00pm; CLASSES says camp
     runs 10:00am–1:00pm and no-school days run 9:00am–12:00pm. Both are now
     read from the data, as two separate rows.
   - Friday was "3:15pm · make-up sessions only". MAKEUPS and ANNOUNCEMENTS
     both say the Friday make-up hours are 10:00 and 11:00 in the morning.
   - "Earliest drop-off 8:30am" and "Latest pick-up 3:00pm" contradicted the
     studio's own opening hours on the same card (9:00–19:00) and the 6:30pm
     Thursday class in CLASSES. Both rows are gone.
   - "Logo · not uploaded, placeholder in use" was untrue: the shell renders
     assets/logo.png at the top of every rail.
   - "Processor · not connected" was untrue: INVOICES records Visa,
     Mastercard, Amex and ACH payments and a scheduled retry. The row now
     says what is connected, and the methods are derived from INVOICES.
   - Private Class was listed as "9 policies", the same as After-School Art,
     while its own note said it adds three clauses. Counts are now derived
     from one list of policies plus the per-program adds and drops, so
     9 / 8 / 12 fall out of the arithmetic and cannot drift apart.
   - "Seasonal camp · single day $100 · up to four days" contradicted itself.
     The real rule — four single days cost the same as the week — is derived
     from PRICING and stated in the card note.
   - "Pop-up event · set per event" left Settings silent while Programs and
     the registration picker both quote $45. It is derived from PRICING.pop.
   - The two largest after-school tiers were labelled "Two 2-hour classes
     each week" and "Three 2-hour classes each week" — 16 and 24 hours a
     month, which made a liar of the card's own footnote that the rate per
     hour falls to $60. A plan key counts sessions and one session is one
     hour, the same reading as the plans table on Programs, so both halves
     of every tier label are now arithmetic on the key: 1, 2, 3 and 4 hours
     a week, 4, 8, 12 and 16 sessions a month. $960 over 16 hours is the $60
     PRICING holds, and the four rates in PRICING.extraClassRate are now
     exactly the four prices divided by the four session counts.
   - "Most popular" against the 12-hour plan is not supported by FAMILIES,
     where the 4-session plan is the commonest. The claim is gone; the card
     note gives the per-hour rate instead, read from PRICING.extraClassRate.
   - "Registration fee · camps" was really the fee for camps, no-school days,
     private classes and pop-ups alike; the label now says so and the amount
     is only printed once it is confirmed identical across the four.
   - Term dates carried "3 classes affected" and "9 classes affected", which
     CLASSES does not support. The counts are gone; the weekday is kept.
   - Two message templates were both titled "Waitlist place offered" with no
     way to tell them apart. Every template row now carries its channel in
     the lead column.

   NOT BUILT HERE
   - The per-family "Billing settings" form (key fBilling) is not registered:
     that key belongs to the family portal's Billing screen in nav.js.
   - The policy editor (key fPolicy) has been deleted. It was four empty
     placeholder inputs under the title "Edit policy" — it never said which
     policy or which program was being edited, nothing was loaded, and
     Grove.data holds no policy wording to load. A click-through demo must
     not land on a blank form, and padding it out would have meant inventing
     several hundred words of legal copy. Policy documents' Edit button now
     toasts like every other card head on this screen.
   - Grove.data holds no studio address, so The studio card has no address
     row rather than an invented one.

   Prices read from Grove.data.PRICING; class times, payment methods and the
   program list read from Grove.data. The handful of amounts PRICING does not
   hold — the late payment fee, the pick-up grace and its per-minute rate —
   are named constants below, so this screen and its own notes can never
   disagree about them. Their wording matches the policy text in the
   registration flow verbatim. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, esc = Grove.esc, D = Grove.data;

  var P = D.PRICING;

  /* Amounts the studio charges that PRICING does not hold. The wording is
     verbatim from the policy text in screens/registration/flow.js. */
  var GRACE_DAYS = 7;          // "a 7-day grace period"
  var LATE_FEE = 25;           // "a $25 late fee after the seven-day grace"
  var PICKUP_GRACE = 10;       // "a 10-minute grace period"
  var PICKUP_RATE = 1;         // "a late fee of $1 per minute"
  var NSD_BASE_HOURS = 3;      // the no-school block PRICING.nsd.base buys
  var NOTICE_DAYS = 30;        // cancellation notice

  /* An after-school plan key counts the sessions a month it buys, and one
     session is one hour — the same reading as the plans table on Programs.
     Four weeks to a billing month, so a tier's weekly hours and its monthly
     sessions are both arithmetic on its key and cannot drift away from the
     per-hour rate quoted underneath them. */
  var PLAN_KEYS = ['p4', 'p8', 'p12', 'p16'];
  var WEEKS_PER_MONTH = 4;

  function money(n) { return Grove.money(n, { cents: false }); }
  /* A rate that may carry cents — $67.50 must not round to $68. */
  function rate(n) { return n % 1 === 0 ? Grove.money(n, { cents: false }) : Grove.money(n); }

  /* One setting: name on the left, value on the right. A note is separated
     from the value by a middot, so the two halves never read as one run-on
     phrase. Anything long enough to push the value out of its column belongs
     in the label or the card note instead. */
  function row(k, v, note, tone) {
    return {
      k: k,
      v: esc(v) + (note ? ' <span class="cell-sub">· ' + esc(note) + '</span>' : ''),
      tone: tone || null
    };
  }

  function editHead(what) {
    return ui.btn({ label: 'Edit', kind: 'quiet', size: 'sm', msg: what + ' — editor opened' });
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

  /* The block a camp or no-school day runs, straight out of CLASSES. */
  function blockFor(progId) {
    return distinct(classesIn(progId).map(function (c) { return c.time; })).join(' · ');
  }

  /* Card brands and bank transfer, as they actually appear on invoices. */
  function methodsInUse() {
    return distinct(D.INVOICES.map(function (i) {
      return String(i.method).split(' ')[0];
    })).filter(function (m) { return m !== 'None'; });
  }

  /* A pop-up is priced per event; print one figure only while they agree. */
  function popPrice() {
    var amounts = distinct(P.pop.events.map(function (e) { return e.amount; }));
    amounts.sort(function (a, b) { return a - b; });
    if (amounts.length === 1) return money(amounts[0]) + ' / child';
    return money(amounts[0]) + '–' + money(amounts[amounts.length - 1]) + ' / child';
  }

  /* One tier of the after-school plan, labelled out of its own key so the
     label can never contradict the rate: p12 is 12 sessions, 12 sessions is
     three hours a week, and $780 across those 12 hours is the $65 PRICING
     holds in extraClassRate. */
  function planRow(key) {
    var sessions = Number(key.slice(1));
    var weekly = sessions / WEEKS_PER_MONTH;
    return row(weekly + ' hour' + (weekly === 1 ? '' : 's') + ' a week · ' +
      sessions + ' sessions a month', money(P.as.plans[key]));
  }

  /* The registration fee shared by everything that is not after-school and
     not a birthday — printed only once the four agree. */
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
    sub: 'Everything the studio maintains itself — prices, plans, discounts, class times, policies and the wording of every message that goes out. None of it needs a developer.',
    actions: [
      { label: 'Open Programs', to: 'programs' },
      { label: 'Preview what families see', kind: 'primary',
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
     The old "Studio" tab plus "Class times", plus the closures card that was
     stranded on the dropped Programs tab. Four cards, six rows each side of
     the first row and four each side of the second, so the pairs end level. */

  function studioTab() {
    var studio = ui.card({
      title: 'The studio',
      head: editHead('The studio'),
      note: 'What families see on receipts, emails and the website footer.'
    }, ui.kv([
      row('Name', 'The Grove Art Studio', 'The Grove Art Studio LLC on invoices'),
      row('Contact', '(786) 340-9229'),
      row('Reply-to address', 'contact@thegroveartstudio.com'),
      row('Opening hours', 'Mon–Fri 9:00–19:00', 'Sat 10:00–16:00'),
      row('Logo', 'Uploaded', 'Shown at the top of every portal'),
      row('Program colours', 'One for each of the ' + Object.keys(D.PROGRAMS).length + ' programs')
    ]));

    var times = ui.card({
      title: 'Class times',
      head: editHead('Class times'),
      note: 'The weekday times are read from the classes that are running, so this card and the schedule can never drift apart. Extra camp hours are charged by the hour — see Pricing.'
    }, ui.kv([
      row('Monday', startsOn('as', 'Mon').join(' · ')),
      row('Tuesday', startsOn('as', 'Tue').join(' · ')),
      row('Wednesday', startsOn('as', 'Wed').join(' · ')),
      row('Thursday', startsOn('as', 'Thu').join(' · ')),
      row('Friday', '10:00am · 11:00am', 'Make-up sessions only', 'mute'),
      row('Camp day', blockFor('camp')),
      row('No-school day', blockFor('nsd'))
    ]));

    var terms = ui.card({
      title: 'Term dates and closures',
      head: editHead('Term dates'),
      note: 'No sessions are generated on these dates. A Monday closure issues a make-up credit to every child booked that day.'
    }, ui.kv([
      row('Labor Day', '7 Sep 2026', 'Monday'),
      row('Thanksgiving', '26–27 Nov 2026', 'Thursday and Friday'),
      row('Winter break', '21 Dec – 2 Jan', 'Two weeks'),
      row('Spring break', '15–19 Mar 2027', 'One week')
    ]));

    var payments = ui.card({
      title: 'Payments',
      head: editHead('Payments'),
      note: 'ACH costs the studio less than a card on monthly tuition, so families setting up autopay are pointed at it first.'
    }, ui.kv([
      row('Processor', 'Connected'),
      row('Methods in use', methodsInUse().join(' · ')),
      row('Payout schedule', 'Daily'),
      row('Failed payments', 'Retried automatically', 'Cadence on the Policies tab')
    ]));

    return ui.grid(2, [studio, times, terms, payments]);
  }

  /* ---- 2 · Pricing ---------------------------------------------------------
     Memberships and prices, the fees that were buried in "Policies & fees",
     and the two discount cards merged into one. Every amount comes from
     Grove.data.PRICING, and every annotation that would have shunted an
     amount out of its column sits in the label or the note instead. */

  function pricingTab() {
    var plans = ui.card({
      title: 'After-school plans',
      head: editHead('After-school plans'),
      note: 'The ' + PLAN_KEYS.length + ' tiers a family chooses from, priced a month at a time. One session is one hour, so the rate per hour falls from ' +
        rate(P.as.extraClassRate.p4) + ' to ' + rate(P.as.extraClassRate.p16) +
        ' as the plan grows. A change applies to new enrollments immediately; existing families keep their agreed rate until you move them deliberately, and are given ' +
        NOTICE_DAYS + ' days’ notice.'
    }, ui.kv(PLAN_KEYS.map(planRow)));

    var rest = ui.card({
      title: 'Everything else',
      head: editHead('Everything else'),
      note: 'Set when the program is created, and editable here. A full week costs the same as ' +
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

    var fee = sharedRegFee();

    var fees = ui.card({
      title: 'Fees',
      head: editHead('Fees'),
      note: 'Standard fees, applied at registration and on the billing run. ' +
        P.as.siblingRelief.charAt(0).toUpperCase() + P.as.siblingRelief.slice(1) +
        ' when more than one child is registered at once.'
    }, ui.kv([
      row('Initiation fee · ' + D.program('as').name + ', one-time per child',
        money(P.as.regFee)),
      row('Registration fee · every other program, per booking',
        fee === null ? 'Set per program' : money(fee)),
      row('Registration fee · ' + D.program('bday').name, 'None', null, 'mute'),
      row('Late payment · after the ' + GRACE_DAYS + '-day grace', money(LATE_FEE)),
      row('Late pickup · after a ' + PICKUP_GRACE + '-minute grace',
        money(PICKUP_RATE) + ' / minute')
    ]));

    /* Split in two so the note counts the automatic ones rather than saying
       "the first three" and hoping a fourth is never added. */
    var AUTOMATIC = [
      row('Sibling relief', P.as.siblingRelief),
      row('Multi-class · a second class in the same week', '10%'),
      row('Full-term prepay · paid before the term starts', '5%')
    ];
    var BY_HAND = [
      row('Staff family', '100%'),
      row('Scholarship · owner approval', 'Set per family'),
      row('Goodwill · recorded with a reason', 'Set per family', null, 'mute')
    ];

    var discounts = ui.card({
      title: 'Discounts',
      head: editHead('Discounts'),
      note: 'The first ' + AUTOMATIC.length + ' apply themselves at registration and on every billing run, and reach the family as their own line on the invoice rather than as a quietly smaller total. The rest are applied to one family at a time by an admin, a scholarship only with the owner’s approval, and every one of those is recorded on the ledger with who applied it and why.'
    }, ui.kv(AUTOMATIC.concat(BY_HAND)));

    /* Four rows against five, then eight against six. Pairing the two short
       cards and then the two long ones puts both card tops of a row at the
       same y — the guarantee ui.grid gives and two stacked ui.col columns,
       whose seam lands wherever the first card in each happens to end, do
       not. */
    return ui.grid(2, [plans, fees, rest, discounts]);
  }

  /* ---- 3 · Policies --------------------------------------------------------
     The rules half of the old "Policies & fees", plus the registration-form
     fields that were stranded on the dropped Programs tab. Every card holds
     five single-line rows, so the values line up as a column and the two
     cards in a row share their baselines — and every note is kept to two or
     three lines for the same reason, since a note is the one part of a card
     that can stretch it past its neighbour. */

  /* The one list every program's policy set is built from. The counts shown
     on the Policy documents card are arithmetic on these arrays — they cannot
     drift apart the way the typed "9 policies / 9 policies" pair did. */
  var BASE_POLICIES = [
    'make-ups and cancellations', 'payment and billing', 'pick-up',
    'health and allergies', 'medical consent', 'liability',
    'schedule changes', 'membership terms', 'photo permission'
  ];
  var CAMP_DROPS = ['make-ups and cancellations', 'membership terms'];
  var CAMP_ADDS = ['food and snacks'];
  var PRIV_ADDS = ['owner approval', 'off-site hosting', 'additional participants'];

  function policiesTab() {
    var billing = ui.card({
      title: 'Billing rules',
      head: editHead('Billing rules'),
      note: 'Applied to every family, whatever their join date. The cancellation notice sets the final billed month. Refunds are credit only, and only the owner can override that on a family record.'
    }, ui.kv([
      row('Tuition bills on', '1st of month'),
      row('Grace period', GRACE_DAYS + ' days'),
      row('Retry cadence', 'Day 1, 3, ' + GRACE_DAYS),
      row('Cancellation notice', NOTICE_DAYS + ' days'),
      row('Refunds', 'Credit only')
    ]));

    var makeups = ui.card({
      title: 'Make-up rules',
      head: editHead('Make-up rules'),
      note: 'Cancelling inside the window counts as attended. A studio closure issues the credit automatically; anything a family asks for waits until you approve it.'
    }, ui.kv([
      row('Cancel window', '24 hours'),
      row('Credit expiry', 'End of billing cycle'),
      row('Bookable into', 'Any age-appropriate class'),
      row('Family requests', 'Need approval'),
      row('Transferable', 'No')
    ]));

    var form = ui.card({
      title: 'Registration form',
      head: editHead('Registration form'),
      note: 'Fields shown to families across all programs. Photo permission is answered per child, not once for the family.'
    }, ui.kv([
      row('Photo permission, per child', 'Required'),
      row('Allergies and medical', 'Required'),
      row('At least one authorised pickup', 'Required'),
      row('Referral question', 'Shown'),
      row('Second guardian', 'Optional')
    ]));

    var shared = [D.program('camp').short, D.program('nsd').short, D.program('pop').short].join(' · ');
    var asCount = BASE_POLICIES.length;
    var campCount = asCount - CAMP_DROPS.length + CAMP_ADDS.length;
    var privCount = asCount + PRIV_ADDS.length;

    var docs = ui.card({
      title: 'Policy documents',
      head: editHead('Policy documents'),
      note: 'Written here, attached per program in the program builder. Camps and pop-ups leave out ' +
        CAMP_DROPS.length + ' of the after-school set and add ' + andList(CAMP_ADDS) +
        '; a private class adds ' + PRIV_ADDS.length +
        ' more on top of the full set. Re-signing a new version never blocks attendance.'
    }, ui.kv([
      row(D.program('as').name, asCount + ' policies'),
      row(shared, campCount + ' policies'),
      row(D.program('priv').name, privCount + ' policies'),
      row(D.program('bday').name, 'None', null, 'mute'),
      row('Re-sign behaviour', 'Ask at next sign-in')
    ]));

    return ui.grid(2, [billing, makeups, form, docs]);
  }

  /* ---- 4 · Messages --------------------------------------------------------
     Email and SMS templates in one card, the notification decisions as
     switches, and the merge-field reference. The channel sits in the lead
     column, which is what tells the two "Waitlist place offered" templates
     apart. */

  function template(channel, name, sub) {
    return {
      lead: esc(channel),
      title: esc(name),
      sub: sub ? esc(sub) : '',
      end: ui.btn({
        label: 'Edit', kind: 'quiet', size: 'sm',
        msg: name + ' — ' + channel.toLowerCase() + ' template opened'
      })
    };
  }

  function messagesTab() {
    var templates = ui.card({
      title: 'Templates',
      flush: true,
      note: 'What the studio actually sends. Edit the wording without a developer — the merge fields stay intact. The two text-message templates are stored and ready, but nothing sends until a provider is connected.'
    }, ui.rows([
      template('Email', 'Registration confirmed', 'Class, times, first charge and what to bring'),
      template('Email', 'Payment receipt', ''),
      template('Email', 'Invoice raised', ''),
      template('Email', 'Payment failed', ''),
      template('Email', 'Make-up approved', ''),
      template('Email', 'Make-up declined', ''),
      template('Email', 'Schedule change', ''),
      template('Email', 'Waitlist place offered', 'Includes the 24-hour acceptance window'),
      template('Text', 'Studio closed today', 'Weather, power, anything urgent'),
      template('Text', 'Waitlist place offered', 'The same offer, short enough to read on a lock screen')
    ]));

    var when = ui.card({
      title: 'When they go out',
      note: 'Sent automatically, so nobody has to remember. Everything else is composed by hand in Messages or Announcements.'
    },
      ui.toggleRow({
        id: 'set-auto-email',
        title: 'Email the family automatically',
        sub: 'Registration confirmed, payment receipt, invoice raised, payment failed, make-up approved or declined, and schedule change.',
        on: true
      }) +
      ui.toggleRow({
        id: 'set-announce-copy',
        title: 'Email a copy of every announcement',
        sub: 'Otherwise an announcement only appears in the portal.',
        on: false
      }) +
      ui.toggleRow({
        id: 'set-sms',
        title: 'Send urgent notices by text message',
        sub: 'No provider is connected yet. Short, and only for things that cannot wait.',
        on: false
      })
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
       under it as an ordinary pair — near enough the same height as each
       other, and neither stretched. */
    return ui.grid(null, [templates]) +
      '<div class="section">' + ui.grid(2, [when, merge]) + '</div>';
  }
})();
