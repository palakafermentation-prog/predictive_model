"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProfileFormSchema, type ProfileForm } from "@pferm/shared-schemas";
import type { User } from "@pferm/shared-schemas";
import { toast } from "sonner";
import { useDrawerStore } from "@/stores/drawer-store";
import { useUserStore } from "@/stores/user-store";
import { useAvatarStore } from "@/stores/avatar-store";
import { useDrawerDirtySync } from "@/hooks/use-drawer-dirty-sync";
import { apiFetch, isApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { DiscardChangesDialog } from "@/components/ui/discard-changes-dialog";
import { UserAvatar } from "@/components/user-avatar";
import { ImageCropperModal } from "@/components/ui/image-cropper-modal";

interface ProfileDrawerContentProps {
  user: User;
}

export default function ProfileDrawerContent({
  user,
}: ProfileDrawerContentProps) {
  const { closeWithSuccess, closeDrawer, isDirty: drawerIsDirty } = useDrawerStore();
  const { refreshUser } = useUserStore();
  const { avatarId, isUploading, setIsUploading, setAvatarId, refreshAvatar } =
    useAvatarStore();
  const [error, setError] = React.useState<string | null>(null);
  const [showDiscardDialog, setShowDiscardDialog] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [cropperOpen, setCropperOpen] = React.useState(false);
  const [imageSrc, setImageSrc] = React.useState<string>("");

  const form = useForm<ProfileForm>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: {
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phone: user.phone || "",
    },
  });

  const { isDirty, isSubmitting } = form.formState;

  useDrawerDirtySync(isDirty);

  const onSubmit = async (data: ProfileForm) => {
    setError(null);

    try {
      // Exclude avatarId — it's managed by the avatar upload flow, not the form
      const { avatarId: _avatarId, ...profileData } = data;
      const response = await apiFetch<{ user: User }>("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      if (isApiError(response)) {
        throw new Error(response.error.message);
      }

      form.reset(data);
      await refreshUser();
      closeWithSuccess("Profile updated successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("Image must be less than 10MB");
      return;
    }

    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setIsUploading(true);
    setError(null);

    try {
      const currentAvatarId = useAvatarStore.getState().avatarId ?? user.avatarId;

      const formData = new FormData();
      formData.append("file", croppedBlob, "avatar.jpg");
      if (currentAvatarId) {
        formData.append("replaceFileId", currentAvatarId);
      }

      const uploadResponse = await apiFetch<{ id: string; url: string }>("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      if (isApiError(uploadResponse)) {
        throw new Error(uploadResponse.error.message);
      }

      const newAvatarId = uploadResponse.data.id;

      const updateResponse = await apiFetch<{ user: User }>("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarId: newAvatarId }),
      });

      if (isApiError(updateResponse)) {
        throw new Error(updateResponse.error.message);
      }

      setAvatarId(newAvatarId);
      refreshAvatar();
      await refreshUser();
      toast.success("Avatar updated successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCancel = () => {
    if (drawerIsDirty) {
      setShowDiscardDialog(true);
      return;
    }
    closeDrawer();
  };

  return (
    <>
      <ImageCropperModal
        open={cropperOpen}
        onOpenChange={setCropperOpen}
        imageSrc={imageSrc}
        onCropComplete={handleCropComplete}
        cropShape="round"
        title="Crop Avatar"
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4 pb-6 mb-2 border-b">
            <UserAvatar
              user={user}
              className="h-24 w-24 text-2xl"
              fallbackClassName="text-2xl"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              aria-label="Upload avatar image"
              onChange={handleFileSelect}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Upload Avatar"}
            </Button>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <FormField control={form.control} name="firstName" render={({ field }) => (
              <FormItem>
                <FloatingLabelInput type="text" label="First Name *" aria-required="true" {...field} />
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="lastName" render={({ field }) => (
              <FormItem>
                <FloatingLabelInput type="text" label="Last Name" {...field} />
                <FormMessage />
              </FormItem>
            )} />

            <div>
              <FloatingLabelInput
                id="email"
                name="email"
                type="email"
                label="Email"
                value={user.email}
                disabled
                aria-describedby="email-hint"
                className="bg-muted text-muted-foreground cursor-not-allowed"
              />
              <p id="email-hint" className="mt-1 text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem>
                <FloatingLabelInput type="tel" label="Phone" {...field} />
                <FormMessage />
              </FormItem>
            )} />
          </div>

          {error && (
            <div role="alert" className="rounded-md bg-destructive/10 border border-destructive p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isDirty || isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>

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
