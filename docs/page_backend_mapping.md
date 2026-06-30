# Page-to-Backend Function Mapping & Prioritization

This document maps the 15 screens discovered in the Figma design to the specific service layer functions outlined in `docs/backend_functions.md`. It also provides an implementation priority based on the `docs/backend-readiness-plan.md` to ensure frontend development aligns with backend readiness.

---

## Page to Backend Mapping

### 1. Authentication & Entry
| Page | Primary Backend Functions | Auth Required |
| :--- | :--- | :--- |
| **Landing Page** | *(None / Static routing)* | No |
| **Login Page** | `login()` | No |
| **Sign-Up Page** | `registerMember()`, `isAllowedEmailDomain()` | No |

### 2. Research Inspection & Submission
| Page | Primary Backend Functions | Auth Required |
| :--- | :--- | :--- |
| **Main Page (Catalog)** | `getTheses()`, `getFilterOptions()` | No |
| **Selected Page (Detail)**| `getThesisById()`, `getAuthenticatedFileUrl()` | Partial (For PDF) |
| **Submission Form (New/Edit)** | `submitThesis()`, `registerThesisFile()`, `updateOwnSubmission()` | Yes (Member) |
| **My Submissions (Missing)**| `getOwnSubmissions()` | Yes (Member) |

### 3. Moderator Workflow (Review & Management)
| Page | Primary Backend Functions | Auth Required |
| :--- | :--- | :--- |
| **Moderator Dashboard** | `getAdminTheses()` | Yes (Mod/Admin) |
| **Pending Reviews** | `getAdminTheses({ review_status: 'for_review' })` | Yes (Mod/Admin) |
| **Detailed Review Page**| `updateThesis()` (for edit/accept/flag), `validateThesisForAcceptance()`, `trashThesis()`, `replacePrimaryFile()` | Yes (Mod/Admin) |
| **All Studies Log** | `getAdminTheses()` | Yes (Mod/Admin) |
| **Published Studies** | `getAdminTheses({ review_status: 'accepted' })`, `updateThesis()` (to unpublish) | Yes (Mod/Admin) |

### 4. Profile & Admin Workspace
| Page | Primary Backend Functions | Auth Required |
| :--- | :--- | :--- |
| **Profile Page** | `getCurrentUser()`, `logout()` | Yes |
| **Admin Dashboard** | `getUsers()`, `getAdminTheses()` | Yes (Admin) |
| **Members Management** | `getUsers()`, `updateUserRole()` | Yes (Admin) |
| **Moderators Management**| `getUsers()`, `updateUserRole()` | Yes (Admin) |

*(Note: `getCurrentUser()` and session guards like `requireSession()` / `requireRole()` will be used on all protected pages/layouts.)*

---

## Implementation Prioritization Plan

Based on the mapping above and the Backend Readiness Plan, we should prioritize frontend page implementation in the following phases. This ensures that the UI is built on top of the most stable and fundamental backend contracts first.

### Phase 1: Core Foundation & Discovery (Highest Priority)
**Backend readiness:** The `auth-service` and `thesis-service` are the most critical early services.
* **Pages to Build:** 
  1. `Landing Page` (Static Shell)
  2. `Login Page` & `Sign-Up Page` (Login authenticates an existing account; sign-up registers a new account)
  3. `Main Page (Catalog)` (Proves public data fetching and filtering)
  4. `Profile Page` (Proves session management and logout)

### Phase 2: Content Ingestion & Viewing
**Backend readiness:** The `submission-service` and `file-service` come next.
* **Pages to Build:**
  1. `Submission Form` (Allows members to push `for_review` data into the DB, giving moderators something to look at).
  2. `Selected Page (Detail)` (Proves thesis detail viewing and authenticated PDF proxy logic via `getAuthenticatedFileUrl()`).

### Phase 3: Moderation & Approval
**Backend readiness:** The `admin-thesis-service` and acceptance validation logic.
* **Pages to Build:**
  1. `Pending Reviews` & `Moderator Dashboard` (Lists submissions).
  2. `Detailed Review Page` (The most complex admin screen: needs `updateThesis`, `replacePrimaryFile`, and `acceptThesis/flagThesis`).
  3. `Published Studies` & `All Studies Log` (Audit and state management views).

### Phase 4: System Administration (Lowest Priority)
**Backend readiness:** The `user-service`.
* **Pages to Build:**
  1. `Members Management`
  2. `Moderators Management`
  3. `Admin Dashboard` (Combines metrics from multiple tables).

---
*By following this priority, the frontend team will avoid being blocked by complex Admin/Moderator rules early on, and can instead focus on getting the core student experience (Auth -> Search -> Submit -> View) working end-to-end first.*
