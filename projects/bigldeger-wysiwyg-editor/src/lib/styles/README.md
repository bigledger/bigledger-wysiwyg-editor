# WYSIWYG Editor Styling and Theming System

This directory contains the comprehensive styling and theming system for the Angular WYSIWYG Editor.

## Files Overview

### Core Files
- `themes.scss` - CSS custom properties, theme definitions, and mixins
- `global.scss` - Global styles, responsive design, and accessibility features
- `index.scss` - Main entry point with utility classes and theme variants
- `visual-regression.config.ts` - Configuration for visual regression testing

## Features

### 🎨 Theming System
- **CSS Custom Properties**: Modern theming using CSS variables
- **Light/Dark Themes**: Built-in light and dark theme support
- **Auto Theme**: Automatically adapts to system preferences
- **Custom Themes**: Easy customization through CSS variables

### 📱 Responsive Design
- **Mobile-First**: Optimized for mobile devices
- **Breakpoints**: Tablet, desktop, and large desktop support
- **Flexible Layout**: Adapts to different screen sizes
- **Touch-Friendly**: Larger touch targets on mobile

### ♿ Accessibility
- **High Contrast**: Support for high contrast mode
- **Reduced Motion**: Respects user motion preferences
- **Focus Management**: Clear focus indicators
- **Screen Reader**: Proper ARIA labels and descriptions
- **Keyboard Navigation**: Full keyboard support

### 🎯 Visual Regression Testing
- **Playwright Integration**: Automated visual testing
- **Cross-Browser**: Chrome, Firefox, Safari, Edge support
- **Multiple Scenarios**: Light/dark themes, responsive, accessibility
- **Interactive States**: Hover, focus, active states

## Usage

### Basic Usage

```scss
// Import the main styles
@import '~angular-wysiwyg-editor/styles';
```

### Theme Customization

```scss
// Custom theme colors
:root {
  --wysiwyg-primary-color: #ff6b6b;
  --wysiwyg-bg-secondary: #f0f8ff;
  --wysiwyg-border-primary: #ff6b6b;
}
```

### Component Classes

```html
<!-- Light theme -->
<wysiwyg-editor class="wysiwyg-theme-light">

<!-- Dark theme -->
<wysiwyg-editor class="wysiwyg-theme-dark">

<!-- Auto theme (follows system preference) -->
<wysiwyg-editor class="wysiwyg-theme-auto">

<!-- Size variants -->
<wysiwyg-editor class="wysiwyg-size-small">
<wysiwyg-editor class="wysiwyg-size-large">

<!-- Utility classes -->
<wysiwyg-editor class="wysiwyg-rounded wysiwyg-shadow">
```

### Responsive Mixins

```scss
.my-custom-editor {
  @include wysiwyg-mobile {
    // Mobile styles
  }
  
  @include wysiwyg-tablet {
    // Tablet styles
  }
  
  @include wysiwyg-desktop {
    // Desktop styles
  }
}
```

### Button Mixins

```scss
.my-button {
  @include wysiwyg-button-primary;
}

.my-secondary-button {
  @include wysiwyg-button-secondary;
}
```

### Input Mixins

```scss
.my-input {
  @include wysiwyg-input-base;
}
```

## CSS Custom Properties

### Colors
- `--wysiwyg-primary-color` - Primary brand color
- `--wysiwyg-bg-primary` - Primary background color
- `--wysiwyg-text-primary` - Primary text color
- `--wysiwyg-border-primary` - Primary border color

### Spacing
- `--wysiwyg-spacing-xs` - Extra small spacing (4px)
- `--wysiwyg-spacing-sm` - Small spacing (8px)
- `--wysiwyg-spacing-md` - Medium spacing (12px)
- `--wysiwyg-spacing-lg` - Large spacing (16px)

### Typography
- `--wysiwyg-font-family` - Primary font family
- `--wysiwyg-font-size-sm` - Small font size (12px)
- `--wysiwyg-font-size-md` - Medium font size (14px)
- `--wysiwyg-font-size-lg` - Large font size (16px)

### Transitions
- `--wysiwyg-transition-fast` - Fast transition (0.15s)
- `--wysiwyg-transition-normal` - Normal transition (0.2s)
- `--wysiwyg-transition-slow` - Slow transition (0.3s)

## Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px - 1200px
- **Large Desktop**: > 1200px

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Visual Regression Testing

The visual regression testing system captures screenshots of the editor in various states and compares them against reference images.

### Running Tests

```bash
# Install Playwright
npm install @playwright/test

# Run visual tests
npx playwright test
```

### Test Scenarios

- Light and dark themes
- Responsive design (mobile, tablet, desktop)
- Accessibility features (high contrast, reduced motion)
- Interactive states (hover, focus, active)
- Dialog components
- Error states
- Loading states

## Customization Examples

### Custom Color Scheme

```scss
.my-editor-theme {
  --wysiwyg-primary-color: #e74c3c;
  --wysiwyg-primary-hover: #c0392b;
  --wysiwyg-bg-primary: #fdf2f2;
  --wysiwyg-border-primary: #fadbd8;
}
```

### Custom Font

```scss
.my-editor-font {
  --wysiwyg-font-family: 'Inter', sans-serif;
  --wysiwyg-font-size-md: 16px;
  --wysiwyg-line-height: 1.6;
}
```

### Custom Spacing

```scss
.my-editor-spacing {
  --wysiwyg-spacing-sm: 12px;
  --wysiwyg-spacing-md: 16px;
  --wysiwyg-spacing-lg: 24px;
}
```

## Best Practices

1. **Use CSS Custom Properties**: Always use the provided CSS variables for consistency
2. **Mobile-First**: Design for mobile first, then enhance for larger screens
3. **Accessibility**: Always test with keyboard navigation and screen readers
4. **Performance**: Use the provided mixins to avoid code duplication
5. **Testing**: Run visual regression tests when making style changes

## Migration from Old Styles

If migrating from the old styling system:

1. Replace hardcoded colors with CSS custom properties
2. Use the provided mixins instead of custom styles
3. Update responsive breakpoints to use the new mixins
4. Test accessibility features
5. Run visual regression tests to ensure consistency