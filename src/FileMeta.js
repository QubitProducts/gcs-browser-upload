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
    const key = `${STORAGE_KEY}.${this.id}`
    if (meta) {
      this.storage.setItem(key, JSON.stringify(meta))
    } else {
      this.storage.removeItem(key)
    }
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
    this.setMeta(null)
  }
}

export default FileMeta
