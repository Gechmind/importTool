var basePromise = require("../lib/basePromise");
var sshClient = require("./dbClient.js");
var Promise = require('bluebird')
var mysql = require("mysql");
var path = require('path');


var brandJson = new Array();

var categoryCodeJson = new Array();
var attributeJson = new Array();
var categoryJson = new Array();
var localClient;


function mpAggregation(rows,batch){
	//excelSheet
	// let row = sheet.data[i];
	var allPromise = rows.map((row,index)=>{
		var attWashed = attributeWash(row.attr)
		attributeJson.push(attWashed);
		row.attr = JSON.stringify(attWashed);
		categoryCodeJson.push(row.catecode);
		brandJson.push(row.brandname);
		return insertMp(row,batch);
	})

	return Promise.all(allPromise)	
}


function attributeWash(attr){
	try{
		JSON.parse(attr)
	}catch(e){
		console.log(e);
		console.log(attr);
	}
	var jsonAttr = JSON.parse(attr);
	var obj = {};
	for(let key in  jsonAttr){
		if(key == "" ){
			// console.log("got");
		}else if(key.endsWith("：")){
			var newKey = key.substring(0,key.length-1)
			obj[newKey] = jsonAttr[key]
		}else{
			obj[key] = jsonAttr[key]
		}
	}
	// console.log(JSON.stringify(obj));
	return obj;
}



function categoryAggregation(rows,batch){
	var allPromise = rows.map((row,index)=>{
		var categoryContent = new Array();
		categoryContent.push(row.code);
		categoryContent.push(parseInt(row.parentCode)); //注意js的map key也是区分类型的，线上表的parentCode 字段定义为varchar类型，因此需要转型
		categoryContent.push(row.name);
		categoryContent.push(row.url);
		categoryContent.push(row.leaf);
		categoryContent.push(row.level);
		categoryJson.push(categoryContent);
		return insertCategory(row,batch);
	})

	return Promise.all(allPromise)
	
}


