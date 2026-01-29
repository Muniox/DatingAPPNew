import {
  Component,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { EditableMember, Member } from '../../../types';
import { DatePipe } from '@angular/common';
import { MemberService, ToastService } from '../../../core/services';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-member-profile',
  imports: [DatePipe, FormsModule],
  templateUrl: './member-profile.html',
  styleUrl: './member-profile.css',
})
export class MemberProfile implements OnInit, OnDestroy {
  @ViewChild('editForm') editForm?: NgForm;
  @HostListener('window:beforeunload', ['$event']) notify($event: BeforeUnloadEvent) {
    if (this.editForm?.dirty) {
      $event.preventDefault();
    }
  }

  protected memberService = inject(MemberService);
  private toast = inject(ToastService);
  protected editableMember = signal<EditableMember>({
    displayName: '',
    city: '',
    country: '',
    description: '',
  });

  ngOnInit(): void {
    this.editableMember.set({
      displayName: this.memberService.member()?.displayName || '',
      description: this.memberService.member()?.description || '',
      country: this.memberService.member()?.country || '',
      city: this.memberService.member()?.city || '',
    });
  }

  updateProfile() {
    if (!this.memberService.member()) return;

    const updatedMember = { ...this.memberService.member(), ...this.editableMember() };
    this.memberService.updateMember(this.editableMember()).subscribe({
      next: () => {
        this.toast.success('Profile updated successfully');
        this.memberService.editMode.set(false);
        this.memberService.member.set(updatedMember as Member);
        this.editForm?.reset(updatedMember);
      },
    });
  }

  ngOnDestroy(): void {
    if (this.memberService.editMode()) this.memberService.editMode.set(false);
  }
}
