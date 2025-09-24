import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

/**
 * Service for debouncing events and operations
 */
@Injectable({
  providedIn: 'root'
})
export class DebounceService {
  private contentChangeSubject = new Subject<string>();
  private selectionChangeSubject = new Subject<any>();

  /**
   * Debounced content change observable
   */
  get debouncedContentChange$(): Observable<string> {
    return this.contentChangeSubject.pipe(
      debounceTime(300), // 300ms debounce
      distinctUntilChanged()
    );
  }

  /**
   * Debounced selection change observable
   */
  get debouncedSelectionChange$(): Observable<any> {
    return this.selectionChangeSubject.pipe(
      debounceTime(100), // 100ms debounce for selection (faster response)
      distinctUntilChanged((prev, curr) => {
        // Custom comparison for selection state
        return JSON.stringify(prev) === JSON.stringify(curr);
      })
    );
  }

  /**
   * Emit content change event
   */
  emitContentChange(content: string): void {
    this.contentChangeSubject.next(content);
  }

  /**
   * Emit selection change event
   */
  emitSelectionChange(selection: any): void {
    this.selectionChangeSubject.next(selection);
  }

  /**
   * Create a debounced function
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  /**
   * Create a throttled function
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;
    
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func.apply(this, args);
      }
    };
  }

  /**
   * Destroy the service and clean up
   */
  destroy(): void {
    this.contentChangeSubject.complete();
    this.selectionChangeSubject.complete();
  }
}