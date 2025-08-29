'use client';

import { useState, useEffect } from 'react';

export default function DebugPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'cars' | 'invoices' | 'blogs' | 'all'>('all');
  const [authToken, setAuthToken] = useState('');

  useEffect(() => {
    // Try to get the auth token from localStorage
    const token = localStorage.getItem('dt-admin-token') || '';
    setAuthToken(token);
  }, []);

  const fetchData = async (endpoint: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/debug/${endpoint}`, {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to fetch data');
      }
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching debug data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'all') {
      fetchData('all-data');
    } else {
      fetchData(activeTab);
    }
  }, [activeTab, authToken]);

  const renderContent = () => {
    if (loading) return <div className="text-center py-8">Loading...</div>;
    if (error) return <div className="text-red-500 p-4 bg-red-50 rounded">Error: {error}</div>;
    if (!data) return <div>No data available</div>;

    return (
      <div className="mt-4">
        {activeTab === 'all' ? (
          <div>
            <h2 className="text-xl font-bold mb-4">KV Store Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold">Total Keys</h3>
                <p className="text-2xl">{data.keyCounts?.total || 0}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold">Cars</h3>
                <p className="text-2xl">{data.keyCounts?.cars || 0}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold">Invoices</h3>
                <p className="text-2xl">{data.keyCounts?.invoices || 0}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold">Blogs</h3>
                <p className="text-2xl">{data.keyCounts?.blogs || 0}</p>
              </div>
            </div>

            <h3 className="text-lg font-semibold mt-6 mb-2">Sample Data</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium">Cars (first 3)</h4>
                <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
                  {JSON.stringify(data.sampleData?.cars || [], null, 2)}
                </pre>
              </div>
              
              <div>
                <h4 className="font-medium">Invoices (first 3)</h4>
                <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
                  {JSON.stringify(data.sampleData?.invoices || [], null, 2)}
                </pre>
              </div>
              
              <div>
                <h4 className="font-medium">Blogs (first 3)</h4>
                <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
                  {JSON.stringify(data.sampleData?.blogs || [], null, 2)}
                </pre>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-medium mb-2">All Keys (first 50)</h4>
              <div className="bg-gray-100 p-4 rounded max-h-60 overflow-y-auto">
                <ul className="space-y-1">
                  {data.allKeys?.map((key: string, i: number) => (
                    <li key={i} className="font-mono text-sm break-all">{key}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">KV Store Debug</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Auth Token (from localStorage)
        </label>
        <input
          type="text"
          value={authToken}
          onChange={(e) => setAuthToken(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="Paste your auth token here"
        />
        <p className="text-xs text-gray-500 mt-1">
          Get this from localStorage 'dt-admin-token' when logged into the admin
        </p>
      </div>

      <div className="flex space-x-2 mb-4 border-b">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 ${activeTab === 'all' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('cars')}
          className={`px-4 py-2 ${activeTab === 'cars' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
        >
          Cars
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 ${activeTab === 'invoices' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
        >
          Invoices
        </button>
        <button
          onClick={() => setActiveTab('blogs')}
          className={`px-4 py-2 ${activeTab === 'blogs' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
        >
          Blogs
        </button>
      </div>

      {renderContent()}
    </div>
  );
}
