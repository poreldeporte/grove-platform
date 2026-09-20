/* Console → Dashboard.

   The console's first screen: what needs a decision, what is on today, and
   what the desk has been doing. It declares its header as data and returns
   only a body built from Grove.ui components.

   Changes from the visual review:
     - every figure in the stat strip is read off Grove.data. "Sessions today
       11" stood above a list of five; "On waitlists 12" fought the six entries
       the Requests screen prints, its tab count and its "6 of 6"; revenue,
       enrollments and outstanding were literals no other screen could back.
       Sessions is now the length of the list underneath it, the waitlist
       figure is the queue itself, outstanding is the same total across the
       same four families as Billing, and revenue is the invoices Billing
       counts as collected. Attendance was the last literal — 94% "down 2
       points on June", against the 91% the Attendance report averages out of
       the same column. It is that mean now, over the children who have a
       figure recorded, so the two screens print one number
     - the failed-payments notice was a typed family name. It reads the unpaid
       invoices instead, so it names whoever owes and totals what they owe —
       the same money, over the same families, as the Outstanding tile below
       it and as Billing. It split them into "declined cards" and no card,
       which was true of the declined invoice only: the two past-due ones are
       fees on a card that was never refused. The split is the one the desk
       acts on — who has a card to charge, and who has none
     - the over-capacity notice now says what the console does about it: while
       the Thursday class is over, nobody on its queue can be offered a place —
       which is the rule the Requests screen already enforces, and the reason
       that queue has no live "Offer place" button
     - the Waitlists card was three typed rows, one of them naming an age band
       (Mon 3:15pm · Ages 5–7) that the class does not run. The queues are
       grouped off Grove.data.WAITLIST and matched to the class they are
       waiting for the same way Classes and Requests match them, so each row
       carries that class's real places
     - the page eyebrow read "today at the studio" and the card below repeated
       it word for word. The eyebrow is "where things stand"
     - the bottom row was a three-row card beside a six-row one. The short side
       is a ui.col pair now, so neither card ends in dead space, and the second
       card is the make-up placements waiting on an answer — the other thing on
       the Requests screen that is somebody's decision today

   Simplified: nothing on this page is a control. Six figures, the two things
   that need deciding, and three lists that open the screen which owns them. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  var DAYS = {
    Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday',
    Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday'
  };

  function money(n) { return Grove.money(n, { cents: false }); }

  function sum(list, of) {
    var total = 0;
    list.forEach(function (x) { total += of(x); });
    return total;
  }

  /* "Okafor, Smith and Delgado" */
  function names(list) {
    if (list.length < 2) return list.join('');
    return list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1];
  }

  /* ---- money ---------------------------------------------------------------
     Both figures are the ones Billing works out from the same rows: what has
     settled this month, and what is still chaseable. */

  function paidInvoices() {
    return D.INVOICES.filter(function (i) { return i.status === 'Paid'; });
  }
  function unpaidInvoices() {
    return D.INVOICES.filter(function (i) { return i.status !== 'Paid'; });
  }
  function owingFamilies() {
    return D.FAMILIES.filter(function (f) { return f.balance > 0; });
  }
  function noCardSaved(i) { return /none/i.test(String(i.method)); }

  /* ---- attendance ------------------------------------------------------------
     '96%' -> 96, '—' -> null. The Attendance report averages this same column
     the same way, so the strip and the report cannot disagree. */

  function attPct(s) {
    var n = parseFloat(String(s.att));
    return isNaN(n) ? null : n;
  }
  function withAttendance() {
    return D.STUDENTS.filter(function (s) { return attPct(s) !== null; });
  }

  /* ---- classes -------------------------------------------------------------- */

  function overCapacity() {
    return D.CLASSES.filter(function (c) { return c.en > c.cap; });
  }

  /* '2:15–3:15pm' -> '2:15pm'; '10:00am–1:00pm' -> '10:00am'. */
  function startTime(c) {
    var parts = String(c.time).split('–');
    var a = String(parts[0] || '').toLowerCase();
    if (a.indexOf('am') !== -1 || a.indexOf('pm') !== -1) return a;
    var b = String(parts[1] || '').toLowerCase();
    return a + (b.indexOf('am') !== -1 ? 'am' : (b.indexOf('pm') !== -1 ? 'pm' : ''));
  }

  /* The waitlist names its class in free text. It is matched back to CLASSES
     by day plus either the start time or the age band — the same match the
     Classes and Requests screens make, so all three agree about the places. */
  function queueClass(label) {
    var text = String(label).toLowerCase();
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

  /* One entry per queue, in the order the queues were joined. */
  function queues() {
    var order = [], counts = {};
    D.WAITLIST.forEach(function (w) {
      if (order.indexOf(w.cls) === -1) order.push(w.cls);
      counts[w.cls] = (counts[w.cls] || 0) + 1;
    });
    return order.map(function (cls) {
      return { cls: cls, n: counts[cls], c: queueClass(cls) };
    });
  }

  /* ---- make-ups ------------------------------------------------------------- */

  function pendingMakeups() {
    return D.MAKEUPS.filter(function (m) { return m.status === 'Awaiting approval'; });
  }

  /* The pending rows carry the slot the family asked for, not a reason. */
  function askedFor(m) { return String(m.reason).replace(/^Requested\s+/, ''); }

  /* ---- screen ---------------------------------------------------------------- */

  Grove.screen('dashboard', {
    surface: 'console',
    crumbTitle: 'Dashboard',
    eyebrow: 'where things stand',
    title: String(D.today).replace(/\s+\d{4}$/, ''),
    sub: 'Summer camp week 4 of 6 · after-school enrollment opens in 13 days.',
    actions: [
      { label: 'Take payment', msg: 'Payment recorded' },
      { label: 'Add family', to: 'families' },
      { label: 'New program', kind: 'primary', to: 'programBuilder' }
    ],

    body: function () {
      var owed = unpaidInvoices();
      var noCard = owed.filter(noCardSaved);
      var onCard = owed.filter(function (i) { return !noCardSaved(i); });

      var moneyText = names(owed.map(function (i) { return i.fam; })) + ' owe ' +
        money(sum(owed, function (i) { return i.amt; })) + ' in unpaid invoices. ' +
        onCard.length + (onCard.length === 1 ? ' has' : ' have') + ' a card the desk can charge' +
        (noCard.length === 1
          ? '; the ' + noCard[0].fam + ' family has no card saved.'
          : (noCard.length ? '; ' + names(noCard.map(function (i) { return i.fam; })) + ' have no card saved.' : '.'));

      var attention = [
        ui.notice({
          kind: 'bad',
          title: owed.length + ' invoices are unpaid',
          text: moneyText,
          action: { label: 'Resolve', to: 'billing' }
        })
      ].concat(overCapacity().map(function (c) {
        return ui.notice({
          kind: 'warn',
          title: 'The ' + DAYS[c.day] + ' ' + startTime(c) + ' class is over capacity',
          text: c.en + ' enrolled against ' + c.cap + ' places, ages ' + c.band + '. Nobody on its ' +
            'waitlist can be offered a place until somebody leaves.',
          action: { label: 'Rebalance', to: 'classes' }
        });
      })).join('');

      var recorded = withAttendance();

      var stats = ui.statbar([
        {
          label: 'Revenue MTD',
          value: money(sum(paidInvoices(), function (i) { return i.amt; })),
          sub: paidInvoices().length + ' of ' + D.INVOICES.length + ' invoices settled'
        },
        {
          label: 'Active enrollments',
          value: String(sum(D.CLASSES, function (c) { return c.en; })),
          sub: 'of ' + sum(D.CLASSES, function (c) { return c.cap; }) + ' places'
        },
        {
          label: 'Sessions today',
          value: String(D.TODAY.length),
          sub: sum(D.TODAY, function (s) { return s.en; }) + ' children expected'
        },
        {
          label: 'Attendance',
          value: recorded.length
            ? Math.round(sum(recorded, attPct) / recorded.length) + '%'
            : '—',
          sub: 'across ' + recorded.length + (recorded.length === 1 ? ' child' : ' children') +
            ' with a record',
          tone: 'grove'
        },
        {
          label: 'Outstanding',
          value: money(sum(owingFamilies(), function (f) { return f.balance; })),
          sub: owingFamilies().length + ' families',
          tone: 'clay'
        },
        {
          label: 'On waitlists',
          value: String(D.WAITLIST.length),
          sub: 'across ' + queues().length + ' classes',
          tone: 'plum'
        }
      ]);

      var today = ui.card(
        {
          title: 'Today at the studio',
          head: ui.btn({ label: 'Open classes', kind: 'quiet', size: 'sm', to: 'classes' }),
          flush: true
        },
        ui.rows(D.TODAY.map(function (s) {
          var full = s.en >= s.cap;
          return {
            lead: esc(s.time),
            title: ui.dot(D.program(s.prog).color) + ' ' + esc(s.title),
            end: '<span class="num ' + (full ? 'clay' : 'grove') + '">' + s.en + '/' + s.cap + '</span>',
            to: 'classes'
          };
        }))
      );

      var waitlists = ui.card(
        {
          title: 'Waitlists',
          head: ui.btn({ label: 'View all', kind: 'quiet', size: 'sm', to: 'requests' }),
          flush: true
        },
        ui.rows(queues().map(function (q) {
          return {
            title: esc(q.cls),
            sub: q.c ? esc(q.c.en + ' of ' + q.c.cap + ' places') : '',
            end: ui.pill(q.n + ' waiting', 'warn'),
            to: 'requests'
          };
        }))
      );

      var pending = pendingMakeups();
      var makeups = ui.card(
        {
          title: 'Make-up requests',
          flush: true,
          note: 'A make-up credit is counted in classes, never in money. Approving one puts the child on that day’s register.'
        },
        pending.length
          ? ui.rows(pending.map(function (m) {
              return {
                title: esc(m.child),
                sub: esc('Asked for ' + askedFor(m)),
                end: ui.mute('Expires ' + m.expires),
                to: 'makeupRequest',
                id: m.id
              };
            }))
          : ui.empty('Nothing waiting', 'No family has asked for a make-up slot.')
      );

      var activity = ui.card(
        {
          title: 'Recent activity',
          flush: true,
          note: 'Everything the desk and the instructors have done today, newest first.'
        },
        ui.rows(D.ACTIVITY.map(function (a) {
          return { lead: esc(a.at), title: esc(a.what) };
        }))
      );

      return h`
        <div class="stack">${raw(attention)}</div>
        <div class="section">${raw(stats)}${raw(today)}</div>
        <div class="section">${raw(ui.grid(2, [ui.col([waitlists, makeups]), activity]))}</div>
      `;
    }
  });
})();
