/**
Name of Program: server.js
Description: Node.js server script for backend functionality
Inputs: None
Outputs: None
Author: Zach Alwin, Kristin Boeckmann, Lisa Phan, Nicholas Hausler, Vinayak Jha
Creation Date: 10/27/2024
 */
// Importing required libraries and dependencies
const express = require('express'); // Express framework for building web applications
const expressLayouts = require('express-ejs-layouts'); // Layout middleware for EJS templating
const mongoose = require('mongoose');  // Mongoose for MongoDB object modeling
const passport = require('passport'); // Passport for authentication
const flash = require('connect-flash');  // Flash messaging for displaying messages to the user
const session = require('express-session'); // Session middleware for session handling
const path = require('path'); // Path module for handling file paths
const http = require("http"); // HTTP module to create server
const app = express();   // Initializing Express app

// Setting up server to listen on a specified port (environment variable or 2000)
var server=app.listen(process.env.PORT || 2000, ()=>{console.log("Listening.....")});

// Initializing Socket.io for real-time communication
const socket = require("socket.io");
// Setting up server with Socket.io
const io = socket(server);

// Serving static files from 'public' directory

app.use(express.static(path.join(__dirname, 'public')));

// Setting the views directory

app.set('views','./public/views');
//Time:
const moment = require('moment')

// Passport configuration file
require('./config/passport')(passport)
//Mongoose:
// Get the DB URL from environment
const db = process.env.DB_URL;
// Conenct to the database
mongoose.connect(db, { useNewUrlParser: true })
    .then(()=>console.log("Mongoose Connected"))
    .catch((err)=>console.log(err));
//EJS layouts
app.use(expressLayouts);
// Set view engine
app.set('view engine', 'ejs');

// Set properties
app.use(express.urlencoded({extended: false}));

// Set properties
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use((req, res, next)=>{
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg')
    res.locals.error = req.flash('error');
    next();
})
app.use('/', require('./public/routes/index'))
app.use('/users', require('./public/routes/users'))

//Utility Classes:
class active_game{
    constructor(player1, player2, player1_user_id, player2_user_id, room_name){
        this.player1 = player1;
        this.player1_user_id = player1_user_id;
        this.player2_user_id = player2_user_id;
        this.player2 = player2;
        this.board_state = undefined;
        this.room_name = room_name;
        this.current_player = 1;
        this.current_result = 0; // 0 for nothing, 'P1 for player1 wins', P2 for player2 wins', 'D for a draw'
        this.isWithComp = false;
        this.last_obj;
    }
}

// Add global property to array same an element
Array.prototype.sample = function(){
    return this[Math.floor(Math.random()*this.length)];
  }


// Name: getScore
// Author: Nick
// Date: 10/27/2024
// Preconditions: biard with new move, current player, comparison symbol
// Postconditions: score as an int
function getScore(board_with_new_move, played_player, comp_sym){

    // Get empty position
    let empty_pos_on_board = board_with_new_move.get_empty_pos(board_with_new_move);
    // If there is a win, return win or loss
    if (board_with_new_move.check_for_win(board_with_new_move) == true){
        if (played_player.symbol_str == comp_sym.symbol_str){
            // if player is the same, it's a win so +10
            return 10;
        }
        else{
            // Otherwise, it's a loss, return -10
            return -10;
        }
    }
    else {
        // This is draw, no more empty positions
        if (empty_pos_on_board.length == 0){
            return 0;
        }
        else{
            // For each different move, compute the next score
            let score_arr = [];
            // Iterate through each empty position
            for (let pos_index = 0; pos_index < empty_pos_on_board.length; pos_index++){
                var sym_to_use;
                if (played_player.symbol_str == 'x'){
                    // Generate "O" as that's the next symbol
                    sym_to_use = new Symbol('o');
                }
                else{
                    // Generate "X" as that's the next symbol
                    sym_to_use = new Symbol('x');
                }
                // Get the score after making this move
                let score_get = getScore(board_with_new_move.make_move_copy(sym_to_use, empty_pos_on_board[pos_index], board_with_new_move), sym_to_use, comp_sym);
                // Push the score 
                score_arr.push(score_get);
            }
            // Get the max if current player is bot
            if (played_player.symbol_str !== comp_sym.symbol_str)
            {
                return Math.max.apply(Math, score_arr);
            }
            else {
                // return min otherwise
                return Math.min.apply(Math, score_arr);
            }
        }
        }
}

// Name: nextMove
// Author: Nick
// Date: 10/27/2024
// Preconditions: board_state, comp_sym
// Postconditions: next move as an int
function nextMove(board_state, comp_sym){
    // Get the empty position
    let empty_pos_ = board_state.get_empty_pos(board_state);
    let score_arr_state = []
    let x_sym = board_state.sym1;
    for (let count = 0; count < empty_pos_.length; count++){
        // Generate new board for each move
        let new_board = board_state.make_move_copy(comp_sym, empty_pos_[count], board_state);
        // Append the score
        score_arr_state.push(getScore(new_board, comp_sym, comp_sym));
    }
    // Compute the max
    let max_ = Math.max.apply(Math, score_arr_state);
    for (let count2 = 0; count2 < empty_pos_.length; count2++){
        // Return the move that maximizes the max
        if (score_arr_state[count2] == max_){
            return empty_pos_[count2]
        }
    }
}   

class Board{

    // Name:  constructor for board
    // Author: Nick
    // Date: 10/27/2024
    // Preconditions: init_sym, sym1, sym2, board_array, board_res, board_stat
    // Postconditions: Board object
    constructor(init_sym, sym1, sym2, board_array, board_res, board_stat){
        this.init_sym = init_sym; // Set the initial symbol
        this.board_array = board_array; // Set the board array
        this.sym1 = sym1; // Set symbol1
        this.sym2 = sym2; // Set symbol2
        this.board_res = board_res; // Set board result
        this.board_stat = board_stat; // Set board status
    }

    // Name:  get_board_as_val
    // Author: Nick
    // Date: 10/27/2024
    // Preconditions: self
    // Postconditions: Array that represents the board    
    get_board_as_val = (self) =>{
        // Iterate through each position, and return the symbol that represents the srr
        return self.board_array.map((sym)=>sym.symbol_str);
    }

    // Name: get_empty_pos
    // Author: Nick
    // Date: 10/27/2024
    // Preconditions: self
    // Postconditions: Get array of empty positions
    get_empty_pos = (self) => {
        // The first symbol
        let init_sym_loc = self.init_sym;
        let return_array = [];
        let board_array_to_use = self.board_array;
        for (let i = 0; i < board_array_to_use.length; i++){
            // Iterate through the array and if the initial symbol is the symbol, append to empty
            if (board_array_to_use[i].symbol_str == init_sym_loc.symbol_str){
                return_array.push(i);
            }
        }
        // Return the empty
        return return_array;
    }

