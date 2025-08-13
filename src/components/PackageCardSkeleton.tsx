import { Skeleton } from "@/components/ui/skeleton"

export function PackageCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 space-y-3">
      {/* Package Name */}
      <Skeleton className="h-6 w-3/4" />
      
      {/* Description */}
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      
      {/* Stats Row */}
      <div className="flex gap-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      
      {/* Price */}
      <Skeleton className="h-8 w-32" />
      
      {/* Button */}
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

export function PackageCardSkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <PackageCardSkeleton key={i} />
      ))}
    </div>
  )
}
