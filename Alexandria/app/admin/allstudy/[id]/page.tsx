"use client";

import { AllStudiesDetailPage } from "@/components/admin/all-studies-detail-page";
import { useParams } from "next/navigation";

export default function AllstudyDetailRoutePage() {
  const params = useParams<{ id: string }>();
  const submissionId = Number(params?.id ?? 0);

  return <AllStudiesDetailPage submissionId={submissionId} />;
}
