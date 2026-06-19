"use client";

import type { MouseEvent, ReactNode } from "react";
import { trackEvent } from "@/lib/meta/track";
import type { CapiCustomData, CapiEventName } from "@/lib/meta/capi";

export interface TrackLinkProps {
  href: string;
  eventName: CapiEventName;
  customData?: CapiCustomData;
  target?: string;
  rel?: string;
  className?: string;
  children: ReactNode;
}

export function TrackLink({
  href,
  eventName,
  customData,
  target,
  rel,
  className,
  children,
}: TrackLinkProps) {
  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    if (e.metaKey || e.ctrlKey || e.button === 1) return;
    trackEvent(eventName, { customData });
  }

  return (
    <a href={href} target={target} rel={rel} className={className} onClick={handleClick}>
      {children}
    </a>
  );
}
