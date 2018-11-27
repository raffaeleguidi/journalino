# journalino
A journald to GELF forwarder for docker logs. It will forward all journald docker logs to a graylog server using the GELF protocol

### Options

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
### Installation
Download the latest release and move the binary to your location of choice (/usr/sbin here)
```
wget https://github.com/raffaeleguidi/journalino/releases/download/v1.1/journalino
chmod +x journalino
mv journalino /usr/sbin
```
### Example usage
Forward journald logs to graylog.mydomain.com using tcp port 12201:
```
# ./journalino --host graylog.mydomain.com --protocol tcp
journalino forwarder starting with target host: graylog.mydomain.com port: 12201 protocol: tcp
```

### SystemD integration
Create /lib/systemd/system/journalino.service with this content (thanks to @ValerioFusco for the contribution): 
```
[Unit]
Description=A journald to GELF forwarder for docker logs
After=network.target auditd.service

[Service]
ExecStart=/usr/sbin/journalino --host <target graylog host> --protocol udp
ExecStop=/bin/kill $(/usr/bin/pgrep -f journalino)
KillMode=process
Restart=on-failure
RestartPreventExitStatus=255
Type=simple

[Install]
WantedBy=multi-user.target
Alias=journalino.service
```

And execute

```
systemctl enable journalino.service
systemctl start journalino.service
# if you change the contents of the service configuration file
systemctl daemon-reload journalino.service
```

Please not that you may want to increase journald limits for throttling, such as:
```
# in /etc/systemd/journald.conf
RateLimitInterval=600s
RateLimitBurst=20000
```

### Credits

All bugs are mine - overall awesomeness inherited by these wonderful packages:

* [shelljs](https://www.npmjs.com/package/shelljs)
* [gelf-pro](https://www.npmjs.com/package/gelf-pro)
* [parameters](https://www.npmjs.com/package/parameters)

