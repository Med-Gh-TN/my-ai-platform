# PROFITPREDICT – AI Profit Predictor

A web application that allows executives and investors to simulate startup profitability through a dual prediction engine:

- a **Baseline** model that ingests all expenses (R&D, administrative, marketing),
- an **Optimized (SOTA)** model that "cleans the noise" from administrative/marketing data.

The goal is to quantify the impact of operational noise on profit and provide an executive dashboard (ROI, EBITDA, risk matrices).

---

## Architecture

The application consists of three main components:

1. **Static Frontend** (this repository)
   - HTML pages served statically:
     - `index.html`: landing page / marketing.
     - `auth.html`: secure authentication portal.
     - `dashboard.html`: "Executive Command Center" with the prediction engine.
   - Modern UI with TailwindCSS (CDN), Chart.js, Font Awesome.

2. **Prediction Backend (Hugging Face / FastAPI)**
   - Python microservice (FastAPI) deployed on Hugging Face Spaces.
   - Provides an HTTP `POST /predict` endpoint used by the frontend.
   - Main dependencies are listed in `requirements.txt`:
     - `fastapi`, `uvicorn`, `pydantic`, `joblib`, `numpy`, `statsmodels`, etc.
   - This backend code is **not** included in this repository (only the requirements).

3. **Authentication & Database (Supabase)**
   - Email/password authentication, OTP, password reset, Google OAuth.
   - User profile storage (e.g. the `nickname` displayed on the dashboard).
   - Dashboard protection via Row Level Security (RLS) on the Supabase side.

---

## How It Works

### 1. User Journey

1. The user lands on `index.html` (landing page).
   - A script checks whether they are already authenticated via Supabase.
   - If so, they are automatically redirected to `dashboard.html`.

2. From the landing page, they click **Sign In / Register** → `auth.html`.
   - Again, if a Supabase session already exists, they are redirected directly to `dashboard.html`.

3. On `auth.html`, the user can:
   - **Create an account** (signup) with a password (min. 6 characters).
   - **Confirm their account** via an OTP code sent by email.
   - **Log in** with email/password.
   - **Request a password reset**.
   - **Use Google OAuth** if enabled in Supabase.

4. After a valid login / signup, the user is redirected to `dashboard.html`.

5. On `dashboard.html`:
   - A call to `requireAuth()` verifies that a valid Supabase session exists.
   - Otherwise → redirect to `auth.html`.

### 2. Prediction Engine

On the dashboard, the user configures:

- the **model type**:
  - `SOTA (Opt)`: optimized model,
  - `Baseline`: full model (with admin/marketing noise),
- the **State / sector** (select),
- the **R&D budget** (required),
- optionally **Admin OpEx** and **Marketing Spend** (required for the Baseline model).

Flow:

1. The form is validated client-side:
   - Required fields,
   - Negative values are rejected.

2. JSON payload is constructed:

```json
{
  "rd_spend": <float>,
  "admin_spend": <float>,
  "marketing_spend": <float>,
  "state": "<State>",
  "model_type": "optimized" | "all_features"
}
```

3. Call to the Hugging Face API:

- URL defined in `js/predict.js`:

```js
const HUGGING_FACE_API_URL = 'https://thisisnemo-aii.hf.space/predict';
```

- For `optimized`: a single `POST` call.
- For `all_features`:
  - Baseline request,
  - Optimized request,
  - Calculation of the *noise penalty* = profit difference between the two models.

4. Response:

The backend returns a JSON containing at minimum:

```json
{
  "predicted_profit": <float>
}
```

The frontend then:

- animates the profit value,
- generates charts with Chart.js (5-year growth, risk matrix),
- calculates and displays ROI, EBITDA %, OpEx ratios, tier level ("Unicorn", "Tier 1", "Emerging"), and an overall risk badge.

---

## Project Structure

