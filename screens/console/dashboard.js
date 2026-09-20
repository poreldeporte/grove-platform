/* Console → Dashboard. Sabrina's morning screen.

   Three questions, in this order: what needs a decision, what is on, what the
   desk has been doing. It declares its header as data and returns only a body
   built from Grove.ui components.

   Changes in the owner-fit pass:
     - the screen is a decision list first. Everything waiting on her was
       spread across two notices, a rail badge and three screens she had to go
       and open: four unpaid invoices, two make-up exceptions, two supply
       orders and one over-full class. They are one dense table at the top of
       the page, biggest money first, and every row carries the button that
       ends it. She is at a desk with a keyboard, and nine rows of table are
       faster for her than nine cards
     - the six-figure stat strip is cut. A statbar cannot be clicked, so it was
       six numbers with nothing to do about any of them, and three of them —
       revenue this month, average attendance, how many sit on a waitlist —
       were nothing she could act on this morning at all. Every fact it carried
       is still in the product and nearer its action: the outstanding money is
       the money rows and their amounts; sessions today and the 53 children
       expected are the note under On today; the waitlist total is the waitlist
       table; revenue, enrollment and attendance belong to Reports, which is
       where she goes when the question is how the month is doing rather than
       what to do next
     - both notices went with it. "4 invoices are unpaid → Resolve" and "the
       Thursday class is over capacity → Rebalance" were headlines over a page
       that then let her resolve and rebalance nothing. Both are rows in the
       decision table now, with the real action on them
     - three invoice statuses, one question. Failed, Past due and Awaiting
       payment stay on the row as facts, but they only ever split two ways:
       there is a card to charge, or there is not. The button is "Charge $45",
       or — for the Delgado family, who have no card and have written to say
       they have a new one — "Open their message"
     - a make-up that asks nothing is no longer asked. A request confirms
       itself when the hour the family picked has a free place and the child's
       age band matches, which is the rule the Requests screen applies; only
       the exceptions reach this table, each carrying the check that failed and
       the numbers behind it. Today that is Sophia Martinez, whose Wednesday
       hour is full at 12 of 12, and Zara Okafor's credit, which has nowhere
       left to go before it runs out on 31 Jul
     - header actions went from three to one. "Add family" opened the family
       list, which is a button that asks nothing, and "New program" is already
       the primary action of the Programs screen, where it belongs

   No sticky action bar, deliberately. This screen dispatches nine separate
   decisions rather than completing one, and there is no honest bulk button for
   them: a single "charge every card" would sweep up a card that has already
   been refused twice, and a single "approve every make-up" would put a
   thirteenth child in a room set for twelve. The work is the first thing on
   the page instead, above everything else, and each row states its own
   consequence beside its own button. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  var DAYS = {
    Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday',
    Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday'
  };
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  function plain(n) { return Grove.money(n, { cents: false }); }

  function sum(list, of) {
    var total = 0;
    list.forEach(function (x) { total += of(x); });
    return total;
  }

  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  function firstName(name) { return String(name).split(' ')[0]; }

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

  /* ---- dates ------------------------------------------------------------------
     The dataset states its own today, so every "n days" on this screen is
     measured from it rather than typed in. */

  function todayDate() {
    var m = /(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/.exec(String(D.today));
    if (!m) return null;
    var mo = MONTHS.indexOf(m[2].slice(0, 3));
    if (mo === -1) return null;
    return new Date(parseInt(m[3], 10), mo, parseInt(m[1], 10));
  }

  /* '31 Jul' → whole days from today. Negative means it has already passed. */
  function dayCount(text) {
    var t = todayDate();
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

  /* ---- matching the free-text records back to the dataset ----------------------
     Several records name their subject in prose rather than by key. Every match
     below is the one the screen that owns that record already makes, so the
     dashboard cannot state a different figure from Classes, Requests, Billing
     or Inventory. Each one is a foreign key in waiting. */

  /* '2:15–3:15pm' -> '2:15pm'; '10:00am–1:00pm' -> '10:00am'. */
  function startTime(c) {
    var parts = String(c.time).split('–');
    var a = String(parts[0] || '').toLowerCase();
    if (a.indexOf('am') !== -1 || a.indexOf('pm') !== -1) return a;
    var b = String(parts[1] || '').toLowerCase();
    return a + (b.indexOf('am') !== -1 ? 'am' : (b.indexOf('pm') !== -1 ? 'pm' : ''));
  }

  function hourOf(c) { return c.day + ' ' + startTime(c); }
  function freePlaces(c) { return c ? Math.max(0, c.cap - c.en) : 0; }

  /* 'Mon–Fri' is five days, not two. */
  function classDays(c) {
    var text = String(c.day);
    var r = /([A-Za-z]{3})\s*[–-]\s*([A-Za-z]{3})/.exec(text);
    if (r) {
      var a = WEEK.indexOf(r[1]), b = WEEK.indexOf(r[2]);
      if (a !== -1 && b !== -1 && b >= a) return WEEK.slice(a, b + 1);
    }
    return text.split(/[^A-Za-z]+/).filter(function (d) { return d; });
  }

  function mentionsDay(text, c) {
    var hit = false;
    classDays(c).forEach(function (d) {
      if (text.indexOf(d.toLowerCase()) !== -1) hit = true;
    });
    return hit;
  }

  /* A waitlist entry names its class as 'Mon 3:15pm · Ages 8–11'. Day plus
     either the start time or the age band, the way Classes and Requests do it.
     Nobody waits on a camp week, so those are skipped. */
  function queueClass(label) {
    var text = String(label).toLowerCase();
    var hit = null;
    D.CLASSES.forEach(function (c) {
      if (hit) return;
      if (/week \d/.test(String(c.name).toLowerCase())) return;
      if (!mentionsDay(text, c)) return;
      if (text.indexOf(startTime(c)) !== -1 ||
          text.indexOf('ages ' + String(c.band).toLowerCase()) !== -1) hit = c;
    });
    return hit;
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
    var f = D.FAMILIES.filter(function (x) { return x.name === name; })[0];
    return f ? f.id : undefined;
  }
  function threadFor(name) {
    return D.THREADS.filter(function (t) { return t.fam === name; })[0] || null;
  }
  function studentNamed(name) {
    return D.STUDENTS.filter(function (s) { return s.name === name; })[0] || null;
  }

  /* ---- the make-up rule --------------------------------------------------------
     A request confirms itself when the hour the family asked for has a free
     place and the child's age band matches it. Those two checks were the whole
     of the approval, so a request that passes both is asking her nothing and
     never reaches this page. What is left is a genuine exception, and it
     arrives carrying the check that failed. This is the Requests screen's rule,
     applied to the same rows, so the two screens name the same exceptions. */

  function isRequest(m) { return /^Requested\s+/.test(String(m.reason)); }
  function askedFor(m) { return String(m.reason).replace(/^Requested\s+/, ''); }
  function bandOf(m) {
    var s = studentNamed(m.child);
    return s ? String(s.band) : '';
  }

  /* The hour named in 'Requested Fri 31 Jul, 10:00am'. Where two classes share
     an hour, the one in the child's age band wins, so a mismatch can still be
     reported rather than quietly matched away. */
  function askedClass(m) {
    var text = askedFor(m).toLowerCase();
    if (!text) return null;
    var band = bandOf(m).toLowerCase();
    var any = null, onBand = null;
    D.CLASSES.forEach(function (c) {
      if (!mentionsDay(text, c)) return;
      if (text.indexOf(startTime(c)) === -1) return;
      if (!any) any = c;
      if (!onBand && String(c.band).toLowerCase() === band) onBand = c;
    });
    return onBand || any;
  }

  /* Why a credit has nowhere to go, read off the timetable rather than copied
     out of the sentence the dataset carries. */
  function nowhereWhy(m) {
    var band = bandOf(m);
    var list = band ? D.CLASSES.filter(function (c) {
      return c.prog === 'as' && String(c.band) === band;
    }) : [];
    if (!list.length) return String(m.booked);
    return 'every ages ' + band + ' hour is full — ' + list.map(function (c) {
      return hourOf(c) + ' ' + c.en + ' of ' + c.cap;
    }).join(', ');
  }

  /* null when the credit is asking her nothing. */
  function makeupProblem(m) {
    var left = dayCount(m.expires);
    var expired = left !== null && left < 0;

    if (isRequest(m)) {
      if (expired) {
        return { code: 'expired', head: 'Credit expired', why: 'the credit ran out on ' + m.expires };
      }
      var c = askedClass(m);
      if (!c) {
        return { code: 'nohour', head: 'No such hour',
                 why: 'nothing on the timetable runs at ' + askedFor(m) };
      }
      var band = bandOf(m);
      if (band && String(c.band) !== band) {
        return { code: 'band', head: 'Wrong age band', cls: c,
                 why: hourOf(c) + ' is ages ' + c.band + ', not ' + band };
      }
      if (freePlaces(c) < 1) {
        return { code: 'full', head: 'Class full', cls: c,
                 why: hourOf(c) + ' is full at ' + c.en + ' of ' + c.cap };
      }
      return null;
    }

    if (m.status === 'Booked') return null;
    if (expired) {
      return { code: 'expired', head: 'Credit expired', why: 'the credit ran out on ' + m.expires };
    }
    if (m.status === 'Expiring') {
      return { code: 'nowhere', head: 'Nowhere to place it', why: nowhereWhy(m) };
    }
    return null;
  }

  function makeupExceptions() {
    return D.MAKEUPS.filter(function (m) { return makeupProblem(m) !== null; });
  }
  function placedThemselves() {
    return D.MAKEUPS.filter(function (m) { return isRequest(m) && makeupProblem(m) === null; });
  }

  /* ---- the rest of what is waiting on her -------------------------------------- */

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

  /* ---- the rows ----------------------------------------------------------------
     One shape for all four kinds: a tag, who or what it is about, where it
     stands, the money if there is any, and the button that ends it. Every
     button that moves money or fills a room says what it will do. */

  function moneyRow(inv) {
    var button;
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
    }

    return {
      to: 'familyRecord', id: famIdFor(inv.fam),
      cells: [
        ui.pill('Money', 'bad'),
        ui.two(inv.fam + ' family', inv.id + ' · due ' + lower(inv.due)),
        ui.two(inv.method + ' · ' + String(inv.status).toLowerCase(), inv.note),
        owedAmount(inv.amt),
        button
      ]
    };
  }

  /* The exception buttons are the Requests screen's, word for word, so the same
     decision reads the same in both places. */
  function makeupButtons(m, p) {
    if (p.code === 'nowhere') {
      /* Doing nothing lets it expire, so there is no button for doing nothing. */
      return ui.btn({
        label: 'Open a slot',
        kind: 'primary',
        size: 'sm',
        msg: 'Extra make-up hour opened · ' + firstName(m.child) + ' can be booked before ' + m.expires
      });
    }
    if (p.code === 'expired') {
      return pair(
        { label: 'Let it go', size: 'sm', msg: 'Credit closed · ' + m.child + ' keeps nothing' },
        { label: 'Extend', kind: 'primary', size: 'sm', msg: 'Credit extended · ' + m.child + ' can book again' }
      );
    }
    if (p.code === 'nohour') {
      return pair(
        { label: 'Decline', size: 'sm', msg: 'Declined · ' + m.child + ' keeps the credit until ' + m.expires },
        { label: 'Message', size: 'sm', to: 'newMessage' }
      );
    }
    return pair(
      { label: 'Decline', size: 'sm', msg: 'Declined · ' + m.child + ' keeps the credit until ' + m.expires },
      {
        label: 'Add anyway',
        kind: 'primary',
        size: 'sm',
        msg: p.code === 'full'
          ? m.child + ' added · ' + hourOf(p.cls) + ' now holds ' + (p.cls.en + 1) +
            ' in a room set for ' + p.cls.cap
          : m.child + ' added · ages ' + bandOf(m) + ' in an ages ' + p.cls.band + ' hour'
      }
    );
  }

  function makeupRow(m) {
    var p = makeupProblem(m);
    var s = studentNamed(m.child);
    var asked = isRequest(m) ? 'Asked for ' + askedFor(m) : p.head;

    return {
      to: 'makeupRequest', id: m.id,
      cells: [
        ui.pill('Make-up', 'warn'),
        ui.two(m.child, s ? s.family + ' family' : ''),
        ui.two(asked, p.why + ' · expires ' + m.expires + ', ' + inDays(dayCount(m.expires))),
        ui.mute('—'),
        makeupButtons(m, p)
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
    var waiting = D.WAITLIST.filter(function (w) { return queueClass(w.cls) === c; }).length;
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
      .concat(makeupExceptions().map(makeupRow))
      .concat(pendingSupplies().map(supplyRow))
      .concat(overCapacity().map(capacityRow));
  }

  /* ---- queues ------------------------------------------------------------------ */

  function queues() {
    var order = [], byClass = {};
    D.WAITLIST.forEach(function (w) {
      if (!byClass[w.cls]) { byClass[w.cls] = []; order.push(w.cls); }
      byClass[w.cls].push(w);
    });
    return order.map(function (cls) {
      var list = byClass[cls].slice().sort(function (a, b) { return a.pos - b.pos; });
      return { cls: cls, list: list, c: queueClass(cls) };
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
      var auto = placedThemselves();

      var note = 'Charging a card takes the money today and emails a receipt; a card that fails ' +
        'is not tried again on its own. Adding a child to a class that is full puts them in a ' +
        'room set for fewer. Approving an order adds it to the next order to the supplier.';
      if (auto.length) {
        note += ' ' + plural(auto.length, 'make-up placed itself', 'make-ups placed themselves') +
          ' this morning — the hour had a place and the age band matched — so ' +
          (auto.length === 1 ? 'it is' : 'they are') + ' not listed here.';
      }

      var decisions = ui.card(
        {
          title: 'Needs a decision',
          head: ui.mute(plural(rows.length, 'thing is', 'things are') + ' waiting on you'),
          flush: true,
          note: note
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
            emptyText: 'Every invoice is settled, every request answered and every class within its places.'
          }
        )
      );

      var today = ui.card(
        {
          title: 'On today',
          head: ui.btn({ label: 'Open classes', kind: 'quiet', size: 'sm', to: 'classes' }),
          flush: true,
          note: plural(sum(D.TODAY, function (s) { return s.en; }), 'child', 'children') +
            ' expected across ' + plural(D.TODAY.length, 'session', 'sessions') + '.'
        },
        ui.rows(D.TODAY.map(function (s) {
          var c = sessionClass(s);
          var full = s.en >= s.cap;
          return {
            lead: esc(s.time),
            title: ui.dot(D.program(s.prog).color) + ' ' + esc(s.title),
            sub: c ? esc(c.staff) : '',
            end: '<span class="num ' + (full ? 'clay' : 'grove') + '">' + s.en + '/' + s.cap + '</span>',
            to: c ? 'classRecord' : 'classes',
            id: c ? c.id : undefined
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
            var first = q.list[0];
            return {
              to: q.c ? 'classRecord' : 'requests',
              id: q.c ? q.c.id : undefined,
              cells: [
                ui.two(q.cls, q.c ? q.c.staff + ' · ' + q.c.room : 'No class on the timetable'),
                q.c ? ui.two(q.c.en + ' of ' + q.c.cap, placeNote(q.c)) : ui.mute('—'),
                esc(q.list.length),
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
        <div class="section">${raw(waitlists)}</div>
      `;
    }
  });
})();
