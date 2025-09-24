/**
 * Base interface for editor errors
 */
export interface EditorError {
  /** Type of error */
  type: EditorErrorType;
  /** Error message */
  message: string;
  /** Additional error details */
  details?: any;
  /** Error code for programmatic handling */
  code?: string;
  /** Timestamp when error occurred */
  timestamp?: Date;
  /** Stack trace if available */
  stack?: string;
}

/**
 * Types of errors that can occur in the editor
 */
export type EditorErrorType = 
  | 'browser'
  | 'validation'
  | 'command'
  | 'upload'
  | 'sanitization'
  | 'selection'
  | 'configuration'
  | 'network'
  | 'permission';

/**
 * Browser compatibility error
 */
export interface BrowserError extends EditorError {
  type: 'browser';
  /** Browser name and version */
  browserInfo?: BrowserInfo;
  /** Missing feature or API */
  missingFeature?: string;
  /** Suggested fallback */
  fallback?: string;
}

/**
 * Content validation error
 */
export interface ValidationError extends EditorError {
  type: 'validation';
  /** Field that failed validation */
  field?: string;
  /** Validation rule that failed */
  rule?: string;
  /** Expected value or format */
  expected?: any;
  /** Actual value that failed */
  actual?: any;
}

/**
 * Command execution error
 */
export interface CommandError extends EditorError {
  type: 'command';
  /** Command that failed */
  command?: string;
  /** Command parameters */
  parameters?: any;
  /** Browser's execCommand result */
  execCommandResult?: boolean;
}

/**
 * File upload error
 */
export interface UploadError extends EditorError {
  type: 'upload';
  /** File that failed to upload */
  file?: File;
  /** HTTP status code if applicable */
  statusCode?: number;
  /** Server response */
  response?: any;
}

/**
 * HTML sanitization error
 */
export interface SanitizationError extends EditorError {
  type: 'sanitization';
  /** Original HTML content */
  originalContent?: string;
  /** Sanitized HTML content */
  sanitizedContent?: string;
  /** Elements that were removed */
  removedElements?: string[];
  /** Attributes that were removed */
  removedAttributes?: string[];
}

/**
 * Selection handling error
 */
export interface SelectionError extends EditorError {
  type: 'selection';
  /** Current selection state */
  selectionState?: any;
  /** Operation that failed */
  operation?: string;
}

/**
 * Configuration error
 */
export interface ConfigurationError extends EditorError {
  type: 'configuration';
  /** Configuration property that is invalid */
  property?: string;
  /** Invalid value */
  value?: any;
  /** Valid options */
  validOptions?: any[];
}

/**
 * Network-related error
 */
export interface NetworkError extends EditorError {
  type: 'network';
  /** URL that failed */
  url?: string;
  /** HTTP method */
  method?: string;
  /** HTTP status code */
  statusCode?: number;
  /** Network timeout */
  timeout?: boolean;
}

/**
 * Permission-related error
 */
export interface PermissionError extends EditorError {
  type: 'permission';
  /** Required permission */
  permission?: string;
  /** Action that was denied */
  action?: string;
}

/**
 * Browser information
 */
export interface BrowserInfo {
  /** Browser name */
  name: string;
  /** Browser version */
  version: string;
  /** Operating system */
  os?: string;
  /** Whether browser is mobile */
  mobile?: boolean;
}

/**
 * Error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Error with severity information
 */
export interface SeverityError extends EditorError {
  /** Severity level of the error */
  severity: ErrorSeverity;
  /** Whether error is recoverable */
  recoverable: boolean;
  /** Suggested recovery action */
  recoveryAction?: string;
}

/**
 * Error handler configuration
 */
export interface ErrorHandlerConfig {
  /** Whether to log errors to console */
  logToConsole: boolean;
  /** Whether to show user-friendly error messages */
  showUserMessages: boolean;
  /** Custom error handler function */
  customHandler?: (error: EditorError) => void;
  /** Whether to report errors to external service */
  reportErrors?: boolean;
  /** Error reporting endpoint */
  reportingEndpoint?: string;
}