```text
.
├── index.html          # Landing page (marketing, architecture & roadmap overview)
├── auth.html           # Secure Supabase authentication portal
├── dashboard.html      # Executive Command Center (form + charts)
├── js/
│   ├── supabase.js     # Supabase configuration + requireAuth / redirectIfAuthenticated helpers
│   ├── auth.js         # Authentication logic (signup/login/reset/OTP/OAuth)
│   ├── predict.js      # HF API calls + validation + UI orchestration
│   └── ui.js           # Animation and visualization functions (Chart.js, KPIs)
├── css/
│   └── style.css       # Additional custom styles
├── requirements.txt    # FastAPI microservice dependencies (Hugging Face side)
├── 1.jpg               # Image asset (profile / team)
└── 2.jpeg              # Image asset
```

---

## Technologies

- **Frontend**
  - HTML5, CSS3.
  - [TailwindCSS](https://tailwindcss.com/) via CDN.
  - [Chart.js](https://www.chartjs.org/) for charts.
  - [Font Awesome](https://fontawesome.com/) for icons.
  - [ScrollReveal](https://scrollrevealjs.org/) for landing page animations.
  - JavaScript ES Modules.

- **Backend (prediction)**
  - Python 3.x.
  - [FastAPI](https://fastapi.tiangolo.com/).
  - `uvicorn`, `pydantic`, `joblib`, `numpy`, `statsmodels`.
  - Hosted on **Hugging Face Spaces** (public HTTP endpoint).

- **Auth & Data**
  - [Supabase](https://supabase.com/).
  - Email/password + OTP + OAuth (Google) authentication.
  - Row Level Security (RLS) enabled on the database.

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repo-url>
cd my-ai-platform-main
```

### 2. Supabase Configuration

1. Create a Supabase project.
2. Enable email and Google authentication (optional).
3. Create a `profiles` table with at least:
   - `id` (UUID, linked to `auth.users`),
   - `nickname` (text).
4. Enable Row Level Security (RLS) and configure policies.
5. Retrieve:
   - the project URL (`SUPABASE_URL`),
   - the public key (`anon key`).

6. Update `js/supabase.js`:

```js
const SUPABASE_URL = 'https://<your-project>.supabase.co';
const SUPABASE_ANON_KEY = '<your_anon_key>';
```

> **Note:** Even though the anon key can be exposed client-side, it is recommended to properly secure your Supabase project using RLS.

### 3. Prediction Backend Deployment

1. Create a Hugging Face Space.
2. Deploy the FastAPI microservice (`app.py`) that:
   - loads your model (joblib / pickle),
   - exposes `POST /predict` and returns `predicted_profit`.
3. Install the dependencies defined in `requirements.txt`.
4. Retrieve the public URL of your Space and update `js/predict.js`:

```js
const HUGGING_FACE_API_URL = 'https://<your-space>.hf.space/predict';
```

### 4. Running the Frontend Locally

Since the frontend is purely static, you can either:

- open `index.html` directly in your browser, **or**
- use a small HTTP server (recommended for ES modules):

```bash
python -m http.server 8000
```

Then open `http://localhost:8000/index.html`.

---

## Usage

1. Go to `index.html`.
2. Click **Sign In / Register** to open the authentication portal.
3. Create an account, confirm with the OTP, then log in.
4. On the dashboard:
   - choose the model (`SOTA` vs `Baseline`),
   - enter the amounts (R&D, Admin, Marketing),
   - click **Execute Matrix**.
5. Review:
   - the predicted profit,
   - the cash flow projection,
   - the risk matrix,
   - ROI, EBITDA, tier level ("Unicorn", etc.),
   - the noise impact (noise penalty) between Baseline and SOTA.

---

## Security

- Authentication relies on Supabase with RLS.
- The frontend uses a Supabase anonymous key; make sure to:
  - enable strict RLS policies,
  - never expose admin secrets client-side.
- The Hugging Face prediction API is public; if needed, consider adding:
  - rate limits,
  - authentication,
  - or a private backend proxy.

---

## License

DjagoraLab
