# More Rich Toolbar Group — Implementation Plan

**Target version:** `v1.5.0`  
**Based on:** Froala screenshots in `bigledger-wysiwyg-editor/image 2/` (13 images)  
**Constraint:** Existing functionality must not be broken.

---

## 1. Screenshot Analysis Summary

### What the "More Rich" group looks like (Froala reference)

| # | Icon visual | Command | Type | Status |
|---|-------------|---------|------|--------|
| 1 | Landscape/mountain | `insertImage` | dialog | ✅ Exists |
| 2 | Video camera | `insertVideo` | dialog | ✅ Exists (needs tab enhancement) |
| 3 | Two horizontal bars (HR divider) | `insertHR` | button | ❌ New |
| 4 | 4×4 grid | `insertTable` | dialog | ✅ Exists |
| 5 | Smiley face | `emoticons` | dialog | ❌ New |
| 6 | Flag | `insertBookmark` | dialog | ❌ New |
| 7 | Omega (Ω) | `specialCharacters` | dialog | ❌ New |
| 8 | 3-node share icon | `embeds` | dialog | ❌ New |
| 9 | Blank document | `uploadFile` | dialog | ❌ New |
| 10 | Horizontal dash `—` | `insertHR` | button | same as #3 |
| 11 | Red/orange doc (Froala Pro) | — | — | ⏭ Skip (Pro feature) |

**Group toggle button:** `+:` visual = `moreRich` icon (plus sign with grid dots)

### What the dialogs show

| Dialog | Tabs / Features |
|--------|----------------|
| **Insert Image** (`rich_03–06`) | Tab 1: Upload (Drop image / click), Tab 2: By URL (`http://` field + Insert), Tab 3: Browse (media manager — Froala Pro, **skip**). Already has 2 tabs. |
| **Insert Video** (`rich_07–10`) | Tab 1: By URL (URL field + Autoplay + Insert), Tab 2: Embedded Code (textarea + Insert), Tab 3: Upload Video (Drop video / click). **Currently only has URL form — needs tab redesign.** |
| **Emoticons** (`rich_11`) | Grid of emoji with 7 category tabs at top (People, Animals, Food, Globe, Signs, Symbols, Flags). Clicking an emoji inserts it. Attribution: "Emoji free by Emoji One". |
| **Embeds** (`rich_12`) | Single input: "Paste in a URL to embed" + Insert button. Inserts an `<iframe>` wrapping the URL. |
| **Upload File** (`rich_13`) | Drop zone "Drop file (or click)". On upload: inserts a `<a href>` download link into the content. |

---

## 2. Files to Create

| File | Description |
|------|-------------|
| `src/lib/components/dialogs/emoticons-dialog/emoticons-dialog.component.ts` | Emoji picker with category tabs |
| `src/lib/components/dialogs/emoticons-dialog/emoticons-dialog.component.html` | Template |
| `src/lib/components/dialogs/emoticons-dialog/emoticons-dialog.component.scss` | Styles |
| `src/lib/components/dialogs/special-chars-dialog/special-chars-dialog.component.ts` | Special character grid picker |
| `src/lib/components/dialogs/special-chars-dialog/special-chars-dialog.component.html` | Template |
| `src/lib/components/dialogs/special-chars-dialog/special-chars-dialog.component.scss` | Styles |
| `src/lib/components/dialogs/embeds-dialog/embeds-dialog.component.ts` | URL-to-embed input dialog |
| `src/lib/components/dialogs/embeds-dialog/embeds-dialog.component.html` | Template |
| `src/lib/components/dialogs/embeds-dialog/embeds-dialog.component.scss` | Styles |
| `src/lib/components/dialogs/file-upload-dialog/file-upload-dialog.component.ts` | File drop-zone dialog |
| `src/lib/components/dialogs/file-upload-dialog/file-upload-dialog.component.html` | Template |
| `src/lib/components/dialogs/file-upload-dialog/file-upload-dialog.component.scss` | Styles |
| `src/lib/components/dialogs/bookmark-dialog/bookmark-dialog.component.ts` | Anchor ID input dialog |
| `src/lib/components/dialogs/bookmark-dialog/bookmark-dialog.component.html` | Template |
| `src/lib/components/dialogs/bookmark-dialog/bookmark-dialog.component.scss` | Styles |

