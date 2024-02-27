/* * * * * * * * * * * * * * * * * * * * * * * * * * *
	This file defined classes of corpus content UI.	
 * * * * * * * * * * * * * * * * * * * * * * * * * * */


// controller of directory block
class Directory {

	// ui: DOM, UI of directory block
	// parent: class Corpus, who creates this
	constructor(parent) {
		this.ui = $(parent.ui).find('.corpus-dir');
		this.parent = parent;
	}

	// toggle this block
	toggle() {
		$(this.ui).slideToggle('fast');
	}

	// clear all directory entry
	reset() {
		$(this.ui).empty();
	}

	// add an entry to this block
	// text: string, text that want to put in entry
	// dstID: string, where to jump to when click
	addEntry(text, dstID) {
		var me = this;

		// display
		$(this.ui).append(`<div class="dir-item">└<span class="dir-name">${ text }</span></div>`);

		// onclick
		$(this.ui).children().last().click(function() {
			me.parent.jumpToBlock('doc', dstID);
		});
	}
}


// controller of title block
class TitleBlock {

	// ui: DOM, UI of title block
	// parent: class Content, who creates this
	constructor(parent, data, target, alignable, isAlign) {
		this.ui = undefined;
		this.parent = parent;
		this.data = data;
		this.init(data, target, alignable, isAlign);
	}

	// initialization
	// data: object, data candidates of title
	// target: object, targets of selection in menu
	// alignable: bool, if this block can be aligned
	// isAlign: bool, if this block is target of aligning
	init(data, target, alignable, isAlign) {
		var me = this;
		const { metadata, titleDisplay } = target

		// html
		var html = `<div class="title-block${ (alignable) ?' alignable' :'' }${ (isAlign) ?' target': '' }"${ (alignable) ?` data-toggle="tooltip" data-placement="top" data-original-title="${ data[metadata] }"` :''}>
						<span class="title-text${ (alignable) ?' align-btn' :'' }">${ data[titleDisplay] }</span>
						<span class="meta-btn">
							<i class="fa fa-angle-double-up" aria-hidden="true"></i>
							<i class="fa fa-angle-double-down" aria-hidden="true"></i>
						</span>
					</div>`;

		// display
		this.ui = this.parent.addBlock(html);
		$(this.ui).tooltip();

		// onclick - align with metadata
		$(this.ui).find('.align-btn').click(function(event) {
			me.parent.parent.align({
				mode: 'doc',
				filename: data['檔名'],
				clicked: $(event.target).closest('.title-block')
			});
		});

		// onclick - toggle metadata block
		$(this.ui).find('.meta-btn').click(function() {
			me.parent.toggleMeta(data['檔名']);
		});
	}

	// change displayed title
	// title: string, title of this block
	changeTitle(title) {
		$(this.ui).find('.title-text').html(title)
	}

	// delete this block
	delete() {
		$(this.ui).remove();
	}
}


// controller of metadata block
class MetaBlock {

	// ui: DOM, UI of metadata block
	// parent: class Content, who creates this
	constructor(parent, metadata, linkMeta, target) {
		this.ui = undefined;
		this.parent = parent;
		this.init(metadata, linkMeta, target);
	}

	// initialization
	// metadata: object, metadata list [name: value(string)]
	// linkMeta: object, names and links of metadata that have link [metadata: link(string)]
	// target: string, active metadata
	init(metadata, linkMeta, target) {
		var me = this;
		var table = '';

		// metadata table
		for (let name in metadata) {
			let value = (linkMeta[name] !== undefined) 
				? `<a href="${ linkMeta[name] }" target="_blank">${ metadata[name] }</a>`
				: metadata[name];
			table += `<div class="meta-row" key="${ name }">
						<span class="meta-name">${ name }</span>
						<span>${ value }</span>
					</div>`;
		}

		// html
		var html = `<div class="meta-block" style="display: none;">
						<div class="meta-table">
							${ table }
						</div>
					</div>`;

		// display
		this.ui = this.parent.addBlock(html);

		// activate target metadata
		$(this.ui).find(`.meta-row[key="${ target }"]`).addClass('table-warning');
	}

	// delete this block
	delete() {
		$(this.ui).remove();
	}
}


// controller of text block
class TextBlock {

	// ui: DOM, UI of text block
	// parent: class Content, who creates this 
	constructor(parent, data, ui) {
		this.ui = undefined;
		this.parent = parent;
		this.init(data, ui);
	}

