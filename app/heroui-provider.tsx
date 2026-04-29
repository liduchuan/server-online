import { RouterProvider } from "@heroui/react";
import type { ReactNode } from "react";
import { useHref, useNavigate } from "react-router";

export function HeroUIProvider({ children }: { children: ReactNode }) {
	const navigate = useNavigate();

	return (
		<RouterProvider navigate={navigate} useHref={useHref}>
			{children}
		</RouterProvider>
	);
}
