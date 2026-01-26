import {Component, inject} from '@angular/core';
import {MemberService} from '../../../core/services';
import {ActivatedRoute} from '@angular/router';
import {Observable} from 'rxjs';
import { Photo } from "../../../types/photo";


@Component({
  selector: 'app-member-photos',
  imports: [],
  templateUrl: './member-photos.html',
  styleUrl: './member-photos.css',
})
export class MemberPhotos {
  private memberService = inject(MemberService);
  private route = inject(ActivatedRoute);


  protected memberId = this.route.parent?.snapshot.paramMap.get('id');
  protected photos$?: Observable<Photo[]> = this.memberId
    ? this.memberService.getMemberPhotos(this.memberId)
    : undefined;
}
