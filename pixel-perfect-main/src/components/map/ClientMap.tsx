import { Suspense, lazy, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MapProps } from "./map-types";

const LeafletMap = lazy(() => import("./LeafletMap"));

function MapSkeleton({ className }: { className?: string | undefined }) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center rounded-xl bg-muted text-muted-foreground",
        className,
      )}
    >
      <Loader2 className="size-5 animate-spin" />
    </div>
  );
}

export function ClientMap(props: MapProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <MapSkeleton className={props.className} />;

  return (
    <Suspense fallback={<MapSkeleton className={props.className} />}>
      <LeafletMap {...props} />
    </Suspense>
  );
}
