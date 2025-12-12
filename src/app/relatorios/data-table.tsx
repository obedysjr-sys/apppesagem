"use client"

import * as React from 'react'
import {
  flexRender,
  Table as TanstackTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { PesagemModal } from "./pesagem-modal"

interface DataTableProps<TData> {
  table: TanstackTable<TData>
}

export function DataTable<TData>({
  table,
}: DataTableProps<TData>) {

  const [open, setOpen] = React.useState(false)
  const [recordId, setRecordId] = React.useState<string | number | null>(null)

  return (
    <div className="rounded-md border overflow-x-auto w-full">
      <Table className="min-w-max">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id} style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}>
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
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </TableCell>
                ))}
                <TableCell>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const original = row.original as { id?: string | number }
                      setRecordId(original?.id ?? null)
                      setOpen(true)
                    }}
                  >
                    Ver Pesagem
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={table.getAllColumns().length}
                className="h-24 text-center"
              >
                Nenhum resultado encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <PesagemModal
        open={open}
        onOpenChange={setOpen}
        recordId={recordId ?? ''}
      />
    </div>
  )
}
