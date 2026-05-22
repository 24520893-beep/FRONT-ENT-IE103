import { useState, useRef, useEffect, useCallback } from 'react';
import { fetchClient } from '../utils/fetchClient'; 

// 1. Hàm hỗ trợ Markdown
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

// Hàm nén ảnh bằng Canvas
const resizeImage = (file, maxWidth = 1280) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (!blob) return resolve(file);
          const resizedFile = new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() });
          resolve(resizedFile);
        }, 'image/jpeg', 0.8);
      };
    };
  });
};

// Component hiệu ứng gõ chữ
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

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Xin chào! Tôi là AI học thuật của HOCMOI. Bạn cần hỗ trợ gì hoặc gửi các ảnh bài toán cho tôi nhé!' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [botStatus, setBotStatus] = useState('idle'); 
  
  // ĐÃ ĐỔI: Tách biệt quản lý danh sách ảnh và 1 file ghi âm duy nhất
  const [selectedImages, setSelectedImages] = useState([]); // Mảng chứa các đối tượng { file, url }
  const [selectedAudio, setSelectedAudio] = useState(null);  // Chỉ chứa duy nhất 1 đối tượng { file, url }
  
  const [isRecording, setIsRecording] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, selectedImages, selectedAudio, isRecording]);

  const handleCopyMessage = (text, index) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  // ĐÃ SỬA: Hỗ trợ duyệt và nén nhiều ảnh cùng lúc
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const processedImages = [];
    for (const file of files) {
      if (file.size > 15 * 1024 * 1024) {
        alert(`File ảnh ${file.name} quá lớn! Vui lòng chọn các ảnh dưới 15MB.`);
        continue;
      }

      let fileToProcess = file;
      if (file.type.startsWith('image/')) {
        fileToProcess = await resizeImage(file, 1280);
      }
      const url = URL.createObjectURL(fileToProcess);
      processedImages.push({ file: fileToProcess, url });
    }

    setSelectedImages(prev => [...prev, ...processedImages]);
    if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input để chọn lại file trùng tên
  };

  // XỬ LÝ GHI ÂM (Giữ nguyên giới hạn 1 cái duy nhất)
  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      if (selectedAudio) {
        alert("Bạn chỉ được phép gửi duy nhất 1 đoạn ghi âm cho mỗi tin nhắn!");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];
        
        mediaRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(audioBlob);
          setSelectedAudio({ file: audioBlob, url, name: 'voice.webm' });
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Lỗi truy cập Mic:", err);
        alert("Vui lòng cấp quyền Microphone để ghi âm!");
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
  };

  const removeImage = (index) => {
    setSelectedImages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].url);
      updated.splice(index, 1);
      return updated;
    });
  };

  const clearAudio = () => {
    if (selectedAudio?.url) URL.revokeObjectURL(selectedAudio.url);
    setSelectedAudio(null);
  };

  // ĐÃ SỬA: Đóng gói toàn bộ mảng ảnh và file voice gửi lên API
  const handleSendMessage = useCallback(async (textOverride) => {
    const messageContent = textOverride || inputValue;
    
    if (!messageContent.trim() && selectedImages.length === 0 && !selectedAudio) return;
    if (botStatus !== 'idle') return;

    // Chuẩn bị dữ liệu hiển thị tức thì trên UI bóng chat
    const attachForUI = {
      images: selectedImages.map(img => ({ url: img.url })),
      audio: selectedAudio ? { url: selectedAudio.url } : null
    };
    
    const newUserMsg = { sender: 'user', text: messageContent, attachment: attachForUI };
    setMessages(prev => [...prev, newUserMsg]);
    
    // Lưu tạm danh sách file cần upload trước khi dọn dẹp form
    const imagesToSend = [...selectedImages];
    const audioToSend = selectedAudio;

    // Reset trạng thái form nhập ngay lập tức
    setInputValue('');
    setSelectedImages([]);
    setSelectedAudio(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    setBotStatus('fetching');
    abortControllerRef.current = new AbortController();

    try {
      const formData = new FormData();
      if (messageContent.trim()) formData.append('message', messageContent);
      
      // Đẩy toàn bộ ảnh vào trường 'files' chung
      imagesToSend.forEach((img, index) => {
        formData.append('files', img.file, img.file.name || `image_${index}.jpg`);
      });

      // Đẩy file âm thanh duy nhất vào trường 'files' chung
      if (audioToSend) {
        formData.append('files', audioToSend.file, 'voice.webm');
      }

      const response = await fetchClient('/api/chat', {
        method: 'POST',
        body: formData,
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
  }, [inputValue, botStatus, selectedImages, selectedAudio]);

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
      <a href="#" className={`ai-chat-bubble shadow ${isOpen ? 'chat-bubble-hidden' : ''}`} onClick={(e) => { e.preventDefault(); setIsOpen(true); }}>
        <i className="bi bi-robot"></i>
      </a>

      <div id="chatWindow" className={`chat-window shadow-lg ${isOpen ? 'show' : ''} ${isExpanded ? 'expanded' : ''}`} style={{ display: isOpen ? 'flex' : 'none', flexDirection: 'column' }}>
        
        <div className="chat-header d-flex justify-content-between align-items-center text-white p-3 shadow-sm">
          <div className="d-flex align-items-center">
            <div className="bg-white rounded-circle overflow-hidden me-2 chat-logo-wrap" style={{width: 35, height: 35}}>
              <img src="/img/logo_chatbot.jpg" alt="AI" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
            </div>
            <div>
              <h6 className="mb-0 fw-bold">Trợ lý AI HOCMOI</h6>
              <small className="text-white-50"><i className="bi bi-circle-fill text-success" style={{fontSize: '8px'}}></i> Đang hoạt động</small>
            </div>
          </div>
          <div className="chat-actions">
            <button type="button" className="btn btn-sm text-white p-1 me-1 border-0 shadow-none" onClick={() => setIsExpanded(!isExpanded)}>
              <i className={`bi ${isExpanded ? 'bi-arrows-angle-contract' : 'bi-arrows-angle-expand'} fs-5`}></i>
            </button>
            <button type="button" className="btn btn-sm text-white p-1 border-0 shadow-none" onClick={() => setIsOpen(false)}>
              <i className="bi bi-x-lg fs-5"></i>
            </button>
          </div>
        </div>

        <div className="chat-body flex-grow-1 p-3 bg-light overflow-auto d-flex flex-column gap-3">
          {messages.map((msg, index) => (
            <div key={index} className={`d-flex flex-column ${msg.sender === 'user' ? 'align-items-end' : 'align-items-start'}`}>
              
              {/* ĐÃ SỬA: Hiển thị NHIỀU ẢNH đính kèm dàn hàng ngang gọn gàng bên ngoài box nền xanh */}
              {msg.attachment && msg.attachment.images && msg.attachment.images.length > 0 && (
                <div className="d-flex flex-wrap gap-2 mb-1 justify-content-end animate__animated animate__fadeIn" style={{ maxWidth: '85%' }}>
                  {msg.attachment.images.map((img, imgIdx) => (
                    <img 
                      key={imgIdx}
                      src={img.url} 
                      alt="upload" 
                      className="img-fluid rounded-3 border bg-white shadow-sm p-1" 
                      style={{ maxHeight: '120px', maxWidth: '140px', objectFit: 'contain' }} 
                    />
                  ))}
                </div>
              )}

              {/* TẦNG 2: Hiển thị thanh ghi âm Voice duy nhất */}
              {msg.attachment && msg.attachment.audio && (
                <div className="mb-1 p-1 bg-white border rounded-pill shadow-sm d-flex align-items-center animate__animated animate__fadeIn animate__faster">
                  <i className="bi bi-play-circle-fill text-primary fs-5 ms-2 me-1"></i>
                  <audio controls src={msg.attachment.audio.url} style={{ height: '32px', maxWidth: '210px' }}></audio>
                </div>
              )}

              {/* TẦNG 3: Chỉ hiển thị Box nền xanh/trắng khi tin nhắn có chữ */}
              {msg.text && (
                <div className={`${msg.sender === 'user' ? 'bg-primary text-white' : 'bg-white text-dark'} p-2 px-3 rounded-4 shadow-sm text-break position-relative`} style={{ maxWidth: '85%' }}>
                  {msg.sender === 'ai' ? (
                    msg.isTyping !== undefined ? (
                      <TypewriterEffect fullText={msg.text} isTyping={msg.isTyping} scrollToBottom={scrollToBottom} onDone={handleTypingDone} />
                    ) : (
                      formatAIResponse(msg.text)
                    )
                  ) : (
                    <span style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</span>
                  )}
                </div>
              )}

              {/* NÚT COPY TIN NHẮN */}
              {msg.text && !msg.isTyping && (
                <button 
                  onClick={() => handleCopyMessage(msg.text, index)} 
                  className={`btn btn-sm p-0 mt-1 border-0 ${copiedIndex === index ? 'text-success' : 'text-secondary opacity-50'}`}
                  style={{ fontSize: '0.8rem', transition: 'all 0.2s' }}
                >
                  <i className={`bi ${copiedIndex === index ? 'bi-check2-all' : 'bi-copy'} me-1`}></i> 
                  {copiedIndex === index ? 'Đã copy' : 'Copy'}
                </button>
              )}
            </div>
          ))}

          {botStatus === 'fetching' && (
            <div className="d-flex justify-content-start">
              <div className="bg-white p-2 px-3 rounded-4 shadow-sm">
                <div className="spinner-grow spinner-grow-sm text-secondary me-1" role="status"></div>
                <div className="spinner-grow spinner-grow-sm text-secondary me-1" role="status"></div>
                <div className="spinner-grow spinner-grow-sm text-secondary" role="status"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-footer p-2 bg-white border-top">
          
          {/* ĐÃ SỬA: UI PREVIEW TẦNG RIÊNG (Hỗ trợ nhiều ảnh + 1 voice) */}
          {(selectedImages.length > 0 || selectedAudio) && (
            <div className="mb-2 p-2 bg-light border rounded-3 d-flex flex-column gap-2 shadow-sm animate__animated animate__fadeInUp animate__faster">
              
              {/* Vùng hiển thị list ảnh thu nhỏ */}
              {selectedImages.length > 0 && (
                <div className="d-flex flex-wrap gap-2">
                  {selectedImages.map((img, idx) => (
                    <div key={idx} className="position-relative d-inline-block shadow-sm rounded bg-white p-1">
                      <img src={img.url} alt="preview" className="rounded" style={{ maxHeight: '50px', maxWidth: '65px', objectFit: 'contain' }} />
                      <button 
                        type="button" 
                        className="btn btn-sm btn-danger rounded-circle position-absolute top-0 start-100 translate-middle shadow d-flex align-items-center justify-content-center"
                        onClick={() => removeImage(idx)}
                        style={{ width: '18px', height: '18px', padding: 0, border: '1.5px solid white', fontSize: '10px' }}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Vùng hiển thị audio ghi âm duy nhất */}
              {selectedAudio && (
                <div className="p-1 bg-white border rounded-3 d-flex align-items-center justify-content-between shadow-xs">
                  <div className="d-flex align-items-center text-primary bg-primary-subtle px-3 py-1 rounded-pill">
                    <i className="bi bi-file-earmark-music-fill fs-5 me-2"></i>
                    <audio controls src={selectedAudio.url} style={{ height: '28px', maxWidth: '150px' }}></audio>
                  </div>
                  <button type="button" className="btn btn-sm btn-outline-danger border-0 rounded-circle" onClick={clearAudio}>
                    <i className="bi bi-trash-fill fs-6"></i>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Ô INPUT VÀ NÚT ĐIỀU KHIỂN */}
          {isRecording ? (
            <div className="d-flex align-items-center bg-danger-subtle rounded-pill p-1 border border-danger animate__animated animate__fadeIn">
              <div className="flex-grow-1 d-flex align-items-center px-3">
                <span className="spinner-grow spinner-grow-sm text-danger me-2"></span>
                <span className="text-danger fw-bold small">Đang ghi âm...</span>
              </div>
              <button type="button" className="btn btn-outline-danger btn-sm rounded-circle p-2 mx-1 border-0" onClick={cancelRecording}>
                <i className="bi bi-x-lg fs-6"></i>
              </button>
              <button type="button" className="btn btn-danger text-white btn-sm rounded-circle p-2" onClick={toggleRecording}>
                <i className="bi bi-check-lg fs-5"></i>
              </button>
            </div>
          ) : (
            <div className="d-flex align-items-center bg-light rounded-pill p-1 border">
              {/* ĐÃ THÊM: thuộc tính multiple cho phép chọn nhiều ảnh */}
              <input type="file" accept="image/*" ref={fileInputRef} hidden multiple onChange={handleFileSelect} />
              
              <button type="button" className="btn text-secondary btn-sm rounded-circle p-2 border-0 shadow-none flex-shrink-0" title="Đính kèm ảnh" onClick={() => fileInputRef.current.click()} disabled={botStatus !== 'idle'}>
                <i className="bi bi-image fs-5 text-primary"></i>
              </button>
              
              {/* TỰ ĐỘNG KHÓA MICRO: Nếu đã có 1 file audio ghi âm từ trước */}
              <button type="button" className="btn text-secondary btn-sm rounded-circle p-2 border-0 shadow-none flex-shrink-0" title="Ghi âm" onClick={toggleRecording} disabled={botStatus !== 'idle' || !!selectedAudio}>
                <i className="bi bi-mic fs-5"></i>
              </button>

              <input
                type="text"
                className="form-control border-0 bg-transparent shadow-none px-2 text-dark flex-grow-1"
                placeholder="Nhắn gì đó cho tớ..."
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
                <button type="button" className="btn btn-danger text-white rounded-circle p-2 ms-1 d-flex align-items-center justify-content-center flex-shrink-0" onClick={handleStopGeneration} style={{width: 38, height: 38}}>
                  <i className="bi bi-stop-fill fs-5"></i>
                </button>
              ) : (
                <button type="button" className="btn btn-primary text-white rounded-circle p-2 ms-1 d-flex align-items-center justify-content-center shadow-sm flex-shrink-0" onClick={() => handleSendMessage()} style={{width: 38, height: 38}} disabled={!inputValue.trim() && selectedImages.length === 0 && !selectedAudio}>
                  <i className="bi bi-send-fill fs-5"></i>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}