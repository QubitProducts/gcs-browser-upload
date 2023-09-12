"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UploadAlreadyFinishedError = exports.InvalidChunkSizeError = exports.UploadIncompleteError = exports.MissingOptionsError = exports.UnknownResponseError = exports.UploadFailedError = exports.UrlNotFoundError = exports.FileAlreadyUploadedError = exports.DifferentChunkError = void 0;

var _es6Error = _interopRequireDefault(require("es6-error"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable max-classes-per-file */
class DifferentChunkError extends _es6Error.default {
  constructor(chunkIndex, originalChecksum, newChecksum) {
    super(`Chunk at index '${chunkIndex}' is different to original`);
    this.chunkIndex = chunkIndex;
    this.originalChecksum = originalChecksum;
    this.newChecksum = newChecksum;
  }

}

exports.DifferentChunkError = DifferentChunkError;

class FileAlreadyUploadedError extends _es6Error.default {
  constructor(id, url) {
    super(`File '${id}' has already been uploaded to unique url '${url}'`);
  }

}

exports.FileAlreadyUploadedError = FileAlreadyUploadedError;

class UrlNotFoundError extends _es6Error.default {
  constructor(url) {
    super(`Upload URL '${url}' has either expired or is invalid`);
  }

}

exports.UrlNotFoundError = UrlNotFoundError;

class UploadFailedError extends _es6Error.default {
  constructor(status) {
    super(`HTTP status ${status} received from GCS, consider retrying`);
  }

}

exports.UploadFailedError = UploadFailedError;

class UnknownResponseError extends _es6Error.default {
  constructor(res) {
    super('Unknown response received from GCS');
    this.res = res;
  }

}

exports.UnknownResponseError = UnknownResponseError;

class MissingOptionsError extends _es6Error.default {
  constructor() {
    super('Missing options for Upload');
  }

}

exports.MissingOptionsError = MissingOptionsError;

class UploadIncompleteError extends _es6Error.default {
  constructor() {
    super('Upload is not complete');
  }

}

exports.UploadIncompleteError = UploadIncompleteError;

class InvalidChunkSizeError extends _es6Error.default {
  constructor(chunkSize) {
    super(`Invalid chunk size ${chunkSize}, must be a multiple of 262144`);
  }

}

exports.InvalidChunkSizeError = InvalidChunkSizeError;

class UploadAlreadyFinishedError extends _es6Error.default {
  constructor() {
    super('Upload instance has already finished');
  }

}

exports.UploadAlreadyFinishedError = UploadAlreadyFinishedError;