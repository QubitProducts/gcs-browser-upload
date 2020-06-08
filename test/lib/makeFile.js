export default function makeFile(data) {
  return {
    size: data.length,
    name: 'foo',
    buffer: Buffer.from(data),
    slice: (start, end) => makeFile(data.substring(start, end)),
  };
}
