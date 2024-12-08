
/**
Name of Program: dashboard_script.js
Description: Script that gets loaded for dashboard functionality
Inputs: None
Outputs: None
Author: Zach Alwin, Kristin Boeckmann, Lisa Phan, Nicholas Hausler, Vinayak Jha
Creation Date: 10/27/2024
 */
const socket = io();
let glob_is_userOnline = false;
let glob_user_show_stat = 0;
let glob_your_post_index = 0;
let glob_your_feed_index = 0;
let glob_liked_posts_index = 0;
let current_post_shown = 0;
let glob_is_post_liked = 0;
let glob_user_viewing = userId;
socket.on('connect', ()=>{
    // Make the user online
    socket.emit('makeUserOnline', userId);
})
socket.on('disconnect', ()=>{
    // Make the user offline
    socket.emit('makeUserOffline', userId);
})

socket.on('userMadeOnline', (msg)=>{
    // A handshake between the user and the server
    glob_is_userOnline = true;
})
document.querySelector('.user-posts-but').style.backgroundColor = "rgba(0, 0, 0, 0.2)";
// Get the game count;
socket.emit('get-user-game-count', userId);
// On receiving the game count, update the statistics
socket.on('post-user-game-count', (game_count_obj)=>{
    // Number of wins
    let won_count = game_count_obj.win;
    // Number of losses
    let lost_count = game_count_obj.lost;
    // Number of draws
    let draw_count = game_count_obj.draw;
    // Number of total games
    let tot_count = game_count_obj.tot_games;
    // Update the win count HTML
    document.querySelector('.w-val').innerHTML = `${won_count}&nbsp;`;
    // Update the loss count HTML
    document.querySelector('.l-val').innerHTML = `&nbsp;${lost_count}&nbsp;`;
    // Update the draw count HTML
    document.querySelector('.d-val').innerHTML = `&nbsp;${draw_count}`;
    // Update the number of games count HTML
    document.querySelector('.num-games-val').innerHTML = `${tot_count}`;
})
// Get the user notification count
socket.emit('get-user-notif-count', userId);
socket.on('post-user-notif-count', (notif_count)=>{
    // Update the notification count
    document.querySelector('.bdg-but-2').innerHTML = `Notifications: ${notif_count}`;
})
document.querySelector('.bdg-but-2').addEventListener('click', ()=>{
    // Add event listener for getting the notifications
    socket.emit('get-notif-array', userId);
});
// On getting the notifications, show the notifications overlay
socket.on('post-notif-array', (notif_array)=>{
    // notification's innerHTML
    let str_notif = '';
    if(notif_array){
        // Iterate through each notification and append it to the innerHTML
        for (let counter = 0; counter < notif_array.length; counter++){
            str_notif += `<div class="notif-div">${notif_array[counter]}</div>`
        }
    }
    // Update the inner HTML
    document.querySelector('.notif-panel-content').innerHTML = str_notif;
    document.querySelector('.notif-overlay').style.display = "block";
    document.getElementById('notif-close').addEventListener('click', ()=>{
        document.querySelector('.notif-overlay').style.display = "none";
    })
});

// Name: showPostForm
// Author: Vinayak Jha
// Date: 10/27/2024
// Preconditions: None
// Postconditions: No output. Has the side-effect of showing the post form
function showPostForm(){
    // Edit the display style to display the overlay
    document.querySelector('.postFormOverlay').style.display = "block";
}

// Name: hidePostForm
// Author: Vinayak Jha
// Date: 10/27/2024
// Preconditions: None
// Postconditions: No output. Has the side-effect of hiding the post form
function hidePostForm(){
    // Edit the display style to hide the overlay
    document.querySelector('.postFormOverlay').style.display = "none";
}

// Name: addPost
// Author: Vinayak Jha
// Date: 10/27/2024
// Preconditions: None
// Postconditions: No output. Has the side-effect of "posting the post" to the backend
function addPost(){
    // Get the post title
    let post_title = document.getElementById('_postTitle').value;
    // Get the post content
    let post_content = document.getElementById('_postContent').value;
    // Assign userID
    let user_id = userId;
    // Define the post object
    let post_obj = {"user_post_title": post_title, "user_post_content": post_content, "user_id": user_id};
    // Send the post to the backend
    socket.emit('user-post-request', post_obj);
    // Hide the post form overlay
    document.querySelector('.postFormOverlay').style.display = "none";
}

