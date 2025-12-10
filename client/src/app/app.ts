import { HttpClient } from '@angular/common/http';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';


interface member {
  id: string,
  displayName: string,
  email: string
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  private http =  inject(HttpClient)
  protected title = 'Dating app';
  protected members = signal<member[]>([])
  
  ngOnInit(): void {
    this.http.get<member[]>('https://localhost:7177/api/members').subscribe({
      next: response => {
        console.log(response)
        this.members.set(response)
      },
      error: error => console.log(error),
      complete: () => console.log('Completed the http request')
    })
  }
  
  ngOnDestroy(): void {
    throw new Error('Method not implemented.');
  }
  
  
}
