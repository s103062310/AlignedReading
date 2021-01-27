/* * * * * * * * * * * * * * * * * * * * * * * * * * *
	This file defined classes that parse DocuXML.	
 * * * * * * * * * * * * * * * * * * * * * * * * * * */


// remove special charactor in start or end position of string
// char: string, charactor that want to trim
// return str, string, trimmed String
String.prototype.trim = function(char) {
	
	// trim user defined char
	if (char) return this.replace(new RegExp(`^[\\${ char }]+|[\\${ char }]+$`, 'g'), '');

	// trim space left and right
	else return this.replace(/^\s+|\s+$/g, '');
};


// replace tags in string
// tagName: string, tag that want to replace/remove
// replaceStr: string, replace to this string
// return str, string, replaced string
String.prototype.replaceTag = function(tagName, replaceStr) {
	var str = (replaceStr) ?replaceStr :'';

	// specific tag
	if (tagName) return this.replace(new RegExp(`<[\s\/]*?${ tagName }.*?>`, 'g'), str);

	// all tag
	else return this.replace(/<\/?.+?\/?>/g, str);
}


// extract information from xml tag, e.g. '<...>'
// return info: object, parsed tag information [tagname/attrname: value(string)]
String.prototype.parseTag = function() {
	var info = {};

	// parsing
	this.replace(/[<>]/g, '').trim('/\s').split(/\s+/g).forEach((str, i) => {
		if (i === 0) info['tagName'] = str;
		else {
			let entry = str.split('=');
			info[entry[0].trim()] = entry[1].trim('"');
		}
	});

	return info;
}


// data structure of a document in DocuXML
class Document {

	constructor() {
		this.filename = '';
		this.corpus = '';
		this.metadata = [];
		this.udefmetadata = [];
		this.otherdata = [];
		this.metatags = [];
		this.comments = [];
		this.events = [];
		this.content = '';
	}

	setMetadata(name, zhname, value) {
		this.metadata.push({
			name: name,
			zhname: zhname,
			value: value
		});
	}

	setUdefMetadata(name, value, link) {
		this.udefmetadata.push({
			name: name,
			value: value,
			link: link
		});
	}

	setOtherData(name, value) {
		this.otherdata.push({
			name: name,
			value: value
		});
	}

	setMetaTag(name, value) {
		this.metatags.push({
			name: name,
			value: value
		});
	}

	addCommentEntry() {
		this.comments.push([]);
		return this.comments.length - 1;
	}

	setCommentItem(index, category, value) {
		this.comments[index].push({
			Category: category,
			value: value
		});
	}

	addEventsEntry() {
		this.events.push([]);
		return this.events.length - 1;
	}

	setEvent(index, title, value) {
		this.events[index].push({
			Title: title,
			value: value
		});
	}

	setDocContent(content) {
		this.content = content;
	}
}


// parse DocuXML data
class DocuxmlParser {

