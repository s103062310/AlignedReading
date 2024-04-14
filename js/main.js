/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	This file defined main functions of Align Reading tool.	
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */


// controller of the whole ui
class UI {

	// corporaRecord: object, count number of each corpus name, used to generate unique corpus id [corpusname: number(int)]
	constructor() {
		this.corporaRecord = {};
		
		// UI
		this.mainUI = new Main();										// ui-main.js
		this.manageUI = new Manage(this);								// ui-aside.js
		this.metaSettingUI = new Setting(this, '#meta-setting');		// ui-aside.js
		this.alignSettingUI = new Setting(this, '#align-setting');		// ui-aside.js
		this.titleSettingUI = new Setting(this, '#title-setting');		// ui-aside.js
	}

	// * * * * * * * * * * * * * * * * data * * * * * * * * * * * * * * * * *

	// add a new corpus to system
	// name: string, name of added corpus
	addCorpus(name) {
		this.manageUI.addCorpus(name);
		this.mainUI.addCorpus(name);
	}

	// set data of corpus
	// name: string, name of target corpus
	// data: array(Document-docuxmlParser.js), documents of parsed xml
	setCorpusData(name, data) {
		var metadata = [];
		var aligntype = [];

		// extract data from each document
		data.forEach(docObj => {

			// system defined
			docObj.metadata.forEach(entry => {
				let metaname = entry.zhname;
				if (metadata.indexOf(metaname) < 0) metadata.push(metaname);
			});

			// user defined
			docObj.udefmetadata.forEach(entry => {
				let metaname = entry.name;
				if (metadata.indexOf(metaname) < 0) metadata.push(metaname);
			});

			// align tag
			$(docObj.content).find('AlignBegin').each(function() {
				let type = $(this).attr('Type');
				if (aligntype.indexOf(type) < 0) aligntype.push(type);
			});
		});

		// default align type
		aligntype.push('FullText');

		// title metadata
		var titleMeta = metadata.filter(meta => meta === '文件標題').concat(['檔名'])

		// record corpus name - unique corpus id as corpus name
		this.corporaRecord[name] = (name in this.corporaRecord) ?this.corporaRecord[name]+1 :0;
		var suffix = (this.corporaRecord[name] > 0) ?`(${ this.corporaRecord[name] })` :'';
		name += suffix;

		// sub UI
		this.metaSettingUI.addItems(metadata, name);
		this.alignSettingUI.addItems(aligntype, name);
		this.titleSettingUI.addItems(titleMeta, name);
		this.mainUI.setCorpusData(name, data, aligntype, {
			metadata: this.metaSettingUI.target,
			aligntype: this.alignSettingUI.target,
			titleDisplay: this.titleSettingUI.target,
		});
	}

	// delete a corpus from system
	// name: string, name of deleted corpus
	deleteCorpus(name) {
		this.corporaRecord[name.replace(/\([0-9]+\)/, '')]--;
		this.manageUI.deleteCorpus(name);
		this.metaSettingUI.deleteItems(name);
		this.alignSettingUI.deleteItems(name);
		this.titleSettingUI.deleteItems(name);
		this.mainUI.deleteCorpus(name, {
			metadata: this.metaSettingUI.target,
			aligntype: this.alignSettingUI.target,
			titleDisplay: this.titleSettingUI.target,
		});
	}

	// * * * * * * * * * * * * * * * * interaction * * * * * * * * * * * * * * * * *

	// toggle aside
	toggle() {
		$('aside').toggleClass('open')
	}

	// toggle visualization of a corpus
	// name: string, name of toggled corpus
	toggleCorpus(name) {
		this.manageUI.toggleCorpus(name);
		this.mainUI.toggleCorpus(name);
	}

	// set a metadata active
	// name: string, name of active metadata
	activateMetadata(name) {
		this.metaSettingUI.activateSetting(name);
		this.mainUI.activateMetadata(name);
	}

	// set an align type active
	// name: string, name of active aligntype
	activateAligntype(name) {
		this.alignSettingUI.activateSetting(name);
		this.mainUI.activateAligntype(name);
	}

	// set a title display metadata active
	// name: string, name of active title display metadata
	activateTitleDisplay(name) {
		this.titleSettingUI.activateSetting(name);
		this.mainUI.activateTitleDisplay(name);
	}
}


// * * * * * * * * * * * * * * * * initialization * * * * * * * * * * * * * * * * *


// global variables
var _ui = new UI();
var _docusky = new DocuSky();		// docusky.js
var _parser = new DocuxmlParser();	// docuxmlParser.js
const _legalLang = { zh: 'zh', en: 'en' }
let _lang = 'zh'

// parse url parameter
const { searchParams } = new URL(location.href)
const _query = Object.fromEntries([...searchParams.entries()].map(
	(([key, value]) => {
		const parsedValue = key === 'corpus' ? value.split(',') : value
		return [key, parsedValue]
	})))


