
/*
	PlayerGroup([array players], [object properties])
		.account	returns string
	
	Requires:
		applyProperties.js
*/

PlayerGroup = function(players, properties) {
	if (typeof players == "object" && players instanceof Array)
		for (var i = 0; i < players.length; i++) {
			this.push(players[i]);
			this[player[i].account] = players[i];
		}
	
	applyProperties(this, properties);
};

PlayerGroup.prototype = Object.create(Array.prototype);

PlayerGroup.fromGroups = function(groups, properties) {
	var players = [];
	
	for (var i = 0; i < groups.length; i++)
		for (var n = 0; n < groups[i].length; n++)
			players.push(groups[i][n]);
	
	return new PlayerGroup(players, properties);
};

PlayerGroup.prototype.add = function(player) {
	this.push(player);
	this[player.account] = player;
	
	return this.length;
};

PlayerGroup.prototype.has = function(player) {
	if (this[player.account] == player) return true;
	
	for (var i = 0; i < this.length; i++)
		if (this[i].account == player) return true;
	
	return false;
};

//Steal the Player all and make it a PlayerGroup instead of array
Player.all = new PlayerGroup();

