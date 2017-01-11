var basePromise = require("../lib/basePromise");
var sshClient = require("./dbClient.js");
var Promise = require('bluebird')
var mysql = require("mysql");
var path = require('path');
var squel = require("squel");


var brandJson = new Array();

var categoryCodeJson = new Array();
var attributeJson = new Array();
var categoryJson = new Array();
var localClient;
var remoteClient;
var config;


function mpAggregation(rows,batch){
	//excelSheet
	// let row = sheet.data[i];
	var allPromise = rows.map((row,index)=>{
		var attWashed = attributeWash(row.attr)
		attributeJson.push(attWashed);
		row.attr = JSON.stringify(attWashed);
		categoryCodeJson.push(row.catecode);
		var brandName = row.brandname
		if(!brandName){
			var brandName = attWashed["品牌"];	
			if(!brandName){
				brandName = config.defaultBrand
			}else{
				brandName = brandName.replace(" ♥关注","");
			}
		}else{
			brandName = brandName.replace(" ♥关注","");
		}
		row.brandname = brandName;
		brandJson.push(brandName);
		return insertMp(row,batch);
	})

	return Promise.all(allPromise).catch((err)=>{
		    	return Promise.reject(err);
		    })
}

function mpLocalAggregation(rows,batch){
	//excelSheet
	// let row = sheet.data[i];
    rows.map((row,index)=>{
		var attWashed = attributeWash(row.attr)
		attributeJson.push(attWashed);
		row.attr = JSON.stringify(attWashed);
		categoryCodeJson.push(row.catecode);
		var brandName = row.brandname
		if(!brandName){
			var brandName = attWashed["品牌"];	
			if(!brandName){
				brandName = config.defaultBrand
			}else{
				brandName = brandName.replace(" ♥关注","");
			}
		}else{
			brandName = brandName.replace(" ♥关注","");
		}
		row.brandname = brandName;
		// console.log(brandName);
		brandJson.push(brandName);
	})

	return Promise.resolve("mp Aggr")
}


function attributeWash(attr){
	try{
		var jsonAttr = JSON.parse(attr);
		var obj = {};
		for(let key in  jsonAttr){
			if(key == "" ){
				// console.log("got");
			}else if(key.endsWith("：")){
				var newKey = key.substring(0,key.length-1)
				obj[newKey] = jsonAttr[key]
			}else{
				obj[key.trim()] = jsonAttr[key].trim();
			}
		}
		return obj;
	}catch(e){
		console.log(e);
		console.log(attr);
	}
	// console.log(JSON.stringify(obj));
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

	return Promise.all(allPromise).catch((err)=>{
		    	return Promise.reject(err);
		    })
	
}

function categoryLocalAggregation(rows,batch){
	rows.map((row,index)=>{
		var categoryContent = new Array();
		categoryContent.push(row.code);
		categoryContent.push(parseInt(row.parentCode)); //注意js的map key也是区分类型的，线上表的parentCode 字段定义为varchar类型，因此需要转型
		categoryContent.push(row.name);
		categoryContent.push(row.url);
		categoryContent.push(row.leaf);
		categoryContent.push(row.level);
		categoryJson.push(categoryContent);
	})

	return Promise.resolve("catogory Aggr");
}




