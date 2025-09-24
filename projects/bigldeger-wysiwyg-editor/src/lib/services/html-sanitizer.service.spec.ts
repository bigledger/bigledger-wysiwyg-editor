import { TestBed } from '@angular/core/testing';
import { HTMLSanitizerService } from './html-sanitizer.service';
import { SanitizerConfig, SanitizationRule } from '../models/editor-config.interface';

describe('HTMLSanitizerService', () => {
  let service: HTMLSanitizerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HTMLSanitizerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('sanitize', () => {
    it('should return empty string for null or undefined input', () => {
      expect(service.sanitize(null as any)).toBe('');
      expect(service.sanitize(undefined as any)).toBe('');
      expect(service.sanitize('')).toBe('');
    });

    it('should return original content when sanitization is disabled', () => {
      const html = '<script>alert("xss")</script><p>Hello</p>';
      const config: SanitizerConfig = { enabled: false };
      
      expect(service.sanitize(html, config)).toBe(html);
    });

    it('should remove script tags by default', () => {
      const html = '<script>alert("xss")</script><p>Hello World</p>';
      const result = service.sanitize(html);
      
      expect(result).not.toContain('<script>');
      expect(result).toContain('<p>Hello World</p>');
    });

    it('should remove dangerous event handlers', () => {
      const html = '<p onclick="alert(\'xss\')">Click me</p>';
      const result = service.sanitize(html);
      
      expect(result).not.toContain('onclick');
      expect(result).toContain('<p>Click me</p>');
    });

    it('should preserve allowed tags and attributes', () => {
      const html = '<p style="color: red;"><strong>Bold text</strong></p>';
      const result = service.sanitize(html);
      
      expect(result).toContain('<p style="color: red;">');
      expect(result).toContain('<strong>Bold text</strong>');
    });

    it('should sanitize href attributes with dangerous protocols', () => {
      const html = '<a href="javascript:alert(\'xss\')">Link</a>';
      const result = service.sanitize(html);
      
      expect(result).toContain('<a href="#">Link</a>');
    });

    it('should preserve safe href attributes', () => {
      const html = '<a href="https://example.com">Link</a>';
      const result = service.sanitize(html);
      
      expect(result).toContain('<a href="https://example.com">Link</a>');
    });

    it('should handle custom allowed tags', () => {
      const html = '<custom-tag>Content</custom-tag><p>Paragraph</p>';
      const config: SanitizerConfig = {
        enabled: true,
        allowedTags: ['custom-tag', 'p']
      };
      const result = service.sanitize(html, config);
      
      expect(result).toContain('<custom-tag>Content</custom-tag>');
      expect(result).toContain('<p>Paragraph</p>');
    });

    it('should apply custom sanitization rules', () => {
      const html = '<div class="test">Content</div>';
      const customRule: SanitizationRule = {
        tag: 'div',
        action: 'transform',
        transform: (element: Element) => {
          const span = document.createElement('span');
          span.innerHTML = element.innerHTML;
          return span;
        }
      };
      const config: SanitizerConfig = {
        enabled: true,
        customRules: [customRule]
      };
      const result = service.sanitize(html, config);
      
      expect(result).toContain('<span>Content</span>');
      expect(result).not.toContain('<div>');
    });

    it('should deny elements with custom rules', () => {
      const html = '<div>Keep this</div><span>Remove this</span>';
      const customRule: SanitizationRule = {
        tag: 'span',
        action: 'deny'
      };
      const config: SanitizerConfig = {
        enabled: true,
        customRules: [customRule]
      };
      const result = service.sanitize(html, config);
      
      expect(result).toContain('<div>Keep this</div>');
      expect(result).not.toContain('<span>');
    });
  });

  describe('stripTags', () => {
    it('should remove disallowed tags', () => {
      const html = '<script>alert("xss")</script><p>Hello</p><div>World</div>';
      const allowedTags = ['p'];
      const result = service.stripTags(html, allowedTags);
      
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('<div>');
      expect(result).toContain('<p>Hello</p>');
      expect(result).toContain('World'); // Content should be preserved
    });

    it('should preserve content of removed tags', () => {
      const html = '<div><p>Nested content</p></div>';
      const allowedTags = ['p'];
      const result = service.stripTags(html, allowedTags);
      
      expect(result).toContain('<p>Nested content</p>');
      expect(result).not.toContain('<div>');
    });

    it('should handle empty input', () => {
      expect(service.stripTags('', ['p'])).toBe('');
      expect(service.stripTags(null as any, ['p'])).toBe('');
    });
  });

  describe('cleanAttributes', () => {
    it('should remove dangerous attributes', () => {
      const html = '<p onclick="alert(\'xss\')" style="color: red;">Content</p>';
      const result = service.cleanAttributes(html);
      
      expect(result).not.toContain('onclick');
      expect(result).toContain('style="color: red;"');
    });

    it('should remove attributes not in allowed list', () => {
      const html = '<p data-custom="value" style="color: red;">Content</p>';
      const allowedAttributes = { 'p': ['style'] };
      const result = service.cleanAttributes(html, allowedAttributes);
      
      expect(result).not.toContain('data-custom');
      expect(result).toContain('style="color: red;"');
    });

    it('should sanitize style attributes', () => {
      const html = '<p style="color: red; expression(alert(\'xss\'));">Content</p>';
      const result = service.cleanAttributes(html);
      
      expect(result).not.toContain('expression');
      expect(result).toContain('color: red');
    });

    it('should sanitize URL attributes', () => {
      const html = '<a href="javascript:alert(\'xss\')">Link</a>';
      const result = service.cleanAttributes(html);
      
      expect(result).toContain('href="#"');
    });

    it('should preserve safe URLs', () => {
      const html = '<a href="https://example.com">Link</a><img src="/image.jpg" alt="Image">';
      const result = service.cleanAttributes(html);
      
      expect(result).toContain('href="https://example.com"');
      expect(result).toContain('src="/image.jpg"');
    });

    it('should handle mailto and tel links', () => {
      const html = '<a href="mailto:test@example.com">Email</a><a href="tel:+1234567890">Phone</a>';
      const result = service.cleanAttributes(html);
      
      expect(result).toContain('href="mailto:test@example.com"');
      expect(result).toContain('href="tel:+1234567890"');
    });
  });

  describe('XSS prevention', () => {
    it('should prevent script injection', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(\'xss\')">',
        '<a href="javascript:alert(\'xss\')">Click</a>',
        '<div onclick="alert(\'xss\')">Click</div>',
        '<iframe src="javascript:alert(\'xss\')"></iframe>',
        '<object data="javascript:alert(\'xss\')"></object>',
        '<embed src="javascript:alert(\'xss\')">',
        '<link rel="stylesheet" href="javascript:alert(\'xss\')">',
        '<style>body { background: url("javascript:alert(\'xss\')"); }</style>'
      ];

      maliciousInputs.forEach(input => {
        const result = service.sanitize(input);
        expect(result).not.toContain('javascript:');
        expect(result).not.toContain('alert(');
        expect(result).not.toContain('onerror');
        expect(result).not.toContain('onclick');
      });
    });

    it('should prevent CSS injection', () => {
      const maliciousCSS = [
        '<p style="background: url(javascript:alert(\'xss\'));">Content</p>',
        '<p style="expression(alert(\'xss\'));">Content</p>',
        '<p style="behavior: url(evil.htc);">Content</p>',
        '<p style="binding: url(evil.xml);">Content</p>'
      ];

      maliciousCSS.forEach(input => {
        const result = service.sanitize(input);
        expect(result).not.toContain('javascript:');
        expect(result).not.toContain('expression(');
        expect(result).not.toContain('behavior:');
        expect(result).not.toContain('binding:');
      });
    });

    it('should prevent data URI attacks', () => {
      const html = '<img src="data:text/html,<script>alert(\'xss\')</script>">';
      const result = service.sanitize(html);
      
      expect(result).not.toContain('data:text/html');
      expect(result).toContain('src="#"');
    });
  });

  describe('Edge cases', () => {
    it('should handle deeply nested elements', () => {
      const html = '<div><p><span><strong>Deep nesting</strong></span></p></div>';
      const result = service.sanitize(html);
      
      expect(result).toContain('<div><p><span><strong>Deep nesting</strong></span></p></div>');
    });

    it('should handle malformed HTML', () => {
      const html = '<p>Unclosed paragraph<div>Mixed nesting</p></div>';
      const result = service.sanitize(html);
      
      // Should not throw an error and should produce some output
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should handle empty attributes', () => {
      const html = '<p class="" style="">Content</p>';
      const result = service.sanitize(html);
      
      expect(result).toContain('<p');
      expect(result).toContain('Content');
    });

    it('should handle special characters in content', () => {
      const html = '<p>&lt;script&gt;alert("safe")&lt;/script&gt;</p>';
      const result = service.sanitize(html);
      
      expect(result).toContain('&lt;script&gt;');
      expect(result).toContain('alert("safe")');
    });

    it('should preserve whitespace in content', () => {
      const html = '<p>  Spaced   content  </p>';
      const result = service.sanitize(html);
      
      expect(result).toContain('  Spaced   content  ');
    });
  });

  describe('Performance', () => {
    it('should handle large HTML content efficiently', () => {
      const largeContent = '<p>' + 'A'.repeat(10000) + '</p>';
      const startTime = performance.now();
      
      const result = service.sanitize(largeContent);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(result).toContain('<p>');
      expect(result.length).toBeGreaterThan(10000);
      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });

    it('should handle many elements efficiently', () => {
      const manyElements = Array.from({ length: 1000 }, (_, i) => `<p>Paragraph ${i}</p>`).join('');
      const startTime = performance.now();
      
      const result = service.sanitize(manyElements);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(result).toContain('<p>Paragraph 0</p>');
      expect(result).toContain('<p>Paragraph 999</p>');
      expect(duration).toBeLessThan(200); // Should complete within 200ms
    });
  });
});