'use strict';

var _get = require('babel-runtime/helpers/get')['default'];

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _asyncToGenerator = require('babel-runtime/helpers/async-to-generator')['default'];

var _slicedToArray = require('babel-runtime/helpers/sliced-to-array')['default'];

var _Object$assign = require('babel-runtime/core-js/object/assign')['default'];

var _Promise = require('babel-runtime/core-js/promise')['default'];

var child_process = require('child_process');
var crayon = require('@ccheever/crayon');
var freeportAsync = require('freeport-async');
var instapromise = require('instapromise');
var ngrok = require('ngrok');
var path = require('path');
var events = require('events');

var urlUtils = require('./urlUtils');

var PackagerController = (function (_events$EventEmitter) {
  _inherits(PackagerController, _events$EventEmitter);

  function PackagerController(opts) {
    var _this = this;

    _classCallCheck(this, PackagerController);

    _get(Object.getPrototypeOf(PackagerController.prototype), 'constructor', this).call(this, opts);

    var DEFAULT_OPTS = {
      port: undefined,
      packagerPath: path.join(__dirname, '..', '..', 'node_modules/react-native/packager/packager.sh'),
      mainModulePath: 'index.js'
    };

    // absolutePath: root,
    this.opts = _Object$assign(DEFAULT_OPTS, opts);
    this._givenOpts = opts;

    this.packagerReady$ = new _Promise(function (fulfill, reject) {
      _this._packagerReadyFulfill = fulfill;
      _this._packagerReadyReject = reject;
    });

    this.ngrokReady$ = new _Promise(function (fulfill, reject) {
      _this._ngrokReadyFulfill = fulfill;
      _this._ngrokReadyReject = reject;
    });

    this.ready$ = _Promise.all([this.packagerReady$, this.ngrokReady$]);

    this.packagerReady$.then(function (packagerProcess) {
      _this.emit('packagerReady', packagerProcess);
    });

    this.ngrokReady$.then(function (ngrokUrl) {
      _this.emit('ngrokReady', ngrokUrl);
    });

    this.ready$.then(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 2);

      var packagerProcess = _ref2[0];
      var ngrokUrl = _ref2[1];

      _this.emit('ready', _this, packagerProcess, ngrokUrl);
    });
  }

  _createClass(PackagerController, [{
    key: '_startNgrokAsync',
    value: _asyncToGenerator(function* () {
      return yield ngrok.promise.connect(this.opts.port);
    })
  }, {
    key: 'startAsync',
    value: _asyncToGenerator(function* () {
      var _this2 = this;

      console.log("startAsync");

      var root = this.opts.absolutePath;
      if (!this.opts.port) {
        this.opts.port = yield freeportAsync(19000);
      }

      this._packager = child_process.spawn(this.opts.packagerPath, ["--port=" + this.opts.port, "--root=" + root, "--assetRoots=" + root], {
        // stdio: [process.stdin, 'pipe', process.stderr],
        // stdio: 'inherit',
        detached: false
      });
      this._packager.stdout.setEncoding('utf8');
      this._packager.stderr.setEncoding('utf8');
      this._packager.stdout.on('data', function (data) {
        _this2.emit('stdout', data);

        if (data.match(/React packager ready\./)) {
          _this2._packagerReadyFulfill(_this2._packager);
          _this2._packagerReady = true;
          _this2.emit('packagerReady', _this2._packager);
        }

        // crayon.yellow.log("STDOUT:", data);
      });

      this._packager.stderr.on('data', function (data) {
        _this2.emit('stderr', data);
        // crayon.orange.error("STDERR:", data);
      });

      // If the packager process exits before the packager is ready
      // then the packager is never gonna be ready
      this._packager.on('exit', function (code) {
        if (!_this2._packagerReady) {
          _this2._packagerReadyReject(code);
        }
      });

      this._startNgrokAsync().then(function (ngrokUrl) {
        _this2.ngrokUrl = ngrokUrl;
        console.log("Set ngrokUrl to ", _this2.ngrokUrl);
        _this2._ngrokReadyFulfill(ngrokUrl);
      }, this._ngrokReadyReject);

      return this;
    })
  }, {
    key: 'getUrlAsync',
    value: _asyncToGenerator(function* (opts) {
      return urlUtils.constructUrlAsync(this, opts);
    })
  }]);

  return PackagerController;
})(events.EventEmitter);

module.exports = {
  PackagerController: PackagerController
};
//# sourceMappingURL=../sourcemaps/application/packager.js.map