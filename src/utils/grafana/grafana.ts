import axios from "axios";

export const GRAFANA_BASE_URL = process.env.GRAFANA_BASE_URL || '';
export const GRAFANA_API_KEY = process.env.GRAFANA_API_KEY || '';

export async function fetchGrafanaDashboards() {
    const targetDashBoardGroup = [
        "artemis(calendar)",
        //"Luna",
        //"MARS-AUTH",
        //"STELLA",
    ]

    try {
        const response = await axios.get(`${GRAFANA_BASE_URL}/api/search?type=dash-db`, {
            headers: {
                Authorization: `Bearer ${GRAFANA_API_KEY}`,
            },
        });
        return response.data.filter((dash: any) => targetDashBoardGroup.includes(dash.folderTitle));
    } catch (error: any) {
        console.error('Error fetching Grafana dashboards:', error.response?.data || error.message);
        throw error;
    }
}
