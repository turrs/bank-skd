import { Skeleton } from "@/components/ui/skeleton"

// Loading untuk form input
export function FormInputSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

// Loading untuk form
export function FormSkeleton({ fieldCount = 4 }: { fieldCount?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: fieldCount }).map((_, i) => (
        <FormInputSkeleton key={i} />
      ))}
      <div className="flex gap-3 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  )
}

// Loading untuk button
export function ButtonSkeleton({ size = "default" }: { size?: "sm" | "default" | "lg" }) {
  const height = size === "sm" ? "h-8" : size === "lg" ? "h-12" : "h-10"
  const width = size === "sm" ? "w-20" : size === "lg" ? "w-32" : "w-24"
  
  return <Skeleton className={`${height} ${width}`} />
}

// Loading untuk card
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-8 w-32" />
    </div>
  )
}

// Loading untuk list item
export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  )
}

// Loading untuk list
export function ListSkeleton({ itemCount = 5 }: { itemCount?: number }) {
  return (
    <div className="divide-y">
      {Array.from({ length: itemCount }).map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </div>
  )
}

// Loading untuk modal/dialog
export function ModalSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <FormSkeleton fieldCount={3} />
    </div>
  )
}

// Loading untuk search bar
export function SearchBarSkeleton() {
  return (
    <div className="flex gap-2">
      <Skeleton className="h-10 flex-1" />
      <Skeleton className="h-10 w-20" />
    </div>
  )
}

// Loading untuk pagination
export function PaginationSkeleton() {
  return (
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-32" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
  )
}

// Loading untuk empty state
export function EmptyStateSkeleton() {
  return (
    <div className="text-center py-12">
      <Skeleton className="h-16 w-16 mx-auto mb-4 rounded-full" />
      <Skeleton className="h-6 w-48 mx-auto mb-2" />
      <Skeleton className="h-4 w-64 mx-auto mb-4" />
      <Skeleton className="h-10 w-32 mx-auto" />
    </div>
  )
}

// Loading untuk sidebar
export function SidebarSkeleton() {
  return (
    <div className="bg-white shadow-lg border-l p-4 space-y-4">
      <div className="flex items-center gap-3 pb-4 border-b">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}
