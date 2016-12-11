var mysql = require("mysql");
var fs = require("fs");
var path = require("path");
var Promise = require("bluebird");
var basePromise = require("../lib/basePromise");
var brandJson;
var brandMapping = new Array();

var client;
var config;


function insertBrand(name,companyId){
	var id = config.brandIdGe.next().value;
	var  insertSql = 'INSERT INTO `product`.`brand` ( `id`, `name`, `chinese_name`, `english_name`, `alias`, `log_url`, `ownedcompany_chinese_name`, `ownedcompany_english_name`, `introduction`, `is_available`, `is_deleted`, `version_no`, `create_userid`, `create_username`, `create_userip`, `create_usermac`, `create_time`, `create_time_db`, `server_ip`, `update_userid`, `update_username`, `update_userip`, `update_usermac`, `update_time`, `update_time_db`, `client_versionno`, `company_id`, `proxy_book_url`, `trademark_url`, `TYPE`, `STATUS`, `remark`)VALUES ( "' + id +'", "' + name +'","'+ name + '", "", null, null, null, null, null, "1", "0", "0", NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, null, NULL, NULL, NULL, NULL, null, null, NULL, '+ companyId +', NULL, NULL, "0", "1", null )';
  	return basePromise.insert(insertSql,client);
}

function getBransJson(){
	var dir = path.join(config.rootPath,config.brand || "./data/brand.json");
	var  brandSet = new Set();
	brandJson = JSON.parse(fs.readFileSync(dir));
	for(let index in brandJson){
		brandSet.add(brandJson[index]);
	}
	console.log(`--总数:${brandSet.size}`);
	return brandSet;
}


function startInner(brandSet,companyId){
	var promiseArray = new Array();
	for(let name of brandSet){
		promiseArray.push(insertBrand(name,companyId).then(function(brandId){
			brandMapping.push([name,brandId]);
		}));
	}
	return Promise.all(promiseArray);
}


exports.start = function(iconfig,dbClient){
	config = iconfig;
	client = dbClient;
	console.log(config.splitSymbol);
	console.log("brand add start");
	return startInner(getBransJson(),config.companyId,config.startId).then(function(){
		//关闭连接
		// fs.writeFile(path.join(__dirname,"mapping/brandMapping.json"),JSON.stringify(brandMapping));
		return basePromise.fileWrite(path.join(config.rootPath,"mapping/brandMapping.json"),JSON.stringify(brandMapping)).then(function(value){
			console.log(`--${value}`);
			return  Promise.resolve("brand add end");
		})
	})
}


