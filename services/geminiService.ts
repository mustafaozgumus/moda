import { GoogleGenAI } from "@google/genai";

declare const process: { env: { [key: string]: string | undefined } };

// Optimized image processing: Resizes large images to max 1536px to ensure fast API upload and prevent timeouts
const processImage = (file: File): Promise<{ data: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        // Resize logic
        const maxDim = 1536; // Sufficient for high quality generation while keeping payload size manageable
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error("Canvas context oluşturulamadı"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Determine output format based on input
        // Maintain transparency for PNGs, use JPEG for others to save size
        const isPng = file.type === 'image/png';
        const outputMimeType = isPng ? 'image/png' : 'image/jpeg';
        const quality = 0.85;

        const dataUrl = canvas.toDataURL(outputMimeType, quality);
        const base64Content = dataUrl.split(',')[1];
        
        resolve({
          data: base64Content,
          mimeType: outputMimeType
        });
      };
      img.onerror = (e) => reject(new Error("Görsel işlenirken hata oluştu: " + e));
    };
    reader.onerror = (e) => reject(new Error("Dosya okunamadı: " + e));
  });
};

export const generateFashionShot = async (
  garmentFile: File,
  modelFile: File,
  poseDescription: string,
  bgDescription: string
): Promise<string> => {
  try {
    if (!process.env.API_KEY) {
      throw new Error("API Anahtarı bulunamadı (process.env.API_KEY).");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Process images (resize & convert) concurrently
    const [garment, model] = await Promise.all([
      processImage(garmentFile),
      processImage(modelFile)
    ]);

    const promptText = `
**Görev:**
Model fotoğrafına verilen kıyafeti gerçekçi şekilde giydir, modeli kullanıcı tarafından tarif edilen pozu alacak şekilde düzenle ve sonucu belirtilen arka plan sahnesi ile uyumlu, yüksek çözünürlüklü bir moda çekimi fotoğrafı olarak üret.

**Beklenen İşlemler:**
1. Kıyafetin Modele Gerçekçi Giydirilmesi: Kıyafeti modelin vücut formuna, hareketine ve verdiği poza doğal şekilde oturt. Kumaşın kıvrımları, gerilmeleri, gölgeleri ve ışık yansımaları fiziksel olarak doğru olmalıdır.
2. Model Pozunun Yönlendirilmesi: Poz doğal ve anatomik olarak doğru olmalı. Bacak, kol ve gövde oranları deforme edilmemeli. Editorial tarzı.
3. Arka Plan Uygulaması: Model ile arka plan arasında ışık yönü, kontrast ve renk sıcaklığı tutarlı olmalıdır.
4. Nihai Görsel: Tek bir görüntü, yüksek kalite, profesyonel moda çekimi seviyesi.

**Girdi Detayları:**
- Kıyafet Fotoğrafı: (İlk görsel)
- Model Fotoğrafı: (İkinci görsel)
- Poz Açıklaması: ${poseDescription || "Model doğal bir duruş sergiliyor, moda çekimi estetiğine uygun."}
- Arka Plan Açıklaması: ${bgDescription || "Nötr, stüdyo gri arka plan, yumuşak profesyonel ışıklandırma."}

Bu talimatlara uygun tek bir nihai moda fotoğrafı oluştur.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: garment.mimeType,
              data: garment.data
            }
          },
          {
            inlineData: {
              mimeType: model.mimeType,
              data: model.data
            }
          },
          {
            text: promptText
          }
        ]
      },
      config: {
        // Default config
      }
    });

    // 1. Check for Image part first
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    // 2. If no image, check for Text using response.text getter
    const textPart = response.text;
    if (textPart) {
        console.warn("Model returned text instead of image:", textPart);
        // Throwing this text helps the user understand why generation failed (e.g., safety policy)
        throw new Error(`Model görsel üretemedi. Yanıt: ${textPart.slice(0, 150)}${textPart.length > 150 ? '...' : ''}`);
    }

    throw new Error("Model boş yanıt döndürdü veya görsel üretemedi. Lütfen tekrar deneyin.");

  } catch (error) {
    console.error("Gemini API Hatası:", error);
    throw error;
  }
};