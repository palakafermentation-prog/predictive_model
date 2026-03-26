"use client";

import Link from "next/link";
import { useAuthGateStore } from "@/stores/auth-gate-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function AuthGateDialog() {
  const { isOpen, closeAuthGate } = useAuthGateStore();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) closeAuthGate(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign in to access Batches</DialogTitle>
          <DialogDescription>
            Batches is where you can store and review your prediction runs, and
            upload multiple sets of parameters at once. Sign in to access this
            feature.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={closeAuthGate}>
            Cancel
          </Button>
          <Button asChild onClick={closeAuthGate}>
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
