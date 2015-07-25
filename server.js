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

//listen for web clients
server.listen(port, function(){
    console.log("listening on :"+port);
});


/********************************/
/* GAME VARIABLES               */
/********************************/
var Player = require("./game_modules/Player").Player;
var players;
var Projectile = require("./game_modules/Projectile").Projectile;
var projectiles;
var projectilesCount;
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
	projectiles = [];
	projectilesCount = 0;
	startingX = 25;
	startingY = -30;
	FPS = 60;
	gravity = 0.3;
	friction = 0.8;
	canvasWidth = 640;
	canvasHeight = 350;

	//block values

	//base block
	blocks.push({
		x:-2000,
		y:canvasHeight-20,
		width:canvasWidth + 4000,
		height:20
	});

	//3 mid plats
	blocks.push({
		x:-50,
		y:canvasHeight-90,
		width:200,
		height:20
	});

	blocks.push({
		x:canvasWidth-150,
		y:canvasHeight-90,
		width:200,
		height:20
	});

	blocks.push({
		x:canvasWidth/2-115,
		y:canvasHeight-160,
		width:230,
		height:20
	});

	//left corner stairs
	blocks.push({
		x:0,
		y:20,
		width:20,
		height:30
	});

	blocks.push({
		x:0,
		y:50,
		width:60,
		height:40
	});

	blocks.push({
		x:0,
		y:90,
		width:100,
		height:40
	});

	blocks.push({
		x:0,
		y:130,
		width:150,
		height:20
	});

	//right corner plats
	blocks.push({
		x:canvasWidth - 150,
		y: 50,
		width:130,
		height:20,
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
		socket.on ("projectileToServer", onProjectileToServer);
	});

	//init game loop
	setInterval(function(){gameLoop()}, 1000/FPS);
}


/********************************/
/* GAME LOOP                    */
/********************************/

//main game loop
function gameLoop(){
	updatePhysics();
	updateSprites();
	sendGameState();
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
	//calculate projectile positions
	for(var i = 0; i < projectiles.length; i++){
		projectiles[i].setX(projectiles[i].getX() + projectiles[i].getVelocityX());
		projectiles[i].setY(projectiles[i].getY() + projectiles[i].getVelocityY());
	}

	//remove projectiles that are off screen
	var index = projectiles.length;
	while(index--){
		if(projectiles[index].getX() <= -100 || projectiles[index].getX() >= (canvasWidth + 100) || projectiles[index].getY() <= - 100 || projectiles[index].getY() >= (canvasHeight + 100)){
			io.sockets.emit("projectileRemoveToClient", projectiles[index].getId());
			projectiles.splice(index,1);
		}
	}

	//calculate positions
	for (var i = 0; i < players.length; i++){
		//check projectiles collision
		for(var j = 0; j < projectiles.length; j++){
			try{
				if(checkProjectileCollision(players[i], projectiles[j])){
					if(players[i].getHealth() > 0){
						//recoil and decrement health
						players[i].setX(players[i].getX() + projectiles[j].getVelocityX()*0.3);
						players[i].setY(players[i].getY() + projectiles[j].getVelocityY()*0.3);
						players[i].setHealth(players[i].getHealth() - 1);
					}
					checkDeath(players[i], projectiles[j]);
				}
			}catch(err){
				console.log("projectile collision: " + err);
			}
		}

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

		//jumping logic
		if (players[i].getJumpingClicked() && !players[i].getJumping() && players[i].getGrounded()){
			players[i].setJumping(true);
			players[i].setGrounded(false);
			players[i].setVelocityY(-players[i].getSpeed()*1.7);
		}

		//set grounded
		if(players[i].getGrounded()){
			players[i].setVelocityY(0);
		}

		//wrap map
		if(players[i].getX() <= 0 - players[i].getWidth()){
			players[i].setX(canvasWidth - 5);
		}else if(players[i].getX() >= canvasWidth){
			players[i].setX(0 - players[i].getWidth() + 5);
		}

		//set position
		players[i].setX(players[i].getX() + players[i].getVelocityX());
		players[i].setY(players[i].getY() + players[i].getVelocityY());

		//reset jumping clicked
		players[i].setJumpingClicked(false);
	}
}

