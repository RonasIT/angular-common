import { NgModule, ModuleWithProviders } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ApiService } from './api.service';
import { ModuleConfig } from './config';
import { ContentTypeInterceptor } from './interceptors';

@NgModule({
  imports: [
    HttpClientModule
  ],
  providers: [
    ApiService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ContentTypeInterceptor,
      multi: true
    }
  ]
})
export class ApiModule {
  static forRoot(config: ModuleConfig): ModuleWithProviders<ApiModule> {
    return {
      ngModule: ApiModule,
      providers: [
        { provide: ModuleConfig, useValue: config }
      ]
    };
  }
}
