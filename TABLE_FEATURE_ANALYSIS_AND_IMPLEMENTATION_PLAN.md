# WYSIWYG Table Feature Analysis And Implementation Plan

## 1. Introduction

This document compares the expected table editing experience shown in the reference screenshots under `projects/bigldeger-wysiwyg-editor/table_context` with the current implementation in the `bigldeger-wysiwyg-editor` library.

The goal is to give developers a precise implementation guide for closing the gap between the current DOM-based table editing features and the richer contextual table UX shown in the screenshots.

### Scope of analysis

- Reference screenshots only show table-related UI states, not full interaction flows.
- Current implementation was analyzed from the custom Angular editor components, table services, styling files, and command routing.
- This editor is **not** based on ProseMirror, TipTap, Quill, or Slate.
- The current editor is a **custom Angular standalone component** built on top of:
  - native `contenteditable`
  - `Selection` / `Range`
  - `document.execCommand` plus custom fallbacks
  - DOM-level table mutation services

### Primary code paths reviewed

- `projects/bigldeger-wysiwyg-editor/src/lib/components/wysiwyg-editor/wysiwyg-editor.component.ts`
- `projects/bigldeger-wysiwyg-editor/src/lib/components/editor-content/editor-content.component.ts`
- `projects/bigldeger-wysiwyg-editor/src/lib/components/dialogs/table-dialog/table-dialog.component.ts`
- `projects/bigldeger-wysiwyg-editor/src/lib/components/toolbar/toolbar.component.ts`
- `projects/bigldeger-wysiwyg-editor/src/lib/services/table.service.ts`
- `projects/bigldeger-wysiwyg-editor/src/lib/services/table-handler.service.ts`
- `projects/bigldeger-wysiwyg-editor/src/lib/services/nested-table.service.ts`
- `projects/bigldeger-wysiwyg-editor/src/lib/services/table-context-menu.service.ts`
- `projects/bigldeger-wysiwyg-editor/src/lib/services/command.service.ts`
- `projects/bigldeger-wysiwyg-editor/src/lib/services/selection.service.ts`
- `projects/bigldeger-wysiwyg-editor/src/lib/models/table.interface.ts`
- `projects/bigldeger-wysiwyg-editor/src/lib/styles/global.scss`
- `projects/bigldeger-wysiwyg-editor/src/lib/styles/table-handlers.scss`
- `projects/bigldeger-wysiwyg-editor/src/lib/styles/cell-toolbar.scss`
- `projects/bigldeger-wysiwyg-editor/src/lib/styles/table-context-menu.scss`

---

## 2. Extracted Features From Screenshots

The screenshots show a floating contextual table toolbar anchored near the active table cell. Some submenu contents are fully visible, while some are only implied by iconography. The list below separates **explicitly visible** features from **strongly indicated** features.

### 2.1 Explicitly visible features

#### Structure

- Table header toggle
  - Tooltip visible: `Table Header`
  - Appears as a toggle button in the popup
- Table footer toggle
  - Tooltip visible: `Table Footer`
  - Appears as a toggle button in the popup
- Remove table
  - Tooltip visible: `Remove Table`
- Row operations dropdown
  - Visible submenu items:
    - `Insert row above`
    - `Insert row below`
    - `Delete row`
- Column operations dropdown
  - Visible submenu items:
    - `Insert column before`
    - `Insert column after`
    - `Delete column`

#### Cell structure editing

- Split / merge dropdown
  - Visible submenu items:
    - `Merge cells`
    - `Vertical split`
    - `Horizontal split`
  - `Merge cells` is disabled in one screenshot when not applicable

#### Alignment and formatting

- Horizontal alignment dropdown
  - Visible submenu with four options:
    - align left
    - align center
    - align right
    - justify

#### Popup behavior

- Floating contextual toolbar appears near the selected cell
- Popup is grouped into two rows with separators
- Toolbar contains both direct actions and dropdown-trigger actions
- Active actions are visually highlighted
- Tooltips appear on hover
- Popup stays anchored while a table cell is selected

#### Selection state

- Active cell is highlighted in blue
- Whole table boundary is outlined in yellow
- A floating table handle/control appears at the top-left of the table

