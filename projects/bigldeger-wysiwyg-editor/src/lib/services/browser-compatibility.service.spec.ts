import { TestBed } from '@angular/core/testing';
import { BrowserCompatibilityService, CompatibilityStatus } from './browser-compatibility.service';
import { ErrorHandlerService } from './error-handler.service';

describe('BrowserCompatibilityService', () => {
  let service: BrowserCompatibilityService;
  let errorHandlerSpy: jasmine.SpyObj<ErrorHandlerService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ErrorHandlerService', [
      'handleBrowserError',
      'isFeatureSupported'
    ]);

    TestBed.configureTestingModule({
      providers: [
        BrowserCompatibilityService,
        { provide: ErrorHandlerService, useValue: spy }
      ]
    });

    service = TestBed.inject(BrowserCompatibilityService);
    errorHandlerSpy = TestBed.inject(ErrorHandlerService) as jasmine.SpyObj<ErrorHandlerService>;
  });

  describe('Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should detect browser information', () => {
      const browserInfo = service.getBrowserInfo();
      expect(browserInfo).toBeDefined();
      if (browserInfo) {
        expect(browserInfo.name).toBeDefined();
        expect(browserInfo.version).toBeDefined();
        expect(browserInfo.os).toBeDefined();
        expect(typeof browserInfo.mobile).toBe('boolean');
      }
    });

    it('should emit initial compatibility status', (done) => {
      service.compatibilityStatus$.subscribe(status => {
        expect(status).toBeDefined();
        expect(typeof status.supported).toBe('boolean');
        expect(Array.isArray(status.missingFeatures)).toBe(true);
        expect(Array.isArray(status.warnings)).toBe(true);
        done();
      });
    });
  });

  describe('Feature Detection', () => {
    it('should detect execCommand support', () => {
      const supported = service.isFeatureSupported('execCommand');
      expect(typeof supported).toBe('boolean');
    });

    it('should detect getSelection support', () => {
      const supported = service.isFeatureSupported('getSelection');
      expect(typeof supported).toBe('boolean');
    });

    it('should detect createRange support', () => {
      const supported = service.isFeatureSupported('createRange');
      expect(typeof supported).toBe('boolean');
    });

    it('should detect contentEditable support', () => {
      const supported = service.isFeatureSupported('contentEditable');
      expect(typeof supported).toBe('boolean');
    });

    it('should detect clipboard API support', () => {
      const supported = service.isFeatureSupported('clipboardAPI');
      expect(typeof supported).toBe('boolean');
    });

    it('should detect file API support', () => {
      const supported = service.isFeatureSupported('fileAPI');
      expect(typeof supported).toBe('boolean');
    });

    it('should detect drag and drop support', () => {
      const supported = service.isFeatureSupported('dragAndDrop');
      expect(typeof supported).toBe('boolean');
    });

    it('should cache feature detection results', () => {
      const feature = 'execCommand';
      const result1 = service.isFeatureSupported(feature);
      const result2 = service.isFeatureSupported(feature);
      
      expect(result1).toBe(result2);
    });

    it('should return false for unknown features', () => {
      const supported = service.isFeatureSupported('unknownFeature');
      expect(supported).toBe(false);
    });

    it('should handle feature detection errors gracefully', () => {
      // Mock a feature that throws an error during detection
      spyOn(document, 'createElement').and.throwError('Test error');
      
      const supported = service.isFeatureSupported('contentEditable');
      expect(supported).toBe(false);
      expect(errorHandlerSpy.handleBrowserError).toHaveBeenCalled();
    });
  });

  describe('Compatibility Status', () => {
    it('should determine if browser is fully supported', () => {
      const supported = service.isFullySupported();
      expect(typeof supported).toBe('boolean');
    });

    it('should return missing features list', () => {
      const missingFeatures = service.getMissingFeatures();
      expect(Array.isArray(missingFeatures)).toBe(true);
    });

    it('should return warnings list', () => {
      const warnings = service.getWarnings();
      expect(Array.isArray(warnings)).toBe(true);
    });

    it('should update compatibility status when features change', (done) => {
      let emissionCount = 0;
      service.compatibilityStatus$.subscribe(status => {
        emissionCount++;
        if (emissionCount === 1) {
          // Initial status
          expect(status).toBeDefined();
          done();
        }
      });
    });
  });

  describe('Fallback Implementations', () => {
    it('should provide execCommand fallback', () => {
      const fallback = service.getFallbackImplementation('execCommand');
      expect(fallback).toBeDefined();
      expect(typeof fallback.execute).toBe('function');
    });

    it('should provide getSelection fallback', () => {
      const fallback = service.getFallbackImplementation('getSelection');
      expect(fallback).toBeDefined();
      expect(typeof fallback.getSelection).toBe('function');
    });

    it('should provide createRange fallback', () => {
      const fallback = service.getFallbackImplementation('createRange');
      expect(fallback).toBeDefined();
      expect(typeof fallback.createRange).toBe('function');
    });

    it('should provide clipboard API fallback', () => {
      const fallback = service.getFallbackImplementation('clipboardAPI');
      expect(fallback).toBeDefined();
      expect(typeof fallback.writeText).toBe('function');
      expect(typeof fallback.readText).toBe('function');
    });

    it('should provide file API fallback', () => {
      const fallback = service.getFallbackImplementation('fileAPI');
      expect(fallback).toBeDefined();
      expect(typeof fallback.readAsDataURL).toBe('function');
    });

    it('should return null for unknown features', () => {
      const fallback = service.getFallbackImplementation('unknownFeature');
      expect(fallback).toBeNull();
    });
  });

  describe('Polyfill Loading', () => {
    it('should attempt to load polyfills', async () => {
      const result = await service.loadPolyfill('mutationObserver');
      expect(typeof result).toBe('boolean');
    });

    it('should handle polyfill loading errors', async () => {
      const result = await service.loadPolyfill('nonexistentFeature');
      expect(result).toBe(false);
    });

    it('should not reload already loaded polyfills', async () => {
      // First load
      await service.loadPolyfill('mutationObserver');
      
      // Second load should return immediately
      const result = await service.loadPolyfill('mutationObserver');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Browser-Specific Handling', () => {
    it('should handle Chrome-specific issues', () => {
      // Mock Chrome user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36',
        configurable: true
      });

      // Recreate service to trigger browser detection
      service = new BrowserCompatibilityService(errorHandlerSpy);
      
      const warnings = service.getWarnings();
      expect(warnings.some(w => w.includes('Chrome'))).toBe(true);
    });

    it('should handle Firefox-specific issues', () => {
      // Mock Firefox user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:70.0) Gecko/20100101 Firefox/70.0',
        configurable: true
      });

      service = new BrowserCompatibilityService(errorHandlerSpy);
      
      const warnings = service.getWarnings();
      expect(warnings.some(w => w.includes('Firefox'))).toBe(true);
    });

    it('should handle Safari-specific issues', () => {
      // Mock Safari user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.2 Safari/605.1.15',
        configurable: true
      });

      service = new BrowserCompatibilityService(errorHandlerSpy);
      
      const warnings = service.getWarnings();
      expect(warnings.some(w => w.includes('Safari'))).toBe(true);
    });

    it('should handle IE-specific issues', () => {
      // Mock IE user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko',
        configurable: true
      });

      service = new BrowserCompatibilityService(errorHandlerSpy);
      
      const warnings = service.getWarnings();
      expect(warnings.some(w => w.includes('Internet Explorer'))).toBe(true);
    });

    it('should detect mobile browsers', () => {
      // Mock mobile Safari user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0 Mobile/15E148 Safari/604.1',
        configurable: true
      });

      service = new BrowserCompatibilityService(errorHandlerSpy);
      
      const browserInfo = service.getBrowserInfo();
      expect(browserInfo?.mobile).toBe(true);
    });
  });

  describe('Compatibility Fixes', () => {
    it('should apply compatibility fixes', () => {
      expect(() => service.applyCompatibilityFixes()).not.toThrow();
    });

    it('should handle errors when applying fixes', () => {
      // Mock a scenario where applying fixes fails
      spyOn(service, 'getFallbackImplementation').and.throwError('Test error');
      
      expect(() => service.applyCompatibilityFixes()).not.toThrow();
    });
  });

  describe('Clipboard Fallback', () => {
    it('should provide clipboard fallback functionality', async () => {
      const fallback = service.getFallbackImplementation('clipboardAPI');
      
      // Mock successful execCommand
      spyOn(document, 'execCommand').and.returnValue(true);
      spyOn(document.body, 'appendChild').and.stub();
      spyOn(document.body, 'removeChild').and.stub();
      
      const result = await fallback.writeText('test text');
      expect(result).toBe(true);
    });

    it('should handle clipboard fallback errors', async () => {
      const fallback = service.getFallbackImplementation('clipboardAPI');
      
      // Mock failed execCommand
      spyOn(document, 'execCommand').and.returnValue(false);
      
      const result = await fallback.writeText('test text');
      expect(result).toBe(false);
    });

    it('should reject clipboard read in fallback mode', async () => {
      const fallback = service.getFallbackImplementation('clipboardAPI');
      
      try {
        await fallback.readText();
        fail('Should have thrown an error');
      } catch (error) {
        expect((error as Error).message).toContain('not supported in fallback mode');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle feature detection errors', () => {
      // Force an error during feature detection
      const originalCreateElement = document.createElement;
      spyOn(document, 'createElement').and.callFake((tagName: string) => {
        if (tagName === 'div') {
          throw new Error('Test error');
        }
        return originalCreateElement.call(document, tagName);
      });

      const supported = service.isFeatureSupported('contentEditable');
      expect(supported).toBe(false);
      expect(errorHandlerSpy.handleBrowserError).toHaveBeenCalled();
    });

    it('should handle polyfill loading errors', async () => {
      const result = await service.loadPolyfill('invalidFeature');
      expect(result).toBe(false);
    });
  });
});