// ==UserScript==
// @name         PKULib Downloader
// @namespace    https://scripts.zisu.dev
// @version      0.0.1
// @description  Download PKU Library books
// @author       thezzisu <thezzisu@gmail.com>
// @match        https://e-reserve.lib.pku.edu.cn/html/book/pdf/foxit-pdfview.html?*
// @grant        none
// ==/UserScript==
// @ts-check

async function useDownloader() {
  console.log('欢迎使用%c摆大图书馆下载', 'color: #1ea0fa')

  const appId = localStorage.getItem('appId')
  const authorization = localStorage.getItem('authorization')
  /** @type {string} */
  // @ts-ignore
  const baseUrl = window.baseAjaxUrl
  const pdfId = new URLSearchParams(location.search).get('pdfId')

  if (!(appId && authorization && baseUrl && pdfId)) {
    alert('苟利国家生死以，岂因祸福避趋之')
    return
  }

  /**
   * @param {number} start
   * @param {number} end
   */
  async function requestRange(start, end) {
    return fetch(`${baseUrl}foxit-pdfview/getPDFURIByPdfId?pdfId=${pdfId}`, {
      headers: {
        accept: '*/*',
        'accept-encoding': 'identity',
        appid: appId,
        authorization,
        range: `bytes=${start}-${end}`
      },
      method: 'GET'
    })
  }

  async function getLength() {
    const res = await requestRange(0, 1)
    const range = res.headers.get('content-range')
    const length = parseInt(range.split('/')[1])
    return length
  }

  /**
   * @param {number} start
   * @param {number} end
   */
  async function downloadRange(start, end) {
    console.log(`downloading ${start}-${end}`)
    const res = await requestRange(start, end)
    const buffer = await res.arrayBuffer()
    return buffer
  }

  async function download() {
    const length = await getLength()
    console.log(`length: ${length}`)
    const chunkSize = 128 * 1024
    const chunkCount = Math.ceil(length / chunkSize)
    const chunks = []
    for (let i = 0; i < chunkCount; i++) {
      const start = i * chunkSize
      const end = Math.min(start + chunkSize, length) - 1
      const chunk = await downloadRange(start, end)
      chunks.push(chunk)
    }
    return chunks
  }

  async function save() {
    const chunks = await download()
    const blob = new Blob(chunks, { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    let filename = `${pdfId}.pdf`
    filename = prompt('请输入文件名', filename) || filename
    a.download = filename
    a.click()
  }

  return { save }
}

/**
 * @param {number} ms
 */
async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * @param {() => Promise<void>} save
 */
async function useUI(save) {
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.top = '0'
  container.style.left = '0'
  document.body.appendChild(container)

  const btn = document.createElement('button')
  btn.innerText = '下载'
  container.appendChild(btn)
  btn.addEventListener('click', () => {
    btn.textContent = '下载中...'
    btn.disabled = true
    save()
      .catch(() => {})
      .finally(() => {
        btn.textContent = '下载'
      })
  })
}

async function main() {
  const { save } = await useDownloader()
  await useUI(save)
}

;(function () {
  'use strict'
  window.addEventListener('load', () => {
    main()
  })
})()
