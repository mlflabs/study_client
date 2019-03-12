import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { IonicStorageModule } from '@ionic/storage';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { EditEventPage } from './pages/edit-event/edit-event.page';
import { HttpClientModule} from '@angular/common/http';
import { AuthGuardService } from './auth/auth-guard.service';
import { AuthService } from './auth/auth.service';
import { DataService } from './services/data.service';
import { FileDropModule } from 'ngx-file-drop';
import { UploadPage } from './pages/file/upload/upload.page';
import { ImagesPage } from './pages/file/images/images.page';
import { ProjectEditPage } from './pages/project-edit/project-edit.page';
import { SelectImageModalPage } from './pages/file/select-image-modal/select-image-modal.page';
import { DisplayImagePage } from './pages/file/display-image/display-image.page';
import { ProjectsPage } from './pages/projects/projects.page';
import { ProjectPage } from './pages/project/project.page';

@NgModule({
  declarations: [
    AppComponent,
    EditEventPage,
    UploadPage, 
    ProjectEditPage,
    SelectImageModalPage,
    DisplayImagePage,
    ProjectsPage,
    ProjectPage,
    ImagesPage],
  entryComponents: [ProjectsPage,
                    ProjectPage,
                    EditEventPage, 
                    UploadPage, 
                    ImagesPage, 
                    ProjectEditPage, 
                    DisplayImagePage, 
                    SelectImageModalPage],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    FormsModule,
    FileDropModule,
    HttpClientModule,
    IonicStorageModule.forRoot(),
    // ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
  ],
  providers: [
    StatusBar,
    SplashScreen,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    AuthGuardService,
    AuthService,
    DataService,
  ], 
  bootstrap: [AppComponent]
})
export class AppModule {}
