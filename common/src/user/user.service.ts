import { AbstractUser, UserPasswords } from './models';
import { ApiService } from '../api';
import { BehaviorSubject, Observable } from 'rxjs';
import { classToPlain, ClassTransformOptions, plainToClass } from 'class-transformer';
import { Injectable } from '@angular/core';
import { map, tap } from 'rxjs/operators';
import { UserConfig } from './config';

@Injectable()
export class UserService<User extends AbstractUser> {
  public get profile$(): Observable<User> {
    return this._profile$;
  }

  protected _profile$: Observable<User>;

  protected profileSubject: BehaviorSubject<User>;

  constructor(
    protected apiService: ApiService,
    protected config: UserConfig
  ) {
    this.profileSubject = new BehaviorSubject(null);
    this._profile$ = this.profileSubject.asObservable();
  }

  public refreshProfile(): Observable<User> {
    return this.loadProfile()
      .pipe(
        tap((profile) => this.setProfile(profile))
      );
  }

  public loadProfile(): Observable<User> {
    return this.apiService
      .get('/profile')
      .pipe(
        map((profile) => this.plainToUser(profile, { groups: ['main'] }))
      );
  }

  public updateProfile(user: User): Observable<void> {
    return this.apiService
      .put('/profile', this.userToPlain(user, { groups: ['update'] }))
      .pipe(
        tap(() => this.setProfile(user))
      );
  }

  public updatePassword(userPasswords: UserPasswords): Observable<void> {
    return this.apiService.put('/profile', classToPlain(userPasswords));
  }

  public setProfile(user: User): void {
    this.profileSubject.next(user);
  }

  public patchProfile(user: Partial<User>): void {
    if (this.profileSubject.value) {
      this.profileSubject.next(this.plainToUser({
        ...this.userToPlain(this.profileSubject.value, { groups: ['main'] }),
        ...user
      }, { groups: ['main'] }));
    }
  }

  public resetProfile(): void {
    this.profileSubject.next(null);
  }

  public userToPlain(user: User, options?: ClassTransformOptions): Object {
    return classToPlain(user, options);
  }

  public plainToUser(plain: Object, options?: ClassTransformOptions): User {
    return plainToClass(this.config.userModel as any, plain, options);
  }
}