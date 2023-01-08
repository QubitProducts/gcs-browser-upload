'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UploadAlreadyFinishedError = exports.InvalidChunkSizeError = exports.UploadIncompleteError = exports.MissingOptionsError = exports.UnknownResponseError = exports.UploadFailedError = exports.UrlNotFoundError = exports.FileAlreadyUploadedError = exports.DifferentChunkError = undefined;

var _es6Error = require('es6-error');

var _es6Error2 = _interopRequireDefault(_es6Error);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DifferentChunkError = exports.DifferentChunkError = function (_ExtendableError) {
  _inherits(DifferentChunkError, _ExtendableError);

  function DifferentChunkError(chunkIndex, originalChecksum, newChecksum) {
    _classCallCheck(this, DifferentChunkError);

    var _this = _possibleConstructorReturn(this, (DifferentChunkError.__proto__ || Object.getPrototypeOf(DifferentChunkError)).call(this, 'Chunk at index \'' + chunkIndex + '\' is different to original'));

    _this.chunkIndex = chunkIndex;
    _this.originalChecksum = originalChecksum;
    _this.newChecksum = newChecksum;
    return _this;
  }

  return DifferentChunkError;
}(_es6Error2.default);

var FileAlreadyUploadedError = exports.FileAlreadyUploadedError = function (_ExtendableError2) {
  _inherits(FileAlreadyUploadedError, _ExtendableError2);

  function FileAlreadyUploadedError(id, url) {
    _classCallCheck(this, FileAlreadyUploadedError);

    return _possibleConstructorReturn(this, (FileAlreadyUploadedError.__proto__ || Object.getPrototypeOf(FileAlreadyUploadedError)).call(this, 'File \'' + id + '\' has already been uploaded to unique url \'' + url + '\''));
  }

  return FileAlreadyUploadedError;
}(_es6Error2.default);

var UrlNotFoundError = exports.UrlNotFoundError = function (_ExtendableError3) {
  _inherits(UrlNotFoundError, _ExtendableError3);

  function UrlNotFoundError(url) {
    _classCallCheck(this, UrlNotFoundError);

    return _possibleConstructorReturn(this, (UrlNotFoundError.__proto__ || Object.getPrototypeOf(UrlNotFoundError)).call(this, 'Upload URL \'' + url + '\' has either expired or is invalid'));
  }

  return UrlNotFoundError;
}(_es6Error2.default);

var UploadFailedError = exports.UploadFailedError = function (_ExtendableError4) {
  _inherits(UploadFailedError, _ExtendableError4);

  function UploadFailedError(status) {
    _classCallCheck(this, UploadFailedError);

    return _possibleConstructorReturn(this, (UploadFailedError.__proto__ || Object.getPrototypeOf(UploadFailedError)).call(this, 'HTTP status ' + status + ' received from GCS, consider retrying'));
  }

  return UploadFailedError;
}(_es6Error2.default);

var UnknownResponseError = exports.UnknownResponseError = function (_ExtendableError5) {
  _inherits(UnknownResponseError, _ExtendableError5);

  function UnknownResponseError(res) {
    _classCallCheck(this, UnknownResponseError);

    var _this5 = _possibleConstructorReturn(this, (UnknownResponseError.__proto__ || Object.getPrototypeOf(UnknownResponseError)).call(this, 'Unknown response received from GCS'));

    _this5.res = res;
    return _this5;
  }

  return UnknownResponseError;
}(_es6Error2.default);

var MissingOptionsError = exports.MissingOptionsError = function (_ExtendableError6) {
  _inherits(MissingOptionsError, _ExtendableError6);

  function MissingOptionsError() {
    _classCallCheck(this, MissingOptionsError);

    return _possibleConstructorReturn(this, (MissingOptionsError.__proto__ || Object.getPrototypeOf(MissingOptionsError)).call(this, 'Missing options for Upload'));
  }

  return MissingOptionsError;
}(_es6Error2.default);

var UploadIncompleteError = exports.UploadIncompleteError = function (_ExtendableError7) {
  _inherits(UploadIncompleteError, _ExtendableError7);

  function UploadIncompleteError() {
    _classCallCheck(this, UploadIncompleteError);

    return _possibleConstructorReturn(this, (UploadIncompleteError.__proto__ || Object.getPrototypeOf(UploadIncompleteError)).call(this, 'Upload is not complete'));
  }

  return UploadIncompleteError;
}(_es6Error2.default);

var InvalidChunkSizeError = exports.InvalidChunkSizeError = function (_ExtendableError8) {
  _inherits(InvalidChunkSizeError, _ExtendableError8);

  function InvalidChunkSizeError(chunkSize) {
    _classCallCheck(this, InvalidChunkSizeError);

    return _possibleConstructorReturn(this, (InvalidChunkSizeError.__proto__ || Object.getPrototypeOf(InvalidChunkSizeError)).call(this, 'Invalid chunk size ' + chunkSize + ', must be a multiple of 262144'));
  }

  return InvalidChunkSizeError;
}(_es6Error2.default);

var UploadAlreadyFinishedError = exports.UploadAlreadyFinishedError = function (_ExtendableError9) {
  _inherits(UploadAlreadyFinishedError, _ExtendableError9);

  function UploadAlreadyFinishedError() {
    _classCallCheck(this, UploadAlreadyFinishedError);

    return _possibleConstructorReturn(this, (UploadAlreadyFinishedError.__proto__ || Object.getPrototypeOf(UploadAlreadyFinishedError)).call(this, 'Upload instance has already finished'));
  }

  return UploadAlreadyFinishedError;
}(_es6Error2.default);