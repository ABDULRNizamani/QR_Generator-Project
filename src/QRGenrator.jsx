import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { QrCode, Link, Wifi, MessageSquare, Image, FileText, Download, RotateCcw, Loader2, AlertCircle } from 'lucide-react';
import './QRGenrator.css';

// Country codes data
const countryCodes = [
  { code: '+1', country: 'US/Canada' },
  { code: '+44', country: 'UK' },
  { code: '+91', country: 'India' },
  { code: '+92', country: 'Pakistan' },
  { code: '+61', country: 'Australia' },
  { code: '+86', country: 'China' },
  { code: '+81', country: 'Japan' },
  { code: '+49', country: 'Germany' },
  { code: '+33', country: 'France' },
  { code: '+971', country: 'UAE' },
];

function QRGenerator() {
  const [type, setType] = useState('text');
  const [input, setInput] = useState('');
  const [qrImage, setQrImage] = useState('');
  const [wifiData, setWifiData] = useState({ssid: '', password: '', encryption: 'WPA'});
  const [countryCode, setCountryCode] = useState('+92');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const features = ['Text', 'URL', 'WiFi', 'WhatsApp', 'Image', 'PDF'];

  // Typing animation effect
  useEffect(() => {
    let ticker = setInterval(() => {
      tick();
    }, typingSpeed);

    return () => clearInterval(ticker);
  }, [displayText, isDeleting, loopNum]);

  const tick = () => {
    let i = loopNum % features.length;
    let fullText = features[i];
    let updatedText = isDeleting 
      ? fullText.substring(0, displayText.length - 1)
      : fullText.substring(0, displayText.length + 1);

    setDisplayText(updatedText);

    if (isDeleting) {
      setTypingSpeed(50);
    }

    if (!isDeleting && updatedText === fullText) {
      setIsDeleting(true);
      setTypingSpeed(1500);
    } else if (isDeleting && updatedText === '') {
      setIsDeleting(false);
      setLoopNum(loopNum + 1);
      setTypingSpeed(150);
    }
  };

  const generateQR = async () => {
    setError('');
    setLoading(true);
    let dataEncode = '';
    
    try {
      if (type === 'text' || type === 'url') {
        if(!input){
          setError("Please provide input");
          setLoading(false);
          return;
        }
        dataEncode = input;
      } 
      else if(type === "wifi"){
         if (!wifiData.ssid || !wifiData.password) {
           setError("Please enter both WiFi name and password");
           setLoading(false);
           return;
         }
          const wifiString = `WIFI:T:${wifiData.encryption};S:${wifiData.ssid};P:${wifiData.password};;`;
          dataEncode = wifiString;
      } 
      else if(type === "whatsapp"){
          if(!phoneNumber){
            setError("Please enter phone number");
            setLoading(false);
            return;
          }
          const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
          const whatsappUrl = `https://wa.me/${countryCode.replace('+', '')}${cleanPhone}`;
          dataEncode = whatsappUrl;
      }
      else if(type === "image"){
        if(!imageFile){
          setError("Please select an image");
          setLoading(false);
          return;
        }
        
        const uploadedUrl = await uploadImage(imageFile);
        
        if(!uploadedUrl){
          setError("Image upload failed. Please try again.");
          setLoading(false);
          return;
        }
        
        dataEncode = uploadedUrl;
      }
      else if(type === "pdf"){
        if(!pdfFile){
          setError("Please select a PDF file");
          setLoading(false);
          return;
        }
        
        const uploadedUrl = await uploadPDF(pdfFile);
        
        if(!uploadedUrl){
          setError("PDF upload failed. Please try again.");
          setLoading(false);
          return;
        }
        
        dataEncode = uploadedUrl;
      }

      const url = await QRCode.toDataURL(dataEncode, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrImage(url);
      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to generate QR code. Please try again.");
      setLoading(false);
    }
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'qr_code');
    
    try {
      const response = await fetch('https://api.cloudinary.com/v1_1/dyau5koyt/image/upload', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      return data.secure_url || null;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const uploadPDF = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'qr_code');
    
    try {
      const response = await fetch('https://api.cloudinary.com/v1_1/dyau5koyt/raw/upload', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      return data.secure_url || null;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const downloadQR = () => {
    const link = document.createElement('a');
    link.download = `qrcode-${type}-${Date.now()}.png`;
    link.href = qrImage;
    link.click();
  };

  const resetForm = () => {
    setQrImage('');
    setInput('');
    setWifiData({ssid: '', password: '', encryption: 'WPA'});
    setPhoneNumber('');
    setImageFile(null);
    setPdfFile(null);
    setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const getTypeIcon = (typeValue) => {
    switch(typeValue) {
      case 'text': return <FileText size={18} />;
      case 'url': return <Link size={18} />;
      case 'wifi': return <Wifi size={18} />;
      case 'whatsapp': return <MessageSquare size={18} />;
      case 'image': return <Image size={18} />;
      case 'pdf': return <FileText size={18} />;
      default: return <QrCode size={18} />;
    }
  };

  return (
    <div className="qr-container">
      <div className="content-wrapper">
        <div className="left-section">
          <div className="logo-section">
            <QrCode size={40} className="logo-icon" />
            <h1 className="main-title">QR Generator</h1>
          </div>
          
          <p className="intro-text">
            Transform your digital content into scannable QR codes instantly. 
            Whether it's text, URLs, WiFi credentials, WhatsApp contacts, images, 
            or PDF documents—generate high-quality QR codes in seconds.
          </p>

          <div className="typing-container">
            <span className="typing-label">Generate QR for: </span>
            <span className="typing-text">{displayText}</span>
            <span className="cursor">|</span>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <QrCode size={20} />
              <span>Instant</span>
            </div>
            <div className="feature-card">
              <FileText size={20} />
              <span>Multiple Formats</span>
            </div>
            <div className="feature-card">
              <Download size={20} />
              <span>Easy Download</span>
            </div>
            <div className="feature-card">
              <Wifi size={20} />
              <span>WiFi Sharing</span>
            </div>
          </div>
        </div>

        <div className="right-section">
          {!qrImage ? (
            <div className="input-card">
              <h2 className="card-title">Create QR Code</h2>
              
              <div className="form-group">
                <label>Select Type</label>
                <div className="type-selector">
                  {['text', 'url', 'wifi', 'whatsapp', 'image', 'pdf'].map((t) => (
                    <button
                      key={t}
                      className={`type-btn ${type === t ? 'active' : ''}`}
                      onClick={() => {
                        setType(t);
                        resetForm();
                      }}
                    >
                      {getTypeIcon(t)}
                      <span>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {type === 'text' && (
                <div className="form-group">
                  <label>Enter Text</label>
                  <textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your text here..."
                    rows="3"
                    className="text-input"
                  />
                </div>
              )}

              {type === 'url' && (
                <div className="form-group">
                  <label>Enter URL</label>
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="https://example.com"
                    className="text-input"
                  />
                </div>
              )}

              {type === "wifi" && (
                <>
                  <div className="form-group">
                    <label>WiFi Name</label>
                    <input 
                      type='text' 
                      placeholder='Network name' 
                      value={wifiData.ssid}
                      onChange={(e) => setWifiData({...wifiData, ssid: e.target.value})}
                      className="text-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input 
                      type='password' 
                      placeholder='WiFi password' 
                      value={wifiData.password}
                      onChange={(e) => setWifiData({...wifiData, password: e.target.value})}
                      className="text-input"
                    />
                  </div>
                  
                </>
              )}

              {type === "whatsapp" && (
                <>
                  <div className="form-group">
                    <label>Country Code</label>
                    <select 
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="select-input"
                    >
                      {countryCodes.map((cc) => (
                        <option key={cc.code} value={cc.code}>
                          {cc.code} ({cc.country})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <div className="phone-input-group">
                      <span className="country-code-display">{countryCode}</span>
                      <input 
                        type="tel" 
                        placeholder="3001234567"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="text-input phone-input"
                      />
                    </div>
                  </div>
                </>
              )}

              {type === "image" && (
                <div className="form-group">
                  <label>Upload Image</label>
                  <div className="file-upload-container">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files[0])}
                      className="file-input"
                      id="image-input"
                    />
                    <label htmlFor="image-input" className="file-label">
                      <Image size={28} />
                      <span>{imageFile ? imageFile.name : 'Choose Image'}</span>
                    </label>
                  </div>
                </div>
              )}

              {type === "pdf" && (
                <div className="form-group">
                  <label>Upload PDF</label>
                  <div 
                    className="file-upload-container"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    <input 
                      type="file" 
                      accept="application/pdf"
                      onChange={(e) => setPdfFile(e.target.files[0])}
                      className="file-input"
                      id="pdf-input"
                    />
                    <label htmlFor="pdf-input" className="file-label">
                      <FileText size={28} />
                      <span>{pdfFile ? pdfFile.name : 'Choose or Drop PDF'}</span>
                    </label>
                  </div>
                </div>
              )}

              {error && (
                <div className="error-message">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <button onClick={generateQR} className="generate-btn" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={20} className="spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <QrCode size={20} />
                    Generate QR Code
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="result-card">
              <h2 className="card-title">Your QR Code</h2>
              <div className="qr-display">
                <img src={qrImage} alt="Generated QR Code" />
              </div>
              <div className="button-group">
                <button onClick={downloadQR} className="download-btn">
                  <Download size={20} />
                  Download
                </button>
                <button onClick={resetForm} className="reset-btn">
                  <RotateCcw size={20} />
                  New QR
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default QRGenerator;