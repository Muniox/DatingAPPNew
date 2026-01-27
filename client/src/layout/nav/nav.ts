import { Component, DOCUMENT, inject, OnInit, Renderer2, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from "@angular/router";
import { ToastService, AccountService } from '../../core/services';
import { themes } from '../theme';

@Component({
  selector: 'app-nav',
  imports: [FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './nav.html',
  styleUrl: './nav.css',
})
export class Nav implements OnInit {

  protected accountService = inject(AccountService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private renderer = inject(Renderer2);
  private document = inject(DOCUMENT);
  protected creds: any = {};
  protected selectedTheme = signal<string>(localStorage.getItem('theme') || 'light');
  protected themes = themes;


  ngOnInit(): void {
    this.renderer.setAttribute(this.document.documentElement, 'data-theme', this.selectedTheme());
  }

  handleSelectTheme(theme: string) {
    this.selectedTheme.set(theme);
    localStorage.setItem('theme', theme);
    this.renderer.setAttribute(this.document.documentElement, 'data-theme', theme);
    const elem = this.document.activeElement as HTMLDivElement;
    if (elem) elem.blur();
  }


  login() {
    this.accountService.login(this.creds).subscribe({
      next: result => {
        this.router.navigateByUrl('/members');
        this.toast.success('Logged in successfully')
        console.log(result);
        this.creds = {};
      },
      error: error => {
        this.toast.error(error.error)
        console.log(error.error);
      }
    })
  }

  logout() {
    this.accountService.logout();
    this.router.navigateByUrl('/');
  }
}
