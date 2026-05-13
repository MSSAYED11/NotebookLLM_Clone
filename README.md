# NotebookLM Clone

A full-stack RAG (Retrieval-Augmented Generation) application allowing users to upload documents (PDF, TXT, CSV) and ask questions about them. The AI uses strictly the uploaded document context to answer questions.

## Features
- **Document Uploads**: Supports PDF, plain text (.txt), and CSV formats.
- **RAG Pipeline**: Implements full end-to-end ingestion, chunking, embeddings, storage, retrieval, and generation.
- **Free-Tier Optimized**: Uses local HuggingFace embeddings (`Xenova/all-MiniLM-L6-v2`) via `@langchain/community` and free `MemoryVectorStore` to avoid paid embedding services.
- **GROQ API Integration**: Uses `llama-3.1-8b-instant` via Groq for fast and cost-effective generation.
- **Strict Grounding**: The AI is prompted to answer only based on the document, and replies "The answer was not found in the uploaded document." if the information is missing.

## Architecture
- **Frontend**: React.js, Vite, Tailwind CSS v3
- **Backend**: Node.js, Express, Multer, LangChain

## Local Development

### Backend Setup
1. `cd backend`
2. `npm install`
3. Create a `.env` file with your Groq API key:
   ```env
   GROQ_API_KEY=your_api_key_here
   PORT=5000
   ```
4. `npm start` (Runs on `http://localhost:5000`)

### Frontend Setup
1. `cd frontend`
2. `npm install`
3. Create a `.env` file (if you want to override the default local backend URL):
   ```env
   VITE_API_URL=http://localhost:5000
   ```
4. `npm run dev`

## Deployment

### Frontend (Vercel)
Deployed seamlessly to Vercel using the root `vercel.json` to build the React application from the `/frontend` directory.

### Backend (Render)
Deployed via `render.yaml` which automatically runs `npm install` and `npm start` within the `/backend` directory.
