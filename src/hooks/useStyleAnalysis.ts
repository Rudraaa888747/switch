import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

export interface AnalysisResult {
  skinTone: string;
  bodyStructure: string;
  styleCategory: string;
  colorPalette: string[];
  recommendations: string[];
}

export const useStyleAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeImage = async (
    imageBase64: string,
    options?: { imageUrl?: string; userId?: string }
  ): Promise<AnalysisResult | null> => {
    setIsAnalyzing(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/style-analysis`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            imageBase64,
            imageUrl: options?.imageUrl || null,
            userId: options?.userId || null,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      return result as AnalysisResult;
    } catch (error) {
      console.error('Style analysis error:', error);
      toast({
        title: 'Analysis failed',
        description: 'Unable to analyze the image. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { analyzeImage, isAnalyzing };
};
