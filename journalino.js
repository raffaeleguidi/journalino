var log = require('gelf-pro');
//var _ = require('lodash')
require('gelf-pro/lib/adapter/abstract');
require('gelf-pro/lib/adapter/tcp');
require('gelf-pro/lib/adapter/udp');
require('gelf-pro/lib/adapter/tcp-tls');


const pollJournalNonJson = (onData) => {
    const shell = require('shelljs');

    const PassThrough = require('stream').PassThrough; 

    if (!shell.which('journalctl')) {
        console.log('***', 'Sorry, this script requires journalctl', '***');
        shell.exit(1);
    }
    const output = new PassThrough({ objectMode: true });

    output.on('data', (entry) => {
        onData(entry)
    });


  
   const options="--output-fields=CONTAINER_ID,CONTAINER_ID_FULL,CONTAINER_NAME,CONTAINER_TAG,MESSAGE,_HOSTNAME,level,message,severity,source,timestamp";
   var command='journalctl --all -o verbose -f'

//   console.log("executing command " +command)
 
   if(config.ext == true){
     console.log("starting with ext fields");
     command+= " " + options
   }
 
   var journalctl = shell.exec(command, { async: true, silent: true });

   if (journalctl.code !== 0) {
     shell.echo('error: command failed - execute it manually to see the error code');
     shell.echo(command);
     shell.exit(1);
   }

   console.log(journalctl);


   journalctl.stdout.on('data', (entry) => {
        const str = entry.split("\n");
        var ret = {};
    //   console.log("str " +str)
        var index,key,  value;
       
      for (i in str) {
         index = str[i].indexOf("=");
         key =str[i].substring(0, index);
         value =str[i].substring(index +1, str[i].length); 
   //     console.log("key " +key  +" value " +value)
        
        if ((key) && (value)) {
            if (key.includes("CET")){
            } else {
              ret[key.trim()] = value.trim();
           //   ret[keypar[0].trim()] = keypar[1].trim();
            }
        }
      }
      onData(ret)
    });
}

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
    },
    {
    name: 'ext',  
    description: 'ext - only send container fields trough gelf (option valid only for recent journalctl versions supporting --output-fields option ).',
    default:  "false"
    },
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

const startMessage = "journalino 1.4 forwarder starting with target host: " + config.host + " port: " + config.port + " protocol: " + config.protocol;

//console.log(startMessage);
//log.info(startMessage);

log.setConfig({
    // fields: {facility: "example", owner: "Tom (a cat)"}, // optional; default fields for all messages
    // filter: [], // optional; filters to discard a message
    // transform: [], // optional; transformers for a message
    // broadcast: [], // optional; listeners of a message
    // levels: {}, // optional; default: see the levels section below
    // aliases: {}, // optional; default: see the aliases section below
    adapterName: config.protocol, // optional; currently supported "udp", "tcp" and "tcp-tls"; default: udp
    adapterOptions: { // this object is passed to the adapter.connect() method
      // common
      host: config.host, // optional; default: 127.0.0.1
      port: config.port, // optional; default: 12201
      timeout: 30000, // tcp only; optional; default: 10000 (10 sec)
    }
});

function stringFromArray(data) {
   return data.map(b => { return String.fromCharCode(b)}).join("")
}


pollJournalNonJson((entry) => {
  //console.log(entry)
  if (entry.CONTAINER_NAME) {
      if (typeof entry.MESSAGE != "string") {
            try {
                entry.MESSAGE = stringFromArray(entry.MESSAGE);
                console.log(entry)
            } catch (error) {
                console.log(" failmessage "+  entry.MESSAGE)
            }
      }
      //log.info(   entry.MESSAGE, entry,function (err, bytesSent) {
      //   if (err) console.log("gelf error:", err)
      //});
   }
})
