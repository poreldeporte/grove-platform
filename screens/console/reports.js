/* Console → Reports, and the report detail behind each card.

   No charts, deliberately. The old screen drew a 38px eight-bar sparkline on
   every card. At that size the bars say nothing a sentence cannot say better,
   and two of the nine overflowed their own track while a third had three
   invisible zero bars. A studio owner reading a prototype needs the number and
   the sentence; a fake chart is noise.

   Every figure on this screen is now DERIVED from the rows shown underneath
   it. The previous build carried nine typed-in headline numbers — $34,180 of
   recurring revenue over eight families whose plans come to $2,700, 96.4%
   collected over eight invoices of which three are unpaid, "5 classes full"
   over twelve classes of which four are at or over capacity — and a supporting
   table that could not add up to any of them. Nothing here is typed in by hand
   any more: the value, the sub-line, the finding, the reading and the total in
   each card foot are all computed from Grove.data, so the number and the rows
   can no longer disagree.

   Other simplifications:
     - the "Where families come from" report is gone. Nothing in the platform
       records where a family heard of the studio, so it had no rows, and its
       "38 new this quarter" could not be checked against anything. A report
       that cannot be derived is a dead page; eight real ones are better than
       nine with a hole in the middle.
     - the four date-range chips are gone with it. The dataset holds one state
       of the studio and no history, so a range picker that changed nothing but
       the word under it was a control pretending to work. The period is stated
       once, in the strip on the detail. (Before the chips, picking a range was
       a whole form screen: preset, from, to, plus two "what to include"
       selects that belong to the statement rather than to a report.)
     - nine delta colours carrying three different meanings, all of which read
       the same at a glance, collapse to one muted line under the figure.
     - the detail's "Back to reports" button is gone. The shell draws
       breadcrumbs on every screen, so a second way back is ceremony.
     - "How it is counted" was the same three lines on all nine reports. It is
       now per report, and its "Excludes" line names the rows that are left out
       and why — which is how the camp booking, the unpaid registration and the
       cancelling family stopped sitting inside a recurring-revenue total.
     - the export button was labelled CSV and toasted PDF. It says CSV both
       times. */
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

  function median(list) {
    var s = list.slice().sort(function (a, b) { return a - b; });
    if (!s.length) return 0;
    var mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
  }

  /* The dataset states its own today, so every "since" on this screen is
     measured from it rather than typed in. */
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

  /* ---- 1. Monthly recurring revenue ----------------------------------------
     A family contributes to recurring revenue only if its record carries a
     monthly session plan, and the amount is the after-school rate card's price
     for that plan. A camp week, an unpaid registration and a membership that
     ends next month are not recurring, so they are named as excluded rather
     than sat inside the total. */

  function planPrice(f) {
    if (!/sessions\s*\/\s*month/i.test(f.plan)) return 0;
    var nums = String(f.plan).match(/\d+/g) || [];
    var sum = 0;
    nums.forEach(function (n) {
      var price = D.PRICING.as.plans['p' + n];
      if (price) sum += price;
    });
    return sum;
  }

  function mrr() {
    var on = D.FAMILIES.filter(function (f) { return planPrice(f) > 0; });
    var off = D.FAMILIES.filter(function (f) { return planPrice(f) === 0; });
    var sum = 0, top = on[0];
    on.forEach(function (f) {
      sum += planPrice(f);
      if (planPrice(f) > planPrice(top)) top = f;
    });

    var table = ui.table(
      ['Family', 'Current plan', { label: 'A month', align: 'right' }, { label: 'Status', shrink: true }],
      on.map(function (f) {
        return {
          cells: [
            ui.two(f.name + ' family', f.guardian),
            ui.mute(f.plan),
            num(money0(planPrice(f))),
            ui.pill(f.status, FAMILY_STATUS[f.status])
          ]
        };
      })
    );

    return {
      unit: 'Committed a month',
      value: money0(sum),
      delta: count(on.length, 'family', 'families') + ' on a monthly plan',
      find: 'Tuition committed before a single camp is sold — ' + money0(sum) + ' a month from ' +
        count(on.length, 'family', 'families') + ' on a monthly session plan.',
      read: 'The ' + top.name + ' family is ' + money0(planPrice(top)) + ' of it, ' +
        pct(planPrice(top), sum) + ' of the total, so one cancellation moves this figure further than a quiet month of enquiries does.',
      act: 'A plan is changed on the family record. This page only reads it.',
      counts: 'The session plan on each family record, priced from the after-school rate card.',
      excludes: listOf(off.map(function (f) { return f.name + ' (' + f.plan + ')'; })) + '.',
      table: table,
      rows: on.length,
      rowNoun: 'families on a monthly plan',
      footLabel: count(on.length, 'family', 'families') + ' on a monthly plan',
      footValue: money0(sum) + ' a month'
    };
  }

  /* ---- 2. Retention --------------------------------------------------------- */

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

    var table = ui.table(
      ['Family', 'With us since', { label: 'Months with us', align: 'right' }, { label: 'Status', shrink: true }],
      D.FAMILIES.map(function (f) {
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
          ' — longer than ' + shorter + ' of the ' + staying.length + ' staying. This is not a first-term drop-out.'
        : 'Nobody is on notice, so every family on the books is expected next month.',
      act: 'Notice is recorded on the family record, and the last billing date with it.',
      counts: 'The join date and the status on each family record, measured against ' + stamp() + '.',
      excludes: 'Nothing. All ' + count(D.FAMILIES.length, 'family', 'families') + ' on the books are counted.',
      table: table,
      rows: D.FAMILIES.length,
      rowNoun: 'families on the books',
      footLabel: 'Median tenure across ' + count(D.FAMILIES.length, 'family', 'families'),
      footValue: count(med, 'month', 'months')
    };
  }

  /* ---- 3. Attendance -------------------------------------------------------- */

  function attendance() {
    var withFigure = D.STUDENTS.filter(function (s) { return figure(s.att) !== null; });
    var without = D.STUDENTS.filter(function (s) { return figure(s.att) === null; });
    var sum = 0, credits = 0;
    withFigure.forEach(function (s) { sum += figure(s.att); });
    D.STUDENTS.forEach(function (s) { credits += s.mk || 0; });
    var avg = withFigure.length ? Math.round(sum / withFigure.length) : 0;
    var low = withFigure.filter(function (s) { return figure(s.att) < 90; });

    var table = ui.table(
      ['Child', 'Class', { label: 'Attendance', align: 'right' }, { label: 'Credits', align: 'right' }],
      D.STUDENTS.map(function (s) {
        return {
          cells: [
            ui.two(s.name, s.family + ' family'),
            ui.mute(s.cls),
            num(s.att),
            num(s.mk)
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
      read: 'The same children hold ' + count(credits, 'make-up credit', 'make-up credits') +
        ' between them, so the absences that were reported in time are already owed back as classes.',
      act: 'A credit is approved and booked under Requests, not here.',
      counts: 'The attendance figure recorded against each enrolled child.',
      excludes: 'Children with nothing recorded yet — ' +
        listOf(without.map(function (s) { return s.name + ' (' + s.cls + ')'; })) + '.',
      table: table,
      rows: D.STUDENTS.length,
      rowNoun: 'children on the roster',
      footLabel: 'Average across ' + count(withFigure.length, 'child', 'children') + ' with a record',
      footValue: avg + '%'
    };
  }

  /* ---- 4. Fill rate --------------------------------------------------------- */

  function fill() {
    var en = 0, cap = 0, full = 0, waiting = 0, queues = 0, over = null, idle = null;
    D.CLASSES.forEach(function (c) {
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
      act: 'Offers go out in position order from Requests.',
      counts: 'The enrolment, the capacity and the waiting count carried on each class.',
      excludes: 'Nothing. All ' + count(D.CLASSES.length, 'class is', 'classes are') +
        ' counted, the one-to-one and the birthday party included.',
      table: table,
      rows: D.CLASSES.length,
      rowNoun: 'classes on the books',
      footLabel: 'Across ' + count(D.CLASSES.length, 'class', 'classes') + ', ' + full + ' at or over capacity',
      footValue: en + ' of ' + cap + ' places · ' + pct(en, cap)
    };
  }

  /* ---- 5. Make-up credits ---------------------------------------------------- */

  function makeups() {
    var order = [], tally = {};
    D.MAKEUPS.forEach(function (m) {
      if (order.indexOf(m.status) === -1) order.push(m.status);
      tally[m.status] = (tally[m.status] || 0) + 1;
    });
    var booked = tally['Booked'] || 0;
    var expiringN = tally['Expiring'] || 0;
    var expiring = D.MAKEUPS.filter(function (m) { return m.status === 'Expiring'; })[0];
    var breakdown = order.map(function (s) { return tally[s] + ' ' + lcFirst(s); });

    var table = ui.table(
      ['Child', 'Missed', 'Expires', { label: 'Status', shrink: true }],
      D.MAKEUPS.map(function (m) {
        return {
          cells: [
            ui.two(m.child, m.reason),
            ui.mute(m.missed),
            ui.mute(m.expires),
            ui.pill(m.status, PILL_KIND[m.kind])
          ]
        };
      })
    );

    return {
      unit: 'Credits open',
      value: String(D.MAKEUPS.length),
      delta: booked + ' booked, ' + expiringN + ' expiring',
      find: count(D.MAKEUPS.length, 'credit is', 'credits are') + ' open: ' + listOf(breakdown) + '.',
      read: expiring
        ? expiring.child + '’s credit lapses on ' + expiring.expires + ' because ' + lcFirst(expiring.booked) +
          '. Every credit that expires is a class a family paid for and did not get.'
        : 'Nothing is about to expire, so every credit still has a class it can be taken in.',
      act: 'Approving a request and booking the slot both happen under Requests.',
      counts: 'One credit for each session missed, as recorded against the child.',
      excludes: 'Nothing. Every one of the ' + count(D.MAKEUPS.length, 'credit', 'credits') +
        ' is counted, whatever state it is in.',
      table: table,
      rows: D.MAKEUPS.length,
      rowNoun: 'credits recorded',
      footLabel: count(D.MAKEUPS.length, 'credit', 'credits') + ' open',
      footValue: breakdown.join(' · ')
    };
  }

  /* ---- 6. Collection health --------------------------------------------------- */

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
      find: 'Of ' + money0(billed) + ' billed, ' + money0(collected) + ' has settled. ' +
        count(open.length, 'invoice is', 'invoices are') + ' open — ' +
        listOf(open.map(function (i) { return i.fam; })) + '.',
      read: worst
        ? 'Most of what is outstanding sits with one family: the ' + worst.fam + ' family at ' + money0(worst.amt) +
          ', ' + pct(worst.amt, owed) + ' of the ' + money0(owed) + ' open' +
          (worst.note ? '. The invoice reads “' + worst.note + '”' : '.')
        : 'Nothing is outstanding — every invoice raised has settled.',
      act: 'Retries and reminders go out from Billing.',
      counts: 'Every invoice raised, and what has settled against it.',
      excludes: 'A charge posted to a family ledger that no invoice has picked up yet. Billing counts those in its own outstanding figure, so that number is the larger one.',
      table: table,
      rows: D.INVOICES.length,
      rowNoun: 'invoices raised',
      footLabel: count(paid.length, 'invoice', 'invoices') + ' paid of ' + D.INVOICES.length,
      footValue: money0(collected) + ' of ' + money0(billed)
    };
  }

  /* ---- 7. Hours and pay --------------------------------------------------------
     Cost per enrolled child was the old headline. It cannot be derived: the
     dataset holds ten named children against 124 enrolments, so any per-child
     figure would be a guess. What the staff records do support is hours,
     classes and the hourly wage bill, and that is what this now reports. */

  function hourly(s) { return /\/hr/.test(String(s.rate)) ? figure(s.rate) : null; }
  function payOf(s) {
    var rate = hourly(s), hrs = figure(s.hrs);
    return (rate === null || hrs === null) ? null : rate * hrs;
  }

  function staffCost() {
    var hours = 0, classes = 0, wage = 0, teachHours = 0, teachPay = 0, teachers = 0, teachClasses = 0;
    D.STAFF.forEach(function (s) {
      var hrs = figure(s.hrs), pay = payOf(s);
      if (hrs !== null) hours += hrs;
      classes += s.classes || 0;
      if (pay !== null) wage += pay;
      if (s.role === 'Instructor') {
        if (hrs !== null) teachHours += hrs;
        if (pay !== null) teachPay += pay;
        if (s.classes) { teachers += 1; teachClasses += s.classes; }
      }
    });
    var unrated = D.STAFF.filter(function (s) { return hourly(s) === null; });

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
      find: 'The team is on the books for ' + hours + ' hours a week and teaches ' +
        count(classes, 'class', 'classes') + '. ' + count(teachers, 'instructor carries', 'instructors carry') + ' ' +
        teachClasses + ' of them in ' + teachHours + ' hours between them.',
      read: 'Hourly pay comes to ' + money0(wage) + ' a week and ' + pct(teachPay, wage) +
        ' of that is teaching. The rest is the front desk and the office.',
      act: 'Hours and rates are set on the staff record.',
      counts: 'The hours and classes a week on each staff record, priced at the rate that record carries.',
      excludes: 'Pay for anyone not on an hourly rate — ' +
        listOf(unrated.map(function (s) { return s.name + ' (' + (s.rate === '—' ? 'no rate recorded' : s.rate) + ')'; })) +
        '. The hours on those records are still counted.',
      table: table,
      rows: D.STAFF.length,
      rowNoun: 'people on the team',
      footLabel: count(D.STAFF.length, 'person', 'people') + ' · ' + hours + ' hours a week',
      footValue: money0(wage) + ' in hourly pay'
    };
  }

  /* ---- 8. Programs -------------------------------------------------------------
     Revenue per studio hour was the old headline, and nothing in the dataset
     prices a studio hour. Enrolment against places is what the classes record,
     so that is what this reports. */

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
      delta: big.en + ' of ' + en + ' enrolments',
      find: big.p.name + ' is the biggest program — ' + big.en + ' of ' + en + ' enrolments across ' +
        big.classes + ' of the ' + count(D.CLASSES.length, 'class', 'classes') + '. ' +
        (next ? next.p.name + ' is ' + next.en + ' children in ' + count(next.classes, 'class', 'classes') + '.' : ''),
      read: count(free, 'place is', 'places are') + ' unsold across the ' +
        count(rows.length, 'program', 'programs') + ', and ' + loosest.free + ' of them sit in ' + loosest.p.name + '.',
      act: 'Places, prices and the classes under each program are set under Programs.',
      counts: 'Every class grouped by the program it belongs to.',
      excludes: 'Nothing. All ' + count(D.CLASSES.length, 'class sits', 'classes sit') + ' under one of the ' +
        count(rows.length, 'program', 'programs') + '.',
      table: table,
      rows: rows.length,
      rowNoun: 'programs',
      footLabel: count(rows.length, 'program', 'programs') + ' · ' + count(D.CLASSES.length, 'class', 'classes'),
      footValue: en + ' of ' + cap + ' places taken'
    };
  }

  /* ---- the eight reports ---------------------------------------------------- */

  var REPORTS = [
    { id: 'mrr',       cat: 'Revenue',    title: 'Monthly recurring revenue',      open: { label: 'Open Billing',  to: 'billing' },  build: mrr },
    { id: 'retention', cat: 'Retention',  title: 'Who is staying, and how long',   open: { label: 'Open Families', to: 'families' }, build: retention },
    { id: 'absence',   cat: 'Attendance', title: 'Attendance by child',            open: { label: 'Open Families', to: 'families' }, build: attendance },
    { id: 'fill',      cat: 'Capacity',   title: 'Fill rate by class',             open: { label: 'Open Classes',  to: 'classes' },  build: fill },
    { id: 'makeups',   cat: 'Make-ups',   title: 'Credits, and where they stand',  open: { label: 'Open Requests', to: 'requests' }, build: makeups },
    { id: 'collection',cat: 'Payments',   title: 'Collection health',              open: { label: 'Open Billing',  to: 'billing' },  build: collection },
    { id: 'staffcost', cat: 'Staff',      title: 'Hours and pay across the team',  open: { label: 'Open Staff',    to: 'staff' },    build: staffCost },
    { id: 'programs',  cat: 'Programs',   title: 'Which programs fill',            open: { label: 'Open Programs', to: 'programs' }, build: programs }
  ];

  function rep(ctx) {
    var id = ctx.params.id;
    for (var i = 0; i < REPORTS.length; i++) {
      if (REPORTS[i].id === id) return REPORTS[i];
    }
    return REPORTS[0];
  }

  /* ---- the grid ------------------------------------------------------------- */

  function reportCard(r) {
    var b = r.build();
    var foot =
      '<div>' +
        '<div class="stat__label">' + esc(b.unit) + '</div>' +
        '<div class="stat__value">' + esc(b.value) + '</div>' +
        '<div class="stat__sub">' + esc(b.delta) + '</div>' +
      '</div>' +
      ui.btn({ label: 'Open', kind: 'quiet', size: 'sm', to: 'report', id: r.id });

    return ui.card({ title: r.cat, foot: foot }, h`<div class="stack stack--sm">
      <p class="strong">${r.title}</p>
      <p class="cell-mute">${b.find}</p>
      <p class="hint">${b.read}</p>
    </div>`);
  }

  Grove.screen('reports', {
    surface: 'console',
    crumbTitle: 'Reports',
    eyebrow: 'how it is going',
    title: 'Reports',
    sub: 'Not a wall of charts. Each report answers a question the studio actually asks, ends in something you can do, and shows the rows it was counted from.',
    actions: [
      { label: 'Export all · CSV', msg: REPORTS.length + ' reports exported as CSV' }
    ],

    body: function () {
      return ui.toolbar({
        count: REPORTS.length + ' reports · the studio as it stands on ' + stamp()
      }) + ui.grid(3, REPORTS.map(function (r) { return reportCard(r); }));
    }
  });

  /* ---- one report ------------------------------------------------------------ */

  Grove.screen('report', {
    surface: 'console',
    crumbs: [{ label: 'Reports', to: 'reports' }],
    crumbTitle: 'Report',
    eyebrow: function (ctx) { return rep(ctx).cat.toLowerCase(); },
    title: function (ctx) { return rep(ctx).title; },
    sub: function (ctx) { return rep(ctx).build().find; },
    actions: function (ctx) {
      return [
        { label: 'Export this report · CSV', kind: 'primary', msg: rep(ctx).title + ' exported as CSV' }
      ];
    },

    body: function (ctx) {
      var r = rep(ctx);
      var b = r.build();

      var headline = ui.statbar([
        { label: b.unit, value: b.value, sub: b.delta, tone: 'grove' },
        { label: 'Period', value: stamp(), sub: 'the studio as it stands today' },
        { label: 'Counted from', value: String(b.rows), sub: b.rowNoun }
      ]);

      var means = ui.card({
        title: 'What it means',
        head: ui.btn({ label: r.open.label, kind: 'quiet', size: 'sm', to: r.open.to }),
        note: 'A report is a read of the data, never a place to edit it.'
      }, h`<div class="stack stack--sm">
        <p class="cell-mute">${b.read}</p>
        <p class="cell-mute">${b.act}</p>
      </div>`);

      var counted = ui.card({ title: 'How it is counted' }, ui.kv([
        { k: 'Counts', v: esc(b.counts), tone: 'mute' },
        { k: 'Excludes', v: esc(b.excludes), tone: 'mute' },
        { k: 'Refreshes', v: 'Overnight.', tone: 'mute' }
      ]));

      var behind = ui.card({
        title: 'The rows behind it',
        flush: true,
        foot: total(b.footLabel, b.footValue)
      }, b.table);

      return h`${raw(headline)}
        ${raw(ui.grid(2, [means, counted]))}
        <div class="section">${raw(behind)}</div>`;
    }
  });
})();
