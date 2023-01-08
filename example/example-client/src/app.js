import Upload from '../../../dist/Upload'

// https://googlecloudplatform.github.io/google-cloud-node/#/docs/storage/1.0.0/storage/file?method=createResumableUpload

let input = document.getElementById('fileInput')
let pause = document.getElementById('pause')
let unpause = document.getElementById('unpause')
let upload = null

input.addEventListener('change', async () => {
  upload = new Upload({
    id: 'foo',
    contentType: 'application/octet-stream',
    metadata: {
      'custom-metadata': 'test'
    },
    // N.B. This isn't a resumable upload URL. You should generate one of them instead somehow...
    url: "https://storage.googleapis.com/your-bucket/your/key.zip?GoogleAccessId=service@project-name.iam.gserviceaccount.com&Expires=1493021074&Signature=biglongsignature%%%%%EXKw8zg%2BuDNSK3Z6tb8Z%2BVgOPopN5Kizatxwg%3D%3D",
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