// google analytics
if (typeof gtagEventLog == 'function') {
	gtagEventLog({
		action: 'view',
		category: 'tool',
		label: '文本對讀工具'
	});
}


// initialize when browser is ready
$(document).ready(function() {

	// register
	_docusky.addControlObj('login', new Login(openPublicDB, loginDocusky));									// ui-aside.js
	_docusky.addControlObj('corpusList', new CorpusList(logoutDocusky, openLoginModal, switchDBList, getDataFromDocusky));	// ui-aside.js
	
	// explain text
	$('#explain .modal-body').load('html/explain.html', function(argument) {

		// jump
		var jumpTo = function(key) {
			var now = $('.explain-content').scrollTop();
			var offset = $(`.explain-content [data-key="${ key }"]`).offset().top - $('.explain-content').offset().top;

			// animate
			$('.explain-content').animate({
				scrollTop: now + offset
			}, 'fast');
		};
		
		// onclick - directory
		$('.explain-dir-item').click(function(event) {
			jumpTo($(event.target).attr('data-key'));
		});

		// onclick - link
		$('.link').click(function(event) {
			jumpTo($(event.target).attr('data-to'));
		});
	});

	// language
	switchLanguage(_legalLang[_query['l']] || 'zh')

	// auto load open db
	if (_query.db) {
		const target = _query.target || 'OPEN'
		if (_query.corpus) {
			_query.corpus.forEach(corpus => {
				getDataFromDocusky({ target, db: _query.db, corpus })
			})
		} else {
			_docusky.getDbCorpus(target, _query.db)
		}
	}
});


// * * * * * * * * * * * * * * * * events function * * * * * * * * * * * * * * * * *


// menu button (left-up corner of screen) - toggle whole UI
$('#menu').click(function() {
	_ui.toggle();
});


// reset button (left-up corner of screen) - clear all colored align block
$('#reset').click(function() {
	_ui.mainUI.resetAlign();
});


// item title in side bar (left of screen) - toggle item content
$('.control-item-title').click(function() {
	$(this).next().slideToggle('fast');
});


// load from uploaded xml button (load data in side bar) - load data from user's computer
$('#load-from-local').click(function() {
	$('#upload-xml').click();
});


// upload files input (load data in side bar) - upload xml from user's computer
$('#upload-xml').change(function() {
	for (let i = 0; i < this.files.length; i++) getFileData(this.files[i]);
	$(this).val('');
});


// load from docusky button (load data in side bar) - load data from docusky
$('#load-from-docusky').click(function() {
	_docusky.getDbCorpusList('USER');
});


// search button (search in side bar) - search query in corpora
$('#search-btn').click(function() {
	_ui.mainUI.search($('#search-query').val().trim());
});


// reset button (search in side bar) - clear all search result
$('#search-reset').click(function() {
	$('#search-query').val('');
	_ui.mainUI.resetSearch();
});


// * * * * * * * * * * * * * * * * system function * * * * * * * * * * * * * * * * *


// get data in uploaded file
// file: File, object of uploaded file
function getFileData(file) {
	var reader = new FileReader();
	reader.filename = file.name;
	reader.onload = processDataFromXML;
	reader.readAsText(file);
}


// callback of get data from local
// event: Event, file reader event
function processDataFromXML(event) {
	var data = _parser.processXMLRowData(event.target.result);
	for (let name in data) {
		if (Object.keys(_ui.corporaRecord).includes(name)) {
			// has corpus already
			alert(`文獻集「${name}」已存在。`)
		} else {
			_ui.addCorpus(name);
			_ui.setCorpusData(name, data[name]);
		}
	}
}


// callback of submit login information
// username: string, name of user account
// password: string, password of user account
function loginDocusky(username, password) {
	_docusky.login(username, password);
}


// callback of submit logout
function logoutDocusky() {
	_docusky.logout()
}

function openLoginModal() {
	_docusky.controlObj.corpusList.modal('hide')
	_docusky.controlObj.login.modal('show')
}


// open corpus list of public database
function openPublicDB() {
	_docusky.getDbCorpusList('OPEN');
}


// switch database and corpus list to target
// target: string, which database is loaded, OPEN or USER
function switchDBList(target) {
	_docusky.getDbCorpusList(target);
}


// callback of submit selected corpus
// param: object, needed parameters when get data from api
function getDataFromDocusky(param) {
	if (Object.keys(_ui.corporaRecord).includes(param.corpus)) {
		// has corpus already
		alert(`文獻集「${param.corpus}」已存在。`)
	} else {
		param.callback = processDataFromDocusky;
		_ui.addCorpus(param.corpus);
		_docusky.getData(param);
	}
}


// callback of get data from docusky
// param: object, received data
//	- db: string, name of database
//	- corpus: string, name of corpus
//	- docList: array(object), documents data from docusky
//	- callback: function, execute after getting all data
function processDataFromDocusky(param) {
	var data = _parser.processDocuSkyRowData(param.docList);
	_ui.setCorpusData(param.corpus, data);
}