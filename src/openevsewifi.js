/* jshint node: true, esversion: 6*/

"use strict";

const config = require("./config");
const evse = require("./evse");
const emoncms = require("./emoncms");
const mqtt = require("./mqtt");
const ohmconnect = require("./ohmconnect");

const base = require("./base");
const network = require("network");
const debug = require("debug")("openevse:wifi");

module.exports = class OpenEVSEWiFi extends base
{
  constructor()
  {
    super();

    this._config = {
      wifi: {
        ssid: "demo",
        pass: ""
      },
      emoncms: {
        enabled: false,
        server: "https://data.openevse.com/emoncms",
        node: "openevse",
        apikey: "",
        fingerprint: ""
      },
      mqtt: {
        enabled: false,
        protocol: "mqtt",
        server: "emonpi.local",
        port: 1883,
        reject_unauthorized: true,
        topic: "openevse",
        user: "emonpi",
        pass: "emonpimqtt2016",
        solar: "",
        grid_ie: ""
      },
      www: {
        username: "",
        password: ""
      },
      ohm: {
        enabled: false,
        key: ""
      },
    };
    this._status = {
      mode: "NA",
      wifi_client_connected: 0,
      srssi: 0,
      ipaddress: "",
      network_manager: "external",
    };
  }

  start(endpoint)
  {
    this._config = config.load(this._config);

    this.evse = new evse(endpoint);
    this.emoncms = new emoncms(this.evse);
    this.mqtt = new mqtt(this.evse);
    this.ohmconnect = new ohmconnect(this.evse);

    this.evse.on("status", (changedData) => {
      this.emit("status", changedData);
    });
    this.emoncms.on("status", (changedData) => {
      this.emit("status", changedData);
    });
    this.mqtt.on("status", (changedData) => {
      this.emit("status", changedData);
    });
    this.ohmconnect.on("status", (changedData) => {
      this.emit("status", changedData);
    });

    this.evse.on("boot", () => {
      this.emoncms.connect(this.config.emoncms);
      this.mqtt.connect(this.config.mqtt);
      this.ohmconnect.connect(this.config.ohm);
      this.emit("boot");
    });

    network.get_active_interface((err, obj) => {
      if(err) {
        debug("Error getting IP address info", err);
        return;
      }

      var newStatus = { ipaddress: obj.ip_address };
      switch(obj.type)
      {
      case "Wired":
        newStatus.mode = "Wired";
        newStatus.wifi_client_connected = 0;
        break;
      case "Wireless":
        newStatus.mode = "STA";
        newStatus.wifi_client_connected = 1;
        break;
      }

      this.status = newStatus;
    });
  }

  get status() {
    return {
      mode: this._status.mode,
      wifi_client_connected: this._status.wifi_client_connected,
      srssi: this._status.srssi,
      ipaddress: this._status.ipaddress,
      network_manager: this._status.network_manager,
      emoncms_connected: this.emoncms.status.connected,
      packets_sent: this.emoncms.packets_sent,
      packets_success: this.emoncms.packets_success,
      mqtt_connected: this.mqtt.status.connected,
      ohm_hour: this.ohmconnect.status.ohm_hour,
      ohm_started_charge: this.ohmconnect.status.ohm_started_charge,
      free_heap: this.evse.status.free_heap,
      comm_sent: this.evse.status.comm_sent,
      comm_success: this.evse.status.comm_success,
      amp: this.evse.status.amp,
      pilot: this.evse.status.pilot,
      temp1: this.evse.status.temp1,
      temp2: this.evse.status.temp2,
      temp3: this.evse.status.temp3,
      state: this.evse.status.state,
      elapsed: this.evse.status.elapsed,
      wattsec: this.evse.status.wattsec,
      watthour: this.evse.status.watthour,
      gfcicount: this.evse.status.gfcicount,
      nogndcount: this.evse.status.nogndcount,
      stuckcount: this.evse.status.stuckcount,
      divertmode: this.evse.status.divertmode,
      solar: this.evse.status.solar,
      grid_ie: this.evse.status.grid_ie,
      charge_rate: this.evse.status.charge_rate,
      divert_update: this.evse.status.divert_update
    };
  }
  set status(newStatus) {
    super.status = newStatus;
  }

  get config() {
    return this._config;
  }

  set config(options)
  {
    var modified;
    debug(options);
    if(options.emoncms)
    {
      modified = false;
      if(options.emoncms.hasOwnProperty("enabled") && this._config.emoncms.enabled !== options.emoncms.enabled) {
        this._config.emoncms.enabled = options.emoncms.enabled;
        modified = true;
      }
      if(options.emoncms.hasOwnProperty("server") && this._config.emoncms.server !== options.emoncms.server) {
        this._config.emoncms.server = options.emoncms.server;
        modified = true;
      }
      if(options.emoncms.hasOwnProperty("node") && this._config.emoncms.node !== options.emoncms.node) {
        this._config.emoncms.node = options.emoncms.node;
        modified = true;
      }
      if(options.emoncms.hasOwnProperty("apikey") && this._config.emoncms.apikey !== options.emoncms.apikey) {
        this._config.emoncms.apikey = options.emoncms.apikey;
        modified = true;
      }
      if(options.emoncms.hasOwnProperty("fingerprint") && this._config.emoncms.fingerprint !== options.emoncms.fingerprint) {
        this._config.emoncms.fingerprint = options.emoncms.fingerprint;
        modified = true;
      }
      if(modified) {
        config.save(this._config);
        this.emoncms.connect(this._config.emoncms);
      }
    }
    if(options.mqtt)
    {
      modified = false;
      if(options.mqtt.hasOwnProperty("enabled") && this._config.mqtt.enabled !== options.mqtt.enabled) {
        this._config.mqtt.enabled = options.mqtt.enabled;
        modified = true;
      }
      if(options.mqtt.hasOwnProperty("protocol") && this._config.mqtt.protocol !== options.mqtt.protocol) {
        this._config.mqtt.protocol = options.mqtt.protocol;
        modified = true;
      }
      if(options.mqtt.hasOwnProperty("server") && this._config.mqtt.server !== options.mqtt.server) {
        this._config.mqtt.server = options.mqtt.server;
        modified = true;
      }
      if(options.mqtt.hasOwnProperty("port") && this._config.mqtt.port !== options.mqtt.port) {
        this._config.mqtt.port = options.mqtt.port;
        modified = true;
      }
      if(options.mqtt.hasOwnProperty("reject_unauthorized") && this._config.mqtt.reject_unauthorized !== options.mqtt.reject_unauthorized) {
        this._config.mqtt.reject_unauthorized = options.mqtt.reject_unauthorized;
        modified = true;
      }
      if(options.mqtt.hasOwnProperty("topic") && this._config.mqtt.topic !== options.mqtt.topic) {
        this._config.mqtt.topic = options.mqtt.topic;
        modified = true;
      }
      if(options.mqtt.hasOwnProperty("user") && this._config.mqtt.user !== options.mqtt.user) {
        this._config.mqtt.user = options.mqtt.user;
        modified = true;
      }
      if(options.mqtt.hasOwnProperty("pass") && this._config.mqtt.pass !== options.mqtt.pass) {
        this._config.mqtt.pass = options.mqtt.pass;
        modified = true;
      }
      if(options.mqtt.hasOwnProperty("solar") && this._config.mqtt.solar !== options.mqtt.solar) {
        this._config.mqtt.solar = options.mqtt.solar;
        modified = true;
      }
      if(options.mqtt.hasOwnProperty("grid_ie") && this._config.mqtt.grid_ie !== options.mqtt.grid_ie) {
        this._config.mqtt.grid_ie = options.mqtt.grid_ie;
        modified = true;
      }

      if(modified) {
        config.save(this._config);
        this.mqtt.connect(this._config.mqtt);
      }
    }
    if(options.ohm)
    {
      modified = false;
      if(options.ohm.hasOwnProperty("enabled") && this._config.ohm.enabled !== options.ohm.enabled) {
        this._config.ohm.enabled = options.ohm.enabled;
        modified = true;
      }
      if(options.ohm.hasOwnProperty("key") && this._config.ohm.key !== options.ohm.key) {
        this._config.ohm.key = options.ohm.key;
        modified = true;
      }
      if(modified) {
        config.save(this._config);
        this.ohmconnect.connect(this._config.ohm);
      }
    }
  }
};
