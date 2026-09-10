import { useContext, useEffect, useRef } from 'react';
import { RecordContext } from '@/contexts/record-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from '@/app/content/[pageName]/page.module.css';
import { RegisteredOperations } from '@/data/client/models';

export default function ParsingProgressDialog() {
  const recordContext = useContext(RecordContext);
  const open = recordContext?.parsingDialogOpen;
  const setOpen = recordContext?.setParsingDialogOpen;
  const recordId = recordContext?.parsingDialogRecordId;
  const parsingProgress = recordId ? recordContext?.operationProgressByRecordId[recordId] : null;

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [parsingProgress?.textDelta]);

  const percent = parsingProgress && parsingProgress.progressOf > 0
    ? Math.round((parsingProgress.progress / parsingProgress.progressOf) * 100)
    : 0;

  const isParsing = parsingProgress && parsingProgress.operationName === RegisteredOperations.Parse;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Parsing Progress</DialogTitle>
        </DialogHeader>
        {isParsing ? (
          <>
            <div className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
              Progress:  {parsingProgress.progress <= parsingProgress.progressOf ? parsingProgress.progress : parsingProgress.progressOf} / {parsingProgress.progressOf}
            </div>
            <div className="mb-2 w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded overflow-hidden">
              <div
                className="h-2 bg-blue-500 transition-all"
                style={{ width: `${percent}%` }}
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                role="progressbar"
              />
            </div>
            <div className="mb-2 text-xs text-zinc-400">
              Last updated: {parsingProgress.history.length > 0 ? new Date(parsingProgress.history[parsingProgress.history.length-1].timestamp).toLocaleString() : '-'}
            </div>
            <div ref={scrollRef} className="mb-2 text-xs bg-zinc-100 dark:bg-zinc-900 p-2 rounded max-h-64 overflow-y-auto">
              <Markdown
                className={styles.markdown}
                remarkPlugins={[remarkGfm]}
              >{
                (parsingProgress.textDelta
                  ? parsingProgress.textDelta.replace(/```(markdown|text)?\n?|```/g, '')
                  : '*No streaming text yet*')
              }</Markdown>
            </div>
          </>
        ) : (
          <div className="text-xs text-zinc-400">No parsing progress yet.</div>
        )}
      </DialogContent>
    </Dialog>
  );
} 