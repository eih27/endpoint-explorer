import { Skeleton } from "@/components/ui/primitives";

export function LoadingState() {
  return (
    <div className="space-y-10" aria-busy="true" aria-label="Loading study data">
      <div>
        <Skeleton className="mb-3 h-3 w-40" />
        <div className="grid grid-cols-2 gap-px rounded-card border border-line bg-line lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2 bg-surface p-4">
              <Skeleton className="h-2.5 w-20" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-2 w-24" />
            </div>
          ))}
        </div>
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-4 w-52" />
          <Skeleton className="h-3 w-72" />
          <Skeleton className="h-[300px] w-full rounded-card" />
        </div>
      ))}
    </div>
  );
}
