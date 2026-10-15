# Mini Inventory Manager
## Personal Project Development Specification

## 1. Project Overview

**Project Type:** Personal learning project with potential for future SaaS development  
**Working Name:** StockFlow (name may change)  
**Primary Goal:** Build a practical, responsive inventory management application for a small shop.

### Objective

Build and deploy a mini inventory management dashboard using **Next.js, TypeScript, and Supabase**. The application should help a small shop owner keep product records, track stock coming in and going out, identify low-stock products, and review inventory movement history.

The first version should prioritize correctness, usability, clean code, and a reliable database design. Keep the scope small enough for one developer to complete. Do not build a full enterprise resource planning system or marketplace.

### Intended Users

- Small retail shop owners
- Motorcycle parts shops
- Small repair shops that keep parts or supplies
- A single person who needs a simple inventory record

### Project Principles

- Build the smallest useful version first.
- Prefer straightforward, maintainable code over unnecessary abstractions.
- Keep product quantities accurate and preserve a history of stock changes.
- Make the application usable on desktop, tablet, and mobile.
- Avoid adding features outside this specification unless they are needed to make the core workflow reliable.
- Treat this as a learning project: explain significant implementation decisions and keep setup instructions clear.

---

## 2. Technology Stack and Deployment

- **Framework:** Next.js using the App Router
- **Language:** TypeScript with strict type checking
- **UI:** React and a consistent, responsive component system
- **Styling:** Tailwind CSS
- **Database:** Supabase PostgreSQL
- **Data access:** Supabase JavaScript client
- **Validation:** A schema-validation library such as Zod, where useful
- **Version control:** Git and GitHub
- **Deployment:** Vercel or another compatible hosting plmatform

### Supabase Client Requirements

- Use the Supabase browser client for appropriate client-side data fetching and mutations.
- Keep the Supabase project URL and publishable/anon key in environment variables.
- Never expose a Supabase service-role key in browser code or commit secrets to Git.
- Configure Row Level Security (RLS) for tables exposed through the Supabase API.
- Do not assume that hiding a button in the UI is sufficient authorization.
- Document any server-side operations and why they are needed.

### Environment Setup

Include an `.env.example` file with placeholder values, for example:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Use the current Supabase-recommended publishable key naming if appropriate for the project setup. Never include real credentials in the repository.

---

## 3. Version 1 Scope

The first version must focus on these four main areas:

1. Dashboard
2. Products
3. Stock Movements
4. Settings

Do not implement payment processing, subscriptions, supplier integrations, barcode scanning, purchase orders, multi-branch support, or advanced analytics in Version 1.

### 3.1 Dashboard

Display a quick overview of the current inventory.

**Required information:**

- Total number of active products
- Total units currently in stock
- Total inventory value, calculated from current quantity multiplied by the product's cost price
- Number of products at or below their low-stock threshold
- A short list of low-stock products
- A short list of recent stock movements

**Requirements:**

- Dashboard values must be calculated from database records rather than hardcoded sample numbers.
- Clearly distinguish a product with zero stock from a product with low but positive stock.
- Provide links or actions that lead to the relevant product or movement record.
- Show useful loading, empty, and error states.
- Explain in the interface how inventory value is calculated.

### 3.2 Product Management

Users must be able to create, view, edit, search, filter, and deactivate products.

**Product fields:**

- Product ID: generated unique identifier
- Product name: required
- SKU or product code: required and unique within the inventory
- Description: optional
- Category: optional in Version 1
- Cost price: required, zero or greater
- Selling price: optional, zero or greater
- Current quantity: calculated from recorded stock movements, or maintained through a reliable transactional approach
- Low-stock threshold: required, zero or greater
- Active/inactive status
- Created timestamp
- Updated timestamp

**Product requirements:**

- Validate required fields and numeric values.
- Prevent duplicate SKUs within the same inventory.
- Do not allow negative cost price, selling price, or low-stock threshold.
- Do not let users directly edit current stock in the ordinary product form. Quantity changes should be recorded through Stock In or Stock Out.
- Allow a product to be deactivated instead of permanently deleted if it has stock movement history.
- Prevent deleting a product that is referenced by stock movements. Prefer deactivation to preserve records.
- Support search by product name or SKU.
- Support filtering by category and stock status, where applicable.
- Make it clear when an SKU already exists or a field is invalid.

