"use client";

import * as React from "react";
import { useDrawerStore } from "@/stores/drawer-store";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DiscardChangesDialog } from "@/components/ui/discard-changes-dialog";
import { cn } from "@/lib/utils";
import type { User } from "@pferm/shared-schemas";

const ProfileDrawerContent = React.lazy(
  () => import("@/components/drawer-content/profile-drawer-content")
);

const BatchDetailDrawerContent = React.lazy(
  () => import("@/components/drawer-content/batch-detail-drawer-content")
);

const widthClasses = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
};

function DrawerContentSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="h-10 bg-muted rounded animate-pulse motion-reduce:animate-none" />
        <div className="h-10 bg-muted rounded animate-pulse motion-reduce:animate-none" />
        <div className="h-10 bg-muted rounded animate-pulse motion-reduce:animate-none" />
      </div>
    </div>
  );
}

function DrawerContentRenderer({
  type,
  props,
}: {
  type: string | null;
  props: Record<string, unknown>;
}) {
  switch (type) {
    case "profile":
      return (
        <React.Suspense fallback={<DrawerContentSkeleton />}>
          <ProfileDrawerContent {...(props as { user: User })} />
        </React.Suspense>
      );
    case "batch_detail":
      return (
        <React.Suspense fallback={<DrawerContentSkeleton />}>
          <BatchDetailDrawerContent {...(props as { id: string })} />
        </React.Suspense>
      );
    default:
      return null;
  }
}

export function AppDrawer() {
  const { isOpen, contentType, contentProps, getConfig, isDirty, closeDrawer } =
    useDrawerStore();
  const [showDiscardDialog, setShowDiscardDialog] = React.useState(false);

  const config = getConfig();
  const widthClass = config ? widthClasses[config.width] : widthClasses.lg;

  const requestClose = React.useCallback(() => {
    if (!isDirty) {
      closeDrawer();
      return;
    }
    setShowDiscardDialog(true);
  }, [isDirty, closeDrawer]);

  const handleInteractOutside = React.useCallback(
    (e: Event) => {
      const target = e.target as HTMLElement;

      // Allow toast interactions through
      if (
        target.closest("[data-sonner-toast]") ||
        target.closest("[data-sonner-toaster]")
      ) {
        e.preventDefault();
        return;
      }

      if (isDirty) {
        e.preventDefault();
        setShowDiscardDialog(true);
      }
    },
    [isDirty]
  );

  return (
    <>
      <Sheet
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) requestClose();
        }}
      >
        <SheetContent
          side="right"
          className={cn("w-full overflow-y-auto", widthClass)}
          onInteractOutside={handleInteractOutside}
        >
          {config && (
            <SheetHeader>
              <SheetTitle>{config.title}</SheetTitle>
              {config.description && (
                <SheetDescription>{config.description}</SheetDescription>
              )}
            </SheetHeader>
          )}

          <div className="mt-6">
            <DrawerContentRenderer type={contentType} props={contentProps} />
          </div>
        </SheetContent>
      </Sheet>

      <DiscardChangesDialog
        open={showDiscardDialog}
        onConfirm={() => {
          setShowDiscardDialog(false);
          closeDrawer();
        }}
        onCancel={() => setShowDiscardDialog(false)}
      />
    </>
  );
}