### 2.2 Strongly indicated features from visible iconography

These are not fully expanded in the screenshots, but the UI strongly suggests they exist.

#### Table-level controls

- Table settings or table properties action
  - Table icon with a gear
- Table style presets action
  - Table icon with a star and dropdown

#### Additional cell or row formatting

- At least one more table-formatting dropdown exists besides alignment
- Likely a cell style or cell formatting menu is available
- The popup layout suggests grouped categories for:
  - structure
  - settings
  - alignment
  - style presets

### 2.3 Logical grouping of expected features

#### Structure

- Insert table
- Toggle header row
- Toggle footer row
- Insert row above / below
- Delete row
- Insert column before / after
- Delete column
- Delete table

#### Cell editing

- Merge cells
- Split cell vertically
- Split cell horizontally
- Cell selection awareness

#### Styling

- Horizontal alignment
- Likely vertical alignment
- Likely table styles
- Likely cell styles
- Likely table settings / formatting presets

#### Behavior

- Contextual popup near selected cell
- Direct actions + dropdown submenus
- Disabled states for invalid actions
- Active state highlighting for toggles

#### Advanced interaction

- Table-level selection affordance
- Cell-level selection affordance
- Potential move/resize/handle affordance

---

## 3. Current Implementation Overview

## 3.1 Editor architecture

The current editor is a custom Angular implementation, not a model-driven editor framework.

### Architecture summary

- Rendering/editing model: native `contenteditable`
- Selection model: browser `Selection` and `Range`
- Formatting model: `document.execCommand` plus custom wrappers for unsupported cases
- Table operations: direct DOM manipulation via services
- Dialog system: lazy-loaded Angular standalone dialogs
- Toolbar system: config-driven Angular toolbar component

### Architectural consequence

This design is lightweight and fast to extend for simple formatting, but complex table features become harder because:

- there is no normalized document schema
- there is no explicit table node model in editor state
- merged cells and rectangular cell selection are difficult to reason about using only DOM position
- actions depend heavily on the current browser selection being valid

## 3.2 Existing table-related components and services

### Components

#### `table-dialog.component.ts`

Current role:

- Insert or edit basic table properties
- Grid picker for row/column count
- Manual row/column inputs
- Header-row checkbox on insert
- Width, border, cell padding, alignment, CSS class fields

Current limitations:

- No footer support
- No table-style preset picker
- No cell-style preset picker
- No per-cell editing in dialog
- No border color, border style, padding presets, or spacing presets beyond numeric fields

#### `editor-content.component.ts`

Current role:

- Main `contenteditable` surface
- Delegates table clicks to table-related services
- Initializes resize handlers
- Connects content changes and selection changes

Current table responsibilities:

- table selection routing
- content synchronization
- context-menu integration

#### `wysiwyg-editor.component.ts`

Current role:

- Main editor container
- Routes toolbar command `insertTable`
- Opens table dialog
- Builds table HTML for insertion
- Updates existing table properties through `CommandService`

#### `toolbar.component.ts`

Current role:

- Config-driven toolbar renderer
- Supports table insertion button through `insertTable`
- No first-class table-editing toolbar group beyond insert

### Services

#### `table.service.ts`

Implements:

- table insertion at cursor
- current table lookup from browser selection
- insert row above / below
- delete row
- insert column before / after
- delete column
- delete table
- merge cells
- split cell
- set cell background color
- set cell text alignment
- set cell vertical alignment
- get table properties
- update table properties

Limitations:

- merge is simplified and not range-based
- split is generic but not explicit vertical vs horizontal command-driven UX
- no header toggle
- no footer toggle
- no table-style semantics beyond CSS class string
- no robust colspan/rowspan matrix model
- uses `document.querySelector('[contenteditable="true"]')`, which is fragile for multiple editor instances

#### `table-handler.service.ts`

Implements:

- whole-table selection outline
- resize handles on all table edges/corners
- drag resize for whole table box

Limitations:

- no column resize handles
- no row height handles
- no per-cell resize behavior

#### `nested-table.service.ts`

Implements:

- simple cell toolbar for nested table insertion
- nested table HTML generation

Current status:

