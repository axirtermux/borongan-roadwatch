import type { ReactNode } from "react";

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  color: string;
  content?: ReactNode;
};

export type MapProps = {
  center: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  /** When set, clicking the map reports the picked coordinates. */
  onPick?: (lat: number, lng: number) => void;
  className?: string | undefined;
  recenterKey?: string;
};
