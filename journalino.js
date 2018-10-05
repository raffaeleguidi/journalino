var log = require('gelf-pro');

const pollJournal = (onData) => {
    const shell = require('shelljs');
    const PassThrough = require('stream').PassThrough;
    const { StringifyTransform, ParseTransform } = require('@studio/ndjson');

    if (!shell.which('journalctl')) {
        console.log('***', 'Sorry, this script requires journalctl', '***');
        shell.exit(1);
    }

    const output = new PassThrough({ objectMode: true });

    output.on('data', (entry) => {
        onData(entry)
        //console.log(entry.__REALTIME_TIMESTAMP, entry._HOSTNAME, entry.SYSLOG_IDENTIFIER, entry._SYSTEMD_UNIT, entry.MESSAGE);
    });

    var journalctl = shell.exec('journalctl -o json -f', { async:true, silent: true });
    journalctl.stdout.pipe(new ParseTransform()).pipe(output)
}

parameters = require('parameters');

command = parameters({
    name: 'journalino',
    description: 'Start log forwarding',
    options: [{
      name: 'host', 
      description: 'Graylog host',
      required: true
    },{
        name: 'port', shortcut: 'p', type: 'integer', 
        description: 'Graylog port - default is "12201"',
        default:  12201
    },{
      name: 'protocol',  
      description: 'Protocol - tcp or udp, default is "udp"',
      default:  "udp"
    }]
});

var config;

try {
    config = command.parse();
    if (config.help) {
        console.log(command.help());
        return;
    }
} catch (ex) {
    // Print help
    console.error("***", ex.message + ". Use -h for help", "***")
    return;
}

const startMessage = "journalino forwarder starting with target host: " + config.host + " port: " + config.port + " protocol: " + config.protocol;

console.log(startMessage);
log.info(startMessage);

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
      timeout: 1000, // tcp only; optional; default: 10000 (10 sec)
    }
});

pollJournal((entry) => {
    if (entry.CONTAINER_NAME) {
        log.info(entry.MESSAGE, entry, function (err, bytesSent) {
            if (err) console.log("gelf error:", err)
        });
    }
})
