/* Console → Staff (list) and the staff record.

   Simplifications against the previous build:
     - NO statbar on the list. The old screen sat a four-tile stats band
       directly under the header for a list of six rows, and every tile just
       restated something the table already says ("6 people", "3 on shift",
       "1 pending invitation"). Six rows do not need a summary of themselves.
     - The separate "Invite a staff member" form screen is gone. It asked for
       eleven fields — nine of which only ever have one sensible answer for a
       six-person studio — so the header action sends the invitation directly
       and says so.
     - The record's three header buttons are two; "Revoke access" moved into
       the Access card, where the consequence is spelled out next to it.
     - The old drawer hard-coded the same assigned-class list onto every
       person, including the front desk and the owner, who teach nothing.
       Everything is read from Grove.data.

   Fixed after the visual review:
     - "Classes this week" listed five lines beside a card that said "Sessions
       a week 9", and the reader had to expand "Mon–Fri" in their head. Every
       row now carries its own session count and the total is the sum of the
       rows shown, on both screens. Pop-ups and birthday parties are single
       dates, so they are listed apart from the weekly timetable — which is
       also what makes the total agree with Grove.data for both instructors.
     - THE PERSON card repeated the header subtitle (role, rate) and the TIME
       card (status). Both cards are gone: the three facts that were not
       already on screen are a statbar, the same shape the Studio portal uses
       for the same person.
     - the TIME card was two thirds empty because it was stretched to match
       the timetable beside it. The record now lays its cards into two
       balanced columns, so a short card is never parked beside a tall one.
     - the owner's row was three em dashes. Hours, rate and clock status now
       say what "not applicable" means in words.
     - the control band carried a search box and nothing else while every
       other list screen carries filters as well.

   Two things were left alone on purpose:
     - Grove.data.STAFF credits the owner with 2 classes and Grove.data.CLASSES
       assigns her none. Both screens count off the timetable, so the record
       can never show a number the list beside it contradicts. Reports still
       prints the literal 2; the literal is the figure with nothing behind it.
     - the Private programme dot is blue because --prog-private is blue in
       css/tokens.css. A screen may not hard-code a colour, and the same class
       is drawn with the same dot on Classes, the Dashboard and Today, so the
       fix belongs to the token rather than to this file. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;

  var WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  /* A pop-up, a birthday party and a no-school day are single bookings rather
     than a weekly commitment. They are listed apart from the timetable and
     left out of the weekly session count — which is what makes the count here
     agree with Grove.data.STAFF for both instructors. */
  var ONE_OFF = { pop: true, bday: true, nsd: true };

  /* The data carries the tone on each row; this is the only place it is read. */
  var PILL_KIND = { ok: 'ok', neutral: null, warn: 'warn' };
  var STAT_TONE = { ok: 'grove', neutral: null, warn: 'plum' };
  /* The same mapping Messages uses, so a post reads the same on both screens. */
  var ANN_KIND = { 'Pinned': 'amber', 'Live': 'ok', 'Scheduled': null };

  var F_ALL = 'All';
  var F_TEACH = 'Instructors';
  var F_CLOCK = 'On the clock';
  var F_INVITED = 'Invitation pending';

  /* ---- derivations --------------------------------------------------------
     Every number on both screens is counted off the rows being shown, so the
     list, the record and the timetable cannot drift apart. */

  function dayTokens(c) { return String(c.day).split(/[^A-Za-z]+/).filter(Boolean); }

  /* 'Mon' is one session a week. 'Mon–Fri' is five. */
  function sessionsIn(c) {
    var t = dayTokens(c);
    if (t.length < 2) return 1;
    var from = WEEK.indexOf(t[0]), to = WEEK.indexOf(t[t.length - 1]);
    if (from === -1 || to === -1 || to < from) return 1;
    return (to - from) + 1;
  }

  function assigned(s) {
    return D.CLASSES.filter(function (c) { return c.staff === s.name; });
  }
  function timetableOf(s) {
    return assigned(s).filter(function (c) { return !ONE_OFF[c.prog]; });
  }
  function oneOffsOf(s) {
    return assigned(s).filter(function (c) { return !!ONE_OFF[c.prog]; });
  }
  function sessionsAWeek(s) {
    var n = 0;
    timetableOf(s).forEach(function (c) { n += sessionsIn(c); });
    return n;
  }
  function sessionLabel(n) { return n + (n === 1 ? ' session' : ' sessions'); }

  function prog(c) {
    return D.program(c.prog) || { short: c.prog, color: 'var(--ink-45)' };
  }
  function place(c) {
    return prog(c).short + ' · ' + c.room + (c.band === '—' ? '' : ' · ages ' + c.band);
  }

  /* Five of the six people record hours, a rate and a clock status. The owner
     records none of the three, and three em dashes in a row read as an
     unfinished record rather than as "not applicable" — so say it in words. */
  function hoursText(s) { return s.hrs === '—' ? 'Not tracked' : s.hrs + ' hrs'; }
  function statusText(s) { return s.status === '—' ? 'Not clocked in' : s.status; }

  function muted(t) { return '<span class="mute">' + esc(t) + '</span>'; }

  function statusCell(s) {
    if (s.status === '—') return muted('Not clocked in');
    return ui.pill(s.status, PILL_KIND[s.kind]);
  }

  /* 'Lauren Ortiz' -> 'Lauren O.', the form the activity log writes. */
  function shortName(name) {
    var p = String(name).split(' ');
    return p[0] + (p[1] ? ' ' + p[1].charAt(0) + '.' : '');
  }

  function activityOf(s) {
    var tag = shortName(s.name);
    return D.ACTIVITY.filter(function (a) {
      return String(a.what).indexOf(tag) === 0;
    }).map(function (a) {
      var text = String(a.what).slice(tag.length).replace(/^\s+/, '');
      return { at: a.at, what: text.charAt(0).toUpperCase() + text.slice(1) };
    });
  }

  /* ---- list ------------------------------------------------------------- */

  Grove.screen('staff', {
    surface: 'console',
    eyebrow: 'who teaches what',
    title: 'Staff',
    sub: 'The team, their assignments and their hours.',
    actions: [
      { label: 'Export timesheet', msg: 'Timesheet exported' },
      { label: 'Invite a teacher', kind: 'primary', msg: 'Invitation sent' }
    ],

    body: function () {
      var q = Grove.query('staff');
      var f = Grove.filter('staff', F_ALL);

      var rows = D.STAFF.filter(function (s) {
        if (!Grove.match(q, s.name, s.role, s.status, s.rate)) return false;
        if (f === F_TEACH) return s.role === 'Instructor';
        if (f === F_CLOCK) return s.status === 'Clocked in';
        if (f === F_INVITED) return s.status === 'Invitation sent';
        return true;
      });

      var table = ui.table(
        [
          'Name',
          'Role',
          { label: 'Sessions a week', align: 'right' },
          { label: 'Hours this week', align: 'right' },
          'Rate',
          { label: 'Status', shrink: true }
        ],
        rows.map(function (s) {
          return {
            to: 'staffRecord', id: s.id,
            cells: [
              ui.two(s.name),
              ui.mute(s.role),
              String(sessionsAWeek(s)),
              s.hrs === '—' ? muted('Not tracked') : esc(s.hrs),
              s.rate === '—' ? muted('Not recorded') : ui.mute(s.rate),
              statusCell(s)
            ]
          };
        }),
        { emptyTitle: 'Nobody matches', emptyText: 'Clear the search or choose a different filter.' }
      );

      return ui.toolbar({
        search: { key: 'staff', placeholder: 'Search staff…' },
        filters: { key: 'staff', items: [F_ALL, F_TEACH, F_CLOCK, F_INVITED] },
        count: rows.length + ' of ' + D.STAFF.length + ' people'
      }) + ui.card({
        flush: true,
        note: 'Sessions are counted off the timetable: a class that runs Monday to Friday is five, and a party or a pop-up is a single date rather than a weekly commitment.'
      }, table);
    }
  });

  /* ---- staff record -------------------------------------------------------- */

  Grove.screen('staffRecord', {
    surface: 'console',
    crumbs: [{ label: 'Staff', to: 'staff' }],
    crumbTitle: 'Staff record',
    title: function (ctx) { return person(ctx).name; },
    sub: function (ctx) {
      var s = person(ctx);
      return s.rate === '—' ? s.role : s.role + ' · ' + s.rate;
    },
    actions: [
      { label: 'Open timesheet', msg: 'Prototype — no timesheet in this build' },
      { label: 'Assign a class', kind: 'primary', to: 'classes' }
    ],

    body: function (ctx) {
      var s = person(ctx);
      var mine = timetableOf(s);
      var events = oneOffsOf(s);
      var sessions = sessionsAWeek(s);
      var invited = s.status === 'Invitation sent';
      var cards = [];

      /* The activity log holds this person's clock-in time; it belongs beside
         the status rather than repeated as a row of its own. */
      var log = [], clockIn = null;
      activityOf(s).forEach(function (a) {
        if (/^clocked in/i.test(a.what)) clockIn = a.at; else log.push(a);
      });

      var stats = ui.statbar([
        {
          label: 'Sessions a week',
          value: String(sessions),
          sub: mine.length
            ? 'across ' + mine.length + (mine.length === 1 ? ' class' : ' classes')
            : 'nothing assigned'
        },
        { label: 'Hours this week', value: hoursText(s) },
        {
          label: 'On the clock',
          value: statusText(s),
          tone: STAT_TONE[s.kind],
          sub: clockIn ? 'in at ' + clockIn : null
        }
      ]);

      cards.push({
        w: 2 + (mine.length || 2),
        html: ui.card({
          title: 'Classes this week',
          flush: true,
          note: mine.length
            ? 'A class that runs Monday to Friday is five sessions, which is why ' +
              mine.length + (mine.length === 1 ? ' class comes' : ' classes come') +
              ' to ' + sessionLabel(sessions) + '. An instructor sees only the classes assigned here — their Today, roster, attendance and lesson plans all follow this list.'
            : 'Assign a class and it appears here, and in their Today, roster and attendance.'
        }, mine.length
          ? ui.rows(mine.map(function (c) {
              return {
                lead: '<span class="mute">' + esc(c.day) + '</span>',
                title: esc(c.time),
                sub: ui.dot(prog(c).color) + ' ' + esc(place(c)),
                end: muted(sessionLabel(sessionsIn(c))),
                to: 'classRecord', id: c.id
              };
            }))
          : ui.empty('No classes assigned', invited
              ? 'Nothing is assigned until they accept the invitation.'
              : 'Nothing on the timetable for them this week.'))
      });

      if (events.length) {
        cards.push({
          w: 2 + events.length,
          html: ui.card({
            title: 'One-off dates',
            flush: true,
            note: 'A party or a pop-up is booked for the date it happens, so it sits outside the weekly count above.'
          }, ui.rows(events.map(function (c) {
            return {
              lead: '<span class="mute">' + esc(c.day) + '</span>',
              title: esc(c.name),
              sub: ui.dot(prog(c).color) + ' ' + esc(c.time + ' · ' + c.room),
              end: muted(c.en + ' booked'),
              to: 'classRecord', id: c.id
            };
          })))
        });
      }

      var plans = D.LESSON_PLANS.filter(function (p) { return p.teacher === s.name; });
      if (plans.length) {
        cards.push({
          w: 1 + plans.length,
          html: ui.card({
            title: 'Lesson plans',
            flush: true
          }, ui.rows(plans.map(function (p) {
            return {
              title: esc(p.lesson),
              sub: esc(p.cls + ' · ' + p.date),
              end: ui.pill(p.status, p.kind),
              to: 'lessonPlan', id: p.id
            };
          })))
        });
      }

      var tutorials = D.TUTORIALS.filter(function (t) { return t.by === s.name; });
      if (tutorials.length) {
        cards.push({
          w: 1 + tutorials.length,
          html: ui.card({
            title: 'Tutorials they filmed',
            flush: true
          }, ui.rows(tutorials.map(function (t) {
            return {
              title: esc(t.name),
              sub: esc(t.len + ' · ' + (t.linked === 'Not linked'
                ? 'not linked to a class'
                : 'linked to ' + t.linked)),
              end: muted('filmed ' + t.date),
              to: 'teaching'
            };
          })))
        });
      }

      var posts = D.ANNOUNCEMENTS.filter(function (a) { return a.by === s.name; });
      if (posts.length) {
        cards.push({
          w: 1 + posts.length,
          html: ui.card({
            title: 'Announcements they wrote',
            flush: true
          }, ui.rows(posts.map(function (a) {
            return {
              title: esc(a.head),
              sub: esc(a.aud + ' · ' + a.when),
              end: ui.pill(a.status, ANN_KIND[a.status]),
              to: 'announcement', id: a.id
            };
          })))
        });
      }

      var asks = D.SUPPLY_REQUESTS.filter(function (r) { return r.by === s.name; });
      if (asks.length) {
        cards.push({
          w: 2 + asks.length,
          html: ui.card({
            title: 'Supply requests',
            flush: true,
            note: 'Approved or declined in Requests, against the stock the studio holds.'
          }, ui.rows(asks.map(function (r) {
            return {
              title: esc(r.item),
              sub: esc('Asked for ' + r.qty + ' on ' + r.when),
              end: ui.pill(r.status, r.kind),
              to: 'requests'
            };
          })))
        });
      }

      if (log.length) {
        cards.push({
          w: 2 + log.length,
          html: ui.card({
            title: 'Today so far',
            flush: true,
            note: 'From the studio activity log for ' + D.today + '.'
          }, ui.rows(log.map(function (a) {
            return {
              lead: '<span class="mute">' + esc(a.at) + '</span>',
              title: esc(a.what)
            };
          })))
        });
      }

      var access = ui.card({ title: 'Access' }, invited
        ? h`<div class="spread">
            <p class="hint">The invitation has gone out but they have not signed in yet. Nothing is assigned to them, and no hours are counted, until they do.</p>
            ${raw(ui.btn({ label: 'Resend the invitation', msg: 'Invitation resent to ' + s.name }))}
          </div>`
        : h`<div class="spread">
            <p class="hint">Revoking takes their sign-in away straight away. Their hours, lesson plans and attendance history stay on file.</p>
            ${raw(ui.btn({ label: 'Revoke access', kind: 'danger', msg: 'Prototype — nothing was revoked' }))}
          </div>`);

      return '<div class="section">' + stats + balanced(cards) + '</div>' +
        '<div class="section">' + access + '</div>';
    }
  });

  /* Lay the record's cards into two columns that end at roughly the same
     place. The timetable leads the left column; the rest are dealt heaviest
     first to whichever column is shorter, so a two-row card is never parked
     beside a tall one with a third of a card of white underneath it. */
  function balanced(cards) {
    if (!cards.length) return '';
    if (cards.length === 1) return cards[0].html;

    var a = [cards[0].html], b = [], wa = cards[0].w, wb = 0;
    cards.slice(1).sort(function (x, y) { return y.w - x.w; }).forEach(function (c) {
      if (wb < wa) { b.push(c.html); wb += c.w; } else { a.push(c.html); wa += c.w; }
    });

    return ui.grid(2, [
      a.length > 1 ? ui.col(a) : a[0],
      b.length > 1 ? ui.col(b) : b[0]
    ]);
  }

  function person(ctx) {
    var id = ctx.params.id;
    return D.STAFF.filter(function (p) { return p.id === id; })[0] || D.STAFF[0];
  }
})();
