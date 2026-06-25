import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:3001/meetings')
      .then(res => res.json())
      .then(data => {
        setMeetings(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-3xl mx-auto mt-10">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-medium text-gray-800">Past meetings</h2>
        <button
          onClick={() => navigate('/')}
          className="text-sm bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
        >
          + New meeting
        </button>
      </div>

      {loading && <p className="text-sm text-gray-400">Loading...</p>}

      {!loading && meetings.length === 0 && (
        <p className="text-sm text-gray-400">No meetings yet. Analyze one to get started.</p>
      )}

      <div className="space-y-3">
        {meetings.map(meeting => (
          <div
            key={meeting.id}
            className="bg-white border border-gray-200 rounded-xl px-6 py-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">{meeting.title}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(meeting.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric'
                  })}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-500">
                  {meeting.open_count} open · {meeting.done_count} done
                </span>
                <span className={`text-xs px-2 py-1 rounded-md ${
                  meeting.jira_count > 0
                    ? 'bg-blue-50 text-blue-600'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {meeting.jira_count > 0 ? `${meeting.jira_count} in Jira` : 'No Jira tickets'}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-3 leading-relaxed line-clamp-2">
              {meeting.summary}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;