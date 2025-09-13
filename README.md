# AYExpress E-commerce Platform

This is a comprehensive e-commerce platform featuring a user-facing storefront and a powerful admin dashboard, built with React and **Supabase**. It leverages Google Gemini for AI-powered features.

## Local Development Setup

To run this project on your local machine, you need to set up your environment variables.

1.  **Install Dependencies:** If you have `npm` installed, run `npm install` in the project directory.
2.  **Create Environment File:** Find the `.env.example` file in the root of the project. Make a copy of this file and rename it to `.env`.
3.  **Fill in Credentials:** Open your new `.env` file and fill in the required values:
    *   `SUPABASE_URL`: Your Supabase Project URL (from Supabase Dashboard > Settings > API).
    *   `SUPABASE_ANON_KEY`: Your Supabase `anon` public key (from the same API page).
    *   `API_KEY`: Your secret Google Gemini API Key.
4.  **Run the App:** Run `npm start` (or your configured run command). The application will automatically load the variables from your `.env` file.

> **Important:** The `.env` file contains secret keys and should **never** be committed to Git. The `.gitignore` file is already configured to ignore it.

---

## Deployment to Netlify (English)

Follow these steps carefully to ensure your project deploys and runs correctly on Netlify. The most common issue (a blank screen, or API errors) is caused by missing environment variables.

### Step 1: Connect Your GitHub Repository

