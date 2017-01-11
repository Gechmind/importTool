var fs = require("fs");
var path = require("path");
var stringify = require("csv-stringify");
var iconv = require('iconv-lite');
var category = require("./category.js");
var Promise = require("bluebird");
var basePromise = require("../lib/basePromise");

var  valueCounter = 0;
var  attributeCounter = 0;

var client;
var config;
var categoryMapArray = [];

/**
* attributeJson 和  categoryJson 实际上是一一对应的关系
* 因此通过生成器交替执行,获取map(id,set)映射
*/


function*  getAttribute(attributeJson){
	var count = attributeJson.length -1;
	while(count >= 0){
		yield attributeJson[count];
		count-- ;
	}
}


function*  getCategory(categoryJson){
	var count = categoryJson.length -1;
	while(count >= 0){
		yield categoryJson[count];
		count-- ;
	}
}


/**
* 根据产品的属性分布,类目和产品的映射 推导 类目下的属性分布
* [{categoryCode : attrnameId}...]
*/
function getMap(attributeJson,categoryJson){
	var loopSize = attributeJson.length;
	var categorySize = categoryJson.length;
	var catAttrMap = new Map();
	if(loopSize != categorySize){
		console.log("数据不匹配,重新校验输入数据");
		return;
	}
	var attrGenerator = getAttribute(attributeJson);
	var cateGenerator = getCategory(categoryJson);

	var cate = cateGenerator.next();
	
	while(!cate.done){
		let cateValue = cate.value;
		let attibutePair = attrGenerator.next().value;
		// console.log(cateValue);

		let attributeSet = new Set();
		if(catAttrMap.has(cateValue)){
			attributeSet = catAttrMap.get(cateValue);
		}

		for(let key in attibutePair){
			if(config.independenceAttr.includes(key)){
				continue;
			}
			//可忽略属性
			if(config.avoidHandlerAttr.includes(key)){
				continue;
			}
			attributeSet.add(key);
		}
		catAttrMap.set(cateValue,attributeSet);
		cate = cateGenerator.next();
	}
	// console.log(catAttrMap);
	return catAttrMap;
}

/*
*  递归按层级整理node
*/
function recurseWrite(node,type,cateAttrMap){
	contentWriter(node,type,cateAttrMap)
	if(node.sonNode){
		for(let son of node.sonNode){
			var pathName = son.name + "";
			//整理节点路径
			if(node.index != -1){
				son.path = node.path + config.cateSplitSymbol + pathName.trim();
			}else{
				son.path = node.path + pathName.trim();
			}
			//TODO 处理叶子节点重复的问题，需要额外建立一张映射关系表，记录
			// console.log(son.path);
			recurseWrite(son,type,cateAttrMap);
		}
	}
}

function contentWriter(node,type,cateAttrMap){
	var url = "";
	var attribute = "";
	var isLeaf = 0;
	if(type === 1){
		if(!node.sonNode){
			var valueSet = cateAttrMap.get(node.code);
			if(valueSet){
				for(let  attr of valueSet){
					attribute += attr + ":" + config.attributeUse + ","
				}
				attribute = attribute.substring(0,attribute.length-1)
			}
		}
	}else{
		url = node.url;	
	}
	//是否叶子节点
	if(node.isLeaf){
		isLeaf = 1;
	}
	if(node.index != -1){
		csvWriter(config,[["","",node.path,isLeaf,url,attribute]],type)
	}else{
		var treeName = config.treeName;
		if(type === 1){
			treeName += "后台类目";
			csvWriter(config,[[treeName,type,node.path,isLeaf,"","",node.code]],type)
		}else{
			treeName += "前台类目";
			csvWriter(config,[[treeName,type,node.path,isLeaf,"","",node.code,99]],type)
		}
		
	}
	categoryMapArray.push([node.code,0,node.name,node.path]);
}

/**
*
*/
function csvGenerate(rootNode,type,cateAttrMap){
	csvHeader(config,type);
	recurseWrite(rootNode,type,cateAttrMap);
}


function csvHeader(config,type){
	if(type == 1){
		csvWriter(config,[["categoryTreeName","type","fullPath","isLeaf","pictureUrl","attribute","code"],["类目树名称*","类目树类型ID*","全路径","是否叶子节点","类目url","类目属性","编码"]],type);
	}else{
		csvWriter(config,[["categoryTreeName","type","fullPath","isLeaf","pictureUrl","attribute","code","godConfig"],["类目树名称*","类目树类型ID*","全路径","是否叶子节点","类目url","类目属性","编码","特殊配置"]],type);
	}
	
}

function csvWriter(config,row,type){
	try{
		var affix = "back_";
		if(type === 2){
			affix = "front_"
		}
		var filePath = path.join(config.rootPath,config.csv.destFolder,affix + "category" + ".csv");
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
	config.cateSplitSymbol = config.cateSplitSymbol || "|";
	console.log(config.splitSymbol);
	console.log("category csv generate start");

	var dir = path.join(config.rootPath,config.attribute || './data/attribute.json')
	var attributeJson = JSON.parse(fs.readFileSync(dir));
	var dir = path.join(config.rootPath,config.rawCategory || "./data/categoryCode.json");
	var categoryJson  = JSON.parse(fs.readFileSync(dir));

	//获取类目属性映射
	var cateAttrMap = getMap(attributeJson,categoryJson);
	//获取类目
	var rootNode = category.getRootNode(config);
	// console.log(rootNode);

	csvGenerate(rootNode,1,cateAttrMap);

	csvGenerate(rootNode,2,cateAttrMap);

	return basePromise.fileWrite(path.join(config.rootPath, './mapping/categoryMapping.json'), JSON.stringify(categoryMapArray))
					  .then(function(value){
					  	console.log(`--${value}`);
					  	return Promise.resolve("category csv generate end");
					  })
}
//
/**
* 1、获取根节点
* 2、读取商品 - 类目 - 属性
* 3、读取类目-
*/

