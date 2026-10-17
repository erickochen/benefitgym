// The cards of the site on the dashboard of the admin: the frequent tasks with the rules of the panel, what is not yet
// on the site and every page in one table, in this order.
import { definePlugin } from "emdash";
import { DASHBOARD_ADMIN, DASHBOARD_ID, DASHBOARD_VERSIE } from "./dashboard-id.mjs";

export function createPlugin() {
	return definePlugin({
		id: DASHBOARD_ID,
		version: DASHBOARD_VERSIE,
		// An admin entry makes the widgets React components instead of Block Kit ones.
		admin: {
			entry: DASHBOARD_ADMIN,
			widgets: [
				{ id: "snel", title: "Snel doen" },
				{ id: "concepten", title: "Nog niet op de site" },
				{ id: "paginas", title: "Pagina's", size: "full" },
			],
		},
	});
}
