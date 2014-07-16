
/**********************************
**	Constructor
***********************************/

Core.Pages.Portal.Lobby = function(portal) {
	
	this.portal = portal;
	this.pages = portal.pages;
	this.core = portal.core;
	this.nova = portal.nova;
	this.host = portal.core.host;
	
	this.hosts = null;
	this.lobbies = null;
	
	this.key = 0;
	
	this.section = $('<div></div>').addClass('section').load(
		'src/Core/Pages/Portal/LobbyTemplate.html',
		this.load.bind(this)
	);
	
};

/**********************************
**	UI
***********************************/

Core.Pages.Portal.Lobby.prototype.selectLobby = function(e) {
	this.section.lobbyJoinText.val($(e.delegateTarget).text());
};

Core.Pages.Portal.Lobby.prototype.joinLobby = function(e) {
	this.nova.lobby($(e.delegateTarget).text());
};

Core.Pages.Portal.Lobby.prototype.joinText = function(e) {
	if (e.which == 13)
		this.joinClick();
};

Core.Pages.Portal.Lobby.prototype.joinClick = function(e) {
	this.nova.lobby($(this.section.lobbyJoinText).val());
	$(this.section.lobbyJoinText).val("");
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

Core.Pages.Portal.Lobby.prototype.selectHost = function(e) {
	console.log(e);
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

Core.Pages.Portal.Lobby.prototype.appendLobby = function(lobby, append) {
	if (typeof append == "undefined") append = true;
	
	if (lobby.preview == "" || typeof lobby.preview == "undefined") lobby.preview = "blank.png";
	
	var card = $('<div></div>')
		.addClass("lobby")
		.append($("<img>")
			.addClass("preview")
			.attr("src", "images/avatars/" + lobby.preview))
		.append($("<span></span>")
			.addClass("label")
			.text(lobby.name))
		.on("click", this.selectLobby.bind(this))
		.on("dblclick", this.joinLobby.bind(this));
	
	if (append) card.appendTo(this.section.list);
	else card.prependTo(this.section.list);
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
	
	$(this.section.list).empty();
	
	this.lobbies = e.list;
	
	for (var i = 0; i < e.list.length; i++)
		this.appendLobby(e.list[i]);
	
};

Core.Pages.Portal.Lobby.prototype.onReserve = function(e2, e) {
	var lobby = {host: e.host, name: e.name, listed: new Date().getTime()};
	this.lobbies.push(lobby);
	
	this.appendLobby(lobby, false);
};

Core.Pages.Portal.Lobby.prototype.onUnreserve = function(e2, e) {
	this.section.list.children().each(function(i, v) {
		if ($(v).children().eq(1).text() == e.name)
			v.remove();
	});
};

Core.Pages.Portal.Lobby.prototype.onHostList = function(e2, e) {
	this.hosts = e.list;
	
	if (this.section.lobbyCurrentHost.text() == "none" && e.list.length > 0)
		this.section.lobbyCurrentHost.text(e.list[0]);
};

Core.Pages.Portal.Lobby.prototype.onLobby = function(e2, e) {
	this.key = e.key;
	
	this.host.connect(e.ip, e.port);
};

Core.Pages.Portal.Lobby.prototype.onOpen = function(e2, e) {
	this.host.sendKey(this.key);
};

Core.Pages.Portal.Lobby.prototype.onJoin = function(e2, e) {
	this.portal.fadeOut();
	this.pages.game.fadeIn();
};

/**********************************
**	Initializer
***********************************/

Core.Pages.Portal.Lobby.prototype.bindGlobals = function() {
	
};

Core.Pages.Portal.Lobby.prototype.unbindGlobals = function() {
	$(window).off('.Lobby');
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
	$(this.nova).on('onUnreserve', this.onUnreserve.bind(this));
	
	//Joining lobbies
	$(this.nova).on('onLobby', this.onLobby.bind(this));
	$(this.host).on('onOpen', this.onOpen.bind(this));
	$(this.host).on('onJoin', this.onJoin.bind(this));
	
	//Misc
	$(this.nova).on('onHostList', this.onHostList.bind(this));
	
};
