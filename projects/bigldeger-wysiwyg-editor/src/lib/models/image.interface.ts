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
 * Interface for image upload configuration
 */
export interface ImageUploadConfig {
  /** Maximum file size in bytes (default: 5MB) */
  maxFileSize?: number;
  
  /** Allowed image MIME types (default: common image formats) */
  allowedFormats?: string[];
  
  /** Whether to allow URL input for images (default: true) */
  allowUrlInput?: boolean;
  
  /** Whether to allow file upload (default: true) */
  allowFileUpload?: boolean;
  
  /** Custom upload handler function that returns a Promise with the uploaded image URL */
  uploadHandler?: (file: File) => Promise<string>;
  
  /** Upload URL endpoint for server-side uploads */
  uploadUrl?: string;
  
  /** Additional headers to send with upload requests */
  uploadHeaders?: { [key: string]: string };
  
  /** Maximum image width in pixels */
  maxWidth?: number;
  
  /** Maximum image height in pixels */
  maxHeight?: number;
  
  /** Whether to auto-resize images that exceed max dimensions (default: false) */
  autoResize?: boolean;
  
  /** Image quality for JPEG compression (0-1, default: 0.8) */
  quality?: number;
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

/**
 * Default image upload configuration
 */
export const DEFAULT_IMAGE_UPLOAD_CONFIG: Required<Omit<ImageUploadConfig, 'uploadHandler' | 'uploadUrl' | 'uploadHeaders'>> = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  allowUrlInput: true,
  allowFileUpload: true,
  maxWidth: 2000,
  maxHeight: 2000,
  autoResize: false,
  quality: 0.8
};

/**
 * Validates an image upload configuration
 * @param config The configuration to validate
 * @returns Validation result with any errors
 */
export function validateImageUploadConfig(config: ImageUploadConfig): ImageValidationResult {
  // Check maxFileSize
  if (config.maxFileSize !== undefined) {
    if (config.maxFileSize <= 0) {
      return {
        isValid: false,
        error: 'maxFileSize must be greater than 0'
      };
    }
    if (config.maxFileSize > 100 * 1024 * 1024) { // 100MB limit
      return {
        isValid: false,
        error: 'maxFileSize cannot exceed 100MB'
      };
    }
  }

  // Check allowedFormats
  if (config.allowedFormats !== undefined) {
    if (!Array.isArray(config.allowedFormats)) {
      return {
        isValid: false,
        error: 'allowedFormats must be an array'
      };
    }
    if (config.allowedFormats.length === 0) {
      return {
        isValid: false,
        error: 'allowedFormats cannot be empty'
      };
    }
    
    const validMimeTypes = /^image\/(jpeg|jpg|png|gif|webp|svg\+xml|bmp|tiff)$/;
    for (const format of config.allowedFormats) {
      if (typeof format !== 'string' || !validMimeTypes.test(format)) {
        return {
          isValid: false,
          error: `Invalid MIME type: ${format}. Must be a valid image MIME type.`
        };
      }
    }
  }

  // Check dimensions
  if (config.maxWidth !== undefined) {
    if (config.maxWidth <= 0 || config.maxWidth > 10000) {
      return {
        isValid: false,
        error: 'maxWidth must be between 1 and 10000 pixels'
      };
    }
  }

  if (config.maxHeight !== undefined) {
    if (config.maxHeight <= 0 || config.maxHeight > 10000) {
      return {
        isValid: false,
        error: 'maxHeight must be between 1 and 10000 pixels'
      };
    }
  }

  // Check quality
  if (config.quality !== undefined) {
    if (config.quality < 0 || config.quality > 1) {
      return {
        isValid: false,
        error: 'quality must be between 0 and 1'
      };
    }
  }

  // Check upload URL format if provided
  if (config.uploadUrl !== undefined) {
    if (typeof config.uploadUrl !== 'string' || config.uploadUrl.trim().length === 0) {
      return {
        isValid: false,
        error: 'uploadUrl must be a non-empty string'
      };
    }
    
    try {
      new URL(config.uploadUrl);
    } catch {
      return {
        isValid: false,
        error: 'uploadUrl must be a valid URL'
      };
    }
  }

  // Check that at least one input method is enabled
  if (config.allowUrlInput === false && config.allowFileUpload === false) {
    return {
      isValid: false,
      error: 'At least one of allowUrlInput or allowFileUpload must be true'
    };
  }

  return {
    isValid: true
  };
}

/**
 * Validates a file against the upload configuration
 * @param file The file to validate
 * @param config The upload configuration
 * @returns Validation result with any errors
 */
export function validateImageFile(file: File, config: ImageUploadConfig = {}): ImageValidationResult {
  const mergedConfig = { ...DEFAULT_IMAGE_UPLOAD_CONFIG, ...config };

  // Check file size
  if (file.size > mergedConfig.maxFileSize) {
    const maxSizeMB = (mergedConfig.maxFileSize / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum allowed size of ${maxSizeMB}MB`
    };
  }

  // Check file type
  if (!mergedConfig.allowedFormats.includes(file.type)) {
    const allowedExtensions = mergedConfig.allowedFormats
      .map(type => type.replace('image/', '').replace('+xml', ''))
      .join(', ');
    return {
      isValid: false,
      error: `File type '${file.type}' is not supported. Allowed formats: ${allowedExtensions}`
    };
  }

  return {
    isValid: true
  };
}

/**
 * Creates a merged configuration with defaults
 * @param config Partial configuration to merge with defaults
 * @returns Complete configuration with defaults applied
 */
export function createImageUploadConfig(config: ImageUploadConfig = {}): ImageUploadConfig {
  return {
    ...DEFAULT_IMAGE_UPLOAD_CONFIG,
    ...config
  };
}