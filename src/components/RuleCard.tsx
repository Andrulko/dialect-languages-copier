import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Trash, Edit } from 'lucide-react';
import { Rule } from '@/lib/api';
interface RuleCardProps {
  rule: Rule;
  onEdit: () => void;
  onDelete: () => void;
  onSync: () => Promise<void>;
}
export function RuleCard({ rule, onEdit, onDelete, onSync }: RuleCardProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await onSync();
    } finally {
      setIsSyncing(false);
    }
  };
  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="font-semibold">{rule.pivotLanguage}</span>
          <Badge variant={rule.syncApprovals ? 'default' : 'secondary'}>
            {rule.syncApprovals ? 'Approvals' : 'Translations'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mt-2">
          {rule.targetLanguages.map(l => (
            <Badge key={l} variant="outline" className="text-muted-foreground">{l}</Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 pt-2 border-t border-border mt-2">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Edit className="w-4 h-4" />
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash className="w-4 h-4" />
        </Button>
        <Button size="sm" disabled={isSyncing} onClick={handleSync} className="bg-gradient-primary hover:opacity-90">
          {isSyncing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Sync
        </Button>
      </CardFooter>
    </Card>
  );
}