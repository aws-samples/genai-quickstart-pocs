import { stringify } from 'yaml';
import { S3Event, SQSEvent, SQSHandler } from 'aws-lambda';
import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";


import { PDFDocument } from 'pdf-lib';

// import { HumanMessage, AIMessage, ToolMessage, BaseMessage, MessageContentText } from "@langchain/core/messages";
// import { ChatBedrockConverse } from "@langchain/aws";

// import { convertPdfToB64Strings } from '../utils/pdfUtils'
// import { correctStructuredOutputResponse } from '../utils/amplifyUtils'
import { uploadStringToS3 } from '../utils/sdkUtils'
// const imageBatchSize = 2 //Claude.ai can handle 5 images in a single request https://docs.anthropic.com/en/docs/build-with-claude/vision


import {
    TextractClient,
    StartDocumentAnalysisCommand,
    GetDocumentAnalysisCommand,
    FeatureType,
    GetDocumentAnalysisCommandOutput
} from "@aws-sdk/client-textract";

// import { writeFileSync } from 'fs';


async function splitPdfIfNeeded(bucket: string, key: string): Promise<string[]> {
    const s3Client = new S3Client();
    const response = await s3Client.send(
        new GetObjectCommand({ Bucket: bucket, Key: key })
    );

    // const pdfBytes = await streamToBuffer(response.Body);
    const pdfBytes = await response.Body?.transformToByteArray()
    if (!pdfBytes) throw new Error("No PDF bytes found");
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageCount = pdfDoc.getPageCount();

    // If document is small enough, return original key
    if (pageCount <= 10) {
        const stats = await s3Client.send(
            new HeadObjectCommand({ Bucket: bucket, Key: key })
        );
        if ((stats.ContentLength || 0) <= 5 * 1024 * 1024) {
            return [key];
        }
    }

    // Split into chunks of 10 pages or less
    const splitKeys: string[] = [];
    for (let i = 0; i < pageCount; i += 10) {
        const newPdf = await PDFDocument.create();
        const pagesToCopy = Math.min(10, pageCount - i);
        const pages = await newPdf.copyPages(pdfDoc, Array.from({ length: pagesToCopy }, (_, j) => i + j));
        pages.forEach(page => newPdf.addPage(page));

        const newPdfBytes = await newPdf.save();

        // Only save if under 5MB
        if (newPdfBytes.length <= 5 * 1024 * 1024) {
            const splitKey = `${key.replace('.pdf', '')}_part${Math.floor(i / 10)}.pdf`;
            await s3Client.send(new PutObjectCommand({
                Bucket: bucket,
                Key: splitKey,
                Body: newPdfBytes,
                ContentType: 'application/pdf'
            }));
            splitKeys.push(splitKey);
        }
    }

    return splitKeys;
}


async function startAndWaitForDocumentAnalysis(bucketName: string, documentName: string) {
    try {
        // Create Textract client
        const client = new TextractClient();

        // Start the analysis
        const startParams = {
            DocumentLocation: {
                S3Object: {
                    Bucket: bucketName,
                    Name: documentName
                }
            },
            FeatureTypes: [FeatureType.FORMS]
        };

        const startCommand = new StartDocumentAnalysisCommand(startParams);
        const startResponse = await client.send(startCommand);

        if (!startResponse.JobId) {
            throw new Error("No JobId received from Textract");
        }

        console.log(`Started analysis job with ID: ${startResponse.JobId}`);

        // Wait for the analysis to complete
        const results = await waitForJobCompletion(client, startResponse.JobId);

        // Process and print results
        console.log("\nProcessed Form Analysis Results:");
        return processResults(results);

    } catch (error) {
        console.error("Error analyzing document:", error);
    }
}

async function waitForJobCompletion(
    client: TextractClient,
    jobId: string
): Promise<GetDocumentAnalysisCommandOutput[]> {
    const results: GetDocumentAnalysisCommandOutput[] = [];
    let nextToken: string | undefined;

    while (true) {
        const getParams = {
            JobId: jobId,
            NextToken: nextToken
        };

        const getCommand = new GetDocumentAnalysisCommand(getParams);

        // Poll every 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));

        const response = await client.send(getCommand);
        console.log('Job Status: ', response.JobStatus)

        if (response.JobStatus === "FAILED") {
            throw new Error(`Document analysis failed: ${response.StatusMessage}`);
        }

        if (response.JobStatus === "SUCCEEDED") {
            results.push(response);

            // Check if there are more pages of results
            if (response.NextToken) {
                nextToken = response.NextToken;
            } else {
                break; // No more pages, exit loop
            }
        }
    }

    return results;
}

