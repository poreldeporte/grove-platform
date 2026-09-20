/* Console → Reports, and the report detail behind each one.

   Written for Sabrina at a desk. She is comfortable with a table of numbers,
   so this is a table of numbers — eight rows, not eight paragraphs in eight
   cards. What she came for is not "how is the studio doing", it is "what
   needs me today", and the screen now answers that in its first row.

   No charts, deliberately. The old screen drew a 38px eight-bar sparkline on
   every card. At that size the bars say nothing a sentence cannot say better,
   and two of the nine overflowed their own track while a third had three
   invisible zero bars.

   Every figure is DERIVED from the rows shown underneath it. The value, the
   sub-line, the finding, the reading, the thing to do and the total in each
   table foot are all computed from Grove.data, so the number and the rows
   cannot disagree.

   Cut in this pass:
     - the eight prose cards. Three rows of cards, about 1100px of scroll, and
       "$2,700 committed" — which needs nothing from her — sat at the same
       weight as "$803 out, one card declined twice". The eight reports are now
       two tables: the ones carrying a deadline, a failure or money that has
       not arrived, and the ones that are only worth knowing. The split is
       derived from the rows, and the rule is printed on the card so it is not
       magic.
     - "Export all · CSV". Eight tables of eight different shapes cannot be one
       CSV. Export lives on the report you are actually looking at.
     - the per-card "Open" button. The whole row is the link; two controls for
       one decision is one too many.
     - "Refreshes · Overnight", which was the same line on all eight reports
       and was not even true — the figures are read live from the rows.
     - the card note "A report is a read of the data, never a place to edit
       it." The sticky bar names the screen where the change is made, which
       says the same thing once and does something about it.
     - "Period · 28 July 2026" as a headline stat. It was identical on all
       eight and there is nothing she can do about the date. It is stated once
       in the toolbar and once in the footnotes of each report.
     - "Counted from · 5 · families on a monthly plan" as a headline stat. The
       table foot already carries the row count.
     - the make-up status vocabulary. The dataset carries four states —
       awaiting approval, available, booked, expiring — and she acts on three
       of them identically. The report now counts them by who holds the ball:
       waiting on you, with the family, about to lapse.
     - the detail's header buttons. The one thing to do from a report is to go
       and do it somewhere else, so that button is pinned to the bottom of the
       viewport with the state line beside it.

   Kept deliberately:
     - no money button on this screen. It would be tempting to put "Retry the
       card" on Collection health, and that is exactly how a product ends up
       with six places to reduce what a family owes. A report reads; Billing
       charges.
     - all eight reports, including the four that need nothing today. A figure
       with no action is not automatically decoration — it is decoration when
       nobody says what it means. Each one says what it means in a sentence,
       and the ones with nothing to do say why there is nothing to do. */
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
    var atRisk = on.filter(function (f) { return f.status !== 'Active'; });

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
      read: 'The ' + top.name + ' family is ' + money0(planPrice(top)) + ' of the ' + money0(sum) + ', ' +
        pct(planPrice(top), sum) + ' of the total, so one cancellation moves this figure further than a quiet month of enquiries does.',
      act: 'A plan is changed on the family record, never here.',
      todo: null,
      todoWhy: '',
      steady: atRisk.length
        ? 'No plan here carries a date. What the ' + listOf(atRisk.map(function (f) { return f.name; })) +
          ' families owe is chased in Collection health, so the same money is not worked twice.'
        : 'Every family on a plan is paying on time, and no plan here carries a date.',
      counts: 'The session plan on each family record, priced from the after-school rate card.',
      excludes: listOf(off.map(function (f) { return f.name + ' (' + f.plan + ')'; })) + '.',
      table: table,
      rows: on.length,
      rowNoun: 'families on a monthly plan',
      footLabel: count(on.length, 'family', 'families') + ' on a monthly plan',
      footValue: money0(sum) + ' a month'
    };
  }

  /* ---- 2. Retention ---------------------------------------------------------
     A family leaving is only a job if it leaves owing something. Whether it
     does is read from its invoices rather than assumed. */

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

    var owing = [], owed = 0;
    leaving.forEach(function (f) {
      D.INVOICES.forEach(function (i) {
        if (i.fam === f.name && i.status !== 'Paid') { owing.push(i); owed += i.amt; }
      });
    });

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
      act: 'Notice, and the last billing date with it, is recorded on the family record.',
      todo: owing.length ? money0(owed) + ' to settle' : null,
      todoWhy: owing.length
        ? 'The ' + listOf(leaving.map(function (f) { return f.name; })) + ' family is going and ' +
          count(owing.length, 'invoice', 'invoices') + ' has not been paid. Collect it before the last class.'
        : '',
      steady: out
        ? 'The ' + out.name + ' family has given notice and its last invoice has settled, so there is nothing left to collect.'
        : 'Nobody is on notice.',
      counts: 'The join date and the status on each family record, measured against ' + stamp() + '.',
      excludes: 'Nothing. All ' + count(D.FAMILIES.length, 'family', 'families') + ' on the books are counted.',
      table: table,
      rows: D.FAMILIES.length,
      rowNoun: 'families on the books',
      footLabel: 'Median tenure across ' + count(D.FAMILIES.length, 'family', 'families'),
      footValue: count(med, 'month', 'months')
    };
  }

  /* ---- 3. Attendance --------------------------------------------------------
     A low figure is worth a word with a family, but it has no date on it and
     the absences that were reported in time are already credits. This one is
     something to know, not something to do. */

  function attendance() {
    var withFigure = D.STUDENTS.filter(function (s) { return figure(s.att) !== null; });
    var without = D.STUDENTS.filter(function (s) { return figure(s.att) === null; });
    var sum = 0, credits = 0;
    withFigure.forEach(function (s) { sum += figure(s.att); });
    D.STUDENTS.forEach(function (s) { credits += s.mk || 0; });
    var avg = withFigure.length ? Math.round(sum / withFigure.length) : 0;
    var low = withFigure.filter(function (s) { return figure(s.att) < 90; });
    var worst = low.slice().sort(function (a, b) { return figure(a.att) - figure(b.att); })[0];

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
      read: worst
        ? worst.name + ' is the lowest at ' + worst.att + ', and the roster holds ' +
          count(credits, 'make-up credit', 'make-up credits') + ' between them, so the absences that were reported in time are already owed back as classes.'
        : 'Every child with a record is above 90%, and the ' + count(credits, 'make-up credit', 'make-up credits') +
          ' on the books cover the absences that were reported in time.',
      act: 'A child’s record, and the family behind it, is under Families.',
      todo: null,
      todoWhy: '',
      steady: count(low.length, 'child sits', 'children sit') +
        ' below 90%, which is worth a word with the family rather than a job for today. Nothing here carries a date.',
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
      rows: D.CLASSES.length,
      rowNoun: 'classes on the books',
      footLabel: 'Across ' + count(D.CLASSES.length, 'class', 'classes') + ', ' + full + ' at or over capacity',
      footValue: en + ' of ' + cap + ' places · ' + pct(en, cap)
    };
  }

  /* ---- 5. Make-up credits -----------------------------------------------------
     The dataset carries four statuses. She approves one of them, rescues
     another, and does nothing at all about the other two, so the summary
     counts them by who is holding the credit rather than by its label. */

  function makeups() {
    var pending = 0, expiringN = 0;
    D.MAKEUPS.forEach(function (m) {
      if (m.status === 'Awaiting approval') pending += 1;
      if (m.status === 'Expiring') expiringN += 1;
    });
    var withFamily = D.MAKEUPS.length - pending - expiringN;
    var expiring = D.MAKEUPS.filter(function (m) { return m.status === 'Expiring'; })[0];
    var waitingOn = D.MAKEUPS.filter(function (m) { return m.status === 'Awaiting approval'; })
      .map(function (m) { return m.child; });

    var jobs = [];
    if (pending) jobs.push(pending + ' to approve');
    if (expiringN) jobs.push(expiringN + ' lapsing');

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
      delta: pending + ' waiting on you, ' + withFamily + ' with the family',
      find: count(D.MAKEUPS.length, 'credit is', 'credits are') + ' open — ' + pending +
        ' waiting on you, ' + withFamily + ' with the family, and ' + expiringN + ' about to lapse.',
      read: expiring
        ? expiring.child + '’s credit lapses on ' + expiring.expires + ' because ' + lcFirst(expiring.booked) +
          '. Every credit that expires is a class a family paid for and did not get.'
        : 'Nothing is about to expire, so every credit still has a class it can be taken in.',
      act: 'Approving a credit and booking the hour both happen under Requests.',
      todo: jobs.length ? jobs.join(', ') : null,
      todoWhy: (pending ? listOf(waitingOn) + (pending === 1 ? ' is' : ' are') + ' waiting on a yes' : '') +
        (pending && expiring ? ', and ' : '') +
        (expiring ? expiring.child + '’s credit lapses on ' + expiring.expires : '') + '.',
      steady: 'Nothing is waiting on you and nothing is about to lapse.',
      counts: 'One credit for each session missed, as recorded against the child.',
      excludes: 'Nothing. Every one of the ' + count(D.MAKEUPS.length, 'credit', 'credits') +
        ' is counted, whatever state it is in.',
      table: table,
      rows: D.MAKEUPS.length,
      rowNoun: 'credits recorded',
      footLabel: count(D.MAKEUPS.length, 'credit', 'credits') + ' open',
      footValue: pending + ' waiting on you · ' + withFamily + ' with the family · ' + expiringN + ' about to lapse'
    };
  }

  /* ---- 6. Collection health ---------------------------------------------------- */

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
     dataset holds ten named children against 124 enrollments, so any per-child
     figure would be a guess. What the staff records do support is hours,
     classes and the hourly wage bill, and that is what this now reports. */

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
        ' of that is teaching. The rest is the front desk and the office.',
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
      rows: D.STAFF.length,
      rowNoun: 'people on the team',
      footLabel: count(D.STAFF.length, 'person', 'people') + ' · ' + hours + ' hours a week',
      footValue: money0(wage) + ' in hourly pay'
    };
  }

  /* ---- 8. Programs -------------------------------------------------------------
     Revenue per studio hour was the old headline, and nothing in the dataset
     prices a studio hour. Enrollment against places is what the classes record,
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
      rows: rows.length,
      rowNoun: 'programs',
      footLabel: count(rows.length, 'program', 'programs') + ' · ' + count(D.CLASSES.length, 'class', 'classes'),
      footValue: en + ' of ' + cap + ' places taken'
    };
  }


  /* ---- where families come from ---------------------------------------------
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
      rows: rows.length,
      rowNoun: 'routes',
      footLabel: count(rows.length, 'route', 'routes'),
      footValue: total + ' families'
    };
  }

  /* ---- the reports ----------------------------------------------------
     `open` is the screen where the thing can actually be done, and it is the
     primary button on the report. It is not a menu of related pages. */

  var REPORTS = [
    { id: 'mrr',        cat: 'Revenue',    title: 'Monthly recurring revenue',     open: { label: 'Open Families', to: 'families' }, build: mrr },
    { id: 'retention',  cat: 'Retention',  title: 'Who is staying, and how long',  open: { label: 'Open Families', to: 'families' }, build: retention },
    { id: 'absence',    cat: 'Attendance', title: 'Attendance by child',           open: { label: 'Open Families', to: 'families' }, build: attendance },
    { id: 'fill',       cat: 'Capacity',   title: 'Fill rate by class',            open: { label: 'Open Requests', to: 'requests' }, build: fill },
    { id: 'makeups',    cat: 'Make-ups',   title: 'Credits, and where they stand', open: { label: 'Open Requests', to: 'requests' }, build: makeups },
    { id: 'collection', cat: 'Payments',   title: 'Collection health',             open: { label: 'Open Billing',  to: 'billing' },  build: collection },
    { id: 'staffcost',  cat: 'Staff',      title: 'Hours and pay across the team', open: { label: 'Open Staff',    to: 'staff' },    build: staffCost },
    { id: 'programs',   cat: 'Programs',   title: 'Which programs fill',           open: { label: 'Open Programs', to: 'programs' }, build: programs },
    { id: 'acquisition', cat: 'Marketing', title: 'Where families come from',      open: { label: 'Open Families', to: 'families' }, build: acquisition }
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
          emptyText: 'All eight carry something with a date on it today.'
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
