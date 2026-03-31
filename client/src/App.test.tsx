import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LandingPage } from "@/pages/LandingPage";

describe("App", () => {
  it("renders the landing page hero", async () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    expect(
      await screen.findByText(/Understand how your mind leans before your next decision/i)
    ).toBeInTheDocument();
  });
});
