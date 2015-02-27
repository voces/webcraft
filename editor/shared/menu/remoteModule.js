
(function(menu) {

var loadRemoteModListCallback;

var shield = document.createElement('div');
shield.style.cssText =
	'position: absolute;' +
	'top: 0;' +
	'bottom: 0;' +
	'left: 0;' +
	'right: 0;' +
	'z-index: 998;' +
	'background-color: rgba(15, 15, 15, .9);';
/*
var page =
	'<div id="card">'
		'<h1 id="title">Title</h1>'
		'<div class="left">'
			'<div>'
				
			'</div>'
		'</div>'
	'</div>'
 [
	['div', {id: 'card'}, [
		['h1', {id: 'title'}, 'Title'],
		['img', {id: 'preview'}, 'r/img/lobby/unknownlarge.png']
		['div', {class: 'left'}, [
			['div', [
				['span', 'Author:'],
				['span', {id: 'author'}, 'author']
			]]
		]],
		['div', {class: 'right'}, [
			['div', [
				['span', 'Version:'],
				['span', {id: 'version'}, -1]
			]],
			['div', [
				['span', 'Date:'],
				['span', {id: 'date'}, 'YYYY-MM-DD']
			]]
		]],
		['div', {id: 'description'}, 'description'],
		
	]],
];*/

/*<div id="gameOwner" data-hide>
	<h1 id="gameTitle">Some example text</h1>
	
	<div id="gameCard">
		<img id="gamePImage" />
		<div class="left">
			<div>
				<span>Author:</span> <span id="gamePAuthor">Some author</span>
			</div>
		</div>
		<div class="right">
			<div>
				<span>Version:</span> <span id="gamePVersion">0</span>
			</div>
			<div>
				<span>Date:</span> <span id="gamePDate">2014-07-22</span>
			</div>
		</div>
		<div id="gamePDescription">Some description</div>
		<button id="gameSelect">Select</button>
	</div>
	
	<div id="gameSearch">
		<input id="gameSearchInput" placeholder="Search"></input>
		<img src="r/img/game/search.png"/>
	</div>
	
	<div id="gameProtocolsContainer">
		<div id="gameProtocols"></div>
	</div>
	
	<div id="gameForceRefresh" class="hoverglow">
		<span>Force refresh</span>
		<img src="r/img/game/refresh.png"/>
	</div>
	
</div>*/

/******************************************************************************
 **	Export
 ******************************************************************************/

logic.menu.loadRemoteModList = function(list, callback) {
	loadRemoteModListCallback = callback;
	
	document.body.appendChild(shield);
	
	console.log(list);
	
};

})(logic.menu);
