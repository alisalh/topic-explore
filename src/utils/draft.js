let d3 = require('d3')
let qs = require('qs')
const data = { docs: [{ name: 'tom', age: 11 }, { name: 'tim', age: 12 }] }
console.log(decodeURI(qs.stringify(data, { arrayFormat: 'repeat' })))
const domain = Array(10).map((d, i) => i)
let a = '123.23'
console.log(Number(a))

console.log([].length)
let verReg = /vue-(\d*\.\d*\.\d*)(.*)/
console.log('/Users/wendahuang/Desktop/vue-all-versions/vue-1.0.27/src/watcher.js'.match(verReg))
const str = '[" @flow "," the ssr codegen is essentially extending the default codegen to handle"," ssr-optimizable nodes and turn them into string render fns. in cases where"," a node is not optimizable it simply falls back to the default codegen."," segment types"," stringify whole tree"," stringify self and check children"," generate self as vnode and stringify children"," generate self as vnode and check children"," bail whole tree"," v-for / v-if"," attrs"," domprops"," v-bind=\"object\""]'
const str2 = '["a","b=\"c\""]'
const str1 = ['a', 'c="10"']
const str4 = JSON.stringify(str1)
console.log(str4)
console.log(JSON.parse(str4))
const str5 = '["a","c=\\"10\\""]'
console.log(str5)
console.log(decodeURI('title=test&sub%5B%5D=1&sub%5B%5D=2&sub%5B%5D=3'))
