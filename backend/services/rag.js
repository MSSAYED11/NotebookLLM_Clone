import fs from 'fs';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { HNSWLib } from '@langchain/community/vectorstores/hnswlib';
import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/huggingface_transformers';
import { ChatGroq } from '@langchain/groq';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import csvParser from 'csv-parser';
import { Document } from '@langchain/core/documents';
import { PromptTemplate } from '@langchain/core/prompts';

// Initialize Global Stores
let vectorStore;
let isVectorStoreInitialized = false;

// Initialize Embeddings
const embeddings = new HuggingFaceTransformersEmbeddings({
    modelName: "Xenova/all-MiniLM-L6-v2"
});

// Setup LLM
const llm = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "llama-3.1-8b-instant",
    temperature: 0,
});

/**
 * Process a CSV file and convert its rows into readable text.
 */
const processCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (data) => {
                const rowText = Object.entries(data)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(', ');
                results.push(rowText);
            })
            .on('end', () => {
                resolve(results.join('\n'));
            })
            .on('error', reject);
    });
};

/**
 * Process uploaded file based on its extension
 */
export const processDocument = async (filePath, mimetype) => {
    let text = '';

    try {
        if (mimetype === 'application/pdf') {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdfParse(dataBuffer);
            text = data.text;
        } else if (mimetype === 'text/csv') {
            text = await processCSV(filePath);
        } else if (mimetype === 'text/plain') {
            text = fs.readFileSync(filePath, 'utf8');
        } else {
            throw new Error('Unsupported file type');
        }

        // Chunking
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 800,
            chunkOverlap: 100,
        });

        const docs = await textSplitter.createDocuments([text]);

        // Embed and Store in Vector DB
        if (!isVectorStoreInitialized) {
            vectorStore = await HNSWLib.fromDocuments(docs, embeddings);
            isVectorStoreInitialized = true;
        } else {
            await vectorStore.addDocuments(docs);
        }

        return { message: 'Document processed and indexed successfully', chunks: docs.length };
    } catch (error) {
        console.error("Error processing document:", error);
        throw error;
    } finally {
        // Clean up the file after processing
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
};

/**
 * Retrieve chunks and generate answer
 */
export const askQuestion = async (query) => {
    // Check if the vector store is empty
    if (!isVectorStoreInitialized) {
        return "Please upload a document first before asking questions.";
    }

    // Retrieve top 3 chunks
    const retrievedDocs = await vectorStore.similaritySearch(query, 3);
    const context = retrievedDocs.map(doc => doc.pageContent).join('\n\n');

    if (!context) {
        return "The answer was not found in the uploaded document.";
    }

    const systemPrompt = `You are a helpful AI assistant. You answer questions strictly based on the provided context.
If the answer is unavailable in the uploaded document context, respond EXACTLY with: "The answer was not found in the uploaded document."
Do not answer from your own memory or hallucinate.

Context:
{context}

Question:
{question}
`;

    const prompt = PromptTemplate.fromTemplate(systemPrompt);
    const chain = prompt.pipe(llm);

    const response = await chain.invoke({
        context: context,
        question: query
    });

    // Determine the text based on Langchain response structure
    return response.content || response.text;
};
