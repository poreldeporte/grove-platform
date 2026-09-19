/* Family → Messages, plus the studio-news detail page.

   A parent has exactly ONE conversation — the studio — so this screen has no
   tabs, no thread list and no search. There is nothing to switch between and
   nothing to search through: the whole transcript is one card, with the reply
   box underneath it.

   Simplifications against the old design:
     - the old inbox of four "studio announcements" is gone. Those four notices
       are the same messages that already sit in the transcript, so listing
       them again beside it was the same news twice.
     - the three quick chips under the composer are gone. Two only typed a
       sentence the parent can type themselves; the third was a link to the
       schedule, which is now the one header action.
     - the old build made this the only chrome-less screen in the portal, with
       its own header strip and no page header. It now uses the same header as
       every other screen; the studio's name and reply time live on the card.
     - cFamMessage (a single studio notice, opened from Home) stays registered
       and reads Grove.data.ANNOUNCEMENTS. Its "Reply" sends the parent back
       here rather than opening a second, separate compose form.
*/
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  var STUDIO = 'The Grove Art Studio';

  /* ---- the conversation ---------------------------------------------------
     One message per grid row. The studio sits in the wide left column; the
     family's own messages sit in the wide right column, with an empty cell
     ahead of them doing the pushing — so the sides read as a conversation
     without a single inline style. */

  function thread() {
    return D.FAMILY_TRANSCRIPT.map(function (m) {
      var mine = m.m === 'us';
      var bubble = ui.notice({
        kind: mine ? 'warn' : null,
        title: (mine ? 'You' : STUDIO) + ' · ' + m.s,
        text: m.t
      });
      var line = mine
        ? ui.grid('aside', [ui.mute(''), bubble])
        : ui.grid('sidebar', [bubble]);
      return (m.d ? h`<p class="section-title">${m.d}</p>` : '') + line;
    }).join('');
  }

  function composer() {
    return h`<div class="section">
      ${raw(ui.field({
        label: 'Reply',
        control: ui.textarea({ placeholder: 'Message the studio…' })
      }))}
      ${raw(ui.formActions([
        { label: 'Send', kind: 'plum', msg: 'Sent — the studio usually replies the same day' }
      ]))}
    </div>`;
  }

  Grove.screen('fMessages', {
    surface: 'family',
    crumbTitle: 'Messages',
    eyebrow: 'talk to the studio',
    title: 'Messages',
    sub: 'One conversation with the studio. Whatever you write reaches the front desk, and studio-wide news lands here too.',
    actions: [
      { label: 'Report an absence', to: 'fSchedule' }
    ],

    body: function () {
      var card = ui.card({
        title: STUDIO,
        head: ui.pill('Usually replies the same day', 'ok')
      }, h`
        <div class="stack">${raw(thread())}</div>
        ${raw(composer())}
      `);

      return ui.grid(null, [card]);
    }
  });

  /* ---- one studio notice, opened from Home --------------------------------- */

  Grove.screen('cFamMessage', {
    surface: 'family',
    crumbs: [{ label: 'Messages', to: 'fMessages' }],
    crumbTitle: 'Message',
    eyebrow: 'from the studio',
    title: function (ctx) { return notice(ctx).head; },
    sub: function (ctx) { return 'From the studio · ' + notice(ctx).when; },
    actions: [
      { label: 'Back to messages', to: 'fMessages' },
      { label: 'Reply', kind: 'plum', msg: 'Reply sent to the studio' }
    ],

    body: function (ctx) {
      var a = notice(ctx);

      var message = ui.card({ title: 'Message' }, h`<p>${a.body}</p>`);

      var details = ui.card({ title: 'Details' }, ui.kv([
        ['Received', esc(a.when)],
        ['From', esc(STUDIO)],
        ['Sent to', esc(a.aud)],
        ['Also emailed', 'Yes']
      ]));

      return ui.grid('sidebar', [message, details]);
    }
  });

  function notice(ctx) {
    return D.ANNOUNCEMENTS.filter(function (a) { return a.id === ctx.params.id; })[0] || D.ANNOUNCEMENTS[1];
  }
})();
