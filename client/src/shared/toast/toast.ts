import {Component, input, OnDestroy, OnInit, output} from '@angular/core';

@Component({
  selector: 'app-toast',
  imports: [],
  templateUrl: './toast.html',
  styleUrl: './toast.css',
})
export class Toast implements OnInit, OnDestroy {
  close = output<void>();

  message = input.required<string>();
  alertClass = input<string>();
  duration = input<number>(5000);

  private timeoutId?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.startTimer();
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  closeToast(): void {
    this.clearTimer();
    this.close.emit();
  }

  private startTimer(): void {
    const duration = this.duration();
    if (duration > 0) {
      this.timeoutId = setTimeout(() => this.closeToast(), duration)
    }
  }

  private clearTimer(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
  }
}
