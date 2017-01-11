var mysql = require("mysql");
var fs = require("fs");
var Promise = require("bluebird");
var async = require("async");
var basePromise = require("./lib/basePromise.js");
var service = require("./service/index.js");


var dbConfig = {
	host:"localhost",
	port:'3306',
	user:'root',
	password:'root',
	database:"product",
	singleDatabase:false,
	dumpSchema:false,
	dumpTables:["product.category_tree",
				"product.category",
				"product.category_tree_node",
				"product.page",
				"product.page_category_tree",
				"product.category_tree_node_relation",
				"product.brand",
				"product.attribute_name",
				"product.attribute_value",
				"product.category_att_name",
				"product.category_att_value",
				"stock.warehouse",
				"stock.merchant_warehouse"],
	dumpFolder:"./csv/"
}


var onlineConfig = {
	stratIndex:0,
	pageSize:1500,
	onlyProduct:true,
	totalLimit:15000,//拉取总量　仅对product有效
	sigleFileRows:1500, //生成文件行数，务必比单页数据库记录数要大
	batch: 9 || new Date().getTime()  // 京东 1483933485046 服装  //生鲜 1484051139769 //珠宝 1484054759718
	// connection,
	// fn,
	// sqlPrefix
}

var excelConfig = {
	name:"./data/来伊份.xls",
	mpSheet:"商品",
	cateSheet:"类目",
	brandColumn:4, // 品牌所在列
	categoryCodeColumn:3, // 类目code所在列
	attributeColumn:9 //属性所在列
}

/**
* 需要注意 chead 应该和原始的excel列要对应上。这样转csv时数据列不会出错
*/
var csvConfig = {
	destFolder:"./csv/",
	// name : "./out.csv",
	// dHead : ["thirdMerchantProductCode","chineseName","subtitle","categoryTreeNodeId","brandId","merchantProductPrice","marketPrice","url","content","attributeIdPair"],
	// cHead : ["第三方商品编码","商品名称*","副标题","商品类目ID*","品牌Id","普通售价*","市场价*","商品图片","文描","属性键值对"],
	dHead : ["thirdMerchantProductCode","chineseName","subtitle","categoryPath","brandName","merchantProductPrice","marketPrice","url","content","attribute","offset"],
	cHead : ["第三方商品编码","商品名称*","副标题","商品类目全路径","品牌名称*","普通售价*","市场价*","商品图片","文描","属性值","初始销量"],
	minDHead : ["grossWeight","netWeight","realStockNum","placeOfOrigin","type","saleType","combinType","isBargain","freightAttribute","shortcutPurchase"],
	minCHead : ["毛重*","商品净重*","库存量","产地*","商品类型*","销售类型*","组合商品类型","议价类型","配送属性*","一键购"],
	minDefault:["0","0","100","中国","普通商品","普通","0","一口价","重货","不支持"]
}

var config = {
	splitSymbol:"-----------------------------",
	cateSplitSymbol:"|",
	defaultBrand:"易果",
	site:1001, //网站编  //生鲜 1127  //母婴 1126  // 京东服饰 1001  //珠宝 1101
	test:false,
	csvMode:true, //是否csv模式
	companyId : 1003, //30 11
	merchantId : 1101800,//11115
	archivePrefix:"Saas",//归档目录前缀
	treeName : "服装商城", //最终输出的文件名也复用这个
	defaultWarehouseName:"服装商城",//默认仓库名称
	attributeWithBrand:[], //属性中绑定品牌 
	attributeUse:7,//基本+导购
	independenceAttr:['商品毛重','产地','规格','品牌'],
	avoidHandlerAttr: ['商品名称','商品编号','店铺','货号'],
	db : dbConfig,
	excel : excelConfig,
	csv : csvConfig,
	onlineConfig:onlineConfig,
	categoryAttValueLimit:15, //对于值比较的多丢弃，否则会造成方法栈溢出 !!
	rootPath:__dirname, //当前目录
	// shellPath:"./shell/export.bat",
	// stdoutSwitch:false,//脚本输出开关
	category : "./data/category.json",   //类目json文件
	brand:"./data/brand.json",   //品牌json文件
	rawCategory: "./data/categoryCode.json", //商品类目code json文件
	attribute : "./data/attribute.json",
	currentIds :"44,9687,9687,66671,66671,6666538,6666173,6666248,6666946,2650,65642,666621,666621", //首次应该从线上获取对应的id，sql路径 ./sql/startId.sql
	startId : 1
}

var client = mysql.createConnection({
		host:dbConfig.host,
		port:dbConfig.port,
		user:dbConfig.user,
		password:dbConfig.password,
		database:dbConfig.database
});


// //新建连接
client.connect();

//通过sql初始化数据
// var serviceChain = [
// 	// service.archive,
	// service.generator,
// 	// // service.onlineData,
// 	// // service.excel,
// 	// service.attribute,
// 	// service.attributeConvert,
// 	// service.brand,
// 	// service.brandConvert,
// 	service.category,
// 	// service.categoryCode,
// 	// service.categoryAttr,
// 	// service.warehouse,
// 	// service.nurtureFromExcel,
// 	// service.nurtrueFromDB,
// 	// service.batExecutor
// ]

