import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, single } from 'rxjs';
import { Member } from '../../../types';
import { AgePipe } from '../../../core/pipes/age-pipe';
import { AccountService, MemberService } from '../../../core/services';
import { PresenceService } from '../../../core/services/presence-service';
import { LikesService } from '../../../core/services/likes-service';

@Component({
  selector: 'app-member-detailed',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, AgePipe],
  templateUrl: './member-detailed.html',
  styleUrl: './member-detailed.css',
})
export class MemberDetailed implements OnInit {
  private route = inject(ActivatedRoute);
  protected memberService = inject(MemberService);
  private router = inject(Router);
  private accountService = inject(AccountService);
  protected presenceService = inject(PresenceService);
  protected likeService = inject(LikesService);

  protected title = signal<string | undefined>('Profile');
  private routeId = signal<string | null>(null);
  protected isCurrentUser = computed(() => {
    return this.accountService.currentUser()?.id === this.routeId();
  });
  protected hasLiked = computed(() => this.likeService.likeIds().includes(this.routeId()!));

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => this.routeId.set(params.get('id')));
    this.title.set(this.route.firstChild?.snapshot?.title)

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe({
      next: () => {
        this.title.set(this.route.firstChild?.snapshot?.title)
      }
    })
  }
}
