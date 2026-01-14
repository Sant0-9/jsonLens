'use client'

import { useSettingsStore } from '@/store/settings-store'
import { Card, CardContent, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { DollarSign, Bell, BellOff } from 'lucide-react'

export function BudgetSettings() {
  const { settings, updateBudget } = useSettingsStore()
  const budget = settings.budget

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        {/* Monthly Budget Limit */}
        <div className="space-y-2">
          <Label htmlFor="monthlyLimit">Monthly Budget Limit</Label>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <Input
              id="monthlyLimit"
              type="number"
              min={0}
              step={5}
              placeholder="50"
              value={budget.monthlyLimit || ''}
              onChange={(e) =>
                updateBudget({
                  monthlyLimit: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              className="w-32"
            />
            <span className="text-sm text-muted-foreground">USD per month</span>
          </div>
          <CardDescription>
            Set a monthly spending limit across all API providers. Leave empty for no limit.
          </CardDescription>
        </div>

        {/* Alert Threshold */}
        <div className="space-y-2">
          <Label htmlFor="alertThreshold">Alert Threshold</Label>
          <div className="flex items-center gap-2">
            <Input
              id="alertThreshold"
              type="number"
              min={0}
              max={100}
              placeholder="80"
              value={budget.alertThreshold || ''}
              onChange={(e) =>
                updateBudget({
                  alertThreshold: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              className="w-20"
            />
            <span className="text-sm text-muted-foreground">% of budget</span>
          </div>
          <CardDescription>
            Get notified when you reach this percentage of your monthly budget.
          </CardDescription>
        </div>

        {/* Enable/Disable Alerts */}
        <div className="space-y-2">
          <Label>Budget Alerts</Label>
          <div className="flex gap-2">
            <button
              onClick={() => updateBudget({ alertEnabled: true })}
              className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-colors ${
                budget.alertEnabled
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-input hover:bg-muted'
              }`}
            >
              <Bell className="h-4 w-4" />
              <span className="text-sm">Enabled</span>
            </button>
            <button
              onClick={() => updateBudget({ alertEnabled: false })}
              className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-colors ${
                !budget.alertEnabled
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-input hover:bg-muted'
              }`}
            >
              <BellOff className="h-4 w-4" />
              <span className="text-sm">Disabled</span>
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium text-sm mb-2">How cost tracking works</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>All API calls are tracked automatically</li>
            <li>Costs are calculated based on token usage and model pricing</li>
            <li>View detailed breakdown in the Cost Dashboard</li>
            <li>Data is stored locally - never sent to any server</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
