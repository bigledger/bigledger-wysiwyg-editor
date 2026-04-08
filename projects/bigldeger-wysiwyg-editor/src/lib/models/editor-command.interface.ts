/**
 * Command interface for editor operations
 */
export interface EditorCommand {
  /** Name of the command to execute */
  name: string;
  /** Value to pass to the command (optional) */
  value?: any;
  /** Additional options for command execution */
  options?: CommandOptions;
}

/**
 * Options for command execution
 */
export interface CommandOptions {
  /** Whether to show UI for the command */
  showUI?: boolean;
  /** Whether to prevent default browser behavior */
  preventDefault?: boolean;
  /** Custom parameters for the command */
  params?: Record<string, any>;
}

/**
 * Result of command execution
 */
export interface CommandResult {
  /** Whether the command executed successfully */
  success: boolean;
  /** Error message if command failed */
  error?: string;
  /** Additional data returned by the command */
  data?: any;
}

/**
 * Available editor commands
 */
export type EditorCommandName = 
  | 'bold'
  | 'italic' 
  | 'underline'
  | 'strikethrough'
  | 'subscript'
  | 'superscript'
  | 'paragraphFormat'
  | 'paragraphStyle'
  | 'inlineClass'
  | 'inlineStyle'
  | 'formatBlock'
  | 'quote'
  | 'lineHeight'
  | 'insertVideo'
  | 'fullscreen'
  | 'fontSize'
  | 'fontColor'
  | 'backgroundColor'
  | 'justifyLeft'
  | 'justifyCenter'
  | 'justifyRight'
  | 'justifyFull'
  | 'formatOLSimple'
  | 'insertOrderedList'
  | 'insertUnorderedList'
  | 'indent'
  | 'outdent'
  | 'createLink'
  | 'unlink'
  | 'insertImage'
  | 'insertHTML'
  | 'insertText'
  | 'undo'
  | 'redo'
  | 'selectAll'
  | 'removeFormat';
