
/*
	Player(string account, [object properties])
		.account	returns string
	
	Requires:
		applyProperties.js
*/

Player = function(account, properties) {
	this.account = account;
	
	applyProperties(this, properties);
	
	//Support for PlayerGroup
	if (Player.all.add) Player.all.add(this);
	else Player.all.push(this);
};

Player.all = [];
