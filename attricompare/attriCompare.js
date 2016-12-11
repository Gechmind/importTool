var mysql = require("mysql");
var fs = require("fs");
var path = require("path");
var Promise = require("bluebird");
var iconv = require('iconv-lite');
var  s = iconv.decode(fs.readFileSync('./attributeDb_73.json'),"UTF-8");
var  b = iconv.decode(fs.readFileSync('./attribute_73.json'),"UTF-8")

var attriPairJson = JSON.parse(s);
var attriPairJsonDb = JSON.parse(b);
var newAttr = [];
//预处理，trim()
for(let i in attriPairJsonDb){
	attriPairJsonDb[i] = attriPairJsonDb[i].trim().toUpperCase();
}



for(att in attriPairJson){
	if(!attriPairJsonDb.includes(attriPairJson[att].trim().toUpperCase())){
		newAttr.push(attriPairJson[att].trim().toUpperCase());
	}
}

fs.writeFileSync(__dirname + "/newAttr.json", JSON.stringify(newAttr));