const STORAGE_KEY = '__gcsBrowserUpload'

class FileMeta {
  constructor (id, chunkSize, storage) {
    this.id = id
    this.chunkSize = chunkSize
    this.storage = storage
  }

  getMeta () {
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
  }

  setMeta (meta) {
    this.storage.setItem(`${STORAGE_KEY}.${this.id}`, JSON.stringify(meta))
  }

  isResumable () {
    let meta = this.getMeta()
    return meta.started && this.chunkSize === meta.chunkSize
  }

  getResumeIndex () {
    return this.getMeta().checksums.length
  }

  addChecksum (index, checksum) {
    let meta = this.getMeta()
    meta.checksums[index] = checksum
    meta.started = true
    this.setMeta(meta)
  }

  getChecksum (index) {
    return this.getMeta().checksums[index]
  }

  reset () {
    this.setMeta('')
  }
}

export default FileMeta
