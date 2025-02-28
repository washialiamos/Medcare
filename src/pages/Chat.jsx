import React, { useState, useRef, useEffect } from "react";
import { Send, User, UserCircle, Menu, X } from "lucide-react";
import { generateContent } from "../lib/gemini";
import { useLocation } from "../contexts/LocationContext";
import { supabase } from "../lib/supabase";

function Chat() {
  // State for messages, current input, and sidebar visibility
  const { currentLocation, locationError, calculateDistance } = useLocation();
  const [messages, setMessages] = useState([]);

  const contacts = [];

  const [inputValue, setInputValue] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [modelMessages, setModelMessages] = useState([]);

  // Sample contacts
  let modMessage = [];

  // Ref for message container to auto-scroll to bottom
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (inputValue.trim() === "") return;

    const newMessage = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages([...messages, newMessage]);
    const newModMess = {
      role: "user",
      parts: [
        {
          text: newMessage.text,
        },
      ],
    };
    modMessage = [...modMessage, newModMess];
    console.log("new mode mess", newModMess);
    console.log("mod ", modMessage)
    setModelMessages([...modelMessages,newModMess])

    // setModelMessages((prev) => [...prev, newModMess]);
    setInputValue("");

    // Simulate a reply after a short delay
    const { data: doctors, error: doctorsError } = await supabase
      .from("doctors")
      .select("*");
    console.log("doctors", JSON.stringify(doctors, null, 2));
    console.log("loc", currentLocation)
    const rep = await generateContent(
      JSON.stringify(doctors, null, 2),
      modelMessages,
      currentLocation
    );
    const newRepMess = {
      role: "model",
      parts: [
        {
          text: rep,
        },
      ],
    };
    const replyMessage = {
      id: (Date.now() + 1).toString(),
      text: rep,
      sender: "other",
      timestamp: new Date(),
    };
    modMessage = [...modMessage, newRepMess];
    setModelMessages((prev) => [...prev, newRepMess]);
    setMessages((prev) => [...prev, replyMessage]);
  };

  // Format timestamp to a readable format
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Format date for contact list
  const formatDate = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return formatTime(date);
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  return (
    <div className="flex h-[60%] bg-gray-100">
      {/* Mobile menu button */}
      <button
        className="md:hidden fixed top-4 left-4 z-20 bg-white p-2 rounded-full shadow-md"
        onClick={() => setShowSidebar(!showSidebar)}
      >
        {showSidebar ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar / Contact list */}
      <div
        className={`${
          showSidebar ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 fixed md:static z-10 w-80 h-full bg-white border-r border-gray-200 overflow-y-auto`}
      >
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold">Messages</h1>
          <div className="mt-2 relative">
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full p-2 pl-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg
              className="absolute left-2 top-3 h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
            >
              <div className="flex items-center">
                <div className="relative">
                  <UserCircle size={48} className="text-gray-600" />
                  {contact.unread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {contact.unread}
                    </span>
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex justify-between items-center">
                    <h2 className="text-sm font-semibold">{contact.name}</h2>
                    <span className="text-xs text-gray-500">
                      {formatDate(contact.lastMessageTime)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {contact.lastMessage}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 h-full bg-red-500 flex flex-col">
        {/* Chat header */}
        {/* <div className="bg-white p-4 border-b border-gray-200 flex items-center">
          <UserCircle size={40} className="text-gray-600" />
          <div className="ml-3">
            <h2 className="font-semibold">Sarah Johnson</h2>
            <p className="text-xs text-gray-500">Online</p>
          </div>
        </div> */}

        {/* Messages container */}
        <div className="flex-1 p-4 h-full overflow-y-auto bg-gray-50">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg p-3 ${
                    message.sender === "user"
                      ? "bg-blue-500 text-white rounded-br-none"
                      : "bg-white text-gray-800 rounded-bl-none shadow-sm"
                  }`}
                >
                  <p>{message.text}</p>
                  <p
                    className={`text-xs mt-1 text-right ${
                      message.sender === "user"
                        ? "text-blue-100"
                        : "text-gray-500"
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message input */}
        <div className="bg-white p-4 border-t border-gray-200">
          <div className="flex items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleSendMessage();
              }}
              placeholder="Type your query..."
              className="flex-1 p-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSendMessage}
              className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-r-lg transition-colors duration-200"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;
