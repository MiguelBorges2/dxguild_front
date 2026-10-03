---
name: DX Guild
description: A nocturnal guild ledger for discovering and joining tabletop RPG campaigns.
colors:
  ink: "#0b0c10"
  night: "#11131a"
  slate: "#1b1f27"
  paper: "#f4eee0"
  muted: "#c4bdad"
  gold: "#d7b66e"
  gold-dim: "#927849"
typography:
  display:
    fontFamily: "DXGuildDisplay, Georgia, serif"
    fontSize: "clamp(3.4rem, 7vw, 6.35rem)"
    fontWeight: 400
    lineHeight: 0.93
    letterSpacing: "-0.025em"
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1rem"
    lineHeight: 1.7
  title:
    fontFamily: "Georgia, serif"
    fontSize: "1.42rem"
    fontWeight: 500
    lineHeight: 1.18
  label:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 800
    letterSpacing: "0.08em"
rounded:
  square: "0"
  status-dot: "50%"
spacing:
  compact: "0.75rem"
  card: "1.35rem"
  section: "clamp(5rem, 10vw, 9rem)"
components:
  button-primary:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "0 1.5rem"
    height: "54px"
  button-utility:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
    rounded: "{rounded.square}"
    padding: "0.65rem 1rem"
    height: "42px"
  campaign-card:
    backgroundColor: "{colors.night}"
    textColor: "{colors.paper}"
    rounded: "{rounded.square}"
    padding: "{spacing.card}"
  text-field:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.square}"
    padding: "0 0.85rem"
    height: "45px"
---

# Design System: DX Guild

## Overview

**Creative North Star: "The Nocturnal Guild Ledger"**

DX Guild is a web app whose visual language turns campaign discovery into an invitation pinned inside a late-night guild hall. Deep blue-black grounds carry the experience; parchment copy keeps information legible; aged gold is a navigational metal used to mark action, hierarchy, and the edges of meaningful artifacts. It should feel grounded in a real RPG table rather than in generic fantasy wallpaper.

The system is structured, not ornamental. Fine engraved rules, square panels, framed imagery, and stamped status marks make campaigns feel like entries in a shared noticeboard. Local display lettering gives major moments a guild identity, while Georgia and the system sans keep campaign facts and future flow screens practical to scan. Existing crest and RPG photography are evidence: use them as a seal or a physical table record, never as loose decoration.

**Key Characteristics:**

- Dark, paper-and-metal contrast with gold reserved for direction and structure.
- Campaign information appears as a ledger record before account entry asks for commitment.
- Square, engraved surfaces create depth through borders, overlays, and tonal layers rather than soft cards.
- Responsive layouts preserve the reading order: invitation, discovery, then account actions.

## Colors

The palette is low-light and material: ink gives the app its night, parchment carries reading, and aged gold tells people where to look and act.

### Primary

- **Aged Guild Gold:** `gold` is the sole high-attention metal for primary actions, section rules, frame corners, icons, and active status marks.

### Secondary

- **Burnished Gold:** `gold-dim` supports compact labels and secondary metadata without competing with calls to action.

### Neutral

- **Black Ink:** `ink` is the page ground and the dark text color inside the gold action treatment.
- **Ledger Night:** `night` is the raised campaign-record surface.
- **Slate Shadow:** `slate` is the image fallback and subdued structural field.
- **Parchment:** `paper` is the primary reading color and the brightest neutral.
- **Worn Parchment:** `muted` carries supporting copy, captions, and low-priority information.

**The Navigational Metal Rule.** Gold is functional emphasis, not ambient decoration. Use it to connect a route, a control, a label, a rule, or a visible state; leave large fields dark and calm.

## Typography

**Display Font:** DXGuildDisplay, backed by Georgia and serif fallbacks.

**Body Font:** system sans stack, with Georgia for editorial campaign titles and supporting prose.

**Character:** The display face is reserved for declaration-like moments; the serif is the voice of the campaign record; the sans is the quiet operating layer that keeps a web app easy to read and extend.

### Hierarchy

- **Display:** `display` is for the home invitation, major section titles, and modal titles. Keep its lines compact and short.
- **Headline:** Use the display face at the section-title treatment for new screen headings and route-level moments.
- **Title:** `title` is for campaign names, feature headings, and other content records.
- **Body:** `body` handles explanatory copy and should remain comfortably narrow rather than becoming a full-width wall of text.
- **Label:** `label` is uppercase, tracked, and reserved for controls, ledger keys, and compact system metadata.

**The Ledger Voice Rule.** Never use the display face for dense UI, form values, or tables. It announces; the serif and sans explain.

## Layout

