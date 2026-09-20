/* Family → Documents, and one document.

   Written for a parent who is not confident with a screen: one question per
   page, the action always in view, and a way to ask a person on both screens.

   Reworked to match the Schedule pass:
     - the list was one five-column table — Document, Published, Signed,
       Status, button — which asks a parent to read a grid to find out whether
       anything needs them. It is now two plainly named groups: "Waiting for
       your signature", with a full-size Read and sign button on each row, and
       "Signed and on file", which is quiet: the name and the day you signed
       it, nothing else
     - the list carries a sticky action bar naming the first document
       outstanding ("Read and sign Payment terms"), so the one thing a parent
       came to do is on screen before they scroll and after they scroll. Its
       hint counts what is left after it. One button, not two: a phone frame
       is 430px wide and a button cannot wrap, so a second one pushed the
       hint off the side of the screen
     - the document page led with "Version 4 · published 1 July 2026" and
       closed with a Signature card reading Status / Signed by / Applies to.
       That is the studio's filing card, not a letter. The subtitle now says
       in one sentence what the document is about, a notice says whether it
       still needs the parent and where the button is, and who it applies to
       is a sentence in the summary card
     - the signing action moved out of the page header into a sticky bar, the
       complaint that started this pass. It reads "Sign this document",
       because by then the parent is on the page and reading it
     - a photo permission is optional, so its line at the top says it is
       waiting for an answer rather than a signature, and its bar offers "No
       thank you" as an equal second button rather than leaving refusing as
       something a parent has to work out for themselves. The three documents
       nobody can decline offer "Not now" and the desk number instead
     - both screens carry an "If you are not sure" card with the desk number.
       The number is the one Console → Settings says families see;
       screens/family/schedule.js printed a different one, so one of the two
       is wrong and it is not this file's to change

   Rewritten again for the corrected billing model. The studio does not bill by
   the calendar: a family buys a pack of sessions for one child, the child
   attends, and when the last session in the pack is used the pack renews — it
   charges again and grants another pack the same size. So:
     - the payment clauses no longer say tuition is billed on the 1st, or that
       a payment holds a place for the month. They say what a pack costs, that
       a pack belongs to one child, and that it renews on the last session.
       The prices are read from PRICING and the pack sizes from the family's
       own children, so the document quotes the same figures the studio keeps
     - the make-up credit is deleted, not renamed. A session cancelled more
       than 24 hours ahead is simply not spent, so there is nothing to issue,
       nothing to approve and nothing to expire. A family that wants to catch
       a class up books an extra class, which spends a session like any other
     - sessions do not expire, so the clause about classes left over at the end
       of a paid month has gone, and with it the 30 days written notice. A
       family is not a member and does not cancel: they use the sessions they
       have paid for and the pack does not renew

   Removed, and why a parent does not need it:
     - version numbers everywhere. "Version 4" is how the studio files its
       paperwork. The one date kept on each row is the one a parent can act
       on: the day they signed it, or, for a document still waiting, nothing
       at all — it is waiting now
     - the Published column. Only the current version can be signed, so the
       day it was written changes nothing a parent can do
     - the Status column and the Signed / Not signed pills. Which group a
       document is in says the same thing in words
     - the Signature card's Status and Signed by rows. The page already says
       both, in a sentence, at the top
     - every make-up, credit and expiry from the clause text as well as the
       screen furniture. A session a parent told us about in time was never
       spent, so there is nothing to keep a record of

   Kept although it looks like clutter:
     - the full clause text of every document, including the ones already
       signed. A parent being asked to agree to something must be able to read
       all of it without ringing anyone, and a parent who signed last year
       must be able to check what they agreed to
     - the allergy line in the medical form ("Emma (Allergy · peanuts)"). It
       is read from the children's records and it is the one thing on that
       form a parent must check is right
     - the emergency number and the guardian name in the medical clauses, for
       the same reason
     - the $25 late fee, the 7-day grace, the $1 a minute after 10 minutes,
       the 30 days notice and the registration fee. They are what the parent
       is agreeing to, so they are quoted from the same named figures Console
       → Settings uses */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  /* The signed-in parent is the Johnson household. */
  var FAMILY = 'Johnson';

  /* The studio's number, as Console → Settings gives it to families. */
  var DESK = D.STUDIO.phone;

  /* Amounts and windows Grove.data does not hold. They are named here for the
     same reason Console → Settings names them: the clause text and the
     summary above it then quote one figure, and the wording matches the
     policy text in screens/registration/flow.js verbatim. */
  var GRACE_DAYS = 7;          // "due within 7 days"
  var LATE_FEE = 25;           // "a $25 late fee"
  var PICKUP_GRACE = 10;       // "10 minutes grace"
  var PICKUP_RATE = 1;         // "a late fee of $1 per minute"
  var CANCEL_HOURS = 24;       // "at least 24 hours before the class"

  var P = D.PRICING;

  function money(n) { return Grove.money(n, { cents: false }); }

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

  /* What the household's packs cost, said as a sentence. The size comes from
     the child's own record and the price from the studio's rate card, so the
     document cannot quote a figure the studio does not charge. A child who
     only does camp and one-off bookings holds no pack and is left out. */
  function packPrice(size) {
    return P.as.plans['p' + size];
  }
  function packKids() {
    return kids().filter(function (s) {
      var p = D.pack(s);
      return p.isPack && packPrice(p.size);
    });
  }
  function packPrices() {
    return andList(packKids().map(function (s) {
      var p = D.pack(s);
      return first(s) + '’s pack of ' + p.size + ' is ' + money(packPrice(p.size));
    }));
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
     `optional` a permission a parent is free to refuse, which changes the
                second button on the signing bar from "Not now" to a real
                answer */

  function meta(d) {
    var who = coverNames(d);
    var f = household();

    if (d.id === 'd1') {
      var prices = packPrices();
      return {
        line: 'What a pack of sessions costs, when it renews, and what happens if a payment ' +
          'is late.',
        summary: 'The studio has rewritten this one. What is different: a ' + money(LATE_FEE) +
          ' late fee once the ' + GRACE_DAYS + ' days are up, how many times we try a card ' +
          'that has failed, that sessions you have paid for never expire, and that stopping ' +
          'is simply a pack not renewing.',
        optional: false,
        clauses: [
          { h: 'What you buy, and when it renews',
            p: 'You buy a pack of sessions for a child, and the pack is charged when you buy ' +
               'it. ' + (prices ? prices + '. ' : '') + 'There is no billing date: when the ' +
               'last session in a pack is used, the pack renews — it charges again and gives ' +
               'you another pack the same size. A pack belongs to one child, so each child’s ' +
               'pack renews on their own last session and is charged on its own.' },
          { h: 'If a payment is late',
            p: 'Payment is due within ' + GRACE_DAYS + ' days. After that a ' + money(LATE_FEE) +
               ' late fee is added to your account. A child is not admitted to class before ' +
               'the pack is paid for.' },
          { h: 'If a card fails',
            p: 'We try the card again on day 1, day 3 and day 7. After the third try someone ' +
               'rings you — your child’s place is never cancelled silently.' },
          { h: 'Refunds, and sessions you have not used',
            p: 'Payments are not refundable. Sessions do not expire: a pack is paid for, so ' +
               'every session in it stays with your child until it is used, however long that ' +
               'takes. Sessions cannot be passed to a brother or sister.' },
          { h: 'The registration fee',
            p: 'A one-time registration fee of ' + money(P.as.regFee) + ' per child covers ' +
               'materials and software, and it is not refundable. Siblings get ' +
               P.as.siblingRelief + '.' },
          { h: 'If you stop',
            p: 'Tell us, by message in the portal or by email, and the pack does not renew. ' +
               'You take the sessions you have already paid for and nothing further is ' +
               'charged. There is no notice period and nothing to cancel.' }
        ]
      };
    }

    if (d.id === 'd2') {
      return {
        line: 'Cancelling a class, drop-off and pick-up, and when to keep a poorly child at home.',
        summary: 'The rules that come up most: how much notice we need when a class is going ' +
          'to be missed, what happens to the session when you tell us in time, and the few ' +
          'minutes grace at the door. The last paragraph is the one about accidents and lost ' +
          'belongings.',
        optional: false,
        clauses: [
          { h: 'Cancelling a class',
            p: 'Tell us at least ' + CANCEL_HOURS + ' hours before the class, in the portal, ' +
               'and the session stays in your child’s pack — the pack simply lasts a week ' +
               'longer. Inside ' + CANCEL_HOURS + ' hours the session is spent, exactly as if ' +
               'they had come.' },
          { h: 'Catching a class up',
            p: 'If you would rather catch the class up than let the pack run on a week, book ' +
               'an extra class in the portal, in any class that suits your child’s age and has ' +
               'room. It spends a session from their pack like any other class, and a booked ' +
               'extra class that is then missed is spent in the same way.' },
          { h: 'Drop-off and pick-up',
            p: 'Children are dropped off and collected at the studio door by a parent or ' +
               'guardian. There are ' + PICKUP_GRACE + ' minutes grace at both ends; after ' +
               'that a late fee of ' + money(PICKUP_RATE) + ' per minute is invoiced. A late ' +
               'arrival joins for the remaining time only.' },
          { h: 'Health',
            p: 'Children with a cough, a runny nose or any other sign of illness stay home — ' +
               'tell us as soon as you know, and if that is more than ' + CANCEL_HOURS +
               ' hours before the class the session stays in their pack. The studio is cleaned ' +
               'and disinfected before, during and after every class.' },
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
    /* Signing is not a header action any more: with two documents waiting,
       one button in the corner can only guess which one you meant. The bar at
       the foot of the page names the first one. */
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

      var about = ui.card({
        title: aboutTitle(d),
        note: 'If the studio ever changes this, we will ask you to read it again.'
      }, h`<div class="stack stack--sm">
        <p>${m.summary}</p>
        <p>${'It is about ' + coverNames(d) + '.'}</p>
      </div>`);

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
