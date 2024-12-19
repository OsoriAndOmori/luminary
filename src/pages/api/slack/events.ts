import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';

const GRAFANA_BASE_URL = process.env.GRAFANA_BASE_URL;
const GRAFANA_API_KEY = process.env.GRAFANA_API_KEY;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

const targetDashBoardGroup = [
    "artemis(calendar)",
    //"Luna",
    //"MARS-AUTH",
    //"STELLA",
]
async function fetchGrafanaDashboards() {
    try {
        const response = await axios.get(`${GRAFANA_BASE_URL}/api/search?type=dash-db`, {
            headers: {
                Authorization: `Bearer ${GRAFANA_API_KEY}`,
            },
        });
        console.log("grafana dashboards", response.data);
        return response.data.filter((dash: any) => targetDashBoardGroup.includes(dash.folderTitle));
    } catch (error: any) {
        console.error('Error fetching Grafana dashboards:', error.response?.data || error.message);
        throw error;
    }
}

async function sendSlackMessage(channel: string, blocks: any) {
    try {
        const response = await axios.post(
            'https://slack.com/api/chat.postMessage',
            {
                channel,
                blocks,
                text: 'Grafana Dashboards',
            },
            {
                headers: {
                    Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        if (!response.data.ok) {
            console.error('Error sending message to Slack:', response.data.error);
        }
    } catch (error: any) {
        console.error('Error sending message to Slack:', error.message);
    }
}

function createBlockKitMessage(dashboards: any[]) {
    const blocks : any = [
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: '*Grafana Dashboards*',
            },
        },
        {
            type: 'divider',
        },
    ];

    dashboards.forEach((dashboard) => {
        blocks.push({
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `<${GRAFANA_BASE_URL}${dashboard.url}|*${dashboard.title}*>`,
            },
            accessory: {
                type: "button",
                text: {
                    "type": "plain_text",
                    "text": "스샷"
                },
                action_id: "capture_button",
                value: `${dashboard.url}`
            }
        });
    });

    console.log('blocks', blocks);
    return blocks;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { type, challenge, event } = req.body;

        // Event verification from Slack (Challenge response)
        if (type === 'url_verification') {
            return res.status(200).json({ challenge });
        }

        if (type === 'capture_button'){

        }

        // Process incoming Slack event
        if (event && event.type === 'app_mention') {
            const channel = event.channel;
            try {
                const dashboards = await fetchGrafanaDashboards();
                const blocks = createBlockKitMessage(dashboards);
                await sendSlackMessage(channel, blocks);
                res.status(200).send('Message sent');
            } catch (error: any) {
                console.error('Error processing event:', error.message);
                res.status(500).send('Internal Server Error');
            }
        } else {
            res.status(200).send('Event not handled');
        }
    } else {
        res.status(405).send('Method Not Allowed');
    }
}
