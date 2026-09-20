/* Console → Messages: conversations and announcements, plus the thread, the
   new-message form and a single announcement.

   MERGED: the old build had two rail items, "Messages" and "Announcements".
   They are one screen now with two tabs — the same question ("this family, or
   everyone?") is answered in one place, so a private reply cannot be posted as
   studio-wide news by mistake.

   Also simplified against the old build:
     - both stats bands are gone (unread / answered / reply time, and live /
       scheduled / reach). The tab counts and the result count carry the same
       information on the one toolbar row, and "reach — 130 families" was a
       number no other screen could corroborate.
     - the thread is a real transcript again. The old drawer showed key/value
       rows with the same two invented lines for every family, while the real
       TRANSCRIPTS sat unread in the data file.
     - "Open family" used to open the Johnson record whichever thread you were
       in. It opens the family the conversation is actually with.
     - "Pinned" and "Live" were both green and indistinguishable. Pinned is
       amber now; the three statuses are otherwise unchanged.

   Fixed after the visual review:
     - the announcements list is ordered pinned, then live newest first, then
       scheduled, so an unpublished post is no longer filed between published
       ones. The date column is "Posted" and a scheduled post reads "Not yet"
       rather than showing a date in the past under a "Published" heading.
     - the thread's right column no longer claimed Tobi was waitlisted for the
       Monday class he attends. Each child's standing is read from STUDENTS,
       which is what the family record shows, so the panel agrees with the
       conversation, and with the WAITLIST row filing him under Monday.
     - the thread panel is three cards in one grid__col, so the column fills
       beside the transcript instead of ending in 350px of white. The reply
       moved into its own card, so its label is a card title like every other
       label on the screen rather than bold body text, and consecutive
       messages from one sender are grouped under a single name.
     - the compose screen opens with "Choose a family" rather than a family
       nobody picked, the message box grows to the height of the column, and
       the page carries the conversations that are actually waiting.
     - the announcement page stated the same three facts in three places. The
       "Record" card is gone (its one new fact moved into "Who sees it"), and
       the page ends with the other announcements instead of 400px of cream.
     - an announcement that names a child is called out: announcements are
       public, and one child's credit balance does not belong in one.

   Fixed after the final review:
     - the header called every announcement studio-wide and already sitting on
       every family home screen. The table under it says otherwise: two of the
       five posts are addressed to a single program, and the scheduled one is
       on no home screen at all. The subtitle now says what the rows say, and
       the three places that repeated the claim — the announcement's eyebrow,
       its "Where" row and the heading over the post — read the audience and
       the status off the post itself.
     - the rail lost its Messages tint inside a thread or a single
       announcement. js/nav.js owns that map and has no entry for either, so
       the two detail views registered here declare their own owner at the
       foot of this file, beside the screens they describe. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  var ANN_KIND = { 'Pinned': 'amber', 'Live': 'ok', 'Scheduled': null };
  var ANN_RANK = { 'Pinned': 0, 'Live': 1, 'Scheduled': 2 };
  var MONTHS = {
    Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
    Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12
  };

  function thr(ctx) {
    var id = ctx.params.id;
    return D.THREADS.filter(function (t) { return t.id === id; })[0] || D.THREADS[0];
  }
  function ann(ctx) {
    var id = ctx.params.id;
    return D.ANNOUNCEMENTS.filter(function (a) { return a.id === id; })[0] || D.ANNOUNCEMENTS[0];
  }
  function famNamed(name) {
    return D.FAMILIES.filter(function (f) { return f.name === name; })[0] || D.FAMILIES[0];
  }
  function kidsOf(name) {
    return D.STUDENTS.filter(function (s) { return s.family === name; });
  }
  function threadFor(name) {
    return D.THREADS.filter(function (t) { return t.fam === name; })[0];
  }

  /* A scheduled announcement has not gone out, so it has no posted date. */
  function isPosted(a) { return a.status !== 'Scheduled'; }

  function dayNum(when) {
    var p = String(when).split(' ');
    var d = parseInt(p[0], 10), m = MONTHS[p[1]], y = parseInt(p[2], 10);
    if (isNaN(d) || !m || isNaN(y)) return 0;
    return y * 10000 + m * 100 + d;
  }

  /* Pinned first, then live newest first, then anything not posted yet. */
  function annSorted() {
    return D.ANNOUNCEMENTS.slice().sort(function (a, b) {
      var ra = ANN_RANK[a.status], rb = ANN_RANK[b.status];
      if (ra === undefined) ra = 1;
      if (rb === undefined) rb = 1;
      if (ra !== rb) return ra - rb;
      return dayNum(b.when) - dayNum(a.when);
    });
  }

  /* An announcement is public. If its wording names a child on the register,
     that is a private fact sitting in front of every family in the audience. */
  function childNamedIn(a) {
    var hit = null;
    D.STUDENTS.forEach(function (s) {
      if (hit) return;
      var first = s.name.split(' ')[0];
      if (new RegExp('\\b' + first + '\\b').test(a.body)) hit = s;
    });
    return hit;
  }

  /* An announcement is addressed either to every family or to the families of
     one program. PROGRAMS holds those names, so a page can say which program
     is reading rather than claiming the whole studio is. */
  function audProgram(aud) {
    var hit = null;
    Object.keys(D.PROGRAMS).forEach(function (k) {
      if (D.PROGRAMS[k].name === aud) hit = D.PROGRAMS[k];
    });
    return hit;
  }

  /* ---- messages: conversations + announcements ---------------------------- */

  Grove.screen('messages', {
    surface: 'console',
    eyebrow: 'one family, or everyone',
    title: 'Messages',
    sub: 'Private conversations with individual families. An announcement is public and read-only: it goes to everyone or to one program, and it reaches the family home screen only once it is posted.',
    actions: [
      { label: 'New announcement', msg: 'Prototype — no form yet' },
      { label: 'New message', kind: 'primary', to: 'newMessage' }
    ],

    body: function () {
      return Grove.tab('messages', 'Conversations') === 'Announcements'
        ? announcementsTab()
        : conversationsTab();
    }
  });

  function commsTabs() {
    return {
      key: 'messages',
      items: [
        { label: 'Conversations', count: D.THREADS.length },
        { label: 'Announcements', count: D.ANNOUNCEMENTS.length }
      ]
    };
  }

  function conversationsTab() {
    var q = Grove.query('threads');
    var rows = D.THREADS.filter(function (t) {
      return Grove.match(q, t.fam, t.who, t.last);
    });

    var table = ui.table(
      ['Family', 'Last message', { label: 'When', shrink: true }, { label: 'Status', shrink: true }],
      rows.map(function (t) {
        return {
          to: 'thread', id: t.id,
          cells: [
            ui.two(t.fam + ' family', t.who),
            ui.mute(t.last),
            ui.mute(t.when),
            t.unread ? ui.pill('Unread', 'warn') : ui.pill('Answered', 'ok')
          ]
        };
      }),
      { emptyTitle: 'No conversations match', emptyText: 'Clear the search to see every family.' }
    );

    return ui.toolbar({
      tabs: commsTabs(),
      search: { key: 'threads', placeholder: 'Search family or message…' },
      count: rows.length + ' of ' + D.THREADS.length + ' conversations'
    }) + ui.card({ flush: true }, table);
  }

  function announcementsTab() {
    var q = Grove.query('announcements');
    var rows = annSorted().filter(function (a) {
      return Grove.match(q, a.head, a.aud, a.by, a.body);
    });

    var table = ui.table(
      ['Headline', 'Audience', { label: 'Posted', shrink: true }, 'By', { label: 'Status', shrink: true }],
      rows.map(function (a) {
        return {
          to: 'announcement', id: a.id,
          cells: [
            ui.two(a.head, a.body),
            ui.mute(a.aud),
            ui.mute(isPosted(a) ? a.when : 'Not yet'),
            ui.mute(a.by),
            ui.pill(a.status, ANN_KIND[a.status])
          ]
        };
      }),
      { emptyTitle: 'No announcements match', emptyText: 'Clear the search to see every post.' }
    );

    return ui.toolbar({
      tabs: commsTabs(),
      search: { key: 'announcements', placeholder: 'Search announcements…' },
      count: rows.length + ' of ' + D.ANNOUNCEMENTS.length + ' announcements'
    }) + ui.card({ flush: true }, table);
  }

  /* ---- one conversation ---------------------------------------------------
     The transcript alternates sides using the grids that already exist: a
     family message sits in the wide half of grid--sidebar, a studio message in
     the wide half of grid--aside, each beside an empty cell. Family messages
     are tinted plum and studio messages grove, which is what those two colours
     mean everywhere else in the product. Consecutive messages from the same
     person are grouped: only the first carries the name. */

  function transcript(t) {
    var lines = D.TRANSCRIPTS[t.id] || [];
    if (!lines.length) {
      return ui.empty('No messages yet', 'Nothing has been sent to this family.');
    }
    var prev = '';
    return lines.map(function (m) {
      var mine = m.m === 'us';
      var day = m.d ? h`<p class="section-title">${m.d}</p>` : '';
      var grouped = !m.d && prev === m.m;
      prev = m.m;
      var bubble = ui.notice({
        kind: mine ? 'ok' : 'warn',
        title: grouped ? m.s : (mine ? 'Studio' : t.who) + ' · ' + m.s,
        text: m.t
      });
      return day + (mine
        ? ui.grid('aside', ['<div></div>', bubble])
        : ui.grid('sidebar', [bubble, '<div></div>']));
    }).join('');
  }

  /* One child, as the register has them: the class they are in, or the class
     they are waiting for. Nothing here is typed by hand. */
  function childRow(s) {
    var waiting = s.cls.indexOf('Waitlisted') === 0;
    var end = '';
    if (waiting) end = ui.pill('Waitlist', 'warn');
    else if (s.flag) end = ui.pill(s.flag, s.flagKind === 'bad' ? 'bad' : 'warn');
    else if (s.mk) end = ui.mute(s.mk === 1 ? '1 make-up credit' : s.mk + ' make-up credits');
    return {
      title: esc(s.name),
      sub: esc(s.cls),
      end: end,
      to: 'studentRecord', id: s.id
    };
  }

  var threadDef = {
    surface: 'console',
    crumbs: [{ label: 'Messages', to: 'messages' }],
    eyebrow: 'one family at a time',
    title: function (ctx) { return thr(ctx).fam + ' family'; },
    sub: function (ctx) {
      var t = thr(ctx);
      return t.who + ' · last message ' + t.when;
    },
    actions: function (ctx) {
      return [
        { label: 'Mark answered', msg: 'Marked answered' },
        { label: 'Open family', kind: 'primary', to: 'familyRecord', id: famNamed(thr(ctx).fam).id }
      ];
    },

    body: function (ctx) {
      var t = thr(ctx);
      var f = famNamed(t.fam);
      var kids = kidsOf(t.fam);

      var flags = h`<div class="flags">
        ${raw(t.unread ? ui.pill('Unread', 'warn') : ui.pill('Answered', 'ok'))}
        ${raw(ui.pill('Private to this family'))}
      </div>`;

      var conversation = ui.card({ title: 'Conversation' },
        h`<div class="stack">${raw(transcript(t))}</div>`);

      var reply = ui.card({
        title: 'Reply',
        fill: true,
        note: 'A reply is private to this family. News for everyone, or for a whole program, belongs in Announcements.',
        foot: ui.btn({
          label: 'Send reply',
          kind: 'primary',
          msg: 'Sent to the ' + t.fam + ' family'
        })
      }, ui.field({
        grow: true,
        label: 'Message to ' + t.who,
        control: ui.textarea({ placeholder: 'Write a reply…' })
      }));

      var contact = ui.card({ title: 'This family' }, ui.kv([
        ['Guardian', esc(f.guardian)],
        ['Email', esc(f.email)],
        ['Phone', esc(f.phone)],
        { k: 'Status', v: esc(f.status), tone: f.status === 'Active' ? null : 'clay' }
      ]));

      var children = ui.card({ title: 'Children', flush: true },
        kids.length
          ? ui.rows(kids.map(childRow))
          : ui.empty('Nobody on the register', 'The family has an account but no child is enrolled.'));

      var account = ui.card({
        title: 'Account',
        note: 'Invoices and payment methods live on the family record.'
      }, ui.kv([
        ['Plan', esc(f.plan)],
        { k: 'Balance', v: esc(Grove.money(f.balance)), tone: f.balance > 0 ? 'clay' : null },
        ['Autopay', f.autopay ? 'On' : 'Off'],
        ['Payment method', esc(f.card)],
        ['With us since', esc(f.since)]
      ]));

      return flags + ui.grid('sidebar', [
        ui.col([conversation, reply]),
        ui.col([contact, children, account])
      ]);
    }
  };

  /* The crumb has to name the family, and the shell reads crumbTitle as a
     value rather than calling it, so it is defined as a getter. */
  Object.defineProperty(threadDef, 'crumbTitle', {
    get: function () { return thr({ params: Grove.state.params }).fam + ' family'; }
  });

  Grove.screen('thread', threadDef);

  /* ---- new message --------------------------------------------------------
     The recipient and the conversations already waiting stack in the narrow
     column; the message box fills the wide one, so the two columns finish
     together however long the note is. */

  Grove.screen('newMessage', {
    surface: 'console',
    crumbs: [{ label: 'Messages', to: 'messages' }],
    eyebrow: 'just to this family',
    title: 'New message',
    sub: 'A private conversation with one family. News for everyone, or for a whole program, belongs in Announcements.',

    body: function () {
      var PICK = 'Choose a family';
      var unread = D.THREADS.filter(function (t) { return t.unread; });

      var to = ui.card({
        title: 'To',
        note: 'It arrives in the family portal under Messages. No other family can see it.'
      }, ui.fields(null, [
        ui.field({
          label: 'Family',
          control: ui.select({
            value: PICK,
            options: [PICK].concat(D.FAMILIES.map(function (f) { return f.name + ' family'; }))
          })
        }),
        ui.field({
          label: 'Subject',
          control: ui.input({ placeholder: 'e.g. a change of day' })
        })
      ]));

      var waiting = ui.card({
        title: 'Waiting for a reply',
        flush: true,
        note: unread.length + ' of ' + D.THREADS.length + ' conversations are unanswered. Answering in the thread keeps the whole history in one place.'
      }, unread.length
        ? ui.rows(unread.map(function (t) {
          return {
            title: esc(t.fam + ' family'),
            sub: esc(t.last),
            end: ui.mute(t.when),
            to: 'thread', id: t.id
          };
        }))
        : ui.empty('Everyone has been answered', 'Nothing is waiting on the studio.'));

      var message = ui.card({ title: 'Message', fill: true }, ui.field({
        grow: true,
        label: 'Message to the family',
        control: ui.textarea({ placeholder: 'Write to the family' })
      }));

      return ui.grid('aside', [ui.col([to, waiting]), message]) + ui.formActions([
        { label: 'Send message', kind: 'primary', msg: 'Message sent' },
        { label: 'Cancel', to: 'messages' }
      ]);
    }
  });

  /* ---- one announcement ---------------------------------------------------- */

  Grove.screen('announcement', {
    surface: 'console',
    crumbs: [{ label: 'Messages', to: 'messages' }],
    crumbTitle: 'Announcement',
    eyebrow: function (ctx) {
      var p = audProgram(ann(ctx).aud);
      return p ? 'every ' + p.short.toLowerCase() + ' family sees this' : 'everyone sees this';
    },
    title: function (ctx) { return ann(ctx).head; },
    sub: function (ctx) {
      var a = ann(ctx);
      return isPosted(a)
        ? 'Posted ' + a.when + ' by ' + a.by
        : 'Not posted yet — written ' + a.when + ' by ' + a.by;
    },
    actions: function (ctx) {
      var a = ann(ctx);
      if (!isPosted(a)) {
        return [
          { label: 'Discard', kind: 'danger', msg: 'Prototype — nothing was discarded' },
          { label: 'Post now', msg: 'Posted to every family home' },
          { label: 'Edit', kind: 'primary', msg: 'Prototype — no form yet' }
        ];
      }
      var pinned = a.status === 'Pinned';
      return [
        { label: 'Take down', kind: 'danger', msg: 'Prototype — nothing was taken down' },
        { label: pinned ? 'Unpin' : 'Pin to top', msg: pinned ? 'Unpinned' : 'Pinned to every family home' },
        { label: 'Edit', kind: 'primary', msg: 'Prototype — no form yet' }
      ];
    },

    body: function (ctx) {
      var a = ann(ctx);
      var named = childNamedIn(a);
      var others = annSorted().filter(function (x) { return x.id !== a.id; });

      var flags = h`<div class="flags">
        ${raw(ui.pill(a.status, ANN_KIND[a.status]))}
        ${raw(ui.pill('Public to parents'))}
      </div>`;

      var warning = '';
      if (named) {
        var t = threadFor(named.family);
        warning = ui.notice({
          kind: 'bad',
          title: 'This names ' + named.name,
          text: 'Everyone in ' + a.aud + ' can read it. Anything about one child belongs in a message to that family.',
          action: t
            ? { label: 'Message the ' + named.family + ' family', to: 'thread', id: t.id }
            : { label: 'Write to the family', to: 'newMessage' }
        });
      }

      var post = ui.card({
        title: isPosted(a) ? 'What families see' : 'What families will see',
        note: 'Announcements are read-only for families. If someone needs to reply, they use Messages.'
      }, ui.notice({ kind: 'ok', title: a.head, text: a.body }) + warning);

      var who = ui.card({
        title: 'Who sees it',
        note: 'A pinned post stays at the top of the family home screen until it is unpinned.'
      }, ui.kv([
        ['Audience', esc(a.aud)],
        ['Where', isPosted(a) ? 'Top of the family home screen' : 'Top of the family home screen, once posted'],
        ['Sent by email', isPosted(a) ? 'Yes' : 'Will send when it goes out']
      ]));

      var more = ui.card({
        title: 'Other announcements',
        flush: true,
        note: 'Pinned first, then the most recent. Anything not posted yet is at the end — no family can see it.'
      }, ui.rows(others.map(function (x) {
        return {
          title: esc(x.head),
          sub: esc(x.aud + ' · ' + (isPosted(x) ? x.when : 'not posted yet')),
          end: ui.pill(x.status, ANN_KIND[x.status]),
          to: 'announcement', id: x.id
        };
      })));

      return flags + ui.grid('sidebar', [post, who]) +
        '<div class="section">' + more + '</div>';
    }
  });

  /* ---- the rail -------------------------------------------------------------
     A thread and a single announcement are only ever reached from Messages,
     and both carry a Messages crumb, so the rail item has to stay lit while
     you are inside one. js/nav.js keeps that map for the screens it knows
     about; these two are declared here, next to the screens they describe. */

  var OWNED = { thread: 'messages', announcement: 'messages' };
  var ownerElse = Grove.nav.currentFor;
  Grove.nav.currentFor = function (key) {
    return OWNED[key] || ownerElse.call(Grove.nav, key);
  };
})();
