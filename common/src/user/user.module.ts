import { UserService } from './user.service';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { UserConfig } from './config';

@NgModule()
export class UserModule {
  static forRoot(config: UserConfig): ModuleWithProviders<UserModule> {
    return {
      ngModule: UserModule,
      providers: [
        { provide: UserConfig, useValue: config },
        { provide: UserService, useExisting: config.userService }
      ]
    };
  }
}
