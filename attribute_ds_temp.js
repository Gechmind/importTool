var mysql = require("mysql");
var fs = require("fs");
var path = require("path");
var Promise = require("bluebird");
var attriPairJson = JSON.parse(fs.readFileSync('./data/attribute.json'));
var brandJson = JSON.parse(fs.readFileSync('./data/brand.json'));

var attributMapping = new Array()

var independenceAttr = ['商品毛重','产地','规格','品牌'];
var independencefileName  = ['weight','region','standar','brandI'];
//需要忽略的属性
var avoidHandlerAttr = ['商品名称','商品编号','店铺','货号'];
var attributeWithBrand = ['颜色','尺码']
var independenceOutput = ['','',''];



var client = mysql.createConnection({
		host:"localhost",
		port:'3306',
		user:'root',
		password:'root',
		database:"product"
});

//新建连接
client.connect();

/**
* 对独立属性进行处理,是独立属性则加入对应的属性列，如果不存在则属性列写入空
*/
function independenceAttrExtract(jsonObject){
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
*  转化成 {attrname:[value1,value2]}..
*/
function  getAttriPairList(jsonList){
	var  originMap = new Map();
	for(var index in jsonList){
		var json = jsonList[index];
		//每一条产品的属性对归集
		independenceAttrExtract(json);

		for(var key in json){
			var mapKey = key;
			//独立属性不参与归集
			if(independenceAttr.includes(key)){
				continue;
			}
			//可忽略属性
			if(avoidHandlerAttr.includes(key)){
				continue;
			}

			if(attributeWithBrand.includes(key)){
				mapKey = brandJson[index] + '-'+key;
			}

			if(!originMap.get(mapKey)){
				var valueArray = new Array();
				originMap.set(mapKey,valueArray);
			}else{
				var tempArray = originMap.get(mapKey);
				if(tempArray.indexOf(json[key]) == -1){
					tempArray.push(json[key]);
					originMap.set(mapKey,tempArray);
				}
			}
		}
	}
	return Array.from(originMap);
}

//[attrname:[value1,value2]]
function dbOperate(allBrandObject){
	// console.log(allBrandObject);
	var promiseAll = allBrandObject.map(function(value,index){
		return  totalInsertPath(value[0],value[1]);
	})
	return Promise.all(promiseAll);
}


function  totalInsertPath(name,valueList){
	return insertAttrName(name)
	.then(function(res){
		var insertRes = JSON.parse(res);
		return insertRes.insertId;
	})
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
	return new Promise(function(reslove,reject){
		client.query(
			querySql,
			function(err, rows, fields) {
		    if (err) {
		    	reject(err);
		    }else{
		    	reslove(JSON.stringify(rows));
		    };
		})
	})
}

//插入属性记录
function insertAttrName(name){
	let  insertSql = 'INSERT INTO `attribute_name` ( `id`, `name`, `type`, `is_available`, `is_deleted`, `version_no`, `create_userid`, `create_username`, `create_userip`, `create_usermac`, `create_time`, `create_time_db`, `server_ip`, `update_userid`, `update_username`, `update_userip`, `update_usermac`, `update_time`, `update_time_db`, `client_versionno`, `company_id`)VALUES ( NULL, "' + name +'", "1", "1", "0", "0", NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, "1001" )';
  	return new Promise(function(reslove,reject){
	    	client.query(
	    		insertSql,
	    		function(err,res){
	    			if (err) {
	    				reject(err);
	    			}else{
	    				reslove(JSON.stringify(res));
	    			}
	    		}
	    	)
  	})
}

//根据属性名Id获取属性值列表
function queryAttrValue(attrNameId){
	let querySql = 'select `id`, `parent_id`,`value` ,`sort_value` from `attribute_value` where `is_deleted` = 0 and  `is_available` = 1 and `type` = 0 and `attribute_name_id` = "' +  attrNameId + '"';
	return new Promise(function(reslove,reject){
		client.query(
			querySql,
			function(err, rows, fields) {
		    if (err) {
		    	reject(err);
		    }else{
		    	reslove(JSON.stringify(rows));
		    };
		})
	})
}

/**
* 根据属性id插入属性值  值组默认value 为 属性名
* !!! caution  trunk 库少一个type字段 开发库默认为零，可认为无影响
*/

function insertAttrValue(parentId,attNameId,value,sortValue){
	let insertSql = 'INSERT INTO `product`.`attribute_value` ( `id`, `parent_id`, `attribute_name_id`, `value`, `sort_value`, `is_available`, `is_deleted`, `version_no`, `create_userid`, `create_username`, `create_userip`, `create_usermac`, `create_time`, `create_time_db`, `server_ip`, `update_userid`, `update_username`, `update_userip`, `update_usermac`, `update_time`, `update_time_db`, `client_versionno`, `company_id`, `type` ) VALUES ( NULL, "' + parentId + '","' +  attNameId + '","' + value + '","' + sortValue + '",' + ' "1", "0", "0", NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, "1001", "0" )';    
	return new Promise(function(reslove,reject){
		client.query(
    		insertSql,
    		function(err,res){
    			if (err) {
    				reject(err);
    			}else{
    				var jsonString = JSON.stringify(res);
    				var result = JSON.parse(jsonString);
    				var t = [result.insertId,attNameId];
    				reslove(t);
    			}
    		}
    	)
	})
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


/**
* 方法入口,数据库操作
*/
dbOperate(getAttriPairList(attriPairJson)).then(function(){
	//关闭连接
	client.end();
	//映射文件输出
	fs.writeFile(path.join(__dirname,"/mapping/attributeMapping.json"), JSON.stringify(attributMapping));
	//独立属性内容输出
	for(let i = 0 ;i < independencefileName.length; i++){
		fs.writeFile(path.join(__dirname,"/convert/",independencefileName[i]+"_out.txt"), independenceOutput[i]);
	}
})
