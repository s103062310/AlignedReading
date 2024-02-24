/* * * * * * * * * * * * * * * * * * * * * *
	This file defined classes of Main UI.	
 * * * * * * * * * * * * * * * * * * * * * */


// controller of a corpus column
class Corpus {

	// ui: DOM, UI of a corpus column
	// parent: class Main, who creates this
	// name: string, name of this corpus
	// aligntypes: array(string), align types that including in added corpus
	// documents: object, parsed information of each documents [filename: document content(MyDocument)]
	// pages: 2D array, assign each documents to a page, [filename array of page 0, page1, ...]
	// nowPage: array(int: size 2), window will only render 2 pages of data at most
	// pageSize: int, create another page if accumulated charactor count over this number
	// aligned: object, filename of aligned documents or key of aligned paragraph [type: array(string)]
	// read: object, filename of read document or key of read paragraph [type: string]
	constructor(parent, name) {
		this.ui = undefined;
		this.parent = parent;
		this.name = name;
		this.init();

		// data (with pages)
		this.aligntypes = [];
		this.documents = {};
		this.pages = [[]];
		this.nowPage = [];
		this.pageSize = 1000;

		// align
		this.aligned = { doc: [], para: [] };
		this.read = { doc: '', para: '' };

		// search
		this.searchResult = {};
		this.searchPages = [[]];
		this.searchNowPage = [];

		// UI
		this.dirUI = new Directory(this);
		this.contentUI = new Content(this);		
	}

	// initializeation
	init() {
		var me = this;

		// html of the whole corpus: default - dir/meta close
		var html = `<div class="corpus-col target" name="${ this.name }">
						<div class="corpus-title bold">
							<span class="corpus-name">${ this.name }</span>
							<span class="dir-btn">
								<i class="fa fa-folder" aria-hidden="true"></i>
								<i class="fa fa-folder-open" aria-hidden="true"></i>
							</span>
						</div>
						<div class="corpus-dir" style="display: none;"></div>
						<div class="corpus-content"></div>
					</div>`;

		// display
		$(this.parent.ui).append(html);
		this.ui = $(this.parent.ui).children().last();

		// onclick - folder icon: toggle directory block
		$(this.ui).find('.dir-btn').click(function(event) {
			me.toggleDir(event.target);
		});
	}

	// initialize corpus data
	// data: array(Document-docuxmlParser.js), documents of parsed xml
	// aligntypes: array(string), align types that including in added corpus
	setData(data, aligntypes) {
		var me = this;
		var count = 0;
		this.aligntypes = aligntypes;

		// data process - each document
		data.forEach(doc => {

			// data obj
			var obj = new MyDocument(doc, aligntypes, this.pages.length-1);		// data.js
			this.documents[doc.filename] = obj;

			// assign to page
			this.pages.last().push(doc.filename);

			// accumulate charactor counter and create another page if charactor count over this number
			count += obj.stamp;
			if (count > this.pageSize) {
				this.pages.push([]);
				count = 0;
			}

			// display document in directory
			this.dirUI.addEntry(doc.filename, doc.filename);
		});

		// remove empty page
		if (this.pages.last().length <= 0) this.pages.pop();

		// display default page
		this.nowPage = [0, 1, 2];
		this.displayAllPage();
	}

	// * * * * * * * * * * * * * * * * control board * * * * * * * * * * * * * * * * *

	// toggle ui of this corpus
	toggle() {
		$(this.ui).toggleClass('target');
	}

	// delete this corpus
	delete() {
		$(this.ui).remove();
	}

	// * * * * * * * * * * * * * * * * directory * * * * * * * * * * * * * * * * *

	// toggle ui of directory block of this corpus
	// span: DOM, ui of toggle-dir-btn
	toggleDir(span) {
		var me = this;
		var open = $(span).hasClass('open');

		// icon
		$(span).toggleClass('open');

		// dir block
		this.dirUI.toggle();
	}

