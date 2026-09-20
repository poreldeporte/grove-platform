/* Console → Inventory (the shelf) and the stock item record.

   Fitted to Sabrina, who comes to this screen to answer one question: what do
   I need to order. The answer is now the top of the page and the button that
   acts on it is pinned to the bottom of the viewport.

   Cut in this pass:
     - the status vocabulary. "Reorder now" and "Low" were two words for one
       decision — both mean the item goes on the order — and the stored string
       could disagree with the numbers (Smocks at 18 against a minimum of 20
       read "Low" while Acrylic at 2 against 12 read "Reorder now"; the shelf
       treats them the same). Status is derived from on-hand against minimum
       and has two states: On the order, OK. INVENTORY.status and .kind are no
       longer read by this screen
     - the four status tabs. With the order lifted to its own card at the top,
       a tab that filters the table down to the same three rows is a second
       control for a decision already made. Search stays; six chips do not
     - the three-up stat band. "Below minimum" restated the tab beside it and
       "Open supply requests" restated the Requests screen. The one figure she
       acts on — what the order costs — is the sticky bar's hint and the order
       card's foot, beside the rows it is summed from
     - the list and the record disagreed about what an order is. The list
       priced the shortfall ($111.00) while the record priced the larger of the
       shortfall and the units instructors had asked for ($100.80 for one item
       alone). One rule now, stated once: an order covers the larger of the
       two, because approving a request puts its units on the shelf
     - "Value on the shelf" on the record. $8.40 of acrylic paint is an
       accountant's number and there is no accountant; nothing she can do
       changes it
     - the record's Stock and Ordering cards stated the same five numbers
       twice — "Short by 10" and "To reach the minimum 10 units", "On request
       now 24 units" and "Requests waiting 24 units". One card
     - the record's header primary. "Reorder" spent money without naming the
       quantity, the supplier or the amount. It is a sticky bar that says all
       three before she presses it

   Kept dense on purpose: the shelf and the record are a desk, a keyboard and
   a table of numbers. Nothing there became a large friendly card, and nothing
   on either is picked with a finger.

   Every figure is derived from the rows printed under it: the order quantity,
   the per-supplier split, the totals in both card feet and every sticky hint.
   Nothing in this file is typed in.

   NEW IN THIS PASS — Adjust the count

   "Adjust count" raised a toast and changed nothing. It is a screen now, and
   it asks one question: what is actually on the shelf. It opens on the number
   the system holds, she steps that number to what she counted, and the
   difference stands as a figure of its own beside the two it is drawn from.

   A reason is asked for only when the difference is larger than a fifth of
   the item's own minimum — two brushes out of a box of twenty-four is a
   miscount, two pots of clay out is a quarter of the shelf — and the reasons
   offered follow the direction of the difference, because paint does not
   un-spoil and a delivery nobody booked in cannot explain a shortfall. That
   is the one follow-up on the page, and the only place a note earns itself.

   The sticky bar names the level it is about to write and whether that level
   is under the minimum. Nothing is bought by counting: the order is still
   raised from Inventory, and it re-reads whatever the count leaves behind. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  var SEARCH_KEY = 'inventory';

  /* ---- derivations ---------------------------------------------------------
     Both screens read the shelf through these, so the list cannot count an
     order one way and the record another. */

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
  function itemsWord(n) { return n + (n === 1 ? ' item' : ' items'); }

  function joinWords(list) {
    if (!list.length) return '';
    if (list.length === 1) return list[0];
    return list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1];
  }

  /* The only movement recorded against an item is the supply requests
     raised on it. Request names are sometimes shorter than the shelf
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

  function requesters(i) {
    var seen = [];
    openFor(i).forEach(function (r) { if (seen.indexOf(r.by) === -1) seen.push(r.by); });
    return seen;
  }

  function pending() {
    return D.SUPPLY_REQUESTS.filter(function (r) { return r.status === 'Pending'; });
  }

  /* The one rule. Approving a request puts its units on the shelf, which is
     what the Requests screen tells her, so an order covers the larger of the
     shortfall and the units already asked for — never the sum of them. */
  function orderQty(i) { return Math.max(shortOf(i), askedFor(i)); }
  function orderCost(i) { return orderQty(i) * unitCost(i); }

  function toOrder() {
    return D.INVENTORY.filter(function (i) { return orderQty(i) > 0; });
  }

  /* One order covers a whole supplier, so the order is grouped by supplier,
     dearest supplier first, and dearest line first inside each. */
  function supplierGroups(list) {
    var names = [], by = {};
    list.forEach(function (i) {
      if (!by[i.supplier]) {
        by[i.supplier] = { name: i.supplier, items: [], units: 0, cost: 0 };
        names.push(i.supplier);
      }
      var g = by[i.supplier];
      g.items.push(i);
      g.units += orderQty(i);
      g.cost += orderCost(i);
    });
    return names.map(function (n) { return by[n]; })
      .sort(function (a, b) { return b.cost - a.cost; });
  }

  function orderRows() {
    var out = [];
    supplierGroups(toOrder()).forEach(function (g) {
      g.items.slice().sort(function (a, b) { return orderCost(b) - orderCost(a); })
        .forEach(function (i) { out.push(i); });
    });
    return out;
  }

  /* Why this quantity and not the shortfall — printed on the row rather than
     left as arithmetic she has to redo. */
  function whyShort(i) {
    var gap = shortOf(i);
    var asked = askedFor(i);
    var who = joinWords(requesters(i));
    if (gap && asked) return 'Short by ' + gap + ' · ' + who + ' asked for ' + units(asked);
    if (asked) return who + ' asked for ' + units(asked);
    return 'Short by ' + units(gap);
  }

  function pillFor(qty) {
    return qty ? ui.pill('On the order', 'bad') : ui.pill('OK', 'ok');
  }
  function statePill(i) { return pillFor(orderQty(i)); }

  function item(ctx) {
    var id = ctx.params.id;
    return D.INVENTORY.filter(function (i) { return i.id === id; })[0] || D.INVENTORY[0];
  }

  function num(value, cls) {
    return '<span class="num' + (cls ? ' ' + cls : '') + '">' + esc(value) + '</span>';
  }

  function total(label, value) {
    return '<span class="cell-mute">' + esc(label) + '</span>' +
      '<span class="num strong">' + esc(value) + '</span>';
  }

  /* ---- the shelf ------------------------------------------------------------
     What to order comes first, then the shelf it comes off, then the button
     that places it. */

  Grove.screen('inventory', {
    surface: 'console',
    eyebrow: 'clay, paint, paper',
    title: 'Inventory',
    sub: 'What to order today, and the shelf it comes off. Instructor requests are approved under Requests.',
    actions: [
      { label: 'See supply requests', to: 'requests' }
    ],

    body: function () {
      var order = orderRows();
      var groups = supplierGroups(order);
      var orderUnits = sum(order, orderQty);
      var orderTotal = sum(order, orderCost);
      var waiting = pending().length;

      var orderTable = ui.table(
        [
          'Item',
          'Supplier',
          { label: 'On hand', align: 'right' },
          { label: 'Minimum', align: 'right' },
          { label: 'To order', align: 'right' },
          { label: 'Cost', align: 'right' }
        ],
        order.map(function (i) {
          return {
            to: 'inventoryItem', id: i.id,
            cells: [
              ui.two(i.item, whyShort(i)),
              ui.mute(i.supplier),
              num(i.on, isBelow(i) ? 'clay strong' : ''),
              num(i.min, 'mute'),
              num(orderQty(i), 'strong'),
              num(Grove.money(orderCost(i)))
            ]
          };
        }),
        {
          emptyTitle: 'Nothing to order',
          emptyText: 'Every item is at or above its minimum and no instructor request is waiting.'
        }
      );

      var orderCard = ui.card(
        {
          title: 'What to order',
          head: waiting
            ? ui.btn({
                label: waiting === 1 ? '1 request waiting' : waiting + ' requests waiting',
                kind: 'quiet', size: 'sm', to: 'requests'
              })
            : null,
          flush: true,
          note: 'An order covers the larger of two figures: the units needed to reach the minimum, and the units instructors have already asked for. Approving a request puts its units on the shelf, so it is never both.',
          foot: order.length
            ? total(
                groups.map(function (g) { return g.name + ' ' + Grove.money(g.cost); }).join(' · '),
                units(orderUnits) + ' · ' + Grove.money(orderTotal)
              )
            : null
        },
        orderTable
      );

      /* The shelf itself: every item, alphabetical, so a count can be checked
         against the room without hunting. */
      var q = Grove.query(SEARCH_KEY);
      var shelf = D.INVENTORY
        .filter(function (i) { return Grove.match(q, i.item, i.supplier); })
        .sort(function (a, b) { return String(a.item).localeCompare(String(b.item)); });

      var shelfTable = ui.table(
        [
          'Item',
          { label: 'On hand', align: 'right' },
          { label: 'Minimum', align: 'right' },
          'Supplier',
          { label: 'Unit cost', align: 'right' },
          { label: 'Status', shrink: true }
        ],
        shelf.map(function (i) {
          return {
            to: 'inventoryItem', id: i.id,
            cells: [
              ui.two(i.item),
              num(i.on, isBelow(i) ? 'clay strong' : ''),
              num(i.min, 'mute'),
              ui.mute(i.supplier),
              num(i.cost),
              statePill(i)
            ]
          };
        }),
        { emptyTitle: 'No items match', emptyText: 'Clear the search to see the whole shelf.' }
      );

      var toolbar = ui.toolbar({
        search: { key: SEARCH_KEY, placeholder: 'Search item or supplier…' },
        count: shelf.length === D.INVENTORY.length
          ? itemsWord(shelf.length) + ' on the shelf'
          : shelf.length + ' of ' + itemsWord(D.INVENTORY.length)
      });

      /* Money leaves the studio here, so the bar says how much, to whom and
         for how many units before she presses it. */
      var bar = order.length
        ? ui.formActions([
            {
              label: 'Create purchase order',
              kind: 'primary',
              msg: 'Purchase order' + (groups.length > 1 ? 's' : '') + ' raised with ' +
                joinWords(groups.map(function (g) { return g.name; })) + ' · ' + Grove.money(orderTotal)
            }
          ], {
            sticky: true,
            hint: 'Orders ' + units(orderUnits) + ' across ' + itemsWord(order.length) + ' — ' +
              Grove.money(orderTotal) + ' to ' + joinWords(groups.map(function (g) { return g.name; }))
          })
        : ui.formActions([
            { label: 'See supply requests', to: 'requests' }
          ], { sticky: true, hint: 'Nothing is under its minimum and no request is waiting' });

      return h`
        ${raw(orderCard)}
        <div class="section">
          <div class="section-head"><h2 class="section-title">Everything on the shelf</h2></div>
          ${raw(toolbar)}
          ${raw(ui.card({ flush: true }, shelfTable))}
        </div>
        ${raw(bar)}
      `;
    }
  });

  /* ---- stock item -----------------------------------------------------------
     One card of arithmetic, the requests raised against the item, the rest of
     that supplier's shelf, and the order in a bar at the foot of the page. */

  var recordDef = {
    surface: 'console',
    crumbs: [{ label: 'Inventory', to: 'inventory' }],
    eyebrow: 'on the shelf',
    title: function (ctx) { return item(ctx).item; },
    sub: function (ctx) {
      return 'Where this item stands, what the instructors have asked for, and what the next order with ' +
        item(ctx).supplier + ' covers.';
    },
    actions: function (ctx) {
      return [{ label: 'Adjust count', to: 'adjustStock', id: item(ctx).id }];
    },

    body: function (ctx) {
      var i = item(ctx);
      var unit = unitCost(i);
      var gap = shortOf(i);
      var spare = spareOf(i);
      var moves = movementFor(i);
      var asked = askedFor(i);
      var qty = orderQty(i);
      var cost = orderCost(i);
      var whoAsked = joinWords(requesters(i));

      var standing = ui.notice({
        kind: isBelow(i) ? 'bad' : 'ok',
        title: isBelow(i)
          ? units(gap) + ' below the minimum'
          : units(spare) + ' above the minimum',
        text: asked
          ? 'Approving the ' + units(asked) + ' ' + whoAsked + ' asked for takes the shelf to ' + (i.on + asked) + '.'
          : 'Nothing is on request, so the count will not move until an order arrives.'
      });

      /* One card, because Stock and Ordering were stating the same five
         numbers under two headings. */
      var stock = ui.card(
        {
          title: 'Stock and the next order',
          head: statePill(i),
          note: 'The minimum is the point at which this item joins the next purchase order. A count only changes when an order arrives.'
        },
        ui.kv([
          { k: 'On hand', v: esc(String(i.on)), tone: isBelow(i) ? 'clay' : null },
          ['Minimum', String(i.min)],
          isBelow(i)
            ? { k: 'Short by', v: esc(units(gap)), tone: 'clay' }
            : { k: 'Above the minimum by', v: esc(units(spare)) },
          asked
            ? { k: 'Asked for by instructors', v: esc(units(asked) + ' · ' + Grove.money(asked * unit)) }
            : { k: 'Asked for by instructors', v: 'Nothing outstanding', tone: 'mute' },
          ['Supplier', esc(i.supplier)],
          ['Unit cost', esc(i.cost)],
          qty
            ? { k: 'Next order', v: esc(units(qty) + ' · ' + Grove.money(cost)) }
            : { k: 'Next order', v: 'Nothing to order', tone: 'mute' }
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

      /* One order covers a whole supplier, so the rest of that supplier's
         shelf belongs on this page. Two items are the only thing their
         supplier sends; those fall back to the rest of today's order, which
         is the other reason to be on this screen. */
      var kin = D.INVENTORY.filter(function (x) {
        return x.supplier === i.supplier && x.id !== i.id;
      });
      var alone = kin.length === 0;
      var alsoRows = (alone ? toOrder().filter(function (x) { return x.id !== i.id; }) : kin)
        .slice()
        .sort(function (a, b) { return orderCost(b) - orderCost(a); });

      var alsoOrdering = alsoRows.filter(function (x) { return orderQty(x) > 0; });
      var alsoUnits = sum(alsoRows, orderQty);
      var alsoCost = sum(alsoRows, orderCost);

      var alsoNote = alone
        ? i.supplier + ' sends this item alone, so an order to them carries nothing else. These are the other items on today’s order.'
        : 'One order covers everything from ' + i.supplier + ', so these travel with it. ' +
          (alsoOrdering.length === 1
            ? '1 of the ' + alsoRows.length + ' is on the order.'
            : alsoOrdering.length + ' of the ' + alsoRows.length + ' are on the order.');

      var also = ui.card(
        {
          title: alone ? 'Also on today’s order' : 'Also from ' + i.supplier,
          head: ui.btn({ label: 'Open inventory', kind: 'quiet', size: 'sm', to: 'inventory' }),
          flush: true,
          note: alsoNote,
          foot: alsoRows.length
            ? total(
                alone ? 'The rest of today’s order' : 'The rest of the ' + i.supplier + ' order',
                alsoUnits ? units(alsoUnits) + ' · ' + Grove.money(alsoCost) : 'Nothing else to order'
              )
            : null
        },
        alsoRows.length
          ? ui.rows(alsoRows.map(function (x) {
              return {
                to: 'inventoryItem', id: x.id,
                title: esc(x.item),
                sub: esc(orderQty(x)
                  ? units(orderQty(x)) + ' to order · ' + Grove.money(orderCost(x))
                  : x.on + ' on hand against a minimum of ' + x.min),
                end: statePill(x)
              };
            }))
          : ui.empty('Everything else is on the shelf', 'Nothing else is under its minimum today.')
      );

      /* The order names its quantity, its supplier and its cost before it is
         placed, because nobody here reverses one for her. */
      var bar = qty
        ? ui.formActions([
            {
              label: 'Order ' + units(qty) + ' from ' + i.supplier,
              kind: 'primary',
              msg: 'Order raised with ' + i.supplier + ' · ' + units(qty) + ' of ' + i.item + ' · ' + Grove.money(cost)
            },
            { label: 'Back to inventory', to: 'inventory' }
          ], {
            sticky: true,
            hint: Grove.money(cost) + ' at the price on file · the count moves when the order arrives'
          })
        : ui.formActions([
            { label: 'Back to inventory', to: 'inventory' }
          ], {
            sticky: true,
            hint: 'Nothing to order · ' + units(spare) + ' above the minimum and no request waiting'
          });

      return h`
        ${raw(ui.grid(2, [ui.col([stock]), ui.col([movement, also])]))}
        ${raw(bar)}
      `;
    }
  };

  /* The trail has to close on the item, and the shell reads crumbTitle as a
     value rather than calling it, so it is defined as a getter. */
  Object.defineProperty(recordDef, 'crumbTitle', {
    get: function () { return item({ params: Grove.state.params }).item; }
  });

  Grove.screen('inventoryItem', recordDef);

  /* ---- counting the shelf ---------------------------------------------------
     What "Adjust count" used to raise a toast for. One question — what is
     actually in the room — asked as a step away from the number on file,
     because a count is a correction of a figure that already exists rather
     than a figure typed from nothing. The difference is what she is really
     looking at, so it stands beside the two numbers it is drawn from.

     A reason is asked for only when the difference is large, and large is read
     off the item rather than fixed: more than a fifth of its own minimum.
     Being two brushes out of a box of twenty-four is a miscount; being two
     pots of clay out is a quarter of the shelf. The reasons offered follow the
     direction of the difference — paint does not un-spoil, and a delivery
     nobody booked in cannot explain a shortfall. */

  var STEP = 'stockCount';
  var WHY = 'stockWhy';

  function countKey(id) { return 'stock-count-' + id; }
  function whyKey(id) { return 'stock-why-' + id; }
  function currentItem() { return item({ params: Grove.state.params }); }

  Grove.on(STEP, function (d) {
    Grove.setFilter(countKey(currentItem().id), Math.max(0, Number(d.n) || 0));
  });
  Grove.on(WHY, function (d) {
    Grove.setFilter(whyKey(currentItem().id), d.id);
  });

  /* The count starts where the shelf already is, so the page opens saying
     nothing has changed rather than guessing at a number nobody has counted. */
  function countedOn(i) { return Number(Grove.filter(countKey(i.id), i.on)); }

  /* A fifth of the item's own minimum, never less than one. */
  function bigGap(i) { return Math.max(1, Math.round(i.min / 5)); }

  function signed(n) { return n > 0 ? '+' + n : (n < 0 ? '−' + Math.abs(n) : '0'); }

  var REASONS_DOWN = [
    { id: 'used', title: 'Used up in class', sub: 'Spent faster than the lesson plans assumed' },
    { id: 'spoiled', title: 'Broken, dried out or spoiled', sub: 'Thrown away rather than used' },
    { id: 'miscount', title: 'The number on file was wrong', sub: 'Nothing left the room — the last count was out' }
  ];
  var REASONS_UP = [
    { id: 'delivery', title: 'A delivery was never booked in', sub: 'It arrived and the shelf was never raised' },
    { id: 'returned', title: 'Came back from a class', sub: 'Taken out for a class and returned unused' },
    { id: 'miscount', title: 'The number on file was wrong', sub: 'Nothing arrived — the last count was out' }
  ];

  function reasonsFor(diff) { return diff < 0 ? REASONS_DOWN : REASONS_UP; }

  /* A reason picked while the count was short does not survive the count
     turning long, so the label is looked up against the current direction and
     an answer that no longer explains anything reads as no answer. */
  function reasonLabel(id, diff) {
    var out = '';
    reasonsFor(diff).forEach(function (r) { if (r.id === id) out = r.title; });
    return out;
  }

  Grove.screen('adjustStock', {
    surface: 'console',
    crumbs: [{ label: 'Inventory', to: 'inventory' }],
    crumbTitle: 'Adjust the count',
    eyebrow: function (ctx) { return 'counting ' + item(ctx).item; },
    title: 'Adjust the count',
    sub: function (ctx) {
      var i = item(ctx);
      return 'The shelf says there are ' + i.on + '. Put in what is actually in the room and that becomes the ' +
        'new level. Nothing is bought here — the order is raised from Inventory, and it reads whatever this leaves behind.';
    },
    actions: [
      { label: 'See supply requests', to: 'requests' }
    ],

    body: function (ctx) {
      var i = item(ctx);
      var counted = countedOn(i);
      var diff = counted - i.on;

      var newShort = Math.max(0, i.min - counted);
      var newSpare = Math.max(0, counted - i.min);
      var asked = askedFor(i);
      var wasQty = orderQty(i);
      var newQty = Math.max(newShort, asked);
      var newCost = newQty * unitCost(i);

      var gap = bigGap(i);
      var needWhy = Math.abs(diff) > gap;
      var whyPicked = Grove.filter(whyKey(i.id), '');
      var whyLabel = needWhy ? reasonLabel(whyPicked, diff) : '';

      /* The three numbers, in the order she reads them: what the system
         thinks, what she counted, and the only one she is really weighing. */
      var stats = ui.statbar([
        {
          label: 'On file',
          value: String(i.on),
          sub: 'what the shelf says today'
        },
        {
          label: 'Counted',
          value: String(counted),
          sub: diff ? 'what is in the room' : 'nothing stepped yet'
        },
        {
          label: 'Difference',
          value: signed(diff),
          tone: diff < 0 ? 'clay' : (diff > 0 ? 'grove' : null),
          sub: diff
            ? (diff < 0
                ? units(-diff) + ' fewer than the shelf says'
                : units(diff) + ' more than the shelf says')
            : 'the count matches the shelf'
        }
      ]);

      var stepper = ui.btns([
        { label: '−5', act: STEP, n: String(Math.max(0, counted - 5)) },
        { label: '−1', act: STEP, n: String(Math.max(0, counted - 1)) },
        { label: '+1', act: STEP, n: String(counted + 1) },
        { label: '+5', act: STEP, n: String(counted + 5) }
      ]);

      /* Two jumps worth a button: back to where she started, and the one
         number stepping will not reach quickly — an item that has run out. */
      var quick = [];
      if (diff) quick.push({ label: 'Back to the ' + i.on + ' on file', kind: 'quiet', size: 'sm', act: STEP, n: String(i.on) });
      if (counted) quick.push({ label: 'Nothing left on the shelf', kind: 'quiet', size: 'sm', act: STEP, n: '0' });

      var question = ui.card(
        {
          title: 'What did you count?',
          note: 'A count is a correction, not a purchase. It moves the shelf and nothing else.'
        },
        ui.field({
          label: 'What is on the shelf',
          hint: diff
            ? 'Counted ' + counted + ' against the ' + i.on + ' on file — ' + signed(diff) + '.'
            : 'The shelf says ' + i.on + '. Step it to the number in the room.',
          control: stepper
        }) +
        (quick.length ? '<div class="card-split">' + ui.btns(quick) + '</div>' : '')
      );

      /* The one follow-up, and only when the difference has earned it. */
      var whyCard = needWhy
        ? ui.card(
            {
              title: diff < 0
                ? 'Why are ' + units(-diff) + ' missing?'
                : 'Where did the extra ' + units(diff) + ' come from?',
              note: 'Anything up to ' + units(gap) + ' — a fifth of this item’s minimum — is a normal miscount and goes ' +
                'on without a word. This is further out than that, so the next person to count it should know why.'
            },
            ui.choices(null, reasonsFor(diff).map(function (r) {
              return ui.choice({
                id: r.id,
                size: 'lg',
                act: WHY,
                title: r.title,
                sub: r.sub,
                on: r.id === whyPicked
              });
            }))
          )
        : '';

      var orderLine, orderTone;
      if (newQty && !wasQty) {
        orderLine = 'Joins the ' + i.supplier + ' order — ' + units(newQty) + ' · ' + Grove.money(newCost);
        orderTone = 'clay';
      } else if (!newQty && wasQty) {
        orderLine = 'Comes off the order';
        orderTone = 'grove';
      } else if (newQty) {
        orderLine = 'Stays on the ' + i.supplier + ' order — ' + units(newQty) + ' · ' + Grove.money(newCost);
        orderTone = null;
      } else {
        orderLine = 'Stays off the order';
        orderTone = 'mute';
      }

      var changes = ui.card(
        {
          title: 'Where this leaves the shelf',
          head: pillFor(newQty),
          note: 'The minimum is the point at which this item joins the next purchase order, and an order still covers the larger of the shortfall and the units instructors have asked for.'
        },
        ui.kv([
          ['Minimum', String(i.min)],
          counted < i.min
            ? { k: 'After this count', v: esc(units(newShort) + ' under the minimum'), tone: 'clay' }
            : { k: 'After this count', v: esc(units(newSpare) + ' above the minimum') },
          { k: 'The next order', v: esc(orderLine), tone: orderTone },
          asked
            ? ['Asked for by instructors', esc(units(asked) + ' from ' + joinWords(requesters(i)))]
            : { k: 'Asked for by instructors', v: 'Nothing outstanding', tone: 'mute' },
          ['Unit cost', esc(i.cost)]
        ])
      );

      var saved = ui.card({ title: 'What happens when you save', flush: true }, ui.rows([
        {
          title: esc('The shelf reads ' + counted + ' from now on'),
          sub: esc('Inventory, this item and the studio request screen all read the one number.')
        },
        {
          title: esc(newQty
            ? (wasQty ? 'It stays on the next order' : 'It joins the next order')
            : (wasQty ? 'It comes off the next order' : 'It stays off the next order')),
          sub: esc(newQty
            ? units(newQty) + ' from ' + i.supplier + ' · ' + Grove.money(newCost)
            : 'Nothing to order at this level'),
          end: ui.btn({ label: 'Open inventory', kind: 'quiet', size: 'sm', to: 'inventory' })
        },
        {
          title: 'Nothing is bought by counting',
          sub: esc('The purchase order is raised from Inventory, and it will read this new level.')
        }
      ]));

      var filed = ui.card(
        {
          title: 'Filled in for you',
          note: 'A count is never edited once saved. A second count corrects it, and both lines stay on the item.'
        },
        ui.kv([
          ['Date', esc(D.today)],
          ['Counted by', esc(Grove.persona('console').name)],
          ['Replaces', esc(units(i.on) + ' on file')],
          needWhy
            ? (whyLabel
                ? ['Reason', esc(whyLabel)]
                : { k: 'Reason', v: 'Not given yet', tone: 'clay' })
            : { k: 'Reason', v: 'Not needed at this size', tone: 'mute' }
        ])
      );

      /* The bar says the level it is about to write and whether that level is
         under the minimum, because that is the part she will be asked about. */
      var level = 'The shelf becomes ' + counted + ' — ' +
        (counted < i.min
          ? units(newShort) + ' under its minimum of ' + i.min
          : units(newSpare) + ' above its minimum of ' + i.min);
      var consequence = newQty
        ? (wasQty ? ', so it stays on the ' + i.supplier + ' order' : ', so it joins the ' + i.supplier + ' order')
        : (wasQty ? ', which takes it off the order' : ', and it stays off the order');

      var bar = diff
        ? ui.formActions([
            {
              label: 'Set the count to ' + counted,
              kind: 'primary',
              msg: i.item + ' counted at ' + counted + ' · ' + signed(diff) + ' against the ' + i.on +
                ' on file' + (whyLabel ? ' · ' + whyLabel.toLowerCase() : '')
            },
            { label: 'Cancel', to: 'inventoryItem', id: i.id }
          ], {
            sticky: true,
            hint: needWhy && !whyLabel
              ? 'That is ' + units(Math.abs(diff)) + ' out — say why above before you save. ' + level + consequence + '.'
              : level + consequence + '.'
          })
        : ui.formActions([
            { label: 'Back to ' + i.item, to: 'inventoryItem', id: i.id }
          ], {
            sticky: true,
            hint: 'Nothing has changed yet — step the number above to what you counted.'
          });

      return h`
        ${raw(stats)}
        ${raw(ui.grid(null, needWhy ? [question, whyCard] : [question]))}
        <div class="section">${raw(ui.grid(2, [ui.col([changes]), ui.col([saved, filed])]))}</div>
        ${raw(bar)}
      `;
    }
  });
})();
