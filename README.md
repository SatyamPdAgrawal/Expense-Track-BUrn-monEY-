# BUrn monEY

> **"See where your money goes."**

**BUrn monEY** is a modern, high-performance personal finance dashboard engineered to help users visualize where their money goes, eliminate unnecessary spending burn, set category budgets, and achieve ambitious savings milestones.

Designed with a sleek fintech aesthetic, BUrn monEY combines rich client-side interactivity, responsive data visualizations, and privacy-first local persistence into a production-grade portfolio application.

---

## ⚡ Key Highlights & Philosophy

The brand **BUrn monEY** does not represent reckless spending; rather, it shines a spotlight on the hidden burn in discretionary budgets. By seeing precisely where every Rupee flows, users take control of their finances and build lasting wealth.

* **Privacy-First:** All financial data remains 100% inside your browser's `localStorage`. No external servers, no tracking, zero data harvesting.
* **Smart Insights (Deterministic Intelligence):** Instead of making deceptive claims about AI models, BUrn monEY features a modular JavaScript Smart Insights engine that algorithmically analyzes spending velocity, category concentration, and savings rates. Its decoupled architecture is ready to interface with a remote AI API proxy when credentials are provided.
* **Accessible & Responsive:** Seamless transitions between Desktop (data-dense tables) and Mobile (card layouts) across viewport widths from 375px to 4K displays.

---

## ✨ Features

### 1. Financial Overview & Dynamic Summaries
* **Total Balance:** Real-time net position (`Income - Outflow`).
* **Total Inflows & Outflows:** Instant aggregation respecting date filters.
* **Savings Rate:** Calculated as `((Income - Expense) / Income) * 100` with graceful zero-income handling.
* **Indian Rupee Standard:** Native formatting (`₹1,25,000`) using `Intl.NumberFormat`.

### 2. Rule-Based Financial Health Score
* Evaluates financial resilience on a 0–100 scale using a multi-factor heuristic:
  * Savings rate tiering
  * Expense-to-income ratio
  * Category budget adherence
  * Savings goal momentum
  * Tracking consistency
* Accompanied by dynamic status labels and an explicit disclaimer indicating heuristic assessment.

### 3. Smart Insights Engine
* Automatically analyzes:
  * Highest spending category & percentage concentration
  * Peak single transaction detection
  * Savings rate evaluation (surplus vs deficit alerts)
  * Budget threshold warnings (warning at 70%, danger at 90%+)
  * Top-performing savings goals

### 4. Interactive Visualizations (Chart.js)
* **Income vs Expense:** Doughnut chart breaking down inflow vs outflow.
* **Category Spending:** Doughnut chart detailing expenditure by category.
* **6-Month Trajectory:** Dual-bar trend chart monitoring historical momentum.
* **Lifecycle Protection:** Automated cleanup destroying chart instances before re-render, eliminating memory leaks and hover flicker.
* **Empty State Fallbacks:** Informative empty states when data is absent.

### 5. Multi-Period Date Filtering
* Quick filtering buttons: `All Time`, `This Month`, `This Week`, `Today`, `This Year`.
* Custom Date Range picker allowing start and end date boundaries.
* Reactive dashboard recalculation across all cards and charts.

### 6. Transactions Management
* **Add / Edit Modal:** Polished modal forms with validation (no browser `prompt()`).
* **Delete Confirmation:** Accessible confirmation dialog before removing transactions.
* **Multi-Criteria Search & Filter:** Instant search by title, category, or note, filtered by transaction type and category, sorted by newest, oldest, highest, or lowest amount.
* **Responsive Layout:** Semantic table on desktop automatically shifts to responsive cards on mobile screens.

### 7. Category Budgets
* Set monthly expenditure limits on categories (Food, Grocery, Bills, Shopping, Travel, etc.).
* Visual progress meters with three distinct states:
  * Normal (`< 70%` — Green)
  * Warning (`70% – 90%` — Amber)
  * Danger (`> 90%` / Exceeded — Crimson)
* Multi-indicator status badges and text indicators for accessible contrast.

### 8. Multiple Savings Goals
* Track multiple goals simultaneously (Emergency Fund, New Laptop, Travel, etc.).
* Animated progress bars showing target vs current saved amount.
* **Deposit / Add Funds:** Allocate money directly to active goals.
* **Celebration:** Confetti blast triggered **only once** upon reaching 100%, moving goals to the Completed Goals history without re-firing confetti on subsequent page reloads.

