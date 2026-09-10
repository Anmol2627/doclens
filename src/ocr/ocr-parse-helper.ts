import { AVERAGE_PAGE_TOKENS, DisplayableDataObject, Record, RegisteredOperations } from '@/data/client/models';
import { ChatContextType, MessageType } from '@/contexts/chat-context';
import { ConfigContextType } from '@/contexts/config-context';
import { prompts } from '@/data/ai/prompts';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';

interface ParseWithAIDirectCallParams {
    record: Record;
    chatContext: ChatContextType;
    configContext: ConfigContextType | null;
    updateRecordFromText: (text: string, record: Record, allowNewRecord: boolean) => Promise<Record | null>;
    updateOperationProgress: (record: Record, operationName: string, inProgress: boolean, progress: number, progressOf: number, page: number, pages: number, metadata: any, error: any) => Promise<Record>;
    sourceImages: DisplayableDataObject[];
    parseAIProvider: string;
    parseModelName: string;
}


export async function parseWithAIDirectCall({
    record,
    chatContext,
    configContext,
    updateRecordFromText,
    updateOperationProgress,
    sourceImages,
    parseAIProvider,
    parseModelName
}: ParseWithAIDirectCallParams): Promise<Record> {
    let chunkIndex = 0;
    return new Promise(async (resolve, reject) => {
        try {
            let totalTokensEstimage = sourceImages.length * AVERAGE_PAGE_TOKENS
            // Prepare the prompt
            const prompt = record.transcription
                ? prompts.recordParseMultimodalTranscription({ record, config: configContext })
                : prompts.recordParseMultimodal({ record, config: configContext });

            let content = '';
            let error: any = null;
            record = await updateOperationProgress(record, RegisteredOperations.Parse, true, 0, 0, 0, 0, null, null);

            const stream = chatContext.aiDirectCallStream([
                {
                    id: nanoid(),
                    role: 'user',
                    createdAt: new Date(),
                    type: MessageType.Parse,
                    content: prompt,
                    experimental_attachments: sourceImages,
                }
            ], async (resultMessage, result) => {
                totalTokensEstimage = chunkIndex;
            }, parseAIProvider, parseModelName);

            for await (const delta of stream) {
                content += delta;
                chunkIndex++;
                record = await updateOperationProgress(record, RegisteredOperations.Parse, true, chunkIndex, totalTokensEstimage,  0, 0, { textDelta: delta, accumulated: content }, null);
            }

            // After streaming is done
            record = await updateOperationProgress(record, RegisteredOperations.Parse, false, chunkIndex, totalTokensEstimage, 0, 0, { recordText: content, pageDelta: content }, null);
            await record.updateChecksumLastParsed();
            let updatedRecord = await updateRecordFromText(content, record, false);
            if (updatedRecord) {
                updatedRecord = await updateOperationProgress(record, RegisteredOperations.Parse, false, chunkIndex, chunkIndex, 0, 0, { recordText: content, pageDelta: content }, null);

                resolve(updatedRecord);
            } else {
                await updateOperationProgress(record, RegisteredOperations.Parse, false, chunkIndex, chunkIndex, 0, 0, { recordText: content, pageDelta: content }, new Error('Failed to update record'));
                reject(new Error('Failed to update record'));
            }
        } catch (err) {
            updateOperationProgress(record, RegisteredOperations.Parse, false, chunkIndex, 0, 0, 0, null, err);
            reject(err);
        }
    });
} 