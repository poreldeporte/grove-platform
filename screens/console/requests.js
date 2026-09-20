/* Console → Requests (Waitlist · Make-ups · Supplies).

   THE MAKE-UP QUEUE IS BACK, and the pack vocabulary is gone.

   The studio does not sell a pack of sessions. After-School is a PLAN, and a
   plan is HOURS A MONTH — 4h $280, 8h $540, 12h $780, 16h $960 — fixed to the
   day and time the parent picked at registration, running to the end of the
   school year and ending there. Camp, No-School Days, private classes, pop-ups
   and birthdays are one-off bookings with no plan at all.

   So two things changed in this file:

     - every "pack of sessions", "sessions used" and "renews on the last
       session" is gone. The note under the waitlist now says what a family
       actually takes on when they accept a place: hours a month, at the price
       read out of PRICING.as.plans, running to D.PLAN_YEAR.ends
     - the Make-ups tab is real again. Hours not booked are lost, but a class
       cancelled at least D.RULES.cancelNotice ahead earns a make-up, and a
       make-up is approved here, into an age-appropriate class with a free
       place — never the hour they missed, and never one the child already
       takes every week, which would not be a make-up at all. Inside the
       notice period the class counts as attended and there is nothing to
       approve, so those absences never reach the queue

   The queue is deliberately three facts wide: who missed what, where it can
   go, and whether there is room. There is no exception machinery — no expiry
   countdown, no per-child override, no "extend it this once". The rules live
   in D.RULES, this screen reads them, and the expiry setting is stated rather
   than argued with: it is changed in Settings, not row by row. Anything the
   rules do not cover — a child whose school finishes a week after the studio's
   programme, a private class that comes up, an event — is a manual charge on
   the family's card, not a control on this screen.

   What is left is three genuine queues: families waiting for a place, children
   owed a make-up, and instructors waiting on supplies.

   Kept from the previous pass, because none of it depends on how billing works:

     - "Average wait · 9 days" and "On a waitlist · 6" are gone. One she could
       do nothing about; the other was already the tab count and the result
       count. Each row carries its own wait instead
     - the Places column repeated the same class occupancy down six rows. It
       sits under the class name now, where it belongs to the class
     - Supplies has one sticky bar that approves the pending requests and
       prices them, and a per-row Decline for the exception
     - the stock each supply request draws on is a column in that table, so
       there is one list, not two

   Every figure here is read off Grove.data and derived from the rows on show:
   the stat strips, the result counts, each "n days" of waiting, the free
   places, the pending order value, and the plan prices in the note, which are
   read out of PRICING rather than typed.

   Occupancy is counted off the roll itself — D.roster(id).length — never from
   a number sitting on the class record. A waitlist row is joined to its class
   on the class's own day and start time; an absence is joined the same way, on
   the day and the hour it names. Queue, roll and the "12 of 12" on the row are
   one fact seen three times.

   Noted for the rebuild: Supplies is a staff purchasing queue sitting in a
   screen otherwise made of family queues. It belongs under Inventory beside
   the stock it moves. It is left here because Inventory links into this tab
   twice and this pass does not edit other files. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, esc = Grove.esc, D = Grove.data;

  var TAB_KEY = 'requests';
  var WAITLIST_TAB = 'Waitlist';
  var MAKEUP_TAB = 'Make-ups';
  var SUPPLY_TAB = 'Supplies';

  var SUBS = {
    Waitlist: 'Nobody is turned away. When a class fills, families join a queue and are offered openings in position order.',
    'Make-ups': 'A class cancelled at least ' + D.RULES.cancelNotice + ' ahead earns a make-up. Approve it into an age-appropriate class that has a free place.',
    Supplies: 'What instructors have asked the office to buy or restock, and how each one stands against the stock on hand.'
  };

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function tab() { return Grove.tab(TAB_KEY, WAITLIST_TAB); }

  /* ---- dates ----------------------------------------------------------------
     The dataset states its own today, so "waiting 14 days" and "missed 15 days
     ago" are both measured from it rather than typed in. */

  function today() {
    var m = /(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/.exec(String(D.today));
    if (!m) return null;
    var mo = MONTHS.indexOf(m[2].slice(0, 3));
    if (mo === -1) return null;
    return new Date(parseInt(m[3], 10), mo, parseInt(m[1], 10));
  }

  /* '14 Jul' → whole days from today. Negative means it has already passed. */
  function dayCount(text) {
    var t = today();
    var m = /(\d{1,2})\s+([A-Za-z]{3})/.exec(String(text));
    if (!t || !m) return null;
    var mo = MONTHS.indexOf(m[2]);
    if (mo === -1) return null;
    var d = new Date(t.getFullYear(), mo, parseInt(m[1], 10));
    return Math.round((d.getTime() - t.getTime()) / 86400000);
  }

  function daysSince(text) {
    var n = dayCount(text);
    if (n === null) return '';
    var d = Math.max(0, -n);
    return d === 0 ? 'today' : (d === 1 ? '1 day' : d + ' days');
  }

  function ago(text) {
    var d = daysSince(text);
    return d === 'today' || d === '' ? d : d + ' ago';
  }

  function sum(list, of) {
    var total = 0;
    list.forEach(function (x) { total += of(x); });
    return total;
  }

  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  function firstName(name) { return String(name).split(' ')[0]; }
  function lowerFirst(s) { return String(s).charAt(0).toLowerCase() + String(s).slice(1); }

  /* ---- plans -------------------------------------------------------------------
     What a family takes on when they accept a place. A plan is hours a month,
     and the sizes and prices are read out of the price list rather than written
     down here, so a new plan size appears on this screen the day it is added. */

  function planSizes() {
    var plans = (D.PRICING.as && D.PRICING.as.plans) || {};
    var out = [];
    Object.keys(plans).forEach(function (key) {
      var hours = parseInt(String(key).replace(/[^0-9]/g, ''), 10);
      if (!isNaN(hours)) out.push({ hours: hours, price: plans[key] });
    });
    out.sort(function (a, b) { return a.hours - b.hours; });
    return out;
  }

  function planNote() {
    var sizes = planSizes();
    var small = sizes[0], big = sizes[sizes.length - 1];
    if (!small) return '';
    return 'Taking a place means an after-school plan for that child — hours a month, from ' +
      small.hours + ' hours at ' + Grove.money(small.price, { cents: false }) + ' to ' +
      big.hours + ' hours at ' + Grove.money(big.price, { cents: false }) +
      ', split into classes however the parent likes. The plan runs to ' +
      D.PLAN_YEAR.ends + ' and ends there.';
  }

  /* ---- matching the free-text records to the dataset --------------------------
     The waitlist, the absences and the supply requests all name their subject in
     free text. They are matched back to CLASSES and INVENTORY here so that no
     figure on this screen can drift from the record it describes. */

  /* A queue row names its class the way the timetable prints it — "Mon 3:15pm ·
     Ages 8–11" — so it is joined on the class's own day and start time, which
     is the key the dataset counts a class's queue with. */
  function startOf(c) { return String(c.time).split('–')[0]; }
  function classKey(c) { return c.day + ' ' + startOf(c); }

  function queueClass(w) {
    var text = String(w.cls);
    var hit = null;
    D.CLASSES.forEach(function (c) {
      if (!hit && text.indexOf(classKey(c)) === 0) hit = c;
    });
    return hit;
  }

  function afterSchool() {
    return D.CLASSES.filter(function (c) { return c.prog === 'as'; });
  }

  /* An absence names its hour as "Mon 13 Jul · 3:15pm", so it joins on the same
     two facts as a queue row: the class's day and its start time. */
  function absenceClass(a) {
    var text = String(a.date);
    var hit = null;
    afterSchool().forEach(function (c) {
      if (hit) return;
      if (text.indexOf(c.day) === 0 && text.indexOf(startOf(c)) !== -1) hit = c;
    });
    return hit;
  }

  /* Occupancy is the roll, counted. A class cannot show a number its roster
     has no children for. */
  function enrolled(c) { return c ? D.roster(c.id).length : 0; }

  function freePlaces(c) { return c ? Math.max(0, c.cap - enrolled(c)) : 0; }

  function placeNote(c) {
    var on = enrolled(c);
    var held = on + ' of ' + c.cap;
    if (on > c.cap) return held + ' · over by ' + (on - c.cap);
    if (on === c.cap) return held + ' · full';
    var free = c.cap - on;
    return held + ' · ' + (free === 1 ? '1 place free' : free + ' places free');
  }

  function classLabel(c) { return c.day + ' ' + c.time + ' · ' + c.room; }

  /* A place can only be offered to the head of a queue whose class has room. */
  function offerable(w) { return w.pos === 1 && freePlaces(queueClass(w)) > 0; }

  function stockFor(name) {
    var n = String(name).toLowerCase();
    var hit = null;
    D.INVENTORY.forEach(function (it) {
      if (hit) return;
      var s = String(it.item).toLowerCase();
      if (s === n || s.indexOf(n) === 0 || n.indexOf(s) === 0) hit = it;
    });
    return hit;
  }

  function unitCost(it) {
    var n = parseFloat(String(it && it.cost).replace(/[^0-9.]/g, ''));
    return isNaN(n) ? 0 : n;
  }

  function pendingSupplies(list) {
    return (list || D.SUPPLY_REQUESTS).filter(function (r) { return r.status === 'Pending'; });
  }

  /* Counted on the class the rows join to, not on the wording they were typed
     with, so one queue cannot read as two. */
  function longestQueue(list) {
    var counts = {}, best = null;
    list.forEach(function (w) {
      var c = queueClass(w);
      var key = c ? c.id : w.cls;
      counts[key] = (counts[key] || 0) + 1;
      if (!best || counts[key] > counts[best.key]) best = { key: key, cls: w.cls };
    });
    return best ? { cls: best.cls, n: counts[best.key] } : null;
  }

  /* ---- the make-up queue ---------------------------------------------------
     One row per class a child is owed. The rules decide who is in it: only a
     child on a plan, and only an absence the family gave notice for. Inside the
     notice period the class is counted as attended, so it never arrives here
     and there is nothing to argue about.

     Where it can go is the studio's own rule applied to the roll — an
     age-appropriate class with a free place, never the hour they already hold —
     so the row cannot offer a place the roster does not have. */

  function studentNamed(name) {
    return D.STUDENTS.filter(function (s) { return s.name === name; })[0] || null;
  }

  function onPlan(student) { return !!(student && D.plan(student).isPlan); }

  function makeupOptions(student, missed) {
    var held = student.classIds || [];
    return afterSchool().filter(function (c) {
      if (c.band !== student.band) return false;
      if (missed && c.id === missed.id) return false;
      /* Nor an hour the child is already on the roll for. Sitting in their own
         weekly class is not a make-up, so it is never offered as one. */
      return held.indexOf(c.id) === -1;
    });
  }

  /* The hour the make-up would go into: the first age-appropriate one with a
     place. When every one is full the row still names one, so the owner can see
     which hour she would have to open. */
  function makeupInto(student, missed) {
    var options = makeupOptions(student, missed);
    var open = options.filter(function (c) { return freePlaces(c) > 0; });
    return open[0] || options[0] || null;
  }

  function makeupQueue() {
    var out = [];
    D.ABSENCES.forEach(function (a) {
      if (a.spent) return;
      var child = studentNamed(a.child);
      if (!onPlan(child)) return;
      var missed = absenceClass(a);
      out.push({ ab: a, child: child, missed: missed, into: makeupInto(child, missed) });
    });
    /* Longest owed first, so the child who has been waiting since the start of
       the month is the one at the top. */
    out.sort(function (x, y) {
      var a = dayCount(x.ab.date), b = dayCount(y.ab.date);
      if (a === null || b === null || a === b) return x.ab.child < y.ab.child ? -1 : 1;
      return a - b;
    });
    return out;
  }

  /* Absences the notice rule already settled. Counted on the same population
     the queue is drawn from, so the two numbers describe one list. */
  function settledByRule() {
    return D.ABSENCES.filter(function (a) {
      return a.spent && onPlan(studentNamed(a.child));
    });
  }

  function approvable(m) { return !!(m.into && freePlaces(m.into) > 0); }

  function ruleNote() {
    var never = D.RULES.makeupNever.map(lowerFirst);
    var last = never.pop();
    return D.RULES.makeupWhere + ' It cannot ' +
      (never.length ? never.join(', ') + ' or ' : '') + last +
      '. Expiry is set to “' + D.RULES.makeupWindow + '” in Settings.';
  }

  /* A tab count is how many rows that tab holds, so it always agrees with the
     "n of m" on the same row. */
  function requestTabs() {
    return {
      key: TAB_KEY,
      items: [
        { label: WAITLIST_TAB, count: D.WAITLIST.length },
        { label: MAKEUP_TAB, count: makeupQueue().length },
        { label: SUPPLY_TAB, count: D.SUPPLY_REQUESTS.length }
      ]
    };
  }

  /* ---- the screen ---------------------------------------------------------- */

  Grove.screen('requests', {
    surface: 'console',
    crumbTitle: 'Requests',
    eyebrow: 'waiting on you',
    title: 'Requests',
    sub: function () { return SUBS[tab()]; },

    /* One header action, and only when there is genuinely something to give:
       a free place, or an hour a make-up fits into. Supplies carries its
       decision in the sticky bar, where the consequence sits next to the
       button. */
    actions: function () {
      if (tab() === MAKEUP_TAB) {
        var m = makeupQueue().filter(approvable)[0];
        if (!m) return [];
        return [{
          label: 'Approve ' + firstName(m.child.name) + '’s make-up',
          kind: 'primary',
          msg: 'Make-up approved · ' + m.child.name + ' is in ' + classLabel(m.into) +
            ' · the ' + m.child.family + ' family has been emailed'
        }];
      }
      if (tab() !== WAITLIST_TAB) return [];
      var next = D.WAITLIST.filter(offerable)[0];
      if (!next) return [];
      return [{
        label: 'Offer the place to ' + firstName(next.child),
        kind: 'primary',
        msg: 'Place offered to ' + next.child + ' · the ' + next.fam + ' family has been emailed'
      }];
    },

    body: function () {
      if (tab() === MAKEUP_TAB) return makeupTab();
      if (tab() === SUPPLY_TAB) return supplyTab();
      return waitlistTab();
    }
  });

  /* ---- waitlist ------------------------------------------------------------- */

  /* A queue belongs to a class, so the rows are grouped by class and ordered by
     position within it. Read down and each queue is a block. */
  function queueOrder(list) {
    var order = [], byClass = {}, out = [];
    list.forEach(function (w) {
      if (!byClass[w.cls]) { byClass[w.cls] = []; order.push(w.cls); }
      byClass[w.cls].push(w);
    });
    order.forEach(function (k) {
      byClass[k].sort(function (a, b) { return a.pos - b.pos; });
      byClass[k].forEach(function (w) { out.push(w); });
    });
    return out;
  }

  function waitlistTab() {
    var q = Grove.query('waitlist');

    var rows = queueOrder(D.WAITLIST.filter(function (w) {
      return Grove.match(q, w.child, w.fam, w.cls);
    }));

    /* The action column only exists when there is something to offer, so the
       table never carries a column of empty cells. */
    var canOffer = rows.filter(offerable).length > 0;

    var cols = ['Child', 'Class', { label: 'Pos', align: 'right' }, 'Waiting'];
    if (canOffer) cols.push({ label: '' });

    var table = ui.table(
      cols,
      rows.map(function (w) {
        var c = queueClass(w);
        var cells = [
          ui.two(w.child, w.fam + ' family'),
          ui.two(w.cls, c ? placeNote(c) : 'No class record for this queue'),
          esc('#' + w.pos),
          ui.two(daysSince(w.joined), 'joined ' + w.joined)
        ];
        if (canOffer) {
          cells.push(offerable(w)
            ? ui.btn({
                label: 'Offer place',
                kind: 'primary',
                size: 'sm',
                msg: 'Place offered to ' + w.child + ' · the ' + w.fam + ' family has been emailed'
              })
            : '');
        }
        var row = { cells: cells };
        /* The row joins to a real class, so it opens that class's roll. */
        if (c) { row.to = 'classRecord'; row.id = c.id; }
        return row;
      }),
      { emptyTitle: 'No one matches', emptyText: 'Clear the search to see the whole queue.' }
    );

    /* Counted off the queue on show and off the classes those queues belong to,
       so the strip, the table and the roster cannot disagree. */
    var classes = [];
    rows.forEach(function (w) {
      var c = queueClass(w);
      if (c && classes.indexOf(c) === -1) classes.push(c);
    });
    var free = sum(classes, freePlaces);
    var long = longestQueue(rows);

    var stats = ui.statbar([
      {
        label: 'Places to offer today',
        value: String(free),
        sub: free
          ? 'across the ' + plural(classes.length, 'class with a queue', 'classes with a queue')
          : 'every class with a queue is full',
        tone: free ? 'grove' : 'clay'
      },
      {
        label: 'Longest queue',
        value: long ? String(long.n) : '0',
        sub: long
          ? (long.n === 1 ? 'child waiting for ' : 'children waiting for ') + long.cls
          : 'nobody is waiting'
      }
    ]);

    var toolbar = ui.toolbar({
      tabs: requestTabs(),
      search: { key: 'waitlist', placeholder: 'Search child or family…' },
      count: rows.length === D.WAITLIST.length
        ? plural(rows.length, 'child waiting', 'children waiting')
        : rows.length + ' of ' + D.WAITLIST.length + ' waiting'
    });

    var offer = canOffer
      ? 'Offering a place emails the family and holds it for them. The queue closes up behind them.'
      : (long
          ? 'Nothing can be offered today. The longest queue is ' + long.cls + ', with ' +
            plural(long.n, 'child', 'children') + ' waiting, and another hour on that day is the ' +
            'only thing that shortens it.'
          : 'A place can only be offered once the class has room for one.');

    return toolbar + stats + ui.card({
      title: 'Who is waiting',
      head: ui.btn({ label: 'Open another class', kind: 'quiet', size: 'sm', to: 'classes' }),
      flush: true,
      note: offer + ' ' + planNote()
    }, table);
  }

  /* ---- make-ups ------------------------------------------------------------- */

  function makeupTab() {
    var q = Grove.query('makeups');
    var all = makeupQueue();

    var rows = all.filter(function (m) {
      return Grove.match(q, m.child.name, m.child.family, m.ab.date, m.into ? classLabel(m.into) : '');
    });

    var canApprove = rows.filter(approvable).length > 0;

    var cols = ['Child', 'Missed', 'Make-up in'];
    if (canApprove) cols.push({ label: '' });

    var table = ui.table(
      cols,
      rows.map(function (m) {
        var cells = [
          ui.two(m.child.name, m.child.family + ' family · ages ' + m.child.band),
          ui.two(m.ab.date, ago(m.ab.date) + ' · ' + m.ab.reason),
          m.into
            ? ui.two(classLabel(m.into), placeNote(m.into))
            : ui.two('Nowhere yet', 'No other ages ' + m.child.band + ' hour to put it in')
        ];
        if (canApprove) {
          cells.push(approvable(m)
            ? ui.btn({
                label: 'Approve',
                kind: 'primary',
                size: 'sm',
                msg: 'Make-up approved · ' + m.child.name + ' is in ' + classLabel(m.into) +
                  ' · the ' + m.child.family + ' family has been emailed'
              })
            : '');
        }
        return { cells: cells, to: 'studentRecord', id: m.child.id };
      }),
      { emptyTitle: 'No make-up matches', emptyText: 'Clear the search to see everyone owed one.' }
    );

    var withRoom = rows.filter(approvable);
    var settled = settledByRule();

    var stats = ui.statbar([
      {
        label: 'Make-ups owed',
        value: String(rows.length),
        sub: rows.length
          ? 'cancelled at least ' + D.RULES.cancelNotice + ' ahead'
          : 'nobody is owed a class',
        tone: rows.length ? 'plum' : null
      },
      {
        label: 'A place for them today',
        value: String(withRoom.length),
        sub: withRoom.length
          ? 'another age-appropriate hour has room'
          : 'no other age-appropriate hour has a place',
        tone: withRoom.length ? 'grove' : 'clay'
      },
      {
        label: 'No make-up given',
        value: String(settled.length),
        sub: 'told us inside ' + D.RULES.cancelNotice + ' — the class counts as attended'
      }
    ]);

    var toolbar = ui.toolbar({
      tabs: requestTabs(),
      search: { key: 'makeups', placeholder: 'Search child or family…' },
      count: rows.length === all.length
        ? plural(rows.length, 'make-up', 'make-ups')
        : rows.length + ' of ' + all.length + ' make-ups'
    });

    var lead = canApprove
      ? 'Approving one puts the child in that hour and emails the family.'
      : 'Nothing can be approved today. No other age-appropriate hour has a place, and opening ' +
        'another hour is the only thing that makes room.';

    return toolbar + stats + ui.card({
      title: 'Who is owed a class',
      head: ui.btn({ label: 'Open another class', kind: 'quiet', size: 'sm', to: 'classes' }),
      flush: true,
      note: lead + ' ' + ruleNote()
    }, table);
  }

  /* ---- supplies ---------------------------------------------------------------- */

  function shelfCell(r) {
    var it = stockFor(r.item);
    if (!it) return ui.two('No stock record', 'This item is not on the inventory list');
    if (r.status !== 'Pending') {
      return ui.two(it.on + ' of a minimum ' + it.min,
        it.on >= it.min ? 'delivered · above the minimum' : 'delivered · still below the minimum');
    }
    var after = it.on + r.qty;
    return ui.two(it.on + ' of a minimum ' + it.min,
      after >= it.min
        ? 'approving takes it to ' + after
        : 'approving takes it to ' + after + ' — still short of ' + it.min);
  }

  function supplyTab() {
    var q = Grove.query('supplies');

    var rows = D.SUPPLY_REQUESTS.filter(function (r) {
      return Grove.match(q, r.item, r.by, r.status);
    });

    /* The stock each request draws on is a column here rather than a second
       card repeating the same three rows underneath. */
    var table = ui.table(
      [
        'Item',
        { label: 'Qty', align: 'right' },
        'On the shelf',
        { label: 'Status', shrink: true },
        { label: '' }
      ],
      rows.map(function (r) {
        var it = stockFor(r.item);
        var row = {
          cells: [
            ui.two(r.item, 'Requested by ' + r.by + ' · ' + r.when),
            esc(r.qty),
            shelfCell(r),
            ui.pill(r.status, r.kind),
            r.status === 'Pending'
              ? ui.btn({
                  label: 'Decline',
                  size: 'sm',
                  msg: r.item + ' declined · ' + r.by + ' has been told'
                })
              : ''
          ]
        };
        if (it) { row.to = 'inventoryItem'; row.id = it.id; }
        return row;
      }),
      { emptyTitle: 'No requests match', emptyText: 'Clear the search to see every request.' }
    );

    var pend = pendingSupplies(rows);
    var value = sum(pend, function (r) { return unitCost(stockFor(r.item)) * r.qty; });
    var short = pend.filter(function (r) {
      var it = stockFor(r.item);
      return it && (it.on + r.qty) < it.min;
    }).length;

    var stats = ui.statbar([
      {
        label: 'Waiting on you',
        value: String(pend.length),
        sub: pend.length ? 'to approve or decline' : 'the queue is clear',
        tone: pend.length ? 'plum' : null
      },
      {
        label: 'Cost if you approve',
        value: Grove.money(value),
        sub: 'at the supplier prices on file'
      },
      {
        label: 'Still short after that',
        value: String(short),
        sub: short
          ? plural(short, 'item stays', 'items stay') + ' below its minimum — raise the quantity'
          : 'everything clears its minimum',
        tone: short ? 'clay' : null
      }
    ]);

    var toolbar = ui.toolbar({
      tabs: requestTabs(),
      search: { key: 'supplies', placeholder: 'Search request…' },
      count: rows.length === D.SUPPLY_REQUESTS.length
        ? plural(rows.length, 'request', 'requests')
        : rows.length + ' of ' + D.SUPPLY_REQUESTS.length + ' requests'
    });

    var note = 'Reorder points and the full stock list live under Inventory. A count only changes ' +
      'when an order is fulfilled, so approving one of these does not move the shelf yet.';

    var body = toolbar + stats + ui.card({ flush: true, note: note }, table);

    /* The tab exists to clear this queue, so the decision is pinned to the
       bottom with its price beside it rather than sitting in the page header
       above three rows of table. */
    if (!pend.length) return body;

    return body + ui.formActions([
      {
        label: pend.length === 1
          ? 'Approve the request'
          : 'Approve all ' + pend.length,
        kind: 'primary',
        msg: plural(pend.length, 'request', 'requests') + ' approved · added to the next order'
      }
    ], {
      sticky: true,
      hint: 'Adds ' + Grove.money(value) + ' to the next order · nothing is bought until you raise it'
    });
  }
})();
