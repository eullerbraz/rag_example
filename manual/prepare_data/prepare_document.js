import * as cheerio from 'cheerio';
import { ChromaClient } from 'chromadb';

const url = 'https://eloquentjavascript.net/1st_edition/print.html';

const response = await fetch(url);
const htmlString = await response.text();

const $ = cheerio.load(htmlString);

const documents = $('.block')
  .toArray()
  .map((block) => $(block).text());

const client = new ChromaClient();
const collection = await client.getOrCreateCollection({
  name: 'javascript-book',
});

await collection.add({
  documents: documents,
  ids: documents.map((_, idx) => `${idx}`),
});
