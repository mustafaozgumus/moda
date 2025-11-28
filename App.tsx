import React, { useState, useEffect } from 'react';
import { Sparkles, Camera, Wand2, Download, RefreshCw, AlertCircle } from 'lucide-react';
import { ImageUploader } from './components/ImageUploader';
import { generateFashionShot } from './services/geminiService';
import { FashionState, ImageType } from './types';

const App: React.FC = () => {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isCheckingKey, setIsCheckingKey] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [state, setState] = useState<FashionState>({
    garmentImage: null,
    garmentPreview: null,
    modelImage: null,
    modelPreview: null,
    poseDescription: '',
    bgDescription: '',
    isGenerating: false,
    result: null,
    error: null,
  });

  useEffect(() => {
    const checkKey = async () => {
      try {
        if (window.aistudio) {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setHasApiKey(hasKey);
        } else {
          // Fallback for environments without the injection (e.g., local dev)
          setHasApiKey(true);
        }
      } catch (e) {
        console.error("API Key Check Error:", e);
      } finally {
        setIsCheckingKey(false);
      }
    };
    checkKey();
  }, []);

  const handleConnect = async () => {
    setAuthError(null);
    if (window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
        setHasApiKey(true);
      } catch (e) {
        console.error("API Key Selection Error:", e);
        setAuthError("API anahtarı seçimi sırasında bir hata oluştu. Lütfen tekrar deneyin.");
      }
    } else {
      // Local dev fallback
      setHasApiKey(true);
    }
  };

  const handleUpload = (type: ImageType, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setState(prev => ({
        ...prev,
        [type === ImageType.GARMENT ? 'garmentImage' : 'modelImage']: file,
        [type === ImageType.GARMENT ? 'garmentPreview' : 'modelPreview']: reader.result as string,
        error: null // Clear errors on new upload
      }));
    };
    reader.readAsDataURL(file);
  };

  const clearImage = (type: ImageType) => {
    setState(prev => ({
      ...prev,
      [type === ImageType.GARMENT ? 'garmentImage' : 'modelImage']: null,
      [type === ImageType.GARMENT ? 'garmentPreview' : 'modelPreview']: null,
    }));
  };

  const handleGenerate = async () => {
    if (!state.garmentImage || !state.modelImage) {
      setState(prev => ({ ...prev, error: "Lütfen hem kıyafet hem de model fotoğrafını yükleyin." }));
      return;
    }

    setState(prev => ({ ...prev, isGenerating: true, error: null, result: null }));

    try {
      const generatedImageUrl = await generateFashionShot(
        state.garmentImage,
        state.modelImage,
        state.poseDescription,
        state.bgDescription
      );

      setState(prev => ({
        ...prev,
        isGenerating: false,
        result: {
          imageUrl: generatedImageUrl,
          timestamp: Date.now()
        }
      }));
    } catch (err: any) {
      console.error("Generation Error Details:", err);
      
      const errorString = typeof err === 'object' ? JSON.stringify(err) : String(err);
      const errorMessage = err.message || "Görüntü oluşturulurken bir hata oluştu.";

      // Handle Permission Denied / Entity Not Found by resetting key selection
      const isPermissionError = 
        errorMessage.includes('403') || 
        errorMessage.includes('PERMISSION_DENIED') || 
        errorMessage.includes('The caller does not have permission') ||
        errorMessage.includes('Requested entity was not found') ||
        errorString.includes('PERMISSION_DENIED') ||
        errorString.includes('403');

      if (isPermissionError) {
        setAuthError("Erişim reddedildi (403). Gemini 3 Pro modeli için faturalandırma hesabı bağlı, ücretli bir proje (Pay-as-you-go) seçmelisiniz.");
        setHasApiKey(false);
        // Stop execution here to show landing page
        return;
      }

      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: errorMessage
      }));
    }
  };

  const downloadImage = () => {
    if (state.result?.imageUrl) {
      const link = document.createElement('a');
      link.href = state.result.imageUrl;
      link.download = `moda-ai-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (isCheckingKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fashion-black"></div>
      </div>
    );
  }

  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-fashion-accent/5 rounded-full blur-3xl"></div>
            <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-gray-200/20 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-md w-full text-center relative z-10 space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="space-y-2">
            <div className="bg-fashion-black text-white p-3 rounded-2xl w-16 h-16 mx-auto flex items-center justify-center mb-6 shadow-xl shadow-fashion-black/20">
               <Camera size={32} />
            </div>
            <h1 className="text-4xl font-serif font-bold text-fashion-black tracking-tight">
              MODA<span className="text-fashion-accent">AI</span>
            </h1>
            <p className="text-gray-500 font-medium tracking-widest uppercase text-xs">Sanal Prodüksiyon Stüdyosu</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 backdrop-blur-sm">
            {authError && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-start gap-3 text-sm text-left animate-pulse">
                  <AlertCircle size={20} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-1">Yetkilendirme Hatası</p>
                    <p>{authError}</p>
                  </div>
              </div>
            )}

            <p className="text-gray-600 mb-8 leading-relaxed text-sm">
              Profesyonel moda çekimleri oluşturmak için <strong>Google Gemini 3 Pro</strong> modelini kullanıyoruz. Devam etmek için lütfen geçerli bir faturalandırma projesi seçin.
            </p>
            
            <button
              onClick={handleConnect}
              className="w-full py-4 px-6 bg-fashion-black text-white rounded-xl font-medium hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-3"
            >
              <Sparkles size={18} />
              <span>{authError ? 'API Anahtarını Değiştir' : 'Stüdyoya Giriş Yap'}</span>
            </button>

            <div className="mt-6 text-xs text-gray-400">
               <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-fashion-accent transition-colors">
                 Faturalandırma hakkında bilgi
               </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-fashion-black pb-20 bg-[#fcfcfc]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-fashion-black text-white p-2 rounded-lg">
              <Camera size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold tracking-tight">MODA<span className="text-fashion-accent">AI</span></h1>
              <p className="text-xs text-gray-500 uppercase tracking-widest">Sanal Prodüksiyon Stüdyosu</p>
            </div>
          </div>
          <div className="hidden sm:block text-xs font-medium text-gray-400 border border-gray-200 px-3 py-1 rounded-full">
            Powered by Gemini 3 Pro
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Inputs */}
          <div className="lg:col-span-5 space-y-8">
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-serif font-semibold mb-6 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-sans">1</span>
                Varlıklar
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <ImageUploader 
                  id="garment"
                  label="Kıyafet" 
                  preview={state.garmentPreview}
                  onUpload={(f) => handleUpload(ImageType.GARMENT, f)}
                  onClear={() => clearImage(ImageType.GARMENT)}
                />
                <ImageUploader 
                  id="model"
                  label="Model" 
                  preview={state.modelPreview}
                  onUpload={(f) => handleUpload(ImageType.MODEL, f)}
                  onClear={() => clearImage(ImageType.MODEL)}
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-serif font-semibold mb-6 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-sans">2</span>
                Sanat Yönetimi
              </h2>
              
              <div className="space-y-5">
                <div>
                  <label htmlFor="pose" className="block text-sm font-medium text-gray-700 mb-2">
                    Poz Açıklaması
                  </label>
                  <textarea
                    id="pose"
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-fashion-accent/20 focus:border-fashion-accent transition-all text-sm resize-none placeholder-gray-400"
                    placeholder="Örn: Model bir ayağı önde, omuzları hafif geri, kameraya doğru hafif gülümseyerek baksın..."
                    value={state.poseDescription}
                    onChange={(e) => setState(prev => ({ ...prev, poseDescription: e.target.value }))}
                  />
                </div>

                <div>
                  <label htmlFor="bg" className="block text-sm font-medium text-gray-700 mb-2">
                    Arka Plan & Sahne
                  </label>
                  <textarea
                    id="bg"
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-fashion-accent/20 focus:border-fashion-accent transition-all text-sm resize-none placeholder-gray-400"
                    placeholder="Örn: Minimalist beton duvar önünde, gün batımı ışığı, yumuşak gölgeler..."
                    value={state.bgDescription}
                    onChange={(e) => setState(prev => ({ ...prev, bgDescription: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={state.isGenerating || !state.garmentImage || !state.modelImage}
              className={`w-full py-4 px-6 rounded-xl flex items-center justify-center gap-3 text-white font-medium transition-all shadow-lg transform hover:-translate-y-0.5
                ${state.isGenerating 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-fashion-black hover:bg-gray-800 shadow-fashion-black/20'
                }`}
            >
              {state.isGenerating ? (
                <>
                  <RefreshCw className="animate-spin" size={20} />
                  <span>Stüdyo İşleniyor...</span>
                </>
              ) : (
                <>
                  <Wand2 size={20} />
                  <span>Fotoğrafı Oluştur</span>
                </>
              )}
            </button>
            
            {state.error && (
              <div className="p-4 rounded-lg bg-red-50 text-red-600 text-sm flex items-start gap-3">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <p>{state.error}</p>
              </div>
            )}
          </div>

          {/* Right Column: Output */}
          <div className="lg:col-span-7">
            <div className="h-full bg-white rounded-2xl shadow-sm border border-gray-100 p-2 sm:p-6 lg:min-h-[800px] flex flex-col">
               <div className="flex items-center justify-between mb-4 px-2">
                 <h2 className="text-lg font-serif font-semibold">Sonuç</h2>
                 {state.result && (
                   <button 
                    onClick={downloadImage}
                    className="flex items-center gap-2 text-sm text-fashion-black hover:text-fashion-accent transition-colors font-medium"
                   >
                     <Download size={18} />
                     İndir
                   </button>
                 )}
               </div>

               <div className={`flex-1 rounded-xl overflow-hidden relative transition-all duration-500 flex items-center justify-center
                 ${state.result ? 'bg-gray-50' : 'bg-gray-50/50 border-2 border-dashed border-gray-200'}`}
               >
                 {state.isGenerating ? (
                   <div className="text-center px-6">
                     <div className="w-16 h-16 border-4 border-gray-200 border-t-fashion-accent rounded-full animate-spin mx-auto mb-6"></div>
                     <h3 className="text-lg font-medium text-gray-800 mb-2">Yapay Zeka Çalışıyor</h3>
                     <p className="text-gray-500 text-sm max-w-xs mx-auto animate-pulse">
                       Kıyafet dokuları işleniyor, ışık ayarlanıyor ve final render alınıyor...
                     </p>
                   </div>
                 ) : state.result ? (
                   <img 
                     src={state.result.imageUrl} 
                     alt="Generated Fashion Shot" 
                     className="max-w-full max-h-[800px] object-contain shadow-lg"
                   />
                 ) : (
                   <div className="text-center p-8">
                     <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                       <Sparkles size={32} />
                     </div>
                     <h3 className="text-lg font-medium text-gray-400">Henüz bir görsel oluşturulmadı</h3>
                     <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto">
                       Soldaki panelden kıyafet ve model yükleyip, istediğiniz sahneyi tarif ederek başlayın.
                     </p>
                   </div>
                 )}
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;