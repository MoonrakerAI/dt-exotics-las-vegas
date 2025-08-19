'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SimpleAuth } from '../../lib/simple-auth';

interface EmailType {
  id: string;
  name: string;
  description: string;
}

interface TestResult {
  success: boolean;
  emailType: string;
  emailDescription: string;
  targetEmail: string;
  timestamp: string;
}

export default function EmailTestPage() {
  const [emailTypes, setEmailTypes] = useState<EmailType[]>([]);
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check authentication first
    if (!SimpleAuth.getCurrentUser()) {
      router.push('/admin/login');
      return;
    }
    loadEmailTypes();
  }, []);

  const loadEmailTypes = async () => {
    try {
      const token = localStorage.getItem('dt-admin-token');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const response = await fetch('/api/admin/test-notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load email types');
      }

      const data = await response.json();
      setEmailTypes(data.emailTypes);
    } catch (error) {
      console.error('Error loading email types:', error);
      setError('Failed to load email types');
    }
  };

  const testEmailFunction = async (emailType: string) => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('dt-admin-token');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const response = await fetch('/api/admin/test-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          emailType,
          testEmail: testEmail.trim() || undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send test email');
      }

      const result = await response.json();
      setResults(prev => [result, ...prev]);

    } catch (error) {
      console.error('Error sending test email:', error);
      setError('Failed to send test email');
    } finally {
      setLoading(false);
    }
  };

  const testAllEmails = async () => {
    setLoading(true);
    setError('');
    setResults([]);

    for (const emailType of emailTypes) {
      try {
        await testEmailFunction(emailType.id);
        // Small delay between emails
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error testing ${emailType.id}:`, error);
      }
    }

    setLoading(false);
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-cyan-400 mb-2">Email Notification Testing</h1>
          <p className="text-gray-400">Test all email notification types to verify delivery and content</p>
        </div>

        {/* Test Email Input */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8 border border-cyan-500/20">
          <h2 className="text-xl font-semibold text-cyan-400 mb-4">Test Configuration</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Test Email (optional - uses mock data if empty)
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={testAllEmails}
                disabled={loading}
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                {loading ? 'Testing...' : 'Test All'}
              </button>
              {results.length > 0 && (
                <button
                  onClick={clearResults}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Email Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {emailTypes.map((emailType) => (
            <div key={emailType.id} className="bg-gray-900 rounded-lg p-6 border border-gray-700 hover:border-cyan-500/50 transition-colors">
              <h3 className="text-lg font-semibold text-cyan-400 mb-2">{emailType.name}</h3>
              <p className="text-gray-400 text-sm mb-4">{emailType.description}</p>
              <button
                onClick={() => testEmailFunction(emailType.id)}
                disabled={loading}
                className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded-lg font-medium transition-colors"
              >
                {loading ? 'Testing...' : 'Test Email'}
              </button>
            </div>
          ))}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-gray-900 rounded-lg p-6 border border-cyan-500/20">
            <h2 className="text-xl font-semibold text-cyan-400 mb-4">Test Results</h2>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.success
                      ? 'bg-green-900/30 border-green-500/50'
                      : 'bg-red-900/30 border-red-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">{result.emailDescription}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      result.success ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                      {result.success ? 'SUCCESS' : 'FAILED'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    <div>To: {result.targetEmail}</div>
                    <div>Time: {new Date(result.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8">
          <button
            onClick={() => router.push('/admin')}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            ← Back to Admin Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
