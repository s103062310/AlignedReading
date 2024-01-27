/* * * * * * * * * * * * * * * * * * * * * *
	This file defined classes of Aside UI.	
 * * * * * * * * * * * * * * * * * * * * * */


// * * * * * * * * * * * * * * * * load from docusky * * * * * * * * * * * * * * * * *


// controller of login modal
class Login {

	// modalUI: DOM, UI of login modal
	constructor(openDBFunc, loginFunc) {
		this.modalUI = $('#login-ui');
		this.init(openDBFunc, loginFunc);
	}

	// initialization
	// loginFunc: function, login after get user account data
	init(openDBFunc, loginFunc) {
		var me = this;

		// onclick - open public database directly
		$('#opendb-btn').click(function() {
			me.modal('hide');
			openDBFunc();
		});

		// onclick - login
		$('#login-btn').click(function() {
			let username = $('#username').val();
			let password = $('#password').val();
			loginFunc(username, password);
		});
	}

	// toggle login modal
	// action: string, show or hide
	modal(action) {
		$(this.modalUI).modal(action);
	}
}


// controller of corpus list modal 
class CorpusList {

	// modalUI: DOM, UI of corpus list modal
	// tableUI: DOM, UI of corpus table
	constructor(logoutFunc, loginFunc, switchDBFunc, getDataFunc) {
		this.target = 'USER'
		this.isLogin = false
		this.loginFunc = logoutFunc
		this.loginFunc = loginFunc
		this.modalUI = $('#my-corpus-list');
		this.tableUI = $('#my-corpus-list tbody');
		this.init(switchDBFunc, getDataFunc);
	}

	// initialization
	// switchDBFunc: function, switch database and corpus list to target
	// getDataFunc: function, get data from docusky after get user selected corpus
	init(switchDBFunc, getDataFunc) {
		var me = this;

		// onclick - select corpus
		$(this.tableUI).click(function(event) {
			me.toggleRow(event.target);
		});

		// onclick - switch to another database
		$('#switch-db-btn').click(function() {
			switchDBFunc($(this).attr('data-target'));
		});

		// onclick - start loading
		$('#load-from-docusky-btn').click(function() {
			me.getSelectedData(getDataFunc);
		});
	}

	// toggle login modal
	// action: string, show or hide
	modal(action) {
		$(this.modalUI).modal(action);
	}	

	// display db/corpus table
	// target: string, which database is loaded, OPEN or USER
	// corpora: array(object), corpus list from docusky api
	display(target, corpora) {
		this.target = target
		const isUserDB = target === 'USER'
		if (isUserDB) this.isLogin = true
		
		// table html
		$(this.tableUI).empty();
		corpora.forEach((corpus, i) => {
			let classname = (corpus.corpus === '[ALL]') ?'all' :'';

			$(this.tableUI).append(
				`<tr class="${ classname }" data-db="${ corpus.db }">
					<th scope="row">${ i+1 }</th>
					<td name="db">${ corpus.db }</td>
					<td name="corpus">${ corpus.corpus }</td>
					<td>${ corpus.dbStatusRemarks }</td>
					<td>
						<i class="fa fa-square-o" aria-hidden="true"></i>
						<i class="fa fa-check-square" aria-hidden="true"></i>
					</td>
				</tr>`);
		});

		// UI
		const getText = getTextFunc(_lang)
		$('#corpus-list-label').html(isUserDB ? getText('corpusTitlePersonal') : getText('corpusTitlePublic'))
		$('#account-btn').html(this.isLogin ? getText('corpusLogoutBtn') : getText('corpusLoginBtn'))
		$('#account-btn').click(this.isLogin ? this.logoutFunc : this.loginFunc)
		$('#switch-db-btn').html(isUserDB ? getText('corpusPublicBtn') : getText('corpusMyBtn'))
		$('#switch-db-btn').attr('data-target', isUserDB ? 'OPEN' : 'USER')
		$('#switch-db-btn').css('display', this.isLogin ? 'inline-block' : 'none')
		this.modal('show')
	}

	logout() {
		this.isLogin = false
		if (this.target === "USER") this.modal('hide')
		else {
			$('#account-btn').html(getText('corpusLoginBtn'))
			$('#account-btn').click(this.loginFunc)
			$('#switch-db-btn').css('display', 'none')
		}
	}

	// toggle all entry should toggle when click a table entry
	// span: DOM, UI of clicked target
	toggleRow(span) {
		var tr = $(span).closest('tr');

		// [ALL] corpus in the same db
		if ($(tr).hasClass('all')) {
			while ($(tr).next().attr('data-db') === $(tr).attr('data-db')) {
				tr = $(tr).next();
				$(tr).toggleClass('select');
			}

		// single corpus
		} else $(tr).toggleClass('select');
	}

