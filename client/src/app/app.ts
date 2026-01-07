import { HttpClient } from '@angular/common/http';
import {AfterViewInit, Component, inject, OnDestroy, OnInit, signal, ViewChild, ViewContainerRef} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Nav } from '../layout/nav/nav';
import { AccountService } from '../core';
import { Roles, User } from '../types';
import {ToastService} from '../core/toast-service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Nav],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy, AfterViewInit {
  private accountService = inject(AccountService);
  protected router = inject(Router);
  private http =  inject(HttpClient);
  private toastService = inject(ToastService);

  protected title = 'Dating app';
  protected members = signal<User[]>([]);

  @ViewChild('toastOutlet', {read: ViewContainerRef}) toastOutlet!: ViewContainerRef;

  ngOnInit(): void {
    this.getMembers();
    this.setCurrentUser();
  }

  ngAfterViewInit(): void {
    this.toastService.setViewContainerRef(this.toastOutlet);
  }

  setCurrentUser() {
    const userString = localStorage.getItem(Roles.user);

    if(!userString) return;

    const user = JSON.parse(userString) as User;
    this.accountService.currentUser.set(user)
  }

  async getMembers() {
    this.http.get<User[]>('https://localhost:7177/api/members').subscribe({
      next: response => {
        console.log(response)
        this.members.set(response)
      },
      error: error => console.log(error),
      complete: () => console.log('Completed the http request')
    })
  }

  ngOnDestroy(): void {
    throw new Error('Method not implemented.');
  }


}
