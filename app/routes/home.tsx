import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardTitle,
  Chip,
  Link,
  ProgressBar,
  Skeleton,
  Spinner,
  Surface,
} from "@heroui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ServerItem, ServerOnlineItem } from "../../workers/server";
import type { Route } from "./+types/home";

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
        error instanceof Error
          ? error.message
          : "Failed to fetch online status",
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
  const statusTone = offlineCount === 0 ? "success" : "danger";
  const orderedServerList = useMemo(
    () =>
      [...loaderData.serverList].sort((left, right) => {
        const leftStatus = onlineMap.get(left.website);
        const rightStatus = onlineMap.get(right.website);

        const leftRank = !leftStatus ? 1 : leftStatus.online ? 2 : 0;
        const rightRank = !rightStatus ? 1 : rightStatus.online ? 2 : 0;

        return leftRank - rightRank;
      }),
    [loaderData.serverList, onlineMap],
  );
  const failingServices = orderedServerList.filter(
    (item) => onlineMap.get(item.website)?.online === false,
  );

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7f7_0%,#fff 22%,#f8fafc_100%)] px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <Surface className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_60px_-36px_rgba(15,23,42,0.32)]">
          <div className="flex flex-col gap-5 p-5 lg:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Chip color="accent" variant="soft">
                    Service Monitor
                  </Chip>
                  <Chip color={statusTone} variant="soft">
                    {isLoadingOnline
                      ? "Refreshing"
                      : offlineCount === 0
                        ? "Healthy"
                        : `${offlineCount} issue${offlineCount > 1 ? "s" : ""}`}
                  </Chip>
                </div>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                    Runtime status
                  </h1>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Chip variant="soft">{loaderData.message}</Chip>
                <Button className="shadow-sm" onPress={loadOnline}>
                  {isLoadingOnline ? (
                    <span className="flex items-center gap-2">
                      <Spinner size="sm" />
                      Refreshing
                    </span>
                  ) : (
                    "Refresh"
                  )}
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[1.4fr_repeat(3,132px)]">
              <Card className="border border-slate-200 bg-slate-50">
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.14em] text-slate-500">
                    <span>Availability</span>
                    <span>{isLoadingOnline ? "..." : `${healthPercent}%`}</span>
                  </div>
                  <ProgressBar
                    aria-label="Overall health"
                    color={offlineCount === 0 ? "success" : "danger"}
                    value={isLoadingOnline ? 8 : healthPercent}
                  />
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{onlineCount} up</span>
                    <span>{offlineCount} down</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-slate-200 bg-slate-50">
                <CardContent className="p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                    Services
                  </p>
                  <p className="mt-2 text-3xl font-semibold tabular-nums text-slate-950">
                    {loaderData.serverList.length}
                  </p>
                </CardContent>
              </Card>
              <Card className="border border-emerald-200 bg-emerald-50">
                <CardContent className="p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-emerald-700">
                    Healthy
                  </p>
                  {isLoadingOnline ? (
                    <Skeleton className="mt-2 h-9 w-16 rounded-lg" />
                  ) : (
                    <p className="mt-2 text-3xl font-semibold tabular-nums text-emerald-700">
                      {onlineCount}
                    </p>
                  )}
                </CardContent>
              </Card>
              <Card className="border border-red-300 bg-red-50 shadow-[0_0_0_1px_rgba(239,68,68,0.08)]">
                <CardContent className="p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-red-700">
                    Issues
                  </p>
                  {isLoadingOnline ? (
                    <Skeleton className="mt-2 h-9 w-16 rounded-lg" />
                  ) : (
                    <p className="mt-2 text-3xl font-semibold tabular-nums text-red-700">
                      {offlineCount}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className="text-slate-500">
                {lastCheckedAt
                  ? `Last check ${new Date(lastCheckedAt).toLocaleString()}`
                  : "Waiting for first check"}
              </div>
              {onlineError ? (
                <Chip color="danger" variant="soft">
                  {onlineError}
                </Chip>
              ) : null}
            </div>
          </div>
        </Surface>

        {failingServices.length > 0 ? (
          <Surface className="rounded-3xl border border-red-300 bg-red-50 shadow-[0_20px_40px_-32px_rgba(239,68,68,0.35)]">
            <div className="flex items-center justify-between gap-4 p-4">
              <div>
                <h2 className="text-lg font-semibold text-red-900">
                  Needs immediate attention
                </h2>
                <p className="text-sm text-red-700">
                  异常服务已自动提升到最前面。
                </p>
              </div>
              <Chip color="danger" variant="soft">
                {failingServices.length} failing
              </Chip>
            </div>
          </Surface>
        ) : null}

        <div className="grid gap-3">
          {orderedServerList.map((item) => {
            const online = onlineMap.get(item.website);
            const isResolved = online !== undefined;
            const isOnline = online?.online === true;
            const hostname = getHostname(item.website);
            const statusLabel = !isResolved
              ? "Pending"
              : isOnline
                ? "Operational"
                : "Unavailable";
            const statusValue = !isResolved ? 20 : isOnline ? 100 : 18;
            const cardClassName = isOnline
              ? "border-slate-200 bg-white"
              : !isResolved
                ? "border-slate-200 bg-white"
                : "border-red-400 bg-[linear-gradient(180deg,#fff1f2_0%,#ffffff_100%)] shadow-[0_0_0_1px_rgba(248,113,113,0.15),0_20px_40px_-28px_rgba(239,68,68,0.45)]";

            return (
              <Card
                key={item.website}
                className={`border shadow-sm ${cardClassName}`}
              >
                <CardContent className="p-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="min-w-0">
                        <CardTitle className="truncate text-sm text-slate-950">
                          {item.name}
                        </CardTitle>
                        <CardDescription className="truncate text-xs text-slate-500">
                          {hostname}
                        </CardDescription>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 lg:max-w-[260px]">
                      <ProgressBar
                        aria-label={`${item.name} health`}
                        color={isOnline ? "success" : "danger"}
                        value={statusValue}
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
                      {!isResolved ? (
                        <Chip size="sm" variant="soft">
                          <span className="flex items-center gap-1.5">
                            <Spinner size="sm" />
                            Checking
                          </span>
                        </Chip>
                      ) : (
                        <Chip
                          color={isOnline ? "success" : "danger"}
                          size="sm"
                          variant="soft"
                        >
                          {statusLabel}
                        </Chip>
                      )}
                      <Chip size="sm" variant="soft">
                        {!isResolved ? (
                          <Skeleton className="h-4 w-10 rounded-md" />
                        ) : (
                          <span
                            className={
                              isOnline ? "text-slate-950" : "text-red-700"
                            }
                          >
                            {online?.statusCode ?? "--"}
                          </span>
                        )}
                      </Chip>
                      <Link
                        href={item.website}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </main>
  );
}
