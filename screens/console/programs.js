/* Console → Programs, and the program builder.

   What was cut, and why — the client asked us to stop adding custom rules:

   PROGRAMS (the list)
     - The old cards carried a status pill ("Enrolling", "Running", "1 open")
       and three figures each (enrolled, a per-program unit, MTD revenue).
       None of that exists in Grove.data, so it is gone. A card now says what
       the program is, what it costs (read from PRICING) and how many classes
       run it (counted from CLASSES).
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
       term, start, end, runs-on and rooms (now the "When it runs" card, with
       days and rooms read from CLASSES); the eight Billing controls and the
       four Make-up controls (now one "Standing rules" card — the answer was
       the same for every program, so it is written once in Settings).
     - Cut outright: the two capacity switches, "Show remaining places
       publicly" and "Offer waitlist when full", which were on for everything
       and are now the stated default; the nine policy toggle chips, which
       were all on and are required, and are now listed as attached.
     - The plans table lost its four per-row "Edit" links, which all opened
       the same record. Its "Add-on / hr" column is now "Extra class", which
       is what PRICING.as.extraClassRate actually holds.
     - Every card opens this one builder, as the previous build did. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  var ORDER = ['as', 'camp', 'nsd', 'priv', 'bday', 'pop'];

  /* What each program is, in the same words families are shown at registration. */
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
      return Grove.money(p.base, { cents: false }) + ' for three hours, then ' +
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

  /* ---- programs ----------------------------------------------------------- */

  Grove.screen('programs', {
    surface: 'console',
    eyebrow: 'what you run',
    title: 'Programs',
    sub: 'Six programs. Open one to change what families see, who it is for and what it costs.',
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
          head: '<img src="' + esc(p.badge) + '" alt="" style="width:36px;height:36px">',
          foot: '<span class="mute">' + esc(n === 1 ? '1 class running' : n + ' classes running') + '</span>' +
            ui.btn({ label: 'Open', kind: 'quiet', size: 'sm', to: 'programBuilder' })
        }, h`<div class="stack">
          <p class="hint">${BLURB[id]}</p>
          ${raw(ui.kv([
            ['Price', esc(priceLine(id))],
            ['Registration fee', esc(feeLine(id))]
          ]))}
        </div>`);
      }));
    }
  });

  /* ---- program builder ----------------------------------------------------- */

  var PLAN_KEYS = ['p4', 'p8', 'p12', 'p16'];

  /* How a family may spread the sessions they have bought. */
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
      var lengths = uniq(cls.map(function (c) { return String(c.name).split(' · ')[0]; }));
      var length = lengths.length === 2 ? lengths[0] + ' and ' + lengths[1] : lengths.join(' · ');
      var places = uniq(cls.map(function (c) { return String(c.cap); })).join(' / ');
      var days = uniq(cls.map(function (c) { return c.day; })).join(', ');
      var rooms = uniq(cls.map(function (c) { return c.room; })).join(', ');

      var identity = ui.card({
        title: 'Identity',
        note: 'The colour beside this program — on every tag, dot and calendar entry — is set when the program is created and is not changed here.'
      }, h`<div class="stack">
        <p class="hint">How the program appears everywhere in the platform.</p>
        ${raw(ui.fields(null, [
          ui.field({
            label: 'Program name',
            control: ui.input({ value: p.name }),
            hint: 'Shown to families'
          }),
          ui.field({
            label: 'What families should know',
            control: ui.textarea({
              value: BLURB.as,
              placeholder: 'One or two sentences for the registration page'
            })
          })
        ]))}
      </div>`);

      var who = ui.card({
        title: 'Eligibility and capacity',
        note: 'Every program handles a full class the same way: the family joins a waitlist of eight rather than being turned away, and registration shows how many places are left. Those were two switches. They are now the default.'
      }, h`<div class="stack">
        <p class="hint">Who can enrol, and what happens when a class is full.</p>
        ${raw(ui.fields(null, [
          ui.field({
            label: 'Age bands',
            control: ui.select({ value: bands, options: [bands, '5–6 · 7–9 · 10+', 'No age grouping'] })
          }),
          ui.field({
            label: 'Session length',
            control: ui.select({ value: length, options: ['1 hour', '2 hour', length] })
          }),
          ui.field({
            label: 'Places per class',
            control: ui.input({ value: places }),
            hint: 'Read from the classes already running.'
          })
        ]))}
      </div>`);

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
        title: 'When it runs',
        note: 'The term calendar is kept in Settings and the sessions themselves live under Classes, so the days and rooms here are read from the classes, not typed again.'
      }, ui.kv([
        ['Term', '2026–2027 school year'],
        ['Starts', '17 Aug 2026'],
        ['Ends', '12 Jun 2027'],
        ['Runs on', esc(days)],
        ['Rooms', esc(rooms)]
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
