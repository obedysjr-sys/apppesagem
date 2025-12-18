'use client';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { RegistroPeso } from "@/types"
import { supabase, hasSupabaseEnv } from "@/lib/supabase"
import { toast } from "sonner"
import { useState, useEffect } from "react"

interface DeleteRegistroDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    registro: RegistroPeso
}

export function DeleteRegistroDialog({ open, onOpenChange, registro }: DeleteRegistroDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        if (open) {
            console.log("DeleteRegistroDialog mounted/opened for registro:", registro.id);
        }
    }, [open, registro.id]);

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault() // Previne comportamentos inesperados
        setIsDeleting(true)
        console.log("Tentando excluir registro:", registro.id);
        
        if (!hasSupabaseEnv) {
            toast.error("Supabase não está configurado");
            setIsDeleting(false);
            return;
        }

        try {
            console.log("Deleting registro with ID:", registro.id);
            
            const { data, error } = await supabase
                .from('registros_peso')
                .delete()
                .eq('id', registro.id)
                .select();
            
            if (error) {
                console.error("Erro Supabase:", error);
                toast.error(`Erro ao excluir: ${error.message}`);
                throw error;
            }
            
            if (!data || data.length === 0) {
                console.error("Nenhum registro foi excluído");
                toast.error("Nenhum registro foi encontrado para excluir");
                throw new Error("Nenhum registro excluído");
            }
            
            console.log("Registro excluído com sucesso:", data);
            toast.success("Registro excluído com sucesso")
            onOpenChange(false)
        } catch (error: any) {
            console.error("Catch error:", error)
            const errorMessage = error?.message || "Erro desconhecido ao excluir registro";
            toast.error(errorMessage)
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente o registro de pesagem do sistema.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Não</AlertDialogCancel>
                    <Button 
                        onClick={handleDelete} 
                        className="bg-red-600 hover:bg-red-700 text-white"
                        disabled={isDeleting}
                    >
                        {isDeleting ? "Excluindo..." : "Sim, excluir"}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
