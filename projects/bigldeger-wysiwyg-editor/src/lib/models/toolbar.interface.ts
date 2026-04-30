/**
 * Configuration interface for toolbar tools and options
 */
export interface ToolbarConfig {
  /** Array of tools to display in the toolbar */
  tools: ToolbarTool[];
  /** Whether the toolbar should stick to the top when scrolling */
  sticky?: boolean;
  /** Theme for the toolbar appearance */
  theme?: 'light' | 'dark';
}

/**
 * Individual toolbar tool configuration
 */
export interface ToolbarTool {
  /** Type of toolbar tool */
  type: 'button' | 'dropdown' | 'dialog' | 'group';
  /** Command to execute when tool is activated */
  command: string;
  /** Icon identifier for the tool */
  icon?: string;
  /** Display label for the tool */
  label?: string;
  /** Title for tooltip */
  title?: string;
  /** ARIA label for accessibility */
  ariaLabel?: string;
  /** Options for dropdown tools */
  options?: ToolOption[];
  /** Child tools for group type — shown in an expandable second row */
  tools?: ToolbarTool[];
  /** Whether the tool is disabled */
  disabled?: boolean;
  /** Custom CSS classes for the tool */
  cssClass?: string;
  /** Whether to render a visual divider before this tool */
  separatorBefore?: boolean;
}

/**
 * Reusable preset metadata for dropdown-driven styling tools.
 */
export interface ToolOptionPreset {
  /** Optional tag name to enforce for block-style presets */
  tagName?: string;
  /** One or more CSS classes to apply */
  className?: string | string[];
  /** Inline styles to apply */
  styles?: Record<string, string>;
}

/**
 * Option for dropdown toolbar tools
 */
export interface ToolOption {
  /** Value to pass when option is selected */
  value: string;
  /** Display label for the option */
  label: string;
  /** Icon identifier for the option */
  icon?: string;
  /** Whether this option is disabled */
  disabled?: boolean;
  /** Optional styling preset metadata used by preset-aware commands */
  preset?: ToolOptionPreset;
  /** Optional preview styles for rendering richer dropdown items */
  previewStyles?: Record<string, string>;
  /** Optional preview class for rendering richer dropdown items */
  previewClass?: string;
}
