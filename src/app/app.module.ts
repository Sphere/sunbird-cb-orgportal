import { FullscreenOverlayContainer, OverlayContainer } from '@angular/cdk/overlay'
import { APP_BASE_HREF, PlatformLocation } from '@angular/common'
import { HttpClientJsonpModule, HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http'
import { APP_INITIALIZER, Injectable, NgModule, ErrorHandler } from '@angular/core'
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button'
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card'
import { MAT_LEGACY_SNACK_BAR_DEFAULT_OPTIONS as MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/legacy-snack-bar'
import { MAT_LEGACY_PROGRESS_SPINNER_DEFAULT_OPTIONS as MAT_PROGRESS_SPINNER_DEFAULT_OPTIONS } from '@angular/material/legacy-progress-spinner'
import { MatDividerModule } from '@angular/material/divider'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatIconModule } from '@angular/material/icon'
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu'
import { MatLegacyProgressBarModule as MatProgressBarModule } from '@angular/material/legacy-progress-bar'
import { MatRippleModule } from '@angular/material/core'
import { MatLegacySliderModule as MatSliderModule } from '@angular/material/legacy-slider'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip'
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input'
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field'
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox'
import { MatNativeDateModule } from '@angular/material/core'
import { HammerModule } from '@angular/platform-browser'
import { MatSortModule } from '@angular/material/sort'
import { BrowserModule, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import {
  BtnFeatureModule, ErrorResolverModule, TourModule, WIDGET_REGISTERED_MODULES,
  WIDGET_REGISTRATION_CONFIG, PipeContentRoutePipe, StickyHeaderModule,
} from '@sunbird-cb/collection'
import { WidgetResolverModule } from '@sunbird-cb/resolver'
import { LoggerService, PipeSafeSanitizerModule } from '@sunbird-cb/utils'
import { SearchModule } from '@ws/app/src/public-api'
import 'hammerjs'
import { KeycloakAngularModule, KeycloakService } from 'keycloak-angular'
import { AppRoutingModule } from './app-routing.module'
import { InitService } from './services/init.service'
import { GlobalErrorHandlingService } from './services/global-error-handling.service'
// import { AppTocResolverService } from '@ws/app/src/lib/routes/app-toc/resolvers/app-toc-resolver.service'

import { RootComponent } from './component/root/root.component'
import { LoginComponent } from './component/login/login.component'
import { AppFooterComponent } from './component/app-footer/app-footer.component'
import { AppNavBarComponent } from './component/app-nav-bar/app-nav-bar.component'
import { AppPublicNavBarComponent } from './component/app-public-nav-bar/app-public-nav-bar.component'
import { DialogConfirmComponent } from './component/dialog-confirm/dialog-confirm.component'
import { InvalidUserComponent } from './component/invalid-user/invalid-user.component'
import { LoginRootComponent } from './component/login-root/login-root.component'
import { LoginRootDirective } from './component/login-root/login-root.directive'
import { TncRendererComponent } from './component/tnc-renderer/tnc-renderer.component'
import { MobileAppModule } from './routes/public/mobile-app/mobile-app.module'
import { PublicAboutModule } from './routes/public/public-about/public-about.module'
import { PublicLogoutModule } from './routes/public/public-logout/public-logout.module'
import { PublicContactModule } from './routes/public/public-contact/public-contact.module'
import { PublicFaqModule } from './routes/public/public-faq/public-faq.module'
import { TncComponent } from './routes/tnc/tnc.component'
import { AppInterceptorService } from './services/app-interceptor.service'
import { AppRetryInterceptorService } from './services/app-retry-interceptor.service'
import { TncAppResolverService } from './services/tnc-app-resolver.service'
import { TncPublicResolverService } from './services/tnc-public-resolver.service'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { ServiceWorkerModule } from '@angular/service-worker'
import { environment } from '../environments/environment'
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog'
import { HammerGestureConfig } from '@angular/platform-browser'
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs'
import { QuillModule } from 'ngx-quill'
@Injectable()
// export class HammerConfig extends GestureConfig {
//   buildHammer(element: HTMLElement) {
//     return new GestureConfig({ touchAction: 'pan-y' }).buildHammer(element)
//   }
// }

export class HammerConfig extends HammerGestureConfig {
  override overrides = {
    pan: { direction: 6 }, // Allow both horizontal and vertical
    swipe: { direction: 6 }, // Allow both horizontal and vertical
  }
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
  declarations: [
    RootComponent,
    TncComponent,
    LoginRootDirective,
    LoginComponent,
    AppNavBarComponent,
    AppPublicNavBarComponent,
    TncRendererComponent,
    AppFooterComponent,
    InvalidUserComponent,
    DialogConfirmComponent,
    LoginRootComponent,
  ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    BrowserModule,
    HttpClientModule,
    HttpClientJsonpModule,
    BrowserAnimationsModule,
    KeycloakAngularModule,
    AppRoutingModule,
    WIDGET_REGISTERED_MODULES,
    WidgetResolverModule.forRoot(WIDGET_REGISTRATION_CONFIG),
    StickyHeaderModule,
    ErrorResolverModule,
    // Material Imports
    MatSliderModule,
    MatButtonModule,
    MatCardModule,
    MatToolbarModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatProgressBarModule,
    MatExpansionModule,
    MatRippleModule,
    MatDialogModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatSelectModule,
    MatDatepickerModule,
    MatCheckboxModule,
    MatNativeDateModule,
    MatSortModule,
    SearchModule,
    BtnFeatureModule,
    PublicAboutModule,
    PublicLogoutModule,
    PublicContactModule,
    PublicFaqModule,
    MobileAppModule,
    PipeSafeSanitizerModule,
    TourModule,
    HammerModule,
    MatTabsModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
    QuillModule.forRoot({})
  ],
  exports: [
    TncComponent,
    MatDividerModule,
    DialogConfirmComponent
  ],
  bootstrap: [RootComponent],
  providers: [
    {
      provide: 'environment',
      useValue: environment,
    },
    {
      deps: [InitService, LoggerService],
      multi: true,
      provide: APP_INITIALIZER,
      useFactory: appInitializer,
    },
    {
      provide: MAT_SNACK_BAR_DEFAULT_OPTIONS,
      useValue: { duration: 5000 },
    },
    {
      provide: MAT_PROGRESS_SPINNER_DEFAULT_OPTIONS,
      useValue: {
        diameter: 55,
        strokeWidth: 4,
      },
    },
    { provide: HTTP_INTERCEPTORS, useClass: AppInterceptorService, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: AppRetryInterceptorService, multi: true },
    TncAppResolverService,
    TncPublicResolverService,
    PipeContentRoutePipe,
    // AppTocResolverService,
    {
      provide: APP_BASE_HREF,
      useFactory: getBaseHref,
      deps: [PlatformLocation],
    },
    { provide: OverlayContainer, useClass: FullscreenOverlayContainer },
    { provide: HAMMER_GESTURE_CONFIG, useClass: HammerConfig },
    { provide: ErrorHandler, useClass: GlobalErrorHandlingService },
    MatDatepickerModule, MatNativeDateModule,
    {
      provide: KeycloakService,
      useValue: new KeycloakService(),
    },
  ]
})
export class AppModule { }
