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
	console.log(rawString.toUpperCase());
	var sign = md5(rawString);
	console.log(sign);
	return sign;
}

var time = new Date().toLocaleString()
console.log(time);

var request = {
	app_id:"243fd20120160127135949",
	ut:"0622d925dbf74d359c2ba8e03574b67f",
	timestamp:time,
	format:"json",
	v:"1.0",
	direct:1,
	// mpid:1049011601002530,
	// warehouseId:91040000726771,
	mpid:153024000019501,
	warehouseId:1,
	type:2,
	quantity:100,
	requestId:3,
	transType:20014
}
//	ut:"0622d925dbf74d359c2ba8e03574b67f",


request.sign = getSign("2434a43e39a1920160127135949",request);

var postData = querystring.stringify(request)
console.log(postData);

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

var req = http.request(options,(res) =>{
	  console.log(`STATUS: ${res.statusCode}`);
	  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
	  res.setEncoding('utf8');
	  res.on('data', (chunk) => {
	    console.log(`BODY: ${chunk}`);
	  });
	  res.on('end', () => {
	    console.log('No more data in response.')
	  })
})

req.on('error', (e) => {
  console.log(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();