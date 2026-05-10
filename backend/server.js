import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { pipeline } from '@xenova/transformers';
import { ChatGroq } from '@langchain/groq';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// Custom Embeddings using Xenova local model
class XenovaEmbeddings {
  constructor() {
    this.modelName = 'Xenova/all-MiniLM-L6-v2';
    this.pipelinePromise = pipeline('feature-extraction', this.modelName);
  }
  async embedDocuments(texts) {
    const pipe = await this.pipelinePromise;
    const outputs = [];
    for (const text of texts) {
      const output = await pipe(text, { pooling: 'mean', normalize: true });
      outputs.push(Array.from(output.data));
    }
    return outputs;
  }
  async embedQuery(text) {
    const outputs = await this.embedDocuments([text]);
    return outputs[0];
  }
}

// Custom Memory Vector Store to bypass Langchain import issues
class MyMemoryVectorStore {
  constructor(embeddings) {
    this.embeddings = embeddings;
    this.vectors = [];
  }
  async addDocuments(docs) {
    const texts = docs.map(d => d.pageContent);
    const vectors = await this.embeddings.embedDocuments(texts);
    for (let i = 0; i < docs.length; i++) {
      this.vectors.push({ doc: docs[i], vector: vectors[i] });
    }
  }
  static async fromDocuments(docs, embeddings) {
    const store = new MyMemoryVectorStore(embeddings);
    await store.addDocuments(docs);
    return store;
  }
  asRetriever(k = 3) {
    return {
      invoke: async (query) => {
        const queryVector = await this.embeddings.embedQuery(query);
        const scored = this.vectors.map(item => ({
          doc: item.doc,
          score: this.cosineSimilarity(queryVector, item.vector)
        }));
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, k).map(i => i.doc);
      }
    };
  }
  cosineSimilarity(vecA, vecB) {
    let dotProduct = 0, normA = 0, normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

// Global vector store instance for this assignment
let vectorStore = null;

// Initialize Embeddings
const embeddings = new XenovaEmbeddings();

app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const blob = new Blob([req.file.buffer], { type: 'application/pdf' });
    const loader = new PDFLoader(blob);
    const docs = await loader.load();

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    
    const splitDocs = await textSplitter.splitDocuments(docs);
    
    // Create new vector store
    vectorStore = await MyMemoryVectorStore.fromDocuments(splitDocs, embeddings);
    
    res.json({ message: 'Document processed and indexed successfully', chunks: splitDocs.length });
  } catch (error) {
    console.error('Error processing document:', error);
    res.status(500).json({ error: 'Failed to process document' });
  }
});

app.post('/api/chat', async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'Query is required' });
  if (!vectorStore) return res.status(400).json({ error: 'Please upload a document first' });

  try {
    // Initialize Groq LLM
    const model = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: 'llama-3.1-8b-instant', // A fast, capable Groq model
    });

    const retriever = vectorStore.asRetriever(3);
    const contextDocs = await retriever.invoke(query);
    const context = contextDocs.map(doc => doc.pageContent).join('\n\n');

    const promptTemplate = PromptTemplate.fromTemplate(`
      You are an AI assistant that answers questions strictly based on the provided context.
      If the answer is not contained in the context, say "I cannot find the answer in the provided document." Do not answer from your own knowledge.

      Context:
      {context}

      Question:
      {question}

      Answer:
    `);

    const chain = RunnableSequence.from([
      {
        context: () => context,
        question: (input) => input.question,
      },
      promptTemplate,
      model,
      new StringOutputParser(),
    ]);

    const result = await chain.invoke({ question: query });
    res.json({ answer: result, context: contextDocs });
  } catch (error) {
    console.error('Error during chat:', error);
    res.status(500).json({ error: 'Failed to answer query' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasDocument: !!vectorStore });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
