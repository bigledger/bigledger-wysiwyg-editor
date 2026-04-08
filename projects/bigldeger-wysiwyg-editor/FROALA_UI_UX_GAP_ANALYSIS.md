# Froala UI/UX Gap Analysis For BigLedger WYSIWYG Editor

## Goal

Use the Froala screenshots shared on April 8, 2026 as a visual benchmark and identify:

- UI/UX polish gaps in the current `bigldeger-wysiwyg-editor`
- Features visible in the Froala screen that are missing or only partially exposed
- Safe, non-breaking improvements we can prioritize before publishing to npm

This analysis is focused on the editor chrome and toolbar experience first, not on changing editing logic.

## Progress Tracker

### Phase 1: UI polish only, no logic changes

- [x] Part 1. Introduce a proper SVG icon registry for the toolbar.
- [x] Part 2. Redesign toolbar spacing, grouping, separators, and overall visual hierarchy.
- [x] Part 3. Add styled tooltips to toolbar controls.
- [x] Part 4. Upgrade dropdown triggers to show current values and better caret styling.
- [x] Part 5. Upgrade dropdown menu visuals and option states.
- [x] Part 6. Move HTML/code toggle into a higher-level chrome area.
- [x] Part 7. Refine editor shell styling so toolbar and content feel like distinct surfaces.

### Phase 2: Surface already-supported commands

- [x] Part 1. Add `unlink`.
- [x] Part 2. Add `removeFormat`.
- [x] Part 3. Add `indent`.
- [x] Part 4. Add `outdent`.
- [x] Part 5. Add these to the full demo config and probably to the default toolbar.

### Phase 3: Add Froala-parity features that are actually missing

- [ ] Part 1. Paragraph/block format dropdown.
- [ ] Part 2. Quote/blockquote tool.
- [ ] Part 3. Fullscreen mode.
- [ ] Part 4. Optional document/file action area if the product really needs those actions.
- [ ] Part 5. Optional mode/header bar if `classic` vs `inline` becomes part of the public editor experience.

## Completed In This Pass

- Replaced the main toolbar icon map with a shared SVG icon registry.
- Updated toolbar button/dropdown rendering to use the shared registry instead of text or emoji-like placeholders.
- Upgraded dropdown triggers to show the current selected value for cases like font family.
- Replaced raw text caret and checkmark glyphs with SVG icons.
- Added font-preview styling to font family dropdown labels.
- Tightened toolbar spacing and dropdown menu styling without changing command logic.
- Surfaced `unlink` in the library default toolbar and in the full demo toolbar config.
- Surfaced `removeFormat` in the library default toolbar and in the full demo toolbar config.
- Surfaced `indent` and `outdent` in the library default toolbar and in the full demo toolbar config.
- Added non-breaking `separatorBefore` metadata plus visible toolbar dividers to create clearer command grouping.
- Added styled hover/focus tooltips to toolbar controls, and removed native toolbar `title` overlap after the duplicate-tooltip issue surfaced.
- Upgraded dropdown menus with better sizing, a contextual header, stronger selected states, and richer option previews.
- Moved the HTML/code mode control into a dedicated editor chrome area while keeping existing toolbar configs backward-compatible.
- Refined the editor shell into clearer chrome, toolbar, and content-canvas surfaces with stronger layering and spacing.
- Followed up on interaction regressions by preserving the editor selection on toolbar mouse interactions, so formatting and alignment actions apply on the first click.
- Raised the toolbar shell above the content shell and removed toolbar overflow clipping so dropdown menus and hover tooltips can render cleanly.
- Added regression coverage for selection-preserving toolbar mouse interactions in the toolbar component spec.
- Removed the stale post-command range restore pattern so toolbar actions do not keep re-applying outdated DOM selections after formatting changes.
- Updated the editor to restore its own last valid selection before toolbar commands and before dialog-driven actions like link, image, color, and table insertion.
- Normalized active font-size and font-family values so dropdown triggers can resolve and display the current option reliably.
- Removed demo-page host clipping in `toolbar-config` so menus and tooltips are not cut off by the wrapper around `wysiwyg-editor`.
- Re-anchored toolbar dropdown menus to the trigger itself instead of viewport-style fixed positioning so they open in the correct place inside the editor shell.
- Raised the active editor host above neighboring demo sections so open dropdown menus do not appear washed out behind later cards.
- Disabled pointer events on decorative toolbar icon, label, arrow, and indicator layers so the full visible control face remains clickable.

