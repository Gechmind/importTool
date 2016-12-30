var mysql = require("mysql");
var fs = require("fs");
var path = require('path');
var Promise = require("bluebird");
var basePromise = require("../lib/basePromise");
var categoryJson;
//映射表
var mapArray = new Array();
var config;
var rootNode;
// var client = mysql.createConnection({
// 		host:"localhost",
// 		port:'3306',
// 		user:'root',
// 		password:'root',
// 		database:"product"
// 	});

// //新建连接
// client.connect();
function* idGenerator(start){
	let s = start;
	while(true){
		yield s++;
	}
}

function Node(index){
	this.name;
	this.index = index;
	this.id;
	this.categoryId;
	this.treeId;
	this.parentId;
	this.sonNode;
	this.parentNodeIndex;
	this.code;
	this.parentCode;
	this.listSort;
	this.isLeaf;
}

Node.prototype.setParentNodeIndex = function(parentNodeIndex){
		this.parentNodeIndex = parentNodeIndex;
};

Node.prototype.setCategoryId = function(categoryId){
		this.categoryId = categoryId;
};


Node.prototype.setTreeId = function(treeId){
		this.treeId = treeId;
};

Node.prototype.setParentId = function(parentId){
		this.parentId = parentId;
};

Node.prototype.setId = function(id){
		this.id = id;
};

Node.prototype.setCode = function(code){
		this.code = code;
};

Node.prototype.setParentcode= function(parentCode){
	this.parentCode = parentCode;
}

Node.prototype.addSon = function(node) {
	if(!Array.isArray(this.sonNode)){
		this.sonNode  = new Array();
		node.listSort = 1;
	}else{
		let size = this.sonNode.length;
		node.listSort = size + 1;
	}
	
	this.sonNode.push(node);
};

var levelMap = new Map();
var nodeArray;

function getRootNode(config){
	var dir = path.join(config.rootPath,config.category || "./data/category.json")
	categoryJson = JSON.parse(fs.readFileSync(dir));
	// console.log(categoryJson);
	nodeArray = new Array(categoryJson.length);

	for(let index = 0;index < categoryJson.length; index++ ){
		let category =  categoryJson[index];
		levelMap.set(category[0],index);
	}

	var rootNode = new Node(-1);
	// console.log(JSON.stringify(Array.from(levelMap)));

	// 0 -  code 1 - parentcode 2 - name 3 -url  4-level 5-leaf 
	for(let index = 0;index < categoryJson.length; index++){
		let category =  categoryJson[index];
		let parentcode = category[1];
		let code = category[0];
		let name = category[2];
		
		var currentNode = getNode(nodeArray,index);
		currentNode.setCode(code);
		currentNode.setParentcode(parentcode);
		currentNode.name = name;

		if(parentcode == 0){
			rootNode.addSon(currentNode);
			currentNode.setParentNodeIndex(-1);
		}else{
			let parentIndex = levelMap.get(parentcode);
			// console.log(currentNode);
			setSonNode(parentIndex,currentNode);
		}
	}
	return rootNode;
}


//增加链接  有可能会预先创建父Node
function setSonNode(parentIndex,node){
	let parentNode = getNode(nodeArray,parentIndex);
	// console.log(parentNode);
	parentNode.isLeaf = false;
	node.setParentNodeIndex(parentIndex);
	parentNode.addSon(node);
	// console.log(parentNode);
}

//获取节点,不存在则创建
function getNode(nodeArray,index){
	let node = nodeArray[index];
	if(!node){
		node = new Node(index);
		nodeArray[index] = node;
	}
	return node;
}


/**
* 初始数据 类目树、根节点
*/
function rootData(){
	return insertCategoryTree(config.treeName + "后台类目树",1).then(function(treeId){
		rootNode.setTreeId(treeId);
		return Promise.resolve(insertCategory(config.treeName +"后台类目"))
	}).then(function(categoryId){
		rootNode.setCategoryId(categoryId);
		//parentId,categoryTreeId,categoryId,listSort
		return insertCategoryTreeNode(0,rootNode.treeId,categoryId,1);
	}).then(function(categoryNodeId){
		rootNode.setId(categoryNodeId);
		if(rootNode.sonNode){
			for(let son of rootNode.sonNode){
				son.parentId = categoryNodeId;
			}
		}
		return categoryNodeId;
	}).then(function(categoryNodeId){
		return normalNode(nodeArray,1)
	});
}

