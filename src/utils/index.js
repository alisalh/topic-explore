export function getVersion (fileName, lib) {
  let verReg = new RegExp(lib+'-(\\d*\\.\\d*\\.\\d*)')
  return fileName.match(verReg)[1]
}
export function getRelPath (fileName, lib) {
  let verReg = new RegExp(lib+'-(\\d*\\.\\d*\\.\\d*)(.*)')
  return fileName.match(verReg)[2]
}
export function getVerPath (fileName, lib) {
  let verReg = new RegExp(lib+'-(\\d*\\.\\d*\\.\\d*)(.*)')
  let arr = fileName.match(verReg)
  return lib+'-'+arr[1]+arr[2]
}
export function getRelPathWithVersion (fileName, lib) {
  let verReg = new RegExp(lib+'-(\\d*\\.\\d*\\.\\d*)(.*)')
  return fileName.match(verReg)[0]
}
export function groupBy (arr, prop) {
  const propType = typeof prop
  const cb = function (d) {
    if (propType === 'string') return d[prop]
    else return prop(d)
  }
  let propsCategory = [...new Set(arr.map(d => cb(d)))]
  let res = []
  propsCategory.forEach(p => {
    res.push({
      key: p,
      val: arr.filter(d => cb(d) === p)
    })
  })
  return res
}
