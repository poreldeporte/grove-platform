/* Console → Requests (Waitlist · Make-ups · Supplies) and one make-up request.

   This was the screen the client screenshotted. The old build stacked a tabs
   rail, then a band of three oversized stat cards, then a search row, before
   the table finally started — three bands of near-empty space on every tab.

   Simplifications against the previous build:
     - tabs, search and the result count are one `ui.toolbar` row; the numbers
       are a slim `ui.statbar` strip UNDER it, not tall cards above the search.
       All three tabs now carry the same strip, so nothing jumps when you
       switch between them
     - Waitlist, Make-ups and Supplies were three screen keys pretending to be
       one page. They are now one screen with three tabs, so the header,
       toolbar and table are drawn once
     - the five make-up filter chips are gone. The tab already separates the
       work from the history, and eight rows do not need a chip rail
     - the make-up drawer's four sections became three cards in one grid, and
       the credit variant two, with one shared row of context under them
     - every number on this screen is read off Grove.data and derived from the
       rows being shown — tab counts, result counts, both stat strips, the
       average wait, the pending order value and every "n days left". Nothing
       on this screen is a typed-in total
     - a place can only be offered when the class the queue belongs to has one.
       The queue classes are matched to Grove.data.CLASSES the same way the
       Classes screen matches them, so the button and the roster agree
     - the drawer's invented per-request class detail (places showing,
       instructor, room) is dropped — the dataset has no such record, and the
       warning it carried is kept as a card note instead */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, esc = Grove.esc, D = Grove.data;

  var TAB_KEY = 'requests';
  var WAITLIST_TAB = 'Waitlist';
  var MAKEUP_TAB = 'Make-ups';
  var SUPPLY_TAB = 'Supplies';

  /* "Expiring" is a credit with nowhere left to place it — a loss, not another
     decision waiting on you — so it reads clay rather than sharing the plum of
     "Awaiting approval". */
  var MAKEUP_PILL = {
    'Awaiting approval': 'warn',
    'Available': 'ok',
    'Booked': null,
    'Expiring': 'bad'
  };

  var SUBS = {
    Waitlist: 'Nobody is turned away. When a class fills, families join a queue and are offered openings in position order.',
    'Make-ups': 'A make-up credit is counted in classes, never in money. A family requests a slot; you approve it here.',
    Supplies: 'What instructors have asked the office to buy or restock, and how each one stands against the stock on hand.'
  };

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function tab() { return Grove.tab(TAB_KEY, WAITLIST_TAB); }

  /* ---- dates ----------------------------------------------------------------
     The dataset states its own today, so every "n days" on this screen is
     measured from it rather than typed in. */

  function today() {
    var m = /(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/.exec(String(D.today));
    if (!m) return null;
    var mo = MONTHS.indexOf(m[2].slice(0, 3));
    if (mo === -1) return null;
    return new Date(parseInt(m[3], 10), mo, parseInt(m[1], 10));
  }

  /* '31 Jul' → whole days from today. Negative means it has already passed. */
  function dayCount(text) {
    var t = today();
    var m = /(\d{1,2})\s+([A-Za-z]{3})/.exec(String(text));
    if (!t || !m) return null;
    var mo = MONTHS.indexOf(m[2]);
    if (mo === -1) return null;
    var d = new Date(t.getFullYear(), mo, parseInt(m[1], 10));
    return Math.round((d.getTime() - t.getTime()) / 86400000);
  }

  function inDays(n) {
    if (n === null || n === undefined) return '';
    if (n < 0) return 'already past';
    if (n === 0) return 'today';
    if (n === 1) return 'tomorrow';
    return n + ' days left';
  }

  function sum(list, of) {
    var total = 0;
    list.forEach(function (x) { total += of(x); });
    return total;
  }

  /* ---- matching the free-text records to the dataset --------------------------
     The waitlist and the supply requests both name their subject in free text.
     They are matched back to CLASSES and INVENTORY here so that no figure on
     this screen can drift from the record it describes. */

  function startTime(c) {
    var parts = String(c.time).split('–');
    var a = String(parts[0] || '').toLowerCase();
    if (a.indexOf('am') !== -1 || a.indexOf('pm') !== -1) return a;
    var b = String(parts[1] || '').toLowerCase();
    return a + (b.indexOf('am') !== -1 ? 'am' : (b.indexOf('pm') !== -1 ? 'pm' : ''));
  }

  /* Day plus either the start time or the age band, the way Classes does it.
     Nobody waits on a camp week, so those are skipped. */
  function queueClass(w) {
    var text = String(w.cls).toLowerCase();
    var hit = null;
    D.CLASSES.forEach(function (c) {
      if (hit) return;
      if (/week \d/.test(String(c.name).toLowerCase())) return;
      var dayHit = false;
      String(c.day).split(/[^A-Za-z]+/).forEach(function (d) {
        if (d && text.indexOf(d.toLowerCase()) !== -1) dayHit = true;
      });
      if (!dayHit) return;
      if (text.indexOf(startTime(c)) !== -1 ||
          text.indexOf('ages ' + String(c.band).toLowerCase()) !== -1) hit = c;
    });
    return hit;
  }

  function freePlaces(c) { return c ? Math.max(0, c.cap - c.en) : 0; }

  function placeNote(c) {
    if (c.en > c.cap) return 'over by ' + (c.en - c.cap);
    if (c.en === c.cap) return 'full';
    var free = c.cap - c.en;
    return free === 1 ? '1 place free' : free + ' places free';
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

  /* ---- small counts off the dataset -------------------------------------------- */

  function pendingSupplies() {
    return D.SUPPLY_REQUESTS.filter(function (r) { return r.status === 'Pending'; });
  }

  function pendingMakeups() {
    return D.MAKEUPS.filter(function (m) { return m.status === 'Awaiting approval'; });
  }

  function expiringSoon() {
    return D.MAKEUPS.filter(function (m) {
      var n = dayCount(m.expires);
      return n !== null && n <= 7;
    });
  }

  function makeupChildren() {
    var seen = [];
    D.MAKEUPS.forEach(function (m) { if (seen.indexOf(m.child) === -1) seen.push(m.child); });
    return seen.length;
  }

  function queueClasses() {
    var seen = [];
    D.WAITLIST.forEach(function (w) { if (seen.indexOf(w.cls) === -1) seen.push(w.cls); });
    return seen;
  }

  function longestQueue() {
    var counts = {}, best = null;
    D.WAITLIST.forEach(function (w) {
      counts[w.cls] = (counts[w.cls] || 0) + 1;
      if (!best || counts[w.cls] > counts[best]) best = w.cls;
    });
    return best ? { cls: best, n: counts[best] } : null;
  }

  function childOf(name) {
    return D.STUDENTS.filter(function (s) { return s.name === name; })[0] || null;
  }

  /* A tab count is how many rows that tab shows, so it always agrees with the
     "n of m" on the same row. The subsets that need you are on the rows. */
  function requestTabs() {
    return {
      key: TAB_KEY,
      items: [
        { label: WAITLIST_TAB, count: D.WAITLIST.length },
        { label: MAKEUP_TAB, count: D.MAKEUPS.length },
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

    actions: function () {
      if (tab() === MAKEUP_TAB) {
        return [{
          label: 'Open extra make-up slot',
          kind: 'primary',
          msg: 'Extra make-up slot opened for Friday 10:00am'
        }];
      }
      if (tab() === SUPPLY_TAB) {
        return [{
          label: 'Approve all pending',
          kind: 'primary',
          msg: pendingSupplies().length + ' supply requests approved'
        }];
      }
      /* Offering is only honest when a class has an opening; today none do. */
      var next = D.WAITLIST.filter(offerable)[0];
      if (next) {
        return [{
          label: 'Offer next place',
          kind: 'primary',
          msg: 'Place offered to ' + next.child + ' · family emailed'
        }];
      }
      return [{
        label: 'Email everyone waiting',
        kind: 'primary',
        msg: D.WAITLIST.length + ' families emailed · queue position confirmed'
      }];
    },

    body: function () {
      var current = tab();
      if (current === MAKEUP_TAB) return makeupTab();
      if (current === SUPPLY_TAB) return supplyTab();
      return waitlistTab();
    }
  });

  /* ---- waitlist ------------------------------------------------------------- */

  function waitlistTab() {
    var q = Grove.query('waitlist');

    var rows = D.WAITLIST.filter(function (w) {
      return Grove.match(q, w.child, w.fam, w.cls);
    });

    /* The action column only exists when there is something to offer, so the
       table never carries a column of empty cells. */
    var canOffer = D.WAITLIST.filter(offerable).length > 0;

    var cols = [
      'Child',
      'Class',
      { label: 'Pos', align: 'right' },
      'Joined',
      'Places'
    ];
    if (canOffer) cols.push({ label: '' });

    var table = ui.table(
      cols,
      rows.map(function (w) {
        var c = queueClass(w);
        var cells = [
          ui.two(w.child, w.fam + ' family'),
          ui.mute(w.cls),
          esc('#' + w.pos),
          ui.mute(w.joined),
          c ? ui.two(c.en + ' of ' + c.cap + ' places', placeNote(c)) : ui.mute('—')
        ];
        if (canOffer) {
          cells.push(offerable(w)
            ? ui.btn({
                label: 'Offer place',
                kind: 'primary',
                size: 'sm',
                msg: 'Place offered to ' + w.child + ' · family emailed'
              })
            : '');
        }
        return { cells: cells };
      }),
      { emptyTitle: 'No one matches', emptyText: 'Clear the search to see the whole queue.' }
    );

    /* Counted off the queue itself and off the classes those queues belong to,
       so the strip, the table and the roster cannot disagree. */
    var waits = D.WAITLIST.map(function (w) {
      var n = dayCount(w.joined);
      return n === null ? 0 : -n;
    });
    var avg = waits.length ? Math.round(sum(waits, function (n) { return n; }) / waits.length) : 0;

    var classes = [];
    D.WAITLIST.forEach(function (w) {
      var c = queueClass(w);
      if (c && classes.indexOf(c) === -1) classes.push(c);
    });
    var free = sum(classes, freePlaces);

    var stats = ui.statbar([
      {
        label: 'On a waitlist',
        value: String(D.WAITLIST.length),
        sub: 'across ' + queueClasses().length + ' classes'
      },
      {
        label: 'Average wait',
        value: avg + ' days',
        sub: 'since joining the queue'
      },
      {
        label: 'Places free today',
        value: String(free),
        sub: free ? 'in the classes with a queue' : 'every class with a queue is full',
        tone: free ? 'grove' : 'clay'
      }
    ]);

    var toolbar = ui.toolbar({
      tabs: requestTabs(),
      search: { key: 'waitlist', placeholder: 'Search child or family…' },
      count: rows.length + ' of ' + D.WAITLIST.length + ' entries'
    });

    var long = longestQueue();
    var note = long
      ? 'The longest queue is ' + long.cls + ', with ' + long.n + ' children waiting. ' +
        'A place can only be offered once that class has room for one.'
      : 'A place can only be offered once the class has room for one.';

    return toolbar + stats + ui.card({ flush: true, note: note }, table);
  }

  /* ---- make-ups -------------------------------------------------------------- */

  /* Rows 1 and 2 hold the slot the family asked for, not a reason for missing.
     The two belong in different columns, so they are separated here. */
  function askedFor(m) {
    return String(m.reason).replace(/^Requested\s+/, '');
  }
  function missReason(m) {
    return /^Requested\s+/.test(String(m.reason)) ? '' : m.reason;
  }
  function placement(m) {
    if (m.status === 'Awaiting approval') return 'Asked for ' + askedFor(m);
    if (m.booked) return m.booked;
    return 'Not yet booked';
  }

  function makeupTab() {
    var q = Grove.query('makeups');

    var rows = D.MAKEUPS.filter(function (m) {
      return Grove.match(q, m.child, m.missed, m.reason, m.status);
    });

    var table = ui.table(
      [
        'Child',
        'Missed session',
        'Expires',
        { label: 'Status', shrink: true },
        'Placement',
        { label: '' }
      ],
      rows.map(function (m) {
        var s = childOf(m.child);
        return {
          to: 'makeupRequest', id: m.id,
          cells: [
            ui.two(m.child, s ? s.family + ' family' : ''),
            ui.two(m.missed, missReason(m)),
            ui.mute(m.expires + ' · ' + inDays(dayCount(m.expires))),
            ui.pill(m.status, MAKEUP_PILL[m.status]),
            ui.mute(placement(m)),
            m.status === 'Awaiting approval'
              ? ui.btns([
                  { label: 'Decline', size: 'sm', msg: 'Request declined · ' + m.child + ' keeps the credit' },
                  { label: 'Approve', kind: 'primary', size: 'sm', msg: m.child + ' approved · family emailed' }
                ])
              : ''
          ]
        };
      }),
      { emptyTitle: 'No credits match', emptyText: 'Clear the search to see every credit.' }
    );

    /* Read off the rows on screen, so the note cannot describe a credit the
       search has hidden. */
    var soon = rows.filter(function (m) {
      var n = dayCount(m.expires);
      return n !== null && n <= 7;
    });
    var stuck = rows.filter(function (m) { return m.status === 'Expiring'; });

    var cycle = expiringSoon();

    var stats = ui.statbar([
      {
        label: 'Credits open',
        value: String(D.MAKEUPS.length),
        sub: 'across ' + makeupChildren() + ' children'
      },
      {
        label: 'Waiting on you',
        value: String(pendingMakeups().length),
        sub: 'placement requests',
        tone: 'plum'
      },
      {
        label: 'Run out this cycle',
        value: String(cycle.length),
        sub: cycle.length ? 'on ' + cycle[0].expires : 'nothing expiring',
        tone: cycle.length ? 'clay' : null
      }
    ]);

    var toolbar = ui.toolbar({
      tabs: requestTabs(),
      search: { key: 'makeups', placeholder: 'Search child…' },
      count: rows.length + ' of ' + D.MAKEUPS.length + ' credits'
    });

    /* The same expiry date on six rows with only one flagged looks arbitrary
       until you say what the flag means, so the note says it. */
    var note = soon.length && stuck.length
      ? soon.length + ' of these credits run out on ' + soon[0].expires + ', ' +
        inDays(dayCount(soon[0].expires)) + '. They are not all in trouble: ' +
        '“Expiring” marks the ' + (stuck.length === 1 ? 'one' : String(stuck.length)) +
        ' with no eligible class left to book into, and the rest can still be ' +
        'placed before the cycle closes.'
      : 'The child comes off the original roster straight away, but the new ' +
        'place is only held once you approve it here.';

    return toolbar + stats + ui.card({ flush: true, note: note }, table);
  }

  /* ---- supplies ---------------------------------------------------------------- */

  function supplyTab() {
    var q = Grove.query('supplies');

    var rows = D.SUPPLY_REQUESTS.filter(function (r) {
      return Grove.match(q, r.item, r.by, r.status);
    });

    var table = ui.table(
      [
        'Item',
        { label: 'Qty', align: 'right' },
        'Requested',
        { label: 'Status', shrink: true },
        { label: '' }
      ],
      rows.map(function (r) {
        return {
          cells: [
            ui.two(r.item, 'Requested by ' + r.by),
            esc(r.qty),
            ui.mute(r.when),
            ui.pill(r.status, r.kind),
            r.status === 'Pending'
              ? ui.btns([
                  { label: 'Decline', size: 'sm', msg: r.item + ' declined' },
                  { label: 'Approve', kind: 'primary', size: 'sm', msg: r.item + ' approved · added to the next order' }
                ])
              : ''
          ]
        };
      }),
      { emptyTitle: 'No requests match', emptyText: 'Clear the search to see every request.' }
    );

    var pend = pendingSupplies();
    var value = sum(pend, function (r) { return unitCost(stockFor(r.item)) * r.qty; });
    var below = D.SUPPLY_REQUESTS.filter(function (r) {
      var it = stockFor(r.item);
      return it && it.on < it.min;
    }).length;

    var stats = ui.statbar([
      {
        label: 'Waiting on you',
        value: String(pend.length),
        sub: 'of ' + D.SUPPLY_REQUESTS.length + ' requests',
        tone: 'plum'
      },
      {
        label: 'Pending order value',
        value: Grove.money(value),
        sub: 'at the supplier prices on file'
      },
      {
        label: 'Below their minimum',
        value: String(below),
        sub: 'of the ' + D.SUPPLY_REQUESTS.length + ' items requested',
        tone: below ? 'clay' : null
      }
    ]);

    var toolbar = ui.toolbar({
      tabs: requestTabs(),
      search: { key: 'supplies', placeholder: 'Search request…' },
      count: rows.length + ' of ' + D.SUPPLY_REQUESTS.length + ' requests'
    });

    /* What a request is worth approving turns on what is already on the shelf,
       so the stock each one draws on is read out of Inventory and shown here
       rather than left for the owner to go and look up. */
    var stock = ui.card({
      title: 'What these requests do to the shelf',
      flush: true,
      note: 'Reorder points and the full stock list live under Inventory. A count only changes when an order is fulfilled.'
    }, rows.length
      ? ui.rows(rows.map(function (r) {
          var it = stockFor(r.item);
          if (!it) {
            return { title: esc(r.item), sub: 'No stock record for this item.' };
          }
          var after = it.on + r.qty;
          var open = r.status === 'Pending';
          var ok = open ? after >= it.min : it.on >= it.min;
          return {
            to: 'inventoryItem', id: it.id,
            title: esc(it.item),
            sub: esc(it.on + ' on hand against a minimum of ' + it.min + '. ' + (open
              ? 'Approving ' + r.qty + ' takes it to ' + after + '.'
              : 'This request has already been fulfilled.')),
            end: ui.pill(
              open
                ? (ok ? 'Back above minimum' : 'Still below minimum')
                : (ok ? 'Above minimum' : 'Below minimum'),
              ok ? 'ok' : 'bad'
            )
          };
        }))
      : ui.empty('Nothing to check', 'Clear the search to see the stock behind every request.'));

    var openRequests = rows.filter(function (r) { return r.status === 'Pending'; }).length;
    var note = openRequests
      ? openRequests + ' of these are waiting on you. Approving one adds it to the next order.'
      : 'Nothing on show is waiting on you. Approving a request adds it to the next order.';

    return toolbar + stats + ui.card({ flush: true, note: note }, table) +
      '<div class="section">' + stock + '</div>';
  }

  /* ---- one make-up request ------------------------------------------------------ */

  Grove.screen('makeupRequest', {
    surface: 'console',
    crumbs: [{ label: 'Requests', to: 'requests' }],
    crumbTitle: 'Make-up request',
    eyebrow: function (ctx) {
      return pending(mk(ctx)) ? 'placement request' : 'make-up credit';
    },
    title: function (ctx) { return mk(ctx).child; },
    sub: function (ctx) {
      var m = mk(ctx);
      return 'Missed ' + m.missed + ' · credit expires ' + m.expires + ', ' +
        inDays(dayCount(m.expires)) + '.';
    },

    actions: function (ctx) {
      var m = mk(ctx);
      if (pending(m)) {
        return [
          { label: 'Decline', kind: 'danger', msg: 'Request declined · ' + m.child + ' keeps the credit' },
          { label: 'Approve placement', kind: 'primary', msg: 'Approved · ' + m.child + ' added to the roster, family emailed' }
        ];
      }
      if (m.status === 'Available') {
        return [
          { label: 'Message the family', to: 'newMessage' },
          { label: 'Book for the family', kind: 'primary', msg: 'Booked · Fri 31 Jul · 10:00am' }
        ];
      }
      if (m.status === 'Expiring') {
        return [{ label: 'Open an extra slot', kind: 'primary', msg: 'Extra make-up slot opened for Friday 10:00am' }];
      }
      return [{ label: 'Message the family', to: 'newMessage' }];
    },

    body: function (ctx) {
      var m = mk(ctx);
      var top = pending(m) ? ui.grid(3, pendingCards(m)) : ui.grid(2, creditCards(m));
      return top + '<div class="section">' + context(m) + '</div>';
    }
  });

  function mk(ctx) {
    var id = ctx.params.id;
    return D.MAKEUPS.filter(function (m) { return m.id === id; })[0] || D.MAKEUPS[0];
  }

  function pending(m) { return m.status === 'Awaiting approval'; }

  function statusHead(m) {
    return ui.pill(m.status, MAKEUP_PILL[m.status]);
  }

  /* Short card titles: a long one wrapped beside the status pill and pushed
     the first card's rows a line below its neighbours'. */
  function pendingCards(m) {
    var asked = ui.card({
      title: 'The request',
      head: statusHead(m),
      note: 'The family picked this slot themselves. Nothing is held for them until you approve it.'
    }, ui.kv([
      ['Child', esc(m.child)],
      ['Asked for', esc(askedFor(m))],
      ['Credit expires', esc(m.expires + ' · ' + inDays(dayCount(m.expires)))]
    ]));

    var original = ui.card({
      title: 'The original class',
      note: 'Removing the child from the original class happens automatically. Placing them into a new one does not.'
    }, ui.kv([
      ['Missed session', esc(m.missed)],
      ['Roster', 'Already removed — the place is free'],
      ['Attendance', 'Recorded as an approved absence']
    ]));

    var consequence = ui.card({
      title: 'If you approve',
      note: 'Space showing on a class is never enough on its own — approve only if the room and the instructor can genuinely take another child.'
    }, ui.kv([
      ['Roster', 'The child is added to the new session'],
      ['Credit', 'Marked used'],
      ['Family', 'Emailed a confirmation']
    ]));

    return [asked, original, consequence];
  }

  function creditCards(m) {
    var credit = ui.card({
      title: 'The credit',
      head: statusHead(m)
    }, ui.kv([
      ['Child', esc(m.child)],
      ['Reason', esc(m.reason)],
      ['Missed session', esc(m.missed)],
      ['Expires', esc(m.expires + ' · ' + inDays(dayCount(m.expires)))],
      { k: 'Transferable', v: 'No — not to siblings or future cycles', tone: 'mute' },
      { k: 'Converts to money', v: 'No', tone: 'mute' }
    ]));

    var place;
    if (m.status === 'Booked') {
      place = ui.card({
        title: 'Placement',
        note: 'The place is held. The credit is marked used once the session has been attended.'
      }, ui.kv([['Booked into', esc(m.booked)]]));
    } else if (m.status === 'Expiring') {
      place = ui.card({
        title: 'Why it cannot be placed',
        note: 'Opening an extra make-up slot is the only way to save this credit before the cycle ends.'
      }, ui.kv([
        { k: 'Openings', v: esc(m.booked), tone: 'clay' },
        ['Cycle ends', esc(m.expires)]
      ]));
    } else {
      place = ui.card({
        title: 'Placement',
        note: 'The family can book this from their own portal, or you can book it for them.'
      }, ui.kv([
        { k: 'Booked into', v: 'Not yet booked', tone: 'mute' },
        ['Expires', esc(m.expires)]
      ]));
    }

    return [credit, place];
  }

  /* The row of context under the decision: who the child is, what else they
     are holding, and the last thing the family said. All read off Grove.data,
     because a decision screen with nothing but the request on it is a page you
     cannot act from. */
  function context(m) {
    var s = childOf(m.child);
    var held = D.MAKEUPS.filter(function (o) { return o.child === m.child; });
    var others = held.filter(function (o) { return o.id !== m.id; });
    var thread = s ? D.THREADS.filter(function (t) { return t.fam === s.family; })[0] : null;
    var first = String(m.child).split(' ')[0];

    var who = s
      ? ui.card({
          title: 'The child',
          head: ui.btn({ label: 'Open the record', kind: 'quiet', size: 'sm', to: 'studentRecord', id: s.id }),
          note: 'Credits are counted off this list, not off the child record, so the two cannot drift apart.'
        }, ui.kv([
          ['Age', esc(s.age + ' · ages ' + s.band)],
          ['Family', esc(s.family + ' family')],
          ['Usual class', esc(s.cls)],
          ['Attendance', esc(s.att)],
          ['Credits held', String(held.length)],
          s.flag
            ? { k: 'Note', v: esc(s.flag), tone: s.flagKind === 'bad' ? 'clay' : null }
            : { k: 'Note', v: 'Nothing on file', tone: 'mute' }
        ]))
      : ui.card({ title: 'The child' },
          ui.empty('No child record', 'This credit is not matched to a child on the roster.'));

    var creditsCard = ui.card({
      title: 'Other credits for ' + first,
      flush: others.length > 0,
      note: others.length
        ? 'Each one is its own decision. Approving this request does not spend the others.'
        : null
    }, others.length
      ? ui.rows(others.map(function (o) {
          return {
            to: 'makeupRequest', id: o.id,
            title: esc(o.missed),
            sub: esc(missReason(o) || placement(o)),
            end: ui.pill(o.status, MAKEUP_PILL[o.status])
          };
        }))
      : ui.empty('Only this one',
          first + ' holds no other make-up credit, so nothing else is waiting on the cycle.'));

    var side = [creditsCard];
    if (thread) {
      side.push(ui.card({
        title: 'Last word from the family',
        head: ui.btn({ label: 'Open the thread', kind: 'quiet', size: 'sm', to: 'thread', id: thread.id }),
        flush: true
      }, ui.rows([{
        title: esc('“' + thread.last + '”'),
        sub: esc(thread.who + ' · ' + thread.when)
      }])));
    }

    return ui.grid(2, [who, side.length > 1 ? ui.col(side) : side[0]]);
  }
})();
