const graylog = {
    host: "lb-tns",
    //host: "lb-middleware.load-balancers.prod.bnlpositivity.it",
    port: 52201
}

var log = require('gelf-pro');

log.setConfig({
    // fields: {facility: "example", owner: "Tom (a cat)"}, // optional; default fields for all messages
    // filter: [], // optional; filters to discard a message
    // transform: [], // optional; transformers for a message
    // broadcast: [], // optional; listeners of a message
    // levels: {}, // optional; default: see the levels section below
    // aliases: {}, // optional; default: see the aliases section below
    adapterName: 'tcp', // optional; currently supported "udp", "tcp" and "tcp-tls"; default: udp
    adapterOptions: { // this object is passed to the adapter.connect() method
      // common
      host: graylog.host, // optional; default: 127.0.0.1
      port: graylog.port, // optional; default: 12201
      timeout: 1000, // tcp only; optional; default: 10000 (10 sec)
    }
});


const pollJournal = (onData) => {
    const shell = require('shelljs');
    const { StringifyTransform, ParseTransform } = require('@studio/ndjson');
    const PassThrough = require('stream').PassThrough;

    if (!shell.which('journalctl')) {
        shell.echo('Sorry, this script requires journalctl');
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

console.log("journal-2-gelf forwarder starting");

pollJournal((entry) => {
    if (entry.CONTAINER_NAME) {
        log.info(entry.MESSAGE, entry, function (err, bytesSent) {
            if (err) console.log("gelf error:", err)
        });
    }
})
