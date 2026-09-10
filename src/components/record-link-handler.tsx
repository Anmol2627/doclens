import { useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { RecordContext } from '@/contexts/record-context';
import { Record } from '@/data/client/models';
import RecordItem from './record-item';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

export default function RecordLinkHandler() {
  const recordContext = useContext(RecordContext);
  const [referencedRecords, setReferencedRecords] = useState<Record[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#records-')) {
        const recordIds = hash.replace('#records-', '');
        const recordIdsArray = recordIds.split(',')
          .map(id => parseInt(id.trim()))
          .filter((id): id is number => !isNaN(id));
        
        // Find records from recordContext
        const records = recordContext?.records?.filter(record => 
          record.id && recordIdsArray.includes(record.id)
        ) || [];
        
        if (records.length > 0) {
          setReferencedRecords(records);
          setIsOpen(true);
        } else {
          toast.info(`Record(s) ${recordIds} not found`);
        }
      }
    };

    // Handle initial load
    handleHashChange();

    // Add event listener for hash changes
    window.addEventListener('hashchange', handleHashChange);

    // Cleanup
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [recordContext?.records]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open && window.location.hash.startsWith('#records-')) {
        // Remove the hash from the URL after closing the popup
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Referenced Records</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {referencedRecords.map((record) => (
            <RecordItem 
              key={record.id} 
              record={record} 
              displayAttachmentPreviews={true}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
} 