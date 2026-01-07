export default async function getResponse(prompt) {
  return fetch("http://localhost:3000/question_answering", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      question: prompt
    })
  })
  .then(r => r.json()) // <- tem que ser .json()
  .then(j => j.response);
}
