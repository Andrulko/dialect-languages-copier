import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Rule, Language } from '@/lib/api';
interface RuleDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (rule: Partial<Rule>) => void;
  languages: Language[];
  initialData?: Rule;
}
export function RuleDialog({ open, onClose, onSave, languages, initialData }: RuleDialogProps) {
  const handleSave = () => {
    onSave({
      pivotLanguage: 'en',
      targetLanguages: ['fr'],
      syncApprovals: true
    });
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Rule' : 'Create Rule'}</DialogTitle>
        </DialogHeader>
        <div className="py-4 text-sm text-muted-foreground">
          Form fields placeholder.
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} className="bg-gradient-primary text-white">Save Rule</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}