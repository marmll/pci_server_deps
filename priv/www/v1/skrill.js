(function() {
  var _base,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __slice = [].slice,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  if (window.Skrill == null) {
    window.Skrill = {};
  }

  if ((_base = window.Skrill).callbacks == null) {
    _base.callbacks = {};
  }

  window.Skrill.version = "1.0.0";

  window.Skrill.Core = (function() {
    Core.setChannelId = function(channelId) {
      return this.prototype.channelId = channelId;
    };

    Core.setMerchantId = function(merchantId) {
      return this.prototype.merchantId = merchantId;
    };

    Core.setEnvironment = function(environment) {
      if (!this.prototype._contains(this.prototype._validEnvironments, environment)) {
        this.prototype._error("Environment must be one of " + (this.prototype._validEnvironments.join(', ')));
      }
      return this.prototype.environment = environment;
    };

    Core.setOrgId = function(orgId) {
      return this.prototype.orgId = orgId;
    };

    Core.setDebug = function(method) {
      if (typeof method === "function") {
        return this.prototype._debug = method;
      } else if (method) {
        return this.prototype._debug = function() {
          var args, _ref;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          args.unshift('skrill.js');
          return typeof console !== "undefined" && console !== null ? (_ref = console.log) != null ? _ref.apply(window.console, args) : void 0 : void 0;
        };
      } else {
        return this.prototype._debug = null;
      }
    };

    Core.setRequestTimeout = function(amount) {
      return this.prototype._requestTimeout = amount;
    };

    Core.on = function() {
      return this.prototype.on.apply(this.prototype, arguments);
    };

    Core.prototype._debug = null;

    Core.prototype.environment = "production";

    Core.prototype.orgId = "k4xv2m4b";

    Core.prototype._validEnvironments = ["integration", "stage", "sandbox", "production"];

    Core.prototype._requiredAttributes = ["pan", "expiry", "cvv", "amount", "currency"];

    Core.prototype._whiteListedAttributes = ["recurring"];

    Core.prototype._blacklistedAttributes = ["pan", "expiry", "cvv"];

    Core.prototype._eventCallbacks = {};

    Core.prototype._requestTimeout = 5000;

    function Core(formId) {
      this._validate = __bind(this._validate, this);
      this._attachJsonpRequestHandler = __bind(this._attachJsonpRequestHandler, this);
      var element;
      this._formData = {};
      this._sessionId = Skrill.Utils.generateUuid();
      if (this.channelId == null) {
        this._error("No channelId set");
      }
      if (this.merchantId == null) {
        this._error("No merchantId set");
      }
      if (typeof this._debug === "function") {
        this._debug("Skrill.Core", "instance", "created");
      }
      if (typeof this._debug === "function") {
        this._debug("environment", this.environment);
      }
      if ((formId != null) && typeof formId !== "string") {
        this._error("If specified, form id must be a string.");
      }
      if ((formId != null) && !formId.length) {
        this._error("If specified, form id can't be empty.");
      }
      if (formId != null) {
        element = document.getElementById(formId);
        if (element != null) {
          this._collectFormData(element);
          element.appendChild(this._metrixTag());
        } else {
          this._error("" + formId + " didn't match any existing DOM elements.");
        }
      }
    }

    Core.prototype.on = function(eventName, callback) {
      if (typeof this._debug === "function") {
        this._debug("event", eventName, "registered");
      }
      return this._eventCallbacks[eventName] = callback;
    };

    Core.prototype._trigger = function() {
      var args, eventName;
      eventName = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (this._eventCallbacks[eventName] != null) {
        if (typeof this._debug === "function") {
          this._debug("event", eventName, "triggered");
        }
        return this._eventCallbacks[eventName].apply(this, args);
      }
    };

    Core.prototype._collectFormData = function(element) {
      var attribute, input, value, _i, _len, _ref;
      if (typeof this._debug === "function") {
        this._debug("formData", "collect");
      }
      this._formElement = element;
      _ref = element.getElementsByTagName("*");
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        input = _ref[_i];
        attribute = input.getAttribute("data-skrill");
        value = input.value || null;
        if (attribute == null) {
          continue;
        }
        this._formData[attribute] = {
          value: value,
          element: input
        };
      }
      return typeof this._debug === "function" ? this._debug("formData", "collected", this._formData) : void 0;
    };

    Core.prototype._extractPayload = function(options) {
      var key, object, payload, requiredAttributes, whiteListedAttributes, _ref;
      if (options == null) {
        options = {};
      }
      requiredAttributes = options.requiredAttributes, whiteListedAttributes = options.whiteListedAttributes;
      requiredAttributes || (requiredAttributes = this._requiredAttributes);
      whiteListedAttributes || (whiteListedAttributes = this._whiteListedAttributes);
      payload = {};
      _ref = this._formData;
      for (key in _ref) {
        object = _ref[key];
        if (!(this._contains(requiredAttributes, key) || this._contains(whiteListedAttributes, key))) {
          continue;
        }
        payload[key] = object.element.value;
        if (object.element.getAttribute("name") && this._contains(this._blacklistedAttributes, key)) {
          object.element.removeAttribute("name");
          if (typeof this._debug === "function") {
            this._debug("removed name attribute", key);
          }
        }
      }
      return payload;
    };

    Core.prototype.renewToken = function(payload) {
      payload || (payload = this._extractPayload({
        requiredAttributes: ["cvv"],
        whiteListedAttributes: ["token"]
      }));
      return this.getToken(payload);
    };

    Core.prototype.getToken = function(payload) {
      var isValid;
      payload || (payload = this._extractPayload());
      isValid = this._validate(payload);
      if (isValid === false) {
        this._error("payload invalid");
      }
      if (payload.recurring == null) {
        payload.recurring = false;
      }
      payload.sessionid = this._sessionId;
      if (typeof this._debug === "function") {
        this._debug("token", "get");
      }
      return this._getJsonp({
        url: this._tokenizationUrl(),
        data: payload
      });
    };

    Core.prototype._tokenizationUrl = function() {
      var urlRoot;
      urlRoot = (function() {
        switch (this.environment) {
          case "integration":
            return "https://psp.dev.skrillws.net";
          case "stage":
            return "https://psp.dev.moneybookers.net";
          case "sandbox":
            return "https://psp.sandbox.dev.skrillws.net";
          case "production":
            return "https://psp.skrill.com";
        }
      }).call(this);
      return urlRoot + ("/v1/json/" + this.merchantId + "/" + this.channelId + "/creditcard");
    };

    Core.prototype._termUrl = function() {
      switch (this.environment) {
        case "integration":
          return "https://wpf.dev.skrillws.net/term";
        case "stage":
          return "https://wpf.dev.moneybookers.net/term";
        case "sandbox":
          return "https://checkout.sandbox.dev.skrillws.net/term";
        case "production":
          return "https://checkout.skrill.com/term";
      }
    };

    Core.prototype._metrixTag = function() {
      var metrix;
      metrix = document.createElement("img");
      metrix.setAttribute("src", "https://h.online-metrix.net/fp/clear.png?org_id=" + this.orgId + "&session_id=" + this._sessionId + "&m=2");
      metrix.setAttribute("alt", "");
      return metrix;
    };

    Core.prototype._getJsonp = function(options) {
      var callbackLabel, script, urlParams;
      script = document.createElement('script');
      callbackLabel = this._attachJsonpRequestHandler(script);
      options.data.callback = "window.Skrill.callbacks['" + callbackLabel + "']";
      options.data.successurl = options.data.errorurl = this._termUrl();
      urlParams = this._stringifyUrlParams(options.data);
      script.src = "" + options.url + "?" + urlParams;
      document.getElementsByTagName('head')[0].appendChild(script);
      return typeof this._debug === "function" ? this._debug("jsonp", "get") : void 0;
    };

    Core.prototype._attachJsonpRequestHandler = function(script) {
      var callbackLabel, cleanup, timeout,
        _this = this;
      this._jsonpRequestComplete = false;
      if (typeof this._debug === "function") {
        this._debug("callbackHandler", "attach");
      }
      callbackLabel = "skrill_" + ((new Date).getTime());
      cleanup = function(options) {
        if (options.callbackLabel) {
          delete window.Skrill.callbacks[callbackLabel];
        }
        if (options.script) {
          _this._removeDomElement(script);
        }
        if (options.timeout) {
          return window.clearTimeout(timeout);
        }
      };
      timeout = window.setTimeout(function() {
        if (!_this._jsonpRequestComplete) {
          script.onerror = null;
          cleanup({
            script: script,
            callbackLabel: callbackLabel
          });
          if (typeof _this._debug === "function") {
            _this._debug("network_error", "timeout");
          }
          return _this._trigger("network_error", {
            message: "request timed out"
          });
        }
      }, this._requestTimeout);
      script.onerror = function(error) {
        cleanup({
          script: script,
          callbackLabel: callbackLabel,
          timeout: timeout
        });
        return _this._trigger("network_error", error.target);
      };
      window.Skrill.callbacks[callbackLabel] = function(response) {
        var _ref;
        window.clearTimeout(timeout);
        _this._jsonpRequestComplete = true;
        if (typeof _this._debug === "function") {
          _this._debug("jsonp", "response", response);
        }
        if (Skrill.Utils.responseError(response)) {
          _this._trigger("token_error", {
            message: response.message || "General Error",
            advice: response.advice || "Please contact a Skrill service representative."
          });
        } else if (response.processing != null) {
          _this._trigger("threedsecure", new Skrill.Utils.Threed(response.processing, _this));
        } else if ((_ref = response.account) != null ? _ref.token : void 0) {
          if (_this._token === response.account.token) {
            if (typeof _this._debug === "function") {
              _this._debug("re-fetched existing token!");
            }
          }
          _this._token = response.account.token;
          _this._trigger("token_generated", response.account);
        } else {
          if (typeof _this._debug === "function") {
            _this._debug("unknown response", response);
          }
          _this._trigger("network_error");
        }
        return cleanup({
          script: script,
          callbackLabel: callbackLabel
        });
      };
      return callbackLabel;
    };

    Core.prototype._removeDomElement = function(element) {
      return Skrill.Utils.removeDomElement(element);
    };

    Core.prototype._stringifyUrlParams = function(paramsObject) {
      var key, urlParams, value;
      urlParams = (function() {
        var _results;
        _results = [];
        for (key in paramsObject) {
          value = paramsObject[key];
          _results.push("" + key + "=" + (encodeURIComponent(value)));
        }
        return _results;
      })();
      return urlParams.join("&").replace(/%20/g, "+");
    };

    Core.prototype._contains = function(haystack, needle) {
      return __indexOf.call(haystack, needle) >= 0;
    };

    Core.prototype.validateAttribute = function(attr, value) {
      var _ref;
      value = value.replace(/\s+|-/g, "");
      return (_ref = this._validationRules[attr]) != null ? _ref.call(this, value) : void 0;
    };

    Core.prototype._validate = function(payload) {
      var errors, rule, value, _ref, _ref1;
      if (payload == null) {
        return "payload cannot be empty";
      }
      errors = [];
      for (rule in payload) {
        value = payload[rule];
        if (this._contains(this._requiredAttributes, rule)) {
          if (!value || !this.validateAttribute.call(this, rule, value)) {
            errors.push({
              attribute: rule,
              value: value,
              element: ((_ref = this._formData[rule]) != null ? _ref.element : void 0) || null
            });
          }
        } else {
          if (!((value != null) && value !== "")) {
            errors.push({
              attribute: rule,
              value: value,
              element: ((_ref1 = this._formData[rule]) != null ? _ref1.element : void 0) || null
            });
          }
        }
      }
      if (errors.length) {
        this._trigger("attribute_invalid", errors);
        return !!errors.length;
      } else {
        return void 0;
      }
    };

    Core.prototype._validationRules = {
      pan: function(value) {
        return value.length >= 10 && value.length <= 16 && this._luhnCheck(value);
      },
      expiry: function(value) {
        var datum, expiryDate, month, now, year, _ref;
        if (/^\d{1,2}\/\d{4}$/.test(value)) {
          _ref = (function() {
            var _i, _len, _ref, _results;
            _ref = value.split("/");
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              datum = _ref[_i];
              _results.push(parseInt(datum, 10));
            }
            return _results;
          })(), month = _ref[0], year = _ref[1];
          if ((0 < month && month <= 12)) {
            expiryDate = new Date(year, month, 0);
            now = new Date();
            return expiryDate >= now;
          }
        }
        return false;
      },
      amount: function(value) {
        return /^\d+$/.test(value);
      },
      currency: function(value) {
        return /^[A-Z]{3}$/.test(value);
      },
      cvv: function(value) {
        var _ref, _ref1;
        if (/^\d+$/.test(value)) {
          if (this._formData.pan != null) {
            return _ref = value.length, __indexOf.call(Skrill.Utils.cvvLength(this._formData.pan.element.value), _ref) >= 0;
          } else {
            return (3 <= (_ref1 = value.length) && _ref1 <= 4);
          }
        }
        return false;
      }
    };

    Core.prototype._luhnCheck = function(value) {
      var digit, index, luhn, string, sum, toggle, _i, _len;
      toggle = true;
      sum = index = 0;
      luhn = (function() {
        var _i, _len, _ref, _results;
        _ref = String(value).split('').reverse();
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          string = _ref[_i];
          _results.push(parseInt(string, 10));
        }
        return _results;
      })();
      for (_i = 0, _len = luhn.length; _i < _len; _i++) {
        digit = luhn[_i];
        if (toggle = !toggle) {
          digit *= 2;
        }
        if (digit > 9) {
          digit -= 9;
        }
        sum += digit;
      }
      return sum % 10 === 0;
    };

    Core.prototype._error = function(errorText) {
      throw new Error(errorText);
    };

    return Core;

  })();

  if (window.Skrill == null) {
    window.Skrill = {};
  }

  window.Skrill.Utils = {
    generateUuid: function() {
      var d;
      d = new Date().getTime();
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r;
        r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : r & 0x7 | 0x8).toString(16);
      });
    },
    responseError: function(response) {
      return response.level !== 0 && response.code !== 0;
    },
    parseJson: function(jsonString) {
      var _ref;
      if (((_ref = window.JSON) != null ? _ref.parse : void 0) != null) {
        return window.JSON.parse(jsonString);
      }
      if (typeof jsonString !== "string") {
        return jsonString;
      }
      return Skrill.Utils._parseJson(jsonString);
    },
    _parseJson: function(jsonString) {
      var regExTrim, regExValidBraces, regExValidChars, regExValidEscape, regExValidTokens;
      regExTrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
      regExValidChars = /^[\],:{}\s]*$/;
      regExValidBraces = /(?:^|:|,)(?:\s*\[)+/g;
      regExValidEscape = /\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g;
      regExValidTokens = /"[^"\\\r\n]*"|true|false|null|-?(?:\d+\.|)\d+(?:[eE][+-]?\d+|)/g;
      jsonString = String(jsonString).replace(regExTrim, "");
      if (jsonString && regExValidChars.test(jsonString.replace(regExValidEscape, "@").replace(regExValidTokens, "]").replace(regExValidBraces, ""))) {
        return (new Function("return " + jsonString))();
      } else {
        throw new SyntaxError("Invalid JSON");
      }
    },
    postMessage: function(message, target) {
      target || (target = parent);
      if (window.postMessage != null) {
        return target.postMessage(message, "*");
      } else {
        return Skrill.Utils._postMessage(message, target);
      }
    },
    _postMessage: function(message, target) {
      return target.name = message;
    },
    onMessage: function(callback) {
      var eventMethod, messageEvent;
      if (window.postMessage != null) {
        eventMethod = window.addEventListener != null ? "addEventListener" : "attachEvent";
        messageEvent = eventMethod === "attachEvent" ? "onmessage" : "message";
        return window[eventMethod](messageEvent, function(event) {
          var message;
          message = window.Skrill.Utils.parseJson(event.data);
          return callback.call(this, message);
        }, false);
      } else {
        return Skrill.Utils._onMessage(callback);
      }
    },
    _onMessage: function(callback) {
      var interval;
      (typeof interval !== "undefined" && interval !== null) && clearInterval(interval);
      return interval = setInterval(function() {
        var message;
        message = window.name;
        if (message) {
          window.name = "";
          message = window.Skrill.Utils.parseJson(message);
          return callback.call(this, message);
        }
      }, 100);
    },
    addClass: function(className, element) {
      var classList;
      classList = element.className.split(" ");
      classList.push(className);
      return element.className = classList.join(" ");
    },
    removeClass: function(className, element) {
      var classList, index, klass, newClassName, _i, _len;
      classList = element.className.split(" ");
      for (index = _i = 0, _len = classList.length; _i < _len; index = ++_i) {
        klass = classList[index];
        if (className === klass) {
          classList.splice(index, 1);
        }
      }
      newClassName = classList.join(" ");
      return element.className = newClassName;
    },
    cvvLength: function(value) {
      if (this.brand(value) === "unknown") {
        return [3, 4];
      } else if (this.brand(value) === "amex") {
        return [4];
      } else {
        return [3];
      }
    },
    brand: function(value) {
      return this.brands()[value.slice(0, 2)] || "unknown";
    },
    brands: function() {
      var brands, n, _i, _j, _k, _l, _len, _len1, _len2, _m, _ref, _ref1, _ref2;
      brands = {};
      for (n = _i = 40; _i <= 49; n = ++_i) {
        brands[n] = "visa";
      }
      for (n = _j = 50; _j <= 59; n = ++_j) {
        brands[n] = "mastercard";
      }
      _ref = [34, 37];
      for (_k = 0, _len = _ref.length; _k < _len; _k++) {
        n = _ref[_k];
        brands[n] = "amex";
      }
      _ref1 = [60, 62, 64, 65];
      for (_l = 0, _len1 = _ref1.length; _l < _len1; _l++) {
        n = _ref1[_l];
        brands[n] = "discover";
      }
      _ref2 = [30, 36, 38, 39];
      for (_m = 0, _len2 = _ref2.length; _m < _len2; _m++) {
        n = _ref2[_m];
        brands[n] = "dinersclub";
      }
      brands[35] = "jcb";
      return brands;
    },
    removeDomElement: function(element) {
      var _ref;
      return (_ref = element.parentNode) != null ? _ref.removeChild(element) : void 0;
    }
  };

  Skrill.Utils.Threed = (function() {
    function Threed(response, skrillInstance) {
      var input, prop, _base1, _i, _len, _ref;
      this.response = response;
      this.skrillInstance = skrillInstance;
      if (typeof (_base1 = Skrill.Core.prototype)._debug === "function") {
        _base1._debug("Threed", "instance", "created");
      }
      try {
        this.iframe = document.createElement('<iframe name="skrill-3dsecure" />');
      } catch (_error) {
        this.iframe = document.createElement('iframe');
        this.iframe.setAttribute("name", "skrill-3dsecure");
      }
      this.form = document.createElement('form');
      this.iframe.setAttribute("frameBorder", "0");
      this.iframe.setAttribute("seamless", true);
      _ref = ["TermUrl", "PaReq", "MD"];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        prop = _ref[_i];
        input = document.createElement('input');
        input.setAttribute("type", "hidden");
        input.setAttribute("name", prop);
        input.setAttribute("value", this.response[prop.toLowerCase()]);
        this.form.appendChild(input);
      }
      this.form.setAttribute("target", "skrill-3dsecure");
      this.form.setAttribute("method", "POST");
      this.form.setAttribute("action", this.response.redirecturl);
      document.body.appendChild(this.form);
    }

    Threed.prototype.start = function() {
      var _base1,
        _this = this;
      if (typeof (_base1 = Skrill.Core.prototype)._debug === "function") {
        _base1._debug("Threed", "started");
      }
      this.form.submit();
      return window.Skrill.Utils.onMessage(function(response) {
        var _base2, _base3, _base4, _ref;
        if (typeof (_base2 = Skrill.Core.prototype)._debug === "function") {
          _base2._debug("Threed", "onMessage", "response", response);
        }
        Skrill.Utils.removeDomElement(_this.iframe);
        Skrill.Utils.removeDomElement(_this.form);
        if (Skrill.Utils.responseError(response)) {
          if (typeof (_base3 = Skrill.Core.prototype)._debug === "function") {
            _base3._debug("Threed", "onMessage", "error");
          }
          return _this.skrillInstance._trigger("token_error", {
            message: response.message || "General Error",
            advice: response.advice || "Please contact a Skrill service representative."
          });
        } else if ((_ref = response.account) != null ? _ref.token : void 0) {
          if (typeof (_base4 = Skrill.Core.prototype)._debug === "function") {
            _base4._debug("Threed", "onMessage", "success");
          }
          return _this.skrillInstance._trigger("token_generated", response.account);
        }
      });
    };

    return Threed;

  })();

}).call(this);
