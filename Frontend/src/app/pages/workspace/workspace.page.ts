import { Component, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

type Module = { title: string; route: string };
type ModuleGroup = { title: string; items: Module[] };

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './workspace.page.html',
  styleUrl: './workspace.page.css'
})
export class WorkspacePage {
  @HostBinding('class.hide-sidebar') get hideSidebarClass() {
    return this.hideSidebar;
  }

  protected searchTerm = '';
  protected hideSidebar = false;

  constructor(private router: Router) {
    this.updateSidebarVisibility(this.router.url);

    // Listen to route changes and update sidebar
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateSidebarVisibility(event.urlAfterRedirects);
      });
  }

  protected readonly moduleGroups: ModuleGroup[] = [
    {
      title: 'QC',
      items: [
        { title: 'Parameter Master', route: '/workspace/parameter-master' },
        { title: 'Incoming Material Inspection', route: '/workspace/incoming-inspection' },
        { title: 'Product Inspection', route: '/workspace/product-inspection' },
        { title: 'Product Inspection Plan', route: '/workspace/product-plan' },
        { title: 'Incoming Material Inspection Plan', route: '/workspace/incoming-plan' }
      ]
    },
    {
      title: 'Inventory',
      items: [
        { title: 'Item Master', route: '/workspace/item-master' },
        { title: 'Serial Numbers', route: '/workspace/serial-numbers' }
      ]
    },
    {
      title: 'Reports',
      items: [{ title: 'Analytics', route: '/workspace/analytics' }]
    }
  ];

  /** Filter module groups based on search input */
  protected get filteredModuleGroups(): ModuleGroup[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.moduleGroups;

    return this.moduleGroups
      .map(group => ({
        ...group,
        items: group.items.filter(item => item.title.toLowerCase().includes(term))
      }))
      .filter(group => group.items.length > 0);
  }

  /** Logout the user */
  protected logout(): void {
    try {
      localStorage.removeItem('sapbtp_token');
    } catch {
      // Ignore storage errors
    }
    this.router.navigate(['/login']);
  }

  /** Update sidebar visibility based on current route */
  private updateSidebarVisibility(currentUrl: string): void {
    const fullPageRoutes = [
      '/workspace/incoming-inspection',
      '/workspace/product-inspection',
      '/workspace/product-plan',
      '/workspace/incoming-plan'
    ];
    this.hideSidebar = fullPageRoutes.some(route => currentUrl.startsWith(route));
  }
}
