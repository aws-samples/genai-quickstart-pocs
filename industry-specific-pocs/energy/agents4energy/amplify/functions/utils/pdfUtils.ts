// import gm from 'gm';
// import { PDFDocument } from 'pdf-lib';
// import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

// const imageMagick = gm.subClass({ imageMagick: true });

// async function convertPdfPageToPng(pdfBuffer: Buffer, index: number): Promise<Buffer> {
//     // Load the PDF document
//     const pdfDoc = await PDFDocument.load(pdfBuffer);

//     // Get the first page of the PDF
//     const page = pdfDoc.getPages()[index];

//     // Get the width and height of the page
//     const { width, height } = page.getSize();

//     // Claude supports the images' logest edge bing at most 1568 pixels long https://docs.anthropic.com/en/docs/build-with-claude/vision
//     const maxPixelsLongestEdge = 1560
//     // Calculate new dimensions maintaining aspect ratio
//     let newWidth = width;
//     let newHeight = height;

//     if (width > height && width > maxPixelsLongestEdge) {
//         // Width is the longest dimension
//         const aspectRatio = height / width;
//         newWidth = maxPixelsLongestEdge;
//         newHeight = Math.round(maxPixelsLongestEdge * aspectRatio);
//     } else if (height > width && height > maxPixelsLongestEdge) {
//         // Height is the longest dimension
//         const aspectRatio = width / height;
//         newHeight = maxPixelsLongestEdge;
//         newWidth = Math.round(maxPixelsLongestEdge * aspectRatio);
//     }
//     const pngBuffer = await new Promise<Buffer>((resolve, reject) => {

//         imageMagick(pdfBuffer, `pdf.pdf[${index}]`)
//             .resize(newWidth, newHeight)//.resize(width * 2, height * 2)
//             .density(400, 400)//600
//             .quality(50)
//             .toBuffer('PNG', (err, out) => {
//                 if (err) {
//                     // console.log('gm conversion error: ', err)
//                     throw new Error('gm conversion error: ', err);
//                 }

//                 resolve(out)
//             });
//     })

//     const sizeInMB = (pngBuffer.length / (1024 * 1024)).toFixed(2);

//     console.log(`Converted page ${index} to PNG. Size: ${sizeInMB} MB`);

//     return pngBuffer
// }

// export async function convertPdfToPngs(body: Buffer): Promise<Buffer[]> {
//     try {
//         const pdoc = await PDFDocument.load(body);
//         const pageCount = pdoc.getPageCount();

//         console.log(`Converting PDF to PNGs. Pages: ${pageCount}`);

//         const pages = Array.from({ length: pageCount }, (_, i) => i);
//         let pngBuffers: Buffer[] = [];
//         for (let page of pages) {
//             pngBuffers.push(await convertPdfPageToPng(body, page));
//         }
//         return pngBuffers;
//     } catch (error) {
//         console.error(JSON.stringify(error));
//         throw new Error('Failed to convert PDF to images');
//     }
// }

// export async function convertPdfToB64Strings(props: { s3Key: string, s3BucketName: string },): Promise<string[]> {
//     // Initialize S3 client
//     const s3Client = new S3Client();

//     try {
//         // Fetch PDF from S3
//         const getObjectParams = {
//             Bucket: props.s3BucketName,
//             Key: props.s3Key,
//         };
//         const { Body } = await s3Client.send(new GetObjectCommand(getObjectParams));
//         if (!Body) throw new Error('Failed to fetch PDF from S3');

//         // Load PDF document
//         const pdfBytes = await Body.transformToByteArray();
//         // console.log("pdf Bytes: ", pdfBytes)

//         const pngBuffers = await convertPdfToPngs(Buffer.from(pdfBytes))

//         const pngB64Strings = pngBuffers.map((pngBuffer) => {
//             return pngBuffer.toString('base64');
//         })
//         // console.log("png Strings: ", pngB64Strings)

//         return pngB64Strings

//     } catch (error) {
//         console.error('Error processing PDF:', error);
//         throw error;
//     }
// }