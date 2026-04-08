# CP-Commerce Froala Parity Roadmap

## Goal

Bring `@bigledger/wysiwyg-editor` to a point where it can safely replace the current Froala editors used in:

- `wavelet-cp-commerce/src/app/pages/website-builder/webstore/product-management/product-edit/tabs/product-descriptions-tab/product-descriptions-tab.component`
- `wavelet-cp-commerce/src/app/pages/website-builder/webstore/product-management/product-edit/tabs/product-descriptions-tab/item-post-editor/item-post-editor.component`

The replacement target is not "close enough". The target is:

- same authoring capability for this screen
- no regression in form binding or saved HTML output
- no forced feature loss for current users

## Current State

The package already covers:

- bold
- italic
- underline
- strikethrough
- font family
- font size
- align left / center / right / justify
- ordered / unordered lists
- indent / outdent
- link / unlink
- image insert
- table insert
- undo / redo
- select all
- remove formatting
- HTML mode toggle

The main blockers for this specific migration are:

- verify inserted HTML shape is acceptable for CP-Commerce rendering
- verify HTML mode and fullscreen mode do not break form usage
- reproduce the target Froala toolbar honestly inside a library-side harness

## Release Gate

Do not swap the editor in `wavelet-cp-commerce` until:

- Phase 1 is complete
- Phase 2 is complete
- Phase 3 is complete
- the target toolbar can be reproduced without hidden fallbacks

## Phase 1: Core Formatting Parity

- [x] Part 1. Add `subscript` command support end-to-end.
- [x] Part 2. Add `superscript` command support end-to-end.
- [x] Part 3. Add paragraph/block format support:
  - `Normal`
  - headings
  - paragraph-level tag switching
- [x] Part 4. Add quote / blockquote command support.
- [x] Part 5. Add line-height command support with a dropdown API.
- [x] Part 6. Add toolbar config examples for these controls in the demo app.
- [x] Part 7. Verify selection state and active-state detection for all above controls.

### Likely Library Files

- `src/lib/models/editor-command.interface.ts`
- `src/lib/models/selection-state.interface.ts`
- `src/lib/models/toolbar.interface.ts`
- `src/lib/services/command.service.ts`
- `src/lib/services/selection.service.ts`
- `src/lib/components/wysiwyg-editor/wysiwyg-editor.component.ts`
- `src/lib/components/toolbar/toolbar.component.ts`

## Phase 2: Authoring Presets And Froala-Like Content Controls

- [x] Part 1. Add paragraph-style preset support.
- [x] Part 2. Add inline class preset support.
- [x] Part 3. Add inline style preset support.
- [x] Part 4. Decide whether `formatOLSimple` needs true behavioral parity or can map cleanly to normal ordered lists.
- [x] Part 5. Expose these via public toolbar config so host apps can supply their own presets.
- [x] Part 6. Add demo coverage for preset-driven styles.

### Notes

- This phase is where host-specific preset systems must stay configurable.
- Do not hardcode CP-Commerce-only class names into the package.
- `formatOLSimple` now maps to the standard ordered-list command for migration compatibility.

## Phase 3: Media And Insert Workflow Parity

- [x] Part 1. Add video insertion support.
- [x] Part 2. Add a public image upload integration API.
- [x] Part 3. Support upload endpoint / async handler patterns that can replace Froala's `imageUploadURL` flow.
- [x] Part 4. Preserve current image-by-URL/manual image dialog behavior as a non-breaking fallback.
- [ ] Part 5. Verify inserted HTML shape is acceptable for CP-Commerce rendering.

### Likely Library Files

- `src/lib/models/image.interface.ts`
- `src/lib/services/command.service.ts`
- `src/lib/components/dialogs/image-dialog/*`
- new video dialog or media insertion surface
- `src/lib/components/wysiwyg-editor/wysiwyg-editor.component.ts`

## Phase 4: Editor Shell Behavior Parity

- [x] Part 1. Add fullscreen mode support.
- [x] Part 2. Add optional character counter display.
- [x] Part 3. Add public configuration inputs for:
  - placeholder
  - min height
  - char counter enablement
  - upload hooks
  - preset dropdowns
- [ ] Part 4. Verify HTML mode and fullscreen mode do not break form usage.

## Phase 5: Integration Harness For CP-Commerce

- [ ] Part 1. Create a library-side toolbar config matching the current Froala toolbar as closely as possible.
- [ ] Part 2. Add a demo page in `bigledger-wysiwyg-editor` that mirrors the CP-Commerce product description use case.
- [ ] Part 3. Validate saved HTML against realistic product/post content.
- [ ] Part 4. Confirm Angular forms behavior matches current Froala usage.

## Phase 6: Wavelet CP-Commerce Migration

- [ ] Part 1. Install `@bigledger/wysiwyg-editor` into `wavelet-cp-commerce`.
- [ ] Part 2. Import the editor into `WebsiteBuilderModule`.
- [ ] Part 3. Replace Froala in `product-descriptions-tab.component.html`.
- [ ] Part 4. Replace Froala in `item-post-editor.component.html`.
- [ ] Part 5. Move toolbar configuration from Froala options to package toolbar config.
- [ ] Part 6. Update SCSS from Froala selectors to package selectors.
- [ ] Part 7. Test create, edit, cancel, validation, and save flows for item posts.
- [ ] Part 8. Verify rendered HTML on the storefront/product display side.

## Phase 7: Cleanup

- [ ] Part 1. Remove direct Froala usage from these two target components.
- [ ] Part 2. Keep Froala in the app only if other screens still depend on it.
- [ ] Part 3. Document the migration pattern for the next Froala replacement in CP-Commerce.

## Recommended Build Order

1. Phase 1
2. Phase 3
3. Phase 4
4. Phase 2
5. Phase 5
6. Phase 6
7. Phase 7

## Why This Order

- Core editing parity is the first blocker.
- Media and fullscreen are high-impact missing features for the target screen.
- Preset systems should be built after the underlying commands exist.
- Integration should only start once the package can express the real toolbar honestly.