	// check if block is in window now and then jump
	// mode: string, doc or para
	// filename: string, name of target document
	// index: string, (if mode is text) xth text block in document
	jumpToBlock(mode, filename, index) {
		var intf = this.parent.mode;

		// variables and check intf
		if (intf === 'align') {
			var page = this.documents[filename].page;
			var nowPage = this.nowPage;
			var pageNum = this.pages.length;
		} else if (intf === 'search') {
			var page = this.searchResult[filename].page;
			var nowPage = this.searchNowPage;
			var pageNum = this.searchPages.length;
		} else {
			console.log('invalid intf:', intf);
			return;
		}

		// target page must in the middle of content
		if (page !== nowPage[1]) {
			let newPage = [];

			// new pages
			if (page === 0) newPage = [0, 1, 2];
			else if (page === pageNum-1) newPage = [page-2, page-1, page];
			else newPage = [page-1, page, page+1];

			// doc at prev
			if (newPage[1] < nowPage[1]) {
				let diff = nowPage[1] - newPage[1];

				if (diff === 1) this.prevPage();

				else if (diff === 2) {
					this.displayPage(newPage[1], 'front');
					this.displayPage(newPage[0], 'front');
					this.deletePage(nowPage[1]);
					this.deletePage(nowPage[2]);
					nowPage.update(newPage);

				} else {
					nowPage.update(newPage);
					this.displayAllPage();
				}

			// doc at next
			} else if (newPage[1] > nowPage[1]) {
				let diff = newPage[1] - nowPage[1];

				if (diff === 1) this.nextPage();

				else if (diff === 2) {
					this.displayPage(newPage[1], 'back');
					this.displayPage(newPage[2], 'back');
					this.deletePage(nowPage[0]);
					this.deletePage(nowPage[1]);
					nowPage.update(newPage);

				} else {
					nowPage.update(newPage);
					this.displayAllPage();
				}

			} // else: don't need to change page
		}

		// jump
		this.contentUI.jumpToBlock(mode, filename, index);
	}

	// * * * * * * * * * * * * * * * * display * * * * * * * * * * * * * * * * *

	// display all blocks of now pages on window
	displayAllPage() {
		var intf = this.parent.mode;

		// variables and check intf
		if (intf === 'align') {
			var nowPage = this.nowPage;
			var pageNum = this.pages.length;
		} else if (intf === 'search') {
			var nowPage = this.searchNowPage;
			var pageNum = this.searchPages.length;
		} else {
			console.log('invalid intf (align, search):', intf);
			return;
		}

		// reset
		this.contentUI.reset();

		// display
		nowPage.forEach(page => { 
			if (page >= 0 && page < pageNum) this.displayPage(page, 'back'); 
		});
	}

	// display blocks of specific page on window
	// page: int, page number
	// mode: string, display back or front
	displayPage(page, mode) {
		var intf = this.parent.mode;

		// variables and check intf
		if (intf === 'align') {
			var list = this.pages[page];
			var data = this.documents;
		} else if (intf === 'search') {
			var list = this.searchPages[page];
			var data = this.searchResult;
		} else {
			console.log('invalid intf (align, search):', intf);
			return;
		}

		// block order
		if (mode === 'front') list = list.slice().reverse();

		// add blocks
		list.forEach(filename => { 
			let isAlign = (intf === 'align') ?(this.aligned.doc.indexOf(filename) >= 0) :false;
			this.contentUI.addDocument(filename, data[filename], mode, isAlign);
		});

		// tooltip
		if (intf === 'align') this.contentUI.setMetaTooltip();
	}

	// delete blocks of specific page from window
	// page: int, page number
	deletePage(page) {
		var list = (this.parent.mode === 'align') ?this.pages[page] :this.searchPages[page];
		list.forEach(filename => {
			this.contentUI.deleteDocument(filename);
		});
	}

