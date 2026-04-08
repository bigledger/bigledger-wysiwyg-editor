import { Injectable } from '@angular/core';
import { SanitizerConfig, SanitizationRule } from '../models/editor-config.interface';
import { ErrorHandlerService } from './error-handler.service';

/**
 * Service for sanitizing HTML content to prevent XSS attacks
 */
@Injectable({
  providedIn: 'root'
})
export class HTMLSanitizerService {

  constructor(private errorHandler: ErrorHandlerService) {}
  
  /**
   * Default allowed HTML tags for rich text editing
   */
  private readonly DEFAULT_ALLOWED_TAGS = [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'a', 'img',
    'span', 'div',
    'blockquote', 'pre', 'code',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'iframe', 'video'
  ];

  /**
   * Default allowed attributes for HTML tags
   */
  private readonly DEFAULT_ALLOWED_ATTRIBUTES: Record<string, string[]> = {
    'a': ['href', 'title', 'target', 'rel'],
    'img': ['src', 'alt', 'title', 'width', 'height', 'class'],
    'span': ['style', 'class'],
    'div': ['style', 'class', 'contenteditable'],
    'p': ['style', 'class'],
    'h1': ['style', 'class'],
    'h2': ['style', 'class'],
    'h3': ['style', 'class'],
    'h4': ['style', 'class'],
    'h5': ['style', 'class'],
    'h6': ['style', 'class'],
    'blockquote': ['style', 'class'],
    'td': ['colspan', 'rowspan', 'style'],
    'th': ['colspan', 'rowspan', 'style'],
    'table': ['style', 'class', 'border', 'cellpadding', 'cellspacing'],
    'ul': ['style', 'class'],
    'ol': ['style', 'class'],
    'li': ['style', 'class'],
    'iframe': ['src', 'title', 'width', 'height', 'loading', 'referrerpolicy', 'allow', 'allowfullscreen', 'frameborder', 'class'],
    'video': ['src', 'title', 'width', 'height', 'controls', 'playsinline', 'preload', 'poster', 'class']
  };

  /**
   * Dangerous attributes that should always be removed
   */
  private readonly DANGEROUS_ATTRIBUTES = [
    'onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout',
    'onfocus', 'onblur', 'onchange', 'onsubmit', 'onreset',
    'onselect', 'onkeydown', 'onkeyup', 'onkeypress',
    'javascript:', 'vbscript:', 'data:'
  ];

  /**
   * Sanitizes HTML content based on the provided configuration
   * @param html The HTML content to sanitize
   * @param config Optional sanitizer configuration
   * @returns Sanitized HTML content
   */
  sanitize(html: string, config?: SanitizerConfig): string {
    if (!html || typeof html !== 'string') {
      return '';
    }

    // If sanitization is disabled, return original content
    if (config && !config.enabled) {
      return html;
    }

    try {
      // Create a temporary DOM element to parse HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;

      const originalContent = html;
      
      // Apply sanitization rules
      this.sanitizeElement(tempDiv, config);

      const sanitizedContent = tempDiv.innerHTML;
      
      // Report sanitization if content was modified
      if (originalContent !== sanitizedContent) {
        this.errorHandler.handleSanitizationError(
          originalContent,
          sanitizedContent,
          this.getRemovedElements(originalContent, sanitizedContent),
          this.getRemovedAttributes(originalContent, sanitizedContent)
        );
      }

      return sanitizedContent;
    } catch (error) {
      this.errorHandler.handleSanitizationError(
        html,
        '',
        [],
        [],
      );
      // Return empty string on sanitization failure for security
      return '';
    }
  }

