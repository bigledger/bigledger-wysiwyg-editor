# WYSIWYG Editor E2E Test Suite

This directory contains comprehensive end-to-end tests for the Angular WYSIWYG Editor using Cypress.

## Test Structure

### Integration Tests (`src/lib/tests/integration/`)
- **editor-workflows.integration.spec.ts** - Tests for complete editor workflows including text formatting and forms integration
- **link-image-workflows.integration.spec.ts** - Tests for link and image insertion workflows
- **forms-integration.spec.ts** - Comprehensive tests for Angular forms integration (template-driven and reactive)

### E2E Tests (`cypress/e2e/`)
- **editor-basic-functionality.cy.ts** - Basic editor functionality (typing, selection, copy/paste, undo/redo)
- **text-formatting.cy.ts** - Text formatting features (bold, italic, underline, font size, colors)
- **lists-and-alignment.cy.ts** - List creation and text alignment features
- **links-and-images.cy.ts** - Link and image insertion and management
- **accessibility.cy.ts** - Comprehensive accessibility testing
- **cross-browser-compatibility.cy.ts** - Cross-browser compatibility tests

## Running Tests

### Prerequisites
1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the library:
   ```bash
   npm run build:lib
   ```

3. Start the development server:
   ```bash
   npm start
   ```

### Running Integration Tests
```bash
# Run unit and integration tests
npm run test:lib

# Run with coverage
npm run test:lib:coverage

# Run in CI mode (headless)
npm run test:lib:ci
```

### Running E2E Tests
```bash
# Run E2E tests in headless mode
npm run e2e

# Open Cypress Test Runner (interactive mode)
npm run e2e:open

# Run E2E tests in CI mode
npm run e2e:ci
```

## Test Coverage

### Integration Tests Cover:
- ✅ Text formatting workflows (bold, italic, underline, font size, colors)
- ✅ List creation and management (bullet lists, numbered lists, nesting)
- ✅ Link insertion and editing workflows
- ✅ Image insertion and management workflows
- ✅ Template-driven forms integration (ngModel, validation, form states)
- ✅ Reactive forms integration (FormControl, FormGroup, validators)
- ✅ Dynamic forms with field addition/removal
- ✅ Form state synchronization (dirty, touched, valid states)

### E2E Tests Cover:
- ✅ Basic editor functionality (typing, selection, clipboard operations)
- ✅ Keyboard shortcuts and navigation
- ✅ Undo/redo functionality
- ✅ Content persistence and cursor management
- ✅ Readonly mode behavior
- ✅ All text formatting features
- ✅ Toolbar state indicators
- ✅ List creation and keyboard navigation
- ✅ Text alignment features
- ✅ Link creation, editing, and removal
- ✅ Image insertion, resizing, and management
- ✅ Complex content workflows (mixed formatting, links, images)
- ✅ Comprehensive accessibility testing (WCAG compliance)
- ✅ Keyboard navigation and screen reader support
- ✅ Focus management and ARIA attributes
- ✅ Color contrast and visual accessibility
- ✅ Mobile and touch accessibility
- ✅ Cross-browser compatibility testing
- ✅ Browser API fallbacks and error handling
- ✅ Mobile browser support
- ✅ Performance testing with large content

## Accessibility Testing

The test suite includes comprehensive accessibility testing using cypress-axe:

- **Automated WCAG compliance checks**
- **Keyboard navigation testing**
- **Screen reader support verification**
- **Focus management validation**
- **Color contrast checking**
- **ARIA attributes verification**
- **Mobile accessibility testing**

## Cross-Browser Testing

Tests are designed to work across multiple browsers:
- Chrome (primary)
- Firefox
- Safari (via WebKit)
- Edge
- Mobile browsers (iOS Safari, Android Chrome)

## Custom Cypress Commands

The test suite includes custom commands for editor-specific operations:

- `cy.getEditorContent()` - Get the HTML content of the editor
- `cy.setEditorContent(html)` - Set the HTML content of the editor
- `cy.selectEditorText(start, end)` - Select text in the editor
- `cy.checkA11y()` - Run accessibility checks
- `cy.injectAxe()` - Inject axe-core for accessibility testing

## Test Data and Fixtures

- **test-image.jpg** - Sample image file for image insertion tests
- Test data is generated dynamically within tests to ensure isolation

## Continuous Integration

The test suite is configured for CI environments:

- Headless browser execution
- Screenshot capture on failures
- Test result reporting
- Coverage reporting
- Cross-browser testing matrix

## Troubleshooting

### Common Issues:

1. **Tests failing due to timing issues**
   - Increase `defaultCommandTimeout` in cypress.config.ts
   - Add explicit waits with `cy.wait()`

2. **Accessibility tests failing**
   - Check color contrast ratios
   - Verify ARIA attributes are present
   - Ensure keyboard navigation works

3. **Cross-browser issues**
   - Check browser-specific API availability
   - Verify fallback implementations work
   - Test with different viewport sizes

### Debug Mode:
```bash
# Run specific test file
npx cypress run --spec "cypress/e2e/editor-basic-functionality.cy.ts"

# Run with debug output
DEBUG=cypress:* npm run e2e
```

## Contributing

When adding new features to the editor:

1. Add corresponding integration tests in `src/lib/tests/integration/`
2. Add E2E tests in `cypress/e2e/`
3. Include accessibility tests for new UI elements
4. Test cross-browser compatibility
5. Update this README if new test patterns are introduced

## Test Requirements Coverage

This test suite covers all requirements from the specification:

- **Requirement 1.1-1.4**: Angular component integration and API
- **Requirement 2.1-2.6**: Text formatting capabilities
- **Requirement 3.1-3.6**: List and paragraph formatting
- **Requirement 4.1-4.4**: Link management
- **Requirement 5.1-5.4**: Image insertion and management
- **Requirement 6.1-6.4**: Angular forms integration
- **Requirement 7.1-7.4**: Editor customization
- **Requirement 8.1-8.6**: Keyboard shortcuts and accessibility
- **Requirement 9.1-9.4**: Content security and HTML output