// Add the event listener for showing the form
document.querySelector('.add-button').addEventListener('click', showPostForm);

// Add the event listener for hiding the form
document.getElementById('cancelBut').addEventListener('click', hidePostForm);

// Add the event listener for adding the post form
document.getElementById('postBut').addEventListener('click', addPost);

// Add the event listener for sliding to the left
document.querySelector('.prev-button').addEventListener('click', ()=>{showPost(-1)});

// Add the event listener for sliding to the right
document.querySelector('.next-button').addEventListener('click', ()=>{showPost(+1)});

// Add the event listener for showing user's posts
document.querySelector('.user-posts-but').addEventListener('click', activateUserPost);

// Add the event listener for showing the feed
document.querySelector('.feed-but').addEventListener('click', activateFeedPost)

// Add the event listener for showing the liked posts
document.querySelector('.liked-posts-but').addEventListener('click', activateLikedPost)

// Name: activateUserPost
// Author: Vinayak Jha
// Date: 10/27/2024
// Preconditions: None
// Postconditions: No output. Has the side-effect of switching to the user posts panel
function activateUserPost(){
    // Update the user post button style to a value
    document.querySelector('.user-posts-but').style.backgroundColor = "rgba(0,0,0,0.2)";
    // Disable feed button value
    document.querySelector('.feed-but').style.backgroundColor = "rgba(0,0,0,0)";
    // Disable liked post button
    document.querySelector('.liked-posts-but').style.backgroundColor = "rgba(0,0,0,0)";
    // The type of post currently active
    glob_user_show_stat = 0;
    // Show the 0th post
    showPost(0);
}

// Name: activateFeedPost
// Author: Vinayak Jha
// Date: 10/27/2024
// Preconditions: None
// Postconditions: No output. Has the side-effect of switching to the feed post panel
function activateFeedPost(){
    // Update the user post button style to a value
    document.querySelector('.user-posts-but').style.backgroundColor = "rgba(0,0,0,0.0)";
    // Disable feed button value
    document.querySelector('.feed-but').style.backgroundColor = "rgba(0,0,0,0.2)";
    // Disable liked post button
    document.querySelector('.liked-posts-but').style.backgroundColor = "rgba(0,0,0,0)";
    // The type of post currently active
    glob_user_show_stat = 1;
    // Show the 0th post
    showPost(0);
}

// Name: activateLikedPost
// Author: Vinayak Jha
// Date: 10/27/2024
// Preconditions: None
// Postconditions: No output. Has the side-effect of switching to the like post panel
function activateLikedPost(){
    // Update the user post button style to a value
    document.querySelector('.liked-posts-but').style.backgroundColor = "rgba(0,0,0,0.2)";
    // Disable feed button value
    document.querySelector('.user-posts-but').style.backgroundColor = "rgba(0,0,0,0.0)";
    // Disable liked post button
    document.querySelector('.feed-but').style.backgroundColor = "rgba(0,0,0,0)";
    // The type of post currently active
    glob_user_show_stat = 2;
    // Show the 0th post
    showPost(0);
}

// Name: showPost
// Author: Vinayak Jha
// Date: 10/27/2024
// Preconditions: relative index of the post (as an integer)
// Postconditions: No output. Has the side-effect of getting a particular post
function showPost(indexer){
    // Set the background color to a random color
    document.querySelector('.feed-container').style.backgroundColor = getRandomColor();
    // Construct a string for getting the post from the backend
    let string_for_post;
    if (glob_user_show_stat === 0){
        // Get the user post to show at a given index
        glob_your_post_index = Math.max(glob_your_post_index + indexer, 0);
        // Set the string for getting a post
        string_for_post = `${glob_user_show_stat}--|--${glob_your_post_index}`;
    }else if(glob_user_show_stat === 1){
        // Get the feed post to show at a given index
        glob_your_feed_index = Math.max(glob_your_feed_index + indexer, 0);
        // Set the string for getting a post
        string_for_post = `${glob_user_show_stat}--|--${glob_your_feed_index}`;
    }else{
        // Get the user post to show at a given index
        glob_liked_posts_index = Math.max(glob_liked_posts_index + indexer, 0);
        // Set the string for getting a post
        string_for_post = `${glob_user_show_stat}--|--${glob_liked_posts_index}`;
    }
    // Emit the post request
    socket.emit('get-post-request', string_for_post);
}

