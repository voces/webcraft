
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
	
	this.page.appendTo('body');
	
	this.ready = true;
	
	if (this.toFade != null) {
		this.fadeIn(this.toFade);
		this.toFade = null;
	}
};