## Files Reviewed

- `src/app/demo/toolbar-config/toolbar-config.component.ts`
- `projects/bigldeger-wysiwyg-editor/src/lib/components/wysiwyg-editor/wysiwyg-editor.component.ts`
- `projects/bigldeger-wysiwyg-editor/src/lib/components/toolbar/toolbar.component.ts`
- `projects/bigldeger-wysiwyg-editor/src/lib/components/toolbar/toolbar.component.scss`
- `projects/bigldeger-wysiwyg-editor/src/lib/models/toolbar.interface.ts`
- `projects/bigldeger-wysiwyg-editor/src/lib/models/editor-command.interface.ts`
- `projects/bigldeger-wysiwyg-editor/src/lib/services/command.service.ts`
- `projects/bigldeger-wysiwyg-editor/src/lib/styles/themes.scss`

## What The Current Project Already Has

The good news is the current editor already has a solid config-driven foundation.

- The demo in `toolbar-config.component.ts` already exercises `button`, `dropdown`, and `dialog` toolbar types.
- The editor already supports undo/redo, bold, italic, underline, strikethrough, font size, font family, text color, background color, alignment, ordered lists, unordered lists, links, images, tables, and HTML/code toggle.
- The toolbar already has:
  - active states
  - disabled states
  - keyboard navigation
  - hover/focus tooltip descriptions
  - dropdown open/close handling

So the base architecture is not the problem. The main gap is presentation quality and surfacing the right tools cleanly.

## What Froala Is Doing Better In The Reference Screens

From the screenshots, Froala feels stronger because of presentation details, not just feature count.

- It uses a high-quality, consistent icon set with matching stroke weight and spacing.
- It separates the editor into clear visual zones:
  - mode/header bar
  - toolbar card
  - content canvas
- Hover feedback is polished:
  - visible tooltip
  - shortcut hint inside tooltip
  - clear hover tile state
- Dropdowns feel premium:
  - better placement
  - stronger shadow and layering
  - font items preview their own typography
  - clearer selected state
- Controls are grouped and distributed with intention instead of appearing as a flat sequence of tools.
- The code/HTML toggle is treated like a high-level editor mode control rather than just another toolbar icon.

## UI/UX Gaps To Fix First

These are the highest-value UI tasks that should not require changing editor logic.

### 1. Icon quality is the biggest visual gap

Status: Done in Phase 1, Part 1 for the main toolbar icon system. Dialogs and other editor surfaces can continue to reuse the same icon direction later.

Current toolbar icons in `toolbar.component.ts` are mostly text, arrows, punctuation, or emoji-like fallbacks such as:

- `B`, `I`, `U`
- `⬅️`, `↔️`, `➡️`
- `🔗`, `🖼️`, `🎨`, `🖍️`
- raw `▼`

Why this hurts:

- mixed visual language
- inconsistent sizing across platforms
- emoji rendering looks non-professional in an npm-ready editor
- toolbar feels like a prototype instead of a product

Recommendation:

- replace the ad hoc icon map with a single SVG icon registry
- use the same icon system across main toolbar, dialogs, and table tools
- keep command logic untouched; only swap icon rendering

### 2. Toolbar layout lacks grouping and hierarchy

Status: Done in Phase 1, Part 2 through grouped spacing and optional separators in the active toolbar config model.

Current config is a flat `tools: ToolbarTool[]` array and the toolbar layout uses small uniform gaps. Froala visually groups related commands, which makes scanning much easier.

Current gaps:

- no separators between command families
- no first-row vs second-row grouping
- no visual distinction between document-level controls and text-formatting controls
- crowded appearance when more tools are added

Recommendation:

