import fs from 'fs'
import { resolve } from 'path'

export default function makeFile (fileName, start = 0, end) {
  const path = resolve(__dirname, '..', 'fixtures', fileName + '.csv')
  const fileSize = fs.statSync(path).size
  if (end === undefined || end > fileSize) {
    end = fileSize
  }

  return {
    size: end - start,
    name: 'foo',
    stream: fs.createReadStream(path, { start, end: end - 1 }),
    slice: (start, end) => makeFile(fileName, start, end)
  }
}
