import {ComponentRef, Injectable, ViewContainerRef} from '@angular/core';
import {Toast} from '../shared/toast/toast';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private viewContainerRef?: ViewContainerRef;

  setViewContainerRef(viewContainerRef: ViewContainerRef) {
    this.viewContainerRef = viewContainerRef;
  }

  createToastElement(message: string, alertClass: string, duration = 5000) {
    if (!this.viewContainerRef) {
      console.error('No View Container Ref');
      return;
    }

    const componentRef = this.viewContainerRef.createComponent(Toast);

    componentRef.setInput('message', message);
    componentRef.setInput('alertClass', alertClass);
    componentRef.setInput('duration', duration);


    componentRef.instance.close.subscribe(() => {
      componentRef.destroy();
      console.log('toast closed');
    })


    return componentRef;
  }
}
