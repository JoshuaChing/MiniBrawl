var Projectile = function(startX, startY, startVelX, startVelY, initId, initPlayerId){

	var x = startX;
	var y = startY;
	var velX = startVelX;
	var velY = startVelY;
	var id = initId;
	var playerId = initPlayerId;

	//getters and setters
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

	function getVelocityX(){
		return velX;
	}

	function setVelocityX(newVelX){
		velX = newVelX;
	}

	function getVelocityY(){
		return velY;
	}

	function setVelocityY(newVelY){
		velY = newVelY;
	}

	function getId(){
		return id;
	}

	function setId(newId){
		id = newId;
	}

	function getPlayerId(){
		return playerId;
	}

	function setPlayerId(newPlayerId){
		playerId = newPlayerId;
	}

	return{
		getX : getX,
		setX : setX,
		getY : getY,
		setY : setY,
		getVelocityX : getVelocityX,
		setVelocityX : setVelocityX,
		getVelocityY : getVelocityY,
		setVelocityY : setVelocityY,
		getId : getId,
		setId : setId,
		getPlayerId : getPlayerId,
		setPlayerId : setPlayerId
	}

};

exports.Projectile = Projectile;
