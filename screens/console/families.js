/* Console → Families: the list, the family record, and one child's record.

   Simplifications against the previous build:
     - the record's eight header buttons are now three; the rest moved into
       the card they belong to, where they read as part of that subject
     - "Discounts & fixed fees" and "Exclusions" were two cards of per-family
       overrides duplicating program settings. They are one "Billing
       exceptions" card, and the two separate omit-from-posting / omit-from-
       ePayment toggles are one "Skip automatic billing" switch.

   Fixed after the visual review:
     - the list is called Families, the name the rail and the breadcrumb
       already use. It called itself People, so the "Families" crumb landed
       on a page with a different name
     - the Children column is derived from the children on the books, so it
       cannot disagree with the Students tab beside it
     - Current plan no longer restates the Status pill two cells to its right
     - the subtitle follows the tab, as the search and the filters already did
     - "Lifetime value $14,280" and "Next charge 1 Aug 2026" were literals
       with nothing behind them. Billing reads the family's own invoice
     - Documents claimed "8 of 9 signed" and a photo permission Grove.data
       does not hold. Every row is derived, and a document is only reported
       as signed on the record of the family whose signature it carries
     - Contact carried a "Second guardian — not provided" placeholder and a
       third of a card of white space; it carries the family's last message
     - the child's record was three short cards that mostly repeated the
       title. It carries the sessions missed, the safety note, the child's
       siblings and the family's contact details
     - "Open the ledger" is offered only to the family whose ledger
       Grove.data actually holds; every other family opens Billing.

   Fixed in the second pass:
     - the sibling exception put the studio's rule in its own words, "50% off
       the second child". The rule Grove.data holds, and that Settings,
       Programs and the registration flow all quote, is 50% off the second and
       third registration fee. It is read from PRICING now, and the children
       it applies to are the ones after the first on the roster
     - the make-up pill on a child's record was keyed on the credit's colour
       rather than its status, so every one of them rendered grey. It reads
       the status, off the same map the make-ups queue in Requests uses
     - the Children card is the register's own rows, so a name on a family
       record opens that child's record instead of sitting there as text. The
       make-up count sits on the child holding it; the plan is the card foot
     - the three cards in the first row each ended in a third of a card of
       white. Children, contact and paperwork share that row now, and billing
       sits with its exceptions in the next, which leaves the tallest and the
       shortest card in a row within about 80px of each other
     - a family with no thread showed a full empty panel where a family with
       one shows a single notice; both are one notice now
     - make-up credits are counted off the MAKEUPS rows a child holds rather
       than the STUDENTS.mk tally. The count and the rows behind it sit on the
       same screen here, so the number has to be the length of the list under
       it; the family portal counts them the same way
     - the child's record named the guardian and their phone number twice, in
       two cards side by side. Who to call is on the family card, and Safety
       says so
     - the child's record is two columns of two cards (ui.col) rather than two
       rows, so the columns end level instead of one card ending in white
     - the membership paragraph carried an inline max-width.

   Fixed in the final pass:
     - the "Skip automatic billing" helper line described the family as
       already invoiced by hand, with the switch off, an Autopay on pill in
       the header and an automatic charge in Billing that failed. It describes
       the default and what flipping the switch changes, the way the row below
       it does. */
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

  /* The same statuses, and the same colours, as the make-ups queue in
     Requests: a booked credit is settled, and an expiring one is a loss
     rather than another decision waiting on you. */
  var MAKEUP_PILL = {
    'Awaiting approval': 'warn',
    'Available': 'ok',
    'Booked': null,
    'Expiring': 'bad'
  };

  var TAB_KEY = 'people';
  var T_FAMILIES = 'Families';
  var T_STUDENTS = 'Students';

  /* ---- derivations --------------------------------------------------------
     Everything these screens state about a family is read back out of
     Grove.data here, so one fact cannot be written two ways on two screens. */

  function currentTab() { return Grove.tab(TAB_KEY, T_FAMILIES); }

  function kidsOf(name) {
    return D.STUDENTS.filter(function (s) { return s.family === name; });
  }

  function firstName(name) { return String(name).split(' ')[0]; }

  /* The Children column and the Students tab have to be the same set of
     people, so the column lists the children on the books rather than a
     written-out line that can drift away from the roster. */
  function childNames(f) {
    return kidsOf(f.name).map(function (s) {
      return firstName(s.name) + ' (' + s.age + ')';
    }).join(', ');
  }

  /* Two families record a status where a plan belongs — "Cancelling · ends 31
     Aug" beside a Cancelling pill, "Registered, not yet paid" beside Pending
     payment. Show only the part the pill does not already say. */
  function planOf(f) {
    var p = String(f.plan);
    var sep = p.indexOf(' · ');
    if (sep !== -1 && p.slice(0, sep) === f.status) {
      var rest = p.slice(sep + 3);
      return rest.charAt(0).toUpperCase() + rest.slice(1);
    }
    return /session|camp|week/i.test(p) ? p : '';
  }

  /* Every make-up credit a child holds, counted off the MAKEUPS rows rather
     than the STUDENTS.mk tally. The rows and the count appear on the same
     screen here, so the number has to be the length of the list drawn under
     it rather than a second figure kept beside it. The family portal counts
     them off the same rows. */
  function creditsOf(name) {
    return D.MAKEUPS.filter(function (m) { return m.child === name; });
  }

  /* "1 available · 1 booked" — the wording the family's own children screen
     uses, because a credit already booked is not one still to spend. */
  function creditLine(list) {
    if (!list.length) return 'None';
    var order = [], count = {};
    list.forEach(function (m) {
      if (count[m.status] === undefined) { count[m.status] = 0; order.push(m.status); }
      count[m.status] += 1;
    });
    return order.map(function (k) { return count[k] + ' ' + k.toLowerCase(); }).join(' · ');
  }

  /* One child, as the register has them. The same row the thread sidebar in
     Messages draws, so a name on a family record opens that child's own
     record rather than sitting there as a line of text. */
  function childRow(s) {
    var waiting = s.cls.indexOf('Waitlisted') === 0;
    var held = creditsOf(s.name).length;
    var end = '';
    if (waiting) end = ui.pill('Waitlist', 'warn');
    else if (s.flag) end = ui.pill(s.flag, s.flagKind === 'bad' ? 'bad' : 'warn');
    else if (held) end = ui.mute(held === 1 ? '1 make-up credit' : held + ' make-up credits');
    return {
      title: esc(s.name),
      sub: esc('Age ' + s.age + ' · ' + s.cls),
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

  function invoiceOf(f) {
    return D.INVOICES.filter(function (i) { return i.fam === f.name; })[0];
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

  function docState(d) {
    return d.signed
      ? { v: esc('Signed · ' + signedOn(d)), tone: null }
      : { v: 'Not signed', tone: 'clay' };
  }

  /* The studio's forms first, then the image permission each child answers
     separately. Version and publication date are the studio's own facts and
     hold for everyone; whether a form came back signed is only known for the
     family whose signature Grove.data records. */
  function documentRows(f) {
    var mine = ownsDocs(f);
    var rows = [];

    D.DOCUMENTS.forEach(function (d) {
      if (d.name.indexOf('Photo permission') === 0) return;
      var state = docState(d);
      rows.push(mine
        ? { k: d.name, v: state.v, tone: state.tone }
        : { k: d.name, v: esc(d.version + ' · ' + d.published), tone: 'mute' });
    });

    kidsOf(f.name).forEach(function (k) {
      var doc = photoDoc(k.name);
      if (doc && mine) {
        var state = docState(doc);
        rows.push({ k: doc.name, v: state.v, tone: state.tone });
      } else {
        rows.push({ k: 'Photo permission — ' + firstName(k.name), v: 'No form on file', tone: 'mute' });
      }
    });

    return rows;
  }

  /* ---- list ------------------------------------------------------------- */

  Grove.screen('families', {
    surface: 'console',
    eyebrow: 'everyone on the books',
    title: 'Families',
    sub: function () {
      return currentTab() === T_STUDENTS
        ? 'Every child on the books: the class they sit in, what a teacher has to know before they walk in, and the credits they are holding.'
        : 'The family is the billing unit. Guardians, children, payment methods and documents all hang off it.';
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

  function familiesTab() {
    var q = Grove.query('families');
    var filter = Grove.filter('families', 'All');

    var rows = D.FAMILIES.filter(function (f) {
      if (!Grove.match(q, f.name, f.guardian, f.email, childNames(f), f.phone)) return false;
      if (filter === 'Active') return f.status === 'Active';
      if (filter === 'Owing') return f.balance > 0;
      if (filter === 'Needs attention') return f.status !== 'Active';
      return true;
    });

    var table = ui.table(
      ['Family', 'Children', 'Contact', 'Current plan', { label: 'Balance', align: 'right' }, { label: 'Status', shrink: true }],
      rows.map(function (f) {
        var plan = planOf(f);
        var kids = childNames(f);
        return {
          to: 'familyRecord', id: f.id,
          cells: [
            ui.two(f.name + ' family', f.guardian),
            kids ? ui.mute(kids) : '<span class="mute">None yet</span>',
            ui.two(f.email, f.phone),
            plan ? ui.mute(plan) : '<span class="mute">—</span>',
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
      filters: { key: 'families', items: ['All', 'Active', 'Owing', 'Needs attention'] },
      count: rows.length + ' of ' + D.FAMILIES.length + ' families'
    }) + ui.card({ flush: true }, table);
  }

  function studentsTab() {
    var q = Grove.query('students');
    var filter = Grove.filter('students', 'All ages');

    var rows = D.STUDENTS.filter(function (s) {
      if (!Grove.match(q, s.name, s.family, s.cls)) return false;
      if (filter !== 'All ages') return s.band === filter;
      return true;
    });

    var table = ui.table(
      ['Child', 'Family', 'Class', 'Safety', { label: 'Attendance', align: 'right' }, { label: 'Credits', align: 'right' }],
      rows.map(function (s) {
        return {
          to: 'studentRecord', id: s.id,
          cells: [
            ui.two(s.name, 'Age ' + s.age + ' · ' + s.band),
            ui.mute(s.family),
            ui.mute(s.cls),
            s.flag ? ui.pill(s.flag, s.flagKind) : '<span class="mute">—</span>',
            '<span class="num">' + esc(s.att) + '</span>',
            '<span class="num">' + creditsOf(s.name).length + '</span>'
          ]
        };
      }),
      { emptyTitle: 'No children match', emptyText: 'Clear the search or choose a different age band.' }
    );

    return ui.toolbar({
      tabs: peopleTabs(),
      search: { key: 'students', placeholder: 'Search child, family, class…' },
      filters: { key: 'students', items: ['All ages', '5–7', '8–11', '12+'] },
      count: rows.length + ' of ' + D.STUDENTS.length + ' children'
    }) + ui.card({ flush: true }, table);
  }

  /* ---- family record ------------------------------------------------------ */

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
        { label: 'Record a payment', msg: 'Payment recorded · receipt emailed to ' + f.email },
        ownsLedger(f)
          ? { label: 'Open the ledger', kind: 'primary', to: 'ledger' }
          : { label: 'Open in billing', kind: 'primary', to: 'billing' }
      ];
    },

    body: function (ctx) {
      var f = fam(ctx);
      var kids = kidsOf(f.name);
      var inv = invoiceOf(f);
      var thread = threadOf(f);
      var plan = planOf(f);

      var flags = h`<div class="flags">
        ${raw(ui.pill(f.status, STATUS_KIND[f.status]))}
        ${raw(ui.pill(f.autopay ? 'Autopay on' : 'Autopay off', f.autopay ? 'ok' : null))}
        ${raw(f.balance > 0 ? ui.pill(Grove.money(f.balance) + ' owing', 'bad') : ui.pill('Nothing owing', 'ok'))}
      </div>`;

      var children = ui.card({
        title: 'Children',
        flush: true,
        head: ui.btn({ label: 'Enroll a child', kind: 'quiet', size: 'sm', msg: 'Prototype — no form yet' }),
        foot: h`<span class="mute">Current plan</span><span class="strong">${plan || 'Not set yet'}</span>`,
        note: 'A child is enrolled against the family, so a second child joins this record rather than starting another one.'
      }, kids.length
        ? ui.rows(kids.map(childRow))
        : ui.empty('Nobody on the register', 'The family has an account but no child is enrolled.'));

      var contact = ui.card({
        title: 'Contact',
        head: ui.btn({ label: 'New message', kind: 'quiet', size: 'sm', to: 'newMessage' })
      }, h`
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

      var billing = ui.card({
        title: 'Billing',
        head: ui.btn({ label: 'Statement', kind: 'quiet', size: 'sm', msg: 'Statement emailed to ' + f.email }),
        note: 'Card details are never stored by the studio — only the last four digits and a processor token.'
      }, h`
        ${raw(ui.kv([
          ['Payment method', esc(f.card)],
          inv
            ? { k: 'Latest invoice', v: esc(inv.id + ' · ' + Grove.money(inv.amt)) }
            : { k: 'Latest invoice', v: 'None raised yet', tone: 'mute' },
          inv
            ? { k: 'Due', v: esc(inv.due), tone: inv.status === 'Paid' ? null : 'clay' }
            : { k: 'Due', v: 'Nothing due', tone: 'mute' },
          { k: 'Balance', v: esc(Grove.money(f.balance)), tone: f.balance > 0 ? 'clay' : null }
        ]))}
        ${raw(inv && inv.status !== 'Paid'
          ? '<div class="card-split">' + ui.notice({
              kind: inv.kind === 'bad' ? 'bad' : 'warn',
              title: inv.status + ' · ' + inv.id,
              text: inv.note
            }) + '</div>'
          : '')}
      `);

      var exceptions = ui.card({
        title: 'Billing exceptions',
        note: 'Sibling relief is the studio-wide rule in Settings and is applied for you. Everything else follows the program defaults — only set an exception when this family genuinely differs.'
      }, h`
        ${raw(ui.kv(kids.length > 1
          ? [['Sibling relief', esc(siblingRelief())],
             { k: 'Applies to', v: esc(laterKids(kids)), tone: 'mute' }]
          : [{ k: 'Sibling relief', v: 'None — one child on the books', tone: 'mute' }]))}
        <div class="card-split">
          ${raw(ui.toggleRow({
            id: 'fam-skip-auto',
            title: 'Skip automatic billing',
            sub: 'Automatic billing is the default. Switched on, the family is invoiced by hand — listed for manual handling, never silently dropped.',
            on: false
          }))}
          ${raw(ui.toggleRow({
            id: 'fam-post',
            title: 'Send bills by post',
            sub: 'Email is the default.',
            on: false
          }))}
        </div>
      `);

      var docs = ui.card({
        title: 'Documents',
        head: ui.btn({ label: 'Registration form', kind: 'quiet', size: 'sm', msg: 'Opening the registration form' }),
        note: 'Image permission is answered per child on the registration form, not once for the family.'
      }, ui.kv(documentRows(f)));

      var danger = h`<div class="section">
        ${raw(ui.card({ title: 'Membership' }, h`
          <div class="spread">
            <p class="hint">Cancelling stops billing at the end of the current cycle. The family keeps portal access until then, and their history is retained.</p>
            ${raw(ui.btn({ label: 'Cancel membership', kind: 'danger', msg: 'Prototype — nothing was cancelled' }))}
          </div>
        `))}
      </div>`;

      return flags +
        ui.grid(3, [children, contact, docs]) +
        '<div class="section">' + ui.grid(2, [billing, exceptions]) + '</div>' +
        danger;
    }
  });

  function fam(ctx) {
    return D.family(ctx.params.id) || D.family('okafor');
  }

  /* ---- student record ------------------------------------------------------- */

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
      var plan = planOf(f);
      var missed = creditsOf(s.name);
      var siblings = kidsOf(s.family).filter(function (k) { return k.id !== s.id; });
      var started = s.att !== '—';

      var photoRow = doc && mine
        ? { k: 'Photo permission', v: docState(doc).v, tone: docState(doc).tone }
        : { k: 'Photo permission', v: 'No form on file', tone: 'mute' };

      var enrollment = ui.card({
        title: 'Enrollment',
        head: ui.pill(started ? 'On the register' : 'Not started', started ? 'ok' : 'warn')
      }, ui.kv([
        ['Class', esc(s.cls)],
        plan
          ? { k: 'Family plan', v: esc(plan) }
          : { k: 'Family plan', v: 'Not set yet', tone: 'mute' },
        { k: 'Attendance', v: esc(s.att), tone: started ? null : 'mute' },
        { k: 'Make-up credits', v: esc(creditLine(missed)), tone: missed.length ? null : 'mute' },
        photoRow
      ]));

      var safety = ui.card({
        title: 'Safety',
        head: s.flag
          ? ui.pill(s.flagKind === 'bad' ? 'Medical alert' : 'Needs to know', s.flagKind)
          : ui.pill('No alerts', 'ok'),
        note: 'Safety notes are shown to every teacher on the roster, and on the attendance sheet for each class this child attends. Who to call is on the family card.'
      }, s.flag
        ? ui.notice({
            kind: s.flagKind,
            title: s.flag,
            text: 'Recorded on the registration form. It travels with the child to camp and to any make-up class.'
          })
        : ui.notice({
            title: 'Nothing on file',
            text: 'No allergy, condition or medication has been recorded for this child.'
          }));

      var sessions = ui.card({
        title: 'Missed sessions',
        flush: true,
        note: 'A class missed with more than 24 hours notice becomes a make-up credit, which lapses on the date shown.'
      }, missed.length
        ? ui.rows(missed.map(function (m) {
            return {
              title: esc(m.missed),
              sub: esc(m.reason + ' · expires ' + m.expires + (m.booked ? ' · ' + m.booked : '')),
              end: ui.pill(m.status, MAKEUP_PILL[m.status]),
              to: 'makeupRequest', id: m.id
            };
          }))
        : ui.empty('Nothing missed', 'No absence has been recorded against this child.'));

      var family = ui.card({
        title: 'Family',
        head: ui.pill(f.status, STATUS_KIND[f.status]),
        note: 'Money is recorded against the family, never against a child.'
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
