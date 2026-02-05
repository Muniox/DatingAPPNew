import { Component, inject } from '@angular/core';
import { MemberService } from '../../../core/services';
import { Observable } from 'rxjs';
import { Member, PaginatedResult } from '../../../types';
import { AsyncPipe } from '@angular/common';
import { MemberCard } from "../../member-card/member-card";
import { Paginator } from "../../../shared/paginator/paginator";

@Component({
  selector: 'app-member-list',
  imports: [AsyncPipe, MemberCard, Paginator],
  templateUrl: './member-list.html',
  styleUrl: './member-list.css',
})
export class MemberList {
  private memberService = inject(MemberService);
  protected paginatedMembers$: Observable<PaginatedResult<Member>> = this.memberService.getMembers();
  pageNumber = 1;
  pageSize = 5;

  loadMembers() {
    this.paginatedMembers$ = this.memberService.getMembers(this.pageNumber, this.pageSize);
  }

  onPageChange(event: {pageNumber: number, pageSize: number}) {
    this.pageSize = event.pageSize;
    this.pageNumber = event.pageNumber;
    this.loadMembers();
  }
}
