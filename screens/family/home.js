/* Family → Home. The parent's landing page, in the order a parent reads it:
   what is waiting on you, what is happening tomorrow, what is coming, and
   what the studio has said.

   Reworked for the person this portal is for — a parent or grandparent who is
   busy, wary of getting something wrong online, and who rings the studio
   rather than hunt for a control.

     - the page answers its three questions in order. The studio's noticeboard
       used to sit second, above the family's own day; it is last now, because
       it is the one block nobody has to act on
     - "Next up" was a five-row table — Child, Class, When, Where, Teacher —
       for one session belonging to one child, and it never mentioned Lucas,
       who is in class tomorrow as well. Tomorrow is now one line per child,
       the hour on the left and "can't come" on the same line
     - "credit" is gone from the parent's side. "Emma has 2 make-up credits:
       1 booked for Fri 31 Jul · 10:00am, 1 still to use before 31 Jul" is now
       "Emma missed Monday 13 July — the 3:15pm class", and the hour already
       booked is a dated line under Coming up, where a parent looks for it
     - the document notice named one unsigned document and ignored the other.
       Documents counts two; so does Home, and when there is one it opens that
       document instead of the list
     - what the family owes, and the day it goes, was on no page a parent
       opens first. The 1 August payment is a dated line in Coming up, worked
       out the way Billing works it out, with the unpaid line named
     - dates are spelled out — "Monday 13 July", not "Mon 13 Jul" — and every
       one is derived from Grove.data.today rather than written down
     - the programme colour pips are gone: a colour with no key is a code, and
       the row already names the programme in words
     - version numbers, publication dates, expiry counts and make-up tallies
       are out of the notices. What is left is the thing to do and the day to
       do it by
     - the two ways to reach a person sit in a bar pinned to the foot of the
       page, so the phone number is never something you have to scroll for

   Kept deliberately: the studio's announcements are shown in the studio's own
   words, dates and all, including the one that says "Emma has two credits".
   Rewriting a message the studio sent would be a lie, and the notice at the
   top of the page already says the same thing in the parent's words, with the
   button on it. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  /* The portal is signed in as the Johnson family. */
  var FAMILY = 'johnson';

  /* js/data.js holds family phone numbers, not the studio's. Schedule → Book a
     make-up names this one, so Home names the same one. */
  var DESK = D.STUDIO.phone;

  /* No student record names a camp week, so Schedule reads Emma's from the
     class list as c6 and Home reads the same record. The dataset holds no
     guest list either, so Saturday's party is the studio's one birthday
     booking, as it was on this page before. */
  var CAMP = 'c6';
  var PARTY = 'c12';

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

  /* ---- the family --------------------------------------------------------- */

  function cls(id) { return D.CLASSES.filter(function (c) { return c.id === id; })[0]; }
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

  /* An After-School record is named by its length ("1 hour · After-School"),
     which is a duration and not a class name, so those rows carry the
     programme name instead. Schedule does the same. */
  function className(c) { return c.prog === 'as' ? D.program(c.prog).name : c.name; }

  /* A student record carries the day, start time and room of that child's
     weekly hour — 'Wed 3:15pm · Studio 2' — which is enough to find the class
     itself, and with it the full hour and the teacher. */
  function classFor(record) {
    var bits = String(record).split(' · ');
    var when = bits[0].split(' ');
    var start = (when[1] || '').replace(/(am|pm)/i, '');
    if (!start) return null;
    return D.CLASSES.filter(function (c) {
      return c.day === when[0] && c.room === bits[1] && c.time.indexOf(start) === 0;
    })[0] || null;
  }

  function entry(child, c) {
    return {
      child: child, day: c.day, time: c.time,
      room: c.room, staff: c.staff, name: className(c)
    };
  }

  /* The family's week: each child's weekly hour, read from their own record,
     plus the camp week Emma is in. Schedule builds the same three. */
  function week() {
    var list = [];
    kids().forEach(function (s) {
      var c = classFor(s.cls);
      if (c) list.push(entry(s.name, c));
    });
    var camp = cls(CAMP);
    if (camp) list.push(entry(D.student('emma').name, camp));
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

  /* ---- what is waiting on the parent ---------------------------------------
     One notice for each thing to do, each carrying its own button. Nothing
     here states a version, an expiry code or a running tally: a parent needs
     the thing to do and the day to do it by. */

  function ours(list) {
    var names = kids().map(function (s) { return s.name; });
    return list.filter(function (m) { return names.indexOf(m.child) !== -1; });
  }
  function toMakeUp() {
    return ours(D.MAKEUPS).filter(function (m) { return m.status === 'Available'; });
  }
  function bookedMakeUps() {
    return ours(D.MAKEUPS).filter(function (m) { return m.status === 'Booked' && m.booked; });
  }
  /* The class a missed hour came from, which is the room and the teacher the
     make-up belongs to. Book a make-up reads it the same way. */
  function missedClass(m) {
    var bits = String(m.missed).split(' · ');
    var day = bits[0].split(' ')[0];
    var start = (bits[1] || '').replace(/(am|pm)/i, '');
    if (!start) return null;
    return D.CLASSES.filter(function (c) {
      return c.day === day && c.time.indexOf(start) === 0;
    })[0] || null;
  }
  function unsigned() { return D.DOCUMENTS.filter(function (d) { return !d.signed; }); }

  /* The class to make up leads, because it is the only one with a day to
     beat. */
  function todos() {
    var list = toMakeUp().map(function (m) {
      var who = firstName(m.child);
      var bits = String(m.missed).split(' · ');
      return {
        kind: 'ok',
        title: who + ' has a class to make up',
        text: who + ' missed ' + plainDate(bits[0]) + ' — the ' + bits[1] +
              ' class. Book the make-up before ' + plainDate(m.expires) + '.',
        action: { label: 'Book a make-up class', kind: 'primary', to: 'fBookMakeup' }
      };
    });

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

  /* ---- money ------------------------------------------------------------------
     Billing works the next charge out as the monthly run — the opening lines
     of the ledger — less its discount, plus anything still unpaid. Home reads
     it the same way, so the two screens cannot disagree, and the studio's run
     posts on the 1st. */

  function sum(list) { return list.reduce(function (n, l) { return n + l.amt; }, 0); }
  function unpaid() { return D.LEDGER.filter(function (l) { return !l.paid; }); }
  function monthlyRun() {
    var first = D.LEDGER[0].d;
    return D.LEDGER.filter(function (l) { return l.d === first; });
  }
  function nextCharge() { return sum(monthlyRun()) + sum(unpaid()); }
  function nextRun() {
    var t = today();
    return new Date(t.getFullYear(), t.getMonth() + 1, 1);
  }

  /* ---- the studio's noticeboard ------------------------------------------- */

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
  function forProgram(prog) {
    var name = D.program(prog).name;
    return published().filter(function (a) { return a.aud === name; })[0] || null;
  }

  /* ---- tomorrow -----------------------------------------------------------
     One line per child, the hour on the left and "can't come" on the same
     line. The old card described one session for one child in five table rows
     — Child, Class, When, Where, Teacher — and Lucas, who is in class
     tomorrow too, was not on the page at all. */

  function tomorrowCard() {
    var when = tomorrow();
    var camp = cls(CAMP);
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

    /* What to bring is the camp's own announcement, so it is only shown on a
       day the camp actually runs. */
    var onCamp = camp && list.filter(function (s) { return s.name === camp.name; }).length;
    var bring = onCamp ? forProgram(camp.prog) : null;

    return ui.card({
      title: 'Tomorrow · ' + longDate(when),
      flush: true,
      note: bring ? 'What to bring to camp: ' + bring.body : null
    }, rows.length
      ? ui.rows(rows)
      : ui.empty('Nothing tomorrow',
          'No class for ' + andList(kids().map(function (s) { return firstName(s.name); })) +
          ' on ' + longDate(when) + '.'));
  }

  /* ---- coming up ------------------------------------------------------------
     Dates a person recognises, in order, with a button on anything that can be
     changed. The 1 August payment is here because what is owed and when it
     goes is the other thing a parent comes to this page for, and it was on no
     page they open first. */

  function comingCard() {
    var items = [];

    bookedMakeUps().forEach(function (m) {
      var bits = String(m.booked).split(' · ');
      var at = dateFrom(bits[0]);
      if (!at) return;                 /* a request the studio has not dated yet */
      var c = missedClass(m);
      items.push({
        at: at,
        lead: shortDate(at),
        title: esc(firstName(m.child) + ' · make-up class'),
        sub: esc(bits[1] + (c ? ' · ' + c.room + ' · with ' + c.staff : '') +
                 ' — already booked, nothing to do'),
        end: ui.btn({ label: 'Change', kind: 'quiet', size: 'sm', to: 'fMessages' })
      });
    });

    var party = cls(PARTY);
    var partyAt = party ? nextAfter(party.day) : null;
    if (partyAt) {
      items.push({
        at: partyAt,
        lead: shortDate(partyAt),
        title: esc(party.name),
        sub: esc(party.time + ' · ' + party.room + ' · with ' + party.staff +
                 ' — a guest place, nothing to pay and nothing to book')
      });
    }

    var run = nextRun();
    var owing = sum(unpaid());
    var oldest = unpaid()[0];
    items.push({
      at: run,
      lead: shortDate(run),
      title: esc('Your next payment · ' + Grove.money(nextCharge())),
      sub: esc('Taken from ' + String(fam().card).split(' · ')[0] + ' automatically' +
        (owing ? '. It includes ' + Grove.money(owing) + ' still to pay from ' +
                 plainDate(oldest.d) : '') + '.'),
      end: ui.btn({ label: 'See billing', kind: 'quiet', size: 'sm', to: 'fBilling' })
    });

    week().forEach(function (s) {
      /* The camp week is this week and Tomorrow says how long it runs, and a
         class that is already on the Tomorrow card is not news. */
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
      note: 'If a child cannot come, tell us at least 24 hours ahead and you can take the ' +
            'class another time. Nothing is charged for a make-up class.'
    }, ui.rows(items));
  }

  /* ---- the studio's news --------------------------------------------------- */

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
            text: 'Nothing to sign and nothing to book. Here is what is coming up.'
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
        <div class="section">${raw(newsCard())}</div>
        ${raw(ui.formActions([
          { label: 'Message the studio', kind: 'primary', to: 'fMessages' },
          { label: 'Call ' + DESK, msg: 'Ring the desk on ' + DESK + ' and we will do it for you' }
        ], { sticky: true, hint: hint }))}
      `;
    }
  });
})();
