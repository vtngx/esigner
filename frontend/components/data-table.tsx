"use client"

import * as React from "react"
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
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
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
import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
} from "@/components/ui/tabs"
import { CircleCheckIcon, LoaderIcon, EllipsisVerticalIcon, Columns3Icon, ChevronDownIcon, ChevronsLeftIcon, ChevronLeftIcon, ChevronRightIcon, ChevronsRightIcon, PlusIcon, X, Plus, Pen, Signature, Bitcoin, Anchor } from "lucide-react"
import { Document, DocumentStatus } from "@/types/document"
import { useSigners, useUser } from "@/hooks/use-user"
import dayjs from "dayjs"
import { useAnchorDoc, useDeleteDoc, useDocuments, useExportDoc, useSignDoc, useUpdateSigners, useVerifyDoc } from "@/hooks/use-documents"
import UploadDocumentModal from "./dropzone"
import { useSummary } from "@/hooks/use-summary"
import { useConnection, useSignMessage } from "wagmi"
import { useConnectModal } from "@rainbow-me/rainbowkit"
import { toast } from "sonner"

const columns: ColumnDef<Document>[] = [
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
    accessorKey: "name",
    header: "Header",
    cell: ({ row }) => {
      return <TableCellViewer item={row.original} />
    },
    enableHiding: false,
  },
  {
    accessorKey: "role",
    header: () => "Role",
    cell: ({ row }) => (<>
      {row.original.isOwner && (
        <Badge variant="outline" className="px-1.5 text-muted-foreground mr-2">
          {'Owner'}
        </Badge>
      )}
      {row.original.isSigner && (
        <Badge variant="outline" className="px-1.5 text-muted-foreground">
          {'Signer'}
        </Badge>
      )}
    </>),
  },
  {
    accessorKey: "signers",
    header: () => "Signers",
    cell: ({ row }) => (
      <div className="">
        {row.original.signers?.filter(s => !!s.signatureHex && !!s.signedAt)?.length || 0}/{row.original.signers?.length || 0} signed
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant="outline" className="px-1.5 text-muted-foreground text-xs">
        {row.original.status === DocumentStatus.ANCHORED ? (
          <CircleCheckIcon className="fill-green-500 dark:fill-green-400" />
        ) : (<LoaderIcon />)}
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "owner",
    header: "Owner",
    cell: ({ row }) => {
      return (
        <div className="text-left">
          {row.original.owner?.username}
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const { refetch: refetchDocs } = useDocuments()
      const { refetch: refetchSummary } = useSummary()
      const { mutateAsync: verifyDoc, isPending: isPendingVerify } = useVerifyDoc();
      const { mutateAsync: deleteDoc, isPending: isPendingDelete } = useDeleteDoc();
      const { mutateAsync: exportDoc, isPending: isPendingExport } = useExportDoc();

      const handleVerify = async () => {
        try {
          await verifyDoc({ documentId: row.original.id });
          await refetchDocs();
          await refetchSummary();
          toast.success('Verify doc successfully!');
        } catch (error) {
          console.error('Failed to verify doc', error)
          toast.error('Failed to verify doc');
        }
      }

      const handleDelete = async () => {
        try {
          await deleteDoc({ documentId: row.original.id });
          await refetchDocs();
          await refetchSummary();
          toast.success('Delete doc successfully!');
        } catch (error) {
          console.error('Failed to delete doc', error)
          toast.error('Failed to delete doc');
        }
      }

      const handleExport = async () => {
        try {
          const blob = await exportDoc({ documentId: row.original.id });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `document-${row.original.id}.pdf`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
          toast.success('Export doc successfully!');
        } catch (error) {
          console.error('Failed to export doc', error);
          toast.error('Failed to export doc');
        }
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger
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
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
]
function DraggableRow({ row }: { row: Row<Document> }) {
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
export function DataTable({ data }: { data: Document[] }) {
  const [showUpload, setShowUpload] = React.useState(false)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
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
          <Button variant="default" size="sm" onClick={() => setShowUpload(!showUpload)}>
            <PlusIcon />
            <span className="hidden lg:inline">Upload Document</span>
          </Button>
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
                items={[10, 20, 30, 40, 50].map((pageSize) => ({
                  label: `${pageSize}`,
                  value: `${pageSize}`,
                }))}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  <SelectGroup>
                    {[10, 20, 30, 40, 50].map((pageSize) => (
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
                <ChevronsLeftIcon
                />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeftIcon
                />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRightIcon
                />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRightIcon
                />
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
function TableCellViewer({ item }: { item: Document }) {
  const isMobile = useIsMobile()
  const signMessage = useSignMessage()
  const { isConnected } = useConnection()

  const { data: user } = useUser()
  const { data: signers } = useSigners()
  const { refetch: refetchDocs } = useDocuments()
  const { refetch: refetchSummary } = useSummary()
  const { mutateAsync: signDoc, isPending: isPendingSigning } = useSignDoc()
  const { mutateAsync: anchorDoc, isPending: isPendingAnchoring } = useAnchorDoc()
  const { mutateAsync: updateSigners, isPending: isPendingUpdateSigners } = useUpdateSigners()

  const [showSigners, setShowSigners] = React.useState(false)
  const [showConnectWarning, setShowConnectWarning] = React.useState(false)
  const [selectedSigners, setSelectedSigners] = React.useState<string[]>([])

  const toggleSignersSelector = () => {
    if (showSigners) setSelectedSigners([]);
    setShowSigners(!showSigners);
  }

  const handleUpdateSigners = async () => {
    try {
      await updateSigners({
        documentId: item.id,
        signers: selectedSigners,
      });
      setShowSigners(false);
      setSelectedSigners([]);
      toast.success('Assigned signers successfully');
      await refetchDocs();
      await refetchSummary();
    } catch (error) {
      console.error('Failed to update signers', error)
      toast.error('Failed to update signers');
    }
  }

  const handleSign = async () => {
    try {
      if (!isConnected) {
        setShowConnectWarning(true);
        return;
      }

      const signature = await signMessage.mutateAsync({
        message: item.documentHash,
      })
      await signDoc({
        documentId: item.id,
        signature,
      });
      toast.success('Signed doc successfully');
      await refetchDocs();
      await refetchSummary();
    } catch (error) {
      console.error('Failed to perform signing', error)
      toast.error('Failed to perform signing');
    }
  }

  const handleAnchor = async () => {
    try {
      if (!isConnected) {
        setShowConnectWarning(true);
        return;
      }

      await anchorDoc({ documentId: item.id });
      toast.success('Anchored doc successfully');
      await refetchDocs();
      await refetchSummary();
    } catch (error) {
      console.error('Failed to perform anchoring', error)
      toast.error('Failed to perform anchoring');
    }
  }

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger>{item.name}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle className="hover:underline">{item.name}</DrawerTitle>
          <DrawerDescription>
            Document details & signing status
          </DrawerDescription>
          <DrawerDescription>
            Created: {dayjs(item.createdAt).format('DD/MM/YYYY hh:mmA')}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 py-6 text-sm">
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue={item.name} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="type">Type</Label>
                <Input id="type" defaultValue={[item.isOwner && 'Owner', item.isSigner && 'Signer'].filter(i => !!i).join(',')} readOnly />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="status">Status</Label>
                <Input id="status" defaultValue={item.status} readOnly />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="owner">Owner</Label>
              <Input id="owner" defaultValue={`${item.owner.username} ${item.isOwner ? '(me)' : ''}`} readOnly />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="signers">Signers</Label>
              {item.signers?.length
                ? <div className="flex items-center gap-2.5">
                  {item.signers.map(s => (
                    <Badge key={s.id} variant="outline" className="h-8 rounded-lg min-w-16 px-1.5 text-black gap-1.5">
                      {s.user.username}
                      {(!!s.signatureHex && !!s.signedAt) && (
                        <CircleCheckIcon className="fill-green-500 dark:fill-green-400" />
                      )}
                    </Badge>
                  ))}
                </div>
                : <div className="flex items-center justify-between gap-2.5 h-8">
                  <span className="text-muted-foreground text-xs rounded-lg border h-8 px-2.5 flex items-center flex-1">
                    This document has no assigned signers
                  </span>
                  {item.isOwner && <Button variant={showSigners ? 'outline' : 'default'} onClick={toggleSignersSelector}>
                    {showSigners ? <X /> : <Plus />}
                  </Button>}
                </div>
              }
              {showSigners && (
                <div className="flex flex-col gap-3">
                  <div className="border rounded-md p-3 space-y-2">
                    {signers?.map((signer) => (
                      <label key={signer.id} className="flex items-center gap-2" style={{ opacity: !signer.wallets.length ? 0.5 : 1 }}>
                        <Checkbox
                          disabled={!signer.wallets.length}
                          checked={selectedSigners.includes(signer.username)}
                          onCheckedChange={(e) => {
                            if (e) {
                              setSelectedSigners([...selectedSigners, signer.username])
                            } else {
                              setSelectedSigners(selectedSigners.filter((s) => s !== signer.username))
                            }
                          }}
                        />
                        {signer.username} {(signer.id === user?.id) && '(me)'}  <small>({signer.wallets.length} wallets)</small>
                      </label>
                    ))}
                  </div>
                  <Button
                    onClick={handleUpdateSigners}
                    disabled={!selectedSigners.length || isPendingUpdateSigners}
                  >
                    Save
                  </Button>
                </div>
              )}
            </div>
          </form>
        </div>
        <DrawerFooter className="mb-2">
          {showConnectWarning && (
            <div className="rounded-lg bg-muted mt-auto p-4 pr-6 text-muted-foreground text-sm relative">
              <Button className='absolute top-2 right-2 size-6 rounded-full bg-black/60' onClick={() => setShowConnectWarning(false)}><X /></Button>
              You need a connected wallet for this action, currently there's none.
              Please go to <a href="/profile" className="underline text-black">Profile Page</a> and connect a wallet first.
            </div>
          )}
          <div className="flex flex-row justify-center items-center gap-3">
            {(item.isSigner && !item.signers?.find(s => s.userId === user?.id)?.signatureHex) && (<Button
              className="flex items-center justify-center size-12 border rounded-full"
              onClick={handleSign}
              title="Sign"
              disabled={showConnectWarning || isPendingSigning}
            >
              <Signature size={24} strokeWidth={2} />
            </Button>)}
            {(item.isOwner && item.status === DocumentStatus.SIGNED) && (<Button
              className="flex items-center justify-center size-12 border rounded-full bg-teal-600"
              onClick={handleAnchor}
              title="Verify"
              disabled={isPendingAnchoring}
            >
              <Anchor size={24} strokeWidth={2} />
            </Button>)}
            <DrawerClose className="flex items-center justify-center size-12 border rounded-full cursor-pointer">
              <X size={20} strokeWidth={1.8} />
            </DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