	// switch to previous page
	prevPage() {
		var intf = this.parent.mode;

		// variables and check intf
		if (intf === 'align') var nowPage = this.nowPage;
		else if (intf === 'search') var nowPage = this.searchNowPage;
		else {
			console.log('invalid intf (align, search):', intf);
			return;
		}

		// top
		if (nowPage[0] <= 0) return;

		// new pages
		nowPage.update(nowPage.map(page => page - 1));

		// display
		this.displayPage(nowPage[0], 'front');
		this.deletePage(nowPage[2] + 1);
	}

	// switch to next page
	nextPage() {
		var intf = this.parent.mode;

		// variables and check intf
		if (intf === 'align') {
			var pages = this.pages.length;
			var nowPage = this.nowPage;
		} else if (intf === 'search') {
			var pages = this.searchPages.length;
			var nowPage = this.searchNowPage;
		} else {
			console.log('invalid intf (align, search):', intf);
			return;
		}

		// bottom
		if (nowPage[2] >= pages-1) return;

		// new pages
		nowPage.update(nowPage.map(page => page + 1));

		// display
		this.displayPage(nowPage[2], 'back');
		this.deletePage(nowPage[0] - 1);
	}

	// * * * * * * * * * * * * * * * * align * * * * * * * * * * * * * * * * *

	// aligning
	// param: object, clicked information
	//  - mode: string, doc or para
	//  - filename: string, name of clicked document
	//  - clicked: DOM, ui of clicked block
	align(param) {
		var name = this.name;
		var target = this.parent.target;

		// check mode
		if (param.mode !== 'doc' && param.mode !== 'para') {
			console.log('invalid mode (doc, para):', param.mode);
			return;
		}
		
		// variable of each mode
		if (param.mode === 'para') {
			var targetKey = $(param.clicked).attr('data-key');
			var info = targetKey.split('>>');			
		}

		// functions for range aligning
		var isRange = function(str) { return str.match(/\[.+,.+\]/) !== null; };
		var parseRange = function(str) { 
			let a = parseFloat(str.substring(str.indexOf('[')+1, str.indexOf(',')).trim()); 
			let b = parseFloat(str.substring(str.indexOf(',')+1, str.indexOf(']')).trim());
			return [ Math.min(a, b), Math.max(a, b)];
		};
		var mapped = function(A, B) {
			let a = parseRange(A);
			let b = parseRange(B);
			if (a[1] < b[0] || b[1] < a[0]) return false;
			else return true;
		}

		// red - find next reading target
		if ($(param.clicked).hasClass('read')) {
			$.each(this.parent.corpora, function() {

				// clicked corpus
				if (this.name === name) return true;	// continue

				// other corpus
				let index = (this.aligned[param.mode].indexOf(this.read[param.mode]) + 1) % this.aligned[param.mode].length;
				this.read[param.mode] = this.aligned[param.mode][index];
			});

		// green - change reading target
		} else if ($(param.clicked).hasClass('target')) {
			this.read[param.mode] = (param.mode === 'doc') ?param.filename :targetKey;

		// blue - search all aligned title blocks
		} else {

			// variable and function of each mode
			if (param.mode === 'doc') var targetMeta = this.documents[param.filename].metadata[target.metadata];
			else if (param.mode === 'para') var targetID = this.documents[info[0]].content[info[1]][info[2]].RefId;

			// do in each corpus
			$.each(this.parent.corpora, function() {
				this.aligned[param.mode] = [];

				// align target
				for (let filename in this.documents) {

					// align by document
					if (param.mode === 'doc') {
						if (this.documents[filename].metadata[target.metadata] === targetMeta) this.aligned.doc.push(filename);
					
					// align by paragraph
					} else if (param.mode === 'para') {
						this.documents[filename].content[target.aligntype].forEach(block => {
							let flag = false;

							// each id
							for (let i = 0; i < block.RefId.length; i++) {
								let id = block.RefId[i];

								// anchor
								if (targetID.indexOf(id) >= 0) {
									this.aligned.para.push(block.Key);
									flag = true;

								// range
								} else if (isRange(id)) {									
									targetID.forEach(tid => {
										if (!flag && isRange(tid) && mapped(id, tid)) {
											this.aligned.para.push(block.Key);
											flag = true;
										} 
									});
								}

								// aligned
								if (flag) break;
							}
						});
					}
				}

				// read target
				let read = (param.mode === 'doc') ?param.filename :targetKey;
				this.read[param.mode] = (this.name === name) ?read :this.aligned[param.mode][0];
			});
		}

		// jump to read and highlight
		$.each(this.parent.corpora, function() {

			// have aligned
			if (this.aligned[param.mode].length > 0) {
				let info = (param.mode === 'para') ?this.read.para.split('>>') :[];
				let filename = (param.mode === 'doc') ?this.read.doc :info[0];
				let index = (param.mode === 'doc') ?undefined :info[2];
				this.jumpToBlock(param.mode, filename, index);
				this.contentUI.colorBlocks(param.mode);

			// no aligned target
			} else this.contentUI.resetBlockColor();
		});
	}

