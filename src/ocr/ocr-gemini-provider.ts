import { DataLoadingStatus, DisplayableDataObject, EncryptedAttachment, Folder, Record } from '@/data/client/models';
import { findCodeBlocks } from "@/lib/utils";
import { AIResultEventType, ChatContextType, MessageType, MessageVisibility } from '@/contexts/chat-context';
import { ConfigContextType } from '@/contexts/config-context';
import { FolderContextType } from '@/contexts/folder-context';
import { RecordContextType } from '@/contexts/record-context';
import { prompts } from '@/data/ai/prompts';
import { toast } from 'sonner';
import { parseWithAIDirectCall } from './ocr-parse-helper';

export async function parse(
    record: Record,
    chatContext: ChatContextType,
    configContext: ConfigContextType | null,
    folderContext: FolderContextType | null,
    updateRecordFromText: (text: string, record: Record, allowNewRecord: boolean) => Promise<Record | null>,
    updateOperationProgress: (record: Record, operationName: string, inProgress: boolean, progress: number, progressOf: number, metadata: any, error: any) => void,
    sourceImages: DisplayableDataObject[]
): Promise<Record> {
    const parseAIProvider = await configContext?.getServerConfig('llmProviderParse') as string;
    const geminiApiKey = await configContext?.getServerConfig('geminiApiKey') as string;
    const parseModelName = await configContext?.getServerConfig('llmModelParse') as string;

    if (!geminiApiKey) {
        toast.error('Please configure Gemini API key in settings');
        return Promise.reject('Gemini API key not configured');
    }

    return parseWithAIDirectCall({
        record,
        chatContext,
        configContext,
        updateRecordFromText,
        updateOperationProgress,
        sourceImages,
        parseAIProvider,
        parseModelName
    });
} 