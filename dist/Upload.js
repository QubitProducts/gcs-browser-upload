'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var safePut = function () {
  var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6() {
    var _args6 = arguments;
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.prev = 0;
            _context6.next = 3;
            return _axios.put.apply(null, _args6);

          case 3:
            return _context6.abrupt('return', _context6.sent);

          case 6:
            _context6.prev = 6;
            _context6.t0 = _context6['catch'](0);

            if (!(_context6.t0 instanceof Error)) {
              _context6.next = 12;
              break;
            }

            throw _context6.t0;

          case 12:
            return _context6.abrupt('return', _context6.t0);

          case 13:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, this, [[0, 6]]);
  }));

  return function safePut() {
    return _ref6.apply(this, arguments);
  };
}();

var safePost = function () {
  var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7() {
    var _args7 = arguments;
    return regeneratorRuntime.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            _context7.prev = 0;
            _context7.next = 3;
            return _axios.post.apply(null, _args7);

          case 3:
            return _context7.abrupt('return', _context7.sent);

          case 6:
            _context7.prev = 6;
            _context7.t0 = _context7['catch'](0);

            if (!(_context7.t0 instanceof Error)) {
              _context7.next = 12;
              break;
            }

            throw _context7.t0;

          case 12:
            return _context7.abrupt('return', _context7.t0);

          case 13:
          case 'end':
            return _context7.stop();
        }
      }
    }, _callee7, this, [[0, 6]]);
  }));

  return function safePost() {
    return _ref7.apply(this, arguments);
  };
}();

var _axios = require('axios');

var _FileMeta = require('./FileMeta');

var _FileMeta2 = _interopRequireDefault(_FileMeta);

var _FileProcessor = require('./FileProcessor');

var _FileProcessor2 = _interopRequireDefault(_FileProcessor);

var _debug = require('./debug');

var _debug2 = _interopRequireDefault(_debug);

var _errors = require('./errors');

var errors = _interopRequireWildcard(_errors);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MIN_CHUNK_SIZE = 262144;

