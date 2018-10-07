# journalino
A journald to GELF forwarder for docker logs. It will forward all journald docker logs to a graylog server using the GELF protocol

### Commands:

```
# ./journalino -h

NAME
    journalino - Start log forwarding

SYNOPSIS
    journalino [journalino options]

OPTIONS
    --host                  Graylog host. Required.
    -p --port               Graylog port - default is 12201.
    --protocol              Protocol - tcp or udp, default is "udp".
    -h --help               Display help information

EXAMPLES
    journalino --help       Show this message
```
### Example usage:
Forward journald logs to graylog.mydomain.com using tcp port 12201:
```
# ./journalino --host graylog.mydomain.com --tcp 12201 
journalino forwarder starting with target host: graylog.mydomain.com port: 12201 protocol: udp

```
