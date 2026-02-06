import { Component, inject, OnInit, signal } from '@angular/core';
import { MemberService } from '../../../core/services';
import { Member, PaginatedResult } from '../../../types';
import { MemberCard } from '../../member-card/member-card';
import { Paginator } from '../../../shared/paginator/paginator';

@Component({
  selector: 'app-member-list',
  imports: [MemberCard, Paginator],
  templateUrl: './member-list.html',
  styleUrl: './member-list.css',
})
export class MemberList implements OnInit {
  private memberService = inject(MemberService);
  protected paginatedMembers = signal<PaginatedResult<Member> | null>(null);
  pageNumber = 1;
  pageSize = 5;

  ngOnInit(): void {
    this.loadMembers();
  }

  loadMembers() {
    this.memberService.getMembers(this.pageNumber, this.pageSize).subscribe({
      next: result => {
        this.paginatedMembers.set(result)
      }
    })
  }

  onPageChange(event: { pageNumber: number; pageSize: number }) {
    this.pageSize = event.pageSize;
    this.pageNumber = event.pageNumber;
    this.loadMembers();
  }
}
