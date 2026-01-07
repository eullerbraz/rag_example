import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from '@langchain/google-genai';
import { Annotation, StateGraph } from '@langchain/langgraph';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { pull } from 'langchain/hub';

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

  // const prompt = await promptTemplate.invoke({
  //   question: state.question,
  //   context: docs,
  // });

  const prompt = `
    Você é um expert em Javascript que vai responder a uma pergunta do usuário.

    Responda a pergunta com base nos seguintes trechos retirados do livro "Eloquent Javascript".
    Referencie em sua resposta os trechos abaixo, deixe explicíto onde começa a referência ao livro.
    Adicione esses trechos à resposta caso necessário.

    DOCUMENTOS:
    ${docs}

    PERGUNTA:
    ${state.question}
    `;

  const response = await llm.invoke(prompt);

  return { answer: response };
}

const retrievedDocs = await retrieve({
  question: 'como funciona uma variável?',
});

const StateAnnotation = Annotation.Root({
  question: Annotation,
  docs: Annotation,
  answer: Annotation,
});

const graph = new StateGraph(StateAnnotation)
  .addNode('retrieve', retrieve)
  .addNode('generate', generate)
  .addEdge('__start__', 'retrieve')
  .addEdge('retrieve', 'generate')
  .addEdge('generate', '__end__')
  .compile();

async function getAnswer(question) {
  const inputs = { question: question };
  return graph.invoke(inputs).then((state) => state.answer.content);
}

export { getAnswer };
