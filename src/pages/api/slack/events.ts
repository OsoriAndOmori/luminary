import {NextApiRequest, NextApiResponse} from 'next';
import {sendSlackMessage} from "@/utils/slack/slack-sender";
import {createGrafanaBlockKitMessage} from "@/utils/slack/slack-block-kit-builder";
import {fetchGrafanaDashboards} from "@/utils/grafana/grafana";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        console.log("/api/slack/events request body : ", req.body)

        const {type, challenge, event} = req.body;

        // Event verification from Slack (Challenge response)
        if (type === 'url_verification') {
            return res.status(200).json({challenge});
        }

        // 멘션 되었을때 할일 정의
        if (event && event.type === 'app_mention') {
            const channel = event.channel;
            try {
                const dashboards = await fetchGrafanaDashboards();
                const blocks = createGrafanaBlockKitMessage(dashboards);
                await sendSlackMessage(channel, 'Grafana Dashboards', blocks);
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
