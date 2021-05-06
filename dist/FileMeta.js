"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
const STORAGE_KEY = '__gcsBrowserUpload';

class FileMeta {
  constructor(id, fileSize, chunkSize, storage) {
    this.id = id;
    this.fileSize = fileSize;
    this.chunkSize = chunkSize;
    this.storage = storage;
  }

  getMeta() {
    const meta = this.storage.getItem(`${STORAGE_KEY}.${this.id}`);

    if (meta) {
      return JSON.parse(meta);
    }

    return {
      checksums: [],
      chunkSize: this.chunkSize,
      started: false,
      fileSize: this.fileSize
    };
  }

  setMeta(meta) {
    const key = `${STORAGE_KEY}.${this.id}`;

    if (meta) {
      this.storage.setItem(key, JSON.stringify(meta));
    } else {
      this.storage.removeItem(key);
    }
  }

  isResumable() {
    const meta = this.getMeta();
    return meta.started && this.chunkSize === meta.chunkSize;
  }

  getResumeIndex() {
    return this.getMeta().checksums.length;
  }

  getFileSize() {
    return this.getMeta().fileSize;
  }

  addChecksum(index, checksum) {
    const meta = this.getMeta();
    meta.checksums[index] = checksum;
    meta.started = true;
    this.setMeta(meta);
  }

  getChecksum(index) {
    return this.getMeta().checksums[index];
  }

  reset() {
    this.setMeta(null);
  }

}

exports.default = FileMeta;