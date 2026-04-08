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

  /** HTTP method to use for endpoint uploads (default: POST) */
  uploadMethod?: 'POST' | 'PUT';

  /** Multipart field name used for the uploaded file (default: file) */
  uploadFieldName?: string;
  
  /** Additional headers to send with upload requests */
  uploadHeaders?: { [key: string]: string };

  /** Extra multipart form fields to append during upload */
  uploadParams?: { [key: string]: string };

  /** Include credentials/cookies with endpoint uploads */
  withCredentials?: boolean;

  /** Dot-path to the uploaded image URL in the server response */
  responseUrlPath?: string;

  /** Custom extractor for reading the uploaded image URL from the response */
  responseUrlExtractor?: (response: unknown) => string | null;
  
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
export const DEFAULT_IMAGE_UPLOAD_CONFIG: Required<Omit<
  ImageUploadConfig,
  'uploadHandler' | 'uploadUrl' | 'uploadHeaders' | 'uploadParams' | 'responseUrlPath' | 'responseUrlExtractor'
>> = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  allowUrlInput: true,
  allowFileUpload: true,
  uploadMethod: 'POST',
  uploadFieldName: 'file',
  withCredentials: false,
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

  if (config.uploadMethod !== undefined && config.uploadMethod !== 'POST' && config.uploadMethod !== 'PUT') {
    return {
      isValid: false,
      error: 'uploadMethod must be POST or PUT'
    };
  }

  if (config.uploadFieldName !== undefined && config.uploadFieldName.trim().length === 0) {
    return {
      isValid: false,
      error: 'uploadFieldName must be a non-empty string'
    };
  }

  if (config.responseUrlPath !== undefined && config.responseUrlPath.trim().length === 0) {
    return {
      isValid: false,
      error: 'responseUrlPath must be a non-empty string'
    };
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

/**
 * Extracts the uploaded image URL from a server response.
 * Supports common response shapes such as `{ link }`, `{ url }`, and nested data.
 */
export function extractImageUploadUrl(
  response: unknown,
  responseUrlPath?: string,
  responseUrlExtractor?: (response: unknown) => string | null
): string | null {
  const customValue = responseUrlExtractor?.(response);
  if (typeof customValue === 'string' && customValue.trim()) {
    return customValue.trim();
  }

  if (typeof response === 'string' && response.trim()) {
    return response.trim();
  }

  if (!response || typeof response !== 'object') {
    return null;
  }

  const lookupObject = response as Record<string, unknown>;

  if (responseUrlPath) {
    const resolvedPathValue = responseUrlPath
      .split('.')
      .filter(Boolean)
      .reduce<unknown>((currentValue, pathSegment) => {
        if (!currentValue || typeof currentValue !== 'object') {
          return undefined;
        }

        return (currentValue as Record<string, unknown>)[pathSegment];
      }, lookupObject);

    if (typeof resolvedPathValue === 'string' && resolvedPathValue.trim()) {
      return resolvedPathValue.trim();
    }
  }

  const commonResponseKeys = [
    'link',
    'url',
    'src',
    'location',
    'secure_url'
  ];

  for (const responseKey of commonResponseKeys) {
    const value = lookupObject[responseKey];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  for (const nestedKey of ['data', 'result', 'image']) {
    const nestedValue = lookupObject[nestedKey];
    if (!nestedValue || typeof nestedValue !== 'object') {
      continue;
    }

    const nestedUrl = extractImageUploadUrl(nestedValue);
    if (nestedUrl) {
      return nestedUrl;
    }
  }

  return null;
}

/**
 * Creates an upload handler from the provided config.
 * Host apps can either pass a custom async handler or an upload endpoint.
 */
export function createImageUploadHandler(config: ImageUploadConfig = {}): ((file: File) => Promise<string>) | undefined {
  if (config.uploadHandler) {
    return config.uploadHandler;
  }

  if (!config.uploadUrl) {
    return undefined;
  }

  const mergedConfig = createImageUploadConfig(config);

  return async (file: File): Promise<string> => {
    const formData = new FormData();
    const uploadFieldName = mergedConfig.uploadFieldName || DEFAULT_IMAGE_UPLOAD_CONFIG.uploadFieldName;
    formData.append(uploadFieldName, file, file.name);

    Object.entries(mergedConfig.uploadParams || {}).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const response = await fetch(mergedConfig.uploadUrl as string, {
      method: mergedConfig.uploadMethod,
      headers: mergedConfig.uploadHeaders,
      body: formData,
      ...(mergedConfig.withCredentials ? { credentials: 'include' } : {})
    });

    if (!response.ok) {
      throw new Error(`Image upload failed with status ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    const responseBody = contentType.includes('json')
      ? await response.json()
      : await response.text();

    const uploadedUrl = extractImageUploadUrl(
      responseBody,
      mergedConfig.responseUrlPath,
      mergedConfig.responseUrlExtractor
    );

    if (!uploadedUrl) {
      throw new Error('Image upload succeeded but no image URL was returned by the server');
    }

    return uploadedUrl;
  };
}
