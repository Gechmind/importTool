var xlsx = require("node-xlsx");
var basePromise = require("../lib/basePromise");
var async = require("async");
var fs = require('fs');
var path = require("path");

// var worksheet = xlsx.parse("./data/category.xlsx");
var brandJson = new Array();

var categoryCodeJson = new Array();
var attributeJson = new Array();
var categoryJson = new Array();


function getExcelObj(config){
	var dir = path.join(config.rootPath,config.excel.name || "./data/mp.xlsx");
	// var  fileName = config.fileName;
	// var dataRootPath = config.dataRootPath;
	var excel = xlsx.parse(fs.readFileSync(dir));

	// console.log(excel);
	// var rawDataConfig =  config.rawDataConfig || 
	let brandIndex = config.excel.brandColumn;
	let cateIndex = config.excel.categoryCodeColumn;
	let attIndex = config.excel.attributeColumn;
	//excelSheet
	for(let sheet  of excel){
		let name = sheet.name;
		if(name == config.excel.mpSheet){
			// sheetData
			for(let i in sheet.data){
				// console.log(row)
				if(i > 0){
					let row = sheet.data[i];
					brandJson.push(row[brandIndex]);
					categoryCodeJson.push(row[cateIndex]);
					attributeJson.push(JSON.parse(row[attIndex]));
				}
				
			}
		}else if(name == config.excel.cateSheet){

			categoryJson = sheet.data;
			categoryJson.shift();
			// console.log(categoryJson)
		}
		// let config = rawDataConfig[name]
	}
}




exports.start = function(config,category){
	getExcelObj(config);

	// return Promise.all({
	// 	brand:function(callback){
	// 		return basePromise.fileWrite("./data/brand.json",JSON.stringify(brandJson))
	// 		// .then(value =>{console.log(`--${value}`),callback(null,"success")})
	// 	},
	// 	categoryCode:function(callback){
	// 		return basePromise.fileWrite("./data/categoryCode.json",JSON.stringify(categoryCodeJson))
	// 		// .then(value=>{console.log(`--${value}`),callback(null,"success")})
	// 	},
	// 	category:function(callback){
	// 		return basePromise.fileWrite("./data/category.json",JSON.stringify(categoryJson))
	// 		// .then(value=>{console.log(`--${value}`),callback(null,"success")})
	// 	},
	// 	attribute:function(callback){
	// 		 return basePromise.fileWrite("./data/attribute.json",JSON.stringify(attributeJson))
	// 		// .then(value=>{console.log(`--${value}`),callback(null,"success")})
	// 	}
	// }).then((err,values)=>{
	// 	if(err){
	// 		console.log(err);
	// 	}
	// 	console.log(result);
	// 	return Promise.resolve("raw json file prepare done");
	// })
	console.log(config.splitSymbol);
	console.log("raw json file prepare start");
	return Promise.all([
		 basePromise.fileWrite(path.join(config.rootPath,"./data/brand.json"),JSON.stringify(brandJson)),
		 basePromise.fileWrite(path.join(config.rootPath,"./data/categoryCode.json"),JSON.stringify(categoryCodeJson)),
		 basePromise.fileWrite(path.join(config.rootPath,"./data/category.json"),JSON.stringify(categoryJson)),
	     basePromise.fileWrite(path.join(config.rootPath,"./data/attribute.json"),JSON.stringify(attributeJson))
	]).then((values,err)=>{
		if(err){
			console.log(err);
		}
		basePromise.printAll(values);
		return Promise.resolve("raw json file prepare done");
	})
}

// this.writeJsonFile()
