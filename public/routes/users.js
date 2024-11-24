/**
Name of Program: user.js
Description: User routes for the app
Inputs: None
Outputs: None
Author: Zach Alwin, Kristin Boeckmann, Lisa Phan, Nicholas Hausler, Vinayak Jha
Creation Date: 10/27/2024
 */
// Importing required libraries and dependencies
const express = require('express'); // Import express
const router = express.Router(); // Setup router
const User = require('../../models/User'); // Get the user
const bcrypt = require('bcryptjs'); // Setup bcrypt
const passport = require('passport'); // Setup passwprd
const { rawListeners } = require('../../models/User'); // Setup raw listeners
const { assert } = require('console'); // Setup assert

// Handle the /register route
router.get('/register', (req, res)=>{
    // render the register page
    res.render("register");
})

// Handle the main login route
router.get('/login', (req, res)=>{
    // render the login page
    res.render("login");
})

// Handle the register route
router.post('/register', (req, res)=>{
    const name = req.body.userName; // Get the usernmae
    const email = req.body.userEmail; // Get the email
    const password = req.body.userPassword; // Get the password
    const password2 = req.body.userPassword2; // Get the "password again"
    const errors = []; // Initialize errors
    if (!name || !email || !password || !password2){
        // If any of these fields are empty, emit this error
        errors.push({msg: "Please Fill out all the required fields"});
    }
    if (password !== password2){
        // If passwords don't match, emit this error
        errors.push({msg: "Passwords do not match. Try Again"});
    }
    if (password.length < 6){
        // If the password is too short, emit this error
        errors.push({msg: "The password should be atleast 6 characters long"});
    }
    if (errors.length > 0){
        // If any errors are found, render the register
        res.render('register', {errors, name, email, password, password2});
    }else{
        // Try searching for the user with the email
        User.findOne({email: email})
            .then(user=>{
                if(user){
                    // If user is found, render the register page with already used error
                    errors.push({msg: "Email is already registered"});
                    res.render('register', {errors, name, email, password, password2});
                }else{
                    // Initialize a new user
                    const newUser = new User({
                        name: name, // Initialize name
                        email: email, // Initialize email
                        password: password, // Initialize password
                    });
                    bcrypt.genSalt(10, (err, salt)=>{
                        // Generate the salt
                        bcrypt.hash(newUser.password, salt, (err, hash)=>{
                            // Hash users password
                            if(err) throw err; // Crash if error
                            newUser.password = hash; // Save the password
                            newUser.save()
                                .then(user=>{
                                    // Post save, redirect to login
                                    req.flash('success_msg', 'You are now registered, and can login');
                                    res.redirect('/users/login');
                                })
                                .catch(err => console.log(err));
                        })
                    });
                }
            })
    } 
})

// Check if post to login
router.post('/login', (req, res, next)=>{
    // Authenticate the user
    passport.authenticate('local', {
        // On success, redirect to dashboard
        successRedirect: '/dashboard',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);
})

// Handle the change name route
router.post('/change_name', (req, res)=>{
    console.log("asking to change", req.body.name);
    // Trim the name
    let parsed = req.body.name.trim();
    User.findByIdAndUpdate(
        // Find the user by id
        req.user._id,
        {$set: {
            // Save the name
            "name": parsed
        }}
    ).then(()=>{
        // Logout the user
        req.logout();
        req.flash("success_msg", "Name changed. Please login");
        // Redirect to login
        res.redirect("/users/login");
    })

});

// Handle the change password get
router.get("/change_password", (req, res)=>{
    // Render the change password
    res.render("change_password")
});

// Handle the change password post
router.post('/change_password', (req, res)=>{
    console.log('requesting to change password!');
    const email = req.body.userEmail; // Get the usernmae
    const password = req.body.userPassword; // Get the password
    const password2 = req.body.userPassword2; // Get the "password again"
    const errors = [];  // Initialize errors
    if (!email || !password || !password2){
        // If any of these fields are empty, emit this error
        errors.push({msg: "Please Fill out all the required fields"});
    }
    if (password !== password2){
        // If passwords don't match, emit this error
        errors.push({msg: "Passwords do not match. Try Again"});
    }
    if (password.length < 6){
        // If the password is too short, emit this error
        errors.push({msg: "The password should be atleast 6 characters long"});
    }
    if (errors.length > 0){
        // If any errors are found, render the register
        res.render('change_password', {errors, email, password, password2});
        return;
    }
    User.findOne({email: email}).then((user)=>{
        if (user){
            // Find the user by email
            console.log('user found for password change!', email);
            bcrypt.genSalt(10, (err, salt)=>{
                // Generate the salt
                bcrypt.hash(password, salt, (err, hash)=>{
                    // Hash users password
                    if (err) throw err;  // Crash if error
                    user.password = hash;
                    user.save().then((user)=>{
                         // Post save, redirect to login
                        req.flash("success_msg", "Your password has been changed!");
                        res.redirect('/users/login');
                    }).catch(console.log)
                })
            })
        }else{
            // If email wasn't found, emit this error.
            errors.push({msg: "Email not found in registry"});
            res.render('change_password', {errors, email, password, password2});
        }
    })
});

// Handle the logout
router.get('/logout', (req, res)=>{
    // Logout the user
    req.logout();
    req.flash('success_msg', 'You are logged out');
    // Redirect to login
    res.redirect('/users/login');
})
module.exports = router;