function frontRootCate(){
	var treeIdVar;
	return insertCategoryTree(config.treeName + "前台类目树",2).then(function(treeId){
		treeIdVar = treeId;
		rootNode.setTreeId(treeId);
		return  insertPage(config.treeName)
				.then(function(pageId){
						return  insertPageCategoryTree(pageId,treeId);
					})
				.then(function(){
					return insertCategory(config.treeName + "前台类目")
				});
	}).then(function(categoryId){
		// console.log(categoryId);
		rootNode.setCategoryId(categoryId);
		//parentId,categoryTreeId,categoryId,listSort
		return   insertCategoryTreeNode(0,treeIdVar,categoryId,1);
	}).then(function(categoryNodeId){
		rootNode.setId(categoryNodeId);
		if(rootNode.sonNode){
			for(let son of rootNode.sonNode){
				son.parentId = categoryNodeId;
			}
		}
		return categoryNodeId;
	}).then(function(categoryNodeId){
		return normalNode(nodeArray,2,rootNode)
	})
}
/**
*
*/
function normalNode(nodeArray,type){
	return Promise.each(nodeArray,(node,index,length) => {
		let category = categoryJson[node.index];
        return  insertCategory(category[2])
        		.then(function(categoryId){
					 return  insertCategoryTreeNode(node.parentId,rootNode.treeId,categoryId,node.listSort);
				}).then(function(categoryNodeId){
					//后台类目写入映射关系
					if(type === 1){
						mapArray.push([node.code,categoryNodeId,node.name])
						// console.log(categoryNodeId);
					}
					//前台类目在修改本节点Id之前再nodeRealation写入关联关系
						
					let backNodeId = node.id;
					
					node.setId(categoryNodeId);
					if(node.sonNode){
						for(let son of node.sonNode){
							son.parentId = categoryNodeId;
						}
					}else{
						node.isLeaf = true;
					}
					if(type === 2 && node.isLeaf == true){
						return insertRelation(categoryNodeId,backNodeId);
					}
				});
	})
}

/*
* 
*/
function reArray(node,sortedArray){
	if(node.index != -1){
		sortedArray.push(node)
	}

	if(node.sonNode){
		for(let son of node.sonNode){
			reArray(son,sortedArray);
		}
	}
}

/*
* 0 -  code 1 - parentcode 2 - name 3 -url  4-level 5-leaf 
* 按层级输类目格式.可以确认内容
*/
function printNode(node,hasLevelMetaData){
	// console.log(node);
	// console.log(node.index);
	// console.log(node.index);
	if(! (node.index == -1)){
		let category = categoryJson[node.index];
		let kissString = "";
		//对于没有记录层级的数据,通过上溯来确定Level
		var  tlevel = category[4] ;

		if(!hasLevelMetaData){
			tlevel = findLevel(node);
		}
		//
		for(let i = 0 ; i < tlevel ; i++){
			kissString += '\t';
		}
		console.log(kissString 
					// +  category[1]
					+ "-"  
					+ category[2]  
					+ "-" 
					// + category[0]
					);
	}
	
	if(node.sonNode){
		for(let son of node.sonNode){
			printNode(son,hasLevelMetaData);
		}
	}
}


function findLevel(node,level){
	if(!level){
		level = 1;
	}
	
	if(node.parentNodeIndex === -1){
		return level;
	}else{
		level++;
		var parentNode = nodeArray[node.parentNodeIndex] 
		return findLevel(parentNode,level);
	}
}

/**
* 新增类目树 type =1 后台类目 type=2 前台类目
*/
function insertCategoryTree(treeName,type){
	let  companyId = config.companyId;
	let  id = config.categoryTreeIdGe.next().value;
	let insertSql = 'INSERT INTO `category_tree` (  `id`,  `type`,  `name`,  `is_available`,  `is_deleted`,  `version_no`,  `create_userid`,  `create_username`,  `create_userip`,  `create_usermac`,  `create_time`,  `create_time_db`,  `server_ip`,  `update_userid`,  `update_username`,  `update_userip`,  `update_usermac`,  `update_time`,  `update_time_db`,  `client_versionno`,  `company_id`,  `description` ) VALUES  (  "'+ id +'",  "'+ type +'", "' +  treeName + '",  "1",  "0",  "0",  NULL,  NULL,  NULL,  NULL,  CURRENT_TIMESTAMP,  CURRENT_TIMESTAMP,  "",  NULL,  NULL,  NULL,  NULL,  NULL,  NUll,  NULL,  "'+companyId+'" ,  ""  )';
	return basePromise.insert(insertSql,client);
}

