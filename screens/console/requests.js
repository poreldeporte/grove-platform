/* Console → Requests (Waitlist · Make-ups · Supplies) and one make-up request.

   This was the screen the client screenshotted. The old build stacked a tabs
   rail, then a band of three oversized stat cards, then a search row, before
   the table finally started — three bands of near-empty space on every tab.

   Simplifications against the previous build:
     - tabs, search and the result count are one `ui.toolbar` row; the three
       waitlist numbers are a slim `ui.statbar` strip UNDER it, not three tall
       cards above the search
     - Waitlist, Make-ups and Supplies were three screen keys pretending to be
       one page. They are now one screen with three tabs, so the header,
       toolbar and table are drawn once
     - the five make-up filter chips are gone. The tab already separates the
       work from the history, and eight rows do not need a chip rail
     - the four make-up stat cards are gone. "Expiring" and "cannot be placed"
       are already on the rows they describe, in the status pill and the last
       column
     - the make-up drawer's four sections became three cards in one grid, and
       the credit variant two. Its "If you approve" section was a description
       of what the button does; the confirmation toast says the same thing
     - the drawer's invented per-request class detail (places showing,
       instructor, room) is dropped — the dataset has no such record, and the
       warning it carried is kept as a card note instead
     - the "Joined" column no longer repeats the word "Joined" in every cell */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, esc = Grove.esc, D = Grove.data;

  var TAB_KEY = 'requests';
  var WAITLIST_TAB = 'Waitlist';
  var MAKEUP_TAB = 'Make-ups';
  var SUPPLY_TAB = 'Supplies';

  /* A make-up is only a request while it is awaiting approval or unspent. */
  var MAKEUP_PILL = {
    'Awaiting approval': 'warn',
    'Available': 'ok',
    'Booked': null,
    'Expiring': 'warn'
  };

  var SUBS = {
    Waitlist: 'Nobody is turned away. When a class fills, families join a queue and are offered openings in position order.',
    'Make-ups': 'A make-up credit is counted in classes, never in money. A family requests a slot; you approve it here.',
    Supplies: 'What instructors have asked the office to buy or restock.'
  };

  function tab() { return Grove.tab(TAB_KEY, WAITLIST_TAB); }

  function openMakeups() {
    return D.MAKEUPS.filter(function (m) {
      return m.status === 'Awaiting approval' || m.status === 'Available';
    });
  }

  function pendingSupplies() {
    return D.SUPPLY_REQUESTS.filter(function (r) { return r.status === 'Pending'; });
  }

  function topOfQueue() {
    return D.WAITLIST.filter(function (w) { return w.pos === 1; })[0] || D.WAITLIST[0];
  }

  function requestTabs() {
    return {
      key: TAB_KEY,
      items: [
        { label: WAITLIST_TAB, count: D.WAITLIST.length },
        { label: MAKEUP_TAB, count: openMakeups().length },
        { label: SUPPLY_TAB, count: pendingSupplies().length }
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
          msg: 'Friday 10:00am opened · 6 places'
        }];
      }
      if (tab() === SUPPLY_TAB) {
        return [{
          label: 'Approve all pending',
          kind: 'primary',
          msg: pendingSupplies().length + ' supply requests approved'
        }];
      }
      return [{
        label: 'Offer next place',
        kind: 'primary',
        msg: 'Place offered to ' + topOfQueue().child + ' · family emailed'
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

    var table = ui.table(
      [
        'Child',
        'Class',
        { label: 'Pos', align: 'right' },
        'Joined',
        { label: 'Status', shrink: true },
        { label: '', shrink: true }
      ],
      rows.map(function (w) {
        return {
          cells: [
            ui.two(w.child, w.fam + ' family'),
            ui.mute(w.cls),
            esc('#' + w.pos),
            ui.mute(w.joined),
            ui.pill('Waiting'),
            w.pos === 1
              ? ui.btn({
                  label: 'Offer place',
                  kind: 'primary',
                  size: 'sm',
                  msg: 'Place offered to ' + w.child + ' · family emailed'
                })
              : ''
          ]
        };
      }),
      { emptyTitle: 'No one matches', emptyText: 'Clear the search to see the whole queue.' }
    );

    /* Studio-wide figures, the same three the dashboard reports. They cover
       every class, not only the named entries in the table below. */
    var stats = ui.statbar([
      { label: 'On a waitlist', value: '12', sub: 'across 5 classes' },
      { label: 'Joined this month', value: '6', sub: 'most for ages 8–11', tone: 'plum' },
      { label: 'Average wait', value: '9 days', sub: 'after-school, ages 8–11' }
    ]);

    var toolbar = ui.toolbar({
      tabs: requestTabs(),
      search: { key: 'waitlist', placeholder: 'Search child or family…' },
      count: rows.length + ' of ' + D.WAITLIST.length + ' entries'
    });

    return toolbar + stats + ui.card({
      flush: true,
      note: 'Ages 8–11 on Monday and Wednesday carry most of the queue.'
    }, table);
  }

  /* ---- make-ups -------------------------------------------------------------- */

  function makeupTab() {
    var q = Grove.query('makeups');

    var rows = D.MAKEUPS.filter(function (m) {
      return Grove.match(q, m.child, m.missed, m.reason, m.status);
    });

    var table = ui.table(
      ['Child', 'Missed session', 'Expires', { label: 'Status', shrink: true }, 'Booked into'],
      rows.map(function (m) {
        return {
          to: 'makeupRequest', id: m.id,
          cells: [
            ui.two(m.child, m.reason),
            ui.mute(m.missed),
            ui.mute(m.expires),
            ui.pill(m.status, MAKEUP_PILL[m.status]),
            m.status === 'Awaiting approval'
              ? ui.btns([
                  { label: 'Decline', size: 'sm', msg: 'Request declined · ' + m.child + ' keeps the credit' },
                  { label: 'Approve', kind: 'primary', size: 'sm', msg: m.child + ' approved · family emailed' }
                ])
              : (m.booked ? ui.mute(m.booked) : '')
          ]
        };
      }),
      { emptyTitle: 'No credits match', emptyText: 'Clear the search to see every credit.' }
    );

    var toolbar = ui.toolbar({
      tabs: requestTabs(),
      search: { key: 'makeups', placeholder: 'Search child…' },
      count: rows.length + ' of ' + D.MAKEUPS.length + ' credits'
    });

    return toolbar + ui.card({
      flush: true,
      note: 'The child comes off the original roster straight away, but the new place is only held once you approve it here. Space showing on a class is never enough on its own.'
    }, table);
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
        { label: '', shrink: true }
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

    var toolbar = ui.toolbar({
      tabs: requestTabs(),
      search: { key: 'supplies', placeholder: 'Search request…' },
      count: rows.length + ' of ' + D.SUPPLY_REQUESTS.length + ' requests'
    });

    return toolbar + ui.card({
      flush: true,
      note: 'Approving a request updates the stock count on fulfilment. Stock levels themselves live under Inventory.'
    }, table);
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
    sub: function (ctx) { return 'Missed ' + mk(ctx).missed + ' · credit expires ' + mk(ctx).expires + '.'; },

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
          { label: 'Book for the family', kind: 'primary', msg: 'Booked · Fri 31 Jul 10:00am' }
        ];
      }
      if (m.status === 'Expiring') {
        return [{ label: 'Open an extra slot', kind: 'primary', msg: 'Friday 10:00am opened · 6 places' }];
      }
      return [{ label: 'Message the family', to: 'newMessage' }];
    },

    body: function (ctx) {
      var m = mk(ctx);
      return pending(m) ? ui.grid(3, pendingCards(m)) : ui.grid(2, creditCards(m));
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

  function pendingCards(m) {
    var asked = ui.card({
      title: 'What the family asked for',
      head: statusHead(m)
    }, ui.kv([
      ['Child', esc(m.child)],
      ['Requested slot', esc(String(m.reason).replace(/^Requested\s+/, ''))],
      ['Credit expires', esc(m.expires)]
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
      ['Expires', esc(m.expires)],
      { k: 'Transferable', v: 'No — not to siblings or future cycles', tone: 'mute' },
      { k: 'Converts to money', v: 'No', tone: 'mute' }
    ]));

    var placement;
    if (m.status === 'Booked') {
      placement = ui.card({
        title: 'Placement',
        note: 'The place is held. The credit is marked used once the session has been attended.'
      }, ui.kv([['Booked into', esc(m.booked)]]));
    } else if (m.status === 'Expiring') {
      placement = ui.card({
        title: 'Why it cannot be placed',
        note: 'Opening an extra make-up slot is the only way to save this credit before the cycle ends.'
      }, ui.kv([
        { k: 'Openings', v: esc(m.booked), tone: 'clay' },
        ['Cycle ends', esc(m.expires)]
      ]));
    } else {
      placement = ui.card({
        title: 'Placement',
        note: 'The family can book this from their own portal, or you can book it for them.'
      }, ui.kv([
        { k: 'Booked into', v: 'Not yet booked', tone: 'mute' },
        ['Expires', esc(m.expires)]
      ]));
    }

    return [credit, placement];
  }
})();
