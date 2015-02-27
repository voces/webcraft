
(function(menu) {

/******************************************************************************
 **	Referenced elements & their functions
 ******************************************************************************/

var shield = document.createElement('div');
shield.style.cssText =
	'position: absolute;' +
	'top: 0;' +
	'bottom: 0;' +
	'left: 0;' +
	'right: 0;' +
	'z-index: 998;' +
	'background-color: rgba(15, 15, 15, .9);';

var novaPrompt = document.createElement('form');
novaPrompt.style.cssText = 
	'position: absolute;' +
	'top: 0;' +
	'left: calc(50% - 8em);' +
	'width: 16em;' +
	'height: 12em;' +
	'padding: 2em;' +
	'z-index: 999;' +
	'color: black;' +
	'background-color: white;';

var loginCallback = null;

/******************************************************************************
 **	Nonreferenced elements & their functions
 ******************************************************************************/

var h4 = document.createElement('h4');
h4.style.marginTop = '0';
h4.innerText = ('Authentication Required');
novaPrompt.appendChild(h4);

var p = document.createElement('p');
p.innerText = ('Please enter your Nova credentials.');
novaPrompt.appendChild(p);

var p = document.createElement('p');
novaPrompt.appendChild(p);

var label = document.createElement('label');
label.setAttribute('for', 'user');
label.innerText = ('User:');
p.appendChild(label);

var user = document.createElement('input');
user.setAttribute('id', 'user');
user.style.float = 'right';
user.onkeyup = function(e) {if (e.which == 13) password.select();};
p.appendChild(user);

var p = document.createElement('p');
novaPrompt.appendChild(p);

var label = document.createElement('label');
label.setAttribute('for', 'password');
label.innerText = ('Password:');
p.appendChild(label);

var password = document.createElement('input');
password.setAttribute('id', 'password');
password.setAttribute('type', 'password');
password.style.float = 'right';
password.onkeyup = function(e) {if (e.which == 13) attemptLogin();};
p.appendChild(password);

var p = document.createElement('p');
p.setAttribute('dir', 'rtl');
novaPrompt.appendChild(p);

var submit = document.createElement('input');
submit.setAttribute('type', 'button');
submit.setAttribute('value', 'Submit');
submit.style.marginLeft = "1em";
submit.onclick = attemptLogin;
p.appendChild(submit);

var cancel = document.createElement('input');
cancel.setAttribute('type', 'button');
cancel.setAttribute('value', 'Cancel');
cancel.onclick = function() {
	novaPrompt.remove();
	shield.remove();
};
p.appendChild(cancel);

var msg = document.createElement('p');
msg.style.textAlign = 'center';
novaPrompt.appendChild(msg);

function attemptResult(e) {
	if (e.id == 'onLoginFail') {
		
		msg.innerText = e.reason;
		user.disabled = false;
		password.disabled = false;
		submit.disabled = false;
		
		//Invalid password
		if (e.reasonCode == 1) {
			password.select();
			
		//Invalid account
		} else if (e.reasonCode == 1) {
			password.value = '';
			user.select();
		
		//No account or password
		} else if (e.reasonCode == 2) {
			user.select();
			
		}
		
	} else if (e.id == 'onLogin') {
		novaPrompt.remove();
		shield.remove();
		
		loginCallback();
		
	} else console.error('Unhandled attemptResult', e);
}

function attemptLogin() {
	msg.innerText = "Connecting...";
	user.disabled = true;
	password.disabled = true;
	submit.disabled = true;
	
	logic.nova.login(user.value, password.value, attemptResult);
}

/******************************************************************************
 **	Export
 ******************************************************************************/

logic.menu.login = function(callback) {
	
	loginCallback = callback;
	
	document.body.appendChild(shield);
	document.body.appendChild(novaPrompt);
	
	novaPrompt.user.select();
};

})(logic.menu);