- nested-table support exists in service form
- feature is secondary compared with the richer context-menu path
- no screenshot evidence that nested insertion is part of the expected UX

#### `table-context-menu.service.ts`

Current role:

- DOM-built floating popup for table actions
- includes grouped actions for:
  - row actions
  - column actions
  - merge / split
  - background color
  - horizontal alignment
  - vertical alignment
  - cell styles
  - table styles
  - delete table

Current status:

- this moves the editor closer to the screenshot UX
- however it is still incomplete compared with the reference
- the service currently generates raw HTML strings rather than using an Angular component

Missing relative to screenshots:

- no header toggle in the popup
- no footer toggle in the popup
- no explicit row dropdown UI matching screenshot behavior
- no explicit column dropdown UI matching screenshot behavior
- no visible split submenu with separate merge / vertical split / horizontal split options
- no visible table settings submenu

#### `command.service.ts`

Table-related capability already exposed:

- insert table
- row / column operations
- merge / split
- cell background color
- cell horizontal / vertical alignment
- get/update table properties

This is useful because it already gives a single service boundary for editor commands.

## 3.3 Already implemented features

### Fully implemented or materially present

- Insert table from toolbar
- Insert table through a dialog with row/column picker
- Optional header row on initial insertion
- Edit table width, border, padding, spacing, alignment, CSS class
- Select a table in the editor
- Resize entire table via drag handles
- Insert row above / below
- Delete row
- Insert column before / after
- Delete column
- Delete entire table
- Set cell background color
- Set cell horizontal alignment
- Set cell vertical alignment
- HTML mode and visual mode coexist with table content
- Table-related commands are routed through `CommandService`

## 3.4 Partially implemented features

- Floating table context menu
  - present, but not yet aligned with the exact screenshot interaction model
- Merge cells
  - present, but simplified to current cell plus adjacent sibling behavior
- Split cell
  - present, but not exposed as distinct vertical vs horizontal actions in the popup
- Table styles
  - class-based preset support exists in the context-menu service and SCSS, but UX is basic and not screenshot-matched
- Cell styles
  - class-based preset support exists in the context-menu service and SCSS, but UX is basic and not screenshot-matched
- Nested tables
  - service exists, but this is not a core part of the screenshot UX and is not integrated into the richer table popup model

## 3.5 Missing features

- Header toggle in the contextual popup
- Footer toggle in the contextual popup
- Footer row data/model support
- Screenshot-like row dropdown presentation
- Screenshot-like column dropdown presentation
- Explicit split submenu with:
  - merge cells
  - vertical split
  - horizontal split
- Table settings popup / gear-driven configuration path
- Multi-cell rectangular selection model
- Merge validation based on actual selected cell range
- Colspan/rowspan-aware structural operations
- Disabled-state logic matching actual applicability of each action
- Column resizing independent of whole-table resize
- Row height resizing independent of whole-table resize
- Table handle / drag affordance matching screenshot behavior
- Clear separation between table actions and nested-table actions

---

## 4. Gap Analysis