1.  Log in to your [Netlify](https://www.netlify.com/) account.
2.  From the dashboard, click on **"Add new site"** and then choose **"Import an existing project"**.
3.  Connect to your Git provider (e.g., GitHub) and select the repository for this project.

### Step 2: Configure Environment Variables (Most Important Step!)

This is the most critical step. Your app needs API keys to connect to Supabase and Google Gemini. These keys are read from `process.env`.

1.  Navigate to your site's **Site configuration > Build & deploy > Environment > Environment variables** and click **"Edit variables"**.
2.  You must add three variables:

    | Key                 | Value                                                              |
    | ------------------- | ------------------------------------------------------------------ |
    | `SUPABASE_URL`      | Your Supabase Project URL (from Supabase Dashboard > Settings > API) |
    | `SUPABASE_ANON_KEY` | Your Supabase `anon` public key (from the same API page)             |
    | `API_KEY`           | Your secret Google Gemini API Key                                  |

3.  **Build Settings:**
    *   **Build command:** (Leave this blank or at its default value).
    *   **Publish directory:** `/` **(Important: Do NOT use `dist` or `build`. Set this to the root directory.)**

> **How it works:** When you set these variables in the Netlify UI, they are securely made available to your application as `process.env` variables during the build and runtime. The code is already set up to read from these variables.

### Step 3: Set Up the Supabase Database Schema (How to Fix "Table Not Found" Errors)

This application requires a specific database schema to function. The "table not found" errors mean this step has not been completed.

1.  Navigate to the **SQL Editor** section in your Supabase project dashboard.
2.  Click **+ New query**.
3.  Open the `supabase/schema.txt` file from this repository and copy its **entire content**.
4.  Paste the SQL content into the Supabase SQL Editor.
5.  Click the green **RUN** button.

This script will create all the necessary tables (`products`, `categories`, `profiles`, etc.) and set up the required security policies. After the schema is created, the application will automatically seed the tables with sample data on its first run if they are empty.

### Step 4: Deploy Your Site

1.  After configuring the environment variables, trigger a new deploy from the "Deploys" tab on Netlify by selecting **"Trigger deploy" > "Deploy site"**.
2.  Once it's finished, you can visit your new live URL. The app should now be fully functional.

---

## Netlify-তে ডেপ্লয়মেন্ট (বাংলা)

আপনার প্রজেক্টটি Netlify-তে সঠিকভাবে ডেপ্লয় এবং রান করার জন্য নিচের ধাপগুলো মনোযোগ দিয়ে অনুসরণ করুন। সবচেয়ে সাধারণ সমস্যা (যেমন - সাদা স্ক্রিন বা API এরর) সাধারণত এনভায়রনমেন্ট ভেরিয়েবল সেট না করার কারণে হয়।

### ধাপ ১: আপনার GitHub রিপোজিটরি কানেক্ট করুন

1.  আপনার [Netlify](https://www.netlify.com/) অ্যাকাউন্টে লগ ইন করুন।
2.  ড্যাশবোর্ড থেকে, **"Add new site"**-এ ক্লিক করুন এবং তারপর **"Import an existing project"** বেছে নিন।
3.  আপনার গিট প্রোভাইডার (যেমন, GitHub) এর সাথে সংযোগ করুন এবং এই প্রজেক্টের রিপোজিটররিটি সিলেক্ট করুন।

### ধাপ ২: এনভায়রনমেন্ট ভেরিয়েবল কনফিগার করুন (সবচেয়ে গুরুত্বপূর্ণ ধাপ!)

এটি সবচেয়ে গুরুত্বপূর্ণ ধাপ। আপনার অ্যাপটির Supabase এবং Google Gemini-এর সাথে সংযোগ করার জন্য API কী প্রয়োজন। এই কী-গুলো `process.env` থেকে পড়া হয়।

1.  **Site configuration > Build & deploy > Environment > Environment variables**-এ যান এবং **"Edit variables"**-এ ক্লিক করুন।
2.  আপনাকে অবশ্যই তিনটি ভেরিয়েবল যোগ করতে হবে:

    | Key                 | Value                                                              |
    | ------------------- | ------------------------------------------------------------------ |
    | `SUPABASE_URL`      | আপনার Supabase প্রজেক্টের URL (Supabase Dashboard > Settings > API থেকে) |
    | `SUPABASE_ANON_KEY` | আপনার Supabase `anon` পাবলিক কী (একই API পেজ থেকে)                   |
    | `API_KEY`           | আপনার গোপন Google Gemini API কী                                    |

3.  **বিল্ড সেটিংস:**
    *   **Build command:** (এটি খালি রাখুন বা ডিফল্ট মান যা আছে তাই রাখুন)।
    *   **Publish directory:** `/` **(গুরুত্বপূর্ণ: `dist` বা `build` ব্যবহার করবেন না। এটি রুট ডিরেক্টরি হিসেবে সেট করুন।)**

> **এটা কিভাবে কাজ করে:** আপনি যখন Netlify UI-তে এই ভেরিয়েবলগুলি সেট করেন, তখন সেগুলি বিল্ড এবং রানটাইমের সময় আপনার অ্যাপ্লিকেশনের জন্য `process.env` ভেরিয়েবল হিসাবে নিরাপদে উপলব্ধ করা হয়। কোডটি ইতিমধ্যেই এই ভেরিয়েবলগুলি থেকে ডেটা পড়ার জন্য সেট আপ করা আছে।

### ধাপ ৩: Supabase ডেটাবেস স্কিমা সেটআপ করুন (কিভাবে "Table Not Found" এরর ঠিক করবেন)

এই অ্যাপ্লিকেশনটির কাজ করার জন্য একটি নির্দিষ্ট ডেটাবেস স্কিমার প্রয়োজন। "table not found" এরর মানে হলো এই ধাপটি সম্পন্ন করা হয়নি।

1.  আপনার Supabase প্রজেক্টের ড্যাশবোর্ডে গিয়ে বাম পাশের মেনু থেকে **SQL Editor** সেকশনে যান।
2.  **+ New query** বাটনে ক্লিক করুন।
3.  এই রিপোজিটরির `supabase/schema.txt` ফাইলটি খুলুন এবং এর **সম্পূর্ণ কোডটি** কপি করুন।
4.  কপি করা কোডটি Supabase SQL Editor-এ পেস্ট করুন।
5.  সবুজ রঙের **RUN** বাটনে ক্লিক করুন।

এই স্ক্রিপ্টটি আপনার সব প্রয়োজনীয় টেবিল (`products`, `categories`, `profiles`, ইত্যাদি) তৈরি করবে এবং নিরাপত্তা পলিসি সেট আপ করবে। স্কিমা তৈরি হয়ে গেলে, অ্যাপটি প্রথমবার চালানোর সময় টেবিলগুলো খালি থাকলে নমুনা ডেটা দিয়ে পূর্ণ করে দেবে।

### ধাপ ৪: আপনার সাইট ডেপ্লয় করুন

1.  এনভায়রনমেন্ট ভেরিয়েবল কনফিগার করার পরে, Netlify-এর "Deploys" ট্যাব থেকে **"Trigger deploy" > "Deploy site"** সিলেক্ট করে একটি নতুন ডেপ্লয় শুরু করুন।
2.  এটি শেষ হয়ে গেলে, আপনি আপনার নতুন লাইভ URL-এ যেতে পারবেন। অ্যাপটি এখন সম্পূর্ণরূপে কার্যকর হওয়া উচিত।