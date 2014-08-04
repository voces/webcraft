
/**********************************
**	Constructor
***********************************/

Core.Pages.Portal.Group = function(portal) {
	
	this.portal = portal;
	this.pages = portal.pages;
	this.core = portal.core;
	this.nova = portal.nova;
	
	this.section = $('<div></div>').addClass('section').load(
		'src/Core/Pages/Portal/GroupTemplate.html',
		this.load.bind(this)
	);
	
};

/**********************************
**	UI
***********************************/

Core.Pages.Portal.Group.prototype.whisperUser = function(e) {
	this.portal.chat.input.val("/w " + $(e.target).text() + " " + this.portal.chat.input.val()).focus();
};

Core.Pages.Portal.Group.prototype.newGroupKeydown = function(e) {
	
	//Esc
	if (e.which == 13)
		this.newGroup();
	
};

Core.Pages.Portal.Group.prototype.newGroup = function() {
	var newGroup = $(this.section.groupJoinText).val();
	$(this.section.groupJoinText).val('');
	
	this.nova.join(newGroup);
};

/**********************************
**	Communication
***********************************/

Core.Pages.Portal.Group.prototype.appendUser = function(user) {
	if (user.avatar == "") user.avatar = "r/img/avatar/blank.png";
	
	this.section.list.append($('<div></div>')
		.addClass("user")
		.append($("<img>")
			.addClass("avatar")
			.attr("src", user.avatar))
		.append($("<span></span>")
			.addClass("label")
			.text(user.account))
		.on("click", this.whisperUser.bind(this)));
};

Core.Pages.Portal.Group.prototype.onGroup = function(e2, e) {
	this.portal.groupHeader.text(e.group);
	this.section.list.empty();
	
	if (e.accounts)
		for (var i = 0; i < e.accounts.length; i++)
			this.appendUser(e.accounts[i]);
};

Core.Pages.Portal.Group.prototype.onJoin = function(e2, e) {
	
	if (this.portal.groupHeader.text() != e.group) {
		this.portal.groupHeader.text(e.group);
		this.section.list.empty();
	}
	
	for (var i = 0; i < e.accounts.length; i++)
		this.appendUser(e.accounts[i]);
		//this.section.list.append($('<div></div>').text(e.accounts[i]));
	
};

Core.Pages.Portal.Group.prototype.onLeave = function(e2, e) {
	
	this.section.list.children().each(function(i, l) {
		if ($(l).text() == e.account) $(l).remove();
	});
	
};

/**********************************
**	Initializer
***********************************/


Core.Pages.Portal.Group.prototype.bindGlobals = function() {
	
	//Global hooks
	
	
};

Core.Pages.Portal.Group.prototype.unbindGlobals = function() {
	
	$(window).off('.PGroup');
	//$(this.nova).off('.PGroup');
	
};

Core.Pages.Portal.Group.prototype.load = function() {
	
	this.section.find('*').each(variablize.bind(this.section));
	
	//Communication hooks
	$(this.nova).on('onGroup.PGroup', this.onGroup.bind(this));
	$(this.nova).on('onJoin.PGroup', this.onJoin.bind(this));
	$(this.nova).on('onLeave.PGroup', this.onLeave.bind(this));
	
	//Local hooks
	$(this.section.groupJoinText).on('keydown', this.newGroupKeydown.bind(this));
	$(this.section.groupJoinButton).on('click', this.newGroup.bind(this));
	//this.section.groupJoinButton.on('click', this.newGroup.bind(this));
	
};
