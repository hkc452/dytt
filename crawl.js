const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')
let crawl = async (browser, url, format = false) => {
    if (typeof browser === 'string') {
        url = browser
        browser = await puppeteer.launch()
    }
    if (!url) return
    const toGoPage = await browser.newPage()
    try {
        await toGoPage.goto(url ,{
            timeout: 60000
        })
    } catch (error) {
        await browser.close()
        console.log(url+'失败')
    }
    const result = await toGoPage.evaluate((format) => {
        const fallbackLink = (node) => {
            // 检查是否满足ftp或者thunder
            // 否则从html里面获取
            // 去掉开头和末尾的空格
            const link = (node.innerText || '').replace(/^\s*|\s*$/g, '')
            // 支持 ftp thunder http(s) 这三种主要协议的下载链接
            if(/^(ftp|thunder|https?):\/\//.test(link)) return link
            const html = node.outerHTML || ''
            const match = html.match(/((ftp|thunder|https?):\/\/[^"]+)/)
            if(match) {
                return match[1]
            } else {
                return ''
            }
        }
        name = document.querySelector('#header > div > div.bd2 > div.bd3 > div.bd3r > div.co_area2 > div.title_all > h1 > font').innerHTML || Date.now()
        const links = document.querySelectorAll('#Zoom > span table tr>td a')
        let resLinks = format ? [] : ''
        links.forEach((item, index)=> {
            if (format) {
                resLinks.push({
                    // TODO 修复集数问题，因为有些不是从第一集开始的
                    index: index +1,
                    link: fallbackLink(item)
                })
            } else {
                resLinks+= '\n'+ fallbackLink(item)
            }
            
        })
        return {
            link: resLinks,
            name: name
        }
    }, format)
    fs.writeFileSync(path.join(process.cwd(),`${result.name}.text`), format ? JSON.stringify(result.link, null, 2) : result.link)
    await browser.close()
}
module.exports = crawl