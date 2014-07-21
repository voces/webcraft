
/**********************************
**	Constructor
***********************************/

Core.Pages.Game = function(pages) {
	
	this.pages = pages;
	this.core = pages.core;
	this.nova = pages.nova;
	this.host = pages.core.host;
	this.engine = pages.core.engine;
	
	this.page = $('<div></div>').addClass('Game').load(
		'src/Core/Pages/Game/GameTemplate.html',
		this.load.bind(this)
	);
	
};

/**********************************
**	Communications
***********************************/

/**********************************
***********************************
**	UI
***********************************
***********************************/

/**********************************
**	Menu
***********************************/

Core.Pages.Game.prototype.menuHome = function(e) {
	this.fadeOut();
	this.pages.home.fadeIn();
};

Core.Pages.Game.prototype.menuLeave = function(e) {
	this.host.leave();
};

Core.Pages.Game.prototype.menuCancel = function(e) {
	this.menu.toggle();
};

/**********************************
**	Splash
***********************************/

Core.Pages.Game.prototype.updateSplash = function(text, ellipse, show) {
	this.splash
		.empty()
		.append($("<div>")
			.text(text));
	
	if (ellipse)
		this.splash.children().first().append(new Ellipse());
	
	if (show)
		this.splash.show();
};

/**********************************
***********************************
**	Global hooks
***********************************
**********************************/

/**********************************
**	Window Hooks
***********************************/

Core.Pages.Game.prototype.keydown = function(e) {
	if (e.which == 27) {
		this.menu.toggle();
		
		return false;
	}
};

/**********************************
**	Engine Hooks
***********************************/

Core.Pages.Game.prototype.onLoad = function() {
	if (this.engine.protocol == null)
		console.log("empty!");
};

/**********************************
***********************************
**	Host Communication Hooks
***********************************
**********************************/

Core.Pages.Game.prototype.onLeave = function(e2, e) {
	
	//Means we left the game
	if (e.account == this.core.displayAccount) {
		this.fadeOut();
		this.pages.portal.fadeIn();
	}
};

Core.Pages.Game.prototype.onJoin = function(e2, e) {
	this.engine.load(e.protocol);
};

/**********************************
**	Reconnecting
**********************************/

//First event, goto onOpen
Core.Pages.Game.prototype.onClose = function(e2, e) {
	this.updateSplash("Reconnecting", true, true);
	this.core.host.connect(this.core.host.ip, this.core.host.port);
};

//goto onKey
Core.Pages.Game.prototype.onOpen = function(e2, e) {
	this.updateSplash("Authenticating", true);
	this.host.sendKey(this.host.key);
};

//goto onLobby
Core.Pages.Game.prototype.onKey = function(e2, e) {
	this.host.lobby(this.host.lobbyName);
};

//goto onBridge
Core.Pages.Game.prototype.onKeyFail = function(e2, e) {
	this.updateSplash("Bridging", true);
	this.nova.bridge(this.host.account);
};

//success
Core.Pages.Game.prototype.onLobby = function(e2, e) {
	this.splash.hide();
};

//failure
Core.Pages.Game.prototype.onLobbyFail = function(e2, e) {
	
	this.updateSplash("Unable to rejoin.", true);
	
	setTimeout(function() {
		this.fadeOut();
		this.pages.portal.fadeIn();
	}.bind(this), 3000);
	
};

//goto onOpen/onKey
Core.Pages.Game.prototype.onBridge = function(e2, e) {
	
	this.host.key = e.key;
	this.host.account = e.account;
	
	if (typeof this.host.socket == "undefined" || this.host.socket.readyState != 1)
		this.host.connect(e.ip, e.port);
	else
		this.host.sendKey(this.host.key);
	
};

/**********************************
**	Initializer
***********************************/

Core.Pages.Game.prototype.fadeIn = function(instant) {
	
	if (!this.ready) {
		this.toFade = instant;
		return;
	}
	
	if (instant) {
		this.page.css('opacity', 1);
		this.bindGlobals();
	} else {
		this.page.css('opacity', 0);
		this.page.animate({opacity: 1}, this.bindGlobals.bind(this));
	}
	
	this.menu.hide();
	this.splash.hide();
	this.page.show();
	
};

Core.Pages.Game.prototype.fadeOutComplete = function() {
	this.page.hide();
	this.unbindGlobals();
};

Core.Pages.Game.prototype.fadeOut = function() {
	this.page.animate({opacity: 0}, this.fadeOutComplete.bind(this));
};

Core.Pages.Game.prototype.bindGlobals = function() {
	
	//Global hooks
	$(window).on('keydown.Game', this.keydown.bind(this));
	
	//Communication
	$(this.host).on("onLeave.Game", this.onLeave.bind(this));
	
	//Reconnecting events
	$(this.host).on("onClose.Game", this.onClose.bind(this));			//	goto onOpen
	$(this.host).on("onOpen.Game", this.onOpen.bind(this));				//	goto onKey
	$(this.host).on("onKey.Game", this.onKey.bind(this));				//	goto onLobby
	$(this.host).on("onKeyFail.Game", this.onKeyFail.bind(this));		//	goto onBridge
	$(this.nova).on('onBridge.Lobby', this.onBridge.bind(this));		//	goto onOpen/onKey
	$(this.host).on("onLobby.Game", this.onLobby.bind(this));			//	success
	$(this.host).on("onLobbyFail.Game", this.onLobbyFail.bind(this));	//	fail
	
};

Core.Pages.Game.prototype.unbindGlobals = function() {
	$(window).off('.Game');
};

Core.Pages.Game.prototype.load = function() {
	
	$(this.page).find('*').each(variablize.bind(this));
	
	/**********************************
	**	Global hooks
	***********************************/
	
	$(this.host).on("onJoin", this.onJoin.bind(this));
	$(this.engine).on("onLoad", this.onLoad.bind(this));
	
	/**********************************
	**	Local hooks
	***********************************/
	
	$(this.mHome).on('click', this.menuHome.bind(this));
	$(this.mLeave).on('click', this.menuLeave.bind(this));
	$(this.mCancel).on('click', this.menuCancel.bind(this));
	
	/**********************************
	**	Page setup
	***********************************/
	
	this.page.appendTo('body');
	this.page.hide();
	
	this.ready = true;
	
	if (this.toFade != null) {
		this.fadeIn(this.toFade);
		this.toFade = null;
	}
};
