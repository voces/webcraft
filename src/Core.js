Core = function() {
	
	this.bcrypt = new bCrypt();
	
	//Network objects
	this.nova = new Nova('ws://68.229.21.36:8082');
	this.host = this.nova.newHost();
	
	//Game objects
	this.graphic = new Graphic("world");
	this.engine = new Engine(this);
	
	//UI object
	this.pages = new Core.Pages(this);
	
	//Stored credentials
	//	Note: password is bcrypted, not stored plainly
	this.account = "";
	this.password = "";
	
	this.logged = false;
	this.displayAccount = "";
	
	$(document).ready(this.load.bind(this));
};

Core.prototype.secureLogin = function(account, password) {
	if (password != '') {
		var salt = '$2a$10$Nov4t3n7weNTeE51KstHu4';
		
		this.bcrypt.hashpw(password + 'nova10262013', salt, function(hash) {
			
			this.account = account;
			this.password = hash;
			
			this.nova.login(account, hash);
			
		}.bind(this));
	} else {
		
		this.account = account;
		this.password = password;
		
		this.nova.login(account, password);
		
	}
}

Core.prototype.secureRegister = function(account, password, email) {
	if (password != '') {
		var salt = '$2a$10$Nov4t3n7weNTeE51KstHu4';
		
		this.bcrypt.hashpw(password + 'nova10262013', salt, function(hash) {
			
			this.account = account;
			this.password = hash;
			
			this.nova.register(account, hash, email);
			
		}.bind(this));
	} else {
		
		this.account = account;
		this.password = password;
		
		this.nova.register(account, password, email);
		
	}
};

Core.prototype.onLogin = function(e2, e) {
	this.logged = true;
	this.displayAccount = e.account;
};

Core.prototype.onLogout = function(e2, e) {
	this.logged = false;
	this.displayAccount = "";
};

Core.prototype.onKeyFail = function(e2, e) {
	this.host.destroy();
	//this.host = this.nova.newHost();
};

Core.prototype.load = function() {
	
	//Communication hooks
	$(this.nova).on('onLogin.Core', this.onLogin.bind(this));
	$(this.nova).on('onLogout.Core', this.onLogout.bind(this));
	
	//$(this.host).on('onKeyFail.Core', this.onKeyFail.bind(this));
	
};
