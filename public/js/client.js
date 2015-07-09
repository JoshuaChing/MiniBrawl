/********************************/
/* REQUEST ANIMATION FRAME      */
/********************************/
(function()
{
	var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
	window.requestAnimationFrame = requestAnimationFrame;
})();


/********************************/
/* GAME VARIABLES               */
/********************************/
var socketio,
	canvas,
	ctx,
	width,
	height,
	keys=[],
	players=[],
	images={},
	setCharacter = "BlackNinja",
	iconSelected = 0,
	blocks =[],
	chatDisabled = null;


/********************************/
/* GAME INITIALISATION          */
/********************************/
function init(){

	//chat varaibles
	chatDisabled = true;

	//canvas variables
	width = 640;
	height = 350;
	canvas = document.getElementById("canvas")
	ctx = canvas.getContext("2d")
	canvas.width = width;
	canvas.height = height;

	//connect to port
	socket = io();
	socket.on("connect",onClientConnect);
	socket.on("newPlayerToClient",onNewPlayerToClient);
	socket.on("newPositionToClient",onNewPositionToClient);
	socket.on("removePlayerToClient",onRemovePlayerToClient);
	socket.on("chatMessageToClient",onChatMessageToClient);

	//block values
	blocks.push({
		x:0,
		y:height-20,
		width:width,
		height:20
	});

	blocks.push({
		x:40,
		y:height-100,
		width:150,
		height:20
	});

	blocks.push({
		x:width-190,
		y:height-100,
		width:150,
		height:20
	});

}


/********************************/
/* LOCAL PLAYER MOVEMENT        */
/********************************/
function localPlayerMovement(){
	var checkMovement = false;

	if(chatDisabled){
		//up key (w) and key (up)
		if (keys[87] || keys[38]){
			socket.emit("upKeyToServer");
		}

		//key right (d) and key (right)
		if (keys[68] || keys[39]){
			socket.emit("rightKeyToServer");
		}

		//key left (a) and key (left)
		if (keys[65] || keys[37]){
			socket.emit("leftKeyToServer");
		}
	}
}


/********************************/
/* DRAW ALL PLAYERS             */
/********************************/
function drawPlayers(){
	ctx.font = "10px Verdana";
	ctx.fillStyle="#000000";
	for (var i = 0; i < players.length;i++){
		try{
			ctx.drawImage(images[players[i].character+players[i].action+players[i].direction+players[i].frame],players[i].x,players[i].y);
		}catch(e){console.log(e)}
		ctx.fillText(players[i].username,players[i].x,players[i].y-10);
	}
}


/********************************/
/* DRAW GAME MAP                */
/********************************/
function drawMap(){
	ctx.clearRect(0,0,width,height);
	ctx.fillStyle="#87CEEB"; //sky blue
	ctx.fillRect(0,0,width,height);

	ctx.fillStyle="green";
	ctx.fill();
	for (var i=0; i<blocks.length;i++){
		ctx.rect(blocks[i].x,blocks[i].y,blocks[i].width,blocks[i].height);
	}
}


/********************************/
/* GAME ANIMATION LOOP          */
/********************************/
function update(){
	drawMap();
	localPlayerMovement();
	drawPlayers();
	requestAnimationFrame(update);
}


/********************************/
/* SOCKET EVENT HANDLERS        */
/********************************/

//when client connects to server
function onClientConnect(){
	socket.emit("newPlayerToServer", {
			username: setUsername,
			character : setCharacter
	});
}

//add new player to client's list
function onNewPlayerToClient(data){
	var newPlayer = new Player(data.username, data.x, data.y, data.id);
	players.push(newPlayer);

	var playersContainer = document.getElementById("playersList");
	playersContainer.innerHTML = (playersContainer.innerHTML + "<br/>" + data.username);
}

//new position of remote players to client
function onNewPositionToClient(data){
	var index = searchIndexById(data.id);
	try{
		players[index].x=data.x;
		players[index].y=data.y;
		players[index].character=data.character;
		players[index].direction=data.direction;
		players[index].frame=data.frame;
		players[index].action=data.action;
	}catch(e){console.log(e)}
}

//remove player by id on client
function onRemovePlayerToClient(data){
	var index = searchIndexById(data.id);

	//if id isn't found
	if (index == -1){
		console.log(this.id + ": id not found");
		return;	
	}

	players.splice(index,1);

	var playersContainer = document.getElementById("playersList");
	playersContainer.innerHTML = ("<span id='playersTitle'>Users Connected:</span>");
	for (var i = 0; i < players.length; i++){
		playersContainer.innerHTML = (playersContainer.innerHTML + "<br/>" + players[i].username);
	}
}

//chat message to client
function onChatMessageToClient(data){
	var chatOutput = document.getElementById("chat-output");
	chatOutput.innerHTML = (chatOutput.innerHTML + "<br/>" + data);
	chatOutput.scrollTop = chatOutput.scrollHeight;
}

