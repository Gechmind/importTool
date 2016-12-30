var mysql = require("mysql");
var fs = require("fs");
var path = require('path');
var Promise = require("bluebird");
var basePromise = require("../lib/basePromise");
// var heapdump = require('heapdump');

var  valueCounter = 0;
var  attributeCounter = 0;

var client;
var config;

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
* [{categoryId : attrnameId}...]
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
			attributeSet.add(key);
		}
		catAttrMap.set(cateValue,attributeSet);
		cate = cateGenerator.next();
	}
	return catAttrMap;
}

/*
* 循环类目-属性Set映射
* 这种嵌套的写法，似乎insertChain调用时第一次执行完毕就该任务Promise的状态就被判定是Resolve的，
* 因此外层Promise.all也认为结束了，client关闭。导致内层的 attrivalueId的查询无法执行。
*/
function dbInsert(catAttrMap){
	var taskArray = Array.from(catAttrMap);
	console.log(taskArray.length);
	var promiseArray = taskArray.map(function(value,index){
		var categoryId = value[0];
		var attibuteNameIdPromiseArray = Array.from(value[1]);
		attibuteNameIdPromiseArray.map(function(attrinameId,sortValue){
			return insertChain(categoryId,attrinameId,sortValue)
		})
		return Promise.all(attibuteNameIdPromiseArray);
	})
	return  Promise.all(promiseArray).then(function(values){
		client.end();
		console.log("属性数量：" + attributeCounter);
		console.log("属性值数量：" + valueCounter);
	});
}


/**
*  首先根据属性Set展开。使整个cate-attributeName的数组扁平
*
*/

function dbInsertPlain(catAttrMap){
	var taskArray = Array.from(catAttrMap);
	console.log("涉及类目属性推导category大小:"+ taskArray.length);
	var skretch = new Array();

	taskArray.forEach(function(currentValue){
		var categoryId = currentValue[0];
		var nameIdArray = Array.from(currentValue[1]);
		nameIdArray.forEach(function(value,index){
			skretch.push([categoryId,value,index])
		})
	})

	console.log("cate-attributeName大小:"+skretch.length);

	return  Promise.all(skretch.map(function(value,index){
		let categoryId = value[0];
		let attrinameId = value[1];
		let sortValue = value[2];
		return insertChain(categoryId,attrinameId,sortValue)
	})).then(values=>{
		// console.log("x" + values);
	})
}
/*
* 1、插入CateAttriName表
* 2、通过AttiName查询获取AttributeValue
* 3、插入CateAttriValue表
* 类目属性type 初始化为 1
*/
function insertChain(categoyId,attrinameId,sortValue){
	return insertCategoryAttrName(categoyId,attrinameId,sortValue,"1")
		   .then(function(cateAttNameId){
				attributeCounter++;
				return getAttributeValuesByNameId(attrinameId).then(function(attriValueIdObjectArray){
					console.log(attriValueIdObjectArray.length);
					//对于值比较的多丢弃，否则会造成方法栈溢出
					if(Array.isArray(attriValueIdObjectArray) && attriValueIdObjectArray.length <= config.categoryAttValueLimit){
						return Promise.all(attriValueIdObjectArray.map(function(attributeIdObject,index){
								return insertCategoryAttrValue(cateAttNameId,attributeIdObject.id,index);
							   }))
							   .then(values=>{
								  // console.log("yy" + values);
							   })
							   .finally(err=>{
							   		if(err){
							   			 console.log(err);
							   		}
							   });
					}
					console.log("属性value组大小：", attrinameId,attriValueIdObjectArray.length);
				
				});
			})
}

/**
* 必须查询的原因是,某个类目下产品使用的属性值不一定是全量，且缺少默认值组
*/
function getAttributeValuesByNameId(attriNameId){
	let querySql = 'select id from  attribute_value where attribute_name_id = "' + attriNameId + '"';
	return basePromise.query(querySql,client);
}

/*
* 新增类目属性 直接放到默认组 parentId -1 
*/
function  insertCategoryAttrName(categoryId,attriNameId,sortValue,type){	
	let id = config.categoryAttNameIdGe.next().value;
	let companyId = config.companyId;
	type = 7;
	let insertSql = 'INSERT INTO `product`.`category_att_name` ( `id`, `parent_id`, `category_id`, `att_name_id`, `sort_value`, `is_available`, `is_deleted`, `version_no`, `create_userid`, `create_username`, `create_userip`, `create_usermac`, `create_time`, `create_time_db`, `server_ip`, `update_userid`, `update_username`, `update_userip`, `update_usermac`, `update_time`, `update_time_db`, `client_versionno`, `company_id`, `type`, `uses` ) VALUES ( "'+ id +'", -1, "'+ categoryId +'", "'+ attriNameId +'", "'+ sortValue +'", "1", "0", "0", NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, NULL, NULL, NULL, NULL, null, NULL, NULL,"'+ companyId +'", "'+ type +'", "'+ type +'")';
	return basePromise.insert(insertSql,client);
}

/*
* 新增类目属性值 
*/
function  insertCategoryAttrValue(cateAttNameId,attValueId,sortValue){
	let companyId = config.companyId;
	let id = config.categoryAttValueIdGe.next().value;
	let insertSql = 'INSERT INTO `product`.`category_att_value` (  `id`,  `category_att_name_id`,  `att_value_id`,  `att_value_custom`,  `sort_value`,  `is_available`,  `is_deleted`,  `version_no`,  `create_userid`,  `create_username`,  `create_userip`,  `create_usermac`,  `create_time`,  `create_time_db`,  `server_ip`,  `update_userid`,  `update_username`,  `update_userip`,  `update_usermac`,  `update_time`,  `update_time_db`,  `client_versionno`,  `company_id` ) VALUES  (   "'+ id +'",   "'+cateAttNameId+'",   "'+attValueId+'",   NULL,   "'+sortValue+'",   "1",   "0",   "0",   NULL,   NULL,   NULL,   NULL,   CURRENT_TIMESTAMP,   CURRENT_TIMESTAMP,   NULL,   NULL,   NULL,   NULL,   NULL,   NULL,   NULL,   NULL,   "'+companyId+'")';
	return basePromise.insert(insertSql,client);
}


/**
* 方法入口区
*/
//测试 cate - attriname 映射
// console.log(JSON.stringify(getMap(loopSize,categorySize)));

//执行类目属性数据库导入
// dbInsertPlain(getMap(loopSize,categorySize));

exports.start = function(iconfig,iclient){
	config = iconfig;
	client = iclient;
	console.log(config.splitSymbol);
	console.log("category attribute add start");

	var attributeJson = JSON.parse(fs.readFileSync(path.join(config.rootPath,"./data/attributeIdPair.json")));
	var categoryJson  = JSON.parse(fs.readFileSync(path.join(config.rootPath,"./data/categoryId.json")));
	
	return dbInsertPlain(getMap(attributeJson,categoryJson))
		   .then(function(value){
		   	  return Promise.resolve("category attribute add done")
		   });
}