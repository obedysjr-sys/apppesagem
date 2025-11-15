import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ResultCardProps {
  title: string;
  value: string | number;
  unit?: string;
  className?: string;
  severity?: 'ok' | 'attention' | 'critical' | null;
}

const severityClasses = {
    ok: "border-green-500/50 bg-green-500/10",
    attention: "border-yellow-500/50 bg-yellow-500/10",
    critical: "border-red-500/50 bg-red-500/10",
};

export function ResultCard({ title, value, unit, className, severity = null }: ResultCardProps) {
  return (
    <Card className={cn("text-center transition-colors", className, severity && severityClasses[severity])}>
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex items-baseline justify-center gap-1 leading-tight tracking-tight">
          <span className="text-lg sm:text-xl md:text-2xl font-bold">
            {value}
          </span>
          {unit && (
            <span className="text-xs sm:text-sm md:text-base font-normal text-muted-foreground">
              {unit}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
