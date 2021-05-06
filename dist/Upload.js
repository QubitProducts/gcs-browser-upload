"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _axios = require("axios");

var _FileMeta = _interopRequireDefault(require("./FileMeta"));

var _FileProcessor = _interopRequireDefault(require("./FileProcessor"));

var _debug = _interopRequireDefault(require("./debug"));

var errors = _interopRequireWildcard(require("./errors"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const MIN_CHUNK_SIZE = 256 * 1024;

function checkResponseStatus(res, opts, allowed = []) {
  const {
    status
  } = res;

  if (allowed.indexOf(status) > -1) {
    return true;
  }

  switch (status) {
    case 308:
      throw new errors.UploadIncompleteError();

    case 201:
    case 200:
      throw new errors.FileAlreadyUploadedError(opts.id, opts.url);

    case 404:
      throw new errors.UrlNotFoundError(opts.url);

    case 500:
    case 502:
    case 503:
    case 504:
      throw new errors.UploadFailedError(status);

    default:
      throw new errors.UnknownResponseError(res);
  }
}

async function safePut(...args) {
  try {
    return await (0, _axios.put)(...args);
  } catch (e) {
    if (e instanceof Error) {
      throw e;
    } else {
      return e;
    }
  }
}

async function azurePutBlockList(url, checksums, contentType) {
  const getXMLBody = () => {
    const body = checksums.map(hash => `<Latest>${hash}</Latest>`).join('');
    return `<?xml version="1.0" encoding="utf-8"?><BlockList>${body}</BlockList>`;
  };

  await safePut(url, getXMLBody(), {
    headers: {
      'x-ms-blob-content-type': contentType
    },
    validateStatus: () => true,
    params: {
      comp: 'blocklist'
    }
  });
}

class Upload {
  constructor(args, allowSmallChunks) {
    const opts = _objectSpread({
      chunkSize: MIN_CHUNK_SIZE,
      storage: window.localStorage,
      contentType: 'text/plain',
      onChunkUpload: () => {},
      id: null,
      url: null,
      file: null
    }, args);

    if ((opts.chunkSize % MIN_CHUNK_SIZE !== 0 || opts.chunkSize === 0) && !allowSmallChunks) {
      throw new errors.InvalidChunkSizeError(opts.chunkSize);
    }

    if (!opts.id || !opts.url || !opts.file) {
      throw new errors.MissingOptionsError();
    }

    (0, _debug.default)('Creating new upload instance:');
    (0, _debug.default)(` - Url: ${opts.url}`);
    (0, _debug.default)(` - Id: ${opts.id}`);
    (0, _debug.default)(` - File size: ${opts.file.size}`);
    (0, _debug.default)(` - Chunk size: ${opts.chunkSize}`);
    this.opts = opts;
    this.meta = new _FileMeta.default(opts.id, opts.file.size, opts.chunkSize, opts.storage);
    this.processor = new _FileProcessor.default(opts.file, opts.chunkSize);
    this.lastResult = null;
    let url = new URL(opts.url);

    if (url.searchParams.has('sig') && url.searchParams.has('se') && url.searchParams.has('sv')) {
      this.isAzure = true;
    }
  }

  async start() {
    const {
      meta,
      processor,
      opts,
      finished
    } = this;

    const getRemoteResumeIndex = async () => {
      const headers = {
        'Content-Range': `bytes */${opts.file.size}`
      };
      (0, _debug.default)('Retrieving upload status from GCS');
      const res = await safePut(opts.url, null, {
        headers,
        validateStatus: () => true
      });
      checkResponseStatus(res, opts, [308]);
      const header = res.headers.range;
      (0, _debug.default)(`Received upload status from GCS: ${header}`);
      const range = header.match(/(\d+?)-(\d+?)$/);
      const bytesReceived = parseInt(range[2], 10) + 1;
      return Math.floor(bytesReceived / opts.chunkSize);
    };

    const validateChunk = async (newChecksum, index) => {
      const originalChecksum = meta.getChecksum(index);
      const isChunkValid = originalChecksum === newChecksum;

      if (!isChunkValid) {
        meta.reset();
        throw new errors.DifferentChunkError(index, originalChecksum, newChecksum);
      }
    };

    const uploadChunk = async (checksum, index, chunk) => {
      const total = opts.file.size;
      const start = index * opts.chunkSize;
      const end = index * opts.chunkSize + chunk.byteLength - 1;
      const headers = {
        'Content-Type': opts.contentType,
        'Content-Range': `bytes ${start}-${end}/${total}`
      };
      (0, _debug.default)(`Uploading chunk ${index}:`);
      (0, _debug.default)(` - Chunk length: ${chunk.byteLength}`);
      (0, _debug.default)(` - Start: ${start}`);
      (0, _debug.default)(` - End: ${end}`);
      const requestOptions = {
        headers,
        validateStatus: () => true
      };

      if (this.isAzure) {
        Object.assign(requestOptions, {
          params: {
            comp: 'block',
            blockid: checksum
          }
        });
      }

      const res = await safePut(opts.url, chunk, requestOptions);
      this.lastResult = res;
      checkResponseStatus(res, opts, [200, 201, 308]);
      (0, _debug.default)(`Chunk upload succeeded, adding checksum ${checksum}`);
      meta.addChecksum(index, checksum);
      opts.onChunkUpload({
        totalBytes: total,
        uploadedBytes: end + 1,
        chunkIndex: index,
        chunkLength: chunk.byteLength
      });
    };

    const resumeUpload = async () => {
      const localResumeIndex = meta.getResumeIndex();
      const remoteResumeIndex = await getRemoteResumeIndex();
      const resumeIndex = Math.min(localResumeIndex, remoteResumeIndex);
      (0, _debug.default)(`Validating chunks up to index ${resumeIndex}`);
      (0, _debug.default)(` - Remote index: ${remoteResumeIndex}`);
      (0, _debug.default)(` - Local index: ${localResumeIndex}`);

      try {
        await processor.run(validateChunk, 0, resumeIndex);
      } catch (e) {
        (0, _debug.default)('Validation failed, starting from scratch');
        (0, _debug.default)(` - Failed chunk index: ${e.chunkIndex}`);
        (0, _debug.default)(` - Old checksum: ${e.originalChecksum}`);
        (0, _debug.default)(` - New checksum: ${e.newChecksum}`);
        await processor.run(uploadChunk);
        return;
      }

      (0, _debug.default)('Validation passed, resuming upload');
      await processor.run(uploadChunk, resumeIndex);
    };

    if (finished) {
      throw new errors.UploadAlreadyFinishedError();
    }

    if (meta.isResumable() && meta.getFileSize() === opts.file.size) {
      (0, _debug.default)('Upload might be resumable');
      await resumeUpload();
    } else {
      (0, _debug.default)('Upload not resumable, starting from scratch');
      await processor.run(uploadChunk);
    }

    if (this.isAzure) {
      await azurePutBlockList(opts.url, this.meta.getMeta().checksums, this.opts.contentType);
    }

    (0, _debug.default)('Upload complete, resetting meta');
    meta.reset();
    this.finished = true;
    return this.lastResult;
  }

  pause() {
    this.processor.pause();
    (0, _debug.default)('Upload paused');
  }

  unpause() {
    this.processor.unpause();
    (0, _debug.default)('Upload unpaused');
  }

  cancel() {
    this.processor.pause();
    this.meta.reset();
    (0, _debug.default)('Upload cancelled');
  }

}

exports.default = Upload;

_defineProperty(Upload, "errors", errors);