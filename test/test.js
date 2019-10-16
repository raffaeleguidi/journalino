const shell = require('shelljs');
const ndjson = require('ndjson');
const through2 = require("through2");


var spawn = require('child_process').spawn;

var journal = spawn('journalctl', ['--all', '-o', 'verbose', '--output', 'json', '-f']);

journal.stdout
  .pipe(ndjson.parse())
  .pipe(through2.obj(function (chunk, enc, callback) {
    this.push({...chunk, MESSAGE: Buffer.from(chunk.MESSAGE,'utf8').toString()});
    callback()
  }))
  .on('data', function(entry){
    console.log(entry.CONTAINER_NAME, entry.__REALTIME_TIMESTAMP, entry.MESSAGE);
});