The home uses a framed, full-bleed opening followed by a centered campaign ledger. Main content containers share a maximum width with generous responsive gutters; section rhythm uses `spacing.section`. The hero is a two-column composition at wide sizes, pairing the invitation with a framed crest artifact. At the compact breakpoint it becomes a single reading column, then reduces gutters again on small phones.

Campaign discovery is a bordered grid with a one-pixel rule between records rather than separated floating cards. Features use the same rule logic in a two-column ledger that collapses to one column. Future flow screens should use the same centered content measure, square field rhythm, and strong route heading before introducing denser operating layouts.

## Elevation & Depth

Depth is tonal and structural. Dark overlays push background photography behind content; nested engraved rules give panels their physical construction; shadows appear only under featured artifacts, dialogs, and raised primary interactions. Hover lifts a campaign record slightly and lets its image breathe, while the resting layout stays flat and archival.

### Shadow Vocabulary

- **Artifact lift:** `0 30px 60px rgba(0, 0, 0, .3)` anchors the framed crest artifact above its background.
- **Action lift:** `0 12px 26px rgba(0, 0, 0, .24)` is reserved for a hovered primary route action.
- **Dialog depth:** `0 24px 60px rgba(0, 0, 0, .54)` separates modal work from the underlying ledger.

**The Engraved-Not-Floating Rule.** Default surfaces gain hierarchy from tonal contrast and fine gold rules; do not add soft drop shadows to ordinary cards or sections.

## Shapes

The form language is square and deliberate. Panels, buttons, fields, and dialogs use `rounded.square`; engraved inset rules and cropped photography echo paper notices held in a metal frame. The only rounded form is `rounded.status-dot`, used for a small availability mark. Borders are thin, low-opacity gold or parchment, with corner brackets reserved for the hero frame and special artifacts.

## Components

### Buttons

The primary route action is a gold metal bar that visibly advances the visitor toward discovery.

- **Shape:** Square (`rounded.square`).
- **Primary:** `button-primary` is used for the most important next route; its arrow shifts forward on hover and the control gains restrained lift.
- **Hover / Focus:** The primary lightens, rises slightly, and always exposes the parchment-gold focus outline with a clear offset.
- **Utility:** `button-utility` is the quieter bordered alternative for login, registration, and secondary choices; hover fills it with a faint gold wash rather than turning it into a second primary button.

### Cards / Containers

Campaign cards are ledger records, not generic product tiles.

- **Corner Style:** Square (`rounded.square`).
- **Background:** `campaign-card` sits on `night`, separated from adjacent records by shared engraved rules.
- **Shadow Strategy:** Flat at rest; the record rises subtly only on hover.
- **Border:** The grid owns its thin shared gold rule so card edges never double up.
- **Internal Padding:** Use `spacing.card` around the record copy and compact repeated information rows.

### Inputs / Fields

Fields are dark inlaid work surfaces: square, quiet, and legible.

- **Style:** `text-field` uses a dim parchment border and a black-ink fill.
- **Focus:** The border becomes `gold`; do not rely on a glow alone.
- **Error / Disabled:** Errors use a warm, readable red-pink text treatment; preserve enough contrast against the dialog panel.

### Dialogs

Authentication dialogs are framed guild papers held above the page.

- **Surface:** A dark panel with a high-contrast gold outer rule and a faint inset rule.
- **Type:** Use the display treatment only for the dialog title; labels and form content remain in the operating type system.
- **Dismissal:** The close control is a small gold-outlined square, and the surrounding overlay visibly mutes the underlying page.

### Campaign Ledger

The campaign ledger is the signature reusable pattern for discovery screens.

- **Record anatomy:** Photography first, then title, keyed rows, status stamp, and a concise route action.
- **Metadata:** Ledger keys use the compact gold label treatment; values stay parchment and truncate rather than breaking the grid.
- **Interaction:** A hovered record lifts as one unit and enlarges its image minimally. The nested action remains separately actionable.

## Do's and Don'ts

### Do:

- **Do** lead discovery routes with a clear gold action before asking a visitor to authenticate.
- **Do** use the real crest and real RPG-table photography as framed evidence of the guild and its campaigns.
- **Do** preserve square panels, thin engraved rules, and calm dark fields as screens become more operational.
- **Do** respect reduced-motion preferences; arrival and route emphasis must resolve to a complete, stable state.
- **Do** keep focus indicators high-contrast and visibly offset from dark, framed controls.

### Don't:

- **Don't** turn gold into a full-page background, a generic glow, or a decorative substitute for hierarchy.
- **Don't** replace the noticeboard/ledger logic with soft, rounded SaaS cards or undifferentiated fantasy texture.
- **Don't** use display lettering for paragraphs, form values, campaign metadata, or other dense UI.
- **Don't** invent social proof, availability metrics, or campaign facts through visual badges or decorative counters.
