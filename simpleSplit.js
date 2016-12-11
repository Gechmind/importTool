var parse = require("csv-parse");
var iconv = require('iconv-lite');
var fs = require("fs");
var mysql = require("mysql");
var Promise = require("bluebird");
var stringify = require("csv-stringify");
var stringifier = stringify({delimiter:","})
var stream = require("stream");
var es = require("event-stream");

var decodeGBKStream = iconv.decodeStream("GBK");

var fileSeq = 0;

class CSVReader {
  constructor(filename, batchSize, columns) {
    this.reader = fs.createReadStream(filename).pipe(decodeGBKStream)
    this.batchSize = batchSize || 1000
    this.lineNumber = 0
    this.data = []
    this.parseOptions = {delimiter: ','}
  }

  read(callback) {
    this.reader
      .pipe(es.split())
      .pipe(es.mapSync(line => {
        ++this.lineNumber;

        if(this.lineNumber > 114040){
        	console.log(this.lineNumber);
        }

        parse(line, this.parseOptions, (err, d) => {
          this.data.push(d[0])
        })

        if ((this.lineNumber % this.batchSize === 0) || this.lineNumber == 114044) {
        	console.log(this.lineNumber);
            writeBack(this.data)
            callback(this.data)
        }
      })
      .on('error', function(rr){
          console.log('Error while reading file.'+ rr)
      })
      .on('end', function(){
      	  console.log("is End");
          console.log('Read entirefile.')
      }))
  }

  continue () {
    this.data = [];
    this.reader.resume();
  }
}



let reader = new CSVReader(__dirname + "/meta/kmeta.csv");
reader.read((data) => reader.continue())
