var fs = require("fs");
var path = require("path");
var Promise = require("bluebird");
var basePromise = require("../lib/basePromise");
//[[code -categoryId-name-path]...]


function getCategoryMap(config){
	var mapping = JSON.parse(fs.readFileSync(path.join(config.rootPath,"./mapping/categoryMapping.json")));
	var map = new Map();
	for(let relation of mapping){
		// console.log(relation);
		//选择获取id还是获取path
		if(config.csvMode){
			map.set(relation[0],relation[3]);
		}else{
			map.set(relation[0],relation[1]);
		}
		
		// map.set(relation[2],relation[1]);
	}
	return map;
}

exports.getCategoryMap = getCategoryMap;

exports.start = function(config){
	console.log(config.splitSymbol);
	console.log("categoryCodeConvert start");

	var dir = path.join(config.rootPath,config.rawCategory || "./data/categoryCode.json");
	var productCateCode = JSON.parse(fs.readFileSync(dir));

	var map = getCategoryMap(config);
	

	var categoryString = "";
	var categoryArray = new Array();


	for(let catecode of productCateCode){
		let id = map.get(catecode);
		if(!id){
			//打印在类目表中找不到数据的类目code
			console.log(catecode);
		}
		categoryString += id + "\n";
		categoryArray.push(id);
	}

	// fs.writeFile(path.join(__dirname,"./data/categoryId.json"),JSON.stringify(categoryArray));
	// fs.writeFile(path.join(__dirname,"./convert/pr_cate_out.txt"), categoryString);
	return basePromise.fileWrite(path.join(config.rootPath,"./data/categoryId.json"),JSON.stringify(categoryArray))
				  .then(function(value){
				  	console.log(`--${value}`);
				  	return basePromise.fileWrite(path.join(config.rootPath,"./convert/pr_cate_out.txt"), categoryString)
				  					  .then(function(value){
				  					  	console.log(`--${value}`);
				  					  	return Promise.resolve("categoryCodeConvert done");
				  					  })
				  	})
}