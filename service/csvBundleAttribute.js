var mysql = require("mysql");
var fs = require("fs");
var path = require("path");
var Promise = require("bluebird");
var stringify = require("csv-stringify");
var iconv = require('iconv-lite');
var basePromise = require("../lib/basePromise");

var attributMapping = new Array()
var independenceAttr = ['商品毛重','产地','规格','品牌'];
//需要从attitude中解析的属性，比如 brandId 品牌
var independencefileName  = ['weight','region','standar','brandName'];
var independenceOutput = ['','','',''];

//需要忽略的属性
var avoidHandlerAttr = ['商品名称','商品编号','店铺','货号'];


var config;
var client;

function getAttrtibuteJson(config){
	var dir = path.join(config.rootPath,config.attribute || './data/attribute.json')
	return JSON.parse(fs.readFileSync(dir));
}

// function getAttrtibuteFromDb(config){
// 	var dir = path.join(config.rootPath,config.attribute || './data/attribute.json')
// 	return JSON.parse(fs.readFileSync(dir));
// }

/**
* 对独立属性进行处理,是独立属性则加入对应的属性列，如果不存在则属性列写入空
*/
function independenceAttrExtract(jsonObject){
	// console.log(jsonObject);
	for(let i = 0;i < independenceAttr.length ;i++){
		let  name = independenceAttr[i];
		let  outString = independenceOutput[i];
		if(jsonObject[name]){
			outString  += jsonObject[name] + "\n";
		}else{
			outString  += "" + "\n";
		}
		independenceOutput[i] = outString;
	}
}

/**
* [{attrname:attrvalue,...}...]
* 修改属性存储结构，最多只提取使用排名前15个值, 之前的样本显示15个值以上占比1/8.
*/
function  getAttriPairList(jsonList){
	var  originMap = new Map();
	for(var index in jsonList){
		var attr = jsonList[index];
		//每一条产品的属性对归集
		independenceAttrExtract(attr);

		for(var name in attr){
			//独立属性不参与归集
			if(independenceAttr.includes(name)){
				continue;
			}
			//可忽略属性
			if(avoidHandlerAttr.includes(name)){
				continue;
			}
			var value = attr[name];
			if(!originMap.get(name)){
				var valueMap = new Map();
				valueMap.set(value,1);
				// valueArray.push(json[name]);
				originMap.set(name,valueMap);
			}else{
				var tempValueMap = originMap.get(name);
				if(tempValueMap.has(value)){
					var count = tempValueMap.get(value)
					count++;
					tempValueMap.set(value,count);
				}else{
					tempValueMap.set(value,1);
				}
			}
		}
	}
	
	return  originMap;
}


//输出csv文档
function csvGenerate(attrCollection){
	var limitCount = config.categoryAttValueLimit;
	var frequnceLeast = 0;
	csvHeader(config);
	for(let attibute of attrCollection){
		var attrName = attibute[0];
		var valueMap = attibute[1];
		var outArray = [];
		if(valueMap.size > limitCount){
			var mapIter = valueMap.values();

			var tempArray = Array.from(mapIter).sort(function(a,b){
				return a - b;
			})

			var frequnceLeast = tempArray[limitCount -1]
		}
		var firstRow = true;
		var count = 0
		for(let value of valueMap){
			var valueName = value[0];
			var frequence = value[1];
			if(!frequnceLeast || ( frequence >= frequnceLeast && count < limitCount)){
				if(firstRow){
					outArray.push([attrName,"",valueName]);
					firstRow = false;
				}else{
					outArray.push(["","",valueName]);
				}
				count++;
			}
		}
		csvWriter(config,outArray);
	}
}


function csvHeader(config){
	csvWriter(config,[["attributeName","attributeValueGroupName","attributeValue"]]);
	csvWriter(config,[["属性名称","属性值组","属性值"]]);
}


function csvWriter(config,row){
	try{
		var filePath = path.join(config.rootPath,config.csv.destFolder,"attribute" + ".csv");
		stringify(row, function(err, output){
		    let recordString = iconv.encode(output,'GBK');
		    // console.log(output);
		    fs.appendFileSync(filePath, recordString);
		 });
	}catch(err){
		console.log(err);
	}
}


exports.start = function(iconfig){
	config = iconfig;
	console.log(config.splitSymbol);
	console.log("attribute csv generate start");

	csvGenerate(getAttriPairList(getAttrtibuteJson(config)));

	return Promise.resolve("attribute csv generate end")
}