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
     - the announcement's "Email copy" card held two rows, so it is folded into
       "Record", and "Families reached" is dropped — it was a literal.
     - "Pinned" and "Live" were both green and indistinguishable. Pinned is
       amber now; the three statuses are otherwise unchanged.
     - the new-message form is the client's screenshot fixed: two cards in one
       ui.grid(2), which stretches them to exactly equal heights instead of
       leaving the "To" card an orphaned strip beside a taller message box. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  var ANN_KIND = { 'Pinned': 'amber', 'Live': 'ok', 'Scheduled': null };

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

  /* ---- messages: conversations + announcements ---------------------------- */

  Grove.screen('messages', {
    surface: 'console',
    eyebrow: 'one family, or everyone',
    title: 'Messages',
    sub: 'Private conversations with individual families. Announcements are studio-wide posts — public, read-only, and at the top of every family home screen.',
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
    var rows = D.ANNOUNCEMENTS.filter(function (a) {
      return Grove.match(q, a.head, a.aud, a.by, a.body);
    });

    var table = ui.table(
      ['Headline', 'Audience', { label: 'Published', shrink: true }, 'By', { label: 'Status', shrink: true }],
      rows.map(function (a) {
        return {
          to: 'announcement', id: a.id,
          cells: [
            ui.two(a.head, a.body),
            ui.mute(a.aud),
            ui.mute(a.when),
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
     mean everywhere else in the product. */

  function transcript(t) {
    var lines = D.TRANSCRIPTS[t.id] || [];
    if (!lines.length) {
      return ui.empty('No messages yet', 'Nothing has been sent to this family.');
    }
    return lines.map(function (m) {
      var mine = m.m === 'us';
      var day = m.d ? h`<p class="section-title">${m.d}</p>` : '';
      var bubble = ui.notice({
        kind: mine ? 'ok' : 'warn',
        title: (mine ? 'Studio' : t.who) + ' · ' + m.s,
        text: m.t
      });
      return day + (mine
        ? ui.grid('aside', ['<div></div>', bubble])
        : ui.grid('sidebar', [bubble, '<div></div>']));
    }).join('');
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
      var kids = D.STUDENTS.filter(function (s) { return s.family === t.fam; });
      var waiting = D.WAITLIST.filter(function (w) { return w.fam === t.fam; });

      var flags = h`<div class="inline">
        ${raw(t.unread ? ui.pill('Unread', 'warn') : ui.pill('Answered', 'ok'))}
        ${raw(ui.pill('Private to this family'))}
      </div>`;

      var conversation = ui.card({ title: 'Conversation' }, h`<div class="stack stack--lg">
        <div class="stack">${raw(transcript(t))}</div>
        <div class="stack">
          ${raw(ui.field({ label: 'Reply', control: ui.textarea({ placeholder: 'Write a reply…' }) }))}
          ${raw(ui.btns([
            { label: 'Send reply', kind: 'primary', msg: 'Sent to the ' + t.fam + ' family' }
          ]))}
        </div>
      </div>`);

      var about = ui.card({
        title: 'This family',
        note: 'A reply is private to this family. Studio-wide news belongs in Announcements.'
      }, ui.kv([
        ['Guardian', esc(f.guardian)],
        ['Email', esc(f.email)],
        ['Children', kids.length
          ? esc(kids.map(function (s) { return s.name; }).join(', '))
          : 'None enrolled'],
        { k: 'Balance', v: esc(Grove.money(f.balance)), tone: f.balance > 0 ? 'clay' : null },
        ['Status', esc(f.status)],
        waiting.length
          ? ['On a waitlist', esc(waiting[0].child + ' · ' + waiting[0].cls)]
          : { k: 'On a waitlist', v: 'Nobody', tone: 'mute' }
      ]));

      return flags + '<div class="section">' + ui.grid('sidebar', [conversation, about]) + '</div>';
    }
  };

  /* The crumb has to name the family, and the shell reads crumbTitle as a
     value rather than calling it, so it is defined as a getter. */
  Object.defineProperty(threadDef, 'crumbTitle', {
    get: function () { return thr({ params: Grove.state.params }).fam + ' family'; }
  });

  Grove.screen('thread', threadDef);

  /* ---- new message --------------------------------------------------------
     The two cards sit in one ui.grid(2), so they are exactly the same height.
     That is the inconsistency the client screenshotted. */

  Grove.screen('newMessage', {
    surface: 'console',
    crumbs: [{ label: 'Messages', to: 'messages' }],
    eyebrow: 'just to this family',
    title: 'New message',
    sub: 'A private conversation with one family. For studio-wide news use Announcements instead.',

    body: function () {
      var to = ui.card({
        title: 'To',
        note: 'It arrives in the family portal under Messages. No other family can see it.'
      }, ui.fields(null, [
        ui.field({
          label: 'Family',
          control: ui.select({
            value: 'Johnson family',
            options: D.FAMILIES.map(function (f) { return f.name + ' family'; })
          })
        }),
        ui.field({
          label: 'Subject',
          control: ui.input({ placeholder: 'e.g. Emma’s Wednesday place' })
        })
      ]));

      var message = ui.card({ title: 'Message' }, ui.fields(null, [
        ui.field({
          label: 'Message',
          control: ui.textarea({ placeholder: 'Write to the family' })
        })
      ]));

      return ui.grid(2, [to, message]) + ui.formActions([
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
    eyebrow: 'everyone sees this',
    title: function (ctx) { return ann(ctx).head; },
    sub: function (ctx) {
      var a = ann(ctx);
      return 'Posted ' + a.when + ' by ' + a.by;
    },
    actions: function (ctx) {
      var pinned = ann(ctx).status === 'Pinned';
      return [
        { label: 'Take down', kind: 'danger', msg: 'Prototype — nothing was taken down' },
        { label: pinned ? 'Unpin' : 'Pin to top', msg: pinned ? 'Unpinned' : 'Pinned to every family home' },
        { label: 'Edit', kind: 'primary', msg: 'Prototype — no form yet' }
      ];
    },

    body: function (ctx) {
      var a = ann(ctx);

      var flags = h`<div class="inline">
        ${raw(ui.pill(a.status, ANN_KIND[a.status]))}
        ${raw(ui.pill(a.aud))}
        ${raw(ui.pill('Public to parents'))}
      </div>`;

      var post = ui.card({
        title: 'What families see',
        note: 'Announcements are read-only for families. If someone needs to reply, they use Messages.'
      }, ui.notice({ kind: 'ok', title: a.head, text: a.body }));

      var who = ui.card({ title: 'Who sees it' }, ui.kv([
        ['Audience', esc(a.aud)],
        ['Where', 'Top of the family home screen'],
        ['Pinned', a.status === 'Pinned' ? 'Yes' : 'No']
      ]));

      var record = ui.card({ title: 'Record' }, ui.kv([
        ['Posted', esc(a.when)],
        ['Author', esc(a.by)],
        ['Status', esc(a.status)],
        ['Sent by email', a.status === 'Scheduled' ? 'Will send on posting' : 'Yes']
      ]));

      return flags + '<div class="section">' + ui.grid(3, [post, who, record]) + '</div>';
    }
  });
})();
