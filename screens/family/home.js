/* Family → Home. The parent's landing page, in the order a parent reads it:
   what is waiting on you, what is happening tomorrow, what is coming, where
   each child's sessions stand, and what the studio has said.

   Reworked for the person this portal is for — a parent or grandparent who is
   busy, wary of getting something wrong online, and who rings the studio
   rather than hunt for a control.

   THE BILLING MODEL. A family buys a pack of sessions for a child. The child
   attends, and when the last session in the pack is used the pack renews: it
   charges again and grants another pack the same size. There is no billing
   date, so nothing on this page says one. What this cost the file:

     - the make-up machinery is gone from the parent's side entirely. There is
       no credit to hold, book, chase or lose, so the "Emma has a class to make
       up" notice, the booked-make-up rows under Coming up and the link to Book
       a make-up have all been deleted rather than renamed. A session the
       studio was told about in time is simply not spent — it stays in the
       child's pack, and the pack lasts a week longer
     - the "Your next payment · 1 Aug" row under Coming up has gone with it. A
       charge is a number of classes away, not a day on the calendar, so it
       cannot sit in a list ordered by date. Where each pack stands, and what
       happens when it runs out, is now its own card
     - what the family still owes was folded into that dated payment line. It
       is a notice of its own now, at the top with the other things to do, and
       it says plainly that it is not part of a pack
     - no expiry date anywhere. A pack is paid for, so it is theirs until used

     - the page answers its questions in order. The studio's noticeboard used
       to sit second, above the family's own day; it is last now, because it is
       the one block nobody has to act on
     - "Next up" was a five-row table — Child, Class, When, Where, Teacher —
       for one session belonging to one child, and it never mentioned Lucas,
       who is in class tomorrow as well. Tomorrow is now one line per child,
       the hour on the left and "can't come" on the same line
     - every class on this page comes from the child's own enrolment — the
       classes that child is on the roll for — and not from reading the words
       in their timetable line
     - the document notice named one unsigned document and ignored the other.
       Documents counts two; so does Home, and when there is one it opens that
       document instead of the list
     - dates are spelled out — "Monday 13 July", not "Mon 13 Jul" — and every
       one is derived from Grove.data.today rather than written down
     - the programme colour pips are gone: a colour with no key is a code, and
       the row already names the programme in words
     - version numbers, publication dates and expiry counts are out of the
       notices. What is left is the thing to do and the day to do it by
     - the two ways to reach a person sit in a bar pinned to the foot of the
       page, so the phone number is never something you have to scroll for

   Kept deliberately: the studio's announcements are shown in the studio's own
   words, dates and all, including the one offering two extra hours this
   Friday. Rewriting a message the studio sent would be a lie, and under the
   corrected model that announcement is straightforward — an extra class is a
   class you book on top of the weekly place, and it spends a session like any
   other. Emma has taken the 10:00 one, and it is under Coming up saying so. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  /* The portal is signed in as the Johnson family. */
  var FAMILY = 'johnson';

  /* The studio's own number, so two screens cannot name different desks. */
  var DESK = D.STUDIO.phone;

  var DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
               'August', 'September', 'October', 'November', 'December'];
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* ---- dates ------------------------------------------------------------------
     Every date on this page is worked out from Grove.data.today, so no date is
     written down twice and none can drift from the dataset. */

  function today() {
    var p = String(D.today).replace(',', '').split(' ');   /* Tuesday 28 July 2026 */
    return new Date(Number(p[3]), MONTH.indexOf(p[2]), Number(p[1]));
  }
  function plus(date, n) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
  }
  function tomorrow() { return plus(today(), 1); }

  function longDate(d) { return DAY[d.getDay()] + ' ' + d.getDate() + ' ' + MONTH[d.getMonth()]; }
  function shortDate(d) { return ABBR[d.getDay()] + ' ' + d.getDate() + ' ' + MON[d.getMonth()]; }

  /* 'Mon 13 Jul' → 'Monday 13 July'. A parent reads a day, not an abbreviation. */
  function spell(text) {
    var out = String(text);
    ABBR.forEach(function (a, i) { out = out.replace(new RegExp('\\b' + a + '\\b'), DAY[i]); });
    MON.forEach(function (m, i) { out = out.replace(new RegExp('\\b' + m + '\\b'), MONTH[i]); });
    return out;
  }
  /* The year is never in doubt on a page about this week. */
  function plainDate(text) { return spell(String(text).replace(/\s\d{4}$/, '')); }

  /* The first date after tomorrow that falls on a given weekday. */
  function nextAfter(abbr) {
    var from = tomorrow();
    for (var i = 1; i <= 7; i++) {
      var d = plus(from, i);
      if (ABBR[d.getDay()] === abbr) return d;
    }
    return null;
  }
  /* 'Fri 31 Jul' or '31 Jul' → a real date in the season we are in. */
  function dateFrom(text) {
    var p = String(text).split(' ');
    if (p.length === 3) p.shift();
    var day = Number(p[0]);
    var mon = MON.indexOf(p[1]);
    if (!day || mon === -1) return null;
    var t = today();
    return new Date(t.getFullYear() + (mon < t.getMonth() ? 1 : 0), mon, day);
  }

  /* ---- words and figures --------------------------------------------------- */

  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
  function ordinal(n) {
    var tens = n % 100, ones = n % 10;
    var suffix = 'th';
    if (tens < 11 || tens > 13) {
      if (ones === 1) suffix = 'st';
      else if (ones === 2) suffix = 'nd';
      else if (ones === 3) suffix = 'rd';
    }
    return n + suffix;
  }
  /* Cents on a whole number are noise on a page a parent skims. */
  function price(n) { return Grove.money(n, { cents: n % 1 !== 0 }); }

  /* ---- the family --------------------------------------------------------- */

  function fam() { return D.family(FAMILY); }
  function kids() {
    var name = fam().name;
    return D.STUDENTS.filter(function (s) { return s.family === name; });
  }
  function firstName(name) { return String(name).split(' ')[0]; }
  function andList(list) {
    if (list.length < 2) return list.join('');
    return list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1];
  }
  /* 'Visa ···1183 · exp 04/29' → 'Visa ···1183'. The expiry belongs to Billing. */
  function cardName() { return String(fam().card).split(' · ')[0]; }

  /* An After-School record is named by its length ("1 hour · After-School"),
     which is a duration and not a class name, so those rows carry the
     programme name instead. Schedule does the same. */
  function className(c) { return c.prog === 'as' ? D.program(c.prog).name : c.name; }

  function entry(child, c) {
    return {
      child: child, day: c.day, time: c.time,
      room: c.room, staff: c.staff, name: className(c)
    };
  }

  /* The family's week: every class each child is on the roll for. The child's
     own record carries the classes, so nothing here is read out of the words
     in a timetable line, and a child in three classes shows three. */
  function week() {
    var list = [];
    kids().forEach(function (s) {
      D.classesOf(s).forEach(function (c) { list.push(entry(s.name, c)); });
    });
    return list;
  }

  function spansWeek(day) { return String(day).indexOf('–') !== -1; }

  /* A camp week runs Monday to Friday; a weekly hour runs on its own day. */
  function runsOn(day, date) {
    if (spansWeek(day)) return date.getDay() >= 1 && date.getDay() <= 5;
    return day === ABBR[date.getDay()];
  }
  function everyDay(day) {
    return spansWeek(day) ? spell(day) : 'Every ' + DAY[ABBR.indexOf(day)];
  }

  /* Only the end of a range carries the meridiem in this dataset, so both the
     sort key and the time chip have to look at the whole range. */
  function meridiem(range) {
    var parts = String(range).split('–');
    var mark = /(am|pm)/i.exec(parts[0]) || /(am|pm)/i.exec(parts[1] || '');
    return mark ? mark[1] : '';
  }
  function minutes(range) {
    var hm = String(range).split('–')[0].replace(/(am|pm)/i, '').split(':');
    var hour = Number(hm[0]) % 12;
    if (/pm/i.test(meridiem(range))) hour += 12;
    return hour * 60 + Number(hm[1] || 0);
  }
  function chipTime(range) {
    return String(range).split('–')[0].replace(/(am|pm)/i, '') + ' ' + meridiem(range);
  }

  /* ---- money ------------------------------------------------------------------
     Nothing here is a date. A pack charges when its last session is used, so
     the only figure with a day attached is something already owed. */

  function sum(list) { return list.reduce(function (n, l) { return n + l.amt; }, 0); }
  function unpaid() { return D.LEDGER.filter(function (l) { return !l.paid; }); }

  /* ---- what is waiting on the parent ---------------------------------------
     One notice for each thing to do, each carrying its own button. */

  function ours(list) {
    var names = kids().map(function (s) { return s.name; });
    return list.filter(function (m) { return names.indexOf(m.child) !== -1; });
  }
  function unsigned() { return D.DOCUMENTS.filter(function (d) { return !d.signed; }); }

  /* Money leads, because it is the only one with a day already behind it. */
  function todos() {
    var list = [];

    var owing = sum(unpaid());
    if (owing > 0) {
      var oldest = unpaid()[0];
      list.push({
        kind: 'warn',
        title: price(owing) + ' is still to pay',
        text: oldest.what + ', from ' + plainDate(oldest.d) + '. It is not part of a pack, ' +
              'so it will not be picked up when one renews.',
        action: { label: 'See billing', kind: 'primary', to: 'fBilling' }
      });
    }

    var papers = unsigned();
    if (papers.length === 1) {
      list.push({
        kind: 'warn',
        title: papers[0].name + ' is waiting for your signature',
        text: 'Two minutes to read, one tap to sign.',
        action: { label: 'Read and sign', kind: 'primary', to: 'fDocument', id: papers[0].id }
      });
    } else if (papers.length) {
      list.push({
        kind: 'warn',
        title: papers.length + ' documents are waiting for your signature',
        text: andList(papers.map(function (d) { return d.name; })) + '. Each one has its own ' +
              'Read and sign button, and none of them takes more than two minutes.',
        action: { label: 'See what to sign', kind: 'primary', to: 'fDocuments' }
      });
    }
    return list;
  }

  /* ---- tomorrow -----------------------------------------------------------
     One line per child, the hour on the left and "can't come" on the same
     line. The old card described one session for one child in five table rows
     — Child, Class, When, Where, Teacher — and Lucas, who is in class
     tomorrow too, was not on the page at all. */

  function tomorrowCard() {
    var when = tomorrow();
    var list = week().filter(function (s) { return runsOn(s.day, when); })
      .sort(function (a, b) { return minutes(a.time) - minutes(b.time); });

    var rows = list.map(function (s) {
      var who = firstName(s.child);
      return {
        lead: ui.timechip(chipTime(s.time)),
        title: esc(who + ' · ' + s.name),
        sub: esc(everyDay(s.day) + ' · ' + s.time + ' · ' + s.room + ' · with ' + s.staff),
        end: ui.btn({
          label: who + ' can’t come',
          kind: 'quiet',
          size: 'sm',
          msg: 'Thank you — we have told the studio that ' + who +
               ' will not be in on ' + longDate(when)
        })
      };
    });

    return ui.card({
      title: 'Tomorrow · ' + longDate(when),
      flush: true,
      note: rows.length
        ? 'Tell us more than 24 hours before a class and the session stays in the pack. ' +
          'Inside 24 hours it is spent, the same as if they had come.'
        : null
    }, rows.length
      ? ui.rows(rows)
      : ui.empty('Nothing tomorrow',
          'No class for ' + andList(kids().map(function (s) { return firstName(s.name); })) +
          ' on ' + longDate(when) + '.'));
  }

  /* ---- coming up ------------------------------------------------------------
     Dates a person recognises, in order, with a button on anything that can be
     changed. An extra class — one booked on top of the weekly place — is here
     because it is the one entry a parent might not be expecting, and because
     it spends a session like any other class. */

  function comingCard() {
    var items = [];
    var extras = ours(D.EXTRA_CLASSES);

    extras.forEach(function (x) {
      var bits = String(x.when).split(' · ');
      var at = dateFrom(bits[0]);
      if (!at) return;                 /* a booking the studio has not dated yet */
      items.push({
        at: at,
        lead: shortDate(at),
        title: esc(firstName(x.child) + ' · extra class'),
        sub: esc(bits[1] + ' · ' + x.room + ' · with ' + x.staff +
                 ' — already booked, nothing to do'),
        end: ui.btn({ label: 'Change', kind: 'quiet', size: 'sm', to: 'fMessages' })
      });
    });

    week().forEach(function (s) {
      /* A class that runs all week is already on the Tomorrow card, and so is
         a class that falls tomorrow. Neither is news. */
      if (spansWeek(s.day) || runsOn(s.day, tomorrow())) return;
      var at = nextAfter(s.day);
      if (!at) return;
      items.push({
        at: at,
        lead: shortDate(at),
        title: esc(firstName(s.child) + ' · ' + s.name),
        sub: esc(everyDay(s.day) + ' · ' + s.time + ' · ' + s.room + ' · with ' + s.staff)
      });
    });

    items.sort(function (a, b) { return a.at - b.at; });

    return ui.card({
      title: 'Coming up',
      head: ui.btn({ label: 'See your schedule', kind: 'quiet', size: 'sm', to: 'fSchedule' }),
      flush: true,
      note: extras.length
        ? 'An extra class spends a session from the pack, the same as a weekly class.'
        : null
    }, items.length
      ? ui.rows(items)
      : ui.empty('Nothing booked yet', 'Your schedule will fill in as classes are booked.'));
  }

  /* ---- sessions ---------------------------------------------------------------
     Where each child's pack stands, and what happens when it runs out. A pack
     belongs to one child, so two children renew separately and at different
     times — which is the whole reason this is a row per child and not one line
     about the family. Every figure is read off the child's own record and the
     studio's price list. */

  function sessionRows() {
    var stopping = String(fam().plan).indexOf('not renewing') !== -1;

    return kids().map(function (s) {
      var p = D.pack(s);
      var who = firstName(s.name);
      var end = ui.btn({ label: 'See ' + who, kind: 'quiet', size: 'sm', to: 'fChild', id: s.id });

      if (!p.isPack) {
        return {
          lead: ui.mute('—'),
          title: esc(who + ' · no pack'),
          sub: esc('Camp weeks and one-off classes are paid for when you book them, ' +
                   'so there is nothing to renew.'),
          end: end
        };
      }

      var cost = D.PRICING.as.plans['p' + p.size];
      var pays = fam().autopay
        ? ' from ' + cardName()
        : ', and we will ask you for it then';

      var text;
      if (stopping) {
        text = plural(p.left, 'class', 'classes') + ' left. When the last one is used the pack will ' +
               'not renew, and nothing more is charged.';
      } else if (p.left === 0) {
        text = 'The pack is used up. The next class renews it — another ' +
               plural(p.size, 'session') + (cost ? ', ' + price(cost) : '') + pays + '.';
      } else {
        text = plural(p.left, 'class', 'classes') + ' left. On the ' + ordinal(p.size) +
               ' class it renews — another ' + plural(p.size, 'session') +
               (cost ? ', ' + price(cost) : '') + pays + '.';
      }

      var kept = D.absencesFor(s.name).filter(function (a) { return !a.spent; });
      if (kept.length) {
        text += ' ' + plural(kept.length, 'missed class', 'missed classes') +
                ' stayed in the pack because you told us in time.';
      }

      return {
        lead: ui.timechip(p.left + ' left', p.left <= 1 ? 'amber' : null),
        title: esc(who + ' · ' + p.used + ' of ' + p.size + ' used'),
        sub: esc(text),
        end: end
      };
    });
  }

  function sessionsCard() {
    var rows = sessionRows();
    return ui.card({
      title: 'Sessions',
      head: ui.btn({ label: 'See billing', kind: 'quiet', size: 'sm', to: 'fBilling' }),
      flush: true,
      note: 'There is no billing date. A pack renews when its last session is used, and ' +
            'sessions never expire — they are yours until you use them.'
    }, rows.length
      ? ui.rows(rows)
      : ui.empty('No sessions yet', 'Book a class and the pack will show here.'));
  }

  /* ---- the studio's news --------------------------------------------------- */

  function stamp(when) {
    var p = String(when).split(' ');
    return Number(p[2]) * 10000 + (MON.indexOf(p[1]) + 1) * 100 + Number(p[0]);
  }
  /* A scheduled announcement has not gone out yet, so the family cannot see
     it. Everything else the studio has published is here, newest first. */
  function published() {
    return D.ANNOUNCEMENTS.filter(function (a) {
      return a.status !== 'Scheduled';
    }).sort(function (a, b) { return stamp(b.when) - stamp(a.when); });
  }

  function newsCard() {
    return ui.card({
      title: 'From the studio',
      flush: true,
      note: 'Announcements are one-way. If you need to reply, send a message and we will ' +
            'answer you directly.'
    }, ui.rows(published().map(function (a) {
      return { lead: esc(plainDate(a.when)), title: esc(a.head), sub: esc(a.body) };
    })));
  }

  /* ---- home -------------------------------------------------------------------
     The header carries one button. The two ways to reach a person are in a bar
     pinned to the foot of the page, where they cannot be scrolled past, and
     repeating them at the top would only be the same action twice. */

  Grove.screen('fHome', {
    surface: 'family',
    crumbTitle: 'Home',
    eyebrow: function () { return longDate(today()).toLowerCase(); },
    title: function (ctx) { return 'Morning, ' + firstName(ctx.persona.name); },
    sub: function () {
      var n = todos().length;
      if (!n) return 'Nothing needs you today. Here is what is coming up.';
      return n + ' thing' + (n === 1 ? '' : 's') + ' need' + (n === 1 ? 's' : '') +
        ' you. Everything else is in hand.';
    },
    actions: [
      { label: 'Billing', to: 'fBilling' }
    ],

    body: function () {
      var list = todos();

      var waiting = list.length
        ? list.map(ui.notice).join('')
        : ui.notice({
            kind: 'ok',
            title: 'Nothing needs you today',
            text: 'Nothing to sign and nothing to pay. Here is what is coming up.'
          });

      var hint = list.length === 1
        ? '1 thing still needs you, at the top of this page'
        : (list.length
            ? list.length + ' things still need you, at the top of this page'
            : 'Nothing needs you today');

      return h`
        <div class="section">${raw(waiting)}</div>
        <div class="section">${raw(tomorrowCard())}</div>
        <div class="section">${raw(comingCard())}</div>
        <div class="section">${raw(sessionsCard())}</div>
        <div class="section">${raw(newsCard())}</div>
        ${raw(ui.formActions([
          { label: 'Message the studio', kind: 'primary', to: 'fMessages' },
          { label: 'Call ' + DESK, msg: 'Ring the desk on ' + DESK + ' and we will do it for you' }
        ], { sticky: true, hint: hint }))}
      `;
    }
  });
})();
