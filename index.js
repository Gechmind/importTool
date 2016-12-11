var mysql = require("mysql");
var fs = require("fs");
var Promise = require("bluebird");
var async = require("async");
var service = require("./service/index.js")


function* idGenerator(start){
	let s = start || 1;
	while(true){
		yield s++;
	}
}

var excelConfig = {
	name:"./data/mp.xlsx",
	brandColumn:3, // 品牌所在列
	categoryCodeColumn:4, // 类目code所在列
	attributeColumn:6 //属性所在列
}

var csvConfig = {
	destFolder:"./csv/",
	name : "./out.csv",
	dHead : ["thirdMerchantProductCode","chineseName","merchantProductPrice","brandId","categoryTreeNodeId","url","attributePairId","content"],
	cHead : ["第三方商品编码","商品名称*","普通售价*","品牌Id","商品类目ID*","商品图片","属性键值对","文描"],
	minDHead : [],
	minCHead : [],
	minDefault:[]
}

var config = {
	splitSymbol:"-----------------------------",
	companyId : 11009, //30 11
	merchantId : 1100900,//11115
	treeName : "来伊份",
	defaultWarehouseName:"来伊份默认",//默认仓库名称
	attributeWithBrand:[], //属性中绑定品牌  
	excel : excelConfig,
	csv : csvConfig,
	rootPath:__dirname,
	category : "./data/category.json",   //类目json文件
	brand:"./data/brand.json",   //品牌json文件
	rawCategory: "./data/categoryCode.json", //商品类目code json文件
	attribute : "./data/attribute.json",
	startId : 1, 
	categoryTreeIdGe : idGenerator(11),//   lyf  3  saas  11
	categoryIdGe : idGenerator(1500),//   lyf 3000   saas 1500
	categoryTreeNodeGe : idGenerator(1500), //   lyf 3000  saas  1500
	pageIdGe : idGenerator(15),  //   lyf 2  saas 15 
	pageCategoryTreeIdGe : idGenerator(16), //   lyf 2    saas 16
	relatinIdGe : idGenerator(1), //   lyf   1500  saas 1     前后台类目树
	brandIdGe: idGenerator(500),        //   lyf  500   saas 500
	attrNameIdGe: idGenerator(500),  //   lyf  2000   Saas 500
	attrValueIdGe: idGenerator(1500),       //   lyf 3500  saas 1500
	categoryAttNameIdGe:idGenerator(1000),  //   lyf 2000     saas 1000
	categoryAttValueIdGe:idGenerator(15000), //  lyf 35000    saas  15000
	warehouseIdGe:idGenerator(10),    // Saas  10   lyf 20   hh  10 
	merchantWareIdGe:idGenerator(10)  // Saas  10   lyf20    hh 10 
}

var client = mysql.createConnection({
		host:"localhost",
		port:'3306',
		user:'root',
		password:'',
		database:"product"
});

//新建连接
client.connect();

// async.series({
// 	archive:function(callback){
// 		service.archive.start(config).then(value => console.log(value);callback(null,"success")})
// 	},
// 	prepare:function(callback){
// 		service.excel.start(config).then(value => {console.log(value);callback(null,"success")})
// 	},
// 	attribute:function(callback){
// 		service.attribute.start(config,client).then(value => {console.log(value,"\n");callback(null,"success")})
// 	},
// 	attributeConvert:function(callback){
// 		service.attributeConvert.start(config).then(value => {console.log(value,"\n");callback(null,"success")})
// 	},
// 	brand:function(callback){
// 		service.brand.start(config,client).then(value => {console.log(value,"\n");callback(null,"success")})
// 	},
// 	brandConvert:function(callback){
// 		service.brandConvert.start(config).then(value => {console.log(value,"\n");callback(null,"success")})
// 	},
// 	category:function(callback){
// 		service.category.start(config,client).then(value => {console.log(value,"\n");callback(null,"success")})
// 	},
// 	categoryCodeConvert:function(callback){
// 		service.categoryCode.start(config).then(value => {console.log(value,"\n");callback(null,"success")})
// 	},
// 	categoryAttribute:function(callback){
// 		service.categoryAttr.start(config,client).then(value => {console.log(value,"\n");callback(null,"success")})
// 	},
// 	warehouse:function(callback){
// 		service.warehouse.start(config,client).then(value => {console.log(value,"\n");callback(null,"success")})
// 	},
// 	csvGenerator:function(callback){
// 		service.nurture.start(config).then(value => {console.log(value,"\n");callback(null,"success")})
// 	}
// },function(err,result){
// 	console.log(config.splitSymbol,"\n","summary:");
// 	console.log(result);
// 	client.end();
// })


// ----------------------- 调试区--------------------------

/*
* 文件归档
*/
service.archive.start(config).then(value => {
	console.log(value)
	client.end();
})


/**
* 0 文件准备
*/

// service.excel.start(config).then(value => {
// 	console.log(value)
// 	client.end();
// })
/*
* 1、属性去重，插表 
*/

// service.attribute.start(config,client).then(function(value){
// 	console.log(value);
// 	client.end();
// })

/*
* 2、字面属性名值 转换为 id：id的形式 
*/
// service.attributeConvert.start(config).then(function(value){
// 	console.log(value);
// 	client.end();
// })

/**
* 3、 品牌新增
*/

// service.brand.start(config,client)
// .then(function(value){ //品牌新增
// 	console.log(value);
// 	client.end();
// })
/**
* 4 品牌名称转换
*/
// service.brandConvert.start(config).then(function(value){
// 	console.log("品牌转换" + value);
// 	client.end();
// })

/**
* 5.1 、类目校验 不插表，只输出树状内容
*/

// service.category.validate(config).then(function(value){
// 	console.log(value);
// })

/**
* 5 、类目插入 
*/

// service.category.start(config,client).then(function(value){
// 	console.log(value);
// 	client.end();
// })

/**
* 6、类目数据转换
*/

// service.categoryCode.start(config).then(function(value){
// 	console.log(value);
// 	client.end();
// })

/**
* 7、类目属性
*/

// service.categoryAttr.start(config,client)
// .then(function(){
// 	console.log("cate attribute done");
// 	client.end();
// })

/**
* 8 仓库初始化
*/
// service.warehouse.start(config,client)
// .then(function(value){
// 	console.log(value);
// 	client.end();
// })

/*
* 9 文件转csv & 内容替换
*/

// service.nurture.start(config).then(function(value){
// 	console.log(value);
// })