	// initialization
	// data: object, block information
	//  - text: string, full and pure text
	//  - RefId: array(string), align used id
	//  - Term: array(string), tag (short description) of this block
	//  - Key: array(string), unique id of this block
	//  - search: bool, if this data is search result
	// ui: DOM, where new block will append to
	init(data, ui) {
		var me = this;

		// refId
		var id = data.RefId.join(', ');

		// label of term
		var label = '';
		data.Term.forEach(term => {
			label += `<span class="bg-warning bold">${ term }</span>`;
		});

		// html
		var html = `<div class="text-block${ (id !== '' || data.search) ?' alignable' :'' }"${ (data.Key !== '') ?` data-key="${ data.Key }"` :'' }${ (id !== '') ?` data-toggle="tooltip" data-placement="top" data-original-title="${ id }"` :'' }>
						${ (label !== '')  	?`<div class="term-in-text">${ label }</div>` :'' }
						<div>${ data.text }</div>
					</div>`;

		// display
		this.ui = this.parent.addBlock(html, ui);
		if (id !== '') $(this.ui).tooltip();

		// onclick - align with refid
		$(this.ui).click(function(event) {

			// search
			if (data.search) {
				me.parent.parent.backToAlign($(event.target).closest('.text-block').attr('data-key'));

			// align
			} else if (id !== '') {
				me.parent.parent.align({
					mode: 'para',
					clicked: $(event.target).closest('.text-block')
				});
			}
		});
	}

	// delete this block
	delete() {
		$(this.ui).remove();
	}
}


// controller of content ui in class Corpus
class Content {

	// ui: DOM, UI of content block
	// parent: class Corpus(ui-main.js), who creates this 
	// titleBlocks: object, all title blocks on window now [filename: title block controller(TitleBlock)]
	// metaBlocks: object, all metadata blocks on window now [filename: metadata block controller(MetaBlock)]
	// textBlocks: object, all text blocks on window now [filename: text block controller(TextBlock)]
	// pos: int, position of scrolled content
	constructor(parent) {
		this.ui = $(parent.ui).find('.corpus-content');
		this.parent = parent;
		this.titleBlocks = {};
		this.metaBlocks = {};
		this.textBlocks = {};
		this.mode = '';

		// scroll
		this.pos = 0;
		this.auto = false;
		this.init();
	}

	// initialization
	init() {
		var me = this;

		// scroll
		$(this.ui).scroll(function() {
			if (!me.auto) {
				var now = $(this).scrollTop();

				// scroll up
				if (me.pos > now) {
					if (now < $(me.ui).height()) me.parent.prevPage();

				// scroll down
				} else if (me.pos < now) {
					if ($(me.ui).children().last().offset().top < $(window).height() * 2) me.parent.nextPage();
				}

				// update
				me.pos = now;
			}
		});
	}

	// clear all blocks
	reset() {
		this.titleBlocks = {};
		this.metaBlocks = {};
		this.textBlocks = {};
		$(this.ui).empty();
		$(this.ui).scrollTop(0);
	}

	// * * * * * * * * * * * * * * * * data * * * * * * * * * * * * * * * * *

	// add a block to content ui
	// html: string, html of block
	// ui: DOM, where new block will append to
	// return ui: DOM, UI of added block
	addBlock(html, ui) {

		// add after
		if (this.mode === 'back') {
			$(this.ui).append(html);
			return $(this.ui).children().last();

		// add before
		} else if (this.mode === 'front') {
			$(this.ui).prepend(html);
			return $(this.ui).children().first();

		// add after ui
		} else if (this.mode === 'after') {
			$(ui).after(html);
			return $(ui).next();

		// error
		} else {
			console.log('invalid mode (back, front, after):', this.mode);
			return undefined;
		}
	}

	// add blocks of a document to content ui
	// filename: string, name of document
	// data: MyDocument(data.js)/object(MyDocument liked data structure), parsed document data
	// mode: string, add back, front or after
	// isAlign: bool, if this block is target of aligning
	addDocument(filename, data, mode, isAlign) {
		this.mode = mode;
		var me = this;
		var intf = this.parent.parent.mode;
		var target = this.parent.parent.target;

		// variables and check align
		if (intf === 'align') {
			var aligntype = (target.aligntype in data.content) ?target.aligntype :'FullText';
			var blockList = data.content[aligntype];
			var alignable = true;
			var linkMeta = data.linkMeta;
			var targetMeta = target.metadata;
		} else if (intf === 'search') {
			var blockList = data.content;
			var alignable = false;
			var linkMeta = {};
			var targetMeta = undefined;
		} else {
			console.log('invalid intf (align, search):', intf);
			return;
		}

		// functions
		var addTitleBlock = function() { me.titleBlocks[filename] = new TitleBlock(me, data.metadata || data.title, target, alignable, isAlign); };
		var addMetaBlock = function() { me.metaBlocks[filename] = new MetaBlock(me, data.metadata, linkMeta, targetMeta); };

		// create file container
		if (this.textBlocks[filename] === undefined) this.textBlocks[filename] = [];

		// append at back
		if (mode === 'back') {
			addTitleBlock();
			addMetaBlock();
			blockList.forEach(entry => { 
				this.textBlocks[filename].push(new TextBlock(this, entry)); 
			});

		// append at front
		} else if (mode === 'front') {
			blockList.slice().reverse().forEach(entry => { 
				this.textBlocks[filename].unshift(new TextBlock(this, entry));  
			});
			addMetaBlock();
			addTitleBlock();

		// error
		} else console.log('invalid mode (back, front):', mode);
	}

