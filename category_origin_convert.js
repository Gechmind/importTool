var mysql = require("mysql");
var fs = require("fs");
var path = require("path");
var Promise = require("bluebird");

var originJSON = JSON.parse(fs.readFileSync("./data/originCategory.json"));
/**
* 树形类目转换为递归类目
**/


//通过数据来获取层级

var levelSize = originJSON[0].length; 
var codeHolder = new Array(levelSize);
var size = originJSON.length;

function* codeGenerator(){
	let cateId = 1;
	while(true){
		yield cateId;
		cateId++;
	}
}

var codeG = codeGenerator();
var newCategoryArray = new Array();
var convertCate = new Array(5);
//当前受理层级
// 0 -  code 1 - parentcode 2 - name 3 -url  4-level 5-leaf 
var countLevel = 0;
for(var index = 0;index < size; index++){
	let tempCate = originJSON[index]
	for(let innner = 0;innner < levelSize; innner++){
		// console.log(tempCate);
		if( tempCate[innner] ){
			var convertCate = new Array(5);
			var currentCode = codeG.next().value;
			//层级上溯，上溯层级后的container数据全部清除掉
			if(innner < countLevel){
				countLevel = innner;
				cleanHolder(codeHolder);
			}
			//更新当前路径栈
			codeHolder[innner] = currentCode;

			convertCate[0] = currentCode;
			//父code写入
			if(innner == 0){
				convertCate[1] = 0;
			}else{
				convertCate[1] = codeHolder[innner - 1];
			}
			convertCate[2] = tempCate[innner];
			convertCate[3] = innner;
			console.log(convertCate)
			newCategoryArray.push(convertCate);
		}
	}
}

function cleanHolder(hodler,index){
	for(let i= index;index < hodler.length;i++){
		hodler[i] = null;
	}
}


fs.writeFile(path.join(__dirname, './data/category.json'), JSON.stringify(newCategoryArray));