import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// const API = 'http://127.0.0.1:5000/api';
const API = 'https://weddingplatformbackend.onrender.com/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  getEvent(slug: string): Observable<any> {
    return this.http.get(`${API}/events/${slug}`);
  }

  submitRSVP(data: any): Observable<any> {
    return this.http.post(`${API}/rsvp`, data);
  }

  getRsvps(eventId: string) {
  return this.http.get(`${API}/rsvp/${eventId}`);
}
}