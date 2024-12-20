import {GRAFANA_BASE_URL} from "@/utils/grafana/grafana";

export function createGrafanaBlockKitMessage(dashboards: any[]) {
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
                    "text": "캡쳐"
                },
                action_id: "capture_button",
                value: `${GRAFANA_BASE_URL}${dashboard.url}`
            }
        });
    });
    return blocks;
}

