import puppeteer from 'puppeteer';
import axios from 'axios';

const GRAFANA_BASE_URL = process.env.GRAFANA_BASE_URL;
const GRAFANA_API_KEY = process.env.GRAFANA_API_KEY;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

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
    await page.waitForNetworkIdle({
        idleTime: 500, // 네트워크 요청이 500ms 동안 없을 때 로딩이 완료된 것으로 간주
        timeout: 30000, // 타임아웃: 30초
    });
    // 추가로 특정 DOM 요소가 로드되었는지 기다리기
    await page.waitForSelector('#pageContent');

    // 스크린샷을 Buffer로 캡처
    const element = await page.$('#pageContent');
    const screenshotBuffer = await element!!.screenshot();

    // 브라우저 종료
    await browser.close();

    return screenshotBuffer;
}

async function uploadFileToSlack(channelId: string, screenshotBuffer: Uint8Array, filename: string, ) {
    try {
        const buffer = Buffer.from(screenshotBuffer);
        const length = buffer.length;
        const params = new URLSearchParams();
        params.append('filename', filename);
        params.append('length', length.toString()); // length는 문자열로 변환


        //TODO 삭제해야함.
        //const filePath = 'public/images/screenshot.png';
        // 동기적으로 파일 저장 (writeFileSync)
        //fs.writeFileSync(filePath, buffer);

        // 1. files.getUploadURLExternal 호출하여 업로드 URL 획득
        const uploadUrlResponse = await axios.post(
            'https://slack.com/api/files.getUploadURLExternal',
            params,
            {
                headers: {
                    Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
                    'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
                },
            }
        );

        console.log("uploadUrlResponse", uploadUrlResponse);

        if (!uploadUrlResponse.data.ok) {
            throw new Error(`Error getting upload URL: ${uploadUrlResponse.data.error}`);
        }

        const uploadUrl = uploadUrlResponse.data.upload_url;

        // 2. 업로드 URL로 파일 업로드
        await axios.post(uploadUrl, buffer, {
            headers: {
                'Content-Type': 'application/octet-stream',
            },
        });

        // 3. files.completeUploadExternal 호출하여 업로드 완료 알림
        const completeResponse = await axios.post(
            'https://slack.com/api/files.completeUploadExternal',
            {
                files: [
                    {
                        id: uploadUrlResponse.data.file_id
                    },
                ],
                channel_id: channelId,
            },
            {
                headers: {
                    Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
                    'Content-Type': 'application/json; charset=utf-8',
                },
            }
        );

        console.log("completeResponse", completeResponse.data);


        if (!completeResponse.data.ok) {
            throw new Error(`Error completing upload: ${completeResponse.data.error}`);
        }

        console.log('File uploaded successfully.');
    } catch (error) {
        console.error('Error uploading file to Slack:', error);
    }
}

export default async function handler(req: any, res: any) {
    const { event, dashboardUrl } = req.body;
    console.log("req.body", req.body);
    if (req.method === 'POST') {
        try {
            // Grafana 대시보드 스크린샷 캡처
            const screenshotBuffer = await captureGrafanaScreenshot(dashboardUrl);
            const channel = event.channel;
            console.log("channel", channel)
            console.log("screenshotBuffer", screenshotBuffer)
            // Slack으로 이미지 전송
            await uploadFileToSlack(channel, screenshotBuffer, `grafana-screenshot-${Date.now()}.png`);

            // 응답 반환
            res.status(200).json({ message: 'Screenshot sent to Slack successfully!' });
        } catch (error) {
            console.error('Error during process:', error);
            res.status(500).json({ error: 'Failed to capture and send screenshot' });
        }
    } else {
        // POST 요청이 아닌 경우
        res.status(405).json({ error: 'Method Not Allowed' });
    }
}
