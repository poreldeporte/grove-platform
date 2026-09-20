/* Console → Requests (Waitlist · Make-ups · Supplies) and one make-up request.

   Written for Sabrina, who owns the studio, teaches two classes and orders the
   clay. Density is right for her — a queue belongs in a table — so what this
   pass removes is ceremony, not information.

   THE BIG ONE: a make-up now confirms itself.
     The screen was already performing both checks a person was making by hand:
     does the hour the family asked for have a free place, and does the child's
     age band match it. When both pass, nothing is being decided, so the request
     is placed and the row simply says so. Only genuine exceptions — the class
     is full, the wrong age band, the credit has run out, nothing runs at that
     hour, no eligible class has space — come to her, and each one states which
     check failed with the numbers behind it. On today's data that turns two
     approval prompts into one automatic placement (Mia Chen, Fri 31 Jul,
     10:00am, Studio 1 had 18 of 20) and one real exception (Sophia Martinez
     asked for Wed 3:15pm, which is full at 12 of 12).

   Also cut:
     - the status vocabulary went from four words to three. "Awaiting approval",
       "Available", "Booked" and "Expiring" were four states she acted on two
       ways. It is now Needs you · Confirmed · Open, and the reason a row needs
       her is written out beside it rather than compressed into a pill
     - "Open extra make-up slot" sat in the page header on every make-up row,
       although it belongs to exactly one credit — the one with nowhere to go.
       It is now a button on that credit
     - Supplies had two mechanisms for one decision: per-row Approve and a
       header "Approve all pending". There is now one sticky bar that approves
       the pending requests and prices them, and a per-row Decline for the
       exception
     - the "What these requests do to the shelf" card repeated the supply table
       row for row. The stock each request draws on is now a column in that
       table, so there is one list, not two
     - "Average wait · 9 days" and "On a waitlist · 6" are gone. One she could
       do nothing about; the other was already the tab count and the result
       count. Each row carries its own wait instead, which tells her who has
       been waiting longest
     - "Credits open · 8 across 6 children" likewise: a number with no action
       behind it. The strip now holds the decisions, the automatic placements
       and the credits about to run out
     - the Places column repeated the same class occupancy down six rows. It
       sits under the class name now, where it belongs to the class
     - "Transferable — no" and "Converts to money — no" were printed on every
       single credit. They are studio policy, not properties of a record, so
       they are stated once as a note
     - the make-up detail screen no longer carries its decision in the page
       header. The whole screen exists to make one decision, so the decision is
       in a sticky bar with a line beside it saying what it will do

   Every figure here is read off Grove.data and derived from the rows on show:
   both stat strips, the result counts, each "n days left", the pending order
   value, the free places, and the sentence explaining why a credit cannot be
   placed.

   Noted for the rebuild: Supplies is a staff purchasing queue sitting in a
   screen otherwise made of family queues. It belongs under Inventory beside
   the stock it moves. It is left here because Inventory links into this tab
   twice and this pass does not edit other files. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  var TAB_KEY = 'requests';
  var WAITLIST_TAB = 'Waitlist';
  var MAKEUP_TAB = 'Make-ups';
  var SUPPLY_TAB = 'Supplies';

  /* Three standings, because she does three things: decide, read, or leave
     alone. The reason a credit needs her is written beside it, not encoded
     in a fourth and fifth pill. */
  var NEEDS = 'needs', CONFIRMED = 'confirmed', OPEN = 'open';

  var STANDING = {
    needs: { label: 'Needs you', kind: 'warn' },
    confirmed: { label: 'Confirmed', kind: 'ok' },
    open: { label: 'Open', kind: null }
  };

  var SUBS = {
    Waitlist: 'Nobody is turned away. When a class fills, families join a queue and are offered openings in position order.',
    'Make-ups': 'A make-up credit is counted in classes, never in money. A request confirms itself when the hour has a free place and the age band matches; only the exceptions come to you.',
    Supplies: 'What instructors have asked the office to buy or restock, and how each one stands against the stock on hand.'
  };

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
  function names(list) {
    return list.map(function (m) { return m.child; }).join(', ');
  }

  /* ---- matching the free-text records to the dataset --------------------------
     The waitlist, the make-up requests and the supply requests all name their
     subject in free text. They are matched back to CLASSES and INVENTORY here
     so that no figure on this screen can drift from the record it describes. */

  function startTime(c) {
    var parts = String(c.time).split('–');
    var a = String(parts[0] || '').toLowerCase();
    if (a.indexOf('am') !== -1 || a.indexOf('pm') !== -1) return a;
    var b = String(parts[1] || '').toLowerCase();
    return a + (b.indexOf('am') !== -1 ? 'am' : (b.indexOf('pm') !== -1 ? 'pm' : ''));
  }

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

  /* Day plus either the start time or the age band, the way Classes does it.
     Nobody waits on a camp week, so those are skipped. */
  function queueClass(w) {
    var text = String(w.cls).toLowerCase();
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

  function freePlaces(c) { return c ? Math.max(0, c.cap - c.en) : 0; }

  function placeNote(c) {
    var held = c.en + ' of ' + c.cap;
    if (c.en > c.cap) return held + ' · over by ' + (c.en - c.cap);
    if (c.en === c.cap) return held + ' · full';
    var free = c.cap - c.en;
    return held + ' · ' + (free === 1 ? '1 place free' : free + ' places free');
  }

  function hourOf(c) { return c.day + ' ' + startTime(c); }

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

  function childOf(name) {
    return D.STUDENTS.filter(function (s) { return s.name === name; })[0] || null;
  }

  function bandOf(m) {
    var s = childOf(m.child);
    return s ? String(s.band) : '';
  }

  /* ---- the rule ---------------------------------------------------------------
     A make-up confirms itself when the hour the family asked for has a free
     place and the child's age band matches it. Those two checks were the whole
     of the approval, and the screen was already doing both to draw the row.
     What is left over is a genuine exception and comes to the owner, carrying
     the check that failed. */

  function isRequest(m) { return /^Requested\s+/.test(String(m.reason)); }
  function askedFor(m) { return String(m.reason).replace(/^Requested\s+/, ''); }
  function missReason(m) { return isRequest(m) ? '' : String(m.reason); }

  /* The hour named in "Requested Fri 31 Jul, 10:00am", matched to a class the
     same way the queue is matched. Where two classes share an hour, the one in
     the child's age band wins, so a mismatch can still be reported. */
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

  /* Every weekly hour the child's own age band can be placed into. */
  function bandClasses(m) {
    var band = bandOf(m);
    if (!band) return [];
    return D.CLASSES.filter(function (c) {
      return c.prog === 'as' && String(c.band) === band;
    });
  }

  /* Why a credit has nowhere to go, read off the timetable rather than copied
     out of the sentence the dataset carries. */
  function nowhereWhy(m) {
    var list = bandClasses(m);
    if (!list.length) return String(m.booked);
    return 'every ages ' + bandOf(m) + ' hour is full — ' + list.map(function (c) {
      return hourOf(c) + ' ' + c.en + ' of ' + c.cap;
    }).join(', ');
  }

  function verdict(m) {
    var left = dayCount(m.expires);
    var band = bandOf(m);

    if (isRequest(m)) {
      if (left !== null && left < 0) {
        return { state: NEEDS, code: 'expired', head: 'Credit expired',
                 why: 'the credit ran out on ' + m.expires };
      }
      var c = askedClass(m);
      if (!c) {
        return { state: NEEDS, code: 'nohour', head: 'No such hour',
                 why: 'nothing on the timetable runs at ' + askedFor(m) };
      }
      if (band && String(c.band) !== band) {
        return { state: NEEDS, code: 'band', head: 'Wrong age band', cls: c,
                 why: hourOf(c) + ' is ages ' + c.band + ', not ' + band };
      }
      if (freePlaces(c) < 1) {
        return { state: NEEDS, code: 'full', head: 'Class full', cls: c,
                 why: hourOf(c) + ' is full at ' + c.en + ' of ' + c.cap };
      }
      return { state: CONFIRMED, code: 'auto', cls: c, auto: true,
               why: 'a place was free and the age band matched' };
    }

    if (m.status === 'Booked') return { state: CONFIRMED, code: 'booked' };
    if (left !== null && left < 0) {
      return { state: NEEDS, code: 'expired', head: 'Credit expired',
               why: 'the credit ran out on ' + m.expires };
    }
    if (m.status === 'Expiring') {
      return { state: NEEDS, code: 'nowhere', head: 'Nowhere to place it', why: nowhereWhy(m) };
    }
    return { state: OPEN, code: 'open' };
  }

  function isState(list, state) {
    return list.filter(function (m) { return verdict(m).state === state; });
  }
  function autoPlaced(list) {
    return list.filter(function (m) { return verdict(m).auto; });
  }

  /* ---- small counts off the dataset -------------------------------------------- */

  function pendingSupplies(list) {
    return (list || D.SUPPLY_REQUESTS).filter(function (r) { return r.status === 'Pending'; });
  }

  /* The nearest expiry among the credits on show, with how many share it and
     how many of those still have nowhere to be. */
  function soonestExpiry(list) {
    var best = null;
    list.forEach(function (m) {
      var n = dayCount(m.expires);
      if (n === null) return;
      if (!best || n < best.days) best = { when: m.expires, days: n, all: [] };
    });
    if (!best) return null;
    best.all = list.filter(function (m) { return m.expires === best.when; });
    best.unbooked = best.all.filter(function (m) { return verdict(m).state !== CONFIRMED; }).length;
    return best;
  }

  function queueClasses(list) {
    var seen = [];
    list.forEach(function (w) { if (seen.indexOf(w.cls) === -1) seen.push(w.cls); });
    return seen;
  }

  function longestQueue(list) {
    var counts = {}, best = null;
    list.forEach(function (w) {
      counts[w.cls] = (counts[w.cls] || 0) + 1;
      if (!best || counts[w.cls] > counts[best]) best = w.cls;
    });
    return best ? { cls: best, n: counts[best] } : null;
  }

  /* A tab count is how many rows that tab shows, so it always agrees with the
     "n of m" on the same row. What needs her is on the strip underneath. */
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

    /* One header action, and only when there is genuinely a place to offer.
       The old fallback — "Email everyone waiting" — existed to keep the slot
       filled. Make-ups and Supplies carry their decisions on the rows and in
       the sticky bar, where the consequence sits next to the button. */
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
      var current = tab();
      if (current === MAKEUP_TAB) return makeupTab();
      if (current === SUPPLY_TAB) return supplyTab();
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
        return { cells: cells };
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
        sub: long ? 'children waiting for ' + long.cls : 'nobody is waiting'
      }
    ]);

    var toolbar = ui.toolbar({
      tabs: requestTabs(),
      search: { key: 'waitlist', placeholder: 'Search child or family…' },
      count: rows.length + ' of ' + D.WAITLIST.length + ' entries'
    });

    var note = canOffer
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
      note: note
    }, table);
  }

  /* ---- make-ups -------------------------------------------------------------- */

  function placementCell(m, v) {
    if (v.code === 'auto') {
      return ui.two(askedFor(m) + ' · ' + v.cls.room,
        'Confirmed on its own — ' + v.why);
    }
    if (v.code === 'booked') {
      return ui.two(m.booked, 'Held for the family until the session is attended');
    }
    if (v.state === NEEDS) {
      var asked = isRequest(m) ? 'Asked for ' + askedFor(m) : v.head;
      return ui.two(asked, v.why + ' · expires ' + m.expires + ', ' + inDays(dayCount(m.expires)));
    }
    return ui.two('Not yet booked', 'Expires ' + m.expires + ' · ' + inDays(dayCount(m.expires)));
  }

  /* Every exception button says what it will do to a register or to a credit,
     because there is nobody behind her to undo it. */
  function exceptionButtons(m, v) {
    if (v.code === 'nowhere') {
      /* Doing nothing lets it expire, so there is no button for doing nothing. */
      return ui.btn({
        label: 'Open a slot',
        kind: 'primary',
        size: 'sm',
        msg: 'Extra make-up hour opened · ' + firstName(m.child) + ' can be booked before ' + m.expires
      });
    }
    if (v.code === 'expired') {
      return ui.btns([
        { label: 'Let it go', size: 'sm', msg: 'Credit closed · ' + m.child + ' keeps nothing' },
        { label: 'Extend', kind: 'primary', size: 'sm', msg: 'Credit extended · ' + m.child + ' can book again' }
      ]);
    }
    if (v.code === 'nohour') {
      return ui.btns([
        { label: 'Decline', size: 'sm', msg: 'Declined · ' + m.child + ' keeps the credit until ' + m.expires },
        { label: 'Message', size: 'sm', to: 'newMessage' }
      ]);
    }
    var over = v.cls ? (v.cls.en + 1) : 0;
    return ui.btns([
      { label: 'Decline', size: 'sm', msg: 'Declined · ' + m.child + ' keeps the credit until ' + m.expires },
      {
        label: 'Add anyway',
        kind: 'primary',
        size: 'sm',
        msg: v.code === 'full'
          ? m.child + ' added · ' + hourOf(v.cls) + ' now holds ' + over + ' in a room set for ' + v.cls.cap
          : m.child + ' added · ages ' + bandOf(m) + ' in an ages ' + v.cls.band + ' hour'
      }
    ]);
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
        { label: 'Standing', shrink: true },
        'Placement',
        { label: '' }
      ],
      rows.map(function (m) {
        var v = verdict(m);
        var s = childOf(m.child);
        var st = STANDING[v.state];
        return {
          to: 'makeupRequest', id: m.id,
          cells: [
            ui.two(m.child, s ? s.family + ' family' : ''),
            ui.two(m.missed, missReason(m)),
            ui.pill(st.label, st.kind),
            placementCell(m, v),
            v.state === NEEDS ? exceptionButtons(m, v) : ''
          ]
        };
      }),
      { emptyTitle: 'No credits match', emptyText: 'Clear the search to see every credit.' }
    );

    /* Read off the rows on screen, so the strip cannot describe a credit the
       search has hidden. */
    var needs = isState(rows, NEEDS);
    var auto = autoPlaced(rows);
    var soon = soonestExpiry(rows);

    var stats = ui.statbar([
      {
        label: 'Needs a decision',
        value: String(needs.length),
        sub: needs.length ? 'exceptions only' : 'nothing is waiting on you',
        tone: needs.length ? 'plum' : null
      },
      {
        label: 'Confirmed on their own',
        value: String(auto.length),
        sub: 'free place · age band matched',
        tone: auto.length ? 'grove' : null
      },
      {
        label: soon ? 'Expire on ' + soon.when : 'Expiring',
        value: soon ? String(soon.all.length) : '0',
        sub: soon
          ? soon.unbooked + ' not yet booked · ' + inDays(soon.days)
          : 'nothing is expiring',
        tone: soon && soon.unbooked ? 'clay' : null
      }
    ]);

    var toolbar = ui.toolbar({
      tabs: requestTabs(),
      search: { key: 'makeups', placeholder: 'Search child…' },
      count: rows.length + ' of ' + D.MAKEUPS.length + ' credits'
    });

    var rule = 'A request confirms itself when the hour the family asked for has a free place ' +
      'and the age band matches. ';
    var note;
    if (auto.length) {
      note = rule + 'That placed ' + names(auto) + ' today, without you. A row marked ' +
        '“Needs you” is one where a check failed.';
    } else if (needs.length) {
      note = rule + 'Nothing on show placed itself, so the rows marked “Needs you” are where ' +
        'a check failed.';
    } else {
      note = rule + 'Nothing on show is waiting on a decision.';
    }

    return toolbar + stats + ui.card({ flush: true, note: note }, table);
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
        sub: 'of ' + plural(rows.length, 'request', 'requests'),
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
      count: rows.length + ' of ' + D.SUPPLY_REQUESTS.length + ' requests'
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

  /* ---- one make-up request ------------------------------------------------------
     One decision per visit, so the decision is in a sticky bar with a line
     beside it saying exactly what it will do. The page header carries nothing
     that could be mistaken for it. */

  Grove.screen('makeupRequest', {
    surface: 'console',
    crumbs: [{ label: 'Requests', to: 'requests' }],
    crumbTitle: 'Make-up request',

    eyebrow: function (ctx) {
      var v = verdict(mk(ctx));
      if (v.state === NEEDS) return 'needs a decision';
      if (v.code === 'auto') return 'confirmed on its own';
      if (v.code === 'booked') return 'booked';
      return 'make-up credit';
    },

    title: function (ctx) { return mk(ctx).child; },

    sub: function (ctx) {
      var m = mk(ctx);
      var v = verdict(m);
      var missed = 'Missed ' + m.missed + '. ';
      if (v.state === NEEDS) {
        return missed + 'This one stopped here because ' + v.why + '.';
      }
      if (v.code === 'auto') {
        return missed + 'Placed into ' + askedFor(m) + ' without you: ' + v.why + '.';
      }
      if (v.code === 'booked') {
        return missed + 'Booked into ' + m.booked + '.';
      }
      return missed + 'The credit expires ' + m.expires + ', ' + inDays(dayCount(m.expires)) +
        '. The family can book it from their own portal.';
    },

    /* Nothing in the header. The one decision lives in the bar at the foot. */
    actions: function (ctx) {
      var v = verdict(mk(ctx));
      return v.code === 'booked' ? [{ label: 'Message the family', to: 'newMessage' }] : [];
    },

    body: function (ctx) {
      var m = mk(ctx);
      var v = verdict(m);
      var top;

      if (v.state === NEEDS) top = ui.grid(3, exceptionCards(m, v));
      else if (v.code === 'auto') top = ui.grid(2, autoCards(m, v));
      else top = ui.grid(2, creditCards(m, v));

      return h`
        ${raw(top)}
        <div class="section">${raw(context(m))}</div>
        ${raw(decisionBar(m, v))}
      `;
    }
  });

  function mk(ctx) {
    var id = ctx.params.id;
    return D.MAKEUPS.filter(function (m) { return m.id === id; })[0] || D.MAKEUPS[0];
  }

  function expiryValue(m) {
    return esc(m.expires + ' · ' + inDays(dayCount(m.expires)));
  }

  /* ---- the exception -------------------------------------------------------- */

  function whyRows(m, v) {
    var c = v.cls;
    if (v.code === 'full') {
      return [
        ['The hour', esc(hourOf(c) + ' · ' + c.room)],
        { k: 'Places', v: esc(c.en + ' of ' + c.cap + ' — full'), tone: 'clay' },
        ['Age band', esc('ages ' + c.band + ' · matches')],
        ['Instructor', esc(c.staff)]
      ];
    }
    if (v.code === 'band') {
      return [
        ['The hour', esc(hourOf(c) + ' · ' + c.room)],
        { k: 'Age band', v: esc('ages ' + c.band + ', and ' + firstName(m.child) + ' is ages ' + bandOf(m)), tone: 'clay' },
        ['Places', esc(placeNote(c))]
      ];
    }
    if (v.code === 'nowhere') {
      var list = bandClasses(m);
      var out = list.map(function (x) {
        return { k: hourOf(x), v: esc(placeNote(x)), tone: freePlaces(x) ? null : 'clay' };
      });
      out.push(['Cycle ends', expiryValue(m)]);
      return out;
    }
    if (v.code === 'expired') {
      return [
        { k: 'Ran out', v: esc(m.expires), tone: 'clay' },
        ['Asked for', esc(askedFor(m) || 'nothing yet')]
      ];
    }
    return [
      { k: 'Asked for', v: esc(askedFor(m)), tone: 'clay' },
      ['Timetable', 'Nothing runs at that hour']
    ];
  }

  function consequenceRows(m, v) {
    var c = v.cls;
    if (v.code === 'full') {
      return [
        { k: 'Roster', v: esc(hourOf(c) + ' goes to ' + (c.en + 1) + ' children'), tone: 'clay' },
        ['Room', esc(c.room + ' is set for ' + c.cap)],
        ['Instructor', esc(c.staff + ' is not asked first')],
        ['Credit', 'Marked used'],
        ['Family', 'Emailed a confirmation']
      ];
    }
    if (v.code === 'band') {
      return [
        { k: 'Age band', v: esc('an ages ' + bandOf(m) + ' child joins an ages ' + c.band + ' hour'), tone: 'clay' },
        ['Roster', esc(hourOf(c) + ' goes to ' + (c.en + 1) + ' children')],
        ['Credit', 'Marked used'],
        ['Family', 'Emailed a confirmation']
      ];
    }
    if (v.code === 'nowhere') {
      return [
        ['New hour', 'An extra make-up hour goes on the timetable'],
        ['Who can use it', esc('any ages ' + bandOf(m) + ' credit expiring ' + m.expires)],
        ['Cover', 'An instructor has to be found for it'],
        ['Credit', esc(firstName(m.child) + ' can book before ' + m.expires)]
      ];
    }
    if (v.code === 'expired') {
      return [
        ['Credit', esc('Runs past ' + m.expires + ' into the next cycle')],
        ['Cycle', 'The cycle it was earned in is already closed'],
        ['Family', 'Emailed a confirmation']
      ];
    }
    return [
      ['Nothing yet', 'There is no hour to place the child into'],
      ['Credit', esc('Stays open until ' + m.expires)]
    ];
  }

  function exceptionCards(m, v) {
    var asked = isRequest(m);
    var request = ui.card({
      title: asked ? 'The request' : 'The credit',
      head: ui.pill(STANDING.needs.label, STANDING.needs.kind),
      note: asked
        ? 'The family picked this themselves. Nothing is held for them until you say so.'
        : 'The family has nowhere to book this, so it will run out on its own unless you do something.'
    }, ui.kv([
      ['Child', esc(m.child)],
      ['Missed', esc(m.missed)],
      [asked ? 'Asked for' : 'Reason', esc(asked ? askedFor(m) : m.reason)],
      ['Credit expires', expiryValue(m)]
    ]));

    var why = ui.card({
      title: asked ? 'Why it stopped here' : 'Why it cannot be placed',
      head: asked ? ui.pill(v.head, 'bad') : '',
      note: 'A free place and the right age band are the only two checks. A request that passes both is placed without you.'
    }, ui.kv(whyRows(m, v)));

    var consequence = ui.card({
      title: v.code === 'nowhere' ? 'If you open one' : 'If you say yes',
      note: v.code === 'nowhere'
        ? 'An extra hour is the only thing that saves a credit with nowhere to go.'
        : 'The child is already off the original register. This is the part that is not automatic.'
    }, ui.kv(consequenceRows(m, v)));

    return [request, why, consequence];
  }

  /* ---- confirmed without her ------------------------------------------------- */

  function autoCards(m, v) {
    var c = v.cls;

    var placed = ui.card({
      title: 'The placement',
      head: ui.pill(STANDING.confirmed.label, STANDING.confirmed.kind),
      note: 'The child came off the original register when the absence was reported. This put them on a new one.'
    }, ui.kv([
      ['Child', esc(m.child)],
      ['Missed', esc(m.missed)],
      ['Now in', esc(askedFor(m) + ' · ' + c.room)],
      ['Instructor', esc(c.staff)],
      ['Credit', 'Marked used']
    ]));

    var rule = ui.card({
      title: 'Why it did not need you',
      note: 'Only a full class, the wrong age band, a credit that has run out, or an hour nothing runs at come to you.'
    }, ui.kv([
      ['Free place', esc(c.en + ' of ' + c.cap + ' before the placement')],
      ['Age band', esc('ages ' + c.band + ' · the child is ages ' + bandOf(m))],
      ['Decided by', 'The studio rule, not a person'],
      ['Family', 'Emailed the confirmation']
    ]));

    return [placed, rule];
  }

  /* ---- a credit nobody is deciding about -------------------------------------- */

  function creditCards(m, v) {
    var credit = ui.card({
      title: 'The credit',
      head: ui.pill(STANDING[v.state].label, STANDING[v.state].kind),
      note: 'A credit is counted in classes, never in money, and does not move to a sibling or into the next cycle.'
    }, ui.kv([
      ['Child', esc(m.child)],
      ['Reason', esc(m.reason)],
      ['Missed session', esc(m.missed)],
      ['Expires', expiryValue(m)]
    ]));

    var place = v.code === 'booked'
      ? ui.card({
          title: 'Placement',
          note: 'The place is held. The credit is marked used once the session has been attended.'
        }, ui.kv([
          ['Booked into', esc(m.booked)],
          ['Booked by', 'The family, from their own portal']
        ]))
      : ui.card({
          title: 'Placement',
          note: 'A request for one of these confirms itself if the hour has room and the age band matches.'
        }, ui.kv([
          { k: 'Booked into', v: 'Not yet booked', tone: 'mute' },
          ['Expires', expiryValue(m)]
        ]));

    return [credit, place];
  }

  /* ---- the decision bar -------------------------------------------------------
     Pinned, so it is never below the explaining. The hint says what the button
     does before she presses it. */

  function decisionBar(m, v) {
    if (v.state === NEEDS) {
      var c = v.cls;
      if (v.code === 'nowhere') {
        return ui.formActions([{
          label: 'Open an extra hour',
          kind: 'primary',
          msg: 'Extra make-up hour opened · ' + firstName(m.child) + ' can be booked before ' + m.expires
        }], {
          sticky: true,
          hint: 'Left alone, this credit ends on ' + m.expires + ' · ' + inDays(dayCount(m.expires))
        });
      }
      if (v.code === 'expired') {
        return ui.formActions([
          { label: 'Let it go', kind: 'danger', msg: 'Credit closed · ' + m.child + ' keeps nothing' },
          { label: 'Extend the credit', kind: 'primary', msg: 'Credit extended · ' + m.child + ' can book again' }
        ], { sticky: true, hint: 'Extending carries a closed cycle into the next one' });
      }
      if (v.code === 'nohour') {
        return ui.formActions([
          { label: 'Decline', kind: 'danger', msg: 'Declined · ' + m.child + ' keeps the credit until ' + m.expires },
          { label: 'Message the family', kind: 'primary', to: 'newMessage' }
        ], { sticky: true, hint: 'Nothing runs at the hour they asked for, so there is nothing to approve' });
      }
      return ui.formActions([
        { label: 'Decline', kind: 'danger', msg: 'Declined · ' + m.child + ' keeps the credit until ' + m.expires },
        {
          label: 'Add anyway',
          kind: 'primary',
          msg: v.code === 'full'
            ? m.child + ' added · ' + hourOf(c) + ' now holds ' + (c.en + 1) + ' in a room set for ' + c.cap
            : m.child + ' added · ages ' + bandOf(m) + ' in an ages ' + c.band + ' hour'
        }
      ], {
        sticky: true,
        hint: v.code === 'full'
          ? hourOf(c) + ' goes to ' + (c.en + 1) + ' children in a room set for ' + c.cap
          : 'Places an ages ' + bandOf(m) + ' child in an ages ' + c.band + ' hour'
      });
    }

    if (v.code === 'auto') {
      return ui.formActions([{
        label: 'Cancel the place',
        kind: 'danger',
        msg: m.child + ' taken off ' + askedFor(m) + ' · the credit goes back to the family'
      }], {
        sticky: true,
        hint: 'Frees the place, returns the credit and emails the family'
      });
    }

    if (v.state === OPEN) {
      return ui.formActions([
        { label: 'Message the family', to: 'newMessage' },
        {
          label: 'Book it for the family',
          kind: 'primary',
          msg: m.child + ' booked · the family has been emailed'
        }
      ], {
        sticky: true,
        hint: 'Nothing is charged for a make-up · the family can also book it themselves'
      });
    }

    return '';
  }

  /* ---- the context under the decision -----------------------------------------
     Who the child is, what else they are holding, and the last thing the family
     said. All read off Grove.data, because a decision screen with nothing but
     the request on it is a page you cannot act from. */

  function context(m) {
    var s = childOf(m.child);
    var held = D.MAKEUPS.filter(function (o) { return o.child === m.child; });
    var others = held.filter(function (o) { return o.id !== m.id; });
    var thread = s ? D.THREADS.filter(function (t) { return t.fam === s.family; })[0] : null;
    var first = firstName(m.child);

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
        ? 'Each one is its own credit. Deciding this request does not spend the others.'
        : null
    }, others.length
      ? ui.rows(others.map(function (o) {
          var ov = verdict(o);
          var st = STANDING[ov.state];
          return {
            to: 'makeupRequest', id: o.id,
            title: esc(o.missed),
            sub: esc(missReason(o) || (ov.state === NEEDS ? ov.why : 'expires ' + o.expires)),
            end: ui.pill(st.label, st.kind)
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
