/* jshint node: true, esversion: 6*/

"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const debug = require("debug")("openevse:wifi:web");

const app = express();
const expressWs = require("express-ws")(app);

const DUMMY_PASSWORD = "___DUMMY_PASSWORD___";
var data = false;

//
// Create HTTP server by ourselves.
//

function stringToBoolean(string){
  switch(string.toLowerCase().trim()){
    case "false": case "no": case "0": case null: return false;
    default: return true;
  }
}

// Setup the static content
app.use(express.static(require("openevse_wifi_gui"), { index: "home.html" }));

// Setup the websocket
app.ws("/ws", function(ws) {
  ws.on("message", function() {
    //ws.send(msg);
  });
});
var ws = expressWs.getWss("/ws");
ws.sendAll = function (data) {
  debug("Sending "+JSON.stringify(data)+" to all");
  ws.clients.forEach(client => {
    client.send(JSON.stringify(data));
  });
};

// Setup the API endpoints
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/config", function (req, res) {
  res.header("Cache-Control", "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0");
  res.json({
    firmware: data.evse.info.firmware,
    protocol: data.evse.info.protocol,
    espflash: data.evse.info.espflash,
    version: data.evse.info.version,
    diodet: data.evse.openevse.diodet ? 0 : 1,
    gfcit: data.evse.openevse.gfcit ? 0 : 1,
    groundt: data.evse.openevse.groundt ? 0 : 1,
    relayt: data.evse.openevse.relayt ? 0 : 1,
    ventt: data.evse.openevse.ventt ? 0 : 1,
    tempt: data.evse.openevse.tempt ? 0 : 1,
    service: data.evse.openevse.service,
    scale: data.evse.openevse.scale,
    offset: data.evse.openevse.offset,
    ssid: data.config.wifi.ssid,
    pass: data.config.wifi.pass ? DUMMY_PASSWORD : "",
    emoncms_enabled: data.config.emoncms.enabled,
    emoncms_server: data.config.emoncms.server,
    emoncms_node: data.config.emoncms.node,
    emoncms_apikey: data.config.emoncms.apikey ? DUMMY_PASSWORD : "",
    mqtt_enabled: data.config.mqtt.enabled,
    mqtt_protocol: data.config.mqtt.protocol,
    mqtt_server: data.config.mqtt.server,
    mqtt_port: data.config.mqtt.port,
    mqtt_reject_unauthorized: data.config.mqtt.reject_unauthorized,
    mqtt_topic: data.config.mqtt.topic,
    mqtt_user: data.config.mqtt.user,
    mqtt_pass: data.config.mqtt.pass ? DUMMY_PASSWORD : "",
    mqtt_solar: data.config.mqtt.solar,
    mqtt_grid_ie: data.config.mqtt.grid_ie,
    mqtt_supported_protocols: ["mqtt", "mqtts", "tcp", "tls", "ws", "wss"],
    www_username: data.config.www.username,
    www_password: data.config.www.password ? DUMMY_PASSWORD : "",
    ohm_enabled: data.config.ohm.enabled,
    ohmkey: data.config.ohm.key
  });
});
app.get("/status", function (req, res) {
  res.header("Cache-Control", "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0");
  res.json(data.status);
});
app.get("/update", function (req, res) {
  res.header("Cache-Control", "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0");
  res.send("<html><form method='POST' action='/update' enctype='multipart/form-data'><input type='file' name='firmware'> <input type='submit' value='Update'></form></html>");
});
app.post("/update", function (req, res) {
  res.header("Cache-Control", "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0");
  res.status(500).send("Not implemented");
});
app.get("/r", function (req, res) {
  res.header("Cache-Control", "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0");

  var rapi = req.query.rapi;

  data.evse.rapi(rapi, function (data) {
    var resp = { "cmd": rapi, "ret": data};
    res.json(resp);
  }).error(function () {
    var resp = { "cmd": rapi, "ret": "$NK"};
    res.json(resp);
  });
});

app.post("/savenetwork", function (req, res) {
  res.header("Cache-Control", "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0");
  res.status(500).send("Not implemented");
});

app.post("/saveemoncms", function (req, res) {
  res.header("Cache-Control", "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0");
  var config = {
    emoncms: {
      enabled: stringToBoolean(req.body.enable),
      server: req.body.server,
      node: req.body.node
    }
  };
  if(DUMMY_PASSWORD !== req.body.apikey) {
    config.emoncms.apikey = req.body.apikey;
  }
  data.config = config;
  res.send("Saved: " + req.body.server + " " + req.body.node + " " + req.body.apikey + " " + req.body.fingerprint);
});

