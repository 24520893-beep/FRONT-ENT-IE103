import { useState, useRef, useEffect, useCallback } from 'react';
// Import fetchClient từ thư mục utils
import { fetchClient } from '../utils/fetchClient'; 

// 1. Hàm hỗ trợ: Xử lý định dạng Markdown cơ bản
const formatAIResponse = (text) => {
  if (!text) return '';
  return text.split('\n').map((line, lineIndex) => {
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <span key={lineIndex} className="d-block mb-1">
        {parts.map((part, partIndex) => 
          partIndex % 2 === 1 ? <strong key={partIndex}>{part}</strong> : part
        )}
      </span>
    );
  });
};

// 2. Component con: Hiệu ứng "Gõ chữ từ từ"
const TypewriterEffect = ({ fullText, isTyping, scrollToBottom, onDone }) => {
  const [displayedText, setDisplayedText] = useState(isTyping ? '' : fullText);

  useEffect(() => {
    if (!isTyping) return;

    let index = displayedText.length;
    const interval = setInterval(() => {
      setDisplayedText(fullText.slice(0, index + 1));
      index++;
      
      if (index % 10 === 0) scrollToBottom(); 

      if (index >= fullText.length) {
        clearInterval(interval);
        onDone(); 
      }
    }, 15);

    return () => clearInterval(interval);
  }, [fullText, isTyping, scrollToBottom, onDone]); 

  return formatAIResponse(displayedText);
};

