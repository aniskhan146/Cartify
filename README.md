# AYExpress E-commerce Platform

This is a comprehensive e-commerce platform featuring a user-facing storefront and a powerful admin dashboard, built with React and **Supabase**. It leverages Google Gemini for AI-powered features.

## Deployment to Netlify

Follow these steps carefully to ensure your project deploys and runs correctly on Netlify. The most common issue (a blank or black screen) is caused by missing environment variables, which these steps will help you resolve.

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

### Step 3: Deploy Your Site

1.  After configuring the environment variables, trigger a new deploy from the "Deploys" tab if needed.
2.  Netlify will deploy your project. Once it's finished, you can visit your new live URL.

## Supabase Database Setup

This application expects a certain database structure. When you run the application for the first time, it will automatically try to create and seed the necessary tables with sample data (`products`, `categories`, `variantOptions`, etc.).

### Security: Row Level Security (RLS)

For a production application, you **MUST** enable **Row Level Security (RLS)** on your Supabase tables to protect your data.

1.  Go to your Supabase Dashboard > Authentication > Policies.
2.  For each table, enable RLS and create policies. For example, you should make most tables publicly readable but restrict write access to only authenticated users or admins.

Your site should now be live and fully functional!