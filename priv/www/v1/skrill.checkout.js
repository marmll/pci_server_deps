(function() {
  $.cssEase._default = "cubic-bezier(0.275, 0.995, 0.275, 1.000)";

  Backbone.Marionette.Renderer.render = function(template, data) {
    if (_.isFunction(template)) {
      return template(data);
    } else {
      if (!JST[template]) {
        throw "Template " + template + " not found!";
      }
      return JST[template](data);
    }
  };

  window.Panther = new Backbone.Marionette.Application();

  Panther.bindEvent = function(event, element, callback) {
    if (element.addEventListener) {
      return element.addEventListener(event, callback, false);
    } else if (element.attachEvent) {
      return element.attachEvent("on" + event, callback);
    }
  };

  Panther.addInitializer(function(options) {
    var _this = this;
    this.options = options;
    this.PAYMENT_METHODS_FETCH_ATTEMPT = 0;
    this.urlRoot = "https://mportal.dev.moneybookers.net";
    this.ModalCover.start();
    this.PaymentMethods.start();
    this.Header.start();
    this.Footer.start();
    this.vent.on("payment-methods:error", function() {
      if (_this.PAYMENT_METHODS_FETCH_ATTEMPT !== 3) {
        _this.PaymentMethods.stop();
        return _this.PaymentMethods.start();
      } else {
        return _this.vent.trigger("close");
      }
    });
    this.bindEvent("message", window, function(event) {
      var message;
      if (event.data != null) {
        message = window.JSON.parse(event.data);
        if (message.level === 0) {
          return _this.vent.trigger("payment:success", _this.PaymentMethods.paymentMethodListView.activeView);
        } else {
          return _this.vent.trigger("payment:error", _this.PaymentMethods.paymentMethodListView.activeView);
        }
      }
    }, false);
    return this.vent.on("close", function(exitState) {
      var _this = this;
      return $("body").transit({
        opacity: 0
      }, function() {
        return window.parent.postMessage(exitState, "*");
      });
    });
  });

}).call(this);

