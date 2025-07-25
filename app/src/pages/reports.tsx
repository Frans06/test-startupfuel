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
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns3,
  GripVertical,
  Plus,
  FileText,
  Calendar,
  Loader,
} from "lucide-react";
import { RouterOutputs } from "../../../server/src/root";
import { useTranslation } from "react-i18next";
import { ReactElement, useEffect, useId, useMemo, useState } from "react";
import { useTRPC, useTRPCClient } from "@/utils/trpc";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  RPConfig,
  RPDefaultLayout,
  RPPages,
  RPProvider,
} from "@pdf-viewer/react";
import { useForm } from "@tanstack/react-form";
import { generateReportValidator } from "@/utils/schemas";
import { toast } from "sonner";
import { getServerUrl } from "@/lib/utils";

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

type QueryOutput = RouterOutputs["portfolio"]["reports"][number];

export function Reports() {
  const trpc = useTRPC();
  const { data: retrievedData } = useSuspenseQuery(
    trpc.portfolio.reports.queryOptions(),
  );
  const deleteReport = useMutation(
    trpc.portfolio.deleteReport.mutationOptions(),
  );
  const clientTRPC = useQueryClient();
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
        header: t("reports.columns.id"),
        cell: ({ row }) => <TableCellViewer item={row.original} />,
        enableHiding: false,
      },
      {
        accessorKey: "period",
        header: t("reports.columns.period"),
        cell: ({ row }) => {
          const period = row.getValue("period") as string;
          return (
            <Badge variant="outline" className="font-medium">
              <Calendar className="mr-1 size-3" />
              {period}
            </Badge>
          );
        },
      },
      {
        accessorKey: "generatedAt",
        header: t("reports.columns.generatedAt"),
        cell: ({ row }) => {
          const date = row.getValue("generatedAt") as Date;
          return (
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {date.toLocaleDateString()}
              </span>
              <span className="text-xs text-muted-foreground">
                {date.toLocaleTimeString()}
              </span>
            </div>
          );
        },
        sortingFn: "datetime",
      },
      {
        accessorKey: "portfolioId",
        header: t("reports.columns.portfolio"),
        cell: ({ row }) => {
          const portfolioId = row.getValue("portfolioId") as string;
          return (
            <Badge variant="secondary" className="font-mono text-xs">
              {portfolioId}
            </Badge>
          );
        },
      },
      {
        id: "status",
        header: t("reports.columns.status"),
        cell: ({ row }) => {
          const generatedAt = row.getValue("generatedAt") as Date;
          const now = new Date();
          const daysDiff = Math.floor(
            (now.getTime() - generatedAt.getTime()) / (1000 * 60 * 60 * 24),
          );

          let statusColor = "bg-green-100 text-green-800";
          let statusText = t("reports.status.current");

          if (daysDiff > 30) {
            statusColor = "bg-red-100 text-red-800";
            statusText = t("reports.status.outdated");
          } else if (daysDiff > 7) {
            statusColor = "bg-yellow-100 text-yellow-800";
            statusText = t("reports.status.aging");
          }

          return (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}
            >
              {statusText}
            </span>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                size="icon"
              >
                <GripVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem asChild>
                <a
                  target={"_blank"}
                  href={getServerUrl() + "/" + row.original.uri}
                >
                  {t("reports.columns.edit.download")}
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() =>
                  (async () => {
                    await deleteReport.mutateAsync({ id: row.original.id });
                    await clientTRPC.invalidateQueries({
                      queryKey: trpc.portfolio.reports.queryKey(),
                    });
                    toast(t("reports.columns.toast.delete.success"));
                  })()
                }
              >
                {t("reports.columns.edit.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ];
    return columns;
  }, [t]);

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
    setData(retrievedData);
  }, [retrievedData]);

  return (
    <Tabs
      defaultValue="reports"
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-end px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3 />
                <span className="hidden lg:inline">
                  {t("reports.actions.customize")}
                </span>
                <span className="lg:hidden">
                  {t("reports.actions.customizeMobile")}
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
        value="reports"
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
                      {t("elements.table.empty")}
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
      <TabsContent value="analytics" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent value="trends" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
    </Tabs>
  );
}

