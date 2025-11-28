import * as React from "react"

import { cn } from "@/lib/utils"

function CardAnalyzer({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-analyzer"
      className={cn(
        "bg-zinc-950 border-zinc-800 flex flex-col gap-6 rounded-lg border shadow-sm",
        className
      )}
      {...props}
    />
  )
}

function CardAnalyzerContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-analyzer-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

export {
  CardAnalyzer,
  CardAnalyzerContent,
}
