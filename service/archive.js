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


function baseFolderComfirm(config){
	var archiveBaseFolderExist = true;
	var convertFolder = path.join(config.rootPath,"./convert/");
	var mapFolder = path.join(config.rootPath,"./mapping/");
	var destFolder = path.join(config.rootPath,config.csv.destFolder);
	var dataFolder = path.join(config.rootPath,"./data/");
	if(!fs.existsSync(convertFolder)){
		fs.mkdirSync(convertFolder);
	}
	if(!fs.existsSync(mapFolder)){
		fs.mkdirSync(mapFolder);
	}
	if(!fs.existsSync(destFolder)){
		fs.mkdirSync(destFolder);
		archiveBaseFolderExist = false;
	}
	if(!fs.existsSync(dataFolder)){
		fs.mkdirSync(dataFolder);
	}
	return archiveBaseFolderExist;
}

// archive({rootPath:__dirname,destPath:"../csv/"});
// mkArchiveDir({rootPath:__dirname,destPath:"../csv/"});

exports.start = function(config){
	console.log(config.splitSymbol);
	console.log("file archive start")
	if(baseFolderComfirm(config)){
		mkdir(config);
	}
	return Promise.resolve("file archive end")
}