// 通过csv初始化数据 需要把config.csvMode 改为 true
var serviceChain = [
	service.archive,
	// service.excel,
	// service.onlineData,
	service.localData,
	service.attributeCsv,
	service.brandCsv,
	service.categoryCsv,
	// service.warehouse,
	// service.nurtureFromExcel,
	service.nurtrueFromDB,
	// service.batExecutor
]


async.mapSeries(serviceChain
	,function(item,callback){
		console.log(config.onlineConfig.batch);
		item.start(config,client).then(value => {console.log(value,"\n");callback(null,"success")})
	} 
	,function(err,result){
	console.log(config.splitSymbol,"\n","summary:");
	console.log(result);
	client.end();
})



// ----------------------- 调试区--------------------------

/*
* connection 
*/
// 获取类目
// service.onlineData.getCategory(config,client).then(value=>{
// 	console.log(value);
// 	client.end();
// }).catch((err)=>{
// 	console.log(err);
// 	client.end();
// })

// 获取商品
// service.onlineData.getProduct(config,client).then(value=>{
// 	console.log(value);
// 	client.end();
// }).catch((err)=>{
// 	console.log(err);
// 	client.end();
// })

// 并行获取
// service.onlineData.start(config,client).then(value=>{
// 	console.log(value);
// 	client.end();
// }).catch((err)=>{
// 	console.log(err);
// 	client.end();
// })

//获取本地存数据
// service.localData.start(config,client).then(value=>{
// 	console.log(value);
// 	client.end();
// }).catch((err)=>{
// 	console.log(err);
// 	client.end();
// })
/*
* 0、文件归档、文件夹创建
*/
// service.archive.start(config).then(value => {
// 	console.log(value)
// 	client.end();
// })

/**
* 1、id 生成器初始化
*/
// service.generator.start(config,client).then(value =>{
// 	// console.log(config);
// 	console.log(value);
// })


/**
* 2、 输入文件解析
*/

// service.excel.start(config).then(value => {
// 	console.log(value)
// 	client.end();
// })




/*
* 3、属性去重，插表 
*/
// config.test = true;
// config.attrNameIdGe = basePromise.ge(1);
// config.attrValueIdGe = basePromise.ge(1);

// service.attribute.start(config,client).then(function(value){
// 	console.log(value);
// 	client.end();
// })

// service.attributeCsv.start(config,client).then(function(value){
// 	console.log(value);
// 	client.end();
// })


/*
* 4、字面属性名值 转换为 id：id的形式 
*/
// service.attributeConvert.start(config).then(function(value){
// 	console.log(value);
// 	client.end();
// })

/**
* 5、 品牌新增
*/

// config.brandIdGe = basePromise.ge(1);
// service.brand.start(config,client)
// .then(function(value){ //品牌新增
// 	console.log(value);
// 	client.end();
// })
// service.brandCsv.start(config,client)
// .then(function(value){ //品牌新增
// 	console.log(value);
// 	client.end();
// })
/**
* 6 品牌名称转换

// service.brandConvert.start(config).then(function(value){
// 	console.log("品牌转换" + value);
// 	client.end();
// })

/**
* 7.1 、类目校验 不插表，只输出树状内容
*/


// service.category.validate(config).then(function(value){
// 	console.log(value);
// 	client.end();
// })

/**
* 7 、类目插入 
*/
// config.categoryTreeIdGe = basePromise.ge(1);//   lyf  3  saas  11
// config.categoryIdGe  = basePromise.ge(1);//   lyf 3000   saas 1500
// config.categoryTreeNodeGe  = basePromise.ge(1); //   lyf 3000  saas  1500
// config.pageIdGe  = basePromise.ge(1);  //   lyf 2  saas 15 
// config.pageCategoryTreeIdGe  = basePromise.ge(1); //   lyf 2    saas 16
// config.relatinIdGe  = basePromise.ge(1); //   lyf   1500  saas 1     前后台类目树
// service.category.start(config,client).then(function(value){
// 	console.log(value);
// 	client.end();
// })

// service.categoryCsv.start(config,client).then(function(value){
// 	console.log(value);
// 	client.end();
// })


/**
* 8、类目数据转换
*/

// service.categoryCode.start(config).then(function(value){
// 	console.log(value);
// 	client.end();
// })

/**
* 9、类目属性
*/

// config.categoryAttNameIdGe = basePromise.ge(1);  //   lyf 2000     saas 1000
// config.categoryAttValueIdGe = basePromise.ge(1); //  lyf 35000    saas  15000
// service.categoryAttr.start(config,client)
// .then(function(){
// 	console.log("cate attribute done");
// 	client.end();
// })

/**
* 10、仓库初始化
*/
// config.warehouseIdGe = basePromise.ge(1);    // Saas  10   lyf 20   hh  10 
// config.merchantWareIdGe = basePromise.ge(1);  // Saas  10   lyf20    hh 10 
// service.warehouse.start(config,client)
// .then(function(value){
// 	console.log(value);
// 	client.end();
// })

/*
* 11、 文件转csv & 内容替换
*/

// service.nurture.start(config).then(function(value){
// 	console.log(value);
// })

// service.nurtrueFromDB.start(config,client).then(function(value){
// 	console.log(value);
// 	client.end()
// })
/**
* 12、批量文件输出
*/

// service.batExecutor.start(config).then((value)=>{
// 	console.log(value);
// })