//send updates to clients
function sendGameState(){
	//send projectiles to clients
	for (var i = 0; i < projectiles.length; i++){
		io.sockets.emit('projectilePositionToClient',{
			id: projectiles[i].getId(),
			x: projectiles[i].getX(),
			y: projectiles[i].getY()
		});
	}

	//send new positions to clients
	for (var i = 0; i < players.length; i++){
		io.sockets.emit('newPositionToClient',{
			id: players[i].getId(),
			x: players[i].getX(),
			y: players[i].getY(),
			character : players[i].getCharacter(),
			direction : players[i].getDirection(),
			frame :	players[i].getFrame(),
			action : players[i].getAction(),
			health : players[i].getHealth(),
			maxHealth : players[i].getMaxHealth()
		});
	}
}

/***GAME LOOP - HELPER FUNCTIONS***/

//block collision
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
                objA.setY(objA.getY() - oY/2);
            }
        } else {
            if (vX > 0) {
            	//collision on objA left;
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

//projectile collision
function checkProjectileCollision(objA, objB){
	//check if it is own user
	if(objA.getId() == objB.getPlayerId()){
		return false;
	}

	//get vectors to check against (center to center)
	var vX = (objA.getX() + (objA.getWidth()/2)) - (objB.getX() + (5/2));
	var vY = (objA.getY() + (objA.getHeight()/2)) - (objB.getY() + (5/2));
	// half widths and half heights
	var hWidths = (objA.getWidth()/2) + (5/2);
	var hHeights = (objA.getHeight()/2) + (5/2);

	//check for collision against vectors and half width/heights
	if(Math.abs(vX) < hWidths && Math.abs(vY) < hHeights){
		return true;
	}

	return false;
}

//check if player dead
function checkDeath(player, projectile){
	if(player.getHealth() <= 0){
		//get name of slayer and send message
		var index = searchIndexById(projectile.getPlayerId());
		if(index == -1){
			sendMessageToAll(player.getUsername() + " has been slained.");
		}else{
			sendMessageToAll(player.getUsername() + " has been slained by " + players[index].getUsername() + ".");
		}
		//death reset
		player.setX(startingX);
		player.setY(startingY);
		player.setHealth(player.getMaxHealth());
		//handle score
		players[index].addScore(true,1);
		io.sockets.emit("newScoreToClient", {
			score: players[index].getScore(),
			id : players[index].getId()
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
			id: existingPlayer.getId(),
			score: existingPlayer.getScore()
		});
	}

	//send existing projectiles to new client
	for(var i = 0; i < projectiles.length; i++){
		this.emit("projectileToClient", {
			id: projectiles[i].getId(),
			x: projectiles[i].getX(),
			y: projectiles[i].getY(),
			playerId: projectiles[i].getPlayerId()
		});
	}
	
	//send new player to all other clients
	this.broadcast.emit("newPlayerToClient",{
		username: newPlayer.getUsername(),
		x: newPlayer.getX(),
		y: newPlayer.getY(),
		id: newPlayer.getId(),
		score: newPlayer.getScore()
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
	players[i].setJumpingClicked(true);
}

//when chat message is sent to server
function onChatMessageToServer(data){
	var i = searchIndexById(this.id);
	//if id isn't found
	if (i == -1){
		console.log(this.id + ": id not found");
		return;	
	}
	sendMessageToAll(players[i].getUsername() + ": " + data);
}

//when projectile direction is sent to server
function onProjectileToServer(data){
	var i = searchIndexById(this.id);
	//if id isn't found
	if (i == -1){
		console.log(this.id + ": id not found");
		return;
	}

	//calculate veloctiy of projectile
	var startX = players[i].getX() + players[i].getWidth()/2;
	var startY = players[i].getY() + players[i].getHeight()/2;
	var xDir = (data.x - startX);
	var yDir = (data.y - startY);
	var magnitude = Math.sqrt(xDir * xDir + yDir * yDir);
	var xVel = (xDir / magnitude) * 12;
	var yVel = (yDir / magnitude) * 12;

	//create new player object
	var newProjectile = new Projectile(startX, startY, xVel, yVel, projectilesCount, this.id);

	//increment projectiles counter
	if(projectilesCount >=1000){
		projectilesCount = 0;
	}else{
		projectilesCount++;
	}

	//add new player to server list
	projectiles.push(newProjectile);

	//send new projectile to all clients
	io.sockets.emit("projectileToClient",{
		id: newProjectile.getId(),
		x: newProjectile.getX(),
		y: newProjectile.getY(),
		playerId : newProjectile.getPlayerId()
	});
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

//send message to all
function sendMessageToAll(message){
	console.log(message);
	io.sockets.emit("chatMessageToClient", message);
}


/********************************/
/* RUN THE GAME                 */
/********************************/
init();