/***SOCKET EVENT HANDLERS - HELPER FUNCTIONS***/

//returns index by id
function searchIndexById(id){
	for (var i = 0; i < players.length; i++){
		if (players[i].id == id){
			return i;
		}	
	}
	return -1;
}


/********************************/
/* CHAT                         */
/********************************/

function checkChatKey(e){
	//enter key
	if(e.keyCode == 13){
		e.preventDefault();
		if(chatDisabled != null){
			var input = document.getElementById("chat-input");

			//toggle focus
			if(chatDisabled){
				input.focus();
			}else{
				input.blur();
				//refresh key events
				keys[37] = false;
				keys[38] = false;
				keys[39] = false;
				keys[65] = false;
				keys[68] = false;
				keys[87] = false;
				//send message to server
				if(input.value != "" && input.value != null){
					socket.emit("chatMessageToServer", input.value);
					input.value = "";
				}
			}

			//toggle enable/disable chat
			chatDisabled = !chatDisabled;
		}
	}
}

document.body.addEventListener("click", function(e){
	if(e.target != document.getElementById("chat-input")){
		chatDisabled = true;
	}else{
		chatDisabled = false;
	}
});


/********************************/
/* EVENT LISTENERS              */
/********************************/

//load images when window finishes loading
window.addEventListener("load", function(){
	loadImages();
	iconSelection(0,0); //set first character as selected
});

//key code event listener
document.body.addEventListener("keydown", function(e) {
    checkChatKey(e);
    keys[e.keyCode] = true;
});
 
//key code event listener
document.body.addEventListener("keyup", function(e) {
    keys[e.keyCode] = false;
});

//login button event listener - GAME STARTS HERE
document.getElementById("gameLogin-start").addEventListener("click",function(){
	//get values input
	setUsername = document.getElementById('gameLogin-username').value;

	//check for white space or nothing in input field
	if(setUsername.match(/^\s*$/)){
		document.getElementById("gameLogin-requiredUsername").style.display="inline-block";
  	}else{
  		//hide login view
		document.getElementById("gameLogin").style.display="none";
		//start game
		init();
  		update();
  	}
});

//game character icon event listeners
document.getElementById("gameLogin-blackNinja").addEventListener("click",function(){
	setCharacter="BlackNinja";
	iconSelection(iconSelected,0);
});
document.getElementById("gameLogin-whiteNinja").addEventListener("click",function(){
	setCharacter="WhiteNinja";
	iconSelection(iconSelected,1);
});
document.getElementById("gameLogin-knight").addEventListener("click",function(){
	setCharacter="Knight";
	iconSelection(iconSelected,2);
});
document.getElementById("gameLogin-joe").addEventListener("click",function(){
	setCharacter="Joe";
	iconSelection(iconSelected,3);
});

//function to change color of character icon selected before
function iconSelection(oldIconIndex,newIconIndex){
	var icons = document.getElementsByClassName("gameLogin-character");
	icons[oldIconIndex].style.borderColor="#000000";
	icons[oldIconIndex].style.backgroundColor="#ecf0f1";
	icons[newIconIndex].style.borderColor="#33FF33";
	icons[newIconIndex].style.backgroundColor="#3498db";
	iconSelected = newIconIndex;
}


/********************************/
/* GAME LOAD IMAGES FUNCTIONS   */
/********************************/
function loadImage(name){
	images[name] = new Image();
	images[name].src = "img/"+name+".png";
}

function loadImages(){
	loadImage("BlackNinjaSL1");
	loadImage("BlackNinjaSR1");
	loadImage("BlackNinjaWL1");
	loadImage("BlackNinjaWL2");
	loadImage("BlackNinjaWL3");
	loadImage("BlackNinjaWR1");
	loadImage("BlackNinjaWR2");
	loadImage("BlackNinjaWR3");
	loadImage("WhiteNinjaSL1");
	loadImage("WhiteNinjaSR1");
	loadImage("WhiteNinjaWL1");
	loadImage("WhiteNinjaWL2");
	loadImage("WhiteNinjaWL3");
	loadImage("WhiteNinjaWR1");
	loadImage("WhiteNinjaWR2");
	loadImage("WhiteNinjaWR3");
	loadImage("KnightSL1");
	loadImage("KnightSR1");
	loadImage("KnightWL1");
	loadImage("KnightWL2");
	loadImage("KnightWL3");
	loadImage("KnightWR1");
	loadImage("KnightWR2");
	loadImage("KnightWR3");
	loadImage("JoeSL1");
	loadImage("JoeSR1");
	loadImage("JoeWL1");
	loadImage("JoeWL2");
	loadImage("JoeWL3");
	loadImage("JoeWR1");
	loadImage("JoeWR2");
	loadImage("JoeWR3");
}
