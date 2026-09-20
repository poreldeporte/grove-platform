/* Registration → what would you like to book.

   The public entry point. Six programme cards, one per programme in
   Grove.data.PROGRAMS, each dropping straight into the enrolment flow.

   Simplified against the spec:
     - the per-card tag ("Monthly", "One payment", "By appointment", "Quote")
       said the same thing as the price unit sitting two inches below it, so
       the unit says it once
     - the per-card availability line ("2 weeks left", "8 dates") is not in
       Grove.data and would be a promise we cannot keep. The flow shows the
       real places on the class you pick
     - the camp card no longer arrives pre-seeded with week 5 and a full week
       of days. A parent landing from an ad has not chosen a week yet, and the
       next screen asks properly.

   Corrected: the spec's fine print claimed every price shown includes the
   fees that apply to it. It does not — the flow adds a one-time registration
   fee from PRICING — so the fine print now says what is actually charged.

   FIXED AFTER VISUAL REVIEW
     - The six badge PNGs are gone. Their lettering was an illegible smudge at
       the size they rendered and their fills (hot magenta, bright violet) are
       in no palette this product owns. A program is now marked the way it is
       marked on Console -> Programs and on every other screen in the app:
       ui.dot(program.color), which is the --prog-* token for that program.
     - The fee note said "$130 for After-School Art" and "$15 for everything
       else" as though both were flat. The flow bills either fee per child,
       so the note says "a child". The name of the charge is unchanged: the
       running total, the package footnote and the sibling banner in
       registration/flow.js all call it a registration fee too. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  var ORDER = ['as', 'camp', 'nsd', 'priv', 'bday', 'pop'];

  /* The same words the console shows on Programs, so a parent and the owner
     are reading one description of the same thing. */
  var BLURB = {
    as: 'A fixed weekly place across the school year, billed month to month. Four to sixteen sessions a month, split how you like.',
    camp: 'Full days of making through the summer and school breaks. Take a whole week or pick individual days.',
    nsd: 'For teacher workdays and county holidays. Three hours as standard, extend by the hour if you need to.',
    priv: 'One-to-one time with an instructor, on a subject your child chooses. Up to three hours in a session.',
    bday: 'A party built round a theme and a project, picked from forty-four activities. Tell us what you want and we will price it.',
    pop: 'One-off evenings for a single project. Clay Night is the next one, and it is nearly gone.'
  };

  function m0(n) { return Grove.money(n, { cents: false }); }

  /* The lowest real amount a family could pay for each programme, read from
     PRICING. Nothing here is a literal rate. */
  function priceOf(id) {
    var P = D.PRICING;
    if (id === 'as')   return { amount: 'from ' + m0(P.as.plans.p4), unit: '/month' };
    if (id === 'camp') return { amount: m0(P.camp.week),   unit: '/week' };
    if (id === 'nsd')  return { amount: m0(P.nsd.base),    unit: '/day' };
    if (id === 'priv') return { amount: m0(P.priv.hourly), unit: '/hour' };
    if (id === 'bday') return { amount: 'Tell us',         unit: 'and we quote' };
    return { amount: m0(P.pop.events[0].amount), unit: '/child' };
  }

  function feeLine() {
    var P = D.PRICING;
    return 'A one-time registration fee is added at the end: ' +
      m0(P.as.regFee) + ' a child for ' + D.program('as').name + ', with ' + P.as.siblingRelief + '; ' +
      m0(P.camp.regFee) + ' a child for everything else; and none for a birthday.';
  }

  function programCard(id) {
    var p = D.program(id);
    var price = priceOf(id);

    return ui.card({
      title: p.name,
      head: ui.dot(p.color),
      foot: h`<span><span class="strong num">${price.amount}</span> <span class="mute">${price.unit}</span></span>` +
        ui.btn({ label: 'Book this', kind: 'quiet', size: 'sm', to: 'rFlow', id: id })
    }, h`<p class="hint">${BLURB[id]}</p>`);
  }

  Grove.screen('rPick', {
    surface: 'registration',
    crumbTitle: 'Book & enrol',
    eyebrow: 'let’s get you booked',
    title: 'What would you like to book?',
    sub: 'One form, five minutes. Everything we ask for is kept, so the next thing you book is quicker.',

    body: function () {
      var cards = ui.grid(3, ORDER.map(programCard));

      var fine = ui.notice({
        title: 'Ages 5–7, 8–11 and 12+. All materials provided.',
        text: feeLine()
      });

      return h`${raw(cards)}<div class="section">${raw(fine)}</div>`;
    }
  });
})();
