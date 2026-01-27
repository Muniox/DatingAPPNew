import {Component, inject, OnInit, signal} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Member} from '../../../types';
import {DatePipe} from '@angular/common';
import { MemberService } from '../../../core/services';

@Component({
  selector: 'app-member-profile',
  imports: [
    DatePipe
  ],
  templateUrl: './member-profile.html',
  styleUrl: './member-profile.css',
})
export class MemberProfile implements OnInit {
  protected memberService = inject(MemberService)
  private route = inject(ActivatedRoute);
  protected member = signal<Member | undefined>(undefined);

  ngOnInit(): void {
    this.route.parent?.data.subscribe(data => {
      this.member.set(data['member']);
    })
  }
}
