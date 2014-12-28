
/***********************************
**	Primary Init
************************************/

var ui = {
	scheme: {
		container: 'body',
		rows: [
			{
				view: 'menu',
				id: "mainMenu",
				on: {onMenuItemclick: logic.menuSwitch.bind(logic)},
				data: [
					{value: 'File', submenu: [
						'New',
						{$template: 'Separator'},
						'Open remote',
						'Save remote',
						{$template: 'Separator'},
						'Open local',
						'Save local'
					]},
					{value: 'Edit', submenu: [
            'Rename section',
            {$template: 'Separator'},
						'New section'
					]},
					{value: 'View'},
					{value: 'Window', submenu: [
						'Properties',
						{$template: 'Separator'},
						'Terrain Editor',
						'Object Editor',
						'Code Editor',
					]},
					{value: 'Mod', id: 'mod', submenu: []},
					{value: 'Help'},
				]
			},
			{cols: [
				{
					view: 'tree', id: 'tree',
					width: 224, minWidth: 64,
					drag: true, select: true,
					type: {folder: function(obj) {
						if (obj.$count)
							return "<span class='webix_icon fa-folder'></span>";
						return  "<span class='webix_icon fa-file'></span>";
					}},
					data: []
				},
				{view: 'resizer'},
				{id: 'code', type: 'clean'}
			]}
		]
	}
};
