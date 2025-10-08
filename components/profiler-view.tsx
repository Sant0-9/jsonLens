"use client"

import { useMemo } from 'react';
import { JsonValue } from '@/store/json-store';
import { profileData, getNullRates, getNumericHistograms, getFieldFrequencies } from '@/lib/data-profiler';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, Legend } from 'recharts';

interface ProfilerViewProps {
  data: JsonValue;
}

export function ProfilerView({ data }: ProfilerViewProps) {
  const profile = useMemo(() => profileData(data), [data]);
  const nullRates = useMemo(() => getNullRates(profile), [profile]);
  const histograms = useMemo(() => getNumericHistograms(profile, 12), [profile]);
  const frequencies = useMemo(() => getFieldFrequencies(profile), [profile]);

  const explain = useMemo(() => {
    const lines: string[] = [];
    lines.push(`Dataset has ${profile.totalRecords} record(s) and ${profile.totalFields} field(s).`);
    if (nullRates.length > 0) {
      const topNull = nullRates.slice(0, 3).map(n => `${n.field} (${Math.round(n.nullRate * 100)}%)`).join(', ');
      lines.push(`Highest null-rate fields: ${topNull || 'none'}.`);
    }
    const numericFields = histograms.map(h => h.field);
    if (numericFields.length) lines.push(`Numeric fields detected: ${numericFields.join(', ')}.`);
    if (frequencies.length) lines.push(`Categorical fields: ${frequencies.slice(0, 3).map(f => f.field).join(', ')}.`);
    if (profile.depth > 5) lines.push('Deeply nested structure detected; consider flattening for table operations.');
    return lines.join(' ');
  }, [profile, nullRates, histograms, frequencies]);

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4 space-y-1">
        <h3 className="text-lg font-semibold">Dataset Profiler</h3>
        <p className="text-sm text-muted-foreground">Field completeness, distributions, and quick insights</p>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-8">
        <div>
          <h4 className="text-sm font-semibold mb-2">Quick Explain</h4>
          <div className="text-sm p-3 border rounded-md bg-muted/30">
            {explain}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3">Null Rates</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={nullRates.slice(0, 20)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="field" angle={-45} textAnchor="end" height={100} fontSize={10} />
              <YAxis tickFormatter={(v) => `${Math.round(v * 100)}%`} fontSize={10} />
              <Tooltip formatter={(v: number) => `${Math.round(v * 100)}%`} />
              <Bar dataKey="nullRate" fill="#f59e0b" name="Null rate" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {histograms.map(hist => {
          const chartData = hist.bins.map((b) => ({
            bin: `${b.x0.toFixed(1)}–${b.x1.toFixed(1)}`,
            count: b.count,
          }));
          return (
            <div key={hist.field}>
              <h4 className="text-sm font-semibold mb-3">Distribution: {hist.field}</h4>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="bin" fontSize={10} interval={0} angle={-45} textAnchor="end" height={80} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" name="Count" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>
    </div>
  );
}
