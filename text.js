function attributeWash(attr){
	var jsonAttr = JSON.parse(attr);
	var obj = {};
	for(let key in  jsonAttr){
		if(key == "" ){
			// console.log("got");
		}else if(key.endsWith("：")){
			var newKey = key.substring(0,key.length-1)
			obj[newKey] = jsonAttr[key]
		}else{
			obj[key] = jsonAttr[key]
		}
	}
	// console.log(JSON.stringify(obj));
	return JSON.stringify(obj);
}

var t = '{"货号：":"571432219","品牌：":"361°","鞋面材质：":"合成革","适用性别：":"男","里料材质：":"网布","上市时间：":"2015年春季","默认快递：":"申通,EMS,韵达","":""}'


attributeWash(t);