/* Registration → the enrolment flow, for all six programmes.

   FIVE STEPS BECAME THREE, for every programme.
     1. Who      the old step 1 (your family) and step 2 (children) merged.
                 They asked for the same kind of thing on two screens.
     2. What     the old step 3 — the one programme-specific decision.
     3. Confirm  the old step 4 (safety questions and policies) and step 5
                 (review and pay) merged, so what you are agreeing to and what
                 it costs sit on one screen.
   Birthday already ran three steps and keeps them, renamed to match.

   Also cut, and why:
     - "Contact 2" on the old step 1 asked for the same person as the
       "Emergency contact" on the old step 4. It is one card now, on step 3.
     - Home phone, work phone, confirm email and confirm password are gone.
       One number and one address per person is enough to reach someone.
     - After-school asked for a plan, an age group, how to split the hours,
       and then a day-and-time chip builder. It now asks for a plan, an age
       group and the actual class, so the places shown are the real ones.
     - "Add individual classes" left registration — extras are bought from
       the portal once a child is enrolled, and they are not part of the plan.
     - Camp asked for a week, then full week or days, then the days. Choosing
       the days is the same decision: five days is the week.
     - Camp extra hours are chosen once for the booking, not day by day.
     - The birthday cake block only appeared once Cake was ticked and asked
       three questions the notes field already covers.
     - The scripted card decline on first submit is gone.
     - The three right-hand aside boxes became notes on the cards they explain.
     - "Cell" on the main contact asked for the household number a second
       time. One number per family, asked once.
     - All four after-school packages ended "· assigned by age group". The
       age-group card says it once.

   Every amount is computed from Grove.data.PRICING; policy wording is verbatim.

   A waitlisted place is charged nothing. When the class you chose is full the
   running total itemises the invoice that would follow a place being offered
   and then says, in the same card, that today's figure is zero — so the plum
   banner and the money can no longer disagree. Everything else on the screen
   (the sub-heading, the review rows, the "next step" card and the footnote)
   reads that one state from asWaiting().

   A private class is the same shape: the policies, the "How a private is
   booked" card and the step-2 note all say it is approved before it is
   scheduled and charged, so the money card itemises the invoice, shows zero
   due today, and the button sends a request instead of asking for money the
   page says is not taken. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, esc = Grove.esc, D = Grove.data;
  var P = D.PRICING;

  var DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  var GRADES = ['1st grade', '2nd grade', '3rd grade', '4th grade', '5th grade', '6th grade'];

  /* The two dates the confirmation screen also prints, kept word for word so
     the review step and registration/done.js cannot drift apart. */
  var FIRST_CLASS = 'Monday 17 Aug 2026';
  var NEXT_MONTH = '1 Sep 2026';

  /* ---- small helpers ------------------------------------------------------ */

  function m(n) { return Grove.money(n); }
  function m0(n) { return Grove.money(n, { cents: false }); }
  function sec(inner) { return '<div class="section">' + inner + '</div>'; }
  function head(title, right) {
    return '<div class="section-head"><h2 class="section-title">' + esc(title) + '</h2>' +
      (right || '<span></span>') + '</div>';
  }
  function row(k, v, tone) { return { k: k, v: esc(v), tone: tone || null }; }
  function plural(n, one, many) { return n === 1 ? one : many; }
  function hint(text) { return '<p class="hint">' + esc(text) + '</p>'; }

  /* ---- flow state ---------------------------------------------------------- */

  function progId(ctx) {
    var id = ctx && ctx.params ? ctx.params.id : null;
    return D.PROGRAMS[id] ? id : 'as';
  }
  function pick(key, fallback) { return Grove.tab(key, fallback); }
  function stepNo() {
    var n = Number(pick('rStep', 0));
    if (!(n > 0)) return 0;
    return n > 2 ? 2 : n;
  }

  Grove.on('rChoose', function (d) {
    var id = String(d.id), i = id.indexOf(':');
    Grove.setTab(id.slice(0, i), id.slice(i + 1));
  });
  Grove.on('rStep', function (d) { Grove.setTab('rStep', Number(d.n)); });
  Grove.on('rKids', function (d) { Grove.setTab('rKids', Number(d.n)); });

  function tile(key, value, cur, o) {
    return ui.choice({
      id: key + ':' + value,
      act: 'rChoose',
      title: o.title,
      sub: o.sub,
      price: o.price,
      on: String(cur) === String(value)
    });
  }
  function check(id, title, sub) {
    return ui.choice({ id: id, title: title, sub: sub, on: Grove.toggle(id, false) });
  }

  /* ---- the family and the children ------------------------------------------ */

  function fam() { return D.family('johnson'); }
  function seedKids() {
    return D.STUDENTS.filter(function (s) { return s.family === 'Johnson'; });
  }
  function kidCount() {
    var n = Number(pick('rKids', 2));
    if (!(n > 0)) n = 1;
    return n > 3 ? 3 : n;
  }
  function kidList() {
    var seed = seedKids(), out = [], i;
    for (i = 0; i < kidCount(); i++) out.push(seed[i] || null);
    return out;
  }
  function kidNames() {
    return kidList().map(function (k, i) {
      return k ? k.name.split(' ')[0] : 'Child ' + (i + 1);
    });
  }

  /* ---- programme lookups, all read from Grove.data ---------------------------- */

  function classesFor(p) {
    return D.CLASSES.filter(function (c) { return c.prog === p; });
  }
  function places(c) { var n = c.cap - c.en; return n > 0 ? n : 0; }
  function placeLabel(c) {
    var n = places(c);
    return n ? n + plural(n, ' place left', ' places left') : 'Full · join waitlist';
  }
  function byId(list, id) {
    var i;
    for (i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  var PLAN_KEYS = ['p4', 'p8', 'p12', 'p16'];
  /* The "assigned by age group" line used to end all four of these. It is said
     once, on the age-group card, instead of four times here. */
  var PLAN_SUB = {
    p4: 'One 1-hour class a week',
    p8: 'Two hours a week, or two 1-hour classes',
    p12: 'Three hours a week',
    p16: 'Four hours a week'
  };
  function planKey() {
    var cur = pick('rPlan', 'p8');
    return PLAN_KEYS.indexOf(cur) === -1 ? 'p8' : cur;
  }
  function planLabel(key) { return key.slice(1) + ' Classes / Month'; }

  function asBands() {
    var out = [];
    classesFor('as').forEach(function (c) {
      if (out.indexOf(c.band) === -1) out.push(c.band);
    });
    return out;
  }
  function asBand() {
    var seed = seedKids()[0];
    var fallback = seed ? seed.band : asBands()[0];
    var cur = pick('rBand', fallback);
    return asBands().indexOf(cur) === -1 ? fallback : cur;
  }
  function asClassList() {
    var b = asBand();
    return classesFor('as').filter(function (c) { return c.band === b; });
  }
  function asClass() {
    var list = asClassList(), found = byId(list, pick('rClass', '')), i;
    if (found) return found;
    for (i = 0; i < list.length; i++) if (places(list[i]) > 0) return list[i];
    return list[0] || null;
  }
  function classLabel(c) { return c ? c.day + ' ' + c.time + ' · ' + c.room : 'No place chosen'; }

  /* True when the chosen after-school class has no place left, which is the
     one state where nothing at all is charged today. */
  function asWaiting() {
    var c = asClass();
    return !!c && !places(c);
  }
  function asWaitPosition() {
    var c = asClass();
    return c ? c.wl + 1 : 0;
  }

  function campClass() {
    var list = classesFor('camp');
    return byId(list, pick('rWeek', '')) || list[0] || null;
  }
  function campDays() {
    return DAYS.filter(function (d) { return Grove.toggle('rcDay-' + d, true); });
  }
  function campEndHour() {
    var c = campClass();
    if (!c) return 1;
    return parseInt(String(c.time).split('–')[1], 10) || 1;
  }
  function campHours() {
    var c = campClass();
    return c ? String(c.time).replace('–', ' to ') : 'the same hours';
  }
  function campExtra() {
    var n = Number(pick('rXhr', 0));
    return n > 0 ? (n > 3 ? 3 : n) : 0;
  }

  function nsdClass() {
    var list = classesFor('nsd');
    return byId(list, pick('rDate', '')) || list[0] || null;
  }
  function nsdStartHour() {
    var c = nsdClass();
    return c ? (parseInt(c.time, 10) || 9) : 9;
  }
  function nsdHours() {
    var n = Number(pick('rHours', 3));
    return n >= 3 && n <= P.nsd.maxHours ? n : 3;
  }
  function clockPm(hour24) {
    var hr = hour24 > 12 ? hour24 - 12 : hour24;
    return hr + ':00pm';
  }

  function privHours() {
    var n = Number(pick('rPhours', 1));
    return n >= 1 && n <= P.priv.maxHours ? n : 1;
  }

  function popEvent() {
    return byId(P.pop.events, pick('rEvent', '')) || P.pop.events[0];
  }
  function popQty() {
    var n = Number(pick('rQty', 1));
    if (!(n > 0)) n = 1;
    return n > kidCount() ? kidCount() : n;
  }

  /* ---- birthday checklists ------------------------------------------------------ */

  var BTHEMES = ['Squishmallows', 'Unicorns', 'Season of the Year', 'Cowgirl', 'Movie Party',
    'Character Theme', 'Safari / Spa', 'Games & Activities', 'Dance / Disco', 'Glow in the Dark'];
  var BACTS = ['Painting Shoes', 'Tie-Dye', 'Slime', 'Masks', 'Picture Frames',
    'Decorating Jean Jackets', 'Painting Tote Bags', 'Painting Ceramics', 'Bedazzling'];
  var BINCS = ['Cake', 'Goodie Bags', 'Décor', 'Backdrop', 'Balloons', 'Digital Invitation',
    'DJ', 'Food', 'Drinks', 'Plates', 'Napkins'];

  function ticked(prefix, list) {
    return list.filter(function (x) { return Grove.toggle(prefix + x, false); });
  }

  /* ---- pricing — every figure comes from Grove.data.PRICING ------------------------ */

  function quote(p) {
    var n = kidCount(), rows = [], total = 0, label = 'Due today', note = '', value;
    var relief, fee, base, extra, c, ev, q, hrs, days, full, due = null;

    if (p === 'as') {
      base = P.as.plans[planKey()] * n;
      fee = P.as.regFee * n;
      relief = P.as.regFee * 0.5 * (n - 1);
      total = base + fee - relief;
      c = asClass();
      rows.push(row('Plan', planLabel(planKey())));
      rows.push(row('Age group', 'Ages ' + asBand()));
      rows.push(c ? row('Class', classLabel(c)) : row('Class', 'Not chosen', 'mute'));
      rows.push(row('Children', String(n)));
      rows.push(row('Tuition', m(base) + ' a month'));
      rows.push(row('Registration fee', m(fee)));
      if (relief) rows.push(row('Sibling discount', '−' + m(relief), 'grove'));
      /* A waitlisted place is not billed. The itemised lines still add up to
         the invoice that would follow a place being offered, so the two
         figures cannot disagree — but today's figure is zero. */
      if (asWaiting()) {
        rows.push(row('First invoice, if a place opens', m(total)));
        label = 'Due today';
        due = 0;
        note = 'Nothing is charged while you are on the waitlist. If a place is offered you ' +
          'have 24 hours to accept, and the invoice above is emailed as a secure payment link.';
      } else {
        label = 'First invoice';
        note = 'Emailed as a secure payment link. Then ' + m(base) +
          ' a month from ' + NEXT_MONTH + ', until you cancel.';
      }

    } else if (p === 'camp') {
      c = campClass();
      days = campDays().length;
      full = days === DAYS.length;
      base = (full ? P.camp.week : days * P.camp.day) * n;
      extra = campExtra() * P.camp.extraHour * days * n;
      fee = P.camp.regFee * n;
      total = base + extra + fee;
      rows.push(c ? row('Camp', c.name) : row('Camp', 'Not chosen', 'mute'));
      rows.push(days ? row('Days', full ? 'Full week' : days + plural(days, ' day', ' days'))
        : row('Days', 'None chosen', 'mute'));
      rows.push(row('Children', String(n)));
      rows.push(row('Camp fee', m(base)));
      rows.push(campExtra()
        ? row('Extra hours', '+' + campExtra() + plural(campExtra(), ' hr', ' hrs') + ' · ' + m(extra))
        : row('Extra hours', 'None', 'mute'));
      rows.push(row('Registration fee', m(fee)));

    } else if (p === 'nsd') {
      c = nsdClass();
      hrs = nsdHours();
      base = (P.nsd.base + (hrs - 3) * P.nsd.extraHour) * n;
      fee = P.nsd.regFee * n;
      total = base + fee;
      rows.push(c ? row('Date', c.name) : row('Date', 'Not chosen', 'mute'));
      rows.push(row('Length', hrs + ' hours'));
      rows.push(row('Children', String(n)));
      rows.push(row('Day rate', m(base)));
      rows.push(row('Registration fee', m(fee)));

    } else if (p === 'priv') {
      hrs = privHours();
      base = P.priv.hourly * hrs * n;
      fee = P.priv.regFee * n;
      total = base + fee;
      rows.push(row('Hours', hrs + plural(hrs, ' hour', ' hours') + ' at ' + m0(P.priv.hourly) + ' an hour'));
      rows.push(row('Children', String(n)));
      /* "Scheduling" was said here and again on the review card beside it. The
         money card keeps the money; the review card keeps the arrangement. */
      rows.push(row('Session', m(base)));
      rows.push(row('Registration fee', m(fee)));
      /* A private is a request, not a booking: the approval policy, the
         "How a private is booked" card and the step-2 note all say nothing is
         charged until the time is agreed, so the money card says it too. The
         itemised lines still add up to the invoice that follows approval. */
      rows.push(row('Cost once approved', m(total)));
      due = 0;
      note = 'Nothing is charged until we approve the request and agree a time. The amount ' +
        'above is then emailed as a secure payment link.';

    } else if (p === 'pop') {
      ev = popEvent();
      q = popQty();
      base = ev.amount * q;
      fee = P.pop.regFee * q;
      total = base + fee;
      rows.push(row('Event', ev.label));
      rows.push(row('Children', q + ' × ' + m0(ev.amount)));
      rows.push(row('Tickets', m(base)));
      rows.push(row('Registration fee', m(fee)));

    } else {
      var th = ticked('rbTheme-', BTHEMES).length;
      var ac = ticked('rbAct-', BACTS).length;
      var inc = ticked('rbInc-', BINCS).length;
      rows.push(row('Where', 'At the studio'));
      rows.push(row('Guests', 'Up to 12 · 4 adults'));
      rows.push(th ? row('Themes', th + ' chosen') : row('Themes', 'None yet', 'mute'));
      rows.push(ac ? row('Activities', ac + ' of 44') : row('Activities', 'None yet', 'mute'));
      rows.push(inc ? row('We provide', inc + ' items') : row('We provide', 'Nothing yet', 'mute'));
      label = 'Cost';
      note = 'We price parties individually and reply with a written quote.';
    }

    /* priv keeps its own note: it is the one paid programme where nothing is
       charged on submit, so "a single payment" would be wrong beside it. */
    if (p !== 'as' && p !== 'bday' && p !== 'priv') {
      note = 'A single payment. Camps, day camps, privates and pop-ups are non-refundable.';
    }
    value = p === 'bday' ? 'Quote' : m(due === null ? total : due);
    return { rows: rows, label: label, total: total, due: due === null ? total : due,
      value: value, note: note };
  }

  function priceCard(p) {
    var q = quote(p), pr = D.program(p);
    var rows = q.rows.concat([{
      k: q.label,
      v: '<span class="strong">' + esc(q.value) + '</span>',
      tone: 'grove'
    }]);
    return ui.card({
      title: 'Running total',
      head: '<span class="mute">' + ui.dot(pr.color) + ' ' + esc(pr.name) + '</span>',
      note: q.note
    }, ui.kv(rows));
  }

  /* ---- policies — wording is verbatim, the fee is read from PRICING ---------------- */

  var POL = {
    asFacts: {
      name: 'Important Facts to Take Into Consideration',
      sum: 'The program follows the school-year calendar, membership is month to month, and payment comes before class.',
      det: [
        'Our program follows the school-year calendar, operating from the date of enrollment through the end of the academic school year.',
        'Membership is on a month-to-month basis.',
        'Payment must be completed before your child attends class. Students will not be allowed to enter class without payment.',
        'Please be on time for drop-off and pick-up, as other classes may be scheduled before or after your child’s session. We appreciate your punctuality and cooperation.',
        'Children with runny noses, coughs, or signs of illness may not participate in class. Please use your available make-up classes for days when your child is not feeling well.',
        'The Grove Art Studio maintains a clean and safe environment. All surfaces and materials are disinfected before, during, between, and after each class.',
        'All art materials are provided during our sessions. Please dress children in comfortable clothing that can get messy, as paint and other art materials may stain.',
        'Please label personal items such as water bottles or belongings brought to the studio.',
        'Thank you for helping us maintain a safe, organized, and creative environment for all students.',
        'During After School we do not allow food during class.'
      ]
    },
    asSched: {
      name: 'Class Scheduling',
      sum: 'Mondays are often affected by holidays, and parents schedule every class and make-up themselves.',
      det: [
        'When selecting your weekly class day, please note that Mondays are often affected by holidays.',
        'If you choose a Monday class, you are responsible for scheduling a makeup session before the end of the same month.',
        'All makeup classes must be scheduled by parents in advance.',
        'During school-year holiday breaks (such as Spring Break/Easter and Christmas Break), makeup classes must be arranged through the parent portal based on your child’s specific school calendar.',
        'Monthly plans are not paused or prorated for holidays.',
        'Parents are responsible for scheduling all classes and makeup sessions.',
        'The Grove Art Studio is not responsible for booking or managing schedules.'
      ]
    },
    asMakeup: {
      name: 'Make-Up & Cancellations Policy',
      sum: 'Cancel 24 hours ahead or the class counts as attended. Make-ups expire with the billing cycle.',
      det: [
        'Cancellations must be made at least 24 hours prior to class due to illness, trips, or other reasons in the portal.',
        'Failure to cancel within this timeframe will result in the class being counted as attended, and no makeup will be granted.',
        'Makeups must be used within the same monthly billing cycle — no exceptions.',
        'Makeups are allowed in any age-appropriate class, subject to space availability (through the portal).',
        'Makeup classes cannot:',
        '— Be rolled over into future months, sessions, camps, or pop-ups.',
        '— Be transferred to siblings or other members.',
        '— Be guaranteed if all classes are at capacity.',
        '— Be rescheduled if missed (a scheduled makeup class that is not attended will be marked as used).',
        'Monthly plans are not frozen for any reason.',
        'If you wish to cancel your membership, a 30-day written notice is required to contact@thegroveartstudio.com or via the portal.',
        'Without proper notice, you will be billed through the end of the school year.'
      ]
    },
    asPickup: {
      name: 'Drop Off & Pick Up',
      sum: 'Door-to-door with a parent or guardian, and a 10-minute grace period either side.',
      det: [
        'For safety reasons, children must be dropped off and picked up at the studio door by a parent or guardian.',
        'We are not responsible for children arriving or leaving unaccompanied via elevator or stairs.',
        'Please be punctual for both drop-off and pick-up to ensure a smooth flow of classes and transitions.',
        'A 10-minute grace period is allowed for both drop-off and pick-up. After this window, a late fee of $1 per minute will be charged and invoiced via email.',
        'Late drop-offs will be allowed to participate for the remaining time of the class only. Missed time will not be made up or extended.',
        'Please respect class times, as we have back-to-back sessions and must maintain our schedule.'
      ]
    },
    asHealth: {
      name: 'Health & Safety Guidelines',
      sum: 'Unwell children stay home and use a make-up day. The studio is cleaned between every class.',
      det: [
        'Children with runny noses, coughs, or other illness symptoms will not be permitted in class. Please use your makeup days in these situations.',
        'The studio is cleaned and disinfected before, during, and after each class.',
        'Children should be dressed appropriately; art can get messy!'
      ]
    },
    asMedical: {
      name: 'Medical Emergencies & Safety Policy',
      sum: 'What we do in an emergency, and what you authorise us to do if we cannot reach you.',
      det: [
        'At The Grove Art Studio, the safety and well-being of all children is our top priority. In the event of a medical emergency, our staff will take immediate action to ensure the child receives appropriate care.',
        'If a child becomes seriously ill or injured during class or camp, 911 will be contacted immediately if necessary. Parents or guardians will be notified as soon as possible using the emergency contact information provided during registration.',
        'In the case of an emergency situation (such as a building emergency or unsafe conditions), children will be safely escorted to a designated safe location while parents or guardians are contacted and further instructions are provided.',
        'By enrolling your child in our programs, you authorize The Grove Art Studio staff to seek emergency medical treatment for your child if a parent or guardian cannot be reached in a timely manner.',
        'Parents/guardians are responsible for providing accurate medical information, including allergies, medical conditions, and emergency contact details on the registration form.',
        'The Grove Art Studio staff cannot administer medication unless prior written authorization has been provided by a parent or guardian.'
      ]
    },
    asPayment: {
      name: 'Payment Terms',
      /* Our own summary line says "registration fee", the name the running
         total and the package footnote use. The studio's verbatim text below
         calls the same charge an initiation fee, and is left as written. */
      sum: 'Non-refundable, billed on the 1st of the month, with a 7-day grace period and a one-time registration fee.',
      det: [
        'Enrollment is confirmed only after payment is received.',
        'Students will not be admitted to class without prior payment.',
        'All payments are non-refundable; however, they may be applied as credit toward the same type of class within an approved timeframe.',
        'All payments must be made through the parent portal. Please note that our software includes specific payment policies that will apply once payment is submitted.',
        'A one-time initiation fee (covering materials and software) is required. Second and third children receive 50% off this fee.',
        'Monthly payments are due each month and must be completed within a 7-day grace period.',
        'If payment is not received within this timeframe, an automatic late fee will be applied to your account.',
        'Additional Payment Policy',
        '— Monthly tuition is billed automatically on the 1st day of each month, regardless of your original enrollment date.',
        '— Tuition reserves your child’s place in the program and is charged monthly throughout the school year.',
        '— Because our program follows the academic school-year calendar, the final month of the school year may not contain the same number of scheduled classes as a standard month.',
        '— If your final paid month includes fewer scheduled classes due to the end of the school year, any remaining classes owed for that billing cycle will be issued as make-up credits. These credits must be scheduled and completed according to the studio’s Make-Up Policy.',
        '— Tuition is based on monthly enrollment rather than the number of classes attended in a particular calendar month.'
      ]
    },
    asLiability: {
      name: 'Release of Liability',
      sum: 'You release the studio from liability for injuries, accidents or lost belongings.',
      det: [
        'By enrolling my child, I agree to release and hold harmless The Grove Art Studio, its owners, staff, and instructors from any liability for injuries, accidents, or loss of personal belongings that may occur during participation in studio activities.',
        'I acknowledge that I am responsible for informing the studio of any medical conditions, allergies, or special needs that may affect my child’s participation.',
        'By completing registration, I confirm that I understand and accept this policy and grant permission for my child to participate in all studio activities.',
        'I give permission for my child to participate in all activities associated with classes, camps, and events at The Grove Art Studio. I understand that participation in art activities may involve certain risks.',
        'I understand and agree that while every precaution will be taken to ensure the safety of my child during participation in The Grove Art Studio classes, there are inherent risks involved.',
        'I release The Grove Art Studio LLC and its employees from any liability for injuries or accidents that may occur during the art class.'
      ]
    },
    asAgreement: {
      name: 'Agreement',
      sum: 'The final acknowledgement, including that the registration fee is non-refundable.',
      det: [
        'I have read and agree to the terms outlined above for The Grove Art Studio’s After-School Art Program.',
        'I understand that the registration fee is non-refundable.',
        'I accept the studio’s policies regarding membership, payment, cancellations, makeups, and safety.'
      ]
    },

    food: {
      name: 'Food & snacks',
      sum: 'Bring a filling lunch and a snack. We provide no food, and children do not share.',
      det: [
        'Please send a filling lunch and a snack — camp days are long and active.',
        'The studio does not provide food or drink of any kind.',
        'Children do not share food with one another, for allergy reasons.',
        'Label everything with your child’s name.',
        'Tell us about every allergy on this form, even a mild one.'
      ]
    },
    nomakeup: {
      name: 'No make-ups, refunds or credit',
      sum: 'A booked day is a held place. Missing it does not create a make-up, a refund or a credit.',
      det: [
        'Camp days, no-school days and pop-up events are booked as a place, not as attendance.',
        'Missing a booked day does not create a make-up class.',
        'Payments for these programs are not refundable.',
        'No credit is issued for unused days.',
        'This is different from after-school, where 24 hours notice does create a make-up credit.'
      ]
    },
    regfee: {
      name: 'Registration fee',
      sum: 'The {FEE} registration fee is per child, per booking, and is not refundable.',
      det: [
        'A {FEE} registration fee applies to each child on each booking.',
        'The fee is not refundable under any circumstances, including cancellation by you.',
        'It is separate from the program cost shown above.'
      ]
    },
    pickup: {
      name: 'Drop-off & pick-up',
      sum: 'Door-to-door with an adult. Ten-minute grace, then $1 per minute.',
      det: [
        'Children must be dropped off and collected at the studio door by a parent or guardian.',
        'We are not responsible for children arriving or leaving unaccompanied.',
        'A ten-minute grace period applies at both ends; after that a late fee of $1 per minute is invoiced.',
        'Late arrivals join for the remaining time only; missed time is not extended.',
        'Only people on your authorised pickup list may collect a child.'
      ]
    },
    health: {
      name: 'Health & safety',
      sum: 'Unwell children stay home — use a make-up. Surfaces disinfected between every class.',
      det: [
        'Children with runny noses, coughs or other symptoms may not attend. Please use a make-up credit.',
        'The studio is cleaned and disinfected before, during and after each class.',
        'Art gets messy — please dress children accordingly. All materials are provided.',
        'No food during after-school classes.'
      ]
    },
    medical: {
      name: 'Medical emergencies',
      sum: 'We call 911 if needed, then you. You authorise emergency treatment if we cannot reach you.',
      det: [
        'In a medical emergency, staff act immediately and call 911 if necessary.',
        'Parents are contacted using the emergency details on this form.',
        'By enrolling you authorise staff to seek emergency treatment if you cannot be reached in time.',
        'You are responsible for keeping allergies, conditions and contacts accurate.',
        'Staff cannot administer medication without prior written authorisation.'
      ]
    },
    liability: {
      name: 'Release of liability',
      sum: 'Art activities carry some risk. You release the studio from liability for accidents and lost belongings.',
      det: [
        'You release The Grove Art Studio LLC, its owners, staff and instructors from liability for injuries, accidents or lost belongings during studio activities.',
        'You confirm you have told us about any medical condition, allergy or need affecting participation.',
        'You give permission for your child to take part in all studio activities.'
      ]
    },
    photo: {
      name: 'Photo permission',
      sum: 'Optional. You choose whether we may photograph your child, and can withdraw it at any time.',
      det: [
        'Permission is optional and does not affect enrolment.',
        'Photographs may be used on our website and Instagram.',
        'You can withdraw permission at any time in the portal, and we will stop using new images.'
      ]
    },
    approval: {
      name: 'Approval before scheduling',
      sum: 'Private classes are approved by the studio before a time is set. Requesting does not reserve a slot.',
      det: [
        'Every private class request is reviewed by the studio before it is scheduled.',
        'Submitting this form does not reserve an instructor or a room.',
        'We contact you to agree the time once the request is approved.',
        'Nothing is charged until the class is confirmed.'
      ]
    },
    offsite: {
      name: 'Classes held at your location',
      sum: 'If we come to you, the host provides the space and supervises anyone not taking part.',
      det: [
        'The host is responsible for providing a suitable space, surfaces and access.',
        'The host supervises any children present who are not taking part in the class.',
        'The studio is not responsible for damage to the host’s property.',
        'Travel outside our usual area may carry an additional charge, agreed in advance.'
      ]
    },
    extraKids: {
      name: 'Additional participants',
      sum: 'Each additional child in a private class is charged separately at the same hourly rate.',
      det: [
        'The hourly rate covers one child.',
        'Each additional child is charged at the same hourly rate.',
        'Tell us the number of children when you request, so we bring enough materials.'
      ]
    }
  };

  var SHORT_SET = ['food', 'nomakeup', 'regfee', 'pickup', 'health', 'medical', 'liability', 'photo'];
  var SETS = {
    as: ['asFacts', 'asSched', 'asMakeup', 'asPickup', 'asHealth', 'asMedical', 'asPayment', 'asLiability', 'asAgreement'],
    camp: SHORT_SET,
    nsd: SHORT_SET,
    pop: SHORT_SET,
    priv: ['approval', 'offsite', 'extraKids', 'regfee', 'pickup', 'health', 'medical', 'liability', 'photo'],
    bday: []
  };

  function regFeeFor(p) { return P[p] && P[p].regFee ? P[p].regFee : 0; }
  function fillFee(text, p) { return text.split('{FEE}').join(m0(regFeeFor(p))); }
  function polSet(p) { return SETS[p] || []; }
  function polAgreed(p) {
    return polSet(p).filter(function (id) {
      return Grove.toggle('rPol-' + p + '-' + id, false);
    }).length;
  }

  Grove.on('rPolOpen', function (d) {
    Grove.setTab('rPolOpen', pick('rPolOpen', '') === d.id ? '' : d.id);
  });

  function policyCard(p, id, span) {
    var pol = POL[id];
    var open = pick('rPolOpen', '') === id;
    var body = check('rPol-' + p + '-' + id, pol.name, fillFee(pol.sum, p));
    if (open) {
      body += '<div class="stack stack--sm">' + pol.det.map(function (line) {
        return hint(fillFee(line, p));
      }).join('') + '</div>';
    }
    return ui.card({
      span: span,
      head: ui.btn({
        label: open ? 'Hide the full text' : 'Read the full text',
        kind: 'quiet', size: 'sm', act: 'rPolOpen', id: id
      })
    }, '<div class="stack stack--sm">' + body + '</div>');
  }

  function policySection(p) {
    var set = polSet(p), n = set.length, done = polAgreed(p);
    var pr = D.program(p);
    var intro = ui.notice({
      kind: done === n ? 'ok' : null,
      title: done + ' of ' + n + ' agreed',
      text: n + ' policies for ' + pr.name + ', each summarised in a line. Open each one, ' +
        'read it, and tick to agree. Every program carries its own terms.'
    });
    var cards = set.map(function (id, i) {
      var last = i === n - 1 && n % 2 === 1;
      return policyCard(p, id, last ? 2 : null);
    });
    return sec(head('Policies for ' + pr.name) + intro + '<div class="section">' +
      ui.grid(2, cards) + '</div>');
  }

  /* ---- step 1 — who ------------------------------------------------------------- */

  /* Every answer on this card is filled in, because the whole point of the
     card is that we already know the family. Three of them used to be grey
     placeholders, which read as a half-finished form. */
  function householdCard() {
    var f = fam();
    var first = f.guardian.split(' ')[0];
    return ui.card({
      title: 'Household',
      /* Sabrina Moore is the parent in the Johnson family — the data says so,
         and the note says so, rather than leaving two surnames unexplained. */
      note: 'The family name everything is filed under, and the number we ring first. ' +
        'The main contact beside it may have a different surname — ' + f.guardian +
        ' is the parent in the ' + f.name + ' family.'
    }, ui.fields(2, [
      ui.field({ label: 'Family last name', control: ui.input({ value: f.name }) }),
      ui.field({
        label: 'Primary phone', control: ui.input({ value: f.phone }),
        hint: 'One number per family. It reaches ' + first + ' first in an emergency.'
      }),
      ui.field({
        label: 'Street address', span: true,
        control: ui.input({ value: '2911 Grand Avenue, Apt 12' })
      }),
      ui.field({ label: 'City', span: true, control: ui.input({ value: 'Miami' }) }),
      ui.field({
        label: 'State', control: ui.select({ options: ['FL', 'GA', 'NY', 'Other'] })
      }),
      ui.field({ label: 'ZIP', control: ui.input({ value: '33133' }) })
    ]));
  }

  /* "Cell" is gone: it asked for the household number a second time, and the
     same number twice is not two facts. */
  function contactCard() {
    var f = fam();
    var first = f.guardian.split(' ')[0];
    var last = f.guardian.split(' ').slice(1).join(' ');
    return ui.card({
      title: 'Main contact',
      note: 'The person who will manage the account and receive receipts. We reach them on ' +
        'the household number above.'
    }, ui.fields(2, [
      ui.field({ label: 'First name', control: ui.input({ value: first }) }),
      ui.field({ label: 'Last name', control: ui.input({ value: last }) }),
      ui.field({
        label: 'Relationship to child',
        control: ui.select({ options: ['Mother', 'Father', 'Guardian', 'Grandparent', 'Other'] })
      }),
      ui.field({
        label: 'How did you hear about us?',
        control: ui.select({
          options: ['Word of mouth', 'Instagram', 'Google', 'A school', 'Flyer', 'Other']
        })
      }),
      ui.field({
        label: 'Email', span: true, control: ui.input({ value: f.email, type: 'email' }),
        hint: 'Where we send your confirmation and payment link'
      }),
      ui.field({
        label: 'Referral name', span: true,
        control: ui.input({ placeholder: 'Who told you about us?' }),
        hint: 'Optional. So we can thank them.'
      })
    ]));
  }

  function childCard(kid, i, span) {
    var f = fam();
    var title = 'Child ' + (i + 1) + (kid ? ' · ' + kid.name.split(' ')[0] : '');
    var band = kid ? 'Age ' + kid.age + ' · ages ' + kid.band + ' band' : '';
    var notes = kid && kid.flag ? kid.flag : '';
    return ui.card({
      span: span,
      title: title,
      /* Only the last card offers Remove, so the button does what it says. */
      head: kidCount() > 1 && i === kidCount() - 1
        ? ui.btn({ label: 'Remove', kind: 'quiet', size: 'sm', act: 'rKids', n: kidCount() - 1 })
        : null
    }, ui.fields(2, [
      ui.field({
        label: 'First name',
        control: ui.input({ value: kid ? kid.name.split(' ')[0] : '', placeholder: 'First name' })
      }),
      ui.field({
        label: 'Last name',
        control: ui.input({ value: kid ? kid.name.split(' ').slice(1).join(' ') : f.name, placeholder: 'Last name' })
      }),
      ui.field({
        label: 'Date of birth', control: ui.input({ placeholder: 'DD MMM YYYY' }),
        hint: band
      }),
      ui.field({
        label: 'Gender',
        control: ui.select({ options: ['Girl', 'Boy', 'Non-binary', 'Prefer not to say'] })
      }),
      ui.field({ label: 'Grade', control: ui.select({ options: GRADES }) }),
      ui.field({ label: 'School', control: ui.input({ placeholder: 'Coconut Grove Elem.' }) }),
      ui.field({
        label: 'Permission to use their image', span: true,
        control: ui.select({
          options: ['Yes — photos may be used', 'No — do not photograph']
        }),
        hint: 'Asked per child, not per family. Email the studio any time to change it.'
      }),
      ui.field({
        label: 'Allergies and medication', span: true,
        control: ui.input({ value: notes, placeholder: 'Leave blank if none' }),
        hint: notes
          ? 'Shown to instructors on every roster. Staff cannot administer medication without written authorisation.'
          : 'Shown to instructors on every roster'
      }),
      ui.field({
        label: 'Anything that helps us teach them well', span: true,
        control: ui.textarea({
          placeholder: 'Sensory, learning, physical — things that help, things to avoid'
        })
      })
    ]));
  }

  function stepWho(p) {
    var out = '';
    if (p === 'bday') {
      var f = fam();
      var child = seedKids()[0];
      var ages = [], a;
      for (a = 4; a <= 13; a++) ages.push(String(a));
      out += ui.grid(2, [
        ui.card({ title: 'Host', note: 'The person we reply to and invoice.' }, ui.fields(2, [
          ui.field({ label: 'Host name', span: true, control: ui.input({ value: f.guardian }) }),
          ui.field({ label: 'Phone', control: ui.input({ value: f.phone }) }),
          ui.field({ label: 'Email', control: ui.input({ value: f.email, type: 'email' }) })
        ])),
        ui.card({
          title: 'Birthday child',
          note: 'They do not need to be a Grove student.'
        }, ui.fields(2, [
          ui.field({
            label: 'Name', span: true,
            control: ui.input({ value: child ? child.name : '' })
          }),
          ui.field({
            label: 'Turning',
            control: ui.select({ options: ages, value: child ? String(child.age + 1) : '9' })
          })
        ]))
      ]);
      return out;
    }

    out += ui.grid(2, [householdCard(), contactCard()]);

    var n = kidCount();
    var addBtn = ui.btns([
      { label: 'Add another child', kind: 'quiet', size: 'sm', act: 'rKids', n: n + 1 }
    ]);
    var cards = kidList().map(function (kid, i) {
      var last = i === n - 1 && n % 2 === 1;
      return childCard(kid, i, last ? 2 : null);
    });

    var notice = p === 'as'
      ? ui.notice({
        kind: 'ok',
        title: 'Two children means a discount',
        text: 'The second and third child pay half the registration fee — applied ' +
          'automatically at review.'
      })
      : '';

    out += sec(head('Children', n < 3 ? addBtn : null) + notice +
      (notice ? '<div class="section">' + ui.grid(2, cards) + '</div>' : ui.grid(2, cards)));
    return out;
  }

  /* ---- step 2 — what ------------------------------------------------------------- */

  function stepAs() {
    var cur = planKey();
    var planCard = ui.card({
      title: 'Choose a package',
      note: 'One-time registration fee: ' + m0(P.as.regFee) + ' a child · ' + P.as.siblingRelief +
        ' · applies to all packages. Tuition reserves the place rather than being priced ' +
        'per class attended.'
    }, ui.choices(null, PLAN_KEYS.map(function (k) {
      return tile('rPlan', k, cur, {
        title: planLabel(k),
        sub: PLAN_SUB[k],
        price: m0(P.as.plans[k])
      });
    })));

    var band = asBand();
    var bandCard = ui.card({
      title: 'Age group',
      note: 'Required. Classes are assigned by age group, so we place your child in the right room.'
    }, ui.choices(null, asBands().map(function (b) {
      var open = classesFor('as').filter(function (c) { return c.band === b; });
      var free = open.reduce(function (t, c) { return t + places(c); }, 0);
      return tile('rBand', b, band, {
        title: 'Ages ' + b,
        sub: open.length + plural(open.length, ' class', ' classes') + ' · ' +
          (free ? free + plural(free, ' place open', ' places open') : 'all full, waitlist only')
      });
    })));

    var chosen = asClass();
    var list = asClassList();
    var classCard = ui.card({
      title: 'Choose your class',
      note: 'These become your child’s fixed places for the program year. Places update live.'
    }, list.length
      ? ui.choices(null, list.map(function (c) {
        return tile('rClass', c.id, chosen ? chosen.id : '', {
          title: c.day + ' ' + c.time,
          sub: c.name + ' · ' + c.room + ' · ' + c.staff,
          price: placeLabel(c)
        });
      }))
      : ui.empty('No class open for this age group', 'Choose a different age group, or message the studio.'));

    /* The waitlist banner sits above the money rather than under it: it is the
       reason the running total says nothing is due today.
       Two stacked columns rather than two rows of one card: the running total
       carries more rows than the package list, and stacking lets each card end
       where its content ends instead of leaving a hollow band above the note. */
    var main = ui.grid(2, [
      ui.col([planCard, bandCard]),
      ui.col([priceCard('as'), classCard])
    ]);

    if (!asWaiting()) return main;

    return ui.notice({
      kind: 'warn',
      title: 'That class is full — you would be number ' + asWaitPosition() + ' on the waitlist',
      text: 'Join the waitlist and nothing is charged. When a place opens you get 24 hours ' +
        'to accept it. Nobody is turned away.'
    }) + sec(main);
  }

  function stepCamp() {
    var list = classesFor('camp');
    var chosen = campClass();
    var weekCard = ui.card({
      title: 'Which week',
      note: 'Camp runs ' + (chosen ? chosen.time : '') + ' every day. Each week is grouped ' +
        'by age, so pick the group your child belongs in.'
    }, list.length
      ? ui.choices(null, list.map(function (c) {
        return tile('rWeek', c.id, chosen ? chosen.id : '', {
          title: c.name + ' · ages ' + c.band,
          sub: c.room + ' · ' + placeLabel(c),
          price: m0(P.camp.week)
        });
      }))
      : ui.empty('No camp weeks open', 'Message the studio and we will tell you what is next.'));

    var days = campDays();
    var dayCard = ui.card({
      title: 'Which days',
      note: 'A full week is ' + m0(P.camp.week) + '. Individual days are ' + m0(P.camp.day) +
        ' each, so four days or more is always worth taking the week.'
    }, ui.choices(2, DAYS.map(function (d) {
      return check('rcDay-' + d, d, days.length === DAYS.length ? 'Part of the full week' : m0(P.camp.day));
    })));

    var end = campEndHour();
    var xh = campExtra();
    var extraCard = ui.card({
      title: 'Extra hours',
      note: m0(P.camp.extraHour) + ' an hour, on every day you have booked. Need a different ' +
        'pickup on one day? Tell us in the comments and we will set it up.'
    }, ui.choices(null, [0, 1, 2, 3].map(function (x) {
      return tile('rXhr', x, xh, {
        title: 'To ' + clockPm(end + x),
        sub: x ? '+' + x + plural(x, ' hour', ' hours') + ' a day' : 'Included',
        price: x ? m0(x * P.camp.extraHour) : 'Included'
      });
    })));

    return ui.grid(2, [weekCard, priceCard('camp')]) +
      sec(ui.grid(2, [dayCard, extraCard]));
  }

  function stepNsd() {
    var list = classesFor('nsd');
    var chosen = nsdClass();
    var start = nsdStartHour();
    var dateCard = ui.card({
      title: 'Which date',
      note: 'Eight no-school days are scheduled across the year. Each is booked separately, ' +
        'and only the dates the studio has opened appear here.'
    }, list.length
      ? ui.choices(null, list.map(function (c) {
        return tile('rDate', c.id, chosen ? chosen.id : '', {
          title: c.name,
          sub: c.day + ' · ' + c.time + ' · ' + c.room,
          price: placeLabel(c)
        });
      }))
      : ui.empty('No dates open yet', 'The next no-school days go up with the school calendar.'));

    var hrs = nsdHours();
    var opts = [], hh;
    for (hh = 3; hh <= P.nsd.maxHours; hh++) opts.push(hh);
    var lenCard = ui.card({
      title: 'How long',
      note: m0(P.nsd.base) + ' covers ' + (chosen ? String(chosen.time).replace('–', ' to ') : '') +
        '. Each additional hour is ' + m0(P.nsd.extraHour) + '.'
    }, ui.choices(2, opts.map(function (x) {
      return tile('rHours', x, hrs, {
        title: x + ' hours',
        sub: 'Finishes at ' + clockPm(start + x),
        price: m0(P.nsd.base + (x - 3) * P.nsd.extraHour)
      });
    })));

    return ui.grid(2, [dateCard, priceCard('nsd')]) +
      sec(ui.grid(2, [lenCard, ui.card({
        title: 'Good to know',
        note: 'Your day and time are your place. If you need a different date later, call or ' +
          'message the studio and we will see what is possible.'
      }, ui.kv([
        row('Runs', chosen ? chosen.time : '—'),
        row('Room', chosen ? chosen.room : '—'),
        row('Places', chosen ? placeLabel(chosen) : '—'),
        row('Longest day', P.nsd.maxHours + ' hours')
      ]))]));
  }

  function stepPriv() {
    var hrs = privHours();
    var opts = [], x;
    for (x = 1; x <= P.priv.maxHours; x++) opts.push(x);
    var hourCard = ui.card({
      title: 'How many hours',
      note: m0(P.priv.hourly) + ' an hour. ' + P.priv.maxHours +
        ' hours is the maximum in one session.'
    }, ui.choices(null, opts.map(function (n) {
      var sub = n === 1 ? 'A focused single session'
        : (n === 2 ? 'Room to finish a piece' : 'A full project, start to finish');
      return tile('rPhours', n, hrs, {
        title: n + plural(n, ' hour', ' hours'),
        sub: sub,
        price: m0(P.priv.hourly * n)
      });
    })));

    var whenCard = ui.card({
      title: 'When suits you',
      note: 'Pick your preferences. Private classes are approved before they are scheduled, ' +
        'and nothing is charged until the time is agreed.'
    }, ui.fields(2, [
      ui.field({
        label: 'Preferred day',
        control: ui.select({
          options: ['Any weekday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        })
      }),
      ui.field({
        label: 'Preferred time',
        control: ui.select({ options: ['Mornings', 'Early afternoon', 'After 4pm'] })
      }),
      ui.field({
        label: 'Starting from', span: true, control: ui.input({ placeholder: '3 Aug 2026' })
      }),
      ui.field({
        label: 'What would they like to work on?', span: true,
        control: ui.textarea({
          placeholder: 'e.g. portrait drawing, finishing a canvas from camp, preparing a portfolio piece'
        })
      })
    ]));

    return ui.grid(2, [hourCard, priceCard('priv')]) + sec(ui.grid(2, [whenCard, ui.card({
      title: 'How a private is booked',
      note: 'Requests are read by the studio, not booked automatically.'
    }, ui.kv([
      row('Rate', m0(P.priv.hourly) + ' an hour'),
      row('Longest session', P.priv.maxHours + ' hours'),
      row('Additional children', 'Charged at the same hourly rate'),
      row('Charged', 'Once the time is agreed')
    ]))]));
  }

  function stepPop() {
    var ev = popEvent();
    var eventCard = ui.card({
      title: 'Which event',
      note: 'One-off evenings. The studio names each event and sets its price when it creates ' +
        'it — this list is whatever is currently open.'
    }, ui.choices(null, P.pop.events.map(function (e) {
      return tile('rEvent', e.id, ev.id, {
        title: e.label, sub: e.sub, price: m0(e.amount)
      });
    })));

    var names = kidNames();
    var q = popQty();
    var qtyCard = ui.card({
      title: 'How many children',
      note: 'From the children you added on step 1.'
    }, ui.choices(null, names.map(function (nm, i) {
      var count = i + 1;
      var who = count === 1 ? names[0] + ' only' : names.slice(0, count).join(' and ');
      var kidsHere = kidList().slice(0, count);
      var agesText = kidsHere.filter(function (k) { return k; })
        .map(function (k) { return String(k.age); }).join(' and ');
      return tile('rQty', count, q, {
        title: who,
        sub: agesText ? (count === 1 ? 'Age ' : 'Ages ') + agesText + ' · eligible' : 'Eligible',
        price: m0(ev.amount * count)
      });
    })));

    return ui.grid(2, [eventCard, priceCard('pop')]) + sec(ui.grid(2, [qtyCard, ui.card({
      title: 'What you get',
      note: 'One evening, one project, all materials provided.'
    }, ui.kv([
      row('Event', ev.label),
      row('When', ev.sub),
      row('Per child', m0(ev.amount)),
      row('Registration fee', m0(P.pop.regFee) + ' per child')
    ]))]));
  }

  function stepBday() {
    var whereCard = ui.card({
      title: 'Where and when',
      note: 'Tell us your first choice. We confirm what is free when we quote.'
    }, ui.fields(2, [
      ui.field({
        label: 'Where', span: true,
        control: ui.select({ options: ['At the studio', 'At our location'] })
      }),
      ui.field({ label: 'Preferred date', control: ui.input({ placeholder: 'Sat 12 Sep 2026' }) }),
      ui.field({
        label: 'Preferred time',
        control: ui.select({ options: ['11:00am', '1:00pm', '3:00pm', '5:00pm'] })
      }),
      ui.field({
        label: 'Children',
        control: ui.select({ options: ['Up to 12', '13–16', '17–20', '21–24', 'More than 24'] })
      }),
      ui.field({
        label: 'Adults staying',
        control: ui.select({ options: ['1', '2', '3', '4'] }),
        hint: 'A maximum of four adults can stay when the party is held at the studio. ' +
          'Everyone else drops off. At your location there is no limit — put the numbers in the notes.'
      })
    ]));

    var themeCard = ui.card({
      title: 'Theme',
      note: 'Pick as many as you like, or none at all.'
    }, ui.choices(2, BTHEMES.map(function (t) { return check('rbTheme-' + t, t); })));

    var actCard = ui.card({
      title: 'Activities',
      note: 'Nine of the popular ones. There are forty-four in total — we send the full list as ' +
        'a PDF with your quote. Not sure? Tell us the ages in the notes and we will suggest the ' +
        'ones that land best for that group.'
    }, ui.choices(2, BACTS.map(function (t) { return check('rbAct-' + t, t); })));

    var incCard = ui.card({
      title: 'What should we provide?',
      note: 'Anything you do not tick, you are welcome to bring yourself. We do not do ice cream ' +
        'cakes — they will not survive two hours in a studio.'
    }, ui.choices(2, BINCS.map(function (t) { return check('rbInc-' + t, t); })));

    var notesCard = ui.card({
      title: 'Anything else',
      note: 'Allergies among the guests, a sibling who wants to join in, a surprise you are planning.'
    }, ui.fields(null, [
      ui.field({
        label: 'Notes for us',
        control: ui.textarea({
          placeholder: 'Two of the guests have nut allergies. My younger son is 4 — can he take part?'
        })
      }),
      ui.field({
        label: 'Cake, if we are doing it',
        control: ui.input({ placeholder: 'Flavour, servings, and a colour or character' })
      })
    ]));

    return ui.grid(2, [whereCard, priceCard('bday')]) +
      sec(ui.grid(2, [themeCard, actCard])) +
      sec(ui.grid(2, [incCard, notesCard]));
  }

  function stepWhat(p) {
    if (p === 'camp') return stepCamp();
    if (p === 'nsd') return stepNsd();
    if (p === 'priv') return stepPriv();
    if (p === 'pop') return stepPop();
    if (p === 'bday') return stepBday();
    return stepAs();
  }

  /* ---- step 3 — confirm ----------------------------------------------------------- */

  function bookingRows(p) {
    var rows = [], names = kidNames(), c, ev, hrs;
    if (p === 'as') {
      c = asClass();
      /* The room is named once, on its own row, rather than repeated after
         every child's day and time. */
      names.forEach(function (nm) {
        rows.push(row(nm, c ? c.day + ' ' + c.time : 'No place chosen', c ? null : 'clay'));
      });
      rows.push(row('Plan', planLabel(planKey())));
      rows.push(row('Age group', 'Ages ' + asBand()));
      if (c) {
        rows.push(row('Room', c.room));
        rows.push(row('Instructor', c.staff));
        rows.push(row('Places', placeLabel(c)));
      }
      if (asWaiting()) {
        rows.push(row('Waitlist', 'Number ' + asWaitPosition() + ' on the list'));
        rows.push(row('First class', 'The week after a place is offered'));
      } else {
        rows.push(row('First class', FIRST_CLASS));
      }
    } else if (p === 'camp') {
      c = campClass();
      names.forEach(function (nm) { rows.push(row(nm, c ? c.name : 'No week chosen', c ? null : 'clay')); });
      rows.push(row('Days', campDays().length === DAYS.length ? 'Full week' : campDays().join(', ') || 'None chosen'));
      rows.push(row('Each day', c ? c.time : '—'));
      rows.push(row('Extra hours', campExtra() ? 'To ' + clockPm(campEndHour() + campExtra()) : 'None'));
      rows.push(row('Room', c ? c.room : '—'));
    } else if (p === 'nsd') {
      c = nsdClass();
      names.forEach(function (nm) { rows.push(row(nm, c ? c.name : 'No date chosen', c ? null : 'clay')); });
      rows.push(row('Starts', clockPm(nsdStartHour()).replace('pm', 'am')));
      rows.push(row('Length', nsdHours() + ' hours'));
      rows.push(row('Finishes', clockPm(nsdStartHour() + nsdHours())));
      rows.push(row('Room', c ? c.room : '—'));
    } else if (p === 'priv') {
      hrs = privHours();
      names.forEach(function (nm) {
        rows.push(row(nm, hrs + plural(hrs, ' hour', ' hours') + ', by appointment'));
      });
      rows.push(row('Scheduling', 'We agree the exact slot once the request is approved'));
      rows.push(row('Rate', m0(P.priv.hourly) + ' an hour, per child'));
      rows.push(row('Charged', 'Once the request is approved and the time is agreed'));
    } else if (p === 'pop') {
      ev = popEvent();
      rows.push(row('Event', ev.label));
      rows.push(row('When', ev.sub));
      rows.push(row('Children', String(popQty())));
    } else {
      var th = ticked('rbTheme-', BTHEMES);
      var ac = ticked('rbAct-', BACTS);
      var inc = ticked('rbInc-', BINCS);
      rows.push(row('Where', 'At the studio'));
      rows.push(row('Guests', 'Up to 12 children, 4 adults'));
      rows.push(row('Themes', th.length ? th.join(', ') : 'No preference'));
      rows.push(row('Activities', ac.length ? ac.join(', ') : 'Open to suggestions'));
      rows.push(row('We provide', inc.length ? inc.join(', ') : 'You bring everything'));
      rows.push(row('Cost', 'Quoted, not charged', 'grove'));
    }
    return rows;
  }

  function safetyCards() {
    return ui.grid(2, [
      ui.card({
        title: 'Emergency contact',
        note: 'Someone other than you, who we can reach quickly. This is the second contact on ' +
          'your account — we no longer ask for them twice.'
      }, ui.fields(2, [
        ui.field({ label: 'Full name', span: true, control: ui.input({ placeholder: 'Marcus Johnson' }) }),
        ui.field({ label: 'Relationship', control: ui.input({ placeholder: 'Father' }) }),
        ui.field({ label: 'Mobile', control: ui.input({ placeholder: '(786) 340-1199' }) })
      ])),
      ui.card({
        title: 'Authorised pickup',
        note: 'Only these people may collect your children. Staff check photo ID the first time.'
      }, ui.fields(2, [
        ui.field({ label: 'Name', span: true, control: ui.input({ placeholder: 'Gloria Moore' }) }),
        ui.field({ label: 'Relationship', control: ui.input({ placeholder: 'Grandmother' }) }),
        ui.field({ label: 'Mobile', control: ui.input({ placeholder: '(305) 887-2201' }) })
      ]))
    ]);
  }

  /* The box grows to whatever height its neighbour needs, so the pair does not
     end in dead space. */
  function commentsCard(span) {
    return ui.card({
      span: span,
      fill: true,
      title: 'Comments',
      note: 'Anything we have not asked about. This goes to the office, not onto the roster.'
    }, ui.field({
      grow: true,
      label: 'Anything else',
      control: ui.textarea({
        placeholder: 'A question about the schedule, a detail about drop-off, a note about a sibling'
      })
    }));
  }

  function signInCard() {
    var f = fam();
    return ui.card({
      title: 'Create your sign-in',
      /* "Paying creates your account" was not true of the private path, where
         nothing is paid on submit. Submitting is true of all of them. */
      note: 'Submitting this form creates your family account. Use it next time and everything ' +
        'above is already filled in.'
    }, ui.fields(2, [
      ui.field({
        label: 'Email', control: ui.input({ value: f.email, type: 'email' }),
        hint: 'This is your username'
      }),
      ui.field({ label: 'Mobile', control: ui.input({ value: f.phone }) }),
      ui.field({
        label: 'Password', span: true, control: ui.input({ type: 'password', placeholder: '••••••••••' }),
        hint: 'At least 10 characters'
      })
    ]));
  }

  function paymentCard(p) {
    return ui.card({
      title: 'Payment',
      note: 'Card details go straight to the processor. The studio never sees your full number.' +
        (p === 'priv'
          ? ' Nothing is charged until we approve the request and agree a time.'
          : '')
    }, ui.fields(2, [
      ui.field({
        label: 'Card number', span: true,
        control: ui.input({ placeholder: '4242 4242 4242 4242' })
      }),
      ui.field({ label: 'Expiry', control: ui.input({ placeholder: '04 / 29' }) }),
      ui.field({ label: 'CVC', control: ui.input({ placeholder: '···' }) }),
      ui.field({ label: 'ZIP', control: ui.input({ placeholder: '33133' }) }),
      ui.field({
        label: 'Or pay by bank',
        control: ui.select({ options: ['Use a card', 'Bank transfer (ACH)'] }),
        hint: 'Bank payments also cut the studio’s fees'
      })
    ]));
  }

  function stepConfirm(p) {
    var review = ui.card({
      title: 'What you are booking',
      note: p === 'bday'
        ? 'We will send all forty-four activity options as a PDF with the quote.'
        : 'Check this against what you chose. Step back if anything is wrong.'
    }, ui.kv(bookingRows(p)));

    var out = ui.grid(2, [review, priceCard(p)]);

    if (p === 'bday') {
      var f = fam();
      return out + sec(ui.grid(2, [
        ui.card({ title: 'Confirm your details', note: 'We reply to this address.' }, ui.fields(2, [
          ui.field({ label: 'Email', control: ui.input({ value: f.email, type: 'email' }) }),
          ui.field({ label: 'Mobile', control: ui.input({ value: f.phone }) })
        ])),
        commentsCard()
      ]));
    }

    out += sec(head('Safety') + safetyCards());
    out += policySection(p);

    if (p === 'as') {
      var monthly = m(P.as.plans[planKey()] * kidCount());
      var nextRows = asWaiting()
        ? [
          row('Today', 'Nothing is charged', 'grove'),
          row('If a place opens', 'We email you, and you have 24 hours to accept'),
          row('Then', 'A secure payment link for ' + m(quote('as').total)),
          row('And after that', monthly + ' a month, billed on the 1st'),
          row('Cancelling', '30 days written notice')
        ]
        : [
          row('Payment', 'By secure link, emailed to you', 'grove'),
          row('Confirmation', 'Once payment is received'),
          row('First class', FIRST_CLASS),
          row('Then', monthly + ' a month from ' + NEXT_MONTH + ', billed on the 1st'),
          row('Cancelling', '30 days written notice')
        ];
      out += sec(ui.grid(2, [
        ui.card({
          title: 'Next step',
          note: asWaiting()
            ? 'A place on the waitlist is held in the order people join it. Nobody is turned away.'
            : 'Your child’s registration and selected class schedule are confirmed by ' +
              'The Grove Art Studio at that point.'
        }, ui.kv(nextRows)),
        commentsCard()
      ]));
    } else {
      out += sec(ui.grid(2, [signInCard(), paymentCard(p)]));
      out += sec(ui.grid(null, [commentsCard()]));
    }
    return out;
  }

  /* ---- labels --------------------------------------------------------------------- */

  /* The stepper says "and", like every page title it leads to. */
  var STEP_LABELS = {
    as: ['Family and children', 'Plan and place', 'Review and submit'],
    camp: ['Family and children', 'Which week', 'Review and pay'],
    nsd: ['Family and children', 'Date and hours', 'Review and pay'],
    priv: ['Family and children', 'Hours and when', 'Review and send'],
    pop: ['Family and children', 'Which event', 'Review and pay'],
    bday: ['Host and child', 'The party', 'Review and send']
  };

  var TITLES = {
    as: ['Who is enrolling?', 'Choose a plan and a place', 'Review and submit'],
    camp: ['Who is enrolling?', 'Pick a week', 'Review and pay'],
    nsd: ['Who is enrolling?', 'Pick a date and how long', 'Review and pay'],
    priv: ['Who is enrolling?', 'How many hours, and when', 'Review and send'],
    pop: ['Who is enrolling?', 'Reserve a place', 'Review and pay'],
    bday: ['Who is hosting?', 'Plan the party', 'Check your request']
  };

  function subFor(p, s) {
    var whoSub = 'We ask once. Next time you book anything at the studio, this is already ' +
      'filled in. Add every child you want to enrol — allergies and medical notes travel with ' +
      'them onto every roster.';
    if (s === 0) {
      return p === 'bday'
        ? 'Three lines and we can get back to you. No account, no policies, nothing charged.'
        : whoSub;
    }
    if (s === 1) {
      if (p === 'as') return 'Places update live. If the one you want is full you can join the waitlist — we do not turn families away.';
      if (p === 'camp') return 'Camp runs ' + campHours() + ' every day. Add extra hours on any day if you need a longer one.';
      if (p === 'nsd') return 'For teacher workdays and county holidays. Three hours is standard; extend by the hour if you need to.';
      if (p === 'priv') return 'One-to-one with an instructor at ' + m0(P.priv.hourly) + ' an hour, up to ' +
        P.priv.maxHours + ' hours. Requests are approved by the studio before a time is set.';
      if (p === 'pop') return 'One-off evenings for a single project. Places are limited and go quickly.';
      return 'A planning checklist, not a booking form. Tell us what you want and we send a written quote — nothing is charged today.';
    }
    if (p === 'as') {
      return asWaiting()
        ? 'Tick the policies, check what you are booking, and submit. Nothing is charged while ' +
          'you are on the waitlist — we email you the moment a place opens.'
        : 'Tick the policies, check what you are booking, and submit. You will receive an email ' +
          'with a secure payment link; the schedule is confirmed once payment has been received.';
    }
    if (p === 'bday') return 'Send this to us and we reply with a written quote and a deposit request. Nothing is charged now.';
    return 'The policies, the safety details and everything you are committing to, before anything is charged.';
  }

  function nextButton(p, s) {
    if (s === 0) {
      return {
        label: p === 'bday' ? 'Continue to the party' : 'Continue to program',
        kind: 'primary', act: 'rStep', n: 1
      };
    }
    if (s === 1) {
      if (p === 'as' && asWaiting()) {
        return { label: 'Join the waitlist', kind: 'primary', act: 'rStep', n: 2 };
      }
      return {
        label: p === 'bday' ? 'Continue to the review' : 'Continue to policies',
        kind: 'primary', act: 'rStep', n: 2
      };
    }
    var set = polSet(p), n = set.length, done = polAgreed(p);
    if (n && done < n) {
      return { label: 'Agree to all ' + n + ' to continue', msg: 'Please agree to all ' + n + ' policies' };
    }
    if (p === 'as') {
      return {
        label: asWaiting() ? 'Submit and join the waitlist' : 'Submit registration',
        kind: 'primary', to: 'rDone', id: p
      };
    }
    if (p === 'bday') return { label: 'Send my party request', kind: 'primary', to: 'rDone', id: p };
    /* A private is approved before it is scheduled and charged, so the button
       cannot ask for money the same page says is not taken today. */
    if (p === 'priv') return { label: 'Send the request', kind: 'primary', to: 'rDone', id: p };
    return {
      label: m(quote(p).due) + ' — confirm and pay',
      kind: 'primary', to: 'rDone', id: p
    };
  }

  function footNote(p, s) {
    if (s === 2) {
      if (p === 'as') {
        return asWaiting()
          ? 'Nothing is charged now, and nothing is charged for waiting.'
          : 'Nothing is charged now — we email you a secure payment link.';
      }
      if (p === 'bday') return 'Nothing is charged when you send this.';
      if (p === 'priv') {
        return 'You are agreeing to the ' + polSet(p).length + ' policies above. Nothing is ' +
          'charged until we approve the request and agree a time.';
      }
      return 'You are agreeing to the ' + polSet(p).length + ' policies above.';
    }
    return 'Your answers are kept as you move between steps.';
  }

  /* ---- the screen ------------------------------------------------------------------- */

  Grove.screen('rFlow', {
    surface: 'registration',
    crumbTitle: 'Enrolment',
    eyebrow: function (ctx) { return 'step ' + (stepNo() + 1) + ' of 3'; },
    title: function (ctx) { return TITLES[progId(ctx)][stepNo()]; },
    sub: function (ctx) { return subFor(progId(ctx), stepNo()); },
    /* On every step, including the last one: the policies step is where a
       parent is most likely to want to stop and come back. */
    actions: [{ label: 'Save and finish later', msg: 'Saved · we emailed you a link to finish' }],

    body: function (ctx) {
      var p = progId(ctx);
      var s = stepNo();
      var out = ui.steps(STEP_LABELS[p], s);

      if (s === 0) out += stepWho(p);
      else if (s === 1) out += stepWhat(p);
      else out += stepConfirm(p);

      var back = s === 0
        ? { label: 'Back to the programmes', to: 'rPick' }
        : { label: 'Back', act: 'rStep', n: s - 1 };

      out += ui.formActions([nextButton(p, s), back]);
      out += hint(footNote(p, s));
      return out;
    }
  });
})();
