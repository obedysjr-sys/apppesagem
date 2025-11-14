import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { TabelaRule } from "@/lib/tabelas-mock";
import { useEffect } from "react";

const ruleSchema = z.object({
  min: z.coerce.number().min(1, "Mínimo deve ser maior que 0."),
  max: z.coerce.number().min(1, "Máximo deve ser maior que 0."),
  sample: z.coerce.number().min(1, "Amostra deve ser maior que 0."),
});

type RuleFormValues = z.infer<typeof ruleSchema>;

interface RuleDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (data: TabelaRule) => void;
  initialData?: TabelaRule | null;
}

export function RuleDialog({ isOpen, onOpenChange, onSave, initialData }: RuleDialogProps) {
  const form = useForm<RuleFormValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      min: 1,
      max: 1,
      sample: 1,
    }
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        min: initialData.min,
        max: initialData.max === Infinity ? 999999 : initialData.max,
        sample: initialData.sample,
      });
    } else {
      form.reset({ min: 0, max: 0, sample: 0 });
    }
  }, [initialData, form]);

  const onSubmit = (data: RuleFormValues) => {
    onSave({
      id: initialData?.id || new Date().toISOString(),
      ...data,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>{initialData ? "Editar Regra" : "Adicionar Nova Regra"}</DialogTitle>
              <DialogDescription>
                Defina os limites de quantidade e o tamanho da amostra correspondente.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="min"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qtd. Mínima</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="max"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qtd. Máxima</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                     <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sample"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tamanho da Amostra</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                     <FormMessage />
                  </FormItem>
                )}
              />
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
