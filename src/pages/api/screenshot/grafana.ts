import puppeteer from 'puppeteer';
import {uploadImageBufferToSlack} from "@/utils/slack/slack-sender";
import {GRAFANA_API_KEY, GRAFANA_BASE_URL} from "@/utils/grafana/grafana";

export default async function handler(req: any, res: any) {
    const {event, dashboardUrl} = req.body;
    console.log("/api/screenshot/grafana request body : ", req.body);

    if (req.method === 'POST') {
        try {
            // Grafana 대시보드 스크린샷 캡처
            const screenshotBuffer = await captureGrafanaScreenshot(dashboardUrl);
            const channel = event.channel;
            // Slack으로 이미지 전송
            const file = await uploadImageBufferToSlack(channel, Buffer.from(screenshotBuffer), `grafana-screenshot-${Date.now()}.png`);

            // 응답 반환
            res.status(200).json({file: file, message: 'Screenshot sent to Slack successfully!'});
        } catch (error) {
            console.error('Error during process:', error);
            res.status(500).json({error: 'Failed to capture and send screenshot'});
        }
    } else {
        // POST 요청이 아닌 경우
        res.status(405).json({error: 'Method Not Allowed'});
    }
}

async function captureGrafanaScreenshot(dashboardUrl: string) {
    // Puppeteer 브라우저 열기
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Grafana 로그인 헤더 설정 (API Key를 사용하여 인증)
    await page.setRequestInterception(true);
    page.on('request', (request) => {
        if (request.url().includes('grafana')) {
            request.continue({
                headers: {
                    ...request.headers(),
                    'Authorization': `Bearer ${GRAFANA_API_KEY}`,
                },
            });
        } else {
            request.continue();
        }
    });
    await page.setViewport({width: 1300, height: 2000, isMobile: true})
    // Grafana 대시보드 페이지로 이동
    await page.goto(`${GRAFANA_BASE_URL}${dashboardUrl}`, {
        waitUntil: 'networkidle2', // 페이지가 로딩될 때까지 대기
    });
    // TODO 솔직히 잘 동작안하는거 같음. 그냥 찍는 느낌이야.
    await page.waitForNetworkIdle({
        idleTime: 500, // 네트워크 요청이 500ms 동안 없을 때 로딩이 완료된 것으로 간주
        timeout: 30000, // 타임아웃: 30초
    });
    await page.waitForSelector('#pageContent');

    // 스크린샷을 Buffer로 캡처 뒤 종료
    const element = await page.$('#pageContent');
    const screenshotBuffer = await element!!.screenshot();
    await browser.close();

    return screenshotBuffer;
}

