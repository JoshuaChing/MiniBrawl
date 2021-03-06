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
	playersRanking=[],
	projectiles=[],
	images={},
	setCharacter = "BlackNinja",
	iconSelected = 0,
	blocks =[],
	chatDisabled = null,
	firstMarkFrame = 1;
	firstMarkFrameDirection = 1;
	firstMarkFrameMax = 5;
	firstMarkFrameDelayMax = 5;
	firstMarkFrameDelay = 0;


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
	socket.on("projectileToClient",onProjectileToClient);
	socket.on("projectilePositionToClient",onProjectilePositionToClient);
	socket.on("projectileRemoveToClient", onProjectileRemoveToClient);
	socket.on("newScoreToClient", onNewScoreToClient);

	//block values

	//base block
	blocks.push({
		x:0,
		y:height-20,
		width:width,
		height:20
	});

	//3 mid plats
	blocks.push({
		x:0,
		y:height-90,
		width:150,
		height:20
	});

	blocks.push({
		x:width-150,
		y:height-90,
		width:150,
		height:20
	});

	blocks.push({
		x:(width/2) - 115,
		y:height-160,
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
		x:width - 150,
		y: 50,
		width:130,
		height:20,
	});
}


/********************************/
/* LOCAL PLAYER CONTROLS        */
/********************************/
function localPlayerMovement(){
	var checkMovement = false;

	if(chatDisabled){
		//up key (w) and key (up) and key (space)
		if (keys[87] || keys[38] || keys[32]){
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

//send projectile positions to server
function sendProjectilePositions(posX, posY){
	socket.emit("projectileToServer", {
		x: posX,
		y: posY
	});
}

//click listener on canvas
document.getElementById('canvas').onmousedown = function(event){
	sendProjectilePositions((event.pageX - canvas.offsetLeft), (event.pageY - canvas.offsetTop))
	return false;
};


/********************************/
/* DRAW ALL PLAYERS             */
/********************************/
function drawPlayers(){
	for (var i = 0; i < players.length;i++){
		try{
			ctx.drawImage(images[players[i].character+players[i].action+players[i].direction+players[i].frame],players[i].x,players[i].y);
		}catch(e){console.log(e)}
		ctx.font = "10px Verdana";
		ctx.fillStyle="#000000";
		ctx.fillText(players[i].username, players[i].x, players[i].y+45);

		//draw health bar background
		ctx.fillStyle="#000000";
		ctx.beginPath();
		ctx.rect(players[i].x - 3, players[i].y - 10, 30, 7);
		ctx.fill();
		ctx.closePath();

		//draw health bar
		var healthRatio = players[i].health/players[i].maxHealth;
		if(healthRatio >= 0.50){
			ctx.fillStyle="green";
		}else if(healthRatio >= 0.25){
			ctx.fillStyle="orange";
		}else{
			ctx.fillStyle="red";
		}
		ctx.beginPath();
		ctx.rect(players[i].x - 2, players[i].y - 9, healthRatio*28, 5);
		ctx.fill();
		ctx.closePath();
	}

	//draw winner's triangle
	if(playersRanking != null && playersRanking.length > 0){
		if(firstMarkFrameDelay < firstMarkFrameDelayMax){
			firstMarkFrameDelay++;
		}else{
			//animate frame
			if(firstMarkFrame >= firstMarkFrameMax || firstMarkFrame <= 0){
				firstMarkFrameDirection *= -1;
			}
			firstMarkFrame += firstMarkFrameDirection;
			firstMarkFrameDelay = 0;
		}
		//draw text
		ctx.font = "Bold 10px Verdana";
		ctx.fillStyle = "#000000";
		ctx.fillText("1st", playersRanking[0].x + 3, playersRanking[0].y - 30 + firstMarkFrame);
		//draw path (player widths 12.5)
		ctx.beginPath();
		ctx.moveTo(playersRanking[0].x + 13, playersRanking[0].y - 19 + firstMarkFrame);
		ctx.lineTo(playersRanking[0].x + 8, playersRanking[0].y - 25 + firstMarkFrame);
		ctx.lineTo(playersRanking[0].x + 18, playersRanking[0].y - 25 + firstMarkFrame);
		ctx.closePath();
		//border and fill
		ctx.lineWidth = 2;
		ctx.strokeStyle = "#000000";
		ctx.stroke();
		ctx.fillStyle = "red";
		ctx.fill();
	}
}


/********************************/
/* DRAW PROJECTILES             */
/********************************/
function drawProjectiles(){
	for (var i=0; i<projectiles.length;i++){
		ctx.beginPath();
		//determine projectile style
		var index = searchIndexById(players, projectiles[i].playerId);
		var character = (index==-1) ? "default" : players[index].character;
		switch(character){
			case "BlackNinja":
				ctx.fillStyle = "black";
				break;
			case "WhiteNinja":
				ctx.fillStyle = "blue";
				break;
			case "Knight":
				ctx.fillStyle = "red";
				break;
			case "Joe":
				ctx.fillStyle = "#472400";
				break;
			default:
				ctx.fillStyle="black";
		}
		ctx.arc(projectiles[i].x, projectiles[i].y, 5/2, 0, 2 * Math.PI);
		ctx.fill();
		ctx.closePath();
	}
}


/********************************/
/* DRAW GAME MAP                */
/********************************/
function drawMap(){
	//draw base blocks
	ctx.fillStyle="#4d341e";
	ctx.beginPath();
	for (var i=0; i<blocks.length;i++){
		ctx.rect(blocks[i].x,blocks[i].y,blocks[i].width,blocks[i].height);
	}
	ctx.closePath();
	ctx.fill();
	//draw grass
	ctx.fillStyle="#003300";
	ctx.beginPath();
	for (var i=0; i<5;i++){
		ctx.rect(blocks[i].x,blocks[i].y,blocks[i].width,5);
	}
	//too lazy to find pattern
	ctx.rect(blocks[5].x + 20,blocks[5].y,blocks[5].width - 20,5);
	ctx.rect(blocks[6].x + 60,blocks[6].y,blocks[6].width - 60,5);
	ctx.rect(blocks[7].x + 100,blocks[7].y,blocks[7].width - 100,5);
	ctx.rect(blocks[8].x ,blocks[8].y,blocks[8].width, 5);
	ctx.closePath();
	ctx.fill();
}


/********************************/
/* GAME ANIMATION LOOP          */
/********************************/
function update(){
	ctx.clearRect(0,0,width,height);
	drawMap();
	drawPlayers();
	drawProjectiles();
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
	var newPlayer = new Player(data.username, data.x, data.y, data.id, data.score);
	players.push(newPlayer);
	playersRanking.push(newPlayer);

	updatePlayersRanking();
}

//new position of remote players to client
function onNewPositionToClient(data){
	var index = searchIndexById(players, data.id);
	try{
		players[index].x=data.x;
		players[index].y=data.y;
		players[index].character=data.character;
		players[index].direction=data.direction;
		players[index].frame=data.frame;
		players[index].action=data.action;
		players[index].health=data.health;
		players[index].maxHealth=data.maxHealth;
	}catch(e){console.log(e)}
}

//remove player by id on client
function onRemovePlayerToClient(data){
	var index = searchIndexById(players, data.id);
	var rankingIndex = searchIndexById(playersRanking, data.id);

	//if id isn't found
	if (index == -1 || rankingIndex == -1){
		console.log(this.id + ": id not found");
		return;	
	}

	players.splice(index,1);
	playersRanking.splice(rankingIndex,1);

	updatePlayersRanking();
}

//chat message to client
function onChatMessageToClient(data){
	var chatOutput = document.getElementById("chat-output");
	chatOutput.innerHTML = (chatOutput.innerHTML + "<br/>" + data);
	chatOutput.scrollTop = chatOutput.scrollHeight;
}

//projectile to client
function onProjectileToClient(data){
	var newProjectile = new Projectile(data.x, data.y, data.id, data.playerId);
	projectiles.push(newProjectile);
}

//projectile position to client
function onProjectilePositionToClient(data){
	var index = searchIndexById(projectiles , data.id);
	try{
		projectiles[index].x=data.x;
		projectiles[index].y=data.y;
	}catch(e){console.log(e)}
}

//projectile remove to client
function onProjectileRemoveToClient(data){
	var index = searchIndexById(projectiles, data);

	//if id isn't found
	if (index == -1){
		console.log(this.id + ": id not found");
		return;
	}

	projectiles.splice(index,1);
}

//score update to client
function onNewScoreToClient(data){
	var index = searchIndexById(playersRanking, data.id);

	//if id isn't found
	if (index == -1){
		console.log(this.id + ": id not found");
		return;
	}

	//set new score
	playersRanking[index].score = data.score;

	updatePlayersRanking();
}

/***SOCKET EVENT HANDLERS - HELPER FUNCTIONS***/

//returns index by id
function searchIndexById(obj, id){
	for (var i = 0; i < obj.length; i++){
		if (obj[i].id == id){
			return i;
		}	
	}
	return -1;
}

//displays players ranking
function updatePlayersRanking(){
	//simple sort
	for(var i = 0; i < playersRanking.length - 1; i++){
		var maxIndex = i;
		for(var j = i + 1; j < playersRanking.length; j++){
			if(playersRanking[j].score > playersRanking[maxIndex].score){
				maxIndex = j;
			}
		}
		var temp = playersRanking[i];
		playersRanking[i] = playersRanking[maxIndex];
		playersRanking[maxIndex] = temp;
	}

	var playersContainer = document.getElementById("playersList-content");
	playersContainer.innerHTML = "";
	for (var i = 0; i < players.length; i++){
		playersContainer.innerHTML = (playersContainer.innerHTML + playersRanking[i].score + " " + playersRanking[i].username + "<br>");
	}
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
		//keep game state out of animation loop
		setInterval(localPlayerMovement, 10);
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
