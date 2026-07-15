import * as z from "zod";
import { DEPARTMENTS } from "@/lib/domain/departments";

export { DEPARTMENTS };

const APPLICATION_TIME_ZONE = "Asia/Manila";

function getCurrentCalendarDate() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APPLICATION_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export const currentCalendarDate = getCurrentCalendarDate();

export const RESEARCH_AREAS = [
  "AI / Machine Learning",
  "Web Development",
  "Mobile Development",
  "Cybersecurity",
  "IoT",
  "Data Science",
  "Networking",
  "Algorithms",
  "Mathematics",
] as const;

export const authorSchema = z.object({
  user_id: z.string().nullable(),
  display_name: z.string().min(2, "Please enter the person's full name (not abbreviated)"),
  contribution_role: z.enum(["author", "adviser"]),
  sort_order: z.number().min(1),
});

export const formSchema = z
  .object({
    title: z.string().min(5, "Title must be at least 5 characters"),
    abstract: z.string().min(50, "Abstract must be at least 50 characters"),
    department: z.enum(DEPARTMENTS, "Department must be CS, IT, or IS."),
    type_of_study: z.enum(["thesis", "capstone"]),
    research_areas: z.array(z.string()).min(1, "Select at least one research area"),
    authors: z.array(authorSchema).min(1, "At least one author is required"),
    tags: z.array(z.string().min(1)).min(1, "Add at least one keyword"),
    publication_date: z.iso.date("Publication date is required"),
    publication_link: z.string().min(1, "Publication link is required"),
    conference: z.string().min(1, "Conference name is required"),
    recommendations: z.string().min(10, "Recommendations must be at least 10 characters"),
    lessons_learned: z.array(z.string().min(1)).min(1, "Add at least one lesson learned"),
  })
  .superRefine((data, context) => {
    if (!data.publication_date) return;
    if (data.publication_date > currentCalendarDate) {
      context.addIssue({
        code: "custom",
        path: ["publication_date"],
        message: "Publication date cannot be later than today",
      });
    }
  });

export type FormValues = z.infer<typeof formSchema>;

/** Maps each form field name to the wizard step it lives on (1-indexed). */
export const FIELD_STEP_MAP: Record<string, number> = {
  title: 1,
  department: 1,
  type_of_study: 1,
  publication_date: 1,
  conference: 2,
  publication_link: 2,
  authors: 3,
  abstract: 4,
  research_areas: 4,
  tags: 4,
  recommendations: 5,
  lessons_learned: 5,
};

export const STEPS = [
  { id: 1, label: "Basics" },
  { id: 2, label: "Publication" },
  { id: 3, label: "People" },
  { id: 4, label: "Details" },
  { id: 5, label: "Insights" },
  { id: 6, label: "Upload" },
  { id: 7, label: "Review" },
] as const;
