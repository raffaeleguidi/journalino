const os = require("os");
const syslog = require("syslog-client");

var options = {
    syslogHostname: os.hostname(),
    transport: syslog.Transport.Tcp,
    port: 11514
};
 
var client = syslog.createClient("lb-tns", options);


    const Gelf = require('gelf')
    const gelf = new Gelf({
    graylogPort: 52201,
    graylogHostname: 'lb-tns',
    connection: 'wan',
    maxChunkSizeWan: 1420,
    maxChunkSizeLan: 8154
    })

    gelf.on('error', (err) => {
       console.log('gelf error!', err)
    })

    // send just a shortmessage
    /*gelf.emit('gelf.log', 'myshortmessage')

    // send a full message
    const message = {
    "version": "1.0",
    "host": "www1",
    "short_message": "Short message",
    "full_message": "Backtrace here\n\nmore stuff",
    "timestamp": Date.now() / 1000,
    "level": 1,
    "facility": "payment-backend",
    "file": "/var/www/somefile.rb",
    "line": 356,
    "_user_id": 42,
    "_something_else": "foo"
    }

    gelf.emit('gelf.log', message);
*/


const log = require("gelf-pro");

const testJournal = () => {
    const shell = require('shelljs');
    const { StringifyTransform, ParseTransform } = require('@studio/ndjson');
    const PassThrough = require('stream').PassThrough;

    if (!shell.which('journalctl')) {
      shell.echo('Sorry, this script requires journalctl');
      shell.exit(1);
    }

    const output = new PassThrough({ objectMode: true });

    output.on('data', (entry) => {
           const message = "RpG: " + entry.CONTAINER_NAME + " - " + entry.__REALTIME_TIMESTAMP + " " + entry._HOSTNAME + " " + entry.MESSAGE;

        //console.log(entry.CONTAINER_NAME + " - " entry.__REALTIME_TIMESTAMP + " " + entry._HOSTNAME, entry.SYSLOG_IDENTIFIER, entry._SYSTEMD_UNIT, entry.MESSAGE);

    const options = {
      facility: syslog.Facility.Daemon,
      severity: syslog.Severity.Critical
    };

   if (entry.CONTAINER_NAME) {
      //gelf.emit('gelf.log', entry.MESSAGE)
      log.info(entry.MESSAGE, entry)
      console.log(entry.CONTAINER_NAME + ": " + entry.MESSAGE)
      //console.log(entry);
   }

//     console.log(entry.CONTAINER_NAME + ": " + entry.MESSAGE)
   if (false)
    client.log(message, options, function(error) {
       if (error) {
          console.error(error);
       } else {
          console.log("sent message successfully");
       }
    });
    });


    var journalctl = shell.exec('journalctl -a -o json -f', { async:true, silent: true });

    console.log("*** starting ***")

    journalctl.stdout.pipe(new ParseTransform()).pipe(output)
}


const testGelf = () => {
    var gelfserver = require('graygelf/server')
    var server = gelfserver()
    server.on('message', function (gelf) {
    // handle parsed gelf json
    console.log('this is fake graylog: received message', gelf.short_message)
    })
    server.listen(12201)


    const Gelf = require('gelf')
    const gelf = new Gelf({
    graylogPort: 12201,
    graylogHostname: '127.0.0.1',
    connection: 'wan',
    maxChunkSizeWan: 1420,
    maxChunkSizeLan: 8154
    })

    gelf.on('error', (err) => {
    console.log('ouch!', err)
    })

    // send just a shortmessage
    gelf.emit('gelf.log', 'myshortmessage')

    // send a full message
    const message = {
    "version": "1.0",
    "host": "www1",
    "short_message": "Short message",
    "full_message": "Backtrace here\n\nmore stuff",
    "timestamp": Date.now() / 1000,
    "level": 1,
    "facility": "payment-backend",
    "file": "/var/www/somefile.rb",
    "line": 356,
    "_user_id": 42,
    "_something_else": "foo"
    }

    gelf.emit('gelf.log', message);
}

//testGelf()

testJournal();

return;
// Default options
var options = {
    syslogHostname: os.hostname(),
    transport: syslog.Transport.Udp,
    port: 514
};
 
var client = syslog.createClient("127.0.0.1", options);

