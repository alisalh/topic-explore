export function getVersion (fileName) {
  let verReg = /vue-(\d*\.\d*\.\d*)/
  return fileName.match(verReg)[1]
}
