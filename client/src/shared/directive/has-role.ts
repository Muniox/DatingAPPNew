import { Directive, inject, Input, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { AccountService } from '../../core/services';

@Directive({
  selector: '[appHasRole]',
})
export class HasRole implements OnInit {
  @Input() appHasRole: string[] = [];
  private accountService = inject(AccountService);
  private viewContainerRef = inject(ViewContainerRef);
  private teplateRef = inject(TemplateRef);

  ngOnInit(): void {
    if (this.accountService.currentUser()?.roles.some(r => this.appHasRole.includes(r))) {
      this.viewContainerRef.createEmbeddedView(this.teplateRef);
    } else {
      this.viewContainerRef.clear()
    }
  }
}
