/**
Name of Program: play_station_lorc_script.js
Description: Script that gets loaded for play functionality
Inputs: None
Outputs: None
Author: Zach Alwin, Kristin Boeckmann, Lisa Phan, Nicholas Hausler, Vinayak Jha
Creation Date: 10/27/2024
 */
// Establish a connection to the server via socket.io
const socket = io();

// Emit the player type and check the current active player with the server
socket.emit('player-type', isLive);
socket.emit('chk_for_cur_active', user_id);

// Declare variables for game state and player information
let me_first_player; // To track if the current player is going first
let other_player_name_glob; // To store the name of the other player
let global_prev_game = false; // To check if there was a previous game
let glob_current_user = 0; // To store the current user ID

// Check if the game is live and not in 'false' mode
if (!(isLive == 'false')){
    // Add event listener to the 'connect-another-user' button
    document.getElementById('connect-another-user').addEventListener('click', ()=>{

        // If a result is declared and there's a previous game, or if no result and no previous game, connect to another user
        if ((result_declared && global_prev_game) || ((!result_declared)&&(!global_prev_game))){
            socket.emit('connect_with_someone', {user_id, user_name}); // Emit to connect with someone
            document.querySelector('.connecting-overlay').style.display = 'block'; // Show connecting overlay
        }

        // If there's a previous game and a result was declared, reset the game globals
        if (global_prev_game && (result_declared)){  
            change_globals(); // Reset game state
            socket.emit('remove-from-prev-game', {user_id}); // Notify server to remove from previous game
        }
    })
}else{
    // If not live, set up the buttons to connect to computer

    const parseUrl = (inString) => {
        const splitted = inString.split('?')[1].split('=')[1];
        return splitted;
    }

    document.getElementById('o-option').addEventListener('click', ()=>{

       // change_globals(); // Reset game state
       // socket.emit('remove-from-prev-game', {user_id}); 
        // Hide the computer play options overlay
        document.querySelector('.comp-play-opt-overlay').style.display = 'none';

        // Emit to connect with computer as 'O' player
        socket.emit('connect-with-computer', {user_id, user_name, opt: 'o', level: parseUrl(document.baseURI)})

        // Show the connecting overlay
        document.querySelector('.connecting-overlay').style.display = 'block';
    })
    // Set up listener for 'X' option to play against computer
    document.getElementById('x-option').addEventListener('click', ()=>{

        //change_globals(); // Reset game state
        //socket.emit('remove-from-prev-game', {user_id}); 

        document.querySelector('.comp-play-opt-overlay').style.display = 'none'; // Hide overlay
        socket.emit('connect-with-computer', {user_id, user_name, opt: 'x', level: parseUrl(document.baseURI)}) // Emit to connect as 'X'
        document.querySelector('.connecting-overlay').style.display = 'block'; // Show connecting overlay
    })
    // Set up listener for random option to play against computer
    document.getElementById('ran-option').addEventListener('click', ()=>{


        //change_globals(); // Reset game state
        //socket.emit('remove-from-prev-game', {user_id}); 

        document.querySelector('.comp-play-opt-overlay').style.display = 'none'; // Hide overlay
        socket.emit('connect-with-computer', {user_id, user_name, opt: 'ran', level: parseUrl(document.baseURI)}) // Emit random option to connect
        document.querySelector('.connecting-overlay').style.display = 'block'; // Show connecting overlay
    })
    // Listener for 'connect-with-computer' button click to show options
    document.getElementById('connect-with-computer').addEventListener('click', ()=>{
        // If result is declared and there's a previous game or both are false, show the overlay
        if ((result_declared && global_prev_game) || ((!result_declared)&&(!global_prev_game))){
            document.querySelector('.comp-play-opt-overlay').style.display = 'block'; // Show overlay
        }
        // If there's a previous game and result declared, reset game globals
        //if (global_prev_game && (result_declared)){  
        change_globals(); // Reset game state
        socket.emit('remove-from-prev-game', {user_id}); // Remove player from previous game
        //}
        
    });
}

// Listener for 'connect-cancel' button to cancel the connection
document.getElementById('connect-cancel').addEventListener('click', ()=>{
    socket.emit('remove-from-connect-line', {user_id, user_name}); // Notify server to cancel connection
    document.querySelector('.connecting-overlay').style.display = 'none'; // Hide connecting overlay
})

