
/**********************************
**	Constructor
***********************************/

Core.Pages.Portal.Chat = function(portal) {
	
	this.portal = portal;
	this.pages = portal.pages;
	this.core = portal.core;
	this.nova = portal.nova;
	
	this.lastWhisper = null;
	
	this.page = $('<div></div>').addClass('Chat').load(
		'src/Core/Pages/Portal/ChatTemplate.html',
		this.load.bind(this)
	);
};

/**********************************
**	Append Chat
***********************************/

//Adds a message to the chat log
Core.Pages.Portal.Chat.prototype.appendChat = function(what) {
	
	var atBottom = this.log[0].scrollTop == (this.log[0].scrollHeight - this.log[0].offsetHeight);
	
	this.log.append(what);
	
	if (atBottom)
		this.log.scrollTop(this.log[0].scrollHeight);
};

/**********************************
**	Commands
***********************************/

//Command switcher
Core.Pages.Portal.Chat.prototype.processCommand = function(command, args) {
	switch (command.toLowerCase()) {
		
		/**********************************
		**	Communication
		***********************************/
		
		case "w": case "whisper":
			this.nova.whisper(args.shift(), args.join(" "));
			break;
		case "r":
			this.nova.whisper(this.lastWhisper, args.join(" "));
			break;
		
		/**********************************
		**	Groups
		***********************************/
		
		case "j": case "join":
			this.nova.join(args.shift(), args.join(" "));
			break;
		
		/**********************************
		**	Friends
		***********************************/
		
		case "f": case "friends":
			command = args.shift();
			
			switch (command) {
				case "l": case "list":
					this.nova.friendList("command");
					break;
				case "a": case "add":
					this.nova.friendAdd(args[0]);
					break;
				case "r": case "remove":
					this.nova.friendRemove(args[0]);
					break;
				default:
					this.appendChat($("<div></div>")
						.addClass("error")
						.text("Unknown friend command."));
					break;
			}
			
			break;
		
		/**********************************
		**	Misc
		***********************************/
		
		case "time":
			var d = new Date();
			
			this.appendChat($("<div></div>")
				.addClass("server")
				.text("UTC: " + d.toLocaleString("en-US", {
					weekday: "short",
					day: "2-digit",
					year: "numeric",
					month: "2-digit",
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit",
					timeZone: "UTC"
				})));
			this.appendChat($("<div></div>")
				.addClass("server")
				.text(/(\w*)-/.exec(d.toString())[1] + ": " + d.toLocaleString("en-US", {
					weekday: "short",
					day: "2-digit",
					year: "numeric",
					month: "2-digit",
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit"
				})));
			break;
		
		case "main":
			this.portal.fadeOut();
			this.pages.home.fadeIn();
			break;
		
		case "logout":
			this.nova.logout();
			this.portal.fadeOut();
			this.pages.home.fadeIn();
			break;
		
		case "?": case "help":
			this.appendChat($("<div></div>")
				.addClass("server")
				.text("Messaging Commands"));
			this.appendChat($("<div></div>")
				.addClass("server indent")
				.text("Whisper: /w <account> <message>"));
			this.appendChat($("<div></div>")
				.addClass("server indent")
				.text("Reply: /r"));
			this.appendChat($("<div></div>")
				.addClass("server indent")
				.text("Join: /j <some channel>"));
			
			this.appendChat($("<div></div>")
				.addClass("server")
				.text("Friend Commands"));
			this.appendChat($("<div></div>")
				.addClass("server indent")
				.text("Friends List: /f l"));
			this.appendChat($("<div></div>")
				.addClass("server indent")
				.text("Friends Add: /f a <account>"));
			this.appendChat($("<div></div>")
				.addClass("server indent")
				.text("Friends Remove: /f r <account>"));
			
			this.appendChat($("<div></div>")
				.addClass("server")
				.text("Miscellaneous Commands"));
			this.appendChat($("<div></div>")
				.addClass("server indent")
				.text("Time: /t"));
			this.appendChat($("<div></div>")
				.addClass("server indent")
				.text("Main menu: /main"));
			break;
			this.appendChat($("<div></div>")
				.addClass("server indent")
				.text("Logout: /logout"));
			break;
		default:
			this.appendChat($("<div></div>")
				.addClass("error")
				.text("Unknown command."));
			break;
	}
}

