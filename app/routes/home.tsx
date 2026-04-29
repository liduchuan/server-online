import { Button } from "@heroui/react";
import type { Route } from "./+types/home";

type ServerListItem = {
	id: string;
	name: string;
};

export async function loader({ context, request }: Route.LoaderArgs) {
	const url = new URL(request.url);
	const response = await fetch(`${url.origin}/api/server-list`, {
		headers: {
			"x-forwarded-host": url.host,
			"x-forwarded-proto": url.protocol.replace(":", ""),
		},
	});

	if (!response.ok) {
		throw new Response("Failed to load server list", {
			status: response.status,
		});
	}

	const serverList = (await response.json()) as ServerListItem[];

	return {
		message: context.cloudflare.env.VALUE_FROM_CLOUDFLARE,
		serverList,
	};
}

export default function Home({ loaderData }: Route.ComponentProps) {
	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="space-y-4 text-center">
				<p>{loaderData.message}</p>
				<Button>
					server count: {loaderData.serverList.length}
				</Button>
			</div>
		</div>
	);
}
