import { supabase } from './supabase';

export type BugCategory = 'Network' | 'UI' | 'Auth' | 'Performance' | 'Storage' | 'Unknown';

export interface BugReport {
  error_type: string;
  error_message: string;
  stack_trace?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: BugCategory;
  recovery_suggestion?: string;
  page_url: string;
  user_id?: string;
  session_id?: string;
  browser_info: string;
  auto_fix_attempted: boolean;
  auto_fix_success: boolean;
  fixed_at?: number;
}

export type BugFixerStatus = 'green' | 'yellow' | 'red';

class BugFixerRobot {
  private listeners: Set<(report: BugReport, status: BugFixerStatus) => void> = new Set();
  public status: BugFixerStatus = 'green';
  public recentBugs: BugReport[] = [];
  public metrics = {
    renders: 0,
    networkFailures: 0,
    handledErrors: 0,
    slowOperations: 0,
    autoFixed: 0,
  };
  private sessionId = Math.random().toString(36).substring(2, 15);

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupGlobalListeners();
      this.setupNetworkInterceptor();
      this.setupPerformanceMonitoring();
    }
  }

  private setupGlobalListeners() {
    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message), 'Unhandled Error');
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, 'Unhandled Promise Rejection');
    });
  }

  private setupNetworkInterceptor() {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;

        if (duration > 3000) {
          this.metrics.slowOperations++;
          this.handleError(
            new Error(`Slow network request to ${args[0]} took ${Math.round(duration)}ms`),
            'Performance Warning',
            undefined,
            'Performance'
          );
        }

        if (!response.ok && response.status >= 500) {
          this.metrics.networkFailures++;
          this.handleNetworkError(new Error(`HTTP ${response.status}: ${response.statusText}`), args[0] as string);
        } else if (response.status === 401 || response.status === 403) {
          this.handleError(new Error(`Auth failed: ${response.status}`), 'Auth Error', undefined, 'Auth');
        }
        return response;
      } catch (error: any) {
        this.metrics.networkFailures++;
        this.handleNetworkError(error, args[0] as string);
        throw error;
      }
    };
  }

  private setupPerformanceMonitoring() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 1000) { // Task taking more than 1s
              this.metrics.slowOperations++;
              this.handleError(
                new Error(`Slow operation detected: ${entry.name} took ${Math.round(entry.duration)}ms`),
                'Performance Warning',
                undefined,
                'Performance',
                'low'
              );
            }
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        console.warn('Performance monitoring not fully supported');
      }
    }
  }

  public reportReactError(error: Error, componentStack: string) {
    this.handleError(error, 'React Component Error', componentStack, 'UI');
  }

  private categorizeError(errMsg: string, overrideCategory?: BugCategory): { category: BugCategory, severity: BugReport['severity'], suggestion: string } {
    if (overrideCategory) {
      return { category: overrideCategory, severity: overrideCategory === 'Performance' ? 'low' : 'medium', suggestion: 'Monitor system stability' };
    }

    if (errMsg.includes('network') || errMsg.includes('fetch') || errMsg.includes('http')) {
      return { category: 'Network', severity: 'medium', suggestion: 'Check internet connection and server status' };
    } else if (errMsg.includes('quota') || errMsg.includes('storage')) {
      return { category: 'Storage', severity: 'medium', suggestion: 'Clear browser cache/storage' };
    } else if (errMsg.includes('token') || errMsg.includes('auth') || errMsg.includes('401')) {
      return { category: 'Auth', severity: 'high', suggestion: 'Force token refresh or re-login' };
    } else if (errMsg.includes('chunk') || errMsg.includes('loading module') || errMsg.includes('unexpected token')) {
      return { category: 'UI', severity: 'critical', suggestion: 'Hard reload the application' };
    }

    return { category: 'Unknown', severity: 'high', suggestion: 'Review stack trace for details' };
  }

  private async handleError(error: Error, type: string, stack?: string, categoryOverride?: BugCategory, severityOverride?: BugReport['severity']) {
    this.metrics.handledErrors++;

    const errMsg = (error?.message || String(error)).toLowerCase();
    const { category, severity: defaultSeverity, suggestion } = this.categorizeError(errMsg, categoryOverride);
    let severity = severityOverride || defaultSeverity;

    // Auto-fix heuristics (Self-healing)
    let autoFixAttempted = false;
    let autoFixSuccess = false;

    if (category === 'UI' && severity === 'critical') {
      // Common vite dynamic import issue - auto fix is page reload
      autoFixAttempted = true;
      autoFixSuccess = true;
      import('react-hot-toast').then(({ toast }) => {
        toast.success('Auto-fixing UI issue... Reloading page', { duration: 1500 });
      });
      setTimeout(() => window.location.reload(), 1000);
    } else if (category === 'Storage') {
      autoFixAttempted = true;
      try {
        localStorage.clear();
        sessionStorage.clear();
        autoFixSuccess = true;
        import('react-hot-toast').then(({ toast }) => {
          toast.success('Storage cleared to fix quota issue', { duration: 1500 });
        });
      } catch (e) {
        autoFixSuccess = false;
      }
    } else if (category === 'Auth') {
      autoFixAttempted = true;
      try {
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError) {
          autoFixSuccess = true;
        }
      } catch (e) {
        autoFixSuccess = false;
      }
    }

    if (autoFixSuccess) {
      this.metrics.autoFixed++;
    }

    const report: BugReport = {
      error_type: type,
      error_message: error.message || String(error),
      stack_trace: stack || error.stack || 'No stack trace available',
      severity,
      category,
      recovery_suggestion: suggestion,
      page_url: window.location.href,
      session_id: this.sessionId,
      browser_info: navigator.userAgent,
      auto_fix_attempted: autoFixAttempted,
      auto_fix_success: autoFixSuccess,
      fixed_at: autoFixSuccess ? Date.now() : undefined,
    };

    this.recentBugs.unshift(report);
    if (this.recentBugs.length > 50) this.recentBugs.pop();

    this.updateStatus();
    this.notifyListeners(report);
    await this.logToDatabase(report);
  }

  private async handleNetworkError(error: Error, url: string) {
    // Basic retry mechanism for network errors can be implemented here
    this.handleError(error, `Network Error: ${url}`, undefined, 'Network');
  }

  private updateStatus() {
    if (this.recentBugs.some(b => b.severity === 'critical' || (b.severity === 'high' && !b.auto_fix_success))) {
      this.status = 'red';
    } else if (this.recentBugs.some(b => !b.auto_fix_success && b.severity === 'medium')) {
      this.status = 'yellow';
    } else {
      this.status = 'green';
    }
  }

  public subscribe(listener: (report: BugReport, status: BugFixerStatus) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(report: BugReport) {
    this.listeners.forEach(l => l(report, this.status));
  }

  private async logToDatabase(report: BugReport) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.from('bug_reports').insert({
        ...report,
        user_id: session?.user?.id,
        fixed_at: report.fixed_at ? new Date(report.fixed_at).toISOString() : null,
      });
    } catch (e) {
      console.error('Failed to log bug report:', e);
    }
  }

  public recordRender() {
    this.metrics.renders++;
  }
}

export const bugFixerRobot = new BugFixerRobot();
