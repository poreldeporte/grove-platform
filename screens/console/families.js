/* Console → Families: the list, one family's record, one child's record.

   Written for Sabrina, who owns the studio. She is at a desk with a real
   keyboard and she reads a table faster than she reads a card, so the list
   stays a table and the records stay dense. What came out of these screens is
   ceremony, not density.

   THIS PASS — packs, not months
     - a family does not pay a monthly rate here. A child holds a pack of
       sessions, they attend, and on the last session in the pack it charges
       again and grants another pack the same size. So nothing on these three
       screens is a date: the next charge is a number of classes away, read off
       D.pack, and the desk can answer "when am I charged again?" from the
       Packs column without opening anything
     - a pack belongs to ONE child. Emma holds eight and Lucas four, and they
       renew on their own classes, so the list states the sizes the children
       actually hold rather than FAMILIES.plan, which totals two packs of four
       into "Pack of 8" for half the roll. Billing names each child, their
       countdown and what that renewal costs, from PRICING
     - make-up credits are gone, because the rule that created them is gone.
       Tell the studio more than 24 hours ahead and the session simply stays in
       the pack — the pack lasts a week longer. Inside 24 hours it is spent, as
       if they came. So there is no credit to hold, approve, book or expire:
       the Credits column, the credit tally, the credit pill vocabulary and the
       link into the make-up queue all came out. The child's record now shows
       the absences themselves, each one saying whether it cost a session, and
       the catch-up class Emma booked on top of her weekly place, which spends
       a session like any other class
     - sessions never expire, so no expiry date is printed anywhere
     - a family that holds no pack — camp and one-off bookings, or a
       registration not yet paid — is not offered a button that would stop
       nothing. That card states that nothing renews and stops
     - "membership" was the wrong word twice over: a family is not a member,
       and cancelling is not an event on a calendar. They stop the renewal, use
       the sessions they have already paid for, and the pack does not charge
       again. The card is Renewal, and it states the sessions each child keeps
       before it states the places that come free.

   Cut in the owner pass, still cut:
     - "Billing exceptions" is gone as a card. It held two per-family
       overrides of studio-wide settings: "Send bills by post", whose answer
       was always no because the studio emails, and "Skip automatic billing",
       which is the same decision as FAMILIES.autopay written a second time.
       Autopay is now stated as the fact it already is, in Billing
     - the sibling rule stays, because it is money, but it sits with the rest
       of the money and only appears on a family with more than one child. A
       row reading "None — one child on the books" is not information
     - the three pills under the title (status, autopay, owing) said one thing
       three ways and none of them said what to do about it. They are one
       notice at the top naming the open invoice, the amount, the due date and
       the reason it failed, with "Record a payment" on it
     - "Record a payment" left the header. It appears only when something is
       actually owed, beside the amount it refers to
     - the list's "Active" chip was the exact complement of "Needs attention" —
       four chips for three decisions. Three chips now, and the renewal tally
       went into the count line rather than becoming a fourth
     - the Students tab filters on the two things she acts on: a safety note
       before a camp day, and a child on the books with no place
     - Documents report whether a signed copy is on file, not the studio's
       version numbers, and the head counts what is left to chase.

   Consequences, because there is nobody behind her to undo anything:
     - stopping a renewal states, before the button, the sessions each child
       keeps, every place that comes free and who inherits it, that the balance
       is still owed afterwards, and what is kept. All of it derived
     - a family already not renewing is not offered it again. It is offered the
       only decision left, which is to keep the packs renewing.

   Standing decisions from earlier passes, still true:
     - the register is the join: a child's classes come from D.classesOf, never
       from the free-text line under their name
     - the Children column is derived from the children on the books, so it
       cannot disagree with the Students tab beside it
     - a document is reported signed only on the record of the family whose
       signature Grove.data carries
     - the sibling rule is read from PRICING, the one place the studio keeps it
     - "Open the ledger" is offered only to the family whose ledger Grove.data
       holds; every other family opens Billing
     - no sticky action bar on these three screens. None of them exists to
       complete one action — they are a list and two records, and the actions
       belong beside the rows they act on. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

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

  /* ---- derivations --------------------------------------------------------
     Everything these screens state about a family is read back out of
     Grove.data here, so one fact cannot be written two ways on two screens. */

  function currentTab() { return Grove.tab(TAB_KEY, T_FAMILIES); }

  function kidsOf(name) {
    return D.STUDENTS.filter(function (s) { return s.family === name; });
  }

  function firstName(name) { return String(name).split(' ')[0]; }

  function ord(n) {
    var end = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (end[(v - 20) % 10] || end[v] || end[0]);
  }

  function sumBalance(list) {
    return list.reduce(function (n, f) { return n + f.balance; }, 0);
  }

  /* A filtered table says how much of the whole it is showing. It is a readout
     of the search box and the chips above it, so with nothing filtered out it
     states the total and stops. */
  function countLine(shown, total, word) {
    return (shown === total ? String(total) : shown + ' of ' + total) + ' ' + word;
  }

  /* The Children column and the Students tab have to be the same set of
     people, so the column lists the children on the books rather than a
     written-out line that can drift away from the roster. */
  function childNames(f) {
    return kidsOf(f.name).map(function (s) {
      return firstName(s.name) + ' (' + s.age + ')';
    }).join(', ');
  }

  function lowerFirst(s) { return s.charAt(0).toLowerCase() + s.slice(1); }

  /* ---- packs ---------------------------------------------------------------
     A pack is bought for one child. They attend, and on the last session in
     the pack it charges again for another pack the same size. Nothing here is
     a date, and nothing expires: every figure is D.pack read off the child. */

  function packKids(f) {
    return kidsOf(f.name).filter(function (k) { return D.pack(k).isPack; });
  }

  /* "Pack of 8", "Packs of 8 and 4" — the sizes the children actually hold. */
  function packSummary(f) {
    var sizes = packKids(f).map(function (k) { return D.pack(k).size; });
    if (!sizes.length) return '';
    if (sizes.length === 1) return 'Pack of ' + sizes[0];
    return 'Packs of ' + sizes.slice(0, -1).join(', ') + ' and ' + sizes[sizes.length - 1];
  }

  /* How far off the next charge is, counted in classes rather than days. */
  function renewsIn(p) {
    return p.renewsIn <= 1 ? 'on the next class' : 'in ' + p.renewsIn + ' classes';
  }

  function toGoLine(p) {
    return p.renewsIn <= 1
      ? 'renews on the next class'
      : p.renewsIn + ' to go before it renews';
  }

  function usedLine(p) {
    return p.used + ' of ' + p.size + ' used';
  }

  function sessionWord(n) {
    return n === 1 ? '1 session' : n + ' sessions';
  }

  /* What another pack of that size costs. The studio keeps pack prices in
     PRICING and no screen sets a rate of its own. */
  function packPrice(p) {
    var amt = D.PRICING.as.plans['p' + p.size];
    return amt === undefined ? '' : Grove.money(amt, { cents: false });
  }

  /* A family that has asked not to renew keeps its sessions and stops there,
     so nothing on these screens counts it towards a charge that is coming. */
  function notRenewing(f) { return f.status === 'Cancelling'; }

  function sessionsLeft(f) {
    return packKids(f).reduce(function (n, k) { return n + D.pack(k).left; }, 0);
  }

  /* The pack that charges soonest — what the desk is asked on the phone. */
  function nextRenewal(f) {
    return packKids(f).sort(function (a, b) {
      return D.pack(a).renewsIn - D.pack(b).renewsIn;
    })[0];
  }

  function renewalLine(f) {
    var k = nextRenewal(f);
    if (!k) return '';
    return notRenewing(f)
      ? 'Not renewing · ' + sessionWord(sessionsLeft(f)) + ' left'
      : firstName(k.name) + ' renews ' + renewsIn(D.pack(k));
  }

  /* A family whose next class takes the last session in a pack is a charge
     about to happen, which is the one thing worth counting on the list. */
  function renewingNext(f) {
    if (notRenewing(f)) return false;
    return packKids(f).filter(function (k) { return D.pack(k).renewsIn <= 1; }).length > 0;
  }

  /* The pack line on a child, as the desk says it: what is left, and whether
     anything is coming after it. */
  function packSub(s) {
    var p = D.pack(s);
    var f = famByName(s.family);
    return f && notRenewing(f)
      ? sessionWord(p.left) + ' left · not renewing'
      : toGoLine(p);
  }

  /* ---- classes -------------------------------------------------------------
     D.classesOf is the join. A class's own record is where its day, its room
     and its teacher live, so no screen has to take a class apart from a
     sentence somebody typed. */

  /* A class named the way the timetable prints it. An after-school hour is its
     day, its time and its room; a camp week, a pop-up or a party carries its
     own name instead, because two camp weeks share a room and an hour and only
     the name tells them apart. */
  function classShort(c) {
    return c.prog === 'as' ? c.day + ' ' + c.time + ' · ' + c.room : c.name;
  }

  /* The line under that name: when and where it runs if the name has not said
     so, who teaches it, and which ages it takes. */
  function classSub(c) {
    var out = c.prog === 'as' ? '' : c.day + ' ' + c.time + ' · ' + c.room + ' · ';
    out += c.staff;
    if (c.band && c.band !== '—') out += ' · ages ' + c.band;
    return out;
  }

  /* Where a child is, in one line: every class they hold, or the queue they
     are standing in, or nothing booked at all. Search reads this too, so
     typing a room or a camp week finds the children in it. */
  function whereLine(s) {
    var classes = D.classesOf(s);
    if (classes.length) return classes.map(classShort).join(' · ');
    var w = waitlistEntry(s.name);
    return w ? 'Waitlisted · ' + slotOf(w.cls) : 'Not yet enrolled';
  }

  /* ---- waitlist ------------------------------------------------------------
     A waitlist row still names its class in words — "Mon 3:15pm · Ages 8–11" —
     so it is joined on the class's own day and start time, which is the key
     the dataset counts a class's queue with. */

  function classKey(c) { return c.day + ' ' + String(c.time).split('–')[0]; }

  function slotOf(text) {
    var parts = String(text).split(' · ');
    return parts[0] === 'Waitlisted' ? (parts[1] || '') : parts[0];
  }

  function waitlistEntry(childName) {
    return D.WAITLIST.filter(function (w) { return w.child === childName; })[0];
  }

  /* How long the queue this child is standing in actually is. */
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

  /* ---- absences ------------------------------------------------------------
     There is no credit to hold. An absence either cost a session or it did
     not, and that is the whole of it. */

  function extrasFor(name) {
    return D.EXTRA_CLASSES.filter(function (x) { return x.child === name; });
  }

  /* "2 kept · 1 spent" — how the absences a child has behind them landed. */
  function absenceLine(list) {
    var kept = list.filter(function (a) { return !a.spent; }).length;
    var spent = list.length - kept;
    var parts = [];
    if (kept) parts.push(kept + ' kept');
    if (spent) parts.push(spent + ' spent');
    return parts.join(' · ');
  }

  /* One child, as the register has them. A name on a family record opens that
     child's record rather than sitting there as a line of text. */
  function childRow(s) {
    var classes = D.classesOf(s);
    var p = D.pack(s);
    var end = '';
    if (!classes.length) {
      end = ui.pill(waitlistEntry(s.name) ? 'Waitlist' : 'Not enrolled', 'warn');
    } else if (s.flag) {
      end = ui.pill(s.flag, s.flagKind === 'bad' ? 'bad' : 'warn');
    } else if (p.isPack) {
      end = ui.mute(packSub(s));
    }
    return {
      title: esc(s.name),
      sub: esc('Age ' + s.age + ' · ' + whereLine(s) +
        (p.isPack ? ' · ' + usedLine(p) : '')),
      end: end,
      to: 'studentRecord', id: s.id
    };
  }

  /* The studio keeps one sibling rule, in Settings, and every screen quotes
     it from the same place rather than restating it in its own words. */
  function siblingRelief() {
    var r = D.PRICING.as.siblingRelief;
    return r.charAt(0).toUpperCase() + r.slice(1);
  }

  /* Relief is read against the second and third registration, so it names the
     children after the first — from the roster, never written out by hand. */
  function laterKids(kids) {
    return kids.slice(1).map(function (k) { return k.name; }).join(', ');
  }

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

  /* Grove.data carries one family's paperwork and one family's ledger — the
     family whose guardian signed, and whose children those lines name. A
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
        ? 'Every child on the books: the classes they sit in, what a teacher has to know before they walk in, and how close their pack is to renewing.'
        : 'The family is the billing unit, but a pack belongs to one child: two children renew on their own classes and are charged separately.';
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

  /* The packs the children hold, and the one that charges first. A family with
     no pack pays for what it books, which is a fact worth stating rather than
     a blank cell. */
  function packCell(f) {
    var sum = packSummary(f);
    if (sum) return ui.two(sum, renewalLine(f));
    var booked = kidsOf(f.name).filter(function (k) { return D.classesOf(k).length; }).length;
    return booked ? ui.mute('Camp and one-off bookings') : '<span class="mute">—</span>';
  }

  function familiesTab() {
    var q = Grove.query('families');
    var filter = Grove.filter('families', F_ALL);

    var rows = D.FAMILIES.filter(function (f) {
      if (!Grove.match(q, f.name, f.guardian, f.email, childNames(f), f.phone, packSummary(f))) return false;
      if (filter === F_OWING) return f.balance > 0;
      if (filter === F_ATTENTION) return f.status !== 'Active';
      return true;
    });

    /* Tallied off the rows on screen, so filtering the list re-states what
       that list is worth rather than repeating a page total. On the Owing chip
       every row is already owing, so only the money is worth saying twice. */
    var owing = rows.filter(function (f) { return f.balance > 0; });
    var renewing = rows.filter(renewingNext);
    var count = countLine(rows.length, D.FAMILIES.length, 'families');
    if (owing.length) {
      count += ' · ' + (filter === F_OWING
        ? Grove.money(sumBalance(owing)) + ' owing'
        : owing.length + ' owing ' + Grove.money(sumBalance(owing)));
    }
    if (renewing.length) count += ' · ' + renewing.length + ' renew on the next class';

    var table = ui.table(
      ['Family', 'Children', 'Contact', 'Packs', { label: 'Balance', align: 'right' }, { label: 'Status', shrink: true }],
      rows.map(function (f) {
        var kids = childNames(f);
        return {
          to: 'familyRecord', id: f.id,
          cells: [
            ui.two(f.name + ' family', f.guardian),
            kids ? ui.mute(kids) : '<span class="mute">None yet</span>',
            ui.two(f.email, f.phone),
            packCell(f),
            '<span class="' + (f.balance > 0 ? 'clay strong' : 'mute') + '">' + Grove.money(f.balance) + '</span>',
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
      var p = D.pack(s);
      if (!Grove.match(q, s.name, s.family, s.band, whereLine(s),
        p.isPack ? 'Pack of ' + p.size : 'camp and one-off bookings')) return false;
      if (filter === S_SAFETY) return !!s.flag;
      if (filter === S_UNPLACED) return D.classesOf(s).length === 0;
      return true;
    });

    var flagged = rows.filter(function (s) { return !!s.flag; }).length;
    var renewing = rows.filter(function (s) {
      var p = D.pack(s);
      var f = famByName(s.family);
      return p.isPack && p.renewsIn <= 1 && !(f && notRenewing(f));
    }).length;
    var count = countLine(rows.length, D.STUDENTS.length, 'children');
    if (flagged && filter !== S_SAFETY) count += ' · ' + flagged + ' with a safety note';
    if (renewing) count += ' · ' + renewing + ' renew on the next class';

    var table = ui.table(
      ['Child', 'Family', 'Class', 'Safety', { label: 'Attendance', align: 'right' }, 'Pack'],
      rows.map(function (s) {
        var p = D.pack(s);
        return {
          to: 'studentRecord', id: s.id,
          cells: [
            ui.two(s.name, 'Age ' + s.age + ' · ' + s.band),
            ui.mute(s.family),
            classCell(s),
            s.flag ? ui.pill(s.flag, s.flagKind) : '<span class="mute">—</span>',
            '<span class="num">' + esc(s.att) + '</span>',
            p.isPack
              ? ui.two(usedLine(p), packSub(s))
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
     One notice, stating the open invoice it is about. Everything it says is
     read off that invoice, so it cannot claim a failure the ledger does not
     have, and the money action sits on it rather than in the header where the
     amount is not visible. */

  function autopayLine(f) {
    return f.autopay
      ? 'The card on file is charged when a pack renews — ' + String(f.card).split(' · ')[0] + '.'
      : 'Autopay is off, so a renewal is invoiced by hand.';
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
        title: inv.status + ' · ' + Grove.money(inv.amt) + ' owing',
        text: inv.id + ' · due ' + dueLine(inv.due) + ' · ' + inv.note,
        action: { label: 'Record a payment', msg: 'Payment recorded · receipt emailed to ' + f.email }
      });
    }

    if (f.balance > 0) {
      return ui.notice({
        kind: 'bad',
        title: Grove.money(f.balance) + ' owing',
        text: 'No open invoice covers it. Raise one in billing.',
        action: { label: 'Record a payment', msg: 'Payment recorded · receipt emailed to ' + f.email }
      });
    }

    var last = latestInvoiceOf(f);

    if (f.status === 'Cancelling') {
      var left = sessionsLeft(f);
      return ui.notice({
        title: 'Not renewing',
        text: (last ? 'The last pack, ' + last.id + ' for ' + Grove.money(last.amt) + ', is paid. ' : '') +
              (left
                ? sessionWord(left) + (left === 1 ? ' is' : ' are') +
                  ' left to use, and nothing further will be charged.'
                : 'Nothing further will be charged.')
      });
    }

    return ui.notice({
      kind: 'ok',
      title: 'Nothing outstanding',
      text: (last ? last.id + ' for ' + Grove.money(last.amt) + ' is paid. ' : 'No invoice has been raised yet. ') +
            autopayLine(f)
    });
  }

  /* ---- what stopping the renewal does -------------------------------------
     The sessions already paid for stay theirs, so this states them first, then
     the named places that come free and who inherits each one, then the money
     still owed. She has nobody to undo this for her, so it is all on the
     screen before the button rather than in a toast. */

  function renewalRows(f, ending) {
    var rows = [];

    kidsOf(f.name).forEach(function (k) {
      var p = D.pack(k);
      var classes = D.classesOf(k);

      if (p.isPack) {
        rows.push({
          title: esc(k.name + ' keeps ' + sessionWord(p.left)),
          sub: 'Already paid for, and sessions do not expire. The pack does not charge again once they are used.'
        });
      }

      if (classes.length) {
        classes.forEach(function (c) {
          var waiting = waitingOn(c, f.name);
          rows.push({
            title: esc(k.name + ' comes off ' + classShort(c) +
              (p.isPack && c.prog === 'as' ? ' when the pack runs out' : '')),
            sub: esc(waiting.length
              ? 'The place goes to ' + waiting[0].child + ', first of ' + waiting.length + ' waiting.'
              : 'Nobody is waiting for that place.')
          });
        });
        return;
      }

      var w = waitlistEntry(k.name);
      if (w) {
        rows.push({
          title: esc(k.name + ' comes off the ' + slotOf(w.cls) + ' waitlist'),
          sub: esc('Waiting since ' + w.joined + ', ' + ord(w.pos) + ' in line. The place is not held.')
        });
      }
    });

    if (f.balance > 0) {
      rows.push({
        title: esc(Grove.money(f.balance) + ' still has to be collected'),
        sub: 'This stops the next charge. It does not clear what is already owed.'
      });
    }

    rows.push(ending
      ? {
          title: 'No further charge is taken',
          sub: 'The family keeps portal access while the sessions last. Invoices, documents and messages are kept.'
        }
      : {
          title: 'The pack does not renew',
          sub: 'They use what they have paid for and nothing is charged after that. Invoices, documents and messages are kept.'
        });

    return rows;
  }

  function renewalFoot(f, ending) {
    if (ending) {
      return '<span class="mute">Everything above is already agreed.</span>' +
        ui.btn({ label: 'Keep the packs renewing', msg: 'Renewal kept · the packs charge as before' });
    }

    /* Places, not children: a child in a camp week and an after-school hour
       gives up two of them. Counted off the roll. */
    var places = kidsOf(f.name).reduce(function (n, k) {
      return n + D.classesOf(k).length;
    }, 0);
    var left = sessionsLeft(f);
    var said = ['Renewal stopped · nothing further will be charged'];
    if (left) said.push(sessionWord(left) + ' left to use');
    said.push(places === 1 ? '1 place released' : places + ' places released');

    return '<span class="mute">All of it happens at once, and there is no undo.</span>' +
      ui.btn({ label: 'Stop the renewal', kind: 'danger', msg: said.join(' · ') });
  }

  function renewalCard(f) {
    var ending = notRenewing(f);
    var sum = packSummary(f);

    /* Nothing renews for a family that books camp and one-off classes, so
       there is no button here that would do anything. */
    if (!sum) {
      return ui.card({
        title: 'Renewal',
        head: ui.pill('Nothing renewing')
      }, ui.empty('No pack to stop',
        'No pack has been bought for a child in this family, so nothing charges again. ' +
        'Camp weeks and one-off classes are paid for as they are booked.'));
    }

    return ui.card({
      title: 'Renewal',
      flush: true,
      head: ending ? ui.pill('Not renewing', 'warn') : ui.pill(sum),
      note: ending
        ? 'The sessions already paid for stay theirs until they are used, whichever way this goes.'
        : 'A pack is paid for, so the sessions stay theirs until they are used. Stopping the renewal only stops the next charge.',
      foot: renewalFoot(f, ending)
    }, ui.rows(renewalRows(f, ending)));
  }

  /* ---- family record ------------------------------------------------------ */

  /* A family with no pack either books camp and one-off classes, or has not
     started yet. The two are not the same thing to say back to them. */
  function noPackLine(f) {
    var booked = kidsOf(f.name).filter(function (k) { return D.classesOf(k).length; }).length;
    return booked ? 'None — camp and one-off bookings' : 'Nothing booked yet';
  }

  /* What the desk is asked on the phone, in one line under the children. */
  function nextRenewalFoot(f) {
    var k = nextRenewal(f);
    if (k && notRenewing(f)) return 'Not renewing · ' + sessionWord(sessionsLeft(f)) + ' left to use';
    if (k) {
      var p = D.pack(k);
      return firstName(k.name) + ' ' + renewsIn(p) + ' · ' + packPrice(p);
    }
    return noPackLine(f);
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
        foot: h`<span class="mute">Next renewal</span><span class="strong">${nextRenewalFoot(f)}</span>`,
        note: 'A pack belongs to the child it was bought for, so two children renew at different times and are charged separately.'
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

      /* One place where money is set, and it states the studio-wide rules it
         is following rather than offering a second copy of them to edit. Each
         child's pack is here because each pack is a separate charge. */
      var moneyRows = [];
      var packing = packKids(f);
      if (packing.length) {
        packing.forEach(function (k) {
          var p = D.pack(k);
          moneyRows.push({
            k: firstName(k.name),
            v: esc(notRenewing(f)
              ? 'Pack of ' + p.size + ' · ' + sessionWord(p.left) + ' left · not renewing'
              : 'Pack of ' + p.size + ' · renews ' + renewsIn(p) + ' · ' + packPrice(p))
          });
        });
      } else {
        moneyRows.push({ k: 'Packs', v: esc(noPackLine(f)), tone: 'mute' });
      }
      moneyRows.push(['Payment method', esc(f.card)]);
      moneyRows.push({ k: 'Automatic billing', v: f.autopay ? 'On' : 'Off · invoiced by hand', tone: f.autopay ? null : 'mute' });
      if (kids.length > 1) {
        moneyRows.push(['Sibling relief', esc(siblingRelief())]);
        moneyRows.push({ k: 'Applies to', v: esc(laterKids(kids)), tone: 'mute' });
      }
      if (inv) {
        moneyRows.push({ k: 'Latest invoice', v: esc(inv.id + ' · ' + Grove.money(inv.amt) + ' · ' + inv.status) });
        if (inv.status !== 'Paid') moneyRows.push({ k: 'Due', v: esc(inv.due), tone: 'clay' });
      } else {
        moneyRows.push({ k: 'Latest invoice', v: 'None raised yet', tone: 'mute' });
      }
      moneyRows.push({ k: 'Balance', v: esc(Grove.money(f.balance)), tone: f.balance > 0 ? 'clay' : null });

      var billing = ui.card({
        title: 'Billing',
        head: ui.btn({ label: 'Statement', kind: 'quiet', size: 'sm', msg: 'Statement emailed to ' + f.email })
      }, ui.kv(moneyRows));

      return leadNotice(f) +
        '<div class="section">' + ui.grid(3, [children, contact, docs]) + '</div>' +
        '<div class="section">' + ui.grid(2, [billing, renewalCard(f)]) + '</div>';
    }
  });

  function fam(ctx) {
    return D.family(ctx.params.id) || D.family('okafor');
  }

  /* ---- student record ------------------------------------------------------- */

  /* Attendance and image permission are facts about the child rather than
     about any one of their classes, so they sit under the list of classes
     rather than inside it. */
  function toneClass(tone) {
    if (tone === 'clay') return 'clay strong';
    return tone === 'mute' ? 'mute' : 'strong';
  }

  function enrollmentFoot(s, perm) {
    return h`<span class="inline"><span class="mute">Attendance</span><span class="strong">${s.att}</span></span>` +
      h`<span class="inline"><span class="mute">Photo permission</span><span class="${raw(toneClass(perm.tone))}">${raw(perm.v)}</span></span>`;
  }

  /* The pack, stated the way the desk says it out loud. */
  function packFoot(p, ending) {
    if (ending) {
      return h`<span class="inline"><span class="mute">Renewal</span><span class="strong">stopped</span></span>` +
        h`<span class="inline"><span class="mute">Left to use</span><span class="strong">${sessionWord(p.left)}</span></span>`;
    }
    return h`<span class="inline"><span class="mute">Renews</span><span class="strong">on the ${raw(esc(ord(p.size)))} class</span></span>` +
      h`<span class="inline"><span class="mute">Then charges</span><span class="strong">${packPrice(p)}</span></span>`;
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
      var p = D.pack(s);
      var missed = D.absencesFor(s.name);
      var extras = extrasFor(s.name);
      var siblings = kidsOf(s.family).filter(function (k) { return k.id !== s.id; });
      var classes = D.classesOf(s);
      var placed = classes.length > 0;
      /* Cillian sits in Thu 4:30pm and also holds a waitlist row for it. He
         has the place, so the place is what his record says. */
      var wait = placed ? null : waitlistEntry(s.name);

      var state = placed
        ? ui.pill(classes.length === 1
            ? 'On the register'
            : 'On the register · ' + classes.length + ' classes', 'ok')
        : (wait
            ? ui.pill('Waitlist · ' + ord(wait.pos) + ' of ' + waitlistDepth(wait), 'warn')
            : ui.pill('Not enrolled', 'warn'));

      /* One row per place the child holds, with the teacher who has them and
         the ages the class takes, because a child can be in an after-school
         hour, a camp week and a party at once. */
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

      /* Everything that has moved the pack: the classes booked on top of the
         weekly place, which spend a session, and the absences, which spend one
         only when the studio was told too late. */
      var moves = extras.map(function (x) {
        return {
          title: esc('Extra class · ' + x.when),
          sub: esc(x.room + ' · ' + x.staff + ' · booked on top of the weekly place'),
          end: ui.pill('Session spent')
        };
      }).concat(missed.map(function (a) {
        return {
          title: esc(a.date),
          sub: esc(a.reason),
          end: a.spent ? ui.pill('Session spent') : ui.pill('Session kept', 'ok')
        };
      }));

      var sessions = ui.card({
        title: 'Sessions',
        flush: true,
        head: h`<span class="inline">${raw(p.isPack
          ? ui.pill(usedLine(p))
          : ui.pill(placed ? 'Camp and one-off bookings' : 'No pack'))}${raw(
            missed.length ? ui.pill(absenceLine(missed)) : '')}</span>`,
        foot: p.isPack ? packFoot(p, notRenewing(f)) : '',
        note: 'Told more than 24 hours ahead, the session stays in the pack and the pack lasts a week longer. Inside 24 hours it is spent, exactly as if they came. Sessions do not expire.'
      }, moves.length
        ? ui.rows(moves)
        : ui.empty('Nothing missed', 'No absence has been recorded against this child.'));

      var family = ui.card({
        title: 'Family',
        head: ui.pill(f.status, STATUS_KIND[f.status]),
        note: 'Money is recorded against the family. A pack is bought for one child, so each child renews on their own classes.'
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
        { k: 'Balance', v: esc(Grove.money(f.balance)), tone: f.balance > 0 ? 'clay' : null }
      ]));

      return ui.grid(2, [ui.col([enrollment, sessions]), ui.col([safety, family])]);
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