  /**
   * Strips specified tags from HTML content
   * @param html The HTML content
   * @param allowedTags Array of allowed tag names
   * @returns HTML with only allowed tags
   */
  stripTags(html: string, allowedTags: string[]): string {
    if (!html || typeof html !== 'string') {
      return '';
    }

    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;

      const originalContent = html;
      this.removeDisallowedTags(tempDiv, allowedTags);
      const sanitizedContent = tempDiv.innerHTML;

      // Report if tags were removed
      if (originalContent !== sanitizedContent) {
        const removedTags = this.getRemovedElements(originalContent, sanitizedContent);
        this.errorHandler.handleSanitizationError(
          originalContent,
          sanitizedContent,
          removedTags,
          []
        );
      }

      return sanitizedContent;
    } catch (error) {
      this.errorHandler.handleSanitizationError(html, '', [], []);
      return '';
    }
  }

  /**
   * Cleans attributes from HTML elements
   * @param html The HTML content
   * @param allowedAttributes Map of tag names to allowed attributes
   * @returns HTML with cleaned attributes
   */
  cleanAttributes(html: string, allowedAttributes?: Record<string, string[]>): string {
    if (!html || typeof html !== 'string') {
      return '';
    }

    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;

      const originalContent = html;
      this.cleanElementAttributes(tempDiv, allowedAttributes || this.DEFAULT_ALLOWED_ATTRIBUTES);
      const sanitizedContent = tempDiv.innerHTML;

      // Report if attributes were removed
      if (originalContent !== sanitizedContent) {
        const removedAttributes = this.getRemovedAttributes(originalContent, sanitizedContent);
        this.errorHandler.handleSanitizationError(
          originalContent,
          sanitizedContent,
          [],
          removedAttributes
        );
      }

      return sanitizedContent;
    } catch (error) {
      this.errorHandler.handleSanitizationError(html, '', [], []);
      return '';
    }
  }

  /**
   * Recursively sanitizes a DOM element and its children
   * @param element The element to sanitize
   * @param config Sanitizer configuration
   */
  private sanitizeElement(element: Element, config?: SanitizerConfig): void {
    const allowedTags = config?.allowedTags || this.DEFAULT_ALLOWED_TAGS;
    const allowedAttributes = config?.allowedAttributes || this.DEFAULT_ALLOWED_ATTRIBUTES;
    const stripUnknownTags = config?.stripUnknownTags !== false;
    const stripUnknownAttributes = config?.stripUnknownAttributes !== false;

    // Process all child elements
    const children = Array.from(element.children);
    
    for (const child of children) {
      const tagName = child.tagName.toLowerCase();

      // Check if tag is allowed
      if (!allowedTags.includes(tagName)) {
        if (stripUnknownTags) {
          // Remove the element but keep its content
          const parent = child.parentNode;
          if (parent) {
            // Move all child nodes to parent before removing the element
            while (child.firstChild) {
              parent.insertBefore(child.firstChild, child);
            }
            parent.removeChild(child);
          }
        }
        continue;
      }

      // Clean attributes
      if (stripUnknownAttributes) {
        this.cleanElementAttributes(child, allowedAttributes);
      }

      // Apply custom rules if provided
      if (config?.customRules) {
        this.applyCustomRules(child, config.customRules);
      }

      // Recursively sanitize child elements
      this.sanitizeElement(child, config);
    }
  }

  /**
   * Removes disallowed tags from an element
   * @param element The element to process
   * @param allowedTags Array of allowed tag names
   */
  private removeDisallowedTags(element: Element, allowedTags: string[]): void {
    const children = Array.from(element.children);
    
    for (const child of children) {
      const tagName = child.tagName.toLowerCase();

      if (!allowedTags.includes(tagName)) {
        // Remove the element but keep its content
        const parent = child.parentNode;
        if (parent) {
          while (child.firstChild) {
            parent.insertBefore(child.firstChild, child);
          }
          parent.removeChild(child);
        }
      } else {
        // Recursively process child elements
        this.removeDisallowedTags(child, allowedTags);
      }
    }
  }

  /**
   * Cleans attributes from an element
   * @param element The element to clean
   * @param allowedAttributes Map of tag names to allowed attributes
   */
  private cleanElementAttributes(element: Element, allowedAttributes: Record<string, string[]>): void {
    const tagName = element.tagName.toLowerCase();
    const allowedAttrs = allowedAttributes[tagName] || [];
    
    // Get all attributes
    const attributes = Array.from(element.attributes);
    
    for (const attr of attributes) {
      const attrName = attr.name.toLowerCase();
      
      // Remove dangerous attributes
      if (this.isDangerousAttribute(attrName, attr.value)) {
        element.removeAttribute(attr.name);
        continue;
      }
      
      // Remove attributes not in allowed list
      if (!allowedAttrs.includes(attrName)) {
        element.removeAttribute(attr.name);
        continue;
      }
      
      // Sanitize attribute values
      const sanitizedValue = this.sanitizeAttributeValue(attrName, attr.value);
      if (sanitizedValue !== attr.value) {
        element.setAttribute(attr.name, sanitizedValue);
      }
    }
  }

  /**
   * Checks if an attribute is dangerous
   * @param name Attribute name
   * @param value Attribute value
   * @returns True if the attribute is dangerous
   */
  private isDangerousAttribute(name: string, value: string): boolean {
    // Check for event handlers
    if (name.startsWith('on')) {
      return true;
    }
    
    // Check for dangerous attribute names
    if (this.DANGEROUS_ATTRIBUTES.some(dangerous => name.includes(dangerous))) {
      return true;
    }
    
    // Check for dangerous protocols in URLs
    if ((name === 'href' || name === 'src') && value) {
      const lowerValue = value.toLowerCase().trim();
      if (lowerValue.startsWith('javascript:') || 
          lowerValue.startsWith('vbscript:') || 
          lowerValue.startsWith('data:') ||
          lowerValue.startsWith('file:')) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Sanitizes an attribute value
   * @param name Attribute name
   * @param value Attribute value
   * @returns Sanitized attribute value
   */
  private sanitizeAttributeValue(name: string, value: string): string {
    if (!value) {
      return value;
    }
    
    // Sanitize style attributes
    if (name === 'style') {
      return this.sanitizeStyleAttribute(value);
    }
    
    // Sanitize URL attributes
    if (name === 'href' || name === 'src') {
      return this.sanitizeUrlAttribute(value);
    }
    
    return value;
  }

  /**
   * Sanitizes CSS style attribute values
   * @param style The style attribute value
   * @returns Sanitized style value
   */
  private sanitizeStyleAttribute(style: string): string {
    // Remove potentially dangerous CSS properties
    const dangerousProperties = [
      'expression', 'behavior', 'binding', 'javascript:', 'vbscript:',
      'position: fixed', 'position: absolute'
    ];
    
    let sanitizedStyle = style;
    
    for (const dangerous of dangerousProperties) {
      const regex = new RegExp(dangerous, 'gi');
      sanitizedStyle = sanitizedStyle.replace(regex, '');
    }
    
    return sanitizedStyle.trim();
  }

  /**
   * Sanitizes URL attribute values
   * @param url The URL to sanitize
   * @returns Sanitized URL
   */
  private sanitizeUrlAttribute(url: string): string {
    const trimmedUrl = url.trim();
    
    // Allow relative URLs
    if (trimmedUrl.startsWith('/') || trimmedUrl.startsWith('./') || trimmedUrl.startsWith('../')) {
      return trimmedUrl;
    }
    
    // Allow HTTP and HTTPS URLs
    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
      return trimmedUrl;
    }
    
    // Allow mailto links
    if (trimmedUrl.startsWith('mailto:')) {
      return trimmedUrl;
    }
    
    // Allow tel links
    if (trimmedUrl.startsWith('tel:')) {
      return trimmedUrl;
    }
    
    // For anything else, make it a relative URL to be safe
    return '#';
  }

  /**
   * Applies custom sanitization rules
   * @param element The element to process
   * @param rules Array of custom rules
   */
  private applyCustomRules(element: Element, rules: SanitizationRule[]): void {
    const tagName = element.tagName.toLowerCase();
    
    for (const rule of rules) {
      if (rule.tag.toLowerCase() === tagName) {
        switch (rule.action) {
          case 'deny':
            // Remove the element
            const parent = element.parentNode;
            if (parent) {
              parent.removeChild(element);
            }
            break;
            
          case 'transform':
            if (rule.transform) {
              const transformed = rule.transform(element);
              if (transformed !== element && element.parentNode) {
                element.parentNode.replaceChild(transformed, element);
              }
            }
            break;
            
          case 'allow':
            // Element is explicitly allowed, no action needed
            break;
        }
      }
    }
  }

  /**
   * Get list of removed elements by comparing original and sanitized content
   * @param original Original HTML content
   * @param sanitized Sanitized HTML content
   * @returns Array of removed element tag names
   */
  private getRemovedElements(original: string, sanitized: string): string[] {
    try {
      const originalDiv = document.createElement('div');
      originalDiv.innerHTML = original;
      
      const sanitizedDiv = document.createElement('div');
      sanitizedDiv.innerHTML = sanitized;

      const originalTags = this.extractTagNames(originalDiv);
      const sanitizedTags = this.extractTagNames(sanitizedDiv);

      return originalTags.filter(tag => !sanitizedTags.includes(tag));
    } catch (error) {
      return [];
    }
  }

  /**
   * Get list of removed attributes by comparing original and sanitized content
   * @param original Original HTML content
   * @param sanitized Sanitized HTML content
   * @returns Array of removed attribute names
   */
  private getRemovedAttributes(original: string, sanitized: string): string[] {
    try {
      const originalDiv = document.createElement('div');
      originalDiv.innerHTML = original;
      
      const sanitizedDiv = document.createElement('div');
      sanitizedDiv.innerHTML = sanitized;

      const originalAttrs = this.extractAttributeNames(originalDiv);
      const sanitizedAttrs = this.extractAttributeNames(sanitizedDiv);

      return originalAttrs.filter(attr => !sanitizedAttrs.includes(attr));
    } catch (error) {
      return [];
    }
  }

  /**
   * Extract all tag names from an element
   * @param element Element to extract tag names from
   * @returns Array of unique tag names
   */
  private extractTagNames(element: Element): string[] {
    const tags: string[] = [];
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_ELEMENT,
      null
    );

    let node: Node | null;
    while (node = walker.nextNode()) {
      const tagName = (node as Element).tagName.toLowerCase();
      if (!tags.includes(tagName)) {
        tags.push(tagName);
      }
    }

    return tags;
  }

  /**
   * Extract all attribute names from an element and its children
   * @param element Element to extract attribute names from
   * @returns Array of unique attribute names
   */
  private extractAttributeNames(element: Element): string[] {
    const attributes: string[] = [];
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_ELEMENT,
      null
    );

    let node: Node | null;
    while (node = walker.nextNode()) {
      const elementNode = node as Element;
      Array.from(elementNode.attributes).forEach(attr => {
        if (!attributes.includes(attr.name)) {
          attributes.push(attr.name);
        }
      });
    }

    return attributes;
  }

  /**
   * Check if HTML is valid and safe
   * @param html HTML string to validate
   * @returns True if HTML is valid and safe
   */
  isValidHTML(html: string): boolean {
    try {
      // Basic validation - check if HTML can be parsed
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Check for potentially dangerous elements
      const dangerousElements = tempDiv.querySelectorAll('script, object, embed, form');
      if (dangerousElements.length > 0) {
        return false;
      }
      
      // Check for dangerous attributes
      const allElements = tempDiv.querySelectorAll('*');
      for (const element of Array.from(allElements)) {
        const attributes = Array.from(element.attributes);
        for (const attr of attributes) {
          if (attr.name.startsWith('on') || attr.name === 'javascript:') {
            return false;
          }
        }
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }
}
