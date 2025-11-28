import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ParameterService,
  ProductInspectionPlanRecord,
  CreateProductInspectionPlanPayload,
  ProductInspectionPlanDetail
} from '../../parameter.service';

@Component({
  selector: 'app-product-inspection-plan-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-inspection-plan.page.html',
  styleUrl: './product-inspection-plan.page.css'
})
export class ProductInspectionPlanPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly qcService = inject(ParameterService);

  protected records: ProductInspectionPlanRecord[] = [];
  protected isLoading = false;
  protected loadError = '';
  protected isSaving = false;
  protected saveError = '';
  protected showDialog = false;
  protected isReadOnly = false;

  protected readonly form = this.fb.group({
    itemId: ['', Validators.required],
    itemDescription: ['', Validators.required],
    planType: [''],
    frequency: [''],
    customer: [''],
    contactPerson: [''],
    supplierPlant: [''],
    customerApproval: [''],
    docNumber: [''],
    planDate: [''],
    sampleSize: [0],
    preparedBy: [''],
    revisionNumber: [''],
    remarks: [''],
    details: this.fb.array<FormGroup>([this.buildDetailGroup()])
  });

  get details(): FormArray<FormGroup> {
    return this.form.get('details') as FormArray<FormGroup>;
  }

  ngOnInit(): void {
    this.fetchRecords();
  }

  /** Add a new inspection plan detail row */
  protected addDetailRow(): void {
    this.details.push(this.buildDetailGroup());
  }

  /** Remove a detail row */
  protected removeDetailRow(index: number): void {
    if (this.details.length > 1) {
      this.details.removeAt(index);
    }
  }

  /** Open the form dialog for a new record */
  protected openDialog(): void {
    this.isReadOnly = false;
    this.showDialog = true;
    this.saveError = '';
    this.form.enable({ emitEvent: false });
    this.form.reset(this.getBlankFormState());
    this.resetDetailRows();
  }

  /** Close the form dialog */
  protected closeDialog(): void {
    this.showDialog = false;
    this.isReadOnly = false;
    this.saveError = '';
    this.form.enable({ emitEvent: false });
    this.form.reset(this.getBlankFormState());
    this.resetDetailRows();
  }

  /** Submit the form to create a new product inspection plan */
  protected submit(): void {
    if (this.form.invalid || this.isReadOnly) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.saveError = '';

    const payload = this.form.value as CreateProductInspectionPlanPayload;
    payload.details = (payload.details || []).map(detail => ({
      ...detail,
      sampleSize: Number(detail.sampleSize) || 0
    })) as ProductInspectionPlanDetail[];

    this.qcService.createProductInspectionPlan(payload).subscribe({
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

  /** View a record in read-only mode */
  protected viewRecord(record: ProductInspectionPlanRecord): void {
    this.isReadOnly = true;
    this.showDialog = true;
    this.saveError = '';
    this.form.enable({ emitEvent: false });

    this.form.patchValue({
      itemId: record.itemId ?? '',
      itemDescription: record.itemDescription ?? '',
      planType: record.planType ?? '',
      frequency: record.frequency ?? '',
      customer: record.customer ?? '',
      contactPerson: record.contactPerson ?? '',
      supplierPlant: record.supplierPlant ?? '',
      customerApproval: record.customerApproval ?? '',
      docNumber: record.docNumber ?? '',
      planDate: record.planDate?.split('T')[0] ?? '',
      sampleSize: record.sampleSize ?? 0,
      preparedBy: record.preparedBy ?? '',
      revisionNumber: record.revisionNumber ?? '',
      remarks: record.remarks ?? ''
    });

    this.populateDetailRows(record.details);
    this.form.disable({ emitEvent: false });
  }

  /** Populate detail rows from a record */
  private populateDetailRows(details?: ProductInspectionPlanDetail[]): void {
    this.details.clear();
    if (details?.length) {
      details.forEach(detail => {
        const group = this.buildDetailGroup();
        group.patchValue({
          parameterType: detail.parameterType ?? '',
          parameterName: detail.parameterName ?? '',
          specifications: detail.specifications ?? '',
          specCharacteristics: detail.specCharacteristics ?? '',
          controlMethod: detail.controlMethod ?? '',
          frequencyType: detail.frequencyType ?? '',
          frequencyValue: detail.frequencyValue ?? '',
          sampleSize: Number(detail.sampleSize) ?? 0,
          machineNo: detail.machineNo ?? '',
          toolNo: detail.toolNo ?? '',
          inspectionMethod: detail.inspectionMethod ?? '',
          reactionPlan: detail.reactionPlan ?? '',
          correctiveAction: detail.correctiveAction ?? ''
        });
        group.disable({ emitEvent: false });
        this.details.push(group);
      });
    } else {
      this.resetDetailRows();
    }
  }

  /** Reset detail rows to one blank row */
  private resetDetailRows(): void {
    this.details.clear();
    this.details.push(this.buildDetailGroup());
  }

  /** Returns a blank state for the main form */
  private getBlankFormState() {
    return {
      itemId: '',
      itemDescription: '',
      planType: '',
      frequency: '',
      customer: '',
      contactPerson: '',
      supplierPlant: '',
      customerApproval: '',
      docNumber: '',
      planDate: '',
      sampleSize: 0,
      preparedBy: '',
      revisionNumber: '',
      remarks: ''
    };
  }

  /** Build a form group for a detail row */
  private buildDetailGroup(): FormGroup {
    return this.fb.group({
      parameterType: [''],
      parameterName: ['', Validators.required],
      specifications: ['', Validators.required],
      specCharacteristics: ['', Validators.required],
      controlMethod: [''],
      frequencyType: [''],
      frequencyValue: [''],
      sampleSize: [0],
      machineNo: [''],
      toolNo: [''],
      inspectionMethod: [''],
      reactionPlan: [''],
      correctiveAction: ['']
    });
  }

  /** Fetch all product inspection plan records */
  private fetchRecords(): void {
    this.isLoading = true;
    this.loadError = '';

    this.qcService.listProductInspectionPlans().subscribe({
      next: (records) => {
        this.records = records;
        this.isLoading = false;
      },
      error: () => {
        this.loadError = 'Unable to load product inspection plans.';
        this.isLoading = false;
      }
    });
  }
}