### 3.3 Stock Movements

Users must be able to record stock received and stock removed from inventory.

**Movement types:**

- `Stock In`: increases available stock
- `Stock Out`: decreases available stock
- `Adjustment`: corrects a recorded quantity when an authorized user identifies a discrepancy

**Movement fields:**

- Movement ID: generated unique identifier
- Product ID: required reference to a product
- Movement type: required
- Quantity: positive whole number
- Previous quantity: captured for audit/display if supported by the chosen design
- Resulting quantity: captured for audit/display if supported by the chosen design
- Reason or note: optional for normal movements; required for adjustments
- Created timestamp
- Recorded by: optional in a single-user demo, required when authentication is added

**Movement requirements:**

- Quantity must be a positive whole number.
- Stock Out must not make the stock quantity negative.
- A movement must update stock and create its history record as one reliable database operation. Avoid updating quantity and inserting history as separate, failure-prone client operations.
- Prevent a movement from being recorded if the referenced product is inactive.
- Movement history must be retained; do not offer ordinary editing or deletion of posted movements.
- If a movement is entered incorrectly, record a correcting adjustment or reversal rather than silently rewriting history.
- Show the product, movement type, quantity, date, and note in the movement history.
- Allow filtering by product, movement type, and date range if practical for Version 1.
- Display clear success or error feedback after submission.

**Important implementation note:** Use a PostgreSQL function/RPC or another safe transactional database approach for stock changes. Ensure the quantity check and update are safe when two changes happen close together. Do not rely only on a quantity check performed in the browser.

### 3.4 Settings

Keep settings simple in Version 1.

**Required settings:**

- Shop or inventory name
- Default low-stock threshold for newly created products, if a default is used
- Optional currency display setting; use PHP (₱) as the initial default

**Requirements:**

- Validate settings before saving.
- Apply defaults only to new products; changing a default should not silently overwrite existing product thresholds.
- Persist settings in the database or another documented persistence mechanism appropriate to the selected single-user/authentication model.

---

## 4. User Experience and Interface

The interface should feel like a small, polished business tool rather than a generic admin template.

### Main Navigation

Provide clear navigation for:

- Dashboard
- Products
- Stock Movements
- Settings

### UI Requirements

- Use consistent spacing, typography, buttons, forms, and status indicators.
- Provide confirmation before destructive or consequential actions.
- Make low-stock and out-of-stock states visually distinct without relying on color alone.
- Use accessible labels, keyboard-friendly controls, and clear validation messages.
- Make tables usable on smaller screens through responsive layouts, horizontal scrolling, or compact cards.
- Include loading, empty, success, and error states for important screens.
- Avoid unnecessary charts and animations in Version 1.
- Use realistic seed data for local development, but never treat seed data as production data.
- Ensure all buttons and controls perform their advertised actions.

### Suggested Pages

- `/` — Dashboard
- `/products` — Product list
- `/products/new` — Create product
- `/products/[id]` — Product details and edit actions
- `/movements` — Stock movement history
- `/movements/new` — Record a stock movement
- `/settings` — Inventory settings

The exact route structure may be adjusted if the resulting organization is simpler and consistent.

---

## 5. Data Model and Database Design

Design a relational PostgreSQL schema. At minimum, consider these tables:

### `products`

Suggested columns:

- `id` — UUID primary key
- `name` — text, required
- `sku` — text, required
- `description` — text, nullable
- `category` — text, nullable
- `cost_price` — numeric, non-negative
- `selling_price` — numeric, nullable and non-negative
- `low_stock_threshold` — integer, non-negative
- `quantity_on_hand` — integer, non-negative, if using a maintained stock balance
- `is_active` — boolean
- `created_at` — timestamp with time zone
- `updated_at` — timestamp with time zone

### `stock_movements`

Suggested columns:

- `id` — UUID primary key
- `product_id` — foreign key to `products.id`
- `movement_type` — constrained value such as `IN`, `OUT`, or `ADJUSTMENT`
- `quantity` — positive integer representing the movement amount
- `quantity_before` — integer, where appropriate
- `quantity_after` — integer, where appropriate
- `note` — text, nullable except where required for adjustments
- `created_at` — timestamp with time zone
- `created_by` — nullable user reference in a single-user demo; define clearly if authentication is added

