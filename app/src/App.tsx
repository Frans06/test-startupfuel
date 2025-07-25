import {
  QueryClient,
  QueryClientProvider,
  QueryErrorResetBoundary,
} from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, loggerLink } from "@trpc/client";
import { Suspense, useState } from "react";
import { TRPCProvider } from "./utils/trpc";
import type { AppRouter } from "../../server/src/root";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router";
import { useSession } from "./lib/auth";
import { Toaster } from "@/components/ui/sonner";
import { LoginForm } from "./pages/auth/login";
import { SignUpForm } from "./pages/auth/signup";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "./components/ui/sidebar";
import { AppSidebar } from "./components/elements/sidebar";
import { Loader } from "lucide-react";
import { Separator } from "./components/ui/separator";
import { useTranslation } from "react-i18next";
import { Session } from "better-auth/*";
import { Reports } from "./pages/reports";
import { Transactions } from "./pages/transactions";
import { Dashboard } from "./pages/portfolio";
import { ErrorBoundary } from "react-error-boundary";
import { Button } from "./components/ui/button";

import superjson from "superjson";
import { getServerUrl } from "./lib/utils";

export function App() {
  const [trpcQueryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        loggerLink(),
        httpBatchLink({
          url: getServerUrl() + "/trpc",
          transformer: superjson,
          fetch(url, options) {
            return fetch(url, {
              ...options,
              credentials: "include",
            });
          },
        }),
      ],
    }),
  );
  const { isPending, data } = useSession();
  return (
    <QueryClientProvider client={trpcQueryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={trpcQueryClient}>
        <Toaster />
        <Routes>
          <Route
            element={
              <ProtectedNavRoute user={data?.session} isPending={isPending} />
            }
          >
            <Route index element={<Navigate replace to={"portfolio"} />} />
            <Route path={"portfolio"} element={<Dashboard />} />
            <Route path={"reports"} element={<Reports />} />
            <Route path={"transactions"} element={<Transactions />} />
          </Route>
          <Route path={"auth"}>
            <Route index path="login" element={<LoginForm />} />
            <Route path="signup" element={<SignUpForm />} />
          </Route>
          <Route path="*" element={<p>There's nothing here: 404!</p>} />
        </Routes>
      </TRPCProvider>
    </QueryClientProvider>
  );
}

type ProtectedRouteProps = {
  user?: Session;
  isPending: boolean;
  redirectPath?: string;
  children?: React.ReactNode;
};

export const ProtectedNavRoute = ({
  user,
  isPending,
  redirectPath = "/auth/signup",
  children,
}: ProtectedRouteProps) => {
  const { t } = useTranslation();
  const location = useLocation();
  if (!isPending && !user) {
    return <Navigate to={redirectPath} replace />;
  }
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <h1 className="text-base font-medium">
              {t(`elements.navbar.${location.pathname.split("/").at(-1)}`, "")}
            </h1>
          </div>
        </header>
        <QueryErrorResetBoundary>
          {({ reset }) => (
            <ErrorBoundary
              onReset={reset}
              fallbackRender={({ resetErrorBoundary }) => (
                <div className="flex h-full flex-col gap-4 w-full items-center justify-center">
                  {t("error.network.generic")}
                  <Button onClick={() => resetErrorBoundary()}>
                    {t("generics.reload")}
                  </Button>
                </div>
              )}
            >
              <Suspense fallback={<LoaderPage />}>
                <main>
                  {isPending ? (
                    <LoaderPage />
                  ) : children ? (
                    children
                  ) : (
                    <Outlet />
                  )}
                </main>
              </Suspense>
            </ErrorBoundary>
          )}
        </QueryErrorResetBoundary>
      </SidebarInset>
    </SidebarProvider>
  );
};

export const LoaderPage = () => {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Loader />
    </div>
  );
};
