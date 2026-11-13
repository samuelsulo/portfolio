# Site overview

What the portfolio at `samuelsulo.it` does and for whom. How it is built is in
[`../technical/`](../technical), how it is shipped in [`../deployment/`](../deployment).

## Purpose and audience

A personal showcase of Samuel Sulo as Cloud Engineer and Web Developer. It is read by
recruiters, hiring managers and prospective clients, who need in a few minutes to
understand what he does, see proof of it, and get in touch. It is not a client project:
there is one owner and no client account.

## Home page

The page is a single scroll with a sticky navigation bar. The order is chosen to answer, in
turn: who, what has been built, with which tools, what is certified, how to reach.

| Section        | What the visitor gets                                                                                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hero           | Name, role, short intro, availability status, links to GitHub, LinkedIn and the CV, portrait with technical readouts                                                   |
| About          | The profile in two sentences and a terminal-style summary (`stack --list`)                                                                                             |
| Work           | Cards for each project, filterable by kind (client or demo); each opens a dedicated page                                                                               |
| Stack          | "The tools I use every day", in groups: cloud, infrastructure and releases, web applications, backend and automation, AI, working environment, each tool with its logo |
| Certifications | One card per certification: badge, title, issuer, description, an Active or Expired label and a link to the public verification page on Credly                         |
| Contact        | A form that sends the message to the owner's mailbox                                                                                                                   |

## Work pages

Each work has its own page (`/work/<id>`) with a tabbed viewer of its materials: logo,
business card, review signs, website, design, online presence and architecture. Client works
are real; demo works are fictional and labelled as such.

## 3D view

The navigation bar has a **3D** button (and **2D** to come back) that opens `/3d`: the same
content as rooms to explore with a stickman, under the same navigation bar and footer.

The visitor starts in a cyberpunk **hub** with a portal for each other room: the work
gallery, the stack room, the certifications, the CV room (the first page of each CV on the wall,
left out when the site has no CV) and the contact room. Each room has a portal back to the
hub, and a list of rooms at the side of the screen jumps to any of them. The rooms are small
and decorated with what the work is about (servers, containers, databases, a cloud, code,
antennas), and only the room the visitor is in is drawn.

Everything is on the walls with a preview, before interacting: the screenshot of each work, the
certification badges, the stack groups with their logos, the first page of the CVs and the
contact details. Walking up to one shows a prompt, and using it opens its details, the work page, the
certification verification, the CV PDF or the contact section of the classic view. Controls:
arrows or WASD to walk, Shift to run, Space to jump (high enough to climb onto the racks, desks, containers and the other props, and to jump down from them), E to interact or enter a portal, and the mouse or
trackpad to look around: a click on the scene captures the pointer, so the camera follows it
without pressing any button (Escape releases it, and opening a panel or the dance menu does too);
on touch screens a joystick, a round arrow button to jump, dragging to look, pinching to zoom and tapping the prompt.
The scene is exactly as big as the screen and the page behind it never scrolls; only the sheets
opened over it (work, CV, about, contact) and the menu scroll. A round burger button (or **M**)
opens the menu: the rooms as tiles, a table of the controls and the link to the 2D version of the
site. The **B** key (or the round dance button with a music note) opens a wheel of eight dances for the stickman (floss, disco,
robot, wave, jumping jacks, spin, headbang, coding), chosen by clicking or with the keys 1 to 8;
the figure dances until the visitor walks away. The visitor's spot is remembered while they open
a work or the classic view and come back. Browsers without WebGL see a message with a link back to the classic view, and screen readers
get the content as a plain list.

## Cross-cutting behaviour

- **Languages**: Italian (default) and English, switchable at any time. The CV link follows
  the active language.
- **Themes**: dark (default) and light, with a "system" option that follows the operating
  system. The choice is remembered on the device.
- **Contact form**: validates the input, shows a clear success or error state, and never
  reports a success the backend did not confirm.
- **Legal pages**: Cookie Policy and Privacy Policy, opened from the footer.
- **Accessibility and motion**: skip link, keyboard navigation, visible focus, reduced
  motion respected.

## Out of scope

By design the site has no user accounts, restricted areas, payments or analytics. Adding any
of them changes the nature of the project and, per the repository guardrails in
[`../../CLAUDE.md`](../../CLAUDE.md), needs an explicit decision first. The site sets no
tracking cookies and loads no third-party content; the only browser storage is technical
(language and theme), which is why there is no cookie banner.

## Editing the content

Texts, projects, stack, certifications and the CV are content, not code: the procedure is in
the [application README](../../apps/web/README.md#content-how-to-edit-it). The CV is
generated from its own source, see [`apps/web/cv/`](../../apps/web/cv).