### `inventory_settings`

Suggested columns:

- `id` — UUID primary key
- `shop_name` — text, required
- `default_low_stock_threshold` — non-negative integer
- `currency_code` — text, default `PHP`
- `updated_at` — timestamp with time zone

### Database Design Rules

- Use primary keys, foreign keys, appropriate `NOT NULL` constraints, unique constraints, and check constraints.
- Add indexes for common searches and joins, such as SKU lookup and stock movement history by product/date, when justified.
- Decide and document the source of truth for stock quantity. Do not allow the movement ledger and product balance to silently diverge.
- If `quantity_on_hand` is maintained, update it only through the same transactional operation that records a movement.
- Use a database constraint or safe database operation to prevent negative stock.
- Use consistent timestamp handling.
- Provide a `schema.sql` file and any required migration files.
- Include a Mermaid ERD in the README or a separate documentation file.
- Explain key schema decisions in the documentation.

### ERD Deliverable

Include an Entity Relationship Diagram (ERD) that shows:

- Tables and important columns
- Primary keys and foreign keys
- The relationship between products and stock movements
- How inventory settings are associated with the inventory

For Version 1, a single inventory/shop is sufficient. Design the schema so future multi-user or multi-shop support can be added without building that complexity now.

---

## 6. Authentication and Security Scope

Keep the first version small, but do not mistake a public demo for a secure private application.

Choose and document one of these approaches before implementation:

- **Local learning mode:** use seed/demo data and clearly state that the deployment is a public demonstration, not a private production inventory system.
- **Single-owner mode:** implement Supabase Auth and protect the owner's records with RLS.

If the app is deployed with real, private inventory data, use authentication and appropriate authorization. Do not rely on a hidden URL or client-side UI checks to protect it.

**Security requirements:**

- Enable and test RLS on tables exposed to the browser client.
- Keep service-role credentials server-side only; never expose them in client components or public environment variables.
- Validate input in the UI and enforce critical business rules at the database boundary.
- Use parameterized database operations and avoid constructing raw SQL from user input.
- Restrict access to inventory records according to the selected security model.
- Document the demo's security limitations honestly.

A mock user switcher is not required for this project.

---

## 7. Functional Validation and Error Handling

The app should handle normal mistakes without losing or corrupting data.

Test at least the following:

1. Creating a product with valid data succeeds.
2. Creating a product with a duplicate SKU is rejected.
3. Negative prices or thresholds are rejected.
4. Stock In increases stock and creates a movement record.
5. Stock Out decreases stock and creates a movement record.
6. Stock Out greater than available stock is rejected.
7. An invalid adjustment is rejected.
8. Failed stock changes do not leave a partial update or a movement record without the corresponding stock change.
9. Deactivated products cannot receive new stock movements.
10. Product history remains available after a product is deactivated.
11. Dashboard counts and values update after valid changes.
12. Search, filters, and empty states work as expected.
13. Invalid or missing environment variables produce a clear setup error rather than a confusing blank screen.
14. Access restrictions work when using the chosen authentication/security model.

Use automated tests for important calculation and validation logic where practical. Test the transactional stock operation against the actual Supabase database during development.

---

## 8. Development Approach

Build the application in stages. Complete and test each stage before moving to the next.

### Phase 1 — Foundation

- Create the Next.js project with TypeScript.
- Configure Tailwind CSS and the basic layout.
- Set up Supabase and environment variables.
- Create database schema and migrations.
- Add seed data for development.
- Document local setup instructions.

### Phase 2 — Product Management

- Build product list and product form.
- Implement create, edit, search, filter, and deactivate flows.
- Add validation and duplicate SKU handling.
- Test the product workflows.

### Phase 3 — Stock Movements

- Implement the transactional stock movement operation.
- Build Stock In, Stock Out, and Adjustment forms.
- Build movement history and filters.
- Test that quantities and history remain consistent.

### Phase 4 — Dashboard and Settings

- Add dashboard metrics and recent activity.
- Add low-stock and out-of-stock lists.
- Build the settings page.
- Verify that displayed metrics update correctly.

