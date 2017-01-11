var xlsx = require("node-xlsx");
var path = require("path");
var fs = require('fs');
var stringify = require("csv-stringify");
var iconv = require('iconv-lite');
var basePromise = require("../lib/basePromise.js")
var categoryService = require("./categorycodeconvert.js");
var brandService = require("./brandconvert.js");
var attrService = require("./attributeconvert.js");

var client;
var config;
var cateMap;
var brandMap;
var attrMap;
var currentFileIndex = 0;

function queryPromsie(onlineQuerySql){
	// console.log(onlineQuerySql);
    return  basePromise.query(onlineQuerySql,client)
}


function pageQuery(stratIndex,fn,pageConfig){
    var sql =  pageConfig.initSql + stratIndex + "," + pageConfig.pageSize;
   
    // console.log("xxx");
    return queryPromsie(sql)
    	   .then((values)=>{
			    	return fn(values,stratIndex).then(()=>{
			    		var totalCount = stratIndex + values.length;
						if(values.length < pageConfig.pageSize || (pageConfig.totalLimit && totalCount + pageConfig.pageSize> pageConfig.totalLimit)){
				            console.log(`--${pageConfig.source}_total count:${totalCount}`);
				            return Promise.resolve(`--All ${pageConfig.source} data fetch down`);
				        }else{
				        	stratIndex += pageConfig.pageSize;
				        	console.log(`--${pageConfig.source}_startIndex:${stratIndex}`);
				            return pageQuery(stratIndex,fn,pageConfig)
				        }
			    	})
	    	})
		    .catch((err)=>{
		    	return Promise.reject(err);
			})
}


function emptyPromise(values,startIndex){
	//生成数组
	var t = [];
	var setMinHead = config.csv.minDefault && config.csv.minDefault.length > 0;
	console.log(setMinHead);
	for(let row of values){
		var x = [];
		x.push(row.code + "\t");
		x.push(row.name);
		x.push(row.title);

		if(!cateMap.get(row.catecode)){
			console.log(row.catecode);
			continue;
		}
		x.push(cateMap.get(row.catecode) + "\t");
		// x.push(row.catename);
		if(config.csvMode){
			var name = row.brandname;
	  	  	name = name.replace(" ♥关注","");
			x.push(name);
		}else{
			x.push(brandMap.get(row.brandname));
		}
		
		x.push(row.price);
		x.push(row.mkprice);
		x.push(row.urls);
		x.push(row.content);
		if(config.csvMode){
			x.push(row.attr);
		}else{
			var attIdPair = attrService.getAttributeIdPair(JSON.parse(row.attr),attrMap);
			// console.log(JSON.stringify(attIdPair));
			x.push(attIdPair);
		}
		//初始销量
		x.push(Math.floor(Math.random(1)*1000))
		if(setMinHead){
			x = x.concat(config.csv.minDefault)
		}
		t.push(x);
	}
	var sigleFileRows = config.onlineConfig.sigleFileRows;

	if(startIndex === 0){
		csvHeader(config,currentFileIndex)
	}else if((currentFileIndex + 1) * sigleFileRows <= startIndex){
		currentFileIndex++;
		csvHeader(config,currentFileIndex)
	}

	csvWriter(config,t,currentFileIndex);
	return Promise.resolve("dummzy");
}

function getProduct(batch){
	 var t = "select `code`,  \
			  `name`,  \
			  `title`,  \
			  `catecode`,  \
			  `catename`,  \
			  `brandname`,  \
			  `attr`,  \
			  `price`,  \
			  `mkprice`,  \
			  `urls`,  \
			  `content` \
			  from `test`.`mp` where `batch` = " + batch + " LIMIT ";
	return t;
}





function csvHeader(config,fileIndex){
	if(config.csv.minDefault && config.csv.minDefault.length > 0){
		var combineDhead = config.csv.dHead.concat(config.csv.minDHead);
		var combineChead = config.csv.cHead.concat(config.csv.minCHead);
		csvWriter(config,[combineDhead],fileIndex);
		csvWriter(config,[combineChead],fileIndex);
		return true;
	}else{
		csvWriter(config,[config.csv.dHead],fileIndex);
		csvWriter(config,[config.csv.cHead],fileIndex);
		return false;
	}
}

function csvWriter(config,row,fileIndex){
	try{
		var filePath = path.join(config.rootPath,config.csv.destFolder,"test" + fileIndex + ".csv");
		stringify(row, function(err, output){
		    let recordString = iconv.encode(output,'GBK');
		    // console.log(output);
		    fs.appendFileSync(filePath, recordString);
		 });
	}catch(err){
		console.log(err);
	}
}


exports.start = function(iconfig,iclient){
	console.log(iconfig.splitSymbol);
	console.log("csv assemble<data from db> start")
	cateMap = categoryService.getCategoryMap(iconfig);
	brandMap = brandService.getBrandMap(iconfig);
	attrMap = attrService.getAttributeMap(iconfig);
	
	client = iclient;
	config = iconfig

	var pageConfig = config.onlineConfig;
	pageConfig.source ="localProduct"
	pageConfig.initSql = getProduct(config.onlineConfig.batch)
	pageConfig.totalLimit = null

	return pageQuery(0,emptyPromise,pageConfig).then(()=>{
		return Promise.resolve("csv assemble<data from db> done")
	})
}