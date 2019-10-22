'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var getData = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(file, blob) {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt('return', new _es6Promise.Promise(function (resolve, reject) {
              var reader = new window.FileReader();
              reader.onload = function () {
                return resolve(reader.result);
              };
              reader.onerror = reject;
              reader.readAsArrayBuffer(blob);
            }));

          case 1:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function getData(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

var _es6Promise = require('es6-promise');

var _sparkMd = require('spark-md5');

var _sparkMd2 = _interopRequireDefault(_sparkMd);

var _debug = require('./debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new _es6Promise.Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return _es6Promise.Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function getChecksum(spark, chunk) {
  spark.append(chunk);
  var state = spark.getState();
  var checksum = spark.end();
  spark.setState(state);
  return checksum;
}

var FileProcessor = function () {
  function FileProcessor(file, chunkSize) {
    var _this = this;

    _classCallCheck(this, FileProcessor);

    this.waitForUnpause = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              return _context2.abrupt('return', new _es6Promise.Promise(function (resolve) {
                _this.unpauseHandlers.push(resolve);
              }));

            case 1:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, _this);
    }));

    this.paused = false;
    this.file = file;
    this.chunkSize = chunkSize;
    this.unpauseHandlers = [];
  }

  _createClass(FileProcessor, [{
    key: 'run',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(fn) {
        var _this2 = this;

        var startIndex = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
        var endIndex = arguments[2];
        var file, chunkSize, totalChunks, spark, processIndex;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                file = this.file, chunkSize = this.chunkSize;
                totalChunks = Math.ceil(file.size / chunkSize);
                spark = new _sparkMd2.default.ArrayBuffer();


                (0, _debug2.default)('Starting run on file:');
                (0, _debug2.default)(' - Total chunks: ' + totalChunks);
                (0, _debug2.default)(' - Start index: ' + startIndex);
                (0, _debug2.default)(' - End index: ' + (endIndex || totalChunks));

                processIndex = function () {
                  var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(index) {
                    var start, section, chunk, checksum, shouldContinue;
                    return regeneratorRuntime.wrap(function _callee3$(_context3) {
                      while (1) {
                        switch (_context3.prev = _context3.next) {
                          case 0:
                            if (!(index === totalChunks || index === endIndex)) {
                              _context3.next = 3;
                              break;
                            }

                            (0, _debug2.default)('File process complete');
                            return _context3.abrupt('return');

                          case 3:
                            if (!_this2.paused) {
                              _context3.next = 6;
                              break;
                            }

                            _context3.next = 6;
                            return _this2.waitForUnpause();

                          case 6:
                            start = index * chunkSize;
                            section = file.slice(start, start + chunkSize);
                            _context3.next = 10;
                            return getData(file, section);

                          case 10:
                            chunk = _context3.sent;
                            checksum = getChecksum(spark, chunk);
                            _context3.next = 14;
                            return fn(checksum, index, chunk);

                          case 14:
                            shouldContinue = _context3.sent;

                            if (!(shouldContinue !== false)) {
                              _context3.next = 18;
                              break;
                            }

                            _context3.next = 18;
                            return processIndex(index + 1);

                          case 18:
                          case 'end':
                            return _context3.stop();
                        }
                      }
                    }, _callee3, _this2);
                  }));

                  return function processIndex(_x5) {
                    return _ref4.apply(this, arguments);
                  };
                }();

                _context4.next = 10;
                return processIndex(startIndex);

              case 10:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function run(_x3) {
        return _ref3.apply(this, arguments);
      }

      return run;
    }()
  }, {
    key: 'pause',
    value: function pause() {
      this.paused = true;
    }
  }, {
    key: 'unpause',
    value: function unpause() {
      this.paused = false;
      this.unpauseHandlers.forEach(function (fn) {
        return fn();
      });
      this.unpauseHandlers = [];
    }
  }]);

  return FileProcessor;
}();

exports.default = FileProcessor;