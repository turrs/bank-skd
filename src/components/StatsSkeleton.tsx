import { Skeleton } from "@/components/ui/skeleton"

export function StatsCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 space-y-3">
      {/* Title */}
      <Skeleton className="h-5 w-24" />
      
      {/* Value */}
      <Skeleton className="h-8 w-20" />
      
      {/* Change indicator */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
      {/* Chart Title */}
      <Skeleton className="h-6 w-48" />
      
      {/* Chart Area */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      
      {/* Legend */}
      <div className="flex gap-4 pt-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  )
}

export function TableSkeleton({ rowCount = 5 }: { rowCount?: number }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Table Header */}
      <div className="px-6 py-4 border-b">
        <Skeleton className="h-6 w-32" />
      </div>
      
      {/* Table Body */}
      <div className="divide-y">
        {Array.from({ length: rowCount }).map((_, i) => (
          <div key={i} className="px-6 py-4 flex items-center gap-4">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}