### 9. Gamified Achievements
* Milestone badges unlocked progressively:
  * *First Step* (First transaction)
  * *10 Transactions*, *50 Transactions*, *100 Transactions*
  * *First Goal Smashed*, *Goal Master* (3+ goals completed)
  * *₹10,000 Saved*, *10 Days Tracking*
* Celebratory toast notifications upon unlocking new badges.

### 10. Data Portability (CSV Export & Import)
* **Export CSV:** One-click download of all transaction records as an RFC 4180-compliant `.csv` file.
* **Import CSV:** Client-side CSV reader that parses, validates, and safely merges transactions with confirmation.

### 11. Dark & Light Theme System
* Deep slate/charcoal dark theme with signature flame accent (`#f97316`).
* Clean light theme with balanced contrast.
* Persisted in `localStorage` and respected across charts.

---

## 🛠 Tech Stack

* **Structure:** Semantic HTML5
* **Styling:** Modern CSS3 Design System with CSS Variables, Flexbox, CSS Grid, Glassmorphism, and responsive breakpoints
* **Logic:** Vanilla JavaScript (ES6+ Modules)
* **Charts:** [Chart.js](https://www.chartjs.org/)
* **Celebrations:** [Canvas Confetti](https://www.kirilv.com/canvas-confetti/)
* **Typography:** [Google Fonts](https://fonts.google.com/) (*Inter* and *Plus Jakarta Sans*)
* **Icons:** Inline accessible SVG icons
* **Data Layer:** Browser `localStorage` with safe error-handling

---

## 📂 Project Structure

```text
BUrn monEY/
├── index.html              # Main application entry point
├── vercel.json             # Vercel static deployment configuration
├── .gitignore              # Standard git exclusion list
├── README.md               # Project documentation
├── css/
│   └── style.css           # Complete design system & responsive stylesheet
└── js/
    ├── app.js              # Application controller & event wiring
    ├── storage.js          # LocalStorage persistence, seed data & CSV I/O
    ├── calculations.js     # Currency formatting, totals & health score
    ├── transactions.js     # Transaction CRUD, search, filter & validation
    ├── charts.js           # Chart.js initialization & instance lifecycle
    ├── goals.js            # Multiple savings goals, deposits & celebrations
    ├── budgets.js          # Category budget limits & threshold statuses
    ├── insights.js         # Smart Insights rule engine & AI proxy readiness
    ├── achievements.js     # Gamification badges & milestone verification
    └── ui.js               # Modals, toast notifications & theme toggle
```

---

## 🚀 How to Run Locally

Because the project uses standard ES Modules (`type="module"`), it should be served via a lightweight HTTP server to allow clean module loading:

### Option A: Using Python (Built-in)
```bash
# In the project directory:
python3 -m http.server 8000
```
Then visit `http://localhost:8000` in your browser.

### Option B: Using Node.js (npx serve)
```bash
npx -y serve .
```

### Option C: Using VS Code / Cursor Live Server
Open the folder in your editor, right-click `index.html`, and select **"Open with Live Server"**.

---

## ☁️ How to Deploy

### Deploy to Vercel (Recommended)
1. Install Vercel CLI (or connect via GitHub on [vercel.com](https://vercel.com)):
   ```bash
   npx vercel
   ```
2. Follow the prompt defaults. The included `vercel.json` provides instant configuration.

### Deploy to Netlify
1. Drag and drop the project folder onto [Netlify Drop](https://app.netlify.com/drop).
2. Or link your repository and set the publish directory to `.`.

### Deploy to GitHub Pages
1. Push your repository to GitHub.
2. Go to **Settings** > **Pages**.
3. Under **Branch**, select `main` (or `master`) and folder `/ (root)`.
4. Click **Save**.

---

## 🔒 Security & Privacy

* **Zero Data Transmission:** No transaction details, income figures, or notes ever leave the user's browser.
* **XSS Sanitization:** User-supplied strings are escaped before rendering to avoid script injection.
* **Strict Validation:** Positive numbers, valid calendar dates, and character limits enforced on both client forms and CSV imports.

---

## 🤖 Future AI Integration Architecture

BUrn monEY is engineered with a modular backend adapter pattern in `js/insights.js`. When a backend AI service (e.g., Gemini, OpenAI, Claude) is ready:

```text
Frontend (BUrn monEY)
   ↓ POST /api/insights (anonymized aggregates)
Secure Backend Proxy Server (keeps API key secure)
   ↓ LLM Provider API
Personalized Natural Language Financial Coaching
```

*Note: No secret API keys are ever placed directly into client-side JavaScript.*

---

## 📜 License & Attribution

Designed and built by **Satyam Prasad Agrawal** as a high-standard fintech portfolio web application.
Open-sourced under the MIT License.
