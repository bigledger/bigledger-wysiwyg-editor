import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { EditorError } from '../models/error.interface';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
  dismissible?: boolean;
  actions?: NotificationAction[];
  timestamp: Date;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  primary?: boolean;
}

export interface NotificationConfig {
  defaultDuration: number;
  maxNotifications: number;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  showErrorDetails: boolean;
  autoCloseOnSuccess: boolean;
}

/**
 * Service for managing user notifications and error reporting
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly defaultConfig: NotificationConfig = {
    defaultDuration: 5000,
    maxNotifications: 5,
    position: 'top-right',
    showErrorDetails: false,
    autoCloseOnSuccess: true
  };

  private config: NotificationConfig;
  private notifications: Notification[] = [];
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private dismissSubject = new Subject<string>();

  public notifications$ = this.notificationsSubject.asObservable();
  public dismiss$ = this.dismissSubject.asObservable();

  constructor() {
    this.config = { ...this.defaultConfig };
  }

  /**
   * Configure the notification service
   */
  configure(config: Partial<NotificationConfig>): void {
    this.config = { ...this.defaultConfig, ...config };
  }

  /**
   * Show an info notification
   */
  info(title: string, message: string, duration?: number): string {
    return this.addNotification({
      type: 'info',
      title,
      message,
      duration: duration ?? this.config.defaultDuration,
      dismissible: true
    });
  }

  /**
   * Show a success notification
   */
  success(title: string, message: string, duration?: number): string {
    return this.addNotification({
      type: 'success',
      title,
      message,
      duration: duration ?? (this.config.autoCloseOnSuccess ? this.config.defaultDuration : undefined),
      dismissible: true
    });
  }

  /**
   * Show a warning notification
   */
  warning(title: string, message: string, duration?: number): string {
    return this.addNotification({
      type: 'warning',
      title,
      message,
      duration: duration ?? this.config.defaultDuration * 1.5, // Longer for warnings
      dismissible: true
    });
  }

  /**
   * Show an error notification
   */
  error(title: string, message: string, actions?: NotificationAction[]): string {
    return this.addNotification({
      type: 'error',
      title,
      message,
      duration: undefined, // Errors don't auto-dismiss
      dismissible: true,
      actions
    });
  }

  /**
   * Show notification for editor error
   */
  showErrorNotification(error: EditorError): string {
    const title = this.getErrorTitle(error.type);
    const message = this.getErrorMessage(error);
    const actions = this.getErrorActions(error);

    return this.addNotification({
      type: 'error',
      title,
      message,
      duration: undefined,
      dismissible: true,
      actions
    });
  }

  /**
   * Show recovery notification with actions
   */
  showRecoveryNotification(error: EditorError, recoveryActions: NotificationAction[]): string {
    return this.addNotification({
      type: 'warning',
      title: 'Action Required',
      message: `${error.message}. Please choose a recovery option.`,
      duration: undefined,
      dismissible: false,
      actions: recoveryActions
    });
  }

  /**
   * Dismiss a notification by ID
   */
  dismiss(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notificationsSubject.next([...this.notifications]);
    this.dismissSubject.next(id);
  }

  /**
   * Dismiss all notifications
   */
  dismissAll(): void {
    const ids = this.notifications.map(n => n.id);
    this.notifications = [];
    this.notificationsSubject.next([]);
    ids.forEach(id => this.dismissSubject.next(id));
  }

  /**
   * Get current notifications
   */
  getNotifications(): Notification[] {
    return [...this.notifications];
  }

  /**
   * Get notification by ID
   */
  getNotification(id: string): Notification | undefined {
    return this.notifications.find(n => n.id === id);
  }

  /**
   * Update notification
   */
  updateNotification(id: string, updates: Partial<Notification>): void {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      this.notifications[index] = { ...this.notifications[index], ...updates };
      this.notificationsSubject.next([...this.notifications]);
    }
  }

  /**
   * Add a notification
   */
  private addNotification(notification: Omit<Notification, 'id' | 'timestamp'>): string {
    const id = this.generateId();
    const fullNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date()
    };

    // Add to beginning of array (newest first)
    this.notifications.unshift(fullNotification);

    // Enforce max notifications limit
    if (this.notifications.length > this.config.maxNotifications) {
      const removed = this.notifications.splice(this.config.maxNotifications);
      removed.forEach(n => this.dismissSubject.next(n.id));
    }

    this.notificationsSubject.next([...this.notifications]);

    // Auto-dismiss if duration is set
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, notification.duration);
    }

    return id;
  }

  /**
   * Generate unique notification ID
   */
  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get user-friendly error title
   */
  private getErrorTitle(errorType: string): string {
    const titles: { [key: string]: string } = {
      'browser': 'Browser Compatibility Issue',
      'validation': 'Input Validation Error',
      'command': 'Editor Command Failed',
      'upload': 'File Upload Error',
      'sanitization': 'Content Security Warning',
      'selection': 'Text Selection Error',
      'configuration': 'Configuration Error',
      'network': 'Network Error',
      'permission': 'Permission Denied'
    };

    return titles[errorType] || 'Editor Error';
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: EditorError): string {
    let message = error.message;

    // Add helpful context based on error type
    switch (error.type) {
      case 'browser':
        message += ' Please try using a modern browser or enable JavaScript.';
        break;
      case 'upload':
        message += ' Please check the file size and format, then try again.';
        break;
      case 'network':
        message += ' Please check your internet connection and try again.';
        break;
      case 'permission':
        message += ' Please grant the required permissions and try again.';
        break;
    }

    // Add details if configured to show them
    if (this.config.showErrorDetails && error.details) {
      message += `\n\nDetails: ${JSON.stringify(error.details)}`;
    }

    return message;
  }

  /**
   * Get error-specific actions
   */
  private getErrorActions(error: EditorError): NotificationAction[] {
    const actions: NotificationAction[] = [];

    switch (error.type) {
      case 'browser':
        actions.push({
          label: 'Learn More',
          action: () => this.showBrowserCompatibilityHelp()
        });
        break;
      
      case 'upload':
        actions.push({
          label: 'Try Again',
          action: () => this.retryLastAction(),
          primary: true
        });
        break;
      
      case 'network':
        actions.push({
          label: 'Retry',
          action: () => this.retryLastAction(),
          primary: true
        });
        break;
      
      case 'command':
        actions.push({
          label: 'Undo',
          action: () => this.undoLastCommand()
        });
        break;
    }

    // Always add dismiss action
    actions.push({
      label: 'Dismiss',
      action: () => {} // Will be handled by the notification component
    });

    return actions;
  }

  /**
   * Show browser compatibility help
   */
  private showBrowserCompatibilityHelp(): void {
    this.info(
      'Browser Compatibility',
      'This editor works best with modern browsers like Chrome, Firefox, Safari, or Edge. Please update your browser for the best experience.'
    );
  }

  /**
   * Retry last action (placeholder)
   */
  private retryLastAction(): void {
    // This would be implemented to retry the last failed action
    // For now, just show a message
    this.info('Retry', 'Retrying last action...');
  }

  /**
   * Undo last command (placeholder)
   */
  private undoLastCommand(): void {
    // This would be implemented to undo the last command
    // For now, just show a message
    this.info('Undo', 'Undoing last command...');
  }

  /**
   * Destroy the service and clean up
   */
  destroy(): void {
    this.notifications = [];
    this.notificationsSubject.complete();
    this.dismissSubject.complete();
  }
}