| Feature | Status (Yes / No / Partial) | Notes |
|---|---|---|
| Insert table from toolbar | Yes | Available through toolbar dialog command. |
| Table insertion dialog with size picker | Yes | Implemented in `table-dialog.component.ts`. |
| Edit table width / border / padding / spacing | Yes | Available through dialog and `updateTableProperties`. |
| Header row on initial creation | Yes | Supported during insert dialog. |
| Toggle header from context menu | No | Screenshot shows direct toggle; current popup does not. |
| Footer row support | No | No footer model, toggle, or rendering logic. |
| Toggle footer from context menu | No | Screenshot shows direct toggle; current popup does not. |
| Remove table from context popup | Partial | Implemented in new context-menu service, but not yet screenshot-equivalent in UX. |
| Row dropdown menu | Partial | Functional row operations exist, but current popup uses direct buttons rather than the same grouped dropdown pattern. |
| Column dropdown menu | Partial | Functional column operations exist, but current popup UX differs from screenshots. |
| Insert row above | Yes | Implemented in `TableService`. |
| Insert row below | Yes | Implemented in `TableService`. |
| Delete row | Yes | Implemented in `TableService`. |
| Insert column before | Yes | Implemented in `TableService`. |
| Insert column after | Yes | Implemented in `TableService`. |
| Delete column | Yes | Implemented in `TableService`. |
| Merge cells | Partial | Simplified logic, no rectangular selection support. |
| Vertical split | Partial | Generic split exists, but no dedicated vertical split command or UX. |
| Horizontal split | Partial | Generic split exists, but no dedicated horizontal split command or UX. |
| Disabled merge state when invalid | No | Screenshot shows disabled action; current logic does not expose this UX state. |
| Cell background color | Yes | Implemented in `TableService`; color picker present in context-menu service. |
| Horizontal alignment popup | Partial | Implemented in context-menu service, but overall popup is not yet fully screenshot-matched. |
| Vertical alignment popup | Partial | Present in current context-menu service, not visible in screenshots but useful. |
| Table style presets | Partial | Present as simple CSS class presets only. |
| Cell style presets | Partial | Present as simple CSS class presets only. |
| Table settings popup | No | Gear icon behavior from screenshot is not implemented. |
| Whole-table resize handles | Yes | Implemented in `table-handler.service.ts`. |
| Column resize handles | No | Not implemented. |
| Row resize handles | No | Not implemented. |
| Active cell highlight | Partial | Some selection styling exists, but not the same table-cell state model as reference UX. |
| Whole-table outline | Yes | Table selection outline is implemented. |
| Top-left table handle / anchor | No | Screenshot shows a handle; current implementation does not replicate it. |
| Multi-cell range selection | No | No matrix-based selection model. |
| Colspan / rowspan-aware structure operations | Partial | Split and merge exist but are not robust. |
| Nested table insertion | Partial | Exists as a separate service, but not part of reference popup behavior. |

---

## 5. Implementation Plan (Step-by-Step)

This plan is ordered to reduce rework. The core principle is: **stabilize table state and selection first, then finish the popup UX, then add advanced styling and resize behavior.**

## Step 1. Define a table interaction model ✅ DONE

### What needs to be built

Add an explicit table interaction layer that tracks:

- active table element
- active cell element
- selected cell range or matrix selection
- active header state
- active footer state
- valid actions for current selection

### Where to add it

- Update `src/lib/models/table.interface.ts`
- Create `src/lib/services/table-selection.service.ts`
  - or extend `TableService` if the team prefers fewer services

### Why this is needed

Current table logic depends almost entirely on browser selection and DOM traversal. That is enough for simple single-cell actions, but it is not enough for:

- rectangular cell selection
- valid merge detection
- explicit vertical vs horizontal split
- disabled states in popup actions
- robust colspan / rowspan behavior

### Suggested data additions

- `TableCellPosition { row: number; column: number }`
- `TableCellRange { start: TableCellPosition; end: TableCellPosition }`
- `TableActionAvailability { canMerge: boolean; canSplitVertical: boolean; canSplitHorizontal: boolean; canDeleteRow: boolean; ... }`

## Step 2. Refactor table DOM operations into semantic actions ✅ DONE

### What needs to be built

Expand `TableService` so every user action maps to a well-defined method.

### Where to change

- Update `src/lib/services/table.service.ts`
- Update `src/lib/services/command.service.ts`

### Methods to add or improve

- `toggleHeaderRow()`
- `toggleFooterRow()`
- `mergeSelectedCells(range)`
- `splitCellHorizontally(cell)`
- `splitCellVertically(cell)`
- `getActionAvailability()`
- `applyTableStyle(styleClass)`
- `applyCellStyle(styleClass)`
- `removeTableStyles()`
- `removeCellStyles()`

### Critical implementation detail

Do not continue growing table logic as ad hoc DOM edits. Centralize all table mutations in `TableService` so that:

- context menu
- toolbar
- keyboard shortcuts
- future floating inspectors

all call the same methods.

## Step 3. Finish the contextual popup as a real UI component ✅ DONE

### What needs to be built

Replace or evolve the current raw-HTML `TableContextMenuService` into a real Angular overlay component.

### Where to add it

- Create `src/lib/components/table-context-menu/table-context-menu.component.ts`
- Create `src/lib/components/table-context-menu/table-context-menu.component.scss`
- Keep a service only for positioning / state if needed:
  - `src/lib/services/table-context-menu.service.ts`

