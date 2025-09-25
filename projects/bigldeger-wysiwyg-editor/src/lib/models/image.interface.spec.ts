import { 
  ImageData, 
  ImageUploadConfig, 
  ImageValidationResult, 
  ImageResizeOptions,
  DEFAULT_IMAGE_UPLOAD_CONFIG,
  validateImageUploadConfig,
  validateImageFile,
  createImageUploadConfig
} from './image.interface';

describe('Image Interfaces', () => {
  describe('ImageData', () => {
    it('should create valid ImageData with required fields', () => {
      const imageData: ImageData = {
        src: 'https://example.com/image.jpg',
        alt: 'Test image'
      };

      expect(imageData.src).toBe('https://example.com/image.jpg');
      expect(imageData.alt).toBe('Test image');
      expect(imageData.title).toBeUndefined();
      expect(imageData.width).toBeUndefined();
      expect(imageData.height).toBeUndefined();
    });

    it('should create valid ImageData with all fields', () => {
      const imageData: ImageData = {
        src: 'https://example.com/image.jpg',
        alt: 'Test image',
        title: 'Test title',
        width: 300,
        height: 200
      };

      expect(imageData.src).toBe('https://example.com/image.jpg');
      expect(imageData.alt).toBe('Test image');
      expect(imageData.title).toBe('Test title');
      expect(imageData.width).toBe(300);
      expect(imageData.height).toBe(200);
    });

    it('should accept data URLs', () => {
      const imageData: ImageData = {
        src: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/',
        alt: 'Base64 image'
      };

      expect(imageData.src).toContain('data:image/jpeg;base64,');
      expect(imageData.alt).toBe('Base64 image');
    });
  });

  describe('ImageUploadConfig', () => {
    it('should create valid config with default values', () => {
      const config: ImageUploadConfig = {};

      expect(config.maxFileSize).toBeUndefined();
      expect(config.allowedFormats).toBeUndefined();
      expect(config.allowUrlInput).toBeUndefined();
      expect(config.allowFileUpload).toBeUndefined();
      expect(config.uploadHandler).toBeUndefined();
      expect(config.uploadUrl).toBeUndefined();
      expect(config.uploadHeaders).toBeUndefined();
      expect(config.maxWidth).toBeUndefined();
      expect(config.maxHeight).toBeUndefined();
      expect(config.autoResize).toBeUndefined();
      expect(config.quality).toBeUndefined();
    });

    it('should create valid config with all custom values', () => {
      const uploadHandler = async (file: File): Promise<string> => {
        return `uploaded/${file.name}`;
      };

      const config: ImageUploadConfig = {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedFormats: ['image/jpeg', 'image/png'],
        allowUrlInput: false,
        allowFileUpload: true,
        uploadHandler,
        uploadUrl: 'https://api.example.com/upload',
        uploadHeaders: { 'Authorization': 'Bearer token' },
        maxWidth: 1920,
        maxHeight: 1080,
        autoResize: true,
        quality: 0.9
      };

      expect(config.maxFileSize).toBe(10 * 1024 * 1024);
      expect(config.allowedFormats).toEqual(['image/jpeg', 'image/png']);
      expect(config.allowUrlInput).toBe(false);
      expect(config.allowFileUpload).toBe(true);
      expect(config.uploadHandler).toBe(uploadHandler);
      expect(config.uploadUrl).toBe('https://api.example.com/upload');
      expect(config.uploadHeaders).toEqual({ 'Authorization': 'Bearer token' });
      expect(config.maxWidth).toBe(1920);
      expect(config.maxHeight).toBe(1080);
      expect(config.autoResize).toBe(true);
      expect(config.quality).toBe(0.9);
    });

    it('should handle upload handler function', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const uploadHandler = jasmine.createSpy('uploadHandler').and.returnValue(Promise.resolve('uploaded-url'));

      const config: ImageUploadConfig = {
        uploadHandler
      };

      if (config.uploadHandler) {
        const result = await config.uploadHandler(mockFile);
        expect(result).toBe('uploaded-url');
        expect(uploadHandler).toHaveBeenCalledWith(mockFile);
      }
    });

    it('should support server upload configuration', () => {
      const config: ImageUploadConfig = {
        uploadUrl: 'https://api.example.com/images',
        uploadHeaders: {
          'Authorization': 'Bearer abc123',
          'Content-Type': 'multipart/form-data'
        }
      };

      expect(config.uploadUrl).toBe('https://api.example.com/images');
      expect(config.uploadHeaders).toEqual({
        'Authorization': 'Bearer abc123',
        'Content-Type': 'multipart/form-data'
      });
    });

    it('should support image dimension constraints', () => {
      const config: ImageUploadConfig = {
        maxWidth: 800,
        maxHeight: 600,
        autoResize: true,
        quality: 0.7
      };

      expect(config.maxWidth).toBe(800);
      expect(config.maxHeight).toBe(600);
      expect(config.autoResize).toBe(true);
      expect(config.quality).toBe(0.7);
    });
  });

  describe('ImageValidationResult', () => {
    it('should create valid result for successful validation', () => {
      const result: ImageValidationResult = {
        isValid: true
      };

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should create valid result for failed validation', () => {
      const result: ImageValidationResult = {
        isValid: false,
        error: 'File size too large'
      };

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('File size too large');
    });

    it('should handle different error types', () => {
      const formatError: ImageValidationResult = {
        isValid: false,
        error: 'Unsupported file format'
      };

      const sizeError: ImageValidationResult = {
        isValid: false,
        error: 'File size exceeds maximum limit'
      };

      expect(formatError.error).toBe('Unsupported file format');
      expect(sizeError.error).toBe('File size exceeds maximum limit');
    });
  });

  describe('ImageResizeOptions', () => {
    it('should create valid options with default values', () => {
      const options: ImageResizeOptions = {};

      expect(options.width).toBeUndefined();
      expect(options.height).toBeUndefined();
      expect(options.maintainAspectRatio).toBeUndefined();
      expect(options.maxWidth).toBeUndefined();
      expect(options.maxHeight).toBeUndefined();
    });

    it('should create valid options with custom values', () => {
      const options: ImageResizeOptions = {
        width: 300,
        height: 200,
        maintainAspectRatio: true,
        maxWidth: 800,
        maxHeight: 600
      };

      expect(options.width).toBe(300);
      expect(options.height).toBe(200);
      expect(options.maintainAspectRatio).toBe(true);
      expect(options.maxWidth).toBe(800);
      expect(options.maxHeight).toBe(600);
    });

    it('should handle width-only resize', () => {
      const options: ImageResizeOptions = {
        width: 400,
        maintainAspectRatio: true
      };

      expect(options.width).toBe(400);
      expect(options.height).toBeUndefined();
      expect(options.maintainAspectRatio).toBe(true);
    });

    it('should handle height-only resize', () => {
      const options: ImageResizeOptions = {
        height: 300,
        maintainAspectRatio: true
      };

      expect(options.width).toBeUndefined();
      expect(options.height).toBe(300);
      expect(options.maintainAspectRatio).toBe(true);
    });

    it('should handle constraint-only options', () => {
      const options: ImageResizeOptions = {
        maxWidth: 1200,
        maxHeight: 800,
        maintainAspectRatio: false
      };

      expect(options.width).toBeUndefined();
      expect(options.height).toBeUndefined();
      expect(options.maxWidth).toBe(1200);
      expect(options.maxHeight).toBe(800);
      expect(options.maintainAspectRatio).toBe(false);
    });
  });

  describe('DEFAULT_IMAGE_UPLOAD_CONFIG', () => {
    it('should have sensible default values', () => {
      expect(DEFAULT_IMAGE_UPLOAD_CONFIG.maxFileSize).toBe(5 * 1024 * 1024); // 5MB
      expect(DEFAULT_IMAGE_UPLOAD_CONFIG.allowedFormats).toEqual([
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'
      ]);
      expect(DEFAULT_IMAGE_UPLOAD_CONFIG.allowUrlInput).toBe(true);
      expect(DEFAULT_IMAGE_UPLOAD_CONFIG.allowFileUpload).toBe(true);
      expect(DEFAULT_IMAGE_UPLOAD_CONFIG.maxWidth).toBe(2000);
      expect(DEFAULT_IMAGE_UPLOAD_CONFIG.maxHeight).toBe(2000);
      expect(DEFAULT_IMAGE_UPLOAD_CONFIG.autoResize).toBe(false);
      expect(DEFAULT_IMAGE_UPLOAD_CONFIG.quality).toBe(0.8);
    });
  });

  describe('validateImageUploadConfig', () => {
    it('should validate empty config as valid', () => {
      const result = validateImageUploadConfig({});
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate valid complete config', () => {
      const config: ImageUploadConfig = {
        maxFileSize: 10 * 1024 * 1024,
        allowedFormats: ['image/jpeg', 'image/png'],
        allowUrlInput: true,
        allowFileUpload: true,
        uploadUrl: 'https://api.example.com/upload',
        maxWidth: 1920,
        maxHeight: 1080,
        autoResize: true,
        quality: 0.9
      };

      const result = validateImageUploadConfig(config);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    describe('maxFileSize validation', () => {
      it('should reject negative maxFileSize', () => {
        const result = validateImageUploadConfig({ maxFileSize: -1 });
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('maxFileSize must be greater than 0');
      });

      it('should reject zero maxFileSize', () => {
        const result = validateImageUploadConfig({ maxFileSize: 0 });
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('maxFileSize must be greater than 0');
      });

      it('should reject maxFileSize over 100MB', () => {
        const result = validateImageUploadConfig({ maxFileSize: 101 * 1024 * 1024 });
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('maxFileSize cannot exceed 100MB');
      });

      it('should accept valid maxFileSize', () => {
        const result = validateImageUploadConfig({ maxFileSize: 10 * 1024 * 1024 });
        expect(result.isValid).toBe(true);
      });
    });

    describe('allowedFormats validation', () => {
      it('should reject non-array allowedFormats', () => {
        const result = validateImageUploadConfig({ allowedFormats: 'invalid' as any });
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('allowedFormats must be an array');
      });

      it('should reject empty allowedFormats array', () => {
        const result = validateImageUploadConfig({ allowedFormats: [] });
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('allowedFormats cannot be empty');
      });

      it('should reject invalid MIME types', () => {
        const result = validateImageUploadConfig({ allowedFormats: ['text/plain'] });
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Invalid MIME type: text/plain. Must be a valid image MIME type.');
      });

      it('should accept valid image MIME types', () => {
        const result = validateImageUploadConfig({ 
          allowedFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'] 
        });
        expect(result.isValid).toBe(true);
      });
    });

    describe('dimension validation', () => {
      it('should reject invalid maxWidth', () => {
        const result = validateImageUploadConfig({ maxWidth: 0 });
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('maxWidth must be between 1 and 10000 pixels');
      });

      it('should reject maxWidth over limit', () => {
        const result = validateImageUploadConfig({ maxWidth: 10001 });
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('maxWidth must be between 1 and 10000 pixels');
      });

      it('should reject invalid maxHeight', () => {
        const result = validateImageUploadConfig({ maxHeight: -1 });
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('maxHeight must be between 1 and 10000 pixels');
      });

      it('should accept valid dimensions', () => {
        const result = validateImageUploadConfig({ maxWidth: 1920, maxHeight: 1080 });
        expect(result.isValid).toBe(true);
      });
    });

    describe('quality validation', () => {
      it('should reject quality below 0', () => {
        const result = validateImageUploadConfig({ quality: -0.1 });
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('quality must be between 0 and 1');
      });

      it('should reject quality above 1', () => {
        const result = validateImageUploadConfig({ quality: 1.1 });
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('quality must be between 0 and 1');
      });

      it('should accept valid quality values', () => {
        expect(validateImageUploadConfig({ quality: 0 }).isValid).toBe(true);
        expect(validateImageUploadConfig({ quality: 0.5 }).isValid).toBe(true);
        expect(validateImageUploadConfig({ quality: 1 }).isValid).toBe(true);
      });
    });

    describe('uploadUrl validation', () => {
      it('should reject empty uploadUrl', () => {
        const result = validateImageUploadConfig({ uploadUrl: '' });
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('uploadUrl must be a non-empty string');
      });

      it('should reject invalid URL format', () => {
        const result = validateImageUploadConfig({ uploadUrl: 'not-a-url' });
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('uploadUrl must be a valid URL');
      });

      it('should accept valid URLs', () => {
        const result = validateImageUploadConfig({ uploadUrl: 'https://api.example.com/upload' });
        expect(result.isValid).toBe(true);
      });
    });

    describe('input method validation', () => {
      it('should reject config with both input methods disabled', () => {
        const result = validateImageUploadConfig({ 
          allowUrlInput: false, 
          allowFileUpload: false 
        });
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('At least one of allowUrlInput or allowFileUpload must be true');
      });

      it('should accept config with only URL input enabled', () => {
        const result = validateImageUploadConfig({ 
          allowUrlInput: true, 
          allowFileUpload: false 
        });
        expect(result.isValid).toBe(true);
      });

      it('should accept config with only file upload enabled', () => {
        const result = validateImageUploadConfig({ 
          allowUrlInput: false, 
          allowFileUpload: true 
        });
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('validateImageFile', () => {
    let mockFile: File;

    beforeEach(() => {
      mockFile = new File(['test content'], 'test.jpg', { 
        type: 'image/jpeg',
        lastModified: Date.now()
      });
      
      // Mock file size
      Object.defineProperty(mockFile, 'size', {
        value: 1024 * 1024, // 1MB
        writable: false
      });
    });

    it('should validate file with default config', () => {
      const result = validateImageFile(mockFile);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate file with custom config', () => {
      const config: ImageUploadConfig = {
        maxFileSize: 2 * 1024 * 1024, // 2MB
        allowedFormats: ['image/jpeg', 'image/png']
      };

      const result = validateImageFile(mockFile, config);
      expect(result.isValid).toBe(true);
    });

    it('should reject file exceeding size limit', () => {
      const largeFile = new File(['test'], 'large.jpg', { type: 'image/jpeg' });
      Object.defineProperty(largeFile, 'size', {
        value: 10 * 1024 * 1024, // 10MB
        writable: false
      });

      const config: ImageUploadConfig = {
        maxFileSize: 5 * 1024 * 1024 // 5MB limit
      };

      const result = validateImageFile(largeFile, config);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('File size (10.0MB) exceeds maximum allowed size of 5.0MB');
    });

    it('should reject unsupported file type', () => {
      const textFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      const result = validateImageFile(textFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("File type 'text/plain' is not supported");
    });

    it('should handle different image formats', () => {
      const formats = [
        { type: 'image/png', name: 'test.png' },
        { type: 'image/gif', name: 'test.gif' },
        { type: 'image/webp', name: 'test.webp' },
        { type: 'image/svg+xml', name: 'test.svg' }
      ];

      formats.forEach(format => {
        const file = new File(['test'], format.name, { type: format.type });
        Object.defineProperty(file, 'size', {
          value: 1024,
          writable: false
        });

        const result = validateImageFile(file);
        expect(result.isValid).toBe(true);
      });
    });

    it('should respect custom allowed formats', () => {
      const pngFile = new File(['test'], 'test.png', { type: 'image/png' });
      Object.defineProperty(pngFile, 'size', {
        value: 1024,
        writable: false
      });

      const config: ImageUploadConfig = {
        allowedFormats: ['image/jpeg'] // Only JPEG allowed
      };

      const result = validateImageFile(pngFile, config);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("File type 'image/png' is not supported. Allowed formats: jpeg");
    });
  });

  describe('createImageUploadConfig', () => {
    it('should return default config when no input provided', () => {
      const config = createImageUploadConfig();
      
      expect(config.maxFileSize).toBe(DEFAULT_IMAGE_UPLOAD_CONFIG.maxFileSize);
      expect(config.allowedFormats).toEqual(DEFAULT_IMAGE_UPLOAD_CONFIG.allowedFormats);
      expect(config.allowUrlInput).toBe(DEFAULT_IMAGE_UPLOAD_CONFIG.allowUrlInput);
      expect(config.allowFileUpload).toBe(DEFAULT_IMAGE_UPLOAD_CONFIG.allowFileUpload);
    });

    it('should merge custom config with defaults', () => {
      const customConfig: ImageUploadConfig = {
        maxFileSize: 10 * 1024 * 1024,
        allowUrlInput: false
      };

      const config = createImageUploadConfig(customConfig);
      
      expect(config.maxFileSize).toBe(10 * 1024 * 1024); // Custom value
      expect(config.allowUrlInput).toBe(false); // Custom value
      expect(config.allowFileUpload).toBe(DEFAULT_IMAGE_UPLOAD_CONFIG.allowFileUpload); // Default value
      expect(config.allowedFormats).toEqual(DEFAULT_IMAGE_UPLOAD_CONFIG.allowedFormats); // Default value
    });

    it('should preserve custom upload handler', () => {
      const uploadHandler = async (file: File) => 'custom-url';
      const customConfig: ImageUploadConfig = {
        uploadHandler
      };

      const config = createImageUploadConfig(customConfig);
      
      expect(config.uploadHandler).toBe(uploadHandler);
    });

    it('should handle all custom properties', () => {
      const customConfig: ImageUploadConfig = {
        maxFileSize: 20 * 1024 * 1024,
        allowedFormats: ['image/png'],
        allowUrlInput: false,
        allowFileUpload: true,
        uploadUrl: 'https://custom.api.com/upload',
        uploadHeaders: { 'X-Custom': 'header' },
        maxWidth: 800,
        maxHeight: 600,
        autoResize: true,
        quality: 0.9
      };

      const config = createImageUploadConfig(customConfig);
      
      expect(config).toEqual({
        ...DEFAULT_IMAGE_UPLOAD_CONFIG,
        ...customConfig
      });
    });
  });
});