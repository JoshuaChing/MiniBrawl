////SERVER SETUP AND SOCKET.IO////
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

////GAME VARIABLES////
var Player = require("./game_modules/Player").Player;
var players;

////GAME INITIALISATION////
function init(){
	players = [];
	//called for every new socket connection
	io.sockets.on("connection", function(socket){
		//when client connects to server
		onClientConnect(socket);

		//when client disconnects from server
		socket.on ("disconnect",onClientDisconnect);

		//when new player joins server
		socket.on ("newPlayerToServer",onNewPlayerToServer);

		//when new position is sent to server
		socket.on ("newPositionToServer",onNewPositionToServer);
	});
}

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

	var newPlayer = new Player(data.username, data.x, data.y);
	newPlayer.setId (this.id);

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

//when new position is sent to server
function onNewPositionToServer(data){
	//add new position to server
	var index = searchIndexById(this.id);
	players[index].setX(data.x);
	players[index].setY(data.y);
		
	//if id isn't found
	if (index == -1){
		console.log(this.id + ": id not found");
		return;	
	}

	//send new position to all other clients
	this.broadcast.emit("newPositionToClient",{
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

////RUN THE GAME////
init();