function escapeQuote(str){
	if (!str) return str;

	str = str.replace(/(['|"])/g,(match,p)=>{
		return '\\'+p;
	})

	return "'" + str + "'";
}


function getProudctSql(startIndex,pageSize){
	var prefix = "SELECT  \
    tp.PRODUCT_CODE   code,  \
    tp.PRODUCT_NAME   name,  \
    tp.SUB_TITLE      title,  \
    tc.CATEGORY_CODE  catecode,  \
    tc.CATEGORY_NAME  catename,  \
    tp.BRAND_NAME     brandname,  \
    pa.PRODUCT_ATTR   attr,  \
    tps.PRODUCT_PRICE price,   \
    tps.MARKET_PRICE  mkprice,  \
    pp.PIC_URL       urls,  \
    tp.DESCRIPTION   content  \
    FROM  \
	   (select itp.id from t_product itp where itp.SITE_ID = 1126 and itp.DESCRIPTION IS NOT NULL  and itp.DESCRIPTION != '' limit ";

	var affix  = " )itp \
			 inner join t_product tp on itp.id = tp.id \
       INNER JOIN t_product_stat tps on tp.PRODUCT_CODE = tps.PRODUCT_CODE   AND tps.PRODUCT_PRICE > 0  AND tps.MARKET_PRICE > 0  \
       INNER join t_category tc on  tc.CATEGORY_CODE = tp.CATEGORY_ID \
       INNER join t_product_attribute pa on tp.PRODUCT_CODE = pa.PRODUCT_CODE \
       INNER join t_product_picture pp on tp.PRODUCT_CODE = pp.PRODUCT_CODE and  pp.PIC_URL is not NULL AND pp.PIC_URL != ''";
     var  t =  prefix + startIndex + "," + pageSize + affix;
     // console.log(t);
    return t;
}



function getCategorySql(startIndex,pageSize){
	var categorySql = "select \
	CATEGORY_CODE  code, \
	PARENT_CODE parentCode, \
	CATEGORY_NAME name, \
	CATEGORY_URL url, \
	LEAF leaf, \
	level level \
	from t_category \
	where \
	SITE_ID = 1126 \
	and IS_DELETE = 0 \
	and CATEGORY_CODE is not null LIMIT ";
	return categorySql + startIndex + "," + pageSize;
}


var testSql = "select * from TABLES LIMIT ";




function queryPromsie(onlineQuerySql){
	// console.log(onlineQuerySql);
    return  basePromise.query(onlineQuerySql,me.connection)
}


function pageQuery(stratIndex,fn,pageConfig){
    var sql =  pageConfig.initSql(stratIndex,pageConfig.pageSize);
    stratIndex += pageConfig.pageSize;
    // console.log("xxx");
    return queryPromsie(sql)
    	   .then((values)=>{
    	   			console.log(`--time: ${new Date().toLocaleString()}`);
			    	return fn(values,pageConfig.batch).then(()=>{
			    		var totalCount = stratIndex - pageConfig.pageSize + values.length;
						if(( pageConfig.pageRealSizeExact && values.length < pageConfig.pageSize) || (pageConfig.totalLimit && totalCount + pageConfig.pageSize > pageConfig.totalLimit)){
				            console.log(`--${pageConfig.source}_total count:${totalCount}`);
				            return Promise.resolve(`--All ${pageConfig.source} data fetch down`);
				        }else{
				        	console.log(`--${pageConfig.source}_startIndex:${stratIndex}`);
				            return pageQuery(stratIndex,fn,pageConfig)
				        }
			    	})
	    	})
		    .catch((err)=>{
		    	return Promise.reject(err);
		    })
}





exports.getProduct = function(config,iclient){
	localClient = iclient
	console.log("Fetch merchant product start");

	var pageConfig = config.onlineConfig;
	pageConfig.initSql = getProudctSql;
	pageConfig.pageRealSizeExact = false;
	pageConfig.source = "product";

	return sshClient.dbconnection().promise().then((value) =>{
     	return pageQuery(pageConfig.stratIndex,mpAggregation,pageConfig)
     			.then((values) =>{
		        	console.log(values);
		        	//tunnul auto close?
		        	me.connection.end();
     			})
     			.catch((err)=>{
     				me.connection.end();
			    	return Promise.reject(err);
			    })
	})
	.then(value =>{
		return Promise.all([
			basePromise.fileWrite(path.join(config.rootPath,"./data/brand.json"),JSON.stringify(brandJson)),
			basePromise.fileWrite(path.join(config.rootPath,"./data/categoryCode.json"),JSON.stringify(categoryCodeJson)),
			 // basePromise.fileWrite(path.join(config.rootPath,"./data/category.json"),JSON.stringify(categoryJson)),
		    basePromise.fileWrite(path.join(config.rootPath,"./data/attribute.json"),JSON.stringify(attributeJson))
		])
		.then((values)=>{
			return basePromise.printAll(values).then(()=>{
				return Promise.resolve("Fetch merchant product end")
			});
		})
	})
	.catch((err)=>{
		return Promise.reject(err);
	})
}

exports.start = function(config,iClient){
	localClient = iClient
	console.log("raw json file prepare start");

	var pageConfig = config.onlineConfig;
	pageConfig.initSql = getProudctSql;
	pageConfig.source = "product";
	pageConfig.pageRealSizeExact = false;
	var catePage = {};
	catePage.stratIndex = pageConfig.stratIndex;
	catePage.pageSize = pageConfig.pageSize;
	catePage.initSql = getCategorySql;
	catePage.batch = pageConfig.batch
	catePage.source = "category";
	catePage.pageRealSizeExact = true;

	return sshClient.dbconnection().promise().then((value) =>{
		console.log("--online data fetch start");
     	return  Promise.all([
     				pageQuery(catePage.stratIndex,categoryAggregation,catePage),
     				pageQuery(pageConfig.stratIndex,mpAggregation,pageConfig)
     			]).then((values) =>{
		        	basePromise.printAll(values)
		        	//tunnul auto close?
		        	me.connection.end();
		        	return Promise.resolve("--online data fetch complete");
     			})
     			.catch((err)=>{
     				me.connection.end();
			    	return Promise.reject(err);
			    })
	})
	.then(() =>{
		return Promise.all([
			basePromise.fileWrite(path.join(config.rootPath,"./data/brand.json"),JSON.stringify(brandJson)),
			basePromise.fileWrite(path.join(config.rootPath,"./data/categoryCode.json"),JSON.stringify(categoryCodeJson)),
			 // basePromise.fileWrite(path.join(config.rootPath,"./data/category.json"),JSON.stringify(categoryJson)),
		    basePromise.fileWrite(path.join(config.rootPath,"./data/attribute.json"),JSON.stringify(attributeJson)),
		    basePromise.fileWrite(path.join(config.rootPath,"./data/category.json"),JSON.stringify(categoryJson))
		])
		.then((values)=>{
			basePromise.printAll(values)
			return Promise.resolve("raw json file prepare done")
		})
	})
	.catch((err)=>{
		return Promise.reject(err);
	})
}



exports.getCategory = function(config,iClient){
	localClient = iClient
	console.log("Fetch category start");
	console.log(`--${new Date().toLocaleString()}`);

	var pageConfig = config.onlineConfig;
	pageConfig.initSql = getCategorySql;
	pageConfig.totalLimit = null; //类目是全拉
	pageConfig.pageRealSizeExact = true;
	//  = {
	// 	initSql : categorySql,
	// 	pageSize:50,
	// 	totalLimit:1000
	// }
	return sshClient.dbconnection().promise()
		   .then((value,reject) =>{
	     		return pageQuery(pageConfig.stratIndex,categoryAggregation,pageConfig)
	     			  	.then((values) =>{
	        					console.log(values);
	        					me.connection.end();
	     				})
	     				.catch((err)=>{
	     					me.connection.end();
				    		return Promise.reject(err);
						})
			}).then(value =>{
				return basePromise.fileWrite(path.join(config.rootPath,"./data/category.json"),JSON.stringify(categoryJson))
			 			.then((values)=>{
							basePromise.printAll([values]);
							console.log(new Date().toLocaleString());
							return Promise.resolve("Fetch category end")
						})
			})
}

// var config = {
// 			rootPath : "C:\\Program Files\\Git\\importTool\\"
// 		}

// var localClient = mysql.createConnection({
// 		host:'127.0.0.1',
// 		port:3306,
// 		user:'root',
// 		password:'root',
// 		database:'test'
// });


// // //新建连接
// localClient.connect();

// this.getCategory(config);

function insertMp(row,batch){
	var insertSql = "INSERT INTO `test`.`mp` ( \
					`CODE`,	 \
					`NAME`,	 \
					`title`,	 \
					`catecode`,	 \
					`catename`,	 \
					`brandname`,	 \
					`attr`,	 \
					`price`,	 \
					`mkprice`,	 \
					`urls`,	 \
					`content`,	 \
					`id`,	 \
					`batch`  \
					)	 \
					VALUES	 \
					(	 \
					'"+ row.code +"',	 \
					"+ escapeQuote(row.name) +",	 \
					"+ escapeQuote(row.title) +",	 \
					"+ row.catecode +",	 \
					'"+ row.catename +"',	 \
					"+ escapeQuote(row.brandname) +",	 \
					"+ escapeQuote(row.attr) +",	 \
					"+ row.price +",	 \
					"+ row.mkprice +",	 \
					"+ escapeQuote(row.urls) +",	 \
					"+ escapeQuote(row.content) +",	 \
					NULL, \
					"+ batch +" \
					)"
	return basePromise.insert(insertSql,localClient);
}

function insertCategory(row,batch){
	var insertSql = "INSERT INTO `test`.`category` (	 \
						`id`,	 \
						`code`,	 \
						`parentCode`,	 \
						`name`,	 \
						`url`,	 \
						`LEAF`,	 \
						`level`,	 \
						`batch`  \
					)	 \
					VALUES	 \
						(	 \
							null,	 \
							'"+ row.code +"',	 \
							'"+ row.parentCode +"', \
							'"+ row.name +"',	 \
							'"+ row.url +"',	 \
							'"+ row.leaf +"',	 \
							'"+ row.level +"',	 \
							"+ batch +" \
					)"
	return basePromise.insert(insertSql,localClient);
}
