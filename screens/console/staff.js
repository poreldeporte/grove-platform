/* Console → Staff (list) and the staff record.

   WHO THESE TWO SCREENS ARE FOR
   Sabrina Yanguas, the owner. Six people. The whole team fits on one screen
   without scrolling, and she knows every name on it. She comes here to see
   who is carrying what, to look at the hours before she exports them, and to
   open one person. Density is right; a band of controls over six rows is not.

   Cut in this pass
     - the search box and the four filter chips. Every row is already on
       screen, so "Instructors" hides three people she can see and a search
       over six names she knows by heart is a control whose answer is always
       the whole table. With the filters gone, "6 of 6 people" has nothing to
       count against, so the toolbar goes with them and the table starts
       under the header. The empty state goes too — an unfiltered list of the
       staff cannot come back empty
     - "Open timesheet" on the record. It was a header action that said
       "Prototype — no timesheet in this build", sitting beside, and
       competing with, the one thing the record is for. The record now has a
       single header action, so the primary is unmissable. The hours are on
       the list, and that is where Export timesheet takes them from
     - the arithmetic lesson under the timetable: "A class that runs Monday
       to Friday is five sessions, which is why 5 classes come to 9
       sessions." Every row already prints its own session count and the stat
       above prints the total. She can add up
     - the counting footnotes under Lesson plans and Tutorials — "1 of these
       names a class not on their timetable" — which counted a mark that is
       printed in clay on the row two inches above. The mark stays, because
       it says something true that nothing else says; the tally of it was a
       number she cannot act on
     - the stat strip on a record that has nothing to put in it. Theo has not
       accepted his invitation, so "Sessions a week 0 · Hours this week 0.0 ·
       On the clock: Invitation sent" was three ways of saying "has not
       started", with an account state filed under a clock heading. His
       record leads with the invitation and the one button that moves it
     - "Sessions a week" on the front desk, the administrator and the owner,
       and the empty "Classes this week" card underneath it. None of the
       three teaches; a nought and an empty card are not facts about them
     - the owner's three em dashes. Hours, rate and clock status are not
       tracked for her, which is said once, in the Access card, rather than
       three times as placeholder tiles
     - the branch that decided whether the Access card was dealt into the two
       columns or given a band of its own. Access appears on every record,
       so it is simply dealt with the rest

   Added in this pass
     - `inviteStaff`. 'Invite a teacher' was a toast that said "Invitation
       sent" and left nothing behind, which is a table nobody would remember
       to build. It is a form now: name, email, role, pay rate, in one card
       under a sticky Send. The rate is a follow-up to the role rather than a
       question of its own — pick the role and the rate arrives pre-filled
       with what the studio already pays somebody in it, counted off the rows
       on the list. Before a role is picked there is no rate box at all
     - the form says what the invitation does rather than leaving her to
       guess: the email, the password they set themselves, and the fact that
       once in they see only the classes carrying their own name and the
       children on those rolls. That last is not a promise this file invents —
       it is the rule the Studio portal enforces, which filters D.CLASSES by
       `c.staff === persona.name` on every screen it draws

   Consequences made legible
     - Revoke access is the one control here that removes a person, and she
       has nobody to undo it for her. It now names what stays behind: the
       classes that keep the revoked person's name on them and will have no
       teacher who can sign in until she moves them. The count is read off
       Grove.data, so it cannot go stale
     - the owner's own record does not offer to revoke the account she is
       signed in with
     - Export timesheet says what it sent — the hours and the head count,
       both summed from the rows on screen

   Kept deliberately
     - the table. A list of six people with hours and a rate belongs in a
       table, not in six friendly cards
     - the clock column, and "Invitation sent" inside it, exactly as
       Grove.data writes it. The vocabulary is muddled — see the data note
       below — but a screen does not get to rewrite a record's status
     - no sticky action bar. That pattern belongs to a screen whose whole
       purpose is to complete one action; both of these exist to be read, and
       their actions live in the header where the owner's other list screens
       put them. ui.choice({size:'lg'}) likewise stays in the parent portal:
       this is a woman at a desk with a keyboard
     - the Private programme dot is blue because --prog-private is blue in
       css/tokens.css. A screen may not hard-code a colour, and the same
       class draws the same dot on Classes, the Dashboard and Today, so the
       fix belongs to the token rather than to this file

   What Grove.data does not carry, and this file therefore does not claim
     - no way to reach anyone. A staff record holds no phone number, no
       email and no emergency contact, so the record of a person says
       nothing about how to contact her
     - no record of who has done which training. TRAINING lists the allergy
       and EpiPen procedure but nothing ties a document to a person who has
       read it, so a record cannot say whether this instructor is cleared
     - a class names its teacher by matching the string CLASSES.staff against
       STAFF.name. Rename anyone in one place and their whole timetable
       silently empties */
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
  /* The same mapping Messages uses, so a post reads the same on both screens. */
  var ANN_KIND = { 'Pinned': 'amber', 'Live': 'ok', 'Scheduled': null };

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
  function classLabel(n) { return n + (n === 1 ? ' class' : ' classes'); }

  /* Whether this person's job involves a timetable at all. The front desk,
     the administrator and the owner hold no classes and are not waiting to
     be given any, so their records do not carry an empty one. */
  function teaches(s) {
    return s.role === 'Instructor' || assigned(s).length > 0;
  }

  /* What Export timesheet is actually sending: the hours printed in the
     table, and the people who worked them. Summed from the rows, so an edit
     to js/data.js moves the button's confirmation and the table's footnote
     together. */
  function payroll() {
    var hours = 0, people = 0;
    D.STAFF.forEach(function (s) {
      var n = s.hrs === '—' ? 0 : parseFloat(s.hrs);
      if (n > 0) { hours += n; people += 1; }
    });
    return { hours: hours.toFixed(1), people: people };
  }

  /* A lesson plan and a tutorial each name the class they belong to as free
     text rather than by id. Where that text carries a day and a start time it
     can be checked against the classes this person actually holds; a camp
     week or a private lesson names no time, so there is nothing to check and
     nothing is claimed. The studio never runs two classes at the same clock
     time, so the hour and minute settle it and the am/pm is not compared. */
  var DAY_AT = /\b(Mon|Tue|Wed|Thu|Fri|Sat)\b[^0-9]{0,4}(\d{1,2}(?::\d{2})?)\s*[ap]m/;

  function startsAt(c) { return String(c.time).split('–')[0].replace(/[^0-9:]/g, ''); }

  function runsOn(c, day) {
    var t = dayTokens(c);
    var from = WEEK.indexOf(t[0]);
    var to = t.length > 1 ? WEEK.indexOf(t[t.length - 1]) : from;
    if (from === -1 || to < from) return false;
    var i = WEEK.indexOf(day);
    return i >= from && i <= to;
  }

  function offTimetable(s, label) {
    var m = DAY_AT.exec(String(label));
    if (!m) return false;
    return !assigned(s).filter(function (c) {
      return runsOn(c, m[1]) && startsAt(c) === m[2];
    }).length;
  }

  function offMark(s, label) {
    return offTimetable(s, label)
      ? ' <span class="clay">· not on their timetable</span>'
      : '';
  }

  /* Whether the card needs to explain the mark at all — not how many rows
     carry it. The rows say that themselves. */
  function offAny(s, list, key) {
    return list.filter(function (r) { return offTimetable(s, r[key]); }).length > 0;
  }

  function prog(c) {
    return D.program(c.prog) || { short: c.prog, color: 'var(--ink-45)' };
  }
  function place(c) {
    return prog(c).short + ' · ' + c.room + (c.band === '—' ? '' : ' · ages ' + c.band);
  }

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

    /* The confirmation names what went out, rather than saying that
       something did. */
    actions: function () {
      var pay = payroll();
      return [
        {
          label: 'Export timesheet',
          msg: 'Timesheet exported — ' + pay.hours + ' hours, ' + pay.people + ' people'
        },
        { label: 'Invite a teacher', kind: 'primary', to: 'inviteStaff' }
      ];
    },

    body: function () {
      var pay = payroll();

      var table = ui.table(
        [
          'Name',
          'Role',
          { label: 'Sessions a week', align: 'right' },
          { label: 'Hours this week', align: 'right' },
          'Rate',
          { label: 'Status', shrink: true }
        ],
        D.STAFF.map(function (s) {
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
        })
      );

      return ui.card({
        flush: true,
        note: pay.hours + ' hours this week across ' + pay.people +
          ' people, which is what Export timesheet sends. A class that runs Monday to Friday ' +
          'counts as five sessions; a party or a pop-up is a single date rather than a weekly commitment.'
      }, table);
    }
  });

  /* ---- invite ---------------------------------------------------------------
     'Invite a teacher' used to raise a toast that said "Invitation sent" and
     leave nothing behind. It is a form now, and a short one: who they are,
     where to send it, what they will do, and what they are paid.

     The pay rate is not a question she has to remember the answer to. She
     picks the role; the rate fills itself in with what the studio already
     pays somebody in that role, counted off the rows on the list. Until she
     picks one there is no rate box, because there is nothing truthful to put
     in it.

     The roles offered are the roles the team already holds, less her own —
     there is one owner and she is the one sending the invitation. */

  Grove.on('inviteRole', function (d) { Grove.setFilter('inviteRole', d.id); });

  function inRole(role) {
    return D.STAFF.filter(function (s) { return s.role === role; });
  }

  /* Commonest role first, so the one she almost always picks leads. */
  function rolesToOffer(ctx) {
    var hers = ((ctx && ctx.persona) || Grove.persona('console') || {}).role;
    var seen = {}, out = [];
    D.STAFF.forEach(function (s) {
      if (s.role === hers || seen[s.role]) return;
      seen[s.role] = true;
      out.push(s.role);
    });
    return out.sort(function (a, b) { return inRole(b).length - inRole(a).length; });
  }

  /* What the studio already pays a person in this role, commonest rate first,
     with the head count that rate is on so the hint can say how settled it is.
     The owner's em dash is not a rate and is left out of the count. */
  function ratesIn(role) {
    var count = {}, order = [], people = inRole(role);
    people.forEach(function (s) {
      if (s.rate === '—') return;
      if (count[s.rate] === undefined) { count[s.rate] = 0; order.push(s.rate); }
      count[s.rate] += 1;
    });
    order.sort(function (a, b) { return count[b] - count[a]; });
    return { going: order[0] || '', on: count[order[0]] || 0, of: people.length };
  }

  function classesIn(role) {
    var n = 0;
    inRole(role).forEach(function (s) { n += assigned(s).length; });
    return n;
  }

  function peopleLabel(n) { return n + (n === 1 ? ' person' : ' people'); }

  /* Whoever is sitting in the invited state right now, read off the same
     status the table prints, so the form cannot name somebody the list does
     not show. */
  function pending() {
    return D.STAFF.filter(function (s) { return s.status === 'Invitation sent'; });
  }
  function nameList(list) {
    var names = list.map(function (s) { return s.name; });
    if (names.length < 2) return names.join('');
    return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
  }

  Grove.screen('inviteStaff', {
    surface: 'console',
    crumbs: [{ label: 'Staff', to: 'staff' }],
    crumbTitle: 'Invite a teacher',
    eyebrow: 'a new name on the rota',
    title: 'Invite a teacher',
    sub: 'A name, an address to send it to, and what they are paid. They set their own ' +
         'password, and they see only their own classes.',

    body: function (ctx) {
      var offered = rolesToOffer(ctx);
      var chosen = Grove.filter('inviteRole', '');
      if (offered.indexOf(chosen) === -1) chosen = '';

      var who = ui.fields(2, [
        ui.field({
          label: 'Their name',
          hint: 'A class carries its teacher by name, so this is the name that will appear ' +
                'on their timetable.',
          control: ui.input({ placeholder: 'First and last name' })
        }),
        ui.field({
          label: 'Their email',
          hint: 'Where the invitation goes, and how they sign in afterwards.',
          control: ui.input({ type: 'email', placeholder: 'name@email.com' })
        })
      ]);

      var role = h`<div class="card-split">${raw(ui.field({
        label: 'What will they do?',
        hint: 'The roles somebody on the team already holds.',
        control: ui.choices(2, offered.map(function (r) {
          var held = classesIn(r), n = inRole(r).length;
          return ui.choice({
            id: r,
            act: 'inviteRole',
            title: r,
            sub: peopleLabel(n) + ' on the team · ' +
              (held ? classLabel(held) + (n > 1 ? ' between them' : '') : 'no classes'),
            on: r === chosen
          });
        }))
      }))}</div>`;

      /* The follow-up, and only once the answer that fills it in has been
         given. */
      var pay = '';
      if (chosen) {
        var r = ratesIn(chosen);
        var settled = r.on === r.of
          ? (r.of === 1 ? 'the one person' : 'all ' + peopleLabel(r.of))
          : r.on + ' of the ' + peopleLabel(r.of);
        pay = h`<div class="card-split">${raw(ui.field({
          label: 'Pay rate',
          hint: r.going
            ? 'Filled in with ' + r.going + ', which is what the studio pays ' + settled +
              ' in this role. Change it if this one is different.'
            : 'No rate is recorded against this role, so there is nothing to fill in.',
          control: ui.input({ value: r.going, placeholder: 'e.g. $28/hr' })
        }))}</div>`;
      }

      var waiting = pending();
      var teaches_ = chosen ? classesIn(chosen) : -1;

      var what = h`<div class="card-split"><div class="stack stack--sm">
        <p>We email the invitation to that address. They set their own password — you never see
        it, and you cannot set it for them.</p>
        <p>Until they accept it they sit on Staff as <span class="strong">Invitation sent</span>:
        they cannot sign in, nothing is assigned to them and no hours are counted.${raw(
          waiting.length
            ? ' ' + esc(nameList(waiting)) + (waiting.length === 1 ? ' is' : ' are') + ' there now.'
            : ''
        )}</p>
        <p>Once they are in, they see the classes with their own name on them and the children
        on those rolls, and nothing else — not another teacher’s class, not what a family pays,
        not a child they do not teach.${raw(teaches_ === 0
          ? ' Nobody in this role holds a class today, so there is nothing of their own to see ' +
            'until you assign one.'
          : ''
        )}</p>
      </div></div>`;

      return ui.card({}, who + role + pay + what) + ui.formActions([
        {
          label: 'Send the invitation',
          kind: 'primary',
          msg: 'Invitation sent — nothing is assigned and no hours count until they accept'
        },
        { label: 'Cancel', to: 'staff' }
      ], {
        sticky: true,
        hint: chosen
          ? 'Sending emails the invitation and puts them on Staff as Invitation sent'
          : 'Choose what they will do and the pay rate fills itself in'
      });
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
      { label: 'Assign a class', kind: 'primary', to: 'classes' }
    ],

    body: function (ctx) {
      var s = person(ctx);
      var mine = timetableOf(s);
      var events = oneOffsOf(s);
      var invited = s.status === 'Invitation sent';
      var cards = [];

      /* The activity log holds this person's clock-in time; it belongs beside
         the status rather than repeated as a row of its own. */
      var log = [], clockIn = null;
      activityOf(s).forEach(function (a) {
        if (/^clocked in/i.test(a.what)) clockIn = a.at; else log.push(a);
      });

      /* Only the figures this person actually has. A tile reading "0" or
         "not tracked" is a placeholder, not a fact. */
      var tiles = [];
      if (teaches(s)) {
        tiles.push({
          label: 'Sessions a week',
          value: String(sessionsAWeek(s)),
          sub: mine.length ? 'across ' + classLabel(mine.length) : 'nothing assigned'
        });
      }
      if (s.hrs !== '—') tiles.push({ label: 'Hours this week', value: s.hrs + ' hrs' });
      if (s.status !== '—') {
        tiles.push({
          label: 'On the clock',
          value: s.status,
          tone: s.kind === 'ok' ? 'grove' : null,
          sub: clockIn ? 'in at ' + clockIn : null
        });
      }
      var stats = (invited || !tiles.length) ? '' : ui.statbar(tiles);

      if (teaches(s)) {
        cards.push({
          w: 2 + (mine.length || 2),
          html: ui.card({
            title: 'Classes this week',
            flush: true,
            note: mine.length
              ? 'What is assigned here is what they see — their Today, their roster and their attendance all follow this list.'
              : (invited ? null : 'Assign a class and it appears here, and in their Today, roster and attendance.')
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
      }

      if (events.length) {
        cards.push({
          w: 2 + events.length,
          html: ui.card({
            title: 'One-off dates',
            flush: true,
            note: 'A party or a pop-up is booked for the date it happens, so it sits outside the weekly count.'
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
        var planOff = offAny(s, plans, 'cls');
        cards.push({
          w: (planOff ? 2 : 1) + plans.length,
          html: ui.card({
            title: 'Lesson plans',
            flush: true,
            note: planOff
              ? 'A plan stays with the class it was written for, which is not always a class they run now.'
              : null
          }, ui.rows(plans.map(function (p) {
            return {
              title: esc(p.lesson),
              sub: esc(p.cls + ' · ' + p.date) + offMark(s, p.cls),
              end: ui.pill(p.status, p.kind),
              to: 'lessonPlan', id: p.id
            };
          })))
        });
      }

      var tutorials = D.TUTORIALS.filter(function (t) { return t.by === s.name; });
      if (tutorials.length) {
        var tutOff = offAny(s, tutorials, 'linked');
        cards.push({
          w: (tutOff ? 2 : 1) + tutorials.length,
          html: ui.card({
            title: 'Tutorials they filmed',
            flush: true,
            note: tutOff
              ? 'A tutorial stays linked to the class it was filmed for, long after that class has moved on.'
              : null
          }, ui.rows(tutorials.map(function (t) {
            return {
              title: esc(t.name),
              sub: esc(t.len + ' · ' + (t.linked === 'Not linked'
                ? 'not linked to a class'
                : 'linked to ' + t.linked)) + offMark(s, t.linked),
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

      /* An invitation that has not been accepted is the whole state of that
         record and the only thing to do about it, so it leads the page rather
         than waiting at the foot in an Access card. */
      var lead = invited
        ? ui.notice({
            kind: 'warn',
            title: 'Invitation sent, not yet accepted',
            text: 'They cannot sign in. Nothing is assigned to them and no hours are counted until they accept.',
            action: { label: 'Resend the invitation', msg: 'Invitation resent to ' + s.name }
          })
        : '';

      if (!invited) cards.push({ w: 2, html: access(s, ctx) });

      var main = cards.length
        ? '<div class="section">' + stats + columns(deal(cards)) + '</div>'
        : '';
      return lead + main;
    }
  });

  /* Revoking is the one thing on this screen that removes a person, and there
     is nobody to undo it for her, so it says what it leaves behind: the
     classes that keep the revoked person's name on them and will have nobody
     who can sign in to teach them. The count is read off Grove.data. */
  function access(s, ctx) {
    if (ctx.persona && ctx.persona.name === s.name) {
      var yours = 'This is the account you are signed in with, so its sign-in cannot be revoked here.';
      if (s.hrs === '—') yours += ' It records no hours and no rate.';
      return ui.card({ title: 'Access' }, h`<p class="hint">${yours}</p>`);
    }

    var held = assigned(s).length;
    var what = 'Revoking takes their sign-in away straight away. ';
    if (held) {
      what += 'The ' + classLabel(held) + ' assigned to them keep their name, so move ' +
        (held === 1 ? 'it' : 'those') + ' to somebody else first or ' +
        (held === 1 ? 'it will have' : 'they will have') + ' no teacher who can sign in. ';
    }
    what += 'Their hours, lesson plans and attendance history stay on file.';

    return ui.card({ title: 'Access' }, h`<div class="spread">
      <p class="hint">${what}</p>
      ${raw(ui.btn({ label: 'Revoke access', kind: 'danger', msg: 'Prototype — nothing was revoked' }))}
    </div>`);
  }

  /* Lay the record's cards into two columns that end at roughly the same
     place. The first card leads the left column; the rest are dealt heaviest
     first to whichever column is shorter, so a two-row card is never parked
     beside a tall one with a third of a card of white underneath it.

     A card's weight is its head, its rows and its footnote — the parts that
     take up height — which is why a card gains weight when the footnote
     below appears. */
  function deal(cards) {
    var a = [cards[0].html], b = [], wa = cards[0].w, wb = 0;
    cards.slice(1).sort(function (x, y) { return y.w - x.w; }).forEach(function (c) {
      if (wb < wa) { b.push(c.html); wb += c.w; } else { a.push(c.html); wa += c.w; }
    });
    return { a: a, b: b };
  }

  function columns(d) {
    if (!d.b.length) return d.a.join('');
    return ui.grid(2, [
      d.a.length > 1 ? ui.col(d.a) : d.a[0],
      d.b.length > 1 ? ui.col(d.b) : d.b[0]
    ]);
  }

  function person(ctx) {
    var id = ctx.params.id;
    return D.STAFF.filter(function (p) { return p.id === id; })[0] || D.STAFF[0];
  }
})();
