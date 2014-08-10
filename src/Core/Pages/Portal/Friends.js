
/**********************************
**	Constructor
***********************************/

Core.Pages.Portal.Friends = function(portal) {
	
	this.portal = portal;
	this.pages = portal.pages;
	this.core = portal.core;
	this.nova = portal.nova;
	
	this.list = $('<div></div>').addClass('list');
	
	$(document).ready(this.load.bind(this));
	
};

/**********************************
**	UI
***********************************/

Core.Pages.Portal.Friends.prototype.whisperUser = function(e) {
	this.portal.chat.input.val("/w " + $(e.target).text() + " " + this.portal.chat.input.val()).focus();
};

/**********************************
**	Communication
***********************************/

Core.Pages.Portal.Friends.prototype.appendFriend = function(user) {
	if (user.avatar == "") user.avatar = "r/img/avatar/blank.png";
	
	var userDiv = $('<div></div>')
		.addClass("user")
		.addClass(user.online ? "online" : "offline")
		.append($("<img>")
			.addClass("avatar")
			.attr("src", user.avatar))
		.append($("<span></span>")
			.addClass("label")
			.text(user.account))
		.appendTo(this.list);
	
	if (user.online) userDiv.on("click", this.whisperUser.bind(this));
	if (user.location) userDiv.attr("title", "In group " + user.location + ".");
};

Core.Pages.Portal.Friends.prototype.onFriendList = function(e2, e) {
	
	this.list.empty();
	
	for (var i = 0; i < e.list.length; i++)
		this.appendFriend(e.list[i]);
	
};

/**********************************
**	Initializer
***********************************/


Core.Pages.Portal.Friends.prototype.bindGlobals = function() {
	
	//Global hooks
	
	
};

Core.Pages.Portal.Friends.prototype.unbindGlobals = function() {
	
	$(window).off('.PGroup');
	//$(this.nova).off('.PGroup');
	
};

Core.Pages.Portal.Friends.prototype.load = function() {
	
	//Communication hooks
	$(this.nova).on('onFriendList.PGroup', this.onFriendList.bind(this));
	
};
