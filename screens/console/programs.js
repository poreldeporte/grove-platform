/* Console → Programs (the list) and the program record.

   Who this is for: the owner, at a desk, with a keyboard. She opens Programs
   to answer one of two questions — what does this cost, and what does the
   registration page say about it. Everything else on these screens is read
   from somewhere that already owns it.

   THIS PASS — THE FINAL PRICING MODEL

   The studio sells two things, and this page now says which is which on every
   row. After-School Art is a PLAN: hours a month, four, eight, twelve or
   sixteen, and the parent chooses how to split them into classes. Everything
   else — a camp week, a no-school day, a private class, a pop-up, a party —
   is a ONE-OFF booking, paid for when it is booked, with no plan, no cycle
   and no renewal.

     - the pack vocabulary is gone. No "pack of 8", no "sessions used", no
       "renews on the 8th class". A price row reads "8 hours a month · $540",
       and what it covers is the hourly rate divided out of that same row
       plus the splits those hours make against this program's own class
       lengths — "8 classes of 1 hour or 4 of 2 hours". PRICING.as
       .extraClassRate is never quoted as a separate charge: it is the same
       number as the plan's own hourly rate, so it is divided out rather than
       restated
     - the Price cell in the list carries a second line, "A plan · hours a
       month" or "One-off booking". That distinction is the whole shape of the
       pricing and it was invisible while every row read as a price alone
     - the standing rules are D.RULES and D.PLAN_YEAR as written, not this
       file's own version of them: the 24-hour cancel, what a late cancel
       costs, where a make-up may be taken, the four things a make-up cannot
       do, the make-up window rendered from whichever option is set, that
       plans are not frozen, that hours not booked are lost, and the 30 days
       notice to cancel. A one-off program shows none of them, because none of
       them are true of a birthday party or a pop-up ticket
     - renewal is replaced by the plan year. A plan runs to PLAN_YEAR.ends and
       ends there, so nothing on this page renews and nothing is billed on a
       date of the month
     - the exceptions — an extra class when a child's school finishes later
       than the program, a private class that comes up, an event — are not
       modelled here. One standing rule points at the one action the owner
       already uses, Billing → Post a sale, and says what it does not do: it
       does not add hours to a cycle and it does not change a plan
     - the registration fee is per child PER YEAR, which is what
       PRICING.as.regFeePer says. It was being read out as "One-time, per
       child, once a year", which is two different answers in one line
     - "session" is gone from the private class too. Three hours is one
       booking; the word only ever meant a unit that no longer exists
     - the 24-hour cancel and what a late cancel costs are two rows, not one
       sentence. R.lateCancel is written to stand alone, so glued to the rule
       before it the pair read as a contradiction. The plan's own cancellation
       row says "Cancelling the plan", so it cannot be mistaken for it
     - "Session length" in How it runs is "Class length": a class is a class,
       and the hours are what is bought

   THE SHAPE, CARRIED OVER

   The list
     - six cards became one table. A card carried four facts and a paragraph
       of registration copy, so comparing the price or the fill rate of two
       programs meant scrolling a screenful. The paragraph is on the record,
       where it is edited
     - the row is the link; there is no per-card "Open" and no "Copy a
       program", which raised a toast claiming classes had been created
     - every figure on the screen is counted off the rows on show, foot
       included

   The record
     - three of its five controls were not controls — age bands, session
       length and places per class all restated what the classes already
       carry. They are stated in "How it runs" instead
     - what she opens this page to change is the price, so the prices are
       inputs. One table shape serves all six programs: what families pay,
       the price, what it covers
     - "Save changes" is pinned to the foot of the viewport, because the page
       is three screens long, and it states the consequence of saving —
       counted from the rows, in children rather than places, because a child
       in three classes is one family's bill and not three

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

  function plural(n, one, many) {
    return n + ' ' + (n === 1 ? one : many);
  }

  /* A plan is hours a month. 'p8' is eight hours, not eight classes. */
  function planHours(key) { return parseInt(key.slice(1), 10); }

  function planKeys(p) {
    return Object.keys(p.plans || {}).sort(function (a, b) {
      return planHours(a) - planHours(b);
    });
  }

  /* After-School is the only program with a plan. Everything else is bought
     once, at the price of the day. */
  function hasPlan(id) { return !!D.PRICING[id].plans; }
  function quoted(id) { return !!D.PRICING[id].quoteOnly; }

  function soldAs(id) {
    return hasPlan(id) ? 'A plan · hours a month' : 'One-off booking';
  }

  function planProgramsLine() {
    var names = ids().filter(hasPlan).map(function (id) { return D.program(id).name; });
    if (!names.length) return 'No program is sold as a plan';
    return joinList(names) +
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

  function priceLine(id) {
    var p = D.PRICING[id];
    if (p.quoteOnly) return 'Quoted per party';
    if (hasPlan(id)) {
      var keys = planKeys(p), first = keys[0], last = keys[keys.length - 1];
      return money(p.plans[first]) + ' for ' + planHours(first) + ' hours a month, up to ' +
        money(p.plans[last]) + ' for ' + planHours(last);
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
    return money(p.events[0].amount) + ' a child';
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
      var all = ids(), rest = all.length - all.filter(hasPlan).length;
      return plural(all.length, 'program', 'programs') + '. ' + planProgramsLine() +
        ' — hours a month, to the end of the school year. ' +
        (rest === 1 ? 'The other one is booked and paid for one at a time.'
                    : 'The other ' + rest + ' are booked and paid for one at a time.') +
        ' Open one to change what it costs and what families are told about it.';
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
            ui.two(priceLine(id), soldAs(id)),
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
     and that difference is real: a plan in hours a month, a week rate, an
     hourly rate, a ticket, or a quote. */

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

  /* PRICING.as.regFeePer reads "child, once a year", so this fee is not a
     one-time charge and saying so was wrong: it is charged per child, every
     year. The sibling relief is relief on THIS fee and never on tuition, and
     PRICING.as.siblingRelief already says which. */
  function feeRow(id) {
    var p = D.PRICING[id];
    var per = 'Per ' + (p.regFeePer || 'child, one time');
    var covers = p.regFee
      ? per + (p.siblingRelief ? ' · ' + p.siblingRelief : '')
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

    if (hasPlan(id)) {
      planKeys(p).forEach(function (k) {
        var hours = planHours(k);
        var split = splitLine(hours, list);
        rows.push(priceRow(
          hours + ' hours a month',
          p.plans[k],
          /* The hourly rate divided out of the price in this same row.
             PRICING.as.extraClassRate holds the same four numbers and is not
             quoted as a charge: an hour is an hour, whichever plan buys it. */
          money(p.plans[k] / hours) + ' an hour' + (split ? ' · ' + split : '')
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
      rows.push(priceRow('An hour', p.hourly, 'Up to ' + p.maxHours + ' hours in one booking'));
    } else if (id === 'pop') {
      p.events.forEach(function (e) { rows.push(priceRow(e.label, e.amount, e.sub)); });
    }

    rows.push(feeRow(id));

    return ui.table(
      ['What families pay', 'Price', 'What it covers'],
      rows
    );
  }

  /* The rate falls as the plan grows, and both ends of that are divided out
     of the ladder rather than written down. */
  function priceNote(id) {
    if (quoted(id)) {
      return 'Every party is quoted by hand from the activity list, so there is no standing price to set.';
    }
    if (!hasPlan(id)) return null;
    var p = D.PRICING[id];
    var rates = planKeys(p).map(function (k) { return p.plans[k] / planHours(k); });
    return 'Hours are the unit, not classes. The parent chooses how to split them at registration, ' +
      'and the rate falls from ' + money(rates[0]) + ' an hour on the smallest plan to ' +
      money(rates[rates.length - 1]) + ' on the largest.';
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

  /* The rules are the studio's, and they come from D.RULES and D.PLAN_YEAR so
     that no two screens carry a different version of what a family signed.
     Not every rule touches every program: a party does not have a cycle, and
     a make-up cannot be taken on a pop-up ticket, so a one-off program is
     spared the eight that belong to a plan. */
  function windowLine(w) {
    return /^\d/.test(String(w)) ? 'Within ' + w : 'Within the ' + w;
  }

  function ruleRows(id) {
    var R = D.RULES, Y = D.PLAN_YEAR, rows = [];

    if (quoted(id)) {
      rows.push(['Paying', esc('Quoted by hand from the activity list, then invoiced')]);
    } else if (hasPlan(id)) {
      rows.push(['Paying', esc('The invoice is raised on the last class of a cycle, lists the dates ' +
        'of the next one and covers them, on the card on file')]);
      rows.push(['The ' + Y.label + ' plan year', esc('Runs to ' + Y.ends + '. ' + Y.note)]);
      rows.push(['Hours not booked', esc(R.unusedHours)]);
      /* Two rules, two rows. Run together they read as a contradiction —
         "cancel and it becomes a make-up. The class is counted as attended" —
         because R.lateCancel is written to stand on its own and loses its
         condition when it is glued to the sentence before it. */
      rows.push(['Cancelling a class', esc('Cancel in the portal at least ' + R.cancelNotice +
        ' before the class and it becomes a make-up.')]);
      rows.push(['A late cancel or a no-show', esc(R.lateCancel)]);
      rows.push(['Taking a make-up', esc(R.makeupWhere + ' ' + windowLine(R.makeupWindow) + '.')]);
      rows.push(['A make-up cannot', esc(R.makeupNever.join(' · '))]);
      rows.push(['Freezing', esc(R.freeze)]);
      rows.push(['Cancelling the plan', esc(R.cancelPlan)]);
    } else {
      rows.push(['Paying', esc('Paid when the family books. There is no plan, no cycle and nothing renews')]);
    }

    /* The one mechanism for every exception. An extra class because a child's
       school finishes later than the program, a private class that comes up,
       an event: one charge, one amount, one reason, on the card on file. The
       owner calls it posting a sale and it already exists on Billing, so this
       page names it rather than growing a control of its own. */
    rows.push(['Anything extra', esc('An extra class, a private class, an event or any other service ' +
      'is one charge on the card on file, posted from Billing → Post a sale. It does not add ' +
      'hours to a cycle or change a plan')]);

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
          value: id === 'new' ? '' : blurb(id),
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
      ['Sold as', esc(soldAs(id))],
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

  /* A class nobody is teaching is worth seeing from here, so it reads the way
     it reads on the Classes screen. */
  function staffLine(list) {
    return uniq(list.map(function (c) { return c.staff; })).map(function (name) {
      return name === 'Unassigned'
        ? '<span class="clay">Unassigned</span>'
        : esc(name);
    }).join(', ');
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
        sub: 'The price table appears on this page as soon as the program exists. A new program ' +
          'is booked and paid for one at a time: ' + esc(planProgramsLine()) + '.'
      },
      {
        title: 'The standing rules already apply',
        sub: 'Paying, make-ups and cancelling come from Settings, the same as every other ' +
          'program, and the required policies follow the program type.'
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
      var id = current(ctx);
      if (id === 'new') {
        return 'A name and a sentence are enough to create it. Its classes and its prices come after.';
      }
      return (hasPlan(id)
        ? 'Sold as a plan: hours a month, to the end of the school year. '
        : 'Booked and paid for one at a time. ') +
        'What this program costs, and what families are told about it. Days, rooms and places ' +
        'are read from its classes; the standing rules from Settings.';
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