	// meta: object, converter, uniform metadata name from everywhere
	constructor() {
		this.meta = {
			"meta2zh": {
				"corpus":					"文獻集名稱", 
				"filename":					"檔名", 
				"title":					"文件標題", 
				"author":					"文件作者", 
				"book_code":				"文件書碼", 
				"compilation_name":			"文件出處", 
				"compilation_order":		"文件出處的次序", 
				"compilation_vol":			"文件出處的冊數", 
				"doc_attachment":			"文件圖檔", 
				"doc_attachment_captions":	"圖說",
				"doc_category_l1":			"文件分類階層一", 
				"doc_category_l2":			"文件分類階層二", 
				"doc_category_l3":			"文件分類階層三", 
				"doc_seq_number":			"文件順序", 
				"doc_source":				"文件來源", 
				"doc_topic_l1":				"文件主題階層一", 
				"doc_topic_l2":				"文件主題階層二", 
				"doc_topic_l3":				"文件主題階層三",
				"docclass":					"文件類別", 
				"docclass_aux":				"文件子類別", 
				"doctype":					"文件型態", 
				"doctype_aux":				"文件子型態",  
				"geo_level1":				"文件地域階層一", 
				"geo_level2":				"文件地域階層二", 
				"geo_level3":				"文件地域階層三", 
				"geo_longitude":			"文件所在經度", 
				"geo_latitude":				"文件所在緯度", 
				"time_orig_str": 			"文件時間(字串)", 
				"time_varchar":				"文件時間(西曆)", 
				"year_for_grouping":		"文件時間(西元年)",
				"time_norm_year":			"文件時間(中曆)", 
				"time_dynasty":				"文件時間(朝代)", 
				"era": 						"文件時間(年號)", 
				"time_norm_kmark": 			"文件時間(帝號)", 
				"timeseq_not_before":		"文件起始時間", 
				"timeseq_not_after":		"文件結束時間"
			},

			"sky2meta": {
				"corpus":					"corpus", 
				"docFilename":				"filename", 
				"docTitleXml":				"title", 
				"docAuthor":				"author", 
				"docBookCode":				"book_code", 
				"docCompilation":			"compilation_name", 
				"docAttachmentList":		"doc_attachment", 
				"docAttachmentCaptions":	"doc_attachment_captions",
				"docCategoryL1":			"doc_category_l1", 
				"docCategoryL2":			"doc_category_l2", 
				"docCategoryL3":			"doc_category_l3", 
				"docSource":				"doc_source", 
				"docTopicL1":				"doc_topic_l1", 
				"docTopicL2":				"doc_topic_l2", 
				"docTopicL3":				"doc_topic_l3", 
				"docClass":					"docclass", 
				"docSubclass":				"docclass_aux", 
				"docType":					"doctype", 
				"docSubtype":				"doctype_aux", 
				"geoLevel1":				"geo_level1", 
				"geoLevel2":				"geo_level2", 
				"geoLevel3":				"geo_level3", 
				"geoX":						"geo_longitude", 
				"geoY":						"geo_latitude", 
				"dateOrigStr":				"time_orig_str", 
				"dateAdDate":				"time_varchar", 
				"dateAdYear":				"year_for_grouping",
				"dateChNormYear":			"time_norm_year", 
				"dateDynasty":				"time_dynasty", 
				"dateEra":					"era", 
				"dateEmperorTitle":			"time_norm_kmark", 
				"timeseqNotBefore":			"timeseq_not_before", 
				"timeseqNotAfter":			"timeseq_not_after"
			},

			"local2meta": {
				"compilation":				"compilation_name",
				"time_ad_date":				"time_varchar",
				"time_ad_year":				"year_for_grouping",
				"time_era":					"era"
			}
		}
	}

	// * * * * * * * * * * * * * * * * docusky * * * * * * * * * * * * * * * * *

	// process data from docusky database through api
	// docList: array(object), documents data from docusky
	// return data: array(Document), parsed result
	processDocuSkyRowData(docList) {
		var data = [];

		// each document
		docList.forEach(doc => {
			data.push(this.parseDocInfo(doc.docInfo));
		});

		return data;
	}

	// parse data in docInfo object
	// data: object, information of document [item: value(multiple classes)]
	// return docObj: Document, parsed result
	parseDocInfo(data) {
		var docObj = new Document();

		// each info
		for (let item in data) {
			let itemName = (item in this.meta.sky2meta) ?this.meta.sky2meta[item] :item;

			// system defined metadata
			if (itemName in this.meta.meta2zh) docObj.setMetadata(itemName, this.meta.meta2zh[itemName], data[item].replaceTag());

			// metadata of geography and time
			else if (itemName === 'placeInfo' || itemName === 'timeInfo') this.parseObjectMetadata(docObj, data[item]);

			// user defined metadata
			else if (itemName === 'docMetadataXml') this.parseUdefMetadata(docObj, data[item].replaceTag('DocMetadata'));

			// document content
			else if (itemName === 'docContentXml') this.parseDocContent(docObj, data[item]);
			
			// undefined data in docuxml (maybe system used data)
			else docObj.setOtherData(itemName, data[item]);

			// filename and corpus
			if (itemName === 'filename') docObj.filename = data[item].replaceTag();
			if (itemName === 'corpus') docObj.corpus = data[item].replaceTag();
		}

		return docObj;
	}

