import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AccountService, ToastService } from '../services';

export const authGuard: CanActivateFn = (route, state) => {
  const accountService = inject(AccountService);
  const toast = inject(ToastService);

  if(!accountService.currentUser()) {
    toast.error('You shall not pass');
    return false;
  }

  return true;
};