//Either sends the message as a chat broadcast or runs it through a command switcher
Core.Pages.Portal.Chat.prototype.processInput = function(message) {
	if (message.substr(0, 1) == "/") {
		message = message.substr(1);
		var command = message.split(" ");
		
		this.processCommand(command.shift(), command);
	} else this.nova.broadcast({sid: 'chat', message: message});
};

/**********************************
**	UI
***********************************/

Core.Pages.Portal.Chat.prototype.keydown = function(e) {
	
	var input = this.input.val();
	
	if (e.which == 13 && input != "") {
		this.processInput(input);
		this.input.val('');
	} else if (e.which == 32 && input.substr(0, 2) == "/r" && this.lastWhisper != null) {
		this.input.val('/w ' + this.lastWhisper);
		if (input.length != 2) {
			this.input.val(this.input.val() + " " + input.substr(3, input.length));
			e.preventDefault();
		}
	}
	
};

/**********************************
**	Communication
***********************************/

Core.Pages.Portal.Chat.prototype.onFriendList = function(e2, e) {
	
	if (e.data.tag == "command") {
		if (e.list.length)
			this.appendChat($("<div></div>")
				.addClass("server")
				.text("Your friends are:"));
		else
			this.appendChat($("<div></div>")
				.addClass("error")
				.text("You have no friends."));
		
		for (var i = 0; i < e.list.length; i++)
			if (e.list[i].online && e.list[i].mutual)
				this.appendChat($("<div></div>")
					.addClass("server indent")
					.append($("<span></span>")
						.addClass("account")
						.text(e.list[i].account))
					.append($("<span></span>")
						.text(", online in group "))
					.append($("<span></span>")
						.addClass("group")
						.text(e.list[i].location))
					.append($("<span></span>")
						.text(".")));
			else
				this.appendChat($("<div></div>")
					.addClass("server indent" + (e.list[i].online ? "" : " offline"))
					.append($("<span></span>")
						.addClass("account")
						.text(e.list[i].account))
					.append($("<span></span>")
						.text(", " + (e.list[i].online ? "online." : "offline."))));
	}
};

Core.Pages.Portal.Chat.prototype.onFriendAdd = function(e2, e) {
	this.appendChat($("<div></div>")
		.addClass("server")
		.append($("<span></span>")
			.text("Added "))
		.append($("<span></span>")
			.addClass("account")
			.text(e.account))
		.append($("<span></span>")
			.text(" to your friends list.")));
};

Core.Pages.Portal.Chat.prototype.onFriendAddFail = function(e2, e) {
	this.appendChat($("<div></div>")
		.addClass("error")
		.text(e.reason));
};


Core.Pages.Portal.Chat.prototype.onFriendRemove = function(e2, e) {
	this.appendChat($("<div></div>")
		.addClass("server")
		.append($("<span></span>")
			.text("Removed "))
		.append($("<span></span>")
			.addClass("account")
			.text(e.account))
		.append($("<span></span>")
			.text(" from your friends list.")));
};

Core.Pages.Portal.Chat.prototype.onFriendRemoveFail = function(e2, e) {
	this.appendChat($("<div></div>")
		.addClass("error")
		.text(e.reason));
};


/*$(this.nova).on('onFriendList.Portal', this.onFriendList.bind(this));
	$(this.nova).on('onFriendAdd.Portal', this.onFriendAdd.bind(this));
	$(this.nova).on('onFriendAddFail.Portal', this.onFriendAddFail.bind(this));
	$(this.nova).on('onFriendRemove.Portal', this.onFriendRemove.bind(this));
	$(this.nova).on('onFriendRemoveFail.Portal', this.onFriendRemoveFail.bind(this));*/

Core.Pages.Portal.Chat.prototype.onBroadcast = function(e2, e) {
	
	if (e.sid == "chat") {
		this.appendChat($('<div></div>')
			.addClass("chat")
			.append($('<span></span>')
				.addClass("account")
				.text(e.account))
			.append($('<span></span>').text(": "))
			.append($('<span></span>')
				.addClass("message")
				.text(e.message)));
	}
	
};

