import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentUser } from "@/lib/services/auth-service";
import { createAdminClient } from "@/lib/supabase/admin";
import { GET } from "./route";

vi.mock("@/lib/services/auth-service", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

const createSignedUrl = vi.fn();

function queryResult(data: unknown, error: unknown = null) {
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
  };

  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  return builder;
}

describe("GET /api/theses/:id/file", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://storage.example/signed" },
      error: null,
    });
  });

  function arrangeAdminClient(reviewStatus = "accepted") {
    const thesisQuery = queryResult({
      id: 1,
      title: "Example Thesis",
      review_status: reviewStatus,
      submitted_by_user_id: "member-id",
    });
    const fileQuery = queryResult({
      storage_path: "uploads/member-id/folder/example.pdf",
      file_type: "application/pdf",
    });

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) =>
        table === "theses" ? thesisQuery : fileQuery,
      ),
      storage: {
        from: vi.fn(() => ({ createSignedUrl })),
      },
    } as never);
  }

  it("allows guests to preview an accepted PDF inline", async () => {
    arrangeAdminClient();
    vi.mocked(getCurrentUser).mockResolvedValue({
      data: null,
      error: null,
    });

    const response = await GET(
      new NextRequest("http://localhost/api/theses/1/file"),
      { params: Promise.resolve({ id: "1" }) },
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://storage.example/signed",
    );
    expect(createSignedUrl).toHaveBeenCalledWith(
      "uploads/member-id/folder/example.pdf",
      60,
      undefined,
    );
  });

  it("denies an explicit guest download", async () => {
    arrangeAdminClient();
    vi.mocked(getCurrentUser).mockResolvedValue({
      data: null,
      error: null,
    });

    const response = await GET(
      new NextRequest("http://localhost/api/theses/1/file?download=1"),
      { params: Promise.resolve({ id: "1" }) },
    );

    expect(response.status).toBe(403);
    expect(createSignedUrl).not.toHaveBeenCalled();
  });

  it("allows an active member to download an accepted PDF", async () => {
    arrangeAdminClient();
    vi.mocked(getCurrentUser).mockResolvedValue({
      data: {
        id: "member-id",
        email: "member@usc.edu.ph",
        profile_name: "Member",
        usc_id: null,
        role: "member",
        affiliation: "student",
        created_at: "2026-01-01T00:00:00.000Z",
      },
      error: null,
    });

    const response = await GET(
      new NextRequest("http://localhost/api/theses/1/file?download=1"),
      { params: Promise.resolve({ id: "1" }) },
    );

    expect(response.status).toBe(307);
    expect(createSignedUrl).toHaveBeenCalledWith(
      "uploads/member-id/folder/example.pdf",
      60,
      { download: "Example-Thesis.pdf" },
    );
  });
});
