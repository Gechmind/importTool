var mysql = require("mysql");
var fs = require("fs");
var path = require('path');
var Promise = require("bluebird");
var basePromise = require("../lib/basePromise");

var client;
var config;

function insertChain(warehoseName){
	return insetWarehouse(warehoseName)
			.then(function(warehouseId){
				return insertMerchantWarehouse(warehouseId);
			})
			// .then(function(warehouseId){
			// 	return insertWarehouseStock(warehouseId,merchantId,companyId);
			// })
}
/**
* 新增仓库
*/
function insetWarehouse(warehoseName){
	let id = config.warehouseIdGe.next().value;
	let companyId = config.companyId;
	let insertSql = 'INSERT INTO `stock`.`warehouse` (`id`,`warehouse_no`,`short_name`,`warehouse_name`,`warehouse_desc`,`warehouse_type`,`warehousestatus`,`is_real_warehouse`,`storage_type`,`function_type`,`is_support_tran`,`is_support_sby`,`flex`,`stock_type`,`is_oem`,`business_hours`,`cut_off_time`,`country_id`,`province_id`,`city_id`,`county_id`,`address_name`,`warehouse_longitude`,`warehouse_latitude`,`warehouse_group_email`,`warehouse_phone`,`warehouse_fax`,`warehouse_contactor`,`warehouse_contactor_mobile`,`rtv_default_express`,`rtv_sp_receive_address`,`deliver_address`,`do_deliver_duty_person`,`do_deliver_mobile`,`do_deliver_phone`,`deliver_remark`,`express_remark`,`return_duty_person`,`return_phone`,`return_mobile`,`do_return_duty_person`,`do_return_phone`,`do_return_mobile`,`customer_return_address`,`warehouse_reamrk`,`is_available`,`is_deleted`,`version_no`,`create_userid`,`create_username`,`create_userip`,`create_usermac`,`create_time`,`create_time_db`,`server_ip`,`update_userid`,`update_username`,`update_userip`,`update_usermac`,`update_time`,`update_time_db`,`client_versionno`,`company_id`)VALUES("'+ id +'",NUll,"'+warehoseName+'","'+warehoseName+'",NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,"1","0","0",NULL,NULL,NULL,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,"'+companyId+'")'
	return basePromise.insert(insertSql,client);
}
/**
* 新增商家仓库
*/
function insertMerchantWarehouse(warehoueId){
	let id = config.merchantWareIdGe.next().value;
	let companyId = config.companyId;
	let merchantId = config.merchantId;
	let insertSql = 'INSERT INTO `stock`.`merchant_warehouse` (`id`,`merchant_id`,`sub_company_id`,`warehouse_id`,`is_default_warehouse`,`is_available`,`is_deleted`,`version_no`,`create_userid`,`create_username`,`create_userip`,`create_usermac`,`create_time`,`create_time_db`,`server_ip`,`update_userid`,`update_username`,`update_userip`,`update_usermac`,`update_time`,`update_time_db`,`client_versionno`,`company_id`)VALUES("'+id+'","'+ merchantId +'",NULL,"'+warehoueId+'","1","1","0","0",NULL,NULL,NULL,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,"'+companyId+'")';
	return basePromise.insert(insertSql,client);
}

/* 
* @deprecate
* 新增商家库存 目前不能使用，需要获取sequence作为id
*/
function insertWarehouseStock(warehouseId,merchantId,companyId){
	// let id = config.stockIdGe.next().value;.value;
	let insertSql = 'INSERT INTO `stock`.`merchant_product_warehouse_stock` SELECT NULL, id, product_id, merchant_id, "'+ warehouseId+'", "50", "0", NULL, "1", "0", "0", NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, company_id FROM 	product.merchant_product WHERE 	company_id = "'+companyId+'" and  merchant_id = "' + merchantId +'"' ;
	return basePromise.insert(insertSql,client);
}


// function start(warehoseName,merchantId,companyId){

// 	insertChain(warehoseName,merchantId,companyId).then(function(){
// 		console.log('执行成功');
// 		client.end();
// 	})
// }



exports.start = function(iconfig,iclient){
	config = iconfig;
	client = iclient;

	console.log(config.splitSymbol);
	console.log("warehouse add start");

	return insertChain(iconfig.defaultWarehouseName)
			.then(function(){
				return Promise.resolve("warehouse add end");
	})
}