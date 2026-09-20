/* Console → Programs (the list), the program record, and New program.

   Who this is for: the owner, at a desk, with a keyboard. She opens Programs
   to answer one of three questions — how is this priced, what does it cost,
   and what does the registration page say about it. Everything else on these
   screens is read from somewhere that already owns it.

   THIS PASS — HOW A PROGRAM IS PRICED, AND THE RULES CARD REBUILT

   The client asked the question this page had never answered: "the prices in
   programs, they all have different entry fields. Some are 'An hour', some
   are '4 hours a month', some are 'Clay Night' — if the owner is creating a
   program how do they set these prices/fields." The answer is now on screen.
   D.PRICING_MODELS holds the five ways a program can be priced, and the model
   a program uses decides what the price table asks for:

     plan      a row per tier — hours a month and its price        After-School
     perWeek   a full week, a single day, an extra hour            Camp
     perHour   an hourly rate, the shortest and longest booking    No-School, Private
     perEvent  a row per event — name, when, places, price         Pop-Up
     quoted    no price fields at all                              Birthday

     - "How it is priced" is a real control, not a label. It sits beside the
       price table, reads D.pricingModel(id).name, and offers the other four.
       Its hint is that model's own `asks` line, so the table below it is never
       a surprise. A program priced by the hour is never asked for a week price
     - the registration fee moved out of the price table and into that same
       card, because every program has one whatever its model — including the
       birthday party, which has no price table at all
     - the shortest and longest booking are fields rather than sentences
       buried in a "what it covers" cell. The shortest is read from the class
       lengths the program actually runs, the longest from PRICING.maxHours
     - the Pop-Up's two events are a four-column table: name, when, places,
       price, each one an input, because that is what "a price per event"
       asks for and it is what a table of events will hold
     - the list's Price cell now carries the model name rather than this
       file's own two-word summary of it. Five different second lines, which
       is the honest answer to why the prices all look different
     - New program is a screen. Name, what families are told, then the first
       real question — how it is priced, as five large choices — and only once
       that is answered does the price table appear, asking for that model's
       fields and nothing else

   THE STANDING RULES CARD, REBUILT

   It rendered ten rules through ui.kv, which right-aligns its value, so every
   rule was two or three lines of prose with a ragged left edge in a narrow
   column beside a nine-pill policy card. Prose is not a key/value.

     - the card is ui.rows now: the short label as the title, the rule as the
       sentence under it, both left-aligned, and it has the full width
     - "A make-up cannot" joined four clauses with middots into one cramped
       line. Each clause is its own row: the first reads "A make-up cannot",
       the three after it "Nor can it", so the four read as English
     - the policies card also takes the full width, which is what nine pills
       wanted in the first place

   WHAT EARLIER PASSES SETTLED, AND THIS ONE KEEPS

   A plan is hours a month — 4, 8, 12 or 16 — and the parent chooses how to
   split them into classes; everything else is a one-off booking, paid for when
   it is booked, with no plan, no cycle and no renewal. The rules are D.RULES
   and D.PLAN_YEAR as written, and a one-off program is spared the eight that
   belong to a plan. Renewal is the plan year: a plan runs to PLAN_YEAR.ends
   and ends there. The exceptions — an extra class, a private class, an event —
   are one charge posted from Billing → Post a sale, which is the one standing
   rule every program carries. The list is one table, not six cards, and every
   figure on it is counted off the rows on show.

   STANDING DECISIONS
     - no status pill and no term dates: Grove.data holds neither
     - the badge PNGs stay out; a program is marked with ui.dot(color)
     - the blurbs are the registration copy, and the After-School one is built
       from the plan ladder and the plan year so it cannot drift from them */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  Grove.on('togglePolicy', function (d) {
    var id = Grove.state.params.id || 'as';
    Grove.flip(Grove.policyKey(id, d.id), D.policiesFor(id).indexOf(d.id) !== -1);
  });

  /* The one question a new program answers before it can be asked anything
     about money. Nothing below it is drawn until it has been answered. */
  Grove.on('priceModel', function (d) { Grove.setFilter('newProgModel', d.id); });

  /* ---- small helpers ------------------------------------------------------- */

  function ids() { return Object.keys(D.PROGRAMS); }

  function uniq(list) {
    var out = [];
    list.forEach(function (v) { if (v && out.indexOf(v) === -1) out.push(v); });
    return out;
  }

  function joinList(list, sep) {
    return uniq(list).join(sep || ', ');
  }

  /* "1 hour or 2 hours", "4, 8, 12 or 16". */
  function orList(words) {
    if (!words.length) return '';
    if (words.length === 1) return words[0];
    return words.slice(0, -1).join(', ') + ' or ' + words[words.length - 1];
  }

  /* "No-School Day and Private Class". */
  function andList(words) {
    if (!words.length) return '';
    if (words.length === 1) return words[0];
    return words.slice(0, -1).join(', ') + ' and ' + words[words.length - 1];
  }

  function plural(n, one, many) {
    return n + ' ' + (n === 1 ? one : many);
  }

  /* ---- how a program is priced ---------------------------------------------
     D.PRICING carries the model on the program itself, and D.PRICING_MODELS
     says what that model asks for. Everything on these screens that differs
     between two programs differs because of this one field. */

  function modelKey(id) { return (D.PRICING[id] || {}).model || 'quoted'; }
  function modelOf(id) { return D.pricingModel(id); }
  function modelKeys() { return Object.keys(D.PRICING_MODELS); }

  function hasPlan(id) { return modelKey(id) === 'plan'; }
  function quoted(id) { return modelKey(id) === 'quoted'; }

  /* The programs already priced this way, named rather than counted, so the
     owner choosing a model for a new program can see one she knows. */
  function pricedBy(key) {
    return ids().filter(function (id) { return modelKey(id) === key; })
                .map(function (id) { return D.program(id).name; });
  }

  function modelsInUse() {
    return uniq(ids().map(modelKey));
  }

  /* A plan is hours a month. 'p8' is eight hours, not eight classes. */
  function planHours(key) { return parseInt(key.slice(1), 10); }

  function planKeys(p) {
    return Object.keys(p.plans || {}).sort(function (a, b) {
      return planHours(a) - planHours(b);
    });
  }

  function planProgramsLine() {
    var names = pricedBy('plan');
    if (!names.length) return 'No program is sold as a plan';
    return andList(uniq(names)) +
      (names.length === 1 ? ' is the only program sold as a plan' : ' are the only programs sold as a plan');
  }

  function classesOf(id) {
    return D.CLASSES.filter(function (c) { return c.prog === id; });
  }

  function enrolled(list) {
    var n = 0;
    list.forEach(function (c) { n += c.en; });
    return n;
  }

  function capacity(list) {
    var n = 0;
    list.forEach(function (c) { n += c.cap; });
    return n;
  }

  /* Children, not places. A child in three of this program's classes fills
     three places and gets one bill, and it is the bill this page changes. */
  function childrenOn(id, planOnly) {
    var seen = {}, n = 0;
    classesOf(id).forEach(function (c) {
      D.roster(c.id).forEach(function (s) {
        if (seen[s.id]) return;
        seen[s.id] = true;
        if (!planOnly || s.planHours > 0) n += 1;
      });
    });
    return n;
  }

  /* Cents only where the rate actually has them: $280, but $67.50. */
  function money(n) {
    return Grove.money(n, { cents: n % 1 !== 0 });
  }

  function strong(t) { return '<span class="cell-strong">' + esc(t) + '</span>'; }

  /* '3:15pm' → 915, so the length of a class can be taken off its own time
     range. Only the end of a range carries the meridiem in this dataset, so
     the start borrows it. */
  function meridiem(part) {
    var m = /(am|pm)/i.exec(String(part));
    return m ? m[1].toLowerCase() : '';
  }

  function clock(part, fallback) {
    var m = /(\d{1,2}):(\d{2})/.exec(String(part));
    if (!m) return null;
    var hour = parseInt(m[1], 10) % 12;
    if ((meridiem(part) || fallback) === 'pm') hour += 12;
    return hour * 60 + parseInt(m[2], 10);
  }

  function lengthOf(c) {
    var parts = String(c.time).split('–');
    if (parts.length < 2) return 0;
    var mark = meridiem(parts[1]);
    var from = clock(parts[0], mark), to = clock(parts[1], mark);
    if (from === null || to === null) return 0;
    return to > from ? to - from : 0;
  }

  function lengthWord(mins) {
    var hrs = Math.round((mins / 60) * 10) / 10;
    return hrs === 1 ? '1 hour' : hrs + ' hours';
  }

  /* The class lengths this program actually runs, shortest first. */
  function classLengths(list) {
    var mins = [];
    list.forEach(function (c) {
      var m = lengthOf(c);
      if (m && mins.indexOf(m) === -1) mins.push(m);
    });
    mins.sort(function (a, b) { return a - b; });
    return mins;
  }

  function lengthLine(list) {
    return orList(classLengths(list).map(lengthWord)) || '—';
  }

  /* "8 classes of 1 hour or 4 of 2 hours" — the ways a month's hours divide
     against this program's own class lengths. Registration asks the parent
     how they would like to split their hours; these are the answers. */
  function splitLine(hours, list) {
    var parts = [];
    classLengths(list).forEach(function (mins) {
      var each = mins / 60;
      var n = each ? hours / each : 0;
      if (!n || n !== Math.floor(n)) return;
      parts.push(parts.length
        ? n + ' of ' + lengthWord(mins)
        : n + ' classes of ' + lengthWord(mins));
    });
    return orList(parts);
  }

  /* What each program is, in the same words families are shown at
     registration, so screens/registration/pick.js and this page cannot
     describe the same program differently. The After-School sentence is built
     from the plan ladder and the plan year rather than typed out. */
  var BLURB = {
    camp: 'Full days of making through the summer and school breaks. Take a whole week or pick individual days.',
    nsd: 'For teacher workdays and county holidays. Three hours as standard, extend by the hour if you need to.',
    priv: 'One-to-one time with an instructor, on a subject your child chooses. Up to three hours in one booking.',
    bday: 'A party built round a theme and a project, picked from forty-four activities. Tell us what you want and we will price it.',
    pop: 'One-off evenings for a single project. Clay Night is the next one, and it is nearly gone.'
  };

  function blurb(id) {
    if (!hasPlan(id)) return BLURB[id] || '';
    var hours = planKeys(D.PRICING[id]).map(function (k) { return String(planHours(k)); });
    return 'A fixed weekly place across the school year. You buy hours a month — ' +
      orList(hours) + ' — and choose how to split them into classes. The plan runs to ' +
      D.PLAN_YEAR.ends + ' and ends there.';
  }

  /* The one line registration shows. Built off the model, so a program that
     changes how it is priced cannot keep quoting the old shape. */
  function priceLine(id) {
    var p = D.PRICING[id], key = modelKey(id);

    if (key === 'plan') {
      var keys = planKeys(p), first = keys[0], last = keys[keys.length - 1];
      return money(p.plans[first]) + ' for ' + planHours(first) + ' hours a month, up to ' +
        money(p.plans[last]) + ' for ' + planHours(last);
    }
    if (key === 'perWeek') {
      return money(p.week) + ' a week, or ' + money(p.day) + ' a day';
    }
    if (key === 'perHour') {
      return p.base
        ? money(p.base) + ' a day, then ' + money(p.extraHour) + ' an hour'
        : money(p.hourly) + ' an hour, up to ' + p.maxHours + ' hours';
    }
    if (key === 'perEvent') {
      var amounts = uniq(p.events.map(function (e) { return e.amount; }));
      if (amounts.length === 1) return money(amounts[0]) + ' a child';
      return money(Math.min.apply(null, amounts)) + ' to ' +
        money(Math.max.apply(null, amounts)) + ' a child';
    }
    return 'Quoted per party';
  }

  function feeLine(id) {
    var fee = D.PRICING[id].regFee;
    return fee ? money(fee) : 'None';
  }

  function agesLine(id) {
    return joinList(classesOf(id).map(function (c) { return c.band; }), ' · ') || '—';
  }

  /* Summed from the same class rows the table counts, so this card, the
     Classes screen and Reports → Programs cannot disagree. */
  function placesLine(id) {
    var list = classesOf(id);
    var cap = capacity(list);
    return enrolled(list) + ' of ' + cap + (cap === 1 ? ' place' : ' places');
  }

  function fillCell(en, cap) {
    if (!cap) return '<span class="mute">No classes yet</span>';
    return h`<div class="stack stack--sm">
      <div>${en + ' of ' + cap + (cap === 1 ? ' place' : ' places')}</div>
      ${raw(ui.meter(en, cap))}
    </div>`;
  }

  /* ---- programs ------------------------------------------------------------ */

  Grove.screen('programs', {
    surface: 'console',
    eyebrow: 'what you run',
    title: 'Programs',
    sub: function () {
      var all = ids(), rest = all.length - pricedBy('plan').length;
      return plural(all.length, 'program', 'programs') + ' priced ' +
        plural(modelsInUse().length, 'way', 'ways') + '. ' + planProgramsLine() +
        ' — hours a month, to the end of the school year. ' +
        (rest === 1 ? 'The other one is booked and paid for one at a time.'
                    : 'The other ' + rest + ' are booked and paid for one at a time.') +
        ' Open one to change how it is priced, what it costs and what families are told about it.';
    },
    actions: [
      { label: 'New program', kind: 'primary', to: 'newProgram' }
    ],

    body: function () {
      var classes = 0, en = 0, cap = 0;

      var rows = ids().map(function (id) {
        var p = D.program(id);
        var list = classesOf(id);
        var pen = enrolled(list), pcap = capacity(list);
        classes += list.length;
        en += pen;
        cap += pcap;

        return {
          to: 'programBuilder', id: id,
          cells: [
            '<span class="cell-strong">' + ui.dot(p.color) + ' ' + esc(p.name) + '</span>',
            ui.mute(agesLine(id)),
            /* The second line is the model, not a summary of it: five
               programs, five different ways of being priced, which is the
               whole answer to why no two price cells look alike. */
            ui.two(priceLine(id), modelOf(id).name),
            esc(feeLine(id)),
            esc(String(list.length)),
            fillCell(pen, pcap)
          ]
        };
      });

      return ui.card({
        flush: true,
        foot: '<span class="mute">' +
          esc(plural(rows.length, 'program', 'programs') + ' · ' + plural(classes, 'class', 'classes')) +
          '</span><span class="num">' + esc(en + ' of ' + cap + ' places filled') + '</span>'
      }, ui.table(
        [
          'Program',
          'Ages',
          'Price',
          { label: 'Registration fee', align: 'right' },
          { label: 'Classes', align: 'right', shrink: true },
          { label: 'Enrolled', align: 'right' }
        ],
        rows
      ));
    }
  });

  /* ---- the program record ---------------------------------------------------
     One shape for all six programs. What differs between them is how they are
     priced, and that difference is declared in one field and obeyed by the
     table under it. */

  function current(ctx) {
    var id = ctx && ctx.params ? ctx.params.id : '';
    return D.PROGRAMS[id] ? id : 'as';
  }

  /* One editable price, or a stated "None" where there is nothing to set. */
  function priceCell(amount) {
    return amount ? ui.input({ value: money(amount) }) : '<span class="mute">None</span>';
  }

  function priceRow(label, amount, covers) {
    return { cells: [strong(label), priceCell(amount), ui.mute(covers)] };
  }

  function payTable(rows) {
    return ui.table(['What families pay', 'Price', 'What it covers'], rows);
  }

  /* "Mon–Fri, 10:00am–1:00pm", read off the classes rather than typed. */
  function whenLine(list) {
    if (!list.length) return '';
    return joinList(list.map(function (c) { return c.day; })) + ', ' +
      joinList(list.map(function (c) { return c.time; }));
  }

  /* The shortest a family can book is the shortest class this program runs;
     with no classes on file yet it is the hour the rate is quoted in. */
  function shortestBooking(id) {
    var lens = classLengths(classesOf(id));
    return lens.length ? lengthWord(lens[0]) : lengthWord(60);
  }

  function longestBooking(id) {
    var max = D.PRICING[id].maxHours;
    return max ? lengthWord(max * 60) : '—';
  }

  function standardDayLine(list) {
    if (!list.length) return 'The standard day';
    return lengthWord(lengthOf(list[0])) + ', ' + list[0].time;
  }

  /* An event carries its date, its ages and its places in one line; the table
     below wants them apart, so they are split rather than retyped. */
  function eventParts(e) {
    var parts = String(e.sub || '').split(' · ');
    var out = { when: parts[0] || '', places: '', ages: '' };
    parts.slice(1).forEach(function (part) {
      if (/place/i.test(part)) out.places = part;
      else out.ages = out.ages ? out.ages + ' · ' + part : part;
    });
    return out;
  }

  /* ---- the price table, one shape per pricing model ------------------------- */

  function planTable(id) {
    var p = D.PRICING[id], list = classesOf(id);
    return payTable(planKeys(p).map(function (k) {
      var hours = planHours(k);
      var split = splitLine(hours, list);
      return priceRow(
        hours + ' hours a month',
        p.plans[k],
        /* The hourly rate divided out of the price in this same row.
           PRICING.as.extraClassRate holds the same four numbers and is not
           quoted as a charge: an hour is an hour, whichever plan buys it. */
        money(p.plans[k] / hours) + ' an hour' + (split ? ' · ' + split : '')
      );
    }));
  }

  function weekTable(id) {
    var p = D.PRICING[id], list = classesOf(id);
    return payTable([
      priceRow('A full week', p.week, whenLine(list)),
      priceRow('A single day', p.day, 'Four days or more is worth taking the week'),
      priceRow('Extended care, an hour', p.extraHour, 'On every day booked')
    ]);
  }

  /* Two programs are priced by the hour and they are not the same shape: one
     sells a standard day and then hours on top of it, the other sells the
     hour itself. Both are read off the keys PRICING actually holds. */
  function hourTable(id) {
    var p = D.PRICING[id], list = classesOf(id), rows = [];
    if (p.base) {
      rows.push(priceRow('A standard day', p.base, standardDayLine(list)));
      rows.push(priceRow('Each hour after that', p.extraHour, 'Every hour beyond the standard day'));
    } else {
      rows.push(priceRow('An hour', p.hourly, 'Every hour booked, one-to-one'));
    }
    return payTable(rows);
  }

  /* Name, when, places, price — the four things an event carries, each one a
     field, because a new event is a new row rather than a new rule. */
  function eventTable(id) {
    var p = D.PRICING[id];
    return ui.table(
      ['Event', 'When', 'Places', { label: 'Price a child', align: 'right' }],
      p.events.map(function (e) {
        var parts = eventParts(e);
        return {
          cells: [
            ui.input({ value: e.label }) +
              (parts.ages ? '<div class="cell-sub">' + esc(parts.ages) + '</div>' : ''),
            ui.input({ value: parts.when }),
            ui.input({ value: parts.places }),
            ui.input({ value: money(e.amount) })
          ]
        };
      })
    );
  }

  function priceTable(id) {
    var key = modelKey(id);
    if (key === 'plan') return planTable(id);
    if (key === 'perWeek') return weekTable(id);
    if (key === 'perHour') return hourTable(id);
    if (key === 'perEvent') return eventTable(id);
    return ui.empty('Nothing to price here',
      'Every party is quoted by hand from the activity list, so there is no standing price to ' +
      'set. The registration fee is the only amount on file.');
  }

  /* The rate falls as the plan grows, and both ends of that are divided out
     of the ladder rather than written down. */
  function priceNote(id) {
    if (!hasPlan(id)) return null;
    var p = D.PRICING[id];
    var rates = planKeys(p).map(function (k) { return p.plans[k] / planHours(k); });
    return 'Hours are the unit, not classes. The parent chooses how to split them at registration, ' +
      'and the rate falls from ' + money(rates[0]) + ' an hour on the smallest plan to ' +
      money(rates[rates.length - 1]) + ' on the largest.';
  }

  /* PRICING.as.regFeePer reads "child, once a year", so this fee is not a
     one-time charge: it is charged per child, every year. The sibling relief
     is relief on THIS fee and never on tuition. */
  function feeHint(id) {
    var p = D.PRICING[id];
    if (!p.regFee) return 'Nothing is charged to register for this program.';
    return 'Per ' + (p.regFeePer || 'child, one time') +
      (p.siblingRelief ? ' · ' + p.siblingRelief : '');
  }

  /* The field the whole page obeys. She picks how it is priced; the table
     beside it asks for that model's fields and nothing else. */
  function howPricedCard(id) {
    var m = modelOf(id);
    var fields = [
      ui.field({
        label: 'How it is priced',
        hint: m.asks,
        control: ui.select({
          value: m.name,
          options: modelKeys().map(function (k) { return D.PRICING_MODELS[k].name; })
        })
      })
    ];

    /* Only the by-the-hour model has a booking to bound. The shortest is what
       its classes already run; the longest is what PRICING holds. */
    if (modelKey(id) === 'perHour') {
      fields.push(ui.field({
        label: 'Shortest booking',
        hint: 'Read from the classes this program runs.',
        control: ui.input({ value: shortestBooking(id) })
      }));
      fields.push(ui.field({
        label: 'Longest booking',
        control: ui.input({ value: longestBooking(id) })
      }));
    }

    fields.push(ui.field({
      label: 'Registration fee',
      hint: feeHint(id),
      control: ui.input({ value: money(D.PRICING[id].regFee || 0) })
    }));

    return ui.card({
      title: 'How it is priced',
      note: 'Changing this changes what the price table asks for. It does not change what a ' +
        'family has already paid.'
    }, ui.fields(null, fields));
  }

  /* What saving is going to do, in her own terms, counted from the rows
     rather than written down. She has nobody to undo a price for her. */
  function consequence(id) {
    if (quoted(id)) {
      return 'Parties are quoted by hand, so nothing here changes a quote already given';
    }
    if (hasPlan(id)) {
      var on = childrenOn(id, true);
      if (!on) return 'Nobody is on a plan yet, so a new price applies to new plans only';
      return (on === 1 ? '1 child is' : on + ' children are') +
        ' on a plan — a new price is what they pay on their next invoice';
    }
    var booked = childrenOn(id);
    if (!booked) return 'Nobody is booked yet, so a new price applies to new bookings only';
    return (booked === 1 ? '1 child is' : booked + ' children are') +
      ' already booked at the old price — a new price applies from here on';
  }

  /* ---- the standing rules ----------------------------------------------------
     The rules are the studio's, and they come from D.RULES and D.PLAN_YEAR so
     that no two screens carry a different version of what a family signed.
     Not every rule touches every program: a party does not have a cycle, and
     a make-up cannot be taken on a pop-up ticket, so a one-off program is
     spared the eight that belong to a plan.

     A rule is a label and a sentence, so it is a row — a left-aligned title
     over a left-aligned sentence. It was a kv, which right-aligns its value,
     and ten rules of prose ragged against a narrow right edge is what the
     client was looking at when he said he hated it. */

  function windowLine(w) {
    return /^\d/.test(String(w)) ? 'Within ' + w : 'Within the ' + w;
  }

  function rule(title, text) {
    return { title: esc(title), sub: esc(text) };
  }

  function ruleRows(id) {
    var R = D.RULES, Y = D.PLAN_YEAR, rows = [];

    if (quoted(id)) {
      rows.push(rule('Paying', 'Quoted by hand from the activity list, then invoiced'));
    } else if (hasPlan(id)) {
      rows.push(rule('Paying', 'The invoice is raised on the last class of a cycle, lists the ' +
        'dates of the next one and covers them, on the card on file'));
      rows.push(rule('The ' + Y.label + ' plan year', 'Runs to ' + Y.ends + '. ' + Y.note));
      rows.push(rule('Hours not booked', R.unusedHours));
      /* Two rules, two rows. Run together they read as a contradiction —
         "cancel and it becomes a make-up. The class is counted as attended" —
         because R.lateCancel is written to stand on its own and loses its
         condition when it is glued to the sentence before it. */
      rows.push(rule('Cancelling a class', 'Cancel in the portal at least ' + R.cancelNotice +
        ' before the class and it becomes a make-up.'));
      rows.push(rule('A late cancel or a no-show', R.lateCancel));
      rows.push(rule('Taking a make-up', R.makeupWhere + ' ' + windowLine(R.makeupWindow) + '.'));
      /* Four clauses, four rows. They were joined with middots into one line
         that had to be read twice. The lead-in carries from the first row to
         the three under it, so they read as one sentence each. */
      /* One rule, not four rows repeating "Nor can it" down the card. The
         clauses are short, so they read as sentences in a single sub. */
      rows.push(rule('A make-up cannot', R.makeupNever.map(function (c) {
        return c.charAt(0).toUpperCase() + c.slice(1) + '.';
      }).join(' ')));
      rows.push(rule('Freezing', R.freeze));
      rows.push(rule('Cancelling the plan', R.cancelPlan));
    } else {
      rows.push(rule('Paying', 'Paid when the family books. There is no plan, no cycle and nothing renews'));
    }

    /* The one mechanism for every exception. An extra class because a child's
       school finishes later than the program, a private class that comes up,
       an event: one charge, one amount, one reason, on the card on file. The
       owner calls it posting a sale and it already exists on Billing, so this
       page names it rather than growing a control of its own. */
    rows.push(rule('Anything extra', 'An extra class, a private class, an event or any other ' +
      'service is one charge on the card on file, posted from Billing → Post a sale. It does ' +
      'not add hours to a cycle or change a plan'));

    return rows;
  }

  function rulesCard(id) {
    return ui.card({
      title: 'Standing rules',
      flush: true,
      head: ui.btn({ label: 'Open Settings', kind: 'quiet', size: 'sm', to: 'settings' }),
      note: 'Written once in Settings. Only the rules that touch this program are listed.'
    }, ui.rows(ruleRows(id)));
  }

  /* Attach and detach on the programme itself. Every clause the studio has is
     listed; the ones this programme carries are switched on. The default comes
     from the programme type, so a camp starts without the two class-scheduling
     clauses and a private class starts with three extra. */
  function policiesCard(id) {
    var attached = Grove.policiesFor(id);
    return ui.card({
      title: 'Required policies',
      head: h`<span class="mute">${attached.length + ' of ' + D.POLICY_ALL.length + ' attached'}</span>`,
      note: attached.length
        ? 'Tap a clause to attach or detach it. A family signs the set once, and again when one ' +
          'of them is published as a new version. Open a clause from Settings to change its wording.'
        : 'Nothing is attached, so a family books this program without signing anything. ' +
          'That is right for a quoted booking and wrong for almost anything else.'
    }, h`<div class="inline">${raw(D.POLICY_ALL.map(function (name) {
      return ui.pillToggle({
        label: name,
        id: name,
        act: 'togglePolicy',
        on: Grove.policyOn(id, name)
      });
    }).join(''))}</div>`);
  }

  /* ---- the record ------------------------------------------------------------ */

  function identityCard(id, title) {
    var p = id === 'new' ? { name: '', short: '' } : D.program(id);
    return ui.card({
      title: title || 'Identity',
      note: id === 'new'
        ? 'A colour and a short name are assigned when the program is created. They mark the program on every tag, dot and calendar entry, and wherever the full name will not fit.'
        : 'The colour beside this program, and the short name it goes by where the full one will not fit (' +
          p.short + '), are set when the program is created and are not changed here.'
    }, ui.fields(null, [
      ui.field({
        label: 'Program name',
        control: ui.input({ value: p.name, placeholder: 'e.g. Saturday Studio' })
      }),
      ui.field({
        label: 'What families should know',
        control: ui.textarea({
          value: id === 'new' ? '' : blurb(id),
          placeholder: 'One or two sentences for the registration page'
        }),
        hint: 'Shown to families on the registration page.'
      })
    ]));
  }

  /* A class nobody is teaching is worth seeing from here, so it reads the way
     it reads on the Classes screen. */
  function staffLine(list) {
    return uniq(list.map(function (c) { return c.staff; })).map(function (name) {
      return name === 'Unassigned'
        ? '<span class="clay">Unassigned</span>'
        : esc(name);
    }).join(', ');
  }

  function record(id) {
    var p = D.program(id);
    var list = classesOf(id);

    var runs = ui.card({
      title: 'How it runs',
      head: ui.btn({ label: 'Open Classes', kind: 'quiet', size: 'sm', to: 'classes' }),
      note: 'Read from the ' + (list.length === 1 ? 'one class' : plural(list.length, 'class', 'classes')) +
        ' this program is running. A day, a room, a place count or a teacher is changed on the class itself.'
    }, list.length ? ui.kv([
      ['Runs on', esc(joinList(list.map(function (c) { return c.day; })))],
      ['Class length', esc(lengthLine(list))],
      ['Ages', esc(agesLine(id))],
      ['Places per class', esc(joinList(list.map(function (c) { return String(c.cap); }), ' / '))],
      ['Rooms', esc(joinList(list.map(function (c) { return c.room; })))],
      ['Instructors', staffLine(list)],
      ['Enrolled', esc(placesLine(id))]
    ]) : ui.empty('No classes yet', 'Add one under Classes and this card fills in.'));

    var prices = ui.card({
      title: 'Prices',
      flush: true,
      note: priceNote(id),
      foot: '<span class="mute">Registration shows</span>' +
        '<span class="strong">' + esc(priceLine(id)) + '</span>'
    }, priceTable(id));

    return ui.grid(2, [identityCard(id), runs]) +
      '<div class="section">' + ui.grid('aside', [howPricedCard(id), prices]) + '</div>' +
      '<div class="section">' + rulesCard(id) + '</div>' +
      '<div class="section">' + policiesCard(id) + '</div>' +
      ui.formActions([
        { label: 'Save changes', kind: 'primary', act: 'saveProgram', msg: 'Saved · ' + p.name },
        { label: 'Cancel', to: 'programs' }
      ], { sticky: true, hint: consequence(id) });
  }

  Grove.screen('programBuilder', {
    surface: 'console',
    crumbs: [{ label: 'Programs', to: 'programs' }],
    eyebrow: 'what it costs, what it says',
    title: function (ctx) { return D.program(current(ctx)).name; },
    sub: function (ctx) {
      return modelOf(current(ctx)).name +
        '. What this program costs, and what families are told about it. Days, rooms and places ' +
        'are read from its classes; the standing rules from Settings.';
    },

    body: function (ctx) {
      return record(current(ctx));
    }
  });

  /* ---- new program -----------------------------------------------------------
     Three questions in the order they would be asked at the desk: what is it
     called, what are families told, and how is it priced. The third is the one
     that matters, because it decides what else there is to ask — so nothing
     about money is drawn until it has been answered. */

  function newPriceFields(key) {
    if (key === 'plan') {
      return [
        ui.field({
          label: 'Hours a month',
          hint: 'One tier to start. The rest of the ladder is added on the program page.',
          control: ui.input({ placeholder: 'A number of hours' })
        }),
        ui.field({
          label: 'What that costs a month',
          control: ui.input({ placeholder: 'A price a month' })
        })
      ];
    }
    if (key === 'perWeek') {
      return [
        ui.field({ label: 'A full week', control: ui.input({ placeholder: 'A price a week' }) }),
        ui.field({ label: 'A single day', control: ui.input({ placeholder: 'A price a day' }) }),
        ui.field({
          label: 'An extra hour',
          hint: 'Extended care, charged on every day booked.',
          control: ui.input({ placeholder: 'A price an hour' })
        })
      ];
    }
    if (key === 'perHour') {
      return [
        ui.field({ label: 'An hour', control: ui.input({ placeholder: 'A price an hour' }) }),
        ui.field({
          label: 'Shortest booking',
          hint: 'The least a family can book at a time.',
          control: ui.input({ placeholder: 'A length of time' })
        }),
        ui.field({
          label: 'Longest booking',
          control: ui.input({ placeholder: 'A length of time' })
        })
      ];
    }
    if (key === 'perEvent') {
      return [
        ui.field({
          label: 'Event name',
          hint: 'The first event. More are added on the program page.',
          control: ui.input({ placeholder: 'What families will see' })
        }),
        ui.field({ label: 'When it runs', control: ui.input({ placeholder: 'A date and a time' }) }),
        ui.field({ label: 'Places', control: ui.input({ placeholder: 'How many children' }) }),
        ui.field({ label: 'Price a child', control: ui.input({ placeholder: 'A price a child' }) })
      ];
    }
    return [];
  }

  function pricedCard(key) {
    var m = D.PRICING_MODELS[key];
    var fields = newPriceFields(key);

    fields.push(ui.field({
      label: 'Registration fee',
      hint: 'Charged per child. Leave it blank if this program does not carry one.',
      control: ui.input({ placeholder: 'A price a child' })
    }));

    return ui.card({
      title: 'What it costs',
      note: m.asks
    }, (key === 'quoted'
      ? h`<p class="hint">There are no price fields to set. Every enquiry is priced by hand and
          invoiced, so the registration fee is the only amount this program carries.</p>
          <div class="card-split">${raw(ui.fields(2, fields))}</div>`
      : ui.fields(2, fields)));
  }

  Grove.screen('newProgram', {
    surface: 'console',
    crumbs: [{ label: 'Programs', to: 'programs' }],
    crumbTitle: 'New program',
    eyebrow: 'a new program',
    title: 'New program',
    sub: 'A name, a sentence for families, and how it is priced. How it is priced decides what ' +
         'the price table asks for, so it is the question that comes first.',

    body: function () {
      var picked = Grove.filter('newProgModel', '');

      var priced = ui.card({
        title: 'How is it priced?',
        note: 'Pick the one that matches how families will pay. It can be changed later, and ' +
          'changing it changes what the price table asks for.'
      }, ui.choices(null, modelKeys().map(function (key) {
        var m = D.PRICING_MODELS[key];
        var used = pricedBy(key);
        return ui.choice({
          id: key,
          size: 'lg',
          act: 'priceModel',
          title: m.name,
          sub: m.asks + (used.length
            ? ' ' + andList(used) + (used.length === 1 ? ' is priced this way.' : ' are priced this way.')
            : ''),
          on: picked === key
        });
      })));

      /* Each row names the screen that owns the thing it is about, and carries
         the way there, rather than a second card repeating the list. */
      var next = ui.card({ title: 'What happens next', flush: true }, ui.rows([
        {
          title: 'Add its classes',
          sub: 'Days, times, rooms, ages and places per class are set under Classes.',
          end: ui.btn({ label: 'Open Classes', kind: 'quiet', size: 'sm', to: 'classes' })
        },
        {
          title: 'Finish the prices',
          sub: 'The full price table is on the program page — the rest of a plan ladder, the ' +
            'other events, whatever the way it is priced asks for beyond the first row.'
        },
        {
          title: 'The standing rules already apply',
          sub: 'Paying, make-ups and cancelling come from Settings, the same as every other ' +
            'program, and the required policies follow the program type.',
          end: ui.btn({ label: 'Open Settings', kind: 'quiet', size: 'sm', to: 'settings' })
        },
        {
          title: 'Nobody can book it yet',
          sub: 'A program with no classes has nothing for a family to choose at registration.'
        }
      ]));

      return ui.grid(null, [identityCard('new', 'What is it called?'), priced]
        .concat(picked ? [pricedCard(picked)] : [])) +
        '<div class="section">' + next + '</div>' +
        ui.formActions([
          { label: 'Create program', kind: 'primary', act: 'saveProgram',
            msg: 'Program created · no classes yet, nobody enrolled' },
          { label: 'Cancel', to: 'programs' }
        ], {
          sticky: true,
          hint: picked
            ? 'It starts with no classes and nobody enrolled, so nothing is billed'
            : 'Choose how it is priced and the price table will ask for the right fields'
        });
    }
  });

  Grove.on('saveProgram', function (d) {
    Grove.go('programs');
    Grove.toast((d && d.msg) || 'Program saved');
  });
})();
