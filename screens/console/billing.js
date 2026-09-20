/* Console → Billing (the studio ledger) and the family ledger behind it.

   Every number on this screen is worked out from the rows printed underneath
   it. Outstanding is the sum of what is genuinely chaseable — every unpaid
   invoice, plus any desk charge sitting unpaid on a family ledger that no
   invoice has picked up yet — and comes to the same total, across the same
   families, as the balances held on those family records in js/data.js. A
   desk charge an invoice has since picked up is left to its invoice, or the
   same money would be chased twice on one table. Collected is the sum of the
   settled invoices; Failed is the sum of the cards worth retrying. Nothing
   here is typed in by hand.
   (Console → Dashboard still carries $1,840 outstanding and $28,360 revenue as
   literals. The same treatment is owed there, in that file.)

   Simplifications against the previous build:
     - the old "Failed payments" and "Receipts" tabs are gone. Failed and
       past-due money is now one "Needs attention" tab, and Receipts is
       dropped outright: a paid invoice is already sitting on the Invoices
       tab, so a second table of the same eight rows was a filter wearing a
       tab's clothes.
     - both invoice tabs draw the same table, the same six columns and the
       same card framing — a title, a note and the reason line under each
       invoice number — so switching tabs filters the rows and moves nothing
       else sideways.
     - the stat band keeps its three-up shape on every tab, so the table never
       shifts down the page. On Credits the three figures are about credits,
       which is what the table underneath them holds.
     - the header actions no longer swap per tab. Three actions stay put;
       "Message all" and "Retry failed cards" moved into the head of the card
       they act on.
     - the ledger's four header buttons are three, and its decorative search,
       its Statement tab and its Registration form tab are gone. The statement
       was the same lines re-sorted.
     - the ledger drops the spec's Category column: js/data.js records no
       category, and guessing one would be inventing data. Each line is
       labelled a charge or an adjustment, which the amount already tells us.

   The credits register is the one thing with no entry in js/data.js. Its five
   records are the content spec's, each family name is read back out of
   Grove.data, and each amount is one the studio's own pricing produces: a
   cancelled camp day ($100), an extra class at the twelve-session rate ($65),
   a four-session plan refunded before term (−$280) and Brennan's July invoice
   refunded in full (−$540). Two spec strings were corrected where they fought
   the data: the Martinez credit was described as a sibling adjustment for a
   family that has one child, and the Johnson credit said "applied to July"
   without naming the invoice it came off, which made it look lost. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  var TAB_KEY = 'billing';
  var T_INVOICES = 'Invoices';
  var T_ATTENTION = 'Needs attention';
  var T_CREDITS = 'Credits';

  /* js/data.js carries one worked-through family ledger, the Johnson family's. */
  var LEDGER_FAMILY = 'johnson';

  var INVOICE_COLS = [
    'Invoice',
    'Family',
    'Raised',
    'Due',
    { label: 'Amount', align: 'right' },
    { label: 'Status', shrink: true }
  ];

  var CREDIT_COLS = [
    'Family',
    'Reason',
    'Date',
    { label: 'Amount', align: 'right' },
    { label: 'Status', shrink: true },
    'Issued by'
  ];

  /* Money owed back to a family. A refund is negative — it leaves the studio —
     and an account credit is positive until it is spent against an invoice. */
  var CREDITS = [
    { fam: 'johnson',  type: 'Account credit', reason: 'Overpaid June tuition',        date: '12 Jun 2026', amt: 45,   status: 'Applied to INV-2838', kind: 'ok',   by: 'Dani Cruz' },
    { fam: 'chen',     type: 'Account credit', reason: 'Camp day cancelled by studio', date: '8 Jul 2026',  amt: 100,  status: 'Available',           kind: 'ok',   by: 'Sabrina Yanguas' },
    { fam: 'brennan',  type: 'Refund',         reason: 'Duplicate charge',             date: '3 Jul 2026',  amt: -540, status: 'Refunded to Amex',    kind: null,   by: 'Sabrina Yanguas' },
    { fam: 'martinez', type: 'Account credit', reason: 'Extra class charged twice',    date: '28 Jun 2026', amt: 65,   status: 'Available',           kind: 'ok',   by: 'Dani Cruz' },
    { fam: 'smith',    type: 'Refund request', reason: 'Withdrew before term start',   date: '26 Jul 2026', amt: -280, status: 'Pending approval',    kind: 'warn', by: 'Rey Molina' }
  ];

  /* ---- helpers ------------------------------------------------------------ */

  function unpaid(inv) { return inv.status !== 'Paid'; }

  function total(list) {
    return list.reduce(function (n, r) { return n + r.amt; }, 0);
  }

  function familyCount(list) {
    var seen = {}, n = 0;
    list.forEach(function (r) { if (!seen[r.fam]) { seen[r.fam] = true; n += 1; } });
    return n;
  }

  function plural(n, word) { return n + ' ' + word + (n === 1 ? '' : 's'); }

  function famIdFor(name) {
    var f = D.FAMILIES.filter(function (x) { return x.name === name; })[0];
    return f ? f.id : undefined;
  }

  function amount(n, tone) {
    return h`<span class="${raw(tone || '')}">${Grove.money(n)}</span>`;
  }

  /* One row shape for both invoice tabs, so the two tables are identical. */
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

  function invoiceItems() { return D.INVOICES.map(asItem); }

  function paidInvoices() { return D.INVOICES.filter(function (i) { return !unpaid(i); }); }

  /* Failed and past due: the cards that can actually be retried. */
  function failing() { return D.INVOICES.filter(function (i) { return i.kind === 'bad'; }); }

  /* A desk charge is chaseable in its own right only while no invoice has
     picked it up. Once one is raised on that family, on the day of the charge,
     for the amount of the charge, the invoice is the row to chase — counting
     the ledger line as well would put the same money on this table twice. */
  function unbilled(line, fam) {
    return !D.INVOICES.filter(function (i) {
      return i.fam === fam.name && i.date === line.d && i.amt === line.amt;
    }).length;
  }

  /* Everything the studio is still owed: unpaid invoices, plus any charge
     already posted to a family ledger that no invoice has picked up yet. The
     two together are exactly the balances carried on the family records. */
  function attention() {
    var items = D.INVOICES.filter(unpaid).map(asItem);
    var f = D.family(LEDGER_FAMILY);
    D.LEDGER.filter(function (l) { return !l.paid && unbilled(l, f); }).forEach(function (l) {
      items.push({
        ref: 'Not invoiced',
        note: l.what,
        fam: f.name,
        famId: f.id,
        method: String(f.card).split(' · ')[0],
        date: l.d,
        due: 'Next invoice',
        amt: l.amt,
        status: 'Unbilled',
        kind: 'warn',
        owing: true,
        desk: true
      });
    });
    return items;
  }

  /* Families the monthly run can post to. The rest are held back by hand. */
  function postable() {
    return D.FAMILIES.filter(function (f) {
      return f.status !== 'Cancelling' && f.status !== 'Pending payment';
    });
  }

  function currentTab() { return Grove.tab(TAB_KEY, T_INVOICES); }

  function billingTabs() {
    return {
      key: TAB_KEY,
      items: [
        { label: T_INVOICES, count: D.INVOICES.length },
        { label: T_ATTENTION, count: attention().length },
        { label: T_CREDITS, count: CREDITS.length }
      ]
    };
  }

  /* Three stats on every tab, each one the sum of rows shown on this screen. */
  function stats(tab) {
    if (tab === T_CREDITS) return creditStats();

    var owed = attention(), paid = paidInvoices(), bad = failing();
    return ui.statbar([
      {
        label: 'Outstanding',
        value: Grove.money(total(owed), { cents: false }),
        sub: familyCount(owed) + ' families',
        tone: 'clay'
      },
      {
        label: 'Collected in July',
        value: Grove.money(total(paid), { cents: false }),
        sub: paid.length + ' of ' + D.INVOICES.length + ' invoices paid',
        tone: 'grove'
      },
      {
        label: 'Failed or past due',
        value: Grove.money(total(bad), { cents: false }),
        sub: plural(bad.length, 'card') + ' to retry',
        tone: 'clay'
      }
    ]);
  }

  function creditStats() {
    var unspent = CREDITS.filter(function (c) { return c.amt > 0 && c.status === 'Available'; });
    var refunded = CREDITS.filter(function (c) { return c.amt < 0 && c.kind !== 'warn'; });
    var pending = CREDITS.filter(function (c) { return c.kind === 'warn'; });

    return ui.statbar([
      {
        label: 'Unspent credit',
        value: Grove.money(total(unspent), { cents: false }),
        sub: unspent.length + ' of ' + plural(CREDITS.filter(function (c) { return c.amt > 0; }).length, 'credit') + ' issued',
        tone: 'grove'
      },
      {
        label: 'Refunded',
        value: Grove.money(Math.abs(total(refunded)), { cents: false }),
        sub: plural(refunded.length, 'refund') + ' paid back to a card'
      },
      {
        label: 'Awaiting approval',
        value: Grove.money(Math.abs(total(pending)), { cents: false }),
        sub: plural(pending.length, 'refund request'),
        tone: 'clay'
      }
    ]);
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

  /* ---- billing ------------------------------------------------------------- */

  Grove.screen('billing', {
    surface: 'console',
    eyebrow: 'the studio ledger',
    title: 'Billing',
    sub: function () {
      var tab = currentTab();
      if (tab === T_ATTENTION) return 'Everything the studio is still owed: cards that failed, invoices past their date, and any charge taken at the desk that no invoice has picked up yet.';
      if (tab === T_CREDITS) return 'Credits and refunds owed back to a family. Distinct from make-up credits, which are counted in classes and never convert to cash.';
      return 'Every charge the studio has raised. Money moves are always recorded against a family, never against a child.';
    },
    actions: function () {
      var post = postable().length;
      return [
        { label: 'Statements', msg: 'Statements emailed to ' + D.FAMILIES.length + ' families' },
        { label: 'Post tuition fees', msg: post + ' invoices posted · ' + (D.FAMILIES.length - post) + ' skipped for review' },
        { label: 'Take a payment', kind: 'primary', msg: 'Payment taken · receipt emailed' }
      ];
    },

    body: function () {
      var tab = currentTab();
      if (tab === T_ATTENTION) return attentionTab();
      if (tab === T_CREDITS) return creditsTab();
      return invoicesTab();
    }
  });

  function invoicesTab() {
    var all = invoiceItems();
    var q = Grove.query('invoices');
    var list = all.filter(function (it) { return matches(q, it); });

    var table = ui.table(INVOICE_COLS, itemRows(list), {
      emptyTitle: 'No invoices match',
      emptyText: 'Clear the search and the whole run comes back.'
    });

    return ui.toolbar({
      tabs: billingTabs(),
      search: { key: 'invoices', placeholder: 'Search invoice, family, card…' },
      count: list.length + ' of ' + all.length + ' invoices'
    }) + stats(T_INVOICES) + ui.card({
      title: 'Invoices raised',
      flush: true,
      note: 'The monthly run posted on 1 July. Anything raised since is a desk charge, dated the day it was taken.'
    }, table);
  }

  function attentionTab() {
    var owed = attention();
    var bad = failing();
    var desk = owed.filter(function (it) { return it.desk; });
    var q = Grove.query('attention');
    var list = owed.filter(function (it) { return matches(q, it); });

    var table = ui.table(INVOICE_COLS, itemRows(list), {
      emptyTitle: 'Nothing outstanding',
      emptyText: 'Every invoice is settled. The next automatic run is 1 August.'
    });

    var head = ui.btns([
      { label: 'Message all', kind: 'quiet', size: 'sm', msg: 'Recovery email queued to ' + familyCount(owed) + ' families' },
      { label: 'Retry failed cards', kind: 'quiet', size: 'sm', msg: plural(bad.length, 'card') + ' retried · results land within the hour' }
    ]);

    var note = 'Retry cadence is day 1, day 3, day 7. After the third failure the enrolment is flagged but never silently cancelled — a person decides.';
    if (desk.length) {
      note += ' A line marked unbilled is a desk charge already on the family ledger; it joins their next invoice.';
    }

    return ui.toolbar({
      tabs: billingTabs(),
      search: { key: 'attention', placeholder: 'Search invoice, family, card…' },
      count: list.length + ' of ' + owed.length + ' outstanding'
    }) + stats(T_ATTENTION) + ui.card({
      title: desk.length ? 'Failed, past due and unbilled' : 'Failed and past due',
      head: head,
      flush: true,
      note: note
    }, table);
  }

  function creditsTab() {
    var q = Grove.query('credits');
    var list = CREDITS.filter(function (c) {
      return Grove.match(q, D.family(c.fam).name, c.type, c.reason, c.status, c.by);
    });

    var table = ui.table(CREDIT_COLS, list.map(function (c) {
      var f = D.family(c.fam);
      return {
        to: 'familyRecord',
        id: f.id,
        cells: [
          ui.two(f.name + ' family', c.type),
          esc(c.reason),
          ui.mute(c.date),
          amount(c.amt, c.amt < 0 ? 'clay strong' : 'grove'),
          ui.pill(c.status, c.kind),
          ui.mute(c.by)
        ]
      };
    }), {
      emptyTitle: 'No credits match',
      emptyText: 'Clear the search to see the whole register.'
    });

    return ui.toolbar({
      tabs: billingTabs(),
      search: { key: 'credits', placeholder: 'Search family…' },
      count: list.length + ' of ' + CREDITS.length + ' records'
    }) + stats(T_CREDITS) + ui.card({
      title: 'Credits and refunds',
      head: ui.btn({ label: 'Issue account credit', kind: 'quiet', size: 'sm', msg: 'Credit issued · applied to their next invoice' }),
      flush: true,
      note: 'Every credit and refund names a reason, an author and a date. A credit is applied against an invoice rather than posted as a ledger line, and a refund still waiting on approval is not netted off what the family owes.'
    }, table);
  }

  /* ---- the family ledger ---------------------------------------------------- */

  function ledgerFamily() { return D.family(LEDGER_FAMILY); }

  Grove.screen('ledger', {
    surface: 'console',
    crumbs: [{ label: 'Billing', to: 'billing' }],
    crumbTitle: ledgerFamily().name + ' family',
    eyebrow: 'every line, in order',
    title: function () { return ledgerFamily().name + ' family'; },
    sub: 'Charges and payments against this family, newest first. A charge is never edited once posted — corrections are posted as adjustments, so both lines stay on the record.',
    actions: function () {
      return [
        { label: 'Record a payment', msg: 'Payment recorded' },
        { label: 'Statement', msg: 'Statement emailed to ' + ledgerFamily().email },
        { label: 'Post an adjustment', kind: 'primary', msg: 'Adjustment posted' }
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

      var totalsNote = 'A statement is generated, never stored. It always reflects the ledger as it stands right now.';
      if (owing > 0) {
        totalsNote += ' The ' + Grove.money(owing) + ' outstanding is the same line the studio chases on Billing → Needs attention.';
      }

      var totals = ui.card({
        title: 'Totals',
        note: totalsNote
      }, ui.kv([
        ['Charged', Grove.money(charged)],
        { k: 'Adjusted', v: Grove.money(adjusted), tone: 'grove' },
        { k: 'Paid', v: Grove.money(settled), tone: 'grove' },
        { k: 'Outstanding', v: Grove.money(owing), tone: owing > 0 ? 'clay' : 'mute' }
      ]));

      var theirs = CREDITS.filter(function (c) { return c.fam === LEDGER_FAMILY; });
      var creditsCard = ui.card({
        title: 'Account credits',
        flush: true,
        note: 'A credit is applied against an invoice rather than posted here as a ledger line, so it changes what the family was charged, not what is listed above.'
      }, theirs.length
        ? ui.rows(theirs.map(function (c) {
            return {
              title: esc(c.reason) + ' <span class="num ' + (c.amt < 0 ? 'clay' : 'grove') + '">' + Grove.money(c.amt) + '</span>',
              sub: esc(c.date) + ' · issued by ' + esc(c.by),
              end: ui.pill(c.status, c.kind)
            };
          }))
        : ui.empty('No credits on this account', 'Overpayments and studio cancellations appear here.'));

      return ui.grid('sidebar', [ledgerCard, ui.col([totals, creditsCard])]);
    }
  });
})();
