import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { d1, r2, sandbox } from "@emdash-cms/cloudflare";
import { cloudflareEmail } from "@emdash-cms/cloudflare/plugins";
import { formsPlugin } from "@emdash-cms/plugin-forms";
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import emdash from "emdash/astro";
import { ZOEKMACHINES_ID, ZOEKMACHINES_VERSIE } from "./src/plugins/zoekmachines-id.mjs";

// The structured data of the site, as a native plugin in this repo.
const zoekmachines = {
	id: ZOEKMACHINES_ID,
	version: ZOEKMACHINES_VERSIE,
	format: "native",
	entrypoint: fileURLToPath(new URL("./src/plugins/zoekmachines.ts", import.meta.url)),
};

export default defineConfig({
	output: "server",
	adapter: cloudflare(),
	image: {
		layout: "constrained",
		responsiveStyles: true,
	},
	integrations: [
		react(),
		emdash({
			database: d1({ binding: "DB", session: "auto" }),
			storage: r2({ binding: "MEDIA" }),
			sandboxRunner: sandbox(),
			plugins: [
				cloudflareEmail({
					from: { email: "website@benefitgym.nl", name: "Benefit Gym" },
				}),
				formsPlugin(),
				zoekmachines,
			],
		}),
	],
	devToolbar: { enabled: false },
});
