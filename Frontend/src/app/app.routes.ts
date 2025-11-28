import { Routes } from '@angular/router';
import { LoginPage } from './pages/login/login.page';
import { WorkspacePage } from './pages/workspace/workspace.page';
import { ParameterMasterPage } from './pages/parameter-master/parameter-master.page';
import { ProductInspectionPage } from './pages/product-inspection/product-inspection.page';
import { IncomingMaterialInspectionPage } from './pages/incoming-material-inspection/incoming-material-inspection.page';
import { ProductInspectionPlanPage } from './pages/product-inspection-plan/product-inspection-plan.page';
import { IncomingMaterialInspectionPlanPage } from './pages/incoming-material-inspection-plan/incoming-material-inspection-plan.page';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginPage, title: 'Login | AddOnTest Manager' },
  {
    path: 'workspace',
    component: WorkspacePage,
    // canActivate: [AuthGuard], // optional
    title: 'Workspace | AddOnTest Manager',
    children: [
      { path: '', redirectTo: 'parameter-master', pathMatch: 'full' },
      { path: 'parameter-master', component: ParameterMasterPage },
      { path: 'product-inspection', component: ProductInspectionPage },
      { path: 'incoming-inspection', component: IncomingMaterialInspectionPage },
      { path: 'product-plan', component: ProductInspectionPlanPage },
      { path: 'incoming-plan', component: IncomingMaterialInspectionPlanPage }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
