/* Family → Billing, and the card on file.

   Written for the parent this portal is actually for: someone in their sixties
   doing the school run, wary of getting money wrong online, who will ring the
   studio rather than hunt for a control. Money is where that wariness is
   sharpest, so the page answers three questions in order and stops:
   how much, when, and off which card. Everything else is history.

   Every figure is still derived from this family's ledger in js/data.js, so
   the headline, the breakdown and the history cannot disagree:
     - classes         = the positive lines of the opening monthly run (820)
     - sibling discount = the negative lines of that same run          (−140)
     - not yet paid    = every line still flagged unpaid                (18)
     - next payment    = classes + discount + not yet paid             (698)

   What changed in this pass:
     - the page opens with one sentence — "Your next payment is $698.00, on
       1 Aug 2026" — above the fold, before any breakdown. That is the thing
       a parent came for
     - the Balance card is gone. "Owing now" is the $18 line inside the next
       payment and a row in the history, so it was the same fact told three
       times, and "Credits since 1 Jul 2026 · −$168.00" was the studio's
       running tally, not anything a parent can act on
     - the four-column history table (Date / What / Amount / Status) is one
       sentence per line: what it was, where it stands, how much. A pill
       reading "Credit" told a parent nothing; "Sibling discount — Lucas ·
       You were not charged this" tells them everything
     - negative amounts are never shown in the colour of money owed. Green is
       money off or money back, red is the one charge still to pay, and the
       card note says so in words in case the colour is missed
     - "Update" was a quiet link in a card header. It is now a labelled
       button, and the page says plainly that the studio never sees the whole
       card number
     - the card page drops "What this card has taken" ($848 settled, −$168
       credits, $680 to date). That is the studio's bookkeeping, it repeats
       the history on Billing, and none of it is needed to type in a new card
     - both pages end in an invitation to ring a person. Changing a card is
       exactly where a wary parent gives up, and the studio already offers to
       take it over the phone (Messages, the Delgado thread)

   Jargon removed: credit, autopay, ePayment, posting, status, balance,
   processor token, "charges settled", "carried over", "applied".

   The desk number matches the one on Schedule → Book a make-up, so a parent
   is never given two numbers for the same studio. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  /* The portal is signed in as the Johnson family. */
  function fam() { return D.family('johnson'); }

  /* The studio's run posts on the 1st; today is 28 July, so the next one is
     1 August — the same date Console → Billing gives for the next run. */
  var NEXT = '1 Aug 2026';
  var DESK = D.STUDIO.phone;

  /* The ledger opens on the day of the monthly run. Totals are counted from
     there and labelled with that date, rather than implying a lifetime figure. */
  function since() { return D.LEDGER[0].d; }

  /* The monthly run posts on a single date — the opening lines of the ledger.
     Those lines are what recurs, so the breakdown and the history below it
     are reading the same numbers. */
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

  /* The most recent line that actually went to the card. Money coming off is
     not a payment taken, so those lines are not candidates. */
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

  /* 'Visa ···1183 · exp 04/29' → 'Visa ···1183', for use inside a sentence. */
  function cardName(f) {
    return String(f.card).split(' · ')[0];
  }
  /* '1 Jul 2026' → '1 Jul'. Every line is this year and the card says so. */
  function shortDate(d) {
    var p = String(d).split(' ');
    return p[0] + ' ' + p[1];
  }
  function howTaken(f) {
    return f.autopay
      ? 'Automatically, on the 1st'
      : 'By you, each time — we email you when it is due';
  }

  function total(n) {
    return '<span class="strong">' + Grove.money(n) + '</span>';
  }
  function amount(n, tone) {
    return h`<span class="${raw(tone || '')}">${Grove.money(n)}</span>`;
  }

  /* The ledger is written in the studio's words. A parent is charged for
     classes, not for tuition, and nothing on their side of the product is
     called a credit. */
  function inPlainWords(what) {
    return String(what)
      .replace('tuition', 'classes')
      .replace('Make-up credit applied', 'Money back for a missed class');
  }
  /* One line saying where each row stands. A line that is money off or money
     back says so in words, so the green is never carrying that meaning on its
     own — the title says which of the two it is. */
  function standing(l) {
    if (l.amt < 0) return 'You were not charged this';
    if (!l.paid) return 'Not paid yet — it joins your ' + NEXT + ' payment';
    return 'Paid';
  }
  function tone(l) {
    if (l.amt < 0) return 'grove strong';
    return l.paid ? 'strong' : 'clay strong';
  }

  /* ---- billing --------------------------------------------------------------- */

  Grove.screen('fBilling', {
    surface: 'family',
    crumbTitle: 'Billing',
    eyebrow: 'what you pay, and when',
    title: 'Billing',
    sub: 'Your next payment, what it is for, and everything you have paid so far.',
    actions: [
      { label: 'Request cancellation', kind: 'danger', msg: 'Request sent · the studio will confirm by email' },
      { label: 'Message the studio', kind: 'primary', to: 'fMessages' }
    ],

    body: function () {
      var f = fam();
      var run = cycle();
      var tuition = sum(charges(run));   /* the two class lines of the run */
      var relief = sum(credits(run));    /* the sibling discount on that run */
      var open = unpaid();
      var owing = sum(open);
      var nextTotal = tuition + relief + owing;

      /* The answer, in one sentence, before anything has to be scrolled or
         added up. Everything under it is the working. */
      var headline = ui.notice({
        title: 'Your next payment is ' + Grove.money(nextTotal) + ', on ' + NEXT,
        text: f.autopay
          ? 'It will be taken from your ' + cardName(f) +
            ' on the day. There is nothing you need to do.'
          : 'You will need to pay it yourself. We will email you when it is due.'
      });

      var covers = [
        ['Classes for ' + kidNames(f), Grove.money(tuition)],
        { k: 'Sibling discount', v: Grove.money(relief), tone: 'grove' }
      ];
      if (owing) {
        covers.push({
          k: open.length === 1
            ? inPlainWords(open[0].what) + ', not yet paid'
            : open.length + ' earlier charges, not yet paid',
          v: Grove.money(owing),
          tone: 'clay'
        });
      }
      covers.push({ k: 'Taken on ' + NEXT, v: total(nextTotal) });

      var what = ui.card({
        title: 'What that payment is for',
        note: kidNames(f) + ' have ' + f.plan + ' between them. If you ever want to stop, ' +
          'we ask for thirty days notice.'
      }, ui.kv(covers));

      /* Changing a card was a quiet link the size of a footnote. It is the one
         thing a parent comes to this page to change, so it is a labelled
         button, and the reassurance sits directly under the card number. */
      var how = ui.card({
        title: 'How you pay',
        head: ui.btn({ label: 'Change the card', kind: 'primary', size: 'sm', to: 'fPaymentMethod' }),
        note: 'The studio never sees your full card number — only the last four digits, ' +
          'so we can tell your cards apart.'
      }, ui.kv([
        ['Your card', esc(f.card)],
        ['Payments are taken', howTaken(f)],
        ['Receipts go to', esc(f.email)]
      ]));

      /* One line per charge, in a sentence, newest first. The old version was
         a Date / What / Amount / Status table whose pills read "Credit",
         "Paid" and "Unpaid" — three words that all mean something different
         to the studio than they do to a parent. */
      var lines = D.LEDGER.slice().reverse().map(function (l) {
        return {
          lead: esc(shortDate(l.d)),
          title: esc(inPlainWords(l.what)),
          sub: esc(standing(l)),
          end: amount(l.amt, tone(l))
        };
      });

      var history = ui.card({
        title: 'Everything so far',
        head: ui.btn({ label: 'Download statement', kind: 'quiet', size: 'sm', msg: 'Statement downloaded' }),
        flush: true,
        note: 'Every charge since ' + since() + ', newest first. A figure in green is money ' +
          'off or money back — you were not charged it.'
      }, lines.length
        ? ui.rows(lines)
        : ui.empty('Nothing charged yet', 'Your first payment appears here the day it is raised.'));

      /* Money is where somebody who is unsure stops and rings instead. Saying
         that ringing is fine, on the page, is cheaper than the call being a
         complaint. */
      var help = ui.card({
        title: 'If something does not look right',
        foot: '<span class="hint">Or ring the desk on ' + esc(DESK) + '</span>' +
          ui.btn({ label: 'Message the studio', to: 'fMessages' })
      }, h`<p class="hint">Tell us before you worry about it. We will go through the
        charge with you, and if it is wrong we will put it right — you do not have to
        work out which line is which.</p>`);

      return h`
        ${raw(headline)}
        <div class="section">${raw(ui.grid(2, [what, how]))}</div>
        <div class="section">${raw(history)}</div>
        <div class="section">${raw(help)}</div>
      `;
    }
  });

  /* ---- the card on file ---------------------------------------------------------
     One question: which card should we use? The form is the widest thing on
     the page, the card being replaced sits beside it so nobody has to
     remember which one it was, and the Save button is pinned to the bottom of
     the screen rather than left under the form where it was being missed.
     Each field says, in words, which number on the card it wants. */

  Grove.screen('fPaymentMethod', {
    surface: 'family',
    crumbs: [{ label: 'Billing', to: 'fBilling' }],
    crumbTitle: 'Your card',
    eyebrow: 'how you pay',
    title: 'Your card',
    sub: 'The studio never sees your full card number. It goes straight to the payment company, and we keep only the last four digits.',
    actions: [
      { label: 'Message the studio', to: 'fMessages' }
    ],

    body: function () {
      var f = fam();
      var last = lastCharge();
      var open = unpaid();
      var owing = sum(open);
      var openNote;

      if (!open.length) {
        openNote = 'Nothing is waiting to be paid on this card.';
      } else if (open.length === 1) {
        openNote = Grove.money(owing) + ' from ' + open[0].d + ' (' + inPlainWords(open[0].what) +
          ') has not been paid yet. It joins your ' + NEXT + ' payment, on whichever card is here then.';
      } else {
        openNote = Grove.money(owing) + ' across ' + open.length +
          ' charges has not been paid yet. It joins your ' + NEXT +
          ' payment, on whichever card is here then.';
      }

      var form = ui.card({
        title: 'Your new card',
        note: 'Nothing is charged today. This card is used from your ' + NEXT + ' payment onwards.'
      }, ui.fields(2, [
        ui.field({
          label: 'Card number',
          hint: 'The long number across the front',
          span: true,
          control: ui.input({ placeholder: '16 digits, no spaces' })
        }),
        ui.field({
          label: 'Expiry date',
          hint: 'The month and year printed under the number',
          control: ui.input({ placeholder: 'MM / YY' })
        }),
        ui.field({
          label: 'Security code',
          hint: 'The last three digits on the back',
          control: ui.input({ placeholder: '3 digits' })
        }),
        ui.field({
          label: 'Name on the card',
          hint: 'Exactly as it is printed',
          span: true,
          control: ui.input({ placeholder: 'As printed on the card' })
        })
      ]));

      var onFile = ui.card({
        title: 'The card you have now',
        note: openNote
      }, ui.kv([
        ['Your card', esc(f.card)],
        ['Payments are taken', howTaken(f)],
        ['Receipts go to', esc(f.email)],
        last
          ? ['Last payment taken', esc(last.d) + ' · ' + Grove.money(last.amt)]
          : { k: 'Last payment taken', v: 'Nothing yet', tone: 'mute' }
      ]));

      /* The studio already offers this by message. Saying it on the page is
         the difference between a parent finishing and a parent giving up. */
      var help = ui.card({
        title: 'Would you rather not type it in?',
        foot: '<span class="hint">Ring the desk on ' + esc(DESK) + '</span>' +
          ui.btn({ label: 'Message the studio', to: 'fMessages' })
      }, h`<p class="hint">We can take the card over the phone instead. It takes two
        minutes, and you will not have to type anything.</p>`);

      return h`
        ${raw(ui.grid('sidebar', [form, ui.col([onFile, help])]))}
        ${raw(ui.formActions([
          { label: 'Save this card', kind: 'primary', msg: 'Card saved · your ' + NEXT + ' payment will use it' },
          { label: 'Cancel', to: 'fBilling' }
        ], { sticky: true, hint: 'Nothing is charged today' }))}
      `;
    }
  });
})();