### Why this matters

The current service-generated HTML is fast to prototype but difficult to maintain because:

- it is harder to test
- submenu logic is manual DOM code
- accessibility is harder to maintain
- state synchronization with Angular is weaker

### UI requirements to match screenshots

- two-row floating popup
- direct toggle buttons for:
  - header
  - footer
  - remove table
- dropdown triggers for:
  - row actions
  - column actions
  - split / merge actions
  - alignment
  - styles
  - settings
- active state styling
- disabled state styling
- anchor near selected cell

## Step 4. Implement header and footer row semantics ✅ DONE

### What needs to be built

Add full header/footer row support.

### Where to change

- `src/lib/services/table.service.ts`
- `src/lib/models/table.interface.ts`
- `src/lib/components/dialogs/table-dialog/table-dialog.component.ts`
- `src/lib/components/wysiwyg-editor/wysiwyg-editor.component.ts`

### Required behavior

- Header toggle:
  - convert first row cells to `th` when enabled
  - convert back to `td` when disabled
- Footer toggle:
  - create or remove final footer row
  - decide whether footer uses `td` or `th` semantics based on design choice

### Data/model changes

- add `hasFooter?: boolean` to `TableData`
- preserve header/footer state in table property reads and writes

## Step 5. Implement proper merge and split behavior ✅ DONE

### What needs to be built

Replace the simplified merge logic with span-aware operations.

### Where to change

- `src/lib/services/table.service.ts`
- possibly add helper utilities:
  - `src/lib/services/table-grid.service.ts`
  - or `src/lib/utils/table-grid.util.ts`

### Required behavior

- Merge only when selection forms a valid rectangle
- Update both `rowspan` and `colspan` as required
- Remove covered cells safely
- Support split horizontally and vertically as separate actions
- Restore missing cells when unmerging

### Dependency

This step depends on Step 1 because a valid cell-range model is needed.

## Step 6. Add settings, style presets, and richer formatting ✅ DONE

### What needs to be built

Finish the style and settings portion suggested by the screenshots.

### Where to change

- `src/lib/components/table-context-menu/*`
- `src/lib/components/dialogs/table-dialog/table-dialog.component.ts`
- `src/lib/styles/table-context-menu.scss`
- `src/lib/styles/global.scss`

### Expected features

- table style presets
- cell style presets
- alignment presets
- border style / width / color options
- background color presets
- padding presets or numeric controls
- table settings panel for advanced properties

### Reusability approach

Use declarative config in `TableConfig`:

- `tableStyles`
- `tableCellStyles`
- `cellColorPresets`
- future `tableBorderStyles`

This keeps the popup generic and lets host apps define their own presets.

## Step 7. Add column and row resizing if required by product goal

### What needs to be built

Extend resizing beyond whole-table box resize.

### Where to change

- `src/lib/services/table-handler.service.ts`
- possibly add dedicated logic in `src/lib/services/table-resize.service.ts`

### Required behavior

- drag column borders to adjust column widths
- drag row borders to adjust row heights if desired
- maintain usable minimum sizes
- avoid breaking merged-cell layouts

### Important note

This is significantly more complex than whole-table resize and should come after merge/split correctness.

## Step 8. Rationalize nested-table support

### What needs to be built

Decide whether nested tables are a first-class supported feature.

### Where to change

- `src/lib/services/nested-table.service.ts`
- `src/lib/components/editor-content/editor-content.component.ts`
- contextual popup actions if nested tables must remain supported

### Recommendation

- If nested tables are required: integrate them into the same contextual table popup.
- If not required: keep the service internal or deprecate it to reduce UI confusion.

## Step 9. Expose table actions cleanly through toolbar and public API ✅ DONE

### What needs to be built

Decide which table commands should be callable from toolbar config and from host applications.

### Where to change

- `src/lib/models/toolbar.interface.ts`
- `src/lib/components/toolbar/toolbar.component.ts`
- `src/lib/services/command.service.ts`
- `src/public-api.ts`

### Candidates

