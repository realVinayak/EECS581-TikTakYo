
const socket = io();

let glob_current_user = 0; // To store the current user ID
let isSearched = false;



let tempInitialObj = {
    user_name: "Enter search query",
    user_id: -1,
    tot_game_count: 0,
    won_game_count: 0,
    lost_game_count: 0,
    draw_game_count: 0,
    games_: [],
    followers_: [],
    following_: []
};

// Function to show the profile of a user
function showProfile(user_id_profile, my_id){
    socket.emit('give-user-data', {"my_id": my_id, "user_id_profile": user_id_profile}); // Emit to the server to fetch user data
}

socket.on("return-search-query", (returnObj)=>{
    displayProfile(returnObj, user_id, true);
});

// Listens for 'return-user-data' event from the server to receive user profile data
socket.on('return-user-data', (return_obj) => {
    // Calls displayProfile function with the returned user data and user ID
    displayProfile(return_obj, user_id, false);
});

displayProfile(tempInitialObj, user_id, true);

function addEL_dm_but(input_user_id){
    // Select all elements with the class 'dm-msg-but-id' (buttons to message users)
    const dm_but_arr = document.querySelectorAll('.dm-msg-but-id');
    // Select all elements with the class 'rmv-flwr' (buttons to remove followers)
    const rmv_flwr_but_arr = document.querySelectorAll('.rmv-flwr');
    // Select all elements with the class 'fl-bk' (follow/unfollow buttons)
    const flw_un_but_arr = document.querySelectorAll('.fl-bk');
    // Select the main follow button element with the class 'fl-main'
    const follow_main_but = document.querySelector('.fl-main');
    // Select the main remove follower button element with the class 'rmv-fl-main'
    const rmv_flwr_main_but = document.querySelector('.rmv-fl-main');
    // Select the close button element with the class 'pp-close-but'
    const reset_main_but = document.getElementById('pp-reset-but-main');
    // Select the main direct message button element with the class 'dm_but_main'
    const dm_but_main = document.querySelector('.dm_but_main');
    // Select all elements with the class 'bdg-prof-link' (profile badge links)
    const bdg_prof_link = document.querySelectorAll('.bdg-prof-link');

    // Add click event listeners for profile badge links
    if (bdg_prof_link){
        for (let counter = 0; counter < bdg_prof_link.length; counter++){
            // Get the ID of the current profile link and split it into user IDs
            let link_id = bdg_prof_link[counter].id;
            let my_id = link_id.split('---|---')[1];
            let other_id = link_id.split('---|---')[0];
            // Add a click event listener that shows the profile of the linked user
            bdg_prof_link[counter].addEventListener('click', ()=>{
                showProfile(other_id, my_id); // Call showProfile with other and my IDs
                glob_user_viewing = other_id; // Update the global viewing user ID
            });
        }
    }

    // Add click event listener to the main direct message button, if it exists
    if (dm_but_main){
        let dm_but_id = dm_but_main.id;
        let other_user_id = dm_but_id.split('---|---')[1]; // Extract other user ID
        let other_user_name = dm_but_id.split('---|---')[2]; // Extract other user name
        dm_but_main.addEventListener('click', ()=>{
            dm_message(input_user_id, other_user_id, other_user_name); // Send message on click
        });
    }

    // Add click event listener to close the profile overlay when the close button is clicked
    reset_main_but.addEventListener('click', ()=>{
        displayProfile(tempInitialObj, user_id, true);
    });

    // Add event listener for the main follow/unfollow button if it exists
    if (follow_main_but){
        let task_of_but = follow_main_but.id.split('---|---')[0]; // Determine task: follow/unfollow
        let my_id = follow_main_but.id.split('---|---')[1]; // Extract current user ID
        let other_id = follow_main_but.id.split('---|---')[2]; // Extract other user ID
        if (task_of_but === 'follow'){
            follow_main_but.addEventListener('click', ()=>{
                socket.emit('make-user-follow', {'id_1':my_id, 'id_2':other_id}); // Follow other user
            });
        }else if(task_of_but === 'unfollow'){
            follow_main_but.addEventListener('click', ()=>{
                socket.emit('make-user-unfollow', {'id_1':my_id, 'id_2':other_id}); // Unfollow other user
            });
        }
    }

    // Add event listener for the main remove follower button if it exists
    if (rmv_flwr_main_but){
        let but_id = rmv_flwr_main_but.id;
        let my_id = but_id.split('---|---')[1]; // Extract current user ID
        let other_id = but_id.split('---|---')[2]; // Extract other user ID
        rmv_flwr_main_but.addEventListener('click', ()=>{
            socket.emit('remove-follower', {'id_1':my_id, 'id_2': other_id}); // Remove follower
        });
    }

    // Loop through each direct message button and add click event listeners
    for (let counter_1 = 0; counter_1 < dm_but_arr.length; counter_1++){
        let but_id = dm_but_arr[counter_1].id;
        let other_user_id = but_id.split('---|---')[1]; // Extract other user ID
        let other_user_name = but_id.split('---|---')[2]; // Extract other user name
        dm_but_arr[counter_1].addEventListener('click', ()=>{
            dm_message(input_user_id, other_user_id, other_user_name); // Open message with user
        });
    }

    // Loop through each remove follower button and add click event listeners
    for (let counter_2 = 0; counter_2 < rmv_flwr_but_arr.length; counter_2++){
        let but_id = rmv_flwr_but_arr[counter_2].id;
        let my_id = but_id.split('---|---')[1]; // Extract current user ID
        let other_id = but_id.split('---|---')[2]; // Extract other user ID
        rmv_flwr_but_arr[counter_2].addEventListener('click', ()=>{
            socket.emit('remove-follower', {'id_1':my_id, 'id_2': other_id}); // Remove follower
        });
    }

    // Loop through each follow/unfollow button and add click event listeners
    for (let counter_3 = 0; counter_3 < flw_un_but_arr.length; counter_3++){
        let but_id = flw_un_but_arr[counter_3].id;
        let task_but = but_id.split('---|---')[0]; // Determine task: follow/unfollow
        let my_id = but_id.split('---|---')[1]; // Extract current user ID
        let other_id = but_id.split('---|---')[2]; // Extract other user ID
        if (task_but === 'follow'){
            flw_un_but_arr[counter_3].addEventListener('click', ()=>{
                socket.emit('make-user-follow', {'id_1':my_id, 'id_2':other_id}); // Follow user
            });
        }else if(task_but === 'unfollow'){
            flw_un_but_arr[counter_3].addEventListener('click', ()=>{
                socket.emit('make-user-unfollow', {'id_1':my_id, 'id_2':other_id}); // Unfollow user
            });
        }
    }

    const searchButton =  document.getElementById("search-but") ?? undefined;
    searchButton?.addEventListener('click', ()=>{
        const inputSearch =  document.getElementById("user-name-input");
        socket.emit('get-search-query', {name: inputSearch.value, id:user_id});
    })
}

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

