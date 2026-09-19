/* Console → Inventory (list) and the stock item record.

   Simplifications against the previous build:
     - seven filter chips, none of which filtered anything, are four that do:
       All, and the three statuses the data actually carries
     - the search box and the count label were inert and hardcoded; both now
       read the rows they describe
     - "Reorder at" and "Minimum" were two names for one number. It is Minimum
       on both screens
     - the low-stock tint keyed off a status string, so Smocks at 18 against a
       minimum of 20 read as fine. It now keys off the numbers
     - the item record's four cards are two: what is on the shelf, and the
       movement the dataset genuinely records. Lead time, last delivery and
       typical monthly use were figures nothing in the studio produces */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, esc = Grove.esc, D = Grove.data;

  function isBelow(i) { return i.on < i.min; }

  function pending() {
    return D.SUPPLY_REQUESTS.filter(function (r) { return r.status === 'Pending'; });
  }

  /* The only movement the dataset holds for an item is the supply requests
     raised against it. Request names are sometimes shorter than the shelf
     name ("Brushes · medium" for "Brushes · medium round"), so match on
     either being the start of the other. */
  function movementFor(i) {
    return D.SUPPLY_REQUESTS.filter(function (r) {
      return r.item === i.item ||
        i.item.indexOf(r.item) === 0 ||
        r.item.indexOf(i.item) === 0;
    });
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
      var q = Grove.query('inventory');
      var filter = Grove.filter('inventory', 'All');

      var rows = D.INVENTORY.filter(function (i) {
        if (!Grove.match(q, i.item, i.supplier, i.status)) return false;
        if (filter !== 'All') return i.status === filter;
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
        { emptyTitle: 'No items match', emptyText: 'Clear the search or choose a different filter.' }
      );

      var stats = ui.statbar([
        { label: 'Items tracked', value: String(D.INVENTORY.length) },
        { label: 'Below minimum', value: String(D.INVENTORY.filter(isBelow).length), tone: 'clay' },
        { label: 'Open supply requests', value: String(pending().length), tone: 'plum' }
      ]);

      var toolbar = ui.toolbar({
        search: { key: 'inventory', placeholder: 'Search item…' },
        filters: { key: 'inventory', items: ['All', 'Reorder now', 'Low', 'OK'] },
        count: rows.length + ' of ' + D.INVENTORY.length + ' items'
      });

      return toolbar + stats + ui.card({ flush: true }, table);
    }
  });

  /* ---- stock item ----------------------------------------------------------- */

  Grove.screen('inventoryItem', {
    surface: 'console',
    crumbs: [{ label: 'Inventory', to: 'inventory' }],
    crumbTitle: 'Stock item',
    eyebrow: 'on the shelf',
    title: function (ctx) { return item(ctx).item; },
    sub: function (ctx) {
      var i = item(ctx);
      return i.supplier + ' · ' + i.cost + ' a unit · ' + i.on +
        ' on hand against a minimum of ' + i.min + '.';
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

      var stock = ui.card(
        {
          title: 'Stock',
          head: ui.pill(i.status, i.kind),
          note: 'Minimum is the point at which this item joins the next purchase order.'
        },
        ui.kv([
          { k: 'On hand', v: String(i.on), tone: isBelow(i) ? 'clay' : null },
          ['Minimum', String(i.min)],
          ['Supplier', i.supplier],
          ['Unit cost', i.cost]
        ])
      );

      var moves = movementFor(i);
      var movement = ui.card(
        {
          title: 'Recent movement',
          head: ui.btn({ label: 'All requests', kind: 'quiet', size: 'sm', to: 'requests' }),
          flush: true,
          note: 'Drawn from the supply requests raised against this item.'
        },
        moves.length
          ? ui.rows(moves.map(function (r) {
              return {
                lead: esc(r.when),
                title: esc(r.by) + ' asked for ' + esc(r.qty),
                end: ui.pill(r.status, r.kind)
              };
            }))
          : ui.empty('Nothing recorded', 'No supply request has been raised for this item.')
      );

      return ui.grid(2, [stock, movement]);
    }
  });
})();