// Function to reset global variables for a new game
function change_globals(){
    for (let t_c1 = 0; t_c1 < 9; t_c1++){
        but_clicked[t_c1] = 0; // Reset button click state
        document.getElementById(`but${t_c1+1}`).innerHTML = ''; // Clear button text
    }   
    result_declared = false; // Reset result declaration
    glob_my_turn = false; // Reset turn state
    document.querySelector('.message-area').innerHTML = ''; // Clear message area
}

// Declare an array to track button clicks
let but_clicked = [0, 0, 0, 0, 0, 0, 0, 0, 0];

// Declare variables for turn and result states
let glob_my_turn; 
let result_declared = false; 

// Listen for the 'multi-player-connect' event from the server
socket.on('multi-player-connect', (msg)=>{
    let names_of_players = msg.split('---|---'); // Split the player data from the message
    let player_1 = names_of_players[0]; // Player 1 name
    let player_2 = names_of_players[1]; // Player 2 name
    let player_1_id = names_of_players[2]; // Player 1 ID
    let player_2_id = names_of_players[3]; // Player 2 ID
    let other_player;
    let other_player_id;
    
    document.querySelector('.connecting-overlay').style.display = 'none'; // Hide the connecting overlay

    // Check which player the current user is and set game state accordingly
    if (user_name === player_1){
        showMsg(`You have been connected to ${player_2}. You go First`); // Show message that the user is Player 1
        other_player = player_2; // Set the other player
        other_player_id = player_2_id; // Set the other player's ID
        me_first_player = true; // Current player goes first
        glob_my_turn = true; // Set turn to true for the current player
    }else{
        showMsg(`You have been connected to ${player_1}. You go Second`); // Show message that the user is Player 2
        other_player = player_1; // Set the other player
        other_player_id = player_1_id; // Set the other player's ID
        me_first_player = false; // Current player goes second
        glob_my_turn = false; // Set turn to false for the current player
    }
    
    // Update the UI with the player names
    document.querySelector('.me_player').textContent = 'You'; // Set current player label to "You"
    document.querySelector('.other_player').innerHTML = `<span class="post-profile-show" id="${other_player_id}">${other_player}</span>`; // Show other player's name

    // Store the name of the other player globally
    other_player_name_glob = other_player;

    // Add event listener to view the profile of the other player
    addEL(user_id);
})

// Function to add event listener for profile viewing
function addEL(input_user_id){
    let pps_elem = document.querySelector('.post-profile-show'); // Select the element to view profile
    pps_elem.addEventListener('click', ()=>{
        showProfile(pps_elem.id, input_user_id); // Call showProfile to display profile of the clicked player
        glob_current_user = pps_elem.id; // Update the global current user ID
    })
}

// Function to show the profile of a user
function showProfile(user_id_profile, my_id){
    socket.emit('give-user-data', {"my_id": my_id, "user_id_profile": user_id_profile}); // Emit to the server to fetch user data
}

// Function to add a new message to the message area
function addMessage(msg_to_add){
    const div_to_add = document.createElement('div'); // Create a new div element
    div_to_add.className = 'messages'; // Assign class name for styling
    div_to_add.textContent = msg_to_add; // Set the text content to the passed message
    const parentDiv = document.querySelector('.message-area'); // Get the message area container
    parentDiv.appendChild(div_to_add); // Append the new message to the message area
}

// Loop to add click event listeners for the buttons with ids 'but1' through 'but9'
for (let counter = 1; counter < 10; counter++){
    let but_id = `but${counter}`; // Create button id dynamically
    const but_elem = document.getElementById(but_id); // Get the button element by id
    but_elem.addEventListener('click', ()=>{
        if (!result_declared){ // If the game result is not declared
        if(but_clicked[counter-1] === 0){ // Check if the button has not been clicked already
        socket.emit('make-this-move', {user_id, counter}); // Emit the move to the server
        }
    }
    })
}

// Loop to add mouseenter and mouseleave event listeners for buttons
for (let counter = 1; counter < 10; counter++){
    let but_id = `but${counter}`; // Create button id dynamically
    const but_elem = document.getElementById(but_id); // Get the button element by id
    
    // Mouse enter event to highlight the button and show symbol
    but_elem.addEventListener('mouseenter', ()=>{
        if (but_clicked[counter-1] === 0){ // If the button hasn't been clicked
            if(!result_declared){ // If the game result is not declared
            if (glob_my_turn){ // If it's the user's turn
            if (me_first_player){ // If the user is the first player
                but_elem.innerHTML = 'O'; // Set 'O' symbol
                but_elem.style.backgroundColor = "#a13333bd" // Set background color for 'O'
            }else{ // If the user is the second player
                but_elem.style.backgroundColor = "#a13333bd" // Set background color for 'X'
                but_elem.innerHTML = 'X'; // Set 'X' symbol
            }
        }
    }
        }
    });

    // Mouse leave event to remove the symbol and reset the button color
    but_elem.addEventListener('mouseleave', ()=>{
        if (but_clicked[counter-1] === 0){ // If the button hasn't been clicked
            but_elem.innerHTML = ''; // Clear the button's inner HTML
        }
        but_elem.style.backgroundColor = "#A13333"; // Reset the button background color
    });
}

