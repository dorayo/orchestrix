# Create AI Frontend Prompt Task

## Purpose

To generate a masterful, comprehensive, and optimized prompt that can be used with any AI-driven frontend development tool (e.g., Vercel v0, Lovable.ai, or similar) to scaffold or generate significant portions of a frontend application.

## Inputs

- Completed UI/UX Specification (`front-end-spec.md`)
- Completed Frontend Architecture Document (`front-end-architecture`) or a full stack combined architecture such as `architecture.md`
- Main System Architecture Document (`architecture` - for API contracts and tech stack to give further context)

## Key Activities & Instructions

### 1. Core Prompting Principles

Before generating the prompt, you must understand these core principles for interacting with a generative AI for code.

- **Be Explicit and Detailed**: The AI cannot read your mind. Provide as much detail and context as possible. Vague requests lead to generic or incorrect outputs.
- **Iterate, Don't Expect Perfection**: Generating an entire complex application in one go is rare. The most effective method is to prompt for one component or one section at a time, then build upon the results.
- **Provide Context First**: Always start by providing the AI with the necessary context, such as the tech stack, existing code snippets, and overall project goals.
- **Mobile-First Approach**: Frame all UI generation requests with a mobile-first design mindset. Describe the mobile layout first, then provide separate instructions for how it should adapt for tablet and desktop.
- **Anti-Convergence Aesthetics**: AI models default to "on distribution" outputs — the statistical average of all web design. You MUST include explicit visual direction to avoid generic "AI slop" (Inter fonts, purple gradients on white, predictable card grids). Every generated prompt must contain a `<frontend_aesthetics>` block.

### 2. The Structured Prompting Framework

To ensure the highest quality output, you MUST structure every prompt using the following four-part framework.

1. **High-Level Goal**: Start with a clear, concise summary of the overall objective. This orients the AI on the primary task.
   - _Example: "Create a responsive user registration form with client-side validation and API integration."_
2. **Detailed, Step-by-Step Instructions**: Provide a granular, numbered list of actions the AI should take. Break down complex tasks into smaller, sequential steps. This is the most critical part of the prompt.
   - _Example: "1. Create a new file named `RegistrationForm.js`. 2. Use React hooks for state management. 3. Add styled input fields for 'Name', 'Email', and 'Password'. 4. For the email field, ensure it is a valid email format. 5. On submission, call the API endpoint defined below."_
3. **Code Examples, Data Structures & Constraints**: Include any relevant snippets of existing code, data structures, or API contracts. This gives the AI concrete examples to work with. Crucially, you must also state what _not_ to do.
   - _Example: "Use this API endpoint: `POST /api/register`. The expected JSON payload is `{ "name": "string", "email": "string", "password": "string" }`. Do NOT include a 'confirm password' field. Use Tailwind CSS for all styling."_
4. **Define a Strict Scope**: Explicitly define the boundaries of the task. Tell the AI which files it can modify and, more importantly, which files to leave untouched to prevent unintended changes across the codebase.
   - _Example: "You should only create the `RegistrationForm.js` component and add it to the `pages/register.js` file. Do NOT alter the `Navbar.js` component or any other existing page or component."_

### 3. Assembling the Master Prompt

You will now synthesize the inputs and the above principles into a final, comprehensive prompt.

1. **Gather Foundational Context**:
   - Start the prompt with a preamble describing the overall project purpose, the full tech stack (e.g., Next.js, TypeScript, Tailwind CSS), and the primary UI component library being used.
2. **Inject the Anti-Convergence Aesthetics Block**:
   - Every generated prompt MUST include a `<frontend_aesthetics>` XML block. This block forces the consuming AI away from generic defaults.
   - The block must contain:
     - **Typography direction**: Specific font names (never Inter/Roboto/Arial), weight contrasts, size hierarchy.
     - **Color system**: Exact hex codes with 60-30-10 ratios, WCAG contrast notes, CSS variable names.
     - **Background atmosphere**: Gradient meshes, textures, grain overlays — never flat white.
     - **Motion choreography**: Staggered page load, specific easing curves, duration values.
     - **Layout personality**: Bento grids, asymmetric compositions, editorial layouts — never default card grids.
     - **Explicit ban list**: Name the specific fonts, colors, and patterns to AVOID.
   - Example block to include in every generated prompt:
     ```xml
     <frontend_aesthetics>
     CRITICAL: Avoid generic "AI slop" aesthetics. Make distinctive, intentional design choices.

     Typography: Use [specific font] for headings, [specific font] for body. Weight contrast: 300 vs 800.
     Colors: Primary [hex] (60%), Secondary [hex] (30%), Accent [hex] (10%). All pairs WCAG AA.
     Backgrounds: [specific technique — e.g., "subtle dot grid pattern over linear-gradient(135deg, ...)"]
     Motion: Page load with staggered reveals (50ms delay per element), cubic-bezier(0.33, 1, 0.68, 1).
     Layout: [specific approach — e.g., "bento grid with 3 hero cards, asymmetric sizing"]

     BANNED: Inter, Roboto, Arial, purple-on-white gradients, equal-width card grids, flat #f5f5f5 backgrounds.
     </frontend_aesthetics>
     ```
3. **Describe the Visuals with Precision**:
   - If the user has design files (Figma, etc.), instruct them to provide links or screenshots.
   - If not, extract concrete design tokens from the front-end-spec: exact hex codes, font names, spacing values, shadow definitions. NEVER use vague adjectives like "modern", "clean", or "sleek" — these produce generic output.
4. **Build the Prompt using the Structured Framework**:
   - Follow the four-part framework from Section 2 to build out the core request, whether it's for a single component or a full page.
5. **Anti-Slop Verification**:
   - Before presenting the final prompt, verify it passes this checklist:
     - [ ] Contains `<frontend_aesthetics>` block with specific values (not placeholders)
     - [ ] No banned fonts/colors mentioned as recommendations
     - [ ] All colors have hex codes, not just names ("blue", "gray")
     - [ ] Typography specifies actual font families, weights, and sizes
     - [ ] Layout approach is named and specific, not "responsive grid"
     - [ ] Motion section includes timing values and easing curves
     - [ ] At least one "unforgettable element" is described
6. **Present and Refine**:
   - Output the complete, generated prompt in a clear, copy-pasteable format (e.g., a large code block).
   - Explain the structure of the prompt and why certain information was included, referencing the principles above.
   - <important_note>Conclude by reminding the user that all AI-generated code will require careful human review, testing, and refinement to be considered production-ready.</important_note>