    // Name: check_for_win
    // Author: Nick
    // Date: 10/27/2024
    // Preconditions: self
    // Postconditions: Check if there is a win
    check_for_win = (self) =>{
        // Get empty position
        let empty_pos = self.get_empty_pos(self);
        // Board sa values
        let board_as_val = self.get_board_as_val(self);
        // Get empty synbol repr
        let empty_sym_str = self.init_sym.symbol_str;
        // Get symbol1 str
        let sym1_str = self.sym1.symbol_str;
        // Get the symbol2 str
        let sym2_str = self.sym2.symbol_str;

        function check_for_column(board_as_val_temp, sym1_str_temp, sym2_str_temp){
            for (let col_index = 0; col_index < 3; col_index++){
                // Iterate through each column
                let sym1_count = 0;
                let sym2_count = 0;
                for (let row_index = 0; row_index < 3; row_index++){
                    // Iterate through each row
                    let pos_val = board_as_val_temp[col_index + 3*(row_index)]
                    sym1_count += (+(pos_val === sym1_str_temp));
                    sym2_count += (+(pos_val === sym2_str_temp));
                }
                // If any symbol gets full count, it's a win
                if ((sym1_count == 3) || (sym2_count==3)){
                    return true
                } 
            }
            return false
        }
        // Name: check_for_row
        // Author: Nick
        // Date: 10/27/2024
        // Preconditions: board_as_val_temp, sym1_str_temp, sym2_str_temp
        // Postconditions: check for a row win (boolean)
        function check_for_row(board_as_val_temp,  sym1_str_temp, sym2_str_temp){
            for (let row_index = 0; row_index < 3; row_index++){
                // Iterate through each row
                let sym1_count = 0;
                let sym2_count = 0;
                for (let col_index = 0; col_index < 3; col_index++){
                    // Iterate through each column
                    let pos_val = board_as_val_temp[3*row_index + (col_index)]
                    sym1_count += (+(pos_val === sym1_str_temp));
                    sym2_count += (+(pos_val === sym2_str_temp));
                }
                // If any symbol gets full count, it's a win
                if ((sym1_count == 3) || (sym2_count==3)){
                    return true
                } 
            }
            return false
        }

        // Name: check_for_diag
        // Author: Nick
        // Date: 10/27/2024
        // Preconditions: board_as_val_temp, sym1_str_temp, sym2_str_temp
        // Postconditions: check for a diagonal win (boolean)
        function check_for_diag(board_as_val_temp, sym1_str_temp, sym2_str_temp){
            for (let diag_index = 0; diag_index < 3; diag_index+=2){
                // Iterate through each diagonal
                let sym1_count = 0;
                let sym2_count = 0;
                for (let ran_cnt = 0; ran_cnt < 3; ran_cnt++){
                    // iterate along the diagonal
                    let pos_val = board_as_val_temp[diag_index + (ran_cnt*(4-diag_index))]
                    sym1_count += (+(pos_val === sym1_str_temp));
                    sym2_count += (+(pos_val === sym2_str_temp));
                }
                // If any symbol gets full count, it's a win
                if ((sym1_count == 3) || (sym2_count==3)){
                    return true
                } 
            }
            return false
        }

        // Return column win or a row win or a diagonal win
        return (check_for_column(board_as_val, sym1_str, sym2_str) || check_for_row(board_as_val, sym1_str, sym2_str) || check_for_diag(board_as_val, sym1_str, sym2_str));
    }
    // Perform a move
    make_move = (symbol_, pos_, self) => {
        self.board_array[pos_] = symbol_;
    }
    // Make a move, but return a new board to avoid mutation
    make_move_copy = (symbol_, pos_, self) => {
        // Initialize empty symbol
        let empty_sym = new Symbol('0');
        // Initialize X symbol
        let x_sym = new Symbol('x');
        // Initialize O symbol
        let o_sym = new Symbol('o');

        // Initialize board array
        let board_arr = [];
    
        let board_main = self.board_array;
        for (let index = 0; index < board_main.length; index++){
            // Copy over the X moves
            if (board_main[index].symbol_str == 'x'){
                board_arr.push(x_sym);
            }
            // Copy over the O moves
            else if (board_main[index].symbol_str == 'o'){
                board_arr.push(o_sym);
            }
            else{
                // Push the empty symbols
                board_arr.push(empty_sym);
            }

        }
        // Perform the new move
        board_arr[pos_] = symbol_;
        // Initialize and return the new board
        let board_to_return = new Board(empty_sym, x_sym, o_sym, board_arr, 0, 0);
        return board_to_return;
    }
    // Pretty print a board
    printBoard=(self)=>{
        alert(self.get_board_as_val(self).toString());
    }
    // Return which move was a win
    get_which_win=(self)=>{
            // Get boars as a value
            let board_as_val = self.get_board_as_val(self);
            // Get the first symbol str
            let sym1_str = self.sym1.symbol_str;
            // Get the second symbol str
            let sym2_str = self.sym2.symbol_str;

            // Name: check_for_column
            // Author: Nick
            // Date: 10/27/2024
            // Preconditions: board_as_val_temp, sym1_str_temp, sym2_str_temp
            // Postconditions: check for a column win (col-index)
            function check_for_column(board_as_val_temp, sym1_str_temp, sym2_str_temp){
                for (let col_index = 0; col_index < 3; col_index++){
                    // Iterate through each column
                    let sym1_count = 0;
                    let sym2_count = 0;
                    for (let row_index = 0; row_index < 3; row_index++){
                        // Iterate through each row
                        let pos_val = board_as_val_temp[col_index + 3*(row_index)]
                        sym1_count += (+(pos_val === sym1_str_temp));
                        sym2_count += (+(pos_val === sym2_str_temp));
                    }
                    // If any symbol gets full count, it's a win
                    if ((sym1_count == 3) || (sym2_count==3)){
                        // return string of index
                        return `col-${col_index}`;
                    } 
                }
                return false
            }
            // Name: check_for_row
            // Author: Nick
            // Date: 10/27/2024
            // Preconditions: board_as_val_temp, sym1_str_temp, sym2_str_temp
            // Postconditions: check for a row win (string or boolean)
            function check_for_row(board_as_val_temp, sym1_str_temp, sym2_str_temp){
                for (let row_index = 0; row_index < 3; row_index++){
                    // Iterate through each row
                    let sym1_count = 0;
                    let sym2_count = 0;
                    for (let col_index = 0; col_index < 3; col_index++){
                        // Iterate through each column
                        let pos_val = board_as_val_temp[3*row_index + (col_index)]
                        sym1_count += (+(pos_val === sym1_str_temp));
                        sym2_count += (+(pos_val === sym2_str_temp));
                    }
                    // If any symbol gets full count, it's a win
                    if ((sym1_count == 3) || (sym2_count==3)){
                        return `row-${row_index}`;
                    } 
                }
                return false
            }
            // Name: check_for_diag
            // Author: Nick
            // Date: 10/27/2024
            // Preconditions: board_as_val_temp, sym1_str_temp, sym2_str_temp
            // Postconditions: check for a diagonal win (boolean)
            function check_for_diag(board_as_val_temp,sym1_str_temp, sym2_str_temp){
                for (let diag_index = 0; diag_index < 3; diag_index+=2){
                    // Iterate through each diagonal
                    let sym1_count = 0;
                    let sym2_count = 0;
                    for (let ran_cnt = 0; ran_cnt < 3; ran_cnt++){
                        // iterate along the diagonal
                        let pos_val = board_as_val_temp[diag_index + (ran_cnt*(4-diag_index))]
                        sym1_count += (+(pos_val === sym1_str_temp));
                        sym2_count += (+(pos_val === sym2_str_temp));
                    }
                    // If any symbol gets full count, it's a win
                    if ((sym1_count == 3) || (sym2_count==3)){
                        return `diag-${diag_index}`;
                    } 
                }
                return false
            }
            // Return column win or a row win or a diagonal win
            return (check_for_column(board_as_val, sym1_str, sym2_str) || check_for_row(board_as_val, sym1_str, sym2_str) || check_for_diag(board_as_val, sym1_str, sym2_str));
    }
}

// Symbol Utility class
class Symbol{
    constructor(symbol_str){
        this.symbol_str = symbol_str;
    }
    return_val = () =>{
        return this.symbol_str;
    }
}

// Online User class
class online_user{
    constructor(online_user_id){
        this.online_user_id = online_user_id;
        this.your_feed_index = 0;
        this.your_posts_index = 0;
        this.liked_posts_index = 0;
    }
}
const x_sym = new Symbol('x');
const o_sym = new Symbol('o');
const empty_sym = new Symbol('0');

