'use client'

import { useState } from 'react'
import { Play, CheckCircle, XCircle, Clock, Database, AlertTriangle } from 'lucide-react'

interface TestResult {
  step: string
  success: boolean
  message: string
  data?: any
  error?: string
}

interface TestResponse {
  success: boolean
  message: string
  summary: {
    totalSteps: number
    successfulSteps: number
    overallSuccess: boolean
    testDuration: string
  }
  results: TestResult[]
}

export default function TestAIKnowledgeBasePage() {
  const [testing, setTesting] = useState(false)
  const [testResults, setTestResults] = useState<TestResponse | null>(null)

  const runTest = async () => {
    setTesting(true)
    setTestResults(null)

    try {
      const response = await fetch('/api/test/ai-knowledge-base', {
        method: 'POST'
      })
      const data = await response.json()
      setTestResults(data)
    } catch (error) {
      setTestResults({
        success: false,
        message: 'Failed to run test',
        summary: {
          totalSteps: 0,
          successfulSteps: 0,
          overallSuccess: false,
          testDuration: 'Failed'
        },
        results: [{
          step: 'Connection Error',
          success: false,
          message: 'Failed to connect to test endpoint',
          error: error instanceof Error ? error.message : 'Unknown error'
        }]
      })
    } finally {
      setTesting(false)
    }
  }

  const getStepIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="w-5 h-5 text-green-400" />
    ) : (
      <XCircle className="w-5 h-5 text-red-400" />
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">AI Knowledge Base Test</h1>
        <p className="text-gray-400">
          Test the AI knowledge base system to ensure cars are properly added to the database and reflected in AI responses.
        </p>
      </div>

      {/* Test Control */}
      <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <span>Knowledge Base Test Suite</span>
          </h2>
          <button
            onClick={runTest}
            disabled={testing}
            className="px-6 py-3 bg-neon-blue hover:bg-neon-blue/80 text-black font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {testing ? (
              <>
                <Clock className="w-5 h-5 animate-spin" />
                <span>Running Test...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>Run Full Test</span>
              </>
            )}
          </button>
        </div>

        <div className="text-sm text-gray-400">
          <p className="mb-2">This test will:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Add a test Ferrari to the car database</li>
            <li>Verify the AI knowledge base gets updated automatically</li>
            <li>Check that the AI system prompt includes the new car</li>
            <li>Test the fallback system</li>
            <li>Clean up by removing the test car</li>
            <li>Verify the car is removed from the knowledge base</li>
          </ul>
        </div>
      </div>

      {/* Test Results */}
      {testResults && (
        <div className="space-y-6">
          {/* Summary */}
          <div className={`rounded-lg border p-6 ${
            testResults.success 
              ? 'bg-green-900/20 border-green-500/30' 
              : 'bg-red-900/20 border-red-500/30'
          }`}>
            <div className="flex items-center space-x-3 mb-4">
              {testResults.success ? (
                <CheckCircle className="w-6 h-6 text-green-400" />
              ) : (
                <XCircle className="w-6 h-6 text-red-400" />
              )}
              <h3 className={`text-lg font-semibold ${
                testResults.success ? 'text-green-400' : 'text-red-400'
              }`}>
                {testResults.message}
              </h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Total Steps:</span>
                <div className="font-medium text-white">{testResults.summary.totalSteps}</div>
              </div>
              <div>
                <span className="text-gray-400">Successful:</span>
                <div className="font-medium text-white">{testResults.summary.successfulSteps}</div>
              </div>
              <div>
                <span className="text-gray-400">Success Rate:</span>
                <div className="font-medium text-white">
                  {Math.round((testResults.summary.successfulSteps / testResults.summary.totalSteps) * 100)}%
                </div>
              </div>
              <div>
                <span className="text-gray-400">Duration:</span>
                <div className="font-medium text-white">{testResults.summary.testDuration}</div>
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Detailed Test Results</h3>
            <div className="space-y-4">
              {testResults.results.map((result, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 bg-gray-900/50 rounded-lg">
                  <div className="flex-shrink-0 mt-0.5">
                    {getStepIcon(result.success)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-white">{result.step}</h4>
                    </div>
                    <p className={`text-sm ${
                      result.success ? 'text-gray-300' : 'text-red-300'
                    }`}>
                      {result.message}
                    </p>
                    
                    {result.error && (
                      <div className="mt-2 p-2 bg-red-900/20 border border-red-500/30 rounded text-red-300 text-sm">
                        <strong>Error:</strong> {result.error}
                      </div>
                    )}
                    
                    {result.data && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                          View Data
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-800 rounded text-xs text-gray-300 overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 bg-gray-800/30 rounded-lg border border-gray-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          <span>Important Notes</span>
        </h3>
        <div className="space-y-3 text-gray-400 text-sm">
          <p>
            <strong className="text-white">Safe Testing:</strong> This test uses a temporary Ferrari test car that is automatically cleaned up after the test completes.
          </p>
          <p>
            <strong className="text-white">Real Database:</strong> The test uses your actual car database and knowledge base, but all changes are reverted.
          </p>
          <p>
            <strong className="text-white">Test Duration:</strong> The full test takes approximately 3-4 seconds to complete.
          </p>
          <p>
            <strong className="text-white">What Success Means:</strong> A successful test confirms that adding cars to your fleet automatically updates the AI knowledge base and the AI can respond with information about new vehicles.
          </p>
        </div>
      </div>
    </div>
  )
}
