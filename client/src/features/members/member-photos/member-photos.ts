import {Component, inject} from '@angular/core';
import {MemberService} from '../../../core/services';
import {ActivatedRoute} from '@angular/router';
import {Observable} from 'rxjs';
import { Photo } from "../../../types/photo";
import { AsyncPipe } from '@angular/common';
import { ImageUpload } from "../../../shared/image-upload/image-upload";


@Component({
  selector: 'app-member-photos',
  imports: [AsyncPipe, ImageUpload],
  templateUrl: './member-photos.html',
  styleUrl: './member-photos.css',
})
export class MemberPhotos {
  protected memberService = inject(MemberService);
  private route = inject(ActivatedRoute);


  protected memberId = this.route.parent?.snapshot.paramMap.get('id');
  protected photos$?: Observable<Photo[]> = this.memberId
    ? this.memberService.getMemberPhotos(this.memberId)
    : undefined;

  get photoMocks() {
    return Array.from({length: 20}, (_, i) => ({
      url: '/user.png'
    }))
  }
}
