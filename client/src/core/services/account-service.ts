import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { LoginCreds, RegisterCreds, Roles, User } from '../../types';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private http = inject(HttpClient);

  currentUser = signal<User | null>(null);

  baseUrl = 'https://localhost:7177/api';

    loadUserFromStorage(): void {
    const userString = localStorage.getItem(Roles.user);
    if (userString) {
      const user = JSON.parse(userString) as User;
      this.currentUser.set(user);
    }
  }

  register(creds: RegisterCreds) {
    return this.http.post<User>(this.baseUrl + 'account/register', creds).pipe(
      tap(user => {
        if (user) this.setCurrentUser(user)
      })
    )
  }

  login(creds: LoginCreds) {
    return this.http.post<User>(this.baseUrl + '/account/login', creds).pipe(
      tap((user) => {
        if (user) this.setCurrentUser(user)
      })
    );
  }

  setCurrentUser(user: User) {
    localStorage.setItem(Roles.user, JSON.stringify(user))
    this.currentUser.set(user)
  }

  logout() {
    localStorage.removeItem(Roles.user);
    this.currentUser.set(null);
  }
}
