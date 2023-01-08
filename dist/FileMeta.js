'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var STORAGE_KEY = '__gcsBrowserUpload';

var FileMeta = function () {
  function FileMeta(id, fileSize, chunkSize, storage) {
    _classCallCheck(this, FileMeta);

    this.id = id;
    this.fileSize = fileSize;
    this.chunkSize = chunkSize;
    this.storage = storage;
  }

  _createClass(FileMeta, [{
    key: 'getMeta',
    value: function getMeta() {
      var meta = this.storage.getItem(STORAGE_KEY + '.' + this.id);
      if (meta) {
        return JSON.parse(meta);
      } else {
        return {
          checksums: [],
          chunkSize: this.chunkSize,
          started: false,
          fileSize: this.fileSize
        };
      }
    }
  }, {
    key: 'setMeta',
    value: function setMeta(meta) {
      var key = STORAGE_KEY + '.' + this.id;
      if (meta) {
        this.storage.setItem(key, JSON.stringify(meta));
      } else {
        this.storage.removeItem(key);
      }
    }
  }, {
    key: 'isResumable',
    value: function isResumable() {
      var meta = this.getMeta();
      return meta.started && this.chunkSize === meta.chunkSize;
    }
  }, {
    key: 'getResumeIndex',
    value: function getResumeIndex() {
      return this.getMeta().checksums.length;
    }
  }, {
    key: 'getFileSize',
    value: function getFileSize() {
      return this.getMeta().fileSize;
    }
  }, {
    key: 'addChecksum',
    value: function addChecksum(index, checksum) {
      var meta = this.getMeta();
      meta.checksums[index] = checksum;
      meta.started = true;
      this.setMeta(meta);
    }
  }, {
    key: 'getChecksum',
    value: function getChecksum(index) {
      return this.getMeta().checksums[index];
    }
  }, {
    key: 'reset',
    value: function reset() {
      this.setMeta(null);
    }
  }]);

  return FileMeta;
}();

exports.default = FileMeta;