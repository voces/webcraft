
/*
	Description:
		Adds a new type, Poll, which allows syncing of data at unknown states. Useful for when players join in middle of the game.
	
	Requires:
		host.js
		
	Provides:
		type Poll(String vid)
		Object Polls
	
	Events:
		vote
		tally
	
	Example usage:
		var vote = new Vote("ready");
		vote.start(true);
		
		vote.on("tally", function(agreement) {
			if (agreement > .5)
				startGame();
		});
*/

var polls = {};

function Poll(vid, callback, players, timeoutPeriod) {
	if (typeof vid == "undefined") throw "No vid!"
	
	EventTarget.apply(this, [])
	
	this.pollID = Poll.id++;
	
	this.vid = vid;
	this.players = players || Poll.players;
	this.data = null;
	this.callback = callback;
	this.timeoutPeriod = timeoutPeriod || 2000;
	
	this.localVote = null;
	this.options = [];
	this.votes = [];
	
	this.status = "idle";
	
	polls[this.pollID] = this;
};

Poll.players = _initData.players;
Poll.id = 0;
Poll.prototype = Object.create(EventTarget.prototype);

Poll.prototype.start = function(data, callback, players) {
	
	this.data = data;
	if (callback) this.callback = callback;
	if (players) this.players = players;
	
	this.options = [];
	this.votes = [];
	
	this.status = "ongoing";
	
	//this.newVote(data, _initData.localPlayer, true);
	
	polls[this.pollID] = this;
	
	postMessage({
		_func: "broadcast", 
		sid: "vote",
		pollID: this.pollID,
		data: data
	});
	
	this.timeout = setTimeout(this.onTimeout.bind(this), this.timeoutPeriod);
};

Poll.prototype.onTimeout = function() {
	this.status = "ended";
	
	this.tally();
}

Poll.prototype.newVote = function(data, account) {
	
	//Means we didn't know a vote was going on, probably means we are new and this is a syncing poll
	if (this.status == "idle") {
		this.status = "ongoing";
		this.timeout = setTimeout(this.onTimeout.bind(this), this.timeoutPeriod);
	}
	
	var vote = new Poll.Vote(this, data, account);
	this.votes.push(vote);
	
	if (account == _initData.localPlayer) this.localVote = vote;
	
	var option = false;
	for (var i = 0; i < this.options.length; i++)
		if (option = this.options[i].try(vote))
			break;
	
	if (!option)
		this.options.push(new Poll.Option(this, vote));
	
	this.fire("vote", {
		account: account,
		vote: vote,
		option: option,
		poll: this,
		outof: this.players.length
	});
	
	this.tally();
}

Poll.prototype.tally = function() {
	if (this.votes.length != this.players.length && this.status != "ended") return;
	
	if (this.status == "idle") return;
	this.status = "idle";
	
	clearTimeout(this.timeout);
	
	var winCount = 0;
	var winner = null;
	for (var i = 0; i < this.options.length; i++)
		if (this.options[i].votes.length > winCount) {
			this.winCount = this.options[i].votes.length;
			this.winner = this.options[i];
		}
	
	if (typeof this.callback == "function")
		this.callback(this, this.winner);
	
	this.fire("tally", {poll: this, winner: this.winner});
}

host.on("onBroadcast", function(e) {
	if (e.sid != "vote") return;
	
	var poll = polls[e.pollID];
	
	console.log("vote", poll, e);
	
	if (poll) poll.newVote(e.data, e.account);
}.bind(this));

Poll.Option = function(poll, vote) {
	this.poll = poll;
	this.data = vote.data;
	this.stringified = vote.stringified;
	
	this.votes = [vote];
};

Poll.Option.prototype.try = function(vote) {
	if (this.stringified == vote.stringified) {
		this.votes.push(vote);
		return this;
	} else return false;
}

Poll.Vote = function(poll, data, account) {
	this.poll = poll;
	this.data = data;
	this.account = account;
	this.stringified = JSON.stringify(data);
};

host.on("onJoin", function(e) {
	Poll.players = Poll.players.concat(e.accounts);
});

host.on("onLeave", function(e) {
	var index = Poll.players.indexOf(e.account);
	if (index >= 0) Poll.players.splice(index, 1);
});
