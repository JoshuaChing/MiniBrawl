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
var friction;
var canvasWidth;
var canvasHeight;
var blocks =[];


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
	canvasWidth = 640;
	canvasHeight = 350;

	//block values
	blocks.push({
		x:0,
		y:canvasHeight-20,
		width:canvasWidth,
		height:20
	});

	blocks.push({
		x:40,
		y:canvasHeight-100,
		width:150,
		height:20
	});

	blocks.push({
		x:canvasWidth-190,
		y:canvasHeight-100,
		width:150,
		height:20
	});

	//called for every new socket connection
	io.sockets.on("connection", function(socket){
		onClientConnect(socket);
		socket.on ("disconnect",onClientDisconnect);
		socket.on ("newPlayerToServer",onNewPlayerToServer);
		socket.on ("leftKeyToServer",onLeftKeyToServer);
		socket.on ("rightKeyToServer",onRightKeyToServer);
		socket.on ("upKeyToServer",onUpKeyToServer);
		socket.on ("chatMessageToServer", onChatMessageToServer);
		setInterval(function(){gameLoop(socket)}, 1000/FPS);
	});
}


/********************************/
/* GAME LOOP                    */
/********************************/

//main game loop
function gameLoop(socket){
	updatePhysics();
	updateSprites();
	sendGameState(socket);
}

//update sprite images
function updateSprites(){
	for (var i = 0; i < players.length; i++){
		//set image variables
		if (players[i].getVelocityX() <= 0.1 && players[i].getVelocityX() >= -0.1){
			players[i].setFrame(1);
			players[i].setMaxFrame(1);
			players[i].setAction("S");
		}
		//set frame
		if(players[i].getFrame() >= players[i].getMaxFrame()){
			players[i].setFrame(1);
		}else{
			players[i].setFrame(players[i].getFrame()+1);
		}
	}
}

//update physics
function updatePhysics(){
	//calculate positions
	for (var i = 0; i < players.length; i++){
		//apply friction and gravity
		players[i].setVelocityX(players[i].getVelocityX()*friction);
		players[i].setVelocityY(players[i].getVelocityY()+gravity);

		//reset grounded
		players[i].setGrounded(false);

		//check for blocks collision (ignore first block);
		for (var j = 0; j < blocks.length; j++){
			try{
				checkBlockCollision(players[i], blocks[j]);
			}catch(err){
				console.log("block collision: " + err);
			}
		}

		//set grounded
		if(players[i].getGrounded()){
			players[i].setVelocityY(0);
		}

		//set position
		players[i].setX(players[i].getX() + players[i].getVelocityX());
		players[i].setY(players[i].getY() + players[i].getVelocityY());

		//make sure player is not through the ground
		if(players[i].getY() >= (canvasHeight - 20 - players[i].getHeight())){
			players[i].setY(canvasHeight - 20 - players[i].getHeight());
			players[i].setGrounded(true);
			players[i].setJumping(false);
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
			y: players[i].getY(),
			character : players[i].getCharacter(),
			direction : players[i].getDirection(),
			frame :	players[i].getFrame(),
			action : players[i].getAction()
		});
   	} 
}

/***GAME LOOP - HELPER FUNCTIONS***/
function checkBlockCollision(objA, objB){
	//get vectors to check against (center to center)
	var vX = (objA.getX() + (objA.getWidth()/2)) - (objB.x + (objB.width/2));
	var vY = (objA.getY() + (objA.getHeight()/2)) - (objB.y + (objB.height/2));
	// half widths and half heights
	var hWidths = (objA.getWidth()/2) + (objB.width/2);
	var hHeights = (objA.getHeight()/2) + (objB.height/2);
	var colDir = "none";

	//check for collision against vectors and half width/heights
	if(Math.abs(vX) < hWidths && Math.abs(vY) < hHeights){
		var oX = hWidths - Math.abs(vX);
		var oY = hHeights - Math.abs(vY);

        if (oX >= oY) {
            if (vY > 0) {
            	//collision on objA top
                colDir = "t";
                objA.setY(objA.getY() + oY);
            } else {
            	//collision on objA bottom
                colDir = "b";
                objA.setY(objA.getY() - oY);
            }
        } else {
            if (vX > 0) {
            	//collision on objA reft;
                colDir = "l";
                objA.setX(objA.getX() + oX);
            } else {
            	//collision on objA right
                colDir = "r";
                objA.setX(objA.getX() - oX);
            }
        }

    }

    //more collision physics
	if (colDir === "l" || colDir === "r") {
		objA.setVelocityX(0);
		objA.setJumping(false);
	} else if (colDir === "b") {
		objA.setGrounded(true);
		objA.setJumping(false);
	} else if (colDir === "t") {
		objA.setVelocityY(objA.getVelocityY() * -1);
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
	
	//send message to other players
	this.broadcast.emit("chatMessageToClient", players[index].getUsername() + "has left the game.");

	players.splice(index,1);
	
	//send id to remove to all other clients
	this.broadcast.emit("removePlayerToClient",{ id: this.id });
}

//when new player joins server
function onNewPlayerToServer(data){
	console.log(this.id + " has set the username " + data.username);
	var newWidth;
	var newHeight;

	//determine width and height of character
	switch(data.character){
		case "BlackNinja":
			newWidth = 25;
			newHeight = 32;
			break;
		case "WhiteNinja":
			newWidth = 25;
			newHeight = 32;
			break;
		case "Knight":
			newWidth = 25;
			newHeight = 34;
			break;
		case "Joe":
			newWidth = 25;
			newHeight = 34;
			break;
		default:
			newWidth = 25;
			newHeight = 32;

	}

	//create new player object
	var newPlayer = new Player(data.username,data.character, startingX, startingY, this.id, newWidth, newHeight);

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

	//send message to other players
	this.broadcast.emit("chatMessageToClient", newPlayer.getUsername() + "has joined the game.");
}

//when left key is pressed
function onLeftKeyToServer(){
	var i = searchIndexById(this.id);
	//if id isn't found
	if (i == -1){
		console.log(this.id + ": id not found");
		return;
	}
	//set image variables
	players[i].setMaxFrame(3);
	players[i].setDirection("L");
	players[i].setAction("W");
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
	//set image variables
	players[i].setMaxFrame(3);
	players[i].setDirection("R");
	players[i].setAction("W");
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
	if (!players[i].getJumping() && players[i].getGrounded()){
		players[i].setJumping(true);
		players[i].setGrounded(false);
		players[i].setVelocityY(-players[i].getSpeed()*1.8);
	}
}

//when chat message is sent to server
function onChatMessageToServer(data){
	var i = searchIndexById(this.id);
	//if id isn't found
	if (i == -1){
		console.log(this.id + ": id not found");
		return;	
	}
	var message = players[i].getUsername() + ": " + data;
	io.sockets.emit("chatMessageToClient", message);
	console.log(message);
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