// Name: showPost
// Author: Vinayak Jha
// Date: 10/27/2024
// Preconditions:
//      poster_name_s (Poster Name - string), 
//      post_title_s (Post Title - string)
//      post_content_s (Post Content - string)
//      post_date_s (Post Date - string)
//      is_liked (Post is liked by the current user - boolean)
//      like_count (Number of likes - int)
//      post_id_s (Post ID - int)
// Postconditions: No output. Has the side-effect of getting a particular post and displaying in the UI
function displayPost(poster_name_s, post_title_s, post_content_s, post_date_s, is_liked, like_count, post_id_s){
    // Get the poster ID
    let poster_id = post_id_s.split('***')[0];
    // Show the meta
    document.querySelector('.meta-info').innerHTML = `<span class="post-profile-show" id="${poster_id}">${poster_name_s}</span>` + ' ' + post_date_s;
    // Show the post title
    document.querySelector('.post-title').innerHTML = post_title_s;
    // Show the post content
    document.querySelector('.post-content').innerHTML = post_content_s;
    // Make the like post button visible
    document.getElementById('like_post').style.visibility = "visible"
    if(is_liked){
        // if the post is liked set the button to say "Dislike post"
        document.getElementById('like_post').innerHTML = `Dislike ${like_count}`;
        // Set the global indicator of liked post
        glob_is_post_liked = true;
    }else{
        // if the post is not liked, show button for liking the post
        document.getElementById('like_post').innerHTML = `Like ${like_count}`;
        // Set the global indiciator of liked post
        glob_is_post_liked = false;
    }
    // Add the event listener
    addEL(userId);
}

/**
Name: addEL
Author: Vinayak Jha
Date: 10/27/2024
Preconditions: userId - User's ID
Postconditions: No output. When the profile is opened, this user is shown in the profile. Sets up an event listener
**/
function addEL(userId){
    // Get the span
    const span_ = document.querySelector('.post-profile-show');
    // Add the event listener
    span_.addEventListener('click', ()=>{
        showProfile(span_.id, userId);
        glob_user_viewing = span_.id;
    })
}

/**
Name: displayNoPosts
Author: Vinayak Jha
Date: 10/27/2024
Preconditions: None
Postconditions: No output. Has the side-effect of showing initial condition of no posts
**/
function displayNoPosts(){
    // Clear out meta info
    document.querySelector('.meta-info').innerHTML = '';
    // Clear out post title
    document.querySelector('.post-title').innerHTML = '';
    // Clear out post content
    document.querySelector('.post-content').innerHTML = 'You have no posts here!';
    // Make the like button hiddem
    document.getElementById('like_post').style.visibility = "hidden"
}
socket.on('post-request-reply', (reply)=>{
    // Handle post request reply
    if (reply === 'LEN0'){
        // If no posts, show no posts
        displayNoPosts();
    }else{
        // Get the meta attributes
        let post_server = reply.post_;
        let is_liked = reply.is_liked;
        let type_ = reply.type_
        // Display the post
        displayPost(post_server.poster_name_u, post_server.title_u, post_server.content_u, post_server.date_u, is_liked, post_server.like_count, post_server.post_id_u);
        current_post_shown = post_server.post_id_u;
}
})

/**
Name: getRandomColor
Author: Vinayak Jha
Date: 10/27/2024
Preconditions: None
Postconditions: Returns a string of a random color
**/
function getRandomColor() {
    // These colors look nice
    var letters = 'BCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        // Construct the color string
        color += letters[Math.floor(Math.random() * letters.length)];
    }
    return color;
}

// Add an event listener on like post button so that backend can update the like count
document.getElementById('like_post').addEventListener('click', ()=>{
    if (current_post_shown != 0){
        // If current post is something, handle the event
        socket.emit('change_post_liked_stat', {"is_liked": glob_is_post_liked, "post_id": current_post_shown})
        // Set the global is post liked variable
        glob_is_post_liked = !(glob_is_post_liked);
    }
});

