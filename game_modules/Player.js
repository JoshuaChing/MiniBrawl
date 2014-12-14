var Player = function(startUsername,startX,startY,initID){

	var username = startUsername;
	var x = startX;
	var y = startY;
	var id = initID;

	//getters and setters
	function getUsername(){
		return username;
	}

	function setUsername(newUsername){
		username = newUsername;
	}

	function getX(){
		return x;
	}

	function setX(newX){
		x = newX;
	}

	function getY(){
		return y;
	}

	function setY(newY){
		y = newY;
	}

	function getId(){
		return id;
	}

	function setId(newId){
		id = newId;
	}

	return{
		getUsername : getUsername,
		setUsername : setUsername,
		getX : getX,
		setX : setX,
		getY : getY,
		setY : setY,
		getId : getId,
		setId : setId
	}

};

exports.Player = Player;