- add optional, non-breaking grouping metadata or separator items
- visually separate:
  - history/document actions
  - inline formatting
  - alignment/list controls
  - insert actions
  - mode controls

### 3. Tooltip behavior is only basic today

Status: Done in Phase 1, Part 3 with a styled toolbar tooltip layer. Native toolbar `title` overlap was removed after it caused duplicate tooltips in the UI.

The current toolbar already sets `title` on buttons and dropdown triggers, so hover help is not completely missing. However, it is only using the browser-native tooltip.

Current gaps:

- no styled tooltip layer
- no consistent placement
- no richer shortcut display beyond plain title text
- dropdown options do not get the same level of hover explanation

Recommendation:

- keep `title` for accessibility fallback
- add a styled tooltip component for hover/focus
- include tool label plus shortcut hint, matching the Froala feel

### 4. Dropdown triggers do not feel “stateful”

Status: Done in Phase 1, Part 4 for current-value labels and SVG caret treatment. There is still room for future enhancement if we want richer trigger layouts.

Froala makes dropdowns feel like controls with a live current value. The current toolbar template always renders the static label for dropdown triggers.

Current gaps:

- selected font family is not surfaced in the trigger label
- selected font size is not surfaced in the trigger label
- trigger visuals are too close to plain buttons
- caret icon is a raw text glyph

Recommendation:

- show the current selected value in the trigger where available
- widen dropdown triggers for text values
- replace the text caret with SVG
- improve open state styling and spacing

Note:

- There is already logic for selected-option comparison.
- There is also an unused `ToolbarDropdownComponent` that already has `getCurrentValueLabel()`, which suggests the project already knows how to support a richer trigger UI.

### 5. Dropdown menus need visual polish

Status: Done in Phase 1, Part 5 with upgraded menu sizing, menu header context, stronger selected states, and richer font-family option previews.

The existing dropdown menu works, but it still feels generic compared to the Froala reference.

Current gaps:

- small default width
- generic menu styling
- limited visual separation between items
- font preview relies only on item text, not a refined presentation
- selected state is functional but not premium

Recommendation:

- make menu width better match the trigger/control intent
- improve shadow, corner radius, spacing, and hover background
- show typography previews more clearly for font family items
- improve selected check state and keyboard focus styling

### 6. Editor chrome does not yet feel product-grade

Status: Done in Phase 1, Part 7 with clearer chrome, toolbar-shell, and content-canvas layering.

The editor shell is functional, but Froala creates a better sense of structure through layered surfaces and spacing.

Current gaps:

- toolbar and content are visually simple blocks
- limited sense of “top chrome” vs “editing canvas”
- not enough contrast in interactive states

Recommendation:

- refine border, radius, shadows, and section dividers
- create a clearer toolbar surface above the content area
- improve active, hover, focus, and disabled visual contrast

### 7. HTML/code mode placement is weaker than the Froala reference

Status: Done in Phase 1, Part 6 by extracting `toggleHtmlView` from the visible toolbar and rendering it in a dedicated editor chrome area.

The current project already supports HTML mode through `toggleHtmlView`, which is good. The gap is mostly placement and importance in the UI.

Current gap:

- HTML/code toggle is treated as one more toolbar item instead of a top-level mode control

Recommendation:

- move HTML/code toggle into a higher-level editor action area
- keep the command and logic exactly as-is

### 8. Responsive toolbar behavior is still basic

The toolbar wraps, but wrapping alone does not produce a polished dense toolbar on smaller screens.

Current gaps:

- wrapping can make control grouping feel random
- dropdowns and buttons can lose structure on narrow widths

Recommendation:

- use a deliberate mobile strategy:
  - horizontal scroll toolbar
  - overflow group
  - or compact secondary row

## Feature Comparison Against The Froala Screens

To avoid confusion, the gaps below are split into three buckets.

## A. Already Present In BigLedger

- Undo
- Redo
- Bold
- Italic
- Underline
- Strikethrough
- Font size dropdown
- Font family dropdown
- Text color
- Background color/highlight
- Align left
- Align center
- Align right
- Justify
- Ordered list
- Unordered list
- Link insertion
- Image insertion
- Table insertion
- HTML/code mode toggle

