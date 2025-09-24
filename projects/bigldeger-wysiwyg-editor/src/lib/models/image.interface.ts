/**
 * Interface for image data used in the WYSIWYG editor
 */
export interface ImageData {
  /** Image source URL or data URL */
  src: string;
  
  /** Alternative text for accessibility */
  alt: string;
  
  /** Optional title attribute (tooltip) */
  title?: string;
  
  /** Optional width in pixels */
  width?: number;
  
  /** Optional height in pixels */
  height?: number;
}



/**
 * Interface for image validation result
 */
export interface ImageValidationResult {
  /** Whether the image is valid */
  isValid: boolean;
  
  /** Error message if validation failed */
  error?: string;
}

/**
 * Interface for image resize options
 */
export interface ImageResizeOptions {
  /** Target width in pixels */
  width?: number;
  
  /** Target height in pixels */
  height?: number;
  
  /** Whether to maintain aspect ratio (default: true) */
  maintainAspectRatio?: boolean;
  
  /** Maximum width constraint */
  maxWidth?: number;
  
  /** Maximum height constraint */
  maxHeight?: number;
}