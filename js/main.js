/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	This file defined main functions of Align Reading tool.	
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */


// controller of the whole ui
class UI {

	// constB: int, constant that used to calculate boundary
	// boundary: int, boundary of aside and main (left 0-100 right)
	// corporaRecord: object, count number of each corpus name, used to generate unique corpus id [corpusname: number(int)]
	constructor() {
		this.constB = 20;
		this.boundary = 20;
		this.corporaRecord = {};
		
		// UI
		this.mainUI = new Main();										// ui-main.js
		this.manageUI = new Manage(this);								// ui-aside.js
		this.metaSettingUI = new Setting(this, '#meta-setting');		// ui-aside.js
		this.alignSettingUI = new Setting(this, '#align-setting');		// ui-aside.js
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

		// record corpus name - unique corpus id as corpus name
		this.corporaRecord[name] = (name in this.corporaRecord) ?this.corporaRecord[name]+1 :0;
		var suffix = (this.corporaRecord[name] > 0) ?`(${ this.corporaRecord[name] })` :'';
		name += suffix;

		// sub UI
		this.metaSettingUI.addItems(metadata, name);
		this.alignSettingUI.addItems(aligntype, name);
		this.mainUI.setCorpusData(name, data, aligntype, {
			metadata: this.metaSettingUI.target,
			aligntype: this.alignSettingUI.target
		});
	}

	// delete a corpus from system
	// name: string, name of deleted corpus
	deleteCorpus(name) {
		this.corporaRecord[name.replace(/\([0-9]+\)/, '')]--;
		this.manageUI.deleteCorpus(name);
		this.metaSettingUI.deleteItems(name);
		this.alignSettingUI.deleteItems(name);
		this.mainUI.deleteCorpus(name, {
			metadata: this.metaSettingUI.target,
			aligntype: this.alignSettingUI.target
		});
	}

	// * * * * * * * * * * * * * * * * interaction * * * * * * * * * * * * * * * * *

	// toggle aside
	toggle() {
		this.boundary = this.constB - this.boundary;

		// aside
		$('aside').animate({
			left: `${ this.boundary - this.constB }vw`, 
			right: `${ 100 - this.boundary }vw`
		}, 'fast');

		// main
		$('main').animate({
			left: `${ this.boundary }vw`
		}, 'fast');
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
}


// * * * * * * * * * * * * * * * * initialization * * * * * * * * * * * * * * * * *


// global variables
var _ui = new UI();
var _docusky = new DocuSky();		// docusky.js
var _parser = new DocuxmlParser();	// docuxmlParser.js


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
	_docusky.addControlObj('corpusList', new CorpusList(logoutDocusky, switchDBList, getDataFromDocusky));	// ui-aside.js
	
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
	console.log('load', file.name, +new Date());
}


// callback of get data from local
// event: Event, file reader event
function processDataFromXML(event) {
	console.log('load fin', event.target.filename, +new Date());
	var data = _parser.processXMLRowData(event.target.result);
	console.log('parse fin', +new Date(), data)
	for (let name in data) {
		_ui.addCorpus(name);
		_ui.setCorpusData(name, data[name]);
	}
}


// callback of submit login information
// username: string, name of user account
// password: string, password of user account
function loginDocusky(username, password) {
	_docusky.login(username, password);
}


// callback of submit login information
function logoutDocusky() {
	_docusky.logout();
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
	param.callback = processDataFromDocusky;
	_ui.addCorpus(param.corpus);
	_docusky.getData(param);
	//console.log('send', param.db + '-' + param.corpus, +new Date());
}


// callback of get data from docusky
// param: object, received data
//	- db: string, name of database
//	- corpus: string, name of corpus
//	- docList: array(object), documents data from docusky
//	- callback: function, execute after getting all data
function processDataFromDocusky(param) {
	//console.log('receive', param.db + '-' + param.corpus, +new Date());
	var data = _parser.processDocuSkyRowData(param.docList);
	//console.log('parse fin', +new Date(),data)
	_ui.setCorpusData(param.corpus, data);
}