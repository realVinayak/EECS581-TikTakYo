/**
Name of Program: index.js
Description: Index routing for the program
Inputs: None
Outputs: None
Author: Zach Alwin, Kristin Boeckmann, Lisa Phan, Nicholas Hausler, Vinayak Jha
Creation Date: 10/27/2024
 */


// Import modules
const express = require('express'); // Import express
const router = express.Router(); // Get router
const {ensureAuthenticated} = require('../../config/auth'); // Import function

const User = require("../../models/User"); // Import user module

// Handle index page routing
router.get('/', (req, res)=>{
    // Render welcome page
    res.render('welcome');
});

// Handle dashboard routing
router.get('/dashboard', ensureAuthenticated, (req, res)=>{
    // Render dashboard
    res.render('dashboard', {user: req.user});
    console.log('Here is the User req.user that you wanted', req.user);
});

// Handle message room routing
router.get('/message_room', ensureAuthenticated, (req, res)=>{
    // Render message room
    res.render('message_room', {user: req.user});
});

// Handle play station routing
router.get('/play_station', ensureAuthenticated, (req, res)=>{
    // Render play station
    res.render('play_station', {user: req.user});
})

// Handle live play station
router.post('/play_station/live', ensureAuthenticated, (req, res)=>{
    // Render play station, with true live argument
    res.render('play_station_lorc', {user:req.user, isLive: true});
});

// Handle live play station
router.post('/play_station/computer', ensureAuthenticated, (req, res)=>{
    // Render play station, with false live argument
    res.render('play_station_lorc', {user:req.user, isLive: false});
});

// Handle leaderboard ranking
router.get('/leaderboard', (req, res)=>{
    // Fetch the objects
    User.find({}, {won_count: 1, name:2}).then((result)=>{
        console.log(result);
        // Create a copy for performance
        let cloned = result.map((some)=>({name: some.name, won_count: some.won_count}));
        // Sort the array in descending order of the number of games won
        cloned.sort((a, b)=>a.won_count < b.won_count ? 1 : a.won_count > b.won_count ? -1 : 0);
        // Trim up the values
        cloned = cloned.map((value)=>({...value, name: value.name.trim()}))
        console.log(cloned);
        // Render the leaderboard with sorted.
        res.render("leaderboard", {user:req.user, names:cloned});
    });
});


router.get('/search', (req, res)=>{
    // render a simple one.
    res.render('search', {user: req.user});
});

module.exports = router;