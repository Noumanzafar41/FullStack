import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ParameterService,
  IncomingMaterialInspectionPlanRecord,
  CreateIncomingMaterialInspectionPlanPayload,
  IncomingMaterialInspectionPlanDetail
} from '../../parameter.service';

@Component({
  selector: 'app-incoming-material-inspection-plan-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './incoming-material-inspection-plan.page.html',
  styleUrl: './incoming-material-inspection-plan.page.css'
})
export class IncomingMaterialInspectionPlanPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly qcService = inject(ParameterService);

  protected records: IncomingMaterialInspectionPlanRecord[] = [];
  protected isLoading = false;
  protected loadError = '';
  protected isSaving = false;
  protected saveError = '';
  protected showDialog = false;
  protected isReadOnly = false;

  protected readonly form: FormGroup = this.fb.group({
    itemId: ['', Validators.required],
    itemDescription: ['', Validators.required],
    docNumber: [''],
    docDate: [''],
    revisionNumber: [''],
    preparedBy: [''],
    remarks: [''],
    details: this.fb.array<FormGroup>([this.buildDetailGroup()])
  });

  get details(): FormArray<FormGroup> {
    return this.form.get('details') as FormArray<FormGroup>;
  }

  ngOnInit(): void {
    this.fetchRecords();
  }

  /** Detail Rows Management */
  protected addDetailRow(): void {
    this.details.push(this.buildDetailGroup());
  }

  protected removeDetailRow(index: number): void {
    if (this.details.length > 1) this.details.removeAt(index);
  }

  private buildDetailGroup(): FormGroup {
    return this.fb.group({
      parameterName: ['', Validators.required],
      specifications: ['', Validators.required],
      results: ['', Validators.required],
      inspectionMethod: ['', Validators.required],
      remarks: ['']
    });
  }

  private resetDetailRows(): void {
    this.details.clear();
    this.details.push(this.buildDetailGroup());
  }

  private populateDetailRows(details?: IncomingMaterialInspectionPlanDetail[]): void {
    this.details.clear();
    if (details?.length) {
      details.forEach((detail) => {
        const group = this.buildDetailGroup();
        group.patchValue({
          parameterName: detail.parameterName ?? '',
          specifications: detail.specifications ?? '',
          results: detail.results ?? '',
          inspectionMethod: detail.inspectionMethod ?? '',
          remarks: detail.remarks ?? ''
        });
        group.disable({ emitEvent: false });
        this.details.push(group);
      });
    } else {
      this.resetDetailRows();
    }
  }

  /** Dialog Management */
  protected openDialog(): void {
    this.isReadOnly = false;
    this.showDialog = true;
    this.saveError = '';
    this.form.enable({ emitEvent: false });
    this.form.reset(this.getBlankFormState());
    this.resetDetailRows();
  }

  protected closeDialog(): void {
    this.showDialog = false;
    this.isReadOnly = false;
    this.saveError = '';
    this.form.enable({ emitEvent: false });
    this.form.reset(this.getBlankFormState());
    this.resetDetailRows();
  }

  protected viewRecord(record: IncomingMaterialInspectionPlanRecord): void {
    this.isReadOnly = true;
    this.showDialog = true;
    this.saveError = '';
    this.form.enable({ emitEvent: false });
    this.form.patchValue({
      itemId: record.itemId ?? '',
      itemDescription: record.itemDescription ?? '',
      docNumber: record.docNumber ?? '',
      docDate: record.docDate ? record.docDate.split('T')[0] : '',
      revisionNumber: record.revisionNumber ?? '',
      preparedBy: record.preparedBy ?? '',
      remarks: record.remarks ?? ''
    });
    this.populateDetailRows(record.details);
    this.form.disable({ emitEvent: false });
  }

  /** Form Submission */
  protected submit(): void {
    if (this.form.invalid || this.isReadOnly) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.saveError = '';

    const payload = this.form.value as CreateIncomingMaterialInspectionPlanPayload;
    payload.details = (payload.details || []).map((detail) => ({
      ...detail
    })) as IncomingMaterialInspectionPlanDetail[];

    this.qcService.createIncomingMaterialInspectionPlan(payload).subscribe({
      next: (record) => {
        this.records = [record, ...this.records];
        this.isSaving = false;
        this.closeDialog();
        this.fetchRecords();
      },
      error: (error) => {
        this.saveError = error?.error?.message ?? 'Failed to save plan.';
        this.isSaving = false;
      }
    });
  }

  /** Fetch Records */
  private fetchRecords(): void {
    this.isLoading = true;
    this.loadError = '';
    this.qcService.listIncomingMaterialInspectionPlans().subscribe({
      next: (records) => {
        this.records = records;
        this.isLoading = false;
      },
      error: () => {
        this.loadError = 'Unable to load incoming material plans.';
        this.isLoading = false;
      }
    });
  }

  /** Utility */
  private getBlankFormState() {
    return {
      itemId: '',
      itemDescription: '',
      docNumber: '',
      docDate: '',
      revisionNumber: '',
      preparedBy: '',
      remarks: ''
    };
  }
}
