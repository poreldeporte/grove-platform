/* Console → Reports, and the report detail behind each one.

   Written for Sabrina at a desk. She is comfortable with a table of numbers,
   so this is a table of numbers — rows, not paragraphs in cards. What she came
   for is not "how is the studio doing", it is "what needs me today", and the
   screen answers that in its first row.

   No charts, deliberately. The old screen drew a 38px eight-bar sparkline on
   every card. At that size the bars say nothing a sentence cannot say better,
   and two of them overflowed their own track while a third had three invisible
   zero bars.

   Every figure is DERIVED from the rows shown underneath it. The value, the
   sub-line, the finding, the reading, the thing to do and the total in each
   table foot are all computed from Grove.data, so the number and the rows
   cannot disagree.

   Rebuilt again for the settled pricing model. A plan is HOURS A MONTH, only
   after-school has one, and it runs to the end of the school year and ends by
   itself. So:
     - the pack report is gone, vocabulary and all. There is no pack, no
       "sessions used" and no "renews on the 8th class". What is true is that
       54 children are on a plan, those plans commit a number of hours a month,
       and a cycle of those hours is worth a countable amount. That is report
       one, and it also answers whose cycle ends next, because the invoice is
       raised on the last class of the cycle and covers the next one. A last
       class already behind us is an invoice already raised, and the row now
       says so rather than dating a "next invoice" in the past.
     - there is still no monthly recurring revenue figure, and for a new
       reason: nothing recurs monthly. A plan is annual, it ends in June, and
       camp, no-school days, private classes, pop-ups and birthdays are one-off
       bookings with no cycle at all. Reporting an MRR would be inventing one.
     - hours not booked in a cycle are lost, so nothing is carried forward and
       no report counts a balance. The plan report says whether any hours are
       sitting unbooked, because that is the only thing that can be lost.
     - a new report reads D.SALES: the one manual charge the owner already
       calls "make sale / post sale". Extra classes when a school finishes
       later, a private class that comes up, an event — one action, one amount,
       one reason, on the card on file. The exceptions are charged, not
       modelled, so there is one report rather than three.
     - the make-up rules are read from D.RULES, never restated here. The
       make-up window in particular is a setting with two options, and this
       screen prints whichever is set rather than deciding for Settings.

   Also cut in an earlier pass and still cut:
     - the eight prose cards. The reports are two tables: the ones carrying a
       deadline, a failure or money that has not arrived, and the ones that are
       only worth knowing. The split is derived from the rows, and the rule is
       printed on the card so it is not magic.
     - "Export all · CSV". Reports of that many different shapes cannot be one
       CSV. Export lives on the report you are actually looking at.
     - the per-card "Open" button. The whole row is the link.
     - "Refreshes · Overnight", which was not even true — the figures are read
       live from the rows.
     - "Period · 28 July 2026" as a headline stat, identical on every report.
       It is stated once in the toolbar and once in the footnotes.

   Kept deliberately:
     - no money button on this screen. A report reads; Billing charges.
     - every report, including the ones that need nothing today. Each says what
       it means in a sentence, and the ones with nothing to do say why.

   The long tables are each ordered by the column its headline claims something
   about — the next invoice, tenure, attendance — so the claim is checkable at
   the top of the table rather than somewhere down the scroll. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

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

  function monthIndex(name) {
    var k = String(name).slice(0, 3);
    for (var i = 0; i < MONTHS.length; i++) { if (MONTHS[i] === k) return i; }
    return -1;
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /* Today comes from the data, so every date on this screen is measured from
     it rather than typed in. */
  function stamp() {
    var parts = String(D.today).split(', ');
    return parts[1] || parts[0];
  }

  function todayIso() {
    var m = /(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/.exec(String(D.today));
    if (!m) return '';
    var mi = monthIndex(m[2]);
    if (mi === -1) return '';
    return m[3] + '-' + pad(mi + 1) + '-' + pad(parseInt(m[1], 10));
  }

  /* A dated class reads as "29 October", the way the owner writes it. */
  function dayMonth(iso) {
    var m = /(\d{4})-(\d{2})-(\d{2})/.exec(String(iso));
    if (!m) return String(iso || '—');
    return parseInt(m[3], 10) + ' ' + (MONTHS_FULL[parseInt(m[2], 10) - 1] || '');
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

  /* ---- 1. Plan hours and what a cycle is worth --------------------------------
     A plan is hours a month, and only after-school has one. The month's hours
     are consumed by dated classes the parent chose at registration, the
     invoice is raised on the last class of the cycle and covers the next one,
     and the plan runs to the end of the school year and ends there. So the
     honest figures are: how many hours are committed, what a cycle of them is
     worth, and whose cycle ends next. Not a monthly recurring anything —
     nothing here recurs monthly. */

  function planRows() {
    var out = [];
    D.STUDENTS.forEach(function (s) {
      var p = D.plan(s);
      if (!p.isPlan) return;
      var fam = familyOf(s);
      var booked = 0;
      p.dates.forEach(function (x) { booked += x.hours; });
      out.push({
        s: s,
        fam: fam,
        hours: p.hours,
        price: p.price,
        used: p.usedHours,
        left: p.leftHours,
        booked: booked,
        unbooked: Math.max(0, p.hours - booked),
        last: p.renewsOn ? p.renewsOn.date : '',
        renews: !(fam && /not renewing/i.test(fam.plan))
      });
    });
    return out;
  }

  function plans() {
    /* Soonest last class of the cycle first: the reading below is about which
       invoices go out next, and that claim should be checkable in the first
       rows. The plan that does not renew has no next invoice, so it sits last. */
    var rows = planRows().sort(function (a, b) {
      var da = a.renews ? (a.last || '9999-99-99') : '9999-99-99z';
      var db = b.renews ? (b.last || '9999-99-99') : '9999-99-99z';
      return da === db ? 0 : (da < db ? -1 : 1);
    });
    var noPlan = D.STUDENTS.filter(function (s) { return !D.plan(s).isPlan; });
    var booked = noPlan.filter(function (s) { return D.classesOf(s).length > 0; });
    var idle = noPlan.filter(function (s) { return D.classesOf(s).length === 0; });

    var hours = 0, cycleValue = 0, unbooked = 0, unbookedKids = [], ending = [];
    var used = 0, left = 0;
    var iso = todayIso(), byDate = {}, dates = [], raised = 0;
    rows.forEach(function (r) {
      hours += r.hours;
      cycleValue += r.price;
      used += r.used;
      left += r.left;
      if (r.unbooked) { unbooked += r.unbooked; unbookedKids.push(r.s.name); }
      if (!r.renews) { ending.push(r); return; }
      if (!r.last) return;
      if (r.last < iso) { raised += 1; return; }
      if (!byDate[r.last]) { byDate[r.last] = { n: 0, v: 0 }; dates.push(r.last); }
      byDate[r.last].n += 1;
      byDate[r.last].v += r.price;
    });
    dates.sort();
    var next = dates.length ? dates[0] : null;

    var table = ui.table(
      ['Child', 'Plan', { label: 'Hours used', align: 'right' },
        { label: 'Hours left', align: 'right' }, { label: 'Next invoice', align: 'right' }],
      rows.map(function (r) {
        return {
          cells: [
            ui.two(r.s.name, r.s.family + ' family'),
            ui.mute(count(r.hours, 'hour', 'hours') + ' a month · ' + money0(r.price)),
            num(r.used + ' of ' + r.hours),
            num(count(r.left, 'hour', 'hours')),
            /* The invoice is raised ON the last class of the cycle, so a last
               class already behind us is an invoice already raised. Saying
               "next invoice · 27 July" of a date in the past would be a lie
               the reading underneath has to apologise for. */
            num(r.renews
              ? (r.last
                ? (r.last < iso ? 'Raised · ' + dayMonth(r.last) : dayMonth(r.last))
                : '—')
              : 'Not renewing')
          ]
        };
      })
    );

    return {
      unit: 'A cycle is worth',
      value: money0(cycleValue),
      delta: count(hours, 'hour', 'hours') + ' a month across ' + count(rows.length, 'child', 'children'),
      find: count(rows.length, 'child is', 'children are') + ' on an after-school plan, ' +
        count(hours, 'hour', 'hours') + ' a month between them. At the rate card a cycle of those hours ' +
        'is worth ' + money0(cycleValue) + '.',
      read: next
        ? 'The next invoices go out on ' + dayMonth(next) + ' — ' + count(byDate[next].n, 'child', 'children') +
          ' reaching the last class of the cycle that day, ' + money0(byDate[next].v) + ' between them, and each ' +
          'one covers the cycle that follows.' +
          (raised ? ' ' + count(raised, 'child has', 'children have') + ' already had the last class of this ' +
            'cycle, so those invoices are raised.' : '')
        : 'No plan has a class left in this cycle, so there is no invoice waiting to be raised.',
      act: 'A plan is chosen, changed or stopped on the family record. Anything outside it is a sale in Billing.',
      todo: null,
      todoWhy: '',
      steady: (unbooked
        ? count(unbooked, 'hour is', 'hours are') + ' not booked into a class yet — ' + listOf(unbookedKids) + '. '
        : 'Every hour in this cycle is booked into a dated class, so nothing is about to be lost. ') +
        used + ' of the ' + hours + ' hours have been taken so far and ' + left + ' are still to come. ' +
        D.RULES.unusedHours + ' ' +
        (ending.length
          ? listOf(ending.map(function (r) { return r.s.name; })) +
            (ending.length === 1 ? ' is on a plan that does not renew, so no invoice is raised on that last class. '
              : ' are on plans that do not renew, so no invoice is raised on those last classes. ')
          : '') +
        'Every plan runs to ' + D.PLAN_YEAR.ends + ' and ends there.',
      counts: 'The plan on each child record, priced from the after-school rate card, with the hours read off ' +
        'their dated classes. The invoice is raised on the last class of the cycle and covers the next one, so ' +
        'the soonest last class is at the top, and a last class already behind us reads as raised.',
      excludes: 'The ' + count(noPlan.length, 'child', 'children') + ' with no plan. Camp, no-school days, ' +
        'private classes and pop-ups are one-off bookings with no cycle and no renewal — ' +
        count(booked.length, 'child is', 'children are') + ' here on those alone' +
        (idle.length
          ? ', and ' + listOf(idle.map(function (s) { return s.name + ' (' + lcFirst(classesLine(s)) + ')'; }))
          : '') + '.',
      table: table,
      footLabel: count(rows.length, 'child', 'children') + ' on a plan · ' + count(hours, 'hour', 'hours') + ' a month',
      footValue: money0(cycleValue) + ' a cycle'
    };
  }

  /* ---- 2. Retention ---------------------------------------------------------
     A family leaving is only a job if it leaves owing something. Whether it
     does is read from its invoices rather than assumed. Leaving means notice
     has been given: the plan finishes the cycle it is in and is not billed
     again. */

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

    /* What a leaving family still has in this cycle, counted off the
       children's plans, so the last class can be planned for. */
    var outKids = [], outLeft = 0;
    if (out) {
      D.STUDENTS.forEach(function (s) {
        var p = D.plan(s);
        if (s.family !== out.name || !p.isPlan || !p.leftHours) return;
        outKids.push(s.name);
        outLeft += p.leftHours;
      });
    }
    var tail = outKids.length
      ? ' ' + listOf(outKids) + (outKids.length === 1 ? ' has ' : ' have ') +
        count(outLeft, 'hour', 'hours') + ' left in this cycle, and the plan is not billed again.'
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
        : 'Nobody has given notice, so every family on the books is expected back.',
      act: 'Notice, and the date a plan stops, is recorded on the family record.',
      todo: owing.length ? money0(owed) + ' to settle' : null,
      todoWhy: owing.length
        ? 'The ' + listOf(leaving.map(function (f) { return f.name; })) + ' family is going and ' +
          count(owing.length, 'invoice has', 'invoices have') + ' not been paid. Collect it before the last class.'
        : '',
      steady: out
        ? 'The ' + out.name + ' family has given notice and its last invoice has settled, so there is nothing left to collect.'
        : 'Nobody has given notice.',
      counts: 'The join date and the status on each family record, measured against ' + stamp() + '. Longest first.',
      excludes: 'Nothing. All ' + count(D.FAMILIES.length, 'family', 'families') + ' on the books are counted. ' +
        'Leaving is ' + lcFirst(D.RULES.cancelPlan) + ' Plans that simply run their course need no notice: they ' +
        'end with the school year on ' + D.PLAN_YEAR.ends + '.',
      table: table,
      footLabel: 'Median tenure across ' + count(D.FAMILIES.length, 'family', 'families'),
      footValue: count(med, 'month', 'months')
    };
  }

  /* ---- 3. Attendance --------------------------------------------------------
     A low figure is worth a word with a family, but it has no date on it. Told
     more than the notice period ahead, an absence earns a make-up. Later than
     that, or a no-show, the class counts as attended and no make-up is given.
     Both counts are read off the absence rows, and the rules themselves come
     from D.RULES so this screen never invents a version of them. */

  function attendance() {
    var withFigure = D.STUDENTS.filter(function (s) { return figure(s.att) !== null; });
    var without = D.STUDENTS.filter(function (s) { return figure(s.att) === null; });
    var sum = 0;
    withFigure.forEach(function (s) { sum += figure(s.att); });
    var avg = withFigure.length ? Math.round(sum / withFigure.length) : 0;
    var low = withFigure.filter(function (s) { return figure(s.att) < 90; });
    var worst = low.slice().sort(function (a, b) { return figure(a.att) - figure(b.att); })[0];

    var kept = D.absences().filter(function (a) { return !a.spent; });
    var spent = D.absences().filter(function (a) { return !!a.spent; });
    var absLine = D.absences().length
      ? count(D.absences().length, 'absence has', 'absences have') + ' been reported. ' + kept.length +
        ' came in more than ' + D.RULES.cancelNotice + ' ahead, so a make-up can be booked' +
        (spent.length
          ? ', and in ' + count(spent.length, 'case', 'cases') + ' it came later — the class counted as attended ' +
            'and no make-up was given'
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
        ' below 90%, which is worth a word with the family rather than a job for today. Nothing here carries a ' +
        'date of its own: cancel in the portal ' + D.RULES.cancelNotice + ' ahead and the family gets a make-up, ' +
        'later than that the class is used. The make-up window is set to “' + D.RULES.makeupWindow +
        '” under Settings → Policies, and a make-up spends hours from the plan like any other class.',
      counts: 'The attendance figure recorded against each enrolled child, lowest first. The absence column ' +
        'counts what the studio has been told about that child, whether or not the class still counted as attended.',
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
      /* `en` is places taken, not children — a child in three classes fills
         three of them — so the sentence says enrollments, the way the
         programs report does. */
      find: count(D.CLASSES.length, 'class holds', 'classes hold') + ' ' + en + ' enrollments against ' + cap + ' places' +
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
      counts: 'Every invoice raised — a cycle of plan hours, a camp week, a registration fee, a one-off booking — ' +
        'and what has settled against it.',
      excludes: 'A charge posted to a family ledger that no invoice has picked up yet. Billing counts those in its own outstanding figure, so that number is the larger one.',
      table: table,
      footLabel: count(paid.length, 'invoice', 'invoices') + ' paid of ' + D.INVOICES.length,
      footValue: money0(collected) + ' of ' + money0(billed)
    };
  }

  /* ---- 6. Charged outside a plan -----------------------------------------------
     The owner's own "make sale / post sale". A child whose school finishes a
     week after the program, a private class that comes up tomorrow, an event,
     anything else: one action — pick the family, say what it is for, enter the
     amount, charge the card on file. Because it is one action rather than a
     rule per exception, it is also one report rather than three. */

  function sales() {
    var rows = D.SALES.slice().sort(function (a, b) { return b.amt - a.amt; });
    var taken = 0;
    rows.forEach(function (r) { taken += r.amt; });
    var biggest = rows[0];
    var families = [];
    rows.forEach(function (r) { if (families.indexOf(r.fam) === -1) families.push(r.fam); });

    var table = ui.table(
      ['Family', 'What it was for', { label: 'Charged', align: 'right' }],
      rows.map(function (r) {
        return {
          cells: [
            ui.two(r.fam + ' family', r.when + ' · ' + r.by),
            ui.mute(r.what),
            num(money0(r.amt))
          ]
        };
      })
    );

    return {
      unit: 'Charged outside a plan',
      value: money0(taken),
      delta: count(rows.length, 'charge', 'charges') + ' to ' + count(families.length, 'family', 'families'),
      find: count(rows.length, 'charge has', 'charges have') + ' been made outside a plan, ' + money0(taken) +
        ' in all, to ' + count(families.length, 'family', 'families') + ' — ' + listOf(families) + '.',
      read: biggest
        ? 'The largest is ' + money0(biggest.amt) + ' to the ' + biggest.fam + ' family, “' + biggest.what +
          '”. Every exception is charged this way rather than given a rule of its own: extra classes when a school ' +
          'finishes later than the program, a private class, an event, anything else.'
        : 'Nothing has been charged outside a plan yet.',
      act: 'A sale is made from Billing, or from the family record, against the card already on file.',
      todo: null,
      todoWhy: '',
      steady: 'Each of these was charged when it was made, to the card on file, so nothing here is waiting to be ' +
        'collected. Sales do not renew and they do not change a plan: hours a month stay what the family signed up for.',
      counts: 'Every manual charge on the books, with what it was for and who took it. Largest first.',
      excludes: 'Plan invoices and booked programs. Those sit in Collection health.',
      table: table,
      footLabel: count(rows.length, 'charge', 'charges') + ' · ' + count(families.length, 'family', 'families'),
      footValue: money0(taken)
    };
  }

  /* ---- 7. Hours and pay --------------------------------------------------------
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

  /* ---- 8. Programs -------------------------------------------------------------
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
        'Nothing here carries a date, so this is selling to be done rather than a job for today. ' +
        'Only after-school is sold as a plan; the rest are one-off bookings.',
      counts: 'Every class grouped by the program it belongs to.',
      excludes: 'Nothing. All ' + count(D.CLASSES.length, 'class sits', 'classes sit') + ' under one of the ' +
        count(rows.length, 'program', 'programs') + '.',
      table: table,
      footLabel: count(rows.length, 'program', 'programs') + ' · ' + count(D.CLASSES.length, 'class', 'classes'),
      footValue: en + ' of ' + cap + ' places taken'
    };
  }

  /* ---- 9. Where families come from ---------------------------------------------
     The registration form asks how a family heard about the studio, and the
     answer is carried on the family record (FAMILIES.heardVia), so the report
     counts real rows. */

  function acquisition() {
    var tally = {};
    D.FAMILIES.forEach(function (f) {
      var k = f.heardVia || 'Not asked';
      tally[k] = (tally[k] || 0) + 1;
    });
    var rows = Object.keys(tally).map(function (k) {
      return { source: k, n: tally[k] };
    }).sort(function (a, b) { return b.n - a.n; });

    var families = D.FAMILIES.length;
    var top = rows[0];
    var paid = rows.filter(function (r) { return r.source === 'Instagram' || r.source === 'Google'; });
    var paidN = paid.reduce(function (n, r) { return n + r.n; }, 0);

    var table = ui.table(
      ['How they found us', { label: 'Families', align: 'right' }, { label: 'Share', align: 'right' }],
      rows.map(function (r) {
        return { cells: [
          '<span class="cell-strong">' + esc(r.source) + '</span>',
          num(r.n),
          num(pct(r.n, families))
        ] };
      })
    );

    return {
      unit: 'Families on the books',
      value: String(families),
      delta: top.source + ' brought ' + top.n,
      find: top.source + ' is how ' + top.n + ' of ' + families + ' families found the studio (' +
        pct(top.n, families) + '), which is more than any other route.',
      read: paidN
        ? 'Instagram and Google together brought ' + paidN + ' of ' + families + ' — the only two routes ' +
          'that cost money, so they are the two worth measuring against what is spent on them.'
        : 'Nothing here came from a paid route.',
      act: 'The question is asked at the end of the registration form. It can be switched off under Settings → Policies.',
      todo: null,
      todoWhy: '',
      steady: 'Answers are collected once, at registration, so this grows only when a family joins. ' +
        'It says nothing about who stays — that is in Who is staying, and how long.',
      counts: 'Every family on the books, by the answer they gave at registration.',
      excludes: 'Nobody. All ' + families + ' families answered.',
      table: table,
      footLabel: count(rows.length, 'route', 'routes'),
      footValue: families + ' families'
    };
  }

  /* ---- the reports ----------------------------------------------------
     `open` is the screen where the thing can actually be done, and it is the
     primary button on the report. It is not a menu of related pages. */

  var REPORTS = [
    { id: 'plans',       cat: 'Revenue',    title: 'Plan hours and what a cycle is worth', open: { label: 'Open Families', to: 'families' }, build: plans },
    { id: 'retention',   cat: 'Retention',  title: 'Who is staying, and how long',         open: { label: 'Open Families', to: 'families' }, build: retention },
    { id: 'absence',     cat: 'Attendance', title: 'Attendance by child',                  open: { label: 'Open Families', to: 'families' }, build: attendance },
    { id: 'fill',        cat: 'Capacity',   title: 'Fill rate by class',                   open: { label: 'Open Requests', to: 'requests' }, build: fill },
    { id: 'collection',  cat: 'Payments',   title: 'Collection health',                    open: { label: 'Open Billing',  to: 'billing' },  build: collection },
    { id: 'sales',       cat: 'Payments',   title: 'Charged outside a plan',               open: { label: 'Open Billing',  to: 'billing' },  build: sales },
    { id: 'staffcost',   cat: 'Staff',      title: 'Hours and pay across the team',        open: { label: 'Open Staff',    to: 'staff' },    build: staffCost },
    { id: 'programs',    cat: 'Programs',   title: 'Which programs fill',                  open: { label: 'Open Programs', to: 'programs' }, build: programs },
    { id: 'acquisition', cat: 'Marketing',  title: 'Where families come from',             open: { label: 'Open Families', to: 'families' }, build: acquisition }
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
        { title: 'Period', sub: esc('The studio as it stands on ' + stamp() + '. This is today’s rows counted, not a trend. ' + D.PLAN_YEAR.note) }
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
