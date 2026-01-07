import {Component, input, output} from '@angular/core';

@Component({
  selector: 'app-toast',
  imports: [],
  templateUrl: './toast.html',
  styleUrl: './toast.css',
})
export class Toast {
  close = output<void>();

  message = input.required<string>();
  alertClass = input<string>();
  duration = input<number>(5000);

  protected onClose() {
    this.close.emit();
  }
}
