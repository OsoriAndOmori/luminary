import axios from "axios";

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

export async function sendSlackMessage(channel: string, title: string, blocks: any) {
    try {
        const response = await axios.post(
            'https://slack.com/api/chat.postMessage',
            {
                channel,
                blocks,
                text: title
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


export async function uploadImageBufferToSlack(channelId: string, buffer: Buffer, filename: string,) {
    try {
        const length = buffer.length;
        const params = new URLSearchParams();
        params.append('filename', filename);
        params.append('length', length.toString());

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
            'https://slack.com/api/files.completeUploadExternal', {
                files: [{
                    id: uploadUrlResponse.data.file_id
                }],
                channel_id: channelId,
            }, {
                headers: {
                    Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
                    'Content-Type': 'application/json; charset=utf-8',
                },
            }
        );

        if (!completeResponse.data.ok) {
            throw new Error(`Error completing upload: ${completeResponse.data.error}`);
        }

        console.log('File uploaded successfully.');
        return completeResponse.data.file;
    } catch (error) {
        console.error('Error uploading file to Slack:', error);
    }
}