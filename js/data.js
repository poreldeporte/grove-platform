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
  /* The five ways a programme can be priced. A programme picks one, and that
     choice decides what the price table asks for — which is how the owner sets
     prices when she creates a programme. Nothing else needs to know how a
     price was arrived at. */
  var PRICING_MODELS = {
    plan:     { id: 'plan',     name: 'A plan, in hours a month', asks: 'A row per tier: hours a month, and what that tier costs.',   unit: 'hours a month' },
    perWeek:  { id: 'perWeek',  name: 'By the week or the day',   asks: 'A full week, a single day, and an extra hour.',              unit: 'a week' },
    perHour:  { id: 'perHour',  name: 'By the hour',              asks: 'An hourly rate, plus the shortest and longest booking.',     unit: 'an hour' },
    perEvent: { id: 'perEvent', name: 'A price per event',        asks: 'Each event carries its own name, date, places and price.',   unit: 'a child' },
    quoted:   { id: 'quoted',   name: 'Quoted by hand',           asks: 'Nothing. The studio prices each enquiry itself.',            unit: 'quoted' }
  };

  var PRICING = {
    /* After-School is the only programme with a plan. A plan is HOURS A MONTH,
       not classes: a child on 16 hours taking two-hour classes comes eight
       times, a child on 16 hours taking one-hour classes comes sixteen. The
       rate per hour falls as the plan grows. Everything else is a one-off. */
    as: { model: 'plan',
      plans: { p4: 280, p8: 540, p12: 780, p16: 960 },
      regFee: 130,
      regFeePer: 'child, once a year',
      siblingFeeRelief: 0.5,
      siblingRelief: '50% off the registration fee for the second and third child',
      extraClassRate: { p4: 70, p8: 67.5, p12: 65, p16: 60 }
    },
    camp: { model: 'perWeek', week: 400, day: 100, extraHour: 28, regFee: 15 },
    nsd:  { model: 'perHour', base: 100, extraHour: 28, maxHours: 6, regFee: 15 },
    priv: { model: 'perHour', hourly: 90, maxHours: 3, regFee: 15 },
    pop:  { model: 'perEvent',
      regFee: 15,
      events: [
        { id: 'clay',  label: 'Clay Night',     amount: 45, sub: 'Tue 28 July, 4:00–6:00pm · ages 8+ · 4 places left' },
        { id: 'print', label: 'Print & Poster', amount: 45, sub: 'Fri 14 Aug, 4:00–6:00pm · ages 8+ · 18 places' }
      ]
    },
    bday: { model: 'quoted', quoteOnly: true, regFee: 0 }
  };

  var FAMILIES = [
    { id: 'johnson',  name: 'Johnson',  guardian: 'Sabrina Moore',    email: 'sabrina.j@email.com',   phone: '(786) 340-1182', kids: 'Emma (8), Lucas (10)', balance: 18,  plan: '4 and 4 hours a month',  status: 'Active',          since: 'Aug 2024',    autopay: true,  card: 'Visa ···1183 · exp 04/29', heardVia: 'Word of mouth' },
    { id: 'okafor',   name: 'Okafor',   guardian: 'Ada Okafor',       email: 'ada.okafor@email.com',  phone: '(305) 771-4409', kids: 'Zara (11), Tobi (9)',  balance: 540, plan: '8 hours a month',      status: 'Payment failed',  since: 'Sep 2025',    autopay: true,  card: 'Visa ···4417 · exp 11/27', heardVia: 'Instagram' },
    { id: 'chen',     name: 'Chen',     guardian: 'Wei Chen',         email: 'wei.chen@email.com',    phone: '(786) 209-3318', kids: 'Mia (6)',              balance: 0,   plan: 'Camp week 4',    status: 'Active',          since: 'Jun 2026',    autopay: false, card: 'Visa ···0091 · exp 02/28', heardVia: 'Google' },
    { id: 'rivera',   name: 'Rivera',   guardian: 'Diego Rivera',     email: 'diego.rivera@email.com',phone: '(305) 442-8890', kids: 'Noah (7)',             balance: 0,   plan: '4 hours a month',      status: 'Active',          since: 'Jan 2025',    autopay: true,  card: 'Visa ···7734 · exp 07/29', heardVia: 'Word of mouth' },
    { id: 'smith',    name: 'Smith',    guardian: 'Karen Smith',      email: 'karen.smith@email.com', phone: '(786) 553-1207', kids: 'Ava (8)',              balance: 45,  plan: '4 hours a month',      status: 'Past due',        since: 'Mar 2025',    autopay: true,  card: 'Mastercard ···9902 · exp 01/28', heardVia: 'School flyer' },
    { id: 'martinez', name: 'Martinez', guardian: 'Isabel Martinez',  email: 'isabel.m@email.com',    phone: '(305) 118-7742', kids: 'Sophia (8)',           balance: 0,   plan: '12 hours a month',     status: 'Active',          since: 'Aug 2023',    autopay: true,  card: 'ACH ···6620', heardVia: 'Word of mouth' },
    { id: 'delgado',  name: 'Delgado',  guardian: 'Paloma Delgado',   email: 'p.delgado@email.com',   phone: '(786) 664-0031', kids: 'Iker (5), Luz (7)',    balance: 200, plan: 'Registered, not yet paid',status: 'Pending payment', since: '27 Jul 2026', autopay: false, card: 'None saved', heardVia: 'Instagram' },
    { id: 'hollis', name: 'Hollis', guardian: 'Margaret Hollis', email: 'margaret.hollis@email.com', phone: '(305) 852-3546', kids: 'Tariq (7), Paloma (6)', balance: 0, plan: '8 hours a month', status: 'Active', since: 'Jun 2026', autopay: true, card: 'Mastercard ···4289 · exp 01/28', heardVia: 'Walked past' },
    { id: 'lemaire', name: 'Lemaire', guardian: 'Gareth Lemaire', email: 'gareth.lemaire@email.com', phone: '(786) 947-1736', kids: 'Yara (5)', balance: 0, plan: '4 hours a month', status: 'Active', since: 'Jan 2024', autopay: true, card: 'Amex ···7620 · exp 03/29', heardVia: 'Instagram' },
    { id: 'jimenez', name: 'Jimenez', guardian: 'Maria Jimenez', email: 'maria.jimenez@email.com', phone: '(305) 729-7745', kids: 'Aria (6), Nicolas (6)', balance: 0, plan: '8 hours a month', status: 'Active', since: 'Aug 2025', autopay: false, card: 'Mastercard ···1914 · exp 03/28', heardVia: 'Instagram' },
    { id: 'abreu', name: 'Abreu', guardian: 'Petra Abreu', email: 'petra.abreu@email.com', phone: '(305) 852-7504', kids: 'Iris (5), Rowan (9)', balance: 0, plan: '8 hours a month', status: 'Active', since: 'Aug 2025', autopay: true, card: 'Mastercard ···3037 · exp 02/27', heardVia: 'Sibling already here' },
    { id: 'okonkwo', name: 'Okonkwo', guardian: 'Rhys Okonkwo', email: 'rhys.okonkwo@email.com', phone: '(305) 685-7579', kids: 'Solene (5), Maeve (10)', balance: 0, plan: '8 hours a month', status: 'Active', since: 'Jan 2024', autopay: true, card: 'Visa ···3910 · exp 07/28', heardVia: 'Google' },
    { id: 'pereira', name: 'Pereira', guardian: 'Margaret Pereira', email: 'margaret.pereira@email.com', phone: '(786) 311-5762', kids: 'Otto (5), Renata (11)', balance: 0, plan: '8 hours a month', status: 'Active', since: 'Aug 2025', autopay: false, card: 'Amex ···6228 · exp 08/28', heardVia: 'Walked past' },
    { id: 'rocha', name: 'Rocha', guardian: 'Adaeze Rocha', email: 'adaeze.rocha@email.com', phone: '(305) 237-4568', kids: 'Odette (5)', balance: 0, plan: '4 hours a month', status: 'Active', since: 'Sep 2025', autopay: true, card: 'Visa ···6926 · exp 03/27', heardVia: 'School flyer' },
    { id: 'cifuentes', name: 'Cifuentes', guardian: 'Anders Cifuentes', email: 'anders.cifuentes@email.com', phone: '(786) 332-5070', kids: 'Bruno (5)', balance: 0, plan: '4 hours a month', status: 'Active', since: 'Jan 2025', autopay: true, card: 'Visa ···1781 · exp 06/28', heardVia: 'Sibling already here' },
    { id: 'estrada', name: 'Estrada', guardian: 'Farah Estrada', email: 'farah.estrada@email.com', phone: '(305) 392-3566', kids: 'Arlo (7)', balance: 0, plan: '4 hours a month', status: 'Active', since: 'Jan 2025', autopay: true, card: 'Mastercard ···7543 · exp 07/30', heardVia: 'Google' },
    { id: 'ibrahim', name: 'Ibrahim', guardian: 'Siobhan Ibrahim', email: 'siobhan.ibrahim@email.com', phone: '(305) 479-3592', kids: 'Hana (8)', balance: 0, plan: '4 hours a month', status: 'Active', since: 'Aug 2024', autopay: true, card: 'Amex ···2518 · exp 03/27', heardVia: 'Google' },
    { id: 'nkemdirim', name: 'Nkemdirim', guardian: 'Tomas Nkemdirim', email: 'tomas.nkemdirim@email.com', phone: '(305) 820-6850', kids: 'Idris (9)', balance: 0, plan: '4 hours a month', status: 'Active', since: 'Jan 2025', autopay: false, card: 'Amex ···7530 · exp 08/28', heardVia: 'School flyer' },
    { id: 'bonilla', name: 'Bonilla', guardian: 'Andres Bonilla', email: 'andres.bonilla@email.com', phone: '(786) 703-9899', kids: 'Iris (11), Arlo (9)', balance: 0, plan: '8 hours a month', status: 'Active', since: 'Sep 2025', autopay: true, card: 'Amex ···4703 · exp 11/29', heardVia: 'Word of mouth' },
    { id: 'tavares', name: 'Tavares', guardian: 'Margaret Tavares', email: 'margaret.tavares@email.com', phone: '(305) 583-3076', kids: 'Rowan (11)', balance: 0, plan: '4 hours a month', status: 'Active', since: 'Aug 2025', autopay: true, card: 'Amex ···6143 · exp 04/28', heardVia: 'Walked past' },
    { id: 'fonseca', name: 'Fonseca', guardian: 'Adaeze Fonseca', email: 'adaeze.fonseca@email.com', phone: '(305) 341-8002', kids: 'Omar (8)', balance: 0, plan: '4 hours a month', status: 'Active', since: 'Aug 2025', autopay: true, card: 'Mastercard ···2312 · exp 08/30', heardVia: 'Instagram' },
    { id: 'zavala', name: 'Zavala', guardian: 'Siobhan Zavala', email: 'siobhan.zavala@email.com', phone: '(786) 713-8002', kids: 'Enzo (10), Hugo (9)', balance: 0, plan: '8 hours a month', status: 'Active', since: 'Sep 2025', autopay: false, card: 'Mastercard ···2141 · exp 09/29', heardVia: 'School flyer' },
    { id: 'vega', name: 'Vega', guardian: 'Peter Vega', email: 'peter.vega@email.com', phone: '(305) 735-6006', kids: 'Elena (7)', balance: 0, plan: '4 hours a month', status: 'Active', since: 'Jan 2024', autopay: false, card: 'Mastercard ···8816 · exp 09/28', heardVia: 'Instagram' },
    { id: 'valdez', name: 'Valdez', guardian: 'Wanjiru Valdez', email: 'wanjiru.valdez@email.com', phone: '(786) 636-6988', kids: 'Kofi (7)', balance: 0, plan: '4 hours a month', status: 'Active', since: 'Sep 2025', autopay: false, card: 'Mastercard ···8060 · exp 05/30', heardVia: 'Google' },
    { id: 'espinal', name: 'Espinal', guardian: 'Dominique Espinal', email: 'dominique.espinal@email.com', phone: '(786) 350-1108', kids: 'Hana (6)', balance: 0, plan: '4 hours a month', status: 'Active', since: 'Jan 2025', autopay: false, card: 'Amex ···3611 · exp 05/30', heardVia: 'Sibling already here' },
    { id: 'kouassi', name: 'Kouassi', guardian: 'Ingrid Kouassi', email: 'ingrid.kouassi@email.com', phone: '(305) 805-7330', kids: 'Declan (6)', balance: 0, plan: '4 hours a month', status: 'Active', since: 'Jan 2026', autopay: true, card: 'Amex ···8209 · exp 04/30', heardVia: 'Walked past' },
    { id: 'salgado', name: 'Salgado', guardian: 'David Salgado', email: 'david.salgado@email.com', phone: '(786) 495-8876', kids: 'Anika (7)', balance: 0, plan: '4 hours a month', status: 'Active', since: 'Aug 2023', autopay: true, card: 'Visa ···6658 · exp 01/29', heardVia: 'Word of mouth' },
    { id: 'jansen', name: 'Jansen', guardian: 'Samir Jansen', email: 'samir.jansen@email.com', phone: '(305) 736-1130', kids: 'Willa (7)', balance: 0, plan: '4 hours a month', status: 'Active', since: 'Aug 2023', autopay: true, card: 'Visa ···3812 · exp 11/29', heardVia: 'Sibling already here' },
    { id: 'fabre', name: 'Fabre', guardian: 'Siobhan Fabre', email: 'siobhan.fabre@email.com', phone: '(305) 287-4390', kids: 'Declan (7)', balance: 0, plan: '4 hours a month', status: 'Active', since: 'Aug 2025', autopay: true, card: 'Amex ···4788 · exp 07/29', heardVia: 'Sibling already here' },
    { id: 'wanjiru', name: 'Wanjiru', guardian: 'Dominique Wanjiru', email: 'dominique.wanjiru@email.com', phone: '(786) 942-5693', kids: 'Esme (8)', balance: 0, plan: '4 hours a month', status: 'Active', since: 'Jan 2026', autopay: true, card: 'Visa ···2840 · exp 09/28', heardVia: 'Walked past' },
    { id: 'navarro', name: 'Navarro', guardian: 'Renee Navarro', email: 'renee.navarro@email.com', phone: '(786) 935-7858', kids: 'Priya (11)', balance: 0, plan: '4 hours a month', status: 'Active', since: 'Aug 2023', autopay: true, card: 'Mastercard ···3742 · exp 09/30', heardVia: 'School flyer' },
    { id: 'barros', name: 'Barros', guardian: 'Pierre Barros', email: 'pierre.barros@email.com', phone: '(786) 937-5286', kids: 'Rayan (8), Keiko (11)', balance: 0, plan: '8 hours a month', status: 'Active', since: 'Jun 2026', autopay: false, card: 'Mastercard ···7829 · exp 08/29', heardVia: 'Walked past' },
    { id: 'delacroix', name: 'Delacroix', guardian: 'Elena Delacroix', email: 'elena.delacroix@email.com', phone: '(305) 355-2626', kids: 'Mariana (8)', balance: 0, plan: '4 hours a month', status: 'Active', since: 'Aug 2023', autopay: true, card: 'Visa ···2722 · exp 05/27', heardVia: 'Sibling already here' },
    { id: 'toledo', name: 'Toledo', guardian: 'Samir Toledo', email: 'samir.toledo@email.com', phone: '(305) 543-4410', kids: 'Thea (8)', balance: 0, plan: '4 hours a month', status: 'Active', since: 'Aug 2024', autopay: true, card: 'Visa ···7828 · exp 05/29', heardVia: 'Sibling already here' },
    { id: 'fortier', name: 'Fortier', guardian: 'Fatima Fortier', email: 'fatima.fortier@email.com', phone: '(305) 405-4598', kids: 'Rayan (10)', balance: 0, plan: '4 hours a month', status: 'Active', since: 'Jun 2026', autopay: false, card: 'Amex ···5836 · exp 04/27', heardVia: 'Walked past' },
    { id: 'pires', name: 'Pires', guardian: 'Dominique Pires', email: 'dominique.pires@email.com', phone: '(786) 826-8631', kids: 'Camila (13)', balance: 0, plan: '4 hours a month', status: 'Active', since: 'Jan 2026', autopay: false, card: 'Mastercard ···7528 · exp 03/29', heardVia: 'Instagram' },
    { id: 'haddad', name: 'Haddad', guardian: 'Farah Haddad', email: 'farah.haddad@email.com', phone: '(786) 500-6224', kids: 'Arjun (14)', balance: 0, plan: '4 hours a month', status: 'Active', since: 'Aug 2024', autopay: true, card: 'Visa ···3140 · exp 08/30', heardVia: 'Instagram' },
    { id: 'jalal', name: 'Jalal', guardian: 'Wanjiru Jalal', email: 'wanjiru.jalal@email.com', phone: '(786) 883-8378', kids: 'Marisol (14)', balance: 0, plan: '4 hours a month', status: 'Active', since: 'Jan 2026', autopay: true, card: 'Amex ···3930 · exp 06/29', heardVia: 'School flyer' },
    { id: 'klein', name: 'Klein', guardian: 'Petra Klein', email: 'petra.klein@email.com', phone: '(305) 214-7777', kids: 'Imani (13)', balance: 0, plan: '4 hours a month', status: 'Active', since: 'Jan 2024', autopay: true, card: 'Mastercard ···7269 · exp 03/30', heardVia: 'Word of mouth' },
    { id: 'whitlock', name: 'Whitlock', guardian: 'Siobhan Whitlock', email: 'siobhan.whitlock@email.com', phone: '(786) 686-5935', kids: 'Haruki (14)', balance: 0, plan: '4 hours a month', status: 'Active', since: 'Aug 2025', autopay: true, card: 'Amex ···8804 · exp 11/28', heardVia: 'School flyer' },
    { id: 'guerrero', name: 'Guerrero', guardian: 'Wanjiru Guerrero', email: 'wanjiru.guerrero@email.com', phone: '(786) 674-1744', kids: 'Arlo (14)', balance: 0, plan: '4 hours a month', status: 'Active', since: 'Jun 2026', autopay: false, card: 'Amex ···4925 · exp 08/27', heardVia: 'Walked past' },
    { id: 'moreau', name: 'Moreau', guardian: 'Maria Moreau', email: 'maria.moreau@email.com', phone: '(305) 972-4142', kids: 'Milo (14)', balance: 0, plan: '4 hours a month', status: 'Active', since: 'Jan 2024', autopay: true, card: 'Mastercard ···2182 · exp 06/27', heardVia: 'Sibling already here' },
    { id: 'lund', name: 'Lund', guardian: 'Bjorn Lund', email: 'bjorn.lund@email.com', phone: '(786) 608-2169', kids: 'Keiko (12)', balance: 0, plan: '4 hours a month', status: 'Active', since: 'Jan 2024', autopay: true, card: 'Amex ···5511 · exp 11/27', heardVia: 'Sibling already here' },
    { id: 'idowu', name: 'Idowu', guardian: 'Beatriz Idowu', email: 'beatriz.idowu@email.com', phone: '(305) 815-7553', kids: 'Marisol (12)', balance: 0, plan: '4 hours a month', status: 'Active', since: 'Sep 2025', autopay: true, card: 'Mastercard ···5285 · exp 03/28', heardVia: 'Sibling already here' },
    { id: 'restrepo', name: 'Restrepo', guardian: 'Petra Restrepo', email: 'petra.restrepo@email.com', phone: '(305) 228-2774', kids: 'Aria (12)', balance: 0, plan: '4 hours a month', status: 'Active', since: 'Aug 2024', autopay: true, card: 'Visa ···7508 · exp 01/27', heardVia: 'Walked past' },
    { id: 'yusuf', name: 'Yusuf', guardian: 'Carmen Yusuf', email: 'carmen.yusuf@email.com', phone: '(786) 462-3450', kids: 'Valentina (14)', balance: 0, plan: '4 hours a month', status: 'Active', since: 'Aug 2024', autopay: true, card: 'Visa ···5786 · exp 03/30', heardVia: 'School flyer' },
    { id: 'iglesias', name: 'Iglesias', guardian: 'Maria Iglesias', email: 'maria.iglesias@email.com', phone: '(305) 698-9778', kids: 'Nina (7)', balance: 0, plan: 'Camp and one-off bookings', status: 'Active', since: 'Jan 2026', autopay: true, card: 'Mastercard ···4761 · exp 04/27', heardVia: 'Word of mouth' },
    { id: 'cardoso', name: 'Cardoso', guardian: 'Carlos Cardoso', email: 'carlos.cardoso@email.com', phone: '(305) 730-6583', kids: 'Rayan (5)', balance: 0, plan: 'Camp and one-off bookings', status: 'Active', since: 'Aug 2023', autopay: true, card: 'Mastercard ···5513 · exp 11/29', heardVia: 'Sibling already here' },
    { id: 'galvez', name: 'Galvez', guardian: 'Ana Galvez', email: 'ana.galvez@email.com', phone: '(305) 584-6301', kids: 'Freya (7)', balance: 0, plan: 'Camp and one-off bookings', status: 'Active', since: 'Sep 2025', autopay: true, card: 'Visa ···3844 · exp 12/29', heardVia: 'Sibling already here' },
    { id: 'dorsey', name: 'Dorsey', guardian: 'Patricia Dorsey', email: 'patricia.dorsey@email.com', phone: '(786) 825-9678', kids: 'Rosa (7)', balance: 0, plan: 'Camp and one-off bookings', status: 'Active', since: 'Jun 2026', autopay: true, card: 'Amex ···2334 · exp 12/27', heardVia: 'Instagram' },
    { id: 'ybarra', name: 'Ybarra', guardian: 'Gareth Ybarra', email: 'gareth.ybarra@email.com', phone: '(786) 504-6972', kids: 'Arlo (5)', balance: 0, plan: 'Camp and one-off bookings', status: 'Active', since: 'Jan 2025', autopay: true, card: 'Visa ···3460 · exp 09/27', heardVia: 'Instagram' },
    { id: 'alvarez', name: 'Alvarez', guardian: 'Nikolai Alvarez', email: 'nikolai.alvarez@email.com', phone: '(305) 219-5449', kids: 'Saoirse (5)', balance: 0, plan: 'Camp and one-off bookings', status: 'Active', since: 'Jun 2026', autopay: true, card: 'Amex ···7213 · exp 03/29', heardVia: 'Word of mouth' },
    { id: 'zamora', name: 'Zamora', guardian: 'Sylvie Zamora', email: 'sylvie.zamora@email.com', phone: '(305) 526-2033', kids: 'Oscar (10)', balance: 0, plan: 'Camp and one-off bookings', status: 'Active', since: 'Jan 2026', autopay: false, card: 'Amex ···4793 · exp 10/28', heardVia: 'Google' },
    { id: 'grimaldi', name: 'Grimaldi', guardian: 'Renee Grimaldi', email: 'renee.grimaldi@email.com', phone: '(305) 635-4479', kids: 'Thea (8)', balance: 0, plan: 'Camp and one-off bookings', status: 'Active', since: 'Jun 2026', autopay: true, card: 'Visa ···6609 · exp 11/30', heardVia: 'Sibling already here' },
    { id: 'quintero', name: 'Quintero', guardian: 'Paola Quintero', email: 'paola.quintero@email.com', phone: '(305) 219-7537', kids: 'Andres (11)', balance: 0, plan: 'Camp and one-off bookings', status: 'Active', since: 'Aug 2023', autopay: true, card: 'Visa ···2820 · exp 03/30', heardVia: 'Word of mouth' },
    { id: 'serrano', name: 'Serrano', guardian: 'Anders Serrano', email: 'anders.serrano@email.com', phone: '(786) 578-9201', kids: 'Nina (9)', balance: 0, plan: 'Camp and one-off bookings', status: 'Active', since: 'Jun 2026', autopay: true, card: 'Amex ···1205 · exp 04/30', heardVia: 'Google' },
    { id: 'kilbride', name: 'Kilbride', guardian: 'Petra Kilbride', email: 'petra.kilbride@email.com', phone: '(305) 507-5349', kids: 'Declan (8)', balance: 0, plan: 'Camp and one-off bookings', status: 'Active', since: 'Jun 2026', autopay: false, card: 'Visa ···4856 · exp 10/30', heardVia: 'Sibling already here' },
    { id: 'herrera', name: 'Herrera', guardian: 'Rhys Herrera', email: 'rhys.herrera@email.com', phone: '(305) 480-2190', kids: 'Mariana (6)', balance: 0, plan: 'Camp and one-off bookings', status: 'Active', since: 'Aug 2024', autopay: true, card: 'Amex ···2313 · exp 03/28', heardVia: 'Instagram' },
    { id: 'ximenes', name: 'Ximenes', guardian: 'Claudia Ximenes', email: 'claudia.ximenes@email.com', phone: '(305) 236-9576', kids: 'Amelie (5)', balance: 0, plan: 'Camp and one-off bookings', status: 'Active', since: 'Sep 2025', autopay: true, card: 'Mastercard ···5145 · exp 06/27', heardVia: 'Walked past' },
    { id: 'escobar', name: 'Escobar', guardian: 'Petra Escobar', email: 'petra.escobar@email.com', phone: '(786) 441-9316', kids: 'Mateo (6)', balance: 0, plan: 'Camp and one-off bookings', status: 'Active', since: 'Jan 2026', autopay: true, card: 'Visa ···5925 · exp 03/28', heardVia: 'Sibling already here' },
    { id: 'urbina', name: 'Urbina', guardian: 'Patricia Urbina', email: 'patricia.urbina@email.com', phone: '(786) 706-4362', kids: 'Odette (9)', balance: 0, plan: 'Camp and one-off bookings', status: 'Active', since: 'Jan 2026', autopay: false, card: 'Mastercard ···5845 · exp 05/27', heardVia: 'Sibling already here' },
    { id: 'maldonado', name: 'Maldonado', guardian: 'Sylvie Maldonado', email: 'sylvie.maldonado@email.com', phone: '(305) 602-4395', kids: 'Jonah (10)', balance: 0, plan: 'Camp and one-off bookings', status: 'Active', since: 'Jun 2026', autopay: true, card: 'Visa ···1660 · exp 06/28', heardVia: 'Walked past' },
    { id: 'castillo', name: 'Castillo', guardian: 'Renee Castillo', email: 'renee.castillo@email.com', phone: '(305) 243-6846', kids: 'Esme (5)', balance: 0, plan: 'Camp and one-off bookings', status: 'Active', since: 'Sep 2025', autopay: true, card: 'Mastercard ···6481 · exp 11/29', heardVia: 'Instagram' },
    { id: 'ocampo', name: 'Ocampo', guardian: 'Emeka Ocampo', email: 'emeka.ocampo@email.com', phone: '(305) 950-8600', kids: 'Antonia (9)', balance: 0, plan: 'Camp and one-off bookings', status: 'Active', since: 'Jan 2026', autopay: true, card: 'Visa ···7171 · exp 05/28', heardVia: 'Google' },
    { id: 'ugalde', name: 'Ugalde', guardian: 'Helen Ugalde', email: 'helen.ugalde@email.com', phone: '(786) 598-4154', kids: 'Haruki (5)', balance: 0, plan: 'Camp and one-off bookings', status: 'Active', since: 'Jan 2026', autopay: true, card: 'Amex ···1303 · exp 05/30', heardVia: 'Sibling already here' },
    { id: 'duarte', name: 'Duarte', guardian: 'Margaret Duarte', email: 'margaret.duarte@email.com', phone: '(305) 523-1681', kids: 'Cormac (6)', balance: 0, plan: 'Camp and one-off bookings', status: 'Active', since: 'Jan 2026', autopay: true, card: 'Amex ···4732 · exp 03/30', heardVia: 'Sibling already here' },
    { id: 'bermudez', name: 'Bermudez', guardian: 'Tamsin Bermudez', email: 'tamsin.bermudez@email.com', phone: '(786) 689-7049', kids: 'Rowan (6)', balance: 0, plan: 'Camp and one-off bookings', status: 'Active', since: 'Aug 2023', autopay: false, card: 'Visa ···4961 · exp 11/29', heardVia: 'Word of mouth' },
    { id: 'brennan',  name: 'Brennan',  guardian: 'Nora Brennan',     email: 'nora.b@email.com',      phone: '(305) 900-2214', kids: 'Cillian (12)',         balance: 0,   plan: '8 hours a month · not renewing',status: 'Cancelling',      since: 'Sep 2024',    autopay: true,  card: 'Amex ···2201 · exp 09/27', heardVia: 'Walked past' }
  ];

  var STUDENTS = [
    { id: 'emma',    name: 'Emma Johnson',    age: 8,  band: '8–11', family: 'Johnson', classIds: ['c2'], planHours: 4,  cls: 'Mon 3:15pm · Studio 2',      flag: 'Allergy · peanuts',        flagKind: 'bad',  att: '96%' },
    { id: 'lucas',   name: 'Lucas Johnson',   age: 10, band: '8–11', family: 'Johnson', classIds: ['c4'], planHours: 4,  cls: 'Wed 3:15pm · Studio 2',      flag: 'Asthma · inhaler in bag',  flagKind: 'bad',  att: '91%' },
    { id: 'zara',    name: 'Zara Okafor',     age: 11, band: '8–11', family: 'Okafor', classIds: ['c4', 'c11'], planHours: 4,   cls: 'Wed 3:15pm · Studio 2',      flag: '',                         flagKind: '',     att: '88%' },
    { id: 'tobi',    name: 'Tobi Okafor',     age: 9,  band: '8–11', family: 'Okafor', classIds: [], planHours: 0,   cls: 'Waitlisted · Mon 3:15pm',    flag: '',                         flagKind: '',     att: '—' },
    { id: 'mia',     name: 'Mia Chen',        age: 6,  band: '5–7',  family: 'Chen', classIds: ['c6'], planHours: 0,     cls: 'Camp week 4 · Studio 1',    flag: 'Tree nuts',                flagKind: 'bad',  att: '100%' },
    { id: 'noah',    name: 'Noah Rivera',     age: 7,  band: '5–7',  family: 'Rivera', classIds: ['c1'], planHours: 4,   cls: 'Mon 2:15pm · Studio 1',      flag: '',                         flagKind: '',     att: '93%' },
    { id: 'ava',     name: 'Ava Smith',       age: 8,  band: '8–11', family: 'Smith', classIds: ['c2'], planHours: 4,    cls: 'Mon 3:15pm · Studio 2',      flag: '',                         flagKind: '',     att: '85%' },
    { id: 'sophia',  name: 'Sophia Martinez', age: 8,  band: '8–11', family: 'Martinez', classIds: ['c2', 'c4', 'c5'], planHours: 16, cls: 'Mon, Wed, Thu',              flag: 'Requires quiet corner',    flagKind: 'warn', att: '98%' },
    { id: 'iker',    name: 'Iker Delgado',    age: 5,  band: '5–7',  family: 'Delgado', classIds: [], planHours: 0,  cls: 'Not yet enrolled',           flag: '',                         flagKind: '',     att: '—' },
    { id: 'luz',     name: 'Luz Delgado',     age: 7,  band: '5–7',  family: 'Delgado', classIds: [], planHours: 0,  cls: 'Not yet enrolled',           flag: '',                         flagKind: '',     att: '—' },
    { id: 'tariqhollis', name: 'Tariq Hollis', age: 7, band: '5–7', family: 'Hollis', classIds: ['c1', 'c6', 'c8'], planHours: 4, flag: '', flagKind: '', att: '94%' },
    { id: 'yaralemaire', name: 'Yara Lemaire', age: 5, band: '5–7', family: 'Lemaire', classIds: ['c1', 'c8', 'c12'], planHours: 4, flag: '', flagKind: '', att: '94%' },
    { id: 'palomahollis', name: 'Paloma Hollis', age: 6, band: '5–7', family: 'Hollis', classIds: ['c1', 'c6'], planHours: 4, flag: '', flagKind: '', att: '88%' },
    { id: 'ariajimenez', name: 'Aria Jimenez', age: 6, band: '5–7', family: 'Jimenez', classIds: ['c1'], planHours: 4, flag: '', flagKind: '', att: '87%' },
    { id: 'irisabreu', name: 'Iris Abreu', age: 5, band: '5–7', family: 'Abreu', classIds: ['c1', 'c6'], planHours: 4, flag: '', flagKind: '', att: '89%' },
    { id: 'soleneokonkwo', name: 'Solene Okonkwo', age: 5, band: '5–7', family: 'Okonkwo', classIds: ['c1', 'c6', 'c8'], planHours: 4, flag: '', flagKind: '', att: '89%' },
    { id: 'ottopereira', name: 'Otto Pereira', age: 5, band: '5–7', family: 'Pereira', classIds: ['c1', 'c6'], planHours: 4, flag: '', flagKind: '', att: '86%' },
    { id: 'odetterocha', name: 'Odette Rocha', age: 5, band: '5–7', family: 'Rocha', classIds: ['c1'], planHours: 4, flag: '', flagKind: '', att: '84%' },
    { id: 'brunocifuentes', name: 'Bruno Cifuentes', age: 5, band: '5–7', family: 'Cifuentes', classIds: ['c1', 'c6'], planHours: 4, flag: '', flagKind: '', att: '90%' },
    { id: 'arloestrada', name: 'Arlo Estrada', age: 7, band: '5–7', family: 'Estrada', classIds: ['c1', 'c6', 'c8'], planHours: 4, flag: '', flagKind: '', att: '94%' },
    { id: 'hanaibrahim', name: 'Hana Ibrahim', age: 8, band: '8–11', family: 'Ibrahim', classIds: ['c2', 'c7'], planHours: 4, flag: '', flagKind: '', att: '98%' },
    { id: 'idrisnkemdirim', name: 'Idris Nkemdirim', age: 9, band: '8–11', family: 'Nkemdirim', classIds: ['c2', 'c7'], planHours: 4, flag: '', flagKind: '', att: '99%' },
    { id: 'renatapereira', name: 'Renata Pereira', age: 11, band: '8–11', family: 'Pereira', classIds: ['c2', 'c7'], planHours: 4, flag: '', flagKind: '', att: '84%' },
    { id: 'maeveokonkwo', name: 'Maeve Okonkwo', age: 10, band: '8–11', family: 'Okonkwo', classIds: ['c2', 'c7'], planHours: 4, flag: 'Allergy · dairy', flagKind: 'bad', att: '97%' },
    { id: 'irisbonilla', name: 'Iris Bonilla', age: 11, band: '8–11', family: 'Bonilla', classIds: ['c2', 'c7'], planHours: 4, flag: '', flagKind: '', att: '88%' },
    { id: 'rowantavares', name: 'Rowan Tavares', age: 11, band: '8–11', family: 'Tavares', classIds: ['c2'], planHours: 4, flag: '', flagKind: '', att: '95%' },
    { id: 'omarfonseca', name: 'Omar Fonseca', age: 8, band: '8–11', family: 'Fonseca', classIds: ['c2', 'c7'], planHours: 4, flag: '', flagKind: '', att: '100%' },
    { id: 'arlobonilla', name: 'Arlo Bonilla', age: 9, band: '8–11', family: 'Bonilla', classIds: ['c2', 'c10'], planHours: 4, flag: '', flagKind: '', att: '88%' },
    { id: 'enzozavala', name: 'Enzo Zavala', age: 10, band: '8–11', family: 'Zavala', classIds: ['c2'], planHours: 4, flag: '', flagKind: '', att: '93%' },
    { id: 'nicolasjimenez', name: 'Nicolas Jimenez', age: 6, band: '5–7', family: 'Jimenez', classIds: ['c3', 'c6'], planHours: 4, flag: '', flagKind: '', att: '94%' },
    { id: 'elenavega', name: 'Elena Vega', age: 7, band: '5–7', family: 'Vega', classIds: ['c3'], planHours: 4, flag: '', flagKind: '', att: '88%' },
    { id: 'kofivaldez', name: 'Kofi Valdez', age: 7, band: '5–7', family: 'Valdez', classIds: ['c3'], planHours: 4, flag: '', flagKind: '', att: '86%' },
    { id: 'hanaespinal', name: 'Hana Espinal', age: 6, band: '5–7', family: 'Espinal', classIds: ['c3', 'c6', 'c8'], planHours: 4, flag: '', flagKind: '', att: '96%' },
    { id: 'declankouassi', name: 'Declan Kouassi', age: 6, band: '5–7', family: 'Kouassi', classIds: ['c3'], planHours: 4, flag: '', flagKind: '', att: '87%' },
    { id: 'anikasalgado', name: 'Anika Salgado', age: 7, band: '5–7', family: 'Salgado', classIds: ['c3', 'c6'], planHours: 4, flag: '', flagKind: '', att: '100%' },
    { id: 'willajansen', name: 'Willa Jansen', age: 7, band: '5–7', family: 'Jansen', classIds: ['c3', 'c6', 'c12'], planHours: 4, flag: '', flagKind: '', att: '92%' },
    { id: 'declanfabre', name: 'Declan Fabre', age: 7, band: '5–7', family: 'Fabre', classIds: ['c3'], planHours: 4, flag: 'Allergy · eggs', flagKind: 'bad', att: '84%' },
    { id: 'esmewanjiru', name: 'Esme Wanjiru', age: 8, band: '8–11', family: 'Wanjiru', classIds: ['c4'], planHours: 4, flag: '', flagKind: '', att: '98%' },
    { id: 'priyanavarro', name: 'Priya Navarro', age: 11, band: '8–11', family: 'Navarro', classIds: ['c4'], planHours: 4, flag: '', flagKind: '', att: '84%' },
    { id: 'rayanbarros', name: 'Rayan Barros', age: 8, band: '8–11', family: 'Barros', classIds: ['c4'], planHours: 4, flag: 'Allergy · latex', flagKind: 'bad', att: '97%' },
    { id: 'marianadelacroix', name: 'Mariana Delacroix', age: 8, band: '8–11', family: 'Delacroix', classIds: ['c4', 'c7', 'c10'], planHours: 4, flag: '', flagKind: '', att: '92%' },
    { id: 'theatoledo', name: 'Thea Toledo', age: 8, band: '8–11', family: 'Toledo', classIds: ['c4'], planHours: 4, flag: '', flagKind: '', att: '94%' },
    { id: 'keikobarros', name: 'Keiko Barros', age: 11, band: '8–11', family: 'Barros', classIds: ['c4', 'c7'], planHours: 4, flag: '', flagKind: '', att: '83%' },
    { id: 'rowanabreu', name: 'Rowan Abreu', age: 9, band: '8–11', family: 'Abreu', classIds: ['c4', 'c7'], planHours: 4, flag: '', flagKind: '', att: '90%' },
    { id: 'rayanfortier', name: 'Rayan Fortier', age: 10, band: '8–11', family: 'Fortier', classIds: ['c4'], planHours: 4, flag: '', flagKind: '', att: '99%' },
    { id: 'hugozavala', name: 'Hugo Zavala', age: 9, band: '8–11', family: 'Zavala', classIds: ['c4'], planHours: 4, flag: '', flagKind: '', att: '82%' },
    { id: 'camilapires', name: 'Camila Pires', age: 13, band: '12+', family: 'Pires', classIds: ['c5', 'c10'], planHours: 8, flag: '', flagKind: '', att: '95%' },
    { id: 'arjunhaddad', name: 'Arjun Haddad', age: 14, band: '12+', family: 'Haddad', classIds: ['c5', 'c12'], planHours: 8, flag: '', flagKind: '', att: '88%' },
    { id: 'marisoljalal', name: 'Marisol Jalal', age: 14, band: '12+', family: 'Jalal', classIds: ['c5', 'c10'], planHours: 8, flag: '', flagKind: '', att: '93%' },
    { id: 'imaniklein', name: 'Imani Klein', age: 13, band: '12+', family: 'Klein', classIds: ['c5', 'c12'], planHours: 8, flag: '', flagKind: '', att: '99%' },
    { id: 'harukiwhitlock', name: 'Haruki Whitlock', age: 14, band: '12+', family: 'Whitlock', classIds: ['c5'], planHours: 8, flag: '', flagKind: '', att: '84%' },
    { id: 'arloguerrero', name: 'Arlo Guerrero', age: 14, band: '12+', family: 'Guerrero', classIds: ['c5'], planHours: 8, flag: '', flagKind: '', att: '96%' },
    { id: 'milomoreau', name: 'Milo Moreau', age: 14, band: '12+', family: 'Moreau', classIds: ['c5'], planHours: 8, flag: '', flagKind: '', att: '98%' },
    { id: 'keikolund', name: 'Keiko Lund', age: 12, band: '12+', family: 'Lund', classIds: ['c5', 'c10', 'c12'], planHours: 8, flag: '', flagKind: '', att: '88%' },
    { id: 'marisolidowu', name: 'Marisol Idowu', age: 12, band: '12+', family: 'Idowu', classIds: ['c5'], planHours: 8, flag: 'Wears hearing aids', flagKind: 'warn', att: '96%' },
    { id: 'ariarestrepo', name: 'Aria Restrepo', age: 12, band: '12+', family: 'Restrepo', classIds: ['c5'], planHours: 8, flag: '', flagKind: '', att: '83%' },
    { id: 'valentinayusuf', name: 'Valentina Yusuf', age: 14, band: '12+', family: 'Yusuf', classIds: ['c5', 'c10'], planHours: 8, flag: '', flagKind: '', att: '93%' },
    { id: 'ninaiglesias', name: 'Nina Iglesias', age: 7, band: '5–7', family: 'Iglesias', classIds: ['c6', 'c12'], planHours: 0, flag: '', flagKind: '', att: '86%' },
    { id: 'rayancardoso', name: 'Rayan Cardoso', age: 5, band: '5–7', family: 'Cardoso', classIds: ['c6', 'c8'], planHours: 0, flag: '', flagKind: '', att: '88%' },
    { id: 'freyagalvez', name: 'Freya Galvez', age: 7, band: '5–7', family: 'Galvez', classIds: ['c6', 'c12'], planHours: 0, flag: '', flagKind: '', att: '87%' },
    { id: 'rosadorsey', name: 'Rosa Dorsey', age: 7, band: '5–7', family: 'Dorsey', classIds: ['c6'], planHours: 0, flag: '', flagKind: '', att: '96%' },
    { id: 'arloybarra', name: 'Arlo Ybarra', age: 5, band: '5–7', family: 'Ybarra', classIds: ['c6'], planHours: 0, flag: '', flagKind: '', att: '87%' },
    { id: 'saoirsealvarez', name: 'Saoirse Alvarez', age: 5, band: '5–7', family: 'Alvarez', classIds: ['c6'], planHours: 0, flag: '', flagKind: '', att: '98%' },
    { id: 'oscarzamora', name: 'Oscar Zamora', age: 10, band: '8–11', family: 'Zamora', classIds: ['c7', 'c10'], planHours: 0, flag: 'Asthma · inhaler in bag', flagKind: 'bad', att: '87%' },
    { id: 'theagrimaldi', name: 'Thea Grimaldi', age: 8, band: '8–11', family: 'Grimaldi', classIds: ['c7', 'c10'], planHours: 0, flag: '', flagKind: '', att: '83%' },
    { id: 'andresquintero', name: 'Andres Quintero', age: 11, band: '8–11', family: 'Quintero', classIds: ['c7', 'c10'], planHours: 0, flag: '', flagKind: '', att: '85%' },
    { id: 'ninaserrano', name: 'Nina Serrano', age: 9, band: '8–11', family: 'Serrano', classIds: ['c7'], planHours: 0, flag: '', flagKind: '', att: '82%' },
    { id: 'declankilbride', name: 'Declan Kilbride', age: 8, band: '8–11', family: 'Kilbride', classIds: ['c7'], planHours: 0, flag: '', flagKind: '', att: '87%' },
    { id: 'marianaherrera', name: 'Mariana Herrera', age: 6, band: '5–7', family: 'Herrera', classIds: ['c8'], planHours: 0, flag: 'Allergy · shellfish', flagKind: 'bad', att: '97%' },
    { id: 'amelieximenes', name: 'Amelie Ximenes', age: 5, band: '5–7', family: 'Ximenes', classIds: ['c8'], planHours: 0, flag: '', flagKind: '', att: '95%' },
    { id: 'mateoescobar', name: 'Mateo Escobar', age: 6, band: '5–7', family: 'Escobar', classIds: ['c8', 'c12'], planHours: 0, flag: '', flagKind: '', att: '84%' },
    { id: 'odetteurbina', name: 'Odette Urbina', age: 9, band: '8–11', family: 'Urbina', classIds: ['c10'], planHours: 0, flag: '', flagKind: '', att: '95%' },
    { id: 'jonahmaldonado', name: 'Jonah Maldonado', age: 10, band: '8–11', family: 'Maldonado', classIds: ['c10', 'c12'], planHours: 0, flag: 'Needs a quiet corner', flagKind: 'warn', att: '84%' },
    { id: 'esmecastillo', name: 'Esme Castillo', age: 5, band: '5–7', family: 'Castillo', classIds: ['c10'], planHours: 0, flag: 'Epilepsy · see care plan', flagKind: 'bad', att: '86%' },
    { id: 'antoniaocampo', name: 'Antonia Ocampo', age: 9, band: '8–11', family: 'Ocampo', classIds: ['c10', 'c12'], planHours: 0, flag: '', flagKind: '', att: '91%' },
    { id: 'harukiugalde', name: 'Haruki Ugalde', age: 5, band: '5–7', family: 'Ugalde', classIds: ['c10'], planHours: 0, flag: '', flagKind: '', att: '82%' },
    { id: 'cormacduarte', name: 'Cormac Duarte', age: 6, band: '5–7', family: 'Duarte', classIds: ['c12'], planHours: 0, flag: '', flagKind: '', att: '94%' },
    { id: 'rowanbermudez', name: 'Rowan Bermudez', age: 6, band: '5–7', family: 'Bermudez', classIds: ['c12'], planHours: 0, flag: '', flagKind: '', att: '92%' },
    { id: 'cillian', name: 'Cillian Brennan', age: 12, band: '12+',  family: 'Brennan', classIds: ['c5'], planHours: 8,  cls: 'Thu 4:30pm · 2-hour',        flag: '',                         flagKind: '',     att: '79%' }
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
    { id: 'INV-2841', fam: 'Okafor',   date: '1 Jul 2026',  due: '8 Jul 2026', amt: 540, status: 'Failed',            kind: 'bad',  method: 'Visa ···4417',       note: 'August cycle for Zara. Card declined — insufficient funds. 2 retries.' },
    { id: 'INV-2842', fam: 'Johnson',  date: '20 Jul 2026', due: '27 Jul 2026', amt: 18,  status: 'Past due',          kind: 'bad',  method: 'Visa ···1183',       note: 'Late pickup — 15 minutes on 20 July.' },
    { id: 'INV-2840', fam: 'Smith',    date: '1 Jul 2026',  due: '8 Jul 2026', amt: 45,  status: 'Past due',          kind: 'bad',  method: 'Mastercard ···9902', note: 'Late pickup fee, 45 minutes across 3 days.' },
    { id: 'INV-2839', fam: 'Delgado',  date: '27 Jul 2026', due: 'On receipt', amt: 200, status: 'Awaiting payment',  kind: 'warn', method: 'None saved',         note: 'Registration and a first cycle, held until 30 Jul.' },
    { id: 'INV-2838', fam: 'Johnson',  date: '1 Jul 2026',  due: '8 Jul 2026', amt: 820, status: 'Paid',              kind: 'ok',   method: 'Visa ···1183',       note: '' },
    { id: 'INV-2837', fam: 'Martinez', date: '1 Jul 2026',  due: '8 Jul 2026', amt: 780, status: 'Paid',              kind: 'ok',   method: 'ACH ···6620',        note: '' },
    { id: 'INV-2836', fam: 'Chen',     date: '12 Jul 2026', due: 'On receipt', amt: 415, status: 'Paid',              kind: 'ok',   method: 'Visa ···0091',       note: 'Camp week 4 plus one extra hour.' },
    { id: 'INV-2835', fam: 'Rivera',   date: '1 Jul 2026',  due: '8 Jul 2026', amt: 280, status: 'Paid',              kind: 'ok',   method: 'Visa ···7734',       note: '' },
    { id: 'INV-2843', fam: 'Hollis', date: '1 Jul 2026', due: '8 Jul 2026', amt: 540, status: 'Paid', kind: 'ok', method: 'Mastercard ···4289', note: '' },
    { id: 'INV-2844', fam: 'Lemaire', date: '1 Jul 2026', due: '8 Jul 2026', amt: 280, status: 'Paid', kind: 'ok', method: 'Amex ···7620', note: '' },
    { id: 'INV-2845', fam: 'Jimenez', date: '1 Jul 2026', due: '8 Jul 2026', amt: 540, status: 'Paid', kind: 'ok', method: 'Mastercard ···1914', note: '' },
    { id: 'INV-2846', fam: 'Abreu', date: '1 Jul 2026', due: '8 Jul 2026', amt: 540, status: 'Paid', kind: 'ok', method: 'Mastercard ···3037', note: '' },
    { id: 'INV-2847', fam: 'Okonkwo', date: '1 Jul 2026', due: '8 Jul 2026', amt: 540, status: 'Paid', kind: 'ok', method: 'Visa ···3910', note: '' },
    { id: 'INV-2848', fam: 'Pereira', date: '1 Jul 2026', due: '8 Jul 2026', amt: 540, status: 'Paid', kind: 'ok', method: 'Amex ···6228', note: '' },
    { id: 'INV-2849', fam: 'Rocha', date: '1 Jul 2026', due: '8 Jul 2026', amt: 280, status: 'Paid', kind: 'ok', method: 'Visa ···6926', note: '' },
    { id: 'INV-2850', fam: 'Cifuentes', date: '1 Jul 2026', due: '8 Jul 2026', amt: 280, status: 'Paid', kind: 'ok', method: 'Visa ···1781', note: '' },
    { id: 'INV-2851', fam: 'Estrada', date: '1 Jul 2026', due: '8 Jul 2026', amt: 280, status: 'Paid', kind: 'ok', method: 'Mastercard ···7543', note: '' },
    { id: 'INV-2852', fam: 'Ibrahim', date: '1 Jul 2026', due: '8 Jul 2026', amt: 280, status: 'Paid', kind: 'ok', method: 'Amex ···2518', note: '' },
    { id: 'INV-2853', fam: 'Nkemdirim', date: '1 Jul 2026', due: '8 Jul 2026', amt: 280, status: 'Paid', kind: 'ok', method: 'Amex ···7530', note: '' },
    { id: 'INV-2854', fam: 'Bonilla', date: '1 Jul 2026', due: '8 Jul 2026', amt: 540, status: 'Paid', kind: 'ok', method: 'Amex ···4703', note: '' },
    { id: 'INV-2855', fam: 'Tavares', date: '1 Jul 2026', due: '8 Jul 2026', amt: 280, status: 'Paid', kind: 'ok', method: 'Amex ···6143', note: '' },
    { id: 'INV-2856', fam: 'Fonseca', date: '1 Jul 2026', due: '8 Jul 2026', amt: 280, status: 'Paid', kind: 'ok', method: 'Mastercard ···2312', note: '' },
    { id: 'INV-2857', fam: 'Zavala', date: '1 Jul 2026', due: '8 Jul 2026', amt: 540, status: 'Paid', kind: 'ok', method: 'Mastercard ···2141', note: '' },
    { id: 'INV-2858', fam: 'Vega', date: '1 Jul 2026', due: '8 Jul 2026', amt: 280, status: 'Paid', kind: 'ok', method: 'Mastercard ···8816', note: '' },
    { id: 'INV-2859', fam: 'Valdez', date: '1 Jul 2026', due: '8 Jul 2026', amt: 280, status: 'Paid', kind: 'ok', method: 'Mastercard ···8060', note: '' },
    { id: 'INV-2860', fam: 'Espinal', date: '1 Jul 2026', due: '8 Jul 2026', amt: 280, status: 'Paid', kind: 'ok', method: 'Amex ···3611', note: '' },
    { id: 'INV-2861', fam: 'Kouassi', date: '1 Jul 2026', due: '8 Jul 2026', amt: 280, status: 'Paid', kind: 'ok', method: 'Amex ···8209', note: '' },
    { id: 'INV-2862', fam: 'Salgado', date: '1 Jul 2026', due: '8 Jul 2026', amt: 280, status: 'Paid', kind: 'ok', method: 'Visa ···6658', note: '' },
    { id: 'INV-2863', fam: 'Jansen', date: '1 Jul 2026', due: '8 Jul 2026', amt: 280, status: 'Paid', kind: 'ok', method: 'Visa ···3812', note: '' },
    { id: 'INV-2864', fam: 'Fabre', date: '1 Jul 2026', due: '8 Jul 2026', amt: 280, status: 'Paid', kind: 'ok', method: 'Amex ···4788', note: '' },
    { id: 'INV-2865', fam: 'Wanjiru', date: '1 Jul 2026', due: '8 Jul 2026', amt: 280, status: 'Paid', kind: 'ok', method: 'Visa ···2840', note: '' },
    { id: 'INV-2866', fam: 'Navarro', date: '1 Jul 2026', due: '8 Jul 2026', amt: 280, status: 'Paid', kind: 'ok', method: 'Mastercard ···3742', note: '' },
    { id: 'INV-2867', fam: 'Barros', date: '1 Jul 2026', due: '8 Jul 2026', amt: 540, status: 'Paid', kind: 'ok', method: 'Mastercard ···7829', note: '' },
    { id: 'INV-2868', fam: 'Delacroix', date: '1 Jul 2026', due: '8 Jul 2026', amt: 280, status: 'Paid', kind: 'ok', method: 'Visa ···2722', note: '' },
    { id: 'INV-2869', fam: 'Toledo', date: '1 Jul 2026', due: '8 Jul 2026', amt: 280, status: 'Paid', kind: 'ok', method: 'Visa ···7828', note: '' },
    { id: 'INV-2870', fam: 'Fortier', date: '1 Jul 2026', due: '8 Jul 2026', amt: 280, status: 'Paid', kind: 'ok', method: 'Amex ···5836', note: '' },
    { id: 'INV-2871', fam: 'Pires', date: '1 Jul 2026', due: '8 Jul 2026', amt: 280, status: 'Paid', kind: 'ok', method: 'Mastercard ···7528', note: '' },
    { id: 'INV-2872', fam: 'Haddad', date: '1 Jul 2026', due: '8 Jul 2026', amt: 280, status: 'Paid', kind: 'ok', method: 'Visa ···3140', note: '' },
    { id: 'INV-2873', fam: 'Jalal', date: '1 Jul 2026', due: '8 Jul 2026', amt: 280, status: 'Paid', kind: 'ok', method: 'Amex ···3930', note: '' },
    { id: 'INV-2874', fam: 'Klein', date: '1 Jul 2026', due: '8 Jul 2026', amt: 280, status: 'Paid', kind: 'ok', method: 'Mastercard ···7269', note: '' },
    { id: 'INV-2875', fam: 'Whitlock', date: '1 Jul 2026', due: '8 Jul 2026', amt: 280, status: 'Paid', kind: 'ok', method: 'Amex ···8804', note: '' },
    { id: 'INV-2876', fam: 'Guerrero', date: '1 Jul 2026', due: '8 Jul 2026', amt: 280, status: 'Paid', kind: 'ok', method: 'Amex ···4925', note: '' },
    { id: 'INV-2877', fam: 'Moreau', date: '1 Jul 2026', due: '8 Jul 2026', amt: 280, status: 'Paid', kind: 'ok', method: 'Mastercard ···2182', note: '' },
    { id: 'INV-2878', fam: 'Lund', date: '1 Jul 2026', due: '8 Jul 2026', amt: 280, status: 'Paid', kind: 'ok', method: 'Amex ···5511', note: '' },
    { id: 'INV-2879', fam: 'Idowu', date: '1 Jul 2026', due: '8 Jul 2026', amt: 280, status: 'Paid', kind: 'ok', method: 'Mastercard ···5285', note: '' },
    { id: 'INV-2880', fam: 'Restrepo', date: '1 Jul 2026', due: '8 Jul 2026', amt: 280, status: 'Paid', kind: 'ok', method: 'Visa ···7508', note: '' },
    { id: 'INV-2881', fam: 'Yusuf', date: '1 Jul 2026', due: '8 Jul 2026', amt: 280, status: 'Paid', kind: 'ok', method: 'Visa ···5786', note: '' },
    { id: 'INV-2882', fam: 'Iglesias', date: '1 Jul 2026', due: '8 Jul 2026', amt: 400, status: 'Paid', kind: 'ok', method: 'Mastercard ···4761', note: '' },
    { id: 'INV-2883', fam: 'Cardoso', date: '1 Jul 2026', due: '8 Jul 2026', amt: 400, status: 'Paid', kind: 'ok', method: 'Mastercard ···5513', note: '' },
    { id: 'INV-2884', fam: 'Galvez', date: '1 Jul 2026', due: '8 Jul 2026', amt: 400, status: 'Paid', kind: 'ok', method: 'Visa ···3844', note: '' },
    { id: 'INV-2885', fam: 'Dorsey', date: '1 Jul 2026', due: '8 Jul 2026', amt: 400, status: 'Paid', kind: 'ok', method: 'Amex ···2334', note: '' },
    { id: 'INV-2886', fam: 'Ybarra', date: '1 Jul 2026', due: '8 Jul 2026', amt: 400, status: 'Paid', kind: 'ok', method: 'Visa ···3460', note: '' },
    { id: 'INV-2887', fam: 'Alvarez', date: '1 Jul 2026', due: '8 Jul 2026', amt: 400, status: 'Paid', kind: 'ok', method: 'Amex ···7213', note: '' },
    { id: 'INV-2888', fam: 'Zamora', date: '1 Jul 2026', due: '8 Jul 2026', amt: 400, status: 'Paid', kind: 'ok', method: 'Amex ···4793', note: '' },
    { id: 'INV-2889', fam: 'Grimaldi', date: '1 Jul 2026', due: '8 Jul 2026', amt: 400, status: 'Paid', kind: 'ok', method: 'Visa ···6609', note: '' },
    { id: 'INV-2890', fam: 'Quintero', date: '1 Jul 2026', due: '8 Jul 2026', amt: 400, status: 'Paid', kind: 'ok', method: 'Visa ···2820', note: '' },
    { id: 'INV-2891', fam: 'Serrano', date: '1 Jul 2026', due: '8 Jul 2026', amt: 400, status: 'Paid', kind: 'ok', method: 'Amex ···1205', note: '' },
    { id: 'INV-2892', fam: 'Kilbride', date: '1 Jul 2026', due: '8 Jul 2026', amt: 400, status: 'Paid', kind: 'ok', method: 'Visa ···4856', note: '' },
    { id: 'INV-2893', fam: 'Herrera', date: '1 Jul 2026', due: '8 Jul 2026', amt: 400, status: 'Paid', kind: 'ok', method: 'Amex ···2313', note: '' },
    { id: 'INV-2894', fam: 'Ximenes', date: '1 Jul 2026', due: '8 Jul 2026', amt: 400, status: 'Paid', kind: 'ok', method: 'Mastercard ···5145', note: '' },
    { id: 'INV-2895', fam: 'Escobar', date: '1 Jul 2026', due: '8 Jul 2026', amt: 400, status: 'Paid', kind: 'ok', method: 'Visa ···5925', note: '' },
    { id: 'INV-2896', fam: 'Urbina', date: '1 Jul 2026', due: '8 Jul 2026', amt: 400, status: 'Paid', kind: 'ok', method: 'Mastercard ···5845', note: '' },
    { id: 'INV-2897', fam: 'Maldonado', date: '1 Jul 2026', due: '8 Jul 2026', amt: 400, status: 'Paid', kind: 'ok', method: 'Visa ···1660', note: '' },
    { id: 'INV-2898', fam: 'Castillo', date: '1 Jul 2026', due: '8 Jul 2026', amt: 400, status: 'Paid', kind: 'ok', method: 'Mastercard ···6481', note: '' },
    { id: 'INV-2899', fam: 'Ocampo', date: '1 Jul 2026', due: '8 Jul 2026', amt: 400, status: 'Paid', kind: 'ok', method: 'Visa ···7171', note: '' },
    { id: 'INV-2900', fam: 'Ugalde', date: '1 Jul 2026', due: '8 Jul 2026', amt: 400, status: 'Paid', kind: 'ok', method: 'Amex ···1303', note: '' },
    { id: 'INV-2901', fam: 'Duarte', date: '1 Jul 2026', due: '8 Jul 2026', amt: 400, status: 'Paid', kind: 'ok', method: 'Amex ···4732', note: '' },
    { id: 'INV-2902', fam: 'Bermudez', date: '1 Jul 2026', due: '8 Jul 2026', amt: 400, status: 'Paid', kind: 'ok', method: 'Visa ···4961', note: '' },
    { id: 'INV-2834', fam: 'Brennan',  date: '1 Jul 2026',  due: '8 Jul 2026', amt: 540, status: 'Paid',              kind: 'ok',   method: 'Amex ···2201',       note: 'Last cycle. The family gave notice and the plan ends with the school year.' }
  ];

  var WAITLIST = [
    { id: 'w1', cls: 'Mon 3:15pm · Ages 8–11', child: 'Tobi Okafor',     fam: 'Okafor',   joined: '14 Jul', pos: 1 },
    { id: 'w2', cls: 'Mon 3:15pm · Ages 8–11', child: 'Ines Duarte',     fam: 'Duarte',   joined: '16 Jul', pos: 2 },
    { id: 'w3', cls: 'Wed 3:15pm · Ages 8–11', child: 'Sami Haddad',     fam: 'Haddad',   joined: '18 Jul', pos: 1 },
    { id: 'w4', cls: 'Thu 4:30pm · 2-hour',    child: 'Cillian Brennan', fam: 'Brennan',  joined: '20 Jul', pos: 1 },
    { id: 'w5', cls: 'Mon 3:15pm · Ages 8–11', child: 'Bea Whitlock',    fam: 'Whitlock', joined: '22 Jul', pos: 3 },
    { id: 'w6', cls: 'Wed 3:15pm · Ages 8–11', child: 'Otis Lund',       fam: 'Lund',     joined: '25 Jul', pos: 2 }
  ];

  /* The dated schedule. A plan is a number of HOURS a month; these are the
     classes that use them up. The parent picks the day and time at
     registration and they are fixed for the program year, so a cycle is just
     the next few dates on that pattern. `state` is scheduled, attended,
     missed or moved. */
  var SESSIONS = [
    { child: 'emma', classId: 'c2', date: '2026-07-13', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'emma', classId: 'c2', date: '2026-07-20', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'emma', classId: 'c2', date: '2026-07-27', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'emma', classId: 'c2', date: '2026-08-03', at: '3:15pm', hours: 1, state: 'scheduled' },
    { child: 'lucas', classId: 'c4', date: '2026-07-15', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'lucas', classId: 'c4', date: '2026-07-22', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'lucas', classId: 'c4', date: '2026-07-29', at: '3:15pm', hours: 1, state: 'scheduled' },
    { child: 'lucas', classId: 'c4', date: '2026-08-05', at: '3:15pm', hours: 1, state: 'scheduled' },
    { child: 'zara', classId: 'c4', date: '2026-07-22', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'zara', classId: 'c4', date: '2026-07-29', at: '3:15pm', hours: 1, state: 'scheduled' },
    { child: 'zara', classId: 'c4', date: '2026-08-05', at: '3:15pm', hours: 1, state: 'scheduled' },
    { child: 'zara', classId: 'c4', date: '2026-08-12', at: '3:15pm', hours: 1, state: 'scheduled' },
    { child: 'noah', classId: 'c1', date: '2026-07-13', at: '2:15pm', hours: 1, state: 'attended' },
    { child: 'noah', classId: 'c1', date: '2026-07-20', at: '2:15pm', hours: 1, state: 'attended' },
    { child: 'noah', classId: 'c1', date: '2026-07-27', at: '2:15pm', hours: 1, state: 'attended' },
    { child: 'noah', classId: 'c1', date: '2026-08-03', at: '2:15pm', hours: 1, state: 'scheduled' },
    { child: 'ava', classId: 'c2', date: '2026-07-20', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'ava', classId: 'c2', date: '2026-07-27', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'ava', classId: 'c2', date: '2026-08-03', at: '3:15pm', hours: 1, state: 'scheduled' },
    { child: 'ava', classId: 'c2', date: '2026-08-10', at: '3:15pm', hours: 1, state: 'scheduled' },
    { child: 'sophia', classId: 'c2', date: '2026-07-13', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'sophia', classId: 'c4', date: '2026-07-15', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'sophia', classId: 'c5', date: '2026-07-16', at: '4:30pm', hours: 2, state: 'attended' },
    { child: 'sophia', classId: 'c2', date: '2026-07-20', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'sophia', classId: 'c4', date: '2026-07-22', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'sophia', classId: 'c5', date: '2026-07-23', at: '4:30pm', hours: 2, state: 'attended' },
    { child: 'sophia', classId: 'c2', date: '2026-07-27', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'sophia', classId: 'c4', date: '2026-07-29', at: '3:15pm', hours: 1, state: 'scheduled' },
    { child: 'sophia', classId: 'c5', date: '2026-07-30', at: '4:30pm', hours: 2, state: 'scheduled' },
    { child: 'sophia', classId: 'c2', date: '2026-08-03', at: '3:15pm', hours: 1, state: 'scheduled' },
    { child: 'sophia', classId: 'c4', date: '2026-08-05', at: '3:15pm', hours: 1, state: 'scheduled' },
    { child: 'sophia', classId: 'c5', date: '2026-08-06', at: '4:30pm', hours: 2, state: 'scheduled' },
    { child: 'tariqhollis', classId: 'c1', date: '2026-07-20', at: '2:15pm', hours: 1, state: 'attended' },
    { child: 'tariqhollis', classId: 'c1', date: '2026-07-27', at: '2:15pm', hours: 1, state: 'attended' },
    { child: 'tariqhollis', classId: 'c1', date: '2026-08-03', at: '2:15pm', hours: 1, state: 'scheduled' },
    { child: 'tariqhollis', classId: 'c1', date: '2026-08-10', at: '2:15pm', hours: 1, state: 'scheduled' },
    { child: 'yaralemaire', classId: 'c1', date: '2026-07-13', at: '2:15pm', hours: 1, state: 'attended' },
    { child: 'yaralemaire', classId: 'c1', date: '2026-07-20', at: '2:15pm', hours: 1, state: 'attended' },
    { child: 'yaralemaire', classId: 'c1', date: '2026-07-27', at: '2:15pm', hours: 1, state: 'attended' },
    { child: 'yaralemaire', classId: 'c1', date: '2026-08-03', at: '2:15pm', hours: 1, state: 'scheduled' },
    { child: 'palomahollis', classId: 'c1', date: '2026-07-13', at: '2:15pm', hours: 1, state: 'attended' },
    { child: 'palomahollis', classId: 'c1', date: '2026-07-20', at: '2:15pm', hours: 1, state: 'attended' },
    { child: 'palomahollis', classId: 'c1', date: '2026-07-27', at: '2:15pm', hours: 1, state: 'attended' },
    { child: 'palomahollis', classId: 'c1', date: '2026-08-03', at: '2:15pm', hours: 1, state: 'scheduled' },
    { child: 'ariajimenez', classId: 'c1', date: '2026-07-13', at: '2:15pm', hours: 1, state: 'attended' },
    { child: 'ariajimenez', classId: 'c1', date: '2026-07-20', at: '2:15pm', hours: 1, state: 'attended' },
    { child: 'ariajimenez', classId: 'c1', date: '2026-07-27', at: '2:15pm', hours: 1, state: 'attended' },
    { child: 'ariajimenez', classId: 'c1', date: '2026-08-03', at: '2:15pm', hours: 1, state: 'scheduled' },
    { child: 'irisabreu', classId: 'c1', date: '2026-07-13', at: '2:15pm', hours: 1, state: 'attended' },
    { child: 'irisabreu', classId: 'c1', date: '2026-07-20', at: '2:15pm', hours: 1, state: 'attended' },
    { child: 'irisabreu', classId: 'c1', date: '2026-07-27', at: '2:15pm', hours: 1, state: 'attended' },
    { child: 'irisabreu', classId: 'c1', date: '2026-08-03', at: '2:15pm', hours: 1, state: 'scheduled' },
    { child: 'soleneokonkwo', classId: 'c1', date: '2026-07-20', at: '2:15pm', hours: 1, state: 'attended' },
    { child: 'soleneokonkwo', classId: 'c1', date: '2026-07-27', at: '2:15pm', hours: 1, state: 'attended' },
    { child: 'soleneokonkwo', classId: 'c1', date: '2026-08-03', at: '2:15pm', hours: 1, state: 'scheduled' },
    { child: 'soleneokonkwo', classId: 'c1', date: '2026-08-10', at: '2:15pm', hours: 1, state: 'scheduled' },
    { child: 'ottopereira', classId: 'c1', date: '2026-07-20', at: '2:15pm', hours: 1, state: 'attended' },
    { child: 'ottopereira', classId: 'c1', date: '2026-07-27', at: '2:15pm', hours: 1, state: 'attended' },
    { child: 'ottopereira', classId: 'c1', date: '2026-08-03', at: '2:15pm', hours: 1, state: 'scheduled' },
    { child: 'ottopereira', classId: 'c1', date: '2026-08-10', at: '2:15pm', hours: 1, state: 'scheduled' },
    { child: 'odetterocha', classId: 'c1', date: '2026-07-13', at: '2:15pm', hours: 1, state: 'attended' },
    { child: 'odetterocha', classId: 'c1', date: '2026-07-20', at: '2:15pm', hours: 1, state: 'attended' },
    { child: 'odetterocha', classId: 'c1', date: '2026-07-27', at: '2:15pm', hours: 1, state: 'attended' },
    { child: 'odetterocha', classId: 'c1', date: '2026-08-03', at: '2:15pm', hours: 1, state: 'scheduled' },
    { child: 'brunocifuentes', classId: 'c1', date: '2026-07-13', at: '2:15pm', hours: 1, state: 'attended' },
    { child: 'brunocifuentes', classId: 'c1', date: '2026-07-20', at: '2:15pm', hours: 1, state: 'attended' },
    { child: 'brunocifuentes', classId: 'c1', date: '2026-07-27', at: '2:15pm', hours: 1, state: 'attended' },
    { child: 'brunocifuentes', classId: 'c1', date: '2026-08-03', at: '2:15pm', hours: 1, state: 'scheduled' },
    { child: 'arloestrada', classId: 'c1', date: '2026-07-13', at: '2:15pm', hours: 1, state: 'attended' },
    { child: 'arloestrada', classId: 'c1', date: '2026-07-20', at: '2:15pm', hours: 1, state: 'attended' },
    { child: 'arloestrada', classId: 'c1', date: '2026-07-27', at: '2:15pm', hours: 1, state: 'attended' },
    { child: 'arloestrada', classId: 'c1', date: '2026-08-03', at: '2:15pm', hours: 1, state: 'scheduled' },
    { child: 'hanaibrahim', classId: 'c2', date: '2026-07-13', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'hanaibrahim', classId: 'c2', date: '2026-07-20', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'hanaibrahim', classId: 'c2', date: '2026-07-27', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'hanaibrahim', classId: 'c2', date: '2026-08-03', at: '3:15pm', hours: 1, state: 'scheduled' },
    { child: 'idrisnkemdirim', classId: 'c2', date: '2026-07-13', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'idrisnkemdirim', classId: 'c2', date: '2026-07-20', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'idrisnkemdirim', classId: 'c2', date: '2026-07-27', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'idrisnkemdirim', classId: 'c2', date: '2026-08-03', at: '3:15pm', hours: 1, state: 'scheduled' },
    { child: 'renatapereira', classId: 'c2', date: '2026-07-13', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'renatapereira', classId: 'c2', date: '2026-07-20', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'renatapereira', classId: 'c2', date: '2026-07-27', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'renatapereira', classId: 'c2', date: '2026-08-03', at: '3:15pm', hours: 1, state: 'scheduled' },
    { child: 'maeveokonkwo', classId: 'c2', date: '2026-07-13', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'maeveokonkwo', classId: 'c2', date: '2026-07-20', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'maeveokonkwo', classId: 'c2', date: '2026-07-27', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'maeveokonkwo', classId: 'c2', date: '2026-08-03', at: '3:15pm', hours: 1, state: 'scheduled' },
    { child: 'irisbonilla', classId: 'c2', date: '2026-07-13', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'irisbonilla', classId: 'c2', date: '2026-07-20', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'irisbonilla', classId: 'c2', date: '2026-07-27', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'irisbonilla', classId: 'c2', date: '2026-08-03', at: '3:15pm', hours: 1, state: 'scheduled' },
    { child: 'rowantavares', classId: 'c2', date: '2026-07-13', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'rowantavares', classId: 'c2', date: '2026-07-20', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'rowantavares', classId: 'c2', date: '2026-07-27', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'rowantavares', classId: 'c2', date: '2026-08-03', at: '3:15pm', hours: 1, state: 'scheduled' },
    { child: 'omarfonseca', classId: 'c2', date: '2026-07-13', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'omarfonseca', classId: 'c2', date: '2026-07-20', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'omarfonseca', classId: 'c2', date: '2026-07-27', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'omarfonseca', classId: 'c2', date: '2026-08-03', at: '3:15pm', hours: 1, state: 'scheduled' },
    { child: 'arlobonilla', classId: 'c2', date: '2026-07-13', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'arlobonilla', classId: 'c2', date: '2026-07-20', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'arlobonilla', classId: 'c2', date: '2026-07-27', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'arlobonilla', classId: 'c2', date: '2026-08-03', at: '3:15pm', hours: 1, state: 'scheduled' },
    { child: 'enzozavala', classId: 'c2', date: '2026-07-13', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'enzozavala', classId: 'c2', date: '2026-07-20', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'enzozavala', classId: 'c2', date: '2026-07-27', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'enzozavala', classId: 'c2', date: '2026-08-03', at: '3:15pm', hours: 1, state: 'scheduled' },
    { child: 'nicolasjimenez', classId: 'c3', date: '2026-07-21', at: '2:00pm', hours: 1, state: 'attended' },
    { child: 'nicolasjimenez', classId: 'c3', date: '2026-07-28', at: '2:00pm', hours: 1, state: 'scheduled' },
    { child: 'nicolasjimenez', classId: 'c3', date: '2026-08-04', at: '2:00pm', hours: 1, state: 'scheduled' },
    { child: 'nicolasjimenez', classId: 'c3', date: '2026-08-11', at: '2:00pm', hours: 1, state: 'scheduled' },
    { child: 'elenavega', classId: 'c3', date: '2026-07-07', at: '2:00pm', hours: 1, state: 'attended' },
    { child: 'elenavega', classId: 'c3', date: '2026-07-14', at: '2:00pm', hours: 1, state: 'attended' },
    { child: 'elenavega', classId: 'c3', date: '2026-07-21', at: '2:00pm', hours: 1, state: 'attended' },
    { child: 'elenavega', classId: 'c3', date: '2026-07-28', at: '2:00pm', hours: 1, state: 'scheduled' },
    { child: 'kofivaldez', classId: 'c3', date: '2026-07-14', at: '2:00pm', hours: 1, state: 'attended' },
    { child: 'kofivaldez', classId: 'c3', date: '2026-07-21', at: '2:00pm', hours: 1, state: 'attended' },
    { child: 'kofivaldez', classId: 'c3', date: '2026-07-28', at: '2:00pm', hours: 1, state: 'scheduled' },
    { child: 'kofivaldez', classId: 'c3', date: '2026-08-04', at: '2:00pm', hours: 1, state: 'scheduled' },
    { child: 'hanaespinal', classId: 'c3', date: '2026-07-14', at: '2:00pm', hours: 1, state: 'attended' },
    { child: 'hanaespinal', classId: 'c3', date: '2026-07-21', at: '2:00pm', hours: 1, state: 'attended' },
    { child: 'hanaespinal', classId: 'c3', date: '2026-07-28', at: '2:00pm', hours: 1, state: 'scheduled' },
    { child: 'hanaespinal', classId: 'c3', date: '2026-08-04', at: '2:00pm', hours: 1, state: 'scheduled' },
    { child: 'declankouassi', classId: 'c3', date: '2026-07-21', at: '2:00pm', hours: 1, state: 'attended' },
    { child: 'declankouassi', classId: 'c3', date: '2026-07-28', at: '2:00pm', hours: 1, state: 'scheduled' },
    { child: 'declankouassi', classId: 'c3', date: '2026-08-04', at: '2:00pm', hours: 1, state: 'scheduled' },
    { child: 'declankouassi', classId: 'c3', date: '2026-08-11', at: '2:00pm', hours: 1, state: 'scheduled' },
    { child: 'anikasalgado', classId: 'c3', date: '2026-07-07', at: '2:00pm', hours: 1, state: 'attended' },
    { child: 'anikasalgado', classId: 'c3', date: '2026-07-14', at: '2:00pm', hours: 1, state: 'attended' },
    { child: 'anikasalgado', classId: 'c3', date: '2026-07-21', at: '2:00pm', hours: 1, state: 'attended' },
    { child: 'anikasalgado', classId: 'c3', date: '2026-07-28', at: '2:00pm', hours: 1, state: 'scheduled' },
    { child: 'willajansen', classId: 'c3', date: '2026-07-21', at: '2:00pm', hours: 1, state: 'attended' },
    { child: 'willajansen', classId: 'c3', date: '2026-07-28', at: '2:00pm', hours: 1, state: 'scheduled' },
    { child: 'willajansen', classId: 'c3', date: '2026-08-04', at: '2:00pm', hours: 1, state: 'scheduled' },
    { child: 'willajansen', classId: 'c3', date: '2026-08-11', at: '2:00pm', hours: 1, state: 'scheduled' },
    { child: 'declanfabre', classId: 'c3', date: '2026-07-21', at: '2:00pm', hours: 1, state: 'attended' },
    { child: 'declanfabre', classId: 'c3', date: '2026-07-28', at: '2:00pm', hours: 1, state: 'scheduled' },
    { child: 'declanfabre', classId: 'c3', date: '2026-08-04', at: '2:00pm', hours: 1, state: 'scheduled' },
    { child: 'declanfabre', classId: 'c3', date: '2026-08-11', at: '2:00pm', hours: 1, state: 'scheduled' },
    { child: 'esmewanjiru', classId: 'c4', date: '2026-07-15', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'esmewanjiru', classId: 'c4', date: '2026-07-22', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'esmewanjiru', classId: 'c4', date: '2026-07-29', at: '3:15pm', hours: 1, state: 'scheduled' },
    { child: 'esmewanjiru', classId: 'c4', date: '2026-08-05', at: '3:15pm', hours: 1, state: 'scheduled' },
    { child: 'priyanavarro', classId: 'c4', date: '2026-07-15', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'priyanavarro', classId: 'c4', date: '2026-07-22', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'priyanavarro', classId: 'c4', date: '2026-07-29', at: '3:15pm', hours: 1, state: 'scheduled' },
    { child: 'priyanavarro', classId: 'c4', date: '2026-08-05', at: '3:15pm', hours: 1, state: 'scheduled' },
    { child: 'rayanbarros', classId: 'c4', date: '2026-07-08', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'rayanbarros', classId: 'c4', date: '2026-07-15', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'rayanbarros', classId: 'c4', date: '2026-07-22', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'rayanbarros', classId: 'c4', date: '2026-07-29', at: '3:15pm', hours: 1, state: 'scheduled' },
    { child: 'marianadelacroix', classId: 'c4', date: '2026-07-08', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'marianadelacroix', classId: 'c4', date: '2026-07-15', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'marianadelacroix', classId: 'c4', date: '2026-07-22', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'marianadelacroix', classId: 'c4', date: '2026-07-29', at: '3:15pm', hours: 1, state: 'scheduled' },
    { child: 'theatoledo', classId: 'c4', date: '2026-07-15', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'theatoledo', classId: 'c4', date: '2026-07-22', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'theatoledo', classId: 'c4', date: '2026-07-29', at: '3:15pm', hours: 1, state: 'scheduled' },
    { child: 'theatoledo', classId: 'c4', date: '2026-08-05', at: '3:15pm', hours: 1, state: 'scheduled' },
    { child: 'keikobarros', classId: 'c4', date: '2026-07-15', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'keikobarros', classId: 'c4', date: '2026-07-22', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'keikobarros', classId: 'c4', date: '2026-07-29', at: '3:15pm', hours: 1, state: 'scheduled' },
    { child: 'keikobarros', classId: 'c4', date: '2026-08-05', at: '3:15pm', hours: 1, state: 'scheduled' },
    { child: 'rowanabreu', classId: 'c4', date: '2026-07-22', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'rowanabreu', classId: 'c4', date: '2026-07-29', at: '3:15pm', hours: 1, state: 'scheduled' },
    { child: 'rowanabreu', classId: 'c4', date: '2026-08-05', at: '3:15pm', hours: 1, state: 'scheduled' },
    { child: 'rowanabreu', classId: 'c4', date: '2026-08-12', at: '3:15pm', hours: 1, state: 'scheduled' },
    { child: 'rayanfortier', classId: 'c4', date: '2026-07-22', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'rayanfortier', classId: 'c4', date: '2026-07-29', at: '3:15pm', hours: 1, state: 'scheduled' },
    { child: 'rayanfortier', classId: 'c4', date: '2026-08-05', at: '3:15pm', hours: 1, state: 'scheduled' },
    { child: 'rayanfortier', classId: 'c4', date: '2026-08-12', at: '3:15pm', hours: 1, state: 'scheduled' },
    { child: 'hugozavala', classId: 'c4', date: '2026-07-22', at: '3:15pm', hours: 1, state: 'attended' },
    { child: 'hugozavala', classId: 'c4', date: '2026-07-29', at: '3:15pm', hours: 1, state: 'scheduled' },
    { child: 'hugozavala', classId: 'c4', date: '2026-08-05', at: '3:15pm', hours: 1, state: 'scheduled' },
    { child: 'hugozavala', classId: 'c4', date: '2026-08-12', at: '3:15pm', hours: 1, state: 'scheduled' },
    { child: 'camilapires', classId: 'c5', date: '2026-07-23', at: '4:30pm', hours: 2, state: 'attended' },
    { child: 'camilapires', classId: 'c5', date: '2026-07-30', at: '4:30pm', hours: 2, state: 'scheduled' },
    { child: 'camilapires', classId: 'c5', date: '2026-08-06', at: '4:30pm', hours: 2, state: 'scheduled' },
    { child: 'camilapires', classId: 'c5', date: '2026-08-13', at: '4:30pm', hours: 2, state: 'scheduled' },
    { child: 'arjunhaddad', classId: 'c5', date: '2026-07-16', at: '4:30pm', hours: 2, state: 'attended' },
    { child: 'arjunhaddad', classId: 'c5', date: '2026-07-23', at: '4:30pm', hours: 2, state: 'attended' },
    { child: 'arjunhaddad', classId: 'c5', date: '2026-07-30', at: '4:30pm', hours: 2, state: 'scheduled' },
    { child: 'arjunhaddad', classId: 'c5', date: '2026-08-06', at: '4:30pm', hours: 2, state: 'scheduled' },
    { child: 'marisoljalal', classId: 'c5', date: '2026-07-23', at: '4:30pm', hours: 2, state: 'attended' },
    { child: 'marisoljalal', classId: 'c5', date: '2026-07-30', at: '4:30pm', hours: 2, state: 'scheduled' },
    { child: 'marisoljalal', classId: 'c5', date: '2026-08-06', at: '4:30pm', hours: 2, state: 'scheduled' },
    { child: 'marisoljalal', classId: 'c5', date: '2026-08-13', at: '4:30pm', hours: 2, state: 'scheduled' },
    { child: 'imaniklein', classId: 'c5', date: '2026-07-16', at: '4:30pm', hours: 2, state: 'attended' },
    { child: 'imaniklein', classId: 'c5', date: '2026-07-23', at: '4:30pm', hours: 2, state: 'attended' },
    { child: 'imaniklein', classId: 'c5', date: '2026-07-30', at: '4:30pm', hours: 2, state: 'scheduled' },
    { child: 'imaniklein', classId: 'c5', date: '2026-08-06', at: '4:30pm', hours: 2, state: 'scheduled' },
    { child: 'harukiwhitlock', classId: 'c5', date: '2026-07-09', at: '4:30pm', hours: 2, state: 'attended' },
    { child: 'harukiwhitlock', classId: 'c5', date: '2026-07-16', at: '4:30pm', hours: 2, state: 'attended' },
    { child: 'harukiwhitlock', classId: 'c5', date: '2026-07-23', at: '4:30pm', hours: 2, state: 'attended' },
    { child: 'harukiwhitlock', classId: 'c5', date: '2026-07-30', at: '4:30pm', hours: 2, state: 'scheduled' },
    { child: 'arloguerrero', classId: 'c5', date: '2026-07-16', at: '4:30pm', hours: 2, state: 'attended' },
    { child: 'arloguerrero', classId: 'c5', date: '2026-07-23', at: '4:30pm', hours: 2, state: 'attended' },
    { child: 'arloguerrero', classId: 'c5', date: '2026-07-30', at: '4:30pm', hours: 2, state: 'scheduled' },
    { child: 'arloguerrero', classId: 'c5', date: '2026-08-06', at: '4:30pm', hours: 2, state: 'scheduled' },
    { child: 'milomoreau', classId: 'c5', date: '2026-07-23', at: '4:30pm', hours: 2, state: 'attended' },
    { child: 'milomoreau', classId: 'c5', date: '2026-07-30', at: '4:30pm', hours: 2, state: 'scheduled' },
    { child: 'milomoreau', classId: 'c5', date: '2026-08-06', at: '4:30pm', hours: 2, state: 'scheduled' },
    { child: 'milomoreau', classId: 'c5', date: '2026-08-13', at: '4:30pm', hours: 2, state: 'scheduled' },
    { child: 'keikolund', classId: 'c5', date: '2026-07-16', at: '4:30pm', hours: 2, state: 'attended' },
    { child: 'keikolund', classId: 'c5', date: '2026-07-23', at: '4:30pm', hours: 2, state: 'attended' },
    { child: 'keikolund', classId: 'c5', date: '2026-07-30', at: '4:30pm', hours: 2, state: 'scheduled' },
    { child: 'keikolund', classId: 'c5', date: '2026-08-06', at: '4:30pm', hours: 2, state: 'scheduled' },
    { child: 'marisolidowu', classId: 'c5', date: '2026-07-23', at: '4:30pm', hours: 2, state: 'attended' },
    { child: 'marisolidowu', classId: 'c5', date: '2026-07-30', at: '4:30pm', hours: 2, state: 'scheduled' },
    { child: 'marisolidowu', classId: 'c5', date: '2026-08-06', at: '4:30pm', hours: 2, state: 'scheduled' },
    { child: 'marisolidowu', classId: 'c5', date: '2026-08-13', at: '4:30pm', hours: 2, state: 'scheduled' },
    { child: 'ariarestrepo', classId: 'c5', date: '2026-07-09', at: '4:30pm', hours: 2, state: 'attended' },
    { child: 'ariarestrepo', classId: 'c5', date: '2026-07-16', at: '4:30pm', hours: 2, state: 'attended' },
    { child: 'ariarestrepo', classId: 'c5', date: '2026-07-23', at: '4:30pm', hours: 2, state: 'attended' },
    { child: 'ariarestrepo', classId: 'c5', date: '2026-07-30', at: '4:30pm', hours: 2, state: 'scheduled' },
    { child: 'valentinayusuf', classId: 'c5', date: '2026-07-23', at: '4:30pm', hours: 2, state: 'attended' },
    { child: 'valentinayusuf', classId: 'c5', date: '2026-07-30', at: '4:30pm', hours: 2, state: 'scheduled' },
    { child: 'valentinayusuf', classId: 'c5', date: '2026-08-06', at: '4:30pm', hours: 2, state: 'scheduled' },
    { child: 'valentinayusuf', classId: 'c5', date: '2026-08-13', at: '4:30pm', hours: 2, state: 'scheduled' },
    { child: 'cillian', classId: 'c5', date: '2026-07-23', at: '4:30pm', hours: 2, state: 'attended' },
    { child: 'cillian', classId: 'c5', date: '2026-07-30', at: '4:30pm', hours: 2, state: 'scheduled' },
    { child: 'cillian', classId: 'c5', date: '2026-08-06', at: '4:30pm', hours: 2, state: 'scheduled' },
    { child: 'cillian', classId: 'c5', date: '2026-08-13', at: '4:30pm', hours: 2, state: 'scheduled' }
  ];

  /* An absence. `spent` is the only thing that matters: told us in time and the
     session stays in the child's pack, so the pack simply lasts a week longer.
     Inside the notice period the session is spent, exactly as if they came. */
  var ABSENCES = [
    { id: 'ab1', child: 'Emma Johnson',    date: 'Mon 13 Jul · 3:15pm', reason: 'Illness, told us 26 hours ahead',   spent: false },
    { id: 'ab2', child: 'Emma Johnson',    date: 'Mon 6 Jul · 3:15pm',  reason: 'Family travel, told us a week ahead', spent: false },
    { id: 'ab3', child: 'Ava Smith',       date: 'Mon 13 Jul · 3:15pm', reason: 'Illness',                            spent: false },
    { id: 'ab4', child: 'Ava Smith',       date: 'Mon 20 Jul · 3:15pm', reason: 'Told us on the day',                 spent: true  },
    { id: 'ab5', child: 'Noah Rivera',     date: 'Mon 6 Jul · 2:15pm',  reason: 'Studio closed for the holiday',      spent: false },
    { id: 'ab6', child: 'Zara Okafor',     date: 'Wed 8 Jul · 3:15pm',  reason: 'Illness',                            spent: false },
    { id: 'ab7', child: 'Sophia Martinez', date: 'Mon 20 Jul · 3:15pm', reason: 'School trip, told us three days ahead', spent: false },
    { id: 'ab8', child: 'Mia Chen',        date: 'Tue 21 Jul · 2:00pm', reason: 'Told us the same morning',           spent: true  }
  ];

  /* A catch-up class a family booked on top of their weekly place. It spends a
     session from the pack like any other class. */
  var EXTRA_CLASSES = [
    { id: 'x1', child: 'Emma Johnson', when: 'Fri 31 Jul · 10:00am', room: 'Studio 2', staff: 'Lauren Ortiz' }
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
      { d: '', m: 'us', t: 'Noted, thank you for the notice. That is more than 24 hours ahead, so Sophia can take the class another time.', s: 'Fri 8:50am' },
      { d: '', m: 'them', t: 'Perfect, thank you.', s: 'Fri 9:02am' }
    ]
  };

  var FAMILY_TRANSCRIPT = [
    { d: '1 July',  m: 'studio', t: 'We are closed for the holiday on 4 July. Monday families, we have already added a class for you to take another time.', s: '1 Jul' },
    { d: '18 July', m: 'studio', t: 'Autumn enrollment opens 10 August. Returning families get first refusal on their current day and time for one week.', s: '18 Jul' },
    { d: '21 July', m: 'studio', t: 'Camp week 4 — please send a water bottle, a snack, and clothes that can get properly messy. We are working with clay all week.', s: '21 Jul' },
    { d: '', m: 'us', t: 'Thank you! Emma is very excited about the clay.', s: '21 Jul' },
    { d: 'Today',   m: 'studio', t: 'We have opened two extra make-up hours this Friday, 10:00 and 11:00. Emma has two classes to make up — grab one if it suits.', s: '2 hrs ago' }
  ];

  var ANNOUNCEMENTS = [
    { id: 'an1', head: 'Autumn enrollment opens 10 August',         body: 'Returning families get first refusal on their current day and time for one week.', aud: 'All families',      when: '18 Jul 2026', by: 'Sabrina Yanguas', status: 'Pinned',    kind: 'info' },
    { id: 'an2', head: 'Extra make-up hours this Friday',           body: 'Two extra hours this Friday, 10:00 and 11:00. Book yours from the portal.',              aud: 'After-School Art',  when: '27 Jul 2026', by: 'Dani Cruz',       status: 'Live',      kind: 'ok' },
    { id: 'an3', head: 'Camp week 4 — what to bring',              body: 'A water bottle, a snack, and clothes that can get properly messy.',                aud: 'Seasonal Camp',     when: '21 Jul 2026', by: 'Dani Cruz',       status: 'Live',      kind: 'ok' },
    { id: 'an4', head: 'Studio closed 7 September, Labor Day',     body: 'Monday families can take that class another time \u2014 we add it for you.',                                 aud: 'All families',      when: '15 Jul 2026', by: 'Sabrina Yanguas', status: 'Scheduled', kind: 'neutral' },
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
    { at: '09:31', what: 'Absence reported — Emma Johnson, told us in time so the session stays' },
    { at: '08:47', what: 'New registration — Delgado family, 2 children' },
    { at: '08:12', what: 'Payment failed — Okafor family, retry scheduled 30 Jul' }
  ];

  /* The Johnson family's ledger, shown in Console → Billing → ledger and in
     the family's own Billing screen. */
  var LEDGER = [
    { d: '1 Jul 2026',  what: 'July cycle — Emma, 4 hours',   amt: 280, paid: true },
    { d: '1 Jul 2026',  what: 'July cycle — Lucas, 4 hours', amt: 280, paid: true },
    { d: '1 Jul 2026',  what: 'Registration — Lucas, 50% sibling discount', amt: -65, paid: true },
    { d: '12 Jul 2026', what: 'Camp week 4 extra hour — Emma',      amt: 28,  paid: true },
    { d: '20 Jul 2026', what: 'Late pickup — 15 minutes',           amt: 18,  paid: false }
  ];

  var DOCUMENTS = [
    { id: 'd1', name: 'Payment terms',            version: 'Version 4', published: '1 July 2026',     signed: false, who: '—' },
    { id: 'd2', name: 'Studio policies',          version: 'Version 2', published: '1 January 2026',  signed: true,  who: 'Sabrina Moore · 3 Jan 2026' },
    { id: 'd3', name: 'Photo permission — Emma',  version: 'Version 1', published: '12 August 2024',  signed: true,  who: 'Sabrina Moore · 12 Aug 2024' },
    { id: 'd4', name: 'Photo permission — Lucas', version: 'Version 1', published: '12 August 2024',  signed: false, who: '—' },
    { id: 'd5', name: 'Medical and allergy form', version: 'Version 3', published: '1 September 2025',signed: true,  who: 'Sabrina Moore · 4 Sep 2025' }
  ];

  /* Which policies a family signs, per programme. The program builder and
     Settings each kept their own hard-coded copy of this, and they had already
     drifted: the builder showed all nine on every programme while Settings
     reported eight for a camp and twelve for a private class. One source. */
  var POLICY_BASE = [
    'Important facts', 'Class scheduling', 'Make-ups & cancellations',
    'Drop-off & pick-up', 'Health & safety', 'Medical emergencies',
    'Payment terms', 'Release of liability', 'Agreement'
  ];
  /* The wording behind each clause, so the editor has something real to edit
     and a signature can point at a version. Kept short: a prototype needs
     plausible text, not a legal review. */
  var POLICY_TEXT = {
    'Important facts': { version: 3, updated: '1 Jan 2026', body: 'We are an art studio, not a childcare provider. A child must be collected by an adult on their pick-up list. We are insured for the activities we run and for nothing else.' },
    'Class scheduling': { version: 2, updated: '1 Jan 2026', body: 'A weekly place is held for the whole term. Days and times change only at the start of a term, and we give four weeks notice. If we have to close, the class comes back to you as a class to make up.' },
    'Make-ups & cancellations': { version: 4, updated: '1 Jul 2026', body: 'Tell us at least 24 hours before a class and your child can take it another time. Inside 24 hours the class counts as attended. A class to make up expires at the end of the billing cycle and has no cash value.' },
    'Drop-off & pick-up': { version: 2, updated: '1 Jan 2026', body: 'Doors open five minutes before the hour. We release a child only to an adult you have named. Collection more than ten minutes late is charged by the minute.' },
    'Health & safety': { version: 3, updated: '3 Feb 2026', body: 'Tell us about every allergy, condition and medicine before the first class. Materials are non-toxic and age-appropriate. Clothes will get paint on them.' },
    'Medical emergencies': { version: 3, updated: '3 Feb 2026', body: 'In an emergency we call you first, then the second contact on your account, then the emergency services. Staff do not administer medication of any kind. A child who carries an inhaler or an EpiPen keeps it with them.' },
    'Payment terms': { version: 4, updated: '1 July 2026', body: 'Tuition is billed monthly on the 1st for the month ahead. A failed card is retried on days 1, 3 and 7. After a seven-day grace a $25 late fee applies. Thirty days notice to cancel, and fees are non-refundable — we credit rather than refund.' },
    'Release of liability': { version: 2, updated: '1 Jan 2026', body: 'You accept the ordinary risks of a working art studio: hot kilns, sharp tools and permanent pigment. This does not limit our liability for our own negligence.' },
    'Agreement': { version: 2, updated: '1 Jan 2026', body: 'Signing confirms that you have read these clauses, that the details on your account are accurate, and that you will tell us when they change.' },
    'Food and snacks': { version: 1, updated: '2 Mar 2026', body: 'A full day includes a break. Send a snack and a labelled water bottle. We are a nut-free studio on camp days.' },
    'Owner approval': { version: 1, updated: '12 May 2026', body: 'A private class is confirmed by the owner rather than booked automatically, so that the right instructor and room are free.' },
    'Off-site hosting': { version: 1, updated: '12 May 2026', body: 'If we bring a class to you, the space, the tables and the water are yours to provide. Travel is quoted with the booking.' },
    'Additional participants': { version: 1, updated: '12 May 2026', body: 'A private class is priced for the children named on the booking. Anyone joining on the day is charged at the per-child rate.' }
  };

  var POLICY_BY_PROGRAM = {
    as:   { drop: [], add: [] },
    camp: { drop: ['Make-ups & cancellations', 'Class scheduling'], add: ['Food and snacks'] },
    nsd:  { drop: ['Make-ups & cancellations', 'Class scheduling'], add: ['Food and snacks'] },
    pop:  { drop: ['Make-ups & cancellations', 'Class scheduling'], add: ['Food and snacks'] },
    priv: { drop: [], add: ['Owner approval', 'Off-site hosting', 'Additional participants'] },
    /* A birthday party is quoted from the enquiry and signs nothing. */
    bday: { none: true }
  };

  /* The commitment. A plan runs to the end of the school year and ends by
     itself; there is nothing to cancel in June. */
  var PLAN_YEAR = {
    label: '2026–27',
    ends: '18 June 2027',
    note: 'Plans end with the school year. Nothing renews into the summer.'
  };

  /* The studio's own rules, as written on the registration form families sign.
     One place, so no screen invents a different version. */
  var RULES = {
    cancelNotice: '24 hours',
    lateCancel: 'The class is counted as attended and no make-up is given.',
    unusedHours: 'Hours not booked in a cycle are lost. They do not roll over.',
    makeupWindow: 'same cycle',          // the signed policy; see makeupWindowOptions
    makeupWindowOptions: ['same cycle', '30 days from the missed class'],
    makeupWhere: 'Any age-appropriate class with a free place, booked in the portal.',
    makeupNever: [
      'Roll over into another month, camp or pop-up',
      'Transfer to a sibling',
      'Be guaranteed when every class is full',
      'Be rebooked once missed — a booked make-up not attended is used'
    ],
    freeze: 'Plans are not frozen, for any reason.',
    cancelPlan: '30 days written notice. Without it, the plan is billed to the end of the school year.'
  };

  /* What the studio has charged outside a plan. Extra classes at the end of
     term, a private lesson, an event, anything else — one action, one amount,
     one reason, on the card already on file. This is deliberately the only
     mechanism for the exceptions, rather than a rule per exception. */
  var SALES = [
    { id: 's1', fam: 'Martinez', what: 'Two extra classes — school finishes a week later', amt: 130, when: '3 Jun 2026', by: 'Sabrina Yanguas' },
    { id: 's2', fam: 'Chen',     what: 'Private class — one hour with Lauren',             amt: 90,  when: '14 Jul 2026', by: 'Rey Molina' },
    { id: 's3', fam: 'Rivera',   what: 'Clay Night pop-up — one child',                    amt: 45,  when: '21 Jul 2026', by: 'Rey Molina' }
  ];

  var STUDIO = {
    name: 'The Grove Art Studio',
    legal: 'The Grove Art Studio LLC',
    phone: '(786) 340-9229',
    email: 'contact@thegroveartstudio.com',
    hours: 'Mon–Fri 9:00–19:00',
    hoursWeekend: 'Sat 10:00–16:00'
  };

  /* Enrolment and waitlist counts are counted off the rows, never written
     down, so a class cannot claim a number its roster does not show. */
  CLASSES.forEach(function (c) {
    c.en = STUDENTS.filter(function (s) {
      return (s.classIds || []).indexOf(c.id) !== -1;
    }).length;
    c.wl = WAITLIST.filter(function (w) {
      return w.cls.indexOf(c.day + ' ' + c.time.split('\u2013')[0]) === 0;
    }).length;
  });

  Grove.data = {
    today: 'Tuesday, 28 July 2026',
    STUDIO: STUDIO,
    PROGRAMS: PROGRAMS,
    ROLES: ROLES,
    PRICING: PRICING,
    FAMILIES: FAMILIES,
    STUDENTS: STUDENTS,
    CLASSES: CLASSES,
    STAFF: STAFF,
    INVOICES: INVOICES,
    WAITLIST: WAITLIST,
    SESSIONS: SESSIONS,
    ABSENCES: ABSENCES,
    EXTRA_CLASSES: EXTRA_CLASSES,
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

    PRICING_MODELS: PRICING_MODELS,
    PLAN_YEAR: PLAN_YEAR,
    RULES: RULES,
    SALES: SALES,

    /* A child's plan: hours a month, what it costs, and where they are in the
       current cycle. Hours, never sessions — a two-hour class spends two. */
    plan: function (student) {
      var hours = student.planHours || 0;
      if (!hours) return { hours: 0, isPlan: false };
      var mine = SESSIONS.filter(function (x) { return x.child === student.id; });
      var used = mine.filter(function (x) { return x.state === 'attended'; })
                     .reduce(function (n, x) { return n + x.hours; }, 0);
      var next = mine.filter(function (x) { return x.state === 'scheduled'; });
      return {
        hours: hours,
        isPlan: true,
        price: PRICING.as.plans['p' + hours] || 0,
        usedHours: used,
        leftHours: Math.max(0, hours - used),
        dates: mine,
        nextDates: next,
        renewsOn: next.length ? next[next.length - 1] : null
      };
    },

    POLICY_BASE: POLICY_BASE,
    POLICY_BY_PROGRAM: POLICY_BY_PROGRAM,
    POLICY_TEXT: POLICY_TEXT,

    /* Every clause that exists, base first then the programme-specific ones. */
    POLICY_ALL: (function () {
      var out = POLICY_BASE.slice();
      Object.keys(POLICY_BY_PROGRAM).forEach(function (k) {
        (POLICY_BY_PROGRAM[k].add || []).forEach(function (n) {
          if (out.indexOf(n) === -1) out.push(n);
        });
      });
      return out;
    })(),

    policy: function (name) {
      var t = POLICY_TEXT[name] || {};
      return { name: name, version: t.version || 1, updated: t.updated || '', body: t.body || '' };
    },

    /* The policies attached to one programme, in signing order. */
    /* How this programme is priced, and what the builder asks for. */
    pricingModel: function (programId) {
      var m = (PRICING[programId] || {}).model || 'quoted';
      return PRICING_MODELS[m];
    },

    policiesFor: function (programId) {
      var rule = POLICY_BY_PROGRAM[programId];
      if (!rule || rule.none) return [];
      var out = POLICY_BASE.filter(function (name) {
        return (rule.drop || []).indexOf(name) === -1;
      });
      return out.concat(rule.add || []);
    },

    /* A child's session pack. Nothing here is a date: a pack renews when the
       last session in it is used, so the next charge is a number of classes
       away, not a day on the calendar. Sessions do not expire. */
    pack: function (student) {
      var size = student.pack || 0;
      var used = student.used || 0;
      return {
        size: size,
        used: used,
        left: Math.max(0, size - used),
        renewsIn: Math.max(0, size - used),
        isPack: size > 0
      };
    },

    /* Absences for one child, and whether each one cost them a session. */
    absencesFor: function (name) {
      return ABSENCES.filter(function (a) { return a.child === name; });
    },

    /* Every child on a class's roll. */
    roster: function (classId) {
      return STUDENTS.filter(function (s) {
        return (s.classIds || []).indexOf(classId) !== -1;
      });
    },
    classesOf: function (student) {
      return (student.classIds || []).map(function (id) {
        return CLASSES.filter(function (c) { return c.id === id; })[0];
      }).filter(Boolean);
    },

    family: function (id) { return FAMILIES.filter(function (f) { return f.id === id; })[0]; },
    student: function (id) { return STUDENTS.filter(function (s) { return s.id === id; })[0]; },
    program: function (id) { return PROGRAMS[id]; }
  };
})();
