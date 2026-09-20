/* Console → Reports, and the report detail behind each one.

   Written for Sabrina at a desk. She is comfortable with a table of numbers,
   so this is a table of numbers — rows, not paragraphs in cards. What she came
   for is not "how is the studio doing", it is "what needs me today", and the
   screen now answers that in its first row.

   No charts, deliberately. The old screen drew a 38px eight-bar sparkline on
   every card. At that size the bars say nothing a sentence cannot say better,
   and two of them overflowed their own track while a third had three invisible
   zero bars.

   Every figure is DERIVED from the rows shown underneath it. The value, the
   sub-line, the finding, the reading, the thing to do and the total in each
   table foot are all computed from Grove.data, so the number and the rows
   cannot disagree.

   Rebuilt for how the studio actually bills. A family buys a pack of sessions
   for one child; the pack renews when its last session is used. There is no
   month, no billing date and no cycle, so:
     - "Monthly recurring revenue" is gone. It counted a monthly commitment
       that does not exist. What is honestly committed is the value of the
       sessions families have already paid for and not yet taken, and what is
       forecastable is the packs a class or two from renewing. That is the
       report now, and neither figure is a monthly one.
     - the make-up credits report is gone entirely, not renamed. A session
       cancelled in time is simply not spent — it stays in the child's pack, so
       there is no credit to issue, approve, book or expire, and no queue to
       report on. What is left worth knowing is how many absences kept their
       session and how many were spent, which belongs in Attendance, and that
       is where it now sits.
     - sessions do not expire, so no report counts anything lapsing.

   Also cut in this pass:
     - the eight prose cards. Three rows of cards, about 1100px of scroll, and
       a figure that needs nothing from her sat at the same weight as "$803
       out, one card declined twice". The reports are now two tables: the ones
       carrying a deadline, a failure or money that has not arrived, and the
       ones that are only worth knowing. The split is derived from the rows,
       and the rule is printed on the card so it is not magic.
     - "Export all · CSV". Reports of that many different shapes cannot be one
       CSV. Export lives on the report you are actually looking at.
     - the per-card "Open" button. The whole row is the link; two controls for
       one decision is one too many.
     - "Refreshes · Overnight", which was the same line on every report and was
       not even true — the figures are read live from the rows.
     - the card note "A report is a read of the data, never a place to edit
       it." The sticky bar names the screen where the change is made, which
       says the same thing once and does something about it.
     - "Period · 28 July 2026" as a headline stat. It was identical on every
       one and there is nothing she can do about the date. It is stated once in
       the toolbar and once in the footnotes of each report.
     - `rows` and `rowNoun` on each built report. Nothing read them; the table
       foot carries the row count, and the one place they still said "families
       on a monthly plan" was a sentence nobody could see.
     - the detail's header buttons. The one thing to do from a report is to go
       and do it somewhere else, so that button is pinned to the bottom of the
       viewport with the state line beside it.

   Kept deliberately:
     - no money button on this screen. It would be tempting to put "Retry the
       card" on Collection health, and that is exactly how a product ends up
       with six places to reduce what a family owes. A report reads; Billing
       charges.
     - every report, including the ones that need nothing today. A figure with
       no action is not automatically decoration — it is decoration when nobody
       says what it means. Each one says what it means in a sentence, and the
       ones with nothing to do say why there is nothing to do.

   Four of these tables run long: every child holding a pack, every family on
   the books, every child on a roll, every invoice raised. Each is ordered by
   the column its headline claims something about — sessions left, tenure,
   attendance — so the claim is checkable at the top of the table rather than
   somewhere down the scroll. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  var FAMILY_STATUS = {
    'Active': 'ok',
    'Payment failed': 'bad',
    'Past due': 'bad',
    'Pending payment': 'warn',
    'Cancelling': null
  };

  var PILL_KIND = { ok: 'ok', warn: 'warn', bad: 'bad', info: null, neutral: null };

  /* ---- small helpers ------------------------------------------------------- */

  function num(v) { return '<span class="num">' + esc(v) + '</span>'; }
  function money0(n) { return Grove.money(n, { cents: false }); }
  function pct(n, d) { return d ? Math.round((n / d) * 100) + '%' : '—'; }
  function count(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  /* '—' has no number in it; '22.5' and '96%' do. */
  function figure(v) {
    var m = /-?\d+(\.\d+)?/.exec(String(v));
    return m ? parseFloat(m[0]) : null;
  }

  function listOf(items) {
    if (!items.length) return '';
    if (items.length === 1) return items[0];
    return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
  }

  function lcFirst(s) { return String(s).charAt(0).toLowerCase() + String(s).slice(1); }

  function familyOf(student) {
    return D.FAMILIES.filter(function (f) { return f.name === student.family; })[0] || null;
  }

  /* Where a child is, read off the roster rather than off the line typed on
     the record. One class is named in full; several are counted and named by
     program, because three class names do not fit a cell. A child with no
     class has only the line on the record to speak for them — waitlisted, or
     registered and not started — so that is what it says. */
  function classesLine(s) {
    var list = D.classesOf(s);
    if (!list.length) return s.cls || 'No class yet';
    if (list.length === 1) return list[0].day + ' ' + list[0].time + ' · ' + list[0].room;
    var progs = [];
    list.forEach(function (c) {
      var short = D.program(c.prog).short;
      if (progs.indexOf(short) === -1) progs.push(short);
    });
    return count(list.length, 'class', 'classes') + ' · ' + listOf(progs);
  }

  function median(list) {
    var s = list.slice().sort(function (a, b) { return a - b; });
    if (!s.length) return 0;
    var mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
  }

  /* Today comes from the data, so every "since" on this screen is measured
     from it rather than typed in. */
  function stamp() {
    var parts = String(D.today).split(', ');
    return parts[1] || parts[0];
  }

  function monthsSince(since) {
    var t = /([A-Za-z]{3})[a-z]*\s+(\d{4})/.exec(String(D.today));
    var s = /([A-Za-z]{3})[a-z]*\s+(\d{4})/.exec(String(since));
    if (!t || !s) return null;
    var tm = MONTHS.indexOf(t[1]), sm = MONTHS.indexOf(s[1]);
    if (tm === -1 || sm === -1) return null;
    return (parseInt(t[2], 10) - parseInt(s[2], 10)) * 12 + (tm - sm);
  }

  /* The total under a table is the sum of the rows in it, never a literal. */
  function total(label, value) {
    return '<span class="cell-mute">' + esc(label) + '</span>' +
      '<span class="num strong">' + esc(value) + '</span>';
  }

  /* ---- 1. Sessions bought and not yet used ----------------------------------
     A pack belongs to one child, not to the family, and it renews when its
     last session is used. So there is no monthly figure to report and no date
     to report it against. What the studio is holding is the sessions families
     have paid for and not yet taken, priced at the pack they were bought in.
     A pack of 8 is $540, so a session in it is $67.50 — which is why the money
     in this report carries cents. Rounding each row would leave the rows and
     the total disagreeing, and that is the one thing this screen must not do. */

  function packRows() {
    var out = [];
    D.STUDENTS.forEach(function (s) {
      var p = D.pack(s);
      if (!p.isPack) return;
      var price = D.PRICING.as.plans['p' + p.size] || 0;
      var fam = familyOf(s);
      out.push({
        s: s,
        fam: fam,
        size: p.size,
        used: p.used,
        /* renewsIn and left are the same number — the pack renews on the last
           session — so the table prints it once, under the heading that says
           what it means. */
        left: p.left,
        price: price,
        held: p.left * (p.size ? price / p.size : 0),
        renews: !(fam && /not renewing/i.test(fam.plan))
      });
    });
    return out;
  }

  function packs() {
    /* Fewest classes to renewal first: the reading below is about what renews
       next, and that claim should be checkable in the first rows. */
    var rows = packRows().sort(function (a, b) { return a.left - b.left; });
    var noPack = D.STUDENTS.filter(function (s) { return !D.pack(s).isPack; });
    var booked = noPack.filter(function (s) { return D.classesOf(s).length > 0; });
    var idle = noPack.filter(function (s) { return D.classesOf(s).length === 0; });

    var held = 0, sessions = 0, soon = 0, soonValue = 0, ending = [];
    rows.forEach(function (r) {
      held += r.held;
      sessions += r.left;
      if (!r.renews) { ending.push(r); return; }
      if (r.left <= 2) { soon += 1; soonValue += r.price; }
    });

    var table = ui.table(
      ['Child', 'Pack', { label: 'Used', align: 'right' },
        { label: 'Renews in', align: 'right' }, { label: 'Not yet used', align: 'right' }],
      rows.map(function (r) {
        return {
          cells: [
            ui.two(r.s.name, r.s.family + ' family'),
            ui.mute('Pack of ' + r.size + ' · ' + money0(r.price)),
            num(r.used + ' of ' + r.size),
            num(r.renews ? count(r.left, 'class', 'classes') : 'Not renewing'),
            num(Grove.money(r.held))
          ]
        };
      })
    );

    return {
      unit: 'Paid for, not yet used',
      value: Grove.money(held),
      delta: count(sessions, 'session', 'sessions') + ' held by ' + count(rows.length, 'child', 'children'),
      find: 'Families have paid for ' + count(sessions, 'session', 'sessions') +
        ' that have not been taken yet — ' + Grove.money(held) + ' at the pack price each was bought at.',
      read: soon
        ? soon + ' of the ' + rows.length + ' children are within two classes of the end of a pack, so ' +
          money0(soonValue) + ' renews as those classes are taken. Nothing renews on a date: a pack charges ' +
          'again the moment its last session is used.'
        : 'No pack is within two classes of its end, so nothing is about to renew. A pack charges again ' +
          'the moment its last session is used, never on a date.',
      act: 'A pack is bought, resized or stopped on the family record, never here.',
      todo: null,
      todoWhy: '',
      steady: 'Nothing here carries a date. A pack is paid for, so the sessions in it stay the child’s ' +
        'until they are taken. ' + (ending.length
          ? listOf(ending.map(function (r) { return r.s.name; })) +
            (ending.length === 1 ? ' holds a pack that does not renew, so those sessions are the last the studio will bill for.'
              : ' hold packs that do not renew, so those sessions are the last the studio will bill for.')
          : 'Every pack here renews itself when its last session is used.'),
      counts: 'The pack on each child record, priced from the after-school rate card. Fewest classes to ' +
        'renewal first, so the packs about to charge are at the top.',
      excludes: 'The ' + count(noPack.length, 'child', 'children') + ' who hold no pack: ' +
        count(booked.length, 'child is', 'children are') + ' booked into camp and one-off classes only' +
        (idle.length
          ? ', and ' + listOf(idle.map(function (s) { return s.name + ' (' + lcFirst(classesLine(s)) + ')'; }))
          : '') + '.',
      table: table,
      footLabel: count(rows.length, 'child', 'children') + ' holding ' + count(sessions, 'session', 'sessions'),
      footValue: Grove.money(held)
    };
  }

  /* ---- 2. Retention ---------------------------------------------------------
     A family leaving is only a job if it leaves owing something. Whether it
     does is read from its invoices rather than assumed. Leaving means the pack
     is not renewed: they take the sessions they have paid for and stop. */

  function retention() {
    var leaving = D.FAMILIES.filter(function (f) { return f.status === 'Cancelling'; });
    var staying = D.FAMILIES.filter(function (f) { return f.status !== 'Cancelling'; });
    var out = leaving[0];
    var outMonths = out ? monthsSince(out.since) : null;
    var tenures = [];
    D.FAMILIES.forEach(function (f) {
      var m = monthsSince(f.since);
      if (m !== null) tenures.push(m);
    });
    var med = median(tenures);
    var shorter = staying.filter(function (f) {
      var m = monthsSince(f.since);
      return m !== null && outMonths !== null && m < outMonths;
    }).length;

    /* What a leaving family still holds, counted off the children's packs, so
       the last class can be planned for rather than guessed at. */
    var outKids = [], outLeft = 0;
    if (out) {
      D.STUDENTS.forEach(function (s) {
        if (s.family !== out.name) return;
        var p = D.pack(s);
        if (!p.isPack || !p.left) return;
        outKids.push(s.name);
        outLeft += p.left;
      });
    }
    var tail = outKids.length
      ? ' ' + listOf(outKids) + (outKids.length === 1 ? ' has ' : ' have ') +
        count(outLeft, 'session', 'sessions') + ' left to take, and the pack does not renew after that.'
      : '';

    var owing = [], owed = 0;
    leaving.forEach(function (f) {
      D.INVOICES.forEach(function (i) {
        if (i.fam === f.name && i.status !== 'Paid') { owing.push(i); owed += i.amt; }
      });
    });

    var table = ui.table(
      ['Family', 'With us since', { label: 'Months with us', align: 'right' }, { label: 'Status', shrink: true }],
      /* Longest-serving first, which puts the median family in the middle
         row and makes the figure under the table something she can point at. */
      D.FAMILIES.slice().sort(function (a, b) {
        var ma = monthsSince(a.since), mb = monthsSince(b.since);
        if (ma === null) return mb === null ? 0 : 1;
        if (mb === null) return -1;
        return mb - ma;
      }).map(function (f) {
        var m = monthsSince(f.since);
        return {
          cells: [
            ui.two(f.name + ' family', f.guardian),
            ui.mute(f.since),
            num(m === null ? '—' : m),
            ui.pill(f.status, FAMILY_STATUS[f.status])
          ]
        };
      })
    );

    return {
      unit: 'Families staying',
      value: pct(staying.length, D.FAMILIES.length),
      delta: staying.length + ' of ' + D.FAMILIES.length + ' families',
      find: staying.length + ' of ' + D.FAMILIES.length + ' families are staying, and the median family has been with the studio for ' +
        count(med, 'month', 'months') + '.',
      read: out
        ? 'The ' + out.name + ' family is the only one leaving, after ' + count(outMonths, 'month', 'months') +
          ' — longer than ' + shorter + ' of the ' + staying.length + ' staying. This is not a first-term drop-out.' + tail
        : 'Nobody has asked to stop, so every family on the books is expected back.',
      act: 'Whether a pack renews is set on the family record.',
      todo: owing.length ? money0(owed) + ' to settle' : null,
      todoWhy: owing.length
        ? 'The ' + listOf(leaving.map(function (f) { return f.name; })) + ' family is going and ' +
          count(owing.length, 'invoice has', 'invoices have') + ' not been paid. Collect it before the last class.'
        : '',
      steady: out
        ? 'The ' + out.name + ' family has asked not to renew, and its last invoice has settled, so there is nothing left to collect.'
        : 'Nobody has asked to stop.',
      counts: 'The join date and the status on each family record, measured against ' + stamp() + '. Longest first.',
      excludes: 'Nothing. All ' + count(D.FAMILIES.length, 'family', 'families') + ' on the books are counted.',
      table: table,
      footLabel: 'Median tenure across ' + count(D.FAMILIES.length, 'family', 'families'),
      footValue: count(med, 'month', 'months')
    };
  }

  /* ---- 3. Attendance --------------------------------------------------------
     A low figure is worth a word with a family, but it has no date on it. Told
     more than 24 hours ahead, an absence costs the family nothing — the
     session stays in the child's pack and the pack simply lasts a week longer.
     Inside that, the session is spent. Both counts are read off the absence
     rows, which is why this report absorbed what the make-up report used to
     say. This one is something to know, not something to do. */

  function attendance() {
    var withFigure = D.STUDENTS.filter(function (s) { return figure(s.att) !== null; });
    var without = D.STUDENTS.filter(function (s) { return figure(s.att) === null; });
    var sum = 0;
    withFigure.forEach(function (s) { sum += figure(s.att); });
    var avg = withFigure.length ? Math.round(sum / withFigure.length) : 0;
    var low = withFigure.filter(function (s) { return figure(s.att) < 90; });
    var worst = low.slice().sort(function (a, b) { return figure(a.att) - figure(b.att); })[0];

    var kept = D.ABSENCES.filter(function (a) { return !a.spent; });
    var spent = D.ABSENCES.filter(function (a) { return !!a.spent; });
    var absLine = D.ABSENCES.length
      ? count(D.ABSENCES.length, 'absence has', 'absences have') + ' been reported, and ' + kept.length +
        ' of them kept the session in the child’s pack because the studio was told in time' +
        (spent.length
          ? '. In the other ' + count(spent.length, 'case', 'cases') + ' the session was spent, exactly as if the child had come'
          : '') + '.'
      : 'No absence has been reported.';

    var table = ui.table(
      ['Child', 'Classes', { label: 'Attendance', align: 'right' }, { label: 'Absences', align: 'right' }],
      /* Lowest first. The children worth a word are the point of the report,
         and at the length of the roster they should not be hunted for. The
         children with nothing recorded yet sit at the end. */
      D.STUDENTS.slice().sort(function (a, b) {
        var fa = figure(a.att), fb = figure(b.att);
        if (fa === null) return fb === null ? 0 : 1;
        if (fb === null) return -1;
        return fa - fb;
      }).map(function (s) {
        var mine = D.absencesFor(s.name);
        return {
          cells: [
            ui.two(s.name, s.family + ' family'),
            ui.mute(classesLine(s)),
            num(s.att),
            num(mine.length || '—')
          ]
        };
      })
    );

    return {
      unit: 'Average attendance',
      value: avg + '%',
      delta: 'across ' + count(withFigure.length, 'child', 'children') + ' with a record',
      find: 'Attendance averages ' + avg + '% across the ' + count(withFigure.length, 'child', 'children') +
        ' with a record, and ' + count(low.length, 'child sits', 'children sit') + ' below 90%.',
      read: (worst
        ? worst.name + ' is the lowest at ' + worst.att + '. '
        : 'Every child with a record is above 90%. ') + absLine,
      act: 'A child’s record, and the family behind it, is under Families.',
      todo: null,
      todoWhy: '',
      steady: count(low.length, 'child sits', 'children sit') +
        ' below 90%, which is worth a word with the family rather than a job for today. Nothing here carries ' +
        'a date: an absence reported in time costs a family nothing, and a catch-up class booked afterwards ' +
        'spends a session from the pack like any other class.',
      counts: 'The attendance figure recorded against each enrolled child, lowest first. The absence column ' +
        'counts what the studio has been told about that child, whether or not the session was spent.',
      excludes: 'Children with nothing recorded yet — ' +
        listOf(without.map(function (s) { return s.name + ' (' + lcFirst(classesLine(s)) + ')'; })) + '.',
      table: table,
      footLabel: 'Average across ' + count(withFigure.length, 'child', 'children') + ' with a record',
      footValue: avg + '%'
    };
  }

  /* ---- 4. Fill rate ---------------------------------------------------------- */

  function fill() {
    var en = 0, cap = 0, full = 0, waiting = 0, queues = 0, over = null, idle = null, longest = null;
    D.CLASSES.forEach(function (c) {
      if (c.wl && (!longest || c.wl > longest.wl)) longest = c;
      en += c.en;
      cap += c.cap;
      if (c.en >= c.cap) full += 1;
      if (c.en > c.cap && (!over || (c.en - c.cap) > (over.en - over.cap))) over = c;
      if (c.en === 0 && (!idle || c.cap > idle.cap)) idle = c;
      waiting += c.wl || 0;
      if (c.wl) queues += 1;
    });

    var table = ui.table(
      ['Class', 'When', { label: 'Enrolled', align: 'right' },
        { label: 'Fill', align: 'right' }, { label: 'Waiting', align: 'right' }],
      D.CLASSES.map(function (c) {
        return {
          cells: [
            ui.two(c.name, c.room + ' · ages ' + c.band),
            ui.mute(c.day + ' ' + c.time),
            num(c.en + ' / ' + c.cap),
            num(pct(c.en, c.cap)),
            num(c.wl || '—')
          ]
        };
      })
    );

    return {
      unit: 'Places taken',
      value: pct(en, cap),
      delta: en + ' of ' + cap + ' places',
      find: count(D.CLASSES.length, 'class holds', 'classes hold') + ' ' + en + ' children against ' + cap + ' places' +
        (over ? ', and the ' + over.day + ' ' + over.time + ' class is over at ' + over.en + ' in a room for ' + over.cap : '') + '.',
      read: count(waiting, 'child is', 'children are') + ' waiting for ' + count(queues, 'class', 'classes') +
        ' that are already full' + (idle ? ', while the ' + idle.name + ' has sold none of its ' + idle.cap : '') +
        '. The places to add are where the queue already is.',
      act: 'Offers go out in position order from Requests. Places are added under Classes.',
      todo: waiting ? count(waiting, 'child', 'children') + ' waiting' : null,
      todoWhy: count(queues, 'class has', 'classes have') + ' a queue' +
        (longest ? ', the longest ' + longest.wl + ' deep on the ' + longest.day + ' ' + longest.time + ' class' : '') + '.',
      steady: 'Every class has room and nothing is queued.',
      counts: 'The enrollment, the capacity and the waiting count carried on each class.',
      excludes: 'Nothing. All ' + count(D.CLASSES.length, 'class is', 'classes are') +
        ' counted, the one-to-one and the birthday party included.',
      table: table,
      footLabel: 'Across ' + count(D.CLASSES.length, 'class', 'classes') + ', ' + full + ' at or over capacity',
      footValue: en + ' of ' + cap + ' places · ' + pct(en, cap)
    };
  }

  /* ---- 5. Collection health ---------------------------------------------------- */

  function collection() {
    var paid = D.INVOICES.filter(function (i) { return i.status === 'Paid'; });
    var open = D.INVOICES.filter(function (i) { return i.status !== 'Paid'; });
    var billed = 0, collected = 0, owed = 0;
    D.INVOICES.forEach(function (i) { billed += i.amt; });
    paid.forEach(function (i) { collected += i.amt; });
    open.forEach(function (i) { owed += i.amt; });
    var worst = open.slice().sort(function (a, b) { return b.amt - a.amt; })[0];

    var table = ui.table(
      ['Invoice', 'Family', 'Method', { label: 'Amount', align: 'right' }, { label: 'Status', shrink: true }],
      D.INVOICES.map(function (i) {
        return {
          cells: [
            ui.two(i.id, i.date),
            ui.mute(i.fam + ' family'),
            ui.mute(i.method),
            num(Grove.money(i.amt)),
            ui.pill(i.status, PILL_KIND[i.kind])
          ]
        };
      })
    );

    return {
      unit: 'Collected',
      value: pct(collected, billed),
      delta: money0(owed) + ' still out',
      find: 'Of ' + money0(billed) + ' charged, ' + money0(collected) + ' has settled. ' +
        count(open.length, 'invoice is', 'invoices are') + ' open — ' +
        listOf(open.map(function (i) { return i.fam; })) + '.',
      read: worst
        ? 'Most of what is outstanding sits with one family: the ' + worst.fam + ' family at ' + money0(worst.amt) +
          ', ' + pct(worst.amt, owed) + ' of the ' + money0(owed) + ' open. The other ' +
          count(open.length - 1, 'invoice comes', 'invoices come') + ' to ' + money0(owed - worst.amt) + ' between them.'
        : 'Nothing is outstanding — every invoice raised has settled.',
      act: 'Retries and reminders go out from Billing.',
      todo: open.length ? money0(owed) + ' out' : null,
      todoWhy: worst
        ? count(open.length, 'invoice', 'invoices') +
          (worst.note ? ', and the largest reads “' + worst.note + '”' : ', the largest ' + money0(worst.amt) + '.')
        : '',
      steady: 'Every invoice raised has settled.',
      counts: 'Every invoice raised — a pack, a renewal, a camp week, a fee — and what has settled against it.',
      excludes: 'A charge posted to a family ledger that no invoice has picked up yet. Billing counts those in its own outstanding figure, so that number is the larger one.',
      table: table,
      footLabel: count(paid.length, 'invoice', 'invoices') + ' paid of ' + D.INVOICES.length,
      footValue: money0(collected) + ' of ' + money0(billed)
    };
  }

  /* ---- 6. Hours and pay --------------------------------------------------------
     Hours, classes and the hourly wage bill are what the staff records carry,
     so that is the headline. Cost per enrolled child was the old one, and the
     roster answers it — every child on a class roll is countable — so it is
     stated in the reading rather than dropped. */

  function hourly(s) { return /\/hr/.test(String(s.rate)) ? figure(s.rate) : null; }
  function payOf(s) {
    var rate = hourly(s), hrs = figure(s.hrs);
    return (rate === null || hrs === null) ? null : rate * hrs;
  }

  function staffCost() {
    /* A class with nobody on it is still a class. The staff records account
       for the ones that have an instructor; the rest are named rather than
       left to look like a different class count from the other two reports. */
    var named = D.STAFF.map(function (s) { return s.name; });
    var unstaffed = D.CLASSES.filter(function (c) { return named.indexOf(c.staff) === -1; });
    var invited = D.STAFF.filter(function (s) { return s.status === 'Invitation sent'; });

    var hours = 0, classes = 0, wage = 0, teachHours = 0, teachPay = 0, teachers = 0;
    D.STAFF.forEach(function (s) {
      var hrs = figure(s.hrs), pay = payOf(s);
      if (hrs !== null) hours += hrs;
      classes += s.classes || 0;
      if (pay !== null) wage += pay;
      if (s.role === 'Instructor') {
        if (hrs !== null) teachHours += hrs;
        if (pay !== null) teachPay += pay;
        if (s.classes) { teachers += 1; }
      }
    });
    var unrated = D.STAFF.filter(function (s) { return hourly(s) === null; });
    /* Every child on a class roll, counted off the roster rather than off the
       enrollment figures, so a child in three classes is still one child. */
    var onARoll = D.STUDENTS.filter(function (s) { return D.classesOf(s).length > 0; }).length;

    var table = ui.table(
      ['Person', 'Role', { label: 'Classes a week', align: 'right' },
        { label: 'Hours', align: 'right' }, { label: 'Pay a week', align: 'right' }],
      D.STAFF.map(function (s) {
        var pay = payOf(s);
        return {
          cells: [
            ui.two(s.name, s.rate),
            ui.mute(s.role),
            num(s.classes),
            num(s.hrs),
            num(pay === null ? '—' : money0(pay))
          ]
        };
      })
    );

    return {
      unit: 'Hours a week',
      value: String(hours),
      delta: money0(wage) + ' in hourly pay',
      find: 'The team is on the books for ' + hours + ' hours a week and teaches ' + classes +
        ' of the ' + count(D.CLASSES.length, 'class', 'classes') + ' the studio runs' +
        (unstaffed.length
          ? ' — the other ' + count(unstaffed.length, 'class has', 'classes have') + ' no instructor on the record yet'
          : '') + '. The teaching sits with ' + teachers + ' of the ' +
        count(D.STAFF.length, 'person', 'people') + ' on the team, ' + teachHours + ' hours between them.',
      read: 'Hourly pay comes to ' + money0(wage) + ' a week and ' + pct(teachPay, wage) +
        ' of that is teaching. The rest is the front desk and the office.' +
        (onARoll
          ? ' Spread across the ' + count(onARoll, 'child', 'children') + ' on a class roll, the wage bill is ' +
            Grove.money(wage / onARoll) + ' a child a week.'
          : ''),
      act: 'Hours, rates and who teaches what are set on the staff record.',
      todo: unstaffed.length ? count(unstaffed.length, 'class', 'classes') + ' unstaffed' : null,
      todoWhy: listOf(unstaffed.map(function (c) { return c.name; })) +
        (unstaffed.length === 1 ? ' has ' : ' have ') + 'nobody on the record' +
        (invited.length ? ', and ' + listOf(invited.map(function (s) { return s.name; })) +
          ' has not accepted the invitation yet' : '') + '.',
      steady: 'Every class has an instructor on the record.',
      counts: 'The hours and classes a week on each staff record, priced at the rate that record carries.',
      excludes: 'Pay for anyone not on an hourly rate — ' +
        listOf(unrated.map(function (s) { return s.name + ' (' + (s.rate === '—' ? 'no rate recorded' : s.rate) + ')'; })) +
        '. The hours on those records are still counted.',
      table: table,
      footLabel: count(D.STAFF.length, 'person', 'people') + ' · ' + hours + ' hours a week',
      footValue: money0(wage) + ' in hourly pay'
    };
  }

  /* ---- 7. Programs -------------------------------------------------------------
     Revenue per studio hour was the old headline, and no field prices a studio
     hour. Enrollment against places is what the classes record, so that is what
     this reports. */

  function programs() {
    var rows = Object.keys(D.PROGRAMS).map(function (id) {
      var p = D.program(id);
      var list = D.CLASSES.filter(function (c) { return c.prog === id; });
      var en = 0, cap = 0;
      list.forEach(function (c) { en += c.en; cap += c.cap; });
      return { p: p, classes: list.length, en: en, cap: cap, free: cap - en };
    });

    var en = 0, cap = 0, free = 0, big = rows[0], next = null, loosest = rows[0];
    rows.forEach(function (r) {
      en += r.en; cap += r.cap; free += r.free;
      if (r.en > big.en) big = r;
      if (r.free > loosest.free) loosest = r;
    });
    rows.forEach(function (r) {
      if (r !== big && (!next || r.en > next.en)) next = r;
    });
    var unsold = D.CLASSES.filter(function (c) { return c.en === 0; });

    var table = ui.table(
      ['Program', { label: 'Classes', align: 'right' }, { label: 'Enrolled', align: 'right' },
        { label: 'Places', align: 'right' }, { label: 'Free', align: 'right' }],
      rows.map(function (r) {
        return {
          cells: [
            '<span class="cell-strong">' + ui.dot(r.p.color) + ' ' + esc(r.p.name) + '</span>',
            num(r.classes),
            num(r.en),
            num(r.cap),
            num(r.free)
          ]
        };
      })
    );

    return {
      unit: big.p.short + ' share',
      value: pct(big.en, en),
      delta: big.en + ' of ' + en + ' enrollments',
      find: big.p.name + ' is the biggest program — ' + big.en + ' of ' + en + ' enrollments across ' +
        big.classes + ' of the ' + count(D.CLASSES.length, 'class', 'classes') + '. ' +
        (next ? next.p.name + ' is ' + next.en + ' children in ' + count(next.classes, 'class', 'classes') + '.' : ''),
      read: count(free, 'place is', 'places are') + ' unsold across the ' +
        count(rows.length, 'program', 'programs') + ', and ' + loosest.free + ' of them sit in ' + loosest.p.name + '.',
      act: 'Places, prices and the classes under each program are set under Programs.',
      todo: null,
      todoWhy: '',
      steady: (unsold.length
        ? count(unsold.length, 'class has', 'classes have') + ' sold nothing at all — ' +
          listOf(unsold.map(function (c) { return c.name + ' (' + c.cap + ' places)'; })) + '. '
        : 'Every class has sold something. ') +
        'Nothing here carries a date, so this is selling to be done rather than a job for today.',
      counts: 'Every class grouped by the program it belongs to.',
      excludes: 'Nothing. All ' + count(D.CLASSES.length, 'class sits', 'classes sit') + ' under one of the ' +
        count(rows.length, 'program', 'programs') + '.',
      table: table,
      footLabel: count(rows.length, 'program', 'programs') + ' · ' + count(D.CLASSES.length, 'class', 'classes'),
      footValue: en + ' of ' + cap + ' places taken'
    };
  }


  /* ---- 8. Where families come from ---------------------------------------------
     Restored. This was deleted during the rebuild because its headline figure
     could not be checked and its rows rendered empty — the registration form
     asks how a family heard about the studio, and Settings said the answers
     were in Reports, but no field carried the answer. The field exists now
     (FAMILIES.heardVia), so the report counts real rows. */

  function acquisition() {
    var tally = {};
    D.FAMILIES.forEach(function (f) {
      var k = f.heardVia || 'Not asked';
      tally[k] = (tally[k] || 0) + 1;
    });
    var rows = Object.keys(tally).map(function (k) {
      return { source: k, n: tally[k] };
    }).sort(function (a, b) { return b.n - a.n; });

    var total = D.FAMILIES.length;
    var top = rows[0];
    var paid = rows.filter(function (r) { return r.source === 'Instagram' || r.source === 'Google'; });
    var paidN = paid.reduce(function (n, r) { return n + r.n; }, 0);

    var table = ui.table(
      ['How they found us', { label: 'Families', align: 'right' }, { label: 'Share', align: 'right' }],
      rows.map(function (r) {
        return { cells: [
          '<span class="cell-strong">' + esc(r.source) + '</span>',
          num(r.n),
          num(pct(r.n, total))
        ] };
      })
    );

    return {
      unit: 'families on the books',
      value: String(total),
      delta: top.source + ' brought ' + top.n,
      find: top.source + ' is how ' + top.n + ' of ' + total + ' families found the studio (' +
        pct(top.n, total) + '), which is more than any other route.',
      read: paidN
        ? 'Instagram and Google together brought ' + paidN + ' of ' + total + ' — the only two routes ' +
          'that cost money, so they are the two worth measuring against what is spent on them.'
        : 'Nothing here came from a paid route.',
      act: 'The question is asked at the end of the registration form. It can be switched off under Settings → Policies.',
      todo: null,
      todoWhy: '',
      steady: 'Answers are collected once, at registration, so this grows only when a family joins. ' +
        'It says nothing about who stays — that is in Who is staying, and how long.',
      counts: 'Every family on the books, by the answer they gave at registration.',
      excludes: 'Nobody. All ' + total + ' families answered.',
      table: table,
      footLabel: count(rows.length, 'route', 'routes'),
      footValue: total + ' families'
    };
  }

  /* ---- the reports ----------------------------------------------------
     `open` is the screen where the thing can actually be done, and it is the
     primary button on the report. It is not a menu of related pages. */

  var REPORTS = [
    { id: 'packs',       cat: 'Revenue',    title: 'Sessions bought and not yet used', open: { label: 'Open Families', to: 'families' }, build: packs },
    { id: 'retention',   cat: 'Retention',  title: 'Who is staying, and how long',     open: { label: 'Open Families', to: 'families' }, build: retention },
    { id: 'absence',     cat: 'Attendance', title: 'Attendance by child',              open: { label: 'Open Families', to: 'families' }, build: attendance },
    { id: 'fill',        cat: 'Capacity',   title: 'Fill rate by class',               open: { label: 'Open Requests', to: 'requests' }, build: fill },
    { id: 'collection',  cat: 'Payments',   title: 'Collection health',                open: { label: 'Open Billing',  to: 'billing' },  build: collection },
    { id: 'staffcost',   cat: 'Staff',      title: 'Hours and pay across the team',    open: { label: 'Open Staff',    to: 'staff' },    build: staffCost },
    { id: 'programs',    cat: 'Programs',   title: 'Which programs fill',              open: { label: 'Open Programs', to: 'programs' }, build: programs },
    { id: 'acquisition', cat: 'Marketing',  title: 'Where families come from',         open: { label: 'Open Families', to: 'families' }, build: acquisition }
  ];

  function rep(ctx) {
    var id = ctx.params.id;
    for (var i = 0; i < REPORTS.length; i++) {
      if (REPORTS[i].id === id) return REPORTS[i];
    }
    return REPORTS[0];
  }

  /* Build every report once, and hang the report's own identity off the
     result so the two tables can be sliced out of one list. */
  function built() {
    return REPORTS.map(function (r) {
      var b = r.build();
      b.id = r.id;
      b.cat = r.cat;
      b.reportTitle = r.title;
      b.open = r.open;
      return b;
    });
  }

  function needing(list) {
    return list.filter(function (b) { return !!b.todo; });
  }
  function resting(list) {
    return list.filter(function (b) { return !b.todo; });
  }

  /* ---- the list -------------------------------------------------------------- */

  Grove.screen('reports', {
    surface: 'console',
    crumbTitle: 'Reports',
    eyebrow: 'how it is going',
    title: 'Reports',
    sub: 'Every figure here is counted from rows you can open. The reports carrying a deadline, a failure or money that has not arrived are at the top; the rest are where the studio stands.',

    body: function () {
      var all = built();
      var todo = needing(all);
      var rest = resting(all);

      var jobs = ui.card({
        title: 'Needs you today',
        flush: true,
        note: 'A report lands here when its own rows carry a deadline, a failure, or money that has not arrived.'
      }, ui.table(
        ['Report', 'What to do', { label: 'Figure', align: 'right' }],
        todo.map(function (b) {
          return {
            to: 'report',
            id: b.id,
            cells: [
              ui.two(b.reportTitle, b.cat),
              ui.two(b.todo, b.todoWhy),
              ui.two(b.value, b.delta)
            ]
          };
        }),
        {
          emptyTitle: 'Nothing needs you today',
          emptyText: 'No report has a deadline, a failure or an unpaid invoice in its rows.'
        }
      ));

      var standing = ui.card({
        title: 'Where the studio stands',
        flush: true,
        note: 'Nothing in these rows carries a date. They are worth knowing rather than doing.'
      }, ui.table(
        ['Report', 'What it says', { label: 'Figure', align: 'right' }],
        rest.map(function (b) {
          return {
            to: 'report',
            id: b.id,
            cells: [
              ui.two(b.reportTitle, b.cat),
              ui.mute(b.read),
              ui.two(b.value, b.delta)
            ]
          };
        }),
        {
          emptyTitle: 'Every report needs you',
          emptyText: 'All ' + all.length + ' carry something with a date on it today.'
        }
      ));

      return h`${raw(ui.toolbar({
        count: (todo.length
          ? todo.length + ' of ' + all.length + ' reports need you'
          : 'Nothing needs you · ' + all.length + ' reports') +
          ' · the studio as it stands on ' + stamp()
      }))}
        ${raw(jobs)}
        <div class="section">${raw(standing)}</div>`;
    }
  });

  /* ---- one report -------------------------------------------------------------
     The figure, then the rows it came from, then the footnotes. The one thing
     to do from a report is to go and do it somewhere else, so that button sits
     in a bar pinned to the bottom of the viewport with the state line beside
     it, and the header carries no buttons at all. */

  Grove.screen('report', {
    surface: 'console',
    crumbs: [{ label: 'Reports', to: 'reports' }],
    crumbTitle: function (ctx) { return rep(ctx).title; },
    eyebrow: function (ctx) { return rep(ctx).cat.toLowerCase(); },
    title: function (ctx) { return rep(ctx).title; },
    sub: function (ctx) {
      var b = rep(ctx).build();
      return b.find + ' ' + b.read;
    },

    body: function (ctx) {
      var r = rep(ctx);
      var b = r.build();

      var headline = ui.statbar([
        { label: b.unit, value: b.value, sub: b.delta, tone: 'grove' },
        {
          label: 'What to do',
          value: b.todo || 'Nothing today',
          sub: b.todo ? b.todoWhy : b.steady,
          tone: b.todo ? 'clay' : null
        }
      ]);

      var behind = ui.card({
        title: 'The rows behind it',
        flush: true,
        foot: total(b.footLabel, b.footValue)
      }, b.table);

      /* Provenance, under the rows rather than in front of them. A kv row
         right-aligns its value, which left a full sentence ragged down its
         left edge, so a label over the line reads as prose instead. */
      var made = ui.card({ title: 'How this figure is made', flush: true }, ui.rows([
        { title: 'Counts', sub: esc(b.counts) },
        { title: 'Excludes', sub: esc(b.excludes) },
        { title: 'Period', sub: esc('The studio as it stands on ' + stamp() + '. This is today’s rows counted, not a trend.') }
      ]));

      return h`${raw(headline)}
        ${raw(behind)}
        <div class="section">${raw(made)}</div>
        ${raw(ui.formActions([
          { label: r.open.label, kind: 'primary', to: r.open.to },
          { label: 'Export · CSV', msg: r.title + ' exported as CSV' }
        ], { sticky: true, hint: b.act }))}`;
    }
  });
})();
