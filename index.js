    const puppeteer = require('puppeteer')
    const fs = require('fs')

    const dytt = 'https://www.dytt8.net/'


    const init = async () => {
        //{headless: false}
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(dytt, {
            timeout: 60000
        });

        const data = await page.evaluate(async () => {
            const res = []
            // 中间区域
            const co_area2s =  document.querySelectorAll('.bd3r .bd3rl .co_area2 ')
            for (let co_area2 of co_area2s) {
                const titleCon = co_area2.querySelector('.title_all > p >strong')
                const moviesCons = co_area2.querySelectorAll('table tr')
                const movies = []
                for (let tr of moviesCons) {
                    const tds =tr.querySelectorAll('td')
                    if (tds.length < 2 ) continue
                    // toDO 拿到链接
                    const toGo = tds[0].children[1].href
                    
                    movies.push({
                        title: tds[0].children[1].innerText,
                        date: tds[1].textContent,
                        toGo
                    })
                }
                res.push({
                    title: titleCon.innerText,
                    movies,
                    length:moviesCons.length
                })
            }
            return res
        })
        const aStart = Date.now()
        fs.writeFileSync('init.json', JSON.stringify(data, null, 2))
        console.log('开始分析链接')
        // 生成下载链接
        for (let tag of data) {
            if (!tag.length) continue
            for (let movie of tag.movies) {
                const toGoPage = await browser.newPage()
                try {
                    await toGoPage.goto(movie.toGo ,{
                        timeout: 60000
                    })
                } catch (error) {
                    console.log(movie.toGo+'失败')
                    continue;
                }
                
                const link = await toGoPage.evaluate(() => {
                    const fallbackLink = (node) => {
                        // 检查是否满足ftp或者thunder
                        // 否则从html里面获取
                        const link = node.innerText
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
                    const links = document.querySelectorAll('#Zoom > span table tr>td a')
                    if (links.length == 1) return fallbackLink(links[0])
                    const resLinks = []
                    links.forEach((item, index)=> {
                        resLinks.push({
                            // TODO 修复集数问题，因为有些不是从第一集开始的
                            index: index +1,
                            link: fallbackLink(item)
                        })
                    })
                    return resLinks
                })
                movie.link = link
                // 关闭tab，减少内存消耗
                await toGoPage.close()
            }
        }
        console.log('分析结束，耗时：'+ (Date.now()-aStart)/1000 +'s')
        // console.log(data)
        fs.writeFileSync('1.json', JSON.stringify(data, null, 2))
        await browser.close();
    }

    init()