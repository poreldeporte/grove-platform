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
       reply. A studio-wide notice is tinted and labelled "To all families",
       which is the one thing a 1:1 chat cannot show by position alone.
     - cFamMessage — the single-announcement page — is deleted. Nothing in the
       portal linked to it; it repeated one line of copy that this thread and
       Home both show in full, restated "from the studio" three times, and
       filled its second card with routing metadata ("sent to: After-School
       Art", "sent by: Dani Cruz") that is the studio's plumbing, not a
       parent's business — above roughly 450px of empty cream. Home deleted
       its own announcement page (fNews) for the same reason.
*/
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  var STUDIO = 'The Grove Art Studio';
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
      return { at: stamp(a.when), seq: -1, mine: false, notice: true, text: a.head + '. ' + a.body };
    });
  }

  function messages() {
    var lines = transcript();
    return lines.concat(alsoPosted(lines)).sort(function (a, b) {
      return (a.at - b.at) || (a.seq - b.seq);
    });
  }

  /* ---- the conversation ---------------------------------------------------
     One bubble per message: the studio on the left, the family on the right.
     The studio's name sits in the chat header rather than on every bubble,
     so the only bubble that needs a label is a studio-wide notice — which is
     not addressed to this family in particular and should not read as if it
     were. */

  function lines() {
    return messages().map(function (m) {
      return {
        day: dateLabel(m.at),
        mine: m.mine,
        text: m.text,
        who: m.notice ? 'To all families' : '',
        kind: m.notice ? 'notice' : ''
      };
    });
  }

  Grove.screen('fMessages', {
    surface: 'family',
    chat: true,
    crumbTitle: 'Messages',
    eyebrow: 'talk to the studio',
    title: 'Messages',
    sub: 'One conversation with the studio. Anything you write reaches the front desk; a tinted message went to every family.',
    actions: [
      { label: 'Report an absence', to: 'fSchedule' }
    ],

    body: function () {
      return ui.chat({
        name: STUDIO,
        initials: 'GS',
        status: 'Usually replies the same day',
        placeholder: 'Message the studio\u2026',
        send: { label: 'Send', msg: 'Sent \u2014 the studio usually replies the same day' }
      }, lines());
    }
  });
})();
