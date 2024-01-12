import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
interface Point {
  latitude: number;
  longitude: number;
}
@Injectable({
  providedIn: 'root'
})

export class StaticPointsService {
  constructor(private http: HttpClient) {}

  getStaticPoints(): Observable<any[]> {
    return this.http.get<any[]>('../assets/staticPoints.json');
  }
}
