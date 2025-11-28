import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ParameterService, ParameterRecord, CreateParameterPayload } from '../../parameter.service';

@Component({
  selector: 'app-parameter-master-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './parameter-master.page.html',
  styleUrl: './parameter-master.page.css'
})
export class ParameterMasterPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly parameterService = inject(ParameterService);

  protected records: ParameterRecord[] = [];
  protected isLoading = false;
  protected loadError = '';
  protected isSaving = false;
  protected saveError = '';
  protected showDialog = false;

  protected readonly form = this.fb.group({
    parameterType: ['Functional', Validators.required],
    parameterName: ['', Validators.required],
    processProduct: ['', Validators.required],
    specCharacteristic: ['', Validators.required],
    parameterCode: ['', Validators.required]
  });

  ngOnInit(): void {
    this.fetchParameters();
  }

  /** Open the form dialog for creating a new parameter */
  protected openDialog(): void {
    this.showDialog = true;
    this.resetForm();
    this.saveError = '';
  }

  /** Close the form dialog */
  protected closeDialog(): void {
    this.showDialog = false;
    this.resetForm();
    this.saveError = '';
  }

  /** Submit the form to create a new parameter */
  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.saveError = '';

    const payload = this.form.value as CreateParameterPayload;

    this.parameterService.createParameter(payload).subscribe({
      next: (record) => {
        this.records = [record, ...this.records];
        this.isSaving = false;
        this.closeDialog();
        this.fetchParameters(); // Refresh to ensure latest data
      },
      error: (error) => {
        this.saveError = error?.error?.message ?? 'Failed to save parameter.';
        this.isSaving = false;
      }
    });
  }

  /** Fetch all parameter records */
  private fetchParameters(): void {
    this.isLoading = true;
    this.loadError = '';

    this.parameterService.listParameters().subscribe({
      next: (records) => {
        this.records = records;
        this.isLoading = false;
      },
      error: () => {
        this.loadError = 'Unable to load parameter records. Please try again.';
        this.isLoading = false;
      }
    });
  }

  /** Reset form to default values */
  private resetForm(): void {
    this.form.reset({
      parameterType: 'Functional',
      parameterName: '',
      processProduct: '',
      specCharacteristic: '',
      parameterCode: ''
    });
  }
}