// 3. Component chính
export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Xin chào! Tôi là AI học thuật của HOCMOI. Bạn cần tôi hỗ trợ vấn đề gì hôm nay?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [botStatus, setBotStatus] = useState('idle'); 
  
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // HÀM GỬI TIN NHẮN
  const handleSendMessage = useCallback(async (textOverride) => {
    const messageContent = textOverride || inputValue;
    
    if (!messageContent.trim() || botStatus !== 'idle') return;

    const newUserMsg = { sender: 'user', text: messageContent };
    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    
    setBotStatus('fetching');
    abortControllerRef.current = new AbortController();

    try {
      // Đã sửa: Sử dụng fetchClient, lược bỏ localhost, headers và token thủ công
      const response = await fetchClient('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: messageContent }),
        signal: abortControllerRef.current.signal 
      });

      const data = await response.json();
      
      setBotStatus('typing');
      setMessages(prev => [...prev, { sender: 'ai', text: data.reply, isTyping: true }]);
    } catch (error) {
      if (error.name === 'AbortError') {
        setMessages(prev => [...prev, { sender: 'ai', text: '*(Đã dừng phản hồi)*' }]);
      } else {
        setMessages(prev => [...prev, { sender: 'ai', text: 'Hệ thống đang bận, vui lòng thử lại sau!' }]);
      }
      setBotStatus('idle');
    }
  }, [inputValue, botStatus]);

  // LẮNG NGHE SỰ KIỆN TỪ TRANG CHI TIẾT CÂU HỎI
  useEffect(() => {
    const handleExternalOpen = (event) => {
      const { message } = event.detail;
      
      setIsOpen(true);      
      setIsExpanded(true);  
      
      handleSendMessage(message);
    };

    window.addEventListener('openAIChat', handleExternalOpen);
    return () => window.removeEventListener('openAIChat', handleExternalOpen);
  }, [handleSendMessage]);

  const handleTypingDone = () => {
    setBotStatus('idle');
    setMessages(prev => {
      const newMsgs = [...prev];
      const lastMsg = newMsgs[newMsgs.length - 1];
      if (lastMsg && lastMsg.sender === 'ai') lastMsg.isTyping = false;
      return newMsgs;
    });
  };

  const handleStopGeneration = () => {
    if (botStatus === 'fetching') {
      abortControllerRef.current?.abort();
    } else if (botStatus === 'typing') {
      setBotStatus('idle');
      setMessages(prev => {
        const newMsgs = [...prev];
        const lastMsg = newMsgs[newMsgs.length - 1];
        if (lastMsg && lastMsg.sender === 'ai') lastMsg.isTyping = false;
        return newMsgs;
      });
    }
  };

  return (
    <>
      <a
        href="#"
        className={`ai-chat-bubble ${isOpen ? 'chat-bubble-hidden' : ''}`}
        title="Trợ lý AI HOCMOI"
        onClick={(e) => { e.preventDefault(); setIsOpen(true); }}
      >
        <i className="bi bi-robot"></i>
      </a>

      <div 
        id="chatWindow" 
        className={`chat-window chat-window-anim shadow ${isOpen ? 'show' : ''} ${isExpanded ? 'expanded' : ''}`} 
        style={{ display: isOpen ? 'flex' : 'none' }}
      >
        <div className="chat-header d-flex justify-content-between align-items-center text-white p-3">
          <div className="d-flex align-items-center">
            <div className="bg-white rounded-circle overflow-hidden me-2 chat-logo-wrap">
              <img src="/img/logo_chatbot.jpg" alt="AI Logo" className="chat-logo-img" />
            </div>
            <div>
              <h6 className="mb-0 fw-bold">Trợ lý AI HOCMOI</h6>
              <small className="text-white-50 chat-status-text">
                <i className="bi bi-circle-fill text-success chat-status-dot"></i> Đang hoạt động
              </small>
            </div>
          </div>

          <div className="chat-actions">
            <button type="button" className="btn btn-sm text-white p-1 me-1" onClick={() => setIsExpanded(!isExpanded)} title="Mở rộng">
              <i className={`bi ${isExpanded ? 'bi-arrows-angle-contract' : 'bi-arrows-angle-expand'} fs-5`}></i>
            </button>
            <button type="button" className="btn btn-sm text-white p-1" onClick={() => setIsOpen(false)} title="Đóng">
              <i className="bi bi-x-lg fs-5"></i>
            </button>
          </div>
        </div>

        <div className="chat-body p-3 bg-light overflow-auto d-flex flex-column gap-3">
          {messages.map((msg, index) => (
            <div key={index} className={`d-flex ${msg.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
              <div className={`${msg.sender === 'user' ? 'user-message' : 'ai-message'} p-2 px-3 rounded-4 shadow-sm text-break`}>
                {msg.sender === 'ai' ? (
                  msg.isTyping !== undefined ? (
                    <TypewriterEffect 
                      fullText={msg.text} 
                      isTyping={msg.isTyping} 
                      scrollToBottom={scrollToBottom} 
                      onDone={handleTypingDone} 
                    />
                  ) : (
                    formatAIResponse(msg.text)
                  )
                ) : (
                  <span style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</span>
                )}
              </div>
            </div>
          ))}

          {botStatus === 'fetching' && (
            <div className="d-flex justify-content-start">
              <div className="ai-message p-2 rounded-4 shadow-sm">
                <div className="dot-typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="chat-footer p-2 bg-white border-top">
          <div className="d-flex align-items-center bg-light rounded-pill p-1 border">
            <button type="button" className="btn text-secondary btn-sm rounded-circle p-2" title="Gửi hình ảnh"><i className="bi bi-image fs-5"></i></button>
            <button type="button" className="btn text-secondary btn-sm rounded-circle p-2" title="Ghi âm giọng nói"><i className="bi bi-mic fs-5"></i></button>

            <input
              type="text"
              className="form-control border-0 bg-transparent shadow-none px-2"
              placeholder="Nhập tin nhắn của bạn..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={botStatus !== 'idle'} 
            />

            {botStatus !== 'idle' ? (
              <button
                type="button"
                className="btn btn-danger text-white rounded-circle p-2 ms-1 d-flex align-items-center justify-content-center chat-send-btn"
                onClick={handleStopGeneration}
                title="Dừng phản hồi"
              >
                <i className="bi bi-stop-fill fs-5"></i>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-main-orange text-white rounded-circle p-2 ms-1 d-flex align-items-center justify-content-center chat-send-btn"
                onClick={() => handleSendMessage()}
              >
                <i className="bi bi-send-fill fs-5"></i>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}