
/**********************************
**	Constructor
***********************************/

Core.Pages.Portal.Lobby = function(portal) {
	
	this.portal = portal;
	this.pages = portal.pages;
	this.core = portal.core;
	this.nova = portal.nova;
	this.host = portal.core.host;
	
	this.hosts = [];
	this.lobbies = [];
	this.lobby = null;
	
	this.section = $('<div></div>').addClass('section').load(
		'src/Core/Pages/Portal/LobbyTemplate.html',
		this.load.bind(this)
	);
	
};

/**********************************
**	UI
***********************************/

Core.Pages.Portal.Lobby.prototype.joinLobby = function(lobby) {
	this.lobby = this.lobbies[lobby];
	this.host.lobbyName = this.lobby.name;
	
	//If we're already connected to the host, just join lobby
	if (this.host.socket && this.host.socket.readyState == 1 && this.host.account == this.lobby.host)
		this.host.lobby(this.lobby.name);
	
	//Else bridge it
	else
		this.nova.bridge(this.lobby.host);
}

Core.Pages.Portal.Lobby.prototype.selectLobby = function(e) {
	this.section.lobbyJoinText.val($(e.delegateTarget).find("td:nth-child(2)").text());
};

Core.Pages.Portal.Lobby.prototype.joinOnDblClick = function(e) {
	this.joinLobby($(e.delegateTarget).find("td:nth-child(2)").text());
};

Core.Pages.Portal.Lobby.prototype.joinText = function(e) {
	if (e.which == 13)
		this.joinClick();
};

Core.Pages.Portal.Lobby.prototype.joinClick = function(e) {
	this.joinLobby(this.section.lobbyJoinText.val());
	
	this.section.lobbyJoinText.val("");
};

Core.Pages.Portal.Lobby.prototype.createText = function(e) {
	if (e.which == 13)
		this.createClick();
};

Core.Pages.Portal.Lobby.prototype.createClick = function(e) {
	this.nova.reserve($(this.section.lobbyCurrentHost).text(), $(this.section.lobbyCreateText).val());
	$(this.section.lobbyCreateText).val("");
};

//Can still paste return lines and other html, but w/e
Core.Pages.Portal.Lobby.prototype.hostTextDown = function(e) {
	if (e.which == 13)
		return false;
};

//Not working... (see below)
Core.Pages.Portal.Lobby.prototype.selectHost = function(e) {
	
};

Core.Pages.Portal.Lobby.prototype.hostTextUp = function(e) {
	var text = $(e.target).text().toLowerCase().replace(/\s/g, "");
	var validNames = new RegExp('.*' + text.split('').join('.*') + '.*');
	
	this.section.lobbySuggestions.empty();
	
	var count = 0;
	for (var i = 0; i < this.hosts.length && count < 10; i++)
		if (validNames.test(this.hosts[i].toLowerCase())) {
			this.section.lobbySuggestions
				.append($("<span></span>")
					.text(this.hosts[i])
					//TODO: add this functionality, requires us to change the css show/hide into scripted so we have time to fire click (i.e., collapse instead of disappear)
					//.click(this.selectHost.bind(this))
				);
			count++;
		}
};

Core.Pages.Portal.Lobby.prototype.hostTextBlur = function(e) {
	var target = $(e.target);
	if (target.text() == "")
		target.text("none");
	else if (target.text() != target.html())
		target.text(target.text());
};

/**********************************
**	Communication
***********************************/

Core.Pages.Portal.Lobby.prototype.tryImage = function(preview, size, terminateOn) {
	var order = ["small", "medium", "large"];
	
	if (typeof preview == "string")
		return preview;
	else if (typeof preview != "undefined") {
		var index = order.indexOf(size);
		
		if (typeof preview[size] == "undefined") {
			if (typeof terminateOn == "undefined") terminateOn = index;
			else if (terminateOn == index) return "r/img/lobby/unknown" + size + ".png";
			
			if (index < 2) index++;
			else index = 0;
			
			return this.tryImage(preview, order[index], terminateOn);
		} else
			return preview[size];			
	} else return "r/img/lobby/unknown" + size + ".png";
};

Core.Pages.Portal.Lobby.prototype.appendLobby = function(lobby, append) {
	if (typeof append == "undefined") append = true;
	
	var preview = this.tryImage(lobby.preview, "small");
	
	var bTag = [];
	if (typeof lobby.protocol != "undefined") bTag.push("Protocol: " + lobby.protocol);
	if (typeof lobby.date != "undefined") bTag.push("Date: " + lobby.date);
	if (typeof lobby.version != "undefined") bTag.push("Version: " + lobby.version);
	if (typeof lobby.host != "undefined") bTag.push("Host: " + lobby.host);
	
	var card = $('<table>')
		.addClass("lobby")
		.attr("data-lobby", lobby.name)
		.append($("<tbody>")
			.append($("<tr>")
				.append($("<td>")
					.attr("rowspan", "2")
					.append($("<img>").attr("src", preview)))
				.append($("<td>").text(lobby.name)))
			.append($("<tr>")
				.append($("<td>").text((lobby.protocol ? lobby.protocol + " • " : "") + lobby.host))
				.attr("title", bTag.join(", "))))
		.on("click", this.selectLobby.bind(this))
		.on("dblclick", this.joinOnDblClick.bind(this));
	
	if (append) card.appendTo(this.section.lobbyList);
	else card.prependTo(this.section.lobbyList);
};

