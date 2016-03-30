#!/usr/bin/env node
'use strict'

require('colors')
const resolve = require('path').resolve
const fs = require('fs')
const mkdirp = require('mkdirp').sync
const randomString = require('random-string')
const log = console.log.bind(console)

const CELL_LENGTH = 15

generateFixture(8000, 'tiny')
generateFixture(4e7, 'medium')
generateFixture(7e7, 'large')

function generateFixture (size, name) {
  let rows = Math.ceil(parseFloat(size) / (CELL_LENGTH * 2 + 2))
  log(`Writing ${rows} rows to test/fixtures/${name}.csv`.yellow)

  mkdirp(resolve(__dirname, '..', 'test', 'fixtures'))
  let stream = fs.createWriteStream(resolve(__dirname, '..', 'test', 'fixtures', name + '.csv'))
  stream.on('finish', function () {
    log(`Done ${name}`.green)
  })

  writeRow(0)

  function writeRow (index) {
    let isOk = stream.write(`${generateCell()},${generateCell()}\n`)
    if (index === rows - 1) {
      stream.end()
    } else if (isOk) {
      writeRow(index + 1)
    } else {
      stream.once('drain', function () {
        writeRow(index + 1)
      })
    }
  }
}

function generateCell () {
  return randomString({ length: CELL_LENGTH })
}