function getProudctSql(startIndex,pageSize){
	//生鲜
// var t =  squel.select()
// 		.field("tp.PRODUCT_CODE","code")
// 		.field("tp.PRODUCT_NAME","name")
// 		.field("tp.SUB_TITLE","title")
// 		.field("tc.CATEGORY_CODE","catecode")
// 		.field("tc.CATEGORY_NAME","catename")
// 		.field("tp.BRAND_NAME","brandname")
// 		.field("pa.PRODUCT_ATTR","attr")
// 		.field("tps.PRODUCT_PRICE","price")
// 		.field("tps.MARKET_PRICE","mkprice")
// 		.field("pp.PIC_URL","urls")
// 		.field("tp.DESCRIPTION","content")
// 		.from( squel.select()
// 		 		.field("itp.id")
// 		 		.from('t_product',"itp")
// 		 		.where("itp.SITE_ID = ?",config.site)
// 		 		.where("itp.DESCRIPTION IS NOT NULL")
// 		 		.where("itp.DESCRIPTION != ''")
// 		 		.limit(pageSize)
// 		 		.offset(startIndex) , "itp")
// 		.join("t_product", "tp","itp.id = tp.id ")
// 		.join("t_product_stat", "tps","tp.PRODUCT_CODE = tps.PRODUCT_CODE AND tps.SITE_ID = tp.SITE_ID 	AND tp.PRODUCT_CODE = tps.PRODUCT_CODE	AND tps.PRODUCT_PRICE > 0 ") //--AND tps.MARKET_PRICE > 0
// 		.join("t_category", "tc","tc.CATEGORY_CODE = tp.CATEGORY_ID and  tp.SITE_ID = tc.SITE_ID")
// 		.join("t_product_attribute", "pa","tp.PRODUCT_CODE = pa.PRODUCT_CODE and tp.SITE_ID = pa.SITE_ID")
// 		.join("t_product_picture", "pp","tp.PRODUCT_CODE = pp.PRODUCT_CODE and tp.SITE_ID = pp.SITE_ID and  pp.PIC_URL is not NULL AND pp.PIC_URL != ''")
// 		.toString()
		// console.log(t);
		//京东
	// var t = squel.select()
	// 	.field("tp.PRODUCT_CODE","code")
	// 	.field("tp.PRODUCT_NAME","name")
	// 	.field("tp.SUB_TITLE","title")
	// 	.field("tc.CATEGORY_CODE","catecode")
	// 	.field("tc.CATEGORY_NAME","catename")
	// 	.field("tp.BRAND_NAME","brandname")
	// 	.field("pa.PRODUCT_ATTR","attr")
	// 	.field("tps.PRODUCT_PRICE","price")
	// 	.field("tps.MARKET_PRICE","mkprice")
	// 	.field("pp.PIC_URL","urls")
	// 	.field("tp.DESCRIPTION","content")
	// 	.from( squel.select()
	// 	 		.field("itp.id")
	// 	 		.from('t_product',"itp")
	// 	 		.where("itp.SITE_ID = ?",config.site)
	// 	 		.where("itp.DESCRIPTION IS NOT NULL")
	// 	 		.where("itp.DESCRIPTION != ''")
	// 	 		.limit(pageSize)
	// 	 		.offset(startIndex) , "itp")
	// 	.from("t_product","tp")
	// 	.from("t_product_stat","tps")
	// 	.from("t_category","tc")
	// 	.from("t_product_attribute","pa")
	// 	.from("t_product_picture","pp")
	// 	.where("tp.id = itp.id")
	// 	.where("tp.PRODUCT_CODE = tps.PRODUCT_CODE")
	// 	.where("tp.SITE_ID = tps.SITE_ID")
	// 	.where("tc.CATEGORY_CODE = tp.CATEGORY_ID")
	// 	.where("tp.SITE_ID = tc.SITE_ID")
	// 	.where("tp.PRODUCT_CODE = pa.PRODUCT_CODE")
	// 	.where("tp.SITE_ID = pa.SITE_ID")
	// 	.where("tp.PRODUCT_CODE = pp.PRODUCT_CODE")
	// 	.where("tp.SITE_ID = pp.SITE_ID")
	// 	.where("tp.SITE_ID = 1001")
	// 	.where("tp.DESCRIPTION IS NOT NULL")
	// 	.where("tp.DESCRIPTION != ''")
	// 	.where("tps.PRODUCT_PRICE > 0")
	// 	// .where("tps.MARKET_PRICE > 0")
	// 	.where("tc.PARENT_CODE in ?",[	'11730',//	-- 流行男鞋
	// 									'11731',//-- 时尚女鞋
	// 									'1343',//-- 女装
	// 									'1342',//-- 男装
	// 									'1345',//-- 内衣
	// 									'1346',//-- 服饰配件
	// 									'13529'// -- 洗衣服务
	// 									]).toString()

	var t = squel.select()
		.field("tp.PRODUCT_CODE","code")
		.field("tp.PRODUCT_NAME","name")
		.field("tp.SUB_TITLE","title")
		.field("tc.CATEGORY_CODE","catecode")
		.field("tc.CATEGORY_NAME","catename")
		.field("tp.BRAND_NAME","brandname")
		.field("pa.PRODUCT_ATTR","attr")
		.field("tps.PRODUCT_PRICE","price")
		.field("tps.MARKET_PRICE","mkprice")
		.field("pp.PIC_URL","urls")
		.field("tp.DESCRIPTION","content")
		.from( squel.select()
		 		.field("itp.id")
		 		.from('t_product',"itp")
		 		.where("itp.SITE_ID = ?",config.site)
		 		.where("itp.DESCRIPTION IS NOT NULL")
		 		.where("itp.DESCRIPTION != ''")
		 		.limit(pageSize)
		 		.offset(startIndex) , "itp")
		.from("t_product","tp")
		.from("t_product_stat","tps")
		.from("t_category","tc")
		.from("t_product_attribute","pa")
		.from("t_product_picture","pp")
		.where("tp.id = itp.id")
		.where("tp.PRODUCT_CODE = tps.PRODUCT_CODE")
		.where("tp.SITE_ID = tps.SITE_ID")
		.where("tc.CATEGORY_CODE = tp.CATEGORY_ID")
		.where("tp.SITE_ID = tc.SITE_ID")
		.where("tp.PRODUCT_CODE = pa.PRODUCT_CODE")
		.where("tp.SITE_ID = pa.SITE_ID")
		.where("tp.PRODUCT_CODE = pp.PRODUCT_CODE")
		.where("tp.SITE_ID = pp.SITE_ID")
		.where("tp.SITE_ID = ?",config.site)
		.where("tp.DESCRIPTION IS NOT NULL")
		.where("tp.DESCRIPTION != ''")
		.where("tps.PRODUCT_PRICE > 0")
		.where("tps.MARKET_PRICE > 0")
		.where("tc.PARENT_CODE in ?",[
					'6182',  //-- 时尚饰品
					'6145',  //-- 黄金
					'13062', //-- K金饰品
					'6146',  //-- 金银投资
					'6155',  //-- 银饰
					'6160',  //-- 钻石
					'6167',  //-- 翡翠玉石
					'6172',  //-- 水晶玛瑙
					'6174',  //-- 彩宝
					'12040', // -- 铂金
					'12041', // -- 木手串/把件
					'12042'  // -- 珍珠
			]).toString();
		// console.log(t);
	return t;
}