var Upload = function () {
  function Upload(args, allowSmallChunks) {
    _classCallCheck(this, Upload);

    var opts = _extends({
      chunkSize: MIN_CHUNK_SIZE,
      storage: window.localStorage,
      contentType: 'text/plain',
      onChunkUpload: function onChunkUpload() {},
      id: null,
      url: null,
      file: null,
      metadata: null
    }, args);
    console.log('opts', opts);
    if ((opts.chunkSize % MIN_CHUNK_SIZE !== 0 || opts.chunkSize === 0) && !allowSmallChunks) {
      throw new _errors.InvalidChunkSizeError(opts.chunkSize);
    }

    if (!opts.id || !opts.url || !opts.file) {
      throw new _errors.MissingOptionsError();
    }

    (0, _debug2.default)('Creating new upload instance:');
    (0, _debug2.default)(' - Url: ' + opts.url);
    (0, _debug2.default)(' - Id: ' + opts.id);
    (0, _debug2.default)(' - File size: ' + opts.file.size);
    (0, _debug2.default)(' - Chunk size: ' + opts.chunkSize);

    this.opts = opts;
    this.meta = new _FileMeta2.default(opts.id, opts.file.size, opts.chunkSize, opts.storage);
    this.processor = new _FileProcessor2.default(opts.file, opts.chunkSize);
    this.lastResult = null;
  }

  _createClass(Upload, [{
    key: 'start',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5() {
        var _this = this;

        var meta, processor, opts, finished, resumeUpload, uploadChunk, validateChunk, getRemoteResumeIndex, headers, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, h, res;

        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                meta = this.meta, processor = this.processor, opts = this.opts, finished = this.finished;

                resumeUpload = function () {
                  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
                    var localResumeIndex, remoteResumeIndex, resumeIndex;
                    return regeneratorRuntime.wrap(function _callee$(_context) {
                      while (1) {
                        switch (_context.prev = _context.next) {
                          case 0:
                            localResumeIndex = meta.getResumeIndex();
                            _context.next = 3;
                            return getRemoteResumeIndex();

                          case 3:
                            remoteResumeIndex = _context.sent;
                            resumeIndex = Math.min(localResumeIndex, remoteResumeIndex);

                            (0, _debug2.default)('Validating chunks up to index ' + resumeIndex);
                            (0, _debug2.default)(' - Remote index: ' + remoteResumeIndex);
                            (0, _debug2.default)(' - Local index: ' + localResumeIndex);

                            _context.prev = 8;
                            _context.next = 11;
                            return processor.run(validateChunk, 0, resumeIndex);

                          case 11:
                            _context.next = 22;
                            break;

                          case 13:
                            _context.prev = 13;
                            _context.t0 = _context['catch'](8);

                            (0, _debug2.default)('Validation failed, starting from scratch');
                            (0, _debug2.default)(' - Failed chunk index: ' + _context.t0.chunkIndex);
                            (0, _debug2.default)(' - Old checksum: ' + _context.t0.originalChecksum);
                            (0, _debug2.default)(' - New checksum: ' + _context.t0.newChecksum);

                            _context.next = 21;
                            return processor.run(uploadChunk);

                          case 21:
                            return _context.abrupt('return');

                          case 22:

                            (0, _debug2.default)('Validation passed, resuming upload');
                            _context.next = 25;
                            return processor.run(uploadChunk, resumeIndex);

                          case 25:
                          case 'end':
                            return _context.stop();
                        }
                      }
                    }, _callee, _this, [[8, 13]]);
                  }));

                  return function resumeUpload() {
                    return _ref2.apply(this, arguments);
                  };
                }();

                uploadChunk = function () {
                  var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(checksum, index, chunk) {
                    var total, start, end, headers, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, h, res;

                    return regeneratorRuntime.wrap(function _callee2$(_context2) {
                      while (1) {
                        switch (_context2.prev = _context2.next) {
                          case 0:
                            total = opts.file.size;
                            start = index * opts.chunkSize;
                            end = index * opts.chunkSize + chunk.byteLength - 1;
                            headers = {
                              'Content-Type': opts.contentType,
                              'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
                              'x-goog-resumable': 'start'
                            };

                            if (!opts.metadata) {
                              _context2.next = 24;
                              break;
                            }

                            _iteratorNormalCompletion = true;
                            _didIteratorError = false;
                            _iteratorError = undefined;
                            _context2.prev = 8;

                            for (_iterator = (opts.metadata.entries ? opts.metadata.entries() : [])[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                              h = _step.value;

                              headers['x-goog-meta-' + h[0]] = h[1];
                            }
                            _context2.next = 16;
                            break;

                          case 12:
                            _context2.prev = 12;
                            _context2.t0 = _context2['catch'](8);
                            _didIteratorError = true;
                            _iteratorError = _context2.t0;

                          case 16:
                            _context2.prev = 16;
                            _context2.prev = 17;

                            if (!_iteratorNormalCompletion && _iterator.return) {
                              _iterator.return();
                            }

                          case 19:
                            _context2.prev = 19;

                            if (!_didIteratorError) {
                              _context2.next = 22;
                              break;
                            }

                            throw _iteratorError;

                          case 22:
                            return _context2.finish(19);

                          case 23:
                            return _context2.finish(16);

                          case 24:

                            (0, _debug2.default)('Uploading chunk ' + index + ':');
                            (0, _debug2.default)(' - Chunk length: ' + chunk.byteLength);
                            (0, _debug2.default)(' - Start: ' + start);
                            (0, _debug2.default)(' - End: ' + end);

                            _context2.next = 30;
                            return safePut(opts.location ? opts.location : opts.url, chunk, { headers: headers });

                          case 30:
                            res = _context2.sent;

                            _this.lastResult = res;
                            checkResponseStatus(res, opts, [200, 201, 308]);
                            (0, _debug2.default)('Chunk upload succeeded, adding checksum ' + checksum);
                            meta.addChecksum(index, checksum);

                            opts.onChunkUpload({
                              totalBytes: total,
                              uploadedBytes: end + 1,
                              chunkIndex: index,
                              chunkLength: chunk.byteLength
                            });

                          case 36:
                          case 'end':
                            return _context2.stop();
                        }
                      }
                    }, _callee2, _this, [[8, 12, 16, 24], [17,, 19, 23]]);
                  }));

                  return function uploadChunk(_x, _x2, _x3) {
                    return _ref3.apply(this, arguments);
                  };
                }();

                validateChunk = function () {
                  var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(newChecksum, index) {
                    var originalChecksum, isChunkValid;
                    return regeneratorRuntime.wrap(function _callee3$(_context3) {
                      while (1) {
                        switch (_context3.prev = _context3.next) {
                          case 0:
                            originalChecksum = meta.getChecksum(index);
                            isChunkValid = originalChecksum === newChecksum;

                            if (isChunkValid) {
                              _context3.next = 5;
                              break;
                            }

                            meta.reset();
                            throw new _errors.DifferentChunkError(index, originalChecksum, newChecksum);

                          case 5:
                          case 'end':
                            return _context3.stop();
                        }
                      }
                    }, _callee3, _this);
                  }));

                  return function validateChunk(_x4, _x5) {
                    return _ref4.apply(this, arguments);
                  };
                }();

                getRemoteResumeIndex = function () {
                  var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
                    var headers, res, header, range, bytesReceived;
                    return regeneratorRuntime.wrap(function _callee4$(_context4) {
                      while (1) {
                        switch (_context4.prev = _context4.next) {
                          case 0:
                            headers = {
                              'Content-Range': 'bytes */' + opts.file.size
                            };

                            (0, _debug2.default)('Retrieving upload status from GCS');
                            _context4.next = 4;
                            return safePut(opts.url, null, { headers: headers });

                          case 4:
                            res = _context4.sent;


                            checkResponseStatus(res, opts, [308]);
                            header = res.headers['range'];

                            (0, _debug2.default)('Received upload status from GCS: ' + header);
                            range = header.match(/(\d+?)-(\d+?)$/);
                            bytesReceived = parseInt(range[2]) + 1;
                            return _context4.abrupt('return', Math.floor(bytesReceived / opts.chunkSize));

                          case 11:
                          case 'end':
                            return _context4.stop();
                        }
                      }
                    }, _callee4, _this);
                  }));

                  return function getRemoteResumeIndex() {
                    return _ref5.apply(this, arguments);
                  };
                }();

                if (!finished) {
                  _context5.next = 7;
                  break;
                }

                throw new _errors.UploadAlreadyFinishedError();

              case 7:
                if (!(meta.isResumable() && meta.getFileSize() === opts.file.size)) {
                  _context5.next = 13;
                  break;
                }

                (0, _debug2.default)('Upload might be resumable');
                _context5.next = 11;
                return resumeUpload();

              case 11:
                _context5.next = 41;
                break;

              case 13:
                (0, _debug2.default)('Upload not resumable, starting from scratch');
                headers = {
                  'x-goog-resumable': 'start',
                  'Content-Type': opts.contentType
                };

                if (!opts.metadata) {
                  _context5.next = 35;
                  break;
                }

                _iteratorNormalCompletion2 = true;
                _didIteratorError2 = false;
                _iteratorError2 = undefined;
                _context5.prev = 19;

                for (_iterator2 = (opts.metadata.entries ? opts.metadata.entries() : [])[Symbol.iterator](); !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                  h = _step2.value;

                  headers['x-goog-meta-' + h[0]] = h[1];
                }
                _context5.next = 27;
                break;

              case 23:
                _context5.prev = 23;
                _context5.t0 = _context5['catch'](19);
                _didIteratorError2 = true;
                _iteratorError2 = _context5.t0;

              case 27:
                _context5.prev = 27;
                _context5.prev = 28;

                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                  _iterator2.return();
                }

              case 30:
                _context5.prev = 30;

                if (!_didIteratorError2) {
                  _context5.next = 33;
                  break;
                }

                throw _iteratorError2;

              case 33:
                return _context5.finish(30);

              case 34:
                return _context5.finish(27);

              case 35:
                _context5.next = 37;
                return safePost(opts.url, null, { headers: headers });

              case 37:
                res = _context5.sent;

                opts.location = res.headers.location;
                _context5.next = 41;
                return processor.run(uploadChunk);

              case 41:
                (0, _debug2.default)('Upload complete, resetting meta');
                meta.reset();
                this.finished = true;
                return _context5.abrupt('return', this.lastResult);

              case 45:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this, [[19, 23, 27, 35], [28,, 30, 34]]);
      }));

      function start() {
        return _ref.apply(this, arguments);
      }

      return start;
    }()
  }, {
    key: 'pause',
    value: function pause() {
      this.processor.pause();
      (0, _debug2.default)('Upload paused');
    }
  }, {
    key: 'unpause',
    value: function unpause() {
      this.processor.unpause();
      (0, _debug2.default)('Upload unpaused');
    }
  }, {
    key: 'cancel',
    value: function cancel() {
      this.processor.pause();
      this.meta.reset();
      (0, _debug2.default)('Upload cancelled');
    }
  }]);

  return Upload;
}();

Upload.errors = errors;
exports.default = Upload;


function checkResponseStatus(res, opts) {
  var allowed = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
  var status = res.status;

  if (allowed.indexOf(status) > -1) {
    return true;
  }

  switch (status) {
    case 308:
      throw new _errors.UploadIncompleteError();

    case 201:
    case 200:
      throw new _errors.FileAlreadyUploadedError(opts.id, opts.url);

    case 404:
      throw new _errors.UrlNotFoundError(opts.url);

    case 500:
    case 502:
    case 503:
    case 504:
      throw new _errors.UploadFailedError(status);

    default:
      throw new _errors.UnknownResponseError(res);
  }
}