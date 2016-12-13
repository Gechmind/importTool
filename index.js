var mysql = require("mysql");
var fs = require("fs");
var Promise = require("bluebird");
var async = require("async");
var service = require("./service/index.js")

var dbConfig = {
	host:"localhost",
	port:'3306',
	user:'root',
	password:'root',
	database:"product",
	singleDatabase:false,
	dumpSchema:false,
	dumpTables:["category_tree",
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


var excelConfig = {
	name:"./data/礼品.xls",
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
	dHead : ["thirdMerchantProductCode","chineseName","subtitle","categoryTreeNodeId","brandId","merchantProductPrice","marketPrice","url","content","attributeIdPair"],
	cHead : ["第三方商品编码","商品名称*","副标题","商品类目ID*","品牌Id","普通售价*","市场价*","商品图片","文描","属性键值对"],
	minDHead : ["grossWeight","netWeight","realStockNum","placeOfOrigin","type","saleType","combinType","isBargain","freightAttribute","shortcutPurchase"],
	minCHead : ["毛重*","商品净重*","库存量","产地*","商品类型*","销售类型*","组合商品类型","议价类型","配送属性*","一键购"],
	minDefault:["0","0","100","中国","普通商品","普通","0","一口价","重货","不支持"]
}

var config = {
	splitSymbol:"-----------------------------",
	companyId : 11018, //30 11
	merchantId : 1101800,//11115
	archivePrefix:"Saas",//归档目录前缀
	treeName : "Saas饰品", //最终输出的文件名也复用这个
	defaultWarehouseName:"Saas饰品",//默认仓库名称
	attributeWithBrand:[], //属性中绑定品牌  
	db : dbConfig,
	excel : excelConfig,
	csv : csvConfig,
	rootPath:__dirname, //当前目录
	// shellPath:"./shell/export.bat",
	// stdoutSwitch:false,//脚本输出开关
	category : "./data/category.json",   //类目json文件
	brand:"./data/brand.json",   //品牌json文件
	rawCategory: "./data/categoryCode.json", //商品类目code json文件
	attribute : "./data/attribute.json",
	// currentIds :"44,9687,9687,47,48,3652,2196,846,4458,2650,65642,40,40" //首次应该从线上获取对应的id，sql路径 ./sql/startId.sql
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
// client.connect();

// var serviceChain = [
// 	service.archive,
// 	service.generator,
// 	service.excel,
// 	service.attribute,
// 	service.attributeConvert,
// 	service.brand,
// 	service.brandConvert,
// 	service.category,
// 	service.categoryCode,
// 	service.categoryAttr,
// 	service.warehouse,
// 	service.nurture,
// 	service.batExecutor
// ]

// async.mapSeries(serviceChain
// 	,function(item,callback){
// 		item.start(config,client).then(value => {console.log(value,"\n");callback(null,"success")})
// 	}
// 	,function(err,result){
// 	console.log(config.splitSymbol,"\n","summary:");
// 	console.log(result);
// 	client.end();
// })



// ----------------------- 调试区--------------------------




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

// service.attribute.start(config,client).then(function(value){
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

// service.brand.start(config,client)
// .then(function(value){ //品牌新增
// 	console.log(value);
// 	client.end();
// })
/**
* 6 品牌名称转换
*/
// service.brandConvert.start(config).then(function(value){
// 	console.log("品牌转换" + value);
// 	client.end();
// })

/**
* 7.1 、类目校验 不插表，只输出树状内容
*/

// service.category.validate(config).then(function(value){
// 	console.log(value);
// })

/**
* 7 、类目插入 
*/

// service.category.start(config,client).then(function(value){
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

// service.categoryAttr.start(config,client)
// .then(function(){
// 	console.log("cate attribute done");
// 	client.end();
// })

/**
* 10、仓库初始化
*/
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

/**
* 12、批量文件输出
*/

service.batExecutor.start(config).then((value)=>{
	console.log(value);
})


// async.series({
// 	archive:function(callback){
// 		service.archive.start(config).then(value => {console.log(value,"\n");callback(null,"success")})
// 	},
// 	generator:function(callback){
// 		service.generator.start(config,client).then(value => {console.log(value,"\n");callback(null,"success")})
// 	},
// 	prepare:function(callback){
// 		service.excel.start(config).then(value => {console.log(value,"\n");callback(null,"success")})
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
