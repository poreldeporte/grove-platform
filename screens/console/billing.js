/* Console → Billing: the money screens for the owner.

   Five screens in one file, because they are one subject: every charge the
   studio has raised (Billing), the family ledger behind it, the one form that
   reduces what a family owes (Adjust a balance), the one form that charges for
   anything outside a plan (Post a sale), and the cycles that are about to
   raise an invoice (Cycles ahead).

   THE PRICING MODEL, AS THE OWNER SETTLED IT
     A plan is HOURS A MONTH, and only After-School has one: 4h $280, 8h $540,
     12h $780, 16h $960, read from Settings → Pricing. A child on 16 hours
     taking two-hour classes comes eight times; a child on 16 hours taking
     one-hour classes comes sixteen. Hours are the unit. The split is the
     parent's.
     A cycle is a SET OF DATES — the day and time the parent picked at
     registration, fixed for the programme year. The month's hours are spent by
     those dated classes. The invoice is raised on the LAST class of the cycle
     and pays for the NEXT one, and it lists the dates it covers, because that
     is how the owner kept control when she did this by hand.
     Hours not booked are lost. Nothing rolls over, nothing is carried forward.
     A plan runs to the end of the school year and ends by itself, so there is
     no renewal into the summer and nothing to cancel in June.
     Camp, No-School Day, Private, Pop-Up and Birthday have no plan and no
     cycle. They are paid for when they are booked.

   WHAT WENT OUT WITH THE PACK MODEL
     Packs, sessions used and "renews on the 8th class" are gone, and so is the
     idea that a charge is a number of classes away rather than a date. So is
     "Post the tuition run": there is no run, so the page is "Cycles ahead" —
     whose cycle ends next, what the invoice will cover and for how much, with
     nothing to press, because the last class of the cycle raises it, not her.
     Every rule these screens state about make-ups, unbooked hours, freezing
     and cancelling is quoted from D.RULES rather than written out again here.

   THE ONE THING THE OWNER ASKED FOR, BUILT ONCE
     She asked for four things: adding a class or two when a child's school
     finishes later than the programme, charging for a private class that comes
     up, charging for an event, charging for anything else. They are not four
     features. They are the one action she already calls "make sale / post
     sale" — pick the family, say what it is for, enter the amount, charge the
     card on file — so Post a sale is the only exception mechanism on these
     screens, and school end dates, event billing and extra-class rules are
     deliberately not modelled anywhere. D.SALES is its register.

   OTHER CEREMONY CUT
     - the family picker on Adjust a balance listed every family on the books
       as a choice tile. Both forms now share one picker with a search over it,
       showing a handful at a time and always the one that is selected.
     - six ways to reduce a balance became one Adjust a balance form with three
       questions and one switch: back to the card, or credit on the account.
     - "Statements" emailed every family at once. A statement is per family and
       the ledger already sends one, to a named address.
     - the desk-charge reconciliation, which produced no rows and gave the
       screen two definitions of "outstanding".

   EVERY FIGURE IS DERIVED
     Raised, collected and outstanding partition the invoice table; cards to
     retry and no-card-on-file partition what is outstanding; charged, adjusted
     and paid partition the ledger. Every plan price is that child's hours
     priced from PRICING.as.plans, every cycle is the child's own dated classes
     in D.SESSIONS, and the dates an invoice covers are those same classes
     carried forward a cycle. Nothing on these screens is typed in.

   THE ONE LIST WITH NO ENTRY IN js/data.js
     ADJUSTMENTS, below. Each family and card is read back out of Grove.data
     and every amount is the studio's own price for the thing that went wrong. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  var TAB_KEY = 'billing';
  var T_INVOICES = 'Invoices';
  var T_ATTENTION = 'Needs attention';
  var T_ADJUST = 'Adjustments';

  /* js/data.js carries one worked-through family ledger, the Johnson family's,
     and both forms open on that family for the same reason. */
  var LEDGER_FAMILY = 'johnson';

  /* How many families a picker shows before you have to search. */
  var PICK_LIMIT = 8;

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

  var SALE_COLS = [
    'Family',
    'What it was for',
    'Date',
    { label: 'Amount', align: 'right' },
    'Posted by'
  ];

  /* Money owed back to a family, in the one shape the Adjust screen writes.
     `dest` is the single switch: 'card' sends it back and it leaves the
     studio, 'credit' leaves it on the account until a charge spends it. A
     refund is therefore negative and a credit positive. */
  var ADJUSTMENTS = [
    { fam: 'johnson',  dest: 'credit', reason: 'Pop-up class charged twice',            date: '12 Jun 2026', amt: D.PRICING.pop.events[0].amount,  spent: 'INV-2838', by: 'Dani Cruz' },
    { fam: 'chen',     dest: 'credit', reason: 'Camp day cancelled by the studio',      date: '8 Jul 2026',  amt: D.PRICING.camp.day,              spent: null,       by: 'Sabrina Yanguas' },
    { fam: 'brennan',  dest: 'card',   reason: 'Duplicate charge',                      date: '3 Jul 2026',  amt: -D.PRICING.as.plans.p8,          spent: null,       by: 'Sabrina Yanguas' },
    { fam: 'martinez', dest: 'credit', reason: 'Extra class charged twice',             date: '28 Jun 2026', amt: D.PRICING.as.extraClassRate.p12, spent: null,       by: 'Dani Cruz' },
    { fam: 'smith',    dest: 'card',   reason: 'Paid for a cycle they never started',   date: '26 Jul 2026', amt: -D.PRICING.as.plans.p4,          spent: null,       by: 'Rey Molina', waiting: true }
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

  /* ---- dates -------------------------------------------------------------------
     A cycle is a set of dates, so these screens have to be able to say them
     out loud. Nothing here knows a date literal: every date comes out of the
     child's own rows in D.SESSIONS. */

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function toUTC(iso) {
    var p = String(iso).split('-');
    return new Date(Date.UTC(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10)));
  }

  function addWeeks(iso, weeks) {
    var t = toUTC(iso);
    t.setUTCDate(t.getUTCDate() + 7 * weeks);
    return t.getUTCFullYear() + '-' + pad(t.getUTCMonth() + 1) + '-' + pad(t.getUTCDate());
  }

  function dayOf(iso) { return toUTC(iso).getUTCDate(); }
  function monthOf(iso) { return MONTHS[toUTC(iso).getUTCMonth()]; }
  function fmtDate(iso) { return dayOf(iso) + ' ' + monthOf(iso); }

  /* "3, 10, 17 and 24 August", or "27 and 31 August, then 2 September". */
  function listDates(list) {
    var groups = [], current = null;
    list.forEach(function (iso) {
      var m = monthOf(iso);
      if (!current || current.month !== m) {
        current = { month: m, days: [] };
        groups.push(current);
      }
      current.days.push(String(dayOf(iso)));
    });
    return groups.map(function (g) {
      return listOf(g.days) + ' ' + g.month;
    }).join(', then ');
  }

  /* ---- plans and cycles ----------------------------------------------------------
     A plan is hours a month and it belongs to one child. The cycle is that
     child's dated classes; the next cycle is the same pattern carried forward,
     one class at a time, which is how the invoice knows what to list. */

  function planOf(s) { return D.plan(s); }

  function familyOf(s) {
    return D.FAMILIES.filter(function (f) { return f.name === s.family; })[0];
  }

  function childrenOf(f) {
    return D.STUDENTS.filter(function (s) { return s.family === f.name; });
  }

  function planHolders() {
    return D.STUDENTS.filter(function (s) { return planOf(s).isPlan; });
  }
  function plansHeld(f) {
    return childrenOf(f).filter(function (s) { return planOf(s).isPlan; });
  }
  function noPlan() {
    return D.STUDENTS.filter(function (s) { return !planOf(s).isPlan; });
  }

  /* Cancelling is a family that has given notice, not a status of its own. */
  function stopping(f) {
    return !!f && (f.status === 'Cancelling' || String(f.plan).indexOf('not renewing') !== -1);
  }
  function running() {
    return planHolders().filter(function (s) { return !stopping(familyOf(s)); });
  }
  function leaving() {
    return planHolders().filter(function (s) { return stopping(familyOf(s)); });
  }

  function cycleDates(s) {
    return planOf(s).dates.map(function (x) { return x.date; }).sort();
  }

  /* The next cycle: every class in this one, carried forward by as many weeks
     as that class runs in a cycle. Same weekday, same time, the month after. */
  function nextCycle(s) {
    var byClass = {}, order = [];
    planOf(s).dates.forEach(function (x) {
      if (!byClass[x.classId]) { byClass[x.classId] = []; order.push(x.classId); }
      byClass[x.classId].push(x.date);
    });
    var out = [];
    order.forEach(function (id) {
      var runs = byClass[id].length;
      byClass[id].forEach(function (iso) { out.push(addWeeks(iso, runs)); });
    });
    return out.sort();
  }

  /* The invoice is raised on the last class of the cycle. */
  function invoiceDate(s) {
    var on = planOf(s).renewsOn;
    return on ? on.date : null;
  }
  function landsNext(s) { return planOf(s).nextDates.length === 1; }

  function planValue(list) {
    return list.reduce(function (n, s) { return n + planOf(s).price; }, 0);
  }
  function planFamilies(list) {
    return uniq(list, function (s) { return s.family; });
  }

  function byInvoiceDate(a, b) {
    var da = invoiceDate(a), db = invoiceDate(b);
    if (da !== db) {
      if (!da) return 1;
      if (!db) return -1;
      return da < db ? -1 : 1;
    }
    if (a.family !== b.family) return a.family < b.family ? -1 : 1;
    return a.name < b.name ? -1 : 1;
  }

  function hoursText(s) {
    var p = planOf(s);
    return count(p.hours, 'hour a month', 'hours a month');
  }
  function usedText(s) {
    var p = planOf(s);
    return p.usedHours + ' of ' + p.hours + ' hours used this cycle';
  }

  /* "Emma's last class of this cycle, 27 July, and covers 3, 10, 17 and 24
     August" — the sentence the owner used to write by hand. */
  function coversLine(s) {
    var on = invoiceDate(s);
    if (!on) return s.name.split(' ')[0] + ' has no class booked, so nothing is due.';
    return 'The next invoice on this account comes on ' + s.name.split(' ')[0] +
      '’s last class of this cycle, ' + fmtDate(on) + ', and covers ' +
      listDates(nextCycle(s)) + '.';
  }

  /* ---- invoices -------------------------------------------------------------- */

  function unpaid(inv) { return inv.status !== 'Paid'; }
  function paidInvoices() { return D.INVOICES.filter(function (i) { return !unpaid(i); }); }
  function owedInvoices() { return D.INVOICES.filter(unpaid); }

  /* What she can do about an unpaid invoice splits exactly two ways: there is
     a card to charge again, or there is not and somebody has to be asked. */
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

  /* ---- sales ------------------------------------------------------------------
     Every exception the studio bills outside a plan, in one register. */

  function salesFor(f) {
    return D.SALES.filter(function (x) { return x.fam === f.name; });
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

  /* ---- the shared family picker -------------------------------------------------
     Both forms ask the same first question. Sixty-nine choice tiles is not a
     question, it is a wall, so the picker searches and shows a handful — and
     always the family that is currently selected. */

  function pickedFamily(key) {
    return D.family(Grove.filter(key, LEDGER_FAMILY)) || D.family(LEDGER_FAMILY);
  }

  function familyMatches(q) {
    return D.FAMILIES.filter(function (x) {
      return Grove.match(q, x.name, x.guardian, x.kids, cardOf(x), x.plan);
    });
  }

  function familyPicker(qKey, actName, chosen) {
    var found = familyMatches(Grove.query(qKey));
    var shown = found.slice(0, PICK_LIMIT);
    var here = shown.filter(function (x) { return x.id === chosen.id; }).length;
    if (!here) shown = [chosen].concat(shown).slice(0, PICK_LIMIT);

    return ui.choices(2, shown.map(function (x) {
      return ui.choice({
        id: x.id,
        act: actName,
        title: x.name + ' family',
        sub: (x.balance > 0 ? 'Owes ' + Grove.money(x.balance) : 'Nothing owing') + ' · ' + cardOf(x),
        on: x.id === chosen.id
      });
    }));
  }

  function pickerCount(qKey) {
    var found = familyMatches(Grove.query(qKey));
    return Math.min(found.length, PICK_LIMIT) + ' of ' + count(D.FAMILIES.length, 'family', 'families');
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
      return 'Every charge the studio has raised. A plan belongs to one child, but the money is always owed by the family.';
    },
    actions: [
      { label: 'Adjust a balance', to: 'adjust' },
      { label: 'Cycles ahead', to: 'renewals' },
      { label: 'Post a sale', kind: 'primary', to: 'postSale' }
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
    var soon = running().filter(landsNext);

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
      note: 'A charge is raised the day it happens: a plan on the last class of its cycle, a camp week or a pop-up when it is booked, an extra class or a private the moment it is posted as a sale. Nothing is raised on a fixed date in the month. ' +
        count(soon.length, 'invoice lands', 'invoices land') +
        ' on a child’s very next class, and anything charged outside a plan is on Post a sale.'
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

    var note = 'Retry cadence is day 1, day 3 and day 7. After the third failure the child keeps the hours already paid for in this cycle and the place is flagged, never silently cancelled — a person decides.';
    /* Only claimed while the arithmetic holds. */
    if (total(owedInvoices()) === familyBalances()) {
      note += ' The ' + Grove.money(total(owedInvoices())) + ' here is the same money carried on those ' +
        familyCount(owed) + ' family records.';
    }

    var table = ui.table(INVOICE_COLS, itemRows(list), {
      emptyTitle: 'Nothing outstanding',
      emptyText: 'Every charge is settled. The next one is raised on a child’s last class of their cycle.'
    });

    var cards = retry.map(function (i) { return i.method; });
    var manualNames = manual.map(function (i) { return i.fam; });

    var hint = retry.length
      ? 'Charges ' + listOf(cards) + ' today.'
      : 'Nothing outstanding has a card on file to charge again.';
    if (manual.length) {
      hint += ' The ' + listOf(manualNames) + (manual.length === 1 ? ' family has' : ' families have') +
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

  /* ---- Post a sale ------------------------------------------------------------------
     The owner's own words: "make sale / post sale, así lo hago actualmente."
     One action for every exception she described — a class or two when a
     child's school finishes later than the programme, a private class that
     comes up, an event, any other service. Pick the family, say what it is
     for, enter the amount, charge the card on file.

     Nothing about the exception is modelled: there is no school end date, no
     event type and no extra-class rule, because the point of the manual charge
     is that those do not need modelling. */

  Grove.on('saleFam', function (d) { Grove.setFilter('saleFam', d.id); });

  function extraHourRange() {
    var rates = D.PRICING.as.extraClassRate;
    var values = Object.keys(rates).map(function (k) { return rates[k]; });
    var low = Math.min.apply(null, values);
    var high = Math.max.apply(null, values);
    return Grove.money(low, { cents: false }) + ' to ' + Grove.money(high, { cents: false }) +
      ' an hour, by plan size';
  }

  Grove.screen('postSale', {
    surface: 'console',
    crumbs: [{ label: 'Billing', to: 'billing' }],
    crumbTitle: 'Post a sale',
    eyebrow: 'one charge, any reason',
    title: 'Post a sale',
    sub: 'One charge on the card a family already has on file — a class or two when their school finishes later than the programme, a private class that came up, an event, any other service. It is the only way an exception gets billed, so there is no separate rule for each one.',

    body: function () {
      var f = pickedFamily('saleFam');
      var canCard = hasCard(f);
      var held = plansHeld(f);
      var theirs = salesFor(f);

      var form = ui.card({
        title: 'What the sale is for',
        note: 'A sale is a charge and nothing more. It does not add hours to a cycle, move an invoice or change a plan — those stay exactly as they were.'
      }, h`
        <p class="label">Which family</p>
        <p class="hint">Search by family, guardian, child or card. Their balance and card are
        shown so you are not charging the wrong one.</p>
        <div class="card-split">${raw(familyPicker('saleFam', 'saleFam', f))}</div>
        <div class="card-split">
          ${raw(ui.fields(2, [
            ui.field({
              label: 'What it is for',
              hint: 'These are the words on their ledger and on the receipt',
              control: ui.input({ placeholder: D.SALES[0].what })
            }),
            ui.field({
              label: 'Amount',
              hint: 'What goes on the card today',
              control: ui.input({ placeholder: '0.00' })
            })
          ]))}
        </div>
      `);

      var stands = ui.card({ title: 'Where the ' + f.name + ' family stands' }, ui.kv([
        f.balance > 0
          ? { k: 'Owes now', v: Grove.money(f.balance), tone: 'clay' }
          : { k: 'Owes now', v: 'Nothing', tone: 'mute' },
        held.length
          ? ['Plans held', esc(held.map(function (s) {
              return s.name.split(' ')[0] + ' ' + planOf(s).hours + 'h';
            }).join(' · '))]
          : { k: 'Plans held', v: 'None — camp and one-off bookings', tone: 'mute' },
        ['Card on file', canCard ? esc(cardOf(f)) : '<span class="mute">None saved</span>'],
        ['Payments are taken', f.autopay ? 'Automatically, on the card above' : 'By hand, at the desk'],
        theirs.length
          ? ['Sales posted before', esc(count(theirs.length, 'sale', 'sales') + ' · ' +
              Grove.money(total(theirs)))]
          : { k: 'Sales posted before', v: 'None', tone: 'mute' }
      ]));

      var prices = ui.card({
        title: 'What the studio charges',
        note: 'Read from Settings → Pricing, so a sale can be priced the way the studio prices everything else. The amount above is still yours to set.'
      }, ui.kv([
        ['An extra after-school hour', esc(extraHourRange())],
        ['A private class', esc(Grove.money(D.PRICING.priv.hourly, { cents: false }) + ' an hour')],
        ['A pop-up class', esc(Grove.money(D.PRICING.pop.events[0].amount, { cents: false }) + ' a child')],
        ['A day of camp', esc(Grove.money(D.PRICING.camp.day, { cents: false }))],
        ['A no-school day', esc(Grove.money(D.PRICING.nsd.base, { cents: false }) + ' · ' +
          Grove.money(D.PRICING.nsd.extraHour, { cents: false }) + ' an extra hour')],
        { k: 'A birthday party', v: 'Quoted from the enquiry', tone: 'mute' }
      ]));

      var assumed = ui.card({
        title: 'Filled in for you',
        note: 'A sale is never edited once posted. A correction is an adjustment against the same family, so both lines stay on the record.'
      }, ui.kv([
        ['Date', esc(D.today)],
        ['Posted by', esc(Grove.persona('console').name)],
        ['Charged to', canCard ? esc(cardOf(f)) : '<span class="mute">No card — it goes out as an invoice</span>'],
        ['The family sees it', 'On their ledger and in the portal, in the words you typed']
      ]));

      var saleRows = D.SALES.slice().reverse().map(function (x) {
        /* The family the sale was posted against, never the one picked above —
           falling back to the picked family would print somebody else's card. */
        var on = D.family(famIdFor(x.fam));
        return {
          to: 'familyRecord',
          id: famIdFor(x.fam),
          cells: [
            ui.two(x.fam + ' family', on ? cardOf(on) : 'No card saved'),
            h`<span class="cell-strong">${x.what}</span>`,
            ui.mute(x.when),
            amount(x.amt, 'strong'),
            ui.mute(x.by)
          ]
        };
      });

      var register = ui.card({
        title: 'Sales posted lately',
        flush: true,
        note: 'Extra classes at the end of term, a private lesson, an event, anything else — one register, whatever the reason. It is deliberately the only mechanism for the exceptions, rather than a rule for each of them.',
        foot: foot(count(D.SALES.length, 'sale', 'sales') + ' posted',
                   money0(total(D.SALES)) + ' charged')
      }, ui.table(SALE_COLS, saleRows, {
        emptyTitle: 'No sales posted yet',
        emptyText: 'The first manual charge appears here the moment it is taken.'
      }));

      var label = canCard
        ? 'Charge ' + cardOf(f)
        : 'Email the ' + f.name + ' family an invoice';
      var hint = canCard
        ? 'It charges ' + cardOf(f) + ' today and lands on the ' + f.name +
          ' family’s ledger the same minute.'
        : 'The ' + f.name + ' family have no card saved, so this goes out as an invoice rather than a charge.';
      var done = canCard
        ? 'Sale posted against the ' + f.name + ' family · charged to ' + cardOf(f) +
          ' · receipt emailed to ' + f.email
        : 'Invoice emailed to ' + f.email + ' · nothing charged, the ' + f.name +
          ' family have no card saved';

      return h`
        ${raw(ui.toolbar({
          search: { key: 'saleFam', placeholder: 'Search family, guardian, child…' },
          count: pickerCount('saleFam')
        }))}
        ${raw(ui.grid('sidebar', [form, ui.col([stands, prices, assumed])]))}
        <div class="section">${raw(register)}</div>
        ${raw(ui.formActions([
          { label: label, kind: 'primary', msg: done },
          { label: 'Cancel', to: 'billing' }
        ], { sticky: true, hint: hint }))}
      `;
    }
  });

  /* ---- Adjust a balance ------------------------------------------------------------
     The one form for money going the other way. Who, how much, why — and one
     switch for where it goes. Everything else about an adjustment has a single
     sensible answer, so it is stated rather than asked: the date is today, the
     author is whoever is signed in, the card is the one on file, and a family
     with no card saved is told that credit is the only option rather than
     being offered a switch that cannot work. */

  Grove.on('adjFam', function (d) { Grove.setFilter('adjFam', d.id); });

  var TO_CARD = 'adj-to-card';

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
      var f = pickedFamily('adjFam');
      var canCard = hasCard(f);
      var toCard = canCard && Grove.toggle(TO_CARD, false);

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
        <p class="hint">Search by family, guardian, child or card. Their balance and card are
        shown so you are not adjusting the wrong one.</p>
        <div class="card-split">${raw(familyPicker('adjFam', 'adjFam', f))}</div>
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
              control: ui.input({ placeholder: ADJUSTMENTS[1].reason })
            })
          ]))}
        </div>
        <div class="card-split">${raw(where)}</div>
      `);

      var last = latestInvoice(f);
      var theirs = creditsFor(f.id);
      var held = plansHeld(f);

      var stands = ui.card({ title: 'Where the ' + f.name + ' family stands' }, ui.kv([
        f.balance > 0
          ? { k: 'Owes now', v: Grove.money(f.balance), tone: 'clay' }
          : { k: 'Owes now', v: 'Nothing', tone: 'mute' },
        held.length
          ? ['Plans held', esc(held.map(function (s) {
              var p = planOf(s);
              return s.name.split(' ')[0] + ' ' + p.usedHours + ' of ' + p.hours + 'h';
            }).join(' · '))]
          : { k: 'Plans held', v: 'None — camp and one-off bookings', tone: 'mute' },
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
        ${raw(ui.toolbar({
          search: { key: 'adjFam', placeholder: 'Search family, guardian, child…' },
          count: pickerCount('adjFam')
        }))}
        ${raw(ui.grid('sidebar', [form, ui.col([stands, assumed])]))}
        ${raw(ui.formActions([
          { label: label, kind: 'primary', msg: done },
          { label: 'Cancel', to: 'billing' }
        ], { sticky: true, hint: hint }))}
      `;
    }
  });

  /* ---- Cycles ahead -------------------------------------------------------------
     What used to be "Post the tuition run", and then "Renewals ahead". There
     is no run: a plan's invoice is raised on the last class of the cycle and
     pays for the dates that follow. So this page forecasts whose cycle ends
     next and names the dates the money buys — the sentence the owner used to
     write out by hand.

     There is no pinned bar, and that is the point. Nothing here is waiting on
     her. */

  function cycleRows(list) {
    return list.map(function (s) {
      var f = familyOf(s);
      var p = planOf(s);
      var on = invoiceDate(s);
      var soon = landsNext(s);
      return {
        to: 'studentRecord',
        id: s.id,
        cells: [
          ui.two(s.name, 'Age ' + s.age + ' · ' + hoursText(s)),
          ui.two(f.name + ' family', cardOf(f)),
          h`<div class="stack stack--sm">
            <div>${raw(ui.pill(p.usedHours + ' of ' + p.hours + ' hours', soon ? 'amber' : null))}</div>
            ${raw(ui.meter(p.usedHours, p.hours))}
          </div>`,
          on
            ? ui.two(fmtDate(on) + (soon ? ' · their next class' : ''), 'covers ' + listDates(nextCycle(s)))
            : ui.mute('No class booked'),
          h`<span class="strong">${Grove.money(p.price)}</span>`
        ]
      };
    });
  }

  Grove.screen('renewals', {
    surface: 'console',
    crumbs: [{ label: 'Billing', to: 'billing' }],
    crumbTitle: 'Cycles',
    eyebrow: 'nothing to post',
    title: 'Cycles ahead',
    sub: 'Whose cycle ends next, what their invoice will cover and for how much. A plan is hours a month, spent by the dates the parent picked at registration, and the invoice is raised on the last class of the cycle to pay for the dates that follow.',

    body: function () {
      var list = running().slice().sort(byInvoiceDate);
      var soon = list.filter(landsNext);
      var stop = leaving();
      var onCard = list.filter(function (s) { return familyOf(s).autopay; });
      var byHand = list.length - onCard.length;
      var idle = noPlan();

      var stats = ui.statbar([
        {
          label: 'Lands on the next class',
          value: money0(planValue(soon)),
          sub: count(soon.length, 'invoice', 'invoices') + ' · ' +
            count(planFamilies(soon), 'family', 'families'),
          tone: 'clay'
        },
        {
          label: 'Plans on the books',
          value: String(list.length),
          sub: 'held by ' + count(planFamilies(list), 'family', 'families')
        },
        {
          label: 'A full cycle of tuition',
          value: money0(planValue(list)),
          sub: 'if every plan runs its cycle out',
          tone: 'grove'
        }
      ]);

      /* Two children of one family can both end a cycle in the same week, but
         the debt is the family's and is owed once. Grouped, or the notice
         states the same balance twice and reads as twice the money. */
      var owingSoon = [];
      soon.forEach(function (s) {
        var f = familyOf(s);
        if (!f || f.balance <= 0) return;
        var row = owingSoon.filter(function (x) { return x.f === f; })[0];
        if (!row) { row = { f: f, kids: [] }; owingSoon.push(row); }
        row.kids.push(s.name);
      });

      var warn = owingSoon.length
        ? ui.notice({
            kind: 'warn',
            title: owingSoon.length === 1
              ? 'A cycle ends while that family still owes money'
              : owingSoon.length + ' families still owe money as their cycles end',
            text: listOf(owingSoon.map(function (row) {
              var open = openInvoice(row.f);
              return listOf(row.kids) + ' — the ' + row.f.name + ' family owes ' +
                Grove.money(row.f.balance) +
                (open ? ' (' + open.status.toLowerCase() + ')' : '');
            })) + '. Raising the next invoice charges the card again on top of what is already out; it does not collect it.'
          })
        : '';

      var table = ui.table(
        ['Child', 'Family', 'This cycle', 'Invoice raised on', { label: 'Then charges', align: 'right' }],
        cycleRows(list),
        {
          emptyTitle: 'No plans on the books',
          emptyText: 'Every child here is on camp weeks and one-off bookings, which are paid for as they are booked.'
        }
      );

      var tableNote = 'Each price is that child’s hours priced from Settings → Pricing, and each list of dates is their own classes carried forward a cycle — the invoice says them out loud so nobody has to ask what the money bought. ';
      tableNote += byHand
        ? onCard.length + ' of ' + list.length + ' are on autopay and charged there and then; the other ' +
          byHand + ' are invoiced by hand. '
        : 'Every one of them is on autopay, so the card is charged there and then. ';
      tableNote += count(idle.length, 'child takes', 'children take') +
        ' camp weeks and one-off bookings only, so there is no cycle and nothing is raised for them.';

      var cycles = ui.card({
        title: 'Cycles and what the next invoice covers',
        flush: true,
        note: tableNote,
        foot: foot(count(list.length, 'plan', 'plans') + ' on the books',
                   money0(planValue(list)) + ' a cycle')
      }, table);

      var how = ui.card({
        title: 'How a cycle works',
        note: 'Every line here is read from the studio’s own rules, including the make-up window, which is a setting rather than something these screens decide.'
      }, ui.kv([
        ['A plan is', 'Hours a month · the parent chooses how to split them'],
        ['A cycle is', 'The dates they picked at registration, fixed for the year'],
        ['The invoice is raised', 'On the last class of the cycle'],
        ['It pays for', 'The dates that follow, listed on the invoice'],
        ['Hours not booked', esc(D.RULES.unusedHours)],
        ['Cancel ' + esc(D.RULES.cancelNotice) + ' ahead', esc(D.RULES.makeupWhere)],
        ['Later, or a no-show', esc(D.RULES.lateCancel)],
        /* Labelled so it reads as English whichever window Settings holds. */
        ['The make-up window', esc(D.RULES.makeupWindow + ' · set in Settings')],
        ['Freezing a plan', esc(D.RULES.freeze)],
        ['The plan year ends', esc(D.PLAN_YEAR.ends)],
        ['If a card fails', 'Retried on day 1, day 3 and day 7']
      ]));

      var stopped = ui.card({
        title: 'Leaving before the year ends',
        flush: true,
        note: D.RULES.cancelPlan + ' ' + D.PLAN_YEAR.note
      }, stop.length
        ? ui.rows(stop.map(function (s) {
            var f = familyOf(s);
            return {
              title: esc(s.name),
              sub: esc(f.name + ' family · ' + hoursText(s) + ' · ' + usedText(s)),
              end: ui.pill('Notice given', 'warn'),
              to: 'studentRecord',
              id: s.id
            };
          }))
        : ui.empty('Nobody has given notice',
            'Every plan runs to ' + D.PLAN_YEAR.ends + ' and ends there.'));

      return h`
        ${raw(stats)}
        ${raw(warn)}
        ${raw(ui.grid('sidebar', [cycles, ui.col([how, stopped])]))}
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
        { label: 'Post a sale', to: 'postSale' },
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
        note: 'Cash and cheques taken at the desk are recorded here with a reference and a date paid. A line with no date paid counts against the family balance. The registration fee is ' +
          Grove.money(D.PRICING.as.regFee, { cents: false }) + ' a ' + D.PRICING.as.regFeePer +
          ', and the ' + Math.round(D.PRICING.as.siblingFeeRelief * 100) +
          '% sibling relief comes off that fee rather than off tuition.'
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

      /* A plan belongs to one child, so the next two invoices on this account
         are two different children finishing two different cycles. */
      var held = plansHeld(f).slice().sort(byInvoiceDate);
      var plansNote = 'A plan is hours a month and it belongs to one child, so these are billed separately, each on that child’s own last class of the cycle.';
      if (held.length && invoiceDate(held[0])) plansNote += ' ' + coversLine(held[0]);

      var plans = ui.card({
        title: 'Plans on this account',
        flush: true,
        note: plansNote
      }, held.length
        ? ui.rows(held.map(function (s) {
            var p = planOf(s);
            var on = invoiceDate(s);
            return {
              title: esc(s.name),
              sub: esc(hoursText(s) + ' · ' + usedText(s) +
                (on ? ' · invoice on ' + fmtDate(on) : ' · no class booked')),
              end: ui.pill(Grove.money(p.price, { cents: false }), landsNext(s) ? 'amber' : null),
              to: 'studentRecord',
              id: s.id
            };
          }))
        : ui.empty('No plan on this account', 'Camp weeks and one-off bookings are paid for when they are booked.'));

      var sales = salesFor(f);
      var salesCard = ui.card({
        title: 'Sales posted to this family',
        flush: true,
        note: 'Anything charged outside a plan — an extra class, a private, an event — posted from Post a sale onto the card on file.'
      }, sales.length
        ? ui.rows(sales.map(function (x) {
            return {
              title: esc(x.what) + ' <span class="num strong">' + Grove.money(x.amt) + '</span>',
              sub: esc(x.when + ' · posted by ' + x.by),
              end: ui.pill('Charged', 'ok')
            };
          }))
        : ui.empty('No sales on this account',
            'Extra classes, private lessons and events appear here when they are posted.'));

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
      return ui.grid('sidebar', [ledgerCard, ui.col([totals, plans, salesCard, adjCard])]);
    }
  });
})();
