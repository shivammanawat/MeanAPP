import { Component, OnInit } from '@angular/core';
import {ValidateService} from '../../services/validate.service'
import {AuthService} from '../../services/auth.service';
import {Router} from '@angular/router';
import {FlashMessagesService} from 'angular2-flash-messages';
@Component({
  selector: 'app-resetpassword',
  templateUrl: './resetpassword.component.html',
  styleUrls: ['./resetpassword.component.css']
})
export class ResetpasswordComponent implements OnInit {

  password:String;


  constructor(   private validateService: ValidateService,
    private flashMessage:FlashMessagesService,
    private authService:AuthService,
    private router: Router
    ) { }


  ngOnInit() {
  }
  onPasswordChange()
  {
    const user = {
      password: this.password,
    }

    
    this.authService.changepass(user).subscribe(data => {
      if(data.success){
        this.flashMessage.show('password succesfully changed', {
          cssClass: 'alert-success',
          timeout: 3000});
          this.router.navigate(['/login']);
      } else {
        this.flashMessage.show('password not updated', {
          cssClass: 'alert-danger',
          timeout: 3000});
          this.router.navigate(['/resetpassword']);
      }
    });
  }
}
