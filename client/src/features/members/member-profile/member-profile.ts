import {Component, HostListener, inject, OnDestroy, OnInit, signal, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {EditableMember, Member} from '../../../types';
import {DatePipe} from '@angular/common';
import { MemberService, ToastService } from '../../../core/services';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-member-profile',
  imports: [
    DatePipe,
    FormsModule
  ],
  templateUrl: './member-profile.html',
  styleUrl: './member-profile.css',
})
export class MemberProfile implements OnInit, OnDestroy {
  @ViewChild('editForm') editForm?: NgForm;
  @HostListener('window:beforeunload', ['$event']) notify($event:BeforeUnloadEvent) {
    if (this.editForm?.dirty) {
      $event.preventDefault();
    }
  }
  
  protected memberService = inject(MemberService)
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  
  protected member = signal<Member | undefined>(undefined);
  protected editableMember = signal<EditableMember>({
    displayName: '',
    city: '',
    country: '',
    description: ''
  })

  ngOnInit(): void {
    this.route.parent?.data.subscribe(data => {
      this.member.set(data['member']);
    })
    
    this.editableMember.set({
      displayName: this.member()?.displayName || '',
      description: this.member()?.description || '',
      country: this.member()?.country || '',
      city: this.member()?.city || '',
    })
  }
  
  updateProfile() {
    if (!this.member()) return;
    
    const updatedMember = {...this.member(), ...this.editableMember()}
    console.log(updatedMember);
    this.toast.success('Profile updated successfully');
    this.memberService.editMode.set(false);
  }

  ngOnDestroy(): void {
    if (this.memberService.editMode()) this.memberService.editMode.set(false);
  }
}
