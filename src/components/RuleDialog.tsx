import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Rule, Language } from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
interface RuleDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (rule: Partial<Rule>) => void;
  languages: Language[];
  initialData?: Rule;
}
export function RuleDialog({ open, onClose, onSave, languages, initialData }: RuleDialogProps) {
  const [pivotLanguage, setPivotLanguage] = useState<string>('');
  const [targetLanguages, setTargetLanguages] = useState<string[]>([]);
  const [syncApprovals, setSyncApprovals] = useState<boolean>(true);
  useEffect(() => {
    if (open) {
      if (initialData) {
        setPivotLanguage(initialData.pivotLanguage);
        setTargetLanguages(initialData.targetLanguages);
        setSyncApprovals(initialData.syncApprovals);
      } else {
        setPivotLanguage('');
        setTargetLanguages([]);
        setSyncApprovals(true);
      }
    }
  }, [open, initialData]);
  const handleSave = () => {
    onSave({
      ...(initialData?.id ? { id: initialData.id } : {}),
      pivotLanguage,
      targetLanguages,
      syncApprovals
    });
  };
  const handleTargetChange = (langId: string, checked: boolean) => {
    if (checked) {
      setTargetLanguages(prev => [...prev, langId]);
    } else {
      setTargetLanguages(prev => prev.filter(id => id !== langId));
    }
  };
  const isValid = pivotLanguage !== '' && targetLanguages.length > 0;
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Rule' : 'Create Rule'}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Update your dialect synchronization rule.' : 'Configure a new dialect synchronization rule.'}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label>Pivot Language</Label>
            <Select value={pivotLanguage} onValueChange={(val) => {
              setPivotLanguage(val);
              setTargetLanguages(prev => prev.filter(id => id !== val));
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select pivot language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map(lang => (
                  <SelectItem key={lang.id} value={lang.id}>{lang.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Target Languages</Label>
            <ScrollArea className="h-[120px] rounded-md border p-2">
              <div className="space-y-2">
                {languages.filter(l => l.id !== pivotLanguage).map(lang => (
                  <div key={lang.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`lang-${lang.id}`} 
                      checked={targetLanguages.includes(lang.id)}
                      onCheckedChange={(checked) => handleTargetChange(lang.id, checked as boolean)}
                    />
                    <label htmlFor={`lang-${lang.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {lang.name}
                    </label>
                  </div>
                ))}
                {languages.filter(l => l.id !== pivotLanguage).length === 0 && (
                  <p className="text-sm text-muted-foreground p-2">Select a pivot language first or no languages available.</p>
                )}
              </div>
            </ScrollArea>
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Switch id="sync-approvals" checked={syncApprovals} onCheckedChange={setSyncApprovals} />
            <Label htmlFor="sync-approvals">Sync approvals with target language</Label>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!isValid} className="bg-gradient-primary text-white">
            Save Rule
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}