function getLocalProduct(startIndex,pageSize){
	 return squel.select()
		.field("code","code")
		.field("name","name")
		.field("title","title")
		.field("catecode","catecode")
		.field("catename","catename")
		.field("attr","attr")
		.field("price","price")
		.field("mkprice","mkprice")
		.field("urls","urls")
		.field("content","content")
		.from("test.mp")
		.where("batch = ?",config.onlineConfig.batch)
		.limit(pageSize)
		.offset(startIndex)
		.toString()
}

function getLocalCategorySql(startIndex,pageSize){
	return squel.select()
			.field("code","code")
			.field("parentCode","parentCode")
			.field("name","name")
			.field("url","url")
			.field("LEAF","leaf")
			.field("level","level")
			.from("test.category")
			.where("batch = ?",config.onlineConfig.batch)
			.limit(pageSize)
			.offset(startIndex)
			.toString()
}

function getCategorySql(startIndex,pageSize){
	return squel.select()
			.field("CATEGORY_CODE","code")
			.field("PARENT_CODE","parentCode")
			.field("CATEGORY_NAME","name")
			.field("CATEGORY_URL","url")
			.field("LEAF","leaf")
			.field("level","level")
			.from("t_category")
			.where("SITE_ID = ?",config.site)
			.where("IS_DELETE = 0")
			.where("CATEGORY_CODE is not null")
			.limit(pageSize)
			.offset(startIndex)
			.toString()
}


var testSql = "select * from TABLES LIMIT ";




