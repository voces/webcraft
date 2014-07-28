
/**********************************
**	Constructor
***********************************/

Core.Pages.Game = function(pages) {
	
	this.pages = pages;
	this.core = pages.core;
	this.nova = pages.nova;
	this.host = pages.core.host;
	this.engine = pages.core.engine;
	
	this.account = "";
	this.leaving = false;
	this.selectedProtocol = null;
	
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

Core.Pages.Game.prototype.menuChange = function(e) {
	this.menu.hide();
	this.gameProtocol.show();
	
	this.gamePlayer.hide();
	this.gameOwner.show();
	
	this.host.getProtocols();
};

Core.Pages.Game.prototype.menuLeave = function(e) {
	this.leaving = true;
	
	this.fadeOut();
	this.pages.portal.fadeIn();
	
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
**	Protocols
***********************************/

Core.Pages.Game.prototype.search = function(e) {
	var search = this.gameSearchInput.val().toLowerCase();
	
	//Only do a remote search if they hit enter and we have a partial list
	if (e.which == 13 && ((this.complete == false && this.subset == false) || search == ""))
		this.host.getProtocols(search);
	
	//Else we're doing a local search, which is puffy
	else {
		var regex = new RegExp(".*" + search.split("").join(".*") + ".*");
		this.gameProtocols.children().each(function(i, v) {
			$v = $(v);
			
			if (regex.test($v.text().toLowerCase())) $v.show();
			else $v.hide();
		});
	}
};

Core.Pages.Game.prototype.selectProtocol = function(e) {
	this.host.protocol(this.selectedProtocol.path);
};

Core.Pages.Game.prototype.forceRefresh = function(e) {
	this.host.getProtocols(this.gameSearchInput.val().toLowerCase(), true);
};

Core.Pages.Game.prototype.onSelectProtocol = function(e) {
	var $target = $(e.delegateTarget);
	
	$target.parent().find(".selected").removeClass("selected");
	$target.addClass("selected");
	
	this.displayProtocol(this.protocols[$target.attr("data-protoId")]);
};

Core.Pages.Game.prototype.tryImage = function(preview, size, terminateOn) {
	var order = ["small", "medium", "large"];
	
	if (typeof preview == "string")
		return preview;
	else if (typeof preview != "undefined") {
		var index = order.indexOf(size);
		
		if (typeof preview[size] == "undefined") {
			if (typeof terminateOn == "undefined") terminateOn = index;
			else if (terminateOn == index) return "images/lobbies/unknown" + size + ".png";
			
			if (index < 2) index++;
			else index = 0;
			
			return this.tryImage(preview, order[index], terminateOn);
		} else
			return preview[size];			
	}
};

Core.Pages.Game.prototype.appendProtocol = function(protocol, id) {
	$("<div>")
		.attr("data-protoId", id)
		.append($("<img>").attr("src", this.tryImage(protocol.preview, "medium")))
		.append($("<div>").text(protocol.title))
		.append($("<div>").text(protocol.date + " • " + protocol.version))
		.append($("<div>").text(protocol.author))
		.click(this.onSelectProtocol.bind(this))
		.appendTo(this.gameProtocols);
			
};

Core.Pages.Game.prototype.displayProtocol = function(protocol) {
	this.selectedProtocol = protocol;
	
	this.gameTitle.text(protocol.title || "");
	this.gamePImage.attr("src", this.tryImage(protocol.preview, "large"));
	this.gamePAuthor.text(protocol.author || "");
	this.gamePVersion.text(protocol.version || 0);
	this.gamePDate.text(protocol.date || "");
	this.gamePDescription.text(protocol.description || "");
	
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
		if (this.gameProtocol.is(":visible"))
			this.gameProtocol.hide();
		else
			this.menu.toggle();
		
		return false;
	} else this.engine.keydown(e);
};

Core.Pages.Game.prototype.keyup = function(e) {
	if (e.which != 27) this.engine.keyup(e);
};

/**********************************
**	Engine Hooks
***********************************/

Core.Pages.Game.prototype.onLoad = function() {
	
	//Hide everything is we have something
	if (this.engine.protocol != null) {
		this.gameProtocol.hide();
		return;
	}
	
	//Else show what we want
	this.gameProtocol.show();
	
	//Only show the proper slide...
	if (this.host.isOwner || this.host.access.protocol) {
		this.gamePlayer.hide();
		this.gameOwner.show();
		
		this.host.getProtocols();
		
	//Do not have neccessary access to change protocol
	} else {
		this.gamePlayer.show();
		this.gameOwner.hide();
	}
	
};

/**********************************
***********************************
**	Nova Hooks
***********************************
**********************************/

Core.Pages.Game.prototype.onLogin = function(e2, e) {
	this.account = e.account;
};

/**********************************
***********************************
**	Host Communication Hooks
***********************************
**********************************/

Core.Pages.Game.prototype.onLeave = function(e2, e) {
	
	//Means we left the game
	if (e.account == this.core.displayAccount && this.leaving == false) {
		this.leaving = true;
		
		this.mChange
			.removeClass("hoverglow")
			.addClass("disabled")
			.off("click");
		
		this.fadeOut();
		this.pages.portal.fadeIn();
	}
};

Core.Pages.Game.prototype.onJoin = function(e2, e) {
	
	//Make sure it's us joining
	if (e.accounts.indexOf(this.account) >= 0) {
		this.host.owner = e.isOwner;
		this.host.ownerAccount = e.ownerAccount;
		
		if (this.host.isOwner || this.host.access.protocol)
			this.mChange
				.removeClass("disabled")
				.addClass("hoverglow")
				.on('click', this.menuChange.bind(this));
		
		this.engine.load(e.protocol);
	}
};

Core.Pages.Game.prototype.onProtocol = function(e2, e) {
	this.engine.load(e.protocol);
};

Core.Pages.Game.prototype.onProtocols = function(e2, e) {
	this.subset = e.subset;
	this.complete = e.complete;
	
	this.gameProtocols.empty();
	this.protocols = e.protocols;
	
	for (var i = 0; i < e.protocols.length; i++)
		this.appendProtocol(e.protocols[i], i);
	
	if (this.selectedProtocol == null) {
		this.displayProtocol(e.protocols[0]);
		this.gameProtocols.children().first().addClass("selected");
	}
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
	this.host.access = e.access;
	
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
	
	this.updateSplash("Unable to rejoin.");
	
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
***********************************
**	Initializer
***********************************
**********************************/

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
	
	this.selectedProtocol = null;
	this.menu.hide();
	this.splash.hide();
	this.page.show();
	
};

Core.Pages.Game.prototype.fadeOutComplete = function() {
	this.leaving = false;
	
	this.page.hide();
	this.unbindGlobals();
};

Core.Pages.Game.prototype.fadeOut = function() {
	this.page.animate({opacity: 0}, this.fadeOutComplete.bind(this));
};

Core.Pages.Game.prototype.bindGlobals = function() {
	
	//Global hooks
	$(window).on('keydown.Game', this.keydown.bind(this));
	$(window).on('keyup.Game', this.keyup.bind(this));
	
	//Communication
	$(this.host).on("onLeave.Game", this.onLeave.bind(this));
	
};

Core.Pages.Game.prototype.unbindGlobals = function() {
	$(window).off('.Game');
	$(this.host).off('.Game');
};

Core.Pages.Game.prototype.load = function() {
	
	this.page.find('*').each(variablize.bind(this));
	
	/**********************************
	**	Global hooks
	***********************************/
	
	$(this.nova).on("onLogin", this.onLogin.bind(this));
	
	$(this.host).on("onJoin", this.onJoin.bind(this));
	$(this.host).on("onProtocol", this.onProtocol.bind(this));
	$(this.host).on("onGetProtocols", this.onProtocols.bind(this));
	$(this.engine).on("onLoad", this.onLoad.bind(this));
	
	//Reconnecting events
	$(this.host).on("onClose", this.onClose.bind(this));			//	goto onOpen
	$(this.host).on("onOpen", this.onOpen.bind(this));				//	goto onKey
	$(this.host).on("onKey", this.onKey.bind(this));				//	goto onLobby
	$(this.host).on("onKeyFail", this.onKeyFail.bind(this));		//	goto onBridge
	$(this.nova).on('onBridge', this.onBridge.bind(this));			//	goto onOpen/onKey
	$(this.host).on("onLobby", this.onLobby.bind(this));			//	success
	$(this.host).on("onLobbyFail", this.onLobbyFail.bind(this));	//	fail
	
	/**********************************
	**	Local hooks
	***********************************/
	
	this.mHome.on('click', this.menuHome.bind(this));
	this.mLeave.on('click', this.menuLeave.bind(this));
	this.mCancel.on('click', this.menuCancel.bind(this));
	
	this.gameSearchInput.on('keyup', this.search.bind(this));
	this.gameSelect.on('click', this.selectProtocol.bind(this));
	this.gameForceRefresh.on('click', this.forceRefresh.bind(this));
	
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
