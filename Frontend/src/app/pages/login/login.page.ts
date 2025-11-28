import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthResponse, AuthService } from '../../auth.service';

type Panel = 'login' | 'register' | 'forgot';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.page.html',
  styleUrl: './login.page.css'
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected activePanel: Panel = 'login';
  protected isSubmitting = false;
  protected statusMessage = '';
  protected statusType: 'success' | 'error' | 'info' = 'info';

  protected readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  protected readonly registerForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  protected readonly forgotForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  /** Switch between login, register, and forgot password panels */
  protected switchPanel(panel: Panel): void {
    this.activePanel = panel;
    this.resetStatus();
  }

  /** Submit login form */
  protected submitLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const payload = this.loginForm.value as { email: string; password: string };
    this.executeAuthRequest(
      this.authService.login(payload),
      'Authenticated. Redirecting to your workspace…',
      (response) => {
        if (response.token) localStorage.setItem('sapbtp_token', response.token);
        this.router.navigate(['/workspace']);
      }
    );
  }

  /** Submit registration form */
  protected submitRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const payload = this.registerForm.value as { name: string; email: string; password: string };
    this.executeAuthRequest(
      this.authService.register(payload),
      'Account created successfully. You can log in now.',
      () => {
        this.registerForm.reset();
        this.switchPanel('login');
      }
    );
  }

  /** Submit forgot password form */
  protected submitForgot(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    const payload = this.forgotForm.value as { email: string };
    this.executeAuthRequest(
      this.authService.forgotPassword(payload),
      'If the email exists, reset instructions have been sent.'
    );
  }

  /** Centralized handler for auth requests */
  private executeAuthRequest(
    observable$: Observable<AuthResponse>,
    successMessage: string,
    onSuccess?: (response: AuthResponse) => void
  ): void {
    this.isSubmitting = true;
    this.resetStatus();

    observable$.subscribe({
      next: (response) => {
        this.statusType = 'success';
        this.statusMessage = successMessage;
        this.isSubmitting = false;
        onSuccess?.(response);
      },
      error: (error) => {
        this.statusType = 'error';
        this.statusMessage = error?.error?.message ?? 'Something went wrong. Please try again.';
        this.isSubmitting = false;
      }
    });
  }

  /** Reset status message and type */
  private resetStatus(): void {
    this.statusMessage = '';
    this.statusType = 'info';
    this.isSubmitting = false;
  }
}
