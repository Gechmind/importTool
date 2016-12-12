var Promise = require("bluebird");
var basePromise = require("../lib/basePromise");


function* idGenerator(start){
	let s = start || 1;
	while(true){
		yield s++;
	}
}

function configGenerate(config,currentIds){

	var idSet = currentIds.split(",");
	config.categoryTreeIdGe = idGenerator(idSet[0]);//   lyf  3  saas  11
	config.categoryIdGe  = idGenerator(idSet[1]);//   lyf 3000   saas 1500
	config.categoryTreeNodeGe  = idGenerator(idSet[2]); //   lyf 3000  saas  1500
	config.pageIdGe  = idGenerator(idSet[3]);  //   lyf 2  saas 15 
	config.pageCategoryTreeIdGe  = idGenerator(idSet[4]); //   lyf 2    saas 16
	config.relatinIdGe  = idGenerator(idSet[5]); //   lyf   1500  saas 1     前后台类目树
	config.brandIdGe = idGenerator(idSet[6]);        //   lyf  500   saas 500
	config.attrNameIdGe = idGenerator(idSet[7]); //   lyf  2000   Saas 500
	config.attrValueIdGe = idGenerator(idSet[8]);       //   lyf 3500  saas 1500
	config.categoryAttNameIdGe = idGenerator(idSet[9]);  //   lyf 2000     saas 1000
	config.categoryAttValueIdGe = idGenerator(idSet[10]); //  lyf 35000    saas  15000
	config.warehouseIdGe = idGenerator(idSet[11]);    // Saas  10   lyf 20   hh  10 
	config.merchantWareIdGe = idGenerator(idSet[12]);  // Saas  10   lyf20    hh 10 
}


function getStartIds(config,client){
	if(config.currentIds && config.currentIds.length > 0){
		return Promise.resolve(config.currentIds);
	}else{
		var querySql = "select \
					CONCAT_ws(',',\
					(select max(id)+10 from product.category_tree where LENGTH(`id`) < 5) ,\
					(select max(id)+10 from product.category where LENGTH(`id`) < 8) ,\
					(select max(id)+10 from product.category_tree_node  where LENGTH(`id`) < 8) , \
					(select max(id)+10 from product.page  where LENGTH(`id`) < 8) ,\
					(select max(id)+10 from product.page_category_tree  where LENGTH(`id`) < 8),\
					(select max(id)+10 from product.category_tree_node_relation  where LENGTH(`id`) < 8) ,\
					(select max(id)+10 from product.brand  where LENGTH(`id`) < 8) ,\
					(select max(id)+10 from product.attribute_name  where LENGTH(`id`) < 8) ,\
					(select max(id)+10 from product.attribute_value  where LENGTH(`id`) < 8) ,\
					(select max(id)+10 from product.category_att_name  where LENGTH(`id`) < 8) ,\
					(select max(id)+10 from product.category_att_value  where LENGTH(`id`) < 8) ,\
					(select max(id)+10 from stock.warehouse  where LENGTH(`id`) < 8) ,\
					(select max(id)+10 from stock.merchant_warehouse  where LENGTH(`id`) < 8) ) as ids\
					 from dual";
   		return basePromise.query(querySql,client);
	}
}


exports.start = function(config,client){
	console.log(config.splitSymbol);
	console.log("generate table start id");
	return  getStartIds(config,client).then(value =>{
		console.log(`--当前DB table  max(id) + 10 =>   ${value[0].ids}`);
		configGenerate(config,value[0].ids);
		return Promise.resolve("generate table start id done")
	})
}