// A widget on the dashboard of the admin with every page of the site in one table.
import { definePlugin } from "emdash";
import { DASHBOARD_ADMIN, DASHBOARD_ID, DASHBOARD_VERSIE } from "./dashboard-id.mjs";

export function createPlugin() {
	return definePlugin({
		id: DASHBOARD_ID,
		version: DASHBOARD_VERSIE,
		// An admin entry makes the widget a React component instead of a Block Kit one.
		admin: {
			entry: DASHBOARD_ADMIN,
			widgets: [{ id: "paginas", title: "Pagina's", size: "full" }],
		},
	});
}