//Socket Commands:
const User = require('./models/User');
const { timeLog } = require('console');
const req = require('express/lib/request');
const { post } = require('./public/routes/index');
let online_users = []; // Store all online users
let socket_id_dict = {}; // Store all socket
let players_rooms = []; // Store all player rooms
let active_games = []; // Store all active games
let active_players = new Set([]); // Store all active players
let socket_id_dict_players = {};
io.on('connection', socket=>{
    // Main function handled on a connection
    console.log('New WS Connection');
    socket.on('makeUserOnline', (userId)=>{
        // Make a user online
        User.findByIdAndUpdate(userId, {onlineState: 'true'}, (err, docs)=>{
            // Find the user by ID
            if (err) { console.log(err);
            }else{
                // Update the user's online status
                let temp_user = new online_user(userId);
                // update the online users active
                online_users.push(temp_user);
                // update socket for a user
                socket_id_dict[socket.id] = userId;
            }
        })});
    socket.on('disconnect', ()=>{
            // Make a user offline
            User.findByIdAndUpdate(socket_id_dict[socket.id], {onlineState: 'false'}, (err, docs)=>{
                if (err) { console.log(err);
                }else{
                    if (docs){
                    // Find the user in the online users
                    let index_of_user = online_users.findIndex((elem) => {elem.online_user_id === socket_id_dict[socket.id]})
                    online_users.splice(index_of_user); // Remove the user from the online user
                    let name_ = docs.name;
                    let room_name_pos = `${docs._id}--|--${docs.name}`;
                    // Get all the player rooms which the user is part of
                    if (players_rooms.includes(room_name_pos)){
                        // Append the player room to the list after finding
                        let index_in_pr = players_rooms.indexOf(room_name_pos);
                        players_rooms.splice(index_in_pr);
                    }
                }
                }
            })
            // Get the id of user disconnected
            let user_disconnected = socket_id_dict_players[socket.id];

            for (let temp_counter_2  = 0; temp_counter_2 < active_games.length; temp_counter_2++){
                // Iterate through active games
                let temp_pl_1_id = active_games[temp_counter_2].player1_user_id; // ID of player 1
                let temp_pl_1_name = active_games[temp_counter_2].player1; // Name of player 1
                let temp_pl_2_name = active_games[temp_counter_2].player2; // ID of player 2 
                let temp_pl_2_id = active_games[temp_counter_2].player2_user_id; // Name of player 2
                let current_player = active_games[temp_counter_2].current_player; // Get the current player
                if ((temp_pl_1_id === user_disconnected) || (temp_pl_2_id === user_disconnected)){ // If any of the plaer was disconnected proceed
                    if (active_games[temp_counter_2].current_result === 0){ // if result is decided, update stats
                            if ((temp_pl_1_id === user_disconnected)){ // If the player 1 is disconnected, proceed
                                active_games[temp_counter_2].current_result = 'P2'; // Set player 2 as the current result
                                // Append the player1's game result after finding by iD
                                User.findByIdAndUpdate(temp_pl_1_id, {$push: {'games':{'opponent': temp_pl_2_id, 'me_first_player': true, 'opponent_name':temp_pl_2_name, result:"L"}}}, (err, follower_)=>{
                                    if(err){
                                        console.log(err);
                                    }
                                });
                                // Append the player2's game result after finding by iD
                                User.findByIdAndUpdate(temp_pl_2_id, {$push: {'games':{'opponent': temp_pl_1_id, 'me_first_player': false, 'opponent_name':temp_pl_1_name, result:"W"}}}, (err, follower_)=>{
                                    if(err){
                                        console.log(err);
                                    }
                                })
                                // Update the win, loss, draw, count stats
                                updateWLDGcount(temp_pl_1_id, temp_pl_2_id, 'P2', 0);
                            }else{
                                active_games[temp_counter_2].current_result = 'P1';  // Set player 1 as the current result
                                // Append the player1's game result after finding by iD
                                User.findByIdAndUpdate(temp_pl_1_id, {$push: {'games':{'opponent': temp_pl_2_id, 'me_first_player': true, 'opponent_name':temp_pl_2_name, result:"W"}}}, (err, follower_)=>{
                                    if(err){
                                        console.log(err);
                                    }
                                })
                                // Append the player2's game result after finding by iD
                                User.findByIdAndUpdate(temp_pl_2_id, {$push: {'games':{'opponent': temp_pl_1_id, 'me_first_player': false, 'opponent_name':temp_pl_1_name, result:"L"}}}, (err, follower_)=>{
                                    if(err){
                                        console.log(err);
                                    }
                                })
                                // Update the win, loss, draw, count stats
                                updateWLDGcount(temp_pl_1_id, temp_pl_2_id, 'P1', 0);

                            }
                            // Emit the disconnected result
                            io.to(active_games[temp_counter_2].room_name).emit('dis-result','0');
                            // Leave the sockect
                            io.socketsLeave(active_games[temp_counter_2].room_name);
                            // Remove the game from the active game
                            active_games.splice(temp_counter_2);
                            // Delete active player1
                            active_players.delete(temp_pl_1_id);
                            // Delete active player2
                            active_players.delete(temp_pl_2_id);


                        }
                    else{
                        // Simply emit disconnect
                        io.to(active_games[temp_counter_2].room_name).emit('other-dis','0');
                        // Leave the sockect
                        io.socketsLeave(active_games[temp_counter_2].room_name);
                        // Remove the game from the active game
                        active_games.splice(temp_counter_2);
                        // Delete active player1
                        active_players.delete(temp_pl_1_id);
                        // Delete active player2
                        active_players.delete(temp_pl_2_id);

                }
                }
            }
        });

    // Handle connecting with someone
    socket.on('connect_with_someone', (user)=>{
        // Set a random timeout for race conditions
        setTimeout(()=>{},Math.floor(Math.random()*3000));
        // Store socket id
        socket_id_dict_players[socket.id] = user.user_id;
        if (players_rooms.length === 0){
            // Create a player room and push the user
            players_rooms.push(`${user.user_id}--|--${user.user_name}`);
            // Join the user room
            socket.join(`${user.user_id}`);
            }
            else{
            // Otherwise, wait for a connection
            if (players_rooms.includes(`${user.user_id}--|--${user.user_name}`)){
                // Emit waiting on a connection
                socket.emit('msg', "Please wait for a connection");
            }else{
                // Get room to join
                let room_to_join = players_rooms[0];
                // Remove player oom
                players_rooms.splice([0]);
                // Get other player name
                let other_player_name = room_to_join.split('--|--')[1];
                // Get my name
                let my_name = user.user_name;
                // Get room number
                let room_num =  room_to_join.split('--|--')[0];
                // Join the room
                socket.join(`${room_num}`);
                // Set the players
                let player1 = other_player_name;
                let player2 = my_name;
                // To the room, emit multi-player-connect
                io.to(room_num).emit('multi-player-connect', `${player1}---|---${player2}---|---${room_num}---|---${user.user_id}`);
                // Add the active players
                active_players = new Set([...active_players, user.user_id, room_num]);
                // Create an active game
                let active_game_instance = new active_game(player1, player2, room_num, user.user_id, room_num);
                // Create a new board state
                let new_board_state = new Board(empty_sym, x_sym, o_sym, [empty_sym, empty_sym, empty_sym, empty_sym, empty_sym, empty_sym, empty_sym, empty_sym, empty_sym]);
                // Set the board state to active game
                active_game_instance.board_state = new_board_state;
                // Get the state payload
                let temp_obj_t = {
                    'current_turn': 1,
                    'but-enable': true,
                    'but_1': '',
                    'but_2': '',
                    'but_3': '',
                    'but_4': '',
                    'but_5': '',
                    'but_6': '',
                    'but_7': '',
                    'but_8': '',
                    'but_9': '',
                    'msg': 'You can chat here!'
                }
                // Send the object to frontend for rendering
                io.to(room_num).emit('web-render-msg', temp_obj_t)
                // Set the last object
                active_game_instance.last_obj = JSON.parse(JSON.stringify(temp_obj_t));
                // Set active game
                active_games.push(active_game_instance);
            }
        }

    });
    // Handle removing from connect line
    socket.on('remove-from-connect-line', (user_info)=>{
        // Remove from the player room after finding
        let index_in_player_rooms = players_rooms.indexOf(`${user_info.user_id}--|--${user_info.user_name}`);
        players_rooms.splice(index_in_player_rooms);
    })
    //function of managing the move of the live player in the tic-tac-toe game, updating the game board and rendering the player's move in a game room.
    function make_move_render(room_number, game_active, current_board, move_sym, move_index, current_turn_){
        current_board.make_move(move_sym, move_index, current_board); //update the game board according to player's mov
        let current_turn = current_turn_;  //set the given turn value to the current turn
        game_active.current_player = current_turn;  //update the current player
        let temp_board_state = current_board.get_board_as_val(current_board); //return an array of values representing the state of the current board
        let init_obj = { //initialize an object to hold the sate of current game for rendering
        'current_turn': current_turn,
        'but_1': '',
        'but_2': '',
        'but_3': '',
        'but_4': '',
        'but_5': '',
        'but_6': '',
        'but_7': '',
        'but_8': '',
        'but_9': '',
        'msg': ''}
        // loop for assigning the appropriate button in the render object of the game board state
        for (let temp_counter = 0; temp_counter < 9; temp_counter++){
            if (temp_board_state[temp_counter] === '0'){
                //if the current position is empty, return an empty string
                init_obj[`but_${temp_counter+1}`] = '';
            }else if(temp_board_state[temp_counter] === 'x'){
                //else if the current position is 'x', then set the button to 'X'
                init_obj[`but_${temp_counter+1}`] = 'X';
            }else{
                //otherwise, set the button to 'O'
                init_obj[`but_${temp_counter+1}`] = 'O';
            }

    }
    //report the updating of the board state to clients for rendering
    io.to(room_number).emit('web-render-msg', init_obj)
    //save the last board state for the fame session
    game_active.last_obj = JSON.parse(JSON.stringify(init_obj));
    //check if there is any win condition on the board exists
    let isWin = current_board.check_for_win(current_board);
     //assign empty positions
    let empty_pos = current_board.get_empty_pos(current_board);
     //retrieves the IDs and names of both players from the game_active object in the event of win or draw
    let temp_pl_1_id = game_active.player1_user_id;
    let temp_pl_2_id = game_active.player2_user_id;
    let temp_pl_1_name = game_active.player1;
    let temp_pl_2_name = game_active.player2;
    if (isWin){ //handle the moves in the game when a win condition is detected
        if (current_turn === 2){ //in case the current turn belongs to player 1, then they are the winner
            //announce that player 1 is the winner and broadcast the result to clients
            io.to(room_number).emit('result_here', {result: 'P1', string: current_board.get_which_win(current_board)});
            game_active.current_result = 'P1'; //update the game state that player 1 is the winner
            //Update the database with the game results
            User.findByIdAndUpdate(temp_pl_1_id, {$push: {'games':{'opponent': temp_pl_2_id, 'me_first_player': true, 'opponent_name':temp_pl_2_name, result:"W"}}}, (err, follower_)=>{
                if(err){
                    console.log(err); //if there is error occur, log all errors in the updating player 1's win record
                }
            })
            User.findByIdAndUpdate(temp_pl_2_id, {$push: {'games':{'opponent': temp_pl_1_id, 'me_first_player': false, 'opponent_name':temp_pl_1_name, result:"L"}}}, (err, follower_)=>{
                if(err){
                    console.log(err); //if there is error occur, log all errors in the updating player 2's loss record
                }
            })
            updateWLDGcount(temp_pl_1_id, temp_pl_2_id, 'P1', 0); //update the counters by calling a function, indicating that player 1 won 
        }else{ 
            // in case it's player 2's turn, then they are the winner
            io.to(room_number).emit('result_here', {result: 'P2', string: current_board.get_which_win(current_board)})
            game_active.current_result = 'P2';
            User.findByIdAndUpdate(temp_pl_1_id, {$push: {'games':{'opponent': temp_pl_2_id, 'me_first_player': true, 'opponent_name':temp_pl_2_name, result:"L"}}}, (err, follower_)=>{
                if(err){
                    console.log(err);
                }
            })
            User.findByIdAndUpdate(temp_pl_2_id, {$push: {'games':{'opponent': temp_pl_1_id, 'me_first_player': false, 'opponent_name':temp_pl_1_name, result:"W"}}}, (err, follower_)=>{
                if(err){
                    console.log(err);
                }
            })
            updateWLDGcount(temp_pl_1_id, temp_pl_2_id, 'P2', 0);
    }

    }else{
        // in case there is no winner, check in the draw if the have has ended 
        if(empty_pos.length === 0){ //in case there is no more spaces left on the board, report the draw result to clients in the game room
            io.to(room_number).emit('result_here', {result: 'D', string: "none"})
            game_active.current_result = 'D'; //set the game state to reflect a draw
            // Update the database to reflect the draw for player 1
            User.findByIdAndUpdate(temp_pl_1_id, {$push: {'games':{'opponent': temp_pl_2_id, 'me_first_player': true, 'opponent_name':temp_pl_2_name, result:"D"}}}, (err, follower_)=>{
                if(err){
                    console.log(err);
                }
            });
            // Update the database to reflect the draw for player 2
            User.findByIdAndUpdate(temp_pl_2_id, {$push: {'games':{'opponent': temp_pl_1_id, 'me_first_player': false, 'opponent_name':temp_pl_1_name, result:"D"}}}, (err, follower_)=>{
                if(err){
                    console.log(err);
                }
            })
            updateWLDGcount(temp_pl_1_id, temp_pl_2_id, 'D', 0);

        }
    }
    }
    //function of managing the move of the computer in the tic-tac-toe game, updating the game board and rendering the player's move in a game room.
    function comp_make_move_render(room_number, game_active, current_board, move_sym, move_index, current_turn_, comp_sym){
        current_board.make_move(move_sym, move_index, current_board); //update the game board according to player's move
        let current_turn = current_turn_; //set the given turn value to the current turn
        game_active.current_player = current_turn; //update the current player
        let temp_board_state = current_board.get_board_as_val(current_board); //return an array of values representing the state of the current board
        let init_obj = { //initialize an object to hold the sate of current game for rendering
        'current_turn': game_active.current_player,
        'but_1': '',
        'but_2': '',
        'but_3': '',
        'but_4': '',
        'but_5': '',
        'but_6': '',
        'but_7': '',
        'but_8': '',
        'but_9': '',
        'msg': ''}
        // loop for assigning the appropriate button in the render object of the game board state
        for (let temp_counter = 0; temp_counter < 9; temp_counter++){
            if (temp_board_state[temp_counter] === '0'){ //if the current position is empty, return an empty string
                init_obj[`but_${temp_counter+1}`] = '';
            }else if(temp_board_state[temp_counter] === 'x'){ //else if the current position is 'x', then set the button to 'X'
                init_obj[`but_${temp_counter+1}`] = 'X';
            }else{ //otherwise, set the button to 'O'
                init_obj[`but_${temp_counter+1}`] = 'O';
            }

        }
        io.to(room_number).emit('web-render-msg', init_obj) //report the updating of the board state to clients for rendering
        game_active.last_obj = JSON.parse(JSON.stringify(init_obj)); //save the last board state for the fame session
        let isWin = current_board.check_for_win(current_board); //check if there is any win condition on the board exists
        let empty_pos = current_board.get_empty_pos(current_board); //assign empty positions
        //retrieves the IDs and names of both players from the game_active object in the event of win or draw
        let temp_pl_1_id = game_active.player1_user_id;
        let temp_pl_2_id = game_active.player2_user_id;
        let temp_pl_1_name = game_active.player1;
        let temp_pl_2_name = game_active.player2;
        if (isWin){ //handle the moves in the game when a win condition is detected
            if (current_turn === 2){ //in case the current turn belongs to player 1, then they are the winner
                io.to(room_number).emit('result_here', {result: 'P1', string: current_board.get_which_win(current_board)}) //announce that player 1 is the winner and broadcast the result to clients
                game_active.current_result = 'P1'; //update the game state that player 1 is the winner
                //Update the database with the game results
                User.findByIdAndUpdate(temp_pl_1_id, {$push: {'games':{'opponent': temp_pl_2_id, 'me_first_player': true, 'opponent_name':temp_pl_2_name, result:"W"}}}, (err, follower_)=>{
                    if(err){
                        console.log(err); //if there is error occur, log all errors in the updating player 1's win record
                    }
                })
                User.findByIdAndUpdate(temp_pl_2_id, {$push: {'games':{'opponent': temp_pl_1_id, 'me_first_player': false, 'opponent_name':temp_pl_1_name, result:"L"}}}, (err, follower_)=>{
                    if(err){
                        console.log(err); //if there is error occur, log all errors in the updating player 2's loss record
                    }
                })
                updateWLDGcount(temp_pl_1_id, temp_pl_2_id, 'P1', 2); //update the counters by calling a function, indicating that player 1 won 
            }else{ // in case it's player 2's turn, then they are the winner
                io.to(room_number).emit('result_here', {result: 'P2', string: current_board.get_which_win(current_board)})
                game_active.current_result = 'P2';
                User.findByIdAndUpdate(temp_pl_1_id, {$push: {'games':{'opponent': temp_pl_2_id, 'me_first_player': true, 'opponent_name':temp_pl_2_name, result:"L"}}}, (err, follower_)=>{
                    if(err){
                        console.log(err);
                    }
                })
                User.findByIdAndUpdate(temp_pl_2_id, {$push: {'games':{'opponent': temp_pl_1_id, 'me_first_player': false, 'opponent_name':temp_pl_1_name, result:"W"}}}, (err, follower_)=>{
                    if(err){
                        console.log(err);
                    }
                })
                updateWLDGcount(temp_pl_1_id, temp_pl_2_id, 'P2', 1);
        }

        }else{ // in case there is no winner, check in the draw if the have has ended 
            if(empty_pos.length === 0){ //in case there is no more spaces left on the board, report the draw result to clients in the game room
                io.to(room_number).emit('result_here', {result: 'D', string: "none"})
                game_active.current_result = 'D'; //set the game state to reflect a draw
                if (current_turn === 1){ //if the current turn (also the last turn) is player 1's turn, update the database with the player 1's last draw
                User.findByIdAndUpdate(temp_pl_1_id, {$push: {'games':{'opponent': temp_pl_2_id, 'me_first_player': true, 'opponent_name':temp_pl_2_name, result:"D"}}}, (err, follower_)=>{
                    if(err){
                        console.log(err);
                    }
                })
                User.findByIdAndUpdate(temp_pl_2_id, {$push: {'games':{'opponent': temp_pl_1_id, 'me_first_player': false, 'opponent_name':temp_pl_1_name, result:"D"}}}, (err, follower_)=>{
                    if(err){
                        console.log(err);
                    }
                })
                updateWLDGcount(temp_pl_1_id, temp_pl_2_id, 'D', 1); //update all counters for both players
            }else{ //if the current turn (also the last turn) is player 2's turn, update the database with the player 2's last draw
                User.findByIdAndUpdate(temp_pl_1_id, {$push: {'games':{'opponent': temp_pl_2_id, 'me_first_player': true, 'opponent_name':temp_pl_2_name, result:"D"}}}, (err, follower_)=>{
                    if(err){
                        console.log(err);
                    }
                })
                User.findByIdAndUpdate(temp_pl_2_id, {$push: {'games':{'opponent': temp_pl_1_id, 'me_first_player': false, 'opponent_name':temp_pl_1_name, result:"D"}}}, (err, follower_)=>{
                    if(err){
                        console.log(err);
                    }
                })
                updateWLDGcount(temp_pl_1_id, temp_pl_2_id, 'D', 2); //update all counters for both players
            }
            }else{
                //in case there is no win or draw, the computer will make a move
                let compMove = nextMove(current_board, comp_sym); // Calls the nextMove function to determine the computer's move based on the current board and its symbol.
                current_board.make_move(comp_sym, compMove, current_board); //update the game board after the computer makes a move
                let temp_board_state = current_board.get_board_as_val(current_board); // Retrieves the current state of the board as an array of values for rendering.
                //switch the turn to the next player
                let current_turn__ = game_active.current_player;
                if (current_turn__ === 1){
                    game_active.current_player = 2;
                }else{
                    game_active.current_player = 1;
                }
                let init_obj = { //initialize again the render object with the new board state
                'current_turn': game_active.current_player,
                'but_1': '',
                'but_2': '',
                'but_3': '',
                'but_4': '',
                'but_5': '',
                'but_6': '',
                'but_7': '',
                'but_8': '',
                'but_9': '',
                'msg': ''}
                //use the updated board state to populate the render object
                for (let temp_counter = 0; temp_counter < 9; temp_counter++){ //for loop through each position
                    if (temp_board_state[temp_counter] === '0'){ //if the pos is empty, set the corresponding button to an empty string
                        init_obj[`but_${temp_counter+1}`] = '';
                    }else if(temp_board_state[temp_counter] === 'x'){ //else if the current position is 'x', then set the button to 'X'
                        init_obj[`but_${temp_counter+1}`] = 'X';
                    }else{ //otherwise, set the button to 'O'
                        init_obj[`but_${temp_counter+1}`] = 'O';
                    }

                }
                io.to(room_number).emit('web-render-msg', init_obj) //report the updated board state to clients in the room for rendering
                game_active.last_obj = JSON.parse(JSON.stringify(init_obj)); //save updated board state
                let isWin = current_board.check_for_win(current_board); // Checks again if there is a win or draw after the computer's move.
                let empty_pos = current_board.get_empty_pos(current_board); // Retrieves the list of empty positions on the board
                //stores the players' id
                let temp_pl_1_id = game_active.player1_user_id;
                let temp_pl_2_id = game_active.player2_user_id;
                //stores the players' name
                let temp_pl_1_name = game_active.player1;
                let temp_pl_2_name = game_active.player2;
                if (isWin){ //handle the moves in the game when a win condition is detected
                    if (game_active.current_player === 1){ //if the current player is player 1
                    io.to(room_number).emit('result_here', {result: 'P2', string: current_board.get_which_win(current_board)}) // Sends the result of the game to the room, indicating that player 2 has won.
                    game_active.current_result = 'P2'; //update the game state
                    User.findByIdAndUpdate(temp_pl_1_id, {$push: {'games':{'opponent': temp_pl_2_id, 'me_first_player': true, 'opponent_name':temp_pl_2_name, result:"L"}}}, (err, follower_)=>{
                        if(err){
                            console.log(err);
                        }
                    })
                    User.findByIdAndUpdate(temp_pl_2_id, {$push: {'games':{'opponent': temp_pl_1_id, 'me_first_player': false, 'opponent_name':temp_pl_1_name, result:"W"}}}, (err, follower_)=>{
                        if(err){
                            console.log(err);
                        }
                    })
                    updateWLDGcount(temp_pl_1_id, temp_pl_2_id, 'P2', 2);
                }else if (game_active.current_player === 2){ //if the current player is player 2, ends the result of the game to the room, indicating that player 1 has won
                        io.to(room_number).emit('result_here', {result: 'P1', string: current_board.get_which_win(current_board)})
                        game_active.current_result = 'P1';
                        User.findByIdAndUpdate(temp_pl_1_id, {$push: {'games':{'opponent': temp_pl_2_id, 'me_first_player': true, 'opponent_name':temp_pl_2_name, result:"W"}}}, (err, follower_)=>{
                            if(err){
                                console.log(err);
                            }
                        })
                        User.findByIdAndUpdate(temp_pl_2_id, {$push: {'games':{'opponent': temp_pl_1_id, 'me_first_player': false, 'opponent_name':temp_pl_1_name, result:"L"}}}, (err, follower_)=>{
                            if(err){
                                console.log(err);
                            }
                        })
                        updateWLDGcount(temp_pl_1_id, temp_pl_2_id, 'P1', 1);
                }
                }else{
                    if(empty_pos.length === 0){ //if there are no empty spaces left on the board
                        if ((game_active.current_player === 2)){ //check if player 2 is the current player
                        io.to(room_number).emit('result_here', {result: 'D', string: "none"}) //emit a message to the game room that the game concluded in a draw
                        game_active.current_result = 'D'; //update the game state to reflect a draw
                        //update the player's record in the database  to reflect a draw with the other player
                        User.findByIdAndUpdate(temp_pl_1_id, {$push: {'games':{'opponent': temp_pl_2_id, 'me_first_player': true, 'opponent_name':temp_pl_2_name, result:"D"}}}, (err, follower_)=>{
                            if(err){
                                console.log(err);
                            }
                        })
                        User.findByIdAndUpdate(temp_pl_2_id, {$push: {'games':{'opponent': temp_pl_1_id, 'me_first_player': false, 'opponent_name':temp_pl_1_name, result:"D"}}}, (err, follower_)=>{
                            if(err){
                                console.log(err);
                            }
                        })
                        updateWLDGcount(temp_pl_1_id, temp_pl_2_id, 'D', 1); //updates the win/loss/draw count in the database for both players, indicating a draw
                    }else{ //otherwise, the current player is the player 1
                        io.to(room_number).emit('result_here', {result: 'D', string: "none"})
                        game_active.current_result = 'D';
                        User.findByIdAndUpdate(temp_pl_1_id, {$push: {'games':{'opponent': temp_pl_2_id, 'me_first_player': true, 'opponent_name':temp_pl_2_name, result:"D"}}}, (err, follower_)=>{
                            if(err){
                                console.log(err);
                            }
                        })
                        User.findByIdAndUpdate(temp_pl_2_id, {$push: {'games':{'opponent': temp_pl_1_id, 'me_first_player': false, 'opponent_name':temp_pl_1_name, result:"D"}}}, (err, follower_)=>{
                            if(err){
                                console.log(err);
                            }
                        })
                        updateWLDGcount(temp_pl_1_id, temp_pl_2_id, 'D', 2); // Updates the win/loss/draw count in the database for both players, indicating a draw
                    }
                    }
                }
            }
        }
    }
    socket.on('make-this-move', (obj_here)=>{ //listen for a 'make-this-move' event and takes an object as an argument
        let button_counter = obj_here.counter; //extract from the receiving object the move counter (which button was pressed)
        let user_id = obj_here.user_id; //extracts the user ID from the received object
        if (active_players.has(user_id)){ //if the set of active players include the user ID
            let sent_socket = user_id; //store the user ID
            let len_actv_game_arr = active_games.length;//announce the amount of active games available currently
            let room_number = undefined; //initialize room number variable
            let current_board = undefined; //initialize the current board state variable
            let isPlayer1;//initialize a variable if the user is player 1
            let game_active = undefined; //initialize a variable to hold the currently active game.
            for (let counter = 0; counter < len_actv_game_arr; counter++){ //a loop through each active game
                //check which room does the sent_socket_belongs too.
                let game_ = active_games[counter]; //get the current game in the iteration
                if ((game_.player1_user_id === sent_socket) || (game_.player2_user_id === sent_socket)){ //check if the user is the player 1 or player 2 in the game
                    game_active = game_; //set the active game variable to the found game
                    room_number = game_.room_name; //retrieve the room name from the active game
                    current_board = game_.board_state; //let the current state of the game board
                    if (game_.player1_user_id === sent_socket){ //if the user is player 1
                        isPlayer1 = true; //set the isPlayer1 variable to true
                    }else{ //otherwise, indicating the user is player 2
                        isPlayer1 = false;
                    }
                }
            }
            if (game_active.current_result === 0){ //check if the game is still going and there is no win or draw
                if (game_active.isWithComp){    //if this is an against-a-computer game                
                    if ((isPlayer1)&&(game_active.current_player === 1)){ //check if the current player is player 1, call a function to handle the computer making a move after player 1
                        comp_make_move_render(room_number, game_active, current_board, o_sym, button_counter-1, 2, x_sym);
                    }else if((!(isPlayer1))&&(game_active.current_player === 2)){ //if current player is player 2, call a function to handle the computer making a move after player 2
                        comp_make_move_render(room_number, game_active, current_board, x_sym, button_counter-1, 1, o_sym);
                        console.log("Got Here!")
                    }
                }else{ //otherwise, the game is the against-other-player game
                    if ((isPlayer1) && (game_active.current_player === 1)){ //if the current player is player 1, call a function to handle player 1's move
                        make_move_render(room_number, game_active, current_board, o_sym, button_counter-1, 2);                    
                    }else if ((!(isPlayer1)) && (game_active.current_player === 2)){ //if the current player is player 2, call a function to handle player 2's move
                        make_move_render(room_number, game_active, current_board, x_sym, button_counter-1, 1);                 
                    }
                    else{ //otherwise, send a message to the user announce that it's not their turn.
                        socket.emit('not-your-turn', "Please Wait For Your Turn!");
                    }
                }
            }
        }
    })

    socket.on('connect-with-computer', (user)=>{ //listen for a 'connect-with-computer' event and take a user object as an argument
        console.log("requesting to connect with a computer");
        let user_id = user.user_id; // Get the user id
        let user_name = user.user_name; // Get the user name
        let user_opt = user.opt; // Get the user options
        // Initialize a new board
        let new_board_state = new Board(empty_sym, x_sym, o_sym, [empty_sym, empty_sym, empty_sym, empty_sym, empty_sym, empty_sym, empty_sym, empty_sym, empty_sym]);
        let new_game; // Declare a new game
        let player1; // Declare first player
        let player2; // Declare second player

        if (user_opt === 'o'){
            // User is the first, make the bot the second.
            new_game = new active_game(user_name, 'COMPUTER-BOT-HERE', user_id, 'COMPUTER-BOT-HERE');
            player1 = user_name; // Set player 1 to the user
            player2 = 'Computer Bot'; // Set the player2 to computer bot
        }else if(user_opt === 'x'){
            // User is the second, make bot the first
            new_game = new active_game('COMPUTER-BOT-HERE', user_name, 'COMPUTER-BOT-HERE', user_id);
            player2 = user_name; // Set player 2 to the user
            player1 = 'Computer Bot'; // Set player 1 to the bot
        }else {
            let rand_num = Math.random(); // Get a random number
            if (rand_num > 0.5){ // If number is greater than 1, make bot the first player
                new_game = new active_game('COMPUTER-BOT-HERE', user_name, 'COMPUTER-BOT-HERE', user_id);
                player2 = user_name; // Set player 2 to the user
                player1 = 'Computer Bot'; // Set player 1 to the bot
            }else{
                // otherwise, make the bot the second player
                new_game = new active_game(user_name, 'COMPUTER-BOT-HERE', user_id, 'COMPUTER-BOT-HERE');
                player1 = user_name; // Make player1 the first
                player2 = 'Computer Bot'; // Make player2 the bot
            }
        }

        new_game.board_state = new_board_state; // Set the board state
        new_game.isWithComp = true; // Set the fact that game is against a  bot
        active_games.push(new_game); // Push into active games
        socket.join(`${user_id}`); // Join the room
        new_game.room_name = `${user_id}`; // Set the room name
        console.log('Clients in this room: ', io.sockets.adapter.rooms.get(new_game.room_name));
        //const players_in_this_room = io.sockets.adapter.rooms.get(user_id);
        active_players = new Set([...active_players, user_id]); // Set the active players
        // Send a message to the client
        io.to(`${user_id}`).emit('computer-connect', `${player1}---|---${player2}`);
        // Declare button status
        let temp_obj_t = {
            'current_turn': 1,
            'but-enable': true,
            'but_1': '',
            'but_2': '',
            'but_3': '',
            'but_4': '',
            'but_5': '',
            'but_6': '',
            'but_7': '',
            'but_8': '',
            'but_9': '',
            'msg': 'Good Luck Defeating The Bot!'
        }
        // Send the render
        io.to(`${user_id}`).emit('web-render-msg', temp_obj_t);
        // Deep copy the last state object
        new_game.last_obj = JSON.parse(JSON.stringify(temp_obj_t));
        // If player is the computer 1
        if (player1 === 'Computer Bot'){
            // Set current player as second
            new_game.current_player = 2;
            // Get current board
            current_board = new_game.board_state;
            // Do a random first move
            current_board.make_move(o_sym, 4, current_board);
            // Get the board state
            let temp_board_state = current_board.get_board_as_val(current_board);
            let init_obj = {
            'current_turn': 2,
            'but_1': '',
            'but_2': '',
            'but_3': '',
            'but_4': '',
            'but_5': '',
            'but_6': '',
            'but_7': '',
            'but_8': '',
            'but_9': '',
            'msg': ''};
            for (let temp_counter = 0; temp_counter < 9; temp_counter++){
                // Set the state in init object
                if (temp_board_state[temp_counter] === '0'){
                    init_obj[`but_${temp_counter+1}`] = '';
                }else if(temp_board_state[temp_counter] === 'x'){
                    init_obj[`but_${temp_counter+1}`] = 'X';
                }else{
                    init_obj[`but_${temp_counter+1}`] = 'O';
                }

        }
        io.to(`${user_id}`).emit('web-render-msg', init_obj)
        }
    });

    socket.on('chat-msg-user', (msg)=>{
        // Get the message text
        let msg_text = msg.msg_txt;
        // Get the message id
        let msg_sender = msg.user_id;
        // Format the message time
        let msg_time = moment().format('h:mm a');
        //First Check if The User is in a Live Game:
        if (active_players.has(msg_sender)){
            //Find the room number in which the player is in:
            let sent_socket = msg.user_id;
            // Get the length of user's games
            let len_actv_game_arr = active_games.length;
            // Initialize room number
            let room_number = undefined;
            // Initialize current board
            let current_board = undefined;
            // Declare player variable
            let isPlayer1;
            // Initialize active game
            let game_active = undefined;
            // Initialize message sender
            let msg_sender = undefined;
            // Iterate through all the games of a user
            for (let counter = 0; counter < len_actv_game_arr; counter++){
                // Get the active game
                let game_ = active_games[counter];
                // Check if either sender is a player
                if ((game_.player1_user_id === sent_socket) || (game_.player2_user_id === sent_socket)){
                    // Set active game
                    game_active = game_;
                    // Set active game number
                    room_number = game_.room_name;
                    // Set current board
                    current_board = game_.board_state;
                    // Check which user is player1
                    if (game_.player1_user_id === sent_socket){
                        isPlayer1 = true;
                    }else{
                        isPlayer1 = false;
                    }
                }
            }
            // if is player1, it is also message sender
            if (isPlayer1){
                // Set message sender
                msg_sender = game_active.player1;
            }else{
                // Set message sender
                msg_sender = game_active.player2;
            }
            // Emit chat message
            io.to(room_number).emit('chat-msg-server', {msg_sender, msg_text, msg_time});

        }
    });

    socket.on('user-post-request', (post_ )=>{
        let post_user_id = post_.user_id; //extract the user ID of the poster from the received object
        let poster_name = ''; //initialize an empty string to hold the name of the poster.
        let post_user_title = post_.user_post_title; //extract the title of the user's post.
        let post_user_content = post_.user_post_content; //extract the content of the user's post from the received object.
        let post_time = moment().format('MMMM Do YYYY, h:mm a'); //format the current date and time.
        let post_id = ''; //initialize an empty string to hold the unique post ID.
        let poster_name_arr = []; //initialize an empty array to store the name of the poster.
        //find the user by user's ID
        User.findById(post_user_id, (err, docs)=>{
            if (err) { //check error
                console.log(err)
            }else{ //if there is no error exists
                post_id = `${post_user_id}` + '***' + `${docs.posts.length}`; //use the user ID and the current length of their posts array to create a unique post ID
                poster_name = docs.name; //retrieve the user's name from the database
                poster_name_arr.push(docs.name); //add the user's name to the array
                let zero_ = 0; //a variable to track the like count
                //insert the new post into the user's posts array to update their document
                User.findByIdAndUpdate(post_user_id, 
                    {$push: {"posts": {"post_id_u": post_id, "title_u": post_user_title, "content_u": post_user_content, "date_u": post_time, "poster_name_u": poster_name, "like_count": zero_}}},
                    {safe: true, upsert: true, new : true}, (err, docs)=>{
                    if (err) {console.log(err) //log an error if it exists
                    }else{ //otherwise, fetch the updated user data
                        User.findById(post_user_id, (err, docs)=>{
                            if(err){console.log(err) //log an error if the user data retrieval fails
                            }else{ //otherwise, create a copy of the user's followers array
                            let user_followers_arr = [...docs.followers];
                            for (let counter = 0; counter < user_followers_arr.length; counter++){ //notify each follower of the new post by iterating over them.
                                //update each follower's document to add the new post ID to their 'posts_to_show' array
                                User.findByIdAndUpdate(user_followers_arr[counter].userId, {$push: {'posts_to_show':post_id}}, (err, follower_)=>{
                                    if(err){
                                        console.log(err);
                                    }else{
                                        let notif_count_current = follower_.notif_count; //retrieve the current notification count for the follower
                                        let notif_count_mod = notif_count_current + 1; //increment the notification count by 1
                                        let notif_string = `${poster_name} Just Posted A Post!`; //construct a notification message
                                        //update the follower's notifications array
                                        User.findByIdAndUpdate(user_followers_arr[counter].userId, {$push: {'notifications':notif_string}}, (err, docs)=>{
                                            if(err){
                                                console.log(err);
                                            }else{ //update the follower's notification count in the database
                                                User.findByIdAndUpdate(user_followers_arr[counter].userId, {$set: {'notif_count':notif_count_mod}}, (err, docs)=>{
                                                    if(err){
                                                        console.log(err);
                                                    }
                                                })
                                            }
                                        })
                                    }
                                })
                            }
                        }
                        })
                    }
                }
                );
            }
        })
        //let temp_obj = {"post_id_u": post_id, "title_u": post_user_title, "content_u": post_user_content, "date_u": post_time, "poster_name_u": poster_name};
        //console.log("Tempo Objg", temp_obj);


    });
    // Event listener for when a client requests a specific post
    // `get-post-request` is triggered with a request string format like "type--|--index"
    socket.on('get-post-request', (string_for_post)=>{
        // Split the request string to extract post type and post index
        let post_type = string_for_post.split('--|--')[0];    // Type of post (e.g., user's posts, feed posts, liked posts)
        let post_index = string_for_post.split('--|--')[1];    // Index of the post requested within the list
        // Retrieve the user ID based on the socket ID from a mapping dictionary
        let user_pr_id = socket_id_dict[socket.id];    // `socket_id_dict` maps socket ID to user ID for tracking users
        let socket_id = socket.id;

        // Fetch the user's document from the database using their user ID
        User.findById(user_pr_id, (err, docs)=>{
                if(err) {console.log(err)    // Log any errors that occur during DB retrieval
                }else{
                    // Case when the request is for the user's own posts
                    if (post_type === '0'){
                        // If the user has no posts, inform the client by emitting a 'LEN0' message
                    socket.emit('post-request-reply', 'LEN0');
                        if (docs.posts.length === 0){socket.emit('post-request-reply', 'LEN0')
                        }else{
                            // `is_liked` will store whether the user has liked this post
                            let is_liked;
                            // Calculate the index of the requested post, adjusting if `post_index` exceeds bounds
                            let post_index_int = (docs.posts.length - 1) - ((+post_index) % docs.posts.length);
                            let post_to_send = docs.posts[post_index_int];    // Retrieve the post object
                            let post_to_send_id = post_to_send.post_id_u;    // Get the unique post ID for reference

                            // Determine if the current user has liked this post by checking the `liked_posts` array
                            if (docs.liked_posts.includes(post_to_send_id)){
                                is_liked = true;
                            }else{
                                is_liked = false;
                            }
                            // Emit the post data back to the client along with its like status
                            socket.emit('post-request-reply', {type: 0, post_: docs.posts[post_index_int], is_liked});

                        }
                    // Case when the request is for the feed posts
                    }else if(post_type === '1'){
                        // If there are no posts in the feed, inform the client by emitting a 'LEN0' message
                        if (docs.posts_to_show.length === 0){socket.emit('post-request-reply', 'LEN0')
                        }else{
                            // Calculate the index of the requested feed post
                            let post_index_int = docs.posts_to_show.length - 1 -((+post_index) % docs.posts_to_show.length);
                            // Split the feed post identifier to retrieve the poster's user ID and the specific post index
                            let feed_post_index = docs.posts_to_show[post_index_int].split('***')[1];
                            let feed_post_poster = docs.posts_to_show[post_index_int].split('***')[0]

                            // Find the poster's document to retrieve the requested post
                            User.findById(feed_post_poster, (err, docs2)=>{
                                if(err){
                                    console.log(err);    // Log any errors that occur during DB retrieval for the feed poster
                                }else{
                                let post_to_send = docs2.posts[feed_post_index];    // Retrieve the specific feed post object
                                let post_to_send_id = post_to_send.post_id_u;    // Get the unique post ID for reference
                                let is_liked;
                                
                                // Check if the current user has liked the feed post
                                if (docs.liked_posts.includes(post_to_send_id)){
                                    is_liked = true;
                                }else{
                                    is_liked = false;
                                }
                                // Emit the feed post data back to the client along with its like status
                                socket.emit('post-request-reply', {type: 1, post_: post_to_send, is_liked});
                            }
                            })

                        }
                    // Case when the request is for the liked posts
                    }else{
                        // If the user has no liked posts, inform the client by emitting a 'LEN0' message
                        if (docs.liked_posts.length === 0){socket.emit('post-request-reply', 'LEN0')
                        }else{
                            // Calculate the index of the requested liked post
                            let post_index_int = docs.liked_posts.length - 1 - ((+post_index) % docs.liked_posts.length);

                            // Split the liked post identifier to retrieve the poster's user ID and the specific post index
                            let feed_post_index = docs.liked_posts[post_index_int].split('***')[1];
                            let feed_post_poster = docs.liked_posts[post_index_int].split('***')[0]

                            // Find the poster's document to retrieve the requested liked post
                            User.findById(feed_post_poster, (err, docs2)=>{
                                if(err){
                                    console.log(err);    // Log any errors that occur during DB retrieval for the post poster
                                }else{
                                let post_to_send = docs2.posts[feed_post_index];    // Retrieve the specific liked post object
                                let post_to_send_id = post_to_send.post_id_u;    // Get the unique post ID for reference
                                let is_liked;
                                // Check if the current user has liked the post
                                if (docs.liked_posts.includes(post_to_send_id)){
                                    is_liked = true;
                                }else{
                                    is_liked = false;
                                }
                                // Emit the liked post data back to the client along with its like status
                                socket.emit('post-request-reply', {type: 1, post_: post_to_send, is_liked});
                            }
                            })
                        }
                    }
                }        
        })    // End of outer User.findById callback
    })    // End of socket.on('get-post-request') callback

    // Event listener for when a client requests to change a post's liked status
    socket.on('change_post_liked_stat', (msg_stuff)=>{
       console.log("requesting to change post like;");
       let is_liked = msg_stuff.is_liked; // Whether liked
       let post_id = msg_stuff.post_id; //  post id
       let user_id = socket_id_dict[socket.id]; //  user id
       let poster_id = post_id.split('***')[0]; // poster id
       let modified_like_count = is_liked ? -1 : 1; // on liked, it's a disklike
    
       // Get the record's like posts
       User.findByIdAndUpdate(user_id, {$pull: {'liked_posts':post_id}}, (err, docs)=>{

        // Get the post
        User.findById(poster_id, (err, docs)=>{
            // Add the new liked post
            let posts_arr = [...docs.posts];
            // Get the post filtered
            let post_filtered_arr = posts_arr.filter((post_f)=>{return (post_f.post_id_u === post_id)});
            // Get the first post matching ID
            let post_filtered = post_filtered_arr[0];
            // Get the current like count
            let current_like_count = +(post_filtered.like_count);
            // Adjust the new liek count
            let new_like_count = current_like_count + modified_like_count;
            // Update the record's like count
            User.findOneAndUpdate({'_id':poster_id, "posts.post_id_u":post_id},{
                "$set":{
                    "posts.$.like_count": new_like_count
                }
            }, (err, docs)=>{
                // Emit like changed emit
                socket.emit("like-changed");
            })
        })
        });
    });

    // Event listener for checking if a user is currently active in a game
    socket.on('chk_for_cur_active', (user_id_to_check)=>{
        // Iterate over active games to check if the user is a participant in any game
        for (let temp_counter = 0; temp_counter < active_games.length; temp_counter++){
            if ((active_games[temp_counter].player1_user_id === user_id_to_check) || (active_games[temp_counter].player2_user_id === user_id_to_check)){
                
                // Join the user to the game's room and emit the last game state object for rendering
                socket.join(active_games[temp_counter].room_name);
                socket.emit('web-render-msg', active_games[temp_counter].last_obj);
            }
        }
    })

    // Event listener to get the count of user games (wins, losses, draws, and total games)
    socket.on('get-user-game-count', (user_id_games)=>{
        // Retrieve the user's document based on user ID
        User.findById(user_id_games, (err, docs)=>{
            // Emit the user's game statistics back to the client
            socket.emit('post-user-game-count', {'win': docs.won_count, 'lost': docs.lost_count, 'draw': docs.draw_count, 'tot_games':docs.total_games_count});
        })
    })    

    // Extract user IDs for the current user and the profile user
    socket.on('give-user-data', (data_id_obj)=>{
        let my_id = data_id_obj.my_id;    // ID of the requesting user
        let user_data_id = data_id_obj.user_id_profile;    // ID of the user whose profile is being requested

        // Initialize the object to return with default values
        let obj_to_return = {'user_id': user_data_id,
                              'user_name': '',  
                             'tot_game_count': 0,
                             'won_game_count': 0,
                              'lost_game_count': 0,
                              'draw_game_count': 0,
                             'games_': [],
                             'followers_': [],
                             'following_': [],
                            'they_follow':false,
                            'i_follow': false};

        // Retrieve the profile user's document using `user_data_id`
        User.findById(user_data_id, (err, docs1)=>{
            // Retrieve the requesting user's document using `my_i
            User.findById(my_id, (err, docs)=>{
                // Populate the return object with profile user's data
                obj_to_return.user_name = docs1.name;
                obj_to_return.tot_game_count = docs1.total_games_count;
                obj_to_return.won_game_count = docs1.won_count;
                obj_to_return.lost_game_count = docs1.lost_count;
                obj_to_return.draw_game_count = docs1.draw_count;

                // Clone and reverse the games list for chronological order
                let temp_games = JSON.parse(JSON.stringify(docs1.games));
                obj_to_return.games_ = temp_games.reverse();

                // Parse followers and following lists of the profile user
                let other_person_followers = JSON.parse(JSON.stringify(docs1.followers));
                let other_person_following = JSON.parse(JSON.stringify(docs1.following));

                // Parse followers and following lists of the requesting user
                let my_followers = JSON.parse(JSON.stringify(docs.followers));
                let my_following = JSON.parse(JSON.stringify(docs.following));

                // Map the profile user's followers to include whether the requesting user follows them and vice versa
                let other_follower_obj_arr = other_person_followers.map((follower)=>{return{
                    'name': follower.userName,
                    'id':follower.userId,
                    'they_follow': check_for_val(my_followers, follower.userId),    // Check if follower is in requesting user's followers
                    'i_follow': check_for_val(my_following, follower.userId)    // Check if follower is in requesting user's following
                }})

                // Helper function to check if a user is present in a specified array
                function check_for_val(array1, val){
                    if (array1){
                        for (let counter = 0; counter < array1.length; counter++){
                            if (array1[counter].userId === val){
                                return true
                            }
                        }
                    }
                    return false
                }

                // Map the profile user's following to include whether the requesting user follows them and vice versa
                let other_following_obj_arr = other_person_following.map((following)=>{return{
                    'name': following.userName,
                    'id':following.userId,
                    'they_follow': check_for_val(my_followers, following.userId),    // Check if the followed user is in requesting user's followers
                    'i_follow': check_for_val(my_following, following.userId)    // Check if the followed user is in requesting user's following
                };
                });

                // Populate the followers and following arrays in the return object
                obj_to_return.followers_ = JSON.parse(JSON.stringify(other_follower_obj_arr));
                obj_to_return.following_ = JSON.parse(JSON.stringify(other_following_obj_arr));

                // Determine mutual follow status between the requesting user and profile user
                obj_to_return.i_follow = check_for_val(my_following, user_data_id);    // Check if requesting user follows profile user
                obj_to_return.they_follow = check_for_val(my_followers, user_data_id);    // Check if profile user follows requesting user

                // Emit the fully populated user data object back to the client
                socket.emit('return-user-data', obj_to_return);
            })

        })
    })
    socket.on('remove-from-prev-game', (user_id_to_remove)=>{
        // Initialize variable to store index of game to remove, initially set to 'none'
        let index_to_remove = 'none';

        // Loop through the active games to find a match with the provided user ID
        for (let counter = 0; counter < active_games.length; counter++){
            // Check if either player in the game matches the user ID to be removed
            if ((active_games[counter].player1_user_id === user_id_to_remove) || (active_games[counter].player2_user_id === user_id_to_remove)){
                // If a match is found, set `index_to_remove` to the current game index
                index_to_remove = counter;

            }
        }
        // If a game was found that includes the user to remove
        if (index_to_remove !== 'none'){
            // Remove both players from the `active_players` set
            active_players.delete(active_games[index_to_remove].player1_user_id);
            active_players.delete(active_games[index_to_remove].player2_user_id);

            // Notify all clients in the room that the opponent's turn is reset to '0'
            io.to(active_games[index_to_remove].room_name).emit('opp-next', '0');

            // Iterate over all clients in the room and make each client leave it
            io.sockets.clients(active_games[index_to_remove].room_name).forEach(function(s){
                s.leave(active_games[index_to_remove].room_name);
            });

            // Make the current socket leave the game room as well
            socket.leave(active_games[index_to_remove].room_name);

            // Remove the game entry from the `active_games` array
            active_games.splice(index_to_remove);   
        }
    })
    socket.on('dm-msg-request', (some_obj)=>{
        // Extract user IDs for both the message sender and receiver
        let other_user_id = some_obj.other_user_id;
        let this_user_id = some_obj.my_id;

    })


    function post_dm_message(input_user_id, room_name_to_search){
        // Extract the user ID for message retrieval
        let user_id = input_user_id;

        // Find the user's document in the database
        User.findById(user_id, (err, docs)=>{

            // Access the user's messages array
            let message_arr = docs.messages;
            let room_index = undefined;

            // Search for the specified room in the user's message array
            for (let temp_counter_4 = 0; temp_counter_4 < message_arr.length; temp_counter_4++){
                // If the room name in the array matches the specified room
                if (message_arr[temp_counter_4].room_name === room_name_to_search){
                    // Store the index of the found room
                    room_index = temp_counter_4;
                    // Emit the message content to clients in the room
                    io.to(room_name_to_search).emit('dm_msg_list', {'msg_content': message_arr[temp_counter_4].message_content});
                }
            }
        })
    }


    socket.on('join-socket-msg-room', (room_join_obj)=>{
        // Extract the room name and user ID from the request object
        let room_to_join_dm = room_join_obj.room_to_join;
        let user_id = room_join_obj.user_id;

        // Call `post_dm_message` to display messages for the joining user
        post_dm_message(user_id, room_to_join_dm);
        // Add the user to the requested room
        socket.join(room_to_join_dm);
        // Confirm room join to the user
        socket.emit('room-joined-dm', '0');
    })

    socket.on('leave-socket-msg-room', (room_to_leave_dm)=>{
        // Make the socket leave the specified room
        socket.join(room_to_leave_dm);
        // Confirm room leave to the user
        socket.emit('room-left-dm', '0');
    })

    socket.on('dm-msg-post', (post_obj)=>{
        console.log('DM MESSAGE REQUEST: ', post_obj)
        // Extract room name, sender ID, and message content from the request
        let room_dm_msg = post_obj.room_name;
        let sender_dm_id = post_obj.sender_id;
        let dm_msg_content = post_obj.msg_content;

        // Split room name to identify the other person in the direct message
        let id_arr = room_dm_msg.split('---|---');
        var other_person_id;

        // Determine the other person's ID based on the room name
        if (id_arr[0] ===  sender_dm_id){
            // If the first ID in the array matches the sender, set the other person to the second ID
            other_person_id = id_arr[1]
        }else{
            // Otherwise, set the other person to the first ID
            other_person_id = id_arr[0]
        }
        console.log('Other Person ID: ', other_person_id);

        // Find the sender's document to retrieve their name and message data
        User.findById(sender_dm_id, (err, docs)=>{
            if (err){
                console.log(err);
            }else{
                // Store sender's name and message array for further updates
                let my_name = docs.name;
                let msg_arr = docs.messages;
                let room_index = 'null';

                // Check for an existing message room within the sender's messages array
                for (let temp_counter_3 = 0; temp_counter_3 < msg_arr.length; temp_counter_3++){
                    // If a room with a matching name is found, store its index
                    if (msg_arr[temp_counter_3].room_name === room_dm_msg){
                        room_index = temp_counter_3;
                    }
                }

                // If the room exists in the sender's messages
                if (!(room_index==='null')){
                    // Construct a message object with sender's details and a timestamp
                    let msg_content_obj = {
                        'sender_name': my_name,    // Sender's name
                        'sender_id': sender_dm_id,    // Sender's user ID
                        'date_of_message': moment().format('MMMM Do YYYY, h:mm a'),    // Message timestamp
                        'message_text': dm_msg_content,    // The actual message content
                    }

                    // Add the message to the sender's message array in the database using `$push` update
                    User.findOneAndUpdate({'_id': sender_dm_id, "messages.room_name": room_dm_msg}, {$push: {
                        "messages.$.message_content": msg_content_obj
                    }}, (err, docs)=>{
                        if (err) {console.log(err)
                        }else{
                            // Add the same message object to the recipient's messages in the database
                            User.findOneAndUpdate({'_id': other_person_id, "messages.room_name": room_dm_msg}, {$push:{
                                "messages.$.message_content": msg_content_obj 
                            }}, (err, docs=>{
                                if (err) {console.log(err)
                                }else{
                                    // After both updates, call `post_dm_message` to broadcast messages to the room
                                    post_dm_message(sender_dm_id, room_dm_msg);
                                }
                            }))


                        }
                    })
                // Handling the scenario where a direct message is sent to a user
                }else{
                    // Find the other person in the database using their ID
                    User.findById(other_person_id, (err, docs)=>{
                        // If there's an error in finding the user
                        if (err){console.log(err)
                        }else{
                            // Extract the name of the other person from the retrieved user document
                            let other_person_name = docs.name;
                            // Create a message object for the sender containing their details and the message content
                            let my_message_obj = {
                                "other_person_id": other_person_id,    // ID of the other person
                                "other_person_name": other_person_name,    // Name of the other person
                                "room_name": room_dm_msg,    // The room for direct messaging
                                "message_content": [
                                        {
                                        'sender_name': my_name,    // Name of the sender
                                        'sender_id': sender_dm_id,    // ID of the sender
                                        'date_of_message': moment().format('MMMM Do YYYY, h:mm a'),    // Timestamp of the message
                                        'message_text': dm_msg_content    // The actual content of the message
                                        }
                                ]
                            }

                            // Create a message object for the other person, including the sender's details
                            let other_message_obj = {
                                "other_person_id": sender_dm_id,    // ID of the sender
                                "other_person_name": my_name,    // Name of the sender
                                "room_name": room_dm_msg,    // The room for direct messaging
                                "message_content": [
                                    {
                                        'sender_name': my_name,    // Name of the sender
                                        'sender_id': sender_dm_id,    // ID of the sender
                                        'date_of_message': moment().format('MMMM Do YYYY, h:mm a'),    // Timestamp of the message
                                        'message_text': dm_msg_content       // The actual content of the message
                                    }
                                ]
                            }

                            // Update the sender's document by pushing their message object to the messages array
                            User.findOneAndUpdate({'_id': sender_dm_id}, {$push:{
                                messages: my_message_obj
                            }}, (err, docs)=>{
                                // If there's an error during the update
                                if (err) {console.log(err)
                                }else{
                                    // Update the other person's document by pushing the sender's message object to their messages array
                                    User.findOneAndUpdate({'_id': other_person_id}, {$push:{
                                        messages: other_message_obj
                                    }}, (err, docs)=>{
                                        // If there's an error during the update
                                        if(err){
                                            console.log(err);
                                        }else{
                                            // Call `post_dm_message` to broadcast the message to the specified room
                                            post_dm_message(sender_dm_id, room_dm_msg);
                                        }
                                    })
                                }
                            })

                        }
                    })
                }
            }
        })
    })

    // Socket event for retrieving the user's message list
    socket.on('get-user-msg-list', (user_id)=>{
        // Find the user document in the database by ID
        User.findById(user_id, (err, docs)=>{
            // Access the messages array of the user document
            let msg_arr = docs.messages;
            // Map through the messages to create a simplified array containing names and room names
            let array_to_return = msg_arr.map((msg_inst)=>{return {'name':msg_inst.other_person_name, 'room_name':msg_inst.room_name}})
            // Emit the mapped array back to the client as a reply
            socket.emit('user-list-msg-reply', array_to_return);
        })
    })

    // Socket event for removing a follower (implementation needed)
    socket.on('remove-follower', (rec_obj)=>{
        // TODO: Implement this
    });

    // Socket event for following another user
    socket.on('make-user-follow', (some_obj)=>{
        // Extract the IDs of the two users involved in the follow action
        let id_1 = some_obj.id_1;    // The user initiating the follow
        let id_2 = some_obj.id_2;    // The user being followed
        let name_1;    // Variable to store the name of the follower
        let name_2;    // Variable to store the name of the user being followed

        // Find the user document of the person being followed
        User.findById(id_2, (err, docs)=>{
            // Extract the name of the user being followed
            name_2 = docs.name;
            // Update the following list of the user initiating the follow
            User.findOneAndUpdate({'_id': id_1}, {$push:
                {'following':{'userId':id_2, 'userName':name_2}}}, (err, docs)=>{
                    // If there's an error during the update
                    if(err){
                        console.log(err);
                    }else{
                        // Extract the name of the follower after the update
                        name_1 = docs.name;

                        // Update the followers list of the user being followed
                        User.findOneAndUpdate({'_id':id_2}, {$push:
                        {'followers':{'userId':id_1, 'userName':name_1}}}, (err, docs)=>{
                            // If there's an error during the update
                            if(err){console.log(err)
                            }else{
                                // Emit a refresh event to update the profiles of both users
                                socket.emit('refresh-prof', {'id_1':id_1, 'id_2':id_2});

                                // Update the notification count for the user being followed
                                let notif_current_count = docs.notif_count;    // Get current notification count
                                let notif_count_mod = notif_current_count + 1;    // Increment notification count
                                let notif_string = `${name_1} Started Following You!`;    // Create a notification message'

                                // Update the notifications array of the user being followed
                                User.findByIdAndUpdate(id_2, {$push: {'notifications': notif_string}}, (err, docs)=>{
                                    // If there's an error during the notification update
                                    if (err){
                                        console.log(err);
                                    }else{

                                    // Update the notification count for the user being followed
                                    User.findByIdAndUpdate(id_2, {$set: {'notif_count':notif_count_mod}}, (err, docs)=>{
                                        // If there's an error during the notification count update
                                        if(err){
                                            console.log(err);
                                        }
                                    })
                                }
                                })
                            }
                        }
                        )
                    }
                }
        )
    })

    })

    // Socket event for unfollowing a user
    socket.on('make-user-unfollow', (some_obj)=>{
        // TODO: Implement this
    })

    // Socket event to get the notification count for a specific user
    socket.on('get-user-notif-count', (user_id)=>{
        // Get the user by id
        User.findById(user_id, (err, docs)=>{
            if(err){
                // Log in case of error
                console.log(err);
            }else{
            // Emit notification count
            socket.emit('post-user-notif-count', docs.notif_count);
            }
        })
    });

    // Socket event to retrieve the array of notifications for a specific user
    socket.on('get-notif-array', (user_id)=>{
        // Get the user
        User.findById(user_id, (err, docs)=>{
            if(err){
                // Log in case of error
                console.log(err);
            }else{
                // Copy the notificaitons
                let notif_array_c = [...docs.notifications];
                // Reverse the notifications
                let notif_array_return = notif_array_c.reverse();
                // Emit the notificaiton
                socket.emit('post-notif-array', notif_array_return);
            }
        })
    });
});


