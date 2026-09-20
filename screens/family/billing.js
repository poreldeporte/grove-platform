/* Family → Billing, and the card on file.

   Written for the parent this portal is actually for: someone in their sixties
   doing the school run, wary of getting money wrong online, who will ring the
   studio rather than hunt for a control.

   Rewritten onto the corrected billing model. This screen used to say "Your
   next payment is $698.00, on 1 Aug 2026", which was wrong twice over. There
   is no billing date, and a family with two children does not have one
   payment. A pack of sessions belongs to ONE CHILD. The child attends, each
   class spends a session, and when the last session is used that pack renews
   and charges for another the same size. So the page now leads with where each
   child's pack stands and what renewing it costs, and the next charge is a
   number of classes away rather than a day on the calendar.

   Every figure is derived, nothing is written down here:
     - pack size, used and left        D.pack(student)
     - what a pack costs               D.PRICING.as.plans['p' + size]
     - what came off it last time      the negative ledger line raised beside
                                       the pack line on the same day (Lucas's
                                       sibling discount, −$140)
     - still to pay                    every ledger line still flagged unpaid
                                       ($18 late pickup, 20 July — it is the
                                       second notice on the page, not buried)

   Machinery deleted rather than renamed:
     - the monthly run. `cycle()`, `since()` and the tuition + discount +
       arrears sum that produced one headline figure are gone, along with
       NEXT = '1 Aug 2026' and every "on the 1st", "billing cycle" and
       "thirty days notice to cancel"
     - make-up credit. `inPlainWords()` existed to rewrite "Make-up credit
       applied" into parent English; there is no credit to rewrite. A session
       cancelled more than 24 hours ahead is simply not spent, so the pack
       lasts a week longer, and a catch-up class spends a session like any
       other class
     - expiry. Nothing on this page carries an expiry date or warning, because
       a paid-for session is the family's until it is used
     - "membership" and "cancellation". A family holds sessions; they stop by
       letting a pack not renew, keeping what they have already paid for

   The desk number is the studio's own, so a parent is never given two numbers
   for the same studio. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  /* The portal is signed in as the Johnson family. */
  function fam() { return D.family('johnson'); }

  var DESK = D.STUDIO.phone;

  /* --- the ledger ----------------------------------------------------------- */

  function sum(list) {
    return list.reduce(function (n, l) { return n + l.amt; }, 0);
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
    var taken = settled().filter(function (l) { return l.amt > 0; });
    return taken[taken.length - 1];
  }

  /* --- the packs -------------------------------------------------------------
     A pack belongs to one child, so this family has as many renewals as it has
     children with a pack, and they fall due at different classes. */

  function kids(f) {
    return D.STUDENTS.filter(function (s) { return s.family === f.name; });
  }
  function firstName(s) { return String(s.name).split(' ')[0]; }

  /* What the studio charges for a pack that size. */
  function listPrice(size) {
    var p = D.PRICING.as.plans['p' + size];
    return typeof p === 'number' ? p : 0;
  }
  /* The pack the studio last raised for this child. */
  function packLine(name) {
    var found = null;
    D.LEDGER.forEach(function (l) {
      if (l.amt > 0 && String(l.what).indexOf('Pack of ') === 0 &&
          String(l.what).indexOf('— ' + name) !== -1) found = l;
    });
    return found;
  }
  /* Anything taken off that pack on the day it was raised — on this family,
     the sibling discount. It comes off the renewal the same way. */
  function reliefOn(line, name) {
    if (!line) return 0;
    return sum(D.LEDGER.filter(function (l) {
      return l.d === line.d && l.amt < 0 && String(l.what).indexOf('— ' + name) !== -1;
    }));
  }

  /* Everything this screen knows about one child's pack. Nothing here is a
     date, and nothing here expires. */
  function packOf(s) {
    var p = D.pack(s);
    var name = firstName(s);
    var line = packLine(name);
    var price = listPrice(p.size) || (line ? line.amt : 0);
    var off = reliefOn(line, name);
    return {
      child: s, name: name, size: p.size, used: p.used, left: p.left,
      isPack: p.isPack, price: price, off: off, due: price + off
    };
  }
  /* Soonest to renew first, then any child who holds no pack at all. */
  function packsFor(f) {
    return kids(f).map(packOf).sort(function (a, b) {
      return (a.isPack ? a.left : 999) - (b.isPack ? b.left : 999);
    });
  }

  function classCount(n) { return n + (n === 1 ? ' class' : ' classes'); }
  function whenRenews(left) {
    return left <= 1 ? 'at the next class' : 'in ' + left + ' classes';
  }
  function ordinal(n) {
    var t = n % 100;
    if (t > 3 && t < 21) return n + 'th';
    return n + (['th', 'st', 'nd', 'rd'][n % 10] || 'th');
  }

  /* The children a sentence is about, read from the roster rather than named
     in this file. */
  function nameList(list) {
    var names = list.map(function (p) { return p.name; });
    if (!names.length) return 'your children';
    if (names.length === 1) return names[0];
    return names.slice(0, names.length - 1).join(', ') + ' and ' + names[names.length - 1];
  }

  /* '1 Jul 2026' → '1 Jul'. Every line is this year and the card says so. */
  function shortDate(d) {
    var p = String(d).split(' ');
    return p[0] + ' ' + p[1];
  }
  function howTaken(f) {
    return f.autopay
      ? 'Automatically, the moment a pack renews'
      : 'By you — we email you when a pack is ready to renew';
  }

  function total(n) {
    return '<span class="strong">' + Grove.money(n) + '</span>';
  }
  function amount(n, tone) {
    return h`<span class="${raw(tone || '')}">${Grove.money(n)}</span>`;
  }

  /* One line saying where each ledger row stands. A line that is money off or
     money back says so in words, so the green is never carrying that meaning
     on its own. */
  function standing(l) {
    if (l.amt < 0) return 'You were not charged this';
    if (!l.paid) return 'Not paid yet — it goes on the next pack that renews';
    return 'Paid';
  }
  function tone(l) {
    if (l.amt < 0) return 'grove strong';
    return l.paid ? 'strong' : 'clay strong';
  }

  /* --- one child's pack ------------------------------------------------------ */

  function packCard(p) {
    if (!p.isPack) {
      return ui.card({
        title: p.name,
        note: 'Nothing renews for ' + p.name + '. Camp weeks and one-off classes are paid ' +
          'for when you book them.'
      }, ui.kv([
        ['What they come to', esc(p.child.cls || 'Camp and one-off bookings')],
        { k: 'Sessions held', v: 'None', tone: 'mute' }
      ]));
    }

    var rows = [];
    if (p.child.cls) rows.push(['Their class', esc(p.child.cls)]);
    rows.push(['Sessions used', p.used + ' of ' + p.size]);
    rows.push(['Left before it renews', classCount(p.left)]);
    rows.push(['Renews on', 'the ' + ordinal(p.size) + ' class']);
    rows.push(['A pack of ' + p.size, Grove.money(p.price)]);
    if (p.off) rows.push({ k: 'Sibling discount', v: Grove.money(p.off), tone: 'grove' });
    rows.push({ k: 'To pay when it renews', v: total(p.due) });

    return ui.card({
      title: p.name,
      head: ui.pill('Pack of ' + p.size),
      note: 'Sessions never expire. Tell us 24 hours ahead and the session stays in ' +
        p.name + "'s pack — the pack just lasts a week longer."
    }, h`<div class="stack">
      ${raw(ui.meter(p.used, p.size))}
      ${raw(ui.kv(rows))}
    </div>`);
  }

  /* ---- billing --------------------------------------------------------------- */

  Grove.screen('fBilling', {
    surface: 'family',
    crumbTitle: 'Billing',
    eyebrow: 'when your packs renew',
    title: 'Billing',
    sub: 'Where each pack stands, what it costs when it renews, and everything you have paid.',
    actions: [
      { label: 'Stop a pack renewing', kind: 'danger', msg: 'Request sent · you keep the sessions you have already paid for' },
      { label: 'Message the studio', kind: 'primary', to: 'fMessages' }
    ],

    body: function () {
      var f = fam();
      var all = packsFor(f);
      var held = all.filter(function (p) { return p.isPack; });
      var open = unpaid();
      var owing = sum(open);

      /* The answer first: which pack is closest to renewing, how many classes
         away that is, and what it costs. No date, because there is none. */
      var soonest = held[0];
      var headline = soonest
        ? ui.notice({
            title: soonest.name + "'s pack renews " + whenRenews(soonest.left) +
              ' — ' + Grove.money(soonest.due),
            text: held.length > 1
              ? 'Nothing is charged on a date. Each pack belongs to one child and renews on ' +
                'its own, so ' + nameList(held) + ' are charged separately.'
              : 'Nothing is charged on a date. The pack renews the moment its last session ' +
                'is used, and we charge for another the same size.'
          })
        : ui.notice({
            title: 'Nothing is set to renew',
            text: 'You hold no packs at the moment. Camp weeks and one-off classes are paid ' +
              'for when you book them.'
          });

      /* Still owed, and not folded into a headline figure: it is its own
         charge, and it is the one thing on this page to act on. */
      var owed = owing
        ? ui.notice({
            kind: 'bad',
            title: Grove.money(owing) + ' is still to pay',
            text: (open.length === 1
              ? open[0].what + ', from ' + open[0].d + '.'
              : Grove.money(owing) + ' across ' + open.length + ' charges.') +
              ' It goes on the next pack that renews, or you can pay it now.',
            action: { label: 'Pay it now', kind: 'primary', msg: Grove.money(owing) + ' paid · thank you' }
          })
        : '';

      var packCards = all.length
        ? ui.grid(2, all.map(packCard))
        : ui.card({ title: 'Your children' },
            ui.empty('No children on the account yet', 'Add a child and their pack appears here.'));

      /* The model itself, in five plain lines. A parent billed monthly
         everywhere else needs to be told this once. */
      var works = ui.card({
        title: 'How a pack works',
        flush: true
      }, ui.rows([
        {
          title: 'A pack belongs to one child',
          sub: esc(held.length > 1
            ? nameList(held) + ' each hold their own pack, and they renew at different times.'
            : 'Each child holds their own pack.')
        },
        {
          title: 'Every class spends one session',
          sub: 'Including a catch-up class booked on top of the weekly one.'
        },
        {
          title: 'The pack renews when the last session is used',
          sub: 'We charge for another pack the same size. There is no billing date.'
        },
        {
          title: 'Tell us 24 hours ahead and nothing is spent',
          sub: 'The session stays in the pack. Inside 24 hours it is spent, exactly as if they had come.'
        },
        {
          title: 'Sessions never expire',
          sub: 'You have paid for them, so they are yours until they are used.'
        }
      ]));

      /* Changing a card is the one thing a parent comes to this page to
         change, so it is a labelled button rather than a quiet link, and the
         reassurance sits directly under the card number. */
      var how = ui.card({
        title: 'How you pay',
        head: ui.btn({ label: 'Change the card', kind: 'primary', size: 'sm', to: 'fPaymentMethod' }),
        note: 'The studio never sees your full card number — only the last four digits, ' +
          'so we can tell your cards apart.'
      }, ui.kv([
        ['Your card', esc(f.card)],
        ['Payments are taken', howTaken(f)],
        ['What you hold', esc(f.plan)],
        ['Receipts go to', esc(f.email)]
      ]));

      /* One line per charge, in a sentence, newest first. */
      var lines = D.LEDGER.slice().reverse().map(function (l) {
        return {
          lead: esc(shortDate(l.d)),
          title: esc(l.what),
          sub: esc(standing(l)),
          end: amount(l.amt, tone(l))
        };
      });

      var history = ui.card({
        title: 'Everything so far',
        head: ui.btn({ label: 'Download statement', kind: 'quiet', size: 'sm', msg: 'Statement downloaded' }),
        flush: true,
        note: lines.length
          ? 'Every charge since ' + D.LEDGER[0].d + ', newest first. A figure in green is ' +
            'money off or money back — you were not charged it.'
          : 'Every charge appears here, newest first.'
      }, lines.length
        ? ui.rows(lines)
        : ui.empty('Nothing charged yet', 'Your first pack appears here the day you buy it.'));

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
        ${raw(owed)}
        <div class="section">${raw(packCards)}</div>
        <div class="section">${raw(ui.grid(2, [works, how]))}</div>
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
      var held = packsFor(f).filter(function (p) { return p.isPack; });
      var soonest = held[0];
      var openNote;

      if (!open.length) {
        openNote = 'Nothing is waiting to be paid on this card.';
      } else if (open.length === 1) {
        openNote = Grove.money(owing) + ' from ' + open[0].d + ' (' + open[0].what +
          ') has not been paid yet. It goes on the next pack that renews, on whichever ' +
          'card is here then.';
      } else {
        openNote = Grove.money(owing) + ' across ' + open.length +
          ' charges has not been paid yet. It goes on the next pack that renews, on ' +
          'whichever card is here then.';
      }

      var nextNote = soonest
        ? 'Nothing is charged today. This card is used when ' + soonest.name +
          "'s pack renews, " + whenRenews(soonest.left) + '.'
        : 'Nothing is charged today. This card is used the next time you buy a pack.';

      var form = ui.card({
        title: 'Your new card',
        note: nextNote
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
        soonest
          ? ['Next pack to renew', esc(soonest.name) + ' · ' + Grove.money(soonest.due) +
             ' · ' + classCount(soonest.left) + ' away']
          : { k: 'Next pack to renew', v: 'None held', tone: 'mute' },
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
          { label: 'Save this card', kind: 'primary', msg: 'Card saved · the next pack to renew will use it' },
          { label: 'Cancel', to: 'fBilling' }
        ], { sticky: true, hint: 'Nothing is charged today' }))}
      `;
    }
  });
})();
