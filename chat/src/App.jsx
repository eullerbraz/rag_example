import { useState } from "react";
import "./App.css";
import UserPromptInput from "./components/UserPromptInput/UserPromptInput";
import Chat from "./components/Chat/Chat";
import getResponse from "./ai_api";

function App() {
  const [conversationStarted, setConversationStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [canSendNewMessage, setCanSendNewMessage] = useState(true);

  async function submitPrompt(userPrompt) {
    setCanSendNewMessage(false);
    if (messages.length == 0) {
      setConversationStarted(true);
    }

    setMessages((prevMessages) => [...prevMessages, { type: "user", text: userPrompt }]);
    setIsThinking(true);

    const aiResponse = await getResponse(userPrompt);

    setIsThinking(false);
    setMessages((prevMessages) => [...prevMessages, { type: "ai", text: aiResponse }]);
  }

  return (
    <>
      <Chat
        messages={messages}
        isThinking={isThinking}
        setCanSendNewMessage={setCanSendNewMessage}
      />
      <UserPromptInput
        onSubmit={submitPrompt}
        canSubmit={canSendNewMessage}
        conversationStarted={conversationStarted}
      />
    </>
  );
}

export default App;
