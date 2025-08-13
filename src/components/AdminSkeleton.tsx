import { Skeleton } from "@/components/ui/skeleton"

export function AdminTableSkeleton({ rowCount = 5 }: { rowCount?: number }) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, i) => (
        <tr key={i} className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
              <Skeleton className="h-4 w-4 mr-2 rounded-full" />
              <Skeleton className="h-6 w-20" />
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-48" />
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <Skeleton className="h-4 w-24" />
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <Skeleton className="h-4 w-20" />
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <Skeleton className="h-4 w-16" />
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-8" />
            </div>
          </td>
        </tr>
      ))}
    </>
  )
}

export function AdminCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
      
      {/* Content */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4">
        <div className="text-center">
          <Skeleton className="h-8 w-16 mx-auto mb-2" />
          <Skeleton className="h-4 w-20 mx-auto" />
        </div>
        <div className="text-center">
          <Skeleton className="h-8 w-16 mx-auto mb-2" />
          <Skeleton className="h-4 w-20 mx-auto" />
        </div>
        <div className="text-center">
          <Skeleton className="h-8 w-16 mx-auto mb-2" />
          <Skeleton className="h-4 w-20 mx-auto" />
        </div>
      </div>
    </div>
  )
}

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <AdminCardSkeleton key={i} />
        ))}
      </div>
      
      {/* Tables */}
      <div className="space-y-6">
        <AdminTableSkeleton rowCount={5} />
        <AdminTableSkeleton rowCount={5} />
      </div>
    </div>
  )
}
