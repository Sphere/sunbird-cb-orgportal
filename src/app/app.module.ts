import { FullscreenOverlayContainer, OverlayContainer } from '@angular/cdk/overlay'
import { APP_BASE_HREF, PlatformLocation } from '@angular/common'
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi, withJsonpSupport } from '@angular/common/http'
import { APP_INITIALIZER, ApplicationRef, DoBootstrap, ErrorHandler, Injectable, NgModule, NO_ERRORS_SCHEMA } from '@angular/core'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MatNativeDateModule } from '@angular/material/core'
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar'
import { MAT_PROGRESS_SPINNER_DEFAULT_OPTIONS } from '@angular/material/progress-spinner'
import { BrowserModule, HAMMER_GESTURE_CONFIG, HammerGestureConfig, HammerModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { ServiceWorkerModule } from '@angular/service-worker'
import { WIDGET_REGISTERED_MODULES, WIDGET_REGISTRATION_CONFIG, PipeContentRoutePipe } from '@sunbird-cb/collection'
import { WidgetResolverModule } from '@sunbird-cb/resolver'
import { LoggerService, PipeSafeSanitizerModule } from '@sunbird-cb/utils'
import { SearchModule } from '@ws/app/src/public-api'
import 'hammerjs'
import { KeycloakAngularModule, KeycloakService } from 'keycloak-angular'
import { QuillModule } from 'ngx-quill'
import { environment } from '../environments/environment'
import { AppRoutingModule } from './app-routing.module'
import { AppShellModule } from './app-shell.module'
import { RootComponent } from './component/root/root.component'
import { GlobalErrorHandlingService } from './services/global-error-handling.service'
import { InitService } from './services/init.service'
import { AppInterceptorService } from './services/app-interceptor.service'
import { AppRetryInterceptorService } from './services/app-retry-interceptor.service'
import { CatalogResponseInterceptorService } from './services/catalog-response-interceptor.service'
import { TncAppResolverService } from './services/tnc-app-resolver.service'
import { TncPublicResolverService } from './services/tnc-public-resolver.service'
import { TncComponent } from './routes/tnc/tnc.component'
import { MobileAppModule } from './routes/public/mobile-app/mobile-app.module'
import { PublicAboutModule } from './routes/public/public-about/public-about.module'
import { PublicContactModule } from './routes/public/public-contact/public-contact.module'
import { PublicFaqModule } from './routes/public/public-faq/public-faq.module'
import { PublicLogoutModule } from './routes/public/public-logout/public-logout.module'

@Injectable()
export class HammerConfig extends HammerGestureConfig {
  override overrides = { pan: { direction: 6 }, swipe: { direction: 6 } }
}

const appInitializer = (initSvc: InitService, logger: LoggerService) => async () => {
  try {
    await initSvc.init()
  } catch (error) {
    logger.error('ERROR DURING APP INITIALIZATION >', error)
  }
}

const getBaseHref = (platformLocation: PlatformLocation): string => {
  return platformLocation.getBaseHrefFromDOM()
}

// tslint:disable-next-line: max-classes-per-file
@NgModule({
  declarations: [TncComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    KeycloakAngularModule,
    AppRoutingModule,
    WIDGET_REGISTERED_MODULES,
    WidgetResolverModule.forRoot(WIDGET_REGISTRATION_CONFIG),
    SearchModule,
    PublicAboutModule,
    PublicLogoutModule,
    PublicContactModule,
    PublicFaqModule,
    MobileAppModule,
    PipeSafeSanitizerModule,
    HammerModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
    QuillModule.forRoot({}),
    AppShellModule,
  ],
  // No bootstrap here — RootComponent is declared in AppShellModule (for clean AOT scope),
  // so JIT's decorator-time validation would reject it here. main.ts calls appRef.bootstrap()
  // manually after bootstrapModule() resolves, which bypasses that check.
  schemas: [NO_ERRORS_SCHEMA],
  providers: [
    provideHttpClient(withInterceptorsFromDi(), withJsonpSupport()),
    { provide: 'environment', useValue: environment },
    {
      deps: [InitService, LoggerService],
      multi: true,
      provide: APP_INITIALIZER,
      useFactory: appInitializer,
    },
    { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: { duration: 5000 } },
    {
      provide: MAT_PROGRESS_SPINNER_DEFAULT_OPTIONS,
      useValue: { diameter: 55, strokeWidth: 4 },
    },
    { provide: HTTP_INTERCEPTORS, useClass: AppInterceptorService, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: AppRetryInterceptorService, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: CatalogResponseInterceptorService, multi: true },
    TncAppResolverService,
    TncPublicResolverService,
    PipeContentRoutePipe,
    {
      provide: APP_BASE_HREF,
      useFactory: getBaseHref,
      deps: [PlatformLocation],
    },
    { provide: OverlayContainer, useClass: FullscreenOverlayContainer },
    { provide: HAMMER_GESTURE_CONFIG, useClass: HammerConfig },
    { provide: ErrorHandler, useClass: GlobalErrorHandlingService },
    MatDatepickerModule,
    MatNativeDateModule,
    { provide: KeycloakService, useValue: new KeycloakService() },
  ],
})
export class AppModule implements DoBootstrap {
  // Angular passes ApplicationRef directly — no constructor injection needed (avoids
  // circular: ApplicationRef → ApplicationInitStatus → APP_INITIALIZER → AppModule factory).
  ngDoBootstrap(appRef: ApplicationRef) {
    appRef.bootstrap(RootComponent)
  }
}
