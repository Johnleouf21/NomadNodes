"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Loader2, Image as ImageIcon, Link, Plus } from "lucide-react";
import { uploadFileToIPFS, getIPFSUrl } from "@/lib/utils/ipfs";

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  label?: string;
}

// Check if a string is a valid URL
function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// Check if a string is an IPFS hash (CID)
function isIPFSHash(string: string): boolean {
  // Basic check for IPFS CID v0 (Qm...) or v1 (bafy...)
  return /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[A-Za-z2-7]{58})$/.test(string);
}

// Get display URL for an image (handles both IPFS hashes and external URLs)
function getDisplayUrl(image: string): string {
  if (isValidUrl(image)) {
    return image;
  }
  return getIPFSUrl(image);
}

export function ImageUpload({
  images,
  onChange,
  maxImages = 5,
  label = "Upload Images",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      // Check max images
      if (images.length + files.length > maxImages) {
        setError(`Maximum ${maxImages} images allowed`);
        return;
      }

      setUploading(true);
      setError(null);

      try {
        const newHashes: string[] = [];

        for (const file of Array.from(files)) {
          // Validate file type
          if (!file.type.startsWith("image/")) {
            setError("Only image files are allowed");
            continue;
          }

          // Validate file size (max 5MB)
          if (file.size > 5 * 1024 * 1024) {
            setError("Image must be less than 5MB");
            continue;
          }

          const hash = await uploadFileToIPFS(file);
          newHashes.push(hash);
        }

        if (newHashes.length > 0) {
          onChange([...images, ...newHashes]);
        }
      } catch (err) {
        console.error("Upload error:", err);
        setError("Failed to upload image. Please try again.");
      } finally {
        setUploading(false);
        // Reset file input
        e.target.value = "";
      }
    },
    [images, maxImages, onChange]
  );

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const handleAddUrl = useCallback(() => {
    const url = urlInput.trim();

    if (!url) {
      setError("Please enter a URL");
      return;
    }

    if (!isValidUrl(url)) {
      setError("Please enter a valid URL (starting with http:// or https://)");
      return;
    }

    if (images.length >= maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Check if URL is already added
    if (images.includes(url)) {
      setError("This image URL is already added");
      return;
    }

    setError(null);
    onChange([...images, url]);
    setUrlInput("");
    setShowUrlInput(false);
  }, [urlInput, images, maxImages, onChange]);

  return (
    <div className="space-y-3">
      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {images.map((image, index) => (
            <div
              key={image}
              className="group relative aspect-video overflow-hidden rounded-lg border"
            >
              <img
                src={getDisplayUrl(image)}
                alt={`Image ${index + 1}`}
                className="h-full w-full object-cover"
                onError={(e) => {
                  // Fallback to placeholder on error
                  (e.target as HTMLImageElement).src = "/placeholder-image.svg";
                }}
              />
              {/* Badge to show if it's an external URL */}
              {isValidUrl(image) && (
                <div className="absolute top-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                  <Link className="mr-0.5 inline h-2.5 w-2.5" />
                  URL
                </div>
              )}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="bg-destructive text-destructive-foreground absolute top-1 right-1 rounded-full p-1 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* URL Input */}
      {showUrlInput && images.length < maxImages && (
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://images.unsplash.com/..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddUrl();
              }
            }}
            className="flex-1"
          />
          <Button type="button" onClick={handleAddUrl} size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowUrlInput(false);
              setUrlInput("");
              setError(null);
            }}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Upload Buttons */}
      {images.length < maxImages && !showUrlInput && (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
            id="image-upload"
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
              <span className="text-muted-foreground text-sm">Uploading to IPFS...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="flex gap-2">
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload File
                    </span>
                  </Button>
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUrlInput(true)}
                >
                  <Link className="mr-2 h-4 w-4" />
                  Paste URL
                </Button>
              </div>
              <span className="text-muted-foreground text-xs">
                {images.length}/{maxImages} images • Upload files or paste image URLs (Unsplash,
                etc.)
              </span>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && <p className="text-destructive text-sm">{error}</p>}

      {/* Empty State */}
      {images.length === 0 && !uploading && (
        <p className="text-muted-foreground text-center text-xs">
          <ImageIcon className="mr-1 inline h-3 w-3" />
          No images uploaded yet
        </p>
      )}
    </div>
  );
}
