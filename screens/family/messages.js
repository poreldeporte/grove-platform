/* Family → Messages. The parent's one conversation with the studio.

   A parent has exactly ONE correspondent — the studio — so this screen has no
   tabs, no thread list and no search. There is nothing to switch between and
   nothing to search through: the whole transcript is one card, with the reply
   box underneath it.

   Simplifications against the old design:
     - the old inbox of four "studio announcements" is gone. Those notices are
       the same messages that already sit in the transcript, so listing them
       again beside it was the same news twice.
     - the three quick chips under the composer are gone. Two only typed a
       sentence the parent can type themselves; the third was a link to the
       schedule, which is now the one header action.
     - the old build made this the only chrome-less screen in the portal, with
       its own header strip and no page header. It now uses the same header as
       every other screen; the studio's name and reply time live on the card.

   Fixed after the visual review:
     - the last studio line was stamped "Today · 2 hrs ago" while Home dates
       the same make-up news 27 Jul 2026. A line stamped in relative time
       cannot be placed on a day, so the thread drops it and takes the dated
       announcement that carries the same news instead. Every divider is now a
       real date, and the thread, Home and ANNOUNCEMENTS agree on all of them.
     - studio-wide news the transcript never carried — "New kiln, clay classes
       back to full size", 2 Jul — is folded in. Any published announcement
       whose day the transcript does not already cover is inserted in date
       order, so the subtitle's promise holds. A scheduled announcement has
       not gone out, so it is left out, exactly as Home leaves it out.
     - an announcement reads in the thread as its headline followed by its
       body, which is the wording the transcript itself uses for the 18 July
       post, so no message is worded two ways in two places.
     - the per-bubble time stamp is gone: the day divider above it already
       says when, and saying it twice is what made the dates look unreliable.
       FAMILY_TRANSCRIPT carries no clock times at all, only dates, so a time
       on a bubble would have to be invented.
     - the transcript is now a conversation pane, not a long document. The
       message list is the only thing that scrolls and the composer is pinned
       under it, so a parent no longer scrolls past the whole history to
       reply.
     - cFamMessage — the single-announcement page — is deleted. Nothing in the
       portal linked to it; it repeated one line of copy that this thread and
       Home both show in full, restated "from the studio" three times, and
       filled its second card with routing metadata ("sent to: After-School
       Art", "sent by: Dani Cruz") that is the studio's plumbing, not a
       parent's business — above roughly 450px of empty cream. Home deleted
       its own announcement page (fNews) for the same reason.

   Written for a parent who is not confident with a screen:
     - "a tinted message went to every family" told a parent to look for a
       colour and then work out what it meant. The subtitle now says what the
       box at the bottom does and what the mark on a message means, in words,
       and the mark itself reads "Studio news" rather than "To all families" —
       which was also not quite true of the 27 July post, sent to the
       After-School families rather than to everyone.
     - the mark is applied consistently. It used to sit only on the two
       announcements the transcript did not carry, so the 18 and 21 July
       lines — which are announcements an1 and an3 word for word — looked
       like private letters while the same kind of message two days earlier
       looked like news. A studio line is now marked whenever the studio
       published something that day.
     - "credit" is the studio's word for what it owes; a parent has "a class
       to make up". It is banned everywhere else in the family portal, so a
       line carrying it — or carrying "slot", where the schedule says "hour" —
       is put into the parent's words here too. Only the wording changes: the
       dates, the child and the count are untouched.
     - the reply box is a box and an unlabelled round button. The subtitle
       names the button, and the conversation header now names the person who
       reads what you send — read from STAFF, where the front desk is a real
       member of staff — instead of the disembodied "usually replies the same
       day".
     - the 27 July message says Emma has classes to make up and invites the
       family to take one of Friday's hours, and there was nothing on the
       screen to do that with. Booking is now a header action, shown only
       while a child of this family actually has a class to make up.
*/
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  var STUDIO = 'The Grove Art Studio';
  var FAMILY = 'johnson';
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* The demo's year, read from the dataset rather than written down, so a
     stamp like "21 Jul" lands in the same year as "21 Jul 2026". */
  function thisYear() {
    var m = String(D.today).match(/\d{4}/);
    return m ? Number(m[0]) : 0;
  }

  /* "18 Jul 2026" and "18 July" both become 20260718, so the thread can be
     ordered without a date library. Anything that names no month — "Today",
     "2 hrs ago" — cannot be placed on a day and comes back 0. */
  function stamp(when) {
    var parts = String(when).replace(/,/g, ' ').split(' ');
    var day = 0, mon = 0, yr = 0;
    parts.forEach(function (t) {
      if (!t) return;
      var n = parseInt(t, 10);
      if (!isNaN(n)) {
        if (t.length === 4 && n > 1000) yr = n;
        else if (!day) day = n;
        return;
      }
      if (!mon) {
        var i = MONTHS.indexOf(t.slice(0, 3));
        if (i !== -1) mon = i + 1;
      }
    });
    if (!day || !mon) return 0;
    return (yr || thisYear()) * 10000 + mon * 100 + day;
  }

  function dateLabel(at) {
    return (at % 100) + ' ' + MONTHS[Math.floor(at / 100) % 100 - 1] + ' ' + Math.floor(at / 10000);
  }

  /* A scheduled announcement has not been sent, so the family cannot have
     received it. Home applies the same rule to the same list. */
  function published() {
    return D.ANNOUNCEMENTS.filter(function (a) { return a.status !== 'Scheduled'; });
  }

  /* ---- the parent's words ---------------------------------------------------
     "Credit" is the studio's name for what it owes a family, and it is out of
     the family portal everywhere else: the schedule says "a class to make up",
     and it calls an open hour an hour rather than a slot. A message carrying
     the studio's vocabulary is read back in the parent's, which changes the
     wording and nothing else. */

  var PLAIN = [
    [/\bmake-up slots\b/gi, 'make-up hours'],
            [/\bcredits\b/gi, 'classes to make up'],
    [/\bcredit\b/gi, 'class to make up'],
    [/\badded to your account\b/gi, 'added for you']
  ];

  function plain(text) {
    var out = String(text);
    PLAIN.forEach(function (rule) { out = out.replace(rule[0], rule[1]); });
    /* A replacement at the head of a sentence must not lower-case it. */
    if (/^[A-Z]/.test(text)) out = out.charAt(0).toUpperCase() + out.slice(1);
    return out;
  }

  /* The person on the other end. "Usually replies the same day" does not say
     whether anybody is actually there, and that is the doubt that makes a
     parent ring instead of write. The front desk is a real member of staff,
     so the conversation header says their name. */
  function frontDesk() {
    var who = D.STAFF.filter(function (s) { return s.role === 'Front desk'; })[0];
    return who ? String(who.name).split(' ')[0] : '';
  }
  function repliesLine() {
    var who = frontDesk();
    return who
      ? who + ' at the front desk reads these, usually the same day'
      : 'The front desk reads these, usually the same day';
  }
  function sentLine() {
    var who = frontDesk();
    return who
      ? 'Sent — ' + who + ' at the front desk usually replies the same day'
      : 'Sent — the studio usually replies the same day';
  }

  /* Children in this family holding a pack. An extra class spends a session
     out of it, so the booking action is offered whenever one of them does. */
  function onAPack() {
    return D.STUDENTS.filter(function (s) {
      return s.family === D.family(FAMILY).name && D.pack(s).isPack;
    });
  }

  /* The transcript, minus any line that cannot be dated. */
  function transcript() {
    var out = [];
    D.FAMILY_TRANSCRIPT.forEach(function (m, i) {
      var at = stamp(m.d) || stamp(m.s);
      if (!at) return;
      out.push({ at: at, seq: i, mine: m.m === 'us', text: m.t });
    });
    return out;
  }

  /* Studio-wide news the transcript does not already carry. One post a day,
     so a day the studio already wrote on is a day already covered. */
  function alsoPosted(lines) {
    var covered = {};
    lines.forEach(function (l) { if (!l.mine) covered[l.at] = true; });

    return published().filter(function (a) {
      return !covered[stamp(a.when)];
    }).map(function (a) {
      return { at: stamp(a.when), seq: -1, mine: false, text: a.head + '. ' + a.body };
    });
  }

  /* The days the studio published news. A studio line on one of those days is
     news whether the transcript carried it or the thread folded it in, so the
     same kind of message never appears two different ways. */
  function newsDays() {
    var days = {};
    published().forEach(function (a) { days[stamp(a.when)] = true; });
    return days;
  }

  function messages() {
    var lines = transcript();
    return lines.concat(alsoPosted(lines)).sort(function (a, b) {
      return (a.at - b.at) || (a.seq - b.seq);
    });
  }

  /* ---- the conversation ---------------------------------------------------
     One bubble per message: the studio on the left, the family on the right.
     The studio's name sits in the chat header rather than on every bubble, so
     the only bubble that needs a label is one carrying news the studio sent
     out more widely — which should not read as a letter written to this
     family in particular. */

  function lines() {
    var news = newsDays();
    return messages().map(function (m) {
      var broadcast = !m.mine && !!news[m.at];
      return {
        day: dateLabel(m.at),
        mine: m.mine,
        text: plain(m.text),
        who: broadcast ? 'Studio news' : '',
        kind: broadcast ? 'notice' : ''
      };
    });
  }

  Grove.screen('fMessages', {
    surface: 'family',
    chat: true,
    crumbTitle: 'Messages',
    eyebrow: 'talk to the studio',
    title: 'Messages',
    sub: 'Write in the box at the bottom and press the round arrow to send. Anything marked “Studio news” also went to other families.',

    actions: function () {
      var list = [{ label: 'Report an absence', to: 'fSchedule' }];
      if (onAPack().length) list.push({ label: 'Book a make-up class', to: 'fBookMakeup' });
      return list;
    },

    body: function () {
      return ui.chat({
        name: STUDIO,
        initials: 'GS',
        status: repliesLine(),
        placeholder: 'Write your message here…',
        send: { label: 'Send your message', msg: sentLine() }
      }, lines());
    }
  });
})();
