/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	This file defined classes of data used in align reading.	
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */


// get last element of an array
Array.prototype.last = function() {
	return this[this.length-1];
}


// remove last element of an array
Array.prototype.pop = function() {
	this.splice(this.length-1, 1);
}


// remove last element of an array
Array.prototype.update = function(arr) {
	for (let i = 0; i < this.length; i++) this[i] = arr[i];
}


// remove specific tags and convert <br> to \n
String.prototype.processText = function() {
	return this.replaceTag('doc_content')
			   .replaceTag('Content')
			   .replaceTag('Paragraph')
			   .replaceTag('AlignBegin')
			   .replaceTag('AlignEnd')
			   .replaceTag('br', '\n');
}


// convert \n to <br>
String.prototype.processNewLine = function() {
	return this.trim('\n')
			   .replace(/\n/g, '<br>');
}


// data structure of a aligned document
class MyDocument {

	// filename: string, name of document
	// metadata: object, metadata list [name: value(string)]
	// linkMeta: object, names and links of metadata that have link [metadata: link(string)]
	// content: object, content text [align type: array(object: block information)]
	// page: int, which page this document at
	// stamp: int, charactor count of this document, used to assign page
	constructor(data, aligntypes, page) {
		this.filename = data.filename;
		this.metadata = {};
		this.linkMeta = {};
		this.content = {};
		this.page = page;
		this.stamp = 0;
		this.init(data, aligntypes);
	}

	// initialization
	// data: Document(docuxmlParser.js), parsed data
	// aligntypes: array(string), align type list
	init(data, aligntypes) {

		// extract metadata
		var list = data.metadata.concat(data.udefmetadata);
		list.forEach(entry => {

			// record name and value
			let name = (entry.zhname) ?entry.zhname :entry.name;
			let value = (entry.name === 'doc_attachment') ?'點我看圖' :entry.value;
			this.metadata[name] = value;

			// record link
			if (entry.name === 'doc_attachment') this.linkMeta[name] = entry.value;
			if (entry.link !== undefined && entry.link !== '') this.linkMeta[name] = entry.link;
		});

		// align block container
		var temp = {};
		aligntypes.forEach(type => {
			this.content[type] = [];
			if (type !== 'FullText') temp[type] = {
										text: '',
										RefId: [ undefined ],
										Term: [ undefined ],
										Key: [ undefined ]
									};
		});

		// parse text and form align blocks
		this.parseAlignText(data.content, temp);

		// default type, used when cannot find active align type
		this.content['FullText'].push({
			text: data.content.processText().processNewLine(),
			RefId: [],
			Term: [],
			Key: this.filename + '_FullText_0'
		});

		// stamp
		this.stamp = this.content['FullText'][0].text.length;
	}

	// parse align blocks according to align type
	// text: string, xml of doc_content
	// temp: object, temporary container when parsing [align type: block information(object)]
	parseAlignText(text, temp) {
		var me = this;
		var map = {};	// map key and type of blocks that haven't meet ending

		// remove block information that not record in map
		var maintainTemp = function(type) {
			temp[type].Key.forEach((key, i) => {
				if (map[key] === undefined) {
					temp[type].RefId.splice(i, 1);
					temp[type].Term.splice(i, 1);
					temp[type].Key.splice(i, 1);
				}
			});
		};

		// deep copy temp to this.content
		var addContentBlock = function(type, info) {
			let block = {
				text: info.text.processNewLine(),
				RefId: [],
				Term: [],
				Key: me.filename + '>>' + type + '>>' + me.content[type].length
			};

			// filter undefined out of array
			for (let name in info) {
				if (name === 'RefId' || name === 'Term') {
					info[name].forEach(value => {
						if (value !== undefined) block[name].push(value);
					});
				}
			}

			if (block.text !== '') me.content[type].push(block);
		}

		// search align tag
		var alignTag = new RegExp('<[\s\/]*?AlignBegin.+?>|<[\s\/]*?AlignEnd.+?>', 'g');
		var match = alignTag.exec(text);
		if (match === null) return;

		// text before first align tag
		var tagStr = match[0];
		var tagIndex = match.index;
		var tagInfo = tagStr.parseTag();
		var str = text.substring(0, tagIndex).processText();
		for (let t in temp) temp[t].text += str;

		// each align tag
		while ((match = alignTag.exec(text)) !== null) {

			// check tag information
			if (tagInfo.Key === undefined) {
				console.log(`Tag Attribute Error: document "${ this.filename }" at "${ this.tagStr }" doesn't have "Key" attribute.`);
				return;
			}

			// start a new block
			if (tagInfo.tagName === 'AlignBegin') {
				let type = tagInfo.Type;

				// check tag information
				if (type === undefined) {
					console.log(`Tag Attribute Error: document "${ this.filename }" at "${ this.tagStr }" doesn't have "Type" attribute.`);
					return;
				}

				// push finished block
				addContentBlock(type, temp[type]);

				// remove old block information to temp
				maintainTemp(type);

				// add new block information to temp
				temp[type].text = '';
				temp[type].Key.push(tagInfo.Key);
				if (tagInfo.RefId) temp[type].RefId = temp[type].RefId.concat(tagInfo.RefId.split(/;/).map(v => v.trim()).filter(v => Boolean(v)));
				if (tagInfo.Term) temp[type].Term = temp[type].Term.concat(tagInfo.Term.split(/;/).map(v => v.trim()).filter(v => Boolean(v)));

				// record key
				map[tagInfo.Key] = type;

			// find finished block
			} else if (tagInfo.tagName === 'AlignEnd') {
				let type = map[tagInfo.Key];
				
				// push finished block
				addContentBlock(type, temp[type]);

				// delete key record
				delete map[tagInfo.Key];

				// remove old block information to temp
				maintainTemp(type);

				// reset temp to new block
				temp[type].text = '';

			// illegal tag name
			} else {
				console.log(`Tag Name Error: document "${ this.filename }" at "${ tagStr }"`);
				return;
			}

			// text
			str = text.substring(tagIndex, match.index).processText();
			for (let type in temp) temp[type].text += str;

			// update
			tagStr = match[0];
			tagIndex = match.index;
			tagInfo = tagStr.parseTag();
		}

		// text after last align tag (should be AlignEnd, if is AlignBegin, ignore)
		str = text.substring(tagIndex, text.length).processText();
		for (let type in temp) {
			temp[type].text += str;
			addContentBlock(type, temp[type]);		// push finished block
		}
	}
}


