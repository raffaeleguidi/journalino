const ndjson = require('ndjson');
const through2 = require("through2");
const spawn = require('child_process').spawn;
const stripAnsi = require('strip-ansi');
var fs = require("fs");

const testFromFile = () => {
  const stream = fs.createReadStream("./msg.txt");

  const sendToHost = (entry) => {
    if (entry.CONTAINER_NAME) {
      console.log(entry.timestamp, entry.CONTAINER_NAME, entry.MESSAGE);
      /*
      gelf.info(entry.MESSAGE, entry,function (err, bytesSent) {
        if (err) console.log("gelf error:", err)
      });
      */
    }
  }

  stream
    .pipe(ndjson.parse())
    .on('data', function(entry){
      entry.MESSAGE = stripAnsi(Buffer.from(entry.MESSAGE,'utf8').toString());
      entry.timestamp = (parseInt(entry._SOURCE_REALTIME_TIMESTAMP)/1000000);
      sendToHost(entry)
  });
}
  
testFromFile()

const testFromJournal = () => {
  var journal = spawn('journalctl', ['--all', '--output', 'json', '-f']);

  journal.stdout
    .pipe(ndjson.parse())
    .pipe(through2.obj(function (chunk, enc, callback) {
      this.push({...chunk, MESSAGE: Buffer.from(chunk.MESSAGE,'utf8').toString()});
      callback()
    }))
    .on('data', function(entry){
      console.log(entry.CONTAINER_NAME, entry.__REALTIME_TIMESTAMP, entry.MESSAGE);
  });

  const sendToHost = (entry) => {
    if (entry.CONTAINER_NAME) {
      console.log(entry.timestamp, entry.CONTAINER_NAME, entry.MESSAGE);
      gelf.info(entry.MESSAGE, entry,function (err, bytesSent) {
        if (err) console.log("gelf error:", err)
      });
    }
  }
}

testFromJournal()