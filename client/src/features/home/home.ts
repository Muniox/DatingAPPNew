import { Component, Input, signal } from '@angular/core';
import { Register } from "../account/register/register";
import { User } from '../../types';

@Component({
  selector: 'app-home',
  imports: [Register],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  protected registerMode = signal(false);
  @Input({required: true}) membersFromApp: User[] = [];

  showRegister() {
    this.registerMode.set(true);
  }
}
