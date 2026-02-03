import {Component, inject, input, OnInit, output, signal} from '@angular/core';
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
  protected curentStep = signal<number>(1);

  protected credentialsForm: FormGroup = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    displayName: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(8)]],
    confirmPassword: ['', [Validators.required, this.matchValues('password')]]
  });

  protected profileForm: FormGroup = this.fb.nonNullable.group({
    gender: ['', Validators.required],
    dateOfBirth: ['', Validators.required],
    city: ['', Validators.required],
    country: ['', Validators.required],
  });

  ngOnInit() {
    this.credentialsForm.controls['password'].valueChanges.subscribe(() => {
      this.credentialsForm.controls['confirmPassword'].updateValueAndValidity();
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

  nextStep() {
    if (this.credentialsForm.valid) {
      this.curentStep.update(prevStep => prevStep + 1);
    }
  }

  prevStep() {
    this.curentStep.update(prevStep => prevStep - 1);
  }


  register() {
    if (this.profileForm.valid && this.credentialsForm.valid) {
      const formData = {...this.credentialsForm, ...this.profileForm.value}
      console.log('Form data: ', formData);
    }
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
