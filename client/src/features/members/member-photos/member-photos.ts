import { Component, inject, OnInit, signal } from '@angular/core';
import { AccountService, MemberService } from '../../../core/services';
import { ActivatedRoute } from '@angular/router';
import { Photo } from '../../../types/photo';
import { ImageUpload } from '../../../shared/image-upload/image-upload';
import { StarButton } from "../../../shared/star-button/star-button";

@Component({
  selector: 'app-member-photos',
  imports: [ImageUpload, StarButton],
  templateUrl: './member-photos.html',
  styleUrl: './member-photos.css',
})
export class MemberPhotos implements OnInit {
  protected memberService = inject(MemberService);
  private accountService = inject(AccountService);
  private route = inject(ActivatedRoute);
  protected photos = signal<Photo[]>([]);
  protected loading = signal<boolean>(false);

  ngOnInit(): void {
    const memberId = this.route.parent?.snapshot.paramMap.get('id');
    if (memberId) {
      this.memberService.getMemberPhotos(memberId).subscribe({
        next: (data) => {
          this.photos.set(data);
        },
      });
    }
  }

  onUploadImage(file: File) {
    this.loading.set(true);
    this.memberService.uploadPhoto(file).subscribe({
      next: photo => {
        this.memberService.editMode.set(false);
        this.loading.set(false);
        this.photos.update(photos => [...photos, photo]);
      },
      error: error => {
        console.log('Error uploading image: ', error);
        this.loading.set(false)
      }
    })
  }

  setMainPhoto(photo: Photo) {
    this.memberService.setMainPhoto(photo).subscribe({
      next: () => {
        const currentUser = this.accountService.currentUser();
        if (currentUser) {
          currentUser.imageUrl = photo.url;
          this.accountService.setCurrentUser(currentUser);
          this.memberService.member.update(member => {
            if (member) {
              return { ...member, imageUrl: photo.url };
            }
            return member;
          })
        }
      }
    })
  }
}
