/* Console → Families (list) and the family record.

   Simplifications against the previous build:
     - the record's eight header buttons are now three; the rest moved into
       the card they belong to, where they read as part of that subject
     - "Discounts & fixed fees" and "Exclusions" were two cards of per-family
       overrides duplicating program settings. They are one "Billing
       exceptions" card, and the two separate omit-from-posting / omit-from-
       ePayment toggles are one "Skip automatic billing" switch. */
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

  /* ---- list ------------------------------------------------------------- */

  Grove.screen('families', {
    surface: 'console',
    eyebrow: 'everyone on the books',
    title: 'People',
    sub: 'The family is the billing unit. Guardians, children, payment methods and documents all hang off it.',
    actions: [
      { label: 'Export', msg: 'Exported to CSV' },
      { label: 'Add family', kind: 'primary', msg: 'Prototype — no form yet' }
    ],

    body: function () {
      var tab = Grove.tab('people', 'Families');
      return tab === 'Students' ? studentsTab() : familiesTab();
    }
  });

  function peopleTabs() {
    return {
      key: 'people',
      items: [
        { label: 'Families', count: D.FAMILIES.length },
        { label: 'Students', count: D.STUDENTS.length }
      ]
    };
  }

  function familiesTab() {
    var q = Grove.query('families');
    var filter = Grove.filter('families', 'All');

    var rows = D.FAMILIES.filter(function (f) {
      if (!Grove.match(q, f.name, f.guardian, f.email, f.kids, f.phone)) return false;
      if (filter === 'Active') return f.status === 'Active';
      if (filter === 'Owing') return f.balance > 0;
      if (filter === 'Needs attention') return f.status !== 'Active';
      return true;
    });

    var table = ui.table(
      ['Family', 'Children', 'Contact', 'Current plan', { label: 'Balance', align: 'right' }, { label: 'Status', shrink: true }],
      rows.map(function (f) {
        return {
          to: 'familyRecord', id: f.id,
          cells: [
            ui.two(f.name + ' family', f.guardian),
            ui.mute(f.kids),
            ui.two(f.email, f.phone),
            ui.mute(f.plan),
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
            '<span class="num">' + s.mk + '</span>'
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
    actions: [
      { label: 'Message', to: 'newMessage' },
      { label: 'Record a payment', msg: 'Payment recorded' },
      { label: 'Open the ledger', kind: 'primary', to: 'ledger' }
    ],

    body: function (ctx) {
      var f = fam(ctx);
      var kids = D.STUDENTS.filter(function (s) { return s.family === f.name; });

      var flags = h`<div class="inline" style="margin-bottom:var(--s-5)">
        ${raw(ui.pill(f.status, STATUS_KIND[f.status]))}
        ${raw(ui.pill(f.autopay ? 'Autopay on' : 'Autopay off', f.autopay ? 'ok' : null))}
        ${raw(f.balance > 0 ? ui.pill(Grove.money(f.balance) + ' owing', 'bad') : ui.pill('Nothing owing', 'ok'))}
      </div>`;

      var children = ui.card({
        title: 'Children',
        head: ui.btn({ label: 'Enrol a child', kind: 'quiet', size: 'sm', msg: 'Prototype — no form yet' })
      }, ui.kv(
        kids.map(function (k) { return { k: k.name, v: k.cls }; })
          .concat([
            { k: 'Current plan', v: f.plan },
            { k: 'Make-up credits', v: String(kids.reduce(function (n, k) { return n + k.mk; }, 0)) }
          ])
      ));

      var contact = ui.card({ title: 'Contact' }, ui.kv([
        ['Guardian', f.guardian],
        ['Email', f.email],
        ['Phone', f.phone],
        { k: 'Second guardian', v: 'Not provided', tone: 'mute' }
      ]));

      var billing = ui.card({
        title: 'Billing',
        head: ui.btn({ label: 'Statement', kind: 'quiet', size: 'sm', to: 'ledger' }),
        note: 'Card details are never stored by the studio — only the last four digits and a processor token.'
      }, ui.kv([
        ['Payment method', f.card],
        ['Next charge', '1 Aug 2026'],
        { k: 'Balance', v: Grove.money(f.balance), tone: f.balance > 0 ? 'clay' : null },
        ['Lifetime value', '$14,280']
      ]));

      var exceptions = ui.card({
        title: 'Billing exceptions',
        note: 'Everything else follows the program defaults in Settings. Only set an exception when this family genuinely differs.'
      }, h`
        ${raw(ui.kv([
          ['Discount', 'Sibling — 50% off the second child'],
          { k: 'Applies to', v: 'Lucas', tone: 'mute' }
        ]))}
        <div style="margin-top:var(--s-3)">
          ${raw(ui.toggleRow({
            id: 'fam-skip-auto',
            title: 'Skip automatic billing',
            sub: 'This family is invoiced by hand. They are listed for manual handling, never silently dropped.',
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
      }, ui.kv([
        ['Signed', '8 of 9'],
        { k: 'Outstanding', v: 'Payment terms v4', tone: 'clay' },
        ['Photo permission', 'Zara yes · Tobi no']
      ]));

      var danger = h`<div class="section">
        ${raw(ui.card({ title: 'Membership' }, h`
          <div class="spread">
            <p class="hint" style="max-width:60ch">Cancelling stops billing at the end of the current cycle. The family keeps portal access until then, and their history is retained.</p>
            ${raw(ui.btn({ label: 'Cancel membership', kind: 'danger', msg: 'Prototype — nothing was cancelled' }))}
          </div>
        `))}
      </div>`;

      return flags +
        ui.grid(3, [children, contact, billing]) +
        '<div class="section">' + ui.grid(2, [exceptions, docs]) + '</div>' +
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
    crumbTitle: 'Child',
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
      var safety = ui.card({ title: 'Safety' },
        s.flag
          ? ui.notice({ kind: 'bad', title: s.flag, text: 'Shown to every teacher on the roster and on the attendance sheet.' })
          : ui.empty('Nothing on file', 'No allergies or medical notes have been recorded.')
      );
      var enrolment = ui.card({ title: 'Enrolment' }, ui.kv([
        ['Class', s.cls],
        ['Attendance', s.att],
        ['Make-up credits', String(s.mk)],
        ['Age band', s.band]
      ]));
      var family = ui.card({ title: 'Family' }, ui.kv([
        ['Family', s.family + ' family'],
        ['Guardian', famByName(s.family).guardian],
        ['Email', famByName(s.family).email],
        ['Phone', famByName(s.family).phone]
      ]));
      return ui.grid(3, [enrolment, safety, family]);
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
