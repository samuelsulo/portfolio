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
the [application README](../../application/README.md#content-how-to-edit-it). The CV is
generated from its own source, see [`application/cv/`](../../application/cv).
