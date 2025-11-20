import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ParameterService,
  IncomingMaterialInspectionRecord,
  CreateIncomingMaterialInspectionPayload,
  IncomingInspectionDetail
} from '../../parameter.service';

@Component({
  selector: 'app-incoming-material-inspection-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './incoming-material-inspection.page.html',
  styleUrl: './incoming-material-inspection.page.css'
})
export class IncomingMaterialInspectionPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly qcService = inject(ParameterService);

  protected records: IncomingMaterialInspectionRecord[] = [];
  protected isLoading = false;
  protected loadError = '';
  protected isSaving = false;
  protected saveError = '';
  protected showDialog = false;
  protected isReadOnly = false;

  protected readonly form = this.fb.group({
    inwardType: [''],
    grnType: [''],
    supplierVendor: [''],
    reworkLocation: [false],
    inspectionRequired: [false],
    testCertificate: [false],
    corrActionRequired: [false],
    remarks: [''],
    details: this.fb.array<FormGroup>([this.buildDetailGroup()])
  });

  get details(): FormArray<FormGroup> {
    return this.form.get('details') as FormArray<FormGroup>;
  }

  ngOnInit(): void {
    this.fetchRecords();
  }

  protected addDetailRow(): void {
    this.details.push(this.buildDetailGroup());
  }

  protected removeDetailRow(index: number): void {
    if (this.details.length > 1) {
      this.details.removeAt(index);
    }
  }

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

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.saveError = '';

    const payload = this.form.value as CreateIncomingMaterialInspectionPayload;
    payload.details = payload.details?.map((detail) => ({
      ...detail,
      inspectionQty: Number(detail.inspectionQty) || 0,
      acceptedQty: Number(detail.acceptedQty) || 0,
      acceptedWithDeviation: Number(detail.acceptedWithDeviation) || 0,
      rejectedQty: Number(detail.rejectedQty) || 0,
      reworkQty: Number(detail.reworkQty) || 0
    })) as IncomingInspectionDetail[];

    this.qcService.createIncomingMaterialInspection(payload).subscribe({
      next: (record) => {
        this.records = [record, ...this.records];
        this.isSaving = false;
        this.closeDialog();
        // Refresh the list to ensure we have the latest data
        this.fetchRecords();
      },
      error: (error) => {
        this.saveError = error?.error?.message || 'Failed to save inspection.';
        this.isSaving = false;
      }
    });
  }

  private buildDetailGroup(): FormGroup {
    return this.fb.group({
      itemId: ['', Validators.required],
      itemDescription: ['', Validators.required],
      unit: ['', Validators.required],
      inspectionQty: [0, Validators.required],
      acceptedQty: [0],
      qcNumber: [''],
      acceptedWithDeviation: [0],
      rejectedQty: [0],
      reworkQty: [0],
      receivingLocation: [''],
      acceptedLocation: [''],
      status: ['', Validators.required],
      reason: ['']
    });
  }

  protected viewRecord(record: IncomingMaterialInspectionRecord): void {
    this.isReadOnly = true;
    this.showDialog = true;
    this.saveError = '';
    this.form.enable({ emitEvent: false });
    this.form.patchValue({
      inwardType: record.inwardType || '',
      grnType: record.grnType || '',
      supplierVendor: record.supplierVendor || '',
      reworkLocation: Boolean(record.reworkLocation),
      inspectionRequired: Boolean(record.inspectionRequired),
      testCertificate: Boolean(record.testCertificate),
      corrActionRequired: Boolean(record.corrActionRequired),
      remarks: record.remarks || ''
    });
    this.populateDetailRows(record.details);
    this.form.disable({ emitEvent: false });
  }

  private resetDetailRows(): void {
    this.details.clear();
    this.details.push(this.buildDetailGroup());
  }

  private populateDetailRows(details?: IncomingInspectionDetail[]): void {
    this.details.clear();
    if (details?.length) {
      details.forEach((detail) => {
        const group = this.buildDetailGroup();
        group.patchValue({
          itemId: detail.itemId || '',
          itemDescription: detail.itemDescription || '',
          unit: detail.unit || '',
          inspectionQty: Number(detail.inspectionQty) || 0,
          acceptedQty: Number(detail.acceptedQty) || 0,
          qcNumber: detail.qcNumber || '',
          acceptedWithDeviation: Number(detail.acceptedWithDeviation) || 0,
          rejectedQty: Number(detail.rejectedQty) || 0,
          reworkQty: Number(detail.reworkQty) || 0,
          receivingLocation: detail.receivingLocation || '',
          acceptedLocation: detail.acceptedLocation || '',
          status: detail.status || '',
          reason: detail.reason || ''
        });
        group.disable({ emitEvent: false });
        this.details.push(group);
      });
    } else {
      this.resetDetailRows();
    }
  }

  private getBlankFormState() {
    return {
      inwardType: '',
      grnType: '',
      supplierVendor: '',
      reworkLocation: false,
      inspectionRequired: false,
      testCertificate: false,
      corrActionRequired: false,
      remarks: ''
    };
  }

  private fetchRecords(): void {
    this.isLoading = true;
    this.loadError = '';

    this.qcService.listIncomingMaterialInspections().subscribe({
      next: (records) => {
        this.records = records;
        this.isLoading = false;
      },
      error: () => {
        this.loadError = 'Unable to load incoming inspections.';
        this.isLoading = false;
      }
    });
  }
}