	// * * * * * * * * * * * * * * * * search * * * * * * * * * * * * * * * * *

	// search blocks that contain query in this corpus
	// query: string, search target
	search(query) {
		if (query === '') return

		var re = new RegExp(query, 'g');
		var aligntype = this.parent.target.aligntype;

		// search result and analysis
		this.searchResult = {};
		this.searchPages = [[]];
		var num = 0;
		var count = 0;

		// reset directory
		this.dirUI.reset();

		// search each document
		for (let filename in this.documents) {
			let result = [];
			let matchNum = 0;

			// search each block in document
			this.documents[filename].content[aligntype].forEach(block => {
				let match = block.text.match(re)

				// find query
				if (match !== null) {

					// analysis
					let text = block.text.processText().replaceTag().processNewLine().replace(re, `<span class="searched">${ query }</span>`);
					count += text.length;
					matchNum += match.length;
					num += match.length;

					// push result
					result.push({
						text: text,
						RefId: [],
						Term: block.Term,
						Key: block.Key,
						search: true
					});
				}
			});

			// have query in this document
			if (result.length > 0) {

				// record result
				const getText = getTextFunc(_lang)
				this.searchPages.last().push(filename);
				this.searchResult[filename] = {
					content: result,
					page: this.searchPages.length-1,
					metadata: {
						[getText('searchCount')]: matchNum,
						[getText('searchParagraphCount')]: result.length
					},
					title: {
						'檔名': filename,
						'文件標題': this.documents[filename].metadata['文件標題'],
					}
				}

				// check if charactor count over a page limit
				if (count > this.pageSize) {
					this.searchPages.push([]);
					count = 0;
				}

				// display document in directory
				this.dirUI.addEntry(`${ filename } (${ matchNum })`, filename);
			}
		}

		// remove empty page
		if (this.searchPages.last().length <= 0) this.searchPages.pop();

		// display search result
		this.searchNowPage = [0, 1, 2];
		this.displayAllPage();
		$(this.ui).find('.corpus-name').html(`${ this.name } (${ num })`);
	}

	// reset search result
	resetSearch() {

		// title
		$(this.ui).find('.corpus-name').html(this.name);

		// directory
		this.dirUI.reset();
		for (let filename in this.documents) this.dirUI.addEntry(filename, filename);

		// content
		this.contentUI.reset();
		this.displayAllPage();
	}

	// clear search result and show align interface
	// key: string, position of align target
	backToAlign(key) {
		var info = key.split('>>');

		// align interface
		this.parent.resetSearch();
		this.jumpToBlock('para', info[0], info[2]);

		// align
		this.align({
			mode: 'para',
			filename: info[0],
			clicked: this.contentUI.textBlocks[info[0]][info[2]].ui
		});
	}
}


// controller of main block
class Main {

	// ui: DOM, UI of main block
	// mode: string, record which mode user is, align or search
	// query: string, cache the search query
	// corpora: object, record each corpus's controller [corpusname: corpus controller(Corpus)]
	// target: object, active settings [item: active name(string)]
	constructor() {
		this.ui = $('main');
		this.mode = 'align';
		this.query = '';
		this.corpora = {};
		this.target = {
			metadata: undefined,
			aligntype: undefined,
			titleDisplay: undefined,
		};
	}

