// var Promise = require("bluebird");
var co =  require("co");

// function time(array,time){
// 	return new Promise(function(){
// 		setTimeout(function(){
// 			for(let i of array){
// 				console.log(i);
// 			}
// 		}, time);
// 	})
// }

// var t = [0,1,2,35,6];

// time(t,1000);

// t = [8,9,0,0,5,8,54,23]

// // time(t,1500);


// var t = [0,1];

// var p = Array.prototype.push;
// console.log(t);

// p.apply(t,[3,4])

// console.log(t.toString());


// var async = require("async");

// async.waterfall([
//  	function (callback){var a=5;console.log('OK1'); setTimeout(function (){callback(null,a*2)},1000);},
//  	function(data,callback){console.log('OK2');setTimeout(function(){callback(null,data+7,data)},2000);},
// 	function(result1,result2,callback){console.log('OK3');setTimeout(function (){callback(null,result1-9,result2)},3000);}
// 	],
// 	function(err,kk,jj){console.log(kk);console.log(jj);}
// )
 // Include modules.
 // var xlsx = require('node-xlsx');
 // var fs = require('fs');
 
 // // 写入excel之后是一个一行两列的表格
 // var data1 = [
 // ['name', 'age']
 // ];
 
 // // 写入excel之后是一个三行两列的表格
 // var data2 = [
 // ['name', 'age'], 
 // ['zhang san', '10'], 
 // ['li si', '11']
 // ];
 
 // var buffer = xlsx.build([
 //  {
 //      name:'sheet1',
 //      data:data1
 //  }, {
 //      name:'sheet2',
 //      data:data2
 //  }
 //  ]);
 
 // fs.writeFileSync('book.xlsx', buffer, {'flag':'w'}); // 如果文件存在，覆盖
function getNu(){
	return function(cb){
		cb();
	};
}

// function* ge(t){
// 	while(t < 10){
// 		console.log(t);
// 		var t = yield t++;
// 		return 
// 	}
// }


co(function* (){
	// var x = ;
	var t = 1;
	while(t < 10){
		var x = yield Promise.resolve(1);
		console.log(x)
	}
	
	// console.log(t)
})
// // function t(){
// 	var x =  ge();
// 	// console.log(x.next().value);
// }

// t();

// function* genFuncWithReturn() {
//   yield 'a';
//   yield 'b';
//   return 'The result';
// }
// function* logReturned(genObj) {
//   let result = yield* genObj;
//   console.log(result);
// }

// console.log([...logReturned(genFuncWithReturn())]);

// 数组的写法
co(function* () {
  var res = yield [
    Promise.resolve(1),
    Promise.resolve(2)
  ];
  console.log(res); 
})

// 对象的写法
co(function* () {
  var res = yield {
    1: Promise.resolve(1),
    2: Promise.resolve(2),
  };
  console.log(res); 
})