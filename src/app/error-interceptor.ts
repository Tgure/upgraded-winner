import {Injectable} from '@angular/core';
import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {catchError, map, Observable, retry, throwError, timer} from 'rxjs';

export const maxRetries = 5;
export const delayMs = 2000;

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request)
      .pipe(
        retry({count: maxRetries, delay: this.shouldRetry}),
        map((res: HttpEvent<any>) => {
          return res
        }),
        catchError((error: HttpErrorResponse) => {
          // Build error message
          let errorMsg = '';
          if (error?.error instanceof ErrorEvent) {
            errorMsg = `Error: ${error?.error?.message}`;
          } else {
            errorMsg = `Error Code: ${error?.status},  Message: ${error?.message}`;
          }
          return throwError(() => errorMsg);
        })
      )
  }

  shouldRetry(error: HttpErrorResponse) {
    // Server error retry
    if (error.status >= 500) {
      return timer(delayMs);
    }
    throw error;
  }
}