// Listen for the server's message to update the game state (e.g., moves made)
socket.on('web-render-msg', (web_render_stuff)=>{
    for (let counter = 1; counter < 10; counter++){
        let but_id = `but${counter}`; // Create button id dynamically
        document.getElementById(but_id).innerHTML = web_render_stuff[`but_${counter}`]; // Update button's inner HTML based on server's state
        let temp_inner_html = document.getElementById(but_id).innerHTML; // Get the button's current content
        if (temp_inner_html === 'X' || temp_inner_html === 'O'){ // If the button contains 'X' or 'O'
            but_clicked[counter-1] = 1; // Mark the button as clicked
        }
    }

    // Check if it's the user's turn based on the current turn number from the server
    let my_turn = (((web_render_stuff.current_turn === 1) && (me_first_player)) || ((web_render_stuff.current_turn === 2) && (!me_first_player)));
    if (my_turn){
        glob_my_turn = true; // Set user's turn flag to true
        document.querySelector('.me_player').style.opacity = 1; // Make the current player visible
        document.querySelector('.other_player').style.opacity = 0.3; // Dim the other player
    }else{
        glob_my_turn = false; // Set user's turn flag to false
        document.querySelector('.me_player').style.opacity = 0.3; // Dim the current player
        document.querySelector('.other_player').style.opacity = 1; // Make the other player visible
    }

    // If there is a message, call addMessage to display it
    if (web_render_stuff.msg != ''){addMessage(web_render_stuff.msg);};
})

// Listen for 'not-your-turn' event from the server and show message
socket.on('not-your-turn', (msg)=>{showMsg(msg)});

// Event listener for sending a chat message
document.getElementById('send-message-button').addEventListener('click', ()=>{
    const text_box = document.getElementById('message_to_send'); // Get the message input field
    if(text_box.value != ''){ // If the input is not empty
        let msg_txt = text_box.value; // Get the message text
        socket.emit('chat-msg-user', {msg_txt, user_id}) // Emit the message to the server
        text_box.value = ''; // Clear the input field after sending the message
    }
});

// Listen for incoming chat messages from the server
socket.on('chat-msg-server', (msg_entire)=>{
    let msg_sender = msg_entire.msg_sender; // Get the sender's name
    let msg_content = msg_entire.msg_text; // Get the message content
    let msg_time = msg_entire.msg_time; // Get the time of the message
    let msg_ = document.createElement('div'); // Create a new div for the message
    msg_.className = "messages"; // Assign class for styling
    msg_.innerHTML = `<div class="meta-info">${msg_sender} ${msg_time}</div><div class="main-msg"><p>${msg_content}</p></div>` // Format the message with sender, time, and content
    document.querySelector('.message-area').appendChild(msg_); // Append the message to the message area
})

