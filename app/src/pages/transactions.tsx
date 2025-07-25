import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { toast } from "sonner";
import { z } from "zod";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns3,
  GripVertical,
  Plus,
  TrendingUp,
} from "lucide-react";
import { RouterOutputs } from "../../../server/src/root";
import { useTranslation } from "react-i18next";
import { useEffect, useId, useMemo, useState } from "react";
import { useTRPC } from "@/utils/trpc";
import { useSuspenseQuery } from "@tanstack/react-query";

function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({
    id,
  });
  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <GripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}

function DraggableRow({ row }: { row: Row<QueryOutput> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  });
  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}
type QueryOutput = RouterOutputs["portfolio"]["transcations"][number];

export function Transactions() {
  const trpc = useTRPC();
  const { data: retreivedData } = useSuspenseQuery(
    trpc.portfolio.transcations.queryOptions(),
  );
  const [data, setData] = useState<QueryOutput[]>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const sortableId = useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {}),
  );
  const dataIds = useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data],
  );
  const { t } = useTranslation();
  const columns = useMemo(() => {
    const columns: ColumnDef<QueryOutput>[] = [
      {
        id: "drag",
        header: () => null,
        cell: ({ row }) => <DragHandle id={row.original.id} />,
        enableHiding: false,
      },
      {
        accessorKey: "id",
        header: t("transactions.columns.id"),
        cell: ({ row }) => <TableCellViewer item={row.original} />,
        enableHiding: false,
      },
      {
        accessorKey: "stockId",
        header: t("transactions.columns.stock"),
        cell: ({ row }) => (
          <span className="font-semibold">{row.getValue("stockId")}</span>
        ),
      },
      {
        accessorKey: "type",
        header: t("transactions.columns.type"),

        cell: ({ row }) => {
          const type = row.getValue("type") as string;
          const colorClass =
            type === "BUY"
              ? "bg-green-100 text-green-800"
              : type === "SELL"
                ? "bg-red-100 text-red-800"
                : "bg-blue-100 text-blue-800";

          return (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}
            >
              {type}
            </span>
          );
        },
      },
      {
        accessorKey: "quantity",
        header: t("transactions.columns.quantity"),
        cell: ({ row }) => {
          const quantity = row.getValue("quantity") as number;
          return (
            <span className="text-right font-mono">
              {quantity === 0 ? "-" : quantity.toLocaleString()}
            </span>
          );
        },
      },
      {
        accessorKey: "pricePerShare",
        header: t("transactions.columns.price"),

        cell: ({ row }) => {
          const price = row.getValue("pricePerShare") as number;
          return (
            <span className="text-right font-mono">${price.toFixed(2)}</span>
          );
        },
      },
      {
        accessorKey: "fee",
        header: t("transactions.columns.fee"),
        cell: ({ row }) => {
          const fee = row.getValue("fee") as number;
          return (
            <span className="text-right font-mono text-gray-600">
              ${fee.toFixed(2)}
            </span>
          );
        },
      },
      {
        accessorKey: "date",
        header: t("transactions.columns.date"),

        cell: ({ row }) => {
          const date = row.getValue("date") as Date;
          return <span className="text-sm">{date.toLocaleDateString()}</span>;
        },
        sortingFn: "datetime",
      },
      {
        accessorKey: "note",
        header: t("transactions.columns.note"),

        cell: ({ row }) => {
          const note = row.getValue("note") as string | null;
          return (
            <span className="text-sm text-gray-600 max-w-xs truncate">
              {note || "-"}
            </span>
          );
        },
      },
      {
        id: "totalValue",
        header: t("transactions.columns.total"),

        cell: ({ row }) => {
          const quantity = row.getValue("quantity") as number;
          const price = row.getValue("pricePerShare") as number;
          const fee = row.getValue("fee") as number;
          const type = row.getValue("type") as string;

          if (type === "DIVIDEND") {
            return (
              <span className="text-right font-mono">${price.toFixed(2)}</span>
            );
          }

          const total = quantity * price + fee;
          return (
            <span className="text-right font-mono font-semibold">
              ${total.toFixed(2)}
            </span>
          );
        },
      },
      {
        id: "actions",
        cell: () => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                size="icon"
              >
                <GripVertical />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem>
                {t("transactions.columns.edit.fav")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                {t("transactions.columns.edit.report")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ];
    return columns;
  }, []);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id);
        const newIndex = dataIds.indexOf(over.id);
        return arrayMove(data, oldIndex, newIndex);
      });
    }
  }
  useEffect(() => {
    setData(retreivedData);
  }, [retreivedData]);
  return (
    <Tabs
      defaultValue="outline"
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-end px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3 />
                <span className="hidden lg:inline">
                  {t("transactions.actions.customize")}
                </span>
                <span className="lg:hidden">
                  {t("transactions.actions.customizeMobile")}
                </span>
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide(),
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <AddDrawer />
        </div>
      </div>
      <TabsContent
        value="outline"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      {t("transactions.table.empty")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        <div className="flex items-center justify-end px-4">
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                {t("elements.table.rowPerPage")}
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              {t("elements.table.page")}{" "}
              {table.getState().pagination.pageIndex + 1} {t("generics.of")}{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <ChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent
        value="past-performance"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent value="key-personnel" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent
        value="focus-documents"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
    </Tabs>
  );
}

// This is a boilerplate drawer prediction for stock performance
const chartData = [
  { month: "January", value: 186, prediction: 80 },
  { month: "February", value: 305, prediction: 200 },
  { month: "March", value: 237, prediction: 120 },
  { month: "April", value: 73, prediction: 190 },
  { month: "May", value: 209, prediction: 130 },
  { month: "June", value: 214, prediction: 140 },
];
const chartConfig = {
  value: {
    label: "value",
    color: "var(--primary)",
  },
  prediction: {
    label: "prediction",
    color: "var(--secondary)",
  },
} satisfies ChartConfig;

function TableCellViewer({ item }: { item: QueryOutput }) {
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {item.id}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.stockId}</DrawerTitle>
          <DrawerDescription>
            {t("transactions.drawer.description")}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {!isMobile && (
            <>
              <ChartContainer config={chartConfig}>
                <AreaChart
                  accessibilityLayer
                  data={chartData}
                  margin={{
                    left: 0,
                    right: 10,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                    hide
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Area
                    dataKey="value"
                    type="natural"
                    fill="var(--color-value)"
                    fillOpacity={0.6}
                    stroke="var(--color-value)"
                    stackId="a"
                  />
                  <Area
                    dataKey="prediction"
                    type="natural"
                    fill="var(--color-prediction)"
                    fillOpacity={0.4}
                    stroke="var(--color-prediction)"
                    stackId="a"
                  />
                </AreaChart>
              </ChartContainer>
              <Separator />
              <div className="grid gap-2">
                <div className="flex gap-2 leading-none font-medium">
                  {t("transactions.drawer.trend")}

                  <TrendingUp className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  {t("transactions.drawer.info")}
                </div>
              </div>
              <Separator />
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function AddDrawer() {
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus />
          {t("transactions.actions.add")}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{t("transactions.addDrawer.title")}</DrawerTitle>
          <DrawerDescription>
            {t("transactions.addDrawer.description")}
          </DrawerDescription>
        </DrawerHeader>
      </DrawerContent>
    </Drawer>
  );
}