	// parse metadata in object form
	// docObj: Document, parsed data container
	// data: object, metadata [name: value(string)]
	parseObjectMetadata(docObj, data) {

		// each metadata
		for (let item in data) {
			let itemName = (item in this.meta.sky2meta) ?this.meta.sky2meta[item] :item;

			// system defined metadata
			if (itemName in this.meta.meta2zh) docObj.setMetadata(itemName, this.meta.meta2zh[itemName], data[item]);

			// undefined data in docuxml (maybe system used data)
			else docObj.setOtherData(itemName, data[item]);
		}
	}	

	// * * * * * * * * * * * * * * * * local * * * * * * * * * * * * * * * * *

	// process data from xml file of user uploaded
	// xml: string, docuxml
	// return data: object, parsed result [corpusname: corpus data (array(Document))]
	processXMLRowData(xml) {
		var me = this;
		var data = {};
		var xmlDoc = new DOMParser().parseFromString(xml, 'text/xml');

		// each document
		$(xmlDoc).find('document').each(function() {
			let docObj = me.parseDocument(this);
			if (data[docObj.corpus] === undefined) data[docObj.corpus] = [];
			data[docObj.corpus].push(docObj);
		});

		return data;
	}

	// parse xml in <document>
	// doc: DOM, docuxml of a document
	// return docObj: Document, parsed result
	parseDocument(doc) {
		var me = this;
		var docObj = new Document();

		// filename and corpus
		docObj.filename = $(doc).attr('filename').trim();
		docObj.corpus = $(doc).find('corpus').text().trim();

		// each info
		$(doc).children().each(function() {
			let itemName = (this.tagName in me.meta.local2meta) ?me.meta.local2meta[this.tagName] :this.tagName;
			
			// system defined metadata
			if (itemName in me.meta.meta2zh) docObj.setMetadata(itemName, me.meta.meta2zh[itemName], this.textContent.trim());

			// user defined metadata
			else if (itemName === 'xml_metadata') me.parseUdefMetadata(docObj, this.innerHTML);

			// document content
			else if (itemName === 'doc_content') me.parseDocContent(docObj, this.outerHTML);

			// undefined data in docuxml (maybe system used data)
			else docObj.setOtherData(itemName, this.innerHTML.trim());
		});

		return docObj;
	}

	// * * * * * * * * * * * * * * * * common * * * * * * * * * * * * * * * * *

	// parse user defined metadata
	// docObj: Document, parsed data container
	// data: string, metadata xml
	parseUdefMetadata(docObj, data) {
		var xmlDoc = new DOMParser().parseFromString(data, 'text/xml');

		// each user defined metadata
		$(xmlDoc).children().each(function() {
			let tagName = ((this.tagName.indexOf('Udef_') < 0) ?'Udef_' :'') + this.tagName;
			let value = this.textContent.trim();
			let link = (this.innerHTML.indexOf('href') < 0) ?'' :$(this).find('a').attr('href');
			docObj.setUdefMetadata(tagName, value, link);
		});
	}

	// parse doc_content xml
	// docObj: Document, parsed data container
	// data: string, content xml
	parseDocContent(docObj, data) {
		var xmlDoc = new DOMParser().parseFromString(data, 'text/xml');

		// metatags
		$(xmlDoc).find('MetaTags').each(function() {
			$(this).children().each(function() {
				docObj.setMetaTag(this.tagName, this.textContent.trim());
			});
		});

		// comments
		$(xmlDoc).find('Comment').each(function() {
			let index = docObj.addCommentEntry();
			$(this).children().each(function() {
				docObj.setCommentItem(index, $(this).attr('Category'), this.innerHTML.trim());
			});
		});

		// comments
		$(xmlDoc).find('Events').each(function() {
			let index = docObj.addEventsEntry();
			$(this).children().each(function() {
				docObj.setEvent(index, $(this).attr('Title'), this.innerHTML.trim());
			});
		});

		// document content
		$(xmlDoc).find('MetaTags').remove();
		$(xmlDoc).find('Comment').remove();
		$(xmlDoc).find('Events').remove();
		docObj.setDocContent(new XMLSerializer().serializeToString(xmlDoc).trim());
	}
}