---

## 3. Files to Modify

| File | What changes |
|------|-------------|
| `toolbar-icons.ts` | Add 7 new SVG icons |
| `video-dialog.component.ts` | Redesign with 3 tabs (URL / Embedded Code / Upload) |
| `video-dialog.component.html` | New tabbed template |
| `video-dialog.component.scss` | Tab styles |
| `command.service.ts` | Add `insertHR`, `insertEmoji`, `insertSpecialChar`, `insertEmbed`, `insertBookmark` handlers |
| `lazy-loader.service.ts` | Add `emoticons`, `specialChars`, `embeds`, `fileUpload`, `bookmark` loaders |
| `wysiwyg-editor.component.ts` | Add `handleCommand` cases + dialog show/close methods for all 5 new tools |
| `bigldeger-wysiwyg-editor.ts` (public API) | Export new dialog components |
| `bigldeger-wysiwyg-editor/package.json` | Bump to `1.5.0` |
| `wavelet-cp-commerce/wysiwyg-editor.config.ts` | Add `moreRich` group, move image/video/table into it, remove them from main row |

---

## 4. New Icons (toolbar-icons.ts)

All icons follow existing conventions: `strokeIcon(path)` or `fillIcon(path)`, viewBox `0 0 24 24`, **no `<text>` elements**.

| Key | Visual description | SVG approach |
|-----|-------------------|-------------|
| `moreRich` | Plus sign (`+`) with 4 small dots forming a 2×2 grid to the right | Cross path for `+` + 4 circles |
| `insertHR` | Two short horizontal bars separated by a wider gap in the middle | Three `<line>` elements forming HR visual |
| `emoticons` | Circle face with two dot eyes and a curved smile | `<circle>` (head) + 2 small `<circle>` (eyes) + arc `<path>` (smile) |
| `insertBookmark` | Flag shape: a vertical pole with a triangular pennant | `<line>` (pole) + `<path>` (flag triangle) |
| `specialCharacters` | Omega (Ω): horseshoe arc with two small feet at bottom | Single `<path>` tracing the Ω outline |
| `embeds` | 3-node share graph: 3 circles connected by 2 lines | 3 `<circle>` + 2 `<line>` |
| `uploadFile` | Blank document page with a small upward arrow overlay | `<path>` (page outline) + `<polyline>` (up arrow) |

---

## 5. New Command Handlers (command.service.ts)

```typescript
// insertHR
if (commandName === 'insertHR') {
  return this.insertHorizontalRule();
}

// insertEmoji — called by emoticons dialog output
insertAtCursor(character: string): boolean { ... }

// insertSpecialChar — called by specialCharacters dialog output
// same insertAtCursor helper

// insertEmbed — called by embeds dialog output
insertEmbedHtml(url: string): boolean { ... }
// wraps in <div class="wysiwyg-embed"><iframe src="..."></iframe></div>

// insertBookmark — called by bookmark dialog output
insertBookmarkAnchor(id: string): boolean { ... }
// inserts <a id="..." name="..."></a> at cursor

// insertUploadedFile — called by fileUpload dialog output
insertFileLink(url: string, filename: string): boolean { ... }
// inserts <a href="..." download>filename</a>
```

---

## 6. New Dialog Components

### 6a. EmoticonsDialogComponent
- **Inputs:** `visible: boolean`
- **Outputs:** `emojiSelected: EventEmitter<string>`, `dialogClosed: EventEmitter<void>`
- **State:** `activeCategory: string` (default `'smileys'`)
- **Categories (7):** Smileys/People, Animals & Nature, Food & Drink, Travel & Places, Signs, Symbols, Flags
- **UI:** Category tab strip (icon per category) → emoji grid (8 per row, scrollable) → clicking an emoji emits it and closes
- **Emoji data:** Inline constant array (Unicode code points, no third-party library)

