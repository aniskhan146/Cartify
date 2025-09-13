# AYExpress E-commerce Platform

This is a comprehensive e-commerce platform featuring a user-facing storefront and a powerful admin dashboard, built with React and **Supabase**. It leverages Google Gemini for AI-powered features.

## Local Development Setup

To run this project on your local machine, you need to configure your API keys.

1.  **Install Dependencies:** If you have `npm` installed, run `npm install` in the project directory.
2.  **Configure API Keys:**
    *   Find the `config.ts` file in the project's root directory.
    *   Open it and replace the placeholder values (`'YOUR_SUPABASE_URL'`, etc.) with your actual credentials from Supabase and Google AI Studio.
3.  **Run the App:** Run `npm start` (or your configured run command).

> **Important:** The `config.ts` file contains your secret keys. It is already included in `.gitignore` to prevent it from being committed to version control. **Do not remove it from `.gitignore`**.

---

## Deployment to Netlify (English)

For deployment, it is highly recommended to use **environment variables** instead of the `config.ts` file for better security. The application is already configured to prioritize environment variables if they are available.

### Step 1: Connect Your GitHub Repository

1.  Log in to your [Netlify](https://www.netlify.com/) account.
2.  From the dashboard, click on **"Add new site"** and then choose **"Import an existing project"**.
3.  Connect to your Git provider and select the repository for this project.

### Step 2: Configure Environment Variables (Most Important Step!)

1.  Navigate to your site's **Site configuration > Build & deploy > Environment > Environment variables** and click **"Edit variables"**.
2.  Add the following three variables. These will override the values in `config.ts` on the production server.

    | Key                 | Value                                                              |
    | ------------------- | ------------------------------------------------------------------ |
    | `SUPABASE_URL`      | Your Supabase Project URL (from Supabase Dashboard > Settings > API) |
    | `SUPABASE_ANON_KEY` | Your Supabase `anon` public key (from the same API page)             |
    | `API_KEY`           | Your secret Google Gemini API Key                                  |

3.  **Build Settings:**
    *   **Build command:** (Leave blank or at its default).
    *   **Publish directory:** `/` (Set to the root directory).

### Step 3: Set Up the Supabase Database Schema

If you are setting up a new Supabase project, you must create the database schema.

1.  Navigate to the **SQL Editor** section in your Supabase project dashboard.
2.  Click **+ New query**.
3.  Open the `supabase/schema.txt` file from this repository and copy its **entire content**.
4.  Paste the SQL content into the Supabase SQL Editor and click **RUN**.

This script creates all necessary tables and security policies.

### Step 4: (Optional) Seed Initial Data

The application no longer seeds the database automatically. This change makes the application lighter and deployments faster. If you are starting with a new, empty database, you can manually add sample categories and variant options by running the SQL script below in your Supabase SQL Editor. This will populate your store with some initial data to get you started.

```sql
-- This script adds sample data to your AYExpress database.
-- Run this in your Supabase SQL Editor AFTER running the schema.txt script.

-- Seed Categories
INSERT INTO public.categories (name, icon_url, product_count) VALUES
('Electronics', 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZHRoPSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxyZWN0IHg9IjIiIHk9IjciIHdpZHRoPSIyMCIgaGVpZHRoPSIxMyIgcng9IjIiIHJ5PSIyIj48L3JlY3Q+PHBhdGggZD0iTTEyIDE4VjdsLTMgM2g2bC0zLTMiPjwvcGF0aD48cGF0aCBkPSJNMjEgMTNoMjAiPjwvcGF0aD48L3N2Zz4=', 0),
('Fashion', 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZHRoPSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yMC4yOCAxNS4zNGwtNC4yOCA0LjI4YTIgMiAwIDAgMS0yLjgzIDBsLTQuMjgtNC4yOGEyIDIgMCAwIDEgMC0yLjgzbDQuMjgtNC4yOGEyIDIgMCAwIDEgMi44MyAwbDQuMjggNC4yOGEyIDIgMCAwIDEgMCAyLjgzek04LjUgMTcuNWwtNC00TTIxLjUgMTAuNWwtNCA0TTEyIDIxLjVWMTlNMTIgN1YyLjUiPjwvcGF0aD48L3N2Zz4=', 0),
('Home & Garden', 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZHRoPSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yIDIyaDIwTTIgMTRoMjBNMyAxNHYtNWEyIDIgMCAwIDEgMi0yaDE0YTIgMiAwIDAgMSAyIDJ2NU0xMiAxNFY3TTcgMTRWN00xNyAxNFY3TTEyIDRhMiAyIDAgMCAwLTIgMnYxaDRWNgeyI+PC9wYXRoPjwvc3ZnPg==', 0),
('Sports', 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZHRoPSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIj48L2NpcmNsZT48cGF0aCBkPSJNMTIgMmExMCAxMCAwIDAgMC0xMCAxMGMwIDQuNDIgMi44NyA4LjE3IDYuODQgOS41Yy41LjA4Ljg2LS4zOC44Ni0uODV2LTIuMWMwLS40NC0uMzYtLjgtLjgtLjhINy41Yy0uMyAwLS41NC0uMjItLjU0LS41cy4yNC0uNS41NC0uNUg5LjVjLjQ0IDAgLjgtLjM2LjgtLjh2LTIuMWMwLS40NC0uMzYtLjgtLjgtLjhINy41Yy0uMyAwLS41NC0uMjItLjU0LS41cy4yNC0uNS41NC0uNUg5LjVjLjQ0IDAgLjgtLjM2LjgtLjhWN S41YzAtLjQ3LjM4LS44NS44Ni0uODVjMy45NyAxLjMzIDYuODQgNS4wOCA2Ljg0IDkuNWExMCAxMCAwIDAgMC0xMC0xMHoiPjwvcGF0aD48L3N2Zz4=', 0),
('Books', 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZHRoPSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik00IDE5LjVB franchisinguNSAyLjUgMCAwIDEgNi41IDE3SDIwdiJINGuNUEyLjUgMi41IDAgMCAxIDQgMTkuNXpNNCA3LjVB franchisinguNSAyLjUgMCAwIDEgNi41IDVIMjB2Mkg2LjVB franchisinguNSAyLjUgMCAwIDEgNCA3LjV6TTQgMTMuNUEyLjUgMi41IDAgMCAxIDYuNSAxMUgyMHYySDYuNUEyLjUgMi41IDAgMCAxIDQgMTMuNXoiPjwvcGF0aD48L3N2Zz4=', 0),
('Toys', 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZHRoPSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xMiAyTDggNmg4bC00LTR6TTEyIDIybDQtNEg4bDQgNHpNNiA4bC00IDRoMjBsLTQtNHpNMTggMTZsNC00SDJsNCA0Ij48L3BhdGg+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMiI+PC9jaXJjbGU+PC9zdmc+', 0),
('Health', 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZHRoPSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yMC44NCA0LjYxYTUuNSA1LjUgMCAwIDAtNy43OCAwTDEyIDUuNjdsLTEuMDYtMS4wNmE1LjUgNS41IDAgMCAwLTcuNzggNy43OGwxLjA2IDEuMDZMMSAyMS4yM2w3Ljc4LTcuNzggMS4wNi0xLjA2YTUuNSA1LjUgMCAwIDAgMC03Ljc4eiI+PC9wYXRoPjwvc3ZnPg==', 0),
('Gifts', 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZHRoPSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwb2x5bGluZSBwb2ludHM9IjIwIDEyIDIwIDIyIDQgMjIgNCAxMiI+PC9wb2x5bGluZT48cmVjdCB4PSIyIiB5PSI3IiB3aWR0aD0iMjAiIGhlaWdodD0iNSI+PC9yZWN0PjxsaW5lIHgxPSIxMiIgeTE9IjIyIiB4Mj0iMTIiIHkyPSI3Ij48L2xpbmU+PHBhdGggZD0iTTEyIDdINy41YTIuNSAyLjUgMCAwIDEgMC01QzExIDIgMTIgNyAxMiA3ek0xMiA3aDQuNWEyLjUgMi41IDAgMCAwIDAtNUMxMyAyIDEyIDcgMTIgN3oiPjwvcGF0aD48L3N2Zz4=', 0);

-- Seed Variant Options
INSERT INTO public.variant_options (name, values) VALUES
('Color', '[{"name": "Midnight Black", "colorCode": "#1C1C1E"}, {"name": "Starlight", "colorCode": "#F0EBE0"}, {"name": "Sierra Blue", "colorCode": "#A7C7E7"}, {"name": "Product Red", "colorCode": "#BF0A30"}, {"name": "Alpine Green", "colorCode": "#587464"}, {"name": "Rose Gold", "colorCode": "#B76E79"}]'),
('Size', '[{"name": "Small"}, {"name": "Medium"}, {"name": "Large"}, {"name": "XL"}, {"name": "XXL"}]'),
('Storage', '[{"name": "64GB"}, {"name": "128GB"}, {"name": "256GB"}, {"name": "512GB"}]');

-- Seed Storefront Settings (with defaults)
INSERT INTO public.storefront_settings (id, hero_images, checkout_config) VALUES
(1, '{}', '{"taxAmount": 4, "shippingChargeInsideDhaka": 60, "shippingChargeOutsideDhaka": 120}')
ON CONFLICT (id) DO NOTHING;
```

### Step 5: Deploy Your Site

1.  Trigger a new deploy from the "Deploys" tab on Netlify.
2.  Once finished, visit your live URL. The app should now be fully functional.

---

## Netlify-তে ডেপ্লয়মেন্ট (বাংলা)

আপনার প্রজেক্টটি Netlify-তে সঠিকভাবে ডেপ্লয় এবং রান করার জন্য নিচের ধাপগুলো মনোযোগ দিয়ে অনুসরণ করুন।

### ধাপ ১: আপনার GitHub রিপোজিটরি কানেক্ট করুন

1.  আপনার [Netlify](https://www.netlify.com/) অ্যাকাউন্টে লগ ইন করুন।
2.  ড্যাশবোর্ড থেকে, **"Add new site"**-এ ক্লিক করুন এবং তারপর **"Import an existing project"** বেছে নিন।
3.  আপনার গিট প্রোভাইডার (যেমন, GitHub) এর সাথে সংযোগ করুন এবং এই প্রজেক্টের রিপোজিটররিটি সিলেক্ট করুন।

### ধাপ ২: এনভায়রনমেন্ট ভেরিয়েবল কনফিগার করুন

ডেপ্লয়মেন্টের জন্য `config.ts` ফাইলের পরিবর্তে **এনভায়রনমেন্ট ভেরিয়েবল** ব্যবহার করা সবচেয়ে নিরাপদ। আপনার অ্যাপটি এমনভাবে তৈরি করা হয়েছে যাতে ডেপ্লয় করার সময় এটি স্বয়ংক্রিয়ভাবে এনভায়রনমেন্ট ভেরিয়েবল ব্যবহার করে।

1.  **Site configuration > Build & deploy > Environment > Environment variables**-এ যান এবং **"Edit variables"**-এ ক্লিক করুন।
2.  আপনাকে অবশ্যই তিনটি ভেরিয়েবল যোগ করতে হবে:

    | Key                 | Value                                                              |
    | ------------------- | ------------------------------------------------------------------ |
    | `SUPABASE_URL`      | আপনার Supabase প্রজেক্টের URL (Supabase Dashboard > Settings > API থেকে) |
    | `SUPABASE_ANON_KEY` | আপনার Supabase `anon` পাবলিক কী (একই API পেজ থেকে)                   |
    | `API_KEY`           | আপনার গোপন Google Gemini API কী                                    |

3.  **বিল্ড সেটিংস:**
    *   **Build command:** (এটি খালি রাখুন বা ডিফল্ট মান যা আছে তাই রাখুন)।
    *   **Publish directory:** `/` **(গুরুত্বপূর্ণ: এটি রুট ডিরেক্টরি হিসেবে সেট করুন।)**

### ধাপ ৩: Supabase ডেটাবেস স্কিমা সেটআপ করুন

যদি আপনি একটি নতুন Supabase প্রজেক্ট সেটআপ করেন, তবে আপনাকে অবশ্যই ডেটাবেস স্কিমা তৈরি করতে হবে।

1.  আপনার Supabase প্রজেক্টের ড্যাশবোর্ডে গিয়ে **SQL Editor** সেকশনে যান।
2.  **+ New query** বাটনে ক্লিক করুন।
3.  এই রিপোজিটরির `supabase/schema.txt` ফাইলটি খুলুন এবং এর **সম্পূর্ণ কোডটি** কপি করুন।
4.  কপি করা কোডটি Supabase SQL Editor-এ পেস্ট করুন এবং **RUN** বাটনে ক্লিক করুন।

এই স্ক্রিপ্টটি আপনার সব প্রয়োজনীয় টেবিল এবং নিরাপত্তা পলিসি তৈরি করবে।

### ধাপ ৪: (ঐচ্ছিক) প্রাথমিক ডেটা যোগ করুন

অ্যাপ্লিকেশনটি এখন আর স্বয়ংক্রিয়ভাবে ডেটাবেস সীড করে না। এই পরিবর্তনের ফলে অ্যাপ্লিকেশনটি হালকা হয়েছে এবং ডেপ্লয়মেন্ট দ্রুত হয়। আপনি যদি একটি নতুন, খালি ডেটাবেস দিয়ে শুরু করেন, তাহলে আপনি উপরের ইংরেজি নির্দেশাবলীর **Step 4** থেকে SQL কোডটি কপি করে আপনার Supabase SQL Editor-এ রান করতে পারেন। এটি আপনার স্টোরটিকে কিছু প্রাথমিক ক্যাটাগরি এবং অপশন দিয়ে শুরু করতে সাহায্য করবে।

### ধাপ ৫: আপনার সাইট ডেপ্লয় করুন

1.  Netlify-এর "Deploys" ট্যাব থেকে একটি নতুন ডেপ্লয় শুরু করুন।
2.  ডেপ্লয়মেন্ট শেষ হয়ে গেলে, আপনি আপনার নতুন লাইভ URL-এ যেতে পারবেন। অ্যাপটি এখন সম্পূর্ণরূপে কার্যকর হওয়া উচিত।