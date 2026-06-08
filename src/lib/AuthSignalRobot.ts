import { supabase } from './supabase';

export type AuthSignalEvent = 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED' | 'PASSWORD_RECOVERY' | 'SESSION_EXPIRED' | 'AUTH_ERROR';

export interface AuthSignal {
  type: AuthSignalEvent;
  timestamp: number;
  userId?: string;
  source: 'tab' | 'system' | 'user';
  data?: any;
}

class AuthSignalRobot {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(signal: AuthSignal) => void> = new Set();
  private authSubscription: any;
  public status: 'green' | 'yellow' | 'red' = 'green';
  private sessionCheckInterval: any;

  constructor() {
    // Check if BroadcastChannel is supported and not in an iframe (some environments don't support it)
    const canUseBroadcastChannel = typeof BroadcastChannel !== 'undefined' && window.location !== window.parent.location;

    if (canUseBroadcastChannel) {
      try {
        this.channel = new BroadcastChannel('shipnow_auth_signals');
        this.setupBroadcastListener();
      } catch (error) {
        console.warn('BroadcastChannel not available, cross-tab sync disabled:', error);
        this.channel = null;
      }
    }

    this.setupSupabaseListener();
    this.startSessionMonitor();
  }

  private setupBroadcastListener() {
    this.channel.onmessage = (event: MessageEvent<AuthSignal>) => {
      // Sync cross-tab events
      this.notifyListeners(event.data);
    };
  }

  private setupSupabaseListener() {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      let signalType: AuthSignalEvent | null = null;
      let status: 'green' | 'yellow' | 'red' = 'green';

      switch (event) {
        case 'SIGNED_IN':
          signalType = 'SIGNED_IN';
          break;
        case 'SIGNED_OUT':
          signalType = 'SIGNED_OUT';
          break;
        case 'TOKEN_REFRESHED':
          signalType = 'TOKEN_REFRESHED';
          break;
        case 'USER_UPDATED':
          signalType = 'USER_UPDATED';
          break;
        case 'PASSWORD_RECOVERY':
          signalType = 'PASSWORD_RECOVERY';
          break;
        default:
          break;
      }

      if (signalType) {
        const signal: AuthSignal = {
          type: signalType,
          timestamp: Date.now(),
          userId: session?.user?.id,
          source: 'system',
          data: { event }
        };

        // Log signal to database
        this.status = signalType === 'AUTH_ERROR' ? 'red' : 'green';
        this.emit(signal);
        await this.logSignalToDatabase(signal);
      }
    });

    this.authSubscription = subscription;
  }

  private startSessionMonitor() {
    // Check session every minute
    this.sessionCheckInterval = setInterval(async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session) {
          const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
          const timeUntilExpiry = expiresAt - Date.now();

          // Refresh token if it expires in less than 5 minutes
          if (timeUntilExpiry > 0 && timeUntilExpiry < 5 * 60 * 1000) {
            this.status = 'yellow';
            const { error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) {
              this.status = 'red';
              this.emit({ type: 'AUTH_ERROR', timestamp: Date.now(), source: 'system', data: refreshError });
            } else {
              this.status = 'green';
            }
          } else if (timeUntilExpiry <= 0) {
            this.status = 'yellow';
            this.emit({ type: 'SESSION_EXPIRED', timestamp: Date.now(), source: 'system' });
          }
        }
      } catch (err) {
        this.status = 'red';
        this.emit({ type: 'AUTH_ERROR', timestamp: Date.now(), source: 'system', data: err });
      }
    }, 60 * 1000);
  }

  public emit(signal: AuthSignal) {
    if (this.channel) {
      this.channel.postMessage(signal);
    }
    this.notifyListeners(signal);
  }

  private notifyListeners(signal: AuthSignal) {
    this.listeners.forEach(listener => listener(signal));
  }

  public subscribe(listener: (signal: AuthSignal) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private async logSignalToDatabase(signal: AuthSignal) {
    try {
      await supabase.from('auth_signals').insert({
        event_type: signal.type,
        user_id: signal.userId,
        signal_data: signal.data || {},
        source: signal.source
      });
    } catch (e) {
      console.error('Failed to log auth signal:', e);
    }
  }

  public cleanup() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    clearInterval(this.sessionCheckInterval);
    if (this.channel) {
      this.channel.close();
    }
  }
}

// Export a singleton instance
export const authSignalRobot = new AuthSignalRobot();
