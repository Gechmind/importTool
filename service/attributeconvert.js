var fs = require("fs");
var path = require("path");
var Promise = require("bluebird");
var basePromise = require("../lib/basePromise");
var attrbuteOutString = "";
var attrbuteOutArray = new Array();



function convert(config){
	var attDir = path.join(config.rootPath,config.attribute || './data/attribute.json');
	var brandDir = path.join(config.rootPath,config.brand || './data/brand.json');

	//[{名称-值 : [名称id,键值id]}...]
	var mapping = JSON.parse(fs.readFileSync(path.join(config.rootPath,"./mapping/attributeMapping.json")));
	var attriPairJson = JSON.parse(fs.readFileSync(attDir));
	var brandJson = JSON.parse(fs.readFileSync(brandDir));

	// var attributeWithBrand = ['颜色','尺码']
	var attributeWithBrand = config.attributeWithBrand;
	//键值容器

	var map = new Map();
	for(var keyMap of mapping){
		for(var key in keyMap){
			map.set(key,keyMap[key]);
		}
	}

	//名值对转换  {"颜色":"蓝色","尺码":"4XL"} 装换为 id To id 形式
	for(var index in attriPairJson){
		attributeJson = attriPairJson[index]
		// console.log(attributeJson);
		let obj  = {};
		for(var name in attributeJson){
			
			let searchKey = name + attributeJson[name];
			//属性名拼入品牌
			if(attributeWithBrand.includes(name)){
				searchKey = brandJson[index] + '-'+searchKey;
			}
			// console.log(searchKey);
			let idToId = map.get(searchKey);

			//由于剥离了独立属性，如产地、规格，这里可能会找不到键值.这部分数据键值转换的时候也需要剥离
			if(idToId){
				obj[idToId[0]] = idToId[1];
			}
		}
		attrbuteOutString += JSON.stringify(obj) + '\n';
		attrbuteOutArray.push(obj);
	}
	return attrbuteOutArray;
}


exports.start = function(config){
	console.log(config.splitSymbol);
	console.log("att convert start");
	convert(config)
	// rawJsonToIdJson();
	// fs.writeFile(path.join(__dirname,"./data/attributeIdPair.json"), JSON.stringify(attrbuteOutArray));
	// fs.writeFile(path.join(__dirname,"./convert/attribute_out.txt"), attrbuteOutString);
	return basePromise.fileWrite(path.join(config.rootPath,"./data/attributeIdPair.json"), JSON.stringify(attrbuteOutArray))
					  .then(function(value){
					  	console.log(`--${value}`);
					  	return basePromise.fileWrite(path.join(config.rootPath,"./convert/attribute_out.txt"), attrbuteOutString)
					  					  .then(function(value){
					  					  	console.log(`--${value}`);
					  					  	return Promise.resolve("att convert done");
					  					  })
					  })
	
	
}