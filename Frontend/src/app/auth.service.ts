import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * AuthResponse returned by backend
 */
export interface AuthResponse {
  message: string;
  token?: string;
  profile?: { name: string; email: string };
}

/**
 * Resolves the base API URL depending on environment:
 * - SAP BTP global variable
 * - Angular environment variable
 * - Localhost for development
 * - BAS workspace dynamic URL
 */
const resolveBaseUrl = (): string => {
  const globalConfig = typeof window !== 'undefined' ? (window as any).__SAPBTP_API_URL : undefined;
  const envConfig = (import.meta as any)?.env?.NG_APP_API_URL as string | undefined;
  const configured = globalConfig || envConfig;

  if (configured) {
    return configured.replace(/\/$/, ''); // Remove trailing slash
  }

  if (typeof window !== 'undefined' && window.location) {
    const { protocol, hostname, port, host, origin } = window.location;

    // Local development
    if (hostname === 'localhost' && port && port !== '3100') {
      return `${protocol}//${hostname}:3100/api/auth`;
    }

    // SAP BAS workspace URL
    if (host.startsWith('port') && host.includes('applicationstudio.cloud.sap')) {
      const basHost = host.replace(/^port\d+/, 'port3100');
      return `${protocol}//${basHost}/api/auth`;
    }

    // Default origin
    if (origin) {
      return `${origin}/api/auth`;
    }
  }

  // Fallback
  return '/api/auth';
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = resolveBaseUrl();

  constructor(private readonly http: HttpClient) {}

  /**
   * Login user
   */
  login(payload: { email: string; password: string }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/login`, payload)
      .pipe(catchError(this.handleError));
  }

  /**
   * Register new user
   */
  register(payload: { name: string; email: string; password: string }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/register`, payload)
      .pipe(catchError(this.handleError));
  }

  /**
   * Forgot password
   */
  forgotPassword(payload: { email: string }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/forgot-password`, payload)
      .pipe(catchError(this.handleError));
  }

  /**
   * Centralized error handler
   */
  private handleError(error: any) {
    console.error('AuthService Error:', error);
    return throwError(() => error);
  }
}
