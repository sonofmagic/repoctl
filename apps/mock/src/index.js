function getCode() {
  return undefined
}

const x = true

if (x && getCode()) {

}

getCode()
x && getCode()
1 + 1

const task = new Promise((r) => {
  setTimeout(() => {
    r(undefined)
  }, 1000)
})

await task
