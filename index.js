const Nightmare = require("nightmare")
const util = require("util")

const nightmare = Nightmare({ show: true })
const url = "https://www.khanacademy.org/economics-finance-domain/core-finance/interest-tutorial/"

function getYoutubeId(item) {
    const ytVidSel = 'iframe[src*="youtube.com"]'
    return nightmare
        .goto(item.link)
        .wait(ytVidSel)
        .evaluate(ytVidSel => {
            try {
                return document.querySelector(ytVidSel).id.substr("video_".length)
            } catch (e) {}
        }, ytVidSel)
        .then(id => {
            console.log(item.title, id)
            return { ...item, youtubeId: id }
        })
        .catch(error => {
            console.error("Search failed:", error)
        })
}

function scrapeSubject(url) {
    return nightmare
        .goto(url)
        .evaluate(() => {
            const results = []
            let i = 1
            const subject = document.querySelector("h1[class^=title]").innerText.trim()
            const moduleSel = "div[data-slug][class^=row]"
            document.querySelectorAll(moduleSel).forEach(moduleDiv => {
                const moduleNameSel = "div[class^=titleContainer]"
                const moduleName = moduleDiv.querySelector(moduleNameSel).innerText.trim()
                const videoSel = "div[class*=innerContainerWithOverflow] a"
                const videos = moduleDiv.querySelectorAll(videoSel).forEach(vidLink => {
                    results.push({
                        i,
                        subject,
                        moduleName,
                        link: vidLink.href,
                        title: vidLink.innerText.trim()
                    })
                    i++
                })
            })
            return results
        })
        .catch(error => {
            console.error("Search failed:", error)
        })
}

scrapeSubject(url)
    .then(items => {
        const results = []
        return new Promise((resolve, reject) => {
            ;(function processNext() {
                if (!items.length) {
                    resolve(results)
                    return
                }

                getYoutubeId(items.pop())
                    .then(newItem => {
                        results.push(newItem)
                        processNext()
                    })
                    .catch(e => {
                        console.error(e)
                        processNext()
                    })
            })()
        })
    })
    .then(res => {
        console.log(util.inspect(res, { depth: null }))
        return nightmare.end(() => {})
    })
