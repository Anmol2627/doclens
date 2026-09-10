import { AVERAGE_PAGE_TOKENS, DataLoadingStatus, DisplayableDataObject, EncryptedAttachment, Folder, Record, RegisteredOperations } from '@/data/client/models';
import { findCodeBlocks } from "@/lib/utils";
import { AIResultEventType, ChatContextType, MessageType, MessageVisibility } from '@/contexts/chat-context';
import { ConfigContextType } from '@/contexts/config-context';
import { FolderContextType } from '@/contexts/folder-context';
import { getRecordExtra } from '@/contexts/record-context';
import { prompts } from '@/data/ai/prompts';
import { toast } from 'sonner';


export async function parse(record: Record, chatContext: ChatContextType, configContext: ConfigContextType | null, folderContext: FolderContextType | null, updateRecordFromText: (text: string, record: Record, allowNewRecord: boolean) => Promise<Record|null>, updateOperationProgress: (record: Record, operationName: string, inProgress: boolean, progress: number, progressOf: number, page: number, pages: number, metadata: any, error: any) => Promise<Record>, sourceImages: DisplayableDataObject[]): Promise<Record> {
    const parseAIProvider = await configContext?.getServerConfig('llmProviderParse') as string;
    const parseModelName = await configContext?.getServerConfig('llmModelParse') as string;

    const parseProgressInPages = parseInt(await getRecordExtra(record, 'Document parsed pages') as string || '0');
    let parseProgressInTokens = parseProgressInPages * AVERAGE_PAGE_TOKENS;
    let totalProgressOfInTokens = sourceImages.length * AVERAGE_PAGE_TOKENS;

    return new Promise(async (resolve, reject) => {
        try {
            // Prepare the prompt

            let page = parseProgressInPages + 1;
            let pages = sourceImages.length;
            
            let recordText = '';

            record = await updateOperationProgress(record, RegisteredOperations.Parse, true, 0, 0, 0, 0, null, null); // set in progress


            for (let pageAcc = 1; pageAcc <= page; pageAcc++) {
                const pageText = await getRecordExtra(record, 'Page ' + pageAcc + ' content') as string; /// accumulate the page content - as we're saving it page by page
                if (pageText) {
                    recordText += pageText + '\n\r\n\r';
                }
            }
            
            
            for (const image of sourceImages.slice(parseProgressInPages)) {
                let pageText = '';
                const prompt = prompts.recordParseSinglePage({ record, config: configContext, page }); // TODO: add transcription if exists

                let pageLengthInTokens = 0;
                const stream = chatContext.aiDirectCallStream([
                    {
                        id: 'page-' + page,
                        role: 'user',
                        content: prompt,
                        type: MessageType.Parse,
                        createdAt: new Date(),
                        experimental_attachments: [image]                         
                    }
                ], async (resultMessage, result) => {
                    //totalProgressOfInTokens -= AVERAGE_TOKENS_PER_PAGE;
                    //totalProgressOfInTokens += pageLengthInTokens // adjust the estimaged
                }, parseAIProvider, parseModelName);
                // parsing page by page

                let chunkIndex = 0;
                for await (const delta of stream) { 
                    pageText += delta;
                    record = await updateOperationProgress(record, RegisteredOperations.Parse, true, parseProgressInTokens, totalProgressOfInTokens, page, pages, { textDelta: delta }, null);
                    chunkIndex++;
                    pageLengthInTokens += 1;
                    parseProgressInTokens += 1;

                    if (parseProgressInTokens > totalProgressOfInTokens) {
                        totalProgressOfInTokens = parseProgressInTokens;
                    }
                }

                totalProgressOfInTokens += pageLengthInTokens * 1.5; // we estimate the metadata to be twice as long as the text for metadata
                totalProgressOfInTokens -= AVERAGE_PAGE_TOKENS; // actualize the estimate

                // Clean up pageText before saving
                pageText = pageText.replace(/```[a-zA-Z]*\n?|```/g, '');
                recordText += pageText + '\n\r\n\r';
                record = await updateOperationProgress(record, RegisteredOperations.Parse, true, parseProgressInTokens, totalProgressOfInTokens, page, pages, { pageDelta: pageText, recordText: recordText }, null); //saves the record

                page++;
            }


            const metadataStream = chatContext.aiDirectCallStream([
                {
                    id: 'metadata',
                    role: 'user',
                    content: prompts.recordParseMetadata({ record, config: configContext, page }),
                }
            ], async (resultMessage, result) => {
            }, parseAIProvider, parseModelName);

            let metaDataJson = '';
           // totalProgressOfInTokens *= 1.6; // we estimate the metadata to be twice as long as the text
            for await (const delta of metadataStream) {
                parseProgressInTokens += 1;
                if (parseProgressInTokens > totalProgressOfInTokens) {
                    totalProgressOfInTokens = parseProgressInTokens;
                }
                metaDataJson += delta;
                record = await updateOperationProgress(record as Record, RegisteredOperations.Parse, true, parseProgressInTokens, totalProgressOfInTokens, pages, pages, null, null);
            }

            metaDataJson = metaDataJson.replace(/```[a-zA-Z]*\n?|```/g, '');

            const fullTextToProcess = '```json\n' + metaDataJson + '\n```\n\r\n\r' + '```markdown\n' + recordText + '\n```';
            await record.updateChecksumLastParsed();

            let updatedRecord = await updateRecordFromText(fullTextToProcess, record, false);



            if (updatedRecord) {
                updatedRecord = await updateOperationProgress(updatedRecord as Record, RegisteredOperations.Parse, false, totalProgressOfInTokens, totalProgressOfInTokens, pages, pages, { recordText: fullTextToProcess }, null);
                resolve(updatedRecord);
            } else {
                await updateOperationProgress(record, RegisteredOperations.Parse, false, totalProgressOfInTokens, totalProgressOfInTokens, pages, pages, { recordText: fullTextToProcess }, new Error('Failed to update record'));
                reject(new Error('Failed to update record'));
            }


        } catch (error) {
            console.error('Error in ChatGPT paged OCR:', error);
            reject(error);
        }
    });
} 