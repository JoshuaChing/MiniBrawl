var Player = function(startUsername,startX,startY,initID){

	var username = startUsername;
	var x = startX;
	var y = startY;
	var id = initID;
	var velocityX = 0;
	var velocityY = 0;
	var speed = 3;
	var jumping = false;

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

	function getVelocityX(){
		return velocityX;
	}

	function setVelocityX(newVelocityX){
		velocityX = newVelocityX;
	}

	function getVelocityY(){
		return velocityY;
	}

	function setVelocityY(newVelocityY){
		velocityY = newVelocityY;
	}

	function getSpeed(){
		return speed;
	}

	function setSpeed(newSpeed){
		speed = newSpeed;
	}

	function getJumping(){
		return jumping;
	}

	function setJumping(state){
		jumping = state;
	}

	return{
		getUsername : getUsername,
		setUsername : setUsername,
		getX : getX,
		setX : setX,
		getY : getY,
		setY : setY,
		getId : getId,
		setId : setId,
		getVelocityX : getVelocityX,
		setVelocityX : setVelocityX,
		getVelocityY : getVelocityY,
		setVelocityY : setVelocityY,
		getSpeed : getSpeed,
		setSpeed : setSpeed,
		getJumping : getJumping,
		setJumping : setJumping
	}

};

exports.Player = Player;
