# MeetingMind

A B2B productivity tool that turns meeting transcripts into structured summaries, action items, and Jira tickets.

## What it does

- Paste or upload a meeting transcript
- AI extracts a summary, key decisions, and action items with owners and due dates
- Push any action item directly to Jira as a ticket with one click
- Track all past meetings and Jira sync status in a dashboard
- Generate a follow-up email draft from the meeting summary

## Tech stack

- **Frontend:** React, Tailwind CSS
- **Backend:** Node.js, Express
- **AI:** OpenAI GPT-4o-mini
- **Database:** Supabase (PostgreSQL)
- **Integrations:** Jira REST API

## Getting started

### 1. Clone the repo
git clone https://github.com/zuhairabidi/meetingmind.git
cd meetingmind

### 2. Set up the server
cd server
npm install

Create a `.env` file in the `server` folder:
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_key
JIRA_DOMAIN=your_domain.atlassian.net
JIRA_EMAIL=your_email
JIRA_API_TOKEN=your_jira_api_token
JIRA_PROJECT_KEY=your_project_key

node index.js

### 3. Set up the frontend
cd ../client
npm install
npm start

App runs at localhost:3000, server at localhost:3001.

## Database setup

Run this in the Supabase SQL editor:

create table meetings (
  id uuid default gen_random_uuid() primary key,
  user_id text,
  title text,
  transcript text,
  summary text,
  created_at timestamp default now()
);

create table action_items (
  id uuid default gen_random_uuid() primary key,
  meeting_id uuid references meetings(id),
  title text,
  owner text,
  due_date date,
  status text default 'open',
  jira_issue_id text,
  created_at timestamp default now()
);
