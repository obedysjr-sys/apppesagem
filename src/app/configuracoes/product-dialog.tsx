"use client"

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { supabase as supabaseClient, hasSupabaseEnv } from "@/lib/supabase";

const productSchema = z.object({
  cod_produto: z.string().min(1, "Informe o código do produto."),
  descricao: z.string().min(1, "Informe a descrição."),
  unid: z.string().optional(),
  categoria: z.string().optional(),
  familia: z.string().optional(),
  grupo_produto: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export function ProductDialog({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (o: boolean) => void }) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      cod_produto: "",
      descricao: "",
      unid: "",
      categoria: "",
      familia: "",
      grupo_produto: "",
    }
  });

  useEffect(() => {
    if (!isOpen) form.reset();
  }, [isOpen]);

  const onSubmit = async (values: ProductFormValues) => {
    try {
      if (!hasSupabaseEnv) {
        toast.warning('Supabase não configurado.');
        return;
      }
      const { data, error } = await supabaseClient
        .from('produtos')
        .insert({
          cod_produto: values.cod_produto,
          descricao: values.descricao,
          unid: values.unid ? Number(values.unid) : null,
          categoria: values.categoria || null,
          familia: values.familia || null,
          grupo_produto: values.grupo_produto || null,
        })
        .select('*')
        .single();
      if (error) throw error;
      toast.success('Produto cadastrado com sucesso.');
      onOpenChange(false);
    } catch (err) {
      console.warn('Falha ao cadastrar produto:', err);
      toast.error('Erro ao cadastrar produto no Supabase.');
    }
  };

  return (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent 
      className="
        w-[95vw] 
        max-w-full 
        sm:max-w-[520px] 
        p-4 sm:p-6 
        overflow-hidden
      "
    >
      <Form {...form}>
        <form 
          onSubmit={form.handleSubmit(onSubmit as any)} 
          className="w-full max-w-full"
        >
          <DialogHeader>
            <DialogTitle>Cadastro de Produto</DialogTitle>
            <DialogDescription>
              Inclua um novo produto no catálogo (Supabase).
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 w-full max-w-full">

            <FormField
              name="cod_produto"
              control={form.control as any}
              render={({ field }) => (
                <FormItem className="w-full max-w-full">
                  <FormLabel>Código do Produto</FormLabel>
                  <FormControl>
                    <Input {...field} className="w-full min-w-0" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="descricao"
              control={form.control as any}
              render={({ field }) => (
                <FormItem className="w-full max-w-full">
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input {...field} className="w-full min-w-0" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="unid"
              control={form.control as any}
              render={({ field }) => (
                <FormItem className="w-full max-w-full">
                  <FormLabel>Unid</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ex.: 5 (opcional)"
                      {...field}
                      className="w-full min-w-0"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="categoria"
              control={form.control as any}
              render={({ field }) => (
                <FormItem className="w-full max-w-full">
                  <FormLabel>Categoria</FormLabel>
                  <FormControl>
                    <Input {...field} className="w-full min-w-0" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="familia"
              control={form.control as any}
              render={({ field }) => (
                <FormItem className="w-full max-w-full">
                  <FormLabel>Família</FormLabel>
                  <FormControl>
                    <Input {...field} className="w-full min-w-0" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="grupo_produto"
              control={form.control as any}
              render={({ field }) => (
                <FormItem className="w-full max-w-full">
                  <FormLabel>Grupo Produto</FormLabel>
                  <FormControl>
                    <Input {...field} className="w-full min-w-0" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

          </div>

          <DialogFooter className="w-full max-w-full flex justify-between">
            <Button 
              type="button" 
              variant="ghost"
              className="w-full sm:w-auto"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>

            <Button 
              type="submit"
              className="w-full sm:w-auto"
            >
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  </Dialog>
);
}
