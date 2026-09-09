import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import {
  SalesforceResponse
} from '../models/salesforce.model';

@Injectable({
  providedIn: 'root'
})
export class SalesforceService {

  private readonly apiUrl =
  `${environment.apiUrl}/api/salesforce`;

  constructor(private http: HttpClient) {}

 getRecords(
  objectName: string,
  offset: number = 0,
  limit: number = 20
): Observable<SalesforceResponse> {

  const params = new HttpParams()
    .set('offset', offset)
    .set('limit', limit);

  return this.http.get<SalesforceResponse>(
    `${this.apiUrl}/${objectName}`,
    {
      params,
      withCredentials: true
    }
  );
}

 deleteRecord(
  objectName: string,
  id: string
): Observable<void> {

  return this.http.delete<void>(
    `${this.apiUrl}/${objectName}/${id}`,
    {
      withCredentials: true
    }
  );
}

   createRecord(
    objectName: string,
    data: any
  ): Observable<any> {

    return this.http.post(
      `${this.apiUrl}/${objectName}`,
      data,
      {
        withCredentials: true
      }
    );
  }

  updateRecord(
    objectName: string,
    id: string,
    data: any
  ): Observable<void> {

    return this.http.patch<void>(
      `${this.apiUrl}/${objectName}/${id}`,
      data,
      {
        withCredentials: true
      }
    );
  }

 isLoggedIn(): Observable<boolean> {
  return this.http.get<boolean>(
  `${environment.apiUrl}/api/auth/status`,
  { withCredentials: true }
);
}
}