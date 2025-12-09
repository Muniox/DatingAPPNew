import { HttpClient } from '@angular/common/http';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  private http =  inject(HttpClient)
  protected title = 'Dating app';
  
  ngOnInit(): void {
    this.http.get('https://localhost:7177/api/members').subscribe({
      next: response => console.log(response),
      error: error => console.log(error),
      complete: () => console.log('Completed the http request')
    })
  }
  
  ngOnDestroy(): void {
    throw new Error('Method not implemented.');
  }
  
  
}
