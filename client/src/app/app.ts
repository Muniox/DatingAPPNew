import { HttpClient } from '@angular/common/http';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Nav } from '../layout/nav/nav';
import { AccountService } from '../core';
import { Roles, User } from '../types';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Nav],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  private accountService = inject(AccountService);
  protected router = inject(Router);
  private http =  inject(HttpClient);
  protected title = 'Dating app';
  protected members = signal<User[]>([]);
  
  ngOnInit(): void {
    this.getMembers();
    this.setCurrentUser();
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