Core.Pages.Portal.Chat.prototype.onWhisper = function(e2, e) {
	
	this.lastWhisper = e.account;
	
	this.appendChat($('<div></div>')
		.addClass("whisper")
		.append($('<span></span>')
			.text('From '))
		.append($('<span></span>')
			.text(e.account)
			.addClass("account"))
		.append($('<span></span>')
			.text(': '))
		.append($('<span></span>')
			.text(e.message)
			.addClass("message")));
	
};

Core.Pages.Portal.Chat.prototype.onWhisperEcho = function(e2, e) {
	
	this.appendChat($('<div></div>')
		.addClass("whisper")
		.append($('<span></span>')
			.text('To '))
		.append($('<span></span>')
			.text(e.account)
			.addClass("account"))
		.append($('<span></span>')
			.text(': '))
		.append($('<span></span>')
			.text(e.message)
			.addClass("message")));
	
};

Core.Pages.Portal.Chat.prototype.onWhisperFail = function(e2, e) {
	
	this.appendChat($('<div></div>')
		.addClass("error")
		.text("That user is not logged on."));
		
};

Core.Pages.Portal.Chat.prototype.onGroup = function(e2, e) {
	
	this.appendChat($('<div></div>')
			.addClass("selfJoin")
			.append($('<span></span>')
				.text("-- Joined group "))
			.append($('<span></span>')
				.text(e.group)
				.addClass("group"))
			.append($('<span></span>')
				.text(" --")));
	
};

Core.Pages.Portal.Chat.prototype.onNoGroup = function(e2, e) {
	
	this.appendChat($('<div></div>')
			.addClass("selfJoin")
			.append($('<span></span>')
				.text("-- Entered the void --")));
	
};

Core.Pages.Portal.Chat.prototype.onJoin = function(e2, e) {
	
	
	for (var i = 0; i < e.accounts.length; i ++) {
		
		this.appendChat($('<div></div>')
			.addClass("join")
			.append($('<span></span>')
				.text(e.accounts[i].account)
				.addClass("account"))
			.append($('<span></span>')
				.text(" has joined the group.")));
		
	}
	
};

Core.Pages.Portal.Chat.prototype.onLeave = function(e2, e) {
	
	this.appendChat($('<div></div>')
		.addClass("join")
		.append($('<span></span>')
			.text(e.account)
			.addClass("account"))
		.append($('<span></span>')
			.text(" has left the group.")));
	
};

/**********************************
**	Initializer
***********************************/

Core.Pages.Portal.Chat.prototype.bindGlobals = function() {
	
	//Global hooks
	
};

Core.Pages.Portal.Chat.prototype.unbindGlobals = function() {
	
	$(window).off('.Portal');
	//$(this.nova).off('.Portal');
	
};

Core.Pages.Portal.Chat.prototype.load = function() {
	
	$(this.page).find('*').each(variablize.bind(this));
	
	//Communication hooks
	$(this.nova).on('onGroup.Portal', this.onGroup.bind(this));
	$(this.nova).on('onNoGroup.Portal', this.onNoGroup.bind(this));
	$(this.nova).on('onJoin.Portal', this.onJoin.bind(this));
	$(this.nova).on('onLeave.Portal', this.onLeave.bind(this));
	
	$(this.nova).on('onWhisper.Portal', this.onWhisper.bind(this));
	$(this.nova).on('onWhisperEcho.Portal', this.onWhisperEcho.bind(this));
	$(this.nova).on('onWhisperFail.Portal', this.onWhisperFail.bind(this));
	
	$(this.nova).on('onFriendList.Portal', this.onFriendList.bind(this));
	$(this.nova).on('onFriendAdd.Portal', this.onFriendAdd.bind(this));
	$(this.nova).on('onFriendAddFail.Portal', this.onFriendAddFail.bind(this));
	$(this.nova).on('onFriendRemove.Portal', this.onFriendRemove.bind(this));
	$(this.nova).on('onFriendRemoveFail.Portal', this.onFriendRemoveFail.bind(this));
	
	$(this.nova).on('onBroadcast.Portal', this.onBroadcast.bind(this));
	
	//Local hooks
	$(this.input).on('keydown', this.keydown.bind(this));
	
};