## B. Supported Or Partially Supported, But Not Surfaced Well

These are especially good candidates for near-term improvement because the logic already exists or mostly exists.

- `unlink`
  - supported in the editor flow
  - now exposed in the default toolbar and full demo toolbar
- `indent` and `outdent`
  - supported in the command model/service
  - now exposed in the default toolbar and full demo toolbar
- `removeFormat`
  - supported in the command service
  - now exposed in the default toolbar and full demo toolbar
- better current-value dropdown labels
  - supported conceptually by existing selection state and the unused dropdown component pattern
  - not implemented in the active toolbar template

## C. Actually Missing Compared To The Froala Reference

These appear absent from the current public toolbar model or current editor surface.

### 1. Paragraph/block format dropdown

The Froala screen shows a `Normal` dropdown for paragraph/block styles. This is not currently exposed in `ToolbarConfig`, the default toolbar, or the command model.

Examples:

- Normal
- Paragraph
- H1/H2/H3
- Blockquote

### 2. Fullscreen editor control

The Froala screen shows a fullscreen-style control. There is no fullscreen command or toolbar affordance in the current editor.

### 3. Quote/blockquote quick action

The reference toolbar shows a quote-style control. There is no dedicated blockquote/quote tool in the current toolbar model.

### 4. Mode/header bar

The Froala reference has a higher-level header area with modes such as:

- Classic
- Inline
- Document Ready

The current editor has no equivalent mode/header shell.

### 5. Document/file actions visible in the Froala screenshot

The screenshot includes a small cluster of document/file-oriented actions before the formatting tools. Based on the static image, they appear to be file import/export or document actions.

These are not present in the current toolbar model.

Note:

- Because this is based on a screenshot only, the exact labels of those file actions should be confirmed before implementation.

## Important Product Insight

The current gap is not only “missing features.” It is mostly:

- lack of visual hierarchy
- weak icon system
- weak grouping
- weak mode presentation
- weak dropdown polish

This means the editor can look much better before adding any new logic-heavy features.

## Recommended Priority Order

## Phase 1: UI polish only, no logic changes

1. Introduce a proper SVG icon registry for the toolbar.
2. Redesign toolbar spacing, grouping, separators, and overall visual hierarchy.
3. Add styled tooltips while keeping native `title` as fallback.
4. Upgrade dropdown triggers to show current values and better caret styling.
5. Upgrade dropdown menu visuals and option states.
6. Move HTML/code toggle into a higher-level chrome area.
7. Refine editor shell styling so toolbar and content feel like distinct surfaces.

## Phase 2: Surface already-supported commands

1. Add `unlink`. Done.
2. Add `removeFormat`. Done.
3. Add `indent`. Done.
4. Add `outdent`. Done.
5. Add these to the full demo config and probably to the default toolbar. Done.

## Phase 3: Add Froala-parity features that are actually missing

1. Paragraph/block format dropdown.
2. Quote/blockquote tool.
3. Fullscreen mode.
4. Optional document/file action area if the product really needs those actions.
5. Optional mode/header bar if “classic” vs “inline” becomes part of the public editor experience.

## Safe Implementation Notes

To keep risk low before npm publishing:

- keep `CommandService` behavior unchanged for Phase 1
- keep toolbar command names unchanged
- improve mostly in:
  - `toolbar.component.ts`
  - `toolbar.component.scss`
  - theme tokens
  - icon rendering
  - optional non-breaking toolbar config extensions

The safest first milestone is:

- same commands
- same data flow
- same demo behavior
- much better visual presentation

## Short Conclusion

BigLedger already has enough functionality to look much closer to Froala without a logic rewrite. The fastest win is a toolbar design pass:

- better SVG icons
- better grouping
- better tooltips
- better dropdown UX
- better editor chrome

After that, the next meaningful parity items are:

- paragraph format dropdown
- clear formatting
- indent/outdent
- unlink
- blockquote
- fullscreen
