import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {RouteReuseStrategy} from '@angular/router';

import {IonicModule, IonicRouteStrategy} from '@ionic/angular';

import {AppComponent} from './app.component';
import {AppRoutingModule} from './app-routing.module';
import {initializeApp, provideFirebaseApp} from '@angular/fire/app';
import {environment} from '../environments/environment';
import {getAnalytics, provideAnalytics, ScreenTrackingService, UserTrackingService} from '@angular/fire/analytics';
import {getAuth, provideAuth} from '@angular/fire/auth';
import {getDatabase, provideDatabase} from '@angular/fire/database';
import {getFirestore, provideFirestore} from '@angular/fire/firestore';
import {getFunctions, provideFunctions} from '@angular/fire/functions';
import {getMessaging, provideMessaging} from '@angular/fire/messaging';
import {getPerformance, providePerformance} from '@angular/fire/performance';
import {getRemoteConfig, provideRemoteConfig} from '@angular/fire/remote-config';
import {getStorage, provideStorage} from '@angular/fire/storage';
import {HTTP_INTERCEPTORS, HttpClientModule} from "@angular/common/http";
import {GameListComponent} from "./game-list/game-list.component";
import {ErrorInterceptor} from "./error-interceptor";

@NgModule({
  declarations: [AppComponent, GameListComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAnalytics(() => getAnalytics()), provideAuth(() => getAuth()), provideDatabase(() => getDatabase()),
    provideFirestore(() => getFirestore()), provideFunctions(() => getFunctions()),
    provideMessaging(() => getMessaging()), providePerformance(() => getPerformance()),
    provideRemoteConfig(() => getRemoteConfig()), provideStorage(() => getStorage()),
    HttpClientModule
  ],
  providers: [
    {provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true},
    {provide: RouteReuseStrategy, useClass: IonicRouteStrategy},
    ScreenTrackingService,
    UserTrackingService,
    ErrorInterceptor
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
}
