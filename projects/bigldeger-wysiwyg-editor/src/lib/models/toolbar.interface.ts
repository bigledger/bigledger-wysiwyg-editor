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
  type: 'button' | 'dropdown' | 'dialog';
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
  /** Whether the tool is disabled */
  disabled?: boolean;
  /** Custom CSS classes for the tool */
  cssClass?: string;
  /** Whether to render a visual divider before this tool */
  separatorBefore?: boolean;
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
}