const TableCellViewer = ({ item }: { item: QueryOutput }) => {
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
          <DrawerTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            {t("reports.drawer.title")} - {item.period}
          </DrawerTitle>
          <DrawerDescription>
            {t("reports.drawer.description")}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <div className="grid gap-3">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">
                {t("reports.drawer.id")}
              </Label>
              <p className="font-mono text-sm">{item.id}</p>
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">
                {t("reports.drawer.period")}
              </Label>
              <p className="text-sm">{item.period}</p>
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">
                {t("reports.drawer.generatedAt")}
              </Label>
              <p className="text-sm">{item.generatedAt?.toLocaleString()}</p>
            </div>
            {item.summary && (
              <div>
                <Label className="text-xs font-medium text-muted-foreground">
                  {t("reports.drawer.summary")}
                </Label>
                <p className="text-sm text-muted-foreground">{item.summary}</p>
              </div>
            )}
          </div>
        </div>
        <DrawerFooter>
          <div className="flex gap-2">
            <PDFViewer
              uri={getServerUrl() + "/" + item.uri}
              title={item.period}
            >
              <Button className="flex-1">
                <FileText className="mr-2 size-4" />
                {t("reports.drawer.actions.view")}
              </Button>
            </PDFViewer>
            <Button variant="outline" className="flex-1">
              <a target={"_blank"} href={getServerUrl() + "/" + item.uri}>
                {t("reports.drawer.actions.download")}
              </a>
            </Button>
          </div>
          <DrawerClose asChild>
            <Button variant="outline">{t("generics.close")}</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

const AddDrawer = () => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  const trpc = useTRPC();
  const client = useQueryClient();
  const { data: portfolios } = useQuery(
    trpc.portfolio.listPortfolios.queryOptions(),
  );
  const generateReport = useMutation(
    trpc.portfolio.generateReport.mutationOptions(),
  );

  const form = useForm({
    defaultValues: {
      period: "monthly" as "yearly" | "monthly",
      portfolioId: "",
      summary: "",
    },
    validators: {
      onChange: generateReportValidator,
    },
    onSubmit: async ({ value }) => {
      try {
        await generateReport.mutateAsync(value);
        setIsOpen(false);
        toast(t("reports.addDrawer.toast.success"));
        client.invalidateQueries({
          queryKey: trpc.portfolio.reports.queryKey(),
        });
      } catch (e) {
        toast.error(t("reports.addDrawer.toast.error"));
      }
    },
  });
  return (
    <Drawer
      direction={isMobile ? "bottom" : "right"}
      open={isOpen}
      onOpenChange={(v) => setIsOpen(v)}
    >
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus />
          {t("reports.actions.generate")}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{t("reports.addDrawer.title")}</DrawerTitle>
          <DrawerDescription>
            {t("reports.addDrawer.description")}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 px-4">
          <div className="grid gap-2">
            <Label htmlFor="report-period">
              {t("reports.addDrawer.period.label")}
            </Label>
            <form.Field name="period">
              {(field) => (
                <Select
                  value={field.state.value}
                  onOpenChange={field.handleBlur}
                  onValueChange={(e) =>
                    field.handleChange(e as "yearly" | "monthly")
                  }
                >
                  <SelectTrigger id="report-period">
                    <SelectValue
                      placeholder={t("reports.addDrawer.period.select")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">
                      {t("reports.addDrawer.period.monthly")}
                    </SelectItem>
                    <SelectItem value="yearly">
                      {t("reports.addDrawer.period.yearly")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </form.Field>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="report-portfolio">
              {t("reports.addDrawer.portfolio.label")}
            </Label>
            <form.Field name="portfolioId">
              {(field) => (
                <Select
                  value={field.state.value}
                  onOpenChange={field.handleBlur}
                  onValueChange={(e) =>
                    field.handleChange(e as "yearly" | "monthly")
                  }
                >
                  <SelectTrigger id="report-porfolio">
                    <SelectValue
                      placeholder={t("reports.addDrawer.portfolio.select")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {portfolios?.map((p) => {
                      return <SelectItem value={p.id}>{p.name}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              )}
            </form.Field>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="report-summary">
              {t("reports.addDrawer.summary.label")}
            </Label>
            <form.Field name="summary">
              {(field) => (
                <Input
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  id="report-summary"
                  placeholder={t("reports.addDrawer.summary.placeholder")}
                />
              )}
            </form.Field>
          </div>
        </div>
        <DrawerFooter>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => {
              return (
                <Button
                  onClick={form.handleSubmit}
                  disabled={!canSubmit || isSubmitting}
                >
                  {isSubmitting ? <Loader /> : t("reports.actions.generate")}
                </Button>
              );
            }}
          </form.Subscribe>
          <DrawerClose asChild>
            <Button variant="outline">{t("generics.cancel")}</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

const PDFViewer = ({
  uri,
  title,
  children,
}: {
  uri: string;
  title: string;
  children: ReactElement;
}) => {
  const { t } = useTranslation();
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <RPConfig>
          <RPProvider src={uri}>
            <RPDefaultLayout style={{ height: "660px" }}>
              <RPPages />
            </RPDefaultLayout>
          </RPProvider>
        </RPConfig>
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              {t("generics.close")}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
