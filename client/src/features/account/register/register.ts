import {Component, inject, input, OnInit, output} from '@angular/core';
import { RegisterCreds, User } from '../../../types';
import { AccountService } from '../../../core/services';
import {AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators} from '@angular/forms';
import {JsonPipe} from '@angular/common';
import { TextInput } from "../../../shared/text-input/text-input";

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, JsonPipe, TextInput],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register implements OnInit {
  private accountService = inject(AccountService)
  private fb = inject(FormBuilder);

  cancelRegister = output<boolean>();
  protected creds = {} as RegisterCreds
  protected registerForm: FormGroup = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    displayName: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(8)]],
    confirmPassword: ['', [Validators.required, this.matchValues('password')]]
  });

  ngOnInit() {
    this.registerForm.controls['password'].valueChanges.subscribe(() => {
      this.registerForm.controls['confirmPassword'].updateValueAndValidity();
    });
  }


  matchValues(matchTo: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const parent = control.parent
      if (!parent) return null;
      
      const matchValue = parent.get(matchTo)?.value;
      return control.value === matchValue ? null : {passwordMismatch: true}
    }
  }


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
