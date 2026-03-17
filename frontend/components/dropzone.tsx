"use client"

import { useDocuments, useUploadDocument } from "@/hooks/use-documents"
import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "./ui/button"
import { filesize } from "filesize"
import { useSummary } from "@/hooks/use-summary"
import { toast } from "sonner"

type Props = {
  open: boolean
  onClose: () => void
}

export default function UploadDocumentModal({ open, onClose }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const { refetch: refetchDocs } = useDocuments()
  const { refetch: refetchSummary } = useSummary()
  const { mutateAsync: uploadDoc, isPending } = useUploadDocument()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selected = acceptedFiles[0]
    if (!selected) return
    if (selected.type !== "application/pdf") {
      alert("Only PDF files allowed")
      return
    }
    setFile(selected)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [] },
    multiple: false
  })

  const handleUpload = async () => {
    try {
      if (!file) return;
      await uploadDoc(file);
      await refetchDocs();
      await refetchSummary();
      setFile(null);
      onClose();
    } catch (e) {
      toast.error('Uploading failed!')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
      <div className="bg-white p-6 rounded-lg w-105 space-y-4">
        <h2 className="text-lg font-semibold">
          Upload Document
        </h2>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className="border-2 border-dashed p-8 rounded-md text-center cursor-pointer"
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the PDF here...</p>
          ) : (
            <p>Drag & drop a PDF here, or click to select</p>
          )}
        </div>

        {file && (
          <div className="text-sm">
            Selected: {file.name} <span className="text-muted-foreground">({filesize(file.size)})</span>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || isPending}
          >
            {isPending ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </div>
    </div>
  )
}