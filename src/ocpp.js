/* jshint node: true, esversion: 6*/

"use strict";

const ocpp = require("ocpp-eliftech");

const base = require("./base");
const debug = require("debug")("openevse:ocpp");

module.exports = class  extends base
{
  constructor(evse, system)
  {
    super();
    this.evse = evse;
    this.system = system;
    this.config = {
      enabled: false,
      central_system: "",
      charge_box_id: false,
      tag_id: false
    };
  }

  connect(config)
  {
    this.config = config;

    this.status = {
      ocpp_connected: 0
    };

    if(this.config.enabled)
    {
      var connectors = [
        new ocpp.Connector(1)
      ];
      const client = new ocpp.ChargePoint({
        centralSystemUrl: this.config.central_system+"/"+this.config.charge_box_id,
        connectors: connectors
      });

      client.connect().then(() => {
        client.onRequest = (command) =>
        {
          debug(command);
          //switch (true) {
          //case command instanceof ocpp.OCPPCommands.RemoteStartTransaction:
          //  setTimeout(() => startTransaction(command), 1);
          //  return {
          //    status: RemoteStartTransactionConst.STATUS_ACCEPTED
          //  };
          //case command instanceof ocpp.OCPPCommands.RemoteStopTransaction:
          //  setTimeout(() => stopTransaction(command), 1);
          //  return {
          //    status: RemoteStartTransactionConst.STATUS_ACCEPTED
          //  };
          //}
        };

        const boot = new ocpp.OCPPCommands.BootNotification({
          chargePointVendor: this.evse.info.vendor,
          chargeBoxSerialNumber: this.system.serial_number,
          chargePointModel: this.evse.info.model,
          firmwareVersion: this.evse.info.version + "_" + this.evse.info.firmware
        });

        client.send(boot).then(() => {
          client.sendCurrentStatus().then(() => {
            this.status = {
              ocpp_connected: 1
            };
          });
        });
      }).catch((e) => {
        debug(e);
        this.status = {
          ocpp_connected: -1
        };
      });

      return client;
    }

    return false;
  }

};
