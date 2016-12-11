var mysql = require("mysql");
var fs = require("fs");
var path = require('path');
var Promise = require("bluebird");
var client;
var productCodeJson = JSON.parse(fs.readFileSync("./data/productCode.json"));
var priceJson = JSON.parse(fs.readFileSync("./data/price.json"));

/**
* 获取产品code
*/
function* getProductCode(){
	
	var count = productCodeJson.length -1;
	while(count >= 0){
		yield productCodeJson[count];
		count-- ;
	}
}

/**
* 获取产品价格
*/
function* getPrice(){
	
	var count = priceJson.length -1;
	while(count >= 0){
		yield priceJson[count];
		count-- ;
	} 
}


function resource(){

	var clientStub = mysql.createConnection({
		host:"localhost",
		port:'3306',
		user:'root',
		password:'root',
		database:"product"
	});

	//新建连接
	clientStub.connect();
	client = clientStub;
}





function priceInsert(mpId,productId,merchantId,mpPrice,marketPrice,compandyId){
	let insertSql = 'INSERT INTO `price`.`merchant_product_price` (`id`,`merchant_product_id`,`product_id`,`merchant_id`,`merchant_product_price`,`market_price`,`purchasing_price`,`out_price`,`settle_price`,`post_tax_rate`,`is_available`,`is_deleted`,`version_no`,`create_userid`,`create_username`,`create_userip`,`create_usermac`,`create_time`,`create_time_db`,`server_ip`,`update_userid`,`update_username`,`update_userip`,`update_usermac`,`update_time`,`update_time_db`,`client_versionno`,`company_id`)VALUES(null,"'+mpId+'","'+productId+'","'+merchantId+'","'+mpPrice+'","'+marketPrice+'",NULL,NULL,NULL,NULL,"1","0","0",NULL,NULL,NULL,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,"",NULL,NULL,NULL,NULL,Null,Null,Null,"'+compandyId+'")';
	return insertClient(insertSql);
}

/*
* 根据商品Id 获取 (productId，MerchantProductId,merchantId)
*/
function getMerchantProductIdByCode(code){
	let querySql = 'select mp.id,product_id,merchant_id,mp.company_id from merchant_product mp,product p where mp.product_id = p.id and p.code = "' + code +'"';
	return queryClient(querySql);
}

/**
* 商品价格插入
*/
function setPrice(){
	return Promise.all(productCodeJson.map(function(value,index){
		return  getMerchantProductIdByCode(value).then(function(result){
			var mpSet =  result[0];
			var price =  priceJson[index];
			return priceInsert(mpSet["id"],mpSet["product_id"],mpSet["merchant_id"],price,price,mpSet["company_id"]);
		});
	}));
}

/*
* 查询sql模板，返回结果集数组   
*/
function queryClient(querySql){
	return new Promise(function(reslove,reject){
		client.query(
			querySql,
			function(err, rows, fields) {
		    if (err) {
		    	reject(err);
		    }else{
		    	let rowsString = JSON.stringify(rows);
		    	reslove(JSON.parse(rowsString));
		    };
		})
	})
}


/*
* 插入sql模板，返回插入的Id
*/
function insertClient(insertSql){
	return new Promise(function(reslove,reject){
	    	client.query(
	    		insertSql,
	    		function(err,res){
	    			if (err) {
	    				reject(err);
	    			}else{
	    				var resultJsonString = JSON.stringify(res);
	    				var json = JSON.parse(resultJsonString);
	    				reslove(json.insertId);
	    			}
	    		}
	    	)
  	})
}

/*
*
*/
function start(){
	resource();
	setPrice().then(function(){
		console.log("完成");
		client.end();
	})
}

start();