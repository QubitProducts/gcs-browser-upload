declare module "gcs-browser-upload" {
  type ChunkUploadData = {
    totalBytes: number
    uploadedBytes: number
    chunkIndex: number
    chunkLength: number
  }

  type UploadOptions = {
    /** A unique ID for the upload */
    id: string

    /** GCS resumable URL */
    url: string

    /** The File to upload */
    file: File

    /**
     * Chunk size must be a multiple of 262144
     * @default 262144
     */
    chunkSize?: number

    /**
     * Storage mechanism used to persist chunk metadata
     * @default window.localStorage
     */
    storage?: Storage

    /**
     * Content type of the file being uploaded
     * @default 'text/plain'
     */
    contentType?: string

    /** A function that will be called with progress information */
    onChunkUpload?: (data: ChunkUploadData) => void
  }
  export default class Upload {
    static errors: typeof UploadErrors

    constructor(config: UploadOptions, allowSmallChunks?: boolean)

    start(): Promise<void>
    pause(): void
    unpause(): void
    cancel(): void
  }

  namespace UploadErrors {
    class DifferentChunkError extends Error {
      constructor(
        chunkIndex: number,
        originalChecksum: string,
        newChecksum: string
      )
    }
    class FileAlreadyUploadedError {
      constructor(id: string, url: string)
    }
    class UrlNotFoundError {
      constructor(url: string)
    }
    class UploadFailedError {
      constructor(status: number)
    }
    class UnknownResponseError {
      constructor(res: unknown)
    }
    class MissingOptionsError {}
    class UploadIncompleteError {}
    class InvalidChunkSizeError {
      constructor(chunkSize: number)
    }
    class UploadAlreadyFinishedError {}
  }
}
