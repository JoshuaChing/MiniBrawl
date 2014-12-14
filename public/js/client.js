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
	players;


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
	setUsername = prompt("What is your username?");
	players = []

	//connect to port
	socket = io.connect(window.location.hostname);
	socket.on("connect",onClientConnect);
	socket.on("newPlayerToClient",onNewPlayerToClient);
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
	for (var i = 0; i < players.length;i++){
		ctx.fillRect(players[i].x,players[i].y,10,10);
		ctx.fillText(players[i].username,players[i].x,players[i].y-10);
	}
	ctx.fillStyle="cyan";
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
			username: setUsername
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
	}catch(e){
		console.log(e);
	}
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

	var playersContainer = document.getElementById("players");
	playersContainer.innerHTML = ("<span id='playersTitle'>Users Connected:</span>");
	for (var i = 0; i < players.length; i++){
		playersContainer.innerHTML = (playersContainer.innerHTML + "<br/>" + players[i].username);
	}
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
/* EVENT LISTENERS              */
/********************************/

//start game when window finishes loading
window.addEventListener("load", function(){
  init();
});

//key code event listener
document.body.addEventListener("keydown", function(e) {
    keys[e.keyCode] = true;
});
 
//key code event listener
document.body.addEventListener("keyup", function(e) {
    keys[e.keyCode] = false;
});
