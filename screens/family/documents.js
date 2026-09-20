/* Family → Documents, and one document.

   Written for a parent who is not confident with a screen: one question per
   page, the action always in view, and a way to ask a person on both screens.

   The list is two plainly named groups: "Waiting for your signature", with a
   full-size Read and sign button on each row, and "Signed and on file", which
   is quiet — the name and the day you signed it. A sticky bar names the first
   document outstanding, so the one thing a parent came to do is on screen
   before they scroll and after they scroll. The document page is a letter, not
   a filing card: a line at the top saying whether it still needs the parent,
   the whole text beside a plain summary, and the signing action in a bar
   pinned to the bottom. A photo permission is optional, so its second button
   is "No thank you" rather than leaving refusing as something a parent has to
   work out; the three nobody can decline offer "Not now" and the desk number.

   Rewritten again for the settled pricing model. The pack vocabulary is gone
   from the clause text as well as from the screen furniture, because the
   studio does not sell packs:

     - a plan is HOURS A MONTH, not sessions. The rate card is read from
       PRICING (4 hours $280 · 8 $540 · 12 $780 · 16 $960) and each child's own
       plan from D.plan(), so the document cannot quote a figure the studio
       does not charge. How the hours are split into classes is the parent's
       choice and is not a price
     - a cycle is a set of dates fixed at registration. The invoice is raised
       on the last class of the cycle and covers the next one, naming the dates
       it covers. The clause says that; the dates themselves are on Billing,
       which is where a parent can act on them
     - the rate card also says why the prices are not one price multiplied: the
       hourly rate falls as the plan grows, worked out by dividing each plan
       price by its hours rather than quoted, so it cannot disagree with the
       prices in the same sentence
     - hours not booked are lost, word for word from D.RULES.unusedHours, and
       nothing is added to it. The clause used to carry a refund rule and a
       no-passing-to-a-sibling rule that D.RULES does not hold; a document a
       family signs may not say more than the studio's own rules say
     - the plan is annual and ends by itself at the end of the school year,
       from D.PLAN_YEAR. Nothing renews into the summer
     - make-ups are back, because they are what families sign: cancel in the
       portal at least 24 hours ahead and there is a make-up; later than that,
       or a no-show, and the class counts as attended. The window, what a
       make-up cannot do, and that plans are never frozen all come from
       D.RULES, so this page cannot drift from the registration form. The
       freezing clause is now D.RULES.freeze and nothing else — it used to offer
       to “sort it out with you”, which reads as an exception to a rule that has
       none. A parent who needs one messages the desk from the card below
     - the make-up window is rendered from D.RULES.makeupWindow rather than
       written out. The studio is moving from "same cycle" to "30 days from the
       missed class"; when Settings changes it, this document changes with it
     - one clause covers every exception the owner asked for — an extra class
       when a school runs on later than the studio's program, a private class
       that comes up, an event, any other service. It is one charge on the card
       on file, named on your Billing page. There is no rule per exception
     - cancelling a plan is 30 days written notice, by email or in the portal,
       from D.RULES.cancelPlan

   The document page also carries a short at-a-glance list under the summary —
   each child's plan and the registration fee on the payment terms, the notice
   period and the make-up window on the policies. Those are the figures a
   parent rings the desk about, so they are on the page in a form they can read
   at a glance as well as in the clause they are agreeing to.

   Kept although it looks like clutter:
     - the full clause text of every document, including the ones already
       signed. A parent being asked to agree to something must be able to read
       all of it without ringing anyone
     - the allergy line in the medical form ("Emma (Allergy · peanuts)"), read
       from the children's records, and the emergency number and guardian name
     - the $25 late fee, the 7-day grace, the $1 a minute after 10 minutes and
       the registration fee. They are what the parent is agreeing to, so they
       are quoted from the same named figures Console → Settings uses

   Removed, and why a parent does not need it: version numbers, the Published
   column, the Status column and the Signed / Not signed pills, and the
   Signature card's Status and Signed by rows. Which group a document is in
   says the same thing in words. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  /* The signed-in parent is the Johnson household. */
  var FAMILY = 'Johnson';

  /* The studio's number, as Console → Settings gives it to families. */
  var DESK = D.STUDIO.phone;

  /* Amounts and windows Grove.data does not hold. They are named here for the
     same reason Console → Settings names them: the clause text and the
     summary above it then quote one figure. Everything the dataset does hold —
     the notice period, the make-up rules, the plan year, every price — is read
     from it below and never written out here. */
  var GRACE_DAYS = 7;          // "due within 7 days"
  var LATE_FEE = 25;           // "a $25 late fee"
  var PICKUP_GRACE = 10;       // "10 minutes grace"
  var PICKUP_RATE = 1;         // "a late fee of $1 per minute"

  var P = D.PRICING;
  var R = D.RULES;
  var Y = D.PLAN_YEAR;

  function money(n) { return Grove.money(n, { cents: false }); }
  /* An hourly rate can land on a half-dollar — the 8-hour plan works out at
     $67.50 — so cents are shown only when there are any. */
  function rate(n) { return Grove.money(n, { cents: n % 1 !== 0 }); }

  function current(ctx) {
    var id = ctx.params.id;
    return D.DOCUMENTS.filter(function (d) { return d.id === id; })[0] || D.DOCUMENTS[0];
  }

  function outstanding() {
    return D.DOCUMENTS.filter(function (d) { return !d.signed; });
  }
  function onFile() {
    return D.DOCUMENTS.filter(function (d) { return d.signed; });
  }

  function andList(names) {
    if (names.length < 2) return names.join('');
    return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
  }

  function kids() {
    return D.STUDENTS.filter(function (s) { return s.family === FAMILY; });
  }
  function household() {
    return D.FAMILIES.filter(function (f) { return f.name === FAMILY; })[0] || D.FAMILIES[0];
  }
  function first(s) { return String(s.name).split(' ')[0]; }

  /* ---- the plan, said in the studio's words ---------------------------------
     A plan is hours a month. The hours come from the child's own record and
     the price from the studio's rate card, so a clause cannot quote a figure
     the studio does not charge. A child who only does camp and one-off
     bookings holds no plan and is left out. */

  function planKids() {
    return kids().filter(function (s) { return D.plan(s).isPlan; });
  }
  function planLine(s) {
    var p = D.plan(s);
    return p.hours + ' hours a month · ' + money(p.price);
  }
  function planPrices() {
    return andList(planKids().map(function (s) {
      var p = D.plan(s);
      return first(s) + ' is on ' + p.hours + ' hours a month at ' + money(p.price);
    }));
  }

  /* The whole rate card, smallest plan first. */
  function planKeys() {
    return Object.keys(P.as.plans).sort(function (a, b) {
      return Number(String(a).slice(1)) - Number(String(b).slice(1));
    });
  }
  function planSize(k) { return Number(String(k).slice(1)); }
  function planRates() {
    return andList(planKeys().map(function (k) {
      return planSize(k) + ' hours is ' + money(P.as.plans[k]);
    }));
  }
  /* Why the four prices are not one price multiplied: the hourly rate falls as
     the plan grows. Both ends are divided out of the rate card above rather
     than quoted, so the sentence cannot disagree with the prices beside it. */
  function hourlyRange() {
    var keys = planKeys();
    var lo = keys[0], hi = keys[keys.length - 1];
    function per(k) { return P.as.plans[k] / planSize(k); }
    return 'The bigger the plan, the lower the hourly rate: ' + rate(per(lo)) +
      ' an hour on ' + planSize(lo) + ' hours, down to ' + rate(per(hi)) +
      ' an hour on ' + planSize(hi) + '.';
  }

  /* What the one-off programmes cost, for the clause that says a plan does not
     cover them. Every figure is read from the rate card. */
  function oneOffPrices() {
    var pop = (P.pop.events[0] || {}).amount;
    return 'a camp week is ' + money(P.camp.week) + ', or ' + money(P.camp.day) +
      ' a day; a no-school day is ' + money(P.nsd.base) + ', with ' +
      money(P.nsd.extraHour) + ' for each extra hour; a private class is ' +
      money(P.priv.hourly) + ' an hour; a pop-up class is ' + money(pop) +
      ' a child; and a birthday party is quoted when you ask';
  }

  /* The four things a make-up cannot do, as D.RULES lists them. Only the first
     letter of each changes, so that they read as one sentence. */
  function lower(s) { return String(s).charAt(0).toLowerCase() + String(s).slice(1); }
  function neverList() {
    var items = R.makeupNever.map(lower);
    if (items.length < 2) return items.join('');
    return items.slice(0, -1).join('; ') + '; or ' + items[items.length - 1];
  }

  /* Who a document is about: the child it names, or every child on the
     family record when it names nobody. */
  function covers(d) {
    var all = kids();
    var named = all.filter(function (s) { return d.name.indexOf(first(s)) !== -1; });
    return named.length ? named : all;
  }
  function coverNames(d) {
    return andList(covers(d).map(first));
  }

  /* "Sabrina Moore · 3 Jan 2026" said as a sentence, and said as "you" when
     the signer is the parent who is signed in. */
  function signedWhen(d) {
    return String(d.who).split(' · ')[1] || '';
  }
  function signedLine(d) {
    var who = String(d.who).split(' · ')[0];
    var when = signedWhen(d);
    var me = Grove.persona('family');
    if (!when) return who;
    return (me && who === me.name ? 'You signed this on ' : who + ' signed this on ') + when;
  }

  /* ---- what each document is, says, and whether it can be refused ------------
     data.js records what a document is and who signed it, never its text, and
     a screen may not add a field to it, so the text sits here.

     `line`     one sentence, used as the page subtitle and the list row
     `summary`  what changed, or what it covers, in plain sentences
     `facts`    the figures a parent rings the desk about, at a glance
     `optional` a permission a parent is free to refuse, which changes the
                second button on the signing bar from "Not now" to a real
                answer */

  function meta(d) {
    var who = coverNames(d);
    var f = household();

    if (d.id === 'd1') {
      var prices = planPrices();
      var facts = planKids().map(function (s) {
        return [first(s) + '’s plan', esc(planLine(s))];
      });
      facts.push(['Registration', esc(money(P.as.regFee) + ' a ' + P.as.regFeePer)]);
      facts.push(['Your plan ends', esc(Y.ends)]);

      return {
        line: 'What a plan costs, when the invoice comes, and what happens if a payment is late.',
        summary: 'The studio has rewritten this one. What is different: a plan is a number of ' +
          'hours a month rather than a number of classes, the invoice comes on the last class ' +
          'of a cycle and covers the next one, hours you do not book are lost, and the plan ' +
          'ends with the school year rather than renewing into the summer.',
        facts: facts,
        optional: false,
        clauses: [
          { h: 'What a plan is',
            p: 'A plan is a number of hours a month of after-school classes: ' + planRates() +
               '. ' + hourlyRange() + ' How those hours are split is yours to choose — ' +
               'two-hour classes mean fewer visits, one-hour classes mean more — and the ' +
               'split does not change the price. ' +
               (prices ? prices + '.' : '') },
          { h: 'The cycle, and when the invoice comes',
            p: 'You picked your day and time when you registered and they are fixed for the ' +
               'program year. A cycle is that set of dates, and the month’s hours are used up ' +
               'by them. The invoice is raised on the last class of the cycle and covers the ' +
               'next one, and it names the dates it covers. Your Billing page shows the same ' +
               'dates before the invoice goes out.' },
          { h: 'Hours you do not book',
            p: R.unusedHours + ' There is no balance carried forward.' },
          { h: 'The plan ends with the school year',
            p: 'This is the ' + Y.label + ' program year. Your plan runs to ' + Y.ends +
               ' and ends there. ' + Y.note },
          { h: 'If a payment is late',
            p: 'Payment is due within ' + GRACE_DAYS + ' days. After that a ' + money(LATE_FEE) +
               ' late fee is added to your account. A child is not admitted to class before the ' +
               'cycle is paid for.' },
          { h: 'If a card fails',
            p: 'We try the card again on day 1, day 3 and day 7. After the third try someone ' +
               'rings you — your child’s place is never cancelled silently.' },
          { h: 'Anything the plan does not cover',
            p: 'A plan covers after-school classes only. Camp, a no-school day, a private ' +
               'class, a pop-up and a birthday party are booked one at a time and charged when ' +
               'you book them: ' + oneOffPrices() + '. The studio can also charge the card on ' +
               'file for anything else you have asked for — an extra class or two when school ' +
               'runs on later than our program does, a private lesson that comes up, an event. ' +
               'Every charge names what it is for and appears on your Billing page.' },
          { h: 'The registration fee',
            p: 'A one-time registration fee of ' + money(P.as.regFee) + ' per child covers ' +
               'materials and software, and it is not refundable. Siblings get ' +
               P.as.siblingRelief + '.' },
          { h: 'If you stop before the year ends',
            p: 'Tell us in writing, by email or by message in the portal: ' + R.cancelPlan }
        ]
      };
    }

    if (d.id === 'd2') {
      return {
        line: 'Cancelling a class, make-ups, drop-off and pick-up, and when to keep a poorly ' +
          'child at home.',
        summary: 'The rules that come up most: how much notice we need when a class is going ' +
          'to be missed, what a make-up can and cannot do, and the few minutes grace at the ' +
          'door. The last paragraph is the one about accidents and lost belongings.',
        facts: [
          ['Cancel by', esc(R.cancelNotice + ' before the class')],
          ['Make-up window', esc(R.makeupWindow)],
          ['Late pick-up', esc(money(PICKUP_RATE) + ' a minute after ' + PICKUP_GRACE + ' minutes')]
        ],
        optional: false,
        clauses: [
          { h: 'Cancelling a class',
            p: 'Cancel in the portal at least ' + R.cancelNotice + ' before the class and your ' +
               'child gets a make-up.' },
          { h: 'Later than that, or a no-show',
            p: R.lateCancel + ' There is nothing left to book and nothing to claim back.' },
          { h: 'Taking a make-up',
            p: 'Take it in ' + lower(R.makeupWhere) +
               ' It has to be used inside the studio’s make-up window — ' +
               R.makeupWindow + ' — and after that it is gone. A make-up cannot ' + neverList() +
               '.' },
          { h: 'Freezing a plan',
            p: R.freeze },
          { h: 'Drop-off and pick-up',
            p: 'Children are dropped off and collected at the studio door by a parent or ' +
               'guardian. There are ' + PICKUP_GRACE + ' minutes grace at both ends; after ' +
               'that a late fee of ' + money(PICKUP_RATE) + ' per minute is invoiced. A late ' +
               'arrival joins for the remaining time only.' },
          { h: 'Health',
            p: 'Children with a cough, a runny nose or any other sign of illness stay home — ' +
               'tell us as soon as you know, and if that is more than ' + R.cancelNotice +
               ' before the class there is a make-up. The studio is cleaned and disinfected ' +
               'before, during and after every class.' },
          { h: 'Accidents and lost belongings',
            p: 'You release The Grove Art Studio LLC, its owners, staff and instructors from ' +
               'liability for injuries, accidents or lost belongings during studio activities, ' +
               'and you confirm you have told us about anything affecting your child’s ' +
               'participation.' }
        ]
      };
    }

    if (d.id === 'd5') {
      var held = andList(covers(d).map(function (s) {
        return first(s) + ' (' + (s.flag || 'nothing on file') + ')';
      }));
      return {
        line: 'What the studio holds about ' + who + ', and who we ring in an emergency.',
        summary: 'The allergies and conditions the studio keeps by the door, your permission ' +
          'for staff to get emergency treatment if we cannot reach you, and the rule that ' +
          'nobody gives a child medication without your written say-so.',
        facts: [
          ['Emergency contact', esc(f.guardian)],
          ['Number we ring', esc(f.phone)]
        ],
        optional: false,
        clauses: [
          { h: 'What the form holds',
            p: 'Allergies, conditions and the emergency contact you gave when you registered. ' +
               'Today it holds ' + held + '.' },
          { h: 'In an emergency',
            p: 'Staff act immediately and call 911 if it is needed. We then ring ' + f.guardian +
               ' on ' + f.phone + ', which is the number on your family record.' },
          { h: 'Emergency treatment',
            p: 'If we cannot reach you in time, this form allows studio staff to get emergency ' +
               'medical treatment for your child.' },
          { h: 'Medication',
            p: 'Staff cannot give a child medication without your written permission. Signing ' +
               'this form is that permission, for the medication named on it.' },
          { h: 'Keeping it right',
            p: 'Keeping allergies, conditions and phone numbers up to date is yours to do. ' +
               'Message the studio and we change it the same day.' }
        ]
      };
    }

    return {
      line: 'Whether photographs of ' + who + ' may be used by the studio.',
      summary: 'It is entirely your choice. Saying yes lets the studio use pictures taken in ' +
        'class, at camp and at studio events on its website, on Instagram and in print. ' +
        'Saying no changes nothing about ' + who + '’s place in class, and you can change ' +
        'your mind either way at any time.',
      facts: [],
      optional: true,
      clauses: [
        { h: 'What you are agreeing to',
          p: 'That photographs of ' + who + ' taken during classes, camps and studio events ' +
             'may be used by the studio.' },
        { h: 'Where the photos appear',
          p: 'On the studio website and Instagram, and in printed material such as a term ' +
             'flyer. A child is never named alongside a photograph.' },
        { h: 'It is your choice',
          p: 'Saying no changes nothing about ' + who + '’s place in class, or anything else ' +
             'the studio does.' },
        { h: 'The photo we keep either way',
          p: 'A profile photo stays on ' + who + '’s record whatever you decide here, so that ' +
             'the teacher at the door knows who they are collecting.' },
        { h: 'Changing your mind',
          p: 'You can change your mind at any time by messaging the studio. We stop using new ' +
             'pictures straight away and take down what we reasonably can.' }
      ]
    };
  }

  /* A document the studio has reissued has changed; a first version has not.
     The version is never shown — it only chooses the heading. */
  function aboutTitle(d) {
    return !d.signed && d.version !== 'Version 1' ? 'What has changed' : 'What this covers';
  }

  /* Clause heading over clause text, the way the registration flow sets out
     the same policies. */
  function prose(list) {
    return h`<div class="stack">${raw(list.map(function (c) {
      return h`<div class="stack stack--sm"><p class="strong">${c.h}</p><p>${c.p}</p></div>`;
    }).join(''))}</div>`;
  }

  /* The same card on both screens: a parent who is unsure should be able to
     see, without scrolling off the page, that ringing a person is allowed.
     The buttons in the sticky bar are kept short on purpose — a phone frame
     is 430px wide and a button cannot wrap, so a long label would push the
     bar off the side of the screen. */
  function helpCard(text) {
    return ui.card({
      title: 'If you are not sure',
      foot: ui.btn({ label: 'Message the studio', to: 'fMessages' })
    }, h`<p class="hint">${text}</p>`);
  }

  function sections(blocks) {
    return blocks.filter(function (b) { return !!b; }).map(function (b, i) {
      return i ? '<div class="section">' + b + '</div>' : b;
    }).join('');
  }

  /* ---- the list -------------------------------------------------------------
     Two groups, named in words. Anything waiting is first, at full size, with
     its own button; anything signed is quiet underneath — the name and the
     day it was signed. */

  Grove.screen('fDocuments', {
    surface: 'family',
    crumbTitle: 'Documents',
    eyebrow: function () {
      return outstanding().length ? 'still to sign' : 'signed and on file';
    },
    title: 'Documents',
    sub: function () {
      var n = outstanding().length;
      if (!n) return 'Everything the studio needs from you is signed. Your copies are kept here.';
      return (n === 1 ? 'One document needs' : n + ' documents need') +
        ' your signature. Everything else is signed and kept here for you.';
    },
    /* Signing is not a header action: with two documents waiting, one button
       in the corner can only guess which one you meant. The bar at the foot of
       the page names the first one. */
    actions: [
      { label: 'Ask a question', to: 'fMessages' }
    ],

    body: function () {
      var waiting = outstanding();
      var kept = onFile();

      if (!D.DOCUMENTS.length) {
        return ui.card({ flush: true },
          ui.empty('Nothing on file yet', 'Anything you sign is kept here.'));
      }

      var toSign = waiting.length
        ? ui.card({
            title: 'Waiting for your signature',
            flush: true,
            note: 'Read it through first — the next page shows you the whole document.'
          }, ui.rows(waiting.map(function (d) {
            return {
              title: esc(d.name),
              sub: esc(meta(d).line),
              end: ui.btn({ label: 'Read and sign', kind: 'primary', to: 'fDocument', id: d.id })
            };
          })))
        : ui.notice({
            kind: 'ok',
            title: 'Nothing needs your signature',
            text: 'Everything the studio has asked for is signed. If something changes, it ' +
                  'appears here and we ask you again.'
          });

      var signed = kept.length
        ? ui.card({
            title: 'Signed and on file',
            head: ui.btn({
              label: 'Download copies',
              kind: 'quiet',
              size: 'sm',
              msg: kept.length + ' signed document' + (kept.length === 1 ? '' : 's') + ' downloaded'
            }),
            flush: true,
            note: 'Open any of these to read it again or take a copy away.'
          }, ui.rows(kept.map(function (d) {
            return {
              title: esc(d.name),
              sub: esc(signedLine(d)),
              to: 'fDocument',
              id: d.id
            };
          })))
        : '';

      var help = helpCard('Ring the desk on ' + DESK + ' and we will read anything here out to ' +
        'you, or send a message and we will write back. Nothing is signed until you press the ' +
        'button yourself.');

      /* The bar is pinned to the bottom of the viewport, so the one thing a
         parent came to do is on screen before they scroll and after it. It
         names the document rather than saying "sign", which would leave them
         guessing which of the two they were about to open. */
      var bar = '';
      if (waiting.length) {
        var rest = waiting.length - 1;
        bar = ui.formActions([
          {
            label: 'Read and sign ' + waiting[0].name,
            kind: 'primary',
            to: 'fDocument',
            id: waiting[0].id
          }
        ], {
          sticky: true,
          hint: rest
            ? rest + ' more after this one'
            : 'The only one waiting'
        });
      }

      return sections([toSign, signed, help]) + bar;
    }
  });

  /* ---- one document -----------------------------------------------------------
     A letter, not a record card. A line at the top saying whether this still
     needs the parent and where the button is, the whole text beside a plain
     summary, and the signing action in a bar pinned to the bottom. */

  var docDef = {
    surface: 'family',
    crumbs: [{ label: 'Documents', to: 'fDocuments' }],
    eyebrow: function (ctx) {
      return current(ctx).signed ? 'signed and on file' : 'waiting for your signature';
    },
    title: function (ctx) { return current(ctx).name; },
    /* One sentence saying what the parent is about to read. The version and
       the day it was published used to sit here; neither changes what a
       parent can do with the page. */
    sub: function (ctx) { return meta(current(ctx)).line; },
    actions: function (ctx) {
      var d = current(ctx);
      var list = [{ label: 'Ask a question', to: 'fMessages' }];
      if (d.signed) {
        list.push({ label: 'Download a copy', kind: 'primary', msg: d.name + ' downloaded' });
      }
      return list;
    },

    body: function (ctx) {
      var d = current(ctx);
      var m = meta(d);

      var lead;
      if (d.signed) {
        lead = ui.notice({
          kind: 'ok',
          title: signedLine(d),
          text: 'There is nothing to do here. We keep your copy, and Download a copy at the ' +
                'top of the page sends you another one.'
        });
      } else if (m.optional) {
        /* Saying no is a real answer to a permission, so the line at the top
           says so rather than leaning on the parent to sign. */
        lead = ui.notice({
          kind: 'warn',
          title: 'This one is waiting for your answer',
          text: 'Read it through. Yes and no are both fine, and the two buttons stay at the ' +
                'bottom of the screen the whole way down.'
        });
      } else {
        lead = ui.notice({
          kind: 'warn',
          title: 'This one still needs your signature',
          text: 'Read it through. The Sign this document button stays at the bottom of the ' +
                'screen the whole way down, and nothing changes for your classes while you ' +
                'decide.'
        });
      }

      var full = ui.card({
        title: 'The full text',
        note: d.signed
          ? 'This is what you agreed to. A copy went to your email the day you signed.'
          : 'This is the whole document. There is nothing hidden behind a link.'
      }, m.clauses.length
        ? prose(m.clauses)
        : ui.empty('No text on file', 'Ask the studio and we will send you a copy.'));

      /* The summary in sentences, and under it the two or three figures a
         parent rings the desk about. Both are read from the dataset, so a
         figure here is the figure the studio charges. */
      var told = h`<div class="stack stack--sm">
        <p>${m.summary}</p>
        <p>${'It is about ' + coverNames(d) + '.'}</p>
      </div>`;
      var aboutBody = m.facts && m.facts.length
        ? h`<div class="stack">${raw(told)}${raw(ui.kv(m.facts))}</div>`
        : told;

      var about = ui.card({
        title: aboutTitle(d),
        note: 'If the studio ever changes this, we will ask you to read it again.'
      }, aboutBody);

      var help = helpCard('Ring the desk on ' + DESK + ' and we will talk it through, or send ' +
        'a message and we will write back.' +
        (d.signed ? '' : ' Nothing is signed until you press the button yourself.'));

      var bar = '';
      if (!d.signed) {
        /* A photo permission is a question a parent is allowed to answer no
           to, so no is a button of its own rather than something they have to
           work out. The rest cannot be refused, only asked about, so their
           second button simply leaves the page. */
        var second = m.optional
          ? {
              label: 'No thank you',
              msg: 'Told the studio — nothing changes for ' + coverNames(d) + ' in class'
            }
          : { label: 'Not now', to: 'fDocuments' };

        bar = ui.formActions([
          {
            label: 'Sign this document',
            kind: 'primary',
            msg: d.name + ' signed · a copy is on its way to your email'
          },
          second
        ], {
          sticky: true,
          hint: m.optional ? 'Either answer is fine' : 'We email you a copy'
        });
      }

      return sections([lead, ui.grid('sidebar', [full, ui.col([about, help])])]) + bar;
    }
  };

  /* The last crumb has to name the document, and the shell reads crumbTitle
     as a value rather than calling it, so it is defined as a getter. */
  Object.defineProperty(docDef, 'crumbTitle', {
    get: function () { return current({ params: Grove.state.params }).name; }
  });

  Grove.screen('fDocument', docDef);
})();
