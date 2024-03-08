# ⚠️ This repo is archived and no longer maintained.
The code has been migrated to the [Fusion repo](https://github.com/cognitedata/fusion/tree/master/libs/shared/gcs-browser-upload)

# gcs-browser-upload [ ![Codeship Status for qubitdigital/gcs-browser-upload](https://codeship.com/projects/cc1d14a0-d19a-0133-39c4-66c9b913d1be/status?branch=master)](https://codeship.com/projects/141578)

Chunked, pausable, recoverable uploading to Google Cloud Storage directly from the browser.


## How does it work?

1. User selects a file
1. File + a [Google Cloud Storage resumable upload URL](https://cloud.google.com/storage/docs/json_api/v1/how-tos/upload#resumable) are given to `gcs-browser-upload`
1. File is read in chunks
1. A checksum of each chunk is stored in `localStorage` once succesfully uploaded
1. If the page is closed and re-opened for some reason, the upload can be resumed by passing the same file and URL back to `gcs-browser-upload`. The file will be validated against the stored chunk checksums to work out if the file is the same and where to resume from.
1. Once the resume index has been found, `gcs-browser-upload` will continue uploading from where it left off.
1. At any time, the `pause` method can be called to delay uploading the remaining chunks. The current chunk will be finished. `unpause` can then be used to continue uploading the remaining chunks.


## Example

There is a full example available at `example/example-client`.

```js
import Upload from 'gcs-browser-upload'

let input = document.getElementById('fileInput')
let pause = document.getElementById('pause')
let unpause = document.getElementById('unpause')
let upload = null

input.addEventListener('change', async () => {
  upload = new Upload({
    id: 'foo',
    url: 'https://www.googleapis.com/..../....',
    file: input.files[0],
    onChunkUpload: (info) => {
      console.log('Chunk uploaded', info)
    }
  })

  try {
    await upload.start()
    console.log('Upload complete!')
  } catch (e) {
    console.log('Upload failed!', e)
  } finally {
    upload = null
  }
})

pause.addEventListener('click', () => {
  if (upload) {
    upload.pause()
  }
})

unpause.addEventListener('click', () => {
  if (upload) {
    upload.unpause()
  }
})
```


## Config

```js
{
  id: null, // required - a unique ID for the upload
  url: null, // required - GCS resumable URL
  file: null, // required - instance of File
  chunkSize: 262144, // optional - chunk size must be a multiple of 262144
  storage: window.localStorage, // optional - storage mechanism used to persist chunk meta data
  contentType: 'text/plain', // optional - content type of the file being uploaded
  onChunkUpload: () => {} // optional - a function that will be called with progress information
}
```


## Requirements

This library requires `regeneratorRuntime` to be available globally - it is written in ES7 and makes use of async/await, which gets compiled into generators. You can find out about regenerator-runtime [here](https://www.npmjs.com/package/regenerator-runtime).

## Handling errors

Various errors are thrown if something goes wrong during uploading. See [src/errors.js](https://github.com/qubitdigital/gcs-browser-upload/blob/master/src/errors.js) for the different types. These are exported as a property on the `Upload` class.


## Developing

```js
make bootstrap     // install dependencies
make test          // run tests
make test-watch    // continuously run tests
```


## Want to work on this for your day job?

This project was created by the Engineering team at [Qubit](http://www.qubit.com). As we use open source libraries, we make our projects public where possible.

We’re currently looking to grow our team, so if you’re a JavaScript engineer and keen on ES2016 React+Redux applications and Node micro services, why not get in touch? Work with like minded engineers in an environment that has fantastic perks, including an annual ski trip, yoga, a competitive foosball league, and copious amounts of yogurt.

Find more details on our [Engineering site](https://eng.qubit.com). Don’t have an up to date CV? Just link us your Github profile! Better yet, send us a pull request that improves this project.
