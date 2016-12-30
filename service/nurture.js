var xlsx = require("node-xlsx");
var path = require("path");
var fs = require('fs');
var stringify = require("csv-stringify");
var iconv = require('iconv-lite');
var basePromise = require("../lib/basePromise.js")


function  textRead(fileName){

	return new Promise(function(resolve,reject){
		var readStream  = fs.createReadStream(fileName);
		var text = "";
		var t = new Array();
		readStream.on("data",data =>{
			text += data;
			// console.log("" +data);
			var index = text.indexOf('\n');
			while(index > -1){
				var line = text.substring(0,index);
				t.push(line);
				text = text.substring(index + 1);
				// console.log(line);
				index = text.indexOf('\n');
			}
		})

		readStream.on("end",function(){
			if(text.length > 0){
				t.push(text);
			}
			resolve(t);
			// console.log(t.length)
		})
	})
}

function rawExcel(config){
	var dir = path.join(config.rootPath,config.excel.name || "../data/mp.xlsx");
	var excel = xlsx.parse(fs.readFileSync(dir));
	for(let sheet of excel){
		if(sheet.name == (config.mpSheetName || "商品")){
			return sheet.data
		}
	}
}






function rawDataReplace(config){

	var brandColumn = config.excel.brandColumn || 3;  // 品牌所在列
	var categoryCodeColumn = config.excel.categoryCodeColumn || 4; // 类目code所在列
	var attributeColumn = config.excel.attributeColumn || 6; //属性所在列
	var mpData = rawExcel(config);

	return Promise.all([
		textRead(path.join(config.rootPath,"./convert/brand_id_out.txt")),
		textRead(path.join(config.rootPath,"./convert/pr_cate_out.txt")),
		textRead(path.join(config.rootPath,"./convert/attribute_out.txt"))
	]).then(values =>{

		console.log(`--excel validate data l4h: ${mpData.length -1}`)
		for(let converdata of values){
			console.log(`--conver data l4h : ${converdata.length}`)
		}

		var haveSetMinHead = csvHeader(config);
		//第一行excel表头忽略
		for(let i in mpData){
		
			if(i > 0){
				mpData[i][brandColumn] = values[0][i -1];
				mpData[i][categoryCodeColumn] = values[1][i-1];
				mpData[i][attributeColumn] = values[2][i-1];
				csvWriter(config,[haveSetMinHead ? mpData[i].concat(config.csv.minDefault) : mpData[i]]);
			}
			
			// if(i == 1){
				// console.log(mpData[i])
			// }
		}

	})
	
}

function csvHeader(config){
	if(config.csv.minDefault && config.csv.minDefault.length > 0){
		var combineDhead = config.csv.dHead.concat(config.csv.minDHead);
		var combineChead = config.csv.cHead.concat(config.csv.minCHead);
		csvWriter(config,[combineDhead]);
		csvWriter(config,[combineChead]);
		return true;
	}else{
		csvWriter(config,[config.csv.dHead]);
		csvWriter(config,[config.csv.cHead]);
		return false;
	}
}

function csvWriter(config,row){
	try{
		var filePath = path.join(config.rootPath,config.csv.destFolder,config.treeName + ".csv");
		stringify(row, function(err, output){
		    let recordString = iconv.encode(output,'GBK');
		    // console.log(output);
		    fs.appendFileSync(filePath, recordString);
		 });
	}catch(err){
		console.log(err);
	}
}


exports.start = function(config){
	console.log(config.splitSymbol);
	console.log("csv assemble start")
	return rawDataReplace(config).then(function(){
		return Promise.resolve("csv assemble done")
	})
}
// rawDataReplace({rootPath:__dirname})