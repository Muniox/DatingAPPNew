import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { User } from '../../types';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  baseUrl = environment.baseUrl;
  private http = inject(HttpClient);

  getUserWithRoles() {
    return this.http.get<User[]>(this.baseUrl + 'admin/users-with-roles');
  }
}
