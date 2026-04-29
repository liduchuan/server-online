import { Hono } from "hono";
import { createRequestHandler } from "react-router";
import { server, type ServerOnlineItem } from "./server";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/server-list", (c) => {
	return c.json(server);
});

app.get("/api/online", async (c) => {
	const checkedAt = new Date().toISOString();
	const onlineList = await Promise.all(
		server.map(async (item): Promise<ServerOnlineItem> => {
			try {
				const response = await fetch(item.website);

				return {
					name: item.name,
					website: item.website,
					online: response.ok,
					statusCode: response.status,
					error: null,
					checkedAt,
				};
			} catch (error) {
				return {
					name: item.name,
					website: item.website,
					online: false,
					statusCode: null,
					error: error instanceof Error ? error.message : "Unknown error",
					checkedAt,
				};
			}
		}),
	);

	return c.json(onlineList);
});

app.get("/.well-known/appspecific/com.chrome.devtools.json", (c) => {
	return c.body(null, 204);
});

app.get("*", (c) => {
	const requestHandler = createRequestHandler(
		// @ts-ignore
		() => import("virtual:react-router/server-build"),
		import.meta.env.MODE,
	);

	return requestHandler(c.req.raw, {
		cloudflare: { env: c.env, ctx: c.executionCtx },
	});
});

export default app;
