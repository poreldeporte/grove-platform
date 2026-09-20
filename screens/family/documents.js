/* Family → Documents, and one document.

   Simplifications against the previous build:
     - six hand-styled rows, each carrying its own background, border and
       button colour, are one table: Document, Published, Signed, Status.
       Every row is built the same way, so every row reads the same way
     - a "View" button on every signed row only repeated the row it sat in.
       The row is the link, and a button is kept for the one thing that
       actually needs doing — signing
     - the withdraw-photo-permission confirm dialog, its four bullets and its
       audit-log footer are gone. Withdrawing consent is a conversation, and
       "Ask a question" already opens one
     - the document page drops its status chip and its "Back to documents"
       button: the Signature card already states the status, and the shell's
       breadcrumb already goes back
     - data.js keeps five documents where the old build had six: the release,
       the make-up rules and the drop-off rules are one "Studio policies"
       document, so those three read as one set of clauses
     - the subtitle and the notice count the outstanding documents rather
       than asserting "one", because the data has two unsigned
     - "What changed" is used only for an unsigned revision. A version 1 form
       nobody has signed has not changed, so it says what it covers instead
     - the document page's eyebrow is the handwritten portal line rather than
       the word "Document", which the breadcrumb already says.

   After the visual review:
     - the document page now carries the document. It was asking a parent to
       sign a page that showed a three-line summary and nothing else, which
       was also why half of it was empty. The clauses are held in this file,
       worded to agree with the policy text in the registration flow and the
       figures in Console → Settings
     - that text is the wide half of ui.grid('sidebar'), with the summary and
       the signature stacked beside it in a ui.col, so neither column ends in
       a hole. Both right-hand cards carry a note, which pins to the bottom
     - the Signature card no longer repeats "Version 4 · published 1 July
       2026" from the page subtitle 165px above it. It says who the document
       applies to instead, read from the family's children
     - "Studio policies" used to say late pick-up is charged after fifteen
       minutes. Every other screen says a ten-minute grace and $1 a minute
       after it, so the document said the wrong thing to the one person who
       is being asked to agree to it. The figures are now named constants,
       the same ones Settings uses
     - the notice no longer carries a single "Read and sign" button while
       naming two documents — it silently opened the first. Each outstanding
       row carries its own button, which is the only place that action now
       appears, so it is one action at one weight
     - the header carries the two things a parent can do with the whole list,
       the way the document page does: ask, or take a copy away
     - the Status column is one line on every row, so the pills no longer
       step up and down against rows whose status cell was two lines. The
       signer moved to a column of its own. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  /* The signed-in parent is the Johnson household. */
  var FAMILY = 'Johnson';

  /* Amounts and windows Grove.data does not hold. They are named here for the
     same reason Console → Settings names them: the clause text and the
     summary above it then quote one figure, and the wording matches the
     policy text in screens/registration/flow.js verbatim. */
  var GRACE_DAYS = 7;          // "a 7-day grace period"
  var LATE_FEE = 25;           // "a $25 late fee after the seven-day grace"
  var PICKUP_GRACE = 10;       // "a 10-minute grace period"
  var PICKUP_RATE = 1;         // "a late fee of $1 per minute"
  var NOTICE_DAYS = 30;        // "a 30-day written notice is required"
  var CANCEL_HOURS = 24;       // "at least 24 hours prior to class"

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

  /* A revision the studio has reissued has changed; a first version has not. */
  function aboutTitle(d) {
    return !d.signed && d.version !== 'Version 1' ? 'What changed' : 'What this covers';
  }

  /* ---- what each document says ------------------------------------------------
     data.js records what a document is and who signed it, never its text, and
     a screen may not add a field to it, so the text sits here. */

  function summary(d) {
    var who = coverNames(d);
    if (d.id === 'd1') {
      return 'Four things changed in version 4: a ' + money(LATE_FEE) + ' late fee after the ' +
        'seven-day grace, the retry cadence, the ' + NOTICE_DAYS + '-day cancellation notice, ' +
        'and how credits are treated at the end of a cycle.';
    }
    if (d.id === 'd2') {
      return 'One document for the things every family asks about: cancelling a class, ' +
        'using a make-up credit, the grace period at drop-off and pick-up, and when a child ' +
        'is too unwell to come in. It closes with the release of liability.';
    }
    if (d.id === 'd5') {
      return 'What the studio holds for ' + who + ', what staff may and may not administer, ' +
        'and the order we call people in an emergency.';
    }
    return 'Whether photographs of ' + who + ' may be used by the studio. It is optional, ' +
      'it changes nothing about ' + who + '’s place in class, and you can withdraw it at ' +
      'any time.';
  }

  function clausesFor(d) {
    var who = coverNames(d);
    var f = household();

    if (d.id === 'd1') {
      return [
        { h: 'When you are billed',
          p: 'Tuition is billed automatically on the 1st of each month, whatever date you ' +
             'enrolled. It holds your child’s place for that month rather than paying for a ' +
             'set number of classes.' },
        { h: 'The grace period and the late fee',
          p: 'Payment is due within a ' + GRACE_DAYS + '-day grace period. After that a ' +
             money(LATE_FEE) + ' late fee is added to your account. Enrollment is confirmed by ' +
             'payment, and a child is not admitted to class before it is made.' },
        { h: 'If a card fails',
          p: 'We retry on day 1, day 3 and day 7. After the third failure the enrollment is ' +
             'flagged and someone rings you — it is never cancelled silently.' },
        { h: 'Refunds and credits',
          p: 'Payments are not refundable. They can be applied as credit towards the same kind ' +
             'of class within an agreed window. If your last paid month holds fewer classes ' +
             'than a standard one, the classes still owed are issued as make-up credits.' },
        { h: 'The registration fee',
          p: 'A one-time registration fee of ' + money(P.as.regFee) + ' per child covers ' +
             'materials and software, and it is not refundable. Siblings get ' +
             P.as.siblingRelief + '.' },
        { h: 'Leaving',
          p: NOTICE_DAYS + ' days written notice, by message in the portal or by email. ' +
             'Without that notice the account is billed to the end of the school year.' }
      ];
    }

    if (d.id === 'd2') {
      return [
        { h: 'Cancelling a class',
          p: 'Tell us at least ' + CANCEL_HOURS + ' hours before the class, in the portal, and ' +
             'it comes back as a make-up credit. Inside ' + CANCEL_HOURS + ' hours it counts as ' +
             'attended and no make-up is given.' },
        { h: 'Using a make-up credit',
          p: 'A credit is used within the same monthly billing cycle, in any age-appropriate ' +
             'class with space. Credits do not roll over, do not transfer to a sibling, and a ' +
             'booked make-up that is missed is marked as used.' },
        { h: 'Drop-off and pick-up',
          p: 'Children are dropped off and collected at the studio door by a parent or ' +
             'guardian. A ' + PICKUP_GRACE + '-minute grace period applies at both ends; after ' +
             'that a late fee of ' + money(PICKUP_RATE) + ' per minute is invoiced. A late ' +
             'arrival joins for the remaining time only.' },
        { h: 'Health',
          p: 'Children with a cough, a runny nose or any other sign of illness stay home — ' +
             'please use a make-up credit. The studio is cleaned and disinfected before, during ' +
             'and after every class.' },
        { h: 'Release of liability',
          p: 'You release The Grove Art Studio LLC, its owners, staff and instructors from ' +
             'liability for injuries, accidents or lost belongings during studio activities, ' +
             'and you confirm you have told us about anything affecting your child’s ' +
             'participation.' }
      ];
    }

    if (d.id === 'd5') {
      var held = andList(covers(d).map(function (s) {
        return first(s) + ' (' + (s.flag || 'nothing on file') + ')';
      }));
      return [
        { h: 'What the form holds',
          p: 'Allergies, conditions and the emergency contact you gave at registration. Today ' +
             'it holds ' + held + '.' },
        { h: 'In an emergency',
          p: 'Staff act immediately and call 911 if it is needed. We then ring ' + f.guardian +
             ' on ' + f.phone + ', which is the number on the family record.' },
        { h: 'Emergency treatment',
          p: 'If we cannot reach you in time, this form authorises studio staff to seek ' +
             'emergency medical treatment for your child.' },
        { h: 'Medication',
          p: 'Staff cannot administer medication without written authorisation from you. ' +
             'Signing this form is that authorisation, for the medication named on it.' },
        { h: 'Keeping it accurate',
          p: 'Keeping allergies, conditions and contact details current is yours to do. ' +
             'Message the studio and we change it the same day.' }
      ];
    }

    if (d.id === 'd3' || d.id === 'd4') {
      return [
        { h: 'What you are agreeing to',
          p: 'That photographs of ' + who + ' taken during classes, camps and studio events ' +
             'may be used by the studio.' },
        { h: 'Where the photos appear',
          p: 'On the studio website and Instagram, and in printed material such as a term ' +
             'flyer. A child is never named alongside a photograph.' },
        { h: 'It is optional',
          p: 'Permission is optional. Refusing it changes nothing about ' + who + '’s place in ' +
             'class or anything else the studio does.' },
        { h: 'The photo we keep either way',
          p: 'A profile photo stays on ' + who + '’s record whatever you decide here, so that ' +
             'the teacher at the door knows who they are collecting.' },
        { h: 'Withdrawing permission',
          p: 'You can withdraw at any time by messaging the studio. We stop using new images ' +
             'straight away and take down what we reasonably can.' }
      ];
    }

    return [];
  }

  /* Clause heading over clause text, the way the registration flow sets out
     the same policies. */
  function prose(list) {
    return h`<div class="stack">${raw(list.map(function (c) {
      return h`<div class="stack stack--sm"><p class="strong">${c.h}</p><p>${c.p}</p></div>`;
    }).join(''))}</div>`;
  }

  /* ---- the list ------------------------------------------------------------- */

  Grove.screen('fDocuments', {
    surface: 'family',
    crumbTitle: 'Documents',
    eyebrow: 'signed and on file',
    title: 'Documents',
    sub: function () {
      var n = outstanding().length;
      var tail = 'Nothing needs your attention.';
      if (n === 1) tail = 'One needs your attention.';
      if (n > 1) tail = n + ' need your attention.';
      return 'Everything the studio holds for your family, with the date you signed it. ' + tail;
    },
    /* The whole-list equivalents of the two buttons on a single document.
       Signing is not here: with two outstanding, one header button could only
       guess which one you meant, and each row carries its own. */
    actions: function () {
      var kept = onFile().length;
      var list = [{ label: 'Ask a question', to: 'fMessages' }];
      if (kept) {
        list.push({
          label: 'Download signed copies',
          kind: 'primary',
          msg: kept + ' signed document' + (kept === 1 ? '' : 's') + ' downloaded'
        });
      }
      return list;
    },

    body: function () {
      var waiting = outstanding();

      var notice = waiting.length
        ? ui.notice({
            kind: 'warn',
            title: waiting.length === 1
              ? 'One document is waiting for your signature'
              : waiting.length + ' documents are waiting for your signature',
            text: andList(waiting.map(function (d) { return d.name; })) + '. ' +
              (waiting.length === 1
                ? 'It has a Read and sign button in the list below.'
                : 'Each one has its own Read and sign button in the list below.') +
              ' Everything else here is signed and on file.'
          })
        : '';

      /* Every cell on every row is one line except the document itself, so a
         status pill sits at the same height in all five rows. */
      var table = ui.table(
        [
          'Document',
          'Published',
          'Signed',
          { label: 'Status', shrink: true },
          { label: '', shrink: true }
        ],
        D.DOCUMENTS.map(function (d) {
          return {
            to: 'fDocument',
            id: d.id,
            cells: [
              ui.two(d.name, d.version),
              ui.mute(d.published),
              ui.mute(d.who),
              d.signed ? ui.pill('Signed', 'ok') : ui.pill('Not signed', 'bad'),
              d.signed
                ? ''
                : ui.btn({
                    label: 'Read and sign',
                    kind: 'primary',
                    size: 'sm',
                    to: 'fDocument',
                    id: d.id
                  })
            ]
          };
        }),
        { emptyTitle: 'Nothing on file yet', emptyText: 'Anything you sign will be kept here.' }
      );

      return h`${raw(notice)}
        <div class="section">${raw(ui.card({ flush: true }, table))}</div>`;
    }
  });

  /* ---- one document ---------------------------------------------------------- */

  var docDef = {
    surface: 'family',
    crumbs: [{ label: 'Documents', to: 'fDocuments' }],
    eyebrow: function (ctx) {
      return current(ctx).signed ? 'signed and on file' : 'waiting for your signature';
    },
    title: function (ctx) { return current(ctx).name; },
    sub: function (ctx) {
      var d = current(ctx);
      return d.version + ' · published ' + d.published;
    },
    actions: function (ctx) {
      var d = current(ctx);
      return [
        { label: 'Ask a question', to: 'fMessages' },
        d.signed
          ? { label: 'Download a copy', kind: 'primary', msg: d.name + ' downloaded' }
          : {
              label: 'Read and sign',
              kind: 'primary',
              msg: d.name + ' signed · a copy is on its way to your email'
            }
      ];
    },

    body: function (ctx) {
      var d = current(ctx);
      var text = clausesFor(d);

      var full = ui.card({
        title: 'The full text',
        note: d.signed
          ? 'A copy went to your email when you signed. Use Download a copy for another one.'
          : 'Read it through, then use Read and sign at the top of the page. A copy goes to ' +
            'your email straight away.'
      }, text.length
        ? prose(text)
        : ui.empty('No text on file', 'Ask the studio and we will send you a copy.'));

      var about = ui.card({
        title: aboutTitle(d),
        note: d.version === 'Version 1'
          ? 'This is the first version. If the studio changes it, you are asked again.'
          : 'The studio keeps every version it has published. This is the current one.'
      }, h`<p>${summary(d)}</p>`);

      var signature = ui.card({
        title: 'Signature',
        note: d.signed
          ? 'Nothing to do here. If this changes, the studio publishes a new version and asks you again.'
          : 'You can keep attending while this is outstanding — we simply ask at your next sign-in.'
      }, ui.kv([
        { k: 'Status', v: esc(d.signed ? 'Signed' : 'Not signed'), tone: d.signed ? 'grove' : 'clay' },
        { k: 'Signed by', v: esc(d.who), tone: d.signed ? null : 'mute' },
        { k: 'Applies to', v: esc(coverNames(d)) }
      ]));

      return ui.grid('sidebar', [full, ui.col([about, signature])]);
    }
  };

  /* The last crumb has to name the document, and the shell reads crumbTitle
     as a value rather than calling it, so it is defined as a getter. */
  Object.defineProperty(docDef, 'crumbTitle', {
    get: function () { return current({ params: Grove.state.params }).name; }
  });

  Grove.screen('fDocument', docDef);
})();
