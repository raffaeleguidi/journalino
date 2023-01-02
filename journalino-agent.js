const gelf = require('gelf-pro');
require('gelf-pro/lib/adapter/abstract');
require('gelf-pro/lib/adapter/tcp');
require('gelf-pro/lib/adapter/udp');
require('gelf-pro/lib/adapter/tcp-tls');

const ndjson = require('ndjson');
const through2 = require("through2");
const spawn = require('child_process').spawn;
const stripAnsi = require('strip-ansi');

parameters = require('parameters');
const version = "v2.0beta";

command = parameters({
    name: 'journalino',
    description: 'Start log forwarding - ' + version,
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
        name: 'environment',  shortcut: 'e', type: "string",
        description: 'The environment we are running into - i.e. "dev", "QA" or "prod". No default',
        default:  ""
    },{
        name: 'all',  shortcut: 'a', type: "boolean",
        description: 'Whether we should send all logs instead of only docker logs - default is false',
        default:  false
    },{
        name: 'listen',  shortcut: 'l', type: "boolean",
        description: 'Whether we should listen on port TCP 12200 instead of using journalctl',
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


const startMessage = "journalino" + version + " forwarder starting with target host: " + config.host + " port: " + config.port + " protocol: " + config.protocol;

gelf.setConfig({
    adapterName: config.protocol, // optional; currently supported "udp", "tcp" and "tcp-tls"; default: udp
    adapterOptions: { // this object is passed to the adapter.connect() method
      host: config.host, // optional; default: 127.0.0.1
      port: config.port, // optional; default: 12201
      timeout: 30000, // tcp only; optional; default: 10000 (10 sec)
    }
});

const sendToHost = (entry) => {
  if (entry.CONTAINER_NAME || config.all) {
    console.log(entry.timestamp, entry.CONTAINER_NAME, entry.MESSAGE);
    gelf.info(entry.MESSAGE, entry,function (err, bytesSent) {
       if (err) console.log("gelf error:", err)
    });
  }
}

if (config.listen) {
  console.log("TCP listen mode");
  const net = require("net"); 
  const server = net.createServer(); 
  server.listen(12200, () => { 
    console.log("listening on port 12020");
  }); 
  server.on('connection', (socket) => { 
    socket.on('data', (data) => { 
      console.log(`received: ${data}`); 
    }); 
    socket.on('error', (err) => { 
      console.log(`Error occurred in socket: ${err.message}`); 
    });
  })

} else {
  console.log("spawning journalctl");
  var journal = spawn('journalctl', ['--all', '--output', 'json', '-f']);
  
  journal.stdout
    .pipe(ndjson.parse())
    .on('data', function(entry){
      entry.MESSAGE = stripAnsi(Buffer.from(entry.MESSAGE,'utf8').toString());
      entry.timestamp = (parseInt(entry._SOURCE_REALTIME_TIMESTAMP)/1000000);
      if (config.environment) entry.ENVIRONMENT = config.environment;
      sendToHost(entry)
  });
}
