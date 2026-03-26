import { PassThrough } from "stream";
import { renderToPipeableStream } from "react-dom/server";
import { ServerRouter } from "react-router";
import { createReadableStreamFromReadable } from "@react-router/node";
import { type EntryContext } from "react-router";
import { isbot } from "isbot";
import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { addDocumentResponseHeaders } from "./shopify.server";

export const streamTimeout = 5000;


const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

async function generateProductsXML(): Promise<void> {
    try {
        const timestamp = Date.now();
        
        // Generate a few dummy products using the current timestamp
        let allProducts: { id: string, title: string }[] = [];
        for (let i = 1; i <= 5; i++) {
            allProducts.push({
                id: `gid://shopify/Product/${Math.floor(Math.random() * 100000) + timestamp + i}`,
                title: `Dummy Product ${i} (Generated at ${new Date(timestamp).toISOString()})`
            });
        }

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<products>\n';
        allProducts.forEach(p => {
            const escapedTitle = p.title.replace(/&/g, "&amp;")
                                        .replace(/</g, "&lt;")
                                        .replace(/>/g, "&gt;")
                                        .replace(/"/g, "&quot;")
                                        .replace(/'/g, "&apos;");
            xml += `  <product>\n    <id>${p.id}</id>\n    <title>${escapedTitle}</title>\n  </product>\n`;
        });
        xml += '</products>';

        const dirPath = '/data';
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        const filePath = path.join(dirPath, 'products.xml');
        fs.writeFileSync(filePath, xml);
        console.log(`Successfully generated ${filePath} with dummy products.`);

        // Determine bucket config provided by Railway/Environment
        const bucketName = process.env.BUCKET_NAME || process.env.AWS_BUCKET_NAME;
        const region = process.env.AWS_REGION || "us-east-1";
        const endpoint = process.env.AWS_ENDPOINT_URL_S3 || process.env.S3_ENDPOINT;
        const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
        const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

        if (bucketName && accessKeyId && secretAccessKey) {
            console.log(`Preparing to upload ${filePath} to S3 bucket ${bucketName}...`);
            const s3Client = new S3Client({
                region: region,
                endpoint: endpoint, // Railway MinIO usually needs endpoint specified
                credentials: {
                    accessKeyId: accessKeyId,
                    secretAccessKey: secretAccessKey,
                },
                forcePathStyle: true, // often required for non-AWS S3 endpoints
            });

            const command = new PutObjectCommand({
                Bucket: bucketName,
                Key: "products.xml",
                Body: xml, // upload the memory string directly
                ContentType: "application/xml"
            });

            await s3Client.send(command);
            console.log(`Successfully uploaded products.xml to bucket: ${bucketName}`);

            // Unlink/remove the local temp file after upload
            fs.unlinkSync(filePath);
            console.log(`Removed local temp file ${filePath}.`);
        } else {
            console.log("Skipping S3 upload: Missing env credentials (BUCKET_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY).");
        }

    } catch (error) {
        console.error("Error generating XML process (or uploading to bucket):", error);
    }
}

async function startInfiniteProcess(): Promise<void> {
    const sleepDurationMs: number = 5 * 60 * 1000; // 5 minutes, put the time as a variable

    while (true) {
        await generateProductsXML();
        await sleep(sleepDurationMs);
    }
}

startInfiniteProcess();


export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext
) {
  addDocumentResponseHeaders(request, responseHeaders);
  const userAgent = request.headers.get("user-agent");
  const callbackName = isbot(userAgent ?? '')
    ? "onAllReady"
    : "onShellReady";

  return new Promise((resolve, reject) => {
    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter
        context={reactRouterContext}
        url={request.url}
      />,
      {
        [callbackName]: () => {
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          console.error(error);
        },
      }
    );

    // Automatically timeout the React renderer after 6 seconds, which ensures
    // React has enough time to flush down the rejected boundary contents
    setTimeout(abort, streamTimeout + 1000);
  });
}
