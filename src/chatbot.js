import React, { useState } from "react";
import axios from "axios";
import "./chatbot.css";
import brettMinerPrompt from "./brettMinerPrompt";

function ChatBot({ fetchDynamicData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    "Brett Assistant: Sup'boy! I'm Brett Miner's assistant and I'm here to help you work with your bag.",
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isRequestPending, setIsRequestPending] = useState(false);

  const handleSendMessage = async () => {
    if (inputMessage.trim() === "") return;

    // Ajoute le message utilisateur
    const newMessages = [...messages, `You: ${inputMessage}`];
    setMessages(newMessages);

    // Empêche les requêtes multiples en parallèle
    if (isRequestPending) {
      alert("Please wait before sending a new request!");
      return;
    }

    setIsRequestPending(true); // Bloque d'autres requêtes

    try {
      // Récupérez les données dynamiques
      const dynamicData = await fetchDynamicData();

      // Créez le contexte final en combinant le prompt statique et les données dynamiques
      const dynamicContext = `
        ${brettMinerPrompt}

        --- Dynamic Data ---
        Here is the current data about Brett Miner:
        - Total Value Locked (TVL): ${dynamicData.tvlETH} Tokens (${dynamicData.tvlUSD} USD)
        - Your Brett Balance: ${dynamicData.balance} BRETT
        - Your Claimable Rewards: ${dynamicData.reward} BRETT (${(dynamicData.reward * dynamicData.tokenPrice).toFixed(2)} USD)
        - Brett Token Price: $${dynamicData.tokenPrice} per token
        - Your Claim Power: ${dynamicData.claimPower}%
        - Your Miners: ${dynamicData.miners} miners
        ---------------------
      `;

      // Effectuer une requête à l'API OpenAI
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo", // Utilisez gpt-4 si nécessaire
          messages: [
            {
              role: "system",
              content: dynamicContext
            },
            { role: "user", content: inputMessage },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer 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`, // Remplacement de la variable d'environnement par la clé
          },
        }
      );

      // Récupère et traite la réponse du bot
      const botResponse = response.data.choices[0].message.content.trim();
      setMessages((prevMessages) => [...prevMessages, `Brett Assistant: ${botResponse}`]);
    } catch (error) {
      console.error("API Error:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        "Brett Assistant': Sorry, an error occurred. 😓 Please try again later.",
      ]);
    }

    setInputMessage(""); // Réinitialise le champ d'entrée utilisateur
    setIsRequestPending(false); // Débloque les requêtes
  };

  return (
    <div className="chatbot-container">
      <button className="chatbot-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? "Close Chat" : "Open Chat"}
      </button>
      {isOpen && (
        <div className="chatbot">
          <div className="chatbot-messages">
            {messages.map((message, index) => {
              const isBotMessage = message.startsWith("Brett Assistant:");
              return (
                <p
                  key={index}
                  className={isBotMessage ? "chatbot-message bot" : "chatbot-message user"}
                >
                  {message.replace("Brett Assistant: ", "").replace("You: ", "")}
                </p>
              );
            })}
          </div>
          <div className="chatbot-input">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask a question..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && inputMessage.trim() !== "") {
                  handleSendMessage();
                }
              }}
            />
            <button onClick={handleSendMessage}>Send</button>
          </div>
        </div>
      )}
    </div>
  );  
  
}

export default ChatBot;
