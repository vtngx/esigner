"use client"

import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import dayjs from "dayjs"
import * as React from "react"
import { toast } from "sonner"
import { CSS } from "@dnd-kit/utilities"
import { ActionLog } from "@/types/logs"
import UploadDocumentModal from "./dropzone"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { type UniqueIdentifier } from "@dnd-kit/core"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Columns3Icon, ChevronDownIcon, ChevronsLeftIcon, ChevronLeftIcon, ChevronRightIcon, ChevronsRightIcon, PlusIcon, Clipboard, Copy, Check } from "lucide-react"

type P = {
  data: ActionLog[],
}

const pageSizeOptions = [10, 20, 30, 40, 50];

const columns: ColumnDef<ActionLog>[] = [
  {
    id: "index",
    header: () => null,
    cell: ({ row }) => <div className="text-gray-500 text-xs pl-2">#{row.index + 1}</div>,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={
            table.getIsSomePageRowsSelected() &&
            !table.getIsAllPageRowsSelected()
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => (
      <Badge variant="outline" className="px-1.5 text-muted-foreground">
        {row.original.action}
      </Badge>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "user",
    header: () => "User",
    cell: ({ row }) => (
      <div className="">
        {row.original.user.username}
      </div>
    ),
  },
  {
    accessorKey: "entity",
    header: "Entity",
    cell: ({ row }) => (
      <div className="">
        {row.original.entity}
      </div>
    ),
  },
  {
    accessorKey: "entityId",
    header: "Entity ID",
    cell: ({ row }) => {
      const [isCopied, setIsCopied] = React.useState(false);
      const handleCopy = async () => {
        try {
          const msg = row.original.entityId;
          if (!msg) throw 'Message empty';
          await navigator.clipboard.writeText(msg);
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
          toast.success('Entity ID copied to clipboard!');
        } catch (err) {
          console.error('Failed to copy text: ', err);
          toast.error('Failed to copy entity ID!');
        }
      };
      return <div className="flex gap-2 items-center">
        <Badge variant="outline" className="px-1.5 text-muted-foreground">
          {row.original.entityId?.slice(0, 4)}...{row.original.entityId?.slice(-6)}
        </Badge>
        <Button variant={isCopied ? 'default' : 'outline'} className='size-6' onClick={handleCopy} disabled={isCopied}>
          {isCopied
            ? <Check className="size-3" strokeWidth={2} />
            : <Copy className="size-3" strokeWidth={1.5} />
          }
        </Button>
      </div>
    },
  },
  {
    accessorKey: "createdAt",
    header: "Timestamp",
    cell: ({ row }) => {
      return (
        <div className="text-left">
          {dayjs(row.original.createdAt).format('DD/MM/YYYY HH:mm')}
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          {/* <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="flex size-8 text-muted-foreground data-open:bg-muted"
                size="icon"
              />
            }
          >
            <EllipsisVerticalIcon />
            <span className="sr-only">Open menu</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            {row.original.status === DocumentStatus.ANCHORED && (
              <DropdownMenuItem disabled={isPendingExport} onClick={handleExport}>Export</DropdownMenuItem>
            )}
            {row.original.isOwner && <>
              <DropdownMenuItem disabled={isPendingVerify} onClick={handleVerify}>Verify</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" disabled={isPendingDelete} onClick={handleDelete}>Delete</DropdownMenuItem>
            </>}
          </DropdownMenuContent> */}
        </DropdownMenu>
      );
    },
  },
]
function DraggableRow({ row }: { row: Row<ActionLog> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })
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
  )
}
export function LogsTable({ data }: P) {
  const [showUpload, setShowUpload] = React.useState(false)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: pageSizeOptions[0],
  })
  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data]
  )
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
  })
  return (
    <Tabs
      defaultValue="outline"
      className="w-full flex-col justify-start gap-3"
    >
      <div className="flex items-center justify-between">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <div className="flex items-center gap-2 ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" size="sm" />}
            >
              <Columns3Icon data-icon="inline-start" />
              Columns
              <ChevronDownIcon data-icon="inline-end" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
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
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          {showUpload && (
            <UploadDocumentModal
              open={showUpload}
              onClose={() => setShowUpload(false)}
            />
          )}
        </div>
      </div>
      <TabsContent
        value="outline"
        className="relative flex flex-col gap-4 overflow-auto"
      >
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </TableHead>
                    )
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
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
                items={pageSizeOptions.map((pageSize) => ({
                  label: `${pageSize}`,
                  value: `${pageSize}`,
                }))}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  <SelectGroup>
                    {pageSizeOptions.map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeftIcon />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeftIcon />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRightIcon />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRightIcon />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent
        value="past-performance"
        className="flex flex-col"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent value="key-personnel" className="flex flex-col">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent
        value="focus-documents"
        className="flex flex-col"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
    </Tabs>
  )
}
