import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from '@langchain/google-genai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { pull } from 'langchain/hub';

import dotenv from 'dotenv';
dotenv.config();

const url = 'https://eloquentjavascript.net/1st_edition/print.html';
const cheerioLoader = new CheerioWebBaseLoader(url, { selector: '.block' });

const docs = await cheerioLoader.load();

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1500,
  chunkOverlap: 300,
});

const allSplits = await splitter.splitDocuments(docs);

// console.log(allSplits);

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  model: 'text-embedding-004',
  taskType: 'RETRIEVAL_DOCUMENT',
});

const vectorStore = new Chroma(embeddings, {
  collectionName: 'javascript-book-gemini-embeddings',
});

// vectorStore.addDocuments(allSplits);

const promptTemplate = await pull('rlm/rag-prompt');

const llm = new ChatGoogleGenerativeAI({
  model: 'gemini-2.0-flash',
  apiKey: process.env.GEMINI_API_KEY,
});

async function retrieve(state) {
  const retrievedDocs = await vectorStore.similaritySearch(state.question);
  return { docs: retrievedDocs };
}

async function generate(state) {
  const docs = state.docs.map((doc) => doc.pageContent).join('\n');
  const prompt = await promptTemplate.invoke({
    question: state.question,
    context: docs,
  });
  const response = await llm.invoke(prompt);

  return response;
}

const retrievedDocs = await retrieve({
  question: 'como funciona uma variável?',
});

console.log(
  await generate({
    question: 'como funciona uma variável?',
    docs: retrievedDocs.docs,
  })
);
