// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  ReviewDecisionActions,
  ReviewStatusIndicator,
} from "./review-decision-actions";

describe("ReviewDecisionActions", () => {
  it("uses the compact revision status treatment in the review panel", () => {
    render(
      <ReviewStatusIndicator status="flagged" />,
    );

    expect(screen.getByText("Needs revision")).toHaveAttribute(
      "data-status",
      "flagged",
    );
  });

  it("asks for confirmation before approving a submission", async () => {
    const onDecision = vi.fn();
    const user = userEvent.setup();

    render(
      <ReviewDecisionActions
        status="for_review"
        role="moderator"
        onDecision={onDecision}
      />,
    );

    await user.click(screen.getByRole("button", { name: /approve this submission/i }));

    expect(onDecision).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog", { name: /approve this submission/i });
    expect(dialog).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /^approve$/i }));

    expect(onDecision).toHaveBeenCalledWith("accepted");
  });

  it("asks for confirmation before flagging a submission for revision", async () => {
    const onDecision = vi.fn();
    const user = userEvent.setup();

    render(
      <ReviewDecisionActions
        status="for_review"
        role="moderator"
        onDecision={onDecision}
      />,
    );

    await user.click(screen.getByRole("button", { name: /flag submission for member revision/i }));

    expect(onDecision).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog", { name: /flag this submission for revision/i });
    expect(dialog).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /^flag for revision$/i }));

    expect(onDecision).toHaveBeenCalledWith("flagged");
  });

  it("allows approved submissions to be sent back to pending review after confirmation", async () => {
    const onDecision = vi.fn();
    const user = userEvent.setup();

    render(
      <ReviewDecisionActions
        status="accepted"
        role="moderator"
        onDecision={onDecision}
      />,
    );

    await user.click(screen.getByRole("button", { name: /send submission back to review/i }));

    expect(onDecision).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog", { name: /send back to review/i });
    expect(dialog).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /send back to review/i }));

    expect(onDecision).toHaveBeenCalledWith("for_review");
  });

  it("requires two confirmations before an administrator trashes a submission", async () => {
    const onDecision = vi.fn();
    const user = userEvent.setup();

    render(
      <ReviewDecisionActions
        status="for_review"
        role="admin"
        onDecision={onDecision}
      />,
    );

    await user.click(screen.getByRole("button", { name: /move submission to trash/i }));
    let dialog = screen.getByRole("dialog", { name: /trash this submission/i });
    await user.click(within(dialog).getByRole("button", { name: /^continue$/i }));

    expect(onDecision).not.toHaveBeenCalled();
    dialog = screen.getByRole("dialog", { name: /confirm move to trash/i });
    await user.click(within(dialog).getByRole("button", { name: /^move to trash$/i }));

    expect(onDecision).toHaveBeenCalledWith("trashed");
  });
});