// Listen for a message from the server to handle the computer opponent connection
socket.on('computer-connect', (msg)=>{
    document.querySelector('.connecting-overlay').style.display = 'none'; // Hide the connecting overlay
    let names_of_players = msg.split('---|---'); // Split the message to get player names
    let player_1 = names_of_players[0]; // Get player 1's name
    let player_2 = names_of_players[1]; // Get player 2's name
    let other_player;
    if (user_name === player_1){ // If the user is player 1
        showMsg(`You have been connected to ${player_2}. You go First`); // Show message indicating the user goes first
        other_player = player_2; // Set the opponent as player 2
        me_first_player = true; // Set the flag indicating the user is the first player
        glob_my_turn = true; // Set user's turn to true
    }else{ // If the user is player 2
        showMsg(`You have been connected to ${player_1}. You go Second`); // Show message indicating the user goes second
        other_player = player_1; // Set the opponent as player 1
        me_first_player = false; // Set the flag indicating the user is the second player
        glob_my_turn = false; // Set user's turn to false
    }
    document.querySelector('.me_player').textContent = 'You'; // Display "You" for the current player
    document.querySelector('.other_player').textContent = other_player; // Display the opponent's name
    other_player_name_glob = other_player; // Store the opponent's name globally
})
// Listen for the 'result_here' event sent from the server
socket.on('result_here', (some_msg) => {
    // Mark that the result has been declared and update the game state
    result_declared = true;
    global_prev_game = true;
    
    // Change the text on the connect button to 'Next' for the next game
    document.querySelector('.connect-button').innerHTML = 'Next';
    
    // Extract the main result (win/draw) and the win information (type and index)
    let main_result = some_msg.result;
    let win_string = some_msg.string;
    let type_of_win = win_string.split('-')[0]; // Type of win (row, col, or diag)
    let index_of_win = +win_string.split('-')[1]; // Index of the winning line

    // If the game is not a draw, handle the winning animation and message
    if (main_result !== 'D') {
        // Check the type of win and trigger the appropriate blinking function
        if (type_of_win === 'row') {
            blink_this_row(1 + index_of_win); // Blink the row of the winning combination
        } else if (type_of_win == 'col') {
            blink_this_col(1 + index_of_win); // Blink the column of the winning combination
        } else {
            blink_this_diag(index_of_win); // Blink the diagonal of the winning combination
        }

        // Set a timeout to show the winner message after a short delay
        my_timeout = setTimeout(() => {
            // Display the appropriate winner message based on who won
            if (main_result === 'P1') {
                // Player 1 wins
                if (me_first_player) {
                    showMsg("You Win!"); // If it's player 1's turn and the user goes first
                } else {
                    showMsg(`${other_player_name_glob} Wins!`); // If it's player 1's turn and the user goes second
                }
            } else {
                // Player 2 wins
                if (me_first_player) {
                    showMsg(`${other_player_name_glob} Wins!`); // If it's player 2's turn and the user goes first
                } else {
                    showMsg("You Win!"); // If it's player 2's turn and the user goes second
                }
            }
        }, 1300); // Delay before showing the winner message

    } else {
        // If the game is a draw, display a draw message
        showMsg('Draw!');
    }
});

// Function to display the result overlay with the result message
function displayResult(msg_result) {
    // Show the result overlay and display the result text
    document.querySelector('.result-overlay').style.display = "block";
    document.querySelector('.result-text').innerHTML = msg_result;
}

// Function to blink a winning row
function blink_this_row(row_index) {
    // Blink the buttons corresponding to the row (3 buttons)
    blink_these_items(document.getElementById(`but${row_index}`), document.getElementById(`but${row_index + 1}`), document.getElementById(`but${row_index + 2}`));
}

// Function to blink a winning column
function blink_this_col(col_index) {
    // Blink the buttons corresponding to the column (3 buttons)
    blink_these_items(document.getElementById(`but${col_index}`), document.getElementById(`but${col_index + 3}`), document.getElementById(`but${col_index + 6}`));
}

// Function to blink a winning diagonal
function blink_this_diag(diag_index) {
    // Depending on the diagonal index, blink the appropriate diagonal buttons
    if (diag_index == 0) {
        blink_these_items(document.getElementById(`but1`), document.getElementById(`but5`), document.getElementById(`but9`)); // Main diagonal
    } else {
        blink_these_items(document.getElementById(`but3`), document.getElementById(`but5`), document.getElementById(`but7`)); // Anti-diagonal
    }
}

// Function to blink 3 buttons to highlight the winning combination
function blink_these_items(item1, item2, item3) {
    let counter_interval = 0;
    // Set an interval to toggle the background color of the winning buttons
    blinkInterval = setInterval(() => {
        if ((counter_interval % 2) == 0) {
            // Set the background color to red on every even interval
            item1.style.backgroundColor = "#A13333";
            item2.style.backgroundColor = "#A13333";
            item3.style.backgroundColor = "#A13333";
        } else {
            // Set the background color to a lighter shade of red on every odd interval
            item1.style.backgroundColor = "#a34e4e";
            item2.style.backgroundColor = '#a34e4e';
            item3.style.backgroundColor = '#a34e4e';
        }
        counter_interval += 1;
        
        // Clear the interval after 7 iterations to stop the blinking
        if (counter_interval === 7) {
            clearInterval(blinkInterval);
        }
    }, 300); // 300ms interval for blinking
}


// Listens for 'dis-result' event from the server, indicating opponent disconnection
socket.on('dis-result', (some_stuff) => {
    // Displays a message saying the opponent got disconnected and declares the user as the winner
    showMsg('Opponent got disconnected. You Win!');
    // Sets result_declared to true to mark the game result as decided
    result_declared = true;
});

