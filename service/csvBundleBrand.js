var fs = require("fs");
var path = require("path");
var Promise = require("bluebird");
var basePromise = require("../lib/basePromise");
var stringify = require("csv-stringify");
var iconv = require('iconv-lite');
var brandJson;
var brandMapping = new Array();

var config;
var client;

function getBrandFromDb(){
	var sql = "select DISTINCT(trim(brandname)) as name from test.mp where batch = " + config.onlineConfig.batch;
	return basePromise.query(sql,client)
		  .then(values =>{
		  	  var  brandSet = new Set();
		  	  for(let index in values){
		  	  	var name = values[index].name;
		  	  	name = name.replace(" ♥关注","");
				brandSet.add(name);
			  }
			  console.log(`--总数:${brandSet.size}`);
			  return Promise.resolve(brandSet);
		  }).catch((err)=>{
			return Promise.reject(err);
		  })
}

function getBransJson(){
	//从数据库中抽取brand名称数据

	var dir = path.join(config.rootPath,config.brand || "./data/brand.json");
	var  brandSet = new Set();
	brandJson = JSON.parse(fs.readFileSync(dir));
	for(let index in brandJson){
		brandSet.add(brandJson[index]);
	}
	console.log(`--总数:${brandSet.size}`);
	return Promise.resolve(brandSet);
}



function startInner(brandPromise){
	brandPromise.then(brandSet =>{
		var t = [];
		for(let name of brandSet){
			t.push([name,name])
		}
		csvWriter(config,t);
		return Promise.resolve("")
	})
	
}

function csvHeader(config){
	csvWriter(config,[["brandName","alias"],["品牌中文名称*","品牌别名"]]);
}

function csvWriter(config,row){
	try{
		var filePath = path.join(config.rootPath,config.csv.destFolder,"brand.csv");
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
	client = iclient;
	config = iconfig;
	console.log(config.splitSymbol);
	console.log("brand csv generate start");
	// csvHeader(config);
	// startInner(getBransJson());
	// return Promise.resolve("brand csv generate end")

	return getBrandFromDb().then(brandSet =>{
		csvHeader(config);
		var t = [];
		for(let name of brandSet){
			t.push([name,name])
		}
		csvWriter(config,t);
		return Promise.resolve("brand csv generate end")
	})
}