import { Component, inject, OnInit, output, signal } from '@angular/core';
import { AccountService } from '../../../core/services';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { TextInput } from '../../../shared/text-input/text-input';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, TextInput],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register implements OnInit {
  private accountService = inject(AccountService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  cancelRegister = output<boolean>();
  protected currentStep = signal<number>(1);

  protected credentialsForm: FormGroup = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    displayName: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(8)]],
    confirmPassword: ['', [Validators.required, this.matchValues('password')]],
  });

  protected profileForm: FormGroup = this.fb.nonNullable.group({
    gender: ['male', Validators.required],
    dateOfBirth: ['', Validators.required],
    city: ['', Validators.required],
    country: ['', Validators.required],
  });

  protected validationErrorsFromAPI = signal<string[]>([]);

  ngOnInit() {
    this.credentialsForm.controls['password'].valueChanges.subscribe(() => {
      this.credentialsForm.controls['confirmPassword'].updateValueAndValidity();
    });
  }

  matchValues(matchTo: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const parent = control.parent;
      if (!parent) return null;

      const matchValue = parent.get(matchTo)?.value;
      return control.value === matchValue ? null : { passwordMismatch: true };
    };
  }

  nextStep() {
    if (this.credentialsForm.valid) {
      this.currentStep.update((prevStep) => prevStep + 1);
    }
  }

  prevStep() {
    this.currentStep.update((prevStep) => prevStep - 1);
  }

  getMaxDate() {
    const today = new Date();
    today.setFullYear(today.getFullYear() - 18);
    return today.toISOString().split('T')[0];
  }

  register() {
    if (this.profileForm.valid && this.credentialsForm.valid) {
      const formData = { ...this.credentialsForm.value, ...this.profileForm.value };

      this.accountService.register(formData).subscribe({
        next: () => {
          this.router.navigateByUrl('/members');
        },
        error: (error) => {
          console.log(error),
          this.validationErrorsFromAPI.set(error)
        }
      });
    }
  }

  cancel() {
    this.cancelRegister.emit(false);
  }
}
