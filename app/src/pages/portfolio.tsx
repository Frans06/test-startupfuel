import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingDown, TrendingUp } from "lucide-react";

import { Area, AreaChart, CartesianGrid, Pie, PieChart, XAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect, useState } from "react";
import { useTRPC } from "@/utils/trpc";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

const chartConfig = {
  balance: {
    color: "var(--primary)",
    label: "Balance",
  },
} satisfies ChartConfig;

export function Dashboard() {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = useState("90d");
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.portfolio.getPortfolio.queryOptions());
  const { t } = useTranslation();
  useEffect(() => {
    if (isMobile) {
      setTimeRange("7d");
    }
  }, [isMobile]);
  const filteredData = data.graph.slice(
    data.graph.length -
      (timeRange === "90d" ? 90 : timeRange === "30d" ? 30 : 7),
  );
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
          <Card className="@container/card">
            <CardHeader>
              <CardDescription>{t("dashboard.total")}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                ${data.totalInvested}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="@container/card">
            <CardHeader>
              <CardDescription>{t("dashboard.currentValue")}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                ${data.currentTotalValue}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  {data.currentTotalValue - data.totalInvested >= 0 ? (
                    <TrendingUp />
                  ) : (
                    <TrendingDown />
                  )}
                  {Math.round(
                    ((data.currentTotalValue - data.totalInvested) /
                      data.totalInvested) *
                      100,
                  )}
                  %
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                {`${t("dashboard.gain")} ${data.currentTotalValue - data.totalInvested}`}
                {data.currentTotalValue - data.totalInvested >= 0 ? (
                  <TrendingUp className="size-4" />
                ) : (
                  <TrendingDown className="size-4" />
                )}
              </div>
            </CardFooter>
          </Card>

          <Card className="@container/card flex flex-col">
            <CardHeader className="items-center pb-0">
              <CardDescription>{t("dashboard.pie.title")}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
              <ChartContainer
                config={chartConfig}
                className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square max-h-[250px] pb-0"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={data.portfolios.map((p) => {
                      return { name: p.name, value: p.currentValue };
                    })}
                    dataKey="value"
                  />
                </PieChart>
              </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
              <div className="flex items-center gap-2 leading-none font-medium">
                Trending up by 5.2% this month{" "}
                <TrendingUp className="h-4 w-4" />
              </div>
            </CardFooter>
          </Card>
        </div>

        <div className="px-4 lg:px-6">
          <Card className="@container/card">
            <CardHeader>
              <CardTitle>{t("dashboard.graph.title")}</CardTitle>
              <CardDescription>
                <span className="hidden @[540px]/card:block">
                  {timeRange === "90d"
                    ? t("dashboard.graph.totalLastMonths")
                    : timeRange === "30d"
                      ? t("dashbaord.graph.totalLastDays")
                      : t("dashboard.graph.totalLastWeek")}
                </span>
                <span className="@[540px]/card:hidden">{t("")}</span>
              </CardDescription>
              <CardAction>
                <ToggleGroup
                  type="single"
                  value={timeRange}
                  onValueChange={setTimeRange}
                  variant="outline"
                  className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
                >
                  <ToggleGroupItem value="90d">
                    {t("dashboard.graph.lastMonths")}
                  </ToggleGroupItem>
                  <ToggleGroupItem value="30d">
                    {t("dashboard.graph.lastDays")}
                  </ToggleGroupItem>
                  <ToggleGroupItem value="7d">
                    {t("dashboard.graph.lastWeek")}
                  </ToggleGroupItem>
                </ToggleGroup>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger
                    className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
                    size="sm"
                    aria-label="Select a value"
                  >
                    <SelectValue placeholder="Last 3 months" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="90d" className="rounded-lg">
                      {t("dashbaord.graph.lastMonths")}
                    </SelectItem>
                    <SelectItem value="30d" className="rounded-lg">
                      {t("dashbaord.graph.lastDays")}
                    </SelectItem>
                    <SelectItem value="7d" className="rounded-lg">
                      {t("dashbaord.graph.lastWeek")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </CardAction>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
              <ChartContainer
                config={chartConfig}
                className="aspect-auto h-[250px] w-full"
              >
                <AreaChart data={filteredData}>
                  <defs>
                    <linearGradient
                      id="fillBalance"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="var(--color-balance)"
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-balance)"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      });
                    }}
                  />
                  <ChartTooltip
                    cursor={false}
                    defaultIndex={isMobile ? -1 : 10}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => {
                          return new Date(value).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          });
                        }}
                        indicator="dot"
                      />
                    }
                  />
                  <Area
                    dataKey="price"
                    type="natural"
                    fill="url(#fillBalance)"
                    stroke="var(--color-balance)"
                    stackId="a"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
