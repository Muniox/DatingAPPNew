import {
  Component,
  effect,
  ElementRef,
  inject,
  Injector,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { MessageService } from '../../../core/services/message-service';
import { MemberService } from '../../../core/services';
import { DatePipe } from '@angular/common';
import { TimeAgoPipe } from '../../../core/pipes/time-ago-pipe';
import { FormsModule } from '@angular/forms';
import { PresenceService } from '../../../core/services/presence-service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-member-messages',
  imports: [DatePipe, TimeAgoPipe, FormsModule],
  templateUrl: './member-messages.html',
  styleUrl: './member-messages.css',
})
export class MemberMessages implements OnInit, OnDestroy {
  @ViewChild('messageEndRef') messageEndRef!: ElementRef<HTMLDivElement>;
  private injector = inject(Injector);
  protected messageService = inject(MessageService);
  private memberService = inject(MemberService);
  protected presenceService = inject(PresenceService);
  private route = inject(ActivatedRoute);

  protected messageContent = '';

  ngOnInit(): void {
    this.route.parent?.paramMap.subscribe({
      next: (params) => {
        const otherUserId = params.get('id');
        if (!otherUserId) throw new Error('Cannot connect to hub');
        this.messageService.createHubConnection(otherUserId);
      },
    });
    effect(
      () => {
        const currentMessages = this.messageService.messageThread();
        if (currentMessages.length > 0) {
          this.scrollToBottom();
        }
      },
      { injector: this.injector },
    );
  }

  async sendMessage() {
    const recipientId = this.memberService.member()?.id;
    if (!recipientId) return;
    await this.messageService.sendMessage(recipientId, this.messageContent);
    this.messageContent = '';
  }

  scrollToBottom() {
    requestAnimationFrame(() => {
      this.messageEndRef?.nativeElement.scrollIntoView({ behavior: 'smooth' });
    });
  }

  ngOnDestroy(): void {
    this.messageService.stopeHubConnection();
  }
}
