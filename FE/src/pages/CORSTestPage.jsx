import React, { useState } from 'react';

/**
 * Trang test CORS và connection đến API
 */
const CORSTestPage = () => {
    const [testResult, setTestResult] = useState(null);
    const [testing, setTesting] = useState(false);
    const N8N_BASE = import.meta.env.VITE_N8N_BASE_URL || 'https://duckq1-n8n.duckdns.org';

    const testCORS = async () => {
        setTesting(true);
        setTestResult(null);

        const results = {
            timestamp: new Date().toISOString(),
            tests: []
        };

        // Test 1: Simple fetch
        try {
            console.log('Test 1: Simple fetch to API with PUT...');
            const response = await fetch(`${N8N_BASE}/webhook/f75be7aa-52f0-496d-b8d6-31a1ec1afaaa/chat-with-rag/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    'user-prompt': 'test'
                })
            });

            results.tests.push({
                name: 'Simple Fetch',
                status: 'success',
                statusCode: response.status,
                headers: Object.fromEntries(response.headers.entries())
            });
        } catch (error) {
            results.tests.push({
                name: 'Simple Fetch',
                status: 'failed',
                error: error.message,
                errorName: error.name
            });
        }

        // Test 2: Check CORS headers
        try {
            console.log('Test 2: Checking CORS headers with PUT preflight...');
            const response = await fetch(`${N8N_BASE}/webhook/f75be7aa-52f0-496d-b8d6-31a1ec1afaaa/chat-with-rag/`, {
                method: 'OPTIONS',
                headers: {
                    'Access-Control-Request-Method': 'PUT',
                    'Access-Control-Request-Headers': 'Content-Type'
                }
            });

            const corsHeaders = {
                'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
                'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
                'access-control-allow-headers': response.headers.get('access-control-allow-headers')
            };

            results.tests.push({
                name: 'CORS Headers Check',
                status: 'success',
                corsHeaders
            });
        } catch (error) {
            results.tests.push({
                name: 'CORS Headers Check',
                status: 'failed',
                error: error.message
            });
        }

        // Test 3: Network connectivity
        try {
            console.log('Test 3: Testing network connectivity...');
            const online = navigator.onLine;
            results.tests.push({
                name: 'Network Connectivity',
                status: online ? 'success' : 'failed',
                online
            });
        } catch (error) {
            results.tests.push({
                name: 'Network Connectivity',
                status: 'failed',
                error: error.message
            });
        }

        setTestResult(results);
        setTesting(false);
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-slate-800 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">CORS & Connection Test</h1>

                <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-bold mb-4">API Endpoint</h2>
                    <code className="bg-gray-100 dark:bg-slate-800 p-2 rounded block text-sm break-all">
                        {`${N8N_BASE}/webhook/f75be7aa-52f0-496d-b8d6-31a1ec1afaaa/chat-with-rag`}
                    </code>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6 mb-6">
                    <button
                        onClick={testCORS}
                        disabled={testing}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {testing ? 'Testing...' : 'Run Tests'}
                    </button>
                </div>

                {testResult && (
                    <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold mb-4">Test Results</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Tested at: {new Date(testResult.timestamp).toLocaleString()}
                        </p>

                        <div className="space-y-4">
                            {testResult.tests.map((test, index) => (
                                <div
                                    key={index}
                                    className={`border rounded-lg p-4 ${test.status === 'success'
                                        ? 'border-green-300 bg-green-50'
                                        : 'border-red-300 bg-red-50'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-bold">{test.name}</h3>
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${test.status === 'success'
                                                ? 'bg-green-200 text-green-800'
                                                : 'bg-red-200 text-red-800'
                                                }`}
                                        >
                                            {test.status}
                                        </span>
                                    </div>

                                    <pre className="bg-white dark:bg-slate-900 p-3 rounded text-xs overflow-auto">
                                        {JSON.stringify(test, null, 2)}
                                    </pre>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <h3 className="font-bold mb-2">💡 Troubleshooting</h3>
                            <ul className="text-sm space-y-1 list-disc list-inside">
                                <li>Nếu "Failed to fetch": Kiểm tra CORS configuration trên server</li>
                                <li>Nếu timeout: API đang xử lý quá lâu, cần tối ưu workflow</li>
                                <li>Nếu network offline: Kiểm tra kết nối internet</li>
                                <li>Nếu 404/500: Kiểm tra API endpoint và n8n workflow</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CORSTestPage;
