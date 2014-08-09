
/**********************************
**	Constructor
***********************************/

Core.Pages.Portal = function(pages) {
	
	this.pages = pages;
	this.core = pages.core;
	this.nova = pages.nova;;
	
	this.chat = null;
	
	this.sections = [];
	
	this.location = null;
	
	this.page = $('<div></div>').addClass('Portal').load(
		'src/Core/Pages/Portal/PortalTemplate.html',
		this.load.bind(this)
	);
	
};

/**********************************
**	Global Hooks
***********************************/

Core.Pages.Portal.prototype.keydown = function(e) {
	
	//G
	if (e.altKey && e.which == 71) this.groupRadio.prop('checked', true);
	
	//L
	else if (e.altKey && e.which == 76) this.lobbyRadio.prop('checked', true);
	
	//F
	else if (e.altKey && e.which == 70) {
		this.friendRadio.prop('checked', true);
		e.preventDefault();
	
	//C
	} else if (e.altKey && e.which == 67) this.clanRadio.prop('checked', true);
	
	//Esc
	else if (e.which == 27) {
		
		this.fadeOut();
		this.pages.home.fadeIn();
	
	//Anything else, assuming nothing is focused
	} else if (document.activeElement.tagName == 'BODY') this.chat.input.select();
	
};

/**********************************
**	Communications
***********************************/

Core.Pages.Portal.prototype.onGroup = function(e2, e) {
	this.location = e.group;
};

Core.Pages.Portal.prototype.onNoGroup = function(e2, e) {
	this.location = null;
};

Core.Pages.Portal.prototype.onLogout = function(e2, e) {
	this.location = null;
	this.chat.log.empty();
	this.group.section.list.empty();
	this.lobby.section.list.empty();
	this.friends.list.empty();
	//this.clan.list.empty();
};

/**********************************
**	Initializer
***********************************/

Core.Pages.Portal.prototype.fadeIn = function() {
	
	this.bindGlobals();
	
	this.page.css('opacity', 0);
	this.page.animate({opacity: 1});
	
	this.page.show();
	
	if (this.location == null)
		this.nova.join('NovaNet');
	
	this.nova.lobbyList()
	this.nova.hostList()
	this.nova.friendList()
	
	this.chat.input.select();
	
};

Core.Pages.Portal.prototype.fadeOut = function() {
	this.unbindGlobals();
	this.page.animate({opacity: 0}, this.fadeOutComplete.bind(this));
};

Core.Pages.Portal.prototype.fadeOutComplete = function() {
	this.page.hide();	
};

Core.Pages.Portal.prototype.bindGlobals = function() {
	
	//Global hooks
	$(window).on('keydown.Portal', this.keydown.bind(this));
	
	//Children
	this.chat.bindGlobals();
	this.group.bindGlobals();
	this.friends.bindGlobals();
	this.lobby.bindGlobals();
	
};

Core.Pages.Portal.prototype.unbindGlobals = function() {
	
	$(window).off('.Portal');
	//$(this.nova).off('.Portal');
	
	//Children
	this.chat.unbindGlobals();
	this.group.unbindGlobals();
	this.friends.unbindGlobals();
	this.lobby.unbindGlobals();
	
};

Core.Pages.Portal.prototype.load = function() {
	
	$(this.page).find('*').each(variablize.bind(this));
	
	//Communication hooks
	$(this.nova).on('onGroup', this.onGroup.bind(this));
	$(this.nova).on('onNoGroup', this.onNoGroup.bind(this));
	$(this.nova).on('onLogout', this.onLogout.bind(this));
	
	//Local hooks
	this.chat = new Core.Pages.Portal.Chat(this);
	this.group = new Core.Pages.Portal.Group(this);
	this.lobby = new Core.Pages.Portal.Lobby(this);
	this.friends = new Core.Pages.Portal.Friends(this);
	
	this.page.prepend(this.chat.page);
	this.groupContent.append(this.group.section);
	this.lobbyContent.append(this.lobby.section);
	this.friendContent.append(this.friends.list);
	
	this.page.hide();
	this.page.appendTo('body');
	
};
