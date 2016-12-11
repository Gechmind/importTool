var parse = require("csv-parse");
var iconv = require('iconv-lite');
var fs = require("fs");
var mysql = require("mysql");
var Promise = require("bluebird");
var stringify = require("csv-stringify");
var stringifier = stringify({delimiter:","})
var stream = require("stream")
var es = require("event-stream")
var brandMap = new Map();
var attrIndex = [];
var attrObjetArray = [];
var contentCount = 0;
var totalRecordNum = 7176; //需要处理的数据记录数，切分的文件需要去掉文件头
var numPerFile = 1000; //单个文件大小，反之记录数过多，文件过大，nginx的文件大小为10M
//17列  record  13列
//"guarantee","merchantSeriesCode","seriesAttribute","商品保障名称","系列品编码","系列属性",
var header = [["chineseName","categoryTreeNodeId","thirdMerchantProductCode","attribute","merchantProductPrice","marketPrice","settlePrice","brandName","grossWeight","netWeight","realStockNum","placeOfOrigin","type","saleType","combinType","isBargain","freightAttribute","shortcutPurchase","url","freightTemplateName","code","calculationUnit","content"],["商品名称*","商品类目ID*","第三方商品编码","属性值","普通售价*","市场价*","结算价","品牌名称*","毛重*","商品净重*","库存量","产地*","商品类型*","销售类型*","组合商品类型","议价类型","配送属性*","一键购","商品图片","运费模板名称","商品编码","计量单位","文描"]]

var client = mysql.createConnection({
		host:"localhost",
		port:'3306',
		user:'root',
		password:'root',
		database:"test"
});

//新建连接
client.connect();

// var xlsx = require("node-xlsx");

// var data = xlsx.parse(fs.readFileSync(__dirname+'/meta/meta.xlsx'));

// console.log(__dirname+'/meta/xmeta.xlsx');
function rebuildArray(record,newFile,filePath){


	var newRecord = [];
  // newRecord.push('"7天无理由退换","正品保障","48小时发货","品牌授权"');//系列品编码
  // newRecord.push(record[3]);//系列品编码
  // newRecord.push(record[30]);//系列属性
	newRecord.push(record[4]);//商品名称
	newRecord.push(record[12]+"\t");//商品类目
	newRecord.push(record[5]+"\t");//商品条形码
	newRecord.push(record[25]);//属性
	newRecord.push(record[14]);//售价
	newRecord.push(record[15]);//市场价
	newRecord.push(record[16]);//结算价
	newRecord.push(record[8]);//品牌名称
	newRecord.push(0);//毛重
	newRecord.push(0);//净重
	newRecord.push(record[17]);//库存
	newRecord.push(record[13]);//产地
	newRecord.push(record[18]);//商品类型
	newRecord.push(record[19]);//销售类型
	newRecord.push(record[20]);//组合商品类型
	newRecord.push(record[21]);//议价类型
	newRecord.push(record[22]);//配送属性
	newRecord.push(record[23]);//shortcutPurchase
	newRecord.push(record[24]);//url
  newRecord.push(record[8]);//运费模板
  newRecord.push(record[3]);//商品编码
  newRecord.push("");//计量单位


  if(record[14] <= 0 || record[15] <= 0 || record[16] <= 0){
    console.log("价格错误" + record[5]); 
  }
  // newRecord.push(record[29]);//文描
  // newRecord.push(record[24]);//url
	// newRecord.push(record[25]);
	// return newRecord;
	// fileWriter(newRecord,newFile,filePath);
	return getUrlAndContent(record[5]).then(function(dbContent){
		var t = dbContent[0];
		if(t){
			// var re = /jpg_300x300\./gi;
			// var url = t.imgs;
			// if(url){
			// 	url = url.replace(re,"")
			// }else{n
			// 	console.log("kon",record[2]);
			// 	url = "";
			// }
			// newRecord.push(url); //图片41744
			
			// console.log(newRecord);
			newRecord.push(t.content);//文描
		}else{
			// newRecord.push(""); //图片
			newRecord.push("");//文描
		}

		var temp = [newRecord];
    if(newFile){
     	temp = header.concat(temp);
    }

	
		 stringify(temp, function(err, output){
            let recordString = iconv.encode(output,'GBK');
            // console.log(output);
            fs.appendFileSync(filePath, recordString);
   	 	});

   	 	contentCount ++;
   	 	// console.log("m:" + contentCount);
   	 	if(contentCount ===  totalRecordNum){
   	 		client.end();
   	 		console.log("处理完毕");
   	 	}
	})
}

function asyncFileWrite(record,newFile,filePath){
	 rebuildArray(record,newFile,filePath);
}

function fileWriter(newRecord,newFile,filePath){
	// console.log(newRecord);
	var temp = [newRecord];
    if(newFile){
     	temp = header.concat(temp);
    }

	stringify(temp, function(err, output){
        let recordString = iconv.encode(output,'GBK');
        // console.log(output);
        fs.appendFileSync(filePath, recordString);
	 });
}

