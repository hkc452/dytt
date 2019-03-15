    const puppeteer = require('puppeteer')
    const fs = require('fs')
    const winston = require('winston')
    const path = require('path')
    const logName = (...agrs) => {
        return path.join('logs', ...agrs)
    }   
    const logger = winston.createLogger({
        level: 'info',
        format: winston.format.json(),
        defaultMeta: { service: 'user-service' },
        transports: [
            //
            // - Write to all logs with level `info` and below to `combined.log` 
            // - Write all logs error (and below) to `error.log`.
            //
            new winston.transports.File({ filename: logName('error.log'), level: 'error' }),
            new winston.transports.File({ filename: logName('combined.log') })
        ]
    });

    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
    const dytt = 'https://www.dytt8.net/'
    const init = async () => {
        //{headless: false}
        const browser = await puppeteer.launch();
        const aStart = Date.now()
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
        fs.writeFileSync('init.json', JSON.stringify(data, null, 2))
        logger.info('开始分析链接')
        // 生成下载链接
        for (let tag of data) {
            if (!tag.length) continue
            //TODO 改成cluster
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
        logger.info('分析结束，耗时：'+ (Date.now()-aStart)/1000 +'s')
        fs.writeFileSync('result.json', JSON.stringify(data, null, 2))
        await browser.close();
    }

    init()