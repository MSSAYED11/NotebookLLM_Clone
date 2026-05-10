# Google NotebookLM RAG Clone

A full-stack RAG (Retrieval-Augmented Generation) application inspired by Google's NotebookLM. This application allows users to upload PDF documents, intelligently indexes their content, and enables users to ask natural language questions. The AI strictly grounds its answers in the provided document without hallucinating from general knowledge.

## Live Demo
- **Frontend (Vercel):** [https://notebookllmclone.vercel.app/](https://notebookllmclone.vercel.app/)
- **Backend (Render):** [https://notebookllm-clone-3l9t.onrender.com](https://notebookllm-clone-3l9t.onrender.com)

## Architecture & Tech Stack
- **Frontend**: React + Vite, designed with a custom CSS glassmorphism and dark-mode aesthetic mirroring Google NotebookLM.
- **Backend**: Node.js + Express.
- **LLM Provider**: Groq API (`llama-3.1-8b-instant`) for lightning-fast inference.
- **Embeddings**: Xenova/transformers (`Xenova/all-MiniLM-L6-v2`) running locally in Node.js for free, high-quality vector embeddings.
- **Vector Database**: Custom in-memory Vector Store implementing cosine similarity.
- **Orchestration**: LangChain JS.

## The RAG Pipeline

The application implements a complete end-to-end RAG pipeline:

1. **Ingestion**: PDF files are uploaded via Multer and parsed into raw text using LangChain's `PDFLoader`.
2. **Chunking Strategy**: The raw text is divided using the **`RecursiveCharacterTextSplitter`**.
   - **How it works**: It recursively attempts to split text using a hierarchy of separators (e.g., double newlines, single newlines, spaces, and individual characters). 
   - **Why this was chosen**: This strategy is ideal for documents because it attempts to keep semantically related pieces of text (like paragraphs and sentences) together as much as possible before falling back to arbitrary character limits.
   - **Parameters**: We utilized a `chunkSize` of 1000 characters and a `chunkOverlap` of 200 characters to ensure context isn't lost at the boundaries of chunks.
3. **Embedding**: The chunks are converted into dense vector representations using a local Hugging Face transformer model (`Xenova/all-MiniLM-L6-v2`).
4. **Storage**: The embedded vectors and their corresponding text chunks are stored in an efficient, custom in-memory vector database (`MyMemoryVectorStore`).
5. **Retrieval**: When a user asks a question, the query is embedded using the same model, and the vector store performs a Cosine Similarity search to retrieve the top 3 most relevant chunks.
6. **Generation**: The retrieved chunks are injected into a strict system prompt. `ChatGroq` processes the prompt and generates a concise answer strictly grounded in the provided context. If the answer cannot be found in the chunks, the LLM safely refuses to answer.

## Local Setup

### Prerequisites
- Node.js installed on your machine.
- A free Groq API key.

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` directory and add your Groq API key:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   PORT=3000
   ```
4. Start the backend server:
   ```bash
   npm start
   ```

### Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend` directory:
   ```env
   VITE_API_BASE_URL=http://localhost:3000/api
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
5. Open the provided `localhost` URL in your browser.
