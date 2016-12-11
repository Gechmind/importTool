var mysql = require("mysql");
var fs = require("fs");
var path = require("path");
var Promise = require("bluebird");
var iconv = require('iconv-lite');
// var attriPairJson = fs.readFileSync('./attrJson.json');

function getJson(fileName){
	var str = iconv.decode(fs.readFileSync(fileName),"UTF-8");

	var json = JSON.parse(str);
	return json;
}
// console.log(json)


var client = mysql.createConnection({
		host:"localhost",
		port:'3306',
		user:'root',
		password:'root',
		database:"product"
});

//新建连接
client.connect();


function* idGenerator(start){
	let s = start;
	while(true){
		yield s++;
	}
}

var  nameId = idGenerator(72);
var  valueId = idGenerator(16200);
/**
* [{attrname:attrvalue,...}...]
* 
*/


function dbOperate(json){

	var promiseAll = json.map(function(value,index){
		return  totalInsertPath(value.name,value.default);
	})
	return Promise.all(promiseAll);
}


function dbUpdateOperate(json){

	var promiseAll = json.map(function(value,index){
		console.log(value);
		return  totalUpdatePath(value.config,value.default);
	})
	return Promise.all(promiseAll);
}


function  totalUpdatePath(config,valueList){
	var promiseArray = valueList.map(function(value,index){
			//id,parentId,attNameId,value,sortValue
		return insertAttrValue(valueId.next().value,config[0],config[1],value,index+1)
				.then(function(sonAttrValueArray){
					//键值对映射名值对
					let obj = {};
					let key =  name +　value;
					obj[key] = [attrValueArray[1],sonAttrValueArray[0]];
					// attributMapping.push(obj);
				});
		})
		return Promise.all(promiseArray);
}


function  totalInsertPath(name,valueList){
	return insertAttrName(nameId.next().value,name)
	.then(function(res){
		var insertRes = JSON.parse(res);
		return insertRes.insertId;
	})
	.then(function(attrNameId){
		//属性名作为默认组名称
		return insertAttrValue(valueId.next().value,0,attrNameId,name,1);
	})
	.then(function(attrValueArray){ //attrValueArray 0 - valueId 1- nameId

		var promiseArray = valueList.map(function(value,index){
			return insertAttrValue(valueId.next().value,attrValueArray[0],attrValueArray[1],value,index+1)
					.then(function(sonAttrValueArray){
						//键值对映射名值对
						let obj = {};
						let key =  name +　value;
						obj[key] = [attrValueArray[1],sonAttrValueArray[0]];
						// attributMapping.push(obj);
					});
		})
		return Promise.all(promiseArray);
	})
}



//插入属性记录
function insertAttrName(id,name){
	let  insertSql = 'INSERT INTO `product`.`attribute_name` ( `id`, `name`, `type`, `is_available`, `is_deleted`, `version_no`, `create_userid`, `create_username`, `create_userip`, `create_usermac`, `create_time`, `create_time_db`, `server_ip`, `update_userid`, `update_username`, `update_userip`, `update_usermac`, `update_time`, `update_time_db`, `client_versionno`, `company_id`)VALUES ( "'+ id + '", "' + name +'", "1", "1", "0", "0", NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, "10" )';
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


/**
* 根据属性id插入属性值  值组默认value 为 属性名
* !!! caution  trunk 库少一个type字段 开发库默认为零，可认为无影响
*/

function insertAttrValue(id,parentId,attNameId,value,sortValue){
	let insertSql = 'INSERT INTO `product`.`attribute_value` ( `id`, `parent_id`, `attribute_name_id`, `value`, `sort_value`, `is_available`, `is_deleted`, `version_no`, `create_userid`, `create_username`, `create_userip`, `create_usermac`, `create_time`, `create_time_db`, `server_ip`, `update_userid`, `update_username`, `update_userip`, `update_usermac`, `update_time`, `update_time_db`, `client_versionno`, `company_id`, `type` ) VALUES ( "'+ id +'", "' + parentId + '","' +  attNameId + '","' + value + '","' + sortValue + '",' + ' "1", "0", "0", NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, "10", "0" )';    
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
    				console.log(t);
    				reslove(t);
    			}
    		}
    	)
	})
}



// console.log(getAttriPairList(json));
// /**
// * 方法入口,数据库操作
// */
// dbOperate(getJson('./meta/4/attrJsonInsert.json')).then(function(){
// 	client.end();
// })

dbUpdateOperate(getJson('./meta/6/attrJsonU.json')).then(function(){
	client.end();
})
// .then(function(){
// 	//关闭连接
// 	client.end();
// 	//映射文件输出
// 	fs.writeFile(path.join(__dirname,"/mapping/attributeMapping.json"), JSON.stringify(attributMapping));
// 	//独立属性内容输出
// 	for(let i = 0 ;i < independencefileName.length; i++){
// 		fs.writeFile(path.join(__dirname,"/mapping/",independencefileName[i]+"_out.txt"), independenceOutput[i]);
// 	}
// })
