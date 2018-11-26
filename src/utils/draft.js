let d3 = require('d3')
let qs = require('qs')
let _ = require('lodash')
console.log(_.filter({ a: [1, 2], c: [4] }, (d, i) => {
  return d.length > 1
}))
let obj = {
  data: {
    name: 'tom'
  }
}
let { data: { name: myname } } = obj
console.log(myname)
