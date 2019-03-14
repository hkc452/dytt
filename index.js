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
    // 生成下载链接
    for (let tag of data) {
        if (!tag.length) continue
        for (let movie of tag.movies) {
            const toGoPage = await browser.newPage()
            await toGoPage.goto(movie.toGo)
            // const link = await toGoPage.emulate(() => {
            //     const links = document.querySelectorAll('#Zoom > span >table>tr>td>a')
            //     if (links.length == 1) return links[0].innerText
            //     const resLinks = []
            //     links.forEach((i, index)=> {
            //         resLinks.push({
            //             index: index +1,
            //             link:i.innerText
            //         })
            //     })
            //     return resLinks
            // })
            movie.link = 'link'
        }
    }
    fs.writeFileSync('1.json', JSON.stringify(data, null, 2))
    await browser.close();
}

init()