    const puppeteer = require('puppeteer')
    const fs = require('fs')

    const dytt = 'https://www.dytt8.net/'


    const init = async () => {
        //{headless: false}
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(dytt);

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
                        if(/^(ftp|thunder):\/\//.test(link)) return link
                        const html = node.outerHTML || ''
                        const match = html.match(/((ftp|thunder).+)\">/)
                        if(match) {
                            return match[1]
                        } else {
                            return ''
                        }
                    }
                    const links = document.querySelectorAll('#Zoom > span >table tr>td>a')
                    if (links.length == 1) return fallbackLink(links[0])
                    const resLinks = []
                    links.forEach((item, index)=> {
                        resLinks.push({
                            index: index +1,
                            link: fallbackLink(item)
                        })
                    })
                    return resLinks
                })
                // toGoPage.close()
                movie.link = link
            }
        }
        console.log('分析结束，耗时：'+ (Date.now()-aStart)/1000 +'s')
        // console.log(data)
        fs.writeFileSync('1.json', JSON.stringify(data, null, 2))
        await browser.close();
    }

    init()