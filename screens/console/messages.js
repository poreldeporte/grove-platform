/* Console → Messages: conversations and announcements, one thread, and the two
   composers — a message to one family, an announcement to an audience.

   WHAT THIS SCREEN IS
   Messages and Announcements used to be two rail items. They are one screen
   with two tabs, because the question under both is the same: this family, or
   everyone? Answering it in one place is what stops a private reply going out
   as studio-wide news.

   Standing decisions from the earlier passes, kept:
     - no stat bands. The tab counts and the single toolbar count carry it, and
       "reach — 130 families" was a number no other screen could corroborate.
     - the thread is the real transcript from TRANSCRIPTS, in the same chat pane
       the family portal uses, with the family's details beside it.
     - announcements are ordered pinned, then posted newest first, then anything
       not posted. A post that has not gone out reads "Not yet" rather than
       showing a date in the past under a "Posted" heading.
     - an announcement that names a child on the register is called out, because
       an announcement is public and one child's business is not.

   CUT IN THIS PASS — fitting the console to Sabrina, who owns the studio
     - "New announcement" was a toast saying no form existed, and so was every
       "Edit" on a post. There is a composer now. The mistake it exists to
       prevent is the audience, so the audience is the first thing on it, every
       option says how many families it reaches, the families are named down the
       side, and the button reads "Post to 68 families".
     - the composer offers an audience only for a program that has a family on
       the roll. No-School Day has nobody on it yet, and a dead option on the
       one control that must not be got wrong is worse than no option.
     - the announcement's "Who sees it" card held three rows, two of which said
       the same thing about every announcement ever written: "Top of the family
       home screen" and "Sent by email — yes". A row whose answer never changes
       is not a fact about this post. Both are one line of note now, and the
       card carries the audience, the families it reaches and the status.
     - the pill strip above the post went with them. "Public to parents" is true
       of all five posts, and the status pill was the third place on one page to
       say the same word.
     - "Post now" was the middle of three header buttons, and its confirmation
       claimed every family home screen whatever the audience said. Posting is
       the only reason an unposted announcement is on screen, so it is a sticky
       bar at the foot that names the families it is about to reach, and taking
       a post down now says plainly what that does to the email already sent.
     - the thread offered "Open family" in the header and "Open record" in the
       card head — one decision, two buttons. The card head keeps its title.
     - "Mark answered" shows only on a conversation that is unanswered. On the
       other two it did nothing.
     - the new-message form asked for a Subject. Nothing carries one: a thread
       is a family, a last line and a time, and the parent's portal never shows
       a subject. A field whose answer is written nowhere is not a question.
     - both composers end in a sticky action bar, so "Send message" no longer
       sits below a card of conversations still waiting.

   THIS PASS — the whole roll
     - the audience is joined off the register. A child's classes come from
       D.classesOf, not from reading the day and the hour back out of the
       free-text line under their name, so a private lesson or a third class
       counts towards the audience it belongs to.
     - a studio-wide post now reaches 68 families, so "Who will get this" names
       them under a count in the head of the card rather than a bare list you
       have to reach the bottom of to know how long it is.
     - the family picker on a new message is alphabetical. Sixty-eight families
       in the order they joined is a list nobody can find a name in.
     - a child in the thread sidebar shows the classes the register has them in
       and, if they are in none, the class they are waiting for.

   KEPT DENSE ON PURPOSE
     Both tabs are tables and stay tables: six conversations and five posts read
     at a glance, one click to the one she wants. Pinned / Live / Scheduled
     stays three words because she does three different things with them —
     unpin, pin, post. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  var EVERYONE = 'All families';
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
  function annNamed(id) {
    return D.ANNOUNCEMENTS.filter(function (a) { return a.id === id; })[0] || null;
  }
  function ann(ctx) {
    return annNamed(ctx.params.id) || D.ANNOUNCEMENTS[0];
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
  function plural(n, one, many) {
    return n + ' ' + (n === 1 ? one : many);
  }
  function families(n) {
    return plural(n, 'family', 'families');
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

  /* ---- who an audience reaches ---------------------------------------------
     An announcement is addressed either to every family or to the families of
     one program, and PROGRAMS holds those names. Which families that is comes
     off the register: every child carries the classes they are in, so one pass
     over the roll gives each family the programs it is actually on. */

  function audProgram(aud) {
    var hit = null;
    Object.keys(D.PROGRAMS).forEach(function (k) {
      if (D.PROGRAMS[k].name === aud) hit = D.PROGRAMS[k];
    });
    return hit;
  }

  /* family name -> the programs its children are enrolled in, built once. */
  var BY_FAMILY = null;
  function progsOfFamily(f) {
    if (!BY_FAMILY) {
      BY_FAMILY = {};
      D.STUDENTS.forEach(function (s) {
        var list = BY_FAMILY[s.family] || (BY_FAMILY[s.family] = []);
        D.classesOf(s).forEach(function (c) {
          if (list.indexOf(c.prog) === -1) list.push(c.prog);
        });
      });
    }
    return BY_FAMILY[f.name] || [];
  }

  /* Every family an audience lands on, counted off the roll rather than
     written down, so the composer and the post can never disagree. */
  function reaches(aud) {
    var p = audProgram(aud);
    if (!p) return D.FAMILIES.slice();
    return D.FAMILIES.filter(function (f) {
      return progsOfFamily(f).indexOf(p.id) !== -1;
    });
  }

  /* The audiences worth offering: everyone, and the programs that actually have
     a family on the roll. An audience reaching nobody is a dead option on the
     one control it matters most to get right. */
  function audiences(current) {
    var list = [{ id: EVERYONE, title: 'Every family' }];
    Object.keys(D.PROGRAMS).forEach(function (k) {
      var p = D.PROGRAMS[k];
      if (reaches(p.name).length) list.push({ id: p.name, title: 'Every ' + p.name + ' family' });
    });
    var known = list.filter(function (o) { return o.id === current; }).length;
    if (current && !known) list.push({ id: current, title: current });
    return list;
  }

  /* ---- messages: conversations + announcements ---------------------------- */

  function onAnnouncements() {
    return Grove.tab('messages', 'Conversations') === 'Announcements';
  }

  Grove.screen('messages', {
    surface: 'console',
    eyebrow: 'one family, or everyone',
    title: 'Messages',
    sub: 'Private conversations with individual families. An announcement is public and read-only: it goes to everyone or to one program, and it reaches the family home screen only once it is posted.',

    /* The primary follows the tab, so the button the screen is offering is the
       one for the list under it. */
    actions: function () {
      var message = { label: 'New message', to: 'newMessage' };
      var post = { label: 'New announcement', to: 'newAnnouncement' };
      var lead = onAnnouncements() ? post : message;
      var other = onAnnouncements() ? message : post;
      return [other, { label: lead.label, to: lead.to, kind: 'primary' }];
    },

    body: function () {
      return onAnnouncements() ? announcementsTab() : conversationsTab();
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
    var waiting = rows.filter(function (t) { return t.unread; }).length;

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
      count: rows.length + ' of ' + D.THREADS.length + ' conversations · ' +
        (waiting ? waiting + ' waiting on the studio' : 'none waiting on the studio')
    }) + ui.card({ flush: true }, table);
  }

  function announcementsTab() {
    var q = Grove.query('announcements');
    var rows = annSorted().filter(function (a) {
      return Grove.match(q, a.head, a.aud, a.by, a.body);
    });
    var live = rows.filter(function (a) { return isPosted(a); }).length;

    var table = ui.table(
      ['Headline', 'Audience', { label: 'Posted', shrink: true }, 'By', { label: 'Status', shrink: true }],
      rows.map(function (a) {
        return {
          to: 'announcement', id: a.id,
          cells: [
            ui.two(a.head, a.body),
            ui.two(a.aud, families(reaches(a.aud).length)),
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
      count: rows.length + ' of ' + D.ANNOUNCEMENTS.length + ' announcements · ' +
        live + ' on family home screens'
    }) + ui.card({ flush: true }, table);
  }

  /* ---- one conversation ---------------------------------------------------
     The same conversation pane the family portal uses, so a message looks the
     same to the studio as it does to the parent who sent it. Only the message
     list scrolls; the composer stays pinned, and it is the one thing this
     screen is for, so nothing else on the page is styled as the primary. */

  function chatLines(t) {
    return (D.TRANSCRIPTS[t.id] || []).map(function (m) {
      return { day: m.d || '', mine: m.m === 'us', text: m.t, time: m.s };
    });
  }

  /* One child, as the register has them: the classes they are in, or — if they
     are in none — the class they are waiting for. Nothing here is typed by
     hand and nothing is read out of a free-text line. */
  function waitingFor(s) {
    return D.WAITLIST.filter(function (w) { return w.child === s.name; })[0] || null;
  }
  function childRow(s) {
    var classes = D.classesOf(s);
    var waiting = classes.length ? null : waitingFor(s);
    var line = classes.length
      ? classes.map(function (c) { return c.day + ' ' + c.time; }).join(' · ')
      : (waiting ? waiting.cls : 'Not yet enrolled');

    var end = '';
    if (waiting) end = ui.pill('Waitlist', 'warn');
    else if (s.flag) end = ui.pill(s.flag, s.flagKind === 'bad' ? 'bad' : 'warn');
    else if (D.pack(s).isPack) {
      var pk = D.pack(s);
      end = ui.mute(pk.left === 1 ? 'Pack renews next class' : pk.left + ' of ' + pk.size + ' left');
    }

    return {
      title: esc(s.name),
      sub: esc(line),
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
    /* Nothing to mark on a conversation that has already been answered. */
    actions: function (ctx) {
      var t = thr(ctx);
      var list = [];
      if (t.unread) list.push({ label: 'Mark answered', msg: 'Marked answered' });
      list.push({ label: 'Open family', kind: 'primary', to: 'familyRecord', id: famNamed(t.fam).id });
      return list;
    },

    chat: true,

    body: function (ctx) {
      var t = thr(ctx);
      var f = famNamed(t.fam);
      var kids = kidsOf(t.fam);
      var lines = chatLines(t);

      var conversation = lines.length
        ? ui.chat({
            name: t.fam + ' family',
            initials: t.fam.slice(0, 2).toUpperCase(),
            status: t.who + ' · last message ' + t.when,
            placeholder: 'Reply to the ' + t.fam + ' family…',
            send: { label: 'Send reply', msg: 'Sent to the ' + t.fam + ' family' }
          }, lines)
        : ui.card({ title: 'Conversation' },
            ui.empty('No messages yet', 'Nothing has been sent to this family.'));

      var about = ui.card({ title: 'This family' }, ui.kv([
        ['Guardian', f.guardian],
        ['Email', f.email],
        ['Phone', f.phone],
        { k: 'Balance', v: Grove.money(f.balance), tone: f.balance > 0 ? 'clay' : null },
        ['Status', f.status]
      ]));

      var children = ui.card({ title: 'Children', flush: true },
        kids.length
          ? ui.rows(kids.map(childRow))
          : ui.empty('No children on the roll', 'This family has not enrolled anyone yet.'));

      return h`<div class="chat-layout">
        ${raw(conversation)}
        <div class="chat-layout__aside">${raw(about)}${raw(children)}</div>
      </div>`;
    }
  };

  Grove.screen('thread', threadDef);

  /* ---- new message --------------------------------------------------------
     One question — which family — and the note to write. The conversations
     already waiting sit under it, because the commonest mistake here is
     starting a second thread with a family who is mid-sentence in the first.
     Send is pinned to the foot so it is never below that card. */

  Grove.screen('newMessage', {
    surface: 'console',
    crumbs: [{ label: 'Messages', to: 'messages' }],
    eyebrow: 'just to this family',
    title: 'New message',
    sub: 'A private conversation with one family. News for everyone, or for a whole program, belongs in Announcements.',

    body: function () {
      var PICK = 'Choose a family';
      var unread = D.THREADS.filter(function (t) { return t.unread; });

      /* Alphabetical: the whole roll is in this list, and the order families
         joined the studio is no help at all in finding one of them. */
      var names = D.FAMILIES.map(function (f) { return f.name + ' family'; }).sort();

      var to = ui.card({
        title: 'To',
        note: 'It arrives in the family portal under Messages.'
      }, ui.field({
        label: 'Family',
        hint: families(D.FAMILIES.length) + ' on the roll, in alphabetical order.',
        control: ui.select({
          value: PICK,
          options: [PICK].concat(names)
        })
      }));

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

      return h`
        ${raw(ui.grid('aside', [ui.col([to, waiting]), message]))}
        ${raw(ui.formActions([
          { label: 'Send message', kind: 'primary', msg: 'Message sent' },
          { label: 'Cancel', to: 'messages' }
        ], { sticky: true, hint: 'Only the family you choose can read this' }))}
      `;
    }
  });

  /* ---- write an announcement ------------------------------------------------
     The audience is the first thing on the page and the last thing on the
     button, because sending studio news to the wrong people is the mistake this
     screen exists to prevent. Every option says how many families it lands on,
     the families themselves are named down the side, and the count is taken off
     the roll rather than written down. The same screen edits a post that
     already exists, so "Edit" is no longer a toast apologising for itself. */

  function audKey() {
    return 'annAud-' + (Grove.state.params.id || 'new');
  }
  function chosenAud(a) {
    return Grove.filter(audKey(), a ? a.aud : EVERYONE);
  }

  Grove.on('pickAud', function (d) { Grove.setFilter(audKey(), d.id); });

  Grove.screen('newAnnouncement', {
    surface: 'console',
    crumbs: [{ label: 'Messages', to: 'messages' }],
    crumbTitle: function (ctx) {
      return annNamed(ctx.params.id) ? 'Edit announcement' : 'New announcement';
    },
    eyebrow: 'everyone, or one program',
    title: function (ctx) {
      return annNamed(ctx.params.id) ? 'Edit announcement' : 'New announcement';
    },
    sub: function (ctx) {
      var a = annNamed(ctx.params.id);
      if (a && isPosted(a)) {
        return 'This post is already on those families’ home screens. Saving replaces what they read.';
      }
      return 'Public and read-only. Choose who it is for first — every family in that audience sees it on their home screen and gets one email.';
    },

    body: function (ctx) {
      var a = annNamed(ctx.params.id);
      var live = !!a && isPosted(a);
      var aud = chosenAud(a);
      var who = reaches(aud);

      var audience = ui.card({
        title: 'Who will see it',
        note: 'Only a program with a family on the roll is listed. Everyone in the audience gets the post on their home screen and one email, and an email cannot be unsent.'
      }, ui.choices(null, audiences(a ? a.aud : null).map(function (o) {
        return ui.choice({
          id: o.id,
          size: 'lg',
          act: 'pickAud',
          title: o.title,
          sub: families(reaches(o.id).length) + ' on the roll',
          on: o.id === aud
        });
      })));

      /* Writing one now and posting it on Monday is a real second outcome, but
         it is not the reason the page is open, so it sits in the head of the
         card it belongs to rather than as a third button in the action bar. */
      var post = ui.card({
        title: 'The post',
        head: live ? '' : ui.btn({
          label: 'Save without posting',
          kind: 'quiet',
          size: 'sm',
          msg: 'Saved — no family can see it yet'
        })
      }, ui.fields(null, [
        ui.field({
          label: 'Headline',
          control: ui.input({
            placeholder: 'e.g. studio closed on Monday',
            value: a ? a.head : ''
          })
        }),
        ui.field({
          label: 'What families will read',
          hint: 'An announcement is read-only. Anything that needs an answer belongs in a message to one family.',
          control: ui.textarea({
            placeholder: 'Write the announcement',
            value: a ? a.body : ''
          })
        })
      ]));

      /* Named as well as counted. Seeing one family under "Private Class" is
         what stops studio-wide news going out to a single family, and the other
         way round — but the whole roll is 68 names, so the count sits in the
         head where it can be read without reaching the bottom of the list. No
         note on this card: it is the one card on the page whose length is out
         of the composer's hands, so nothing is pinned under it. */
      var reach = ui.card({
        title: 'Who will get this',
        head: ui.pill(families(who.length)),
        flush: true
      }, who.length
        ? ui.rows(who.map(function (f) {
          return { title: esc(f.name + ' family'), sub: esc(f.guardian) };
        }))
        : ui.empty('Nobody is enrolled in that program', 'Choose another audience.'));

      var label = live ? 'Save changes' : 'Post to ' + families(who.length);
      var sent = live
        ? 'Saved — ' + families(who.length) + ' now read the new wording'
        : 'Posted — ' + families(who.length) + ' can see it now';
      var hint = aud === EVERYONE
        ? 'Going to every family on the roll — ' + who.length + ' of them'
        : 'Going to ' + families(who.length) + ' in ' + aud;

      var bar = [
        { label: label, kind: 'primary', msg: sent },
        a ? { label: 'Cancel', to: 'announcement', id: a.id } : { label: 'Cancel', to: 'messages' }
      ];

      return h`
        ${raw(ui.grid('sidebar', [ui.col([audience, post]), reach]))}
        ${raw(ui.formActions(bar, { sticky: true, hint: hint }))}
      `;
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
    /* Posting is the whole reason an unposted post is on screen, so it is not a
       header button among three — it is the bar at the foot. */
    actions: function (ctx) {
      var a = ann(ctx);
      if (!isPosted(a)) {
        return [
          { label: 'Discard', kind: 'danger', msg: 'Discarded — no family had seen it' },
          { label: 'Edit', to: 'newAnnouncement', id: a.id }
        ];
      }
      var pinned = a.status === 'Pinned';
      return [
        { label: 'Take down', kind: 'danger', msg: 'Taken down — the email stays sent' },
        { label: pinned ? 'Unpin' : 'Pin to top', msg: pinned ? 'Unpinned' : 'Pinned to the top of the home screen' },
        { label: 'Edit', kind: 'primary', to: 'newAnnouncement', id: a.id }
      ];
    },

    body: function (ctx) {
      var a = ann(ctx);
      var who = reaches(a.aud);
      var named = childNamedIn(a);
      var others = annSorted().filter(function (x) { return x.id !== a.id; });

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

      var whoCard = ui.card({
        title: 'Who sees it',
        note: isPosted(a)
          ? 'It sits at the top of those home screens and it emailed them once. Taking it down clears the home screens; the email stays sent.'
          : 'Nothing sends this on its own. It reaches those families when you post it, and discarding it now tells nobody, because nobody has seen it.'
      }, ui.kv([
        ['Audience', esc(a.aud)],
        ['Families it reaches', families(who.length)],
        { k: 'Status', v: ui.pill(a.status, ANN_KIND[a.status]) },
        ['Written by', esc(a.by)]
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

      var bar = isPosted(a) ? '' : ui.formActions([
        {
          label: 'Post to ' + families(who.length),
          kind: 'primary',
          msg: 'Posted — ' + families(who.length) + ' can see it now'
        }
      ], { sticky: true, hint: 'It is on no home screen yet' });

      return ui.grid('sidebar', [post, whoCard]) +
        '<div class="section">' + more + '</div>' + bar;
    }
  });

  /* ---- the rail -------------------------------------------------------------
     A thread, a single announcement and the announcement composer are only ever
     reached from Messages, and all three carry a Messages crumb, so the rail
     item has to stay lit while you are inside one. js/nav.js keeps that map for
     the screens it knows about; these are declared here, next to the screens
     they describe. */

  var OWNED = { thread: 'messages', announcement: 'messages', newAnnouncement: 'messages' };
  var ownerElse = Grove.nav.currentFor;
  Grove.nav.currentFor = function (key) {
    return OWNED[key] || ownerElse.call(Grove.nav, key);
  };
})();
