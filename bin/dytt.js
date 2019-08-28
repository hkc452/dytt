#!/usr/bin/env node
const crawl = require('../crawl')
const urls = process.argv.slice(2)
if (!urls.length) throw('请输入电影天堂的链接')
const asserUrl = (url) => {
    if (!url || typeof url !== 'string') return false
    if (/^https?:\/\/www\.dytt8\.net(\/\w+?)+\.html?$/.test(url)) return true
    return false
}
for (let url of urls) {
    if (!asserUrl(url)) continue
    crawl(url)
}
