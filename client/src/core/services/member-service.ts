import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { EditableMember, Member, MemberParams, PaginatedResult, Photo } from '../../types';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MemberService {
  private http = inject(HttpClient);
  private baseUrl = environment.baseUrl;

  member = signal<Member | null>(null);
  editMode = signal(false); //tymczasowo na true! aby stestować

  getMembers(memberParams: MemberParams) {
    let params = new HttpParams();

    params = params
      .append('pageNumber', memberParams.pageNumber)
      .append('pageSize', memberParams.pageSize)
      .append('minAge', memberParams.minAge)
      .append('maxAge', memberParams.maxAge);

    if (memberParams.gender) params = params.append('gender', memberParams.gender);

    return this.http.get<PaginatedResult<Member>>(this.baseUrl + 'members', { params });
  }

  getMember(id: string) {
    return this.http.get<Member>(this.baseUrl + 'members/' + id).pipe(
      tap((member) => {
        this.member.set(member);
      }),
    );
  }

  getMemberPhotos(id: string) {
    return this.http.get<Photo[]>(this.baseUrl + 'members/' + id + '/photos');
  }

  updateMember(member: EditableMember) {
    return this.http.put(this.baseUrl + 'members', member);
  }

  uploadPhoto(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Photo>(this.baseUrl + 'members/add-photo', formData);
  }

  setMainPhoto(photo: Photo) {
    return this.http.put(this.baseUrl + 'members/set-main-photo/' + photo.id, {});
  }

  deletePhoto(photoId: number) {
    return this.http.delete(this.baseUrl + 'members/delete-photo/' + photoId);
  }
}
