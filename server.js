/********************************/
/* SERVER SETUP AND SOCKET.IO   */
/********************************/
var port = process.env.PORT || 3000;
var express = require('express');
var app = express();
var server = require ('http').createServer(app);
var io = require('socket.io').listen(server);

//setup routes
require('./router/main')(app);
app.set('views',__dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html',require('ejs').renderFile);
app.use(express.static(__dirname + '/public'));


//configure socket.io to be used on heroku
io.configure(function () {
  io.set("transports", ["xhr-polling"]);
  io.set("polling duration", 10);
  io.set('log level', 2);
});

//listen for web clients
server.listen(port, function(){
    console.log("listening on :"+port);
});


/********************************/
/* GAME VARIABLES               */
/********************************/
var Player = require("./game_modules/Player").Player;
var players;
var startingX;
var startingY;
var FPS;
var gravity;
var friciton;


/********************************/
/* GAME INITIALISATION          */
/********************************/
function init(){
	players = [];
	startingX = 0;
	startingY = 0;
	FPS = 60;
	gravity = 0.3;
	friction = 0.8;

	//called for every new socket connection
	io.sockets.on("connection", function(socket){
		onClientConnect(socket);
		socket.on ("disconnect",onClientDisconnect);
		socket.on ("newPlayerToServer",onNewPlayerToServer);
		socket.on ("leftKeyToServer",onLeftKeyToServer);
		socket.on ("rightKeyToServer",onRightKeyToServer);
		socket.on ("upKeyToServer",onUpKeyToServer);
		setInterval(function(){gameLoop(socket)}, 1000/FPS);
	});
}


/********************************/
/* GAME LOOP                    */
/********************************/

//main game loop
function gameLoop(socket){
	updatePhysics();
	sendGameState(socket);
}

//update physics
function updatePhysics(){
	//calculate positions
	for (var i = 0; i < players.length; i++){
		//apply friction and gravity
		players[i].setVelocityX(players[i].getVelocityX()*friction);
		players[i].setVelocityY(players[i].getVelocityY()+gravity);

		//set position
		players[i].setX(players[i].getX() + players[i].getVelocityX());
		players[i].setY(players[i].getY() + players[i].getVelocityY());

		//check for ground collision
		if (players[i].getY() >= 490){
			players[i].setJumping(false);
			players[i].setY(490);
		}
	}
}

//send updates to clients
function sendGameState(socket){
	//send new positions to clients
	for (var i = 0; i < players.length; i++){
    	socket.emit('newPositionToClient',{
			id: players[i].getId(),
			x: players[i].getX(),
			y: players[i].getY()	
		});
   	} 
}


/********************************/
/* SOCKET EVENT HANDLERS        */
/********************************/

///when client connects to server
function onClientConnect(socket){
	console.log(socket.id + " has connected");
}

//when client disconnects from server
function onClientDisconnect(){
	console.log(this.id + " has disconnected");
	
	//remove player from server list
	var index = searchIndexById(this.id);

	//if id isn't found
	if (index == -1){
		console.log(this.id + ": id not found");
		return;	
	}
	
	players.splice(index,1);
	
	//send id to remove to all other clients
	this.broadcast.emit("removePlayerToClient",{ id: this.id });
}

//when new player joins server
function onNewPlayerToServer(data){
	console.log(this.id + " has set the username " + data.username);

	//create new player object
	var newPlayer = new Player(data.username, startingX, startingY, this.id);

	//add new player to server list
	players.push(newPlayer);

	//send existing players to new client
	for (var i = 0; i < players.length; i++){
		var existingPlayer = players[i];
		this.emit("newPlayerToClient", {
			username: existingPlayer.getUsername(),
			x: existingPlayer.getX(),
			y: existingPlayer.getY(),
			id: existingPlayer.getId()
		});
	}
	
	//send new player to all other clients
	this.broadcast.emit("newPlayerToClient",{
		username: newPlayer.getUsername(),
		x: newPlayer.getX(),
		y: newPlayer.getY(),
		id: newPlayer.getId()
	});
}

//when left key is pressed
function onLeftKeyToServer(){
	var i = searchIndexById(this.id);
	//if id isn't found
	if (i == -1){
		console.log(this.id + ": id not found");
		return;	
	}
	//calculate velocity
	if (players[i].getVelocityX() > -players[i].getSpeed()){
		players[i].setVelocityX(players[i].getVelocityX()-1);
	}
}

//when right key is pressed
function onRightKeyToServer(){
	var i = searchIndexById(this.id);
	//if id isn't found
	if (i == -1){
		console.log(this.id + ": id not found");
		return;	
	}
	//calculate velocity
	if (players[i].getVelocityX() < players[i].getSpeed()){
		players[i].setVelocityX(players[i].getVelocityX()+1);
	}
}

//when up key is pressed
function onUpKeyToServer(){
	var i = searchIndexById(this.id);
	//if id isn't found
	if (i == -1){
		console.log(this.id + ": id not found");
		return;	
	}
	//jumping logic
	if (!players[i].getJumping()){
		players[i].setJumping(true);
		players[i].setVelocityY(-players[i].getSpeed()*2);
	}
}

/***SOCKET EVENT HANDLERS - HELPER FUNCTIONS***/

//returns index by id
function searchIndexById(id){
	for (var i = 0; i < players.length; i++){
		if (players[i].getId() == id){
			return i;
		}	
	}
	return -1;
}


/********************************/
/* RUN THE GAME                 */
/********************************/
init();