// If backend confirms post change, show the current post
socket.on('like-changed', ()=>{
    // Show the post at id=0
    showPost(0);
})

// Add an event lister for handling hover and highlight (mouse enter) for the user post button
document.querySelector('.user-posts-but').addEventListener('mouseenter', ()=>{
    if (!(glob_user_show_stat === 0)){
        // Change the color on mouse enter
        document.querySelector('.user-posts-but').style.backgroundColor = "rgba(0, 0, 0, 0.2)";
    }
});

// Add an event lister for handling hover and highlight (mouse leave) for the user post button
document.querySelector('.user-posts-but').addEventListener('mouseleave', ()=>{
    if (!(glob_user_show_stat === 0)){
        // Change the color on mouse leave
        document.querySelector('.user-posts-but').style.backgroundColor = "rgba(0, 0, 0, 0)";
    }
});

// Add an event lister for handling hover and highlight (mouse enter) for the feed post button
document.querySelector('.feed-but').addEventListener('mouseenter', ()=>{
    if (!(glob_user_show_stat === 1)){
        // Change the color on mouse leave
        document.querySelector('.feed-but').style.backgroundColor = "rgba(0, 0, 0, 0.2)";
    }
})

// Add an event lister for handling hover and highlight (mouse leave) for the feed post button
document.querySelector('.feed-but').addEventListener('mouseleave', ()=>{
    if (!(glob_user_show_stat === 1)){
        // Change the color on mouse leave
        document.querySelector('.feed-but').style.backgroundColor = "rgba(0, 0, 0, 0)";
    }
})

// Add an event lister for handling hover and highlight (mouse enter) for the liked post button
document.querySelector('.liked-posts-but').addEventListener('mouseenter', ()=>{
    if (!(glob_user_show_stat === 2)){
        // Change the color on mouse leave
        document.querySelector('.liked-posts-but').style.backgroundColor = "rgba(0, 0, 0, 0.2)";
    }
})

// Add an event lister for handling hover and highlight (mouse leave) for the liked post button
document.querySelector('.liked-posts-but').addEventListener('mouseleave', ()=>{
    if (!(glob_user_show_stat === 2)){
        // Change the color on mouse leave
        document.querySelector('.liked-posts-but').style.backgroundColor = "rgba(0, 0, 0, 0)";
    }
})

// Add event listener for directing to play station 
document.getElementById('play-but').addEventListener('click', ()=>{
    location.href="/play_station";
})

/**
Name: showProfile
Author: Vinayak Jha
Date: 10/27/2024
Preconditions: (user_id_profile, my_id)
Postconditions: No output, but has the side effect of asking the backend for the profile data
**/
function showProfile(user_id_profile, my_id){
    socket.emit('give-user-data', {"my_id": my_id, "user_id_profile": user_id_profile});
}

/**
Name: dm_message
Author: Vinayak Jha
Date: 10/27/2024
Preconditions: (my_id, other_id, other_name)
Postconditions: No output, but has the side effect of redirecting to message room
**/
function dm_message(my_id, other_id, other_name){
    // Set the room in the cache for later retrieval
    sessionStorage.setItem("dm_message", `${other_id}---|---${my_id}---|---${other_name}`);
    location.href="/message_room"
}

// Handle background click
document.querySelector('.bdg-but-1').addEventListener('click', ()=>{
    // Trigger show profile
    showProfile(userId, userId);
    // Set the currently viewing user
    glob_user_viewing = userId;
});

// Handle user return data
socket.on('return-user-data', (return_obj)=>{
    displayProfile(return_obj, userId);
});