function displayProfile(profile_obj, userId, isSearchResponse){
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
    

    let games_str = `
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
    `;

    let followerStr = `
            <div class="pp-followers">
            <div class="pp-frs-title">
                ${isSearchResponse ? "Matches" : "Followers"} (${follower_arr.length || '0'})
            </div>
            <div class="pp-frs-content">
            ${follower_string}
            </div>
        </div>`;

    let followingStr = isSearchResponse ? "" : `
            <div class="pp-following">
            <div class="pp-fng-title">
                Following (${following_arr.length || '0'})
            </div>
            <div class="pp-fng-content">
            ${following_string}
            </div>
        </div>`;

    let closeButton = `<div class="pp-close-but"><button class="pp-close-but-main">Close</button></div>`;
    let resetButton = `<div class="pp-close-but"><button id="pp-reset-but-main">Reset</button></div>`;
    let dashboardButton = `<a href="/dashboard">Dashboard</a>`
    // Add games
    let str_to_add = `<div class="profile-place">
    <div class="pp-top">
        <div class="profile-user-name">
            ${
                isSearchResponse
                ? `
                  <input id="user-name-input" type="text" name="name" value="${user_name}"/>
                  <button id="search-but">Search</button>
                  </form>
                  `
                : user_name
            }
        </div>
        ${isSearchResponse ? "" : dm_main_str}
        ${isSearchResponse ? "" : flw_but_main_str}
        ${isSearchResponse ? "" : rmv_fl_main_str}
        ${resetButton}
        ${dashboardButton}
    </div>
    <div class="pp-bottom">
        ${isSearchResponse ? "" : games_str }
        ${followerStr}
        ${followingStr}
    </div>
    </div>`
    document.querySelector('.profile-place-overlay').style.display = "block";
    // Show the overlay
    document.querySelector('.profile-place-overlay').innerHTML = str_to_add;
    addEL_dm_but(user_id);
}