function queryPromsie(onlineQuerySql){
	// console.log(onlineQuerySql);
    return  basePromise.query(onlineQuerySql,remoteClient)
}


function pageQuery(stratIndex,fn,pageConfig){
    var sql =  pageConfig.initSql(stratIndex,pageConfig.pageSize);
    stratIndex += pageConfig.pageSize;
    // console.log("xxx");
    return queryPromsie(sql)
    	   .then((values)=>{
    	   			console.log(`--time: ${new Date().toLocaleString()}`);
    	   			console.log(`--${pageConfig.source}_${stratIndex-pageConfig.pageSize}_${values.length}`);
			    	return fn(values,pageConfig.batch).then(()=>{
			    		var totalCount = stratIndex - pageConfig.pageSize + values.length;

						if(( pageConfig.pageRealSizeExact && values.length < pageConfig.pageSize) || (pageConfig.totalLimit && totalCount + pageConfig.pageSize > pageConfig.totalLimit)){
				            // console.log(`--${pageConfig.source}_total count:${totalCount}`);
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





exports.getProduct = function(iconfig,iclient){
	config = iconfig;

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
			 basePromise.printAll(values)
			 return Promise.resolve("Fetch merchant product end")
			
		})
	})
	.catch((err)=>{
		return Promise.reject(err);
	})
}

/**
* 
*  远程客户端
*/

exports.start = function(iconfig,iClient){
	config = iconfig;
	localClient = iClient
	console.log("raw json file prepare start");

	var pageConfig = config.onlineConfig;
	pageConfig.initSql = getProudctSql;
	pageConfig.source = "product";
	pageConfig.pageRealSizeExact = false;
	var catePage = {};
	catePage.onlyProduct = pageConfig.onlyProduct;
	catePage.stratIndex = pageConfig.stratIndex;
	catePage.pageSize = pageConfig.pageSize;
	catePage.initSql = getCategorySql;
	catePage.batch = pageConfig.batch
	catePage.source = "category";
	catePage.pageRealSizeExact = true;

	//TODO catePage先输出文件，避免驻留内存
	return sshClient.dbconnection().promise().then((value) =>{
		console.log("--online data fetch start");
		remoteClient = value;
     	return  Promise.all([
     				pageQuery(catePage.stratIndex,categoryAggregation,catePage),
     				pageQuery(pageConfig.stratIndex,mpAggregation,pageConfig)
     			]).then((values) =>{
		        	basePromise.printAll(values)
		        	//tunnul auto close?
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


/**
*
* 本地客户端
*/

exports.localStart = function(iconfig,iClient){
	config = iconfig;
	localClient = iClient
	console.log("local json file prepare start");

	var pageConfig = config.onlineConfig;
	pageConfig.initSql = getLocalProduct;
	pageConfig.source = "product";
	pageConfig.pageRealSizeExact = false;
	var catePage = {};
	catePage.onlyProduct = pageConfig.onlyProduct;
	catePage.stratIndex = pageConfig.stratIndex;
	catePage.pageSize = pageConfig.pageSize;
	catePage.initSql = getLocalCategorySql;
	catePage.batch = pageConfig.batch
	catePage.source = "category";
	catePage.pageRealSizeExact = true;
	remoteClient = iClient;

	return  Promise.all([
     				pageQuery(catePage.stratIndex,categoryLocalAggregation,catePage),
     				pageQuery(pageConfig.stratIndex,mpLocalAggregation,pageConfig)
     			])
				.then((values) =>{
		        	basePromise.printAll(values)
		        	//tunnul auto close?
		        	// me.connection.end();
		        	return Promise.resolve("--online data fetch complete");
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




exports.getCategory = function(iconfig,iClient){
	config = iconfig;
	localClient = iClient
	console.log("Fetch category start");
	console.log(`--${new Date().toLocaleString()}`);

	var pageConfig = config.onlineConfig;
	pageConfig.source = "category";
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
					"+ mysql.escape(row.attr) +",	 \
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


function escapeQuote(str){
	if (!str) return "null";

	str = str.replace(/(['|"])/g,(match,p)=>{
		return '\\'+p;
	})

	return "'" + str + "'";
}