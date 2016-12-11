var mysql = require("mysql");
var fs = require("fs");
var path = require("path");

var originJSON = JSON.parse(fs.readFileSync("./data/originCategory_lyf.json"));

/**
* 来伊份SAP类目数据构建
*/
var newCategoryArray = new Array()
for(let cate of originJSON){
	var code = cate[0];
	var length = code.length;
	var parentCode = code.substr(0,length-2);
	if(parentCode == ""){
		parentCode = 0;
	}
	var newCate = new Array();
	newCate[0] = code;
	newCate[1] = parentCode;
	newCate[2] = cate[1];
	newCate[4] = length/2;
	newCate[5] = cate[2];
	console.log(newCate);
	newCategoryArray.push(newCate);
} 

fs.writeFile(path.join(__dirname, './data/category_lyf.json'), JSON.stringify(newCategoryArray));

