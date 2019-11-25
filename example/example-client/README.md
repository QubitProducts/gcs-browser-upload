# Example usage

## Setup

Before you start, you need to enable CORS on the buckets you want to upload to. You can do that with

```
gsutil cors set cors-json-file.json gs://your-bucket-name
```

`cors-json-file.json` is in this folder. You may need to tweak it depending on which HTTP methods you are wanting to call on GCS.

You also need to run

```sh
npm install
```

## Building

```sh
browserify src/main.js -o lib/bundle.js -t babelify
```

What is happening is:

1. Browserify starts
2. It runs the babelify transform
3. Babelify calls Babel which converts the ES2015 code into something readable by todays browsers. In particular it converts the `import`s into `require`s and translates async calls.
4. Browserify packages up the generated files along with all of the required code into a single `bundle.js` file.

*N.B.* Currently you need to generate an upload URL through another method and hard code it into the `url` key in the `Upload` object. For reference, here is a method in Clojure:

```clj
(defn sign-url [storage ^String bucket ^String blob content-type]
  (let [storage ^Storage (:service storage)
        blobinfo (.. (BlobInfo/newBuilder bucket blob)
                     (setContentType content-type)
                     (build))]
    (.signUrl storage blobinfo 7 TimeUnit/DAYS (into-array Storage$SignUrlOption [(Storage$SignUrlOption/signWith
                                                                                    (ServiceAccountCredentials/fromStream (io/input-stream "private/repository-import-service.json")))
                                                                                  (Storage$SignUrlOption/withContentType)
                                                                                  (Storage$SignUrlOption/httpMethod HttpMethod/PUT)]))))
```

For Python you can use [google.cloud.storage.blob.Blob.create_resumable_upload_session](https://googleapis.dev/python/storage/latest/blobs.html#google.cloud.storage.blob.Blob.create_resumable_upload_session).

## Running

Open `index.html`. Pick a file to upload. As soon as you pick the file, the upload will begin.

# Notes

I had to make a separate `main.js` file which required babel-polyfill before requiring `app.js`, otherwise you get errors saying `regeneratorRuntime is not defined`.

When generating your signed URL, make sure you specify that it uses a PUT method, otherwise you will get error messages saying that your signature didn't match, even though everything will look correct.
