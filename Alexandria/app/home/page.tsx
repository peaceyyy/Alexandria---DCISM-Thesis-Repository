import { Suspense } from "react";
import { AppHeader } from "@/components/layout/app-header";
import ThesesBrowser from "@/components/layout/theses-browser";
import { getCurrentUser } from "@/lib/services/auth-service";
import { SubmissionBanner } from "./_components/submission-banner";

const items = [
  {
    authors: [
      { id: "james-ang", name: "James Ang" },
      { id: "jared-minoza", name: "Jared Minoza" },
    ],
    year: 2025,
    title: "AI-Based Student Attendance Monitoring Using Facial Recognition",
    abstract:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    research_area: ["AI / ML", "Data Science"],
    department: "Computer Science",
  },
  {
    authors: [
      { id: "avryl-joie", name: "Avryl Joie Arranguez" },
      { id: "homer-dorin", name: "Homer Adriel Dorin" },
    ],
    year: 2023,
    title: "A Mobile Inventory Management System for Small Businesses",
    abstract:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    research_area: ["Mobile Development", "Cybersecurity"],
    department: "Information Technology",
  },
  {
    authors: [
      { id: "matt-erron", name: "Matt Erron Cabarrubias" },
      { id: "dustin-jesse", name: "Dustin Jesse Balansag" },
    ],
    year: 2025,
    title: "Cybersecurity Risk Assessment Framework for Small Enterprises",
    abstract:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    research_area: ["Web Development", "Data Science"],
    department: "Information Systems",
  },
  {
    authors: [
      { id: "leira-bengil", name: "Leira Bengil" },
      { id: "jian-bryce", name: "Jian Bryce Machacon" },
    ],
    year: 2024,
    title: "Project Title",
    abstract:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    research_area: ["AI / ML", "Data Science"],
    department: "Information Technology",
  },
  {
    authors: [
      { id: "leira-bengil", name: "Leira Bengil" },
      { id: "jian-bryce", name: "Jian Bryce Machacon" },
    ],
    year: 2024,
    title: "Project Title 2",
    abstract:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    research_area: ["AI / ML", "Data Science"],
    department: "Computer Science",
  },
  {
    authors: [
      { id: "leira-bengil", name: "Leira Bengil" },
      { id: "jian-bryce", name: "Jian Bryce Machacon" },
    ],
    year: 2024,
    title: "Project Title 3",
    abstract:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    research_area: ["IoT", "Data Science"],
    department: "Computer Science",
  },
  {
    authors: [
      { id: "leira-bengil", name: "Leira Bengil" },
      { id: "jian-bryce", name: "Jian Bryce Machacon" },
    ],
    year: 2024,
    title: "Project Title 4",
    abstract:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    research_area: ["AI / ML", "Data Science"],
    department: "Information Technology",
  },
  {
    authors: [
      { id: "leira-bengil", name: "Leira Bengil" },
      { id: "jian-bryce", name: "Jian Bryce Machacon" },
    ],
    year: 2024,
    title: "Project Title 5",
    abstract:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    research_area: ["IoT", "Data Science"],
    department: "Information Systems",
  },
  {
    authors: [
      { id: "leira-bengil", name: "Leira Bengil" },
      { id: "jian-bryce", name: "Jian Bryce Machacon" },
    ],
    year: 2024,
    title: "Project Title 6",
    abstract:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    research_area: ["AI / ML", "Data Science"],
    department: "Information Systems",
  },
  {
    authors: [
      { id: "leira-bengil", name: "Leira Bengil" },
      { id: "jian-bryce", name: "Jian Bryce Machacon" },
    ],
    year: 2024,
    title: "Project Title 7",
    abstract:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    research_area: ["AI / ML", "Data Science"],
    department: "Computer Science",
  },
];

export default async function HomePage() {
  const userResult = await getCurrentUser();
  const role = userResult.data?.role ?? null;

  return (
    <main className="h-screen overflow-hidden bg-[#14181c] text-white">
      <AppHeader role={role} />
      <Suspense fallback={null}>
        <SubmissionBanner />
      </Suspense>
      <ThesesBrowser items={items} />
    </main>
  );
}
