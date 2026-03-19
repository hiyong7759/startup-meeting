import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { configureLlm, getLlmConfig } from '@startup-meeting/composer';
import { saveData, loadData } from '../lib/storage';

interface SavedSettings {
  apiKey: string;
  serverUrl: string;
}

export default function Settings() {
  const navigate = useNavigate();
  const currentConfig = getLlmConfig();

  const [apiKey, setApiKey] = useState('');
  const [serverUrl, setServerUrl] = useState(currentConfig.serverUrl ?? 'http://localhost:3001');
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const savedSettings = loadData<SavedSettings>('settings');
    if (savedSettings) {
      setApiKey(savedSettings.apiKey);
      setServerUrl(savedSettings.serverUrl);
    }
  }, []);

  const handleSave = () => {
    const mode = apiKey ? 'api' as const : 'cli' as const;
    configureLlm({ mode, apiKey: apiKey || undefined, serverUrl });
    saveData<SavedSettings>('settings', { apiKey, serverUrl });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) headers['x-api-key'] = apiKey;

      const res = await fetch(`${serverUrl}/health`);
      if (res.ok) {
        setTestResult('Server connected');
      } else {
        setTestResult(`Server error: ${res.status}`);
      }
    } catch (error) {
      setTestResult(`Connection failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <h2 className="text-xl font-bold">Settings</h2>

      <div>
        <label className="block text-sm text-gray-400 mb-2">LLM Proxy Server URL</label>
        <input
          type="text"
          value={serverUrl}
          onChange={(e) => setServerUrl(e.target.value)}
          placeholder="http://localhost:3001"
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-gray-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Local: http://localhost:3001 | Deployed: your-worker.workers.dev
        </p>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Anthropic API Key (BYOK)</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-ant-..."
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-gray-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Leave empty for CLI mode (local only). Required for deployed worker.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
        >
          {saved ? 'Saved!' : 'Save'}
        </button>
        <button
          onClick={handleTest}
          disabled={testing}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-lg transition-colors"
        >
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
      </div>

      {testResult && (
        <div className={`p-3 rounded-lg text-sm ${
          testResult.startsWith('Server connected') ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
        }`}>
          {testResult}
        </div>
      )}

      <div className="pt-4 border-t border-gray-800">
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          Back
        </button>
      </div>
    </div>
  );
}
