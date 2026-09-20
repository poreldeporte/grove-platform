# Grove Platform

A click-through front-end prototype of the platform that runs
[The Grove Art Studio](https://thegroveartstudio.com) — an after-school art
institute.

Three portals and one public flow:

| Surface | Who it is for | What they do there |
| --- | --- | --- |
| **Registration** | Anyone | Book after-school, camp, no-school day, private, birthday or pop-up |
| **Family** | Parents | See the schedule, report an absence, book a make-up, pay, sign paperwork |
| **Studio** | Teachers | Today's rooms, safety alerts, attendance, lesson plans, hours |
| **Console** | The owner | Enrollment, families, billing, staff, inventory, messages, settings |

Use the **Signed in as** switcher in the top right to move between an owner, an
instructor and a parent. The **Desktop / Tablet / Phone** switcher previews the
responsive layout.

## Running it

It is plain HTML, CSS and JavaScript. No build step, no dependencies, no server.

```
open index.html
```

It also works unchanged from GitHub Pages, or from any static host.

## How it is put together

```
index.html            the shell page and the script manifest
css/
  tokens.css          every colour, size, space and radius in the product
  app.css             every component class, in one annotated file
js/
  core.js             the click-through runtime: registry, state, router
  data.js             one demo dataset, shared by every screen
  nav.js              the three portals and their navigation
  components.js       the component API screens build from (Grove.ui.*)
  shell.js            chrome, rail, and the page container every screen sits in
screens/
  console/  family/  studio/  registration/
assets/               logo, bird and the six programme badges
```

### The one rule

**A screen never draws its own page chrome.** It declares its breadcrumbs,
title, subtitle and header actions as data, and returns only a body composed
from `Grove.ui.*`:

```js
Grove.screen('families', {
  surface: 'console',
  eyebrow: 'everyone on the books',
  title: 'People',
  sub: 'The family is the billing unit…',
  actions: [{ label: 'Add family', kind: 'primary', msg: 'Saved' }],
  body: function (ctx) {
    return ui.toolbar({ … }) + ui.card({ flush: true }, ui.table(cols, rows));
  }
});
```

`shell.js` draws the container, the breadcrumb trail and the header identically
for all of them. That is what stops forty screens from drifting apart, which is
the single biggest problem this rebuild set out to fix.

Two rules follow from it, and they are worth keeping:

- **Cards in a row are always equal height.** `ui.grid()` stretches its
  children and `.card` is a full-height flex column, so sibling cards line up
  without anyone thinking about it.
- **Tabs, search, filters and the result count share one row** via
  `ui.toolbar()`. The previous build stacked a tabs row, a row of oversized
  stat cards and a search row above every table.

If a screen needs something the component set does not have, it goes into
`components.js` and `app.css` first, so every other screen can use it too.

## Demo data

`js/data.js` is the only source of facts. Today in the demo is **Tuesday 28
July 2026**. Prices shown anywhere in the registration flow are read from
`PRICING` — no screen sets a rate of its own.
