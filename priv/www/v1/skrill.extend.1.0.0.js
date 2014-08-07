(function() {
  var utils;

  utils = window.Skrill.Utils;

  Skrill.Core.on("attribute_invalid", function(errors) {
    var error, input, _i, _j, _len, _len1, _ref, _results;
    _ref = this._formElement.getElementsByTagName("*");
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      input = _ref[_i];
      utils.removeClass("skrill-invalid", input);
    }
    _results = [];
    for (_j = 0, _len1 = errors.length; _j < _len1; _j++) {
      error = errors[_j];
      _results.push(utils.addClass("skrill-invalid", error.element));
    }
    return _results;
  });

  Skrill.Core.on("token_generated", function(accountData) {
    var _ref, _ref1, _ref2;
    if ((_ref = this._formData.token) != null) {
      _ref.element.value = accountData.token;
    }
    if ((_ref1 = this._formData.last) != null) {
      _ref1.element.value = accountData.last;
    }
    if ((_ref2 = this._formData.masked) != null) {
      _ref2.element.value = accountData.masked;
    }
    return this._formData.pan.element.form.submit();
  });

  Skrill.Core.on("threedsecure", function(threed) {
    this._formData.pan.element.form.parentNode.appendChild(threed.iframe);
    return threed.start();
  });

  Skrill.Core.on("token_error", function(errorObject) {
    return typeof console !== "undefined" && console !== null ? console.error(errorObject.message, errorObject.advice) : void 0;
  });

  Skrill.Core.on("network_error", function() {
    return typeof console !== "undefined" && console !== null ? console.error("There's been an issue communicating with our servers, please try again.") : void 0;
  });

}).call(this);
