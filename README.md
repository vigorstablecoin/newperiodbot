# newperiodbot

### Instalation

```bash
$ npm install
...

$ cp config-sample.json config.json
$ vi config.json
```

Edit your desired configuration in this file...

If deploying to a Linux machine, then you can use the supplied systemd service configuration file `newperiodbot.service`, just edit your paths inside

```bash
$ vi newperiodbot.service
...

$ sudo cp newperiod.service /etc/systemd/system/
$ sudo systemctl daemon-reload
```

Now you can use `systemctl` to start, stop and control your newperiod service

```bash
$ sudo systemctl start newperiod
```

If you want to check logs, you can use `journalctl` as with any other service on your Linux box

```bash
$ journalctl -u newperiod -f
```

For help with setting your eosio permissions, please check the `permissions_how_to.txt` file.

Enjoy! :)
