'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CrashPoint {
  id: number;
  multiplier: number;
  timestamp: Date;
}

interface Statistics {
  averageMultiplier: number;
  medianMultiplier: number;
  maxMultiplier: number;
  minMultiplier: number;
  volatility: number;
  crashesBelow2x: number;
  crashesAbove5x: number;
  crashesAbove10x: number;
}

export default function Home() {
  const [crashHistory, setCrashHistory] = useState<CrashPoint[]>([]);
  const [inputMultiplier, setInputMultiplier] = useState('');
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Generate realistic crash multiplier using exponential distribution
  const generateCrashMultiplier = (): number => {
    // House edge adjusted exponential distribution
    // Most crashes happen between 1.0x - 3.0x
    const random = Math.random();

    if (random < 0.5) {
      // 50% chance of crash between 1.0x - 2.0x
      return 1.0 + Math.random();
    } else if (random < 0.8) {
      // 30% chance of crash between 2.0x - 5.0x
      return 2.0 + Math.random() * 3;
    } else if (random < 0.95) {
      // 15% chance of crash between 5.0x - 10.0x
      return 5.0 + Math.random() * 5;
    } else {
      // 5% chance of crash above 10.0x
      return 10.0 + Math.random() * 40;
    }
  };

  const addManualCrash = () => {
    const multiplier = parseFloat(inputMultiplier);
    if (multiplier >= 1.0 && multiplier <= 100) {
      const newCrash: CrashPoint = {
        id: Date.now(),
        multiplier: parseFloat(multiplier.toFixed(2)),
        timestamp: new Date(),
      };
      setCrashHistory(prev => [newCrash, ...prev].slice(0, 100));
      setInputMultiplier('');
    }
  };

  const simulateRounds = (count: number) => {
    setIsSimulating(true);
    const newCrashes: CrashPoint[] = [];
    for (let i = 0; i < count; i++) {
      newCrashes.push({
        id: Date.now() + i,
        multiplier: parseFloat(generateCrashMultiplier().toFixed(2)),
        timestamp: new Date(Date.now() + i * 1000),
      });
    }
    setCrashHistory(prev => [...newCrashes, ...prev].slice(0, 100));
    setTimeout(() => setIsSimulating(false), 500);
  };

  const calculateStatistics = () => {
    if (crashHistory.length === 0) return null;

    const multipliers = crashHistory.map(c => c.multiplier);
    const sum = multipliers.reduce((a, b) => a + b, 0);
    const avg = sum / multipliers.length;

    const sorted = [...multipliers].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    const variance = multipliers.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / multipliers.length;
    const volatility = Math.sqrt(variance);

    return {
      averageMultiplier: parseFloat(avg.toFixed(2)),
      medianMultiplier: parseFloat(median.toFixed(2)),
      maxMultiplier: Math.max(...multipliers),
      minMultiplier: Math.min(...multipliers),
      volatility: parseFloat(volatility.toFixed(2)),
      crashesBelow2x: multipliers.filter(m => m < 2).length,
      crashesAbove5x: multipliers.filter(m => m >= 5).length,
      crashesAbove10x: multipliers.filter(m => m >= 10).length,
    };
  };

  useEffect(() => {
    setStatistics(calculateStatistics());
  }, [crashHistory]);

  const chartData = crashHistory.slice(0, 50).reverse().map((crash, index) => ({
    round: index + 1,
    multiplier: crash.multiplier,
  }));

  const distributionData = [
    { range: '1.0x-1.5x', count: crashHistory.filter(c => c.multiplier >= 1.0 && c.multiplier < 1.5).length },
    { range: '1.5x-2.0x', count: crashHistory.filter(c => c.multiplier >= 1.5 && c.multiplier < 2.0).length },
    { range: '2.0x-3.0x', count: crashHistory.filter(c => c.multiplier >= 2.0 && c.multiplier < 3.0).length },
    { range: '3.0x-5.0x', count: crashHistory.filter(c => c.multiplier >= 3.0 && c.multiplier < 5.0).length },
    { range: '5.0x-10.0x', count: crashHistory.filter(c => c.multiplier >= 5.0 && c.multiplier < 10.0).length },
    { range: '10.0x+', count: crashHistory.filter(c => c.multiplier >= 10.0).length },
  ];

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-center bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">
          Lucky Jet Crash Game Analysis
        </h1>
        <p className="text-center text-gray-400 mb-8">Statistical analysis and pattern tracking for crash game multipliers</p>

        {/* Controls */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 shadow-xl">
          <h2 className="text-xl font-semibold mb-4">Add Data</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="number"
                step="0.01"
                min="1.00"
                max="100.00"
                value={inputMultiplier}
                onChange={(e) => setInputMultiplier(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addManualCrash()}
                placeholder="Enter multiplier (e.g., 2.45)"
                className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              onClick={addManualCrash}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors font-semibold"
            >
              Add Crash
            </button>
          </div>
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => simulateRounds(10)}
              disabled={isSimulating}
              className="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg transition-colors font-semibold"
            >
              Simulate 10 Rounds
            </button>
            <button
              onClick={() => simulateRounds(50)}
              disabled={isSimulating}
              className="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg transition-colors font-semibold"
            >
              Simulate 50 Rounds
            </button>
            <button
              onClick={() => setCrashHistory([])}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-semibold"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Statistics */}
        {statistics && crashHistory.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg p-6 shadow-xl">
              <div className="text-sm text-purple-200">Average Multiplier</div>
              <div className="text-3xl font-bold">{statistics.averageMultiplier}x</div>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-6 shadow-xl">
              <div className="text-sm text-blue-200">Median Multiplier</div>
              <div className="text-3xl font-bold">{statistics.medianMultiplier}x</div>
            </div>
            <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-lg p-6 shadow-xl">
              <div className="text-sm text-green-200">Max Multiplier</div>
              <div className="text-3xl font-bold">{statistics.maxMultiplier}x</div>
            </div>
            <div className="bg-gradient-to-br from-pink-600 to-pink-800 rounded-lg p-6 shadow-xl">
              <div className="text-sm text-pink-200">Volatility (σ)</div>
              <div className="text-3xl font-bold">{statistics.volatility}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
              <div className="text-sm text-gray-400">Crashes &lt; 2.0x</div>
              <div className="text-2xl font-bold">{statistics.crashesBelow2x} <span className="text-sm text-gray-400">({((statistics.crashesBelow2x / crashHistory.length) * 100).toFixed(1)}%)</span></div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
              <div className="text-sm text-gray-400">Crashes ≥ 5.0x</div>
              <div className="text-2xl font-bold">{statistics.crashesAbove5x} <span className="text-sm text-gray-400">({((statistics.crashesAbove5x / crashHistory.length) * 100).toFixed(1)}%)</span></div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
              <div className="text-sm text-gray-400">Crashes ≥ 10.0x</div>
              <div className="text-2xl font-bold">{statistics.crashesAbove10x} <span className="text-sm text-gray-400">({((statistics.crashesAbove10x / crashHistory.length) * 100).toFixed(1)}%)</span></div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
              <div className="text-sm text-gray-400">Total Rounds</div>
              <div className="text-2xl font-bold">{crashHistory.length}</div>
            </div>
          </div>
        )}

        {/* Charts */}
        {crashHistory.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
              <h2 className="text-xl font-semibold mb-4">Multiplier Trend (Last 50 Rounds)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="round" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                    labelStyle={{ color: '#E5E7EB' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="multiplier" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: '#8B5CF6' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
              <h2 className="text-xl font-semibold mb-4">Distribution by Range</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={distributionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="range" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                    labelStyle={{ color: '#E5E7EB' }}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Recent History */}
        {crashHistory.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-4">Recent Crash History</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 px-4">Round</th>
                    <th className="text-left py-2 px-4">Multiplier</th>
                    <th className="text-left py-2 px-4">Timestamp</th>
                    <th className="text-left py-2 px-4">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {crashHistory.slice(0, 20).map((crash, index) => (
                    <tr key={crash.id} className="border-b border-gray-700 hover:bg-gray-750">
                      <td className="py-2 px-4">{index + 1}</td>
                      <td className="py-2 px-4">
                        <span className={`font-bold ${
                          crash.multiplier >= 10 ? 'text-yellow-400' :
                          crash.multiplier >= 5 ? 'text-green-400' :
                          crash.multiplier >= 2 ? 'text-blue-400' :
                          'text-red-400'
                        }`}>
                          {crash.multiplier.toFixed(2)}x
                        </span>
                      </td>
                      <td className="py-2 px-4 text-gray-400 text-sm">
                        {crash.timestamp.toLocaleTimeString()}
                      </td>
                      <td className="py-2 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          crash.multiplier >= 10 ? 'bg-yellow-900 text-yellow-200' :
                          crash.multiplier >= 5 ? 'bg-green-900 text-green-200' :
                          crash.multiplier >= 2 ? 'bg-blue-900 text-blue-200' :
                          'bg-red-900 text-red-200'
                        }`}>
                          {crash.multiplier >= 10 ? 'Mega Win' :
                           crash.multiplier >= 5 ? 'Big Win' :
                           crash.multiplier >= 2 ? 'Win' :
                           'Low'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {crashHistory.length === 0 && (
          <div className="bg-gray-800 rounded-lg p-12 text-center shadow-xl">
            <div className="text-6xl mb-4">🎲</div>
            <h2 className="text-2xl font-semibold mb-2">No Data Yet</h2>
            <p className="text-gray-400">Add crash points manually or simulate rounds to begin analysis</p>
          </div>
        )}
      </div>
    </main>
  );
}
