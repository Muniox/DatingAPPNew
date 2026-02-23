import {Component, inject, input, OnDestroy, OnInit, output} from '@angular/core';
import {Router} from '@angular/router';

@Component({
  selector: 'app-toast',
  imports: [],
  templateUrl: './toast.html',
  styleUrl: './toast.css',
})
export class Toast implements OnInit, OnDestroy {
  private router = inject(Router);

  close = output<void>();

  message = input.required<string>();
  alertClass = input<string>();
  duration = input<number>(5000);
  avatar = input<string | null>(null);
  route = input<string | null>(null);

  private timeoutId?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.startTimer();
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  navigateToRoute(): void {
    const route = this.route();
    if (route) {
      this.router.navigateByUrl(route);
      this.closeToast();
    }
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
