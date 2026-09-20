/* Console → Billing: the money screens for the owner.

   Four screens in one file, because they are one subject: every charge the
   studio has raised (Billing), the family ledger behind it, the one form that
   reduces what a family owes (Adjust a balance), and the renewals that are
   coming (Renewals ahead).

   THE BILLING MODEL, CORRECTED
     A family buys a pack of sessions for a child. The child attends. When the
     last session in the pack is used, the pack renews — it charges again and
     grants another pack the same size. There is no billing date and no cycle,
     so the next charge is a number of classes away, never a day.
     A pack belongs to one child, not to the family. Emma's pack of 8 and
     Lucas's pack of 4 renew at different times, so a household with two
     children gets two separate charges.
     Sessions do not expire — a pack is paid for, so it is theirs until it is
     used. A session cancelled more than 24 hours ahead is simply not spent;
     the pack lasts a week longer. Nothing is issued, so there is no make-up
     credit anywhere on these screens.

   WHAT WENT OUT WITH THE MONTHLY MODEL
     - monthly(f), which priced a family from a "sessions / month" plan string,
       and with it the whole idea of a family-level monthly amount. A pack is
       priced per child from Settings → Pricing and renews per child.
     - "Post the tuition run" — a page that raised one invoice per family on
       the 1st. Nothing is posted on a date now, so it is "Renewals ahead":
       which child's pack renews next and for how much, with nothing to press,
       because the charge happens by itself on the last session of the pack.
     - NEXT_RUN, the "1 August" literal, and lastRun(), which read a raised-and-
       due date pair off the invoices so August could claim the same terms as
       July. There are no terms of that shape left to describe.
     - the clause on the Adjustments tab that distinguished these records from
       "make-up credits, counted in classes". There are no make-up credits.
     - "membership". A family is not a member, they hold sessions, and
       cancelling is simply not renewing: they use what they have paid for and
       the pack does not renew.

   THE CONSOLIDATION THE AUDIT ASKED FOR
     There were six ways to reduce what a family owes — adjustment, refund,
     write-off, credit, discount, fixed fee — each with its own form and its
     own reason list. On these screens two of them survived: "Issue account
     credit" in the head of the credits card, and "Post an adjustment" in the
     ledger header. Both now open one screen, Adjust a balance, which asks
     three questions (who, how much, why) and carries one switch: does the
     money go back to their card, or does it sit as credit against their next
     charge. Nothing else about it is a choice — the date is today, the author
     is whoever is signed in, the card is the one on file, and the screen says
     so rather than asking.
     The register those adjustments land in is one tab, "Adjustments", where
     three record types (Account credit / Refund / Refund request) and four
     statuses (Available / Applied to INV-… / Refunded to Amex / Pending
     approval) are now one destination column and three states. Three, because
     those are the three she treats differently: one is waiting on her, one is
     money still to come off a future charge, and one is done.

   OTHER CEREMONY CUT
     - "Statements" emailed every family at once from the header. A statement
       is per family and the ledger already sends one, to a named address. The
       mass button is gone.
     - "Take a payment" took money with no family, no amount and no card, and
       reported it in the past tense. Money moves are recorded against a
       family, so the control that can name the family, the ledger's "Record a
       payment", is the one kept.
     - the desk-charge reconciliation. Billing used to add ledger lines no
       invoice had picked up to its outstanding figure, guarding against
       double-counting by matching family, date and amount. It produced no rows
       against this dataset and it gave the screen two definitions of
       "outstanding" on two tabs. Outstanding is now the unpaid invoices, and
       that comes to the same $803 across the same four families as the
       balances on the family records — the note says so, and only while it is
       true.

   WHAT IS NOW OBVIOUS
     - Needs attention exists to get money in, so the thing she came to do is
       pinned to the bottom of the viewport: retry the cards that can be
       retried, and it names them and their total first. The one family with no
       card saved is named too, because they need a message, not a retry.
     - Renewals ahead is a forecast, not an action. It lists every child
       holding a pack, soonest first, with how far through it they are and what
       the renewal will charge; it names the packs that renew on the very next
       class; and it names the one child whose family has asked not to renew.
     - Approving a refund is the only thing on the Adjustments tab that is
       waiting on her, so it is a notice at the top that names the amount, the
       family, the card it goes back to and the fact that it cannot be pulled
       back — not a pill in a table.

   EVERY FIGURE IS DERIVED
     Raised, collected and outstanding partition the invoice table; cards to
     retry and no-card-on-file partition what is outstanding; charged, adjusted
     and paid partition the ledger. Every renewal is its child's pack priced
     from Settings → Pricing (PRICING.as.plans), and the forecast counts the
     children whose next class is the last session of their pack. Nothing on
     these four screens is typed in.

   THE ONE LIST WITH NO ENTRY IN js/data.js
     ADJUSTMENTS, below. Its five records are the content spec's. Each family
     name and card is read back out of Grove.data, and every amount is now
     produced by the studio's own pricing rather than written down: a pop-up
     class, a cancelled camp day, an extra class at the twelve-session rate, a
     pack of 8 refunded in full and a pack of 4 that was never started. */
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
     studio, 'credit' leaves it on the account until a charge spends it. A
     refund is therefore negative and a credit positive. Every amount is the
     studio's own price for the thing that went wrong. */
  var ADJUSTMENTS = [
    { fam: 'johnson',  dest: 'credit', reason: 'Pop-up class charged twice',          date: '12 Jun 2026', amt: D.PRICING.pop.events[0].amount,  spent: 'INV-2838', by: 'Dani Cruz' },
    { fam: 'chen',     dest: 'credit', reason: 'Camp day cancelled by the studio',    date: '8 Jul 2026',  amt: D.PRICING.camp.day,              spent: null,       by: 'Sabrina Yanguas' },
    { fam: 'brennan',  dest: 'card',   reason: 'Duplicate charge',                    date: '3 Jul 2026',  amt: -D.PRICING.as.plans.p8,          spent: null,       by: 'Sabrina Yanguas' },
    { fam: 'martinez', dest: 'credit', reason: 'Extra class charged twice',           date: '28 Jun 2026', amt: D.PRICING.as.extraClassRate.p12, spent: null,       by: 'Dani Cruz' },
    { fam: 'smith',    dest: 'card',   reason: 'Paid for a pack they never started',  date: '26 Jul 2026', amt: -D.PRICING.as.plans.p4,          spent: null,       by: 'Rey Molina', waiting: true }
  ];

  /* ---- small helpers -------------------------------------------------------- */

  function money0(n) { return Grove.money(n, { cents: false }); }

  function total(list) {
    return list.reduce(function (n, r) { return n + r.amt; }, 0);
  }

  function count(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  function uniq(list, key) {
    var seen = {}, n = 0;
    list.forEach(function (r) {
      var k = key(r);
      if (!seen[k]) { seen[k] = true; n += 1; }
    });
    return n;
  }

  function familyCount(list) {
    return uniq(list, function (r) { return r.fam; });
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

  function foot(label, value) {
    return '<span class="cell-mute">' + esc(label) + '</span>' +
      '<span class="num strong">' + esc(value) + '</span>';
  }

  /* ---- packs ------------------------------------------------------------------
     A pack belongs to one child. It renews when its last session is used, so
     the only "when" a pack has is a number of classes. */

  function packPrice(size) { return D.PRICING.as.plans['p' + size] || 0; }

  function familyOf(s) {
    return D.FAMILIES.filter(function (f) { return f.name === s.family; })[0];
  }

  function childrenOf(f) {
    return D.STUDENTS.filter(function (s) { return s.family === f.name; });
  }

  /* Cancelling is not a status of its own any more: it is a family that has
     said the pack should not renew. */
  function stopping(f) {
    return !!f && (f.status === 'Cancelling' || String(f.plan).indexOf('not renewing') !== -1);
  }

  function packHolders() {
    return D.STUDENTS.filter(function (s) { return D.pack(s).isPack; });
  }
  function packsHeld(f) {
    return childrenOf(f).filter(function (s) { return D.pack(s).isPack; });
  }
  function renewing() {
    return packHolders().filter(function (s) { return !stopping(familyOf(s)); });
  }
  function lastPack() {
    return packHolders().filter(function (s) { return stopping(familyOf(s)); });
  }
  function noPack() {
    return D.STUDENTS.filter(function (s) { return !D.pack(s).isPack; });
  }
  function renewsNext() {
    return renewing().filter(function (s) { return D.pack(s).renewsIn <= 1; });
  }
  function packValue(list) {
    return list.reduce(function (n, s) { return n + packPrice(s.pack); }, 0);
  }
  function packFamilies(list) {
    return uniq(list, function (s) { return s.family; });
  }

  function whenText(s) {
    var n = D.pack(s).renewsIn;
    return n <= 1 ? 'On the next class' : 'In ' + n + ' classes';
  }
  function progressText(s) {
    var p = D.pack(s);
    return p.used + ' of ' + p.size + ' used · ' +
      (p.renewsIn <= 1 ? 'renews on the next class' : p.renewsIn + ' classes before it renews');
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

  function openInvoice(f) {
    return owedInvoices().filter(function (i) { return i.fam === f.name; })[0] || null;
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
     waiting on her, one is money still to come off a future charge, and one is
     finished with. */
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
    return 'Not yet applied to a charge';
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
      if (tab === T_ADJUST) return 'Every time the studio has reduced what a family owes, whether the money went back to a card or stayed as credit on the account.';
      return 'Every charge the studio has raised. A pack belongs to one child, but the money is always owed by the family.';
    },
    actions: [
      { label: 'Adjust a balance', to: 'adjust' },
      { label: 'Renewals ahead', kind: 'primary', to: 'renewals' }
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
    var soon = renewsNext();

    var stats = ui.statbar([
      {
        label: 'Charges raised',
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
      emptyText: 'Clear the search and every charge comes back.'
    });

    return ui.toolbar({
      tabs: billingTabs(),
      search: { key: 'invoices', placeholder: 'Search invoice, family, card…' },
      count: list.length + ' of ' + all.length + ' invoices'
    }) + stats + ui.card({
      title: 'Every charge raised',
      flush: true,
      note: 'A charge is raised the day it happens: a pack the moment it renews, a camp week when it is booked, a late pickup the afternoon it happens. Nothing is raised on a date. ' +
        count(soon.length, 'pack renews', 'packs renew') + ' on the next class.'
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

    var note = 'Retry cadence is day 1, day 3 and day 7. After the third failure the child keeps every session still in their pack and the place is flagged, never silently cancelled — a person decides.';
    /* Only claimed while the arithmetic holds. */
    if (total(owedInvoices()) === familyBalances()) {
      note += ' The ' + Grove.money(total(owedInvoices())) + ' here is the same money carried on those ' +
        familyCount(owed) + ' family records.';
    }

    var table = ui.table(INVOICE_COLS, itemRows(list), {
      emptyTitle: 'Nothing outstanding',
      emptyText: 'Every charge is settled. Nothing new is raised until a pack renews.'
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
        sub: held.length + ' of ' + count(credits().length, 'credit', 'credits') + ' still to come off a charge',
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
    sub: 'The one way the studio reduces what a family owes. The only decision beyond who, how much and why is whether the money goes back to their card or sits as credit against their next charge.',

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
            sub: 'Off, it sits as credit on the account and comes off their next charge. On, it goes back to ' +
              cardOf(f) + ' and leaves the studio.',
            on: false
          })
        : h`<p class="label">Where the money goes</p>
            <p class="hint">The ${f.name} family have no card saved, so this can only sit as
            credit against their next charge.</p>`;

      var form = ui.card({
        title: 'What is being adjusted',
        note: 'Refunds are credit by default. Sending money back to a card is the exception, and it is the owner who signs it off.'
      }, h`
        <p class="label">Which family</p>
        <p class="hint">${count(D.FAMILIES.length, 'family', 'families')} on the books. Their balance
        and card are shown so you are not adjusting the wrong one.</p>
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
              control: ui.input({ placeholder: 'Camp day cancelled by the studio' })
            })
          ]))}
        </div>
        <div class="card-split">${raw(where)}</div>
      `);

      var last = latestInvoice(f);
      var theirs = creditsFor(f.id);
      var held = packsHeld(f);

      var stands = ui.card({ title: 'Where the ' + f.name + ' family stands' }, ui.kv([
        f.balance > 0
          ? { k: 'Owes now', v: Grove.money(f.balance), tone: 'clay' }
          : { k: 'Owes now', v: 'Nothing', tone: 'mute' },
        held.length
          ? ['Packs held', esc(held.map(function (s) {
              var p = D.pack(s);
              return s.name.split(' ')[0] + ' ' + p.used + ' of ' + p.size;
            }).join(' · '))]
          : { k: 'Packs held', v: 'None — camp and one-off bookings', tone: 'mute' },
        ['Card on file', canCard ? esc(cardOf(f)) : '<span class="mute">None saved</span>'],
        ['Payments are taken', f.autopay ? 'Automatically, on the card above' : 'By hand, at the desk'],
        theirs.length
          ? { k: 'Credit they already hold', v: Grove.money(total(theirs)), tone: 'grove' }
          : { k: 'Credit they already hold', v: 'None', tone: 'mute' },
        last
          ? ['Last charge', esc(last.id + ' · ' + Grove.money(last.amt) + ' · ' + last.status)]
          : { k: 'Last charge', v: 'None raised yet', tone: 'mute' }
      ]));

      /* Four things the old forms asked that only ever had one answer. */
      var assumed = ui.card({
        title: 'Filled in for you',
        note: 'An adjustment is never edited once posted. A correction is a second adjustment, so both lines stay on the record.'
      }, ui.kv([
        ['Date', esc(D.today)],
        ['Recorded by', esc(Grove.persona('console').name)],
        ['Posted against', esc(f.name + ' family')],
        ['Posted as', toCard ? 'A refund, dated today' : 'A credit against their next charge'],
        ['The family sees it', 'On their next statement and in the portal']
      ]));

      var label = toCard ? 'Refund to ' + cardOf(f) : 'Add credit to the ' + f.name + ' account';
      var hint = toCard
        ? 'Money leaves the studio today, back to ' + cardOf(f) + '. You cannot pull it back from here.'
        : 'Nothing leaves the studio. The credit comes off the ' + f.name + ' family’s next charge, whenever that lands.';
      var done = toCard
        ? 'Refunded to ' + cardOf(f) + ' · ' + f.name + ' family'
        : 'Credit added to the ' + f.name + ' family account · it comes off their next charge';

      return h`
        ${raw(ui.grid('sidebar', [form, ui.col([stands, assumed])]))}
        ${raw(ui.formActions([
          { label: label, kind: 'primary', msg: done },
          { label: 'Cancel', to: 'billing' }
        ], { sticky: true, hint: hint }))}
      `;
    }
  });

  /* ---- Renewals ahead -------------------------------------------------------------
     What used to be "Post the tuition run". There is no run and no date: a
     pack renews the moment its last session is used, so this page forecasts
     rather than posts. Soonest first, one row per child, because a pack
     belongs to a child and a household with two children is two charges.

     There is no pinned bar, and that is the point — nothing here is waiting
     on her. The charge happens by itself on the last session of the pack. */

  function renewalRows(list) {
    return list.map(function (s) {
      var f = familyOf(s);
      var p = D.pack(s);
      return {
        to: 'studentRecord',
        id: s.id,
        cells: [
          ui.two(s.name, 'Age ' + s.age + ' · pack of ' + p.size),
          ui.two(f.name + ' family', cardOf(f)),
          h`<div class="stack stack--sm">
            <div>${raw(ui.pill(p.used + ' of ' + p.size, p.renewsIn <= 1 ? 'amber' : null))}</div>
            ${raw(ui.meter(p.used, p.size))}
          </div>`,
          p.renewsIn <= 1
            ? h`<span class="strong">${whenText(s)}</span>`
            : ui.mute(whenText(s)),
          h`<span class="strong">${Grove.money(packPrice(p.size))}</span>`
        ]
      };
    });
  }

  Grove.screen('renewals', {
    surface: 'console',
    crumbs: [{ label: 'Billing', to: 'billing' }],
    crumbTitle: 'Renewals',
    eyebrow: 'nothing to post',
    title: 'Renewals ahead',
    sub: 'Whose pack renews next, and for how much. A pack renews when its last session is used, so a renewal is a number of classes away rather than a day on the calendar, and it charges itself when the child takes that class.',

    body: function () {
      var list = renewing().slice().sort(function (a, b) {
        var d = D.pack(a).renewsIn - D.pack(b).renewsIn;
        if (d) return d;
        if (a.family !== b.family) return a.family < b.family ? -1 : 1;
        return a.name < b.name ? -1 : 1;
      });
      var soon = renewsNext();
      var stop = lastPack();
      var onCard = list.filter(function (s) { return familyOf(s).autopay; });
      var byHand = list.length - onCard.length;

      var stats = ui.statbar([
        {
          label: 'Renews on the next class',
          value: money0(packValue(soon)),
          sub: count(soon.length, 'pack', 'packs') + ' · ' + count(packFamilies(soon), 'family', 'families'),
          tone: 'clay'
        },
        {
          label: 'Packs on the books',
          value: String(list.length),
          sub: 'held by ' + count(packFamilies(list), 'family', 'families')
        },
        {
          label: 'If every pack renews',
          value: money0(packValue(list)),
          sub: 'no date attached — each charge lands on a child’s last session',
          tone: 'grove'
        }
      ]);

      var owingSoon = soon.filter(function (s) { return familyOf(s).balance > 0; });
      var warn = owingSoon.length
        ? ui.notice({
            kind: 'warn',
            title: owingSoon.length === 1
              ? 'One pack renews while that family still owes money'
              : owingSoon.length + ' packs renew while those families still owe money',
            text: listOf(owingSoon.map(function (s) {
              var f = familyOf(s);
              var open = openInvoice(f);
              return s.name + ' — the ' + f.name + ' family owes ' + Grove.money(f.balance) +
                (open ? ' (' + open.status.toLowerCase() + ')' : '');
            })) + '. Renewing charges the card again on top of what is already out; it does not collect it.'
          })
        : '';

      var table = ui.table(
        ['Child', 'Family', 'Pack', 'Renews', { label: 'Then charges', align: 'right' }],
        renewalRows(list),
        {
          emptyTitle: 'No packs on the books',
          emptyText: 'Every child here is on camp weeks and one-off bookings, which are paid for as they are booked.'
        }
      );

      var tableNote = 'Each price is that child’s pack priced from Settings → Pricing, not a figure typed in here. A renewal is charged the moment the last session in the pack is used. ';
      tableNote += byHand
        ? onCard.length + ' of ' + list.length + ' are on autopay and charged there and then; the other ' +
          byHand + ' are invoiced by hand.'
        : 'Every one of them is on autopay, so the card is charged there and then.';

      var renew = ui.card({
        title: 'Packs and when they renew',
        flush: true,
        note: tableNote,
        foot: foot(count(list.length, 'pack', 'packs') + ' on the books',
                   money0(packValue(list)) + ' if every one renews')
      }, table);

      var how = ui.card({ title: 'How a renewal works' }, ui.kv([
        ['A pack renews', 'When the last session in it is used'],
        ['It charges', 'Another pack the same size, at the same price'],
        ['There is no date', 'The next charge is a number of classes away'],
        ['Sessions do not expire', 'A pack is paid for, so it is theirs until it is used'],
        ['Told us 24 hours ahead', 'The session is not spent and the pack lasts a week longer'],
        ['Inside 24 hours', 'The session is spent, exactly as if they had come'],
        ['If a card fails', 'Retried on day 1, day 3 and day 7']
      ]));

      var stopped = ui.card({
        title: 'Not renewing',
        flush: true,
        note: 'Not renewing is the whole of cancelling. The family takes the sessions they have already paid for and the pack does not renew after the last one.'
      }, stop.length
        ? ui.rows(stop.map(function (s) {
            var f = familyOf(s);
            var p = D.pack(s);
            return {
              title: esc(s.name),
              sub: esc(f.name + ' family · ' + p.used + ' of ' + p.size + ' used · ' +
                count(p.left, 'session', 'sessions') + ' still to take'),
              end: ui.pill('Last pack'),
              to: 'studentRecord',
              id: s.id
            };
          }))
        : ui.empty('Every pack renews', 'No family has asked us to stop.'));

      var booked = noPack().filter(function (s) { return (s.classIds || []).length; });
      var waitingOn = noPack().filter(function (s) { return !(s.classIds || []).length; });

      var none = ui.card({
        title: 'Nothing renews for these',
        note: 'A camp week, a pop-up class and a birthday party are paid for when they are booked, so there is nothing to renew. A child with no place yet is on the waitlist or part-way through registering.'
      }, ui.kv([
        ['Camp and one-off bookings', count(booked.length, 'child', 'children')],
        ['No place yet', count(waitingOn.length, 'child', 'children')]
      ]));

      return h`
        ${raw(stats)}
        ${raw(warn)}
        ${raw(ui.grid('sidebar', [renew, ui.col([how, stopped, none])]))}
      `;
    }
  });

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
      var f = ledgerFamily();
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

      /* One pack per child, so the next two charges on this account are two
         different children finishing two different packs. */
      var held = packsHeld(f);
      var packs = ui.card({
        title: 'Packs on this account',
        flush: true,
        note: 'A pack belongs to one child, so these renew separately and arrive as separate charges. A session cancelled more than 24 hours ahead is not spent — the pack simply lasts a week longer.'
      }, held.length
        ? ui.rows(held.map(function (s) {
            var p = D.pack(s);
            return {
              title: esc(s.name),
              sub: esc(progressText(s) + ' · then ' + Grove.money(packPrice(p.size))),
              end: ui.pill(p.left + ' left', p.renewsIn <= 1 ? 'amber' : null),
              to: 'studentRecord',
              id: s.id
            };
          }))
        : ui.empty('No pack on this account', 'Camp weeks and one-off bookings are paid for when they are booked.'));

      var theirs = ADJUSTMENTS.filter(function (a) { return a.fam === LEDGER_FAMILY; });
      var adjCard = ui.card({
        title: 'Balance adjustments',
        flush: true,
        note: 'An adjustment is applied against a charge rather than posted here as a ledger line, so it changes what the family was charged, not what is listed above.'
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
      return ui.grid('sidebar', [ledgerCard, ui.col([totals, packs, adjCard])]);
    }
  });
})();