app.post("/savemqtt", function (req, res) {
  res.header("Cache-Control", "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0");
  var config = {
    mqtt: {
      enabled: stringToBoolean(req.body.enable),
      server: req.body.server,
      topic: req.body.topic,
      user: req.body.user,
      solar: req.body.solar,
      grid_ie: req.body.grid_ie
    }
  };
  if(DUMMY_PASSWORD !== req.body.pass) {
    config.mqtt.pass = req.body.pass;
  }
  if(req.body.hasOwnProperty("protocol")) {
    config.mqtt.protocol = req.body.protocol;
  }
  if(req.body.hasOwnProperty("port")) {
    config.mqtt.port = parseInt(req.body.port);
  }
  if(req.body.hasOwnProperty("reject_unauthorized")) {
    config.mqtt.reject_unauthorized = stringToBoolean(req.body.reject_unauthorized);
  }
  data.config = config;
  res.send("Saved: " + req.body.server + " " + req.body.topic + " " + req.body.user + " " + req.body.pass);
});

app.post("/saveadmin", function (req, res) {
  res.header("Cache-Control", "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0");
  res.status(500).send("Not implemented");
});

app.post("/saveohmkey", function (req, res) {
  res.header("Cache-Control", "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0");
  var config = {
    ohm: {
      enabled: stringToBoolean(req.body.enable),
    }
  };
  if(DUMMY_PASSWORD !== req.body.ohm) {
    config.ohm.key = req.body.ohm;
  }
  data.config = config;
  res.send("saved");
});

app.post("/reset", function (req, res) {
  res.header("Cache-Control", "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0");
  res.status(500).send("Not implemented");
});

app.post("/restart", function (req, res) {
  res.header("Cache-Control", "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0");
  res.status(500).send("Not implemented");
});

function getRandomRssi() {
  return -Math.floor(Math.random() * Math.floor(20));
}

app.get("/scan", function (req, res) {
  res.header("Cache-Control", "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0");
  setTimeout(function () {
    res.json([
      {
        "rssi": -50 + getRandomRssi(),
        "ssid": "wibble_ext",
        "bssid": "C4:04:15:5A:45:DE",
        "channel": 11,
        "secure": 4,
        "hidden": false
      },
      {
        "rssi": -50 + getRandomRssi(),
        "ssid": "esplug_10560510",
        "bssid": "1A:FE:34:A1:23:FE",
        "channel": 11,
        "secure": 7,
        "hidden": false
      },
      {
        "rssi": -100 + getRandomRssi(),
        "ssid": "BTWifi-with-FON",
        "bssid": "02:FE:F4:32:F1:08",
        "channel": 6,
        "secure": 7,
        "hidden": false
      },
      {
        "rssi": -60 + getRandomRssi(),
        "ssid": "BTWifi-X",
        "bssid": "22:FE:F4:32:F1:08",
        "channel": 6,
        "secure": 7,
        "hidden": false
      },
      {
        "rssi": -60 + getRandomRssi(),
        "ssid": "wibble",
        "bssid": "6C:B0:CE:20:7C:3A",
        "channel": 6,
        "secure": 4,
        "hidden": false
      },
      {
        "rssi": -30 + getRandomRssi(),
        "ssid": "wibble",
        "bssid": "6C:B0:CE:20:7C:4D",
        "channel": 6,
        "secure": 4,
        "hidden": false
      },
      {
        "rssi": -90 + getRandomRssi(),
        "ssid": "BTHub3-ZWCW",
        "bssid": "00:FE:F4:32:F1:08",
        "channel": 6,
        "secure": 8,
        "hidden": false
      }
    ]);
  }, 300);
});

app.post("/apoff", function (req, res) {
  res.header("Cache-Control", "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0");
  res.status(500).send("Not implemented");
});

app.post("/divertmode", function (req, res) {
  res.header("Cache-Control", "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0");
  data.evse.divert.mode = parseInt(req.body.divertmode);
  res.send("Divert Mode changed");
});

app.get("/emoncms/describe", function (req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.send("openevse");
});

exports.start = function(evseApp, port, cert = false, key = false) {
  data = evseApp;
  data.on("status", (status) => {
    ws.sendAll(status);
  });

  if(cert && key)
  {
    const fs = require("fs");
    const https = require("https");

    https.createServer({
      key: fs.readFileSync(key),
      cert: fs.readFileSync(cert)
    }, app).listen(port, () => console.log("OpenEVSE WiFi Simulator listening on port " + port + "!"));
  } else {
    app.listen(port, () => console.log("OpenEVSE WiFi Simulator listening on port " + port + "!"));
  }
};
