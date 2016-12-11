var fs = require("fs");
var path = require("path");
var Promise = require("bluebird");

exports.printAll = function(result){
	for(let content of result){
		console.log(`--${content}`);
	}
}

exports.fileWrite = function(fileName,data){
	return new Promise(function(resolve,reject){
		fs.writeFile(fileName,data,(err) => {
			if(err)  reject(err);
			let sep = path.sep;
			let startIndex = fileName.lastIndexOf(sep)+1;
			let endIndex = fileName.lastIndexOf(".");
			let simpleName = fileName.substring(startIndex,endIndex);
			resolve(`async write <${simpleName}> done`);
		})
	})
}

exports.mkdir = function(path,shortPath){
	return new Promise(function(resolve,reject){
		fs.mkdir(path,(err)=>{
			if(err){
				reject(err);
			}else{
				resolve(`archive path <${shortPath}> make done`)
			}
		})
	})
}

exports.move = function(oldPath,newPath,shortPath){
	return new Promise(function(resolve,reject){
		fs.rename(oldPath,newPath,(err)=>{
			if(err){
				reject(err)
			}else{
				resolve(`file <${shortPath}> move done`)
			}
		})
	})
}



/*
* 插入sql模板，返回插入的Id
*/
exports.insert = function(insertSql,client){
	return new Promise(function(reslove,reject){
	    	client.query(
	    		insertSql,
	    		function(err,res){
	    			if (err) {
	    				console.log(insertSql);
	    				reject(err);
	    			}else{
	    				var resultJsonString = JSON.stringify(res);
	    				var json = JSON.parse(resultJsonString);
	    				reslove(json.insertId);
	    			}
	    		}
	    	)
  	})
}


exports.query = function(querySql,client){
	return new Promise(function(reslove,reject){
		client.query(
			querySql,
			function(err, rows, fields) {
		    if (err) {
		    	reject(err);
		    }else{
		    	reslove(JSON.stringify(rows));
		    };
		})
	}).then(function(value){
		return Promise.resolve(JSON.parse(value));
	});
}