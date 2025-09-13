# AYExpress E-commerce Platform

This is a comprehensive e-commerce platform featuring a user-facing storefront and a powerful admin dashboard, built with React and **Supabase**. It leverages Google Gemini for AI-powered features.

## Deployment to Netlify

Follow these steps carefully to ensure your project deploys and runs correctly on Netlify. The most common issue (a blank or black screen) is caused by missing environment variables or an incorrect database setup.

### Step 1: Connect Your GitHub Repository

1.  Log in to your [Netlify](https://www.netlify.com/) account.
2.  From the dashboard, click on **"Add new site"** and then choose **"Import an existing project"**.
3.  Connect to your Git provider (e.g., GitHub) and select the repository for this project.

### Step 2: Configure Build Settings & Environment Variables (Most Important Step!)

This is the most critical step to make your live site work.

1.  **Build Settings:** Since this project uses CDN imports and doesn't have a traditional build step, you can leave the build settings as follows:
    *   **Build command:** Leave this blank.
    *   **Publish directory:** Leave this as the default or set it to your root directory (`/`).

2.  **Add Supabase & Gemini Keys:**
    *   Before deploying, go to your site's **Site configuration > Build & deploy > Environment > Environment variables** and click **"Edit variables"**.
    *   You must add your Supabase and Google Gemini API keys. Create three new variables:

    | Key                 | Value                                                              |
    | ------------------- | ------------------------------------------------------------------ |
    | `SUPABASE_URL`      | Your Supabase Project URL (from Supabase Dashboard > Settings > API) |
    | `SUPABASE_ANON_KEY` | Your Supabase `anon` public key (from the same API page)             |
    | `API_KEY`           | Your secret Google Gemini API Key                                  |

    > **Warning:** Without these keys, the application will fail to initialize its services and will likely show a blank screen.

### Step 3: Set Up the Supabase Database Schema (How to Fix "Table Not Found" Errors)

This application requires a specific database schema to function. The "table not found" errors mean this step has not been completed.

1.  Navigate to the **SQL Editor** section in your Supabase project dashboard.
2.  Click **"New query"**.
3.  Open the `supabase/schema.sql` file from this repository and copy its entire content.
4.  Paste the SQL content into the Supabase SQL Editor.
5.  Click **"RUN"**.

This script will create all the necessary tables (`products`, `categories`, `profiles`, etc.) and set up the required security policies. After the schema is created, the application will automatically seed the tables with sample data on its first run if they are empty.

### Step 4: Deploy Your Site

1.  After configuring the environment variables and setting up the database, trigger a new deploy from the "Deploys" tab on Netlify.
2.  Once it's finished, you can visit your new live URL. The app should now be fully functional.