/*
* 新增类目
*/
function insertCategory(categortName){
	let  companyId = config.companyId;
	let  id  = config.categoryIdGe.next().value;
	let insertSql = 'INSERT INTO  `category` ( `id`, `name`, `category_lable`, `description`, `is_available`, `is_deleted`, `version_no`, `create_userid`, `create_username`, `create_userip`, `create_usermac`, `create_time`, `create_time_db`, `server_ip`, `update_userid`, `update_username`, `update_userip`, `update_usermac`, `update_time`, `update_time_db`, `client_versionno`, `company_id`)VALUES ( "'+ id +'", "'+ categortName +'", NULL, NULL, "1", "0", "0", NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, "", NULL, NULL, NULL, NULL, NULL, NULL, NULL, "'+companyId+'"  )';
	return basePromise.insert(insertSql,client);
}

/*
* 新增类目节点
*/
function  insertCategoryTreeNode(parentId,categoryTreeId,categoryId,listSort){
	let  companyId = config.companyId;
	let id = config.categoryTreeNodeGe.next().value;
	let insertSql = 'INSERT INTO  `category_tree_node` ( `id`, `parent_id`, `category_tree_id`, `category_id`, `list_sort`, `is_visible`, `is_available`, `is_deleted`, `version_no`, `create_userid`, `create_username`, `create_userip`, `create_usermac`, `create_time`, `create_time_db`, `server_ip`, `update_userid`, `update_username`, `update_userip`, `update_usermac`, `update_time`, `update_time_db`, `client_versionno`, `company_id` ) VALUES ( "'+ id +'", "'+parentId+'", "'+categoryTreeId+'", "'+categoryId+'", "'+listSort+'", NULL, "1", "0", "0", NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, "'+companyId+'" )';
	return basePromise.insert(insertSql,client);
}

/*
* 新增前台page
*/
function insertPage(pageName){
	let id = config.pageIdGe.next().value;
	let  companyId = config.companyId;
	let insertSql = 'insert into page (id,type,name,is_available,is_deleted,company_id) values ( "'+ id +'",1,"'+pageName + '",1,0,"'+companyId+'")';
	return basePromise.insert(insertSql,client);
}

/**
* 新增前台pageTree
*/
function insertPageCategoryTree(pageId,treeId){
	let id = config.pageCategoryTreeIdGe.next().value;
	let  companyId = config.companyId;
	let  insertSql = 'insert into page_category_tree(id,page_id,category_tree_id,is_available,is_deleted,company_id)values ("'+ id +'","'+pageId+ '","'+treeId+'",1,0,"'+companyId+'")';
	return basePromise.insert(insertSql,client);
}

function insertRelation(frontNodeId,backNodeId){
	let  companyId = config.companyId;
	let id = config.relatinIdGe.next().value;
	let insertSql = 'INSERT INTO category_tree_node_relation (  id,  left_tree_node_id,  right_tree_node_id,  sort_value,  type,  is_available,  is_deleted,  company_id  )  VALUES  (  "'+ id +'",  '+ frontNodeId + ',  '+ backNodeId+ ',  1,  1,  1,  0,  '+ companyId + '  )'
	return basePromise.insert(insertSql,client);
}


/**
* 方法入口
* printNode 类目展示
* dbOp  数据库插入 
*/
// printNode(rootNode,false);
// client.end();

// dbOp(rootNode);

// frontRootCate().then(function(){
// 	client.end();
// })


exports.start = function(iconfig,dbClient){
	config = iconfig;
	client = dbClient;
	console.log(config.splitSymbol);
	console.log("category add start");

	companyId = config.companyId;
    rootNode = getRootNode(config);
	rootNode.parentId = 0;
	//nodeArray 使用全局变量，便于重排
	nodeArray = new Array();
	
	reArray(rootNode,nodeArray);

	return rootData()
	.then(function(){
		return frontRootCate();
	})
	.then(function(){
		var jsonMapping = JSON.stringify(mapArray);
		// fs.writeFile(path.join(__dirname, './mapping/categoryMapping.json'), jsonMapping);
		return basePromise.fileWrite(path.join(config.rootPath, './mapping/categoryMapping.json'), jsonMapping)
						  .then(function(value){
						  	console.log(`--${value}`);
						  	return Promise.resolve("category add done");
						  })
		
	})
}

exports.validate = function(config){
	var rootNode = getRootNode(config);
	rootNode.parentId = 0;
	console.log(rootNode);
	printNode(rootNode,false);
	return Promise.resolve("done");
}


