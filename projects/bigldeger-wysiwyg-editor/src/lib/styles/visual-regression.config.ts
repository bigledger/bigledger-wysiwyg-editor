/**
 * Visual Regression Testing Configuration for WYSIWYG Editor Styling
 * 
 * This configuration defines the test scenarios for visual regression testing
 * of the editor's styling and theming system.
 */

export interface VisualTestScenario {
  name: string;
  description: string;
  viewport: { width: number; height: number };
  theme: 'light' | 'dark' | 'auto';
  size?: 'small' | 'medium' | 'large';
  accessibility?: {
    highContrast?: boolean;
    reducedMotion?: boolean;
    largeText?: boolean;
  };
  content?: string;
  toolbarConfig?: any;
  interactions?: Array<{
    type: 'hover' | 'focus' | 'click' | 'type';
    selector: string;
    value?: string;
  }>;
}

export const VISUAL_TEST_SCENARIOS: VisualTestScenario[] = [
  // Basic Theme Tests
  {
    name: 'light-theme-desktop',
    description: 'Light theme on desktop viewport',
    viewport: { width: 1200, height: 800 },
    theme: 'light',
    content: '<p>Sample content with <strong>bold</strong> and <em>italic</em> text.</p><ul><li>List item 1</li><li>List item 2</li></ul>'
  },
  {
    name: 'dark-theme-desktop',
    description: 'Dark theme on desktop viewport',
    viewport: { width: 1200, height: 800 },
    theme: 'dark',
    content: '<p>Sample content with <strong>bold</strong> and <em>italic</em> text.</p><ul><li>List item 1</li><li>List item 2</li></ul>'
  },
  {
    name: 'auto-theme-desktop',
    description: 'Auto theme on desktop viewport',
    viewport: { width: 1200, height: 800 },
    theme: 'auto',
    content: '<p>Sample content with <strong>bold</strong> and <em>italic</em> text.</p><ul><li>List item 1</li><li>List item 2</li></ul>'
  },

  // Responsive Design Tests
  {
    name: 'light-theme-mobile',
    description: 'Light theme on mobile viewport',
    viewport: { width: 375, height: 667 },
    theme: 'light',
    content: '<p>Mobile content test</p>'
  },
  {
    name: 'dark-theme-mobile',
    description: 'Dark theme on mobile viewport',
    viewport: { width: 375, height: 667 },
    theme: 'dark',
    content: '<p>Mobile content test</p>'
  },
  {
    name: 'light-theme-tablet',
    description: 'Light theme on tablet viewport',
    viewport: { width: 768, height: 1024 },
    theme: 'light',
    content: '<p>Tablet content test</p>'
  },
  {
    name: 'dark-theme-tablet',
    description: 'Dark theme on tablet viewport',
    viewport: { width: 768, height: 1024 },
    theme: 'dark',
    content: '<p>Tablet content test</p>'
  },

  // Size Variants
  {
    name: 'small-editor-light',
    description: 'Small size editor with light theme',
    viewport: { width: 800, height: 600 },
    theme: 'light',
    size: 'small',
    content: '<p>Small editor content</p>'
  },
  {
    name: 'large-editor-dark',
    description: 'Large size editor with dark theme',
    viewport: { width: 1400, height: 900 },
    theme: 'dark',
    size: 'large',
    content: '<p>Large editor content</p>'
  },

  // Accessibility Tests
  {
    name: 'high-contrast-light',
    description: 'High contrast mode with light theme',
    viewport: { width: 1200, height: 800 },
    theme: 'light',
    accessibility: { highContrast: true },
    content: '<p>High contrast content test</p>'
  },
  {
    name: 'high-contrast-dark',
    description: 'High contrast mode with dark theme',
    viewport: { width: 1200, height: 800 },
    theme: 'dark',
    accessibility: { highContrast: true },
    content: '<p>High contrast content test</p>'
  },
  {
    name: 'reduced-motion',
    description: 'Reduced motion preferences',
    viewport: { width: 1200, height: 800 },
    theme: 'light',
    accessibility: { reducedMotion: true },
    content: '<p>Reduced motion test</p>'
  },
  {
    name: 'large-text',
    description: 'Large text accessibility option',
    viewport: { width: 1200, height: 800 },
    theme: 'light',
    accessibility: { largeText: true },
    content: '<p>Large text accessibility test</p>'
  },

  // Interactive States
  {
    name: 'toolbar-hover-states',
    description: 'Toolbar button hover states',
    viewport: { width: 1200, height: 800 },
    theme: 'light',
    content: '<p>Hover test content</p>',
    interactions: [
      { type: 'hover', selector: '.wysiwyg-toolbar__button:first-child' }
    ]
  },
  {
    name: 'toolbar-focus-states',
    description: 'Toolbar button focus states',
    viewport: { width: 1200, height: 800 },
    theme: 'light',
    content: '<p>Focus test content</p>',
    interactions: [
      { type: 'focus', selector: '.wysiwyg-toolbar__button:first-child' }
    ]
  },
  {
    name: 'dropdown-open-state',
    description: 'Dropdown menu open state',
    viewport: { width: 1200, height: 800 },
    theme: 'light',
    content: '<p>Dropdown test content</p>',
    interactions: [
      { type: 'click', selector: '.wysiwyg-toolbar__dropdown-trigger' }
    ]
  },

  // Content Styling Tests
  {
    name: 'rich-content-light',
    description: 'Rich content styling in light theme',
    viewport: { width: 1200, height: 800 },
    theme: 'light',
    content: `
      <h1>Heading 1</h1>
      <h2>Heading 2</h2>
      <p>Paragraph with <strong>bold</strong>, <em>italic</em>, and <u>underlined</u> text.</p>
      <ul>
        <li>Unordered list item 1</li>
        <li>Unordered list item 2</li>
      </ul>
      <ol>
        <li>Ordered list item 1</li>
        <li>Ordered list item 2</li>
      </ol>
      <blockquote>This is a blockquote with some sample text.</blockquote>
      <p>Link example: <a href="#">Sample link</a></p>
      <pre><code>Code block example</code></pre>
      <table>
        <thead>
          <tr><th>Header 1</th><th>Header 2</th></tr>
        </thead>
        <tbody>
          <tr><td>Cell 1</td><td>Cell 2</td></tr>
        </tbody>
      </table>
    `
  },
  {
    name: 'rich-content-dark',
    description: 'Rich content styling in dark theme',
    viewport: { width: 1200, height: 800 },
    theme: 'dark',
    content: `
      <h1>Heading 1</h1>
      <h2>Heading 2</h2>
      <p>Paragraph with <strong>bold</strong>, <em>italic</em>, and <u>underlined</u> text.</p>
      <ul>
        <li>Unordered list item 1</li>
        <li>Unordered list item 2</li>
      </ul>
      <ol>
        <li>Ordered list item 1</li>
        <li>Ordered list item 2</li>
      </ol>
      <blockquote>This is a blockquote with some sample text.</blockquote>
      <p>Link example: <a href="#">Sample link</a></p>
      <pre><code>Code block example</code></pre>
      <table>
        <thead>
          <tr><th>Header 1</th><th>Header 2</th></tr>
        </thead>
        <tbody>
          <tr><td>Cell 1</td><td>Cell 2</td></tr>
        </tbody>
      </table>
    `
  },

  // Dialog Tests
  {
    name: 'link-dialog-light',
    description: 'Link dialog in light theme',
    viewport: { width: 1200, height: 800 },
    theme: 'light',
    content: '<p>Dialog test content</p>',
    interactions: [
      { type: 'click', selector: '[data-command="link"]' }
    ]
  },
  {
    name: 'link-dialog-dark',
    description: 'Link dialog in dark theme',
    viewport: { width: 1200, height: 800 },
    theme: 'dark',
    content: '<p>Dialog test content</p>',
    interactions: [
      { type: 'click', selector: '[data-command="link"]' }
    ]
  },
  {
    name: 'image-dialog-light',
    description: 'Image dialog in light theme',
    viewport: { width: 1200, height: 800 },
    theme: 'light',
    content: '<p>Dialog test content</p>',
    interactions: [
      { type: 'click', selector: '[data-command="image"]' }
    ]
  },
  {
    name: 'image-dialog-dark',
    description: 'Image dialog in dark theme',
    viewport: { width: 1200, height: 800 },
    theme: 'dark',
    content: '<p>Dialog test content</p>',
    interactions: [
      { type: 'click', selector: '[data-command="image"]' }
    ]
  },

  // Error States
  {
    name: 'form-validation-errors',
    description: 'Form validation error states',
    viewport: { width: 1200, height: 800 },
    theme: 'light',
    content: '<p>Error state test</p>',
    interactions: [
      { type: 'click', selector: '[data-command="link"]' },
      { type: 'click', selector: '.wysiwyg-btn-primary' }
    ]
  },

  // Loading States
  {
    name: 'loading-states',
    description: 'Loading and disabled states',
    viewport: { width: 1200, height: 800 },
    theme: 'light',
    content: '<p>Loading state test</p>'
  },

  // Print Styles
  {
    name: 'print-preview',
    description: 'Print-friendly styling',
    viewport: { width: 1200, height: 800 },
    theme: 'light',
    content: `
      <h1>Print Test Document</h1>
      <p>This content should be print-friendly with no toolbar visible.</p>
      <ul>
        <li>List item 1</li>
        <li>List item 2</li>
      </ul>
    `
  }
];

