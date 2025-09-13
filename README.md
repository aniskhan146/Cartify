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

This script creates all necessary tables and security policies. The app will automatically seed the tables with sample data on its first run if they are empty.

### Step 4: Deploy Your Site

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

### ধাপ ৪: আপনার সাইট ডেপ্লয় করুন

1.  Netlify-এর "Deploys" ট্যাব থেকে একটি নতুন ডেপ্লয় শুরু করুন।
2.  ডেপ্লয়মেন্ট শেষ হয়ে গেলে, আপনি আপনার নতুন লাইভ URL-এ যেতে পারবেন। অ্যাপটি এখন সম্পূর্ণরূপে কার্যকর হওয়া উচিত।
