import { HttpClient } from '@angular/common/http';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Nav } from '../layout/nav/nav';
import { AccountService } from '../core/account-service';
import { lastValueFrom } from 'rxjs';
import { Roles, User } from '../types';


interface member {
  id: string,
  displayName: string,
  email: string
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Nav],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  private accountService = inject(AccountService);
  private http =  inject(HttpClient);
  protected title = 'Dating app';
  protected members = signal<member[]>([]);
  
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
    this.http.get<member[]>('https://localhost:7177/api/members').subscribe({
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
