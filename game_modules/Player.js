var Player = function(startUsername,startCharacter,startX,startY,initID,startWidth,startHeight){

	var username = startUsername;
	var x = startX;
	var y = startY;
	var id = initID;
	var velocityX = 0;
	var velocityY = 0;
	var speed = 4;
	var jumping = false;
	var jumpingClicked = false;
	var grounded = false;
	var maxHealth = 30;
	var health = maxHealth;
	var score = 0;

	//	- 	- sprite variables
	var character = startCharacter;
	var direction = "R";
	var frame = 1;
	var maxFrame = 1;
	var action = "S";
	var width = startWidth;
	var height = startHeight;

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

	function getJumpingClicked(){
		return jumpingClicked;
	}

	function setJumpingClicked(state){
		jumpingClicked = state;
	}

	function getGrounded(){
		return grounded;
	}

	function setGrounded(state){
		grounded = state;
	}

	function getMaxHealth(){
		return maxHealth;
	}

	function setMaxHealth(newMaxHealth){
		maxHealth = newMaxHealth;
	}

	function getHealth(){
		return health;
	}

	function setHealth(newHealth){
		health = newHealth;
	}

	function getScore(){
		return score;
	}

	function setScore(newScore){
		score = newScore;
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

	function getWidth(){
		return width;
	}

	function setWidth(w){
		width = w;
	}

	function getHeight(){
		return height;
	}

	function setHeight(h){
		height = h;
	}

	//helper functions
	function addScore(isAdd, diff){
		if(isAdd){
			//add score
			score+=diff;
		}else{
			//subtract score
			if(score - diff <= 0){
				score=0;
			}else{
				score-=diff;
			}
		}
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
		getJumpingClicked : getJumpingClicked,
		setJumpingClicked : setJumpingClicked,
		getGrounded : getGrounded,
		setGrounded : setGrounded,
		getMaxHealth : getMaxHealth,
		setMaxHealth : setMaxHealth,
		getHealth : getHealth,
		setHealth : setHealth,
		getScore : getScore,
		setScore : setScore,
		getCharacter : getCharacter,
		setCharacter : setCharacter,
		getDirection : getDirection,
		setDirection : setDirection,
		getFrame : getFrame,
		setFrame : setFrame,
		getMaxFrame : getMaxFrame,
		setMaxFrame : setMaxFrame,
		getAction : getAction,
		setAction : setAction,
		getWidth : getWidth,
		setWidth : setWidth,
		getHeight : getHeight,
		setHeight : getHeight,
		addScore : addScore,
	}

};

exports.Player = Player;