### Phase 5 — Reliability and Polish

- Improve loading, empty, error, and success states.
- Check accessibility and responsive layouts.
- Test business rules and security policies.
- Review code organization and remove unused code.
- Verify there are no broken buttons or placeholder features presented as complete.

### Phase 6 — Deployment and Documentation

- Deploy to Vercel or another compatible platform.
- Configure production environment variables.
- Apply the database schema/migrations to the production Supabase project.
- Test the deployed app end-to-end.
- Add screenshots, setup steps, schema documentation, and the ERD to the repository.
- Provide the live deployment URL and public repository URL.

---

## 9. Code Organization and Quality

Keep responsibilities clear and avoid unnecessary complexity.

- Use reusable components for repeated UI patterns.
- Separate validation and inventory business rules from presentation code.
- Keep TypeScript types explicit and avoid using `any` without a strong reason.
- Use consistent naming conventions.
- Handle Supabase errors instead of ignoring them.
- Avoid duplicating stock calculations across unrelated components.
- Keep database schema and migrations version-controlled.
- Do not add a global state library unless a demonstrated need exists.
- Do not introduce a large architecture for a small Version 1 application.
- Add comments when they clarify non-obvious business rules, not to narrate every line.

Before implementing a new feature, check whether it is required for Version 1. If it is not, record it under Future Improvements instead of expanding the current scope.

---

## 10. Evaluation Criteria

Evaluate the finished project using these criteria:

- **Functional correctness:** Product and stock workflows behave correctly.
- **Inventory integrity:** Stock balances and movement history remain consistent, including when a database operation fails.
- **Database design:** Relationships, constraints, indexes, and migrations are appropriate.
- **Security:** RLS and access rules match the documented deployment model.
- **Code quality:** The code is readable, organized, typed, and maintainable.
- **UI/UX:** Users can understand the dashboard and complete common tasks without confusion.
- **Responsiveness and accessibility:** Main workflows work on desktop and mobile, with accessible form controls and feedback.
- **Performance:** Common pages and database queries remain responsive with realistic sample data.
- **Deployment:** The live app connects to the correct database and works outside the developer's machine.
- **Documentation:** A new developer can install, configure, run, and understand the project.

Do not claim scalability or production readiness without testing the relevant requirements.

---

## 11. Submission Deliverables

The completed repository should contain:

1. Source code for the Next.js application.
2. A `README.md` with the project overview, features, stack, setup steps, and screenshots.
3. An `.env.example` file containing placeholders only.
4. A `schema.sql` file and/or version-controlled database migrations.
5. An ERD using Mermaid in the README or a separate documentation file.
6. Seed data or instructions for setting up demo records.
7. Tests for important business rules where practical.
8. Instructions for applying the database schema and deploying the application.
9. A public GitHub repository URL.
10. A working live deployment URL, if deployment is part of the current milestone.

Never commit `.env.local`, passwords, access tokens, service-role keys, or other secrets.

---

## 12. Future Improvements — Not Required for Version 1

Only consider these after the core app is stable:

- Product categories as a dedicated table
- Supplier records
- Purchase orders and receiving workflows
- Barcode or QR scanning
- CSV import/export
- Printable inventory reports
- Multiple users and staff roles
- Multiple shops or branches
- Audit log and stocktake workflow
- Motorcycle parts fields such as part number, brand, and compatible motorcycle models
- Subscription plans and billing

These are possible future directions, not commitments for the initial release.

---

## Definition of Done

Version 1 is complete when:

- A user can manage product records.
- A user can record Stock In, Stock Out, and valid adjustments.
- Stock cannot become negative through normal application operations.
- Every successful stock change has a corresponding history record.
- The dashboard accurately reflects current inventory.
- Low-stock products are identifiable.
- The app handles loading, empty, validation, and database error states.
- The database schema, constraints, security approach, and ERD are documented.
- The project can be set up from the README using environment variables.
- The deployed version has been tested end-to-end, if a live deployment is required.

**Final instruction to the AI coding assistant:** Implement this specification incrementally. Start by reviewing the requirements, proposing a concise implementation plan and database schema, and identifying any important design decisions. Do not generate the entire application in one unreviewable step. Complete one phase at a time, explain important decisions, and verify each phase before proceeding.
