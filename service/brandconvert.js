var mysql = require("mysql");
var fs = require("fs");
var path = require("path");
var Promise = require("bluebird");
var basePromise = require("../lib/basePromise");

function getBrandMap(config){
	var mappingJson = JSON.parse(fs.readFileSync(path.join(config.rootPath,"./mapping/brandMapping.json")));
	var map = new Map();
	for(let relation of mappingJson){
		map.set(relation[0],relation[1]);
	}
	return map
}

exports.getBrandMap = getBrandMap;

exports.start =  function(config){
	console.log(config.splitSymbol);
	console.log("brandConvert start");

	var dir = path.join(config.rootPath,config.brand || "./data/brand.json");
	var brandJson = JSON.parse(fs.readFileSync(dir));

	

	var brandIdString = "";
	var brandIdArray = new Array();
	var map = getBrandMap(config)

	for(let brandName of brandJson){
		let id = map.get(brandName);
		if(!id){
			//打印在类目表中找不到数据的brand名称
			console.log(brandName);
		}
		brandIdString += id + "\n";
		brandIdArray.push(id);
	}

	return basePromise.fileWrite(path.join(config.rootPath,"./data/brandId.json"),JSON.stringify(brandIdArray))
	.then(function(value){
		console.log(`--${value}`);
		return basePromise.fileWrite(path.join(config.rootPath,"./convert/brand_id_out.txt"), brandIdString);
	}).then(function(value){
		console.log(`--${value}`);
		return  Promise.resolve("brandConvert end");
	})
	// fs.writeFile(path.join(__dirname,"./data/brandId.json"),JSON.stringify(brandIdArray));
	// fs.writeFile(path.join(__dirname,"./convert/brand_id_out.txt"), brandIdString);
}


