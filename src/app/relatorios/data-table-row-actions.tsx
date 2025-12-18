"use client"

import { Row } from "@tanstack/react-table"
import { MoreHorizontal, Pen, Trash, Share2, Mail } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { RegistroPeso } from "@/types"
import { DeleteRegistroDialog } from "./delete-registro-dialog"
import { EditRegistroDialog } from "./edit-registro-dialog"
import { ShareWhatsAppDialog } from "./share-whatsapp-dialog"
import { SendEmailDialog } from "./send-email-dialog"

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false)
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const registro = row.original as RegistroPeso

  return (
    <>
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
            >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Abrir menu</span>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuItem onSelect={() => setShowEditDialog(true)}>
            <Pen className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setShowWhatsAppDialog(true)}>
            <Share2 className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Compartilhar WhatsApp
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setShowEmailDialog(true)}>
            <Mail className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Enviar Email
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setShowDeleteDialog(true)}>
            <Trash className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Excluir
            </DropdownMenuItem>
        </DropdownMenuContent>
        </DropdownMenu>
        
        {showDeleteDialog && (
            <DeleteRegistroDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                registro={registro}
            />
        )}
        
        {showEditDialog && (
            <EditRegistroDialog
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
                registro={registro}
            />
        )}
        
        {showWhatsAppDialog && (
            <ShareWhatsAppDialog
                open={showWhatsAppDialog}
                onOpenChange={setShowWhatsAppDialog}
                registro={registro}
            />
        )}
        
        {showEmailDialog && (
            <SendEmailDialog
                open={showEmailDialog}
                onOpenChange={setShowEmailDialog}
                registro={registro}
            />
        )}
    </>
  )
}
