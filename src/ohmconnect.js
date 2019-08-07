/* jshint node: true, esversion: 6 */

"use strict";

const OhmHour = require("ohmhour");

const base = require("./base");
//const debug = require("debug")("openevse:ohm");

module.exports = class extends base
{
  constructor(evse)
  {
    super();
    this.evse = evse;
    this.enabled = false;
    this.key = "";
    this.inteterval = false;
    this.ohmTime = 60 * 1000;

    this._status = {
      ohm_hour: "NotConnected",
      ohm_charge_sleep: false
    };

  }

  connect(config) {
    this.status = { ohm_hour: "NotConnected" };

    this.enabled = config.enabled;
    this.key = config.key;

    if(this.enabled && false === this.inteterval) {
      this.inteterval = setInterval(this.checkOhmHour, this.ohmTime);
    } else if(!this.enabled && false !== this.inteterval) {
      clearInterval(this.inteterval);
      this.inteterval = false;
    }
  }

  checkOhmHour()
  {
    var ohm = new OhmHour(this.key);
    ohm.check().then((state) =>
    {
      if(state !== this._status.ohm_hour)
      {
        if("True" === state)
        {
          this.evseConn.status(() => {
            this.status = {
              ohm_hour: state,
              ohm_charge_sleep: true
            };
          }, "sleep");
        }
        else if(this._status.ohm_charge_sleep)
        {
          this.evseConn.status(() => {
            this.status = {
              ohm_hour: state,
              ohm_charge_sleep: false
            };
          }, "enable");
        }
      }
    }).catch((error) => {
      console.error("OhmHour check Failed!", error);
    });
  }
};
