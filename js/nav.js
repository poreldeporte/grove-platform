/* ==========================================================================
   Grove Platform — portals and navigation

   Three portals: Family (parents), Studio (teachers), Console (the owner),
   plus the public Registration flow.

   The rail is a FLAT list. The previous build grouped items under headings
   like "MONEY", which then held a single item — a heading over one row is
   noise. Clusters are separated by space instead, which reads the same and
   costs nothing.
   ========================================================================== */

(function () {
  'use strict';
  var Grove = window.Grove;

  var GAP = { gap: true };

  var SURFACES = {
    registration: {
      name: 'Registration',
      crumbRoot: 'Registration',
      hand: 'let’s get you booked',
      rail: false,
      home: 'rPick'
    },
    family: {
      name: 'Family',
      crumbRoot: 'Family portal',
      hand: 'your family',
      rail: true,
      home: 'fHome'
    },
    studio: {
      name: 'Studio',
      crumbRoot: 'Studio',
      hand: 'the studio floor',
      rail: true,
      home: 'sToday'
    },
    console: {
      name: 'Console',
      crumbRoot: 'Console',
      hand: 'front of house',
      rail: true,
      home: 'dashboard'
    }
  };

  var NAV = {
    console: [
      { k: 'dashboard', l: 'Dashboard' },
      { k: 'requests', l: 'Requests', badge: '4', urgent: true },
      GAP,
      { k: 'programs', l: 'Programs' },
      { k: 'classes', l: 'Classes' },
      GAP,
      { k: 'families', l: 'Families' },
      { k: 'staff', l: 'Staff' },
      GAP,
      { k: 'billing', l: 'Billing', badge: '3', urgent: true },
      { k: 'teaching', l: 'Teaching' },
      { k: 'inventory', l: 'Inventory' },
      GAP,
      { k: 'messages', l: 'Messages', badge: '4' }
    ],
    consoleFoot: [
      { k: 'reports', l: 'Reports' },
      { k: 'settings', l: 'Settings' }
    ],

    family: [
      { k: 'fHome', l: 'Home' },
      { k: 'fMessages', l: 'Messages', badge: '3' },
      GAP,
      { k: 'fChildren', l: 'Children' },
      { k: 'fSchedule', l: 'Schedule', badge: '2' },
      GAP,
      { k: 'fBilling', l: 'Billing' },
      { k: 'fDocuments', l: 'Documents' },
      GAP,
      /* A parent could not book or enroll anything from inside the old portal —
         no second child, no next term, no camp week. This is that route. */
      { k: 'rPick', l: 'Book & enroll' }
    ],
    familyFoot: [],

    studio: [
      { k: 'sToday', l: 'Today' },
      GAP,
      { k: 'sClasses', l: 'Classes' },
      { k: 'sAttendance', l: 'Attendance' },
      { k: 'sStudents', l: 'Students', badge: '4', urgent: true },
      GAP,
      { k: 'sLessons', l: 'Lesson plans' }
    ],
    studioFoot: [
      { k: 'sTime', l: 'My time' }
    ],

    registration: [],
    registrationFoot: []
  };

  /* Which nav item should light up for a screen that has no nav entry of its
     own — a detail view, a form, a wizard step. */
  var OWNER = {
    familyRecord: 'families',
    ledger: 'billing',
    newMessage: 'messages',
    programBuilder: 'programs',
    policyDoc: 'settings',
    editLessonPlan: 'teaching',
    classRecord: 'classes',
    staffRecord: 'staff',
    studentRecord: 'families',
    newProgram: 'programs',
    newClass: 'classes',
    editClass: 'classes',
    classCancel: 'classes',
    newFamily: 'families',
    enrollChild: 'families',
    inviteStaff: 'staff',
    recordPayment: 'billing',
    postSale: 'billing',
    renewals: 'billing',
    adjust: 'billing',
    adjustStock: 'inventory',
    newAnnouncement: 'messages',
    fAddChild: 'fChildren',
    fDocument: 'fDocuments',
    fBookMakeup: 'fSchedule',
    sStudentNote: 'sStudents',
    rFlow: 'rPick',
    rDone: 'rPick'
  };

  Grove.nav = {
    surfaces: SURFACES,
    surface: function (id) { return SURFACES[id]; },
    homeFor: function (surface) { return (SURFACES[surface] || SURFACES.console).home; },
    items: function (surface) { return NAV[surface] || []; },
    footItems: function (surface) { return NAV[surface + 'Foot'] || []; },
    /* The rail item that should read as current for the screen on show. */
    currentFor: function (screenKey) { return OWNER[screenKey] || screenKey; }
  };
})();