Core.Pages.Portal.Lobby.prototype.createLobbyCard = function(picture, title, host, uptime) {
	
	return $("<div></div>").addClass('card')
		.append($('<img>').src(picture))
		.append($('<div></div>').addClass('title').text(title))
		.append($('<div></div>').addClass('details')
			.append($('<span></span>').addClass('host').text(host))
			.append($('<span></span>').addClass('uptime').text(uptime)));
	
};

Core.Pages.Portal.Lobby.prototype.onLobbyList = function(e2, e) {
	
	$(this.section.lobbyList).empty();
	
	this.lobbies = e.list;
	
	for (var i = 0; i < e.list.length; i++) {
		this.appendLobby(e.list[i]);
		this.lobbies[e.list[i].name] = e.list[i];
	}
	
};

Core.Pages.Portal.Lobby.prototype.onReserve = function(e2, e) {
	var lobby = {
		host: e.host,
		name: e.name,
		listed: new Date().getTime(),
		protocol: e.protocol,
		date: e.date,
		version: e.version,
		preview: e.preview
	};
	
	this.lobbies.push(lobby);
	this.lobbies[lobby.name] = lobby;
	
	this.appendLobby(lobby, false);
};

Core.Pages.Portal.Lobby.prototype.onReserveFail = function(e2, e) {
	this.portal.chat.appendChat($("<div></div>")
		.addClass("error")
		.text(e.reason));
};

Core.Pages.Portal.Lobby.prototype.onUpdate = function(e2, e) {
	var lobby = this.lobbies[e.name]
	if (lobby) {
		lobby.listed = new Date().getTime();
		lobby.protocol = e.protocol;
		lobby.date = e.date;
		lobby.version = e.version;
		lobby.preview = e.preview;
		
	} else this.onReserve(null, e);
	
	var bTag = [];
	if (typeof lobby.protocol != "undefined") bTag.push("Protocol: " + lobby.protocol);
	if (typeof lobby.date != "undefined") bTag.push("Date: " + lobby.date);
	if (typeof lobby.version != "undefined") bTag.push("Version: " + lobby.version);
	if (typeof lobby.host != "undefined") bTag.push("Host: " + lobby.host);
	
	this.section.lobbyList.children().each(function(i, v) {
		var card = $(v);
		if (card.attr("data-lobby") == lobby.name) {
			card.find("img").attr("src", this.tryImage(lobby.preview, "small"));
			
			card.find("tr").eq(1)
				.attr("title", bTag.join(", "))
				.find("td")
					.text((lobby.protocol ? lobby.protocol + " • " : "") + lobby.host);
		}
	}.bind(this));
};

Core.Pages.Portal.Lobby.prototype.onUnreserve = function(e2, e) {
	this.section.lobbyList.children().each(function(i, v) {
		if ($(v).attr("data-lobby") == e.name)
			v.remove();
	});
	
	var lobby = this.lobbies[e.name];
	
	this.lobbies.splice(this.lobbies.indexOf(lobby), 1);
	delete this.lobbies[e.name];
};

Core.Pages.Portal.Lobby.prototype.onHostList = function(e2, e) {
	this.hosts = e.list;
	
	if (this.section.lobbyCurrentHost.text() == "none" && e.list.length > 0) {
		this.section.lobbyCurrentHost.removeClass("invalid");
		this.section.lobbyCurrentHost.text(e.list[0]);
	}
};

Core.Pages.Portal.Lobby.prototype.onBridgeFail = function(e2, e) {
	console.log("test");
	this.portal.chat.appendChat($("<div></div>")
		.addClass("error")
		.text(e.reason));
};

Core.Pages.Portal.Lobby.prototype.onJoin = function(e2, e) {
	this.host.gameName = e.lobby;
	
	this.nova.noGroup();
	
	this.portal.fadeOut();
	this.pages.game.fadeIn();
};

/**********************************
**	Initializer
***********************************/

Core.Pages.Portal.Lobby.prototype.bindGlobals = function() {
	$(this.host).on('onJoin.Lobby', this.onJoin.bind(this));
};

Core.Pages.Portal.Lobby.prototype.unbindGlobals = function() {
	$(window).off('.Lobby');
	$(this.nova).off('.Lobby');
	$(this.host).off('.Lobby');
};

Core.Pages.Portal.Lobby.prototype.load = function() {
	
	this.section.find('*').each(variablize.bind(this.section));
	
	/**********************************
	**	Local hooks
	***********************************/
	
	//Joining lobbies
	$(this.section.lobbyJoinText).on("keydown", this.joinText.bind(this));
	$(this.section.lobbyJoinButton).on("click", this.joinClick.bind(this));
	
	//Creating lobbies
	$(this.section.lobbyCreateText).on("keydown", this.createText.bind(this));
	$(this.section.lobbyCreateButton).on("click", this.createClick.bind(this));
	
	$(this.section.lobbyCurrentHost).on("keydown", this.hostTextDown.bind(this));
	$(this.section.lobbyCurrentHost).on("keyup", this.hostTextUp.bind(this));
	$(this.section.lobbyCurrentHost).on("blur", this.hostTextBlur.bind(this));
	
	/**********************************
	**	Communication hooks
	***********************************/
	
	//Lobby list management
	$(this.nova).on('onLobbyList', this.onLobbyList.bind(this));
	$(this.nova).on('onReserve', this.onReserve.bind(this));
	$(this.nova).on('onReserveFail', this.onReserveFail.bind(this));
	$(this.nova).on('onUpdate', this.onUpdate.bind(this));
	$(this.nova).on('onUnreserve', this.onUnreserve.bind(this));
	
	//Hosting
	$(this.nova).on('onBridgeFail', this.onBridgeFail.bind(this));
	
	//Misc
	$(this.nova).on('onHostList', this.onHostList.bind(this));
	
};
