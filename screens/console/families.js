/* Console → Families: the list, one family's record, one child's record, plus
   Add family and Enroll a child.

   THIS PASS — TWO BUTTONS THAT WERE A TOAST ARE SCREENS

   "Add family" and "Enroll a child" both raised "Prototype — no form yet". A
   button that raises a toast is a table nobody remembers to build, so both are
   screens now and between them they name every field the two records need.

     - newFamily asks for the household, the first guardian, an optional second,
       and how they heard about us — that last list read off the heardVia values
       the families on the books already carry, ordered by how often it is the
       answer, and the one that points at another household then asks which. It
       does not ask for a child: a child needs a programme, a class, hours and a
       price, and that is the other screen. Three answers the studio already has
       are stated rather than asked — the day they joined is today, the plan year
       is D.PLAN_YEAR, and there is no card on file until the first invoice is
       paid
     - enrollChild asks for the child, the programme, the class and then the
       price — and the price question is whatever the programme's PRICING MODEL
       says it is. That is the answer to the owner's question about why some
       prices are "an hour" and some are "4 hours a month": she picks how a
       programme is priced when she builds it, and the enrolment then asks for
       that and nothing else. A plan asks for a tier in hours a month, a camp for
       nothing beyond the week it already holds, a private for the hours its own
       class record runs, a pop-up for the event on it, and a party for nothing
       at all because a party is quoted by hand. Classes are filtered to the
       child's age band, places left are counted off the roster, and a full class
       is never refused — it says it is full and offers the waitlist, which
       charges nothing

   A child's record no longer dead-ends either: "Not enrolled" now carries the
   button that fixes it, opened on that child.

   Console → Families: the list, one family's record, one child's record.

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
      { label: 'Add family', kind: 'primary', to: 'newFamily' }
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
        action: { label: 'Record a payment', to: 'recordPayment', id: f.id }
      });
    }

    if (f.balance > 0) {
      return ui.notice({
        kind: 'bad',
        title: money(f.balance) + ' owing',
        text: 'No open invoice covers it. Raise one in billing.',
        action: { label: 'Record a payment', to: 'recordPayment', id: f.id }
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
        head: ui.btn({ label: 'Enroll a child', kind: 'quiet', size: 'sm', to: 'enrollChild', id: f.id }),
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

      /* A child with no place was a dead end: the pill said "Not enrolled" and
         nothing on the page did anything about it. The way out is the enrolment
         screen, opened on this child. */
      if (!placed) {
        state = h`<span class="inline">${raw(state)}${raw(ui.btn({
          label: 'Enroll ' + firstName(s.name), kind: 'quiet', size: 'sm',
          to: 'enrollChild', id: s.id
        }))}</span>`;
      }

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
                'On the books with nothing booked. Enroll them above and pick the programme, ' +
                'the class and what it costs.')));

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

  /* ==========================================================================
     TWO SCREENS THAT USED TO BE A TOAST

     "Add family" and "Enroll a child" both raised "Prototype — no form yet".
     A button that raises a toast is a table nobody remembers to build, so both
     are screens now, and between them they name every field the two records
     need. Neither invents a figure: the fee, the relief, the plans, the week,
     the hour and the event price are all PRICING's, and which of those a screen
     asks for at all is the programme's pricing model.
     ========================================================================== */

  /* ---- add a family ---------------------------------------------------------
     The household, the people we ring and how they found us. No child is asked
     for: a child needs a programme, a class and a price, and that is the next
     screen. Three answers the studio already has are stated rather than asked —
     the day they joined is today, the plan year is D.PLAN_YEAR, and there is no
     card on file until the first invoice is paid. */

  /* The one vocabulary on these two screens the dataset does not carry. */
  var RELATIONSHIPS = ['Mother', 'Father', 'Grandparent', 'Guardian', 'Someone else'];

  Grove.on('nfSecond', function (d) { Grove.setFilter('nfSecond', d.id); });
  Grove.on('nfHeard', function (d) { Grove.setFilter('nfHeard', d.id); });

  function heardCount(label) {
    return D.FAMILIES.filter(function (f) { return f.heardVia === label; }).length;
  }

  /* The list the studio actually uses, read off the families already on the
     books and ordered by how often it is the answer. */
  function heardOptions() {
    var seen = {}, out = [];
    D.FAMILIES.forEach(function (f) {
      if (!f.heardVia || seen[f.heardVia]) return;
      seen[f.heardVia] = true;
      out.push(f.heardVia);
    });
    return out.sort(function (a, b) { return heardCount(b) - heardCount(a); });
  }

  /* One of those answers points at another household, so it asks which. */
  function heardSibling() {
    return heardOptions().filter(function (x) { return x.indexOf('Sibling') === 0; })[0] || '';
  }

  /* "Tuesday, 28 July 2026" → "28 July 2026". */
  function todayDate() {
    var bits = String(D.today).split(', ');
    return bits[bits.length - 1];
  }

  Grove.screen('newFamily', {
    surface: 'console',
    crumbs: [{ label: 'Families', to: 'families' }],
    crumbTitle: 'Add family',
    eyebrow: 'a new household',
    title: 'Add family',
    sub: 'The household and the people we ring. Children are added once the family exists, and ' +
         'the programme, the class, the hours and the price are chosen when a child is enrolled.',

    body: function () {
      var second = Grove.filter('nfSecond', '');
      var heard = Grove.filter('nfHeard', '');
      var sibling = heardSibling();

      var household = ui.card({
        title: 'The household',
        note: 'The family is the billing unit: one balance, one card and one statement, however ' +
              'many children are on it.'
      }, ui.fields(2, [
        ui.field({
          label: 'Family name',
          hint: 'What the studio calls them — the Delgado family.',
          control: ui.input({ placeholder: 'Surname' })
        }),
        ui.field({
          label: 'With us since',
          hint: 'Today. Change it only if they started earlier.',
          control: ui.date({ value: todayDate() })
        })
      ]));

      var guardian = ui.card({
        title: 'The first guardian',
        note: 'This is the name on the invoice, the login to the family portal and the address ' +
              'every receipt and reminder goes to.'
      }, ui.fields(2, [
        ui.field({
          label: 'Their name',
          control: ui.input({ placeholder: 'First and last name' })
        }),
        ui.field({
          label: 'Relationship to the children',
          control: ui.select({ options: RELATIONSHIPS, value: RELATIONSHIPS[0] })
        }),
        ui.field({
          label: 'Email',
          hint: 'Where the payment link and every receipt is sent.',
          control: ui.input({ type: 'email', placeholder: 'name@email.com' })
        }),
        ui.field({
          label: 'Phone',
          hint: 'The number staff ring first if something happens in class.',
          control: ui.input({ type: 'tel', placeholder: '(000) 000-0000' })
        })
      ]));

      /* The second guardian is a yes or no before it is four more boxes. */
      var secondCard = ui.card({
        title: 'Is there a second guardian?',
        note: 'A second guardian gets their own login and sees the same children. The balance, ' +
              'the card and the statement stay on the family.'
      }, ui.choices(null, [
        ui.choice({
          id: 'one', size: 'lg', act: 'nfSecond',
          title: 'No, one guardian for now',
          sub: 'You can add another at any time',
          on: second === 'one'
        }),
        ui.choice({
          id: 'two', size: 'lg', act: 'nfSecond',
          title: 'Yes, add a second',
          sub: 'A second name, email and number',
          on: second === 'two'
        })
      ]) + (second === 'two'
        ? h`<div class="card-split">${raw(ui.fields(2, [
            ui.field({
              label: 'Their name',
              control: ui.input({ placeholder: 'First and last name' })
            }),
            ui.field({
              label: 'Relationship to the children',
              control: ui.select({ options: RELATIONSHIPS, value: RELATIONSHIPS[1] })
            }),
            ui.field({
              label: 'Email',
              hint: 'Their own login. Both guardians see the same children.',
              control: ui.input({ type: 'email', placeholder: 'name@email.com' })
            }),
            ui.field({
              label: 'Phone',
              control: ui.input({ type: 'tel', placeholder: '(000) 000-0000' })
            })
          ]))}</div>`
        : ''));

      var heardCard = ui.card({
        title: 'How did they hear about the studio?',
        note: 'The only reason it is asked: it is the one number that says which flyer, which ' +
              'post and which family is worth the next one.'
      }, ui.choices(3, heardOptions().map(function (label) {
        return ui.choice({
          id: label, act: 'nfHeard',
          title: label,
          sub: heardCount(label) + ' families came this way',
          on: heard === label
        });
      })) + (sibling && heard === sibling
        ? h`<div class="card-split">${raw(ui.field({
            label: 'Which family sent them?',
            hint: 'It joins the two households, so the referral shows on both records.',
            control: ui.select({
              options: D.FAMILIES.map(function (f) { return f.name + ' family'; })
            })
          }))}</div>`
        : ''));

      var after = ui.card({
        title: 'What happens when you save',
        flush: true
      }, ui.rows([
        {
          title: 'The family appears on Families straight away',
          sub: 'With no child and no plan, so no invoice is raised and nothing is charged.'
        },
        {
          title: 'Children are added once the family exists',
          sub: 'Add each child, then enroll them. That is where the programme, the class, the ' +
               'hours and the price are chosen.'
        },
        {
          title: 'The registration fee is charged with the first enrolment',
          sub: esc(regFeeLine() + '. ' + siblingRelief() + '.'),
          end: ui.pill(money0(D.PRICING.as.regFee))
        },
        {
          title: 'No card is held yet',
          sub: 'The first invoice is emailed as a secure payment link, and the card they pay ' +
               'with becomes the card on file.'
        }
      ]));

      var base = D.POLICY_BASE;
      var welcome = ui.card({
        title: 'What the family gets',
        flush: true
      }, ui.rows([
        {
          title: 'A login to the family portal',
          sub: 'Their children, the schedule, the invoices and a way to message the studio.'
        },
        {
          title: esc('A registration form of ' + base.length + ' clauses to sign'),
          sub: esc('Starting with ' + listOf(base.slice(0, 3).map(lowerFirst)) + '. A programme ' +
            'adds or drops its own when a child is enrolled.'),
          end: ui.btn({ label: 'Read the clauses', kind: 'quiet', size: 'sm', to: 'settings' })
        },
        {
          title: esc('A plan year that ends ' + D.PLAN_YEAR.ends),
          sub: esc(D.PLAN_YEAR.note)
        }
      ]));

      /* Each question waits on the one above it, so the hint names whichever is
         still open rather than letting the form be saved half answered. */
      var missing = !second
        ? 'whether there is a second guardian'
        : (!heard ? 'how they heard about the studio' : '');

      return h`
        ${raw(ui.grid(null, [household, guardian, secondCard, heardCard]))}
        <div class="section">${raw(ui.grid(2, [after, welcome]))}</div>
        ${raw(ui.formActions([
          {
            label: 'Save the family',
            kind: 'primary',
            msg: 'Saved — the family is on the books. Add their children next.'
          },
          { label: 'Cancel', to: 'families' }
        ], {
          sticky: true,
          hint: missing
            ? 'Answer ' + missing + ' above, then save'
            : 'Nothing is charged by saving — the registration fee lands with the first enrolment'
        }))}
      `;
    }
  });

  /* ---- enroll a child --------------------------------------------------------
     The child, the programme, the class, then what it costs — and what it costs
     is asked in whatever terms the programme is priced in. That is the answer to
     the question the owner asked about price fields: she picks HOW a programme
     is priced when she builds it, and the enrolment then asks for that and only
     that. A class priced by the hour is never asked for a week. */

  Grove.on('enKid', function (d) { Grove.setFilter('enKid', d.id); });
  Grove.on('enProg', function (d) { Grove.setFilter('enProg', d.id); });
  Grove.on('enClass', function (d) { Grove.setFilter('enClass', d.id); });
  Grove.on('enTier', function (d) { Grove.setFilter('enTier', d.id); });

  function classesFor(prog) {
    return D.CLASSES.filter(function (c) { return c.prog === prog; });
  }

  /* Places left are counted off the roster, never written down, so this screen
     cannot offer a place the register does not have. */
  function placesLeft(c) {
    var n = c.cap - D.roster(c.id).length;
    return n > 0 ? n : 0;
  }
  function placeLabel(c) {
    var n = placesLeft(c);
    return n ? placeWord(n) + ' left' : 'Full · waitlist';
  }

  /* "5–7" and "8–11" are ranges, "8+" is a floor, "All" and "—" take anybody. */
  function bandRange(band) {
    var b = String(band);
    if (b === 'All' || b === '—') return { lo: 0, hi: 99 };
    if (b.charAt(b.length - 1) === '+') return { lo: Number(b.slice(0, -1)), hi: 99 };
    var p = b.split('–');
    return { lo: Number(p[0]), hi: Number(p[1] || p[0]) };
  }
  function fitsAge(c, s) {
    var r = bandRange(c.band);
    return s.age >= r.lo && s.age <= r.hi;
  }

  /* The classes in a programme this child could actually take: their age band,
     and not one they already hold. */
  function openTo(s, prog) {
    var held = D.classesOf(s);
    return classesFor(prog).filter(function (c) {
      if (!fitsAge(c, s)) return false;
      for (var i = 0; i < held.length; i++) if (held[i].id === c.id) return false;
      return true;
    });
  }

  /* How long a class runs, read off the time on its own record. Written for the
     afternoon classes it is used on — after-school hours and privates — where a
     bare hour before noon is a pm hour. Camp, no-school days and pop-ups are
     priced by the week, the day or the event and never ask. */
  function hourAt(t) {
    var mm = /(\d+):(\d+)/.exec(String(t));
    if (!mm) return 0;
    var hr = Number(mm[1]), min = Number(mm[2]);
    if (hr < 12) hr += 12;
    return hr + min / 60;
  }
  function classHours(c) {
    var p = String(c.time).split('–');
    var n = hourAt(p[1]) - hourAt(p[0]);
    return n > 0 ? n : 1;
  }

  /* ---- the tiers of a plan --------------------------------------------------- */

  function planTiers() { return Object.keys(D.PRICING.as.plans); }
  function planHoursOf(key) { return Number(String(key).slice(1)); }
  function lowestPlan() {
    var plans = D.PRICING.as.plans, lo = null;
    planTiers().forEach(function (k) { if (lo === null || plans[k] < lo) lo = plans[k]; });
    return lo;
  }
  /* The rate falls as the plan grows, so it is divided out rather than held. */
  function rateWords(price, hours) {
    var r = price / hours;
    return money(r, { cents: r !== Math.round(r) });
  }

  /* ---- what a programme costs, in its own terms ------------------------------- */

  /* The headline figure for a programme, in whatever unit it is priced in. */
  function headlinePrice(id) {
    var p = D.PRICING[id] || {};
    var model = D.pricingModel(id).id;
    if (model === 'plan') return 'from ' + money0(lowestPlan()) + ' a month';
    if (model === 'perWeek') return money0(p.week) + ' a week';
    if (model === 'perHour') return p.hourly ? money0(p.hourly) + ' an hour' : money0(p.base) + ' a day';
    if (model === 'perEvent') return money0(p.events[0].amount) + ' a child';
    return 'Quoted';
  }

  /* A pop-up class carries its event's name, which is how the two are joined. */
  function eventFor(c) {
    return (D.PRICING.pop.events || []).filter(function (e) {
      return String(c.name).indexOf(e.label) !== -1;
    })[0];
  }

  function kvRow(k, v, tone) { return { k: k, v: esc(v), tone: tone || null }; }

  /* A child who already holds a place has paid this year's registration fee. */
  function alreadyRegistered(s) {
    return D.classesOf(s).length > 0 || planOf(s).isPlan;
  }
  function regFeeOf(prog) { return (D.PRICING[prog] || {}).regFee || 0; }

  /* Relief is read against the second and third child on the family, in roster
     order — the same order the record's "Applies to" row names. */
  function siblingIndex(f, s) {
    var kids = kidsOf(f.name);
    for (var i = 0; i < kids.length; i++) if (kids[i].id === s.id) return i;
    return 0;
  }

  /* The whole charge, itemised. The tuition lines are whatever the programme's
     pricing model has: a tier, a week, an hour, an event, or nothing at all. */
  function chargeOf(f, s, prog, c, tier) {
    var p = D.PRICING[prog] || {};
    var model = D.pricingModel(prog).id;
    var rows = [], tuition = null, cur, next, hrs, ev;

    if (model === 'plan') {
      cur = planOf(s);
      next = p.plans[tier];
      tuition = next - (cur.isPlan ? cur.price : 0);
      rows.push(kvRow('Plan', hoursWord(planHoursOf(tier)) + ' a month · ' + money0(next)));
      rows.push(kvRow('Rate', rateWords(next, planHoursOf(tier)) + ' an hour'));
      rows.push(kvRow('This class spends', hoursWord(classHours(c)) + ' each time it runs'));
      if (cur.isPlan) {
        rows.push(kvRow('Already holds', hoursWord(cur.hours) + ' a month · ' + money0(cur.price), 'mute'));
        rows.push(tuition === 0
          ? kvRow('Tuition', 'No change — the hours come out of the plan already held', 'mute')
          : kvRow(tuition > 0 ? 'More tuition a month' : 'Less tuition a month', money(Math.abs(tuition))));
      } else {
        rows.push(kvRow('Tuition a month', money(next)));
      }

    } else if (model === 'perWeek') {
      tuition = p.week;
      rows.push(kvRow('Camp week', money(p.week)));
      rows.push(kvRow('If they come for part of it', money0(p.day) + ' a day', 'mute'));
      rows.push(kvRow('Extra hour', money0(p.extraHour) + ' an hour, per day', 'mute'));

    } else if (model === 'perHour' && p.hourly) {
      hrs = classHours(c);
      tuition = p.hourly * hrs;
      rows.push(kvRow(hoursWord(hrs) + ' at ' + money0(p.hourly) + ' an hour', money(tuition)));
      rows.push(kvRow('Longest booking', hoursWord(p.maxHours), 'mute'));

    } else if (model === 'perHour') {
      tuition = p.base;
      rows.push(kvRow('Day rate', money(p.base)));
      rows.push(kvRow('Each hour beyond it', money0(p.extraHour), 'mute'));
      rows.push(kvRow('Longest day', hoursWord(p.maxHours), 'mute'));

    } else if (model === 'perEvent') {
      ev = eventFor(c);
      tuition = ev ? ev.amount : null;
      rows.push(ev
        ? kvRow('Ticket', ev.label + ' · ' + money(ev.amount))
        : kvRow('Ticket', 'Priced on the programme', 'mute'));

    } else {
      rows.push(kvRow('Price fields', D.PRICING_MODELS.quoted.asks, 'mute'));
      rows.push(kvRow('What we send', 'A written quote, by email', 'mute'));
    }

    /* The fee, its relief, and the one case where neither is owed. */
    var fee = 0, relief = 0, idx = siblingIndex(f, s);
    if (alreadyRegistered(s)) {
      rows.push(kvRow('Registration fee', 'Already paid this program year', 'mute'));
    } else {
      fee = regFeeOf(prog);
      relief = (prog === 'as' && idx > 0 && idx < 3) ? fee * D.PRICING.as.siblingFeeRelief : 0;
      rows.push(kvRow('Registration fee', money(fee)));
      if (relief) {
        rows.push(kvRow('Sibling relief', '−' + money(relief), 'grove'));
        rows.push(kvRow('Because', firstName(s.name) + ' is the ' + ord(idx + 1) + ' child registered', 'mute'));
      }
    }

    var total = tuition === null ? null : tuition + fee - relief;
    return { rows: rows, tuition: tuition, fee: fee - relief, total: total, model: model };
  }

  /* ---- reading the screen's own state ------------------------------------------
     The screen opens on a family, from its record, or on one child, from theirs.
     Everything below it is validated against what that child can actually take,
     so switching child cannot leave a class from the other one selected. */

  function enrollFamily(ctx) {
    var f = D.family(ctx.params.id);
    if (f) return f;
    var s = D.student(ctx.params.id);
    return s ? famByName(s.family) : fam(ctx);
  }

  function enrollKid(ctx) {
    var f = enrollFamily(ctx);
    var kids = kidsOf(f.name);
    if (!kids.length) return null;
    var given = D.student(ctx.params.id);
    if (given && given.family === f.name) return given;
    if (kids.length === 1) return kids[0];
    var picked = Grove.filter('enKid', '');
    return kids.filter(function (k) { return k.id === picked; })[0] || null;
  }

  function enrollProg() {
    var id = Grove.filter('enProg', '');
    return D.PROGRAMS[id] ? id : '';
  }

  function enrollClass(s, prog) {
    var id = Grove.filter('enClass', '');
    return openTo(s, prog).filter(function (c) { return c.id === id; })[0] || null;
  }

  /* A child already on a plan has an answer to this one, so it starts on theirs. */
  function enrollTier(s) {
    var picked = Grove.filter('enTier', '');
    if (planTiers().indexOf(picked) !== -1) return picked;
    var cur = planOf(s);
    return cur.isPlan ? 'p' + cur.hours : '';
  }

  /* ---- the cards ---------------------------------------------------------------- */

  /* How many classes in a programme have a place for this child, said in the
     same breath as how that programme is priced. */
  function progSub(s, id) {
    var open = openTo(s, id).filter(function (c) { return placesLeft(c) > 0; }).length;
    return D.pricingModel(id).name + ' · ' +
      (open ? open + (open === 1 ? ' class with a place' : ' classes with a place')
            : 'nothing with a place right now');
  }

  /* Written out of the programmes themselves, so the line cannot drift from what
     the price table actually asks for. */
  function pricingNote() {
    return Object.keys(D.PROGRAMS).map(function (id) {
      return D.PROGRAMS[id].short + ' — ' + lowerFirst(D.pricingModel(id).name);
    }).join(' · ');
  }

  /* Where a full class would put them. A child already queueing for that class
     keeps the place they have rather than being counted in twice. */
  function waitPos(c, s, f) {
    var mine = waitlistEntry(s.name);
    if (mine && String(mine.cls).indexOf(classKey(c)) === 0) {
      return { pos: mine.pos, already: true };
    }
    return { pos: waitingOn(c, f.name).length + 1, already: false };
  }

  function afterRows(f, s, prog, c, full, charge, wait) {
    var rows = [];
    var clauses = Grove.policiesFor(prog);

    if (full && wait.already) {
      rows.push({
        title: esc(firstName(s.name) + ' is already ' + ord(wait.pos) + ' in line for ' +
          classShort(c)),
        sub: 'Nothing changes and nothing is charged. The place is offered the moment one ' +
             'comes free.'
      });
    } else if (full) {
      rows.push({
        title: esc(firstName(s.name) + ' joins the waitlist for ' + classShort(c)),
        sub: esc(ord(wait.pos) + ' in line. The place is not held, and nothing is charged ' +
          'until one is offered.')
      });
    } else {
      rows.push({
        title: 'The place comes off the roll',
        sub: esc(classShort(c) + ' goes to ' + (D.roster(c.id).length + 1) + ' of ' + c.cap +
          ', leaving ' + placeWord(placesLeft(c) - 1) + '.'),
        end: ui.btn({ label: 'Open the class', kind: 'quiet', size: 'sm', to: 'classRecord', id: c.id })
      });
    }

    rows.push(clauses.length
      ? {
          title: esc(clauses.length + ' clauses to sign'),
          sub: esc(listOf(clauses.slice(0, 3)) +
            (clauses.length > 3 ? ', and ' + (clauses.length - 3) + ' more' : '') +
            ' — the ' + D.PROGRAMS[prog].name + ' form.')
        }
      : {
          title: 'Nothing to sign',
          sub: esc(D.PROGRAMS[prog].name + ' carries no clauses, so there is no form to send.')
        });

    if (full) {
      rows.push({
        title: 'Nothing is charged today',
        sub: esc(charge.total === null
          ? 'If a place is offered we send a written quote to ' + f.email + '.'
          : 'If a place is offered, ' + money(charge.total) +
            ' is emailed as a secure payment link to ' + f.email + '.')
      });
    } else if (charge.total === null) {
      rows.push({
        title: 'A written quote, not an invoice',
        sub: esc('We price a party by hand and email the quote to ' + f.email + '.')
      });
    } else {
      rows.push({
        title: esc(money(charge.total) + ' invoiced'),
        sub: esc(f.autopay
          ? 'Charged to the card on file — ' + String(f.card).split(' · ')[0] + '.'
          : 'Emailed to ' + f.email + ' as a secure payment link. The card they pay with ' +
            'becomes the card on file.'),
        end: ui.pill(money(charge.total))
      });
    }

    if (charge.model === 'plan') {
      rows.push({
        title: esc('The plan runs to ' + D.PLAN_YEAR.ends),
        sub: esc(D.PLAN_YEAR.note + ' ' + D.RULES.unusedHours)
      });
    }

    return rows;
  }

  Grove.screen('enrollChild', {
    surface: 'console',
    crumbs: [{ label: 'Families', to: 'families' }],
    crumbTitle: 'Enroll a child',
    eyebrow: 'a place on the register',
    title: 'Enroll a child',
    sub: 'The child, the programme, then the class. What the price asks for follows the ' +
         'programme: a plan in hours a month for After-School, a one-off price for everything else.',
    actions: function (ctx) {
      var f = enrollFamily(ctx);
      return [{ label: 'Open the family', to: 'familyRecord', id: f.id }];
    },

    body: function (ctx) {
      var f = enrollFamily(ctx);
      var kids = kidsOf(f.name);

      if (!kids.length) {
        return ui.card({ title: 'The ' + f.name + ' family' },
          ui.empty('No child on the register',
            'The family has an account but nobody on the books. Add the child first, then ' +
            'come back and enroll them.')) +
          ui.formActions([
            { label: 'Open the family', kind: 'primary', to: 'familyRecord', id: f.id }
          ], { sticky: true, hint: 'There is nothing to enroll until a child is on the family' });
      }

      var s = enrollKid(ctx);
      var prog = s ? enrollProg() : '';
      var c = prog ? enrollClass(s, prog) : null;
      var model = prog ? D.pricingModel(prog).id : '';
      var tier = (c && model === 'plan') ? enrollTier(s) : '';
      var full = !!c && placesLeft(c) === 0;
      var wait = full ? waitPos(c, s, f) : null;
      var cards = [];

      /* One child on the family, or a record that named one: the studio already
         knows the answer, so it is stated rather than asked. */
      if (kids.length === 1 || (s && s.id === ctx.params.id)) {
        cards.push(ui.card({
          title: 'The child',
          flush: true,
          head: ui.pill(kids.length === 1 ? 'The only child on this family' : 'From their record')
        }, ui.rows([childRow(s)])));
      } else {
        cards.push(ui.card({
          title: 'Which child?',
          note: 'A plan belongs to the child it was bought for, so each child is enrolled and ' +
                'invoiced on their own.'
        }, ui.choices(2, kids.map(function (k) {
          var kp = planOf(k);
          return ui.choice({
            id: k.id, act: 'enKid',
            title: k.name,
            sub: 'Age ' + k.age + ' · ' + whereLine(k),
            price: kp.isPlan ? hoursWord(kp.hours) + ' a month' : '',
            on: !!(s && s.id === k.id)
          });
        }))));
      }

      if (s) {
        cards.push(ui.card({
          title: 'Which programme?',
          head: ui.btn({ label: 'Open Programs', kind: 'quiet', size: 'sm', to: 'programs' }),
          note: 'How a programme is priced is set on the programme itself, and that is what ' +
                'decides the price fields below. ' + pricingNote() + '.'
        }, ui.choices(3, Object.keys(D.PROGRAMS).map(function (id) {
          return ui.choice({
            id: id, act: 'enProg',
            title: D.PROGRAMS[id].name,
            sub: progSub(s, id),
            price: headlinePrice(id),
            on: prog === id
          });
        }))));
      }

      if (s && prog) {
        var open = openTo(s, prog);
        var held = D.classesOf(s).filter(function (x) { return x.prog === prog; }).length;
        cards.push(ui.card({
          title: 'Which class?',
          head: open.length
            ? ui.pill('Age ' + s.age + ' · ages ' + s.band)
            : h`<span class="inline">${raw(ui.pill('Age ' + s.age + ' · ages ' + s.band))}${raw(
                ui.btn({ label: 'Open Classes', kind: 'quiet', size: 'sm', to: 'classes' })
              )}</span>`,
          note: 'Only classes that take a child of ' + s.age + ' are listed' +
            (held ? ', and the ' + (held === 1 ? 'one' : held) + ' ' +
              firstName(s.name) + ' already holds ' + (held === 1 ? 'is' : 'are') + ' not.' : '.') +
            (open.length
              ? ' Places left are counted off the roster. A full class is not refused — it ' +
                'offers the waitlist instead.'
              : '')
        }, open.length
          ? ui.choices(2, open.map(function (x) {
              return ui.choice({
                id: x.id, act: 'enClass',
                title: classShort(x),
                sub: classSub(x) + ' · ' + D.roster(x.id).length + ' of ' + x.cap + ' on the roll',
                price: placeLabel(x),
                on: !!(c && c.id === x.id)
              });
            }))
          : ui.empty('Nothing on the books for ' + firstName(s.name),
              'No ' + D.PROGRAMS[prog].short + ' class takes a child of ' + s.age +
              ' that they do not already hold. Create one in Classes and come back.')));
      }

      /* The plan question, and only for a programme that is priced as a plan. */
      if (c && model === 'plan') {
        var cur = planOf(s);
        cards.push(ui.card({
          title: 'How many hours a month?',
          head: ui.pill(D.PRICING_MODELS.plan.name),
          note: cur.isPlan
            ? firstName(s.name) + ' holds ' + hoursWord(cur.hours) + ' a month already. This ' +
              'class spends ' + hoursWord(classHours(c)) + ' each time it runs, out of those ' +
              'hours — raise the tier only if they no longer cover it.'
            : 'A plan is hours a month, not classes: this one spends ' + hoursWord(classHours(c)) +
              ' each time it runs. The rate per hour falls as the plan grows.'
        }, ui.choices(2, planTiers().map(function (k) {
          var amt = D.PRICING.as.plans[k];
          return ui.choice({
            id: k, act: 'enTier',
            title: hoursWord(planHoursOf(k)) + ' a month',
            sub: rateWords(amt, planHoursOf(k)) + ' an hour' +
              (cur.isPlan && planHoursOf(k) === cur.hours ? ' · what they hold now' : ''),
            price: money0(amt),
            on: tier === k
          });
        }))));
      }

      /* The money, once there is enough to price. */
      var ready = !!(c && (model !== 'plan' || tier));
      var charge = ready ? chargeOf(f, s, prog, c, tier) : null;

      if (ready) {
        /* The fee rule is stated on every enrolment, and the sentence names the
           programme's own fee before the plan's — a camp week is not charged
           After-School's $130, and a child who registered earlier in the year
           is not charged it twice. */
        var fee = regFeeOf(prog);
        var feeNote = prog === 'as'
          ? 'The registration fee is ' + regFeeLine() + ', so a child who registered earlier ' +
            'in the year pays it once. ' + siblingRelief() + '.'
          : (fee
              ? D.PROGRAMS[prog].name + ' carries its own ' + money0(fee) + ' registration fee, ' +
                (alreadyRegistered(s)
                  ? 'and ' + firstName(s.name) + ' has already paid it this year.'
                  : 'charged with this booking.')
              : D.PROGRAMS[prog].name + ' carries no registration fee.') +
            ' Only a plan carries the ' + D.PROGRAMS.as.name + ' fee of ' + regFeeLine() +
            ', and the second and third child get ' + (D.PRICING.as.siblingFeeRelief * 100) +
            '% off it.';

        var rows = charge.rows.concat([
          kvRow(full ? 'If a place is offered' : 'Total',
            charge.total === null ? 'Quoted by hand' : money(charge.total),
            charge.total === null ? 'mute' : null)
        ]);
        if (full) rows.push(kvRow('Due today', money(0), 'mute'));

        cards.push('SPLIT');
        cards.push(ui.card({
          title: full
            ? 'What it would cost'
            : (charge.total === null ? 'How this is priced' : 'What will be charged'),
          head: full ? ui.pill('Full · waitlist', 'warn') : ui.pill(D.pricingModel(prog).name),
          note: feeNote
        }, ui.kv(rows)));
        cards.push(ui.card({
          title: 'What happens when you save',
          flush: true
        }, ui.rows(afterRows(f, s, prog, c, full, charge, wait))));
      }

      /* The bar names whichever question is still open, and once they are all
         answered it says what saving does. */
      var next = !s ? 'the child'
        : (!prog ? 'the programme'
        : (!c ? 'the class'
        : (model === 'plan' && !tier ? 'how many hours a month' : '')));

      var label = !s ? 'Enroll the child'
        : (full
            ? (wait.already ? 'Already on the waitlist' : 'Add ' + firstName(s.name) + ' to the waitlist')
            : 'Enroll ' + firstName(s.name));

      var msg;
      if (!ready) {
        msg = 'Pick ' + next + ' first';
      } else if (full && wait.already) {
        msg = 'No change · ' + firstName(s.name) + ' is already ' + ord(wait.pos) +
          ' in line for ' + classShort(c);
      } else if (full) {
        msg = 'On the waitlist · ' + firstName(s.name) + ' is ' + ord(wait.pos) +
          ' in line for ' + classShort(c) + ' · nothing charged';
      } else if (charge.total === null) {
        msg = 'Booking saved · a written quote goes to ' + f.email;
      } else {
        msg = 'Enrolled · ' + firstName(s.name) + ' is on ' + classShort(c) + ' · ' +
          money(charge.total) + ' invoiced to ' + f.email;
      }

      var hint;
      if (!ready) {
        hint = 'Pick ' + next + ' above, then enroll';
      } else if (full && wait.already) {
        hint = firstName(s.name) + ' is already on this list, so there is nothing to add';
      } else if (full) {
        hint = 'Nothing is charged while they wait — we ring the moment a place comes free';
      } else if (charge.total === null) {
        hint = 'A party is priced by hand, so saving sends a written quote and charges nothing';
      } else {
        hint = money(charge.total) + (f.autopay
          ? ' is charged to the card on file'
          : ' is emailed to ' + f.email + ' as a secure payment link');
      }

      /* Everything above the money runs down the page one question at a time;
         the money and its consequences sit two abreast under it. */
      var stack = [], pair = [], seen = false;
      cards.forEach(function (x) {
        if (x === 'SPLIT') { seen = true; return; }
        (seen ? pair : stack).push(x);
      });

      return h`
        ${raw(ui.grid(null, stack))}
        ${raw(pair.length ? '<div class="section">' + ui.grid(2, pair) + '</div>' : '')}
        ${raw(ui.formActions([
          { label: label, kind: 'primary', msg: msg },
          { label: 'Cancel', to: 'familyRecord', id: f.id }
        ], { sticky: true, hint: hint }))}
      `;
    }
  });
})();
