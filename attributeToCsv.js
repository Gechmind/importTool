var stringify = require("csv-stringify");
var iconv = require('iconv-lite');
var fs = require("fs");

var attibuteJSON = fs.readFileSync(__dirname + "/meta/attrJson.json");
var filePath = __dirname + "/meta/attribute.csv";

console.log(attibuteJSON);
// writeFile([["attributeJson"]],filePath);

for(let attr of attibuteJSON){
	var t = [attr]
	// writeFile([t],filePath)
	console.log(t);
}
console.log("end");

function writeFile(string,filePath){
	stringify(string, function(err, output){
            let recordString = iconv.encode(output,'GBK');
            // console.log(output);
            fs.appendFileSync(filePath, recordString);
   	});
}