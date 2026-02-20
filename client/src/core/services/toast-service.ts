import {inject, Injectable, ViewContainerRef} from '@angular/core';
import {Toast} from '../../shared/toast/toast';
import { Router } from '@angular/router';

const toastClases = {
success: 'alert-success',
error: 'alert-error',
warning: 'alert-warning',
info: 'alert-info'
} as const;


@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private viewContainerRef?: ViewContainerRef;
  private router = inject(Router);
  private activeToasts: Set<Toast> = new Set();
  

  setViewContainerRef(viewContainerRef: ViewContainerRef) {
    this.viewContainerRef = viewContainerRef;
  }

  success(message: string, duration?: number, avatar?: string, route?: string): void {
    this.createToastElement(message, toastClases.success, duration, avatar, route);
  }

  error(message: string, duration?: number, avatar?: string, route?: string): void {
    this.createToastElement(message, toastClases.error, duration, avatar, route);
  }

  warning(message: string, duration?: number, avatar?: string, route?: string): void {
    this.createToastElement(message, toastClases.warning, duration, avatar, route);
  }

  info(message: string, duration?: number, avatar?: string, route?: string): void {
    this.createToastElement(message, toastClases.info, duration, avatar, route);
  }

  private createToastElement(message: string, alertClass: string, duration = 5000, avatar?: string, route?: string) {
    if (!this.viewContainerRef) {
      console.error('No View Container Ref');
      return;
    }

    const componentRef = this.viewContainerRef.createComponent(Toast);
    const instance = componentRef.instance;

    componentRef.setInput('message', message);
    componentRef.setInput('alertClass', alertClass);
    componentRef.setInput('duration', duration);

    this.activeToasts.add(instance);

    instance.close.subscribe(() => {
      this.activeToasts.delete(instance)
      componentRef.destroy();
      console.log('toast closed');
    })


    return componentRef;
  }
}
