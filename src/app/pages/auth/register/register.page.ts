import { Component, OnInit } from '@angular/core';
import { AuthService, AuthEvent } from '../../../services/auth.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {

  isLoading = false;

  public user = {
    name: '',
    email: '',
    password: ''
  };


  constructor(public auth: AuthService,
    public toastController: ToastController) {

  }

  ngOnInit() {
  }

  async onSubmit() {
    this.isLoading = true;
    try {
      const res: AuthEvent = await this.auth.register(this.user);
      if (res.success === true) {
        // now lets login
        // this.presentToast('User created, now authenticating.');
        const loginRes = await this.auth.login(this.user.email,
          this.user.password);
        console.log('register page, login: ', loginRes);
      } else {
        // lets display error
        this.presentToast(res.data.message);
      }
    } catch (err) {
      console.log('register page ts, register, err', err);
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
