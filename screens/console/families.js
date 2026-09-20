/* Console → Families: the list, one family's record, one child's record.

   Written for Sabrina, who owns the studio. She is at a desk with a real
   keyboard and she reads a table faster than she reads a card, so the list
   stays a table and the records stay dense.

   THIS PASS — A PLAN IS HOURS A MONTH, AND A CYCLE IS A SET OF DATES

   The pack of sessions is gone from these three screens. After-School is the
   only programme with a plan, and a plan is a number of HOURS a month — 4, 8,
   12 or 16 — at a rate per hour that falls as the plan grows. The parent picked
   the day and the time at registration and it is fixed for the programme year,
   so the month's hours are spent by those dated classes. Everything these
   screens say about a plan is D.plan(child), counted off the child's own rows
   in D.SESSIONS, and every price is PRICING.as.plans. Nothing is typed in.

   What that deletes rather than renames:
     - "Pack of 8", "sessions used", "renews on the 8th class" and the whole
       idea that a charge is a number of classes away. A cycle has dates. The
       invoice is raised on the LAST class of the cycle and it covers the NEXT
       one, and both records now write those dates out, because writing the
       dates out is how the owner kept control when she did this by hand
     - "Sessions do not expire". They do: the hours are the month's and unbooked
       hours are lost. D.RULES.unusedHours says so once and these screens quote
       it rather than each inventing a version
     - the Renewal card, which forecast a pack renewing itself for ever. A plan
       runs to the end of the school year and ends by itself — D.PLAN_YEAR — so
       there is nothing to stop in June. What is left is the one real decision,
       30 days written notice, and it is a button on the cycle card rather than
       a card of its own
     - "make-up credits". A missed class is not a credit to hold, approve or
       expire. Cancel the notice period ahead in the portal and the class comes
       back as a make-up; later than that, or a no-show, and the class counts as
       attended. Both sentences come out of D.RULES, and the make-up window is
       whatever Settings holds — this file renders the setting and never picks
       one, because the studio is moving from "same cycle" to "30 days from the
       missed class" and a hard-coded screen would be wrong either way.

   ONE MANUAL CHARGE FOR EVERY EXCEPTION
     The owner asked for four things — a class or two when a child's school
     finishes later than the programme, a private class that came up, an event,
     any other service. They are not four features. They are the one action she
     already calls "make sale / post sale", so Post a sale is a header action on
     the family record, pre-selecting the family she is looking at, and school
     end dates, event billing and extra-class rules are modelled nowhere. This
     file adds no control of its own for any of them.

   WHY THE PLAN COLUMN IS DERIVED AND NOT FAMILIES.plan
     A plan belongs to one child. Emma holds four hours and Lucas four, and each
     is invoiced on their own last class, so the column reads the children's
     own plans rather than a household line that totals two fours into an eight.
     The Children column is derived the same way, off the children on the books,
     so it cannot disagree with the Students tab beside it.

   Cut in earlier passes, still cut:
     - "Billing exceptions" as a card. It held two per-family overrides of
       studio-wide settings, one of which was FAMILIES.autopay written twice
     - the three pills under the title, which said one thing three ways and none
       of them said what to do. One notice at the top, naming the open invoice,
       the amount, the due date and the reason, with the money action on it
     - "Record a payment" in the header. It appears beside the amount it means
     - a fourth filter chip that was the exact complement of the third.

   Standing decisions, still true:
     - the register is the join: a child's classes come from D.classesOf, never
       from the free-text line under their name
     - a document is reported signed only on the record of the family whose
       signature Grove.data carries, and the ledger is offered only to the
       family whose ledger it holds
     - the sibling rule is read from PRICING, and it is relief on the
       REGISTRATION FEE, not on tuition. That fee is After-School's own $130, so
       it is stated on a family holding a plan or newly registered with nothing
       booked, and never on a family who only books camp or a party — they pay
       that programme's own, much smaller fee as they book
     - no sticky action bar on these three screens: they are a list and two
       records, and the actions belong beside the rows they act on. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;
  var money = Grove.money;

  var STATUS_KIND = {
    'Active': 'ok',
    'Payment failed': 'bad',
    'Past due': 'bad',
    'Pending payment': 'warn',
    'Cancelling': null
  };

  var TAB_KEY = 'people';
  var T_FAMILIES = 'Families';
  var T_STUDENTS = 'Students';

  var F_ALL = 'All', F_OWING = 'Owing', F_ATTENTION = 'Needs attention';
  var S_ALL = 'All children', S_SAFETY = 'Safety notes', S_UNPLACED = 'Not in a class';

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];

  var DAY_MS = 24 * 60 * 60 * 1000;

  /* ---- words ---------------------------------------------------------------- */

  function firstName(name) { return String(name).split(' ')[0]; }

  function ord(n) {
    var end = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (end[(v - 20) % 10] || end[v] || end[0]);
  }

  /* "6, 13, 20 and 27" — the studio's way of reading a list out loud. */
  function listOf(items) {
    if (items.length < 2) return items.join('');
    return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
  }
  /* The same list where the items are alternatives rather than a set. The last
     comma stays when there are three or more, because these clauses carry "or"
     inside them and the sentence needs the break. */
  function orList(items) {
    if (items.length < 2) return items.join('');
    return items.slice(0, -1).join(', ') + (items.length > 2 ? ', or ' : ' or ') +
      items[items.length - 1];
  }

  function lowerFirst(s) { return String(s).charAt(0).toLowerCase() + String(s).slice(1); }

  /* A rule in D.RULES is a whole sentence. Dropping its full stop lets it be
     joined to the words around it without this screen rewriting the rule. */
  function unstop(s) {
    var t = String(s);
    return t.charAt(t.length - 1) === '.' ? t.slice(0, -1) : t;
  }

  function money0(n) { return money(n, { cents: false }); }

  function hoursWord(n) { return n === 1 ? '1 hour' : n + ' hours'; }

  function placeWord(n) { return n === 1 ? '1 place' : n + ' places'; }

  /* A filtered table says how much of the whole it is showing. */
  function countLine(shown, total, word) {
    return (shown === total ? String(total) : shown + ' of ' + total) + ' ' + word;
  }

  function currentTab() { return Grove.tab(TAB_KEY, T_FAMILIES); }

  /* ---- dates -----------------------------------------------------------------
     A cycle is a set of dates and D.SESSIONS holds them as '2026-07-27'. The
     parts are read off the string, so the day printed is the day the studio
     wrote down whatever the reader's clock says. Only the projection forward
     needs arithmetic, and that runs in UTC. Months are held 0-based throughout,
     so a stamp can be sorted, grouped and printed by one set of helpers. */

  function stamp(iso) {
    var p = String(iso).split('-');
    return { y: +p[0], m: +p[1] - 1, d: +p[2] };
  }
  function dayMonth(iso) {
    var t = stamp(iso);
    return t.d + ' ' + MONTHS[t.m];
  }
  function byStamp(a, b) { return (a.y - b.y) || (a.m - b.m) || (a.d - b.d); }
  function stampsOf(list) {
    return list.map(function (x) { return stamp(x.date || x); }).sort(byStamp);
  }
  function weeksOn(iso, n) {
    var t = stamp(iso);
    var dt = new Date(Date.UTC(t.y, t.m, t.d) + n * 7 * DAY_MS);
    return { y: dt.getUTCFullYear(), m: dt.getUTCMonth(), d: dt.getUTCDate() };
  }
  /* "6, 13, 20 and 27 July", and across a month end "27 July, then 3 August". */
  function datesWords(list) {
    var groups = [];
    list.forEach(function (x) {
      var g = groups[groups.length - 1];
      if (!g || g.m !== x.m) { g = { m: x.m, days: [] }; groups.push(g); }
      g.days.push(String(x.d));
    });
    return groups.map(function (g) {
      return listOf(g.days) + ' ' + MONTHS[g.m];
    }).join(', then ');
  }

  /* ---- plans ------------------------------------------------------------------
     Hours a month, priced from PRICING, spent by the child's own dated classes.
     Only After-School has a plan; camp, no-school days, privates, pop-ups and
     parties are one-off bookings with no plan, no cycle and no renewal. */

  function planOf(s) { return D.plan(s); }

  function kidsOf(name) {
    return D.STUDENTS.filter(function (s) { return s.family === name; });
  }

  function planKids(f) {
    return kidsOf(f.name).filter(function (k) { return planOf(k).isPlan; });
  }

  /* "8 hours a month", "4 and 4 hours a month" — the plans the children hold. */
  function hoursSummary(f) {
    var held = planKids(f).map(function (k) { return String(planOf(k).hours); });
    return held.length ? listOf(held) + ' hours a month' : '';
  }

  function planValue(f) {
    return planKids(f).reduce(function (n, k) { return n + planOf(k).price; }, 0);
  }

  function hoursLeft(f) {
    return planKids(f).reduce(function (n, k) { return n + planOf(k).leftHours; }, 0);
  }

  /* A family that has given notice. The plan ends by itself with the school
     year anyway, so this is the only cancelling there is. */
  function stopping(f) {
    return !!f && (f.status === 'Cancelling' || String(f.plan).indexOf('not renewing') !== -1);
  }

  /* The invoice is raised on the last class of the cycle. */
  function invoiceDate(k) {
    var on = planOf(k).renewsOn;
    return on ? on.date : null;
  }

  /* Whose invoice lands first — what the desk is asked on the phone. */
  function nextInvoiceChild(f) {
    return planKids(f).slice().sort(function (a, b) {
      var da = invoiceDate(a), db = invoiceDate(b);
      if (da === db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return da < db ? -1 : 1;
    })[0];
  }

  /* The child's very next class is the last of their cycle, so the invoice is
     raised on it. The one thing on this list worth counting. */
  function landsNext(k) { return planOf(k).nextDates.length === 1; }

  function billingNext(f) {
    if (stopping(f)) return false;
    return planKids(f).filter(landsNext).length > 0;
  }

  /* The same weekly slot carried forward: each class in this cycle moved on by
     as many weeks as that class runs in a cycle. That is the set of dates the
     next invoice pays for. */
  function nextCycle(p) {
    var by = {}, order = [], out = [];
    (p.dates || []).forEach(function (x) {
      if (!by[x.classId]) { by[x.classId] = []; order.push(x.classId); }
      by[x.classId].push(x.date);
    });
    order.forEach(function (id) {
      var runs = by[id].length;
      by[id].forEach(function (iso) { out.push(weeksOn(iso, runs)); });
    });
    return out.sort(byStamp);
  }

  function usedLine(p) {
    return p.usedHours + ' of ' + p.hours + ' hours used this cycle';
  }

  function bookedLine(p) {
    var list = stampsOf(p.dates || []);
    return list.length ? 'booked ' + datesWords(list) : 'nothing booked this cycle';
  }

  /* A family with no plan either books camp and one-off classes, or has not
     started. The two are not the same thing to say back to them. */
  function noPlanLine(f) {
    var booked = kidsOf(f.name).filter(function (k) { return D.classesOf(k).length; }).length;
    return booked ? 'No plan — camp and one-off bookings, paid when booked' : 'Nothing booked yet';
  }

  /* ---- classes -------------------------------------------------------------
     D.classesOf is the join. A class's own record is where its day, its room
     and its teacher live. */

  function classById(id) {
    return D.CLASSES.filter(function (c) { return c.id === id; })[0];
  }

  /* An after-school hour is its day, its time and its room; a camp week, a
     pop-up or a party carries its own name, because two camp weeks share a room
     and an hour and only the name tells them apart. */
  function classShort(c) {
    return c.prog === 'as' ? c.day + ' ' + c.time + ' · ' + c.room : c.name;
  }

  function classSub(c) {
    var out = c.prog === 'as' ? '' : c.day + ' ' + c.time + ' · ' + c.room + ' · ';
    out += c.staff;
    if (c.band && c.band !== '—') out += ' · ages ' + c.band;
    return out;
  }

  /* Where a child is, in one line. Search reads this too, so typing a room or a
     camp week finds the children in it. */
  function whereLine(s) {
    var classes = D.classesOf(s);
    if (classes.length) return classes.map(classShort).join(' · ');
    var w = waitlistEntry(s.name);
    return w ? 'Waitlisted · ' + slotOf(w.cls) : 'Not yet enrolled';
  }

  /* One dated class, as the register has it. */
  function sessionLine(x) {
    var c = classById(x.classId);
    return (c ? c.day + ' ' : '') + dayMonth(x.date) + ' · ' + x.at + ' · ' + hoursWord(x.hours);
  }

  /* ---- waitlist ------------------------------------------------------------
     A waitlist row names its class in words, so it is joined on the class's own
     day and start time — the key the dataset counts a queue with. */

  function classKey(c) { return c.day + ' ' + String(c.time).split('–')[0]; }

  function slotOf(text) {
    var parts = String(text).split(' · ');
    return parts[0] === 'Waitlisted' ? (parts[1] || '') : parts[0];
  }

  function waitlistEntry(childName) {
    return D.WAITLIST.filter(function (w) { return w.child === childName; })[0];
  }

  function waitlistDepth(w) {
    var slot = slotOf(w.cls);
    return D.WAITLIST.filter(function (x) { return slotOf(x.cls) === slot; }).length;
  }

  /* Who takes the place if this family gives it up. A family already holding a
     waitlist seat in the same class cannot inherit its own place. */
  function waitingOn(c, exceptFamily) {
    return D.WAITLIST.filter(function (w) {
      return String(w.cls).indexOf(classKey(c)) === 0 && w.fam !== exceptFamily;
    }).sort(function (a, b) { return a.pos - b.pos; });
  }

  /* ---- make-ups --------------------------------------------------------------
     There is no credit to hold. The studio was told in time and the class comes
     back as a make-up, or it was not and the class counts as attended. Both
     sentences are D.RULES', and the window is whatever Settings holds. */

  function extrasFor(name) {
    return D.EXTRA_CLASSES.filter(function (x) { return x.child === name; });
  }

  function makeupOutcome(a) {
    return a.spent
      ? { label: 'Counted as attended', kind: 'amber' }
      : { label: 'Make-up given', kind: 'ok' };
  }

  /* What this child's misses came to, counting the make-up already on the
     books, so the head says the same thing as the rows under it. */
  function makeupLine(list, booked) {
    var given = list.filter(function (a) { return !a.spent; }).length;
    var counted = list.length - given;
    var parts = [];
    if (given) parts.push(given + ' make-up' + (given === 1 ? '' : 's') + ' given');
    if (booked) parts.push(booked + ' booked');
    if (counted) parts.push(counted + ' counted as attended');
    return parts.join(' · ');
  }

  function makeupWindowWords(w) {
    var s = String(w);
    if (s === 'same cycle') return 'inside the same billing cycle';
    if (s.indexOf('from the missed class') !== -1) {
      return 'within ' + s.split('from the missed class').join('of the missed class');
    }
    return s;
  }

  /* The whole make-up rule, in the studio's own words, from one place. The
     window is whatever Settings holds — this file renders it, never picks it. */
  function makeupRule() {
    var r = D.RULES;
    return 'Cancel ' + r.cancelNotice + ' ahead, in the portal, and the class comes back as a ' +
      'make-up. Later than that, or a no-show: ' + lowerFirst(r.lateCancel) +
      ' A make-up goes in ' + lowerFirst(unstop(r.makeupWhere)) + ', and it has to be taken ' +
      makeupWindowWords(r.makeupWindow) + '. It cannot ' +
      orList(r.makeupNever.map(lowerFirst)) + '. ' + r.freeze;
  }

  /* The cycle rule, likewise. */
  function cycleRule() {
    return D.RULES.unusedHours + ' A plan is hours a month, and the hours are ' +
      'spent by the dates the parent picked at registration.';
  }

  /* ---- rows and cells -------------------------------------------------------- */

  /* One child, as the register has them. A name on a family record opens that
     child's record rather than sitting there as a line of text. */
  function childRow(s) {
    var classes = D.classesOf(s);
    var p = planOf(s);
    var end = '';
    if (!classes.length) {
      end = ui.pill(waitlistEntry(s.name) ? 'Waitlist' : 'Not enrolled', 'warn');
    } else if (s.flag) {
      end = ui.pill(s.flag, s.flagKind === 'bad' ? 'bad' : 'warn');
    } else if (p.isPlan) {
      end = ui.mute(p.usedHours + ' of ' + p.hours + ' hours');
    }
    return {
      title: esc(s.name),
      sub: esc('Age ' + s.age + ' · ' + whereLine(s) +
        (p.isPlan ? ' · ' + p.hours + ' hours a month' : '')),
      end: end,
      to: 'studentRecord', id: s.id
    };
  }

  function childNames(f) {
    return kidsOf(f.name).map(function (s) {
      return firstName(s.name) + ' (' + s.age + ')';
    }).join(', ');
  }

  function sumBalance(list) {
    return list.reduce(function (n, f) { return n + f.balance; }, 0);
  }

  /* ---- registration fee ------------------------------------------------------
     The studio's sibling relief is on the REGISTRATION FEE, not on tuition, and
     it is kept in PRICING so every screen quotes the same rule. */

  function regFeeLine() {
    return money0(D.PRICING.as.regFee) + ' per ' + D.PRICING.as.regFeePer;
  }

  /* That fee is After-School's own. A family that only books a camp week, a
     pop-up or a party pays that programme's much smaller fee as they book, so
     the fee — and the relief on it — is stated only where it is what is owed:
     a family holding a plan, or one registered with nothing booked yet. */
  function onAfterSchool(f) {
    if (planKids(f).length) return true;
    return kidsOf(f.name).filter(function (k) { return D.classesOf(k).length; }).length === 0;
  }

  function siblingRelief() {
    var r = D.PRICING.as.siblingRelief;
    return r.charAt(0).toUpperCase() + r.slice(1);
  }

  /* Relief is read against the second and third registration, so it names the
     children after the first — from the roster, never written out by hand. */
  function laterKids(kids) {
    return kids.slice(1, 3).map(function (k) { return k.name; }).join(', ');
  }

  /* ---- invoices, messages, paperwork ----------------------------------------- */

  function invoicesOf(f) {
    return D.INVOICES.filter(function (i) { return i.fam === f.name; });
  }

  function openInvoiceOf(f) {
    return invoicesOf(f).filter(function (i) { return i.status !== 'Paid'; })[0];
  }

  function latestInvoiceOf(f) {
    return openInvoiceOf(f) || invoicesOf(f)[0];
  }

  function threadOf(f) {
    return D.THREADS.filter(function (t) { return t.fam === f.name; })[0];
  }

  function photoDoc(childName) {
    var first = firstName(childName);
    return D.DOCUMENTS.filter(function (d) {
      return d.name.indexOf('Photo permission') === 0 && d.name.indexOf(first) !== -1;
    })[0];
  }

  function namesAChild(text, f) {
    var kids = kidsOf(f.name);
    for (var i = 0; i < kids.length; i++) {
      if (String(text).indexOf(firstName(kids[i].name)) !== -1) return true;
    }
    return false;
  }

  /* Grove.data carries one family's paperwork and one family's ledger. A
     signature or a ledger is only claimed on that family's own record. */
  function ownsDocs(f) {
    return D.DOCUMENTS.filter(function (d) {
      return (d.who !== '—' && d.who.indexOf(f.guardian) === 0) || namesAChild(d.name, f);
    }).length > 0;
  }

  function ownsLedger(f) {
    return D.LEDGER.filter(function (l) { return namesAChild(l.what, f); }).length > 0;
  }

  function signedOn(d) {
    return String(d.who).split(' · ')[1] || '';
  }

  /* Three states, and she treats them the same way: anything that is not a
     signed copy on file is a form to chase. */
  function docRow(name, d) {
    if (d && d.signed) return { k: name, v: esc('Signed · ' + signedOn(d)), tone: null };
    if (d) return { k: name, v: 'Not signed', tone: 'clay' };
    return { k: name, v: 'No signed copy', tone: 'mute' };
  }

  function documentRows(f) {
    var mine = ownsDocs(f);
    var rows = [];

    D.DOCUMENTS.forEach(function (d) {
      if (d.name.indexOf('Photo permission') === 0) return;
      rows.push(docRow(d.name, mine ? d : null));
    });

    kidsOf(f.name).forEach(function (k) {
      var doc = photoDoc(k.name);
      rows.push(docRow(doc ? doc.name : 'Photo permission — ' + firstName(k.name),
        doc && mine ? doc : null));
    });

    return rows;
  }

  function toChase(rows) {
    return rows.filter(function (r) { return !!r.tone; }).length;
  }

  /* ---- list ------------------------------------------------------------- */

  Grove.screen('families', {
    surface: 'console',
    eyebrow: 'everyone on the books',
    title: 'Families',
    sub: function () {
      return currentTab() === T_STUDENTS
        ? 'Every child on the books: the classes they sit in, what a teacher has to know before they walk in, and where they are in this month’s hours.'
        : 'The family is the billing unit, but a plan belongs to one child: two children hold their own hours and are invoiced on their own last class of the cycle.';
    },
    actions: [
      { label: 'Export', msg: 'Exported to CSV' },
      { label: 'Add family', kind: 'primary', msg: 'Prototype — no form yet' }
    ],

    body: function () {
      return currentTab() === T_STUDENTS ? studentsTab() : familiesTab();
    }
  });

  function peopleTabs() {
    return {
      key: TAB_KEY,
      items: [
        { label: T_FAMILIES, count: D.FAMILIES.length },
        { label: T_STUDENTS, count: D.STUDENTS.length }
      ]
    };
  }

  /* When the next invoice lands, in one line under the plan. */
  function planSub(f) {
    var k = nextInvoiceChild(f);
    if (!k) return '';
    if (stopping(f)) return 'Notice given · last cycle';
    var on = invoiceDate(k);
    return on
      ? 'Invoice on ' + firstName(k.name) + '’s last class, ' + dayMonth(on)
      : 'Nothing booked this cycle';
  }

  /* The hours the children hold and what they come to a month. A family with no
     plan pays for what it books, which is worth stating rather than a blank. */
  function planCell(f) {
    var sum = hoursSummary(f);
    if (sum) return ui.two(sum + ' · ' + money0(planValue(f)), planSub(f));
    var booked = kidsOf(f.name).filter(function (k) { return D.classesOf(k).length; }).length;
    return booked ? ui.mute('Camp and one-off bookings') : '<span class="mute">—</span>';
  }

  function familiesTab() {
    var q = Grove.query('families');
    var filter = Grove.filter('families', F_ALL);

    var rows = D.FAMILIES.filter(function (f) {
      if (!Grove.match(q, f.name, f.guardian, f.email, childNames(f), f.phone, hoursSummary(f))) return false;
      if (filter === F_OWING) return f.balance > 0;
      if (filter === F_ATTENTION) return f.status !== 'Active';
      return true;
    });

    /* Tallied off the rows on screen, so filtering the list re-states what that
       list is worth. On the Owing chip every row is already owing, so only the
       money is worth saying twice. */
    var owing = rows.filter(function (f) { return f.balance > 0; });
    var landing = rows.filter(billingNext);
    var count = countLine(rows.length, D.FAMILIES.length, 'families');
    if (owing.length) {
      count += ' · ' + (filter === F_OWING
        ? money(sumBalance(owing)) + ' owing'
        : owing.length + ' owing ' + money(sumBalance(owing)));
    }
    if (landing.length) count += ' · ' + landing.length + ' invoiced on the next class';

    var table = ui.table(
      ['Family', 'Children', 'Contact', 'Plan', { label: 'Balance', align: 'right' }, { label: 'Status', shrink: true }],
      rows.map(function (f) {
        var kids = childNames(f);
        return {
          to: 'familyRecord', id: f.id,
          cells: [
            ui.two(f.name + ' family', f.guardian),
            kids ? ui.mute(kids) : '<span class="mute">None yet</span>',
            ui.two(f.email, f.phone),
            planCell(f),
            '<span class="' + (f.balance > 0 ? 'clay strong' : 'mute') + '">' + money(f.balance) + '</span>',
            ui.pill(f.status, STATUS_KIND[f.status])
          ]
        };
      }),
      { emptyTitle: 'No families match', emptyText: 'Clear the search or choose a different filter.' }
    );

    return ui.toolbar({
      tabs: peopleTabs(),
      search: { key: 'families', placeholder: 'Search name, email, phone, child…' },
      filters: { key: 'families', items: [F_ALL, F_OWING, F_ATTENTION] },
      count: count
    }) + ui.card({ flush: true }, table);
  }

  /* The Class column is a column, not a paragraph: the first class in full and
     the rest counted. The child's own record lists every one of them. */
  function classCell(s) {
    var classes = D.classesOf(s);
    if (!classes.length) {
      var w = waitlistEntry(s.name);
      return w
        ? ui.pill('Waitlist', 'warn') + ' ' + ui.mute(slotOf(w.cls))
        : ui.pill('Not enrolled', 'warn');
    }
    return ui.mute(classShort(classes[0]) +
      (classes.length > 1 ? ' + ' + (classes.length - 1) + ' more' : ''));
  }

  function studentsTab() {
    var q = Grove.query('students');
    var filter = Grove.filter('students', S_ALL);

    var rows = D.STUDENTS.filter(function (s) {
      var p = planOf(s);
      if (!Grove.match(q, s.name, s.family, s.band, whereLine(s),
        p.isPlan ? p.hours + ' hours a month' : 'camp and one-off bookings')) return false;
      if (filter === S_SAFETY) return !!s.flag;
      if (filter === S_UNPLACED) return D.classesOf(s).length === 0;
      return true;
    });

    var flagged = rows.filter(function (s) { return !!s.flag; }).length;
    var landing = rows.filter(function (s) {
      var f = famByName(s.family);
      return planOf(s).isPlan && landsNext(s) && !stopping(f);
    }).length;
    var count = countLine(rows.length, D.STUDENTS.length, 'children');
    if (flagged && filter !== S_SAFETY) count += ' · ' + flagged + ' with a safety note';
    if (landing) count += ' · ' + landing + ' invoiced on the next class';

    var table = ui.table(
      ['Child', 'Family', 'Class', 'Safety', { label: 'Attendance', align: 'right' }, 'Plan'],
      rows.map(function (s) {
        var p = planOf(s);
        return {
          to: 'studentRecord', id: s.id,
          cells: [
            ui.two(s.name, 'Age ' + s.age + ' · ' + s.band),
            ui.mute(s.family),
            classCell(s),
            s.flag ? ui.pill(s.flag, s.flagKind) : '<span class="mute">—</span>',
            '<span class="num">' + esc(s.att) + '</span>',
            p.isPlan
              ? ui.two(p.hours + ' hours a month · ' + money0(p.price), usedLine(p))
              : (D.classesOf(s).length ? ui.mute('Camp and one-off') : '<span class="mute">—</span>')
          ]
        };
      }),
      { emptyTitle: 'No children match', emptyText: 'Clear the search or choose a different filter.' }
    );

    return ui.toolbar({
      tabs: peopleTabs(),
      search: { key: 'students', placeholder: 'Search child, family, class, age band…' },
      filters: { key: 'students', items: [S_ALL, S_SAFETY, S_UNPLACED] },
      count: count
    }) + ui.card({ flush: true }, table);
  }

  /* ---- what is wrong with this family, at the top -------------------------
     One notice, stating the open invoice it is about, with the money action on
     it rather than in the header where the amount is not visible. */

  function autopayLine(f) {
    return f.autopay
      ? 'The card on file is charged when the cycle invoice is raised — ' + String(f.card).split(' · ')[0] + '.'
      : 'Autopay is off, so a cycle is invoiced by hand.';
  }

  /* "8 Jul 2026" stays as it is; "On receipt" is mid-sentence here. */
  function dueLine(due) {
    var d = String(due);
    return /^\d/.test(d) ? d : lowerFirst(d);
  }

  function leadNotice(f) {
    var inv = openInvoiceOf(f);
    if (inv) {
      return ui.notice({
        kind: inv.kind === 'bad' ? 'bad' : 'warn',
        title: inv.status + ' · ' + money(inv.amt) + ' owing',
        text: inv.id + ' · due ' + dueLine(inv.due) + ' · ' + inv.note,
        action: { label: 'Record a payment', msg: 'Payment recorded · receipt emailed to ' + f.email }
      });
    }

    if (f.balance > 0) {
      return ui.notice({
        kind: 'bad',
        title: money(f.balance) + ' owing',
        text: 'No open invoice covers it. Raise one in billing.',
        action: { label: 'Record a payment', msg: 'Payment recorded · receipt emailed to ' + f.email }
      });
    }

    var last = latestInvoiceOf(f);

    if (stopping(f)) {
      var left = hoursLeft(f);
      return ui.notice({
        title: 'Notice given',
        text: (last ? 'The last cycle, ' + last.id + ' for ' + money(last.amt) + ', is paid. ' : '') +
              (left
                ? hoursWord(left) + ' of it ' + (left === 1 ? 'is' : 'are') +
                  ' still booked, and nothing further will be charged.'
                : 'Nothing further will be charged.')
      });
    }

    return ui.notice({
      kind: 'ok',
      title: 'Nothing outstanding',
      text: (last ? last.id + ' for ' + money(last.amt) + ' is paid. ' : 'No invoice has been raised yet. ') +
            autopayLine(f)
    });
  }

  /* ---- the cycle card ------------------------------------------------------
     Each child's plan in hours, where they are in it, the dates they hold and
     the dates the next invoice covers. When a family has given notice the same
     card turns into the consequences of it — what is still theirs, which places
     come free and who inherits them — because those facts are only worth
     printing once they are real. */

  function cycleRows(f) {
    var rows = [];

    planKids(f).forEach(function (k) {
      var p = planOf(k);
      var on = invoiceDate(k);

      rows.push({
        title: esc(firstName(k.name) + ' · ' + p.hours + ' hours a month · ' + money0(p.price)),
        sub: esc(usedLine(p) + ' · ' + bookedLine(p)),
        end: ui.pill(hoursWord(p.leftHours) + ' left')
      });

      if (!on) {
        rows.push({
          title: esc(firstName(k.name) + ' has no class booked, so nothing is due'),
          sub: 'Book their day and time and the cycle starts from the first class.'
        });
        return;
      }

      rows.push({
        title: esc('The next invoice comes on ' + firstName(k.name) +
          '’s last class of this cycle, ' + dayMonth(on)),
        sub: esc('It covers ' + datesWords(nextCycle(p)) + ' — the same hours, every week.'),
        end: ui.pill(money0(p.price))
      });
    });

    return rows;
  }

  function noticeRows(f) {
    var rows = [];

    kidsOf(f.name).forEach(function (k) {
      var p = planOf(k);
      var classes = D.classesOf(k);

      if (p.isPlan) {
        var still = stampsOf(p.nextDates || []);
        rows.push({
          title: esc(firstName(k.name) + ' keeps ' + hoursWord(p.leftHours) + ' of this cycle'),
          sub: still.length
            ? esc('Already paid for, and booked for ' + datesWords(still) + '. Nothing further is charged.')
            : 'Already paid for. Nothing further is charged.'
        });
      }

      classes.forEach(function (c) {
        var waiting = waitingOn(c, f.name);
        rows.push({
          title: esc(firstName(k.name) + ' comes off ' + classShort(c) + ' when the cycle ends'),
          sub: esc(waiting.length
            ? 'The place goes to ' + waiting[0].child + ', first of ' + waiting.length + ' waiting.'
            : 'Nobody is waiting for that place.')
        });
      });

      if (!classes.length) {
        var w = waitlistEntry(k.name);
        if (w) {
          rows.push({
            title: esc(firstName(k.name) + ' comes off the ' + slotOf(w.cls) + ' waitlist'),
            sub: esc('Waiting since ' + w.joined + ', ' + ord(w.pos) + ' in line. The place is not held.')
          });
        }
      }
    });

    if (f.balance > 0) {
      rows.push({
        title: esc(money(f.balance) + ' still has to be collected'),
        sub: 'Notice stops the next cycle. It does not clear what is already owed.'
      });
    }

    return rows;
  }

  function cycleFoot(f, ending) {
    var year = '<span class="cell-mute">' +
      esc('Plans end with the school year, ' + D.PLAN_YEAR.ends + '.') + '</span>';

    if (ending) {
      return year + ui.btn({
        label: 'Keep the plan running',
        kind: 'quiet',
        size: 'sm',
        msg: 'Notice withdrawn · the plan runs to ' + D.PLAN_YEAR.ends
      });
    }

    var places = kidsOf(f.name).reduce(function (n, k) {
      return n + D.classesOf(k).length;
    }, 0);

    return year + ui.btn({
      label: 'Record 30 days notice',
      kind: 'danger',
      size: 'sm',
      msg: 'Notice recorded · the plan ends 30 days from today · ' + placeWord(places) + ' released'
    });
  }

  function cycleCard(f) {
    var ending = stopping(f);
    var sum = hoursSummary(f);

    /* Nothing runs on a cycle for a family that books camp and one-off classes,
       so there is no button here that would do anything. */
    if (!sum) {
      return ui.card({
        title: 'This cycle',
        head: ui.pill('No plan')
      }, ui.empty('Nothing on a plan',
        'No child in this family holds an After-School plan, so there is no cycle and no invoice ' +
        'to raise. Camp weeks, no-school days, privates and pop-ups are paid for as they are booked, ' +
        'and anything else goes on Post a sale.'));
    }

    if (ending) {
      return ui.card({
        title: 'Notice given',
        flush: true,
        head: ui.pill('Last cycle', 'warn'),
        note: D.RULES.cancelPlan + ' The hours already paid for stay theirs until the cycle ends.',
        foot: cycleFoot(f, true)
      }, ui.rows(noticeRows(f)));
    }

    return ui.card({
      title: 'This cycle',
      flush: true,
      head: h`<span class="inline">${raw(ui.pill(sum))}${raw(ui.pill(money0(planValue(f)) + ' a month'))}</span>`,
      note: cycleRule(),
      foot: cycleFoot(f, false)
    }, ui.rows(cycleRows(f)));
  }

  /* ---- family record ------------------------------------------------------ */

  /* What the desk is asked on the phone, in one line under the children. */
  function nextInvoiceFoot(f) {
    var k = nextInvoiceChild(f);
    if (!k) {
      /* Read after the words "Next invoice", so it answers that question
         rather than repeating the Plan row on the Billing card. */
      return kidsOf(f.name).filter(function (x) { return D.classesOf(x).length; }).length
        ? 'None — each booking is paid for when it is made'
        : 'Nothing booked yet';
    }
    if (stopping(f)) return 'Notice given · ' + hoursWord(hoursLeft(f)) + ' still booked';
    var on = invoiceDate(k);
    if (!on) return firstName(k.name) + ' has nothing booked this cycle';
    return firstName(k.name) + '’s last class, ' + dayMonth(on) + ' · ' + money0(planOf(k).price);
  }

  Grove.screen('familyRecord', {
    surface: 'console',
    crumbs: [{ label: 'Families', to: 'families' }],
    crumbTitle: 'Family record',
    title: function (ctx) { return fam(ctx).name + ' family'; },
    sub: function (ctx) {
      var f = fam(ctx);
      return f.guardian + ' · with us since ' + f.since;
    },
    actions: function (ctx) {
      var f = fam(ctx);
      return [
        { label: 'Message', to: 'newMessage' },
        { label: 'Post a sale', act: 'saleForFamily', id: f.id },
        ownsLedger(f)
          ? { label: 'Open the ledger', kind: 'primary', to: 'ledger' }
          : { label: 'Open in billing', kind: 'primary', to: 'billing' }
      ];
    },

    body: function (ctx) {
      var f = fam(ctx);
      var kids = kidsOf(f.name);
      var thread = threadOf(f);
      var inv = latestInvoiceOf(f);

      var children = ui.card({
        title: 'Children',
        flush: true,
        head: ui.btn({ label: 'Enroll a child', kind: 'quiet', size: 'sm', msg: 'Prototype — no form yet' }),
        foot: h`<span class="mute">Next invoice</span><span class="strong">${nextInvoiceFoot(f)}</span>`,
        note: 'A plan belongs to the child it was bought for, so each child holds their own hours and is invoiced on their own last class of the cycle.'
      }, kids.length
        ? ui.rows(kids.map(childRow))
        : ui.empty('Nobody on the register', 'The family has an account but no child is enrolled.'));

      var contact = ui.card({ title: 'Contact' }, h`
        ${raw(ui.kv([
          ['Guardian', esc(f.guardian)],
          ['Email', esc(f.email)],
          ['Phone', esc(f.phone)]
        ]))}
        <div class="card-split">
          ${raw(thread
            ? ui.notice({
                kind: thread.unread ? 'warn' : null,
                title: (thread.unread ? 'Waiting for a reply · ' : 'Last message · ') + thread.when,
                text: thread.last,
                action: { label: 'Open', to: 'thread', id: thread.id }
              })
            : ui.notice({
                title: 'No messages yet',
                text: 'Nothing has been sent to or from this family.'
              }))}
        </div>
      `);

      var docRows = documentRows(f);
      var chase = toChase(docRows);
      var docs = ui.card({
        title: 'Documents',
        head: chase
          ? h`<span class="inline">${raw(ui.pill(chase + ' to chase', 'warn'))}${raw(ui.btn({
              label: 'Send a reminder',
              kind: 'quiet',
              size: 'sm',
              msg: 'Reminder emailed to ' + f.email + ' · ' + chase + ' outstanding'
            }))}</span>`
          : ui.pill('All signed', 'ok'),
        note: 'A form counts as signed only when the signed copy is on file. Image permission is answered per child on the registration form, not once for the family.'
      }, ui.kv(docRows));

      /* One place where money is set, stating the studio-wide rules it follows
         rather than offering a second copy of them to edit. Each child's plan is
         here because each plan is its own invoice. */
      var moneyRows = [];
      var held = planKids(f);
      if (held.length) {
        held.forEach(function (k) {
          var p = planOf(k);
          var on = invoiceDate(k);
          moneyRows.push({
            k: firstName(k.name),
            v: esc(p.hours + ' hours a month · ' + money0(p.price) + ' · ' +
              (stopping(f)
                ? 'notice given'
                : (on ? 'invoiced on the last class of this cycle, ' + dayMonth(on) : 'nothing booked')))
          });
        });
      } else {
        moneyRows.push({ k: 'Plan', v: esc(noPlanLine(f)), tone: 'mute' });
      }
      var afterSchool = onAfterSchool(f);
      var relief = afterSchool && kids.length > 1;
      if (afterSchool) moneyRows.push(['Registration fee', esc(regFeeLine())]);
      if (relief) {
        moneyRows.push(['Sibling relief', esc(siblingRelief())]);
        moneyRows.push({ k: 'Applies to', v: esc(laterKids(kids)), tone: 'mute' });
      }
      moneyRows.push(['Payment method', esc(f.card)]);
      moneyRows.push({ k: 'Automatic billing', v: f.autopay ? 'On' : 'Off · invoiced by hand', tone: f.autopay ? null : 'mute' });
      if (inv) {
        moneyRows.push({ k: 'Latest invoice', v: esc(inv.id + ' · ' + money(inv.amt) + ' · ' + inv.status) });
        if (inv.status !== 'Paid') moneyRows.push({ k: 'Due', v: esc(inv.due), tone: 'clay' });
      } else {
        moneyRows.push({ k: 'Latest invoice', v: 'None raised yet', tone: 'mute' });
      }
      moneyRows.push({ k: 'Balance', v: esc(money(f.balance)), tone: f.balance > 0 ? 'clay' : null });

      var billing = ui.card({
        title: 'Billing',
        head: ui.btn({ label: 'Statement', kind: 'quiet', size: 'sm', msg: 'Statement emailed to ' + f.email }),
        note: (relief ? 'Sibling relief is on the registration fee, not on tuition. ' : '') +
          'Anything charged outside a plan — an extra class when their school finishes later, a private, an event — is one manual charge on the card above, posted from Post a sale.'
      }, ui.kv(moneyRows));

      return leadNotice(f) +
        '<div class="section">' + ui.grid(3, [children, contact, docs]) + '</div>' +
        '<div class="section">' + ui.grid(2, [billing, cycleCard(f)]) + '</div>';
    }
  });

  function fam(ctx) {
    return D.family(ctx.params.id) || D.family('okafor');
  }

  /* The one action for every exception the owner described, opened on the
     family she is already looking at. */
  Grove.on('saleForFamily', function (d) {
    Grove.setFilter('saleFam', d.id);
    Grove.go('postSale');
  });

  /* ---- student record ------------------------------------------------------- */

  /* Attendance and image permission are facts about the child rather than about
     any one of their classes, so they sit under the list of classes. */
  function toneClass(tone) {
    if (tone === 'clay') return 'clay strong';
    return tone === 'mute' ? 'mute' : 'strong';
  }

  function enrollmentFoot(s, perm) {
    return h`<span class="inline"><span class="mute">Attendance</span><span class="strong">${s.att}</span></span>` +
      h`<span class="inline"><span class="mute">Photo permission</span><span class="${raw(toneClass(perm.tone))}">${raw(perm.v)}</span></span>`;
  }

  /* The cycle, stated the way the desk says it out loud. */
  function cycleFootFor(s, p, ending) {
    if (ending) {
      return h`<span class="inline"><span class="mute">Notice</span><span class="strong">given</span></span>` +
        h`<span class="inline"><span class="mute">Still booked</span><span class="strong">${hoursWord(p.leftHours)}</span></span>`;
    }
    var on = invoiceDate(s);
    if (!on) {
      return h`<span class="inline"><span class="mute">Next invoice</span><span class="strong">nothing booked yet</span></span>`;
    }
    return h`<span class="inline"><span class="mute">Next invoice</span><span class="strong">${firstName(s.name) + '’s last class, ' + dayMonth(on)}</span></span>` +
      h`<span class="inline"><span class="mute">Then charges</span><span class="strong">${money0(p.price)}</span></span>`;
  }

  Grove.screen('studentRecord', {
    surface: 'console',
    crumbs: [{ label: 'Families', to: 'families' }],
    crumbTitle: 'Student record',
    title: function (ctx) { return stu(ctx).name; },
    sub: function (ctx) {
      var s = stu(ctx);
      return 'Age ' + s.age + ' · ' + s.band + ' · ' + s.family + ' family';
    },
    actions: [
      { label: 'Message the family', to: 'newMessage' },
      { label: 'Open the family', kind: 'primary', act: 'openFamily' }
    ],

    body: function (ctx) {
      var s = stu(ctx);
      var f = famByName(s.family);
      var doc = photoDoc(s.name);
      var mine = ownsDocs(f);
      var p = planOf(s);
      var ending = stopping(f);
      var missed = D.absencesFor(s.name);
      var extras = extrasFor(s.name);
      var siblings = kidsOf(s.family).filter(function (k) { return k.id !== s.id; });
      var classes = D.classesOf(s);
      var placed = classes.length > 0;
      /* Cillian sits in Thu 4:30pm and also holds a waitlist row for it. He has
         the place, so the place is what his record says. */
      var wait = placed ? null : waitlistEntry(s.name);

      var state = placed
        ? ui.pill(classes.length === 1
            ? 'On the register'
            : 'On the register · ' + classes.length + ' classes', 'ok')
        : (wait
            ? ui.pill('Waitlist · ' + ord(wait.pos) + ' of ' + waitlistDepth(wait), 'warn')
            : ui.pill('Not enrolled', 'warn'));

      /* One row per place the child holds, with the teacher who has them and the
         ages the class takes, because a child can be in an after-school hour, a
         camp week and a party at once. */
      var enrollment = ui.card({
        title: 'Enrollment',
        flush: true,
        head: state,
        foot: enrollmentFoot(s, docRow('Photo permission', doc && mine ? doc : null))
      }, placed
        ? ui.rows(classes.map(function (c) {
            return {
              title: esc(classShort(c)),
              sub: esc(classSub(c)),
              end: ui.mute(D.PROGRAMS[c.prog].short)
            };
          }))
        : (wait
            ? ui.empty('Waiting for ' + slotOf(wait.cls),
                ord(wait.pos) + ' of ' + waitlistDepth(wait) + ' in line, on the list since ' +
                wait.joined + '. The place is not held.')
            : ui.empty('Not in a class',
                'On the books with nothing booked. Enroll from the family record.')));

      var safety = ui.card({
        title: 'Safety',
        head: s.flag
          ? ui.pill(s.flagKind === 'bad' ? 'Medical alert' : 'Needs to know', s.flagKind)
          : ui.pill('No alerts', 'ok'),
        note: 'Shown to every teacher on the roster and on the attendance sheet for each class this child attends.'
      }, s.flag
        ? ui.notice({
            kind: s.flagKind,
            title: s.flag,
            text: 'Recorded on the registration form. It travels with the child to camp and to any extra class they book.'
          })
        : ui.notice({
            title: 'Nothing on file',
            text: 'No allergy, condition or medication has been recorded for this child.'
          }));

      /* The cycle itself: the dates the parent picked, in order, each one saying
         whether it has happened. This is the whole of what the hours buy. */
      var dated = (p.dates || []).slice().sort(function (a, b) {
        return byStamp(stamp(a.date), stamp(b.date));
      });

      var cycle = ui.card({
        title: 'This cycle',
        flush: true,
        head: p.isPlan
          ? h`<span class="inline">${raw(ui.pill(p.hours + ' hours a month · ' + money0(p.price)))}${raw(ui.pill(usedLine(p)))}</span>`
          : ui.pill(placed ? 'Camp and one-off bookings' : 'No plan'),
        foot: p.isPlan ? cycleFootFor(s, p, ending) : '',
        note: p.isPlan
          ? cycleRule()
          : 'No plan, so no cycle. Camp weeks, no-school days, privates and pop-ups are paid for as they are booked, and anything else is a manual charge on the family.'
      }, dated.length
        ? ui.rows(dated.map(function (x) {
            var c = classById(x.classId);
            return {
              title: esc(sessionLine(x)),
              sub: esc(c ? classShort(c) + ' · ' + c.staff : ''),
              end: x.state === 'attended' ? ui.pill('Attended', 'ok') : ui.pill('Booked')
            };
          }))
        /* A camp child is booked — the card above says so — they are simply not
           spending hours, so this cannot say nothing is booked. */
        : (p.isPlan
            ? ui.empty('No dates held',
                'The plan is held but no day and time has been picked, so the cycle has not started.')
            : ui.empty('No plan, no cycle', placed
                ? 'Everything ' + firstName(s.name) + ' holds is paid for when it is booked, so no hours are being spent here.'
                : 'Nothing is booked and no plan is held.')));

      /* Everything that has moved off the weekly place: the make-ups booked on
         top of it, and the classes missed, each one saying which way it went. */
      var moves = extras.map(function (x) {
        return {
          title: esc('Make-up class · ' + x.when),
          sub: esc(x.room + ' · ' + x.staff + ' · booked on top of the weekly place'),
          end: ui.pill('Booked', 'ok')
        };
      }).concat(missed.map(function (a) {
        var out = makeupOutcome(a);
        return {
          title: esc(a.date),
          sub: esc(a.reason),
          end: ui.pill(out.label, out.kind)
        };
      }));

      var makeups = ui.card({
        title: 'Make-ups',
        flush: true,
        head: (missed.length || extras.length)
          ? ui.pill(makeupLine(missed, extras.length))
          : ui.pill('Nothing missed', 'ok'),
        note: makeupRule()
      }, moves.length
        ? ui.rows(moves)
        : ui.empty('No make-ups', 'No class has been missed and no make-up is booked.'));

      var family = ui.card({
        title: 'Family',
        head: ui.pill(f.status, STATUS_KIND[f.status]),
        note: 'Money is recorded against the family. A plan belongs to one child, so each child is invoiced on their own last class of the cycle.'
      }, ui.kv([
        ['Guardian', esc(f.guardian)],
        ['Email', esc(f.email)],
        ['Phone', esc(f.phone)],
        siblings.length
          ? {
              k: siblings.length === 1 ? 'Brother or sister' : 'Brothers and sisters',
              v: esc(siblings.map(function (k) { return k.name + ' · age ' + k.age; }).join(', '))
            }
          : { k: 'Brothers and sisters', v: 'None on the books', tone: 'mute' },
        { k: 'Balance', v: esc(money(f.balance)), tone: f.balance > 0 ? 'clay' : null }
      ]));

      return ui.grid(2, [ui.col([enrollment, cycle]), ui.col([safety, makeups, family])]);
    }
  });

  function stu(ctx) { return D.student(ctx.params.id) || D.STUDENTS[0]; }
  function famByName(name) {
    return D.FAMILIES.filter(function (f) { return f.name === name; })[0] || D.FAMILIES[0];
  }

  Grove.on('openFamily', function () {
    var s = stu({ params: Grove.state.params });
    var f = famByName(s.family);
    Grove.go('familyRecord', { id: f.id });
  });
})();