function findRelationship(blocks: GetDocumentAnalysisCommandOutput["Blocks"], ids: string[]) {
    return blocks!
        .filter(b => b.Id && ids.includes(b.Id))
}

function processResults(results: GetDocumentAnalysisCommandOutput[]) {
    // writeFileSync('./results.yaml', stringify(results))
    const processedData = results.map((result, index) => {
        console.log(`\nChunk ${index + 1}:`);

        if (result.Blocks) {

            const formDataList = result.Blocks
                .filter(block => block.BlockType === "KEY_VALUE_SET" && block.EntityTypes?.includes("KEY"))
                .map(block => {
                    const keyText = block.Relationships!
                        .filter(relationship => relationship.Type === "CHILD")
                        .map(keyRelationsips => {
                            return findRelationship(result.Blocks!, keyRelationsips.Ids!)
                                .map(block => block.Text)
                                .join(" ")
                        })
                        .join(" ")

                    const valueText = block.Relationships! //KEY_VALUE_SET - KEY
                        .filter(relationship => relationship.Type === "VALUE")
                        .map(valueRelationsips => (
                            findRelationship(result.Blocks!, valueRelationsips.Ids!)//KEY_VALUE_SET - VALUE
                                .map(block => {
                                    // console.log("KEY_VALUE_SET - VALUE Block:\n", stringify(block))
                                    if (block.Relationships) {
                                        return block.Relationships
                                            .filter(relationship => relationship.Type === "CHILD")
                                            .map(
                                                relationship => (
                                                    findRelationship(result.Blocks!, relationship.Ids!) //CHILD
                                                        .map(block => {
                                                            if (block.BlockType! === "WORD") return block.Text
                                                            else if (block.BlockType! === "SELECTION_ELEMENT") return block.SelectionStatus
                                                        })
                                                        .join(" ")
                                                )
                                            )
                                            .join(" ")
                                    } else return ""
                                })
                                .join(" ")
                        ))
                        .join(" ")

                    return [keyText, valueText]
                });

            const formData = Object.fromEntries(formDataList.filter(item => item !== undefined))

            console.log("Form Data: ", formData)

            const textData = result.Blocks
                .filter(block => block.BlockType === "LINE")
                .map(block => block.Text)
                .join('\n');

            return {
                chunk: index + 1,
                formData: formData,
                textData: textData
            }
        } else return { chunk: index + 1 }
    });

    if (processedData) return processedData.sort((a, b) => a?.chunk - b?.chunk)
}

export const handler: SQSHandler = async (event: SQSEvent) => {
    console.log('event:\n', JSON.stringify(event, null, 2))
    try {
        // Process each record in the event
        for (const sqsRecord of event.Records) {
            console.log('sqsRecord:\n', sqsRecord)
            const sqsRecordContent = JSON.parse(sqsRecord.body) as S3Event
            if (!sqsRecordContent.Records || !sqsRecordContent.Records.length) {
                console.warn(`No records found in the record content \n${sqsRecordContent}`)
                return
            }

            for (const s3Record of sqsRecordContent.Records) {

                // Get bucket and key from the event
                const bucket = s3Record.s3.bucket.name;
                const key = decodeURIComponent(s3Record.s3.object.key.replace(/\+/g, ' '));

                console.log(`Processing file: ${key} from bucket: ${bucket}`);

                // Split the PDF if needed and get array of keys
                const documentKeys = await splitPdfIfNeeded(bucket, key);

                for (const docKey of documentKeys) {
                    console.log(`Processing file: ${docKey} from bucket: ${bucket}`);
                    const documentContent = await startAndWaitForDocumentAnalysis(bucket, docKey) || "No contents found in file"

                    await uploadStringToS3({
                        bucket: bucket,
                        key: docKey + '.yaml',
                        content: stringify(documentContent)
                    })

                    console.log(`Successfully processed file: ${docKey}. Content:\n`, stringify(documentContent));
                }
                console.log(`Sucessfully processed file: ${key}`)

            }
        }

    } catch (error) {
        console.error('Error processing file:', error);
        throw error;
    }
};