function xparse(data){
    // console.log(data);
    for(let record of data){
        let brandName = record[8];
        let attr = record[25];
      
        if(!(attr == "")){
          //相关属性全部转成大写
          if(!attr){
            console.log(attr);
          }
          
          attr = attr.toUpperCase();
          let attPairs = attr.split("|");
          var nameApperder = ""
          var jsonObject = {};

          for(let att of attPairs){
               //1 - 值  - 名
              let kv = att.split(":");
              if(!kv[0] || !kv[1]){
                console.log(attr);
                console.log(attPairs);
                console.log(kv);
                console.log(record[5]);
              }

             var teS = kv[1].trim();
              if(teS.indexOf("2XL") > -1){
                teS =  teS.replace("2XL","XXL");
              }else if(teS.indexOf("2xl") > -1){
                teS = teS.replace("2xl","XXL");
              }else if(teS.indexOf("3XL") > -1){
                teS = teS.replace("3XL","XXXL");
              }else if(teS.indexOf("4XL") > -1){
                teS = teS.replace("4XL","XXXXL");
              }else if(teS.indexOf("5XL") > -1){
                teS = teS.replace("5XL","XXXXXL");
              }

            
              // nameApperder += kv[1] + "-";
             
              //属性集
              if(!attrIndex.includes(kv[0].trim())){
                 let attObject = {};
                 //属性名
                 attObject["name"] = [kv[0]];
                 attObject["default"] = [teS];
                 attrIndex.push(kv[0]);
                 attrObjetArray.push(attObject);
              }else{
                var t = attrIndex.indexOf(kv[0].trim());
                var tempObjet = attrObjetArray[t];
                var tArray = tempObjet["default"];
                if(!tArray.includes(teS.trim())){
                  tArray.push(teS.trim());
                }
              }
             

              jsonObject[kv[0]] = teS;
          }
         // console.log(record);
        }
    
        // record[3] += nameApperder;
        record[25] = JSON.stringify(jsonObject);


        /**
        * 是否新增文件.
        * 通过brandArray维护品牌集合。
        * brandMap维护文件集合，记录数超过1000条则重新生成文件。brand
        */
        var isNewFile =　false;
        let fileName =  brandName;
        if(!brandMap.has(brandName)){
        	brandMap.set(brandName,1);
        	isNewFile = true;
        }else{
          let count = brandMap.get(brandName);
          count++;
          brandMap.set(brandName,count)
         
          if(count >= numPerFile){
             // console.log(count);
            if((count % numPerFile) == 0){
              isNewFile = true;
            }
            fileName +=  Math.floor(count/numPerFile);
             // console.log(fileName);
          } 

        }

       

        let filePath = __dirname+'/meta/split_7/'+ fileName + ".csv";
        asyncFileWrite(record,isNewFile,filePath)
    }
}


// xparse(data);

var parser = parse({delimiter: ','},function(error,data){
    xparse(data);
});

var decodeGBKStream = iconv.decodeStream("GBK");



class CSVReader {
  constructor(filename, batchSize, columns) {
    this.reader = fs.createReadStream(filename).pipe(decodeGBKStream)
    this.batchSize = batchSize || 100
    this.lineNumber = 0
    this.data = []
    this.parseOptions = {delimiter: ','}
  }

  read(callback) {
    this.reader
      .pipe(es.split())
      .pipe(es.mapSync(line => {
        ++this.lineNumber;
        console.log(this.lineNumber);
        if(this.lineNumber > totalRecordNum){
        	
        }

        parse(line, this.parseOptions, (err, d) => {
          if(err){
              console.log(err);
          // console.log(d);
          }
        
          this.data.push(d[0])
        })

        if ((this.lineNumber % this.batchSize === 0) || this.lineNumber == totalRecordNum) {
        	   // console.log("lineNumber" + this.lineNumber);
             xparse(this.data)
             callback(this.data)
        }
      })
      .on('error', function(rr){
          console.log('Error while reading file.'+ rr)
      })
      .on('end', function(){
      	  console.log("is End");
      	  // xparse(this.data);
      	  var attriCsv =  [["attributeJson"],["属性集合"]];
      	  let csvfilePath = __dirname + "/meta/7/attribute.csv";
      	  writeCsvFile(attriCsv,csvfilePath);
      	  for(let attr of attrObjetArray){
      	  	var t = [[attr]];
      	  	writeCsvFile(t,csvfilePath);
      	  }

      	  fs.writeFileSync(__dirname + "/meta/7/attrJson.json", JSON.stringify(attrObjetArray));
      	  fs.writeFileSync(__dirname + "/meta/7/brandJson.json", JSON.stringify(Array.from(brandMap)));
          console.log('Read entirefile.')
      }))
  }

  continue () {
    this.data = [];
    this.reader.resume();
  }
}


function writeCsvFile(string,filePath){
	stringify(string, function(err, output){
            let recordString = iconv.encode(output,'GBK');
            // console.log(output);
            fs.appendFileSync(filePath, recordString);
   	});
}

function getUrlAndContent(code){
	var contentSql = "select content from test.code where code = '" + code + "'";
	return queryClient(contentSql);
}

/*
* 查询sql模板，返回结果集数组   
*/
function queryClient(querySql){
	return new Promise(function(reslove,reject){
		client.query(
			querySql,
			function(err, rows, fields) {
		    if (err) {
		    	reject(err);
		    }else{
		    	let rowsString = JSON.stringify(rows);
		    	reslove(JSON.parse(rowsString));
		    };
		})
	})
}


let reader = new CSVReader(__dirname + "/meta/tmeta8.csv");
reader.read((data) => reader.continue())
