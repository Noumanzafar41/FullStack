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
  private readonly formBuilder = inject(FormBuilder);
  private readonly parameterService = inject(ParameterService);

  protected records: ParameterRecord[] = [];
  protected isLoading = false;
  protected loadError = '';
  protected isSaving = false;
  protected saveError = '';
  protected showDialog = false;

  protected readonly form = this.formBuilder.group({
    parameterType: ['Functional', Validators.required],
    parameterName: ['', Validators.required],
    processProduct: ['', Validators.required],
    specCharacteristic: ['', Validators.required],
    parameterCode: ['', Validators.required]
  });

  ngOnInit(): void {
    this.fetchParameters();
  }

  protected openDialog(): void {
    this.showDialog = true;
    this.saveError = '';
    this.form.reset({
      parameterType: 'Functional',
      parameterName: '',
      processProduct: '',
      specCharacteristic: '',
      parameterCode: ''
    });
  }

  protected closeDialog(): void {
    this.showDialog = false;
    this.saveError = '';
    this.form.reset({
      parameterType: 'Functional',
      parameterName: '',
      processProduct: '',
      specCharacteristic: '',
      parameterCode: ''
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.saveError = '';

    this.parameterService.createParameter(this.form.value as CreateParameterPayload).subscribe({
      next: (record) => {
        this.records = [record, ...this.records];
        this.isSaving = false;
        this.closeDialog();
        // Refresh the list to ensure we have the latest data
        this.fetchParameters();
      },
      error: (error) => {
        this.saveError = error?.error?.message || 'Failed to save parameter.';
        this.isSaving = false;
      }
    });
  }

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
}

