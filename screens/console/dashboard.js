/* Console → Dashboard.
   Reference implementation: a screen declares its header as data and returns
   only a body built from Grove.ui components. */
(function () {
  'use strict';
  var Grove = window.Grove, ui = Grove.ui, h = Grove.html, raw = Grove.raw, D = Grove.data;

  Grove.screen('dashboard', {
    surface: 'console',
    crumbTitle: 'Dashboard',
    eyebrow: 'today at the studio',
    title: 'Tuesday, 28 July',
    sub: 'Summer camp week 4 of 6 · after-school enrolment opens in 13 days.',
    actions: [
      { label: 'Take payment', msg: 'Payment recorded' },
      { label: 'Add family', to: 'families' },
      { label: 'New program', kind: 'primary', to: 'programBuilder' }
    ],

    body: function () {
      var attention = [
        ui.notice({
          kind: 'bad',
          title: '3 payments failed overnight',
          text: 'Johnson, Okafor and Delgado. Retry is scheduled for 30 July; two are past the seven-day grace.',
          action: { label: 'Resolve', to: 'billing' }
        }),
        ui.notice({
          kind: 'warn',
          title: 'Thursday 4:30 two-hour class is over capacity',
          text: '13 enrolled against 12 places. One make-up booking pushed it over.',
          action: { label: 'Rebalance', to: 'classes' }
        })
      ].join('');

      var stats = ui.statbar([
        { label: 'Revenue MTD',      value: '$28,360' },
        { label: 'Active enrolments',value: '138' },
        { label: 'Sessions today',   value: '11' },
        { label: 'Attendance',       value: '94%',   tone: 'grove' },
        { label: 'Outstanding',      value: '$1,840', tone: 'clay' },
        { label: 'On waitlists',     value: '12',    tone: 'plum' }
      ]);

      var today = ui.card({ title: 'Today at the studio', flush: true },
        ui.rows(D.TODAY.map(function (s) {
          var full = s.en >= s.cap;
          return {
            lead: s.time,
            title: ui.dot(D.program(s.prog).color) + ' ' + Grove.esc(s.title),
            end: '<span class="num ' + (full ? 'clay' : 'grove') + '">' + s.en + '/' + s.cap + '</span>',
            to: 'classes'
          };
        }))
      );

      var waitlists = ui.card(
        {
          title: 'Waitlists',
          head: ui.btn({ label: 'View all', kind: 'quiet', size: 'sm', to: 'requests' }),
          flush: true
        },
        ui.rows([
          { title: 'Mon 3:15pm · Ages 5–7',  end: '<span class="pill pill--warn">5 waiting</span>', to: 'requests' },
          { title: 'Wed 4:30pm · Ages 8–11', end: '<span class="pill pill--warn">4 waiting</span>', to: 'requests' },
          { title: 'Thu 4:30pm · 2-hour',    end: '<span class="pill pill--warn">3 waiting</span>', to: 'requests' }
        ])
      );

      var activity = ui.card({ title: 'Recent activity', flush: true },
        ui.rows(D.ACTIVITY.map(function (a) {
          return { lead: a.at, title: Grove.esc(a.what) };
        }))
      );

      return h`
        <div class="stack">${raw(attention)}</div>
        <div class="section">${raw(stats)}${raw(today)}</div>
        <div class="section">${raw(ui.grid(2, [waitlists, activity]))}</div>
      `;
    }
  });
})();
