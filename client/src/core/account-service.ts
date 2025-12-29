import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Roles, User } from '../types';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private http = inject(HttpClient);

  currentUser = signal<User | null>(null);

  baseUrl = 'https://localhost:7177/api';

  login(creds: any) {
    return this.http.post<User>(this.baseUrl + '/account/login', creds).pipe(
      tap((user) => {
        if (user) {
          localStorage.setItem(Roles.user, JSON.stringify(user))
          this.currentUser.set(user);
        }
      })
    );
  }

  logout() {
    localStorage.removeItem(Roles.user)
    this.currentUser.set(null);
  }
}
