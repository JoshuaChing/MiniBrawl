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
	keys,
	localPlayer,
	remotePlayers;


/********************************/
/* GAME INITIALISATION          */
/********************************/
function init(){

	//canvas variables
	width = 500;
	height = 500;
	canvas = document.getElementById("canvas")
	ctx = canvas.getContext("2d")
	canvas.width = width;
	canvas.height = height;

	//game variables
	keys = [];
	localPlayer = new Player();
	localPlayer.username = prompt("What is your username?");
	remotePlayers = []

	//connect to port
	socket = io.connect(window.location.hostname);
	socket.on("connect",onClientConnect);
	socket.on("initPlayerToClient",onInitPlayerToClient);
	socket.on("newPlayerToClient",onNewPlayerToClient);
	socket.on("newPositionToClientSelf",onNewPositionToClientSelf);
	socket.on("newPositionToClient",onNewPositionToClient);
	socket.on("removePlayerToClient",onRemovePlayerToClient);
}


/********************************/
/* LOCAL PLAYER MOVEMENT        */
/********************************/
function localPlayerMovement(){
	var checkMovement = false;

	//up key (s)
	if (keys[87]){
		socket.emit("upKeyToServer");
	}

	//key right (d)
	if (keys[68]){
		socket.emit("rightKeyToServer");
	}

	//key left (a)
	if (keys[65]){
		socket.emit("leftKeyToServer");
	}
}


/********************************/
/* DRAW ALL PLAYERS             */
/********************************/
function drawPlayers(){
	ctx.font = "10px Verdana";
	ctx.fillStyle="blue";
	for (var i = 0; i < remotePlayers.length;i++){
		ctx.fillRect(remotePlayers[i].x,remotePlayers[i].y,10,10);
		ctx.fillText(remotePlayers[i].username,remotePlayers[i].x,remotePlayers[i].y-10);
	}
	ctx.fillStyle="cyan";
	ctx.fillRect(localPlayer.x,localPlayer.y,10,10);
	ctx.fillText(localPlayer.username,localPlayer.x,localPlayer.y-10);
}


/********************************/
/* GAME ANIMATION LOOP          */
/********************************/
function update(){
	ctx.clearRect(0,0,width,height);
	ctx.fillStyle="green";
	ctx.fillRect(0,0,width,height);
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
			username: localPlayer.username
	});
}

//player init to client
function onInitPlayerToClient(data){
	localPlayer.x = data.x;
	localPlayer.y = data.y;
	localPlayer.id = data.id;
}

//add new player to client's list
function onNewPlayerToClient(data){
	var newPlayer = new Player(data.username, data.x, data.y, data.id);
	remotePlayers.push(newPlayer);

	var remotePlayersContainer = document.getElementById("remotePlayers");
	remotePlayersContainer.innerHTML = (remotePlayersContainer.innerHTML + "<br/>" + data.username);
}

//new position of client to self
function onNewPositionToClientSelf(data){
	localPlayer.x=data.x;
	localPlayer.y=data.y;
}

//new position of remote players to client
function onNewPositionToClient(data){
	var index = searchIndexById(data.id);
	remotePlayers[index].x=data.x;
	remotePlayers[index].y=data.y;
}

//remove player by id on client
function onRemovePlayerToClient(data){
	var index = searchIndexById(data.id);

	//if id isn't found
	if (index == -1){
		console.log(this.id + ": id not found");
		return;	
	}

	remotePlayers.splice(index,1);

	var remotePlayersContainer = document.getElementById("remotePlayers");
	remotePlayersContainer.innerHTML = ("<span id='remotePlayersTitle'>Users Connected:</span>");
	for (var i = 0; i < remotePlayers.length; i++){
		remotePlayersContainer.innerHTML = (remotePlayersContainer.innerHTML + "<br/>" + remotePlayers[i].username);
	}
}

/***SOCKET EVENT HANDLERS - HELPER FUNCTIONS***/

//returns index by id
function searchIndexById(id){
	for (var i = 0; i < remotePlayers.length; i++){
		if (remotePlayers[i].id == id){
			return i;
		}	
	}
	return -1;
}


/********************************/
/* EVENT LISTENERS              */
/********************************/

//start game when window finishes loading
window.addEventListener("load", function(){
  init();
  update();
});

//key code event listener
document.body.addEventListener("keydown", function(e) {
    keys[e.keyCode] = true;
});
 
//key code event listener
document.body.addEventListener("keyup", function(e) {
    keys[e.keyCode] = false;
});
