/* Console → Programs, and the program builder.

   What was cut, and why — the client asked us to stop adding custom rules:

   PROGRAMS (the list)
     - The old cards carried a status pill ("Enrolling", "Running", "1 open")
       and three figures each (enrolled, a per-program unit, MTD revenue).
       None of that exists in Grove.data, so it is gone. A card now says who
       the program is for, what it costs (read from PRICING), how full it is
       and how many classes run it (both counted from CLASSES).
     - "Copy a program" no longer opens a form. Its four selects — classes and
       times, pricing and plans, age ranges and capacity, policies — each had
       one sensible answer, copy it, and its fifth field was a text input used
       only to display an immutable rule. The button now copies, and the
       confirmation says what did not come with it.
     - "New program" opened a second, unreachable form that duplicated the
       builder. Dropped. The builder is the one place a program is written.

   PROGRAM BUILDER
     - 25 controls are now 5. Kept: program name, what families should know,
       age bands, session length, places per class.
     - Cut to stated facts: colour (set once, stated in the Identity note);
       term, start, end, runs-on and rooms (now the "How it runs" card, read
       from CLASSES); the eight Billing controls and the four Make-up controls
       (now one "Standing rules" card — the answer was the same for every
       program, so it is written once in Settings).
     - Cut outright: the two capacity switches, "Show remaining places
       publicly" and "Offer waitlist when full", which were on for everything
       and are now the stated default; the nine policy toggle chips, which
       were all on and are required, and are now listed as attached.
     - The plans table lost its four per-row "Edit" links, which all opened
       the same record. Its "Add-on / hr" column is now "Extra class", which
       is what PRICING.as.extraClassRate actually holds.
     - Every card opens this one builder, as the previous build did.

   FIXED AFTER VISUAL REVIEW
     - The facts now sit at the top of each program card and the description
       sits underneath as the card note, so the hairline between two kv rows
       lands at the same y in every card of a row. Previously a two- or
       three-line description above the facts pushed that rule up and down.
     - The No-School Day price line was the width of the whole row. It now
       reads the way registration reads it, "$100 a day, then $28 an hour".
     - The badge PNGs are gone. The wordmark inside them was an illegible
       smudge at 32px and two of the six are off-palette. A program is marked
       the way it is marked on every other screen: ui.dot(program.color).
     - The builder's two form cards now carry the same number of hint lines in
       the same rows, so their fields line up across the page and the shorter
       card no longer holds a 70px blank band.
     - The Eligibility note lost a changelog sentence about "two switches"
       that meant nothing to a studio owner, and an invented waitlist length.
     - "1 hour and 2 hour" is now "1 hour or 2 hours".
     - The schedule card no longer prints a term, a start and an end date. It
       said "Starts 17 Aug 2026" of a program whose five classes are running
       now, carry attendance, and gave up make-up credits in July. Grove.data
       holds no term calendar to read those dates from, and the card's own
       note already says the calendar is kept in Settings — so the card now
       states only what the class rows say: the days, the number of classes a
       week, the rooms, who teaches them and how full they are. Registration
       still opens the autumn year on 17 Aug; nothing here contradicts it. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  var ORDER = ['as', 'camp', 'nsd', 'priv', 'bday', 'pop'];

  /* What each program is, in the same words families are shown at
     registration. Kept character-for-character identical to the copy in
     screens/registration/pick.js on purpose. */
  var BLURB = {
    as: 'A fixed weekly place across the school year, billed month to month. Four to sixteen sessions a month, split how you like.',
    camp: 'Full days of making through the summer and school breaks. Take a whole week or pick individual days.',
    nsd: 'For teacher workdays and county holidays. Three hours as standard, extend by the hour if you need to.',
    priv: 'One-to-one time with an instructor, on a subject your child chooses. Up to three hours in a session.',
    bday: 'A party built round a theme and a project, picked from forty-four activities. Tell us what you want and we will price it.',
    pop: 'One-off evenings for a single project. Clay Night is the next one, and it is nearly gone.'
  };

  function uniq(list) {
    var out = [];
    list.forEach(function (v) { if (v && out.indexOf(v) === -1) out.push(v); });
    return out;
  }

  function classesOf(id) {
    return D.CLASSES.filter(function (c) { return c.prog === id; });
  }

  function priceLine(id) {
    var p = D.PRICING[id];
    if (p.quoteOnly) return 'Quoted per party';
    if (id === 'as') {
      return Grove.money(p.plans.p4, { cents: false }) + ' to ' +
        Grove.money(p.plans.p16, { cents: false }) + ' a month';
    }
    if (id === 'camp') {
      return Grove.money(p.week, { cents: false }) + ' a week, or ' +
        Grove.money(p.day, { cents: false }) + ' a day';
    }
    if (id === 'nsd') {
      return Grove.money(p.base, { cents: false }) + ' a day, then ' +
        Grove.money(p.extraHour, { cents: false }) + ' an hour';
    }
    if (id === 'priv') {
      return Grove.money(p.hourly, { cents: false }) + ' an hour, up to ' + p.maxHours + ' hours';
    }
    return Grove.money(p.events[0].amount, { cents: false }) + ' a ticket';
  }

  function feeLine(id) {
    var fee = D.PRICING[id].regFee;
    return fee ? Grove.money(fee, { cents: false }) : 'None';
  }

  function agesLine(id) {
    return uniq(classesOf(id).map(function (c) { return c.band; })).join(' · ');
  }

  /* Summed from the same class rows the card footer counts, so this card, the
     Classes screen and Reports → Programs cannot disagree. */
  function placesLine(id) {
    var en = 0, cap = 0;
    classesOf(id).forEach(function (c) { en += c.en; cap += c.cap; });
    return en + ' of ' + cap + (cap === 1 ? ' place' : ' places');
  }

  /* ---- programs ----------------------------------------------------------- */

  Grove.screen('programs', {
    surface: 'console',
    eyebrow: 'what you run',
    title: 'Programs',
    sub: 'Six programs. Open one to change its price, ages and description.',
    actions: [
      { label: 'Copy a program', msg: 'Program copied · classes created, nobody enrolled' },
      { label: 'New program', kind: 'primary', to: 'programBuilder' }
    ],

    body: function () {
      return ui.grid(3, ORDER.map(function (id) {
        var p = D.program(id);
        var n = classesOf(id).length;
        return ui.card({
          title: p.name,
          head: ui.dot(p.color),
          note: BLURB[id],
          foot: '<span class="mute">' + esc(n === 1 ? '1 class running' : n + ' classes running') + '</span>' +
            ui.btn({ label: 'Open', kind: 'quiet', size: 'sm', to: 'programBuilder' })
        }, ui.kv([
          ['Ages', esc(agesLine(id))],
          ['Price', esc(priceLine(id))],
          ['Registration fee', esc(feeLine(id))],
          ['Enrolled', esc(placesLine(id))]
        ]));
      }));
    }
  });

  /* ---- program builder ----------------------------------------------------- */

  var PLAN_KEYS = ['p4', 'p8', 'p12', 'p16'];

  /* How a family may spread the sessions they have bought. One session is one
     hour, which is what the plan keys count. */
  var PLAN_PATTERN = {
    p4: 'One 1-hour class per week',
    p8: 'One 2-hour, or two 1-hour',
    p12: 'Three 1-hour, or 2-hour + 1-hour',
    p16: 'Four 1-hour, two 2-hour, or mixed'
  };

  var POLICIES = [
    'Important facts', 'Class scheduling', 'Make-ups & cancellations',
    'Drop-off & pick-up', 'Health & safety', 'Medical emergencies',
    'Payment terms', 'Release of liability', 'Agreement'
  ];

  /* "2 hour" is how the class name spells it; a select should not. */
  function hoursLabel(t) {
    return t.indexOf('1 ') === 0 ? t : t + 's';
  }

  Grove.screen('programBuilder', {
    surface: 'console',
    crumbs: [{ label: 'Programs', to: 'programs' }],
    eyebrow: 'building a program',
    title: D.program('as').name,
    sub: 'The program’s dates, pricing, plans and policies, in one place.',
    actions: [
      { label: 'Save changes', kind: 'primary', act: 'saveProgram' }
    ],

    body: function () {
      var p = D.program('as');
      var P = D.PRICING.as;
      var cls = classesOf('as');

      var bands = uniq(cls.map(function (c) { return c.band; })).join(' · ');
      var lengths = uniq(cls.map(function (c) { return String(c.name).split(' · ')[0]; })).map(hoursLabel);
      var length = lengths.length > 1
        ? lengths.slice(0, -1).join(', ') + ' or ' + lengths[lengths.length - 1]
        : lengths[0];
      var lengthOptions = lengths.concat(lengths.length > 1 ? [length] : []);
      var places = uniq(cls.map(function (c) { return String(c.cap); })).join(' / ');
      var days = uniq(cls.map(function (c) { return c.day; })).join(', ');
      var rooms = uniq(cls.map(function (c) { return c.room; })).join(', ');
      var teachers = uniq(cls.map(function (c) { return c.staff; })).join(', ');

      /* Identity and Eligibility are one ui.grid(2) row, so they stretch to a
         shared height. They are built to need the same height: one hint line
         each, in the last field of each card, and a note of the same length.
         That is what keeps the field rows level across the page. */
      var identity = ui.card({
        title: 'Identity',
        note: 'The colour beside this program — on every tag, dot and calendar entry — is set when the program is created and is not changed here.'
      }, ui.fields(null, [
        ui.field({
          label: 'Program name',
          control: ui.input({ value: p.name })
        }),
        ui.field({
          label: 'What families should know',
          control: ui.textarea({
            value: BLURB.as,
            placeholder: 'One or two sentences for the registration page'
          }),
          hint: 'Shown to families on the registration page.'
        })
      ]));

      var who = ui.card({
        title: 'Eligibility and capacity',
        note: 'Every program handles a full class the same way: the family joins the waitlist rather than being turned away, and registration shows how many places are left.'
      }, ui.fields(null, [
        ui.field({
          label: 'Age bands',
          control: ui.select({ value: bands, options: [bands, 'No age grouping'] })
        }),
        ui.field({
          label: 'Session length',
          control: ui.select({ value: length, options: lengthOptions })
        }),
        ui.field({
          label: 'Places per class',
          control: ui.input({ value: places }),
          hint: 'Read from the classes already running.'
        })
      ]));

      var planRows = PLAN_KEYS.map(function (k) {
        var sessions = k.slice(1);
        return {
          cells: [
            '<span class="cell-strong">' + esc(sessions + ' sessions / month') + '</span>',
            '<span class="strong">' + esc(Grove.money(P.plans[k], { cents: false })) + '</span>',
            esc(sessions),
            esc(Grove.money(P.extraClassRate[k])),
            '<span class="mute">' + esc(PLAN_PATTERN[k]) + '</span>'
          ]
        };
      });

      var plans = ui.card({
        title: 'Plans',
        head: ui.btn({ label: 'Add a plan', kind: 'quiet', size: 'sm', msg: 'Prototype — no form yet' }),
        flush: true,
        foot: '<span class="strong">Registration fee ' +
          esc(Grove.money(P.regFee, { cents: false })) + ' — one-time, per child</span>' +
          '<span class="mute">' + esc(P.siblingRelief) + '</span>'
      }, ui.table(
        [
          'Plan',
          { label: 'Price', align: 'right' },
          { label: 'Sessions', align: 'right' },
          { label: 'Extra class', align: 'right' },
          'Weekly pattern'
        ],
        planRows
      ));

      var when = ui.card({
        title: 'How it runs',
        note: 'The term calendar is kept in Settings and the sessions themselves live under Classes, so every line here is read from the classes this program is running, not typed again.'
      }, ui.kv([
        ['Runs on', esc(days)],
        ['Classes a week', esc(String(cls.length))],
        ['Rooms', esc(rooms)],
        ['Instructors', esc(teachers)],
        ['Enrolled', esc(placesLine('as'))]
      ]));

      var rules = ui.card({
        title: 'Standing rules',
        note: 'Written once in Settings and applied to every program. Twelve controls used to sit on this page; the answer was the same each time, so they are stated instead.'
      }, ui.kv([
        ['Billing', 'Recurring monthly, on the 1st'],
        ['Grace period', '7 days, then a $25 late fee'],
        ['Cancellation notice', '30 days'],
        ['Refunds', 'Non-refundable, credit only'],
        ['Make-up credits', 'Cancel 24 hours ahead; the credit expires at the end of the billing cycle'],
        ['Bookable into', 'Any age-appropriate class']
      ]));

      var policies = ui.card({
        title: 'Required policies',
        note: 'Written once in Settings and attached to every program. A family signs each one only when it is new to them or has changed.'
      }, h`<div class="inline">${raw(POLICIES.map(function (name) {
        return ui.pill(name, 'ok');
      }).join(''))}</div>`);

      return ui.grid(2, [identity, who]) +
        '<div class="section">' + plans + '</div>' +
        '<div class="section">' + ui.grid(2, [when, rules]) + '</div>' +
        '<div class="section">' + policies + '</div>';
    }
  });

  Grove.on('saveProgram', function () {
    Grove.go('programs');
    Grove.toast('Program saved');
  });
})();
