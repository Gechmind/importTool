var mysql = require("mysql");
var fs = require("fs");
var path = require("path");
var Promise = require("bluebird");
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
* 
*/
function  getAttriPairList(jsonList){
	var  originMap = new Map();
	for(var index in jsonList){
		var json = jsonList[index];
		//每一条产品的属性对归集
		independenceAttrExtract(json);

		for(var key in json){
			//独立属性不参与归集
			if(independenceAttr.includes(key)){
				continue;
			}
			//可忽略属性
			if(avoidHandlerAttr.includes(key)){
				continue;
			}
			if(!originMap.get(key)){
				var valueArray = new Array();
				valueArray.push(json[key]);
				originMap.set(key,valueArray);
			}else{
				var tempArray = originMap.get(key);
				if(tempArray.indexOf(json[key]) == -1){
					tempArray.push(json[key]);
					originMap.set(key,tempArray);
				}
			}
		}
	}
	var  t = Array.from(originMap);
	return  t;
}


function dbOperate(allBrandObject){

	// console.log(allBrandObject);
	var promiseAll = allBrandObject.map(function(value,index){
		return  totalInsertPath(value[0],value[1]);
	})
	return Promise.all(promiseAll);
}


function  totalInsertPath(name,valueList){
	return insertAttrName(name)
			.then(function(attrNameId){
				//属性名作为默认组名称
				return insertAttrValue(0,attrNameId,name,1);
			})
			.then(function(attrValueArray){ //attrValueArray 0 - valueId 1- nameId

				var promiseArray = valueList.map(function(value,index){
					return insertAttrValue(attrValueArray[0],attrValueArray[1],value,index+1)
							.then(function(sonAttrValueArray){
								//键值对映射名值对
								let obj = {};
								let key =  name +　value;
								obj[key] = [attrValueArray[1],sonAttrValueArray[0]];
								attributMapping.push(obj);
							});
				})
				return Promise.all(promiseArray);
			})
}


//根据属性名称查询属性记录
function queryAttrName(name){
	let querySql = 'select id from `attribute_name` where  `is_deleted` = 0 and  `is_available` = 1 and `type` = 1 and name = ' +'"' +name +'"';
	return basePromise(querySql,client);
}

//插入属性记录
function insertAttrName(name){
	let id = config.attrNameIdGe.next().value;
	let company_id = config.companyId;
	let  insertSql = 'INSERT INTO `attribute_name` ( `id`, `name`, `type`, `is_available`, `is_deleted`, `version_no`, `create_userid`, `create_username`, `create_userip`, `create_usermac`, `create_time`, `create_time_db`, `server_ip`, `update_userid`, `update_username`, `update_userip`, `update_usermac`, `update_time`, `update_time_db`, `client_versionno`, `company_id`)VALUES ( "' + id +'", "' + name +'", "1", "1", "0", "0", NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, "'+ company_id+'" )';
  	// console.log(insertSql);
  	return basePromise.insert(insertSql,client);
}

//根据属性名Id获取属性值列表
function queryAttrValue(attrNameId){
	let querySql = 'select `id`, `parent_id`,`value` ,`sort_value` from `attribute_value` where `is_deleted` = 0 and  `is_available` = 1 and `type` = 0 and `attribute_name_id` = "' +  attrNameId + '"';
	return basePromise(querySql,client);
}

/**
* 根据属性id插入属性值  值组默认value 为 属性名
* !!! caution  trunk 库少一个type字段 开发库默认为零，可认为无影响
*/

function insertAttrValue(parentId,attNameId,value,sortValue){
	let id = config.attrValueIdGe.next().value;
	let company_id = config.companyId;
	let insertSql = 'INSERT INTO `product`.`attribute_value` ( `id`, `parent_id`, `attribute_name_id`, `value`, `sort_value`, `is_available`, `is_deleted`, `version_no`, `create_userid`, `create_username`, `create_userip`, `create_usermac`, `create_time`, `create_time_db`, `server_ip`, `update_userid`, `update_username`, `update_userip`, `update_usermac`, `update_time`, `update_time_db`, `client_versionno`, `company_id`, `type` ) VALUES ( "' + id + '", "' + parentId + '","' +  attNameId + '","' + value + '","' + sortValue + '",' + ' "1", "0", "0", NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, "'+ company_id+'", "0" )';    
	return basePromise.insert(insertSql,client).then(function(value){
		// console.log([value,attNameId]);
		return Promise.resolve([value,attNameId])
	});
}

/*
* TODO
*/
function newPromise(allBrandObject){
	for(var name  in allBrandObject){
		//
		queryAttrName(name)
		.then(function(rows){
				if (rows.length == 0) {
					rows = JSON.parse(rows)
					return rows[0];
				}else{
					return null;
				}
			})
		.then(function(attrNameId){
			if(attrNameId){//直接返回属性			
				return Promise.resolve(attrNameId)
			}else{//新增属性名称
				Promise(insertAttrName(name)).then(function(attrNameId){
					return Promise(insertAttrValue(0,attrNameId,"测试",1))
				});
			}
		})
		.then(function(rows){ //存在属性Id
			if(rows.length > 0){
				rows = JSON.parse(rows);
			}else{

			}
		})
	}
}



exports.start = function(iconfig,iclient){
	config = iconfig;
	client = iclient;
	console.log(config.splitSymbol);
	console.log("attribute add start");
	
	/**
	* 方法入口,数据库操作
	*/
	return dbOperate(getAttriPairList(getAttrtibuteJson(config)))
	.then(function(){
		//映射文件输出
		// fs.writeFile(path.join(__dirname,"/mapping/attributeMapping.json"), JSON.stringify(attributMapping));
		//独立属性内容输出
		// for(let i = 0 ;i < independencefileName.length; i++){
		// 	fs.writeFile(path.join(__dirname,"/mapping/",independencefileName[i]+"_out.txt"), independenceOutput[i]);
		// }
		return  basePromise .fileWrite(path.join(config.rootPath,"/mapping/attributeMapping.json"),JSON.stringify(attributMapping))
							.then(function(value){
								console.log(`--${value}`);
								//独立属性内容输出
								return Promise.all(independencefileName.map((value,index)=>{
										return basePromise.fileWrite(path.join(config.rootPath,"/convert/",independencefileName[index]+"_out.txt"),independenceOutput[index])
														  .then(function(value){
														  	 console.log(`--${value}`);
														  })
								}))
							})
							.then(function(){
								return  Promise.resolve("attribute add end");
							})
		
	})
}