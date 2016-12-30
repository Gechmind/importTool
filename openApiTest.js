var crypto = require("crypto");
var http = require("http");
var querystring = require('querystring');

function md5(str){
	var decipher = crypto.createHash('md5');
	decipher.update(str);
	return decipher.digest('hex').toUpperCase();
}


function getSign(appsecret,requestJson){
	var keyArray = new Array();

	for(let key in requestJson){
		keyArray.push(key)
	}

	keyArray.sort(function(a,b){
		if(a > b){
			return 1
		} else if(b > a){
			return -1
		}
		return 0; 
	})
	
	var rawString = appsecret;
	for(let i of keyArray){
		rawString += i + requestJson[i];
	}
	rawString += appsecret;
	// console.log(rawString.toUpperCase());
	var sign = md5(rawString);
	console.log(`sign: ${sign}`);
	return sign;
}


function getResponse(postData,option){
	option.headers["Content-Length"] = postData.length;
	return new Promise(function(resolve,reject){
		var result = "";
		var req = http.request(option,(res) =>{
		  // console.log(`STATUS: ${res.statusCode}`);
		  // console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
		  res.setEncoding('utf8');
		  res.on('data', (chunk) => {
		  	result += chunk;
		    // console.log(`BODY: ${chunk}`);
		  });
		  res.on('end', () => {
		    // console.log('No more data in response.')
		    resolve(result);
		  })
		})

		req.on('error', (e) => {
		  console.log(`problem with request: ${e.message}`);
		  // reject(e);
		});

		req.write(postData);
		req.end();
	})

}

/**
* 业务请求方法
*/
function bussinessRequest(ut){
	var time = new Date().toLocaleString()
	console.log(`timestamp:${time}`);

	var request = {
		app_id:"243fd20120160127135949",
		ut:ut,
		timestamp:"2016-12-22 12:01:26"||time,
		format:"json",
		v:"1.0",
		direct:1,
		// mpid:1049011601002530,
		// warehouseId:91040000726771,
		requestData:'{"mpCode":"10000024131","quantity":1,"transType":20014,"requestId":1,"type":2,"warehouseId":91040000726771}'
	}
	//	ut:"0622d925dbf74d359c2ba8e03574b67f",

	request.sign = getSign("2434a43e39a1920160127135949",request);

	var postData = querystring.stringify(request)
	// console.log(postData);

	var options = {
		hostname:"180.167.73.34",
		port:2047,
		// hostname:"192.168.20.175",
		// port:8080,
		path:"/open-api/stock/updateStock.do",
		method: 'POST',
		headers:{
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': postData.length
		}
	}

	getResponse(postData,options).then(value => {
		console.log(`result: ${value}`);
		return
	})
}


/**
* ut请求
*/
function requestWrapper(fn){

	var t = {
		hostname:"dsadmin.test.odianyun.com",
		port:80,
		// hostname:"192.168.20.175",
		// port:8080,
		path:"/ouser-web/mobileLogin/login.do",
		method: 'POST',
		headers:{
			'Content-Type': 'application/json'
		}
	}

	var usr = {
		username:"dsadmin",
		password:"123456"
	}

	getResponse(JSON.stringify(usr),t).then(function(value){
		var loginfo = JSON.parse(value);
		if(loginfo.code != 0){
			return Promise.reject(loginfo.messageelse)
		}else{
			console.log(`ut: ${loginfo.ut}`);
			fn("baee10060fff48e888a948448c13a119"||loginfo.ut)
		}
	})
}

//包裹ut
requestWrapper(bussinessRequest);