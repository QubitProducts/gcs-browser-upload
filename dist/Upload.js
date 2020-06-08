function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import { put } from 'axios';
import FileMeta from './FileMeta';
import FileProcessor from './FileProcessor';
import debug from './debug';
import * as errors from './errors';
const MIN_CHUNK_SIZE = 262144;

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
    return await put(...args);
  } catch (e) {
    if (e instanceof Error) {
      throw e;
    } else {
      return e;
    }
  }
}

export default class Upload {
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

    debug('Creating new upload instance:');
    debug(` - Url: ${opts.url}`);
    debug(` - Id: ${opts.id}`);
    debug(` - File size: ${opts.file.size}`);
    debug(` - Chunk size: ${opts.chunkSize}`);
    this.opts = opts;
    this.meta = new FileMeta(opts.id, opts.file.size, opts.chunkSize, opts.storage);
    this.processor = new FileProcessor(opts.file, opts.chunkSize);
    this.lastResult = null;
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
      debug('Retrieving upload status from GCS');
      const res = await safePut(opts.url, null, {
        headers,
        validateStatus: () => true
      });
      checkResponseStatus(res, opts, [308]);
      const header = res.headers.range;
      debug(`Received upload status from GCS: ${header}`);
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
      debug(`Uploading chunk ${index}:`);
      debug(` - Chunk length: ${chunk.byteLength}`);
      debug(` - Start: ${start}`);
      debug(` - End: ${end}`);
      const res = await safePut(opts.url, chunk, {
        headers,
        validateStatus: () => true
      });
      this.lastResult = res;
      checkResponseStatus(res, opts, [200, 201, 308]);
      debug(`Chunk upload succeeded, adding checksum ${checksum}`);
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
      debug(`Validating chunks up to index ${resumeIndex}`);
      debug(` - Remote index: ${remoteResumeIndex}`);
      debug(` - Local index: ${localResumeIndex}`);

      try {
        await processor.run(validateChunk, 0, resumeIndex);
      } catch (e) {
        debug('Validation failed, starting from scratch');
        debug(` - Failed chunk index: ${e.chunkIndex}`);
        debug(` - Old checksum: ${e.originalChecksum}`);
        debug(` - New checksum: ${e.newChecksum}`);
        await processor.run(uploadChunk);
        return;
      }

      debug('Validation passed, resuming upload');
      await processor.run(uploadChunk, resumeIndex);
    };

    if (finished) {
      throw new errors.UploadAlreadyFinishedError();
    }

    if (meta.isResumable() && meta.getFileSize() === opts.file.size) {
      debug('Upload might be resumable');
      await resumeUpload();
    } else {
      debug('Upload not resumable, starting from scratch');
      await processor.run(uploadChunk);
    }

    debug('Upload complete, resetting meta');
    meta.reset();
    this.finished = true;
    return this.lastResult;
  }

  pause() {
    this.processor.pause();
    debug('Upload paused');
  }

  unpause() {
    this.processor.unpause();
    debug('Upload unpaused');
  }

  cancel() {
    this.processor.pause();
    this.meta.reset();
    debug('Upload cancelled');
  }

}

_defineProperty(Upload, "errors", errors);