- `insertTable`
- `toggleTableHeader`
- `toggleTableFooter`
- `tableStyle`
- `tableCellStyle`
- `tableProperties`

### Goal

The contextual popup should be the main editing UX, but the library API should still expose structured commands for automation and integration.

## Step 10. Add tests before expanding more UX

### What needs to be built

Automated coverage for structural table mutations.

### Where to add tests

- unit tests near:
  - `table.service.ts`
  - `table-handler.service.ts`
  - `table-context-menu` component/service
- end-to-end tests under:
  - `cypress/e2e/`

### Priority scenarios

- insert table
- toggle header
- toggle footer
- row insert/delete
- column insert/delete
- merge rectangle
- split horizontal
- split vertical
- apply alignment
- apply table style
- apply cell style
- resize table

---

## 6. Technical Recommendations

## 6.1 Architecture improvements

### Prefer Angular UI components over raw DOM string generation

Current `TableContextMenuService` builds HTML manually. That is acceptable for prototyping but not ideal for a production-quality editor popup.

Recommended direction:

- Angular standalone component for popup UI
- service for positioning, visibility, and active target state

### Centralize table mutations in one service boundary

Do not spread table DOM writes across components, popup services, and editor content handlers.

Recommended boundary:

- `TableService` owns all table DOM mutations
- UI layers only call semantic methods

### Avoid editor-global DOM queries

`document.querySelector('[contenteditable="true"]')` is unsafe when multiple editor instances exist.

Recommended fix:

- pass the active editor host element into `TableService`
- or register the current editor instance in a scoped service

### Add a table grid abstraction

Complex table editing is easier if the service can build an internal grid representation that accounts for `rowspan` and `colspan`.

Recommended helper:

- `buildTableGrid(table: HTMLTableElement): TableGrid`

This will make merge, split, insertion, deletion, and selection validation significantly safer.

## 6.2 Best practices for WYSIWYG table handling

- Treat the DOM as a rendering surface, not the only state model, for advanced table editing
- Separate:
  - selection state
  - mutation logic
  - popup UI
  - styling presets
- Use CSS classes for styles instead of stacking many inline styles
- Preserve semantic HTML where possible:
  - `thead`
  - `tbody`
  - `tfoot`
  - `th`
  - `td`
- Emit one consistent content-change event path after every table mutation

## 6.3 Performance considerations

- Use event delegation for table interactions instead of attaching many listeners to many cells
- Reposition popup using `requestAnimationFrame`
- Reinitialize resize handles only when table structure actually changes
- Prefer class toggles over repeated inline style writes where possible
- Avoid expensive full-editor HTML rewrites after every table interaction

## 6.4 Extensibility recommendations

- Keep table style presets configurable via `TableConfig`
- Make popup sections feature-flagged so host apps can disable advanced features
- Reserve API space for future features such as:
  - cell border editor
  - row background styles
  - table captions
  - accessibility helpers for headers and scopes
  - CSV / spreadsheet-style paste into table

## 6.5 Strategic recommendation

If table editing requirements continue to grow beyond this screenshot parity target, evaluate whether the current `contenteditable` architecture should remain the long-term base.

Short term:

- current architecture can support screenshot parity with disciplined DOM utilities

Long term:

- highly advanced tables are usually easier on a schema-driven editor architecture

This is not an immediate migration recommendation, but it should be kept in mind before adding spreadsheet-class behavior.

---

## 7. Conclusion

The current library already has a meaningful table foundation:

- table insertion dialog
- row and column CRUD operations
- whole-table resize
- basic merge / split
- cell background and alignment editing
- command routing through a reusable service layer

However, the screenshot reference expects a more polished **contextual table editing experience** with:

- direct header/footer toggles
- dropdown-based row and column actions
- explicit merge and split submenu behavior
- stronger visual state management
- richer settings and style controls

### Practical implementation priority

1. Add a real table selection model.
2. Make merge / split span-aware.
3. Finish the popup as an Angular component.
4. Add header/footer semantics.
5. Complete style/settings parity.
6. Add deeper resize behavior only after table structure is robust.

If implemented in that order, the editor can move from a functional custom table toolset to a much more professional screenshot-matched table editing UX without forcing an immediate editor-framework rewrite.