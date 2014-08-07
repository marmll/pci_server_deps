(function() {
  var name, node, options, script, _, _i, _len, _ref, _ref1,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  _ref = document.getElementsByTagName("script");
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    script = _ref[_i];
    if (!(/skrill\.bootstrap(\.min)?\.js$/.test(script.src))) {
      continue;
    }
    options = {};
    _ref1 = script.attributes;
    for (_ in _ref1) {
      node = _ref1[_];
      if (node != null) {
        name = node.nodeName || node.name;
        if (name != null) {
          name = name.replace("data-", "");
          if (node.nodeValue != null) {
            options[name] = node.nodeValue;
          }
        }
      }
    }
    new ((function() {
      var createElement;

      function _Class(scriptElement, options) {
        var attribute, self, _base, _base1, _j, _len1, _requiredAttributes;
        this.options = options;
        this.closeOverLay = __bind(this.closeOverLay, this);
        this.openOverLay = __bind(this.openOverLay, this);
        this.on = __bind(this.on, this);
        (_base = this.options)["button-class"] || (_base["button-class"] = "skrill-button");
        (_base1 = this.options)["button-text"] || (_base1["button-text"] = "Pay With Skrill");
        self = this;
        _requiredAttributes = ["merchant-id", "payment-amount", "payment-currency", "payment-country", "payment-descriptor"];
        for (_j = 0, _len1 = _requiredAttributes.length; _j < _len1; _j++) {
          attribute = _requiredAttributes[_j];
          if (this.options[attribute] == null) {
            throw new Error("Mising required option: " + attribute);
          }
        }
        document.getElementsByTagName('head')[0].insertBefore(createElement("link", function() {
          this.type = "text/css";
          this.rel = "stylesheet";
          return this.href = "https://psp.dev.skrillws.net/v1/assets/stylesheets/skrill.bootstrap.css";
        }), document.getElementsByTagName('head')[0].children[0]);
        scriptElement.parentNode.appendChild(createElement("button", function() {
          var textContent;
          textContent = this.innerText != null ? "innerText" : "textContent";
          this[textContent] = "" + self.options["button-text"];
          this.className = self.options["button-class"];
          return this.onclick = self.openOverLay;
        }));
        scriptElement.parentNode.removeChild(scriptElement);
        this.on("message", window, this.closeOverLay);
      }

      _Class.prototype.on = function(event, element, callback) {
        if (element.addEventListener) {
          return element.addEventListener(event, callback, false);
        } else if (element.attachEvent) {
          return element.attachEvent("on" + event, callback);
        }
      };

      _Class.prototype.openOverLay = function() {
        var key, urlParams, value;
        urlParams = (function() {
          var _ref2, _results;
          _ref2 = this.options;
          _results = [];
          for (key in _ref2) {
            value = _ref2[key];
            _results.push("" + key + "=" + (encodeURIComponent(value)));
          }
          return _results;
        }).call(this);
        urlParams = urlParams.join("&");
        document.body.style.overflow = "hidden";
        this.skrillOverlay = createElement("iframe", function() {
          var _this = this;
          this.src = "https://psp.dev.skrillws.net/v1/skrill.checkout.html?" + urlParams;
          this.onload = function() {
            return _this.style.opacity = 1;
          };
          this.frameBorder = "0";
          this.seamless = true;
          this.allowTransparency = true;
          this.className = "skrill-overlay";
          return this.style.opacity = 0;
        });
        return document.body.appendChild(this.skrillOverlay);
      };

      _Class.prototype.closeOverLay = function(exitState) {
        if (exitState.data === "success") {
          if (typeof window.__skrillPaymentSelectorPageCallback === "function") {
            window.__skrillPaymentSelectorPageCallback();
          }
        }
        this.skrillOverlay.parentNode.removeChild(this.skrillOverlay);
        return document.body.style.overflow = "";
      };

      createElement = function(tagName, callback) {
        var el;
        el = document.createElement(tagName);
        callback.apply(el);
        return el;
      };

      return _Class;

    })())(script, options);
    return;
  }

}).call(this);
