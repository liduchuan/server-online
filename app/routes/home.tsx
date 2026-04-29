import {
	Avatar,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	Chip,
	Link,
	ProgressBar,
	Skeleton,
	Spinner,
	Surface,
} from "@heroui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Route } from "./+types/home";
import type { ServerItem, ServerOnlineItem } from "../../workers/server";

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

	const serverList = (await response.json()) as ServerItem[];

	return {
		message: context.cloudflare.env.VALUE_FROM_CLOUDFLARE,
		serverList,
	};
}

function getInitials(name: string) {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("");
}

function getHostname(website: string) {
	try {
		return new URL(website).hostname.replace(/^www\./, "");
	} catch {
		return website;
	}
}

export default function Home({ loaderData }: Route.ComponentProps) {
	const [onlineList, setOnlineList] = useState<ServerOnlineItem[]>([]);
	const [isLoadingOnline, setIsLoadingOnline] = useState(true);
	const [onlineError, setOnlineError] = useState<string | null>(null);

	const loadOnline = useCallback(async () => {
		setIsLoadingOnline(true);
		setOnlineError(null);

		try {
			const response = await fetch("/api/online");

			if (!response.ok) {
				throw new Error(`Online check failed with status ${response.status}`);
			}

			const data = (await response.json()) as ServerOnlineItem[];
			setOnlineList(data);
		} catch (error) {
			setOnlineError(
				error instanceof Error ? error.message : "Failed to fetch online status",
			);
		} finally {
			setIsLoadingOnline(false);
		}
	}, []);

	useEffect(() => {
		void loadOnline();
	}, [loadOnline]);

	const onlineMap = useMemo(
		() => new Map(onlineList.map((item) => [item.website, item])),
		[onlineList],
	);

	const onlineCount = onlineList.filter((item) => item.online).length;
	const offlineCount = onlineList.filter((item) => !item.online).length;
	const lastCheckedAt = onlineList[0]?.checkedAt ?? null;
	const healthPercent =
		loaderData.serverList.length === 0
			? 0
			: Math.round((onlineCount / loaderData.serverList.length) * 100);
	const statusTone = offlineCount === 0 ? "success" : "warning";

	return (
		<main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_48%,#f8fafc_100%)] px-4 py-8 text-foreground sm:px-6 lg:px-8">
			<div className="mx-auto flex max-w-6xl flex-col gap-6">
				<Surface className="overflow-hidden rounded-[28px] border border-white/60 bg-white/85 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur">
					<div className="grid gap-6 p-6 lg:grid-cols-[1.6fr_1fr] lg:p-8">
						<div className="space-y-5">
							<div className="flex flex-wrap items-center gap-3">
								<Chip color="accent" variant="soft">
									Operations Dashboard
								</Chip>
								<Chip color={statusTone} variant="soft">
									{isLoadingOnline
										? "Refreshing"
										: offlineCount === 0
											? "All services healthy"
											: `${offlineCount} service${offlineCount > 1 ? "s" : ""} need attention`}
								</Chip>
							</div>
							<div className="space-y-3">
								<h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
									Service health, rendered with HeroUI.
								</h1>
								<p className="max-w-2xl text-base leading-7 text-default-600">
									A compact operations view for your public services. The Worker
									keeps the source of truth for endpoints and performs concurrent
									availability checks.
								</p>
							</div>
							<div className="flex flex-wrap items-center gap-3">
								<Button className="shadow-sm" onPress={loadOnline}>
									{isLoadingOnline ? (
										<span className="flex items-center gap-2">
											<Spinner size="sm" />
											Refreshing status
										</span>
									) : (
										"Refresh status"
									)}
								</Button>
								<Chip variant="soft">
									{lastCheckedAt
										? `Last check ${new Date(lastCheckedAt).toLocaleString()}`
										: "Waiting for first check"}
								</Chip>
							</div>
							{onlineError ? (
								<Chip color="danger" variant="soft">
									{onlineError}
								</Chip>
							) : null}
						</div>

						<Card variant="secondary" className="border border-default-100/80 bg-white/90">
							<CardHeader className="flex items-start justify-between gap-4">
								<div className="space-y-1">
									<CardDescription>Environment</CardDescription>
									<CardTitle>{loaderData.message}</CardTitle>
								</div>
								<Avatar>
									<Avatar.Fallback>SM</Avatar.Fallback>
								</Avatar>
							</CardHeader>
							<CardContent className="space-y-5">
								<div className="grid grid-cols-2 gap-4">
									<div className="rounded-2xl bg-default-50 p-4">
										<p className="text-sm text-default-500">Services</p>
										<p className="mt-2 text-3xl font-semibold tabular-nums">
											{loaderData.serverList.length}
										</p>
									</div>
									<div className="rounded-2xl bg-default-50 p-4">
										<p className="text-sm text-default-500">Availability</p>
										<p className="mt-2 text-3xl font-semibold tabular-nums">
											{isLoadingOnline ? "--" : `${healthPercent}%`}
										</p>
									</div>
								</div>
								<div className="space-y-2">
									<div className="flex items-center justify-between text-sm text-default-500">
										<span>Overall health</span>
										<span>{isLoadingOnline ? "Checking..." : `${onlineCount}/${loaderData.serverList.length} online`}</span>
									</div>
									<ProgressBar
										aria-label="Overall health"
										color={offlineCount === 0 ? "success" : "warning"}
										value={isLoadingOnline ? 0 : healthPercent}
									/>
								</div>
							</CardContent>
						</Card>
					</div>
				</Surface>

				<div className="grid gap-4 md:grid-cols-3">
					<Card variant="secondary" className="border border-white/60 bg-white/85">
						<CardHeader>
							<CardDescription>Total services</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-3xl font-semibold tabular-nums">
								{loaderData.serverList.length}
							</p>
						</CardContent>
					</Card>
					<Card variant="secondary" className="border border-white/60 bg-white/85">
						<CardHeader>
							<CardDescription>Online</CardDescription>
						</CardHeader>
						<CardContent>
							{isLoadingOnline ? (
								<Skeleton className="h-9 w-16 rounded-lg" />
							) : (
								<p className="text-3xl font-semibold text-success tabular-nums">
									{onlineCount}
								</p>
							)}
						</CardContent>
					</Card>
					<Card variant="secondary" className="border border-white/60 bg-white/85">
						<CardHeader>
							<CardDescription>Attention required</CardDescription>
						</CardHeader>
						<CardContent>
							{isLoadingOnline ? (
								<Skeleton className="h-9 w-16 rounded-lg" />
							) : (
								<p className="text-3xl font-semibold text-warning tabular-nums">
									{offlineCount}
								</p>
							)}
						</CardContent>
					</Card>
				</div>

				<div className="grid gap-4 lg:grid-cols-2">
					{loaderData.serverList.map((item) => {
						const online = onlineMap.get(item.website);
						const isOnline = Boolean(online?.online);
						const hostname = getHostname(item.website);

						return (
							<Card
								key={item.website}
								variant="secondary"
								className="border border-white/60 bg-white/90 shadow-sm"
							>
								<CardHeader className="flex items-start justify-between gap-4">
									<div className="flex items-center gap-4">
										<Avatar>
											<Avatar.Fallback>{getInitials(item.name)}</Avatar.Fallback>
										</Avatar>
										<div className="space-y-1">
											<CardTitle>{item.name}</CardTitle>
											<CardDescription>{hostname}</CardDescription>
										</div>
									</div>
									{isLoadingOnline && !online ? (
										<Chip variant="soft">
											<span className="flex items-center gap-2">
												<Spinner size="sm" />
												Checking
											</span>
										</Chip>
									) : (
										<Chip color={isOnline ? "success" : "danger"} variant="soft">
											{isOnline ? "Operational" : "Unavailable"}
										</Chip>
									)}
								</CardHeader>
								<CardContent className="space-y-5">
									<div className="grid gap-3 sm:grid-cols-2">
										<div className="rounded-2xl bg-default-50 p-4">
											<p className="text-sm text-default-500">Endpoint</p>
											<p className="mt-2 break-all font-medium text-default-700">
												{item.website}
											</p>
										</div>
										<div className="rounded-2xl bg-default-50 p-4">
											<p className="text-sm text-default-500">HTTP status</p>
											{isLoadingOnline && !online ? (
												<Skeleton className="mt-2 h-7 w-20 rounded-lg" />
											) : (
												<p className="mt-2 text-xl font-semibold tabular-nums">
													{online?.statusCode ?? "--"}
												</p>
											)}
										</div>
									</div>
									<div className="space-y-2">
										<div className="flex items-center justify-between text-sm text-default-500">
											<span>Service status</span>
											<span>{isLoadingOnline && !online ? "Pending" : isOnline ? "Healthy" : "Issue detected"}</span>
										</div>
										<ProgressBar
											aria-label={`${item.name} health`}
											color={isOnline ? "success" : "danger"}
											value={isLoadingOnline && !online ? 20 : isOnline ? 100 : 25}
										/>
									</div>
								</CardContent>
								<CardFooter className="flex items-center justify-between gap-4 border-t border-default-100/80 pt-4">
									<Chip variant="soft">{item.name}</Chip>
									<Link href={item.website} target="_blank" rel="noreferrer">
										Open website
									</Link>
								</CardFooter>
							</Card>
						);
					})}
				</div>
			</div>
		</main>
	);
}
