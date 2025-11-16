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
      <DialogContent className="sm:max-w-[520px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit as any)}>
            <DialogHeader>
              <DialogTitle>Cadastro de Produto</DialogTitle>
              <DialogDescription>Inclua um novo produto no catálogo (Supabase).</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <FormField name="cod_produto" control={form.control as any} render={({ field }) => (
                <FormItem>
                  <FormLabel>Código do Produto</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="descricao" control={form.control as any} render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="unid" control={form.control as any} render={({ field }) => (
                <FormItem>
                  <FormLabel>Unid</FormLabel>
                  <FormControl>
                    <Input placeholder="ex.: 5 (opcional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="categoria" control={form.control as any} render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="familia" control={form.control as any} render={({ field }) => (
                <FormItem>
                  <FormLabel>Família</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="grupo_produto" control={form.control as any} render={({ field }) => (
                <FormItem>
                  <FormLabel>Grupo Produto</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}