//set up server and socket.io
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
});

//listen for web clients
server.listen(port, function(){
        console.log("listening on :"+port);
});

/*GAME VARIABLES*/
var players;

/*GAME INITIALISATION*/
function init(){
	players = [];
	//called for every new socket connection
	io.sockets.on("connection", function(socket){
		onClientConnect(socket);
	});
}

/*GAME EVENTS HANDLERS*/
//function called with client connects to server
function onClientConnect(socket){
	console.log(socket.id + " has connected");
}

/*RUN THE GAME*/
init();
