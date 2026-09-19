/* Family → Home, plus the two small pages it opens: an announcement and a
   calendar event.

   Simplifications against the previous build:
     - the chartreuse studio-news panel and the full-bleed green "next up"
       panel are ordinary cards. Neither colour exists as a token, and the
       news block is a list of announcements like any other list
     - the "Children", "This week" and "Account" blocks were miniature
       reproductions of Children, Schedule and Billing. The rail already
       leads to all three, so they are gone and Billing is a header action
     - the announcement page's "Back to home" button duplicated the
       breadcrumb, and its audience and "Announcement" chips repeated the
       rows directly beneath them. All three are cut
     - the event page's four-track section grid is a two-card grid, so it
       no longer leaves half a row empty */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  function ann(id) {
    return D.ANNOUNCEMENTS.filter(function (a) { return a.id === id; })[0];
  }
  function cls(id) {
    return D.CLASSES.filter(function (c) { return c.id === id; })[0];
  }
  function doc(id) {
    return D.DOCUMENTS.filter(function (d) { return d.id === id; })[0];
  }

  /* A scheduled announcement has not gone out yet, so the family cannot see
     it. Everything else the studio has published is here. */
  function published() {
    return D.ANNOUNCEMENTS.filter(function (a) { return a.status !== 'Scheduled'; });
  }

  /* A small dated card: the date is the card label, one clickable row inside. */
  function upNext(when, prog, name, sub, to) {
    return ui.card({ title: when, flush: true }, ui.rows([{
      title: ui.dot(D.program(prog).color) + ' ' + esc(name),
      sub: esc(sub),
      to: to
    }]));
  }

  /* ---- home ---------------------------------------------------------------- */

  Grove.screen('fHome', {
    surface: 'family',
    crumbTitle: 'Home',
    eyebrow: 'tuesday 28 july',
    title: 'Morning, Sabrina',
    sub: 'Two things need you this week.',
    actions: [
      { label: 'Billing', to: 'fBilling' },
      { label: 'Message the studio', kind: 'primary', to: 'fMessages' }
    ],

    body: function () {
      var emma = D.student('emma');
      var terms = doc('d1');
      var camp = cls('c6');
      var party = cls('c12');
      var bring = ann('an3');

      var news = ui.card({
        title: 'From the studio',
        head: ui.btn({
          label: 'All announcements',
          kind: 'quiet',
          size: 'sm',
          msg: 'Every announcement from the studio'
        }),
        flush: true
      }, ui.rows(published().map(function (a) {
        return {
          title: esc(a.head),
          sub: esc(a.body),
          end: '<span class="cell-mute">' + esc(a.when) + '</span>',
          to: 'fNews',
          id: a.id
        };
      })));

      var todo =
        ui.notice({
          kind: 'warn',
          title: 'Payment terms have changed',
          text: terms.version + ', published ' + terms.published +
                '. Two minutes to read, one tap to sign.',
          action: { label: 'Review', to: 'fDocuments' }
        }) +
        ui.notice({
          kind: 'ok',
          title: emma.mk + ' make-up classes to book',
          text: 'Emma has two credits left in this billing cycle. ' +
                'Two extra hours have opened this Friday, 10:00 and 11:00.',
          action: { label: 'Book', to: 'fSchedule' }
        });

      var tiles = [
        upNext('Wed 29 Jul', camp.prog, 'Emma · ' + camp.name,
               camp.time + ' · ' + camp.room, 'fSchedule'),
        upNext('Fri 31 Jul', 'as', 'Make-up slots open',
               '10:00 and 11:00 · ' + emma.mk + ' credits', 'fSchedule'),
        upNext('Sat 1 Aug', party.prog, party.name,
               party.time + ' · you are a guest', 'fEvent'),
        upNext('Mon 3 Aug', 'as', 'Autumn term begins',
               'Emma · ' + emma.cls, 'fSchedule')
      ];

      var nextUp = ui.card({
        title: 'Next up',
        head: ui.btn({ label: 'Can’t make it', kind: 'quiet', size: 'sm', to: 'fSchedule' }),
        note: 'What to bring: ' + bring.body
      }, ui.kv([
        ['Child', esc(emma.name)],
        ['Class', esc(camp.name)],
        ['When', 'Tomorrow, Wed 29 July · ' + esc(camp.time)],
        ['Where', esc(camp.room)],
        ['Teacher', esc(camp.staff)]
      ]));

      return h`
        ${raw(news)}
        <div class="section">${raw(todo)}</div>
        <div class="section">
          <div class="section-head">
            <h2 class="section-title">Coming up</h2>
            ${raw(ui.btn({ label: 'Full calendar', kind: 'quiet', size: 'sm', to: 'fSchedule' }))}
          </div>
          ${raw(ui.grid(4, tiles))}
        </div>
        <div class="section">${raw(nextUp)}</div>
      `;
    }
  });

  /* ---- an announcement ------------------------------------------------------ */

  Grove.screen('fNews', {
    surface: 'family',
    crumbTitle: 'Announcement',
    eyebrow: 'from the studio',
    title: function (ctx) { return news(ctx).head; },
    sub: function (ctx) { return 'Posted ' + news(ctx).when; },
    actions: [
      { label: 'Message the studio', kind: 'primary', to: 'fMessages' }
    ],

    body: function (ctx) {
      var a = news(ctx);

      var message = ui.card({ title: 'The message' }, esc(a.body));

      var about = ui.card({
        title: 'About this post',
        note: 'Announcements are one-way. If you need to reply, use Messages and we will answer you directly.'
      }, ui.kv([
        ['Posted', esc(a.when)],
        ['Audience', esc(a.aud)],
        ['Posted by', esc(a.by)]
      ]));

      return ui.grid(2, [message, about]);
    }
  });

  function news(ctx) {
    return ann(ctx.params.id) || D.ANNOUNCEMENTS[0];
  }

  /* ---- an event -------------------------------------------------------------- */

  Grove.screen('fEvent', {
    surface: 'family',
    crumbTitle: 'Event',
    eyebrow: 'on your calendar',
    title: function () { return cls('c12').name; },
    sub: function () {
      var p = cls('c12');
      return 'Saturday 1 August · ' + p.time + ' · ' + p.room;
    },
    actions: [
      { label: 'See the calendar', kind: 'primary', to: 'fSchedule' }
    ],

    body: function () {
      var p = cls('c12');

      var details = ui.card({ title: 'Details' }, ui.kv([
        ['When', 'Saturday 1 August · ' + esc(p.time)],
        ['Where', esc(p.room)],
        ['Run by', esc(p.staff)],
        ['Cost', 'Nothing to pay']
      ]));

      var know = ui.card({
        title: 'What to know',
        note: 'Nothing to book. If you cannot come, a message to the studio is enough.'
      }, 'Emma is a guest at this party, so there is no place to hold and no charge on your account. Drop-off is at 1:00pm and collection at 3:00pm.');

      return ui.grid(2, [details, know]);
    }
  });
})();
