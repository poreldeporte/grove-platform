/* ==========================================================================
   Grove Platform — demo data

   One dataset for the whole prototype. Every screen reads from here, so a
   number shown on the dashboard is the same number shown in the ledger.

   Carried over from the previous prototype with four name clashes corrected:
   the Delgado, Brennan and Martinez guardians, and Sophia Martinez, were each
   spelled two different ways depending on the screen.

   "Today" in this demo is Tuesday 28 July 2026.
   ========================================================================== */

(function () {
  'use strict';
  var Grove = (window.Grove = window.Grove || {});

  var PROGRAMS = {
    as:   { id: 'as',   name: 'After-School Art', short: 'After-School', color: 'var(--prog-after)',    badge: 'assets/badge-after.png' },
    camp: { id: 'camp', name: 'Seasonal Camp',    short: 'Camp',         color: 'var(--prog-camp)',     badge: 'assets/badge-seasonal.png' },
    nsd:  { id: 'nsd',  name: 'No-School Day',    short: 'No-School',    color: 'var(--prog-noschool)', badge: 'assets/badge-noschool.png' },
    priv: { id: 'priv', name: 'Private Class',    short: 'Private',      color: 'var(--prog-private)',  badge: 'assets/badge-private.png' },
    bday: { id: 'bday', name: 'Birthday Party',   short: 'Birthday',     color: 'var(--prog-birthday)', badge: 'assets/badge-birthday.png' },
    pop:  { id: 'pop',  name: 'Pop-Up Class',     short: 'Pop-Up',       color: 'var(--prog-popup)',    badge: 'assets/badge-popup.png' }
  };

  var ROLES = [
    { id: 'admin',   label: 'Sabrina Y. — Owner',      name: 'Sabrina Yanguas', role: 'Owner',      init: 'SY', surfaces: ['console', 'studio', 'family'] },
    { id: 'teacher', label: 'Lauren O. — Instructor',  name: 'Lauren Ortiz',    role: 'Instructor', init: 'LO', surfaces: ['studio'] },
    { id: 'parent',  label: 'Sabrina M. — Parent',     name: 'Sabrina Moore',   role: 'Johnson family', init: 'SM', surfaces: ['family'] }
  ];

  /* Prices the studio maintains. The registration flow never sets a rate of
     its own — it reads everything from here. */
  var PRICING = {
    as: {
      plans: { p4: 280, p8: 540, p12: 780, p16: 960 },
      regFee: 130,
      siblingRelief: '50% off the second and third registration fee',
      extraClassRate: { p4: 70, p8: 67.5, p12: 65, p16: 60 }
    },
    camp: { week: 400, day: 100, extraHour: 28, regFee: 15 },
    nsd:  { base: 100, extraHour: 28, maxHours: 6, regFee: 15 },
    priv: { hourly: 90, maxHours: 3, regFee: 15 },
    pop:  {
      regFee: 15,
      events: [
        { id: 'clay',  label: 'Clay Night',     amount: 45, sub: 'Tue 28 July, 4:00–6:00pm · ages 8+ · 4 places left' },
        { id: 'print', label: 'Print & Poster', amount: 45, sub: 'Fri 14 Aug, 4:00–6:00pm · ages 8+ · 18 places' }
      ]
    },
    bday: { quoteOnly: true, regFee: 0 }
  };

  var FAMILIES = [
    { id: 'johnson',  name: 'Johnson',  guardian: 'Sabrina Moore',    email: 'sabrina.j@email.com',   phone: '(786) 340-1182', kids: 'Emma (8), Lucas (10)', balance: 18,  plan: '8 + 4 sessions / month',  status: 'Active',          since: 'Aug 2024',    autopay: true,  card: 'Visa ···1183 · exp 04/29' },
    { id: 'okafor',   name: 'Okafor',   guardian: 'Ada Okafor',       email: 'ada.okafor@email.com',  phone: '(305) 771-4409', kids: 'Zara (11), Tobi (9)',  balance: 540, plan: '8 sessions / month',      status: 'Payment failed',  since: 'Sep 2025',    autopay: true,  card: 'Visa ···4417 · exp 11/27' },
    { id: 'chen',     name: 'Chen',     guardian: 'Wei Chen',         email: 'wei.chen@email.com',    phone: '(786) 209-3318', kids: 'Mia (6)',              balance: 0,   plan: 'Summer camp · week 4',    status: 'Active',          since: 'Jun 2026',    autopay: false, card: 'Visa ···0091 · exp 02/28' },
    { id: 'rivera',   name: 'Rivera',   guardian: 'Diego Rivera',     email: 'diego.rivera@email.com',phone: '(305) 442-8890', kids: 'Noah (7)',             balance: 0,   plan: '4 sessions / month',      status: 'Active',          since: 'Jan 2025',    autopay: true,  card: 'Visa ···7734 · exp 07/29' },
    { id: 'smith',    name: 'Smith',    guardian: 'Karen Smith',      email: 'karen.smith@email.com', phone: '(786) 553-1207', kids: 'Ava (8)',              balance: 45,  plan: '4 sessions / month',      status: 'Past due',        since: 'Mar 2025',    autopay: true,  card: 'Mastercard ···9902 · exp 01/28' },
    { id: 'martinez', name: 'Martinez', guardian: 'Isabel Martinez',  email: 'isabel.m@email.com',    phone: '(305) 118-7742', kids: 'Sophia (8)',           balance: 0,   plan: '12 sessions / month',     status: 'Active',          since: 'Aug 2023',    autopay: true,  card: 'ACH ···6620' },
    { id: 'delgado',  name: 'Delgado',  guardian: 'Paloma Delgado',   email: 'p.delgado@email.com',   phone: '(786) 664-0031', kids: 'Iker (5), Luz (7)',    balance: 200, plan: 'Registered, not yet paid',status: 'Pending payment', since: '27 Jul 2026', autopay: false, card: 'None saved' },
    { id: 'brennan',  name: 'Brennan',  guardian: 'Nora Brennan',     email: 'nora.b@email.com',      phone: '(305) 900-2214', kids: 'Cillian (12)',         balance: 0,   plan: 'Cancelling · ends 31 Aug',status: 'Cancelling',      since: 'Sep 2024',    autopay: true,  card: 'Amex ···2201 · exp 09/27' }
  ];

  var STUDENTS = [
    { id: 'emma',    name: 'Emma Johnson',    age: 8,  band: '8–11', family: 'Johnson',  cls: 'Mon 3:15pm · Studio 2',      flag: 'Allergy · peanuts',        flagKind: 'bad',  att: '96%',  mk: 2 },
    { id: 'lucas',   name: 'Lucas Johnson',   age: 10, band: '8–11', family: 'Johnson',  cls: 'Wed 3:15pm · Studio 2',      flag: 'Asthma · inhaler in bag',  flagKind: 'bad',  att: '91%',  mk: 0 },
    { id: 'zara',    name: 'Zara Okafor',     age: 11, band: '8–11', family: 'Okafor',   cls: 'Wed 3:15pm · Studio 2',      flag: '',                         flagKind: '',     att: '88%',  mk: 1 },
    { id: 'tobi',    name: 'Tobi Okafor',     age: 9,  band: '8–11', family: 'Okafor',   cls: 'Waitlisted · Mon 3:15pm',    flag: '',                         flagKind: '',     att: '—',    mk: 0 },
    { id: 'mia',     name: 'Mia Chen',        age: 6,  band: '5–7',  family: 'Chen',     cls: 'Camp week 4 · Clay Room',    flag: 'Tree nuts',                flagKind: 'bad',  att: '100%', mk: 1 },
    { id: 'noah',    name: 'Noah Rivera',     age: 7,  band: '5–7',  family: 'Rivera',   cls: 'Mon 2:15pm · Studio 1',      flag: '',                         flagKind: '',     att: '93%',  mk: 1 },
    { id: 'ava',     name: 'Ava Smith',       age: 8,  band: '8–11', family: 'Smith',    cls: 'Mon 3:15pm · Studio 2',      flag: '',                         flagKind: '',     att: '85%',  mk: 2 },
    { id: 'sophia',  name: 'Sophia Martinez', age: 8,  band: '8–11', family: 'Martinez', cls: 'Mon, Wed, Thu',              flag: 'Requires quiet corner',    flagKind: 'warn', att: '98%',  mk: 1 },
    { id: 'iker',    name: 'Iker Delgado',    age: 5,  band: '5–7',  family: 'Delgado',  cls: 'Not yet enrolled',           flag: '',                         flagKind: '',     att: '—',    mk: 0 },
    { id: 'luz',     name: 'Luz Delgado',     age: 7,  band: '5–7',  family: 'Delgado',  cls: 'Not yet enrolled',           flag: '',                         flagKind: '',     att: '—',    mk: 0 },
    { id: 'cillian', name: 'Cillian Brennan', age: 12, band: '12+',  family: 'Brennan',  cls: 'Thu 4:30pm · 2-hour',        flag: '',                         flagKind: '',     att: '79%',  mk: 0 }
  ];

  var CLASSES = [
    { id: 'c1',  prog: 'as',   name: '1 hour · After-School',   day: 'Mon',     time: '2:15–3:15pm',     room: 'Studio 1',   band: '5–7',  staff: 'Lauren Ortiz',  en: 11, cap: 12, wl: 0 },
    { id: 'c2',  prog: 'as',   name: '1 hour · After-School',   day: 'Mon',     time: '3:15–4:15pm',     room: 'Studio 2',   band: '8–11', staff: 'Lauren Ortiz',  en: 12, cap: 12, wl: 3 },
    { id: 'c3',  prog: 'as',   name: '1 hour · After-School',   day: 'Tue',     time: '2:00–3:00pm',     room: 'Studio 1',   band: '5–7',  staff: 'Marisol Vega',  en: 8,  cap: 12, wl: 0 },
    { id: 'c4',  prog: 'as',   name: '1 hour · After-School',   day: 'Wed',     time: '3:15–4:15pm',     room: 'Studio 2',   band: '8–11', staff: 'Lauren Ortiz',  en: 12, cap: 12, wl: 2 },
    { id: 'c5',  prog: 'as',   name: '2 hour · After-School',   day: 'Thu',     time: '4:30–6:30pm',     room: 'Studio 3',   band: '12+',  staff: 'Marisol Vega',  en: 13, cap: 12, wl: 1 },
    { id: 'c6',  prog: 'camp', name: 'Summer Camp · Week 4',    day: 'Mon–Fri', time: '10:00am–1:00pm',  room: 'Studio 1',   band: '5–7',  staff: 'Lauren Ortiz',  en: 18, cap: 20, wl: 0 },
    { id: 'c7',  prog: 'camp', name: 'Summer Camp · Week 4',    day: 'Mon–Fri', time: '10:00am–1:00pm',  room: 'Clay Room',  band: '8–11', staff: 'Marisol Vega',  en: 14, cap: 16, wl: 0 },
    { id: 'c8',  prog: 'camp', name: 'Summer Camp · Week 5',    day: 'Mon–Fri', time: '10:00am–1:00pm',  room: 'Studio 1',   band: '5–7',  staff: 'Unassigned',    en: 9,  cap: 20, wl: 0 },
    { id: 'c9',  prog: 'nsd',  name: 'No-School Day · 3 Nov',   day: 'Tue',     time: '9:00am–12:00pm',  room: 'Studio 1',   band: 'All',  staff: 'Unassigned',    en: 0,  cap: 24, wl: 0 },
    { id: 'c10', prog: 'pop',  name: 'Pop-Up · Clay Night',     day: 'Tue',     time: '4:00–6:00pm',     room: 'Studio 1',   band: '8+',   staff: 'Marisol Vega',  en: 14, cap: 18, wl: 0 },
    { id: 'c11', prog: 'priv', name: 'Private · Zara Okafor',   day: 'Tue',     time: '1:00–2:00pm',     room: 'Studio 2',   band: '—',    staff: 'Lauren Ortiz',  en: 1,  cap: 1,  wl: 0 },
    { id: 'c12', prog: 'bday', name: 'Birthday · Aria turns 7', day: 'Sat',     time: '1:00–3:00pm',     room: 'Party Room', band: '—',    staff: 'Marisol Vega',  en: 12, cap: 16, wl: 0 }
  ];

  var STAFF = [
    { id: 'lauren',  name: 'Lauren Ortiz',    role: 'Instructor',    classes: 5, hrs: '22.5', status: 'Clocked in',       kind: 'ok',      rate: '$28/hr' },
    { id: 'marisol', name: 'Marisol Vega',    role: 'Instructor',    classes: 5, hrs: '18.0', status: 'Scheduled 4pm',    kind: 'neutral', rate: '$28/hr' },
    { id: 'rey',     name: 'Rey Molina',      role: 'Front desk',    classes: 0, hrs: '30.0', status: 'Clocked in',       kind: 'ok',      rate: '$22/hr' },
    { id: 'dani',    name: 'Dani Cruz',       role: 'Administrator', classes: 0, hrs: '38.0', status: 'Clocked in',       kind: 'ok',      rate: 'Salary' },
    { id: 'sabrina', name: 'Sabrina Yanguas', role: 'Owner',         classes: 0, hrs: '—',    status: '—',                kind: 'neutral', rate: '—' },
    { id: 'theo',    name: 'Theo Amari',      role: 'Instructor',    classes: 0, hrs: '0.0',  status: 'Invitation sent',  kind: 'warn',    rate: '$26/hr' }
  ];

  var INVOICES = [
    { id: 'INV-2841', fam: 'Okafor',   date: '1 Jul 2026',  due: '8 Jul 2026', amt: 540, status: 'Failed',            kind: 'bad',  method: 'Visa ···4417',       note: 'Card declined — insufficient funds. 2 retries.' },
    { id: 'INV-2842', fam: 'Johnson',  date: '20 Jul 2026', due: '27 Jul 2026', amt: 18,  status: 'Past due',          kind: 'bad',  method: 'Visa ···1183',       note: 'Late pickup — 15 minutes on 20 July.' },
    { id: 'INV-2840', fam: 'Smith',    date: '1 Jul 2026',  due: '8 Jul 2026', amt: 45,  status: 'Past due',          kind: 'bad',  method: 'Mastercard ···9902', note: 'Late pickup fee, 45 minutes across 3 days.' },
    { id: 'INV-2839', fam: 'Delgado',  date: '27 Jul 2026', due: 'On receipt', amt: 200, status: 'Awaiting payment',  kind: 'warn', method: 'None saved',         note: 'Registration submitted, spot held until 30 Jul.' },
    { id: 'INV-2838', fam: 'Johnson',  date: '1 Jul 2026',  due: '8 Jul 2026', amt: 820, status: 'Paid',              kind: 'ok',   method: 'Visa ···1183',       note: '' },
    { id: 'INV-2837', fam: 'Martinez', date: '1 Jul 2026',  due: '8 Jul 2026', amt: 780, status: 'Paid',              kind: 'ok',   method: 'ACH ···6620',        note: '' },
    { id: 'INV-2836', fam: 'Chen',     date: '12 Jul 2026', due: 'On receipt', amt: 415, status: 'Paid',              kind: 'ok',   method: 'Visa ···0091',       note: 'Camp week 4 plus one extra hour.' },
    { id: 'INV-2835', fam: 'Rivera',   date: '1 Jul 2026',  due: '8 Jul 2026', amt: 280, status: 'Paid',              kind: 'ok',   method: 'Visa ···7734',       note: '' },
    { id: 'INV-2834', fam: 'Brennan',  date: '1 Jul 2026',  due: '8 Jul 2026', amt: 540, status: 'Paid',              kind: 'ok',   method: 'Amex ···2201',       note: 'Final invoice — membership ends 31 Aug.' }
  ];

  var WAITLIST = [
    { id: 'w1', cls: 'Mon 3:15pm · Ages 8–11', child: 'Tobi Okafor',     fam: 'Okafor',   joined: '14 Jul', pos: 1 },
    { id: 'w2', cls: 'Mon 3:15pm · Ages 8–11', child: 'Ines Duarte',     fam: 'Duarte',   joined: '16 Jul', pos: 2 },
    { id: 'w3', cls: 'Wed 3:15pm · Ages 8–11', child: 'Sami Haddad',     fam: 'Haddad',   joined: '18 Jul', pos: 1 },
    { id: 'w4', cls: 'Thu 4:30pm · 2-hour',    child: 'Cillian Brennan', fam: 'Brennan',  joined: '20 Jul', pos: 1 },
    { id: 'w5', cls: 'Mon 3:15pm · Ages 8–11', child: 'Bea Whitlock',    fam: 'Whitlock', joined: '22 Jul', pos: 3 },
    { id: 'w6', cls: 'Wed 3:15pm · Ages 8–11', child: 'Otis Lund',       fam: 'Lund',     joined: '25 Jul', pos: 2 }
  ];

  var MAKEUPS = [
    { id: 'm0',  child: 'Mia Chen',        missed: 'Tue 21 Jul · 2:00pm', reason: 'Requested Fri 31 Jul, 10:00am', expires: '31 Aug', status: 'Awaiting approval', kind: 'warn', booked: 'Requested by the family' },
    { id: 'm0b', child: 'Sophia Martinez', missed: 'Mon 20 Jul · 3:15pm', reason: 'Requested Wed 5 Aug, 3:15pm',   expires: '31 Aug', status: 'Awaiting approval', kind: 'warn', booked: 'Requested by the family' },
    { id: 'm1',  child: 'Emma Johnson',    missed: 'Mon 13 Jul · 3:15pm', reason: 'Illness, reported 26 hrs ahead',expires: '31 Jul', status: 'Available',         kind: 'ok',   booked: '' },
    { id: 'm2',  child: 'Emma Johnson',    missed: 'Mon 6 Jul · 3:15pm',  reason: 'Family travel',                 expires: '31 Jul', status: 'Booked',            kind: 'info', booked: 'Fri 31 Jul · 10:00am' },
    { id: 'm3',  child: 'Ava Smith',       missed: 'Mon 13 Jul · 3:15pm', reason: 'Illness',                       expires: '31 Jul', status: 'Available',         kind: 'ok',   booked: '' },
    { id: 'm4',  child: 'Ava Smith',       missed: 'Mon 20 Jul · 3:15pm', reason: 'No reason given',               expires: '31 Jul', status: 'Available',         kind: 'ok',   booked: '' },
    { id: 'm6',  child: 'Noah Rivera',     missed: 'Mon 6 Jul · 2:15pm',  reason: 'Public holiday',                expires: '31 Jul', status: 'Available',         kind: 'ok',   booked: '' },
    { id: 'm7',  child: 'Zara Okafor',     missed: 'Wed 8 Jul · 3:15pm',  reason: 'Illness',                       expires: '31 Jul', status: 'Expiring',          kind: 'warn', booked: 'No eligible class has space' }
  ];

  var INVENTORY = [
    { id: 'i1', item: 'Acrylic paint · red',     on: 2,  min: 12, status: 'Reorder now', kind: 'bad',  supplier: 'Blick', cost: '$4.20' },
    { id: 'i2', item: 'Canvas 12×16',            on: 5,  min: 20, status: 'Reorder now', kind: 'bad',  supplier: 'Blick', cost: '$3.80' },
    { id: 'i3', item: 'Air-dry clay · 25lb',     on: 9,  min: 8,  status: 'OK',          kind: 'ok',   supplier: 'Amaco', cost: '$31.00' },
    { id: 'i4', item: 'Brushes · medium round',  on: 42, min: 24, status: 'OK',          kind: 'ok',   supplier: 'Blick', cost: '$1.15' },
    { id: 'i5', item: 'Smocks · child',          on: 18, min: 20, status: 'Low',         kind: 'warn', supplier: 'Local', cost: '$6.00' },
    { id: 'i6', item: 'Watercolour pans',        on: 26, min: 16, status: 'OK',          kind: 'ok',   supplier: 'Blick', cost: '$5.40' }
  ];

  var SUPPLY_REQUESTS = [
    { id: 'r1', item: 'Canvas 12×16',        qty: 10, by: 'Lauren Ortiz', when: '26 Jul', status: 'Pending',   kind: 'warn' },
    { id: 'r2', item: 'Acrylic paint · red', qty: 24, by: 'Marisol Vega', when: '25 Jul', status: 'Pending',   kind: 'warn' },
    { id: 'r3', item: 'Brushes · medium',    qty: 15, by: 'Lauren Ortiz', when: '18 Jul', status: 'Fulfilled', kind: 'ok' }
  ];

  var LESSON_PLANS = [
    { id: 'lp1', lesson: 'Coil pots — building and smoothing',      cls: 'Camp week 4 · Wed',        date: '29 Jul 2026', room: 'Clay Room', teacher: 'Marisol Vega', tut: 'Coil pot build-up',           status: 'Published', kind: 'ok' },
    { id: 'lp2', lesson: 'Glazing yesterday’s pots',                cls: 'Camp week 4 · Thu',        date: '30 Jul 2026', room: 'Clay Room', teacher: 'Marisol Vega', tut: 'Setting up a glaze station',  status: 'Published', kind: 'ok' },
    { id: 'lp3', lesson: 'Watercolour landscapes, wet-on-wet',      cls: 'Camp week 4 · Fri',        date: '31 Jul 2026', room: 'Studio 1',  teacher: 'Lauren Ortiz', tut: 'Wet-on-wet watercolour',      status: 'Published', kind: 'ok' },
    { id: 'lp4', lesson: 'Colour mixing — secondary and tertiary',  cls: 'Private · Zara O.',        date: '28 Jul 2026', room: 'Studio 2',  teacher: 'Lauren Ortiz', tut: 'None',                        status: 'Published', kind: 'ok' },
    { id: 'lp5', lesson: 'Slab-built tiles',                        cls: 'Mon 3:15pm · ages 8–11',   date: '3 Aug 2026',  room: 'Clay Room', teacher: 'Unassigned',   tut: 'None',                        status: 'Draft',     kind: 'warn' },
    { id: 'lp6', lesson: 'Self-portraits in charcoal',              cls: 'Wed 4:30pm · ages 8–11',   date: '5 Aug 2026',  room: 'Studio 1',  teacher: 'Lauren Ortiz', tut: 'Charcoal blending',           status: 'Draft',     kind: 'warn' }
  ];

  var TUTORIALS = [
    { id: 'tu1', name: 'Charcoal blending',          date: '12 Jun 2026', len: '5 min', linked: 'Wed 4:30pm · ages 8–11', by: 'Lauren Ortiz' },
    { id: 'tu2', name: 'Coil pot build-up',          date: '2 Mar 2026',  len: '6 min', linked: 'Camp week 4 · Wed',      by: 'Marisol Vega' },
    { id: 'tu3', name: 'Kiln loading and safety',    date: '18 Jan 2026', len: '8 min', linked: 'Not linked',             by: 'Marisol Vega' },
    { id: 'tu4', name: 'Setting up a glaze station', date: '2 Mar 2026',  len: '3 min', linked: 'Camp week 4 · Thu',      by: 'Marisol Vega' },
    { id: 'tu5', name: 'Wet-on-wet watercolour',     date: '9 May 2026',  len: '4 min', linked: 'Camp week 4 · Fri',      by: 'Lauren Ortiz' },
    { id: 'tu6', name: 'Wheel centring basics',      date: '21 Apr 2026', len: '9 min', linked: 'Not linked',             by: 'Marisol Vega' }
  ];

  var TRAINING = [
    { id: 'td1', name: 'Studio opening checklist',       cat: 'SOP',                  kind: 'PDF',            when: 'Updated 4 Jul 2026' },
    { id: 'td2', name: 'Employee manual 2026',           cat: 'Employee manual',      kind: 'PDF',            when: 'Updated 1 Jan 2026' },
    { id: 'td3', name: 'Instructor responsibilities',    cat: 'Responsibilities',     kind: 'PDF',            when: 'Updated 12 May 2026' },
    { id: 'td4', name: 'Allergy and EpiPen procedure',   cat: 'Safety',               kind: 'PDF',            when: 'Updated 3 Feb 2026' },
    { id: 'td5', name: 'Studio safety walkthrough',      cat: 'Safety',               kind: 'Video · 11 min', when: 'Updated 3 Feb 2026' },
    { id: 'td6', name: 'Closing and clean-down',         cat: 'SOP',                  kind: 'Video · 6 min',  when: 'Updated 4 Jul 2026' }
  ];

  var THREADS = [
    { id: 'mt1', fam: 'Okafor',   who: 'Ada Okafor',      last: 'Is there any chance of moving Tobi to Wednesday?',   when: '2 hrs ago',  unread: true },
    { id: 'mt2', fam: 'Delgado',  who: 'Paloma Delgado',  last: 'My card was declined — I have a new one to add.',    when: '4 hrs ago',  unread: true },
    { id: 'mt3', fam: 'Johnson',  who: 'Sabrina Moore',   last: 'Thank you! Emma had a wonderful time.',              when: 'Yesterday',  unread: false },
    { id: 'mt4', fam: 'Chen',     who: 'Wei Chen',        last: 'Does camp week 5 still have space for Mia?',         when: 'Yesterday',  unread: true },
    { id: 'mt5', fam: 'Brennan',  who: 'Nora Brennan',    last: 'Confirming we finish at the end of August.',         when: '2 days ago', unread: true },
    { id: 'mt6', fam: 'Martinez', who: 'Isabel Martinez', last: 'Sophia will miss Monday — she has a school trip.',   when: '3 days ago', unread: false }
  ];

  var TRANSCRIPTS = {
    mt1: [
      { d: 'Monday', m: 'them', t: 'Hello! Tobi has settled in really well with Marisol.', s: 'Mon 4:12pm' },
      { d: '', m: 'us', t: 'So glad to hear it — she mentioned he barely looked up from the wheel.', s: 'Mon 5:03pm' },
      { d: 'Today', m: 'them', t: 'Is there any chance of moving Tobi to Wednesday? Monday pick-up has become difficult with my work.', s: '2 hrs ago' },
      { d: '', m: 'them', t: 'Happy to stay on the waitlist if Wednesday is full.', s: '2 hrs ago' }
    ],
    mt2: [
      { d: 'Today', m: 'them', t: 'My card was declined — I have a new one to add. Sorry about that!', s: '4 hrs ago' },
      { d: '', m: 'us', t: 'No trouble at all. You can add it under Billing, or I can take it over the phone this afternoon.', s: '3 hrs ago' },
      { d: '', m: 'them', t: 'I will do it online tonight. Thank you.', s: '3 hrs ago' }
    ],
    mt3: [
      { d: 'Yesterday', m: 'us', t: 'Emma finished her coil pot today — it is drying on the rack and will be ready Friday.', s: 'Yesterday 2:40pm' },
      { d: '', m: 'them', t: 'Thank you! Emma had a wonderful time.', s: 'Yesterday 6:15pm' }
    ],
    mt4: [
      { d: 'Yesterday', m: 'them', t: 'Does camp week 5 still have space for Mia?', s: 'Yesterday 9:02am' },
      { d: '', m: 'us', t: 'It does — 9 of 20 places. Shall I hold one while you decide?', s: 'Yesterday 9:31am' },
      { d: '', m: 'them', t: 'Yes please, until Thursday if that is alright.', s: 'Yesterday 9:45am' }
    ],
    mt5: [
      { d: '2 days ago', m: 'them', t: 'Confirming we finish at the end of August. Thank you for two lovely years.', s: 'Sat 11:20am' },
      { d: '', m: 'us', t: 'We are sorry to see you go. Your last billing date is 1 August and nothing further will be charged.', s: 'Sat 12:04pm' }
    ],
    mt6: [
      { d: '3 days ago', m: 'them', t: 'Sophia will miss Monday — she has a school trip.', s: 'Fri 8:15am' },
      { d: '', m: 'us', t: 'Noted, thank you for the notice. That is more than 24 hours ahead so a make-up credit has been added.', s: 'Fri 8:50am' },
      { d: '', m: 'them', t: 'Perfect, thank you.', s: 'Fri 9:02am' }
    ]
  };

  var FAMILY_TRANSCRIPT = [
    { d: '1 July',  m: 'studio', t: 'We are closed for the holiday on 4 July. Monday families, a make-up credit has already been added to your account.', s: '1 Jul' },
    { d: '18 July', m: 'studio', t: 'Autumn enrolment opens 10 August. Returning families get first refusal on their current day and time for one week.', s: '18 Jul' },
    { d: '21 July', m: 'studio', t: 'Camp week 4 — please send a water bottle, a snack, and clothes that can get properly messy. We are working with clay all week.', s: '21 Jul' },
    { d: '', m: 'us', t: 'Thank you! Emma is very excited about the clay.', s: '21 Jul' },
    { d: 'Today',   m: 'studio', t: 'We have opened two extra make-up hours this Friday, 10:00 and 11:00. Emma has two credits — grab one if it suits.', s: '2 hrs ago' }
  ];

  var ANNOUNCEMENTS = [
    { id: 'an1', head: 'Autumn enrolment opens 10 August',         body: 'Returning families get first refusal on their current day and time for one week.', aud: 'All families',      when: '18 Jul 2026', by: 'Sabrina Yanguas', status: 'Pinned',    kind: 'info' },
    { id: 'an2', head: 'Make-up slots added for Friday',           body: 'Two extra hours this Friday, 10:00 and 11:00. Emma has two credits.',              aud: 'After-School Art',  when: '27 Jul 2026', by: 'Dani Cruz',       status: 'Live',      kind: 'ok' },
    { id: 'an3', head: 'Camp week 4 — what to bring',              body: 'A water bottle, a snack, and clothes that can get properly messy.',                aud: 'Seasonal Camp',     when: '21 Jul 2026', by: 'Dani Cruz',       status: 'Live',      kind: 'ok' },
    { id: 'an4', head: 'Studio closed 7 September, Labor Day',     body: 'Monday families get an automatic make-up credit.',                                 aud: 'All families',      when: '15 Jul 2026', by: 'Sabrina Yanguas', status: 'Scheduled', kind: 'neutral' },
    { id: 'an5', head: 'New kiln — clay classes back to full size',body: 'Ages 8–11 clay is back to 16 places from August.',                                 aud: 'All families',      when: '2 Jul 2026',  by: 'Sabrina Yanguas', status: 'Live',      kind: 'ok' }
  ];

  /* Today's sessions — Tuesday 28 July 2026. */
  var TODAY = [
    { time: '9:00',  prog: 'camp', title: 'Summer Camp · Week 4 · Studio 1',  en: 18, cap: 20 },
    { time: '9:00',  prog: 'camp', title: 'Summer Camp · Week 4 · Clay Room', en: 14, cap: 16 },
    { time: '13:00', prog: 'priv', title: 'Private · Zara O. · Studio 2',     en: 1,  cap: 1 },
    { time: '16:00', prog: 'pop',  title: 'Pop-Up · Clay Night · Studio 1',   en: 14, cap: 18 },
    { time: '17:30', prog: 'camp', title: 'Camp extended care',               en: 6,  cap: 10 }
  ];

  var ACTIVITY = [
    { at: '10:42', what: 'Rey M. took a $400 camp payment — Chen family' },
    { at: '10:15', what: 'Waitlist place offered — Tobi Okafor, Mon 3:15pm' },
    { at: '09:58', what: 'Lauren O. clocked in' },
    { at: '09:31', what: 'Absence reported — Emma Johnson, make-up credit issued' },
    { at: '08:47', what: 'New registration — Delgado family, 2 children' },
    { at: '08:12', what: 'Payment failed — Okafor family, retry scheduled 30 Jul' }
  ];

  /* The Johnson family's ledger, shown in Console → Billing → ledger and in
     the family's own Billing screen. */
  var LEDGER = [
    { d: '1 Jul 2026',  what: 'July tuition — Emma, 8 sessions',  amt: 540, paid: true },
    { d: '1 Jul 2026',  what: 'July tuition — Lucas, 4 sessions', amt: 280, paid: true },
    { d: '1 Jul 2026',  what: 'Sibling discount — Lucas',           amt: -140, paid: true },
    { d: '12 Jul 2026', what: 'Camp week 4 extra hour — Emma',      amt: 28,  paid: true },
    { d: '20 Jul 2026', what: 'Late pickup — 15 minutes',           amt: 18,  paid: false },
    { d: '27 Jul 2026', what: 'Make-up credit applied — Emma',      amt: -28, paid: true }
  ];

  var DOCUMENTS = [
    { id: 'd1', name: 'Payment terms',            version: 'Version 4', published: '1 July 2026',     signed: false, who: '—' },
    { id: 'd2', name: 'Studio policies',          version: 'Version 2', published: '1 January 2026',  signed: true,  who: 'Sabrina Moore · 3 Jan 2026' },
    { id: 'd3', name: 'Photo permission — Emma',  version: 'Version 1', published: '12 August 2024',  signed: true,  who: 'Sabrina Moore · 12 Aug 2024' },
    { id: 'd4', name: 'Photo permission — Lucas', version: 'Version 1', published: '12 August 2024',  signed: false, who: '—' },
    { id: 'd5', name: 'Medical and allergy form', version: 'Version 3', published: '1 September 2025',signed: true,  who: 'Sabrina Moore · 4 Sep 2025' }
  ];

  Grove.data = {
    today: 'Tuesday, 28 July 2026',
    PROGRAMS: PROGRAMS,
    ROLES: ROLES,
    PRICING: PRICING,
    FAMILIES: FAMILIES,
    STUDENTS: STUDENTS,
    CLASSES: CLASSES,
    STAFF: STAFF,
    INVOICES: INVOICES,
    WAITLIST: WAITLIST,
    MAKEUPS: MAKEUPS,
    INVENTORY: INVENTORY,
    SUPPLY_REQUESTS: SUPPLY_REQUESTS,
    LESSON_PLANS: LESSON_PLANS,
    TUTORIALS: TUTORIALS,
    TRAINING: TRAINING,
    THREADS: THREADS,
    TRANSCRIPTS: TRANSCRIPTS,
    FAMILY_TRANSCRIPT: FAMILY_TRANSCRIPT,
    ANNOUNCEMENTS: ANNOUNCEMENTS,
    TODAY: TODAY,
    ACTIVITY: ACTIVITY,
    LEDGER: LEDGER,
    DOCUMENTS: DOCUMENTS,

    family: function (id) { return FAMILIES.filter(function (f) { return f.id === id; })[0]; },
    student: function (id) { return STUDENTS.filter(function (s) { return s.id === id; })[0]; },
    program: function (id) { return PROGRAMS[id]; }
  };
})();
