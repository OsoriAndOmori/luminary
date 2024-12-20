import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        console.log("/api/slack/interactive-endpoint request body : ", req.body)

        const { payload } = req.body;

        const event = JSON.parse(payload); // Slack 이벤트 페이로드 파싱
        if (event.type === 'block_actions') {
            const action = event.actions[0];

            if (action.action_id === 'capture_button') {
                // 버튼 클릭 시 실행할 POST 요청
                const protocol = req.headers['x-forwarded-proto'] || 'http';
                const host = req.headers['x-forwarded-host'] || req.headers.host;
                const fullUrl = `${protocol}://${host}`;

                try {
                    const response = await axios.post(`${fullUrl}/api/screenshot/grafana`, {
                        dashboardUrl: action.value,
                        event: {
                            channel: event.container["channel_id"]
                        }
                    });

                    res.status(200).json({
                        message: 'Request successfully sent!',
                        file: response.data.file,
                    });

                } catch (error) {
                    console.error('Error sending request:', error);
                    res.status(500).json({
                        text: 'Failed to send request.',
                        response_type: 'ephemeral',
                    });
                }
            }
        } else {
            res.status(400).json({ error: 'Invalid event type' });
        }
    } else {
        res.status(405).json({ error: 'Method Not Allowed' });
    }
}