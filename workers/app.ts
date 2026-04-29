import { Hono } from "hono";
import { createRequestHandler } from "react-router";
import { server } from "./server";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/server-list", (c) => {
  return c.json(server);
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