### 6b. SpecialCharsDialogComponent
- **Inputs:** `visible: boolean`
- **Outputs:** `charSelected: EventEmitter<string>`, `dialogClosed: EventEmitter<void>`
- **UI:** Grid of ~60 common special characters (©, ®, ™, £, €, ¥, °, ±, ×, ÷, Ω, α, β, γ, →, ←, ↑, ↓, ♠, ♥, ♦, ♣, etc.) — clicking inserts the character
- **Char data:** Inline constant array

### 6c. EmbedsDialogComponent
- **Inputs:** `visible: boolean`
- **Outputs:** `embedInserted: EventEmitter<string>` (the URL), `dialogClosed: EventEmitter<void>`
- **UI:** Single `<input>` labelled "Paste in a URL to embed" + "Insert" button (matches `rich_12`)

### 6d. FileUploadDialogComponent
- **Inputs:** `visible: boolean`, `uploadHandler?: (file: File) => Promise<string>` (returns download URL)
- **Outputs:** `fileInserted: EventEmitter<{url: string; filename: string}>`, `dialogClosed: EventEmitter<void>`
- **UI:** Drop zone "Drop file (or click)" dashed box (matches `rich_13`) + hidden `<input type="file">`
- **Behaviour:** On file select: call `uploadHandler` if provided (else use a `data:` blob URL for local use)

### 6e. BookmarkDialogComponent
- **Inputs:** `visible: boolean`
- **Outputs:** `bookmarkInserted: EventEmitter<string>` (the anchor ID), `dialogClosed: EventEmitter<void>`
- **UI:** Single `<input>` labelled "Bookmark ID" + description "Enter a unique ID for the anchor" + "Insert" button
- **Behaviour:** Inserts `<a id="{id}" name="{id}"></a>` at cursor

---

## 7. Video Dialog Redesign

### Current state
Single form with: URL input, title, width, height — no tabs.

### Target state (from screenshots `rich_07–10`)
Three tabs matching Froala:

| Tab | Icon | Content |
|-----|------|---------|
| **By URL** | Chain link | URL input ("Paste in a video URL") + Autoplay checkbox + Insert button |
| **Embedded Code** | `<>` brackets | Textarea ("Embedded Code") + Insert button |
| **Upload Video** | Cloud upload | Drop zone "Drop video (or click)" + hidden file input |

### Migration approach
- Add `activeTab: 'url' | 'embed' | 'upload'` to the component
- Keep existing URL logic (provider detection, `normalizeVideoUrl`) in the URL tab  
- Add embedded code tab: parse `<iframe src="...">` or raw URL from the textarea, emit as `VideoData` with `embedHtml` field
- Add upload tab: same drop-zone pattern as image dialog
- Update `VideoData` model to add optional `embedHtml?: string` field
- `buildVideoEmbedHtml()` already handles the URL→iframe conversion; raw embed code is passed through as-is

---

## 8. LazyLoaderService Changes

Extend the union type and add 5 new branches:

```typescript
async loadDialogComponent(
  componentName: 'link' | 'image' | 'video' | 'color' | 'table'
    | 'emoticons' | 'specialChars' | 'embeds' | 'fileUpload' | 'bookmark',
  viewContainer: ViewContainerRef
): Promise<ComponentRef<any> | null>
```

---

## 9. WysiwygEditorComponent Changes

### New handleCommand cases
```typescript
case 'insertHR':
  this.executeInsertHR();
  break;
case 'emoticons':
  this.showEmoticonsDialog();
  break;
case 'insertBookmark':
  this.showBookmarkDialog();
  break;
case 'specialCharacters':
  this.showSpecialCharsDialog();
  break;
case 'embeds':
  this.showEmbedsDialog();
  break;
case 'uploadFile':
  this.showFileUploadDialog();
  break;
```

### New dialog methods (following existing pattern)
- `private async showEmoticonsDialog(): Promise<void>`
- `private async showBookmarkDialog(): Promise<void>`
- `private async showSpecialCharsDialog(): Promise<void>`
- `private async showEmbedsDialog(): Promise<void>`
- `private async showFileUploadDialog(): Promise<void>`
- Corresponding `closeXDialog()` and `onXInserted()` methods

---

## 10. Toolbar Config Changes (wysiwyg-editor.config.ts)

