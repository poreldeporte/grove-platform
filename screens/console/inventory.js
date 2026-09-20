/* Console → Inventory (list) and the stock item record.

   Simplifications against the previous build:
     - seven filter chips, none of which filtered anything, are the statuses
       the data actually carries, read off the rows
     - the search box and the count label were inert and hardcoded; both now
       read the rows they describe
     - "Reorder at" and "Minimum" were two names for one number. It is Minimum
       on both screens
     - the low-stock tint keyed off a status string, so Smocks at 18 against a
       minimum of 20 read as fine. It now keys off the numbers
     - lead time, last delivery and typical monthly use were figures nothing in
       the studio produces, so the record carries what the dataset genuinely
       holds: the shelf, the requests against it, and what an order costs

   Fixed after the visual review:
     - the list opened with a search field where every other console list opens
       with a segmented group. The statuses are that group now, with the counts
       the rows give them, and search sits where Billing puts it
     - "Items tracked" in the stat band only restated the All tab beside it. It
       is now what it would cost to bring every item back to its minimum, which
       is the figure behind the Create purchase order button
     - the record was two short cards and half a page of cream. It carries the
       shelf, the ordering arithmetic, the requests raised against the item and
       the rest of that supplier's shelf — every line derived, nothing invented
     - the subtitle restated all four rows of the card 40px beneath it; it says
       what the page is for instead
     - the breadcrumb read "Stock item". It names the item, as the ledger crumb
       names the family
     - every figure here is derived: a top-up is minimum minus on hand, an
       order is priced at the unit cost on file, and an order covers the larger
       of the shortfall and the units already requested — never both, because
       Requests says approving a request puts its units on the shelf */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, esc = Grove.esc, D = Grove.data;

  var TAB_KEY = 'inventory';
  var T_ALL = 'All';

  /* Worst first, so the tab that matters holds the left of the group. Only
     the statuses the dataset actually uses are offered. */
  var STATUS_ORDER = ['Reorder now', 'Low', 'OK'];

  /* ---- derivations ---------------------------------------------------------
     Every number on both screens comes out of Grove.data here, so the shelf
     cannot be counted one way on the list and another on the record. */

  function isBelow(i) { return i.on < i.min; }
  function shortOf(i) { return Math.max(0, i.min - i.on); }
  function spareOf(i) { return Math.max(0, i.on - i.min); }

  function unitCost(i) {
    var n = parseFloat(String(i && i.cost).replace(/[^0-9.]/g, ''));
    return isNaN(n) ? 0 : n;
  }

  function sum(list, fn) {
    var total = 0;
    list.forEach(function (x) { total += fn(x); });
    return total;
  }

  function units(n) { return n + (n === 1 ? ' unit' : ' units'); }

  function belowMinimum() { return D.INVENTORY.filter(isBelow); }

  /* What it would cost to bring the whole shelf back to its minimums, at the
     supplier prices on file. */
  function topUpValue() {
    return sum(D.INVENTORY, function (i) { return shortOf(i) * unitCost(i); });
  }

  /* The only movement the dataset holds for an item is the supply requests
     raised against it. Request names are sometimes shorter than the shelf
     name ("Brushes · medium" for "Brushes · medium round"), so match on
     either being the start of the other — the same test Requests uses. */
  function movementFor(i) {
    return D.SUPPLY_REQUESTS.filter(function (r) {
      return r.item === i.item ||
        i.item.indexOf(r.item) === 0 ||
        r.item.indexOf(i.item) === 0;
    });
  }

  function openFor(i) {
    return movementFor(i).filter(function (r) { return r.status === 'Pending'; });
  }

  function askedFor(i) {
    return sum(openFor(i), function (r) { return r.qty; });
  }

  function pending() {
    return D.SUPPLY_REQUESTS.filter(function (r) { return r.status === 'Pending'; });
  }

  function statusTabs() {
    var items = [{ label: T_ALL, count: D.INVENTORY.length }];
    STATUS_ORDER.forEach(function (s) {
      var n = D.INVENTORY.filter(function (i) { return i.status === s; }).length;
      if (n) items.push({ label: s, count: n });
    });
    return { key: TAB_KEY, items: items };
  }

  function item(ctx) {
    var id = ctx.params.id;
    return D.INVENTORY.filter(function (i) { return i.id === id; })[0] || D.INVENTORY[0];
  }

  function num(value, cls) {
    return '<span class="num' + (cls ? ' ' + cls : '') + '">' + esc(value) + '</span>';
  }

  /* ---- list ---------------------------------------------------------------- */

  Grove.screen('inventory', {
    surface: 'console',
    eyebrow: 'clay, paint, paper',
    title: 'Inventory',
    sub: 'What is on the shelf and what is running out. Requests from instructors are approved under Requests.',
    actions: [
      { label: 'See supply requests', to: 'requests' },
      { label: 'Create purchase order', kind: 'primary', msg: 'Purchase order created' }
    ],

    body: function () {
      var q = Grove.query(TAB_KEY);
      var tab = Grove.tab(TAB_KEY, T_ALL);

      var rows = D.INVENTORY.filter(function (i) {
        if (!Grove.match(q, i.item, i.supplier, i.status)) return false;
        if (tab !== T_ALL) return i.status === tab;
        return true;
      });

      var table = ui.table(
        [
          'Item',
          { label: 'On hand', align: 'right' },
          { label: 'Minimum', align: 'right' },
          'Supplier',
          { label: 'Unit cost', align: 'right' },
          { label: 'Status', shrink: true }
        ],
        rows.map(function (i) {
          return {
            to: 'inventoryItem', id: i.id,
            cells: [
              ui.two(i.item),
              num(i.on, isBelow(i) ? 'clay strong' : ''),
              num(i.min, 'mute'),
              ui.mute(i.supplier),
              num(i.cost),
              ui.pill(i.status, i.kind)
            ]
          };
        }),
        { emptyTitle: 'No items match', emptyText: 'Clear the search or choose a different status.' }
      );

      var below = belowMinimum();

      var stats = ui.statbar([
        {
          label: 'Below minimum',
          value: String(below.length),
          sub: 'of ' + D.INVENTORY.length + ' items on the shelf',
          tone: below.length ? 'clay' : null
        },
        {
          label: 'To reach every minimum',
          value: Grove.money(topUpValue()),
          sub: 'at the supplier prices on file'
        },
        {
          label: 'Open supply requests',
          value: String(pending().length),
          sub: 'of ' + D.SUPPLY_REQUESTS.length + ' raised, waiting under Requests',
          tone: pending().length ? 'plum' : null
        }
      ]);

      /* Tabs first, then search — the order every other console list uses. */
      var toolbar = ui.toolbar({
        tabs: statusTabs(),
        search: { key: TAB_KEY, placeholder: 'Search item or supplier…' },
        count: rows.length + ' of ' + D.INVENTORY.length + ' items'
      });

      return toolbar + stats + ui.card({ flush: true }, table);
    }
  });

  /* ---- stock item -----------------------------------------------------------
     Four cards in two stacked columns: the shelf and the requests against it on
     the left, what an order would cost and the rest of that supplier's shelf on
     the right, so the two columns finish together. */

  var recordDef = {
    surface: 'console',
    crumbs: [{ label: 'Inventory', to: 'inventory' }],
    eyebrow: 'on the shelf',
    title: function (ctx) { return item(ctx).item; },
    sub: function (ctx) {
      return 'What is on the shelf, what the instructors have asked for, and what the next order with ' +
        item(ctx).supplier + ' would cost.';
    },
    actions: function (ctx) {
      var i = item(ctx);
      return [
        { label: 'Adjust count', msg: 'Stock count adjusted' },
        { label: 'Reorder', kind: 'primary', msg: 'Reorder raised with ' + i.supplier }
      ];
    },

    body: function (ctx) {
      var i = item(ctx);
      var unit = unitCost(i);
      var gap = shortOf(i);
      var spare = spareOf(i);
      var moves = movementFor(i);
      var open = openFor(i);
      var asked = askedFor(i);
      /* Approving a request puts its units on the shelf, which is what
         Requests tells the owner, so the order is the larger of the two
         figures rather than the sum of them. */
      var order = Math.max(gap, asked);

      var whoAsked = open.map(function (r) { return r.by; }).join(' and ');

      var standing = ui.notice({
        kind: isBelow(i) ? (i.kind === 'bad' ? 'bad' : 'warn') : 'ok',
        title: isBelow(i)
          ? units(gap) + ' below the minimum'
          : units(spare) + ' above the minimum',
        text: asked
          ? 'Approving the ' + units(asked) + ' ' + whoAsked + ' asked for takes the shelf to ' + (i.on + asked) + '.'
          : 'Nothing is on request, so the count will not move until an order is fulfilled.'
      });

      var stock = ui.card(
        {
          title: 'Stock',
          head: ui.pill(i.status, i.kind),
          note: 'Minimum is the point at which this item joins the next purchase order. A count only changes when an order is fulfilled.'
        },
        ui.kv([
          { k: 'On hand', v: esc(String(i.on)), tone: isBelow(i) ? 'clay' : null },
          ['Minimum', String(i.min)],
          isBelow(i)
            ? { k: 'Short by', v: esc(units(gap)), tone: 'clay' }
            : { k: 'Above the minimum by', v: esc(units(spare)) },
          asked
            ? { k: 'On request now', v: esc(units(asked)) }
            : { k: 'On request now', v: 'Nothing outstanding', tone: 'mute' },
          { k: 'Value on the shelf', v: esc(Grove.money(i.on * unit)) }
        ]) +
        '<div class="card-split">' + standing + '</div>'
      );

      var movement = ui.card(
        {
          title: 'Supply requests',
          head: ui.btn({ label: 'All requests', kind: 'quiet', size: 'sm', to: 'requests' }),
          flush: true,
          note: 'Every request an instructor has raised against this item. They are approved under Requests, and the count moves when the order arrives.'
        },
        moves.length
          ? ui.rows(moves.map(function (r) {
              return {
                lead: esc(r.when),
                title: esc(r.by + ' asked for ' + units(r.qty)),
                sub: esc(Grove.money(r.qty * unit) + ' at the price on file'),
                end: ui.pill(r.status, r.kind)
              };
            }))
          : ui.empty('Nothing requested', 'No instructor has asked for this item. Requests raised in the Studio portal appear here.')
      );

      var ordering = ui.card(
        {
          title: 'Ordering',
          note: 'Approving a request puts its units on the shelf, so an order covers the larger of the two figures rather than both.'
        },
        ui.kv([
          ['Supplier', esc(i.supplier)],
          ['Unit cost', esc(i.cost)],
          gap
            ? { k: 'To reach the minimum', v: esc(units(gap) + ' · ' + Grove.money(gap * unit)), tone: 'clay' }
            : { k: 'To reach the minimum', v: 'Nothing needed', tone: 'mute' },
          asked
            ? { k: 'Requests waiting', v: esc(units(asked) + ' · ' + Grove.money(asked * unit)) }
            : { k: 'Requests waiting', v: 'None', tone: 'mute' },
          order
            ? { k: 'Next order', v: esc(units(order) + ' · ' + Grove.money(order * unit)) }
            : { k: 'Next order', v: 'Nothing to order', tone: 'mute' }
        ])
      );

      /* One order covers a whole supplier, so the rest of that supplier's
         shelf belongs on this page. Two items are the only thing their
         supplier sends; those fall back to whatever else is under its
         minimum, which is the other reason to open this screen. */
      var kin = D.INVENTORY.filter(function (x) {
        return x.supplier === i.supplier && x.id !== i.id;
      });
      var alone = kin.length === 0;
      var alsoRows = alone
        ? belowMinimum().filter(function (x) { return x.id !== i.id; })
        : kin;
      var alsoBelow = alsoRows.filter(isBelow).length;

      var alsoNote = alone
        ? i.supplier + ' sends this item alone, so an order to them carries nothing else. These are the items under their minimum elsewhere on the shelf.'
        : 'One order covers everything from ' + i.supplier + ', so these travel with it. ' +
          (alsoBelow === 1
            ? '1 of the ' + alsoRows.length + ' is under its minimum.'
            : alsoBelow + ' of the ' + alsoRows.length + ' are under their minimum.');

      var also = ui.card(
        {
          title: alone ? 'Also running low' : 'Also from ' + i.supplier,
          head: ui.btn({ label: 'Open inventory', kind: 'quiet', size: 'sm', to: 'inventory' }),
          flush: true,
          note: alsoNote
        },
        alsoRows.length
          ? ui.rows(alsoRows.map(function (x) {
              return {
                to: 'inventoryItem', id: x.id,
                title: esc(x.item),
                sub: esc(x.on + ' on hand against a minimum of ' + x.min),
                end: ui.pill(x.status, x.kind)
              };
            }))
          : ui.empty('Everything else is on the shelf', 'No other item is under its minimum today.')
      );

      return ui.grid(2, [ui.col([stock, movement]), ui.col([ordering, also])]);
    }
  };

  /* The trail has to close on the item, and the shell reads crumbTitle as a
     value rather than calling it, so it is defined as a getter. */
  Object.defineProperty(recordDef, 'crumbTitle', {
    get: function () { return item({ params: Grove.state.params }).item; }
  });

  Grove.screen('inventoryItem', recordDef);
})();
