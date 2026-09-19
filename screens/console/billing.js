/* Console → Billing (the studio ledger) and the family ledger behind it.

   Simplifications against the previous build:
     - the old "Failed payments" and "Receipts" tabs are gone. Failed and
       past-due invoices are now one "Needs attention" tab, and Receipts is
       dropped outright: a paid invoice is already sitting on the Invoices
       tab, so a second table of the same eight rows was a filter wearing a
       tab's clothes.
     - the stats band no longer changes between tabs. One slim statbar reads
       the same on all three, so the table never shifts down the page when
       you switch view.
     - the header actions no longer swap per tab either. Three actions stay
       put; "Message all" and "Retry all now" moved into the head of the card
       they act on.
     - the ledger's four header buttons are three, and its decorative search,
       its Statement tab and its Registration form tab are gone. The
       statement was the same lines re-sorted, and the totals card now
       carries the only thing it added.
     - the ledger drops the spec's Category column: js/data.js records no
       category, and guessing one would be inventing data. Each line is
       labelled a charge or an adjustment, which the amount already tells us.

   The credits register is the one thing with no entry in js/data.js. Its
   five records are the content spec's, and each family's name is read back
   out of Grove.data so it cannot drift from the rest of the prototype. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  var TAB_KEY = 'billing';
  var T_INVOICES = 'Invoices';
  var T_ATTENTION = 'Needs attention';
  var T_CREDITS = 'Credits';

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

  var CREDITS = [
    { fam: 'johnson',  type: 'Account credit', reason: 'Overpaid June tuition',         date: '12 Jun 2026', amt: 45,   status: 'Applied to July',  kind: 'ok',   by: 'Dani Cruz' },
    { fam: 'chen',     type: 'Account credit', reason: 'Camp day cancelled by studio',  date: '8 Jul 2026',  amt: 100,  status: 'Available',        kind: 'ok',   by: 'Sabrina Yanguas' },
    { fam: 'brennan',  type: 'Refund',         reason: 'Duplicate charge',              date: '3 Jul 2026',  amt: -540, status: 'Refunded to Amex', kind: null,   by: 'Sabrina Yanguas' },
    { fam: 'martinez', type: 'Account credit', reason: 'Sibling initiation adjustment', date: '28 Jun 2026', amt: 65,   status: 'Available',        kind: 'ok',   by: 'Dani Cruz' },
    { fam: 'smith',    type: 'Refund request', reason: 'Withdrew before term start',    date: '26 Jul 2026', amt: 280,  status: 'Pending approval', kind: 'warn', by: 'Rey Molina' }
  ];

  /* ---- helpers ------------------------------------------------------------ */

  function unpaid(inv) { return inv.status !== 'Paid'; }

  function attention() { return D.INVOICES.filter(unpaid); }

  function famIdFor(name) {
    var f = D.FAMILIES.filter(function (x) { return x.name === name; })[0];
    return f ? f.id : undefined;
  }

  function amount(n, tone) {
    return h`<span class="${raw(tone || '')}">${Grove.money(n)}</span>`;
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

  /* One statbar, identical on every tab. The at-risk figure is the sum of the
     invoices actually on the Needs attention tab, so the two always agree. */
  function stats() {
    var needs = attention();
    var atRisk = needs.reduce(function (n, inv) { return n + inv.amt; }, 0);
    return ui.statbar([
      { label: 'Outstanding',          value: '$1,840',  sub: '6 families',   tone: 'clay' },
      { label: 'Collected this month', value: '$28,360', sub: '+12% vs June', tone: 'grove' },
      { label: 'Failed',               value: String(needs.length), sub: Grove.money(atRisk, { cents: false }) + ' at risk', tone: 'clay' }
    ]);
  }

  function invoiceRows(list, withNote) {
    return list.map(function (inv) {
      var owing = unpaid(inv);
      return {
        to: 'familyRecord',
        id: famIdFor(inv.fam),
        cells: [
          withNote && inv.note
            ? ui.two(inv.id, inv.note)
            : h`<span class="cell-strong">${inv.id}</span>`,
          ui.two(inv.fam + ' family', inv.method),
          ui.mute(inv.date),
          ui.mute(inv.due),
          amount(inv.amt, owing ? 'clay strong' : ''),
          ui.pill(inv.status, inv.kind)
        ]
      };
    });
  }

  /* ---- billing ------------------------------------------------------------- */

  Grove.screen('billing', {
    surface: 'console',
    eyebrow: 'the studio ledger',
    title: 'Billing',
    sub: function () {
      var tab = currentTab();
      if (tab === T_ATTENTION) return 'Payments that failed or are outstanding, and what has been tried so far.';
      if (tab === T_CREDITS) return 'Credits and refunds owed back to a family. Distinct from make-up credits, which are counted in classes and never convert to cash.';
      return 'Every charge the studio has raised. Money moves are always recorded against a family, never against a child.';
    },
    actions: function () {
      return [
        { label: 'Statements', msg: 'Statements generated for 130 families' },
        { label: 'Post tuition fees', msg: '62 invoices posted · 2 skipped for review' },
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
    var q = Grove.query('invoices');
    var list = D.INVOICES.filter(function (inv) {
      return Grove.match(q, inv.id, inv.fam, inv.method, inv.status);
    });

    var table = ui.table(INVOICE_COLS, invoiceRows(list, false), {
      emptyTitle: 'No invoices match',
      emptyText: 'Clear the search and the whole run comes back.'
    });

    return ui.toolbar({
      tabs: billingTabs(),
      search: { key: 'invoices', placeholder: 'Search invoice, family, card…' },
      count: list.length + ' of ' + D.INVOICES.length + ' invoices'
    }) + stats() + ui.card({ flush: true }, table);
  }

  function attentionTab() {
    var needs = attention();
    var q = Grove.query('attention');
    var list = needs.filter(function (inv) {
      return Grove.match(q, inv.id, inv.fam, inv.method, inv.status, inv.note);
    });

    var table = ui.table(INVOICE_COLS, invoiceRows(list, true), {
      emptyTitle: 'Nothing outstanding',
      emptyText: 'Every invoice is settled. The next automatic run is 1 August.'
    });

    var head = ui.btns([
      { label: 'Message all', kind: 'quiet', size: 'sm', msg: 'Recovery email queued to ' + needs.length + ' families' },
      { label: 'Retry all now', kind: 'quiet', size: 'sm', msg: needs.length + ' payments retried · 1 succeeded' }
    ]);

    return ui.toolbar({
      tabs: billingTabs(),
      search: { key: 'attention', placeholder: 'Search invoice, family, card…' },
      count: list.length + ' of ' + needs.length + ' invoices'
    }) + stats() + ui.card({
      title: 'Failed and past due',
      head: head,
      flush: true,
      note: 'Retry cadence: day 1, day 3, day 7. After the third failure the enrolment is flagged but never silently cancelled — a person decides.'
    }, table);
  }

  function creditsTab() {
    var q = Grove.query('credits');
    var list = CREDITS.filter(function (c) {
      return Grove.match(q, D.family(c.fam).name, c.type, c.reason, c.status, c.by);
    });

    var table = ui.table(CREDIT_COLS, list.map(function (c) {
      var f = D.family(c.fam);
      var tone = c.amt < 0 ? 'clay strong' : (c.kind === 'warn' ? '' : 'grove');
      return {
        to: 'familyRecord',
        id: f.id,
        cells: [
          ui.two(f.name + ' family', c.type),
          esc(c.reason),
          ui.mute(c.date),
          amount(c.amt, tone),
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
    }) + stats() + ui.card({
      title: 'Credits and refunds',
      head: ui.btn({ label: 'Issue account credit', kind: 'quiet', size: 'sm', msg: 'Credit issued · applied to their next invoice' }),
      flush: true,
      note: 'Every credit and refund names a reason, an author and a timestamp on the family statement.'
    }, table);
  }

  /* ---- the family ledger ---------------------------------------------------- */

  function johnson() { return D.family('johnson'); }

  Grove.screen('ledger', {
    surface: 'console',
    crumbs: [{ label: 'Billing', to: 'billing' }],
    crumbTitle: 'Johnson family',
    eyebrow: 'every line, in order',
    title: 'Johnson family',
    sub: 'Charges and payments against this family, newest first. A charge is never edited once posted — corrections are posted as adjustments, so both lines stay on the record.',
    actions: function () {
      return [
        { label: 'Record a payment', msg: 'Payment recorded' },
        { label: 'Statement', msg: 'Statement emailed to ' + johnson().email },
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

      var totals = ui.card({
        title: 'Totals',
        note: 'A statement is generated, never stored. It always reflects the ledger as it stands right now.'
      }, ui.kv([
        ['Charged', Grove.money(charged)],
        { k: 'Adjusted', v: Grove.money(adjusted), tone: 'grove' },
        { k: 'Paid', v: Grove.money(settled), tone: 'grove' },
        { k: 'Outstanding', v: Grove.money(owing), tone: owing > 0 ? 'clay' : 'mute' }
      ]));

      return ui.grid('sidebar', [ledgerCard, totals]);
    }
  });
})();
