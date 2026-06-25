import React, { useState } from 'react';

function UploadTranscript() {
  const [title, setTitle] = useState('');
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [jiraStatus, setJiraStatus] = useState({});
  const [email, setEmail] = useState(null);
  const [emailLoading, setEmailLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!title || !transcript) return alert('Please fill in both fields.');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, transcript })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePushToJira = async (item) => {
    setJiraStatus(prev => ({ ...prev, [item.title]: 'pushing' }));

    try {
      const response = await fetch('http://localhost:3001/jira/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action_item: item, meeting_id: result.meeting.id })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setJiraStatus(prev => ({ ...prev, [item.title]: data.jira_issue_id }));
    } catch (err) {
      setJiraStatus(prev => ({ ...prev, [item.title]: 'error' }));
    }
  };
  const handleGenerateEmail = async () => {
  setEmailLoading(true);
  try {
    const response = await fetch('http://localhost:3001/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meeting_id: result.meeting.id })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    setEmail(data.email);
  } catch (err) {
    console.error(err);
  } finally {
    setEmailLoading(false);
  }
};

  return (
    <div className="max-w-2xl mx-auto mt-10">
      {!result ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-xl font-medium text-gray-800 mb-6">Upload a Meeting</h2>

          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-1">Meeting title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q3 Planning Sync"
              className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-gray-400"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-600 mb-1">Paste transcript</label>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste your meeting transcript here..."
              rows={10}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-gray-400 resize-none"
            />
          </div>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="bg-gray-800 text-white text-sm px-6 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Analyze meeting'}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-xl font-medium text-gray-800 mb-2">{title}</h2>
          <p className="text-sm text-gray-500 mb-6">Analysis complete</p>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Summary</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{result.summary}</p>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Key decisions</h3>
            <ul className="space-y-1">
              {result.decisions.map((d, i) => (
                <li key={i} className="text-sm text-gray-600 flex gap-2">
                  <span className="text-gray-400">—</span>{d}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Action items</h3>
            <div className="space-y-2">
              {result.action_items.map((item, i) => (
                <div key={i} className="border border-gray-100 rounded-lg px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.title}</p>
                    <p className="text-xs text-gray-400 mt-1">Owner: {item.owner} · Due: {item.due_date}</p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    {!jiraStatus[item.title] && (
                      <button
                        onClick={() => handlePushToJira(item)}
                        className="text-xs border border-blue-200 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-50"
                      >
                        Push to Jira
                      </button>
                    )}
                    {jiraStatus[item.title] === 'pushing' && (
                      <span className="text-xs text-gray-400">Pushing...</span>
                    )}
                    {jiraStatus[item.title] === 'error' && (
                      <span className="text-xs text-red-400">Failed</span>
                    )}
                    {jiraStatus[item.title] && jiraStatus[item.title] !== 'pushing' && jiraStatus[item.title] !== 'error' && (
                      <span className="text-xs text-green-600 font-medium">{jiraStatus[item.title]} ✓</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-6 border-t border-gray-100 pt-6">
  <div className="flex items-center justify-between mb-3">
    <h3 className="text-sm font-medium text-gray-700">Follow-up email</h3>
    <button
      onClick={handleGenerateEmail}
      disabled={emailLoading}
      className="text-xs border border-gray-200 text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-50 disabled:opacity-50"
    >
      {emailLoading ? 'Generating...' : 'Generate email'}
    </button>
  </div>

  {email && (
    <div className="relative">
      <textarea
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        rows={8}
        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-600 focus:outline-none focus:border-gray-400 resize-none"
      />
      <button
        onClick={() => navigator.clipboard.writeText(email)}
        className="mt-2 text-xs text-gray-400 hover:text-gray-600"
      >
        Copy to clipboard
      </button>
    </div>
     )}
  </div>
          <button
            onClick={() => { setResult(null); setTitle(''); setTranscript(''); setJiraStatus({}); }}
            className="mt-6 text-sm text-gray-400 hover:text-gray-600"
          >
            ← Analyze another meeting
          </button>
        </div>
      )}
    </div>
  );
}

export default UploadTranscript;