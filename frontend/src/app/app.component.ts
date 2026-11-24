import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmDialogComponent } from './shared/confirm-dialog.component';
import { ToastsComponent } from './shared/toasts.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastsComponent, ConfirmDialogComponent],
  template: `
    <router-outlet />
    <app-toasts />
    <app-confirm-dialog />
  `,
})
export class AppComponent {}