	// delete blocks of a document in content ui
	// filename: string, name of document
	deleteDocument(filename) {

		// title block
		this.titleBlocks[filename].delete();
		delete this.titleBlocks[filename];

		// metadata block
		this.metaBlocks[filename].delete();
		delete this.metaBlocks[filename];

		// text block
		this.textBlocks[filename].forEach(block => {
			block.delete();
		});
		delete this.textBlocks[filename];
	}

	// activate bootstrap tooltip
	// name: string, active metadata name
	setMetaTooltip(name) {
		$.each(this.titleBlocks, function() {
			$(this.ui).attr('data-original-title', this.data[name])
		})
	}

	// * * * * * * * * * * * * * * * * interaction * * * * * * * * * * * * * * * * *

	// jump to position of a block
	// mode: string, doc or para
	// filename: string, name of document
	// index: string, (if mode is text) xth text block in document
	jumpToBlock(mode, filename, index) {
		var me = this;

		// get target
		if (mode === 'doc') var target = this.titleBlocks[filename].ui;
		else if (mode === 'para') var target = this.textBlocks[filename][index].ui;
		else {
			console.log('invalid mode (doc, para):', mode);
			return;
		}

		// scroll
		this.auto = true;
		var now = $(this.ui).scrollTop();
		var offset = $(target).offset().top - $(this.ui).offset().top;
		var height = $(this.ui).height();
		$(this.ui).animate({
			scrollTop: now + offset - height/3
		}, 'fast', function() {
			me.auto = false;
		});
		
		// repeat highlight
		var toggle = function() { $(target).toggleClass('highlight'); }
		var blink = setInterval(toggle, 200);
		setTimeout(function() { clearInterval(blink); }, (mode === 'doc') ?1300 :500);
	}

	// toggle metadata block of a document
	// filename: string, name of document
	toggleMeta(filename) {
		$(this.titleBlocks[filename].ui).find('.meta-btn').toggleClass('open');		// icon
		$(this.metaBlocks[filename].ui).slideToggle('fast');						// metadata block
	}

	// change displayed text block according to align type
	// name: string, active align type
	changeToAligntype(name) {
		this.mode = 'after';

		// delete all text blocks
		this.textBlocks = {};
		$(this.ui).find('.text-block').remove();
		
		// each file on window
		for (let filename in this.metaBlocks) {
			this.textBlocks[filename] = [];
			this.parent.documents[filename].content[name].slice().reverse().forEach(entry => { 
				this.textBlocks[filename].unshift(new TextBlock(this, entry, this.metaBlocks[filename].ui));
			});
		}
	}

	// * * * * * * * * * * * * * * * * display * * * * * * * * * * * * * * * * *

	// clear color of all blocks
	resetBlockColor() {
		$(this.ui).find('.target').removeClass('target');
		$(this.ui).find('.read').removeClass('read');
	}

	// update color of blocks
	// mode: string, doc or para
	colorBlocks(mode) {

		// check mode
		if (mode !== 'doc' && mode !== 'para') {
			console.log('invalid mode (doc, para):', mode);
			return;
		}

		// target blocks
		var blocks = (mode === 'doc') ?this.titleBlocks :this.textBlocks;

		// reset 
		this.resetBlockColor();

		// color align target
		this.parent.aligned[mode].forEach(key => {
			let info = key.split('>>');
			let filename = (mode === 'doc') ?key :info[0];
			if (filename in blocks) {
				let span = (mode === 'doc') ?blocks[filename].ui :blocks[filename][info[2]].ui;
				$(span).addClass('target');
			}
		});

		// color read target
		var readTarget = this.parent.read[mode];
		if (readTarget !== undefined) {
			let info = readTarget.split('>>');
			let span = (mode === 'doc') ?blocks[readTarget].ui :blocks[info[0]][info[2]].ui;
			$(span).addClass('read');
		}
	}
}


