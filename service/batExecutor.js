var path = require("path");
var Promise = require("bluebird");
const spawn = require("child_process").spawn;
var mysqlDump = require('mysqldump');
var basePromise = require("../lib/basePromise");

/**
* test unpass
*/
function executePromise(conifg){
	const exec = require("child_process").exec;
	exec('cmd.exe /c "C:\\Program Files\\Git\\importTool\\shell\\export.bat" "C:\\Program Files\\Git\\importTool\\csv\\"',(err,stdout,stderr)=>{
		console.log(err);
		console.log(stdout);
		console.log(stderr);
	})
}

/**
* cant pass bat args with space,so @deprecate
*/
function spawnPromise(config){
	return new Promise(function(resolve,reject){
		var batDir =  path.join(config.rootPath,config.shellPath) ;
		// var outDir =  path.join(config.rootPath,config.out);
		// console.log(outDir);

		var bat = spawn("cmd.exe",["/c",batDir]);

		bat.stdout.on('data',(data)=>{
			if(config.stdoutSwitch){
				console.log(data + "");
			}
		})

		bat.stderr.on('data',(data)=>{
			if(config.stdoutSwitch){
				console.log(data + "");
			}
			// reject("bat file execute failed!");
		})

		bat.on('exit',(code)=>{
			console.log(`-- Child exited with code ${code}`);
			resolve("bat file execute done!");
		})
	});
}


exports.start = function(config){
	console.log(config.splitSymbol);
	console.log("dump sql start");

	if(config.db.singleDatabase){
		return dumpPromise(config,config.db.database,config.db.dumpTables).then(value=>{
			console.log(`--${value}`);
			return Promise.resolve("db dump complete")
		})
	}else{
		var fullTables = config.db.dumpTables;
		return getAllDatabaseDump(config,fullTables);
	}
}


function getAllDatabaseDump(config,fullTables){
	var tableMap = getDbMap(fullTables);
	var tablesArray =  Array.from(tableMap);
	return Promise.mapSeries(tablesArray,(tables,index)=>{
		return dumpPromise(config,tables[0],tables[1])
	}).then((values)=>{
		basePromise.printAll(values);
		return Promise.resolve("db dump complete")
	})
}

function getDbMap(fullTables){
	var dbs = new Map();

	for(let table of fullTables){
		var index = table.indexOf(".");
		var db = table.substring(0,index);
		var tab = table.substring(index+1);
		if(dbs.has(db)){
			let tableArray = dbs.get(db);
			tableArray.push(tab);
			// console.log(tableArray);
		}else{
			let tableArray = [];
			tableArray.push(tab)
			dbs.set(db,tableArray);
		}
	}
	// console.log(JSON.stringify(Array.from(dbs)));
	return dbs;
}



function dumpPromise(config,database,tableArray){
	return new Promise(function(resolve,reject){
		mysqlDump({
		    host: config.db.host,
		    port: config.db.port,
		    user: config.db.user,
		    password: config.db.password,
		    database: database,
		    schema:config.db.dumpSchema,
		    tables:tableArray, // only these tables 
		    where: {}, // Only test players with id < 1000 
		    ifNotExist:false, // Create table if not exist 
		    dest:config.db.dumpFolder + database + ".sql"// destination file 
		},function(err){
		   if(err){
		   	 console.log(err);
		   	 reject(err);
		   } else{
		   	 resolve(`--${database} dumped`);
		   }
		}) 
	})
}


// var dbConfig = {
// 	host:"localhost",
// 	port:'3306',
// 	user:'root',
// 	password:'root',
// 	database:"product",
// 	dumpTables:["attribute_name","attribute_value"],
// 	dumpFolder:"../shell/init.sql"
// }


// dumpPromise({db:dbConfig})

// getDbMap(["product.attribute_name","product.attribute_value"]);

// this.start({rootPath:__dirname,shellPath:"../shell/export.bat",stdoutSwitch:true,out:"../csv/"})