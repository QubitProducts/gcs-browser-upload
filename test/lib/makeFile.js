export default function makeFile (data) {
  return {
    size: data.length,
    name: 'foo',
    buffer: new Buffer(data),
    slice: (start, end) => makeFile(data.substring(start, end))
  }
}
