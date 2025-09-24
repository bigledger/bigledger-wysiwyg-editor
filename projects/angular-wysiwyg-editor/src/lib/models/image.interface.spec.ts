import { ImageData, ImageUploadConfig, ImageValidationResult, ImageResizeOptions } from './image.interface';

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
    });

    it('should create valid config with custom values', () => {
      const uploadHandler = async (file: File): Promise<string> => {
        return `uploaded/${file.name}`;
      };

      const config: ImageUploadConfig = {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedFormats: ['image/jpeg', 'image/png'],
        allowUrlInput: false,
        allowFileUpload: true,
        uploadHandler
      };

      expect(config.maxFileSize).toBe(10 * 1024 * 1024);
      expect(config.allowedFormats).toEqual(['image/jpeg', 'image/png']);
      expect(config.allowUrlInput).toBe(false);
      expect(config.allowFileUpload).toBe(true);
      expect(config.uploadHandler).toBe(uploadHandler);
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
});