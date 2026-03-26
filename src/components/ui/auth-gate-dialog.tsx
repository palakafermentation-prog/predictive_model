"use client";

import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AuthGateDialogProps {
  open: boolean;
  title?: string;
  description?: string;
}

export function AuthGateDialog({
  open,
  title = "Sign in to access Batches",
  description = "Batches is where you can store and review your prediction runs, and upload multiple sets of parameters at once. Sign in to access this feature.",
}: AuthGateDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        // Non-dismissable — ignore all close attempts
      }}
    >
      <DialogContent
        hideCloseButton
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button asChild>
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