	// get data of user selected corpus
	// getDataFunc: function, request data from docusky
	getSelectedData(getDataFunc) {
		const target = this.target

		// each selected corpus
		$(this.tableUI).find('.select').each(function() {
			getDataFunc({
				target,
				db: $(this).find('td[name="db"]').text(),
				corpus: $(this).find('td[name="corpus"]').text()
			});
		});

		// UI
		this.modal('hide');
	}
}


// * * * * * * * * * * * * * * * * corpus manage * * * * * * * * * * * * * * * * *


// controller of corpus manage block
class Manage {

	// ui: DOM, UI of corpus manage block
	// parent: class UI, who creates this
	// entries: object, record each corpus's ui [corpusname: entry ui(DOM)]
	constructor(parent) {
		this.ui = $('#manage');
		this.parent = parent;
		this.entries = {};
	}

	// add a new corpus entry in manage block
	// name: string, name of added corpus
	addCorpus(name) {
		var me = this;

		// display
		$(this.ui).append(
			`<div class="setting target" key="${ name }">
				<span class="setting-child">◆</span>
				<span class="setting-long-child">${ name }</span>
				<span class="setting-child setting-eye">
					<i class="fa fa-eye" aria-hidden="true"></i>
					<i class="fa fa-eye-slash" aria-hidden="true"></i>
				</span>
				<i class="fa fa-trash setting-child setting-trash" aria-hidden="true"></i>
			</div>`
		);

		// entry html element
		var target = $(this.ui).children().last();
		this.entries[name] = target;

		// onclick - eye icon: toggle corpus
		$(target).find('.setting-eye').click(function() {
			me.parent.toggleCorpus(name);
		});

		// onclick - trash icon: delete corpus
		$(target).find('.setting-trash').click(function() {
			me.parent.deleteCorpus(name);
		});
	}

	// delete a corpus entry in manage block
	// name: string, name of deleted corpus
	deleteCorpus(name) {
		$(this.entries[name]).remove();
		delete this.entries[name];
	}

	// change eye icon in entry
	// name: string, name of toggled corpus
	toggleCorpus(name) {
		$(this.entries[name]).toggleClass('target');
	}
}


// * * * * * * * * * * * * * * * * setting * * * * * * * * * * * * * * * * *


// controller of setting block (metadata, aligntype, titledisplay)
class Setting {

	// ui: DOM, UI of setting block
	// parent: class UI, who creates this
	// list: object, record source (which corpus) of each choice item [choice: all sources(array(string: corpus name))]
	// target: string, user selected item in list
	constructor(parent, ui) {
		this.name = ui.split('-')[0].replace('#', '')
		this.ui = $(ui);
		this.parent = parent;
		this.list = {};	
		this.target = undefined;
	}

	// add choices of new corpus to setting block
	// list: array(string), added items
	// corpusname: string, name of added corpus
	addItems(list, corpusname) {

		// record where each item from
		list.forEach(item => {
			if (this.list[item] === undefined) this.list[item] = [];
			this.list[item].push(corpusname);
		});

		if (!this.target) {
			// default target: url parameter or first item
			this.target = _query[this.name] || Object.keys(this.list)[0]
		}

		// refresh
		this.refresh();
	}

	// delete choices of a corpus in setting block
	// corpusname: string, name of deleted corpus
	deleteItems(corpusname) {

		// delete corpus record in each item
		for (let item in this.list) {
			let index = this.list[item].indexOf(corpusname);
			if (index >= 0) this.list[item].splice(index, 1);
			if (this.list[item].length <= 0) delete this.list[item];
		}

		// assign new target if old target is deleted
		if (this.list[this.target] === undefined) this.target = Object.keys(this.list)[0];

		// refresh
		this.refresh();
	}

	// refresh whole setting block
	refresh() {
		var me = this;
		$(this.ui).empty();

		// display
		Object.keys(this.list).forEach(item => {
			$(this.ui).append(
				`<div class="setting${ (item === this.target) ?' target' :'' }" key="${ item }">
					<span class="setting-child">◆</span>
					<span class="setting-long-child">${ item }</span>
					<span class="setting-child setting-toggle">
						<i class="fa fa-toggle-on" aria-hidden="true"></i>
						<i class="fa fa-toggle-off" aria-hidden="true"></i>
					</span>
				</div>`
			);
		});

		// onclick - change activated setting
		$(this.ui).find('.setting-toggle').click(function(event) {
			var source = $(me.ui).attr('id');
			var name = $(event.target).closest('.setting').attr('key');
			if (source === 'meta-setting') me.parent.activateMetadata(name);
			else if (source === 'align-setting') me.parent.activateAligntype(name);
			else if (source === 'title-setting') me.parent.activateTitleDisplay(name);
		});
	}

	// change target item in setting block
	// name: string, name of activated setting
	activateSetting(name) {
		this.target = name;
		$(this.ui).find('.setting.target').removeClass('target');
		$(this.ui).find(`.setting[key="${ name }"]`).addClass('target');
	}
}


