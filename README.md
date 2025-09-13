# AYExpress E-commerce Platform

This is a comprehensive e-commerce platform featuring a user-facing storefront and a powerful admin dashboard, built with React and **Supabase**. It leverages Google Gemini for AI-powered features.

## Deployment to Netlify (English)

Follow these steps carefully to ensure your project deploys and runs correctly on Netlify. The most common issue (a blank screen, or API errors) is caused by missing environment variables.

### Step 1: Connect Your GitHub Repository

1.  Log in to your [Netlify](https://www.netlify.com/) account.
2.  From the dashboard, click on **"Add new site"** and then choose **"Import an existing project"**.
3.  Connect to your Git provider (e.g., GitHub) and select the repository for this project.

### Step 2: Configure Environment Variables (Most Important Step!)

This is the most critical step. Your app needs API keys to connect to Supabase and Google Gemini.

1.  Navigate to your site's **Site configuration > Build & deploy > Environment > Environment variables** and click **"Edit variables"**.
2.  You must add three variables:

    | Key                 | Value                                                              |
    | ------------------- | ------------------------------------------------------------------ |
    | `SUPABASE_URL`      | Your Supabase Project URL (from Supabase Dashboard > Settings > API) |
    | `SUPABASE_ANON_KEY` | Your Supabase `anon` public key (from the same API page)             |
    | `API_KEY`           | Your secret Google Gemini API Key                                  |

3.  **Build Settings:**
    *   Netlify will automatically detect and build this project. You can leave the **Build command** empty.
    *   Set the **Publish directory** to your root directory (`/`).

> **Note for Local Development:** To run the project on your local machine, you must also make these environment variables available to your development server. The method depends on your setup (e.g., using a `.env` file with a tool like Vite).

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

এটি সবচেয়ে গুরুত্বপূর্ণ ধাপ। আপনার অ্যাপটির Supabase এবং Google Gemini-এর সাথে সংযোগ করার জন্য API কী প্রয়োজন।

1.  **Site configuration > Build & deploy > Environment > Environment variables**-এ যান এবং **"Edit variables"**-এ ক্লিক করুন।
2.  আপনাকে অবশ্যই তিনটি ভেরিয়েবল যোগ করতে হবে:

    | Key                 | Value                                                              |
    | ------------------- | ------------------------------------------------------------------ |
    | `SUPABASE_URL`      | আপনার Supabase প্রজেক্টের URL (Supabase Dashboard > Settings > API থেকে) |
    | `SUPABASE_ANON_KEY` | আপনার Supabase `anon` পাবলিক কী (একই API পেজ থেকে)                   |
    | `API_KEY`           | আপনার গোপন Google Gemini API কী                                    |

3.  **বিল্ড সেটিংস:**
    *   Netlify স্বয়ংক্রিয়ভাবে এই প্রজেক্টটি সনাক্ত এবং বিল্ড করবে। আপনি **Build command** খালি রাখতে পারেন।
    *   **Publish directory** আপনার রুট ডিরেক্টরিতে (`/`) সেট করুন।

> **লোকাল ডেভেলপমেন্টের জন্য নোট:** প্রকল্পটি আপনার লোকাল মেশিনে চালানোর জন্য, আপনাকে অবশ্যই এই এনভায়রনমেন্ট ভেরিয়েবলগুলো আপনার ডেভেলপমেন্ট সার্ভারে উপলব্ধ করতে হবে। এর পদ্ধতিটি আপনার সেটআপের উপর নির্ভর করে (যেমন, একটি `.env` ফাইল ব্যবহার করে)।

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