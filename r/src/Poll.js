
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

function Poll(vid, callback, players) {
	if (typeof vid == "undefined") throw "No vid!"
	if (typeof players == "undefined") players = Poll.players;
	
	EventTarget.apply(this, [])
	
	this.pollID = Poll.id++;
	
	this.vid = vid;
	this.players = players;
	this.data = null;
	this.callback = callback;
	
	this.localVote = null;
	this.options = [];
	this.votes = [];
	
	this.ended = "idle";
	
	polls[this.pollID] = this;
};

Poll.players = _initData.players;
Poll.id = 0;
Poll.prototype = Object.create(EventTarget.prototype);

Poll.prototype.start = function(data, callback, players, timeout) {
	if (typeof timeout == "undefined") timeout = 2000;
	
	this.data = data;
	if (callback) this.callback = callback;
	if (players) this.players = players;
	
	this.options = [];
	this.votes = [];
	
	this.newVote(data, _initData.localPlayer, true);
	
	this.status = "ongoing";
	
	polls[this.pollID] = this;
	
	postMessage({
		_func: "broadcast", 
		sid: "vote",
		pollID: this.pollID,
		data: data
	});
	
	setTimeout(this.timeout.bind(this), timeout);
};

Poll.prototype.timeout = function() {
	this.status = "ended";
	
	this.tally();
}

Poll.prototype.newVote = function(data, account, local) {
	var vote = new Poll.Vote(this, data, account);
	this.votes.push(vote);
	
	if (local) this.localVote = vote;
	
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
	if (poll) poll.newVote(e.data, e.account);
});

Poll.Option = function(poll, tally) {
	this.poll = poll;
	this.data = tally.data;
	this.stringified = tally.stringified;
	
	this.votes = [tally];
};

Poll.Option.prototype.try = function(tally) {
	if (this.stringified == tally.stringified) {
		this.votes.push(tally);
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
	Poll.players.splice(index, 1);
});
