/* Console → Requests (Waitlist · Supplies).

   THE MAKE-UP QUEUE IS GONE, and with it about two thirds of this file.

   The studio does not sell a month of classes, it sells a pack of sessions.
   A family buys a pack for a child, the child attends, and when the last
   session in the pack is used the pack charges again and grants another one
   the same size. A session cancelled more than 24 hours ahead is simply not
   spent: it stays in the child's pack and the pack lasts a week longer.

   So there is nothing here to approve. There is no credit to issue, no credit
   to expire, and no queue of them to work through. A family that wants to
   catch up a class they missed books an extra class, and that spends a session
   from the pack like any other class. Deleted outright rather than renamed,
   because none of it describes anything that happens now:

     - the Make-ups tab, its table, its Needs you · Confirmed · Open standing
       vocabulary, and the rule that read a requested hour off the timetable,
       checked the child's age band and confirmed the request on its own
     - the whole makeupRequest screen — the exception cards, the consequence
       cards, the "other credits for this child" list and the decision bar
     - every expiry: "n days left", "credit expires", "expires with the cycle",
       "Open an extra hour", "Extend the credit", "Let it go", and the strip
       that counted credits about to run out
     - the word credit itself. A pack holds sessions, and a session that was
       never spent is still sitting in the pack.

   What is left is the two things that are genuinely queues: families waiting
   for a place, and instructors waiting on supplies.

   Kept from the previous pass, because neither depends on how billing works:

     - "Average wait · 9 days" and "On a waitlist · 6" are gone. One she could
       do nothing about; the other was already the tab count and the result
       count. Each row carries its own wait instead, which tells her who has
       been waiting longest
     - the Places column repeated the same class occupancy down six rows. It
       sits under the class name now, where it belongs to the class
     - Supplies had two mechanisms for one decision: per-row Approve and a
       header "Approve all pending". There is now one sticky bar that approves
       the pending requests and prices them, and a per-row Decline for the
       exception
     - the "What these requests do to the shelf" card repeated the supply table
       row for row. The stock each request draws on is now a column in that
       table, so there is one list, not two

   Every figure here is read off Grove.data and derived from the rows on show:
   the stat strip, the result counts, each "n days" of waiting, the free
   places, the pending order value, and the pack price in the note, which is
   read out of PRICING rather than typed.

   Occupancy is counted off the roll itself — D.roster(id).length — rather than
   read from a number sitting on the class record, and a queue row is joined to
   its class on the class's own day and start time, the key the dataset counts
   the queue with. Queue, roll and the "12 of 12" on the row are one fact seen
   three times. A result count only says "n of m" while a search is narrowing
   the list.

   Noted for the rebuild: Supplies is a staff purchasing queue sitting in a
   screen otherwise made of family queues. It belongs under Inventory beside
   the stock it moves. It is left here because Inventory links into this tab
   twice and this pass does not edit other files. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, esc = Grove.esc, D = Grove.data;

  var TAB_KEY = 'requests';
  var WAITLIST_TAB = 'Waitlist';
  var SUPPLY_TAB = 'Supplies';

  var SUBS = {
    Waitlist: 'Nobody is turned away. When a class fills, families join a queue and are offered openings in position order.',
    Supplies: 'What instructors have asked the office to buy or restock, and how each one stands against the stock on hand.'
  };

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function tab() { return Grove.tab(TAB_KEY, WAITLIST_TAB); }

  /* ---- dates ----------------------------------------------------------------
     The dataset states its own today, so "waiting 14 days" is measured from it
     rather than typed in. Nothing else on this screen is a date: a pack renews
     on a class, not on a day. */

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

  function sum(list, of) {
    var total = 0;
    list.forEach(function (x) { total += of(x); });
    return total;
  }

  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  function firstName(name) { return String(name).split(' ')[0]; }

  /* ---- packs -------------------------------------------------------------------
     What a family takes on when they accept a place. The sizes are read out of
     the price list rather than written down here, so a new pack size appears
     on this screen the day the studio adds one. */

  function packSizes() {
    var plans = (D.PRICING.as && D.PRICING.as.plans) || {};
    var out = [];
    Object.keys(plans).forEach(function (key) {
      var size = parseInt(String(key).replace(/[^0-9]/g, ''), 10);
      if (!isNaN(size)) out.push({ size: size, price: plans[key] });
    });
    out.sort(function (a, b) { return a.size - b.size; });
    return out;
  }

  function packNote() {
    var smallest = packSizes()[0];
    if (!smallest) return '';
    return 'Accepting a place means buying a pack of sessions for that child — the smallest is ' +
      smallest.size + ' sessions for ' + Grove.money(smallest.price, { cents: false }) +
      ', and a pack renews when the last session in it is used.';
  }

  /* ---- matching the free-text records to the dataset --------------------------
     The waitlist and the supply requests both name their subject in free text.
     They are matched back to CLASSES and INVENTORY here so that no figure on
     this screen can drift from the record it describes. */

  /* A queue row names its class the way the timetable prints it — "Mon 3:15pm ·
     Ages 8–11" — so it is joined on the class's own day and start time, which
     is the key the dataset counts a class's queue with. The join is exact: a
     row cannot land on an hour the studio does not run, and the queue on the
     class record and the rows here are the same rows. */
  function classKey(c) { return c.day + ' ' + String(c.time).split('–')[0]; }

  function queueClass(w) {
    var text = String(w.cls);
    var hit = null;
    D.CLASSES.forEach(function (c) {
      if (!hit && text.indexOf(classKey(c)) === 0) hit = c;
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

  /* A tab count is how many rows that tab shows, so it always agrees with the
     "n of m" on the same row. */
  function requestTabs() {
    return {
      key: TAB_KEY,
      items: [
        { label: WAITLIST_TAB, count: D.WAITLIST.length },
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

    /* One header action, and only when there is genuinely a place to offer.
       The old fallback — "Email everyone waiting" — existed to keep the slot
       filled. Supplies carries its decision in the sticky bar, where the
       consequence sits next to the button. */
    actions: function () {
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
      note: offer + ' ' + packNote()
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
