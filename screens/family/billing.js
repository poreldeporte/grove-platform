/* Family → Billing, and the short form behind the card on file.

   A parent needs two things here: what is about to be charged and when, and
   what has already been charged and why. None of the studio's machinery for
   producing those numbers appears on this screen — there is no ePayment
   schedule, no bulk posting run, no per-family exclusions or overrides. A
   parent does not need to know the studio's billing run exists; they need
   their own figures. All of that lives in Console → Billing.

   Every figure on both screens is derived from this family's ledger in
   js/data.js, so the cards and the table cannot disagree:
     - tuition          = the positive lines of the opening monthly run (820)
     - sibling discount = the credit lines of that same run            (−140)
     - unpaid           = every line still flagged unpaid               (18)
     - next charge      = tuition + discount + unpaid                  (698)
   The Next charge card is what is ahead of you; the Balance card and the
   history table are what is behind you, and no figure now carries both
   meanings at once.

   Simplifications against the previous build:
     - the asymmetric left-one-card / right-two-cards split is a plain
       three-card grid. Next charge, Payment method and Balance are three
       equal answers to three questions, so they sit in ui.grid(3) and end
       level instead of one card stretching to whatever the other column
       happens to add up to
     - the plan card carried two relief lines that both read "−$0.00". A
       discount of nothing is not a line. The one real discount in the
       ledger is shown once, on Next charge
     - payment history was five hand-written rows in no particular order,
       none of which matched the ledger. It is now the family's ledger from
       js/data.js, newest first, so the history and the balance can never
       disagree
     - the receipt page behind each history row is gone. It repeated the row
       it was opened from, and its breakdown did not reconcile — it listed
       the full amount as tuition and then subtracted a relief line beneath
     - the cancellation confirm dialog, its four bullets and its audit-log
       footer are one header button and one sentence. Nothing changes today
       either way, and the studio confirms by email
     - the card form drops the billing-address and autopay groups. Autopay
       only ever has one sensible answer, so it is the default and is stated
       on Billing, and the studio does not hold an address — it keeps four
       digits and a processor token, which the page says plainly. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  /* The portal is signed in as the Johnson family. */
  function fam() { return D.family('johnson'); }

  /* The studio's run posts on the 1st; today is 28 July, so the next one is
     1 August — the same date Console → Billing gives for the next run. */
  var NEXT = '1 Aug 2026';

  /* The ledger opens on the day of the monthly run. Totals are counted from
     there and labelled with that date, rather than implying a lifetime figure. */
  function since() { return D.LEDGER[0].d; }

  /* The monthly tuition run posts on a single date — the opening lines of the
     ledger. Those lines are what recurs, so the Next charge card and the
     history table below it are reading the same numbers. */
  function cycle() {
    var first = since();
    return D.LEDGER.filter(function (l) { return l.d === first; });
  }

  function sum(list) {
    return list.reduce(function (n, l) { return n + l.amt; }, 0);
  }
  function credits(list) {
    return list.filter(function (l) { return l.amt < 0; });
  }
  function charges(list) {
    return list.filter(function (l) { return l.amt > 0; });
  }
  function unpaid() {
    return D.LEDGER.filter(function (l) { return !l.paid; });
  }
  function settled() {
    return D.LEDGER.filter(function (l) { return l.paid; });
  }

  /* The most recent line that actually went to the card. A credit is not a
     charge, so credits are not candidates. */
  function lastCharge() {
    var taken = charges(settled());
    return taken[taken.length - 1];
  }

  /* The children the ledger is for, read from the roster rather than named in
     this file. */
  function kidNames(f) {
    var names = D.STUDENTS.filter(function (s) { return s.family === f.name; })
      .map(function (s) { return s.name.split(' ')[0]; });
    if (!names.length) return 'your children';
    if (names.length === 1) return names[0];
    return names.slice(0, names.length - 1).join(', ') + ' and ' + names[names.length - 1];
  }

  function total(n) {
    return '<span class="strong">' + Grove.money(n) + '</span>';
  }
  function amount(n, tone) {
    return h`<span class="${raw(tone || '')}">${Grove.money(n)}</span>`;
  }

  /* ---- billing --------------------------------------------------------------- */

  Grove.screen('fBilling', {
    surface: 'family',
    crumbTitle: 'Billing',
    eyebrow: 'what you owe, plainly',
    title: 'Billing',
    sub: 'Everything you are committed to, in plain numbers, before it is charged.',
    actions: [
      { label: 'Request cancellation', kind: 'danger', msg: 'Request sent · the studio will confirm by email' },
      { label: 'Message the studio', kind: 'primary', to: 'fMessages' }
    ],

    body: function () {
      var f = fam();
      var run = cycle();
      var tuition = sum(charges(run));   /* the two tuition lines of the run */
      var relief = sum(credits(run));    /* the sibling discount on that run */
      var open = unpaid();
      var owing = sum(open);
      var nextTotal = tuition + relief + owing;
      var applied = sum(credits(D.LEDGER));

      /* Ahead of you: the lines that recur, less the discount, plus anything
         still open — which is exactly what the Balance card says happens to
         it. Every row is in the table below, so the sum can be checked. */
      var nextRows = [
        ['Monthly tuition', Grove.money(tuition)],
        { k: 'Sibling discount', v: Grove.money(relief), tone: 'grove' }
      ];
      if (owing) nextRows.push({ k: 'Unpaid, carried over', v: Grove.money(owing), tone: 'clay' });
      nextRows.push({ k: 'Charged on ' + NEXT, v: total(nextTotal) });

      var next = ui.card({
        title: 'Next charge',
        note: 'Covers ' + f.plan + ' for ' + kidNames(f) + ', on the same lines as ' + since() +
          '. Thirty days notice to cancel.'
      }, ui.kv(nextRows));

      var method = ui.card({
        title: 'Payment method',
        head: ui.btn({ label: 'Update', kind: 'quiet', size: 'sm', to: 'fPaymentMethod' }),
        note: 'The studio never sees your full card number.'
      }, ui.kv([
        ['Card', esc(f.card)],
        ['Autopay', f.autopay ? 'On · taken on the 1st' : 'Off · you pay each charge'],
        ['Receipts go to', esc(f.email)]
      ]));

      /* Behind you: what is still open today, and what has already come off.
         No total from the Next charge card is repeated here. */
      var balance = ui.card({
        title: 'Balance',
        note: 'Anything still open is added to the ' + NEXT + ' charge.'
      }, ui.kv([
        { k: 'Owing now', v: Grove.money(owing), tone: owing > 0 ? 'clay' : 'mute' },
        open.length
          ? ['Open since', esc(open[0].d)]
          : { k: 'Open since', v: 'Nothing is open', tone: 'mute' },
        { k: 'Credits since ' + since(), v: Grove.money(applied), tone: 'grove' }
      ]));

      var table = ui.table(
        ['Date', 'What', { label: 'Amount', align: 'right' }, { label: 'Status', shrink: true }],
        D.LEDGER.slice().reverse().map(function (l) {
          var credit = l.amt < 0;
          return {
            cells: [
              ui.mute(l.d),
              h`<span class="cell-strong">${l.what}</span>`,
              amount(l.amt, credit ? 'grove' : (l.paid ? '' : 'clay strong')),
              credit ? ui.pill('Credit', 'ok') : ui.pill(l.paid ? 'Paid' : 'Unpaid', l.paid ? 'ok' : 'bad')
            ]
          };
        }),
        {
          emptyTitle: 'Nothing charged yet',
          emptyText: 'Your first charge appears here the day it is raised.'
        }
      );

      var history = ui.card({
        title: 'Account history',
        head: ui.btn({ label: 'Download statement', kind: 'quiet', size: 'sm', msg: 'Statement downloaded' }),
        flush: true,
        note: 'Everything raised since ' + since() +
          '. Credits are shown in green and come off what you owe.'
      }, table);

      return h`
        ${raw(ui.grid(3, [next, method, balance]))}
        <div class="section">${raw(history)}</div>
      `;
    }
  });

  /* ---- the card on file ---------------------------------------------------------
     This page used to be one short form above a third of a screen of nothing.
     What is on file, and what that card has actually taken, are facts the
     ledger already holds, so they are stated above the form that replaces
     them. Nothing here is a second version of a number on Billing: the
     figures are settled charges only, so "Taken to date" is the $680 that
     Console → Billing also shows as Paid, and the one line that has not
     settled is named in the note rather than silently counted. */

  Grove.screen('fPaymentMethod', {
    surface: 'family',
    crumbs: [{ label: 'Billing', to: 'fBilling' }],
    crumbTitle: 'Payment method',
    eyebrow: 'how you pay',
    title: 'Payment method',
    sub: 'Card details are never stored by the studio — only the last four digits and a processor token.',
    actions: [
      { label: 'Message the studio', to: 'fMessages' }
    ],

    body: function () {
      var f = fam();
      var paid = settled();
      var gross = sum(charges(paid));
      var applied = sum(credits(paid));
      var taken = gross + applied;
      var open = unpaid();
      var owing = sum(open);
      var last = lastCharge();
      var openNote;

      if (!open.length) {
        openNote = 'Nothing is outstanding on this card.';
      } else if (open.length === 1) {
        openNote = Grove.money(owing) + ' from ' + open[0].d + ' (' + open[0].what +
          ') is still open, and joins the ' + NEXT + ' charge.';
      } else {
        openNote = Grove.money(owing) + ' across ' + open.length +
          ' lines is still open, and joins the ' + NEXT + ' charge.';
      }

      var onFile = ui.card({
        title: 'On file now',
        note: 'Receipts are emailed the moment a charge goes through.'
      }, ui.kv([
        ['Card', esc(f.card)],
        ['Autopay', f.autopay ? 'On · taken on the 1st' : 'Off · you pay each charge'],
        ['Receipts go to', esc(f.email)],
        last
          ? ['Last charge taken', esc(last.d) + ' · ' + Grove.money(last.amt)]
          : { k: 'Last charge taken', v: 'Nothing yet', tone: 'mute' }
      ]));

      var record = ui.card({
        title: 'What this card has taken',
        note: openNote
      }, ui.kv([
        ['Charges settled since ' + since(), Grove.money(gross)],
        { k: 'Credits applied', v: Grove.money(applied), tone: 'grove' },
        { k: 'Taken to date', v: total(taken) }
      ]));

      var card = ui.card({
        title: 'New card',
        note: 'Saving replaces ' + f.card + '. Autopay carries over, and nothing is charged today.'
      }, ui.fields(2, [
        ui.field({ label: 'Card number', span: true, control: ui.input({ placeholder: '16 digits, no spaces' }) }),
        ui.field({ label: 'Expiry', control: ui.input({ placeholder: 'MM / YY' }) }),
        ui.field({ label: 'Security code', control: ui.input({ placeholder: 'CVC' }) }),
        ui.field({ label: 'Name on card', span: true, control: ui.input({ placeholder: 'As printed on the card' }) })
      ]));

      return h`
        ${raw(ui.grid(2, [onFile, record]))}
        <div class="section">${raw(card)}</div>
        ${raw(ui.formActions([
          { label: 'Save card', kind: 'primary', msg: 'Card saved · autopay is on' },
          { label: 'Cancel', to: 'fBilling' }
        ]))}
      `;
    }
  });
})();
