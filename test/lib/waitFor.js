import { Promise } from 'es6-promise'

export default function waitFor (fn, timeout = 30) {
  return new Promise((resolve) => {
    const checkFn = () => {
      if (fn()) {
        resolve()
      } else {
        setTimeout(checkFn, timeout)
      }
    }

    checkFn()
  })
}
