/* Console → Dashboard. Sabrina's morning screen.

   Three questions, in this order: what needs a decision, what is on, what the
   desk has been doing. It declares its header as data and returns only a body
   built from Grove.ui components.

   Changes in the billing-model pass:
     - the make-up queue is gone, machinery and all. A session cancelled more
       than 24 hours ahead is simply not spent — it stays in the child's pack
       and the pack lasts a week longer — so there is no credit to issue, hold,
       approve, place or expire, and nothing here to ask her about. The
       exception table that ranked "class full", "wrong age band", "credit
       expired", "nowhere to place it" and "no such hour" has been deleted
       rather than renamed, along with the date arithmetic underneath it, which
       only ever measured how long a credit had left to live
     - a pack renews when the last session in it is used, so the next charge is
       a number of classes away rather than a day on the calendar. "Last class
       in the pack" is the new card in that slot: the children who take the
       final session of their pack at their very next class, what each pack
       costs to renew, and how each charge is taken. It is the only place on
       this screen where money that has not happened yet is shown, and every
       figure in it is counted off the child's own pack
     - a pack belongs to one child, not to a family, so every row on that card
       is a child and two children in one family appear twice. The Johnsons
       renew separately, on different classes, for different amounts
     - the money rows say what the failed card is about to be asked for next.
       A card that has just been refused is the card the next renewal will go
       to, which is the reason to fix it this morning rather than at the end of
       the week. That sentence is read off the family's own children

   Kept from the owner-fit pass:
     - the screen is a decision list first. Everything waiting on her was
       spread across two notices, a rail badge and three screens she had to go
       and open: four unpaid invoices, two supply orders and one over-full
       class. They are one dense table at the top of the page, biggest money
       first, and every row carries the button that ends it. She is at a desk
       with a keyboard, and seven rows of table are faster for her than seven
       cards
     - the six-figure stat strip is cut. A statbar cannot be clicked, so it was
       six numbers with nothing to do about any of them, and three of them —
       revenue, average attendance, how many sit on a waitlist — were nothing
       she could act on this morning at all. Every fact it carried is still in
       the product and nearer its action: the outstanding money is the money
       rows and their amounts; sessions today and the children expected are the
       note under On today; the waitlist total is the waitlist table; revenue,
       enrollment and attendance belong to Reports, which is where she goes
       when the question is how trade is going rather than what to do next
     - both notices went with it. "4 invoices are unpaid → Resolve" and "the
       Thursday class is over capacity → Rebalance" were headlines over a page
       that then let her resolve and rebalance nothing. Both are rows in the
       decision table now, with the real action on them
     - three invoice statuses, one question. Failed, Past due and Awaiting
       payment stay on the row as facts, but they only ever split two ways:
       there is a card to charge, or there is not. The button is "Charge $45",
       or — for the Delgado family, who have no card and have written to say
       they have a new one — "Open their message"
     - header actions went from three to one. "Add family" opened the family
       list, which is a button that asks nothing, and "New program" is already
       the primary action of the Programs screen, where it belongs

   Reading the roll rather than the prose:
     - every headcount on this page is counted off a class roster. A session in
       On today shows the enrolment and the places its class record holds, not
       a figure travelling alongside the session. Camp extended care is the one
       session with no class behind it, so it keeps the numbers the day carries
     - every pack figure comes from D.pack(child) and every pack price from
       PRICING.as.plans, so a renewal amount on this screen is the same amount
       the registration flow quotes and the ledger records
     - Waiting for a place is built from the classes that have somebody waiting
       rather than from the distinct strings in the waitlist rows. A class with
       a queue therefore always names its instructor and its room, and the
       Waiting column is the class's own count rather than a second tally of
       the same rows. The over-full class in the decision table reads the same
       count, so the two cards cannot state different numbers for one class

   No sticky action bar, deliberately. This screen dispatches seven separate
   decisions rather than completing one, and there is no honest bulk button for
   them: a single "charge every card" would sweep up a card that has already
   been refused twice. The work is the first thing on the page instead, above
   everything else, and each row states its own consequence beside its own
   button. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  var DAYS = {
    Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday',
    Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday'
  };

  function plain(n) { return Grove.money(n, { cents: false }); }

  function sum(list, of) {
    var total = 0;
    list.forEach(function (x) { total += of(x); });
    return total;
  }

  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  function firstName(name) { return String(name).split(' ')[0]; }

  /* 4 → '4th', 12 → '12th'. Used to name the class a pack renews on. */
  function ordinal(n) {
    var tail = ['th', 'st', 'nd', 'rd'];
    var v = n % 100;
    return n + (tail[(v - 20) % 10] || tail[v] || tail[0]);
  }

  /* Two buttons in a table cell. ui.btns wraps them onto two lines when the
     column is tight, which stands those rows a line taller than the rest; the
     cell is `shrink`, so two inline buttons sit on one line and the column
     asks for exactly the width they need. */
  function pair(a, b) { return ui.btn(a) + ' ' + ui.btn(b); }

  /* Money the studio is owed reads clay. Money it would spend is just money. */
  function owedAmount(n) { return h`<span class="clay">${Grove.money(n)}</span>`; }

  /* 'On receipt' sits mid-sentence after "due", so it loses its capital. */
  function lower(text) {
    var t = String(text);
    return /^\d/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1);
  }

  /* ---- packs -------------------------------------------------------------------
     A family buys a pack of sessions for one child. The child attends, and when
     the last session in the pack is used the pack charges again and grants
     another of the same size. There is no billing date anywhere in here, and
     nothing expires: a pack is paid for, so it is theirs until it is used.
     Everything below is read off D.pack(child) and the studio's pack prices. */

  function packPrice(size) {
    var plans = D.PRICING.as.plans || {};
    var p = plans['p' + size];
    return typeof p === 'number' ? p : 0;
  }

  function familyNamed(name) {
    return D.FAMILIES.filter(function (f) { return f.name === name; })[0] || null;
  }

  /* A family that has said they are finishing. They keep what they have paid
     for; the pack simply does not renew when it runs out. */
  function notRenewing(f) {
    if (!f) return false;
    return /not renewing/i.test(String(f.plan)) || f.status === 'Cancelling';
  }

  /* '2:15–3:15pm' -> '2:15pm'; '10:00am–1:00pm' -> '10:00am'. */
  function startTime(c) {
    var parts = String(c.time).split('–');
    var a = String(parts[0] || '').toLowerCase();
    if (a.indexOf('am') !== -1 || a.indexOf('pm') !== -1) return a;
    var b = String(parts[1] || '').toLowerCase();
    return a + (b.indexOf('am') !== -1 ? 'am' : (b.indexOf('pm') !== -1 ? 'pm' : ''));
  }

  /* The after-school hours a pack is spent on. Camp weeks and one-off bookings
     are bought separately, so they are not what the pack pays for. */
  function packHours(s) {
    return D.classesOf(s)
      .filter(function (c) { return c.prog === 'as'; })
      .map(function (c) { return DAYS[c.day] + ' ' + startTime(c) + ' · ' + c.room; })
      .join(', ');
  }

  /* Children whose next class takes the last session in their pack. */
  function lastInPack() {
    return D.STUDENTS.filter(function (s) {
      var p = D.pack(s);
      return p.isPack && p.renewsIn === 1;
    }).map(function (s) {
      var f = familyNamed(s.family);
      var p = D.pack(s);
      var ends = notRenewing(f);
      return { s: s, f: f, p: p, ends: ends, price: ends ? 0 : packPrice(p.size) };
    }).sort(function (a, b) {
      if (b.price !== a.price) return b.price - a.price;
      return a.s.name < b.s.name ? -1 : 1;
    });
  }

  /* The next charge coming to a family: the child of theirs whose pack runs out
     soonest. Null when nobody in the family holds a pack. */
  function nextRenewal(famName) {
    var kids = D.STUDENTS.filter(function (s) {
      return s.family === famName && D.pack(s).isPack;
    }).sort(function (a, b) { return D.pack(a).renewsIn - D.pack(b).renewsIn; });
    if (!kids.length) return null;
    var s = kids[0], p = D.pack(s);
    return { s: s, p: p, price: packPrice(p.size) };
  }

  function renewPhrase(n) {
    if (n <= 1) return 'on the next class';
    return 'in ' + n + ' classes';
  }

  /* ---- matching the free-text records back to the records they name ------------
     A class carries its own roll, so anything about a class — who is in it, how
     many, how many places are left — is counted off that roll. What is left
     here are the records that still name their subject in prose rather than by
     key: today's sessions and the supply requests. Each match below is the one
     the screen that owns that record already makes, so the dashboard cannot
     state a different figure from Classes, Billing or Inventory. Each one is a
     foreign key in waiting. */

  function freePlaces(c) { return c ? Math.max(0, c.cap - c.en) : 0; }

  /* A waitlist entry names its class as 'Mon 3:15pm · Ages 8–11', and the
     dataset counts a class's queue off that same day-and-start-time opening
     when it derives the class's waitlist figure. The screen reads the rows back
     with the rule that produced the number, so the names it lists and the count
     beside them are the same fact twice. */
  function queueOpening(c) { return c.day + ' ' + String(c.time).split('–')[0]; }

  function queueFor(c) {
    return D.WAITLIST.filter(function (w) {
      return String(w.cls).indexOf(queueOpening(c)) === 0;
    });
  }

  /* Today's sessions carry a title, not a class key: 'Summer Camp · Week 4 ·
     Studio 1'. The room narrows it, the class name settles it. Extended care
     matches nothing, because the timetable holds no record of it. */
  function sessionClass(s) {
    var title = String(s.title).toLowerCase();
    var best = null, score = 0;
    D.CLASSES.forEach(function (c) {
      if (title.indexOf(String(c.room).toLowerCase()) === -1) return;
      var name = String(c.name).toLowerCase();
      var head = name.split(' · ')[0];
      var n = title.indexOf(name) !== -1 ? 2 : (title.indexOf(head) !== -1 ? 1 : 0);
      if (n > score) { score = n; best = c; }
    });
    return best;
  }

  /* A supply request names its item in the same words Inventory uses. */
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

  function famIdFor(name) {
    var f = familyNamed(name);
    return f ? f.id : undefined;
  }
  function threadFor(name) {
    return D.THREADS.filter(function (t) { return t.fam === name; })[0] || null;
  }

  /* ---- what is waiting on her -------------------------------------------------- */

  function unpaidInvoices() {
    return D.INVOICES.filter(function (i) { return i.status !== 'Paid'; })
      .slice()
      .sort(function (a, b) { return b.amt - a.amt; });
  }
  function noCardSaved(i) { return /none/i.test(String(i.method)); }

  function pendingSupplies() {
    return D.SUPPLY_REQUESTS.filter(function (r) { return r.status === 'Pending'; });
  }

  function overCapacity() {
    return D.CLASSES.filter(function (c) { return c.en > c.cap; });
  }

  /* Today's list, each session against the class record behind it. A session on
     the timetable takes its headcount and its places from that class's roll.
     Camp extended care answers to no class, so it keeps the day's own figures. */
  function todaySessions() {
    return D.TODAY.map(function (s) {
      var c = sessionClass(s);
      return { s: s, c: c, en: c ? c.en : s.en, cap: c ? c.cap : s.cap };
    });
  }

  /* ---- the rows ----------------------------------------------------------------
     One shape for all three kinds: a tag, who or what it is about, where it
     stands, the money if there is any, and the button that ends it. Every
     button that moves money or fills a room says what it will do. */

  function moneyRow(inv) {
    var button, stands = inv.note;

    if (noCardSaved(inv)) {
      var t = threadFor(inv.fam);
      button = t
        ? ui.btn({ label: 'Open their message', kind: 'primary', size: 'sm', to: 'thread', id: t.id })
        : ui.btn({
            label: 'Ask for a card',
            kind: 'primary',
            size: 'sm',
            msg: 'Asked the ' + inv.fam + ' family for a card · nothing charged'
          });
    } else {
      var again = inv.status === 'Failed';
      button = ui.btn({
        label: (again ? 'Try ' : 'Charge ') + plain(inv.amt) + (again ? ' again' : ''),
        kind: 'primary',
        size: 'sm',
        msg: plain(inv.amt) + ' charged to ' + inv.method + ' · the ' + inv.fam +
          ' family is emailed the result'
      });

      /* The same card is about to be asked for the next pack, which is the
         reason to fix this one this morning. */
      var next = nextRenewal(inv.fam);
      if (next && next.price) {
        stands = (stands ? stands + ' ' : '') + firstName(next.s.name) + '’s pack renews ' +
          renewPhrase(next.p.renewsIn) + ' — ' + plain(next.price) + ' to the same card.';
      }
    }

    return {
      to: 'familyRecord', id: famIdFor(inv.fam),
      cells: [
        ui.pill('Money', 'bad'),
        ui.two(inv.fam + ' family', inv.id + ' · due ' + lower(inv.due)),
        ui.two(inv.method + ' · ' + String(inv.status).toLowerCase(), stands),
        owedAmount(inv.amt),
        button
      ]
    };
  }

  function supplyRow(r) {
    var it = stockFor(r.item);
    var after = it ? it.on + r.qty : null;
    var stands = it
      ? ui.two(
          it.on + ' on hand against a minimum of ' + it.min,
          'Approving ' + r.qty + ' takes it to ' + after +
            (after < it.min ? ', still under the minimum' : '')
        )
      : ui.two('No stock record for this item', 'Nothing to price the order against');

    return {
      to: it ? 'inventoryItem' : 'inventory', id: it ? it.id : undefined,
      cells: [
        ui.pill('Order', 'amber'),
        ui.two(r.item, plural(r.qty, 'unit', 'units') + ' asked for by ' + r.by + ' on ' + r.when),
        stands,
        it ? esc(Grove.money(unitCost(it) * r.qty)) : ui.mute('—'),
        pair(
          { label: 'Decline', size: 'sm', msg: r.item + ' declined' },
          { label: 'Approve', kind: 'primary', size: 'sm', msg: r.item + ' approved · added to the next order' }
        )
      ]
    };
  }

  function capacityRow(c) {
    var waiting = c.wl;
    return {
      to: 'classRecord', id: c.id,
      cells: [
        ui.pill('Class', 'bad'),
        ui.two(DAYS[c.day] + ' ' + startTime(c) + ' · ages ' + c.band, c.staff + ' · ' + c.room),
        ui.two(
          c.en + ' enrolled against ' + c.cap + ' places',
          waiting
            ? plural(waiting, 'child', 'children') + ' waiting · nobody can be offered a place until somebody leaves'
            : 'Nobody is waiting on this class'
        ),
        ui.mute('—'),
        ui.btn({ label: 'Open the class', size: 'sm', to: 'classRecord', id: c.id })
      ]
    };
  }

  function decisionRows() {
    return []
      .concat(unpaidInvoices().map(moneyRow))
      .concat(pendingSupplies().map(supplyRow))
      .concat(overCapacity().map(capacityRow));
  }

  /* ---- queues ------------------------------------------------------------------ */

  /* Every class somebody is waiting on, in timetable order, each with its own
     queue in the order the families joined it. */
  function queues() {
    return D.CLASSES.filter(function (c) { return c.wl > 0; }).map(function (c) {
      return {
        c: c,
        list: queueFor(c).sort(function (a, b) { return a.pos - b.pos; })
      };
    });
  }

  function placeNote(c) {
    if (c.en > c.cap) return 'over by ' + (c.en - c.cap);
    if (c.en === c.cap) return 'full';
    var free = c.cap - c.en;
    return free === 1 ? '1 place free' : free + ' places free';
  }

  /* ---- screen -------------------------------------------------------------------- */

  Grove.screen('dashboard', {
    surface: 'console',
    crumbTitle: 'Dashboard',
    eyebrow: 'where things stand',
    title: String(D.today).replace(/\s+\d{4}$/, ''),
    sub: 'Summer camp week 4 of 6 · after-school enrollment opens in 13 days.',
    actions: [
      { label: 'Take a payment', kind: 'primary', msg: 'Payment taken at the desk · receipt emailed' }
    ],

    body: function () {
      var rows = decisionRows();

      var decisions = ui.card(
        {
          title: 'Needs a decision',
          head: ui.mute(plural(rows.length, 'thing is', 'things are') + ' waiting on you'),
          flush: true,
          note: 'Charging a card takes the money today and emails a receipt; a card that fails ' +
            'is not tried again on its own. Approving an order adds it to the next order to ' +
            'the supplier.'
        },
        ui.table(
          [
            { label: 'Kind', shrink: true },
            'Who or what',
            'Where it stands',
            { label: 'Amount', align: 'right', shrink: true },
            { label: '', shrink: true }
          ],
          rows,
          {
            emptyTitle: 'Nothing is waiting on you',
            emptyText: 'Every invoice is settled, every order answered and every class within its places.'
          }
        )
      );

      var sessions = todaySessions();

      var today = ui.card(
        {
          title: 'On today',
          head: ui.btn({ label: 'Open classes', kind: 'quiet', size: 'sm', to: 'classes' }),
          flush: true,
          note: plural(sum(sessions, function (x) { return x.en; }), 'child', 'children') +
            ' expected across ' + plural(sessions.length, 'session', 'sessions') + '.'
        },
        ui.rows(sessions.map(function (x) {
          var full = x.en >= x.cap;
          return {
            lead: esc(x.s.time),
            title: ui.dot(D.program(x.s.prog).color) + ' ' + esc(x.s.title),
            sub: x.c ? esc(x.c.staff) : '',
            end: '<span class="num ' + (full ? 'clay' : 'grove') + '">' + x.en + '/' + x.cap + '</span>',
            to: x.c ? 'classRecord' : 'classes',
            id: x.c ? x.c.id : undefined
          };
        }))
      );

      var activity = ui.card(
        {
          title: 'Today at the desk',
          flush: true,
          note: 'Everything the desk and the instructors have done today, newest first.'
        },
        ui.rows(D.ACTIVITY.map(function (a) {
          return { lead: esc(a.at), title: esc(a.what) };
        }))
      );

      /* Packs about to run out. A pack renews on the class that spends its last
         session, so this is a queue of charges, not a calendar. */
      var running = lastInPack();
      var renewing = running.filter(function (r) { return !r.ends; });
      var ending = running.length - renewing.length;
      var dueNext = sum(renewing, function (r) { return r.price; });

      var packNote = 'A pack renews when the last session in it is used, so the next charge is a ' +
        'number of classes away rather than a day on the calendar. ';
      if (renewing.length) {
        packNote += plural(renewing.length, 'pack renews', 'packs renew') +
          ' at these children’s next class, ' + plain(dueNext) + ' in all.';
      } else {
        packNote += 'None of these packs renews.';
      }
      if (ending) {
        packNote += ' ' + plural(ending, 'family has', 'families have') +
          ' said they are not renewing, so that pack ends when it runs out and nothing is charged.';
      }

      var packs = ui.card(
        {
          title: 'Last class in the pack',
          head: ui.btn({ label: 'Open billing', kind: 'quiet', size: 'sm', to: 'billing' }),
          flush: true,
          note: packNote
        },
        ui.table(
          ['Child', 'Pack', 'What happens next', { label: 'Amount', align: 'right', shrink: true }],
          running.map(function (r) {
            var s = r.s, f = r.f, p = r.p;
            var what;

            if (r.ends) {
              what = ui.two('Not renewing', 'the place ends when the pack runs out');
            } else if (f && f.status !== 'Active') {
              what = ui.two('Charges the card again', 'the account is ' +
                String(f.status).toLowerCase() + ' — it is in the decisions above');
            } else if (f && f.autopay) {
              what = ui.two('Charges automatically', f.card);
            } else {
              what = ui.two('Taken at the desk', 'autopay is off · ' + (f ? f.card : 'no card saved'));
            }

            return {
              to: 'studentRecord', id: s.id,
              cells: [
                ui.two(s.name, s.family + ' family'),
                ui.two(
                  p.used + ' of ' + p.size + ' used · ' + (r.ends
                    ? 'the ' + ordinal(p.size) + ' class is the last one'
                    : 'renews on the ' + ordinal(p.size) + ' class'),
                  packHours(s)
                ),
                what,
                r.price ? esc(plain(r.price)) : ui.mute('—')
              ]
            };
          }),
          {
            emptyTitle: 'No pack runs out at the next class',
            emptyText: 'Every child has more than one session left, so nothing renews yet.'
          }
        )
      );

      var queued = queues();
      var free = 0;
      queued.forEach(function (q) { free += freePlaces(q.c); });

      var waitlists = ui.card(
        {
          title: 'Waiting for a place',
          head: ui.btn({ label: 'Open requests', kind: 'quiet', size: 'sm', to: 'requests' }),
          flush: true,
          note: free
            ? plural(free, 'place is', 'places are') + ' free in the classes with a queue, so the ' +
              'child at the head of that queue can be offered one from Requests.'
            : 'No class with a queue has a place free, so nobody can be offered one today. ' +
              'A place opens when somebody leaves, or when another hour is put on that day.'
        },
        ui.table(
          ['Class', 'Places', { label: 'Waiting', align: 'right' }, 'First in line', 'Joined'],
          queued.map(function (q) {
            var c = q.c, first = q.list[0];
            return {
              to: 'classRecord',
              id: c.id,
              cells: [
                ui.two(DAYS[c.day] + ' ' + startTime(c) + ' · ages ' + c.band, c.staff + ' · ' + c.room),
                ui.two(c.en + ' of ' + c.cap, placeNote(c)),
                esc(c.wl),
                ui.two(first.child, first.fam + ' family'),
                ui.mute(first.joined)
              ]
            };
          }),
          { emptyTitle: 'Nobody is waiting', emptyText: 'Every class with a queue has taken everyone on it.' }
        )
      );

      return h`
        ${raw(decisions)}
        <div class="section">${raw(ui.grid(2, [today, activity]))}</div>
        <div class="section">${raw(packs)}</div>
        <div class="section">${raw(waitlists)}</div>
      `;
    }
  });
})();
