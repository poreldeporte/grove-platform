/* Family → Home. Four blocks: the things that need the parent this week, the
   studio's news, tomorrow's session in full, and the rest of the family's week.

   Simplifications against the previous build:
     - the chartreuse studio-news panel and the full-bleed green "next up"
       panel are ordinary cards. Neither colour exists as a token, and the
       news block is a list of announcements like any other list
     - the "Children", "This week" and "Account" blocks were miniature
       reproductions of Children, Schedule and Billing. The rail already
       leads to all three, so they are gone and Billing is a header action
     - the announcement page (fNews) is gone. An announcement is one line of
       studio copy and that line is shown in full on this page, so the detail
       view could only repeat it, plus a date already in its own header. The
       card now carries the one thing that page added — why announcements
       cannot be replied to
     - the event page (fEvent) is gone for the same reason. The party's facts
       — when, where, who runs it, that a guest pays nothing and books nothing
       — fit on its row and the note beside it, and half that page was empty
     - "Coming up" was four one-row cards under a bare section heading while
       the announcements sat under a card heading: the same label-plus-link
       pattern containerised two ways. It is now one card, headed like the
       others, and tomorrow's session is no longer listed there and detailed
       again directly underneath
     - announcements are sorted newest first, and the make-up figures are
       counted from the family's make-up rows rather than taken from the
       student record, so Home, Schedule and Book a make-up agree */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function ann(id) {
    return D.ANNOUNCEMENTS.filter(function (a) { return a.id === id; })[0];
  }
  function cls(id) {
    return D.CLASSES.filter(function (c) { return c.id === id; })[0];
  }
  function doc(id) {
    return D.DOCUMENTS.filter(function (d) { return d.id === id; })[0];
  }

  /* '18 Jul 2026' → 20260718, so the studio's news can be shown newest first
     without a date library. */
  function stamp(when) {
    var p = String(when).split(' ');
    return Number(p[2]) * 10000 + (MONTHS.indexOf(p[1]) + 1) * 100 + Number(p[0]);
  }

  /* A scheduled announcement has not gone out yet, so the family cannot see
     it. Everything else the studio has published is here, newest first. */
  function published() {
    return D.ANNOUNCEMENTS.filter(function (a) {
      return a.status !== 'Scheduled';
    }).sort(function (a, b) { return stamp(b.when) - stamp(a.when); });
  }

  /* Make-up credits come from the make-up rows, not from the student record's
     running count, because one of Emma's two credits is already booked and
     Schedule shows it that way. Lucas has none in the dataset, so every credit
     this family holds is Emma's. */
  function credits(child, status) {
    return D.MAKEUPS.filter(function (m) {
      return m.child === child && m.status === status;
    });
  }

  /* The things that need the parent. The header count is this list's length,
     so the two never disagree. */
  function todos() {
    var emma = D.student('emma');
    var first = emma.name.split(' ')[0];
    var terms = doc('d1');
    var open = credits(emma.name, 'Available');
    var booked = credits(emma.name, 'Booked');
    var list = [];

    if (!terms.signed) {
      list.push({
        kind: 'warn',
        title: 'Payment terms have changed',
        text: terms.version + ', published ' + terms.published +
              '. Two minutes to read, one tap to sign.',
        action: { label: 'Review', to: 'fDocuments' }
      });
    }

    if (open.length) {
      var text = first + ' has ' + (open.length + booked.length) + ' make-up credits';
      if (booked.length) text += ': ' + booked.length + ' booked for ' + booked[0].booked + ',';
      else text += ':';
      text += ' ' + open.length + ' still to use before ' + open[0].expires + '.';

      list.push({
        kind: 'ok',
        title: open.length + ' make-up class' + (open.length === 1 ? '' : 'es') + ' to book',
        text: text,
        action: { label: 'Book', to: 'fBookMakeup' }
      });
    }

    return list;
  }

  /* ---- home ---------------------------------------------------------------- */

  Grove.screen('fHome', {
    surface: 'family',
    crumbTitle: 'Home',
    eyebrow: 'tuesday 28 july',
    title: function (ctx) { return 'Morning, ' + ctx.persona.name.split(' ')[0]; },
    sub: function () {
      var n = todos().length;
      return n + ' thing' + (n === 1 ? '' : 's') + ' need' + (n === 1 ? 's' : '') + ' you this week.';
    },
    actions: [
      { label: 'Billing', to: 'fBilling' },
      { label: 'Message the studio', kind: 'primary', to: 'fMessages' }
    ],

    body: function () {
      var emma = D.student('emma');
      var first = emma.name.split(' ')[0];
      var camp = cls('c6');
      var after = cls('c2');
      var party = cls('c12');
      var bring = ann('an3');
      var open = credits(emma.name, 'Available');
      var booked = credits(emma.name, 'Booked');

      var todo = todos().map(ui.notice).join('');

      /* The date leads each row rather than sitting far off to the right,
         where it read as a second, lower baseline to the title. */
      var news = ui.card({
        title: 'From the studio',
        flush: true,
        note: 'Announcements are one-way. If you need to reply, use Messages and we will answer you directly.'
      }, ui.rows(published().map(function (a) {
        return {
          lead: esc(a.when),
          title: esc(a.head),
          sub: esc(a.body)
        };
      })));

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

      var friday = booked.length
        ? 'Booked for ' + booked[0].booked.split(' · ').pop() +
          (open.length
            ? ' · ' + open.length + ' more credit' + (open.length === 1 ? '' : 's') +
              ' to use before ' + open[0].expires
            : '')
        : open.length + ' credit' + (open.length === 1 ? '' : 's') +
          ' to use before ' + open[0].expires;

      var coming = ui.card({
        title: 'Coming up',
        head: ui.btn({ label: 'Full calendar', kind: 'quiet', size: 'sm', to: 'fSchedule' }),
        flush: true,
        note: first + ' is a guest at Saturday’s party, so there is nothing to pay and nothing ' +
              'to book. If she cannot come, a message to the studio is enough.'
      }, ui.rows([
        {
          lead: 'Fri 31 Jul',
          title: ui.dot(D.program(after.prog).color) + ' ' + esc(first + ' · make-up class'),
          sub: esc(friday),
          to: 'fBookMakeup'
        },
        {
          lead: 'Sat 1 Aug',
          title: ui.dot(D.program(party.prog).color) + ' ' + esc(party.name),
          sub: esc(party.time + ' · ' + party.room + ' · with ' + party.staff),
          to: 'fMessages'
        },
        {
          lead: 'Mon 3 Aug',
          title: ui.dot(D.program(after.prog).color) + ' ' +
                 esc(first + ' · ' + D.program(after.prog).name),
          sub: esc(after.day + ' · ' + after.time + ' · ' + after.room + ' · ' + after.staff),
          to: 'fSchedule'
        }
      ]));

      return h`
        <div class="section">${raw(todo)}</div>
        <div class="section">${raw(news)}</div>
        <div class="section">${raw(nextUp)}</div>
        <div class="section">${raw(coming)}</div>
      `;
    }
  });
})();
