var fs = require('fs');
var path = require('path');
var Promise = require("bluebird");



function archive(config,archivePath){
	var destDir = path.join(config.rootPath,config.csv.destFolder);
	var files = fs.readdirSync(destDir);
	files.forEach(pathName => {
		var info = fs.statSync(destDir + pathName);
		if(!info.isDirectory()){
			console.log(pathName);
			fs.renameSync(path.join(destDir,pathName),path.join(archivePath,pathName));
		}
	})
}


function mkdir(config){
	var timestap = new Date().getTime() + "/";
	//归档路径加入公司中文名称
	timestap = config.treeName + timestap;
	var archivePath = path.join(config.rootPath,config.csv.destFolder,timestap)
	fs.mkdirSync(archivePath)
	archive(config,archivePath);
}


// archive({rootPath:__dirname,destPath:"../csv/"});
// mkArchiveDir({rootPath:__dirname,destPath:"../csv/"});

exports.start = function(config){
	console.log(config.splitSymbol);
	console.log("file archive start")
	mkdir(config);
	return Promise.resolve("file archive end")
}
