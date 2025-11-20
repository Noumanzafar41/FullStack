import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AuthResponse {
  message: string;
  token?: string;
  profile?: { name: string; email: string };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = 'http://localhost:3000/api/auth';

  constructor(private readonly http: HttpClient) {}

  login(payload: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, payload);
  }

  register(payload: { name: string; email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, payload);
  }

  forgotPassword(payload: { email: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/forgot-password`, payload);
  }
}

