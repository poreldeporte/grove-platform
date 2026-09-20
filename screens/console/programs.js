/* Console → Programs (the list) and the program record.

   Who this is for: the owner, at a desk, with a keyboard. She opens Programs
   to answer one of two questions — what does this cost, and what does the
   registration page say about it. Everything else on these screens is read
   from somewhere that already owns it.

   THIS PASS — THE BILLING MODEL

   A price on this page used to buy a month. It buys a pack of sessions: the
   family pays once, the child attends, and when the last session in the pack
   is used the pack renews and charges again. There is no billing date, so
   nothing on this page names one.
     - "$280 to $960 a month" in the Price column now reads as pack prices,
       and the ladder is four packs rather than four monthly allowances.
       "4 sessions a month" is "A pack of 4", and what a pack covers is the
       class it renews on plus what one session works out at — $960 for 16 is
       $60 a session, taken off the price in that same row. PRICING.as
       .extraClassRate holds those same four numbers and is no longer quoted
       as a separate charge: a catch-up class spends a session from the pack
       like any other class, so there is nothing extra to bill
     - the standing rules lost "Recurring monthly, on the 1st", the 30-day
       cancellation notice and the make-up credit line. A pack is charged
       again on its last session; a class cancelled more than 24 hours ahead
       simply is not spent, so there is no credit to issue, approve or expire;
       and a family who is finished lets the pack not renew rather than
       giving notice
     - sessions do not expire, and the rules say so where the expiry rule
       used to be
     - the After-School sentence families read no longer says "billed month
       to month. Four to sixteen sessions a month"

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
       the price. The pack prices and the registration fee are now inputs, so
       the page can keep the promise the list makes
     - the price table lost its "Sessions" column, which restated the pack
       name, and its "Extra class" column, which was really the per-session
       rate and now reads as one on the pack's own line. One table shape —
       what families pay, the price, what it covers — serves all six programs
       instead of one shape for After-School and nothing for the other five
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
       After-School Art's. Renewal, missed classes, catching up and not
       renewing were being stated over a birthday party and a pop-up ticket,
       where none of them are true. A program sold as packs shows all of
       them; a program bought once shows the three that still apply
     - "Classes: 5" left the How it runs card: the note under it already
       counts them, and the two cards on that row now end within a line of
       each other

   STANDING DECISIONS CARRIED OVER
     - no status pill and no term dates: Grove.data holds neither a term
       calendar nor an enrolment state, and the previous build printed a
       start date for classes that had been running since spring
     - the badge PNGs stay out. A program is marked with ui.dot(color), the
       way it is marked everywhere else
     - the blurbs are the registration copy, word for word. The After-School
       one is the exception this pass: its old sentence sold a month, so it
       now says what a pack is and when it renews */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  /* What each program is, in the same words families are shown at
     registration, so screens/registration/pick.js and this page cannot
     describe the same program differently. */
  var BLURB = {
    as: 'A fixed weekly place across the school year. You buy a pack of sessions — four, eight, twelve or sixteen — and it renews when the last one is used.',
    camp: 'Full days of making through the summer and school breaks. Take a whole week or pick individual days.',
    nsd: 'For teacher workdays and county holidays. Three hours as standard, extend by the hour if you need to.',
    priv: 'One-to-one time with an instructor, on a subject your child chooses. Up to three hours in a session.',
    bday: 'A party built round a theme and a project, picked from forty-four activities. Tell us what you want and we will price it.',
    pop: 'One-off evenings for a single project. Clay Night is the next one, and it is nearly gone.'
  };

  /* The four packs the studio sells. The key counts the sessions in the pack:
     p8 is eight sessions, bought together and renewed together. Nothing here
     is a monthly allowance — how fast a pack is used is how often the child
     comes. */
  var PACK_KEYS = ['p4', 'p8', 'p12', 'p16'];

  Grove.on('togglePolicy', function (d) {
    var id = Grove.state.params.id || 'as';
    Grove.flip(Grove.policyKey(id, d.id), D.policiesFor(id).indexOf(d.id) !== -1);
  });

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

  /* 'p8' → 8. The pack key is the number of sessions in the pack. */
  function packSize(key) { return parseInt(key.slice(1), 10); }

  /* 8 → '8th'. A pack renews on a class, never on a date, so the next charge
     is always said as a class. */
  function ordinal(n) {
    var tens = n % 100, unit = n % 10, suffix = 'th';
    if (tens < 11 || tens > 13) {
      if (unit === 1) suffix = 'st';
      else if (unit === 2) suffix = 'nd';
      else if (unit === 3) suffix = 'rd';
    }
    return n + suffix;
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
      var first = PACK_KEYS[0], last = PACK_KEYS[PACK_KEYS.length - 1];
      return money(p.plans[first]) + ' for a pack of ' + packSize(first) +
        ', up to ' + money(p.plans[last]) + ' for ' + packSize(last);
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
      PACK_KEYS.forEach(function (k) {
        var size = packSize(k);
        rows.push(priceRow(
          'A pack of ' + size,
          p.plans[k],
          /* What a session works out at, divided out of the price in this same
             row, so the four packs can be compared. PRICING.as.extraClassRate
             carries the same four numbers; it is not quoted as a charge,
             because a catch-up class spends a session rather than costing
             extra. */
          'Renews when the ' + ordinal(size) + ' session is used · ' +
            money(p.plans[k] / size) + ' a session'
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

  /* A program sold as packs charges again every time a pack renews, so a new
     price reaches a family who has already signed up. Everything else is
     bought once, at the price of the day. */
  function renews(id) {
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
    return renews(id)
      ? who + ' enrolled — a new price is what they pay the next time a pack renews'
      : who + ' already booked at the old price — a new price applies from here on';
  }

  /* The rules are the studio's, not the program's, but not every one of them
     touches every program: a party does not renew and a ticket to Clay Night
     is not a session out of a pack. Listing all eight that suit After-School
     Art on all six programs would state four things that are not true. */
  function ruleRows(id) {
    var p = D.PRICING[id];
    var rows = [];

    rows.push(['Paying', p.quoteOnly
      ? 'Quoted by hand, then invoiced'
      : (renews(id)
        ? 'A pack is charged when it is bought, and again when its last session is used'
        : 'Paid when the family books')]);
    rows.push(['Grace period', '7 days, then a $25 late fee']);
    rows.push(['Refunds', renews(id)
      ? 'A pack is not refunded — the sessions stay with the child until they are used'
      : 'Non-refundable once the place is held']);

    if (renews(id)) {
      rows.push(['Sessions', 'They do not expire. The pack is paid for, so it is theirs until used']);
      rows.push(['Missing a class', 'More than 24 hours notice and the session stays in the pack; inside 24 hours it is spent']);
      rows.push(['Catching up', 'Book an extra class in any age-appropriate class; it spends a session like any other']);
      rows.push(['Not renewing', 'The family uses the sessions they have paid for and the pack does not renew']);
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

    /* Attach and detach on the programme itself. Every clause the studio has
       is listed; the ones this programme carries are switched on. The default
       comes from the programme type, so a camp starts without the two
       class-scheduling clauses and a private class starts with three extra. */
    var attached = Grove.policiesFor(id);
    var policies = ui.card({
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
        sub: 'Paying, renewal and missed classes come from Settings, the same as every ' +
          'other program, and the required policies follow the program type.'
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
