import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { payload } = req.body;
        console.log("interactive payload", payload);

        const event = JSON.parse(payload); // Slack 이벤트 페이로드 파싱
        if (event.type === 'block_actions') {
            const action = event.actions[0];

            if (action.action_id === 'capture_button') {
                // 버튼 클릭 시 실행할 POST 요청
                try {
                    const response = await axios.post('http://localhost:3000/api/slack/screen-capture', {
                        dashboardUrl: action.value,
                        event: {
                            channel: event.container["channel_id"]
                        }
                    });

                    res.status(200).json({
                        text: 'Request successfully sent!',
                        response_type: 'ephemeral',
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