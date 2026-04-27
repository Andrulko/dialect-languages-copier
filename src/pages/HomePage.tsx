import React, { useEffect, useState } from 'react';
import { getRules, getLanguages, Rule, Language, deleteRule, triggerManualSync, saveRule } from '@/lib/api';
import { RuleCard } from '@/components/RuleCard';
import { RuleDialog } from '@/components/RuleDialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PlusCircle, RefreshCw } from 'lucide-react';
export function HomePage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | undefined>(undefined);
  useEffect(() => {
    Promise.all([
      getRules().catch(() => []),
      getLanguages().catch(() => [])
    ]).then(([r, l]) => {
      setRules(r);
      setLanguages(l);
    }).finally(() => {
      setLoading(false);
    });
  }, []);
  const handleSaveRule = async (ruleData: Partial<Rule>) => {
    try {
      const newRule = await saveRule(ruleData);
      setRules(prev => {
        const exists = prev.some(r => r.id === newRule.id);
        if (exists) {
          return prev.map(r => r.id === newRule.id ? newRule : r);
        }
        return [...prev, newRule];
      });
      toast.success('Rule saved successfully');
      setDialogOpen(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to save rule');
    }
  };
  const handleDeleteRule = async (id: string) => {
    try {
      await deleteRule(id);
      setRules(prev => prev.filter(r => r.id !== id));
      toast.success('Rule deleted');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete rule');
    }
  };
  const handleSyncRule = async (id: string) => {
    try {
      await triggerManualSync(id);
      toast.success('Manual sync completed successfully');
    } catch (e: any) {
      toast.error(e.message || 'Sync failed');
    }
  };
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12 flex justify-center">
          <RefreshCw className="w-8 h-8 text-muted-foreground animate-spin" />
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Dialect Sync Rules</h1>
            <p className="text-muted-foreground mt-1 text-sm">Automate your translation updates across dialects.</p>
          </div>
          <Button onClick={() => { setEditingRule(undefined); setDialogOpen(true); }} className="bg-gradient-primary">
            <PlusCircle className="w-4 h-4 mr-2" /> Create Rule
          </Button>
        </div>
        {rules.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border/50 shadow-sm">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No sync rules yet</h3>
            <p className="text-muted-foreground mt-1 max-w-sm mx-auto mb-6">
              Create a rule to start copying translations from your pivot language to dialects automatically.
            </p>
            <Button variant="outline" onClick={() => { setEditingRule(undefined); setDialogOpen(true); }}>
              Create First Rule
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rules.map(rule => (
              <RuleCard
                key={rule.id}
                rule={rule}
                onEdit={() => { setEditingRule(rule); setDialogOpen(true); }}
                onDelete={() => handleDeleteRule(rule.id)}
                onSync={() => handleSyncRule(rule.id)}
              />
            ))}
          </div>
        )}
        <RuleDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          languages={languages}
          onSave={handleSaveRule}
          initialData={editingRule}
        />
      </div>
    </div>
  );
}