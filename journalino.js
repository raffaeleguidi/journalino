const gelf = require('gelf-pro');
require('gelf-pro/lib/adapter/abstract');
require('gelf-pro/lib/adapter/tcp');
require('gelf-pro/lib/adapter/udp');
require('gelf-pro/lib/adapter/tcp-tls');

const ndjson = require('ndjson');
const through2 = require("through2");
const spawn = require('child_process').spawn;

parameters = require('parameters');

command = parameters({
    name: 'journalino',
    description: 'Start log forwarding',
    options: [{
        name: 'host', 
        description: 'Graylog host.',
        required: true
    },{
        name: 'port', shortcut: 'p', type: 'integer', 
        description: 'Graylog port - default is 12201.',
        default:  12201
    },{
        name: 'protocol',  
        description: 'Protocol - tcp or udp, default is "udp".',
        default:  "udp"
    },{
        name: 'dry',  
        description: '"dry run - only send logs to stdout',
        default:  false
    }
    /*,
    {
        name: 'ext',  
        description: 'ext - only send container fields trough gelf (option valid only for recent journalctl versions supporting --output-fields option ).',
        default:  "false"
    },*/
]
});

var config;

try {
    config = command.parse();
    if (config.help) {
        console.log(command.help());
        return;
    }
} catch (ex) {
    console.error("***", ex.message + ". Use -h for help", "***")
    return;
}

console.log(config);

const startMessage = "journalino 1.4 forwarder starting with target host: " + config.host + " port: " + config.port + " protocol: " + config.protocol;

gelf.setConfig({
    adapterName: config.protocol, // optional; currently supported "udp", "tcp" and "tcp-tls"; default: udp
    adapterOptions: { // this object is passed to the adapter.connect() method
      host: config.host, // optional; default: 127.0.0.1
      port: config.port, // optional; default: 12201
      timeout: 30000, // tcp only; optional; default: 10000 (10 sec)
    }
});

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

const sendToHost = (entry) => {
  if (entry.CONTAINER_NAME) {
    if (typeof entry.MESSAGE != "string") {
          try {
              entry.MESSAGE = stringFromArray(entry.MESSAGE);
              console.log(entry)
          } catch (error) {
              console.log(" failmessage "+  entry.MESSAGE)
          }
    }
    gelf.info(   entry.MESSAGE, entry,function (err, bytesSent) {
       if (err) console.log("gelf error:", err)
    });
    }
}

journal.stdout
  .pipe(ndjson.parse())
  .pipe(through2.obj(function (chunk, enc, callback) {
    if (typeof entry.MESSAGE != "string") {
        this.push({...chunk, MESSAGE: Buffer.from(chunk.MESSAGE,'utf8').toString()});
    } else {
        this.push(chunk);
    }
    callback()
  }))
  .on('data', function(entry){
    console.log(entry.CONTAINER_NAME, entry.__REALTIME_TIMESTAMP, entry.MESSAGE);
    sendToHost(entry)
});