/**
Name: displayProfile
Author: Vinayak Jha
Date: 10/27/2024
Preconditions: profile_obj, user_id
Postconditions: No output, but has the side effect of showing a profile
**/
function displayProfile(profile_obj, userId){
    // Get the username
    let user_name = profile_obj.user_name;
    // Get the user ID
    let user_id = profile_obj.user_id;
    // Get the total games played
    let tot_games_played = profile_obj.tot_game_count;
    // Get the won games count
    let won_games_count = profile_obj.won_game_count;
    // Get the lost games count
    let lost_games_count = profile_obj.lost_game_count;
    // Get the draw game count
    let draw_games_count = profile_obj.draw_game_count;
    // Get all the game array
    let game_arr = profile_obj.games_;
    // Get the followers
    let follower_arr = profile_obj.followers_;
    // Get the following users
    let following_arr = profile_obj.following_;
    // Get the game history
    let game_history_string = '';

    let isOnline = profile_obj.online_state == 'true';
    // Create the game history string
    if (game_arr){
    for (let counter_1 = 0; counter_1 < game_arr.length; counter_1++){
        let game_instance = game_arr[counter_1];
        let temp_string = '';
        temp_string = getResultString(game_instance.me_first_player, user_name, game_instance.opponent_name, game_instance.result, game_instance.opponent, user_id, userId);
        game_history_string += `<div class="gh">${temp_string}</div>`;
    }}

    // Create the follower string
    let follower_string = '';
    if (follower_arr){
        for (let counter_2 = 0; counter_2 < follower_arr.length; counter_2++){
            let follower_instance = follower_arr[counter_2];
            let but_string = "";
            if (follower_instance.id !== userId){
                // Add follow button
                let button_id = `dm---|---${follower_instance.id}---|---${follower_instance.name}`;
                but_string = `<div class="prof-bdg-msg"><button id=${button_id} class="dm-msg-but-id">Message</button></div>`
            }
            let id_for_follower;
            let ih_for_follower;
            let but_class_rf = "";
            let but_class_fb = "";
            if (follower_instance.id !== userId){
            if (follower_instance.they_follow === true){
                // If they follow, add remove follower button
                id_for_follower = `rmv-follower---|---${userId}---|---${follower_instance.id}`;
                ih_for_follower = 'Remove Follower';
                but_class_rf = `<button class="rmv-flwr" id=${id_for_follower}>Remove Follower</button>`           
            }
            if (follower_instance.i_follow === true){
                // if we follow, add unfollow button
                id_for_follower = `unfollow---|---${userId}---|---${follower_instance.id}`;
                but_class_fb = `<button class="fl-bk" id=${id_for_follower}>Unfollow</button>`
            }else{
                id_for_follower = `follow---|---${userId}---|---${follower_instance.id}`;
                but_class_fb = `<button class="fl-bk" id=${id_for_follower}>Follow</button>`
            }
        }
            // Add the follower string
            follower_string += `
            <div class="prof-badge">
            <div class="prof-name-msg">
                <div class="prof-name"><span class="bdg-prof-link" id="${follower_instance.id}---|---${userId}">${follower_instance.name}</span></div>
            ${but_string}
            </div>
            <div class="prf-bdg-but-place">
            ${but_class_rf}
            ${but_class_fb}
            </div>       
            </div>`
        }
    }
    // Add the following users string
    let following_string = '';
    if (following_arr){
    // If following arr is valid, add the following users
    for (let counter_2 = 0; counter_2 < following_arr.length; counter_2++){
        let following_instance = following_arr[counter_2];
        let but_string = "";
        if (following_instance.id !== userId){
            let button_id = `dm---|---${following_instance.id}---|---${following_instance.name}`;
            but_string = `<div class="prof-bdg-msg"><button id=${button_id} class="dm-msg-but-id">Message</button></div>`
        }
        let id_for_follower;
        let ih_for_follower;
        let but_class_rf = "";
        let but_class_fb = "";
        if (following_instance.id !== userId){
        if (following_instance.they_follow === true){
            // Add the remove follower button
            id_for_follower = `rmv-follower---|---${userId}---|---${following_instance.id}`;
            ih_for_follower = 'Remove Follower';
            but_class_rf = `<button class="rmv-flwr" id=${id_for_follower}>Remove Follower</button>`           
        }
        if (following_instance.i_follow === true){
            // Add the remove unfollow button
            id_for_follower = `unfollow---|---${userId}---|---${following_instance.id}`;
            but_class_fb = `<button class="fl-bk" id=${id_for_follower}>Unfollow</button>`
        }else{
            // Add the follow button
            id_for_follower = `unfollow---|---${userId}---|---${following_instance.id}`;
            but_class_fb = `<button class="fl-bk" id=${id_for_follower}>Follow</button>`
        }
    }
        following_string += `
        <div class="prof-badge">
        <div class="prof-name-msg">
            <div class="prof-name"><span class="bdg-prof-link" id="${following_instance.id}---|---${userId}">${following_instance.name}</span></div>
            ${but_string}
        </div>
        <div class="prf-bdg-but-place">
        ${but_class_rf}
        ${but_class_fb}      
        </div>
        </div>`
    }
    
    }
    let dm_main_str = "";
    let flw_but_main_str = "";
    let rmv_fl_main_str = "";
    // If viewing a different user, add the message, follow and unfollow button
    if (user_id !== userId){
        let but_id_dm = `dm---|---${user_id}---|---${user_name}`;
        dm_main_str = `<div class="dm_msg_main"><button class="dm_but_main" id=${but_id_dm}>Message</button></div>`;
        if (profile_obj.i_follow){
            // Add unfollow button
            let but_id = `unfollow---|---${userId}---|---${user_id}`;
            flw_but_main_str = `<div class="follow-main"><button class="fl-main" id=${but_id}>Unfollow</button></div>`;
        }else{
            // Add follow button
            let but_id = `follow---|---${userId}---|---${user_id}`;
            flw_but_main_str = `<div class="follow-main"><button class="fl-main" id=${but_id}>Follow</button></div>`;
        }
        if(profile_obj.they_follow){
            // Add remove follow button
            let but_id = `rmv-follower---|---${userId}---|---${user_id}`;
            rmv_fl_main_str = `<div class="remove-follower"><button class="rmv-fl-main" id=${but_id}>Remove Follower</button></div>`;
        }
    }
    let circle = `<div class="${isOnline ? "green-circle" : "red-circle"}"; border-radius=50%"></div>`
    // Add games
    let str_to_add = `<div class="profile-place">
    <div class="pp-top">
        <div class="profile-user-name">
            ${
                userId == user_id 
                ? `<form action='/users/change_name' method="POST">
                  <input type="text" name="name" value="${user_name}"/>
                  <button type="submit">Change Name</button>
                  </form>
                  `
                : 
                `<div>${user_name}</div>`
            }
            ${circle}
        </div>
        ${dm_main_str}
        ${flw_but_main_str}
        ${rmv_fl_main_str}
        <div class="pp-close-but"><button class="pp-close-but-main">Close</button></div>
    </div>
    <div class="pp-bottom">
        <div class="profile-games">
            <div class="pg-header">
                <div class="pg-title">Games</div>
                <div class="pg-stats">
                    <div class="pg-tot">Total: ${tot_games_played}</div>
                    <div class="pg-won">Won: ${won_games_count}</div>
                    <div class="pg-lost">Lost: ${lost_games_count}</div>
                    <div class="pg-draw">Draw: ${draw_games_count}</div>
                </div>
            </div>
            <div class="game-history">
                ${game_history_string}
            </div>
        </div>
        <div class="pp-followers">
            <div class="pp-frs-title">
                Followers (${follower_arr.length || '0'})
            </div>
            <div class="pp-frs-content">
            ${follower_string}
            </div>

        </div>
        <div class="pp-following">
            <div class="pp-fng-title">
                Following (${following_arr.length || '0'})
            </div>
            <div class="pp-fng-content">
            ${following_string}
            </div>
        </div>
    </div>
    </div>`
    document.querySelector('.profile-place-overlay').style.display = "block";
    // Show the overlay
    document.querySelector('.profile-place-overlay').innerHTML = str_to_add;
    addEL_dm_but(user_id);
}

