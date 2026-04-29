import { Hono } from "hono";
import { createRequestHandler } from "react-router";

const app = new Hono<{ Bindings: Env }>();

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
