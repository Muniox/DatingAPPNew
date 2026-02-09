import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Member, PaginatedResult } from '../../types';

@Injectable({
  providedIn: 'root',
})
export class LikesService {
  private baseUrl = environment.baseUrl;
  private http = inject(HttpClient);
  likeIds = signal<string[]>([]);

  toggleLike(targetMemberId: string) {
    return this.http.post(`${this.baseUrl}likes/${targetMemberId}`, {})
  }

  getLikes(predicate: string, pageNumber: number, pageSize: number) {
    let params = new HttpParams;

    params = params
      .append('pageNumber', pageNumber)
      .append('pageSize', pageSize)
      .append('predicate', predicate);

    return this.http.get<PaginatedResult<Member>>(this.baseUrl + 'likes', {
      params
    })
  }

  getLikeIds() {
    return this.http.get<string[]>(this.baseUrl + 'likes/list').subscribe({
      next: ids => this.likeIds.set(ids),
    })
  }

  clearLikeIds() {
    this.likeIds.set([]);
  }
}
