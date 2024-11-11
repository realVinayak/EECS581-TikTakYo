const socket = io(); //initialize a socket connection to the server
var dm_msg_request = sessionStorage.getItem("dm_message"); //retrieve the direct message request from session storage
sessionStorage.removeItem("dm_message"); //remove the retrieved item from the storage
sessionStorage.clear(); //clear all items in the storage
let list_of_other_users = []; //initialize an array to store other users' names
let list_of_room_names = []; //initialize an array to store room names
let dm_other_user = []; //initialize an array to track direct message users
let current_room = undefined; //initialize a variable to track the current active room
let dm_current_room = undefined; //initialize a variable to track the current DM room
if (dm_msg_request != null){ //if there is a direct message request in the storage
    let other_user_id = dm_msg_request.split('---|---')[0]; //extract the other user's ID from the dm request
    let loc_my_id = dm_msg_request.split('---|---')[1]; //extract the local user’s ID from the dm request
    let other_user_name = dm_msg_request.split('---|---')[2]; //extract the other user’s name from the dm request
    socket.emit('dm-msg-request', {other_user_id, loc_my_id}); //send a DM message request to the server

    dm_other_user.push(`${loc_my_id}---|---${other_user_id}`); //add the DM user to the `dm_other_user` list
    current_room = `${loc_my_id}---|---${other_user_id}`; //utilize a combination of the user IDs to set the current room
    dm_current_room = current_room; //set the DM room as the current room
    socket.emit('join-socket-msg-room', {'user_id': my_id, 'room_to_join': current_room, 'new_msg': true}); //request to join the current DM room
    let div_wrapper = document.createElement('div'); //make a new `div` element to wrap the user content
    socket.emit('get-dm-post', {'user_id': my_id, 'user_room': current_room}) //request the dm for the current room
    div_wrapper.className = "un-content"; //set the class name for styling the `div`
    div_wrapper.id = current_room; //assign the room ID to the `div`
    div_wrapper.style.backgroundColor="#ca3e47af"; //set the div's background color
    div_wrapper.addEventListener('click', ()=>{ //add a click event listener for selecting the room
        socket.emit('leave-socket-msg-room', current_room); //leave the current message room
        document.querySelector('.message-area').innerHTML = ''; //clear the message display area
        document.getElementById(current_room).style.backgroundColor = "#CA3E47"; //reset background color of the previous room
        current_room = div_wrapper.id; //update the current room
        socket.emit('join-socket-msg-room', {'user_id': my_id, 'room_to_join': current_room, 'new_msg': true}); //join the clicked room
        div_wrapper.style.backgroundColor="#ca3e47af"; //highlight the selected room with color
    })
    div_wrapper.addEventListener('mouseenter', ()=>{ //incorporate a mouse enter event to alter the background when hovered over
        if (current_room !== div_wrapper.id){
            div_wrapper.style.backgroundColor = "#ca3e47af"; 
        }
    })
    div_wrapper.addEventListener('mouseleave', ()=>{ //add mouse leave event to reset background
        if (current_room !== div_wrapper.id){
            div_wrapper.style.backgroundColor = "#CA3E47"
        }
    })
    div_wrapper.innerHTML = `<div class="un-name">${other_user_name}</div>
    <div class="un-notif-count"></div>` //populate the div with the user’s name and a placeholder for notification count
    document.querySelector('.user-names').appendChild(div_wrapper); //add the new user div to the document object model


}
socket.emit('get-user-msg-list', my_id); //request the message list for the current user
socket.on('user-list-msg-reply', (user_list_obj)=>{ //respond with a list of messages and users
    for (let temp_counter_1 = 0; temp_counter_1 < user_list_obj.length; temp_counter_1++){ //loop through the list of users
        if (dm_current_room !== user_list_obj[temp_counter_1].room_name){ //if the room is not the current DM room
        let div_wrapper = document.createElement('div'); //make a div to display the user content
        div_wrapper.className = "un-content"; //set class name for styling
        div_wrapper.id = user_list_obj[temp_counter_1].room_name; //set the div ID to the room name
        div_wrapper.addEventListener('click', ()=>{ //add a click event listener for room selection
            socket.emit('leave-socket-msg-room', current_room); //leave the current room
            document.querySelector('.message-area').innerHTML = ''; //clear the message area
            if (current_room){
                document.getElementById(current_room).style.backgroundColor = "#CA3E47";
            }
            current_room = div_wrapper.id; //update the current room to the clicked room
            
            
            socket.emit('join-socket-msg-room', {'user_id': my_id, 'room_to_join': current_room, 'new_msg': false}); //join the clicked room
            div_wrapper.style.backgroundColor="#ca3e47af"; //highlight the selected room
        })
        div_wrapper.addEventListener('mouseenter', ()=>{ //mouse enter event to change background on hover
            if (current_room !== div_wrapper.id){
                div_wrapper.style.backgroundColor = "#ca3e47af"; 
            }
        })
        div_wrapper.addEventListener('mouseleave', ()=>{ //mouse leave event to reset background
            if (current_room !== div_wrapper.id){
                div_wrapper.style.backgroundColor = "#CA3E47"
            }
        })
        div_wrapper.innerHTML = `<div class="un-name">${user_list_obj[temp_counter_1].name}</div>` //populate div with username
        //<div class="un-notif-count">${user_list_obj[temp_counter_1].notif_count} new notifications</div>`
        document.querySelector('.user-names').appendChild(div_wrapper); //add the user div to the DOM
        list_of_other_users.push(user_list_obj[temp_counter_1].name); //add the user's name to the list
        list_of_room_names.push(user_list_obj[temp_counter_1].room_name); //add the room name to the list
    }
    }
})

document.getElementById('send-msg-but').addEventListener('click', ()=>{ //give the message send button a click event
    let text_box_elem = document.getElementById("msg-text-to-send"); //get the text box element
    if (text_box_elem.value){ //check if the text box is not empty
        socket.emit('dm-msg-post', {'room_name': current_room, 'sender_id': my_id, 'msg_content': text_box_elem.value}); //send the message content to the server
        text_box_elem.value = ""; //clear the text box
    }
}
)
socket.on('dm_msg_list', (someobj)=>{ //handle the message list received from the server
    let list_of_messages = someobj.msg_content; //extract the message content
    let message_area_elem = document.querySelector('.message-area'); //get the element for the message display area
    let str_to_add = '' //initialize an empty string to accumulate messages
    if (typeof(list_of_messages) !== undefined){ //if the message list is defined
        for (let counter = 0; counter < list_of_messages.length; counter++){ //loop through the message lists
            let message_ = list_of_messages[counter]; //retrieve each message object
            str_to_add += `<div class="message-div">
            <div class="msg-meta-info"><div class="meta-text">${message_.sender_name}, ${message_.date_of_message}</div></div>
            <div class="msg-content">${message_.message_text}</div>
        </div>` //create each message's HTML structure using the sender name, content, and date

        }
    }
    message_area_elem.innerHTML = str_to_add; //add all messages to the message area in the DOM

})