	// * * * * * * * * * * * * * * * * data * * * * * * * * * * * * * * * * *

	// add a new corpus to main UI
	// name: string, name of added corpus
	addCorpus(name) {
		this.corpora[name] = new Corpus(this, name);
		this.setColumn();
	}

	// set data for corpus
	// name: string, name of set corpus
	// data: array(Document-docuxmlParser.js), documents of parsed xml
	// aligntypes: array(string), align types that including in added corpus
	// target: object, active metadata and aligntype
	setCorpusData(name, data, aligntypes, target) {
		this.target = target;
		this.corpora[name].setData(data, aligntypes);
	}

	// delete a corpus in main UI
	// name: string, name of deleted corpus
	// target: object, active settings [item: active name(string)]
	deleteCorpus(name, target) {
		this.corpora[name].delete();
		this.setColumn();
		this.activateMetadata(target.metadata);
		this.activateAligntype(target.aligntype);
		this.activateTitleDisplay(target.titleDisplay);
		delete this.corpora[name];
		if (Object.keys(this.corpora).length === 0) {
			$('body').css('background-color', '');
		}
	}

	// * * * * * * * * * * * * * * * * interaction * * * * * * * * * * * * * * * * *

	// clear all color of align blocks
	resetAlign() {
		$.each(this.corpora, function() {
			this.contentUI.resetBlockColor();
		});
	}

	// toggle a corpus in main UI
	// name: string, name of toggled corpus
	toggleCorpus(name) {
		this.corpora[name].toggle();
		this.setColumn();
	}

	// change active metadata
	// name: string, name of active metadata
	activateMetadata(name) {
		this.target.metadata = name;
		if (this.mode === 'align') {
			$(this.ui).find('.meta-row.table-warning').removeClass('table-warning');
			$(this.ui).find(`.meta-row[key="${ name }"]`).addClass('table-warning');
			$.each(this.corpora, function() {
				this.contentUI.setMetaTooltip(name);
			});
		}
	}

	// change active align type
	// name: string, name of active align type
	activateAligntype(name) {
		var me = this;
		this.target.aligntype = name;

		// each corpus
		$.each(this.corpora, function() {

			// align mode: change display
			if (me.mode === 'align') {
				let aligntype = (this.aligntypes.indexOf(name) < 0) ?'FullText' :name;
				this.contentUI.changeToAligntype(aligntype);

			// search mode: search in active align type
			} else if (me.mode === 'search') {
				this.search(me.query);
			}
		});
	}

	// change active title display metadata
	// titleDisplay: string, name of active title display metadata
	activateTitleDisplay(titleDisplay) {
		this.target.titleDisplay = titleDisplay;

		// each corpus
		Object.values(this.corpora).forEach(corpus => {
			const data = corpus.documents
			// each title block
			Object.entries(corpus.contentUI.titleBlocks).forEach(([filename, titleBlock]) => {
				const title = titleDisplay === '檔名' ? filename : data[filename].metadata[titleDisplay]
				titleBlock.changeTitle(title)
			})
		})
	}

	// search blocks that contain query
	// query: string, search target
	search(query) {
		this.mode = 'search';
		this.query = query;
		$.each(this.corpora, function() {
			this.search(query);
		});
	}

	// reset search result
	resetSearch() {
		if (this.mode === 'align') return;

		// search -> align
		this.mode = 'align';
		$.each(this.corpora, function() {
			this.resetSearch();
		});
	}

	// * * * * * * * * * * * * * * * * display * * * * * * * * * * * * * * * * *

	// adjust column number of main block
	setColumn() {
		var visibleCount = $(this.ui).find('.corpus-col.target').length;
		$(this.ui).css('grid-template-columns', `repeat(${ visibleCount }, 1fr)`);
		$('body').css('background-color', 'var(--color--blue-darker)');
	}
}



