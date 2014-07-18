
/**********************************
**	Constructor
***********************************/

Core.Pages.Game = function(pages) {
	
	this.pages = pages;
	this.core = pages.core;
	this.nova = pages.nova;
	this.host = pages.core.host;
	
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
**	Global Hooks
***********************************/

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
**	Host Communication Hooks
***********************************/

Core.Pages.Game.prototype.onLeave = function(e2, e) {
	console.log("onLeave", e, e2, this.core.displayAccount);
	//Means we left the game
	if (e.account == this.core.displayAccount) {
		this.fadeOut();
		this.pages.portal.fadeIn();
	}
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
	
	$(this.host).on("onLeave", this.onLeave.bind(this));
	
};

Core.Pages.Game.prototype.unbindGlobals = function() {
	$(window).off('.Game');
};

Core.Pages.Game.prototype.load = function() {
	
	$(this.page).find('*').each(variablize.bind(this));
	
	//Communications
	
	
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
