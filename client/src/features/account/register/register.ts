import {Component, inject, input, OnInit, output} from '@angular/core';
import { RegisterCreds, User } from '../../../types';
import { AccountService } from '../../../core/services';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {JsonPipe} from '@angular/common';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, JsonPipe],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private accountService = inject(AccountService)
  private fb = inject(FormBuilder);

  cancelRegister = output<boolean>();
  protected creds = {} as RegisterCreds
  protected registerForm : FormGroup = this.fb.group({
    email: ['johndoe@test.com', [Validators.required, Validators.email]],
    displayName: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(8)]],
    confirmPassword: ['', Validators.required]
  });


  register() {
    console.log(this.registerForm.value)
    // this.accountService.register(this.creds).subscribe({
    //   next: response => {
    //     console.log(response);
    //     this.cancel();
    //   },
    //   error: error => console.log(error)
    // })
  }

  cancel() {
    this.cancelRegister.emit(false);
  }
}
