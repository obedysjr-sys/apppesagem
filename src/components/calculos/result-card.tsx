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
const severityTextClasses = {
    ok: "text-green-600",
    attention: "text-yellow-600",
    critical: "text-red-600",
};

export function ResultCard({ title, value, unit, className, severity = null }: ResultCardProps) {
  return (
    <Card className={cn("min-w-0 text-center transition-colors", className, severity && severityClasses[severity])}>
      <CardHeader className="py-2 sm:py-3">
        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground whitespace-normal break-words">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3 sm:pb-4">
        <div className="flex items-baseline justify-center gap-1 leading-snug tracking-tight">
          <span className={cn("text-base sm:text-lg md:text-xl font-bold", severity && severityTextClasses[severity])}>
            {value}
          </span>
          {unit && (
            <span className="text-[11px] sm:text-xs md:text-sm font-normal text-muted-foreground">
              {unit}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
