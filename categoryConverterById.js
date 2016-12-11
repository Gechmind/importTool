var fs = require("fs");
var path = require("path");
var Promise = require("bluebird");
//[[code -categoryId]...]
var mapping = JSON.parse(fs.readFileSync("./mapping/categoryMapping.json"));
var productCateCode = JSON.parse(fs.readFileSync("./data/pr_cate_in.json"));

var map = new Map();
for(let relation of mapping){
	map.set(relation[0],relation[1]);
}

var categoryString = "";
var categoryArray = new Array();


for(let catecode of productCateCode){
	let id = map.get(catecode);
	if(!id){
		//打印在类目表中找不到数据的类目code
		console.log(catecode);
	}
	categoryString += id + "\n";
	categoryArray.push(id);
}


fs.writeFile(path.join(__dirname,"./data/categoryId.json"),JSON.stringify(categoryArray));
fs.writeFile(path.join(__dirname,"./convert/pr_cate_out.txt"), categoryString);

exports.categoryConvert = function()