### Remove from main toolbar
- `{ type: 'dialog', command: 'insertImage', ... }`
- `{ type: 'dialog', command: 'insertVideo', ... }`
- `{ type: 'dialog', command: 'insertTable', ... }`

### Add More Rich group (after More Text group, before alignments OR at the end of the insert section)
```typescript
{
  type: 'group',
  command: 'moreRich',
  icon: 'moreRich',
  label: 'More Rich',
  tools: [
    { type: 'dialog', command: 'insertImage',       icon: 'insertImage',       label: 'Insert Image' },
    { type: 'dialog', command: 'insertVideo',        icon: 'insertVideo',       label: 'Insert Video' },
    { type: 'button', command: 'insertHR',           icon: 'insertHR',          label: 'Insert Horizontal Rule' },
    { type: 'dialog', command: 'insertTable',        icon: 'insertTable',       label: 'Insert Table' },
    { type: 'dialog', command: 'emoticons',          icon: 'emoticons',         label: 'Emoticons' },
    { type: 'dialog', command: 'insertBookmark',     icon: 'insertBookmark',    label: 'Insert Bookmark' },
    { type: 'dialog', command: 'specialCharacters',  icon: 'specialCharacters', label: 'Special Characters' },
    { type: 'dialog', command: 'embeds',             icon: 'embeds',            label: 'Embed URL' },
    { type: 'dialog', command: 'uploadFile',         icon: 'uploadFile',        label: 'Upload File' },
  ]
}
```

Keep `createLink` in the main toolbar (it's visible as a chain link in the Froala main row in `rich_01`).

---

## 11. Public API Exports

In `bigldeger-wysiwyg-editor.ts`, add exports for all 5 new dialog components so library consumers can use them independently if needed.

---

## 12. Implementation Order

1. **toolbar-icons.ts** — add 7 new icons (no risk to existing code)
2. **command.service.ts** — add `insertHR` + cursor-insertion helpers
3. **video-dialog** — redesign with 3 tabs (replace existing component)
4. **emoticons-dialog** — new component
5. **special-chars-dialog** — new component
6. **embeds-dialog** — new component (simplest, 1 input)
7. **file-upload-dialog** — new component
8. **bookmark-dialog** — new component
9. **lazy-loader.service.ts** — add 5 new names
10. **wysiwyg-editor.component.ts** — add command cases + dialog wiring
11. **bigldeger-wysiwyg-editor.ts** — add exports
12. **package.json** — bump to `1.5.0`
13. Build library: `npm run build:lib`
14. Publish: `cd dist/bigldeger-wysiwyg-editor && npm publish --access public`
15. **wysiwyg-editor.config.ts** (wavelet-cp-commerce) — add moreRich group, move tools
16. Install: `npm install @bigledger/wysiwyg-editor@1.5.0 --legacy-peer-deps`

---

## 13. Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Video dialog redesign breaks existing video insert | Keep `VideoData` interface backward-compatible; add optional `embedHtml` field only |
| Moving insertImage/Video/Table out of main toolbar breaks existing usage in wavelet-cp-commerce | Only the config file in wavelet-cp-commerce changes — library logic is unchanged |
| Emoji/special char insertion disrupts selection state | Use `SelectionService` to restore saved selection before inserting |
| File upload without a real upload endpoint | `uploadHandler` prop is optional; fall back to `data:` blob URL with console warning |
| New dialog components not tree-shaken | All new dialogs are lazy loaded via `LazyLoaderService` |

---

## 14. What is NOT Implemented (Froala Pro / out of scope)

- **Tab 3 "Browse" in image dialog** — requires a media/file manager server endpoint (Froala Pro)
- **The red Froala icon (#11 in More Rich row)** — proprietary Froala branding feature
- **"Upload Video" actual server upload** — functional UI is implemented; real upload requires consumer to provide `uploadHandler` prop (same pattern as image upload)
- **oEmbed API** — the embeds dialog inserts a plain `<iframe>`; no oEmbed resolution

---

*Plan created based on screenshots `image 2/Screenshot 2026-04-30 at 4.34.57 PM.png` through `Screenshot 2026-04-30 at 4.43.17 PM.png`*