// Function to update the Win, Loss, Draw (WLD) count for two players after a game
function updateWLDGcount(temp_player_1_id, temp_player_2_id, result_, which_computer){
    // Check if Player 1 won
    if (result_ === 'P1'){
        // Ensure Player 1 is not a computer player
        if (!(which_computer === 1)){
        // Find Player 1 in the database using their ID
        User.findById(temp_player_1_id, (err, docs)=>{
            // If there's an error retrieving the user
            if(err){
                console.log(err);
            }else{
                // Increment the win and game count for Player 1
            let won_count_final = docs.won_count + 1;    // Update won count
            let game_count_final = docs.total_games_count + 1;    // Update total game count
            console.log("RAN 1")    // Debug message to confirm execution

            // Update the user document for Player 1
            User.findByIdAndUpdate(temp_player_1_id, {$set: {'won_count': won_count_final, 'total_games_count': game_count_final}}, (err, docs)=>{
                // If there's an error during the update
                if(err){
                    console.log(err);
                }
            })
        }
        }
        )
    // Ensure Player 2 is not a computer player
    }   if (!(which_computer === 2)){
        // Find Player 2 in the database using their ID
        User.findById(temp_player_2_id, (err, docs)=>{
            // If there's an error retrieving the user
            if(err){
                console.log(err);
            }else{
            // Increment the loss and game count for Player 2
            let lost_count_final = docs.lost_count + 1;    // Update lost count
            let game_count_final = docs.total_games_count + 1;    // Update total game count
            console.log("RAN 2")    // Debug message to confirm execution

            // Update the user document for Player 2
            User.findByIdAndUpdate(temp_player_2_id, {$set: {'lost_count': lost_count_final, 'total_games_count': game_count_final}}, (err, docs)=>{
                // If there's an error during the update
                if(err){
                    console.log(err);
                }
            })
        }
        }
        )
    }
    // Check if Player 2 won
    }else if (result_ === 'P2'){
        // Ensure Player 2 is not a computer player
        if (!(which_computer === 2)){
        
        // Find Player 2 in the database using their ID
        User.findById(temp_player_2_id, (err, docs)=>{
            // If there's an error retrieving the user
            if(err){
                console.log(err);
            }else{

            // Increment the win and game count for Player 2
            let won_count_final = docs.won_count + 1;    // Update won count
            let game_count_final = docs.total_games_count + 1;    // Update total game count
            console.log("RAN 3")    // Debug message to confirm execution

                // Update the user document for Player 2
            User.findByIdAndUpdate(temp_player_2_id, {$set: {'won_count': won_count_final, 'total_games_count': game_count_final}}, (err, docs)=>{
                // If there's an error during the update
                if(err){
                    console.log(err);
                }
            })
        }
        }
        )
    }
        // Ensure Player 1 is not a computer player
        if (!(which_computer === 1)){

        // Find Player 1 in the database using their ID
        User.findById(temp_player_1_id, (err, docs)=>{
            // If there's an error retrieving the user
            if(err){
                console.log(err);
            }else{
            // Increment the loss and game count for Player 1
            let lost_count_final = docs.lost_count + 1;    // Update lost count
            let game_count_final = docs.total_games_count + 1;    // Update total game count
            console.log("RAN 4")       // Debug message to confirm execution

            // Update the user document for Player 1
            User.findByIdAndUpdate(temp_player_1_id, {$set: {'lost_count': lost_count_final, 'total_games_count': game_count_final}}, (err, docs)=>{
                // If there's an error during the update
                if(err){
                    console.log(err);
                }
            })
        }
        }
        )
    }
        // If the game ended in a draw
    }else{
        // Ensure Player 2 is not a computer player
        if (!(which_computer === 2)){

        // Find Player 2 in the database using their ID
        User.findById(temp_player_2_id, (err, docs)=>{
            // If there's an error retrieving the user
            if(err){
                console.log(err);
            }else{
            // Increment the draw and game count for Player 2
            let draw_count_final = docs.draw_count + 1;    // Update draw count
            let game_count_final = docs.total_games_count + 1;    // Update total game count

            // Update the user document for Player 2
            User.findByIdAndUpdate(temp_player_2_id, {$set: {'draw_count': draw_count_final, 'total_games_count': game_count_final}}, (err, docs)=>{
                // If there's an error during the update
                if(err){
                    console.log(err);
                }
            })
        }
        }
        )
    }
    // Ensure Player 1 is not a computer player
    if (!(which_computer === 1)){

        // Find Player 1 in the database using their ID
         User.findById(temp_player_1_id, (err, docs)=>{
             // If there's an error retrieving the user
             if(err){
                 console.log(err);
             }else{

            // Increment the draw and game count for Player 1
            let draw_count_final = docs.draw_count + 1;    // Update draw count
            let game_count_final = docs.total_games_count + 1;    // Update total game count

            // Update the user document for Player 1
            User.findByIdAndUpdate(temp_player_1_id, {$set: {'draw_count': draw_count_final, 'total_games_count': game_count_final}}, (err, docs)=>{
            // If there's an error during the update
            if(err){
                console.log(err);
            }
            })
        }
        }
        )
    }
    }
}
