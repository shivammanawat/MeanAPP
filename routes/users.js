const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const config = require('../config/database');
const User = require('../models/user');
const nodemailer=require('nodemailer');
const crypto=require('crypto');
const path = require("path");
const bcrypt = require('bcryptjs');

require('dotenv').config();

if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./myid');
}

// Register
router.post('/register', (req, res, next) => {
  const today = new Date()
  const token = crypto.randomBytes(20).toString('hex');
  let newUser = new User({
    name: req.body.name,
    email: req.body.email,
    username: req.body.username,
    password: req.body.password,
    token:token,
    active: false,
    resetPasswordToken: '',
    resetPasswordExpires: '',
    created: today
  });

  const msg = `
    <p>You have a SignUp Request</p>
    <h3>Contact Details</h3>
    <ul>  
      <li>Email: ${req.body.email} </li>
    </ul>
    <h3>Message</h3>
 <a href="http://localhost:8080/users/verifyuser/${token}/${req.body.email}"><button class="btn btn-success">activate</a> 
  `;

  let transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS   },
    tls:{
      rejectUnauthorized:false
    }
  });

 
let mailOptions = {
  from: '"MEAN APP BY SHIVAM" process.env.GMAIL_USER',
  to: req.body.email,
  subject: 'Account Confirmation Email!',
  text: 'Confirm your email',
  html: msg
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
      return console.log(error);
  }
  console.log('Message sent: %s', info.messageId);
 
});
console.log("mail sent");

  User.addUser(newUser, (err, user) => {
    console.log(user);
    if(err){
      res.json({success: false, msg:'Failed to register user'});
    } else {
      res.json({success: true, msg:'User registered'});
    }
  });
});


router.get('/verifyuser/:token/:email', (req, res) => {
  User.findOne({
      email: req.params.email,
  }).then(user => {
      if(user.token === req.params.token)
      {
              console.log(user.active);
              user.active = true;
              console.log(user.active);
              user.save().then(check => {
                res.sendFile(path.join(__dirname, '../verifyemail', 'verify.html'));
              })
      }
      else{
          res.send("error");
      }
  })

});


// Authenticate
router.post('/authenticate', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  User.getUserByUsername(username, (err, user) => {
    if(err) throw err;
    if(!user){
      return res.json({success: false, msg: 'User not found'});
    }
    if(!user.active)
    {
      return res.json({success: false, msg: 'User not active'});
    }
    console.log(user);
    User.comparePassword(password, user.password, (err, isMatch) => {
      // console.log(password);
      // console.log(user.password);
      if(err) throw err;
      if(isMatch){
        const token = jwt.sign(user.toJSON(), config.secret, {
          expiresIn: 604800 // 1 week
        });

        res.json({
          success: true,
          token: 'JWT '+token,
          user: {
            id: user._id,
            name: user.name,
            username: user.username,
            email: user.email
          }
        });
      } else {
        return res.json({success: false, msg: 'Wrong password'});
      }
    });
  });
});


// Profile
router.get('/profile', passport.authenticate('jwt', {session:false}), (req, res) => {
  res.json({user: req.user});
});

router.post('/forgotpassword', (req, res) => {
  if (req.body.email === '') {
    return res.json({success: false, msg: 'email required'});
  }
  console.log(req.body.email);
  User.findOne({
      email: req.body.email
  })
  .then(user => {
    if (user === null) {
      return res.json({success: false, msg: 'email not in db'});
    } 
    else {
      const token = crypto.randomBytes(20).toString('hex');
      
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 604800;

              user.save();

        

          const output  = `
          <p>You have a Password Reset Request</p>
          <h3>Contact Details</h3>
          <ul>  
            <li>Email: ${req.body.email} </li>
          </ul>
          <h3>Message</h3>
       <a href="http://localhost:8080/users/resetconfirmation/${token}/${req.body.email}"><button class="btn btn-success">Reset Password</a> 
        `;

          let transporter = nodemailer.createTransport({
              service: 'Gmail',
              auth: {
                  user: process.env.GMAIL_USER,
                  pass: process.env.GMAIL_PASS
              },
              tls:{
                  rejectUnauthorized:false
          }
          });

          let mailOptions = {
              from: '"Mean APP"  process.env.GMAIL_USER',
              to: req.body.email,
              subject: 'Reset Email!',
              text: 'This is Reset Email.',
              html: output
          };

          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            console.log('Message sent: %s', info.messageId);
            return res.json({success: true, msg: 'message sent'});
          });

         
    }
  })
  .catch(err => {
      res.send('error: ' + err) 
  })
});

//forgot password ends

//reset confirmation
router.get('/resetconfirmation/:token/:email', (req, res, next) => {

  User.findOne({
      email: req.params.email,
  }).then(user => {
      if(Date.now() > user.resetPasswordExpires)
      {
          res.send("Reset Link Expired");
      }
      else{
          if(user.resetPasswordToken === req.params.token)
          {
        
            localStorage.setItem('email1',req.params.email);
            res.sendFile(path.join(__dirname, '../verifypass', 'index1.html'));
                   
          }
          else{
              res.send("error");
          }
      }
  })
});


// password reset
router.put('/resetpassword', (req, res, next) => {
  var email1 =  localStorage.getItem('email1');
  console.log("email - " + email1);
  User.findOne({
      email: email1
  }).then(user => {
    if (user != null)
     {
      // console.log(req.body.password);
      // console.log(user.password);
      console.log('user exists in db');
      bcrypt.genSalt(9, (err, salt)  =>  {
        if(err) throw err;
        bcrypt.hash(req.body.password, salt, (err, hash) => {
            if(err) throw err;
            // console.log("new pass : " + hash)
            user.password = hash;
            user.resetPasswordToken = null;
            user.resetPasswordExpires = null;
            res.json({success: true, msg: 'Password Changed Succesfully'});
            user.save();
        });
             });
    }
     else {
      res.json({success: false, msg: 'No user with this email'});
        }
  });
});

module.exports = router;



