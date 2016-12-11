var path = require("path");
var fs = require("fs");
var sizeOf = require('image-size');
var mysql = require("mysql");
var Promise = require("bluebird");
var urlencode = require('urlencode');


var files = fs.readdirSync("./picture/");
var  merchantProductSize = 0;
var  counter = 0;

var urlRootPath = "http://saas.kss.ksyun.com/***/";

var client = mysql.createConnection({
    host:"localhost",
    port:'3306',
    user:'root',
    password:'root',
    database:"test"
});

//新建连接
client.connect();


/**
* 读取商品目录下所有图片，按规则生成url。
* 根据不同的图片分辨率排序。
* 目录外层是文描图片，内层目录是 商品主图、附属图。
*/
exports.getAllFiles = function (dir, urlRootPath,callback) {
  var filesArr = new Array;
  dir = /\/$/.test(dir) ? dir : dir + '/';
  (function dir(dirpath,urlPath,isDesc,fn) {
    var files = fs.readdirSync(dirpath);

    // console.log(files);
   files.map((item,index) => {
      var info = fs.statSync(dirpath + item);
     
      if (info.isDirectory()) {
        dir(dirpath + item + '/', urlPath + item + '/',false,fn);
      } else {
      	var dimensions = sizeOf(dirpath+item);
        //大图放到前面
      	// console.log(dimensions.width,dimensions.height);
        var urlFullPath = urlPath + urlencode(item)
        urlFullPath = urlFullPath.replace("(","%28");
        urlFullPath = urlFullPath.replace(")","%29");
      	// if(dimensions.width >= 800 && dimensions.height >= 800){
      	// 	filesArr.unshift(urlFullPath)
      	// }
       //  filesArr.push(urlFullPath)
       if(isDesc){
          let descArray;
          if(filesArr.length == 0){
            descArray  = new  Array();
            filesArr.push(descArray);
          }else{
            descArray = filesArr[0];
          }
          descArray.push(urlFullPath)
       }else{
          let picArray;
          if(filesArr.length == 1){
            picArray  = new  Array();
            filesArr.push(picArray)
          }else{
            picArray = filesArr[1];
          }
          picArray.push(urlFullPath)
       }

        // filesArr.push(dirpath + item);
        callback && callback(dirpath + item);
          // next();
      }
    });
  })(dir,urlRootPath,true);
  return filesArr;
}




/**
* 读取商品文件根目录下所有商品目录，迭代获取对应的图片数据，文描数据。
* 1、第一个图片为主图，后续图片使用逗号分隔开。
* 2、根据所有的文描图片，生成html文本。
*/
function rootPathDirTraverse(rootPath){
   var files = fs.readdirSync(rootPath);
   merchantProductSize = files.length;
   files.forEach((merchantPath,index)=>{
      var info = fs.statSync(rootPath + merchantPath);
      console.log(merchantPath);
      if(!info.isDirectory()){
        console.log("error:非目录文件",merchantPath);
      }else{
        var imageNames = exports.getAllFiles(rootPath + merchantPath,urlRootPath+merchantPath +"/");
        var descUrl = imageNames[0];
        var picUrl = imageNames[1];
        //<img src=""http://img10.360buyimg.com/imgzone/jfs/t2800/26/2203404159/323078/d8a2df6b/575f6934N10e2b9ed.jpg"" alt="""" /> 
        var desc = '<div style="text-align: center;">'
        for(let url of descUrl){
            desc += '<img src="' + url + '" alt=""/>';
        }
        desc += '</div>'

        var mainPic = ""
        for(let mp of picUrl){
          mainPic += mp +","
        }
         mainPic = mainPic.substr(0,mainPic.length - 1);
        insertPictureTemp(merchantPath,mainPic,desc);
        // console.log(mainPic);
      }
   })
}

function insertPictureTemp(code,urls,desc){
  var insertSql = "insert into test.picture (id,code,urls,content) values (null, '" + code + "','" +  urls + "','" + desc + "')";
  // console.log(insertSql);
  return insertClient(insertSql).then(function(){
      counter++;
      if(counter == merchantProductSize){
        client.end();
      }
  })
}

/*
* 插入sql模板，返回插入的Id
*/
function insertClient(insertSql){
  return new Promise(function(reslove,reject){
        client.query(
          insertSql,
          function(err,res){
            if (err) {
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


rootPathDirTraverse("./picture/");

