import React, { useContext, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RecordContext } from '@/contexts/record-context';
import { ChatContext } from '@/contexts/chat-context';
import { prompts } from '@/data/ai/prompts';
import { Record } from '@/data/client/models';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import showdown from 'showdown';
import { Loader2 } from 'lucide-react';

interface Props {
    open: boolean;
    setOpen: (value: boolean) => void;
}

const TranslationBenchmarkPopup: React.FC<Props> = ({ open, setOpen }) => {
    const recordContext = useContext(RecordContext);
    const chatContext = useContext(ChatContext);
    const [originalRecordId, setOriginalRecordId] = useState<number | null>(null);
    const [humanTranslationId, setHumanTranslationId] = useState<number | null>(null);
    const [aiTranslationId, setAiTranslationId] = useState<number | null>(null);
    const [benchmarkResult, setBenchmarkResult] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    const handleCreateReport = async () => {
        if (!originalRecordId || !humanTranslationId || !aiTranslationId || !recordContext?.records) {
            return;
        }

        const originalRecord = recordContext.records.find(r => r.id === originalRecordId);
        const humanTranslation = recordContext.records.find(r => r.id === humanTranslationId);
        const aiTranslation = recordContext.records.find(r => r.id === aiTranslationId);

        if (!originalRecord || !humanTranslation || !aiTranslation) {
            return;
        }

        setIsLoading(true);
        chatContext.aiDirectCall([{
            role: 'user',
            content: prompts.translationBenchmark({ 
                originalRecord, 
                humanTranslationRecord: humanTranslation, 
                aiTranslationRecord: aiTranslation 
            }),
            id: 'translation-benchmark'
        }], (result) => {
            setBenchmarkResult(result.content);
            setIsLoading(false);
        });
    };

    const downloadReport = () => {
        if (!benchmarkResult) return;

        const converter = new showdown.Converter({ 
            tables: true, 
            completeHTMLDocument: true, 
            openLinksInNewWindow: true 
        });
        converter.setFlavor('github');
        const htmlContent = converter.makeHtml(benchmarkResult);
        
        const htmlElement = document.createElement('a');
        const fileHtml = new Blob([htmlContent], { type: 'text/html' });
        htmlElement.href = URL.createObjectURL(fileHtml);
        htmlElement.download = `translation-benchmark-${new Date().toISOString()}.html`;
        document.body.appendChild(htmlElement);
        htmlElement.click();
        document.body.removeChild(htmlElement);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[1000px]">
                <DialogHeader>
                    <DialogTitle>Translation Benchmarking</DialogTitle>
                    <DialogDescription>
                        Compare human and AI translations against the original text
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 gap-4">
                        <Select
                            value={originalRecordId?.toString() || ''}
                            onValueChange={(value) => setOriginalRecordId(parseInt(value))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select original record" />
                            </SelectTrigger>
                            <SelectContent>
                                {recordContext?.records?.map((record) => record.id && (
                                    <SelectItem key={record.id} value={record.id.toString()}>
                                        {record.id} - {record.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={humanTranslationId?.toString() || ''}
                            onValueChange={(value) => setHumanTranslationId(parseInt(value))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select human translation" />
                            </SelectTrigger>
                            <SelectContent>
                                {recordContext?.records?.map((record) => record.id && (
                                    <SelectItem key={record.id} value={record.id.toString()}>
                                        {record.id} - {record.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={aiTranslationId?.toString() || ''}
                            onValueChange={(value) => setAiTranslationId(parseInt(value))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select AI translation" />
                            </SelectTrigger>
                            <SelectContent>
                                {recordContext?.records?.map((record) => record.id && (
                                    <SelectItem key={record.id} value={record.id.toString()}>
                                        {record.id} - {record.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {!benchmarkResult && !isLoading && (
                        <Button onClick={handleCreateReport}>Create Report</Button>
                    )}

                    {isLoading && (
                        <div className="flex flex-col items-center justify-center gap-4 py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Generating translation comparison report...</p>
                        </div>
                    )}

                    {benchmarkResult && !isLoading && (
                        <div className="mt-4">
                            <div className="prose dark:prose-invert max-h-[400px] overflow-y-auto">
                                <Markdown remarkPlugins={[remarkGfm]}>
                                    {benchmarkResult}
                                </Markdown>
                            </div>
                            <div className="mt-4 flex justify-end gap-2">
                                <Button onClick={downloadReport}>
                                    Download as HTML
                                </Button>
                                <Button onClick={() => setBenchmarkResult('')}>
                                    New Comparison
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default TranslationBenchmarkPopup; 