var Promise = require("bluebird");
var basePromise = require("../lib/basePromise");




function configGenerate(config,currentIds){

	var idSet = currentIds.split(",");
	config.categoryTreeIdGe = basePromise.ge(idSet[0]);//   lyf  3  saas  11
	config.categoryIdGe  = basePromise.ge(idSet[1]);//   lyf 3000   saas 1500
	config.categoryTreeNodeGe  = basePromise.ge(idSet[2]); //   lyf 3000  saas  1500
	config.pageIdGe  = basePromise.ge(idSet[3]);  //   lyf 2  saas 15 
	config.pageCategoryTreeIdGe  = basePromise.ge(idSet[4]); //   lyf 2    saas 16
	config.relatinIdGe  = basePromise.ge(idSet[5]); //   lyf   1500  saas 1     前后台类目树
	config.brandIdGe = basePromise.ge(idSet[6]);        //   lyf  500   saas 500
	config.attrNameIdGe = basePromise.ge(idSet[7]); //   lyf  2000   Saas 500
	config.attrValueIdGe = basePromise.ge(idSet[8]);       //   lyf 3500  saas 1500
	config.categoryAttNameIdGe = basePromise.ge(idSet[9]);  //   lyf 2000     saas 1000
	config.categoryAttValueIdGe = basePromise.ge(idSet[10]); //  lyf 35000    saas  15000
	config.warehouseIdGe = basePromise.ge(idSet[11]);    // Saas  10   lyf 20   hh  10 
	config.merchantWareIdGe = basePromise.ge(idSet[12]);  // Saas  10   lyf20    hh 10 
}


function getStartIds(config,client){
	// console.log(config.currentIds);
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
   		return basePromise.query(querySql,client).then(value =>{
   			return Promise.resolve(value[0].ids)
   		});
	}
}


exports.start = function(config,client){
	console.log(config.splitSymbol);
	console.log("generate table start id");
	return  getStartIds(config,client).then(value =>{
		console.log(`--当前DB table  max(id) + 10 =>   ${value}`);
		configGenerate(config,value);
		return Promise.resolve("generate table start id done")
	})
}