(function() {
  window.Panther.methodMap = {
    validators: {
      email: "email"
    },
    schemas: {
      cardholder: {
        help: "cardholder help text"
      },
      cvv: {
        help: "cvv help text"
      },
      email: {
        help: "email help text"
      }
    },
    lobanet: {
      name: "Lobanet",
      dimensions: {
        width: null,
        height: null
      }
    },
    ideal: {
      name: "iDEAL",
      dimensions: {
        width: null,
        height: null
      }
    },
    paysafecard: {
      name: "Paysafecard",
      dimensions: {
        width: null,
        height: 400
      }
    },
    creditcard: {
      name: "Credit Card",
      dimensions: {
        width: null,
        height: 470
      }
    },
    skrilldirect: {
      name: "Skrill Direct",
      dimensions: {
        width: null,
        height: 630
      },
      shouldCacheUrl: false
    },
    yandex: {
      name: "Yandex",
      dimensions: {
        width: null,
        height: null
      }
    },
    skrillwallet: {
      name: "Skrill Wallet",
      dimensions: {
        width: null,
        height: 500
      }
    },
    boleto: {
      name: "Boleto Bancário",
      dimensions: {
        width: null,
        height: null
      }
    },
    multibanco: {
      name: "Multibanco",
      dimensions: {
        width: null,
        height: null
      }
    },
    neosurf: {
      name: "Neosurf",
      dimensions: {
        width: null,
        height: null
      }
    },
    webmoney: {
      name: "Webmoney",
      dimensions: {
        width: null,
        height: null
      }
    }
  };

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Panther.module("Footer", function(Header, App) {
    var FooterView, _ref,
      _this = this;
    this.startWithParent = false;
    FooterView = (function(_super) {
      __extends(FooterView, _super);

      function FooterView() {
        this.templateHelpers = __bind(this.templateHelpers, this);
        _ref = FooterView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      FooterView.prototype.el = ".footer";

      FooterView.prototype.template = "footer/more";

      FooterView.prototype.events = {
        "click .more": function() {
          return App.PaymentMethods.paymentMethodListView.morePaymentMethods();
        }
      };

      FooterView.prototype.setTemplate = function(template, duration) {
        var previousTemplate,
          _this = this;
        if (JST[template] != null) {
          if (duration != null) {
            previousTemplate = this.template;
            window.setTimeout(function() {
              return _this.setTemplate(previousTemplate);
            }, duration);
          }
          this.template = template;
          return this.render();
        }
      };

      FooterView.prototype.templateHelpers = function() {
        var _this = this;
        return {
          getError: function() {
            return _this.model.getError();
          }
        };
      };

      FooterView.prototype.initialize = function() {
        var _this = this;
        App.vent.on("payment-methods:rendered", function() {
          _this.$el.transit({
            opacity: 1
          });
          if (_this.collection.additionalMethods != null) {
            return _this.setTemplate("footer/more");
          }
        });
        this.collection.on("change:selected", function(_, selected) {
          if (selected) {
            return _this.setTemplate("footer/hidden");
          } else if (_this.collection.additionalMethods != null) {
            return _this.setTemplate("footer/more");
          }
        });
        this.collection.on("add", function(_, selected) {
          if (_this.collection.additionalMethods == null) {
            return _this.setTemplate("footer/hidden");
          }
        });
        return this.collection.on("method:invalid", function(model) {
          _this.model = model;
          return _this.setTemplate("footer/error", 1000);
        });
      };

      return FooterView;

    })(Backbone.Marionette.ItemView);
    return this.addInitializer(function() {
      _this.footerView = new FooterView({
        collection: App.PaymentMethods.paymentMethodCollection
      });
      return _this.footerView.render();
    });
  });

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Panther.module("Header", function(Header, App) {
    var HeaderView, _ref,
      _this = this;
    this.startWithParent = false;
    HeaderView = (function(_super) {
      __extends(HeaderView, _super);

      function HeaderView() {
        _ref = HeaderView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      HeaderView.prototype.el = ".header";

      HeaderView.prototype.template = "header/initial";

      HeaderView.prototype.events = {
        "click .icon-close": function() {
          return App.vent.trigger("close");
        },
        "click .icon-back": function() {
          return App.PaymentMethods.paymentMethodListView.contractChild();
        }
      };

      HeaderView.prototype.setTemplate = function(template, duration) {
        var previousTemplate,
          _this = this;
        if (JST[template] != null) {
          if (duration != null) {
            previousTemplate = this.template;
            window.setTimeout(function() {
              return _this.setTemplate(previousTemplate);
            }, duration);
          }
          this.template = template;
          return this.render();
        }
      };

      HeaderView.prototype.initialize = function() {
        var _this = this;
        this.collection.on("change:selected", function(model) {
          _this.model = model;
          return _this.setTemplate(model.changed.selected ? !model.isValid() ? "header/prompt" : "header/selected" : "header/initial");
        });
        this.collection.on("error", function() {
          return _this.setTemplate("header/error", 1000);
        });
        this.collection.on("initial", function() {
          return _this.setTemplate("header/initial");
        });
        this.collection.on("selected", function() {
          return _this.setTemplate("header/selected");
        });
        return App.vent.on("payment-methods:rendered", function() {
          return _this.$el.transit({
            opacity: 1
          });
        });
      };

      return HeaderView;

    })(Backbone.Marionette.ItemView);
    return this.addInitializer(function() {
      var headerView;
      headerView = new HeaderView({
        collection: App.PaymentMethods.paymentMethodCollection
      });
      return headerView.render();
    });
  });

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Panther.module("ModalCover", function(ModalCover, App) {
    var ModalView, _ref,
      _this = this;
    this.startWithParent = false;
    ModalView = (function(_super) {
      __extends(ModalView, _super);

      function ModalView() {
        _ref = ModalView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      ModalView.prototype.el = ".modal-cover";

      ModalView.prototype.initialize = function() {
        this.$el.transit({
          opacity: 1,
          duration: 500
        });
        return this.spinner = new Spinner({
          lines: 13,
          length: 20,
          width: 10,
          radius: 30,
          corners: 1.0,
          rotate: 0,
          trail: 60,
          speed: 1.0,
          direction: 1,
          color: "#ffffff"
        }).spin(this.$el[0]);
      };

      ModalView.prototype.events = {
        click: function() {
          return App.vent.trigger("close");
        }
      };

      return ModalView;

    })(Backbone.Marionette.View);
    return this.addInitializer(function() {
      var modalView;
      modalView = new ModalView;
      return App.vent.on("payment-methods:sync", function() {
        return modalView.spinner.stop();
      });
    });
  });

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Panther.module("PaymentMethods", function(PaymentMethods, App) {
    var PaymentMethod, PaymentMethodCollection, PaymentMethodListItem, PaymentMethodListView, _ref, _ref1, _ref2, _ref3,
      _this = this;
    this.startWithParent = false;
    PaymentMethod = (function(_super) {
      __extends(PaymentMethod, _super);

      function PaymentMethod() {
        _ref = PaymentMethod.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      PaymentMethod.prototype.url = function() {
        return "" + App.urlRoot + "/api/v1/payment_urls/" + App.options.merchant.id;
      };

      PaymentMethod.prototype.defaults = function() {
        return {
          customer: App.options.customer,
          payment: App.options.payment,
          shouldCacheUrl: true
        };
      };

      PaymentMethod.prototype.events = {
        "change:redirect_url": function(model, changed) {
          return this.trigger(changed != null ? "method:show" : "error");
        },
        "change:level": function(model, level) {
          if (level > 0) {
            return this.trigger("method:invalid", model);
          }
        },
        "change:selected": function(model, selected) {
          if (!selected) {
            if (!this.get("shouldCacheUrl")) {
              return this.set({
                redirect_url: null
              }, {
                silent: true
              });
            }
          }
        }
      };

      PaymentMethod.prototype.initialize = function() {
        var _ref1;
        this.set({
          shouldCacheUrl: (_ref1 = App.methodMap[this.id]) != null ? _ref1.shouldCacheUrl : void 0
        });
        return this.on(this.events);
      };

      PaymentMethod.prototype.validate = function() {
        var attribute, errors;
        if (this.requiredAttributes) {
          errors = (function() {
            var _i, _len, _ref1, _results;
            _ref1 = this.requiredAttributes;
            _results = [];
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              attribute = _ref1[_i];
              if (this.get(attribute) != null) {
                continue;
              } else {
                _results.push(attribute);
              }
            }
            return _results;
          }).call(this);
          if (errors.length) {
            return errors;
          } else {
            return void 0;
          }
        }
      };

      PaymentMethod.prototype.fetch = function() {
        var payload;
        this.clearError();
        if (this.get("redirect_url") != null) {
          return this.trigger("method:show");
        } else {
          payload = _.extend({
            method: this.get("id"),
            customer: this.get("customer")
          }, this.get("payment"));
          return PaymentMethod.__super__.fetch.call(this, {
            contentType: 'application/json',
            dataType: "jsonp",
            timeout: 5000,
            data: payload
          });
        }
      };

      PaymentMethod.prototype.select = function() {
        return this.collection.select(this);
      };

      PaymentMethod.prototype.deselect = function() {
        return this.collection.deselect(this);
      };

      PaymentMethod.prototype.getError = function() {
        return this.get("error_message") || this.get("error") || this.get("message") || "General Error";
      };

      PaymentMethod.prototype.clearError = function() {
        var attribute, _i, _len, _ref1, _results;
        _ref1 = ["error", "error_message", "level", "code"];
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          attribute = _ref1[_i];
          _results.push(this.unset(attribute, {
            silent: true
          }));
        }
        return _results;
      };

      PaymentMethod.prototype.parse = function(response) {
        var attribute, attributes, key, parentKey, required_attributes, _i, _j, _len, _len1, _ref1;
        response = _.isArray(response) ? response[0] : response;
        if (response.redirect_url != null) {
          response.redirect_url = response.redirect_url.replace("http:", "https:");
        }
        if (response.required_attributes != null) {
          this.schema = {};
          required_attributes = response.required_attributes[0];
          response.required_attributes = [];
          for (parentKey in required_attributes) {
            attributes = required_attributes[parentKey];
            for (_i = 0, _len = attributes.length; _i < _len; _i++) {
              key = attributes[_i];
              response.required_attributes.push("" + parentKey + "." + key);
            }
          }
          this.requiredAttributes = response.required_attributes;
          _ref1 = response.required_attributes;
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            attribute = _ref1[_j];
            this.schema[attribute] = App.methodMap.schemas[attribute] || {};
            this.schema[attribute].validators = ["required"];
            if (App.methodMap.validators[attribute] != null) {
              this.schema[attribute].validators.push(App.methodMap.validators[attribute]);
            }
          }
          delete response.required_attributes;
        }
        return response;
      };

      return PaymentMethod;

    })(Backbone.DeepModel);
    PaymentMethodCollection = (function(_super) {
      __extends(PaymentMethodCollection, _super);

      function PaymentMethodCollection() {
        _ref1 = PaymentMethodCollection.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      PaymentMethodCollection.prototype.model = PaymentMethod;

      PaymentMethodCollection.prototype.url = function() {
        return "" + App.urlRoot + "/api/v1/payment_methods/" + App.options.merchant.id + "?currency=" + App.options.payment.currency;
      };

      PaymentMethodCollection.prototype.parse = function(response) {
        var desiredSize, index, method, padding, _i, _j, _len, _ref2;
        if (response == null) {
          response = [];
        }
        response.sort(function(a, b) {
          if (a.id < b.id) {
            return -1;
          }
          if (a.id > b.id) {
            return 1;
          }
          return 0;
        });
        if (response.length > 6) {
          this.additionalMethods = response.splice(6);
        }
        if (response.length % 3) {
          desiredSize = (function() {
            switch (false) {
              case !(response.length < 3):
                return 3;
              case !(response.length < 6):
                return 6;
              case !(response.length < 9):
                return 9;
            }
          })();
          padding = desiredSize - response.length;
          for (index = _i = 0; 0 <= padding ? _i < padding : _i > padding; index = 0 <= padding ? ++_i : --_i) {
            response.push({
              id: "blank" + index,
              blank: true
            });
          }
        }
        for (_j = 0, _len = response.length; _j < _len; _j++) {
          method = response[_j];
          method.name = (_ref2 = App.methodMap[method.id]) != null ? _ref2.name : void 0;
        }
        return response;
      };

      PaymentMethodCollection.prototype.initialize = function() {
        return this.selected = null;
      };

      PaymentMethodCollection.prototype.deselect = function() {
        if (!this.selected) {
          return;
        }
        this.selected.set({
          selected: false
        });
        return this.selected = null;
      };

      PaymentMethodCollection.prototype.select = function(model) {
        if (model === this.selected) {
          return;
        }
        if (this.selected != null) {
          this.selected.set({
            selected: false
          });
        }
        model.set({
          selected: true
        });
        return this.selected = model;
      };

      PaymentMethodCollection.prototype.fetch = function() {
        App.PAYMENT_METHODS_FETCH_ATTEMPT++;
        return PaymentMethodCollection.__super__.fetch.call(this, {
          dataType: "jsonp",
          timeout: 5000
        });
      };

      return PaymentMethodCollection;

    })(Backbone.Collection);
    PaymentMethodListItem = (function(_super) {
      __extends(PaymentMethodListItem, _super);

      function PaymentMethodListItem() {
        _ref2 = PaymentMethodListItem.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      PaymentMethodListItem.prototype.tagName = "li";

      PaymentMethodListItem.prototype.className = "method";

      PaymentMethodListItem.prototype.template = "payment-methods-list/method";

      PaymentMethodListItem.prototype.ui = {
        iframe: "#payment-method-iframe",
        icon: ".icon",
        name: ".name"
      };

      PaymentMethodListItem.prototype.modelEvents = {
        "request": function() {
          return this.showSpinner();
        },
        "sync": function() {
          return this.hideSpinner();
        },
        "error": function() {
          this.hideSpinner();
          return this.shake({
            notify: true
          });
        },
        "method:prompt": function() {
          return this.trigger("method:prompt", this);
        },
        "method:show": function() {
          return this.trigger("method:show", this);
        }
      };

      PaymentMethodListItem.prototype.attributes = function() {
        return {
          "data-method": this.model.get("id"),
          "data-blank": this.model.get("blank")
        };
      };

      PaymentMethodListItem.prototype.events = {
        "click .method-body.selected .success button": function() {
          return App.vent.trigger("close", "success");
        },
        "click .method-body.selected .error button": function() {
          this.trigger("method:hide", this);
          return this.model.set("redirect_url", null);
        },
        "click .method-body:not(.selected)": function() {
          if (this.model.get("blank")) {
            return;
          }
          if (this.model.isValid()) {
            return this.model.fetch();
          } else {
            return this.trigger("method:prompt", this);
          }
        }
      };

      PaymentMethodListItem.prototype.showSpinner = function(el) {
        if (el == null) {
          el = this.el;
        }
        return this.spinner = new Spinner({
          lines: 13,
          length: 10,
          width: 5,
          radius: 20,
          corners: 1.0
        }).spin(el);
      };

      PaymentMethodListItem.prototype.hideSpinner = function() {
        var _ref3;
        return (_ref3 = this.spinner) != null ? _ref3.stop() : void 0;
      };

      PaymentMethodListItem.prototype.computePinnedPosition = function() {
        return {
          top: Math.floor(this.options.itemIndex / 3) * this.options.dimensions.height,
          left: this.options.dimensions.width * (this.options.itemIndex % 3)
        };
      };

      PaymentMethodListItem.prototype.pin = function() {
        this.position = this.computePinnedPosition();
        return this.$el.css({
          margin: 0,
          position: "absolute",
          top: this.position.top,
          left: this.position.left
        });
      };

      PaymentMethodListItem.prototype.shake = function(options) {
        var _this = this;
        if (options == null) {
          options = {};
        }
        this.$el.on("webkitAnimationEnd mozAnimationEnd oAnimationEnd msAnimationEnd AnimationEnd", function(e) {
          return window.setTimeout(function() {
            _this.$el.removeClass("animated shake");
            if (options.notify) {
              return _this.model.collection.trigger(_this.model.collection.selected != null ? "selected" : "initial");
            }
          }, 1000);
        });
        return this.$el.addClass("animated shake");
      };

      PaymentMethodListItem.prototype.transitionFadeOut = function() {
        return this.$el.transit({
          opacity: 0
        });
      };

      PaymentMethodListItem.prototype.transitionFadeIn = function() {
        return this.$el.transit({
          opacity: 1
        });
      };

      PaymentMethodListItem.prototype.transitionExpand = function(dimensions) {
        var modelId,
          _this = this;
        modelId = this.model.id;
        return this.$el.transit({
          zIndex: 10,
          top: 0,
          left: 0,
          width: dimensions != null ? dimensions.width : this.options.expandedDimensions.width || (this.options.parent.containerWidth()),
          height: dimensions != null ? dimensions.height : this.options.expandedDimensions.height || (this.options.parent.containerHeight())
        }, function() {
          return _this.trigger("method:expanded");
        });
      };

      PaymentMethodListItem.prototype.transitionContract = function() {
        var _this = this;
        return this.$el.transit({
          zIndex: 0,
          top: this.position.top,
          left: this.position.left,
          width: this.options.dimensions.width,
          height: this.options.dimensions.height
        }, function() {
          return _this.trigger("method:contracted");
        });
      };

      return PaymentMethodListItem;

    })(Backbone.Marionette.ItemView);
    PaymentMethodListView = (function(_super) {
      __extends(PaymentMethodListView, _super);

      function PaymentMethodListView() {
        _ref3 = PaymentMethodListView.__super__.constructor.apply(this, arguments);
        return _ref3;
      }

      PaymentMethodListView.prototype.itemView = PaymentMethodListItem;

      PaymentMethodListView.prototype.el = ".payment-method-list";

      PaymentMethodListView.prototype.itemDimensions = {
        width: 200,
        height: 190
      };

      PaymentMethodListView.prototype.itemViewOptions = function(model, index) {
        var _ref4;
        return {
          itemIndex: index,
          dimensions: this.itemDimensions,
          expandedDimensions: (_ref4 = App.methodMap[model.id]) != null ? _ref4.dimensions : void 0,
          parent: this
        };
      };

      PaymentMethodListView.prototype.itemEvents = {
        "method:prompt": function(_, view) {
          var form;
          form = new Backbone.Form({
            model: view.model,
            fields: view.model.validate()
          });
          form.render();
          form.$el.on("submit", function(e) {
            e.preventDefault();
            if (form.commit() === void 0 && view.model.isValid()) {
              return view.model.fetch();
            } else {
              return view.shake();
            }
          });
          view.$el.html(form.el);
          return this.expandChild(view, {
            width: this.containerWidth(),
            height: this.containerHeight()
          });
        },
        "method:hide": function(_, view) {
          return this.contractChild(view);
        },
        "method:show": function(_, view) {
          var _this = this;
          view.template = "payment-methods-list/iframe";
          view.render();
          view.ui.iframe[0].onload = function() {
            view.ui.icon.fadeOut();
            view.ui.name.fadeOut();
            _this.expandChild(view);
            return view.on("method:expanded", function() {
              view.ui.iframe.css({
                position: "static"
              });
              return view.ui.iframe.transit({
                opacity: 1
              });
            });
          };
          view.ui.iframe.css({
            opacity: 0,
            position: "absolute",
            top: 0,
            left: 0
          });
          return view.ui.iframe.attr("src", view.model.get("redirect_url"));
        }
      };

      PaymentMethodListView.prototype.initialize = function() {
        var _this = this;
        this.collection.on("error", function(failedObject) {
          if (failedObject instanceof Backbone.Collection) {
            return App.vent.trigger("payment-methods:error");
          }
        });
        return this.collection.once("sync", function() {
          return _this.transitionEnter();
        });
      };

      PaymentMethodListView.prototype.expandChild = function(expandView, dimensions) {
        var shouldTransition;
        if (dimensions == null) {
          dimensions = null;
        }
        this.activeView = expandView;
        expandView.model.select();
        shouldTransition = this.children.without(expandView);
        _.invoke(shouldTransition, "transitionFadeOut");
        this.transitionHeight(dimensions);
        return expandView.transitionExpand(dimensions);
      };

      PaymentMethodListView.prototype.contractChild = function() {
        var contractView, shouldTransition;
        contractView = this.activeView;
        contractView.model.deselect();
        contractView.template = "payment-methods-list/method";
        contractView.render();
        this.transitionHeight({
          height: this.containerHeight()
        });
        contractView.transitionContract();
        shouldTransition = this.children.without(contractView);
        return _.invoke(shouldTransition, "transitionFadeIn");
      };

      PaymentMethodListView.prototype.transitionHeight = function(dimensions) {
        var height;
        height = dimensions != null ? dimensions.height : this.activeView.options.expandedDimensions.height || this.containerHeight();
        return this.$el.transit({
          height: height
        });
      };

      PaymentMethodListView.prototype.transitionEnter = function() {
        var _this = this;
        App.vent.trigger("payment-methods:sync");
        this.$el.transit({
          opacity: 1,
          scale: 1,
          delay: 500,
          width: 700
        }, function() {
          _this.$el.height(_this.containerHeight());
          return _this.$el.width(_this.containerWidth());
        });
        return this.$el.find(".method").transit({
          margin: 0,
          delay: 500
        }, _.after(this.children.length, function() {
          _this.children.call("pin");
          return App.vent.trigger("payment-methods:rendered");
        }));
      };

      PaymentMethodListView.prototype.containerWidth = function() {
        return 3 * this.itemDimensions.width;
      };

      PaymentMethodListView.prototype.containerHeight = function() {
        return (this.children.length / 3) * this.itemDimensions.height;
      };

      PaymentMethodListView.prototype.morePaymentMethods = function() {
        this.collection.add(this.collection.additionalMethods, {
          parse: true
        });
        this.children.call("pin");
        this.transitionHeight({
          height: this.containerHeight()
        });
        this.collection.additionalMethods = null;
        return App.Footer.footerView.setTemplate("footer/hidden");
      };

      return PaymentMethodListView;

    })(Backbone.Marionette.CollectionView);
    return this.addInitializer(function() {
      _this.paymentMethodCollection = new PaymentMethodCollection;
      _this.paymentMethodListView = new PaymentMethodListView({
        collection: _this.paymentMethodCollection
      });
      App.vent.on("payment:success", function(view) {
        view.template = "payment-methods-list/success";
        return view.render();
      });
      App.vent.on("payment:error", function(view) {
        view.template = "payment-methods-list/error";
        return view.render();
      });
      _this.paymentMethodCollection.on("sync", function(collection) {
        return App.Footer.start();
      });
      return _this.paymentMethodCollection.fetch();
    });
  });

}).call(this);

(function() {
  var expandObj, foo, key, optionsFromParams, pair, value, _i, _len, _ref, _ref1;

  expandObj = function(o) {
    var k, key, oo, part, parts, t;
    oo = {};
    for (k in o) {
      t = oo;
      parts = k.split('-');
      key = parts.pop();
      while (parts.length) {
        part = parts.shift();
        t = t[part] != null ? t[part] : t[part] = {};
      }
      t[key] = o[k];
    }
    return oo;
  };

  optionsFromParams = {};

  _ref = window.location.search.slice(1).split("&");
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    pair = _ref[_i];
    if (!(pair !== "")) {
      continue;
    }
    _ref1 = pair.split("="), key = _ref1[0], value = _ref1[1];
    foo = {};
    foo[key] = value;
    optionsFromParams[key] = decodeURIComponent(value);
    optionsFromParams = expandObj(optionsFromParams);
  }

  $(function() {
    if ((optionsFromParams.merchant.id != null) && (optionsFromParams.payment.amount != null) && (optionsFromParams.payment.currency != null)) {
      return Panther.start(expandObj(optionsFromParams));
    }
  });

}).call(this);
