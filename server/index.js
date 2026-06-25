require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.post('/analyze', async (req, res) => {
  const { title, transcript } = req.body;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `You are a meeting assistant. Analyze this transcript and respond ONLY with a JSON object in this exact format, no markdown, no extra text:
{
  "summary": "2-3 sentence summary of the meeting",
  "decisions": ["decision 1", "decision 2"],
  "action_items": [
    { "title": "task title", "owner": "person name", "due_date": "YYYY-MM-DD" }
  ]
}

Transcript:
${transcript}`
        }
      ]
    });

    const result = JSON.parse(completion.choices[0].message.content);

    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .insert({ title, transcript, summary: result.summary })
      .select()
      .single();

    if (meetingError) throw meetingError;

    const actionItems = result.action_items.map(item => ({
      meeting_id: meeting.id,
      title: item.title,
      owner: item.owner,
      due_date: item.due_date,
      status: 'open'
    }));

    const { error: itemsError } = await supabase
      .from('action_items')
      .insert(actionItems);

    if (itemsError) throw itemsError;

    res.json({ meeting, summary: result.summary, decisions: result.decisions, action_items: result.action_items });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
app.post('/jira/push', async (req, res) => {
  const { action_item, meeting_id } = req.body;

  const auth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');

  try {
    const jiraRes = await axios.post(
      `https://${process.env.JIRA_DOMAIN}/rest/api/3/issue`,
      {
        fields: {
          project: { key: process.env.JIRA_PROJECT_KEY },
          summary: action_item.title,
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: `Owner: ${action_item.owner}` }]
              }
            ]
          },
          issuetype: { name: 'Task' },
          duedate: action_item.due_date
        }
      },
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const jiraIssueId = jiraRes.data.key;

    await supabase
      .from('action_items')
      .update({ jira_issue_id: jiraIssueId })
      .eq('meeting_id', meeting_id)
      .eq('title', action_item.title);

    res.json({ jira_issue_id: jiraIssueId });

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
});
app.get('/meetings', async (req, res) => {
  try {
    const { data: meetings, error } = await supabase
      .from('meetings')
      .select('*, action_items(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const enriched = meetings.map(meeting => ({
      ...meeting,
      open_count: meeting.action_items.filter(i => i.status === 'open' && !i.jira_issue_id).length,
      done_count: meeting.action_items.filter(i => i.status === 'done').length,
      jira_count: meeting.action_items.filter(i => i.jira_issue_id).length,
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/email', async (req, res) => {
  const { meeting_id } = req.body;

  try {
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('*, action_items(*)')
      .eq('id', meeting_id)
      .single();

    if (meetingError) throw meetingError;

    const actionList = meeting.action_items
      .map(i => `- ${i.title} (Owner: ${i.owner}, Due: ${i.due_date})`)
      .join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `Write a professional follow-up email for a meeting called "${meeting.title}".
          
Summary: ${meeting.summary}

Action items:
${actionList}

Write a concise, friendly email that recaps the meeting and lists the action items with owners and due dates. Just write the email body, no subject line.`
        }
      ]
    });

    res.json({ email: completion.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
app.listen(3001, () => console.log('Server running on port 3001'));