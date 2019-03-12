import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardService {

  constructor(public auth: AuthService) { }

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {

    // return this.auth.loginJWT()
    //  .then(() => true)
    //  .catch(() => false);
    // return false;
     return this.auth.isAuthenticated;
  }
}
