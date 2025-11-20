import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ParameterService,
  ProductInspectionRecord,
  CreateProductInspectionPayload,
  ProductInspectionDetail
} from '../../parameter.service';

@Component({
  selector: 'app-product-inspection-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-inspection.page.html',
  styleUrl: './product-inspection.page.css'
})
export class ProductInspectionPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly qcService = inject(ParameterService);

  protected records: ProductInspectionRecord[] = [];
  protected isLoading = false;
  protected loadError = '';
  protected isSaving = false;
  protected saveError = '';
  protected showDialog = false;
  protected isReadOnly = false;

  protected readonly form = this.fb.group({
    itemId: ['', Validators.required],
    itemDescription: ['', Validators.required],
    productionOrderNo: [''],
    receiptFromProduction: [''],
    inspectedBy: [''],
    controlPlanNo: [''],
    containerBagNo: [''],
    bottlePelletNo: [''],
    docNumber: [''],
    inspectionDate: [''],
    productionOrderDate: [''],
    sampleQty: [0, Validators.required],
    department: [''],
    preProduction: [false],
    producedQty: [0],
    acceptedQty: [0],
    rejectedQty: [0],
    status: [''],
    remarks: [''],
    specialInstructions: [''],
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
    if (this.form.invalid || this.isReadOnly) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.saveError = '';

    const payload = this.form.value as CreateProductInspectionPayload;
    payload.details = (payload.details || []).map((detail) => ({
      ...detail,
      sampleSize: Number(detail.sampleSize) || 0,
      result: Number(detail.result) || 0,
      stdDeviation: Number(detail.stdDeviation) || 0
    })) as ProductInspectionDetail[];

    this.qcService.createProductInspection(payload).subscribe({
      next: (record) => {
        this.records = [record, ...this.records];
        this.isSaving = false;
        this.closeDialog();
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
      parameterType: [''],
      parameterName: ['', Validators.required],
      specification: ['', Validators.required],
      sampleSize: [0, Validators.required],
      result: [0, Validators.required],
      stdDeviation: [0, Validators.required],
      remarks: ['']
    });
  }

  protected viewRecord(record: ProductInspectionRecord): void {
    this.isReadOnly = true;
    this.showDialog = true;
    this.saveError = '';
    this.form.enable({ emitEvent: false });
    this.form.patchValue({
      itemId: record.itemId || '',
      itemDescription: record.itemDescription || '',
      productionOrderNo: record.productionOrderNo || '',
      receiptFromProduction: record.receiptFromProduction || '',
      inspectedBy: record.inspectedBy || '',
      controlPlanNo: record.controlPlanNo || '',
      containerBagNo: record.containerBagNo || '',
      bottlePelletNo: record.bottlePelletNo || '',
      docNumber: record.docNumber || '',
      inspectionDate: record.inspectionDate ? record.inspectionDate.split('T')[0] : '',
      productionOrderDate: record.productionOrderDate ? record.productionOrderDate.split('T')[0] : '',
      sampleQty: record.sampleQty || 0,
      department: record.department || '',
      preProduction: Boolean(record.preProduction),
      producedQty: record.producedQty || 0,
      acceptedQty: record.acceptedQty || 0,
      rejectedQty: record.rejectedQty || 0,
      status: record.status || '',
      remarks: record.remarks || '',
      specialInstructions: record.specialInstructions || ''
    });
    this.populateDetailRows(record.details);
    this.form.disable({ emitEvent: false });
  }

  private resetDetailRows(): void {
    this.details.clear();
    this.details.push(this.buildDetailGroup());
  }

  private populateDetailRows(details?: ProductInspectionDetail[]): void {
    this.details.clear();
    if (details?.length) {
      details.forEach((detail) => {
        const group = this.buildDetailGroup();
        group.patchValue({
          parameterType: detail.parameterType || '',
          parameterName: detail.parameterName || '',
          specification: detail.specification || '',
          sampleSize: Number(detail.sampleSize) || 0,
          result: Number(detail.result) || 0,
          stdDeviation: Number(detail.stdDeviation) || 0,
          remarks: detail.remarks || ''
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
      itemId: '',
      itemDescription: '',
      productionOrderNo: '',
      receiptFromProduction: '',
      inspectedBy: '',
      controlPlanNo: '',
      containerBagNo: '',
      bottlePelletNo: '',
      docNumber: '',
      inspectionDate: '',
      productionOrderDate: '',
      sampleQty: 0,
      department: '',
      preProduction: false,
      producedQty: 0,
      acceptedQty: 0,
      rejectedQty: 0,
      status: '',
      remarks: '',
      specialInstructions: ''
    };
  }

  private fetchRecords(): void {
    this.isLoading = true;
    this.loadError = '';

    this.qcService.listProductInspections().subscribe({
      next: (records) => {
        this.records = records;
        this.isLoading = false;
      },
      error: () => {
        this.loadError = 'Unable to load product inspections. Please try again later.';
        this.isLoading = false;
      }
    });
  }
}

