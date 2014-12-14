////REQUEST ANIMATION FRAME////
(function()
{
	var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
	window.requestAnimationFrame = requestAnimationFrame;
})();

////GAME VARIABLES////
var socketio,
	canvas,
	ctx,
	width,
	height,
	keys,
	localPlayer,
	remotePlayers;

////GAME INITIALISATION////
function init(){

	//canvas variables
	width = 500;
	height = 500;
	canvas = document.getElementById("canvas")
	ctx = canvas.getContext("2d")
	canvas.width = width;
	canvas.height = height;
	keys = [];

	//game variables
	var setUsername = prompt("What is your username?");
	localPlayer = new Player(setUsername, 0, 0);
	remotePlayers = []

	//connect to port
	socket = io.connect(window.location.hostname);
	setSocketEventHandlers();

}

////LOCAL PLAYER MOVEMENT////
function localPlayerMovement(){
	var checkMovement = false;

	//up key (s)
	if (keys[87]){
		localPlayer.setY(localPlayer.getY()-2);
		checkMovement = true;
	}

	//down key (w)
	if (keys[83]){
		localPlayer.setY(localPlayer.getY()+2);
		checkMovement = true;
	}

	//key right (d)
	if (keys[68]){
		localPlayer.setX(localPlayer.getX()+2);
		checkMovement = true;
	}

	//key left (a)
	if (keys[65]){
		localPlayer.setX(localPlayer.getX()-2);
		checkMovement = true;
	}

	if (checkMovement){
		onNewPositionToServer();
	}
}

////DRAW ALL PLAYERS////
function drawPlayers(){
	ctx.font = "10px Verdana";
	ctx.fillStyle="blue";
	for (var i = 0; i < remotePlayers.length;i++){
		ctx.fillRect(remotePlayers[i].getX(),remotePlayers[i].getY(),10,10);
		ctx.fillText(remotePlayers[i].getUsername(),remotePlayers[i].getX(),remotePlayers[i].getY()-10);
	}
	ctx.fillStyle="cyan";
	ctx.fillRect(localPlayer.getX(),localPlayer.getY(),10,10);
	ctx.fillText(localPlayer.getUsername(),localPlayer.getX(),localPlayer.getY()-10);
}

////GAME ANIMATION LOOP////
function update(){
	ctx.clearRect(0,0,width,height);
	ctx.fillStyle="green";
	ctx.fillRect(0,0,width,height);
	localPlayerMovement();
	drawPlayers();
	requestAnimationFrame(update);
}

////SOCKET EVENT HANDLERS////
function setSocketEventHandlers(){
	socket.on("connect",onClientConnect);
	socket.on("newPlayerToClient",onNewPlayerToClient);
	socket.on("newPositionToClient",onNewPositionToClient);
	socket.on("removePlayerToClient",onRemovePlayerToClient);

	//when client connects to server
	function onClientConnect(){
		socket.emit("newPlayerToServer", {
				username: localPlayer.getUsername(),
				x: localPlayer.getX(),
				y: localPlayer.getY()
			});
	}

	//add new player to client's list
	function onNewPlayerToClient(data){
		var newPlayer = new Player(data.username, data.x, data.y);
		newPlayer.setId(data.id);
		remotePlayers.push(newPlayer);

		var remotePlayersContainer = document.getElementById("remotePlayers");
		remotePlayersContainer.innerHTML = (remotePlayersContainer.innerHTML + "<br/>" + data.username);
	}

	//new position of remote players to client
	function onNewPositionToClient(data){
		var index = searchIndexById(data.id);
		remotePlayers[index].setX(data.x);
		remotePlayers[index].setY(data.y);
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
			remotePlayersContainer.innerHTML = (remotePlayersContainer.innerHTML + "<br/>" + remotePlayers[i].getUsername());
		}
	}

}

//new position of local player to server
function onNewPositionToServer(){
	socket.emit("newPositionToServer",{
		x: localPlayer.getX(),
		y: localPlayer.getY()
	});
}

//returns index by id
function searchIndexById(id){
	for (var i = 0; i < remotePlayers.length; i++){
		if (remotePlayers[i].getId() == id){
			return i;
		}	
	}
	return -1;
}

////EVENT LISTENERS////

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
