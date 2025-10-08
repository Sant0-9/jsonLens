"use client"

import { useMemo, useState } from 'react';
import { JsonValue } from '@/store/json-store';
import { profileData, getNullRates, getNumericHistograms, getFieldFrequencies, detectOutliers, getOutlierSummary } from '@/lib/data-profiler';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, Legend } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Settings, Loader2 } from 'lucide-react';
import { llmService } from '@/lib/llm-service';
import { LLMSettings } from '@/components/llm-settings';

interface ProfilerViewProps {
  data: JsonValue;
}

export function ProfilerView({ data }: ProfilerViewProps) {
  const [showLLMSettings, setShowLLMSettings] = useState(false);
  const [aiInsights, setAiInsights] = useState<{ summary?: string; analysis?: string; suggestions?: string }>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'analysis' | 'suggestions'>('summary');

  const profile = useMemo(() => profileData(data), [data]);
  const nullRates = useMemo(() => getNullRates(profile), [profile]);
  const histograms = useMemo(() => getNumericHistograms(profile, 12), [profile]);
  const frequencies = useMemo(() => getFieldFrequencies(profile), [profile]);
  const outliers = useMemo(() => detectOutliers(profile, 'zscore', 2), [profile]);
  const outlierSummary = useMemo(() => getOutlierSummary(outliers), [outliers]);

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
    if (outlierSummary !== 'No significant outliers detected') lines.push(outlierSummary);
    return lines.join(' ');
  }, [profile, nullRates, histograms, frequencies, outlierSummary]);

  const handleGenerateInsight = async (type: 'summary' | 'analysis' | 'suggestions') => {
    if (!llmService.isConfigured()) {
      setShowLLMSettings(true);
      return;
    }

    setIsGenerating(true);
    setActiveTab(type);

    try {
      const response = await llmService.generateInsight(data, type);
      if (response.success && response.content) {
        setAiInsights(prev => ({
          ...prev,
          [type]: response.content
        }));
      }
    } catch (error) {
      console.error('Failed to generate insight:', error);
    } finally {
      setIsGenerating(false);
    }
  };

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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              AI-Powered Insights
            </CardTitle>
            <CardDescription>
              Get intelligent analysis and suggestions for your data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant={activeTab === 'summary' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleGenerateInsight('summary')}
                  disabled={isGenerating}
                >
                  {isGenerating && activeTab === 'summary' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Summary
                </Button>
                <Button
                  variant={activeTab === 'analysis' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleGenerateInsight('analysis')}
                  disabled={isGenerating}
                >
                  {isGenerating && activeTab === 'analysis' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Analysis
                </Button>
                <Button
                  variant={activeTab === 'suggestions' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleGenerateInsight('suggestions')}
                  disabled={isGenerating}
                >
                  {isGenerating && activeTab === 'suggestions' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Suggestions
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLLMSettings(true)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>

              {aiInsights[activeTab] && (
                <div className="mt-4 p-4 border rounded-md bg-muted/30">
                  <h5 className="text-sm font-medium mb-2 capitalize">{activeTab}</h5>
                  <p className="text-sm whitespace-pre-wrap">{aiInsights[activeTab]}</p>
                </div>
              )}

              {!llmService.isConfigured() && (
                <div className="mt-4 p-4 border rounded-md bg-yellow-50 dark:bg-yellow-900/20">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    AI features require configuration. Click Settings to add your API key.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

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

        {outliers.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3">Outlier Detection</h4>
            <div className="space-y-4">
              {outliers.map(outlier => {
                const outlierCount = outlier.outliers.filter(o => o.isOutlier).length;
                if (outlierCount === 0) return null;

                return (
                  <Card key={outlier.field}>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        {outlier.field} - {outlierCount} outliers detected
                      </CardTitle>
                      <CardDescription>
                        Method: {outlier.method.toUpperCase()}, Threshold: {outlier.threshold}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {outlier.outliers
                          .filter(o => o.isOutlier)
                          .slice(0, 10)
                          .map((outlierData, idx) => (
                            <div key={idx} className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                              <span className="text-sm font-mono">{outlierData.value}</span>
                              <span className="text-xs text-muted-foreground">
                                Z-Score: {outlierData.zScore.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        {outlierCount > 10 && (
                          <p className="text-xs text-muted-foreground">
                            ... and {outlierCount - 10} more outliers
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showLLMSettings && (
        <LLMSettings onClose={() => setShowLLMSettings(false)} />
      )}
    </div>
  );
}
