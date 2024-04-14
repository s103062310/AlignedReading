/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	This file defined the class that used to communicate with docusky API.	
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */


const REQUESTER = 'Aligned Reading Tool'


// controller of docusky api communication
class DocuSky {

	// apiPath: string, path of api
	// controlObj: object, related UI after receiving response from docusky api [ui ID: ui controller(self-defined)]
	constructor() {
		this.apiPath = 'https://docusky.org.tw/DocuSky/webApi/';
		this.controlObj = {};
	}

	// register controlled UI
	// name: string, id of controlled UI
	// obj: self-defined class, controller of UI
	addControlObj(name, obj) {
		this.controlObj[name] = obj;
	}

	// login to docusky
	// username: string, name of user account
	// password: string, password of user account
	login(username, password) {
		var me = this;

		// login api
		$.ajax({
			type: 'POST',
			dataType: 'json',
			url: me.apiPath + 'userLoginJson.php',

			data: {
				dsUname: username,
				dsPword: password,
				requester: REQUESTER,
			},

			success: function(response) {
				me.controlObj.login.modal('hide');
				if (response.code == 0) me.getDbCorpusList('USER');		// login success
				else alert(response.message);							// login fail
			},

			error: function(response) {
				me.controlObj.login.modal('hide');
				alert(response.message);
			}
		});
	}

	// logout from docusky
	logout() {
		var me = this;

		// logout api
		$.ajax({
			type: 'GET',
			dataType: 'json',
			url: me.apiPath + 'userLogoutJson.php',

			data: { requester: REQUESTER },

			success: function(response) {
				if (response.code == 0) me.controlObj.corpusList.logout();		// logout success
				else alert(response.message);										// logout fail
			},

			error: function(response) {
				alert(response.message);
			}
		});
	}

	// get user's corpus list on docusky
	getDbCorpusList(target) {
		var me = this;

		// corpus list api
		$.ajax({
			type: 'GET',
			dataType: 'json',
			url: this.apiPath + 'getDbCorpusListJson.php',

			data: { target, requester: REQUESTER },

			success: function(response) {
				if (response.code == 101) me.controlObj.login.modal('show');								// require login
				else if (response.code == 0) me.controlObj.corpusList.display(target, response.message);	// success
				else alert(response.message);																// fail
			},

			error: function(response) {
				alert(response.message);
			}
		});
	}

	// get user's corpus list on docusky for specific db
	getDbCorpus(target, db) {
		var me = this;

		// corpus list api
		$.ajax({
			type: 'GET',
			dataType: 'json',
			url: this.apiPath + 'getDbCorpusListJson.php',

			data: { target, requester: REQUESTER },

			success: function(response) { // require login
				if (response.code == 101) me.controlObj.login.modal('show');	
				else if (response.code == 0) { // success
					response.message
						.filter(corpus => corpus.db === db && corpus.corpus !== '[ALL]')
						.forEach(({ corpus }) => getDataFromDocusky({ target, db, corpus }))
				} else alert(response.message); // fail
			},

			error: function(response) {
				alert(response.message);
			}
		});
	}

	// get data of selected corpus
	// param: object, needed parameters when get data from api
	getData(param) {
		param.docList = [];
		this.getQueryResult(param, 1);
	}

	// query api of docusky
	// param: object, query and result information
	//  - target: string, string, which database is loaded, OPEN or USER
	//	- db: string, name of database
	//	- corpus: string, name of corpus
	//	- docList: array(object), documents data from docusky
	//	- callback: function, execute after getting all data
	// page: int, page of database
	getQueryResult(param, page) {
		var me = this;
		
		// query api
		$.ajax({
			type: 'GET',
			dataType: 'json',
			url: this.apiPath + 'getQueryResultDocumentsJson.php',

			data: {
				target: param.target,
				db: param.db,
				corpus: param.corpus,
				query: '.all',
				page: page,
				pageSize: 200,
				requester: REQUESTER,
			},

			success: function(response) {

				// success
				if (response.code == 0) {
					param.docList = param.docList.concat(response.message.docList);

					// next page
					let remain = response.message.totalFound - response.message.page * 200;
					if (remain > 0) me.getQueryResult(param, page+1);
					else param.callback(param);

				// fail
				} else alert(response.message);				
			},

			error: function(response) {
				alert(response.message);
			}
		});
	}
}

