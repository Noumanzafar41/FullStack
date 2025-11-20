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
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected isSubmitting = false;
  protected statusMessage = '';
  protected statusType: 'success' | 'error' | 'info' = 'info';
  protected activePanel: Panel = 'login';

  protected readonly loginForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  protected readonly registerForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  protected readonly forgotForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]]
  });

  protected switchPanel(panel: Panel): void {
    this.activePanel = panel;
    this.statusMessage = '';
    this.statusType = 'info';
    this.isSubmitting = false;
  }

  protected submitLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.executeAuthRequest(
      this.authService.login(this.loginForm.value as { email: string; password: string }),
      'Authenticated. Redirecting to your workspace…',
      (response) => {
        if (response.token) {
          localStorage.setItem('sapbtp_token', response.token);
        }
        this.router.navigate(['/workspace']);
      }
    );
  }

  protected submitRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.executeAuthRequest(
      this.authService.register(this.registerForm.value as { name: string; email: string; password: string }),
      'Account created successfully. You can log in now.',
      () => {
        this.registerForm.reset();
        this.switchPanel('login');
      }
    );
  }

  protected submitForgot(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.executeAuthRequest(
      this.authService.forgotPassword(this.forgotForm.value as { email: string }),
      'If the email exists we just sent reset instructions.'
    );
  }

  private executeAuthRequest(
    observable$: Observable<AuthResponse>,
    successMessage: string,
    onSuccess?: (response: AuthResponse) => void
  ): void {
    this.isSubmitting = true;
    this.statusMessage = '';

    observable$.subscribe({
      next: (response) => {
        this.statusType = 'success';
        this.statusMessage = successMessage;
        this.isSubmitting = false;
        onSuccess?.(response);
      },
      error: (error) => {
        this.statusType = 'error';
        this.statusMessage = error?.error?.message || 'Something went wrong. Please try again.';
        this.isSubmitting = false;
      }
    });
  }
}

