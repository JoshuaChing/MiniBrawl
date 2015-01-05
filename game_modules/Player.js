var Player = function(startUsername,startX,startY,initID){

	var username = startUsername;
	var x = startX;
	var y = startY;
	var id = initID;
	var velocityX = 0;
	var velocityY = 0;
	var speed = 3;
	var jumping = false;

	//	- 	- sprite variables
	var character = "BlackNinja";
	var direction = "R";
	var frame = 1;
	var maxFrame = 1;
	var action = "S";

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

	// -	-	sprite variables
	function getCharacter(){
		return character;
	}

	function setCharacter(c){
		character = c;
	}

	function getDirection(){
		return direction;
	}

	function setDirection(d){
		direction = d;
	}

	function getFrame(){
		return frame;
	}

	function setFrame(f){
		frame = f;
	}

	function getMaxFrame(){
		return maxFrame;
	}

	function setMaxFrame(mf){
		maxFrame = mf;
	}

	function getAction(){
		return action;
	}

	function setAction(a){
		action = a;
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
		setJumping : setJumping,
		getCharacter : getCharacter,
		setCharacter : setCharacter,
		getDirection : getDirection,
		setDirection : setDirection,
		getFrame : getFrame,
		setFrame : setFrame,
		getMaxFrame : getMaxFrame,
		setMaxFrame : setMaxFrame,
		getAction : getAction,
		setAction : setAction
	}

};

exports.Player = Player;
