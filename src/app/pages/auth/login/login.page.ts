import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { ToastController } from '@ionic/angular';
import { AuthEvent } from '../../../services/feathers.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  public user = {
    email: '',
    password: ''
  };

  isLoading = false;

  constructor(public auth: AuthService,
    public toastController: ToastController) { }

  ngOnInit() {
  }

  async onSubmit() {
    this.isLoading = true;
    try {
      const res: AuthEvent = await this.auth.login(this.user.email, this.user.password);
      console.log(res);
      if (res.success === true) {

      } else {
        // lets display error
        this.presentToast(res.data.message);
      }
    } catch (err) {
      console.log(err);
    }

    this.isLoading = false;

  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000
    });
    toast.present();
  }

}
