const STORAGE_KEY = '__gcsBrowserUpload'

function FileMeta (id, chunkSize, storage) {
  this.id = id
  this.chunkSize = chunkSize
  this.localStorage = localStorage
}

FileMeta.prototype.getMeta = function () {
  const meta = this.storage.getItem(`${STORAGE_KEY}.${this.id}`)
  if (meta) {
    return JSON.parse(meta)
  } else {
    return {
      checksums: [],
      chunkSize: this.chunkSize,
      started: false
    }
  }
  return meta ? JSON.parse(meta) : null
}

FileMeta.prototype.setMeta = function (meta) {
  this.storage.setItem(`${STORAGE_KEY}.${this.id}`, JSON.stringify(meta))
}

FileMeta.prototype.isResumable = function () {
  let meta = this.getMeta()
  return meta.started && this.chunkSize === meta.chunkSize
}

FileMeta.prototype.getResumeIndex = function () {
  return this.getMeta().checksums.length
}

FileMeta.prototype.addChecksum = function (index, checksum) {
  let meta = this.getMeta()
  meta.checksums[index] = checksum
  meta.started = true
  this.setMeta(meta)
}

FileMeta.prototype.getChecksum = function (index) {
  return this.getMeta().checksums[index]
}

FileMeta.prototype.reset = function () {
  this.setMeta('')
}

export default FileMeta
