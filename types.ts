export interface GeneratedImage {
  imageUrl: string;
  timestamp: number;
}

export interface FashionState {
  garmentImage: File | null;
  garmentPreview: string | null;
  modelImage: File | null;
  modelPreview: string | null;
  poseDescription: string;
  bgDescription: string;
  isGenerating: boolean;
  result: GeneratedImage | null;
  error: string | null;
}

export enum ImageType {
  GARMENT = 'GARMENT',
  MODEL = 'MODEL',
}

declare global {
  interface AIStudio {
    hasSelectedApiKey(): Promise<boolean>;
    openSelectKey(): Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}