/* Console → Programs (the list) and the program record.

   Who this is for: the owner, at a desk, with a keyboard. She opens Programs
   to answer one of two questions — what does this cost, and what does the
   registration page say about it. Everything else on these screens is read
   from somewhere that already owns it.

   THIS PASS

   The list
     - six cards became one table. A card carried four facts and a paragraph
       of registration copy she wrote herself, so comparing the price or the
       fill rate of two programs meant scrolling a screenful. Six rows do it
       in a glance, which is what a table is for. The paragraph is on the
       record, where it is edited
     - the per-card "Open" button is gone: the row is the link
     - "Copy a program" is gone. It raised a toast claiming classes had been
       created, and nothing was. Copying a program and starting one are the
       same decision, and a studio with six programs makes it about never —
       so there is one way to do it, not two
     - "Six programs" was written as a literal in the page sub. Every figure
       on the screen is now counted off the rows on show, including the foot

   The record (was "the builder")
     - three of its five controls were not controls. "Age bands" offered the
       bands its own classes already carry or "No age grouping"; "Session
       length" offered the lengths of those same classes; "Places per class"
       was an input whose hint said it was read from the classes. None of the
       three could change a class, so all three are stated in "How it runs",
       which is where the rest of the class facts already were
     - what she actually opens this page to change was not editable at all:
       the price. The plan prices and the registration fee are now inputs, so
       the page can keep the promise the list makes
     - the plans table lost its "Sessions" column, which restated the plan
       name ("8 sessions / month" → 8), and its "Extra class" column, which is
       a rate that follows the plan and now reads on the plan's own line. One
       table shape — what families pay, the price, what it covers — serves all
       six programs instead of one shape for After-School and nothing for the
       other five
     - "Add a plan" is gone. It admitted in its own toast that it did nothing,
       and the four-step ladder has not changed in years
     - "Save changes" moved out of the header into a bar pinned to the foot of
       the viewport, because the page is three screens long and the button was
       only reachable at the top of it. The bar states the consequence of
       saving — how many children are enrolled on the program whose price is
       being changed — counted from the class rows
     - the two "Written once in Settings and applied to every program" notes
       said the same sentence twice, and the Standing rules note carried a
       changelog line about twelve controls that meant nothing to an owner.
       One sentence, once, plus a link to Settings
     - a full class, the waitlist and the visible places count were three
       facts inside an Eligibility card with nothing else in it. They are one
       standing rule now, and the card is gone
     - every card opened After-School Art whatever you clicked. A row now
       opens its own program, and the price table is built from that
       program's own pricing shape
     - once six programs share this page the standing rules had to stop being
       After-School Art's. "Recurring monthly, on the 1st", a 30-day
       cancellation notice and the make-up rules were being stated over a
       birthday party and a pop-up ticket, where none of them are true. A
       program with a plan ladder shows all of them; a program bought once
       shows the three that still apply
     - "Classes: 5" left the How it runs card: the note under it already
       counts them, and the two cards on that row now end within a line of
       each other

   STANDING DECISIONS CARRIED OVER
     - no status pill and no term dates: Grove.data holds neither a term
       calendar nor an enrolment state, and the previous build printed a
       start date for classes that had been running since spring
     - the badge PNGs stay out. A program is marked with ui.dot(color), the
       way it is marked everywhere else
     - the blurbs are the registration copy, character for character */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

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

  function plural(n, one, many) {
    return n + ' ' + (n === 1 ? one : many);
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

  /* "1 hour or 2 hours", read off the class times rather than typed. */
  function lengthLine(list) {
    var mins = [];
    list.forEach(function (c) {
      var m = lengthOf(c);
      if (m && mins.indexOf(m) === -1) mins.push(m);
    });
    mins.sort(function (a, b) { return a - b; });
    var words = mins.map(lengthWord);
    if (!words.length) return '—';
    if (words.length === 1) return words[0];
    return words.slice(0, -1).join(', ') + ' or ' + words[words.length - 1];
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

  function priceLine(id) {
    var p = D.PRICING[id];
    if (p.quoteOnly) return 'Quoted per party';
    if (id === 'as') {
      return money(p.plans.p4) + ' to ' + money(p.plans.p16) + ' a month';
    }
    if (id === 'camp') {
      return money(p.week) + ' a week, or ' + money(p.day) + ' a day';
    }
    if (id === 'nsd') {
      return money(p.base) + ' a day, then ' + money(p.extraHour) + ' an hour';
    }
    if (id === 'priv') {
      return money(p.hourly) + ' an hour, up to ' + p.maxHours + ' hours';
    }
    return money(p.events[0].amount) + ' a ticket';
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
      return plural(ids().length, 'program', 'programs') +
        '. Open one to change what it costs and what families are told about it. ' +
        'Days, rooms and places belong to its classes.';
    },
    actions: [
      { label: 'New program', kind: 'primary', to: 'programBuilder', id: 'new' }
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
            esc(priceLine(id)),
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
     One shape for all six programs. What differs between them is the pricing,
     and that difference is real: a plan ladder, a week rate, an hourly rate,
     a ticket, or a quote. */

  function current(ctx) {
    var id = ctx && ctx.params ? ctx.params.id : '';
    if (id === 'new') return 'new';
    return D.PROGRAMS[id] ? id : 'as';
  }

  /* One editable price, or a stated "None" where there is nothing to set. */
  function priceCell(amount) {
    return amount ? ui.input({ value: money(amount) }) : '<span class="mute">None</span>';
  }

  function priceRow(label, amount, covers) {
    return { cells: [strong(label), priceCell(amount), ui.mute(covers)] };
  }

  function feeRow(id) {
    var p = D.PRICING[id];
    var covers = p.regFee
      ? 'One-time, per child' + (p.siblingRelief ? ' · ' + p.siblingRelief : '')
      : 'No registration fee on this program';
    return priceRow('Registration fee', p.regFee, covers);
  }

  /* "Mon–Fri, 10:00am–1:00pm", read off the classes rather than typed. */
  function whenLine(list) {
    if (!list.length) return '';
    return joinList(list.map(function (c) { return c.day; })) + ', ' +
      joinList(list.map(function (c) { return c.time; }));
  }

  function priceTable(id) {
    var p = D.PRICING[id];
    var list = classesOf(id);
    var rows = [];

    if (id === 'as') {
      PLAN_KEYS.forEach(function (k) {
        rows.push(priceRow(
          k.slice(1) + ' sessions a month',
          p.plans[k],
          /* The ladder is quoted to the cent so $60.00 and $67.50 line up as
             one rate card rather than two ways of writing money. */
          PLAN_PATTERN[k] + ' · an extra class is ' + Grove.money(p.extraClassRate[k])
        ));
      });
    } else if (id === 'camp') {
      rows.push(priceRow('A full week', p.week, whenLine(list)));
      rows.push(priceRow('A single day', p.day, 'Four days or more is worth taking the week'));
      rows.push(priceRow('Extended care, an hour', p.extraHour, 'On every day booked'));
    } else if (id === 'nsd') {
      rows.push(priceRow('A standard day', p.base,
        list.length ? lengthWord(lengthOf(list[0])) + ', ' + list[0].time : 'The standard day'));
      rows.push(priceRow('Each hour after that', p.extraHour,
        'Up to ' + p.maxHours + ' hours in a day'));
    } else if (id === 'priv') {
      rows.push(priceRow('An hour', p.hourly, 'Up to ' + p.maxHours + ' hours in a session'));
    } else if (id === 'pop') {
      p.events.forEach(function (e) { rows.push(priceRow(e.label, e.amount, e.sub)); });
    }

    rows.push(feeRow(id));

    return ui.table(
      ['What families pay', 'Price', 'What it covers'],
      rows
    );
  }

  /* A program billed month after month is the only one where a price change
     reaches a family who has already signed up; everything else is bought
     once, at the price of the day. */
  function recurring(id) {
    return !!D.PRICING[id].plans;
  }

  /* What saving is going to do, in her own terms, counted from the class rows
     rather than written down. She has nobody to undo a price for her. */
  function consequence(id) {
    if (D.PRICING[id].quoteOnly) {
      return 'Parties are quoted by hand, so nothing here changes a quote already given';
    }
    var en = enrolled(classesOf(id));
    if (!en) return 'Nobody is enrolled yet, so a new price applies to new bookings only';
    var who = en === 1 ? '1 child is' : en + ' children are';
    return recurring(id)
      ? who + ' enrolled — a new price is what they are billed from the next invoice'
      : who + ' already booked at the old price — a new price applies from here on';
  }

  /* The rules are the studio's, not the program's, but not every one of them
     touches every program: a party is not billed on the 1st and a ticket to
     Clay Night cannot be made up. Listing the six that suit After-School Art
     on all six programs would state five things that are not true. */
  function ruleRows(id) {
    var p = D.PRICING[id];
    var rows = [];

    rows.push(['Billing', p.quoteOnly
      ? 'Quoted by hand, then invoiced'
      : (recurring(id) ? 'Recurring monthly, on the 1st' : 'Paid when the family books')]);
    rows.push(['Grace period', '7 days, then a $25 late fee']);
    rows.push(['Refunds', 'Non-refundable, credit only']);

    if (recurring(id)) {
      rows.push(['Cancellation notice', '30 days']);
      rows.push(['Make-up credits', 'Cancel 24 hours ahead; the credit expires at the end of the billing cycle']);
      rows.push(['Bookable into', 'Any age-appropriate class']);
    }
    if (!p.quoteOnly) {
      rows.push(['When a class is full', 'The family joins the waitlist, and registration shows the places left']);
    }
    return rows;
  }

  function identityCard(id) {
    var p = id === 'new' ? { name: '', short: '' } : D.program(id);
    return ui.card({
      title: 'Identity',
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
          value: id === 'new' ? '' : (BLURB[id] || ''),
          placeholder: 'One or two sentences for the registration page'
        }),
        hint: 'Shown to families on the registration page.'
      })
    ]));
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
      /* No "Classes: 5" row — the note under this card already counts them. */
      ['Runs on', esc(joinList(list.map(function (c) { return c.day; })))],
      ['Session length', esc(lengthLine(list))],
      ['Ages', esc(agesLine(id))],
      ['Places per class', esc(joinList(list.map(function (c) { return String(c.cap); }), ' / '))],
      ['Rooms', esc(joinList(list.map(function (c) { return c.room; })))],
      ['Instructors', staffLine(list)],
      ['Enrolled', esc(placesLine(id))]
    ]) : ui.empty('No classes yet', 'Add one under Classes and this card fills in.'));

    var prices = ui.card({
      title: 'Prices',
      flush: true,
      note: D.PRICING[id].quoteOnly
        ? 'Every party is quoted by hand from the activity list, so there is no standing price to set.'
        : null,
      foot: '<span class="mute">Registration shows</span>' +
        '<span class="strong">' + esc(priceLine(id)) + '</span>'
    }, priceTable(id));

    var rules = ui.card({
      title: 'Standing rules',
      head: ui.btn({ label: 'Open Settings', kind: 'quiet', size: 'sm', to: 'settings' }),
      note: 'Written once in Settings. Only the rules that touch this program are listed.'
    }, ui.kv(ruleRows(id)));

    var policies = ui.card({
      title: 'Required policies',
      note: 'Attached to every program. A family signs one only when it is new to them or has changed.'
    }, h`<div class="inline">${raw(POLICIES.map(function (name) {
      return ui.pill(name, 'ok');
    }).join(''))}</div>`);

    return ui.grid(2, [identityCard(id), runs]) +
      '<div class="section">' + prices + '</div>' +
      '<div class="section">' + ui.grid(2, [rules, policies]) + '</div>' +
      ui.formActions([
        { label: 'Save changes', kind: 'primary', act: 'saveProgram', msg: 'Saved · ' + p.name },
        { label: 'Cancel', to: 'programs' }
      ], { sticky: true, hint: consequence(id) });
  }

  /* A new program needs a name and a sentence. Its classes, its prices and
     the day it opens are all set somewhere that already owns them, so asking
     for them here would be asking twice. */
  function blank() {
    var next = ui.card({
      title: 'What happens next',
      flush: true
    }, ui.rows([
      {
        title: 'Add its classes',
        sub: 'Days, times, rooms, ages and places per class are set under Classes.'
      },
      {
        title: 'Set what it costs',
        sub: 'The price table appears on this page as soon as the program exists.'
      },
      {
        title: 'The standing rules already apply',
        sub: 'Billing, cancellation, make-ups and the ' + POLICIES.length +
          ' required policies come from Settings, the same as every other program.'
      },
      {
        title: 'Nobody can book it yet',
        sub: 'A program with no classes has nothing for a family to choose at registration.'
      }
    ]));

    return ui.grid(2, [identityCard('new'), next]) +
      ui.formActions([
        { label: 'Create program', kind: 'primary', act: 'saveProgram',
          msg: 'Program created · no classes yet, nobody enrolled' },
        { label: 'Cancel', to: 'programs' }
      ], { sticky: true, hint: 'It starts with no classes and nobody enrolled, so nothing is billed' });
  }

  Grove.screen('programBuilder', {
    surface: 'console',
    crumbs: [{ label: 'Programs', to: 'programs' }],
    eyebrow: function (ctx) {
      return current(ctx) === 'new' ? 'a new program' : 'what it costs, what it says';
    },
    title: function (ctx) {
      var id = current(ctx);
      return id === 'new' ? 'New program' : D.program(id).name;
    },
    sub: function (ctx) {
      if (current(ctx) === 'new') {
        return 'A name and a sentence are enough to create it. Its classes and its prices come after.';
      }
      return 'What this program costs, and what families are told about it. Days, rooms and places ' +
        'are read from its classes; billing and policies from Settings.';
    },

    body: function (ctx) {
      var id = current(ctx);
      return id === 'new' ? blank() : record(id);
    }
  });

  Grove.on('saveProgram', function (d) {
    Grove.go('programs');
    Grove.toast((d && d.msg) || 'Program saved');
  });
})();