/**
Name: addEL_dm_but
Author: Vinayak Jha
Date: 10/27/2024
Preconditions: input_user_id
Postconditions: No output, but has the side effect of showing a button leading up to profile
**/
function addEL_dm_but(input_user_id){
    // Get the buttons
    const dm_but_arr = document.querySelectorAll('.dm-msg-but-id');
    const rmv_flwr_but_arr = document.querySelectorAll('.rmv-flwr');
    const flw_un_but_arr = document.querySelectorAll('.fl-bk');
    const follow_main_but = document.querySelector('.fl-main');
    const rmv_flwr_main_but = document.querySelector('.rmv-fl-main');
    const close_main_but = document.querySelector('.pp-close-but');
    const dm_but_main = document.querySelector('.dm_but_main');
    const bdg_prof_link = document.querySelectorAll('.bdg-prof-link');
    // If profile link is valid
    if (bdg_prof_link){
        for (let counter = 0; counter < bdg_prof_link.length; counter++){
            let link_id = bdg_prof_link[counter].id;
            let my_id = link_id.split('---|---')[1];
            let other_id = link_id.split('---|---')[0];
            bdg_prof_link[counter].addEventListener('click', ()=>{
                // For each button, add event listener to show profile
                showProfile(other_id, my_id);
                glob_user_viewing = other_id;
            });
        }
    }
    if (dm_but_main){
    let dm_but_id = dm_but_main.id;
    // Get the current id
    let other_user_id = dm_but_id.split('---|---')[1];
    // Get the later id
    let other_user_name = dm_but_id.split('---|---')[2];
    // Add button to show the dm essage
    dm_but_main.addEventListener('click', ()=>{dm_message(input_user_id, other_user_id, other_user_name)});
    }
    close_main_but.addEventListener('click', ()=>{
        // Hide the overlay
        document.querySelector('.profile-place-overlay').style.display = "none";
        // Unhide the overlay
        document.querySelector('.profile-place-overlay').innerHTML = "";
    })
    if (follow_main_but){
        // Get the ID of main
        let task_of_but = follow_main_but.id.split('---|---')[0];
        // Get the self id
        let my_id = follow_main_but.id.split('---|---')[1];
        // Get the other id
        let other_id = follow_main_but.id.split('---|---')[2];
        if (task_of_but === 'follow'){
            // Add button to make it follow
            follow_main_but.addEventListener('click', ()=>{
                // Emit follow event
                socket.emit('make-user-follow', {'id_1':my_id, 'id_2':other_id});
            })
        }else if(task_of_but === 'unfollow'){
            // Add button to make it unfollow
            follow_main_but.addEventListener('click', ()=>{
                // Emit unfollow event
                socket.emit('make-user-unfollow', {'id_1':my_id, 'id_2':other_id});
            })
        }
    }
    if (rmv_flwr_main_but){
        // Set up remove follow button
        let but_id = rmv_flwr_main_but.id;
        // Get the currentid
        let my_id = but_id.split('---|---')[1];
        // Get the otherid
        let other_id = but_id.split('---|---')[2];
        // Emit remove follow
        rmv_flwr_main_but.addEventListener('click', ()=>{socket.emit('remove-follower', {'id_1':my_id, 'id_2': other_id})})
    }
    for (let counter_1 = 0; counter_1 < dm_but_arr.length; counter_1++){
        // Set up DM message button
        let but_id = dm_but_arr[counter_1].id;
        // Get the currentid
        let other_user_id = but_id.split('---|---')[1];
        // Get the otherid
        let other_user_name = but_id.split('---|---')[2];
        // Add event listener to emit dm message
        dm_but_arr[counter_1].addEventListener('click', ()=>{dm_message(input_user_id, other_user_id, other_user_name)});
    }
    for (let counter_2 = 0; counter_2 < rmv_flwr_but_arr.length; counter_2++){
        // Set up other remove follow button
        let but_id = rmv_flwr_but_arr[counter_2].id;
        // Get the currentid
        let my_id = but_id.split('---|---')[1];
        // Get the otherid
        let other_id = but_id.split('---|---')[2];
        // Emit remove follow
        rmv_flwr_but_arr[counter_2].addEventListener('click', ()=>{socket.emit('remove-follower', {'id_1':my_id, 'id_2': other_id})})
    }
    for (let counter_3 = 0; counter_3 < flw_un_but_arr.length; counter_3++){
        // Set up the other follow button
        let but_id = flw_un_but_arr[counter_3].id;
        // Get button task
        let task_but = but_id.split('---|---')[0];
        // Get my id
        let my_id = but_id.split('---|---')[1];
        // Get the other id
        let other_id = but_id.split('---|---')[2];
        if (task_but === 'follow'){
            // Setup follow
            flw_un_but_arr[counter_3].addEventListener('click', ()=>{
                socket.emit('make-user-follow', {'id_1':my_id, 'id_2':other_id});
            })
        }else if(task_but === 'unfollow'){
            // Setup unfollow
            flw_un_but_arr[counter_3].addEventListener('click', ()=>{
                socket.emit('make-user-unfollow', {'id_1':my_id, 'id_2':other_id});
            })
        }
        
    }
}
// Setup refresh profle
socket.on('refresh-prof', (some_obj)=>{
    let id_1 = some_obj.id_1;
    let id_2 = some_obj.id_2;
    // show profile
    showProfile(glob_user_viewing, id_1);
}
)

