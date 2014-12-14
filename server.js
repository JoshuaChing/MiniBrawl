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
  io.set('log level', 1);
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


/********************************/
/* GAME INITIALISATION          */
/********************************/
function init(){
	players = [];
	startingX = 400;
	startingY = 400;
	//called for every new socket connection
	io.sockets.on("connection", function(socket){
		onClientConnect(socket);
		socket.on ("disconnect",onClientDisconnect);
		socket.on ("newPlayerToServer",onNewPlayerToServer);
		socket.on ("leftKeyToServer",onLeftKeyToServer);
		socket.on ("rightKeyToServer",onRightKeyToServer);
		socket.on ("upKeyToServer",onUpKeyToServer);
	});
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

	var newPlayer = new Player(data.username, startingX, startingY, this.id);

	//initialise player for client
	this.emit("initPlayerToClient",{
		x: newPlayer.getX(),
		y: newPlayer.getY(),
		id: newPlayer.getId()
	})

	//send existing player to new client
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

	//add new player to server list
	players.push(newPlayer);
}

//when left key is pressed
function onLeftKeyToServer(){
	var index = searchIndexById(this.id);
	//if id isn't found
	if (index == -1){
		console.log(this.id + ": id not found");
		return;	
	}
	players[index].setX(players[index].getX()-2);
	sendNewPositions(index,this);
}

//when right key is pressed
function onRightKeyToServer(){
	var index = searchIndexById(this.id);
	//if id isn't found
	if (index == -1){
		console.log(this.id + ": id not found");
		return;	
	}
	players[index].setX(players[index].getX()+2);
	sendNewPositions(index,this);
}

//when up key is pressed
function onUpKeyToServer(){
	var index = searchIndexById(this.id);
	//if id isn't found
	if (index == -1){
		console.log(this.id + ": id not found");
		return;	
	}
	players[index].setY(players[index].getY()-2);
	sendNewPositions(index,this);
}

/***SOCKET EVENT HANDLERS - HELPER FUNCTIONS***/

//send new position data to all clients
function sendNewPositions(index,socket){
	//send new position to client
	socket.emit("newPositionToClientSelf",{
		x: players[index].getX(),
		y: players[index].getY()
	})

	//send new position to all other clients
	socket.broadcast.emit("newPositionToClient",{
		id: players[index].getId(),
		x: players[index].getX(),
		y: players[index].getY()	
	});
}

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
