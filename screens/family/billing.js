/* Family → Billing, and the card on file.

   Written for the parent this portal is actually for: someone in their sixties
   doing the school run, wary of getting money wrong online, who will ring the
   studio rather than hunt for a control.

   Rebuilt onto the studio's settled model. A PLAN IS HOURS A MONTH, and a
   CYCLE IS A SET OF DATES — so the page leads with the hours each child has,
   how many of them this cycle has already spent, the dates still to come, and
   the day the next invoice is raised, which is the last class of the cycle.
   The invoice lists the dates it covers, because that is how the owner has
   always kept control of it by hand.

   Every figure is derived from the rows, nothing is written down here:
     - hours, price, hours used and left      D.plan(student)
     - the cycle's dates and the next cycle   the child's own D.SESSIONS rows,
                                              continued at the interval those
                                              rows already run at, and stopped
                                              at D.PLAN_YEAR.ends
     - the rules quoted to the parent         D.RULES and D.PLAN_YEAR, so this
                                              screen never invents a version
     - still to pay                           every ledger line still unpaid
                                              ($18 late pickup, 20 July)
     - charges outside a plan                 D.SALES for this family, merged
                                              into the history by date

   Deleted rather than renamed:
     - the pack. "Pack of 8", "sessions used", "renews on the 8th class" and
       `D.pack()` are gone. Hours are the unit; a two-hour class spends two
     - "sessions never expire". Hours not booked in a cycle are lost, and the
       page says so plainly once, in the studio's own words
     - the sibling discount folded into the renewal. The 50% relief is on the
       REGISTRATION FEE, not on tuition, so it is a ledger line and nothing else
     - a billing date. There is none: each child is invoiced on their own last
       class, so two children are charged on two different days

   Simplified, per the brief: the make-up rules are two lines here rather than
   a control — what you get for cancelling in time, and the four things a
   make-up cannot do, both read out of D.RULES so no screen writes its own
   version. The portal books a make-up on the schedule screen, and anything
   that does not fit (an extra class because school runs a week later, a
   private class, an event) reaches this page as one charge on the card the
   studio already holds, not as a feature of its own.

   The desk number is the studio's own, so a parent is never given two numbers
   for the same studio. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  /* The portal is signed in as the Johnson family. */
  function fam() { return D.family('johnson'); }

  var DESK = D.STUDIO.phone;
  var FAR = 8.64e15;            /* further ahead than any date on the account */
  var DAY = 86400000;

  function money(n) { return Grove.money(n, { cents: n % 1 !== 0 }); }
  function hoursWord(n) { return n + (n === 1 ? ' hour' : ' hours'); }
  function firstLower(s) { return String(s).charAt(0).toLowerCase() + String(s).slice(1); }

  /* --- dates -----------------------------------------------------------------
     A cycle is a set of dates, so this screen has to talk in them. Two date
     shapes exist in the data: '2026-07-27' on a class, '1 Jul 2026' on a
     charge. Both come back as a local Date so nothing shifts a day. */

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];

  function monthIndex(word) {
    var w = String(word).slice(0, 3).toLowerCase();
    for (var i = 0; i < MONTHS.length; i++) {
      if (MONTHS[i].slice(0, 3).toLowerCase() === w) return i;
    }
    return -1;
  }
  function fromISO(s) {
    var p = String(s).split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  function fromWords(s) {
    var p = String(s).trim().split(/\s+/);
    var m = p.length > 2 ? monthIndex(p[1]) : -1;
    if (m < 0) return null;
    return new Date(+p[2], m, +p[0]);
  }
  function longDate(d) { return d.getDate() + ' ' + MONTHS[d.getMonth()]; }
  function shortDate(s) {
    var p = String(s).split(' ');
    return p[0] + ' ' + p[1];
  }
  function joinWords(list) {
    if (!list.length) return '';
    if (list.length === 1) return String(list[0]);
    return list.slice(0, list.length - 1).join(', ') + ' and ' + list[list.length - 1];
  }
  /* 'a; b; c; or d'. The four make-up limits each carry a comma of their own,
     so a comma list runs them together and reads as one long rule. */
  function orList(list) {
    if (!list.length) return '';
    if (list.length === 1) return String(list[0]);
    return list.slice(0, list.length - 1).join('; ') + '; or ' + list[list.length - 1];
  }
  /* '3, 10, 17 and 24 August'. A run that crosses a month carries the month on
     every date instead, so nothing is ambiguous. */
  function dateList(dates) {
    var i, one = true;
    if (!dates.length) return '';
    for (i = 1; i < dates.length; i++) {
      if (dates[i].getMonth() !== dates[0].getMonth() ||
          dates[i].getFullYear() !== dates[0].getFullYear()) one = false;
    }
    if (one) {
      return joinWords(dates.map(function (d) { return d.getDate(); })) +
        ' ' + MONTHS[dates[0].getMonth()];
    }
    return joinWords(dates.map(function (d) {
      return d.getDate() + ' ' + MONTHS[d.getMonth()].slice(0, 3);
    }));
  }

  var YEAR_END = fromWords(D.PLAN_YEAR.ends);

  /* --- one child's plan --------------------------------------------------------
     Hours a month, spent by dated classes. The cycle is the child's own rows;
     the next cycle is the same pattern carried on at the interval those rows
     already run at, which is why nothing here is a day written down. */

  function nextCycle(rows) {
    var out = [], last, prev, step, i, d;
    if (rows.length < 2) return out;
    last = fromISO(rows[rows.length - 1].date);
    prev = fromISO(rows[rows.length - 2].date);
    step = Math.round((last - prev) / DAY);
    if (step < 1) return out;
    for (i = 1; i <= rows.length; i++) {
      d = new Date(last.getFullYear(), last.getMonth(), last.getDate() + step * i);
      if (YEAR_END && d > YEAR_END) break;
      out.push(d);
    }
    return out;
  }

  function kids(f) {
    return D.STUDENTS.filter(function (s) { return s.family === f.name; });
  }
  function firstName(s) { return String(s.name).split(' ')[0]; }

  /* Where a child actually goes, read off the roll rather than the label. */
  function whereTheyGo(s) {
    var list = D.classesOf(s);
    if (list.length === 1) {
      return list[0].day + ' ' + list[0].time + ' · ' + list[0].room;
    }
    if (list.length) {
      return joinWords(list.map(function (c) { return c.day + ' ' + c.time; }));
    }
    return s.cls || 'One-off bookings';
  }

  function planOf(s) {
    var p = D.plan(s);
    var out = {
      child: s,
      name: firstName(s),
      isPlan: !!p.isPlan,
      hours: p.hours || 0,
      price: p.price || 0,
      used: p.usedHours || 0,
      left: p.leftHours || 0,
      rows: p.dates || [],
      next: p.nextDates || []
    };
    out.booked = out.rows.reduce(function (n, r) { return n + r.hours; }, 0);
    out.unbooked = Math.max(0, out.hours - out.booked);
    out.toCome = out.next.reduce(function (n, r) { return n + r.hours; }, 0);
    out.comeDates = out.next.map(function (r) { return fromISO(r.date); });
    out.last = out.rows.length ? fromISO(out.rows[out.rows.length - 1].date) : null;
    out.covers = nextCycle(out.rows);
    return out;
  }

  /* Whoever is invoiced first comes first, then any child on no plan. */
  function plansFor(f) {
    return kids(f).map(planOf).sort(function (a, b) {
      var at = a.isPlan && a.last ? a.last.getTime() : FAR;
      var bt = b.isPlan && b.last ? b.last.getTime() : FAR;
      return at - bt;
    });
  }

  function nameList(list) {
    var names = list.map(function (p) { return p.name; });
    if (!names.length) return 'your children';
    return joinWords(names);
  }

  /* --- what has been charged ---------------------------------------------------
     The ledger, plus anything the studio charged this family outside a plan —
     an extra class, a private class, an event. One list, newest first. */

  function history(f) {
    var out = [];
    D.LEDGER.forEach(function (l) {
      out.push({ d: l.d, what: l.what, amt: l.amt, paid: !!l.paid, by: '', i: out.length });
    });
    D.SALES.filter(function (s) { return s.fam === f.name; }).forEach(function (s) {
      out.push({ d: s.when, what: s.what, amt: s.amt, paid: true, by: s.by, i: out.length });
    });
    return out.sort(function (a, b) {
      var ad = fromWords(a.d), bd = fromWords(b.d);
      var at = ad ? ad.getTime() : 0, bt = bd ? bd.getTime() : 0;
      return bt - at || b.i - a.i;
    });
  }
  function sum(list) {
    return list.reduce(function (n, l) { return n + l.amt; }, 0);
  }
  function unpaid() {
    return D.LEDGER.filter(function (l) { return !l.paid; });
  }
  /* The most recent line that actually went to the card. Money coming off is
     not a payment taken, so those lines are not candidates. */
  function lastCharge(f) {
    var taken = history(f).filter(function (l) { return l.paid && l.amt > 0; });
    return taken[0];
  }

  /* One line saying where each row stands. A line that is money off says so in
     words, so the green is never carrying that meaning on its own. */
  function standing(l) {
    if (l.amt < 0) return 'You were not charged this';
    if (!l.paid) return 'Not paid yet — it goes on your next invoice';
    if (l.by) return 'Paid · added at the desk by ' + l.by;
    return 'Paid';
  }
  function tone(l) {
    if (l.amt < 0) return 'grove strong';
    return l.paid ? 'strong' : 'clay strong';
  }
  function amount(n, cls) {
    return h`<span class="${raw(cls || '')}">${money(n)}</span>`;
  }

  function howTaken(f) {
    return f.autopay
      ? 'Automatically, from this card, on the day each invoice is raised'
      : 'By you — we send the invoice the day it is raised';
  }
  function makeupWindow() {
    var w = D.RULES.makeupWindow;
    return w === 'same cycle' ? 'in the same cycle' : 'within ' + w;
  }

  /* --- one child -------------------------------------------------------------- */

  function planCard(p) {
    var rows = [];

    if (!p.isPlan) {
      return ui.card({
        title: p.name,
        note: 'Nothing renews for ' + p.name + '. Camp weeks, no-school days, pop-ups and ' +
          'private classes are paid for when you book them.'
      }, ui.kv([
        ['What they come to', esc(whereTheyGo(p.child))],
        { k: 'Plan', v: 'None', tone: 'mute' }
      ]));
    }

    rows.push(['Their class', esc(whereTheyGo(p.child))]);
    rows.push(['Hours this cycle', p.used + ' of ' + hoursWord(p.hours) + ' used']);
    rows.push(p.comeDates.length
      ? ['Still to come', hoursWord(p.toCome) + ' · ' + dateList(p.comeDates)]
      : { k: 'Still to come', v: 'Nothing left this cycle', tone: 'mute' });
    if (p.unbooked) {
      rows.push({ k: 'Not booked', v: hoursWord(p.unbooked) + ' · lost at the end of the cycle', tone: 'clay' });
    }
    rows.push(['What the plan costs', money(p.price) + ' a month']);
    if (p.last) rows.push(['Next invoice', money(p.price) + ' on ' + longDate(p.last)]);
    rows.push(p.covers.length
      ? ['It covers', dateList(p.covers)]
      : { k: 'It covers', v: 'Nothing — the plan ends with the school year', tone: 'mute' });
    rows.push(['Plan runs to', esc(D.PLAN_YEAR.ends)]);

    return ui.card({
      title: p.name,
      head: ui.pill(hoursWord(p.hours) + ' a month'),
      note: 'The invoice is raised on ' + p.name + "'s last class of the cycle, not on a " +
        'fixed date. ' + D.RULES.unusedHours
    }, h`<div class="stack">
      ${raw(ui.meter(p.used, p.hours))}
      ${raw(ui.kv(rows))}
    </div>`);
  }

  /* ---- billing --------------------------------------------------------------- */

  Grove.screen('fBilling', {
    surface: 'family',
    crumbTitle: 'Billing',
    eyebrow: 'hours, dates and what they cost',
    title: 'Billing',
    sub: 'What each plan costs, where this cycle stands, and when your next invoice comes.',
    actions: [
      { label: 'Cancel a plan', kind: 'danger',
        msg: 'Request sent · ' + String(D.RULES.cancelPlan).split('.')[0] +
          ', we will confirm by email' },
      { label: 'Message the studio', kind: 'primary', to: 'fMessages' }
    ],

    body: function () {
      var f = fam();
      var all = plansFor(f);
      var held = all.filter(function (p) { return p.isPlan; });
      var open = unpaid();
      var owing = sum(open);
      var soonest = held[0];
      var rest = held.slice(1).filter(function (p) { return p.last; });
      var headline, owed, works, how, lines, story, help, cards, text;

      /* The answer first: whose class raises the next invoice, on what day, and
         which dates it pays for. */
      if (soonest && soonest.last) {
        text = 'It is ' + money(soonest.price) +
          (soonest.covers.length ? ' and covers ' + dateList(soonest.covers) + '.' : '.');
        if (rest.length) {
          text += ' Each child is invoiced on their own last class of the cycle: ' +
            joinWords(rest.map(function (p) {
              return p.name + ' on ' + longDate(p.last);
            })) + '.';
        }
        headline = ui.notice({
          title: 'Your next invoice comes on ' + soonest.name + "'s last class of this cycle, " +
            longDate(soonest.last),
          text: text
        });
      } else {
        headline = ui.notice({
          title: 'Nothing is on a plan',
          text: 'Camp weeks, no-school days, pop-ups and private classes are paid for when ' +
            'you book them.'
        });
      }

      /* Still owed, and not folded into a headline figure: it is its own
         charge, and it is the one thing on this page to act on. */
      owed = owing
        ? ui.notice({
            kind: 'bad',
            title: money(owing) + ' is still to pay',
            text: (open.length === 1
              ? open[0].what + ', from ' + open[0].d + '.'
              : money(owing) + ' across ' + open.length + ' charges.') +
              ' It goes on your next invoice, or you can pay it now.',
            action: { label: 'Pay it now', kind: 'primary', msg: money(owing) + ' paid · thank you' }
          })
        : '';

      cards = all.length
        ? ui.grid(2, all.map(planCard))
        : ui.card({ title: 'Your children' },
            ui.empty('No children on the account yet', 'Add a child and their plan appears here.'));

      /* The model itself, in five plain lines. A parent billed monthly
         everywhere else needs to be told this once. */
      works = ui.card({
        title: 'How your plan works',
        flush: true
      }, ui.rows([
        {
          title: 'A plan is hours a month',
          sub: esc(held.length
            ? joinWords(held.map(function (p) {
                return p.name + ' has ' + hoursWord(p.hours) + ' a month';
              })) + '. You chose how to split the hours at registration, and the day and ' +
              'time stay the same all year.'
            : 'You choose the hours at registration, and how to split them.')
        },
        {
          title: 'A cycle is a set of dates',
          sub: 'The invoice comes on the last class of the cycle and covers the dates in the ' +
            'next one. Nothing is charged on a fixed date.'
        },
        { title: 'Hours not booked are lost', sub: esc(D.RULES.unusedHours) },
        {
          title: esc('Cancel ' + D.RULES.cancelNotice + ' ahead and you get a make-up'),
          sub: esc('Later than that, or a no-show — ' + firstLower(D.RULES.lateCancel) +
            ' A make-up goes in ' + firstLower(D.RULES.makeupWhere) +
            ' It must be taken ' + makeupWindow() + '.')
        },
        {
          title: 'What a make-up cannot do',
          sub: esc('It cannot ' + orList(D.RULES.makeupNever.map(firstLower)) + '.')
        },
        {
          title: 'Your plan ends with the school year',
          sub: esc('It runs to ' + D.PLAN_YEAR.ends + ' and ends there. ' + D.PLAN_YEAR.note)
        },
        {
          title: 'Leaving before then',
          sub: esc(D.RULES.cancelPlan + ' ' + D.RULES.freeze)
        }
      ]));

      /* Changing a card is the one thing a parent comes to this page to
         change, so it is a labelled button rather than a quiet link, and the
         reassurance sits directly under the card number. */
      how = ui.card({
        title: 'How you pay',
        head: ui.btn({ label: 'Change the card', kind: 'primary', size: 'sm', to: 'fPaymentMethod' }),
        note: 'Anything outside a plan — an extra class at the end of term, a private class, ' +
          'an event — is charged to this card when it happens and appears below.'
      }, ui.kv([
        ['Your card', esc(f.card)],
        ['Payments are taken', howTaken(f)],
        ['What you hold', esc(f.plan)],
        ['Receipts go to', esc(f.email)]
      ]));

      /* One line per charge, in a sentence, newest first. */
      lines = history(f).map(function (l) {
        return {
          lead: esc(shortDate(l.d)),
          title: esc(l.what),
          sub: esc(standing(l)),
          end: amount(l.amt, tone(l))
        };
      });

      story = ui.card({
        title: 'Everything so far',
        head: ui.btn({ label: 'Download statement', kind: 'quiet', size: 'sm', msg: 'Statement downloaded' }),
        flush: true,
        note: lines.length
          ? 'Newest first. A figure in green is money off — you were not charged it.'
          : 'Every charge appears here, newest first.'
      }, lines.length
        ? ui.rows(lines)
        : ui.empty('Nothing charged yet', 'Your first invoice appears here the day it is raised.'));

      /* Money is where somebody who is unsure stops and rings instead. Saying
         that ringing is fine, on the page, is cheaper than the call being a
         complaint. */
      help = ui.card({
        title: 'If something does not look right',
        foot: '<span class="hint">Or ring the desk on ' + esc(DESK) + '</span>' +
          ui.btn({ label: 'Message the studio', to: 'fMessages' })
      }, h`<p class="hint">Tell us before you worry about it. We will go through the
        charge with you, and if it is wrong we will put it right — you do not have to
        work out which line is which.</p>`);

      return h`
        ${raw(headline)}
        ${raw(owed)}
        <div class="section">${raw(cards)}</div>
        <div class="section">${raw(ui.grid(2, [works, how]))}</div>
        <div class="section">${raw(story)}</div>
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
      var last = lastCharge(f);
      var open = unpaid();
      var owing = sum(open);
      var held = plansFor(f).filter(function (p) { return p.isPlan && p.last; });
      var soonest = held[0];
      var openNote, nextNote, form, onFile, help;

      if (!open.length) {
        openNote = 'Nothing is waiting to be paid on this card.';
      } else if (open.length === 1) {
        openNote = money(owing) + ' from ' + open[0].d + ' (' + open[0].what +
          ') has not been paid yet. It goes on your next invoice, on whichever card is here then.';
      } else {
        openNote = money(owing) + ' across ' + open.length +
          ' charges has not been paid yet. It goes on your next invoice, on whichever card ' +
          'is here then.';
      }

      nextNote = soonest
        ? 'Nothing is charged today. This card is used when ' + soonest.name +
          "'s next invoice is raised, on " + longDate(soonest.last) + '.'
        : 'Nothing is charged today. This card is used the next time you book.';

      form = ui.card({
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
          control: ui.month({})
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

      onFile = ui.card({
        title: 'The card you have now',
        note: openNote
      }, ui.kv([
        ['Your card', esc(f.card)],
        ['Payments are taken', howTaken(f)],
        ['Receipts go to', esc(f.email)],
        soonest
          ? ['Next invoice', esc(soonest.name) + ' · ' + money(soonest.price) + ' · ' +
             longDate(soonest.last)]
          : { k: 'Next invoice', v: 'Nothing on a plan', tone: 'mute' },
        last
          ? ['Last payment taken', esc(last.d) + ' · ' + money(last.amt)]
          : { k: 'Last payment taken', v: 'Nothing yet', tone: 'mute' }
      ]));

      /* The studio already offers this by message. Saying it on the page is
         the difference between a parent finishing and a parent giving up. */
      help = ui.card({
        title: 'Would you rather not type it in?',
        foot: '<span class="hint">Ring the desk on ' + esc(DESK) + '</span>' +
          ui.btn({ label: 'Message the studio', to: 'fMessages' })
      }, h`<p class="hint">We can take the card over the phone instead. It takes two
        minutes, and you will not have to type anything.</p>`);

      return h`
        ${raw(ui.grid('sidebar', [form, ui.col([onFile, help])]))}
        ${raw(ui.formActions([
          { label: 'Save this card', kind: 'primary', msg: 'Card saved · your next invoice will use it' },
          { label: 'Cancel', to: 'fBilling' }
        ], { sticky: true, hint: 'Nothing is charged today' }))}
      `;
    }
  });
})();