export const VISUAL_TEST_CONFIG = {
  // Threshold for visual differences (0-1, where 0 is identical)
  threshold: 0.1,
  
  // Directories for storing reference and diff images
  referenceDir: 'tests/visual/reference',
  diffDir: 'tests/visual/diff',
  
  // Browser configurations for cross-browser testing
  browsers: [
    { name: 'chrome', version: 'latest' },
    { name: 'firefox', version: 'latest' },
    { name: 'safari', version: 'latest' },
    { name: 'edge', version: 'latest' }
  ],
  
  // Wait times for animations and transitions
  waitTimes: {
    afterLoad: 500,
    afterInteraction: 300,
    beforeScreenshot: 100
  },
  
  // Elements to hide during screenshots (e.g., cursors, dynamic content)
  hideElements: [
    '.wysiwyg-cursor',
    '.wysiwyg-selection-indicator'
  ],
  
  // CSS to inject for consistent testing
  testCSS: `
    /* Disable animations for consistent screenshots */
    *, *::before, *::after {
      animation-duration: 0s !important;
      animation-delay: 0s !important;
      transition-duration: 0s !important;
      transition-delay: 0s !important;
    }
    
    /* Hide system cursors */
    * {
      cursor: none !important;
    }
  `
};

/**
 * Utility function to generate test scenarios for different combinations
 */
export function generateTestMatrix(
  themes: Array<'light' | 'dark' | 'auto'>,
  viewports: Array<{ width: number; height: number; name: string }>,
  baseScenario: Partial<VisualTestScenario>
): VisualTestScenario[] {
  const scenarios: VisualTestScenario[] = [];
  
  themes.forEach(theme => {
    viewports.forEach(viewport => {
      scenarios.push({
        name: `${baseScenario.name}-${theme}-${viewport.name}`,
        description: `${baseScenario.description} - ${theme} theme on ${viewport.name}`,
        viewport: { width: viewport.width, height: viewport.height },
        theme,
        ...baseScenario
      } as VisualTestScenario);
    });
  });
  
  return scenarios;
}

/**
 * Common viewport configurations
 */
export const COMMON_VIEWPORTS = [
  { width: 375, height: 667, name: 'mobile' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 1200, height: 800, name: 'desktop' },
  { width: 1920, height: 1080, name: 'large-desktop' }
];

/**
 * Accessibility test configurations
 */
export const ACCESSIBILITY_TESTS = [
  { highContrast: true, name: 'high-contrast' },
  { reducedMotion: true, name: 'reduced-motion' },
  { largeText: true, name: 'large-text' }
];