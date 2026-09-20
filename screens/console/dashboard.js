/* Console → Dashboard. Sabrina's morning screen.

   Three questions, in this order: what needs a decision, what is on, what the
   desk has been doing. It declares its header as data and returns only a body
   built from Grove.ui components.

   Changes in this pass — the screen moved onto the studio's final pricing
   model, which is hours a month rather than a pack of sessions:

     - "Last class in the pack" is gone, and with it every word of the pack
       vocabulary: pack, sessions a month, "renews on the 8th class", sessions
       that never expire. It read D.pack(child), which is the old shape and now
       answers nothing, so the card had quietly emptied itself. In its place is
       "Cycles ending soon", which is the same slot answering the question the
       owner actually asks in the morning — whose invoice is about to be raised
     - a plan is HOURS A MONTH, at the studio's own rates, and it belongs to
       one child. A cycle is the set of dates that child's parent picked at
       registration, and the month's hours are spent by those dated classes. So
       every figure on the new card is read off D.plan(child): the hours, the
       price, the hours used so far, and the dates
     - the invoice is raised on the LAST class of the cycle and pays for the
       cycle after it, so the card names both — "5 August · their next class"
       against "covers 12, 19 and 26 August, then 2 September". The owner kept
       this by hand precisely so she could see what the money buys, so the
       dates are said out loud rather than summarised as a count
     - there is no billing date, no renewal day and no "next charge on the 1st"
       anywhere on this page. The date beside a child is their own class, taken
       from their own rows; the dates it covers are those same classes carried
       forward one cycle, a class at a time
     - the money rows say what the failed card is about to be asked for next.
       A card that has just been refused is the card the next invoice will go
       to, which is the reason to fix it this morning rather than at the end of
       the week. That sentence now names the date the cycle ends and the amount
       that follows it, both read off the family's own children
     - the header's "Take a payment" — a button that asked nothing and did
       nothing — is now "Post a sale", which is the one manual charge the
       studio bills every exception through: a class or two when a school
       finishes later than the programme, a private class that came up, an
       event. One action rather than a rule per exception
     - hours not booked are lost, and a plan ends with the school year. Both
       are stated once, in the card's own note and foot, and both are read from
       D.RULES and D.PLAN_YEAR so this screen cannot state a different rule
       from Billing, Settings or the family portal

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

   Reading the roll rather than the prose:
     - every headcount on this page is counted off a class roster. A session in
       On today shows the enrolment and the places its class record holds, not
       a figure travelling alongside the session. Camp extended care is the one
       session with no class behind it, so it keeps the numbers the day carries
     - every plan figure comes from D.plan(child) and every price from that
       plan, so an amount on this screen is the same amount the registration
       flow quotes, Cycles ahead forecasts and the ledger records
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

  function listOf(items) {
    if (items.length < 2) return items.join('');
    return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
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

  function foot(label, value) {
    return '<span class="cell-mute">' + esc(label) + '</span>' +
      '<span class="num strong">' + esc(value) + '</span>';
  }

  /* ---- dates --------------------------------------------------------------------
     A cycle is a set of dates, so this screen has to be able to say them out
     loud. Nothing here knows a date literal: every date comes out of the
     child's own rows in D.SESSIONS. */

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function toUTC(iso) {
    var p = String(iso).split('-');
    return new Date(Date.UTC(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10)));
  }

  function addWeeks(iso, weeks) {
    var t = toUTC(iso);
    t.setUTCDate(t.getUTCDate() + 7 * weeks);
    return t.getUTCFullYear() + '-' + pad(t.getUTCMonth() + 1) + '-' + pad(t.getUTCDate());
  }

  function dayOf(iso) { return toUTC(iso).getUTCDate(); }
  function monthOf(iso) { return MONTHS[toUTC(iso).getUTCMonth()]; }
  function fmtDate(iso) { return dayOf(iso) + ' ' + monthOf(iso); }

  /* "3, 10, 17 and 24 August", or "12, 19 and 26 August, then 2 September". */
  function listDates(list) {
    var groups = [], current = null;
    list.forEach(function (iso) {
      var m = monthOf(iso);
      if (!current || current.month !== m) {
        current = { month: m, days: [] };
        groups.push(current);
      }
      current.days.push(String(dayOf(iso)));
    });
    return groups.map(function (g) {
      return listOf(g.days) + ' ' + g.month;
    }).join(', then ');
  }

  /* ---- plans and cycles ----------------------------------------------------------
     A plan is HOURS A MONTH and it belongs to one child. The rate per hour
     falls as the plan grows, and the parent chooses how to split the hours, so
     a child on 16 hours taking two-hour classes comes eight times a month and
     one taking one-hour classes comes sixteen. A cycle is the set of dates
     they picked at registration, fixed for the programme year, and the month's
     hours are spent by those dated classes. Hours not booked are lost.

     Only After-School has a plan. Camp, no-school days, private classes,
     pop-ups and birthdays are one-off bookings with no cycle and nothing to
     renew, so a child on those alone never appears here. */

  function planOf(s) { return D.plan(s); }

  function familyNamed(name) {
    return D.FAMILIES.filter(function (f) { return f.name === name; })[0] || null;
  }
  function familyOf(s) { return familyNamed(s.family); }

  /* A family that has given notice. Their plan is not invoiced again; it ends
     when this cycle does. */
  function notRenewing(f) {
    if (!f) return false;
    return /not renewing/i.test(String(f.plan)) || f.status === 'Cancelling';
  }

  /* "Visa ···1183 · exp 04/29" → "Visa ···1183"; "None saved" stays itself. */
  function cardOf(f) { return f ? String(f.card).split(' · ')[0] : 'no card saved'; }

  /* The invoice is raised on the last class of the cycle. */
  function invoiceDate(s) {
    var on = planOf(s).renewsOn;
    return on ? on.date : null;
  }

  /* The cycle ends at this child's very next class, which is what makes the
     invoice this morning's business rather than next month's. */
  function endsAtNextClass(s) {
    return planOf(s).nextDates.length === 1;
  }

  /* The next cycle: every class in this one, carried forward by as many weeks
     as that class runs in a cycle. Same weekday, same time, the month after —
     which is the list of dates the invoice pays for. */
  function nextCycle(s) {
    var byClass = {}, order = [];
    planOf(s).dates.forEach(function (x) {
      if (!byClass[x.classId]) { byClass[x.classId] = []; order.push(x.classId); }
      byClass[x.classId].push(x.date);
    });
    var out = [];
    order.forEach(function (id) {
      var runs = byClass[id].length;
      byClass[id].forEach(function (iso) { out.push(addWeeks(iso, runs)); });
    });
    return out.sort();
  }

  function hoursText(s) {
    return plural(planOf(s).hours, 'hour a month', 'hours a month');
  }

  /* Whose cycle ends at their next class, soonest invoice first. */
  function cyclesEnding() {
    return D.STUDENTS.filter(function (s) {
      return planOf(s).isPlan && invoiceDate(s) && endsAtNextClass(s);
    }).map(function (s) {
      var f = familyOf(s);
      var p = planOf(s);
      var ends = notRenewing(f);
      return { s: s, f: f, p: p, on: invoiceDate(s), ends: ends, price: ends ? 0 : p.price };
    }).sort(function (a, b) {
      if (a.on !== b.on) return a.on < b.on ? -1 : 1;
      if (a.s.family !== b.s.family) return a.s.family < b.s.family ? -1 : 1;
      return a.s.name < b.s.name ? -1 : 1;
    });
  }

  /* The next invoice coming to a family: the child of theirs whose cycle ends
     soonest. Null when nobody in the family holds a plan — a family on camp
     weeks and one-off bookings has no cycle at all. */
  function nextInvoiceFor(famName) {
    var kids = D.STUDENTS.filter(function (s) {
      return s.family === famName && planOf(s).isPlan && invoiceDate(s);
    }).sort(function (a, b) {
      var da = invoiceDate(a), db = invoiceDate(b);
      return da === db ? 0 : (da < db ? -1 : 1);
    });
    if (!kids.length) return null;
    var s = kids[0];
    return { s: s, on: invoiceDate(s), price: planOf(s).price };
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

  /* '2:15–3:15pm' -> '2:15pm'; '10:00am–1:00pm' -> '10:00am'. */
  function startTime(c) {
    var parts = String(c.time).split('–');
    var a = String(parts[0] || '').toLowerCase();
    if (a.indexOf('am') !== -1 || a.indexOf('pm') !== -1) return a;
    var b = String(parts[1] || '').toLowerCase();
    return a + (b.indexOf('am') !== -1 ? 'am' : (b.indexOf('pm') !== -1 ? 'pm' : ''));
  }

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

      /* The same card is about to be asked for the next cycle, which is the
         reason to fix this one this morning. */
      var next = nextInvoiceFor(inv.fam);
      if (next && next.price && !notRenewing(familyNamed(inv.fam))) {
        stands = (stands ? stands + ' ' : '') + firstName(next.s.name) + '’s cycle ends on ' +
          fmtDate(next.on) + ', and that invoice — ' + plain(next.price) + ' — goes to the same card.';
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
      { label: 'Post a sale', kind: 'primary', to: 'postSale' }
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

      /* Cycles about to end. The invoice is raised on the last class of the
         cycle and pays for the dates that follow, so this is a queue of
         invoices with the dates each one buys written beside it. */
      var ending = cyclesEnding();
      var raising = ending.filter(function (r) { return !r.ends; });
      var leaving = ending.length - raising.length;
      var byHand = raising.filter(function (r) { return !(r.f && r.f.autopay); }).length;
      var dueNext = sum(raising, function (r) { return r.price; });

      var cycleNote = 'A plan is hours a month, spent by the dates the parent picked at ' +
        'registration. The invoice is raised on the last class of the cycle and pays for the ' +
        'dates listed beside it. ';
      if (raising.length) {
        cycleNote += plural(raising.length, 'invoice is', 'invoices are') +
          ' raised at these children’s next class. ';
      } else {
        cycleNote += 'Nothing is raised from these cycles. ';
      }
      if (byHand) {
        cycleNote += byHand + ' of ' + raising.length + ' ' + (byHand === 1 ? 'is' : 'are') +
          ' taken at the desk rather than on a card. ';
      }
      if (leaving) {
        cycleNote += plural(leaving, 'family has', 'families have') +
          ' given notice, so nothing is raised when that cycle ends. ';
      }
      cycleNote += D.RULES.unusedHours;

      var cycles = ui.card(
        {
          title: 'Cycles ending soon',
          head: ui.btn({ label: 'Open cycles', kind: 'quiet', size: 'sm', to: 'renewals' }),
          flush: true,
          note: cycleNote,
          foot: foot('Every plan runs to ' + D.PLAN_YEAR.ends + ' and ends there',
                     plain(dueNext) + ' at these classes')
        },
        ui.table(
          [
            'Child',
            'Plan and payment',
            'This cycle',
            'Invoice raised on',
            { label: 'Amount', align: 'right', shrink: true }
          ],
          ending.map(function (r) {
            var s = r.s, f = r.f, p = r.p;
            var how;

            if (r.ends) {
              how = ui.two(hoursText(s), 'Notice given · this cycle is the last one');
            } else if (f && f.balance > 0) {
              how = ui.two(hoursText(s), 'The family owes ' + Grove.money(f.balance) +
                ' · it is in the decisions above');
            } else if (f && f.autopay) {
              how = ui.two(hoursText(s), 'Charges ' + cardOf(f) + ' on the day');
            } else {
              how = ui.two(hoursText(s), 'Taken at the desk · autopay is off');
            }

            return {
              to: 'studentRecord', id: s.id,
              cells: [
                ui.two(s.name, s.family + ' family'),
                how,
                h`<div class="stack stack--sm">
                  <div>${raw(ui.pill(p.usedHours + ' of ' + p.hours + ' hours used'))}</div>
                  ${raw(ui.meter(p.usedHours, p.hours))}
                </div>`,
                ui.two(fmtDate(r.on) + ' · their next class', 'covers ' + listDates(nextCycle(s))),
                r.price ? esc(plain(r.price)) : ui.mute('—')
              ]
            };
          }),
          {
            emptyTitle: 'No cycle ends at the next class',
            emptyText: 'Every plan has more than one class left before its invoice is raised.'
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
        <div class="section">${raw(cycles)}</div>
        <div class="section">${raw(waitlists)}</div>
      `;
    }
  });
})();
