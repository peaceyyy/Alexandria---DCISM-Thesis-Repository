"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft, FileText, MessageSquareText } from "lucide-react";
import { mockReviewSubmissions } from "@/components/admin/mock-data";
import { StatusBadge } from "@/components/admin/status-badge";

export function PublishedStudiesDetailPage({ submissionId }: { submissionId: number }) {
  const selectedSubmission = useMemo(() => {
    return mockReviewSubmissions.find((item) => item.id === submissionId && item.reviewStatus === "accepted") ?? null;
  }, [submissionId]);

  if (!selectedSubmission) {
    return (
      <div className="flex flex-col gap-6 p-8">
        <Link
          href="/admin/published-studies"
          className="flex w-fit items-center gap-2 rounded-[7px] border border-white/10 bg-white/[0.04] px-3 py-2 text-[13px] font-semibold text-[#d8dadc] transition hover:bg-white/[0.08]"
        >
          <ArrowLeft size={14} aria-hidden />
          Back to Published Studies
        </Link>
        <div className="rounded-[10px] border border-dashed border-white/10 bg-[#1a1e23] p-6 text-sm text-[#9ea4ad]">
          This published study could not be found.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <Link
        href="/admin/published-studies"
        className="flex w-fit items-center gap-2 rounded-[7px] border border-white/10 bg-white/[0.04] px-3 py-2 text-[13px] font-semibold text-[#d8dadc] transition hover:bg-white/[0.08]"
      >
        <ArrowLeft size={14} aria-hidden />
        Back to Published Studies
      </Link>

      <div className="rounded-[10px] border border-white/[0.07] bg-[#1a1e23] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#969696]">Published Study</p>
            <h1 className="mt-1 text-[20px] font-bold text-white">{selectedSubmission.title}</h1>
          </div>
          <StatusBadge status={selectedSubmission.reviewStatus} />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-[8px] border border-white/[0.07] bg-[#14181c] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#969696]">Authors</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedSubmission.authors.map((author) => (
                <span key={author} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-[#d8dadc]">
                  {author}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-[8px] border border-white/[0.07] bg-[#14181c] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#969696]">Department</p>
            <p className="mt-1 text-sm font-medium text-white">{selectedSubmission.department}</p>
          </div>
          <div className="rounded-[8px] border border-white/[0.07] bg-[#14181c] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#969696]">Study Type</p>
            <p className="mt-1 text-sm font-medium text-white">{selectedSubmission.studyType}</p>
          </div>
          <div className="rounded-[8px] border border-white/[0.07] bg-[#14181c] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#969696]">Publication Date</p>
            <p className="mt-1 text-sm font-medium text-white">{selectedSubmission.publicationDate}</p>
          </div>
        </div>

        <div className="mt-5 rounded-[8px] border border-white/[0.07] bg-[#14181c] p-4">
          <div className="flex items-center gap-2 text-white">
            <MessageSquareText size={16} aria-hidden />
            <h2 className="text-[14px] font-semibold">Research Abstract</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#d8dadc]">{selectedSubmission.abstract}</p>
        </div>


        <div className="mt-5 rounded-[8px] border border-white/[0.07] bg-[#14181c] p-4">
          <div className="flex items-center gap-2 text-white">
            <MessageSquareText size={16} aria-hidden />
            <h2 className="text-[14px] font-semibold">Research Area</h2>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedSubmission.researchArea && (
              <span className="rounded-full border border-[#368bfe]/30 bg-[#368bfe]/10 px-3 py-1 text-sm text-[#8ec5ff]">
                {selectedSubmission.researchArea}
              </span>
            )}
          </div>
        </div>

        <div className="mt-5 rounded-[8px] border border-white/[0.07] bg-[#14181c] p-4">
          <div className="flex items-center gap-2 text-white">
            <FileText size={16} aria-hidden />
            <h2 className="text-[14px] font-semibold">Attached PDF</h2>
          </div>
          <div className="mt-3 rounded-[8px] border border-white/[0.07] bg-white/[0.03] p-3">
            {selectedSubmission.primaryFile ? (
              <>
                <p className="text-sm font-medium text-white">{selectedSubmission.primaryFile.fileName}</p>
                <p className="mt-1 text-xs text-[#9ea4ad]">{selectedSubmission.primaryFile.fileSize}</p>
                <iframe
                  src={selectedSubmission.primaryFile.pdfUrl}
                  title={`${selectedSubmission.title} PDF preview`}
                  className="mt-4 h-[420px] w-full rounded-[8px] border border-white/10 bg-white"
                />
              </>
            ) : (
              <p className="text-sm text-[#5a6070]">No PDF attached.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
