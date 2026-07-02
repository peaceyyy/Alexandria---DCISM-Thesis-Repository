"use client";

import { StepWrapper } from "./_helpers";
import { PdfDropzone } from "@/app/upload/_components/pdf-dropzone";

interface StepUploadProps {
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
}

export function StepUpload({ file, onChange, error }: StepUploadProps) {
  return (
    <StepWrapper
      title="Upload Thesis"
      description="Attach the final PDF of your thesis. PDF only, maximum 10 MiB."
    >
      <PdfDropzone file={file} onChange={onChange} error={error} />
    </StepWrapper>
  );
}
