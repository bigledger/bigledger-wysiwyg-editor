import { ToolbarConfig } from './toolbar.interface';
import { ImageUploadConfig } from './image.interface';

/**
 * Main configuration interface for the WYSIWYG editor
 */
export interface EditorConfig {
  /** Toolbar configuration */
  toolbar: ToolbarConfig;
  /** Height of the editor content area */
  height?: string;
  /** Minimum height of the editor content area */
  minHeight?: string;
  /** Maximum height of the editor content area */
  maxHeight?: string;
  /** Placeholder text to show when editor is empty */
  placeholder?: string;
  /** Whether the editor is in read-only mode */
  readonly?: boolean;
  /** HTML sanitizer configuration */
  sanitizer?: SanitizerConfig;
  /** Auto-save configuration */
  autoSave?: AutoSaveConfig;
  /** Spell check configuration */
  spellCheck?: boolean;
  /** Custom CSS classes for the editor */
  cssClass?: string;
  /** Whether to enable drag and drop */
  dragDrop?: boolean;
  /** Image upload configuration */
  imageUpload?: ImageUploadConfig;
  /** Link configuration */
  linkConfig?: LinkConfig;
  /** Keyboard shortcuts configuration */
  shortcuts?: ShortcutConfig;
  /** Accessibility configuration */
  accessibility?: AccessibilityConfig;
}

/**
 * HTML sanitizer configuration
 */
export interface SanitizerConfig {
  /** Whether to enable HTML sanitization */
  enabled: boolean;
  /** Allowed HTML tags */
  allowedTags?: string[];
  /** Allowed HTML attributes */
  allowedAttributes?: Record<string, string[]>;
  /** Whether to strip unknown tags */
  stripUnknownTags?: boolean;
  /** Whether to strip unknown attributes */
  stripUnknownAttributes?: boolean;
  /** Custom sanitization rules */
  customRules?: SanitizationRule[];
}

/**
 * Custom sanitization rule
 */
export interface SanitizationRule {
  /** Tag name to apply rule to */
  tag: string;
  /** Attributes to allow/deny */
  attributes?: string[];
  /** Action to take (allow, deny, transform) */
  action: 'allow' | 'deny' | 'transform';
  /** Transform function if action is 'transform' */
  transform?: (element: Element) => Element;
}

/**
 * Auto-save configuration
 */
export interface AutoSaveConfig {
  /** Whether auto-save is enabled */
  enabled: boolean;
  /** Auto-save interval in milliseconds */
  interval: number;
  /** Storage key for auto-saved content */
  storageKey?: string;
  /** Custom save function */
  saveFunction?: (content: string) => void;
}



/**
 * Link configuration
 */
export interface LinkConfig {
  /** Whether to validate URLs */
  validateUrls?: boolean;
  /** Whether to open links in new tab by default */
  defaultTarget?: '_blank' | '_self' | '_parent' | '_top';
  /** Allowed URL protocols */
  allowedProtocols?: string[];
  /** Whether to show link preview */
  showPreview?: boolean;
}

/**
 * Keyboard shortcuts configuration
 */
export interface ShortcutConfig {
  /** Whether shortcuts are enabled */
  enabled: boolean;
  /** Custom shortcut mappings */
  customShortcuts?: Record<string, string>;
  /** Whether to show shortcut hints */
  showHints?: boolean;
}

/**
 * Accessibility configuration
 */
export interface AccessibilityConfig {
  /** Whether to enable accessibility features */
  enabled: boolean;
  /** ARIA label for the editor */
  ariaLabel?: string;
  /** Whether to announce formatting changes */
  announceFormatting?: boolean;
  /** Whether to enable high contrast mode */
  highContrast?: boolean;
  /** Custom ARIA descriptions */
  customDescriptions?: Record<string, string>;
}