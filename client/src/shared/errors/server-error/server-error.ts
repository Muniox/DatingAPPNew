import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiError } from '../../../types';

@Component({
  selector: 'app-server-error',
  imports: [],
  templateUrl: './server-error.html',
  styleUrl: './server-error.css',
})
export class ServerError {
  private router = inject(Router);
  
  protected navigation = this.router.currentNavigation();
  protected error: ApiError | null = this.navigation?.extras?.state?.['error']
  protected showDetails = false

  detailsToggle() {
    this.showDetails = !this.showDetails;
  }
}
