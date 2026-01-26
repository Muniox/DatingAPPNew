import { Component, inject } from '@angular/core';
import { MemberService } from '../../../core/services';
import { Observable } from 'rxjs';
import { Member } from '../../../types';
import { AsyncPipe } from '@angular/common';
import { MemberCard } from "../../member-card/member-card";

@Component({
  selector: 'app-member-list',
  imports: [AsyncPipe, MemberCard],
  templateUrl: './member-list.html',
  styleUrl: './member-list.css',
})
export class MemberList {
  private memberService = inject(MemberService);
  protected members$ = this.memberService.getMembers();
}