// Listens for 'opp-next' event from the server, suggesting opponent disconnection with an option to start a new game
socket.on('opp-next', (rand_msg) => {
    // Displays a message indicating opponent disconnected and prompts the user to play a new game
    showMsg('Opponent Disconnected. Click on Next to play a new game');
});

// Function to display a message overlay with a given message text
function showMsg(msg_to_show) {
    // Makes the overlay element visible
    document.querySelector('.messages-overlay').style.display = "block";
    // Sets the overlay text to the provided message
    document.querySelector('.message-text').innerHTML = msg_to_show;
    // Adds a click event listener to the close button to hide the overlay when clicked
    document.querySelector('.msg-close-button').addEventListener('click', () => {
        document.querySelector('.messages-overlay').style.display = "none";
    });
}

// Listens for 'return-user-data' event from the server to receive user profile data
socket.on('return-user-data', (return_obj) => {
    // Calls displayProfile function with the returned user data and user ID
    displayProfile(return_obj, user_id);
});

// Function to display user profile information, including game history, followers, and following
function displayProfile(profile_obj, userId){
     // Extracts the user's name from the profile object
    let user_name = profile_obj.user_name;
    // Extracts the user's ID from the profile object
    let user_id = profile_obj.user_id;
    // Extracts the total number of games played by the user
    let tot_games_played = profile_obj.tot_game_count;
    // Extracts the count of games won by the user
    let won_games_count = profile_obj.won_game_count;
    // Extracts the count of games lost by the user
    let lost_games_count = profile_obj.lost_game_count;
    // Extracts the count of games drawn by the user
    let draw_games_count = profile_obj.draw_game_count;
    // Stores the array of games played by the user
    let game_arr = profile_obj.games_;
    // Stores the array of followers
    let follower_arr = profile_obj.followers_;
    // Stores the array of users followed by the user
    let following_arr = profile_obj.following_;
    // Initializes an empty string to hold the game history HTML
    let game_history_string = '';

    // Checks if the user has any games in their game history
    if (game_arr) {
        // Loops through each game in the game array
        for (let counter_1 = 0; counter_1 < game_arr.length; counter_1++) {
            // Gets the current game instance
            let game_instance = game_arr[counter_1];
            // Initializes a temporary string to store the game result string
            let temp_string = '';
            // Generates a string for the game result using helper function and stores it in temp_string
            temp_string = getResultString(game_instance.me_first_player, user_name, game_instance.opponent_name, game_instance.result, game_instance.opponent, user_id, userId);
            // Wraps the game result string in a div and appends it to the game history string
            game_history_string += `<div class="gh">${temp_string}</div>`;
        }
    }
    
    // Initializes an empty string to hold the follower HTML
    let follower_string = '';

    // Checks if the user has any followers
    if (follower_arr) {
        // Loops through each follower in the follower array
        for (let counter_2 = 0; counter_2 < follower_arr.length; counter_2++) {
            // Gets the current follower instance
            let follower_instance = follower_arr[counter_2];
            // Initializes an empty string for the message button
            let but_string = "";

            // Checks if the follower is not the current user to create a message button
            if (follower_instance.id !== userId) {
                // Sets the button ID to include user and follower information
                let button_id = `dm---|---${follower_instance.id}---|---${follower_instance.name}`;
                // Creates the HTML for the message button
                but_string = `<div class="prof-bdg-msg"><button id=${button_id} class="dm-msg-but-id">Message</button></div>`;
            }

            // Variables to hold ID, inner HTML for follow/unfollow, and remove follower buttons
            let id_for_follower;
            let ih_for_follower;
            // Initializes an empty string for the remove follower button HTML
            let but_class_rf = '';
            // Initializes an empty string for the follow/unfollow button HTML
            let but_class_fb = '';

        // Check if the follower is not the current user
        if (follower_instance.id !== userId) {
    
        // If the follower follows the current user, create a "Remove Follower" button
        if (follower_instance.they_follow === true) {
            // Generate unique ID for the "Remove Follower" button
            id_for_follower = `rmv-follower---|---${userId}---|---${follower_instance.id}`;
            // Button text for "Remove Follower"
            ih_for_follower = 'Remove Follower';
            // HTML for the "Remove Follower" button with assigned ID and class
            but_class_rf = `<button class="rmv-flwr" id=${id_for_follower}>Remove Follower</button>`;
        }
        
        // If the current user follows this follower, create an "Unfollow" button
        if (follower_instance.i_follow === true) {
            // Generate unique ID for the "Unfollow" button
            id_for_follower = `unfollow---|---${userId}---|---${follower_instance.id}`;
            // HTML for the "Unfollow" button with assigned ID and class
            but_class_fb = `<button class="fl-bk" id=${id_for_follower}>Unfollow</button>`;
        } else {
            // If the current user does not follow this follower, create a "Follow" button
            // Generate unique ID for the "Follow" button
            id_for_follower = `follow---|---${userId}---|---${follower_instance.id}`;
            // HTML for the "Follow" button with assigned ID and class
            but_class_fb = `<button class="fl-bk" id=${id_for_follower}>Follow</button>`;
        }
    }
        follower_string += `
            <div class="prof-badge">
                <div class="prof-name-msg">
                <!-- Display follower's name as a clickable link with unique ID -->
                <div class="prof-name"><span class="bdg-prof-link" id="${follower_instance.id}---|---${userId}">${follower_instance.name}</span></div>
                ${but_string}
            </div>
            <div class="prf-bdg-but-place">
                ${but_class_rf}    <!-- Insert "Remove Follower" button if applicable -->
                ${but_class_fb}    <!-- Insert "Follow" or "Unfollow" button if applicable -->
            </div>       
        </div>`
    }
}
   // Initialize an empty string to build the HTML for users the current user is following
    let following_string = '';
    
    // Check if the following array exists and is not empty
    if (following_arr) {
    
        // Loop through each user in the following array
        for (let counter_2 = 0; counter_2 < following_arr.length; counter_2++) {
            // Get the current following user object
            let following_instance = following_arr[counter_2];
            
            // Initialize an empty string for the message button HTML
            let but_string = "";
    
            // If the user being followed is not the current user
            if (following_instance.id !== userId) {
                // Generate a unique ID for the message button
                let button_id = `dm---|---${following_instance.id}---|---${following_instance.name}`;
                // Create the message button HTML with the generated ID and assign it to `but_string`
                but_string = `<div class="prof-bdg-msg"><button id=${button_id} class="dm-msg-but-id">Message</button></div>`;
            }
    
            // Initialize variables for the follow/unfollow and remove follower button IDs and HTML
            let id_for_follower;
            let ih_for_follower;
            let but_class_rf = ""; // HTML for the "Remove Follower" button
            let but_class_fb = ""; // HTML for the "Follow" or "Unfollow" button
    
            // Ensure that the current following user is not the same as the current user
            if (following_instance.id !== userId) {
    
                // If the following user is also a follower of the current user, create a "Remove Follower" button
                if (following_instance.they_follow === true) {
                    // Generate a unique ID for the "Remove Follower" button
                    id_for_follower = `rmv-follower---|---${userId}---|---${following_instance.id}`;
                    // Button text for "Remove Follower"
                    ih_for_follower = 'Remove Follower';
                    // HTML for the "Remove Follower" button with the assigned ID and class
                    but_class_rf = `<button class="rmv-flwr" id=${id_for_follower}>Remove Follower</button>`;
                }
    
                // If the current user is following this user, create an "Unfollow" button
                if (following_instance.i_follow === true) {
                    // Generate a unique ID for the "Unfollow" button
                    id_for_follower = `unfollow---|---${userId}---|---${following_instance.id}`;
                    // HTML for the "Unfollow" button with the assigned ID and class
                    but_class_fb = `<button class="fl-bk" id=${id_for_follower}>Unfollow</button>`;
                } else {
                    // If the current user is not following this user, create a "Follow" button
                    // Generate a unique ID for the "Follow" button
                    id_for_follower = `unfollow---|---${userId}---|---${following_instance.id}`;
                    // HTML for the "Follow" button with the assigned ID and class
                    but_class_fb = `<button class="fl-bk" id=${id_for_follower}>Follow</button>`;
                }
            }
    
            // Append the HTML for the current following user to `following_string`
            following_string += `
            <div class="prof-badge">
                <div class="prof-name-msg">
                    <!-- Display the name of the user being followed as a clickable link with a unique ID -->
                    <div class="prof-name"><span class="bdg-prof-link" id="${following_instance.id}---|---${userId}">${following_instance.name}</span></div>
                    ${but_string} <!-- Insert the message button if applicable -->
                </div>
                <div class="prf-bdg-but-place">
                    ${but_class_rf} <!-- Insert "Remove Follower" button if applicable -->
                    ${but_class_fb} <!-- Insert "Follow" or "Unfollow" button if applicable -->      
                </div>
            </div>`;
        }
    }

    
    // Initialize empty strings for the direct message button, follow button, and remove follower button
    let dm_main_str = "";
    let flw_but_main_str = "";
    let rmv_fl_main_str = "";
    
    // Check if the user ID being viewed is not the current user's ID
    if (user_id !== userId) {
        // Generate a unique ID for the direct message button
        let but_id_dm = `dm---|---${user_id}---|---${user_name}`;
        // Create the HTML for the direct message button and assign it to `dm_main_str`
        dm_main_str = `<div class="dm_msg_main"><button class="dm_but_main" id=${but_id_dm}>Message</button></div>`;
    
        // If the current user follows this profile, create an "Unfollow" button
        if (profile_obj.i_follow) {
            // Generate a unique ID for the "Unfollow" button
            let but_id = `unfollow---|---${userId}---|---${user_id}`;
            // Create the HTML for the "Unfollow" button and assign it to `flw_but_main_str`
            flw_but_main_str = `<div class="follow-main"><button class="fl-main" id=${but_id}>Unfollow</button></div>`;
        } else {
            // If the current user does not follow this profile, create a "Follow" button
            // Generate a unique ID for the "Follow" button
            let but_id = `follow---|---${userId}---|---${user_id}`;
            // Create the HTML for the "Follow" button and assign it to `flw_but_main_str`
            flw_but_main_str = `<div class="follow-main"><button class="fl-main" id=${but_id}>Follow</button></div>`;
        }
    
        // If the profile user is following the current user, create a "Remove Follower" button
        if (profile_obj.they_follow) {
            // Generate a unique ID for the "Remove Follower" button
            let but_id = `rmv-follower---|---${userId}---|---${user_id}`;
            // Create the HTML for the "Remove Follower" button and assign it to `rmv_fl_main_str`
            rmv_fl_main_str = `<div class="remove-follower"><button class="rmv-fl-main" id=${but_id}>Remove Follower</button></div>`;
        }
    }
    
    // Build the main profile view HTML structure with user information and buttons
    let str_to_add = `<div class="profile-place">
        <div class="pp-top">
            <div class="profile-user-name">
                ${user_name} <!-- Display the user's name -->
            </div>
            ${dm_main_str} <!-- Insert direct message button if applicable -->
            ${flw_but_main_str} <!-- Insert follow/unfollow button if applicable -->
            ${rmv_fl_main_str} <!-- Insert remove follower button if applicable -->
            <div class="pp-close-but"><button class="pp-close-but-main">Close</button></div>
        </div>
        <div class="pp-bottom">
            <div class="profile-games">
                <div class="pg-header">
                    <div class="pg-title">Games</div> <!-- Section title for games stats -->
                    <div class="pg-stats">
                        <div class="pg-tot">Total: ${tot_games_played}</div> <!-- Total games played -->
                        <div class="pg-won">Won: ${won_games_count}</div> <!-- Total games won -->
                        <div class="pg-lost">Lost: ${lost_games_count}</div> <!-- Total games lost -->
                        <div class="pg-draw">Draw: ${draw_games_count}</div> <!-- Total games drawn -->
                    </div>
                </div>
                <div class="game-history">
                    ${game_history_string} <!-- Display game history details -->
                </div>
            </div>
            <div class="pp-followers">
                <div class="pp-frs-title">
                    Followers (${follower_arr.length || '0'}) <!-- Display the count of followers -->
                </div>
                <div class="pp-frs-content">
                    ${follower_string} <!-- Display followers list content -->
                </div>
            </div>
            <div class="pp-following">
                <div class="pp-fng-title">
                    Following (${following_arr.length || '0'}) <!-- Display the count of following users -->
                </div>
                <div class="pp-fng-content">
                    ${following_string} <!-- Display following list content -->
                </div>
            </div>
        </div>
    </div>`;
    
    // Make the profile overlay visible by setting its display style to "block"
    document.querySelector('.profile-place-overlay').style.display = "block";
    
    // Insert the generated profile HTML into the profile overlay element
    document.querySelector('.profile-place-overlay').innerHTML = str_to_add;
    
    // Add event listeners to the direct message button, if applicable, by calling `addEL_dm_but` with the profile user ID
    addEL_dm_but(user_id);

}

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
    const close_main_but = document.querySelector('.pp-close-but');
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
    close_main_but.addEventListener('click', ()=>{
        document.querySelector('.profile-place-overlay').style.display = "none"; // Hide overlay
        document.querySelector('.profile-place-overlay').innerHTML = ""; // Clear overlay content
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
}
// Event listener for 'refresh-prof' event from the socket
// Listen for 'refresh-prof' event from the socket
socket.on('refresh-prof', (some_obj) => {
    // Extract the id_1 and id_2 from the object passed by the event
    let id_1 = some_obj.id_1; // The first user ID
    let id_2 = some_obj.id_2; // The second user ID
    // Call the showProfile function, passing the current user and id_1 to display their profile
    showProfile(glob_current_user, id_1);
});

// Function to generate a result string based on the game outcome
function getResultString(is_me_first, my_name, opponent_name, result, opp_id, prof_user_id, userId) {
    // Check if the opponent is a computer bot and replace its name with "Computer"
    if (opponent_name === 'COMPUTER-BOT-HERE') {
        opponent_name = "Computer"; // Set opponent name to "Computer"
    }

    // Check if the current user is playing first ('O')
    if (is_me_first === 'true') {
        // If the current user wins ('W'), return the appropriate HTML result string
        if (result === 'W') {
            return `<div class="result_" style="color:green">Won</div>
            <div class="result_name" style="color: green">O:&nbsp;<span class="bdg-prof-link" id="${prof_user_id}---|---${userId}">${my_name}</span></div>
            <div class="result_name" style="color: red">X:&nbsp;<span class="bdg-prof-link" id="${opp_id}---|---${userId}">${opponent_name}</span></div>
            <div class="result_" style="color:red">Lost</div>`; // Current user wins, opponent loses
        } 
        // If the current user loses ('L'), return the appropriate HTML result string
        else if (result === 'L') {
            return `<div class="result_" style="color:red">Lost</div>
            <div class="result_name" style="color: red">O:&nbsp;<span class="bdg-prof-link" id="${prof_user_id}---|---${userId}">${my_name}</span></div>
            <div class="result_name" style="color: green">X:&nbsp;<span class="bdg-prof-link" id="${opp_id}---|---${userId}">${opponent_name}</span></div>
            <div class="result_" style="color:green">Won</div>`; // Current user loses, opponent wins
        } 
        // If the result is a draw ('D'), return the appropriate HTML result string
        else {
            return `<div class="result_" style="color:white">Draw</div>
            <div class="result_name" style="color: white">O:&nbsp;<span class="bdg-prof-link" id="${prof_user_id}---|---${userId}">${my_name}</span></div>
            <div class="result_name" style="color: white">X:&nbsp;<span class="bdg-prof-link" id="${opp_id}---|---${userId}">${opponent_name}</span></div>
            <div class="result_" style="color:white">Draw</div>`; // Draw between both players
        }
    } 
    // If the current user is playing second ('X')
    else {
        // If the current user loses ('L'), return the appropriate HTML result string
        if (result === 'L') {
            return `<div class="result_" style="color:green">Won</div>
            <div class="result_name" style="color: green">O:&nbsp;<span class="bdg-prof-link" id="${opp_id}---|---${userId}">${opponent_name}</span></div>
            <div class="result_name" style="color: red">X:&nbsp;<span class="bdg-prof-link" id="${prof_user_id}---|---${userId}">${my_name}</span></div>
            <div class="result_" style="color:red">Lost</div>`; // Opponent wins, current user loses
        } 
        // If the current user wins ('W'), return the appropriate HTML result string
        else if (result === 'W') {
            return `<div class="result_" style="color:red">Lost</div>
            <div class="result_name" style="color: red">O:&nbsp;<span class="bdg-prof-link" id="${opp_id}---|---${userId}">${opponent_name}</span></div>
            <div class="result_name" style="color: green">X:&nbsp;<span class="bdg-prof-link" id="${prof_user_id}---|---${userId}">${my_name}</span></div>
            <div class="result_" style="color:green">Won</div>`; // Opponent loses, current user wins
        } 
        // If the result is a draw ('D'), return the appropriate HTML result string
        else {
            return `<div class="result_" style="color:white">Draw</div>
            <div class="result_name" style="color: white">O:&nbsp;<span class="bdg-prof-link" id="${opp_id}---|---${userId}">${opponent_name}</span></div>
            <div class="result_name" style="color: white">X:&nbsp;<span class="bdg-prof-link" id="${prof_user_id}---|---${userId}">${my_name}</span></div>
            <div class="result_" style="color:white">Draw</div>`; // Draw between both players
        }
    }
}
