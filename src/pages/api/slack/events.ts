import { NextApiRequest, NextApiResponse } from "next";

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN as string;

interface SlackEvent {
    type: string;
    text?: string;
    channel: string;
}

interface SlackRequestBody {
    challenge?: string;
    event?: SlackEvent;
}

// Block Kit 메시지 생성 함수
const getBlockKitMessage = () => ({
    blocks: [
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: "Hello! This is a *Block Kit* message!",
            },
        },
        {
            type: "divider",
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: "Here are some options:",
            },
        },
        {
            type: "actions",
            elements: [
                {
                    type: "button",
                    text: {
                        type: "plain_text",
                        text: "Option 1",
                    },
                    value: "option_1",
                },
                {
                    type: "button",
                    text: {
                        type: "plain_text",
                        text: "Option 2",
                    },
                    value: "option_2",
                },
            ],
        },
    ],
});

// Slack에 메시지 전송 함수
async function sendBlockKitMessage(channelId: string): Promise<void> {
    const url = "https://slack.com/api/chat.postMessage";

    const response = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            channel: channelId,
            text: "This is a fallback text for Block Kit",
            blocks: getBlockKitMessage().blocks,
        }),
    });

    const data = await response.json();
    if (!data.ok) {
        console.error("Failed to send message:", data.error);
    }
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === "POST") {
        const body: SlackRequestBody = req.body;

        // Slack URL 검증용
        if (body.challenge) {
            return res.status(200).json({ challenge: body.challenge });
        }

        const event = body.event;
        if (event?.type === "message" && event.text?.toLowerCase().includes("hello")) {
            await sendBlockKitMessage(event.channel);
        }

        return res.status(200).end();
    }

    return res.status(405).json({ error: "Method Not Allowed" });
}
