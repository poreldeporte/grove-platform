/* Console → Billing: the money screens for the owner.

   Four screens in one file, because they are one subject: the invoice run
   (Billing), the family ledger behind it, the one form that reduces what a
   family owes (Adjust a balance), and the page that posts next month's run.

   Sabrina reconciles invoices at a desk with a keyboard. The tables stay
   dense and stay tables. What has been cut is ceremony, and what has been
   added is the sentence that says what a button is about to do with her
   money before she presses it.

   THE CONSOLIDATION THE AUDIT ASKED FOR
     There were six ways to reduce what a family owes — adjustment, refund,
     write-off, credit, discount, fixed fee — each with its own form and its
     own reason list. On these screens two of them survived: "Issue account
     credit" in the head of the credits card, and "Post an adjustment" in the
     ledger header. Both now open one screen, Adjust a balance, which asks
     three questions (who, how much, why) and carries one switch: does the
     money go back to their card, or does it sit as credit against their next
     invoice. Nothing else about it is a choice — the date is today, the
     author is whoever is signed in, the card is the one on file, and the
     screen says so rather than asking.
     The register those adjustments land in is one tab, "Adjustments", where
     three record types (Account credit / Refund / Refund request) and four
     statuses (Available / Applied to INV-… / Refunded to Amex / Pending
     approval) are now one destination column and three states. Three,
     because those are the three she treats differently: one is waiting on
     her, one is money still to come off a future invoice, and one is done.

   OTHER CEREMONY CUT
     - "Statements" emailed all eight families at once from the header. A
       statement is per family and the ledger already sends one, to a named
       address. The mass button is gone.
     - "Take a payment" took money with no family, no amount and no card, and
       reported it in the past tense. Money moves are recorded against a
       family — the screen's own subtitle says so — so the control that can
       name the family, the ledger's "Record a payment", is the one kept.
     - the desk-charge reconciliation. Billing used to add ledger lines no
       invoice had picked up to its outstanding figure, guarding against
       double-counting by matching family, date and amount. It produced no
       rows against this dataset and it gave the screen two definitions of
       "outstanding" on two tabs. Outstanding is now the unpaid invoices, and
       that comes to the same $803 across the same four families as the
       balances on the family records — the note says so, and only says so
       while it is true.
     - the conditional card title and the sentence that appeared under the
       table only when a desk charge was showing. A table whose heading moves
       under you is not denser, it is harder to read.

   WHAT IS NOW OBVIOUS
     - Needs attention exists to get money in, so the thing she came to do is
       pinned to the bottom of the viewport: retry the cards that can be
       retried, and it names them and their total before she does it. The one
       family with no card saved is named too, because they need a message,
       not a retry.
     - "Post the tuition run" was a header button whose toast told her
       afterwards that six invoices had posted and two were skipped. It is a
       page. It lists every family the run would bill, priced from their plan,
       with what they already owe beside it, and every family it would leave
       alone with the reason. The button at the bottom carries the count and
       the total.
     - Approving a refund is the only thing on the Adjustments tab that is
       waiting on her, so it is a notice at the top that names the amount, the
       family, the card it goes back to and the fact that it cannot be pulled
       back — not a pill in a table.

   EVERY FIGURE IS DERIVED
     Raised, collected and outstanding partition the invoice table; cards to
     retry and no-card-on-file partition what is outstanding; charged, adjusted
     and paid partition the ledger. The tuition run prices each family's plan
     from Settings → Pricing (PRICING.as.plans), which reproduces the July
     invoices for Johnson, Okafor, Rivera and Martinez to the dollar. Nothing
     on these four screens is typed in.

   THE ONE LIST WITH NO ENTRY IN js/data.js
     ADJUSTMENTS, below. Its five records are the content spec's. Each family
     name and card is read back out of Grove.data, and each amount is one the
     studio's own pricing produces: a cancelled camp day ($100), an extra class
     at the twelve-session rate ($65), a four-session plan refunded before term
     (−$280) and Brennan's July invoice refunded in full (−$540). */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  var TAB_KEY = 'billing';
  var T_INVOICES = 'Invoices';
  var T_ATTENTION = 'Needs attention';
  var T_ADJUST = 'Adjustments';

  /* js/data.js carries one worked-through family ledger, the Johnson family's,
     and Adjust a balance opens on that family for the same reason. */
  var LEDGER_FAMILY = 'johnson';

  /* The studio bills on the first. There is no schedule record behind this. */
  var NEXT_RUN = '1 August';

  var INVOICE_COLS = [
    'Invoice',
    'Family',
    'Raised',
    'Due',
    { label: 'Amount', align: 'right' },
    { label: 'Status', shrink: true }
  ];

  var ADJUST_COLS = [
    'Family',
    'What for',
    'Date',
    { label: 'Amount', align: 'right' },
    { label: 'Status', shrink: true },
    'Recorded by'
  ];

  /* Money owed back to a family, in the one shape the Adjust screen writes.
     `dest` is the single switch: 'card' sends it back and it leaves the
     studio, 'credit' leaves it on the account until an invoice spends it.
     A refund is therefore negative and a credit positive. */
  var ADJUSTMENTS = [
    { fam: 'johnson',  dest: 'credit', reason: 'Overpaid June tuition',      date: '12 Jun 2026', amt: 45,   spent: 'INV-2838', by: 'Dani Cruz' },
    { fam: 'chen',     dest: 'credit', reason: 'Camp day cancelled by studio', date: '8 Jul 2026', amt: 100,  spent: null,       by: 'Sabrina Yanguas' },
    { fam: 'brennan',  dest: 'card',   reason: 'Duplicate charge',           date: '3 Jul 2026',  amt: -540, spent: null,       by: 'Sabrina Yanguas' },
    { fam: 'martinez', dest: 'credit', reason: 'Extra class charged twice',  date: '28 Jun 2026', amt: 65,   spent: null,       by: 'Dani Cruz' },
    { fam: 'smith',    dest: 'card',   reason: 'Withdrew before term start', date: '26 Jul 2026', amt: -280, spent: null,       by: 'Rey Molina', waiting: true }
  ];

  /* ---- small helpers -------------------------------------------------------- */

  function money0(n) { return Grove.money(n, { cents: false }); }

  function total(list) {
    return list.reduce(function (n, r) { return n + r.amt; }, 0);
  }

  function count(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  function familyCount(list) {
    var seen = {}, n = 0;
    list.forEach(function (r) {
      var key = r.fam;
      if (!seen[key]) { seen[key] = true; n += 1; }
    });
    return n;
  }

  function listOf(items) {
    if (items.length < 2) return items.join('');
    return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
  }

  function famIdFor(name) {
    var f = D.FAMILIES.filter(function (x) { return x.name === name; })[0];
    return f ? f.id : undefined;
  }

  /* "Visa ···1183 · exp 04/29" → "Visa ···1183"; "None saved" stays itself. */
  function cardOf(f) { return String(f.card).split(' · ')[0]; }
  function hasCard(f) { return !!f.card && f.card !== 'None saved'; }

  function amount(n, tone) {
    return h`<span class="${raw(tone || '')}">${Grove.money(n)}</span>`;
  }

  /* ---- invoices -------------------------------------------------------------- */

  function unpaid(inv) { return inv.status !== 'Paid'; }
  function paidInvoices() { return D.INVOICES.filter(function (i) { return !unpaid(i); }); }
  function owedInvoices() { return D.INVOICES.filter(unpaid); }

  /* What she can actually do about an unpaid invoice splits exactly two ways:
     there is a card to charge again, or there is not and somebody has to be
     asked. Those two add up to everything outstanding. */
  function retryable() {
    return owedInvoices().filter(function (i) { return i.method && i.method !== 'None saved'; });
  }
  function noCard() {
    return owedInvoices().filter(function (i) { return !i.method || i.method === 'None saved'; });
  }

  function asItem(inv) {
    return {
      ref: inv.id,
      note: inv.note,
      fam: inv.fam,
      famId: famIdFor(inv.fam),
      method: inv.method,
      date: inv.date,
      due: inv.due,
      amt: inv.amt,
      status: inv.status,
      kind: inv.kind,
      owing: unpaid(inv)
    };
  }

  function itemRows(list) {
    return list.map(function (it) {
      return {
        to: 'familyRecord',
        id: it.famId,
        cells: [
          it.note ? ui.two(it.ref, it.note) : h`<span class="cell-strong">${it.ref}</span>`,
          ui.two(it.fam + ' family', it.method),
          ui.mute(it.date),
          ui.mute(it.due),
          amount(it.amt, it.owing ? 'clay strong' : ''),
          ui.pill(it.status, it.kind)
        ]
      };
    });
  }

  function matches(q, it) {
    return Grove.match(q, it.ref, it.fam, it.method, it.status, it.note);
  }

  /* The family records carry a balance of their own. Outstanding here is the
     unpaid invoices, and the two are meant to be the same money — the note
     under the table claims it only while the arithmetic holds. */
  function familyBalances() {
    return D.FAMILIES.reduce(function (n, f) { return n + f.balance; }, 0);
  }

  /* ---- adjustments ------------------------------------------------------------ */

  function adjFamily(a) { return D.family(a.fam); }
  function waiting() { return ADJUSTMENTS.filter(function (a) { return a.waiting; }); }
  function credits() { return ADJUSTMENTS.filter(function (a) { return a.amt > 0; }); }
  function unspent() {
    return credits().filter(function (a) { return !a.spent; });
  }
  function refunded() {
    return ADJUSTMENTS.filter(function (a) { return a.amt < 0 && !a.waiting; });
  }
  function creditsFor(id) {
    return unspent().filter(function (a) { return a.fam === id; });
  }

  /* Three states, because three is the number she treats differently: one is
     waiting on her, one is money still to come off a future invoice, and one
     is finished with. */
  function adjState(a) {
    if (a.waiting) return { label: 'Waiting on you', kind: 'warn' };
    if (a.amt > 0 && !a.spent) return { label: 'Unspent', kind: 'ok' };
    return { label: 'Done', kind: null };
  }

  function adjWhere(a) {
    var f = adjFamily(a);
    if (a.waiting) return 'Nothing has moved yet';
    if (a.dest === 'card') return 'Paid back to ' + cardOf(f);
    if (a.spent) return 'Came off ' + a.spent;
    return 'Not yet applied to an invoice';
  }

  /* ---- the tuition run ---------------------------------------------------------
     A family's monthly tuition is their plan priced from Settings → Pricing.
     "8 + 4 sessions / month" is the eight-session plan plus the four-session
     plan, which is how the studio quotes a two-child household, and it
     reproduces the July invoices for Johnson, Okafor, Rivera and Martinez to
     the dollar. A plan with no session count in it — a camp week, a family
     mid-registration, a membership ending — cannot be priced this way, and
     that is exactly the set the run should leave alone. */

  function monthly(f) {
    var plan = String(f.plan);
    if (plan.indexOf('sessions / month') === -1) return null;
    var parts = plan.split(' sessions')[0].split('+');
    var sum = 0;
    for (var i = 0; i < parts.length; i++) {
      var price = D.PRICING.as.plans['p' + parts[i].replace(/\s/g, '')];
      if (!price) return null;
      sum += price;
    }
    return sum;
  }

  function isBillable(f) {
    return f.status !== 'Cancelling' && f.status !== 'Pending payment' && monthly(f) !== null;
  }
  function billable() { return D.FAMILIES.filter(isBillable); }
  function heldBack() {
    return D.FAMILIES.filter(function (f) { return !isBillable(f); });
  }
  function runTotal() {
    return billable().reduce(function (n, f) { return n + monthly(f); }, 0);
  }

  function openInvoice(f) {
    return owedInvoices().filter(function (i) { return i.fam === f.name; })[0] || null;
  }

  function holdReason(f) {
    if (f.status === 'Pending payment') {
      var open = openInvoice(f);
      return open
        ? 'Registered but not yet paid — ' + open.id + ' is still awaiting payment'
        : 'Registered but not yet paid';
    }
    if (f.status === 'Cancelling') {
      return 'Membership ' + (String(f.plan).split(' · ')[1] || 'is ending');
    }
    return 'No monthly plan on their record — ' + f.plan;
  }

  /* The July run, read off the invoices it raised — the raise-and-due pair
     that more than one invoice shares — so August can say it is following the
     same terms without anybody typing a date. */
  function lastRun() {
    var tally = {}, best = null;
    D.INVOICES.forEach(function (i) {
      var key = i.date + '|' + i.due;
      tally[key] = (tally[key] || 0) + 1;
      if (!best || tally[key] > tally[best]) best = key;
    });
    if (!best || tally[best] < 2) return null;
    var parts = best.split('|');
    return { date: parts[0], due: parts[1], n: tally[best] };
  }

  /* ---- Billing ----------------------------------------------------------------- */

  function currentTab() { return Grove.tab(TAB_KEY, T_INVOICES); }

  function billingTabs() {
    return {
      key: TAB_KEY,
      items: [
        { label: T_INVOICES, count: D.INVOICES.length },
        { label: T_ATTENTION, count: owedInvoices().length },
        { label: T_ADJUST, count: ADJUSTMENTS.length }
      ]
    };
  }

  Grove.screen('billing', {
    surface: 'console',
    eyebrow: 'the studio ledger',
    title: 'Billing',
    sub: function () {
      var tab = currentTab();
      if (tab === T_ATTENTION) return 'Everything the studio is still owed. Some of it is a card to charge again; the rest is somebody to ask.';
      if (tab === T_ADJUST) return 'Every time the studio has reduced what a family owes, whether the money went back to a card or stayed as credit. Distinct from make-up credits, which are counted in classes and never convert to cash.';
      return 'Every charge the studio has raised. Money moves are always recorded against a family, never against a child.';
    },
    actions: [
      { label: 'Adjust a balance', to: 'adjust' },
      { label: 'Post the tuition run', kind: 'primary', to: 'postRun' }
    ],

    body: function () {
      var tab = currentTab();
      if (tab === T_ATTENTION) return attentionTab();
      if (tab === T_ADJUST) return adjustmentsTab();
      return invoicesTab();
    }
  });

  /* ---- tab 1 · invoices ---------------------------------------------------------
     A lookup table. Nothing is completed here, so there is no pinned bar and
     the three figures partition the rows: raised is collected plus
     outstanding, and all three are sums of what is printed underneath. */

  function invoicesTab() {
    var all = D.INVOICES.map(asItem);
    var q = Grove.query('invoices');
    var list = all.filter(function (it) { return matches(q, it); });
    var paid = paidInvoices();
    var owed = owedInvoices();

    var stats = ui.statbar([
      {
        label: 'Raised in July',
        value: money0(total(D.INVOICES)),
        sub: count(D.INVOICES.length, 'invoice', 'invoices')
      },
      {
        label: 'Collected',
        value: money0(total(paid)),
        sub: paid.length + ' of ' + D.INVOICES.length + ' paid',
        tone: 'grove'
      },
      {
        label: 'Outstanding',
        value: money0(total(owed)),
        sub: count(familyCount(owed), 'family', 'families'),
        tone: 'clay'
      }
    ]);

    var table = ui.table(INVOICE_COLS, itemRows(list), {
      emptyTitle: 'No invoices match',
      emptyText: 'Clear the search and the whole run comes back.'
    });

    return ui.toolbar({
      tabs: billingTabs(),
      search: { key: 'invoices', placeholder: 'Search invoice, family, card…' },
      count: list.length + ' of ' + all.length + ' invoices'
    }) + stats + ui.card({
      title: 'Invoices raised',
      flush: true,
      note: 'The monthly run posted on 1 July. Anything raised since is a desk charge, dated the day it was taken. The next run is ' + NEXT_RUN + '.'
    }, table);
  }

  /* ---- tab 2 · needs attention ---------------------------------------------------
     This tab exists to get money in, so the doing is pinned to the bottom of
     the viewport and it names what it is about to charge. The two figures
     beside outstanding are the two things she can do about it, and they add
     up to it. */

  function attentionTab() {
    var owed = owedInvoices().map(asItem);
    var retry = retryable();
    var manual = noCard();
    var q = Grove.query('attention');
    var list = owed.filter(function (it) { return matches(q, it); });

    var stats = ui.statbar([
      {
        label: 'Outstanding',
        value: money0(total(owedInvoices())),
        sub: count(familyCount(owed), 'family', 'families'),
        tone: 'clay'
      },
      {
        label: 'Cards to retry',
        value: money0(total(retry)),
        sub: count(retry.length, 'card', 'cards') + ' on file',
        tone: 'clay'
      },
      {
        label: 'No card on file',
        value: money0(total(manual)),
        sub: count(manual.length, 'family', 'families') + ' to chase by hand',
        tone: 'plum'
      }
    ]);

    var note = 'Retry cadence is day 1, day 3 and day 7. After the third failure the enrollment is flagged but never silently cancelled — a person decides.';
    /* Only claimed while the arithmetic holds. */
    if (total(owedInvoices()) === familyBalances()) {
      note += ' The ' + Grove.money(total(owedInvoices())) + ' here is the same money carried on those ' +
        familyCount(owed) + ' family records.';
    }

    var table = ui.table(INVOICE_COLS, itemRows(list), {
      emptyTitle: 'Nothing outstanding',
      emptyText: 'Every invoice is settled. The next automatic run is ' + NEXT_RUN + '.'
    });

    var cards = retry.map(function (i) { return i.method; });
    var manualNames = manual.map(function (i) { return i.fam + ' family'; });

    var hint = retry.length
      ? 'Charges ' + listOf(cards) + ' today.'
      : 'Nothing outstanding has a card on file to charge again.';
    if (manual.length) {
      hint += ' ' + listOf(manualNames) + ' ' + (manual.length === 1 ? 'has' : 'have') +
        ' no card saved, so ' + (manual.length === 1 ? 'that one is a message' : 'those are messages') +
        ', not a retry.';
    }

    var buttons = [];
    if (retry.length) {
      buttons.push({
        label: 'Retry ' + count(retry.length, 'card', 'cards') + ' · ' + Grove.money(total(retry)),
        kind: 'primary',
        msg: count(retry.length, 'card', 'cards') + ' retried · ' + Grove.money(total(retry)) +
          ' attempted · results land within the hour'
      });
    }
    buttons.push({
      label: 'Message ' + count(familyCount(owed), 'family', 'families'),
      kind: retry.length ? undefined : 'primary',
      msg: 'Recovery email queued to ' + count(familyCount(owed), 'family', 'families')
    });

    return ui.toolbar({
      tabs: billingTabs(),
      search: { key: 'attention', placeholder: 'Search invoice, family, card…' },
      count: list.length + ' of ' + owed.length + ' outstanding'
    }) + stats + ui.card({
      title: 'Everything still owed',
      flush: true,
      note: note
    }, table) + ui.formActions(buttons, { sticky: true, hint: hint });
  }

  /* ---- tab 3 · adjustments --------------------------------------------------------
     One register for every reduction, whichever way the money went. The only
     thing waiting on her is an approval, so it is a notice at the top that
     states the amount, the card and the fact that it is one-way — not a pill
     in the fifth column of a table. */

  function adjustmentsTab() {
    var q = Grove.query('adjustments');
    var list = ADJUSTMENTS.filter(function (a) {
      var f = adjFamily(a);
      return Grove.match(q, f.name, a.reason, adjWhere(a), adjState(a).label, a.by);
    });
    var open = waiting();
    var held = unspent();
    var back = refunded();

    var stats = ui.statbar([
      {
        label: 'Unspent credit',
        value: money0(total(held)),
        sub: held.length + ' of ' + count(credits().length, 'credit', 'credits') + ' still to come off an invoice',
        tone: 'grove'
      },
      {
        label: 'Paid back to cards',
        value: money0(Math.abs(total(back))),
        sub: count(back.length, 'refund', 'refunds')
      },
      {
        label: 'Waiting on you',
        value: money0(Math.abs(total(open))),
        sub: count(open.length, 'refund to approve', 'refunds to approve'),
        tone: 'clay'
      }
    ]);

    var lead = '';
    if (open.length) {
      var a = open[0];
      var f = adjFamily(a);
      var more = open.length > 1
        ? ' ' + count(open.length - 1, 'other refund is', 'other refunds are') + ' waiting too.'
        : '';
      lead = ui.notice({
        kind: 'warn',
        title: open.length === 1
          ? 'One refund is waiting on you'
          : open.length + ' refunds are waiting on you',
        text: a.by + ' asked to send ' + Grove.money(Math.abs(a.amt)) + ' back to the ' + f.name +
          ' family on ' + a.date + ' — ' + a.reason.toLowerCase() + '. Approving it puts the money on ' +
          cardOf(f) + ' today and it cannot be pulled back from here.' + more,
        action: {
          label: 'Approve the refund',
          kind: 'primary',
          msg: Grove.money(Math.abs(a.amt)) + ' refunded to ' + cardOf(f) + ' · ' + f.name + ' family'
        }
      });
    }

    var table = ui.table(ADJUST_COLS, list.map(function (a) {
      var f = adjFamily(a);
      var st = adjState(a);
      return {
        to: 'familyRecord',
        id: f.id,
        cells: [
          ui.two(f.name + ' family', a.dest === 'card' ? 'Back to the card' : 'Credit on account'),
          ui.two(a.reason, adjWhere(a)),
          ui.mute(a.date),
          amount(a.amt, a.amt < 0 ? 'clay strong' : 'grove'),
          ui.pill(st.label, st.kind),
          ui.mute(a.by)
        ]
      };
    }), {
      emptyTitle: 'No adjustments match',
      emptyText: 'Clear the search to see the whole register.'
    });

    var register = ui.card({
      title: 'Balance adjustments',
      flush: true,
      note: 'Every adjustment names a reason, an author and a date, and is posted against the family rather than edited into the original charge. A refund still waiting on approval is not netted off what the family owes.'
    }, table);

    return ui.toolbar({
      tabs: billingTabs(),
      search: { key: 'adjustments', placeholder: 'Search family, reason…' },
      count: list.length + ' of ' + ADJUSTMENTS.length + ' records'
    }) + stats + lead +
      (lead ? '<div class="section">' + register + '</div>' : register);
  }

  /* ---- Adjust a balance ------------------------------------------------------------
     The one form. Who, how much, why — and one switch for where the money
     goes. Everything else about an adjustment has a single sensible answer,
     so it is stated rather than asked: the date is today, the author is
     whoever is signed in, the card is the one on file, and a family with no
     card saved is told that credit is the only option rather than being
     offered a switch that cannot work. */

  Grove.on('adjFam', function (d) { Grove.setFilter('adjFam', d.id); });

  var TO_CARD = 'adj-to-card';

  function pickedFamily() {
    return D.family(Grove.filter('adjFam', LEDGER_FAMILY)) || D.family(LEDGER_FAMILY);
  }

  function latestInvoice(f) {
    var mine = D.INVOICES.filter(function (i) { return i.fam === f.name; });
    return mine.sort(function (a, b) {
      return parseInt(b.id.replace(/\D/g, ''), 10) - parseInt(a.id.replace(/\D/g, ''), 10);
    })[0] || null;
  }

  Grove.screen('adjust', {
    surface: 'console',
    crumbs: [{ label: 'Billing', to: 'billing' }],
    crumbTitle: 'Adjust a balance',
    eyebrow: 'one form, one decision',
    title: 'Adjust a balance',
    sub: 'The one way the studio reduces what a family owes. The only decision beyond who, how much and why is whether the money goes back to their card or sits as credit against their next invoice.',

    body: function () {
      var f = pickedFamily();
      var canCard = hasCard(f);
      var toCard = canCard && Grove.toggle(TO_CARD, false);

      var who = ui.choices(2, D.FAMILIES.map(function (x) {
        return ui.choice({
          id: x.id,
          act: 'adjFam',
          title: x.name + ' family',
          sub: (x.balance > 0 ? 'Owes ' + Grove.money(x.balance) : 'Nothing owing') + ' · ' + cardOf(x),
          on: x.id === f.id
        });
      }));

      var where = canCard
        ? ui.toggleRow({
            id: TO_CARD,
            title: 'Send it back to their card',
            sub: 'Off, it sits as credit on the account and comes off their next invoice. On, it goes back to ' +
              cardOf(f) + ' and leaves the studio.',
            on: false
          })
        : h`<p class="label">Where the money goes</p>
            <p class="hint">The ${f.name} family have no card saved, so this can only sit as
            credit against their next invoice.</p>`;

      var form = ui.card({
        title: 'What is being adjusted',
        note: 'Refunds are credit by default. Sending money back to a card is the exception, and it is the owner who signs it off.'
      }, h`
        <p class="label">Which family</p>
        <p class="hint">Eight families on the books. Their balance and card are shown so you are not adjusting the wrong one.</p>
        <div class="card-split">${raw(who)}</div>
        <div class="card-split">
          ${raw(ui.fields(2, [
            ui.field({
              label: 'Amount',
              hint: 'What comes off what they owe',
              control: ui.input({ placeholder: '0.00' })
            }),
            ui.field({
              label: 'Why',
              hint: 'It goes on the ledger and on their statement, in these words',
              control: ui.input({ placeholder: 'Overpaid June tuition' })
            })
          ]))}
        </div>
        <div class="card-split">${raw(where)}</div>
      `);

      var last = latestInvoice(f);
      var theirs = creditsFor(f.id);

      var stands = ui.card({ title: 'Where the ' + f.name + ' family stands' }, ui.kv([
        f.balance > 0
          ? { k: 'Owes now', v: Grove.money(f.balance), tone: 'clay' }
          : { k: 'Owes now', v: 'Nothing', tone: 'mute' },
        ['Card on file', canCard ? esc(cardOf(f)) : '<span class="mute">None saved</span>'],
        ['Payments are taken', f.autopay ? 'Automatically, on the card above' : 'By hand, at the desk'],
        theirs.length
          ? { k: 'Credit they already hold', v: Grove.money(total(theirs)), tone: 'grove' }
          : { k: 'Credit they already hold', v: 'None', tone: 'mute' },
        last
          ? ['Last invoice', esc(last.id + ' · ' + Grove.money(last.amt) + ' · ' + last.status)]
          : { k: 'Last invoice', v: 'None raised yet', tone: 'mute' }
      ]));

      /* Four things the old forms asked that only ever had one answer. */
      var assumed = ui.card({
        title: 'Filled in for you',
        note: 'An adjustment is never edited once posted. A correction is a second adjustment, so both lines stay on the record.'
      }, ui.kv([
        ['Date', esc(D.today)],
        ['Recorded by', esc(Grove.persona('console').name)],
        ['Posted against', esc(f.name + ' family')],
        ['Posted as', toCard ? 'A refund, dated today' : 'A credit against their next invoice'],
        ['The family sees it', 'On their next statement and in the portal']
      ]));

      var label = toCard ? 'Refund to ' + cardOf(f) : 'Add credit to the ' + f.name + ' account';
      var hint = toCard
        ? 'Money leaves the studio today, back to ' + cardOf(f) + '. You cannot pull it back from here.'
        : 'Nothing leaves the studio. The credit comes off the ' + f.name + ' family’s next invoice.';
      var done = toCard
        ? 'Refunded to ' + cardOf(f) + ' · ' + f.name + ' family'
        : 'Credit added to the ' + f.name + ' family account · it comes off their next invoice';

      return h`
        ${raw(ui.grid('sidebar', [form, ui.col([stands, assumed])]))}
        ${raw(ui.formActions([
          { label: label, kind: 'primary', msg: done },
          { label: 'Cancel', to: 'billing' }
        ], { sticky: true, hint: hint }))}
      `;
    }
  });

  /* ---- Post the tuition run -----------------------------------------------------
     This was a header button that told her afterwards what it had done. It is
     the largest single money event in the month, so it is a page that shows
     her the whole run first: who is charged and for how much, what they
     already owe, and who is left alone with the reason. */

  Grove.screen('postRun', {
    surface: 'console',
    crumbs: [{ label: 'Billing', to: 'billing' }],
    crumbTitle: 'Tuition run',
    eyebrow: 'nothing is charged yet',
    title: 'Post the tuition run',
    sub: function () {
      return 'Exactly who the ' + NEXT_RUN + ' run would bill, and who it would leave alone. Nothing is raised and no card is charged until you post it.';
    },

    body: function () {
      var list = billability();
      var held = heldBack();
      var owing = list.filter(function (r) { return r.owes > 0; });
      var run = lastRun();

      var warn = owing.length
        ? ui.notice({
            kind: 'warn',
            title: owing.length === 1
              ? 'One family on this run already owes money'
              : owing.length + ' of these families already owe money',
            text: listOf(owing.map(function (r) {
              return r.f.name + ' ' + Grove.money(r.owes) + (r.open ? ' (' + r.open.status.toLowerCase() + ')' : '');
            })) + ' — ' + Grove.money(owing.reduce(function (n, r) { return n + r.owes; }, 0)) +
              ' in all. Posting adds August to what is already out; it does not collect it.'
          })
        : '';

      var table = ui.table(
        ['Family', 'Plan', 'Card', { label: 'Owes now', align: 'right' }, { label: 'To charge', align: 'right' }],
        list.map(function (r) {
          return {
            to: 'familyRecord',
            id: r.f.id,
            cells: [
              ui.two(r.f.name + ' family', r.f.guardian),
              ui.mute(r.f.plan),
              ui.mute(cardOf(r.f)),
              r.owes > 0 ? amount(r.owes, 'clay strong') : ui.mute('—'),
              h`<span class="strong">${Grove.money(r.amt)}</span>`
            ]
          };
        }),
        {
          emptyTitle: 'Nothing to post',
          emptyText: 'No family on the books is on a monthly plan this month.'
        }
      );

      var autopay = list.filter(function (r) { return r.f.autopay; });
      var byHand = list.filter(function (r) { return !r.f.autopay; });
      var runNote = 'Each amount is that family’s plan priced from Settings → Pricing, not a figure typed in here. ';
      runNote += autopay.length === list.length
        ? 'All ' + list.length + ' are on autopay, so the card is charged the day the invoice is raised.'
        : count(autopay.length, 'family is', 'families are') + ' on autopay and charged the same day; ' +
          listOf(byHand.map(function (r) { return r.f.name; })) + ' will be invoiced by hand.';

      var charge = ui.card({
        title: 'Will be billed on ' + NEXT_RUN,
        flush: true,
        note: runNote
      }, table);

      var holds = ui.card({
        title: 'Held back',
        flush: true,
        note: 'Held back means nothing is raised and nothing is charged. Each of these is invoiced by hand when the time comes.'
      }, held.length
        ? ui.rows(held.map(function (f) {
            return {
              title: esc(f.name + ' family'),
              sub: esc(holdReason(f)),
              to: 'familyRecord',
              id: f.id
            };
          }))
        : ui.empty('Nobody is held back', 'Every family on the books is on a monthly plan.'));

      var terms = ui.card({ title: 'What posting does' }, ui.kv([
        ['Raises', count(list.length, 'invoice', 'invoices') + ', one per family'],
        ['Charges', count(autopay.length, 'card', 'cards') + ' the same day'],
        run ? ['Terms', esc('The last run was raised ' + run.date + ' and fell due ' + run.due)]
            : { k: 'Terms', v: 'The same terms as the last run', tone: 'mute' },
        ['If a card fails', 'Retried on day 1, day 3 and day 7']
      ]));

      return h`
        ${raw(warn)}
        ${raw(ui.grid('sidebar', [charge, ui.col([holds, terms])]))}
        ${raw(ui.formActions([
          {
            label: 'Post ' + count(list.length, 'invoice', 'invoices') + ' · ' + Grove.money(runTotal()),
            kind: 'primary',
            msg: count(list.length, 'invoice', 'invoices') + ' posted · ' + Grove.money(runTotal()) +
              ' charged to ' + count(autopay.length, 'card', 'cards') + ' on ' + NEXT_RUN
          },
          { label: 'Cancel', to: 'billing' }
        ], {
          sticky: true,
          hint: 'Charges ' + count(autopay.length, 'card', 'cards') + ' on ' + NEXT_RUN + '. ' +
            count(held.length, 'family is', 'families are') + ' held back and nothing is charged to them.'
        }))}
      `;
    }
  });

  /* The run, with each family's price and what they already owe, worked out
     once so the table, the notice and the pinned bar cannot disagree. */
  function billability() {
    return billable().map(function (f) {
      var open = openInvoice(f);
      return { f: f, amt: monthly(f), owes: f.balance, open: open };
    });
  }

  /* ---- the family ledger ---------------------------------------------------------- */

  function ledgerFamily() { return D.family(LEDGER_FAMILY); }

  Grove.screen('ledger', {
    surface: 'console',
    crumbs: [{ label: 'Billing', to: 'billing' }],
    crumbTitle: ledgerFamily().name + ' family',
    eyebrow: 'every line, in order',
    title: function () { return ledgerFamily().name + ' family'; },
    sub: 'Charges and payments against this family, newest first. A charge is never edited once posted — corrections are posted as adjustments, so both lines stay on the record.',
    actions: function () {
      var f = ledgerFamily();
      var owing = D.LEDGER.reduce(function (n, l) { return l.paid ? n : n + l.amt; }, 0);
      return [
        { label: 'Statement', msg: 'Statement emailed to ' + f.email },
        { label: 'Adjust the balance', to: 'adjust' },
        {
          label: 'Record a payment',
          kind: 'primary',
          msg: owing > 0
            ? Grove.money(owing) + ' recorded against the ' + f.name + ' family · receipt emailed to ' + f.email
            : 'Payment recorded against the ' + f.name + ' family · receipt emailed to ' + f.email
        }
      ];
    },

    body: function () {
      var lines = D.LEDGER.slice().reverse();

      var charged = 0, adjusted = 0, settled = 0, owing = 0;
      D.LEDGER.forEach(function (l) {
        if (l.amt < 0) { adjusted += l.amt; } else { charged += l.amt; }
        if (l.paid) { settled += l.amt; } else { owing += l.amt; }
      });

      var table = ui.table(
        ['Date', 'What for', { label: 'Amount', align: 'right' }, { label: 'Status', shrink: true }],
        lines.map(function (l) {
          var credit = l.amt < 0;
          return {
            cells: [
              ui.mute(l.d),
              ui.two(l.what, credit ? 'Adjustment' : 'Charge'),
              amount(l.amt, credit ? 'grove' : (l.paid ? '' : 'clay strong')),
              ui.pill(l.paid ? 'Paid' : 'Unpaid', l.paid ? 'ok' : 'bad')
            ]
          };
        }),
        { emptyTitle: 'Nothing posted yet', emptyText: 'The first charge appears here the day it is raised.' }
      );

      var ledgerCard = ui.card({
        title: 'Charges and adjustments',
        flush: true,
        note: 'Cash and cheques taken at the desk are recorded here with a reference and a date paid. A line with no date paid counts against the family balance.'
      }, table);

      var totalsNote = 'Charged, less adjusted, less paid, is what is left: ' + Grove.money(charged) +
        ' − ' + Grove.money(Math.abs(adjusted)) + ' − ' + Grove.money(settled) + ' = ' +
        Grove.money(owing) + '.';
      if (owing > 0) {
        totalsNote += ' That ' + Grove.money(owing) + ' is the same line Billing chases on Needs attention.';
      }
      totalsNote += ' A statement is generated, never stored, so it always reflects the ledger as it stands right now.';

      var totals = ui.card({
        title: 'Totals',
        note: totalsNote
      }, ui.kv([
        ['Charged', Grove.money(charged)],
        { k: 'Adjusted', v: Grove.money(adjusted), tone: 'grove' },
        { k: 'Paid', v: Grove.money(settled), tone: 'grove' },
        { k: 'Outstanding', v: Grove.money(owing), tone: owing > 0 ? 'clay' : 'mute' }
      ]));

      var theirs = ADJUSTMENTS.filter(function (a) { return a.fam === LEDGER_FAMILY; });
      var adjCard = ui.card({
        title: 'Balance adjustments',
        flush: true,
        note: 'An adjustment is applied against an invoice rather than posted here as a ledger line, so it changes what the family was charged, not what is listed above.'
      }, theirs.length
        ? ui.rows(theirs.map(function (a) {
            var st = adjState(a);
            return {
              title: esc(a.reason) + ' <span class="num ' + (a.amt < 0 ? 'clay' : 'grove') + '">' +
                Grove.money(a.amt) + '</span>',
              sub: esc(a.date + ' · ' + adjWhere(a) + ' · recorded by ' + a.by),
              end: ui.pill(st.label, st.kind)
            };
          }))
        : ui.empty('No adjustments on this account', 'Overpayments and studio cancellations appear here.'));

      /* No pinned bar here. The ledger is a record to read, not a form to
         finish, and its three header buttons are already the three things
         that can be done to it. */
      return ui.grid('sidebar', [ledgerCard, ui.col([totals, adjCard])]);
    }
  });
})();
