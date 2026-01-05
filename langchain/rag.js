import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

const url = 'https://eloquentjavascript.net/1st_edition/print.html';
const cheerioLoader = new CheerioWebBaseLoader(url, { selector: '.block' });

const docs = await cheerioLoader.load();

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1500,
  chunkOverlap: 300,
});

const allSplits = await splitter.splitDocuments(docs);

console.log(allSplits);