/**
Name: getResultString
Author: Vinayak Jha
Date: 10/27/2024
Preconditions: is_me_first, my_name, opponent_name, result, opp_id, prof_user_id, userId
Postconditions: Returns the result string
**/
function getResultString(is_me_first, my_name, opponent_name, result, opp_id, prof_user_id, userId){
    // get result 
    if (opponent_name === 'COMPUTER-BOT-HERE'){
        opponent_name = "Computer";
    }
    if (is_me_first === 'true'){
        if (result === 'W'){
            // on win
            return `<div class="result_" style="color:green">Won</div>
            <div class="result_name" style="color: green">O:&nbsp;<span class="bdg-prof-link" id="${prof_user_id}---|---${userId}">${my_name}</span></div>
            <div class="result_name" style="color: red">X:&nbsp;<span class="bdg-prof-link" id="${opp_id}---|---${userId}">${opponent_name}</span></div>
            <div class="result_" style="color:red">Lost</div>`
        }else if(result === 'L'){
            // on lose
            return `<div class="result_" style="color:red">Lost</div>
            <div class="result_name" style="color: red">O:&nbsp;<span class="bdg-prof-link" id="${prof_user_id}---|---${userId}">${my_name}</span></div>
            <div class="result_name" style="color: green">X:&nbsp;<span class="bdg-prof-link" id="${opp_id}---|---${userId}">${opponent_name}</span></div>
            <div class="result_" style="color:green">Won</div>`
        }else{
            // on draw
            return `<div class="result_" style="color:white">Draw</div>
            <div class="result_name" style="color: white">O:&nbsp;<span class="bdg-prof-link" id="${prof_user_id}---|---${userId}">${my_name}</span></div>
            <div class="result_name" style="color: white">X:&nbsp;<span class="bdg-prof-link" id="${opp_id}---|---${userId}">${opponent_name}</span></div>
            <div class="result_" style="color:white">Draw</div>`
        }
    }else{
        if (result === 'L'){
            // on lost
            return `<div class="result_" style="color:green">Won</div>
            <div class="result_name" style="color: green">O:&nbsp;<span class="bdg-prof-link" id="${opp_id}---|---${userId}">${opponent_name}</span></div>
            <div class="result_name" style="color: red">X:&nbsp;<span class="bdg-prof-link" id="${prof_user_id}---|---${userId}">${my_name}</span></div>
            <div class="result_" style="color:red">Lost</div>`
        }else if(result === 'W'){
            // on win
            return `<div class="result_" style="color:red">Lost</div>
            <div class="result_name" style="color: red">O:&nbsp;<span class="bdg-prof-link" id="${opp_id}---|---${userId}">${opponent_name}</span></div>
            <div class="result_name" style="color: green">X:&nbsp;<span class="bdg-prof-link" id="${prof_user_id}---|---${userId}">${my_name}</span></div>
            <div class="result_" style="color:green">Won</div>`
        }else{
            // on draw
            return `<div class="result_" style="color:white">Draw</div>
            <div class="result_name" style="color: white">O:&nbsp;<span class="bdg-prof-link" id="${opp_id}---|---${userId}">${opponent_name}</span></div>
            <div class="result_name" style="color: white">X:&nbsp;<span class="bdg-prof-link" id="${prof_user_id}---|---${userId}">${my_name}</span></div>
            <div class="result_" style="color:white">Draw</div>`
        }
    }
}
// set up message room redirect
document.querySelector('.bdg-but-3').addEventListener('click', ()=>{
    location.href="/message_room";
})