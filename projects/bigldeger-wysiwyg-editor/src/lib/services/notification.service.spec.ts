import { TestBed } from '@angular/core/testing';
import { NotificationService, Notification, NotificationAction, NotificationConfig } from './notification.service';
import { EditorError } from '../models/error.interface';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    service.dismissAll();
  });

  describe('Basic Functionality', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should show info notification', () => {
      const id = service.info('Test Title', 'Test message');
      
      expect(id).toBeDefined();
      
      const notifications = service.getNotifications();
      expect(notifications.length).toBe(1);
      expect(notifications[0].type).toBe('info');
      expect(notifications[0].title).toBe('Test Title');
      expect(notifications[0].message).toBe('Test message');
    });

    it('should show success notification', () => {
      const id = service.success('Success', 'Operation completed');
      
      const notification = service.getNotification(id);
      expect(notification?.type).toBe('success');
      expect(notification?.title).toBe('Success');
      expect(notification?.message).toBe('Operation completed');
    });

    it('should show warning notification', () => {
      const id = service.warning('Warning', 'Please be careful');
      
      const notification = service.getNotification(id);
      expect(notification?.type).toBe('warning');
      expect(notification?.title).toBe('Warning');
      expect(notification?.message).toBe('Please be careful');
    });

    it('should show error notification', () => {
      const actions: NotificationAction[] = [
        { label: 'Retry', action: jasmine.createSpy('retry') }
      ];
      
      const id = service.error('Error', 'Something went wrong', actions);
      
      const notification = service.getNotification(id);
      expect(notification?.type).toBe('error');
      expect(notification?.title).toBe('Error');
      expect(notification?.message).toBe('Something went wrong');
      expect(notification?.actions).toBe(actions);
      expect(notification?.duration).toBeUndefined(); // Errors don't auto-dismiss
    });
  });

  describe('Configuration', () => {
    it('should configure notification service', () => {
      const config: Partial<NotificationConfig> = {
        defaultDuration: 3000,
        maxNotifications: 3,
        position: 'bottom-left',
        showErrorDetails: true
      };

      service.configure(config);

      const id = service.info('Test', 'Message', undefined); // Use default duration
      const notification = service.getNotification(id);
      
      expect(notification?.duration).toBe(3000);
    });

    it('should enforce max notifications limit', () => {
      service.configure({ maxNotifications: 2 });

      service.info('First', 'Message 1');
      service.info('Second', 'Message 2');
      service.info('Third', 'Message 3'); // Should remove first

      const notifications = service.getNotifications();
      expect(notifications.length).toBe(2);
      expect(notifications[0].title).toBe('Third'); // Newest first
      expect(notifications[1].title).toBe('Second');
    });
  });

  describe('Notification Management', () => {
    it('should dismiss notification by ID', (done) => {
      const id = service.info('Test', 'Message');
      
      expect(service.getNotifications().length).toBe(1);

      service.dismiss$.subscribe(dismissedId => {
        expect(dismissedId).toBe(id);
        expect(service.getNotifications().length).toBe(0);
        done();
      });

      service.dismiss(id);
    });

    it('should dismiss all notifications', (done) => {
      const id1 = service.info('Test 1', 'Message 1');
      const id2 = service.warning('Test 2', 'Message 2');
      
      expect(service.getNotifications().length).toBe(2);

      let dismissCount = 0;
      service.dismiss$.subscribe(dismissedId => {
        dismissCount++;
        if (dismissCount === 2) {
          expect(service.getNotifications().length).toBe(0);
          done();
        }
      });

      service.dismissAll();
    });

    it('should update notification', () => {
      const id = service.info('Original Title', 'Original message');
      
      service.updateNotification(id, {
        title: 'Updated Title',
        message: 'Updated message',
        type: 'success'
      });

      const notification = service.getNotification(id);
      expect(notification?.title).toBe('Updated Title');
      expect(notification?.message).toBe('Updated message');
      expect(notification?.type).toBe('success');
    });

    it('should handle update of non-existent notification', () => {
      expect(() => {
        service.updateNotification('non-existent', { title: 'New Title' });
      }).not.toThrow();
    });
  });

  describe('Auto-dismiss', () => {
    it('should auto-dismiss notification after duration', (done) => {
      const id = service.info('Test', 'Message', 100); // 100ms duration
      
      expect(service.getNotifications().length).toBe(1);

      setTimeout(() => {
        expect(service.getNotifications().length).toBe(0);
        done();
      }, 150);
    });

    it('should not auto-dismiss error notifications', (done) => {
      service.error('Error', 'Message');
      
      expect(service.getNotifications().length).toBe(1);

      setTimeout(() => {
        expect(service.getNotifications().length).toBe(1); // Still there
        done();
      }, 100);
    });
  });

  describe('Error Notifications', () => {
    it('should show notification for browser error', () => {
      const error: EditorError = {
        type: 'browser',
        message: 'Browser not supported',
        code: 'BROWSER_001'
      };

      const id = service.showErrorNotification(error);
      const notification = service.getNotification(id);

      expect(notification?.type).toBe('error');
      expect(notification?.title).toBe('Browser Compatibility Issue');
      expect(notification?.message).toContain('Browser not supported');
      expect(notification?.message).toContain('Please try using a modern browser');
    });

    it('should show notification for upload error', () => {
      const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const error: EditorError = {
        type: 'upload',
        message: 'File too large',
        details: { file: mockFile }
      };

      const id = service.showErrorNotification(error);
      const notification = service.getNotification(id);

      expect(notification?.type).toBe('error');
      expect(notification?.title).toBe('File Upload Error');
      expect(notification?.message).toContain('File too large');
      expect(notification?.message).toContain('Please check the file size');
    });

    it('should show notification for network error', () => {
      const error: EditorError = {
        type: 'network',
        message: 'Connection failed'
      };

      const id = service.showErrorNotification(error);
      const notification = service.getNotification(id);

      expect(notification?.type).toBe('error');
      expect(notification?.title).toBe('Network Error');
      expect(notification?.message).toContain('Connection failed');
      expect(notification?.message).toContain('Please check your internet connection');
    });

    it('should show notification for validation error', () => {
      const error: EditorError = {
        type: 'validation',
        message: 'Invalid input format'
      };

      const id = service.showErrorNotification(error);
      const notification = service.getNotification(id);

      expect(notification?.type).toBe('error');
      expect(notification?.title).toBe('Input Validation Error');
      expect(notification?.message).toBe('Invalid input format');
    });

    it('should include error details when configured', () => {
      service.configure({ showErrorDetails: true });

      const error: EditorError = {
        type: 'command',
        message: 'Command failed',
        details: { command: 'bold', value: true }
      };

      const id = service.showErrorNotification(error);
      const notification = service.getNotification(id);

      expect(notification?.message).toContain('Command failed');
      expect(notification?.message).toContain('Details:');
      expect(notification?.message).toContain('bold');
    });
  });

  describe('Recovery Notifications', () => {
    it('should show recovery notification with actions', () => {
      const error: EditorError = {
        type: 'upload',
        message: 'Upload failed'
      };

      const recoveryActions: NotificationAction[] = [
        { label: 'Retry', action: jasmine.createSpy('retry'), primary: true },
        { label: 'Cancel', action: jasmine.createSpy('cancel') }
      ];

      const id = service.showRecoveryNotification(error, recoveryActions);
      const notification = service.getNotification(id);

      expect(notification?.type).toBe('warning');
      expect(notification?.title).toBe('Action Required');
      expect(notification?.message).toContain('Upload failed');
      expect(notification?.message).toContain('Please choose a recovery option');
      expect(notification?.actions).toBe(recoveryActions);
      expect(notification?.dismissible).toBe(false);
      expect(notification?.duration).toBeUndefined();
    });
  });

  describe('Error Actions', () => {
    it('should provide browser compatibility help action', () => {
      const error: EditorError = {
        type: 'browser',
        message: 'Browser not supported'
      };

      const id = service.showErrorNotification(error);
      const notification = service.getNotification(id);

      expect(notification?.actions).toBeDefined();
      expect(notification?.actions?.length).toBeGreaterThan(0);
      
      const learnMoreAction = notification?.actions?.find(a => a.label === 'Learn More');
      expect(learnMoreAction).toBeDefined();
    });

    it('should provide retry action for upload errors', () => {
      const error: EditorError = {
        type: 'upload',
        message: 'Upload failed'
      };

      const id = service.showErrorNotification(error);
      const notification = service.getNotification(id);

      const retryAction = notification?.actions?.find(a => a.label === 'Try Again');
      expect(retryAction).toBeDefined();
      expect(retryAction?.primary).toBe(true);
    });

    it('should provide retry action for network errors', () => {
      const error: EditorError = {
        type: 'network',
        message: 'Network failed'
      };

      const id = service.showErrorNotification(error);
      const notification = service.getNotification(id);

      const retryAction = notification?.actions?.find(a => a.label === 'Retry');
      expect(retryAction).toBeDefined();
      expect(retryAction?.primary).toBe(true);
    });

    it('should provide undo action for command errors', () => {
      const error: EditorError = {
        type: 'command',
        message: 'Command failed'
      };

      const id = service.showErrorNotification(error);
      const notification = service.getNotification(id);

      const undoAction = notification?.actions?.find(a => a.label === 'Undo');
      expect(undoAction).toBeDefined();
    });

    it('should always provide dismiss action', () => {
      const error: EditorError = {
        type: 'validation',
        message: 'Validation failed'
      };

      const id = service.showErrorNotification(error);
      const notification = service.getNotification(id);

      const dismissAction = notification?.actions?.find(a => a.label === 'Dismiss');
      expect(dismissAction).toBeDefined();
    });
  });

  describe('Observables', () => {
    it('should emit notifications through observable', (done) => {
      service.notifications$.subscribe(notifications => {
        if (notifications.length > 0) {
          expect(notifications[0].title).toBe('Test');
          done();
        }
      });

      service.info('Test', 'Message');
    });

    it('should emit dismiss events', (done) => {
      const id = service.info('Test', 'Message');

      service.dismiss$.subscribe(dismissedId => {
        expect(dismissedId).toBe(id);
        done();
      });

      service.dismiss(id);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty title and message', () => {
      const id = service.info('', '');
      const notification = service.getNotification(id);

      expect(notification?.title).toBe('');
      expect(notification?.message).toBe('');
    });

    it('should handle unknown error type', () => {
      const error: EditorError = {
        type: 'unknown' as any,
        message: 'Unknown error'
      };

      const id = service.showErrorNotification(error);
      const notification = service.getNotification(id);

      expect(notification?.title).toBe('Editor Error');
      expect(notification?.message).toBe('Unknown error');
    });

    it('should handle notification with zero duration', () => {
      const id = service.info('Test', 'Message', 0);
      const notification = service.getNotification(id);

      expect(notification?.duration).toBe(0);
      // Should not auto-dismiss with 0 duration
    });

    it('should handle dismiss of non-existent notification', () => {
      expect(() => {
        service.dismiss('non-existent-id');
      }).not.toThrow();
    });
  });

  describe('Memory Management', () => {
    it('should clean up on destroy', () => {
      service.info('Test 1', 'Message 1');
      service.warning('Test 2', 'Message 2');

      expect(service.getNotifications().length).toBe(2);

      service.destroy();

      expect(service.getNotifications().length).toBe(0);
    });
  });
});