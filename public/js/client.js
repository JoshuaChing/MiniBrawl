var socket = io.connect(window.location.hostname);

socket.on("connect",onClientConnect);

//function called when client connects to server
function onClientConnect(){
	console.log("connected to server successfully");
}
