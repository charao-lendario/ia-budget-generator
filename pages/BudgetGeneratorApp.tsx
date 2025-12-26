import React, { useState } from 'react';
import { QuoteForm } from '../components/QuoteForm';
import { ResultSection } from '../components/ResultSection';
import { Header } from '../components/Header';
import { ChatModal } from '../components/ChatModal';
import { PdfInfoModal } from '../components/PdfInfoModal';

import { generateQuote, analyzeCounterOffer, getChatResponse } from '../services/geminiService';
import { generateProposalPdf } from '../services/pdfGenerator';
import type { ProjectData, Quote, ClientCounterOffer, CounterOfferAnalysis, ChatMessage, PdfInfo, User } from '../types';

interface BudgetGeneratorAppProps {
  user: User;
  onLogout: () => void;
}

export const BudgetGeneratorApp: React.FC<BudgetGeneratorAppProps> = ({ user, onLogout }) => {
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [analysis, setAnalysis] = useState<CounterOfferAnalysis | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState<boolean>(false);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // State for the chat feature
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  // State for the PDF generation feature
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [quoteForPdf, setQuoteForPdf] = useState<Quote | null>(null);




  const handleGenerateQuote = async (data: ProjectData) => {
    setIsLoadingQuote(true);
    setError(null);



    setQuote(null);
    setAnalysis(null);
    setProjectData(data);
    setChatHistory([]); // Reset chat history for a new quote

    try {
      const generatedQuote = await generateQuote(data);
      setQuote(generatedQuote);

      // Add initial greeting from the AI strategist
      setChatHistory([{
        sender: 'ai',
        text: 'Orçamento gerado. Estou à disposição para discutir a estratégia de negociação. Faça sua pergunta.'
      }]);
    } catch (err) {
      console.error(err);
      setError('Ocorreu um erro ao gerar o orçamento. Por favor, tente novamente.');
    } finally {
      setIsLoadingQuote(false);
    }
  };

  const handleAnalyzeCounterOffer = async (clientOffer: ClientCounterOffer) => {
    if (!projectData || !quote) return;

    setIsLoadingAnalysis(true);
    setError(null);
    setAnalysis(null);

    try {
      const counterAnalysis = await analyzeCounterOffer(projectData, quote, clientOffer);
      setAnalysis(counterAnalysis);
    } catch (err) {
      console.error(err);
      setError('Ocorreu um erro ao analisar a contraproposta. Por favor, tente novamente.');
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const handleReset = () => {
    setProjectData(null);
    setQuote(null);
    setAnalysis(null);
    setError(null);
    setIsChatOpen(false);
    setChatHistory([]);
    setIsPdfModalOpen(false);
    setQuoteForPdf(null);
  };

  const handleSendMessage = async (message: string) => {
    if (!projectData || !quote) return;

    const newUserMessage: ChatMessage = { sender: 'user', text: message };
    const updatedHistory = [...chatHistory, newUserMessage];
    setChatHistory(updatedHistory);
    setIsChatLoading(true);

    try {
      const aiResponseText = await getChatResponse(projectData, quote, updatedHistory);
      const aiResponseMessage: ChatMessage = { sender: 'ai', text: aiResponseText };
      setChatHistory(prev => [...prev, aiResponseMessage]);
    } catch (err) {
      console.error("Error getting chat response:", err);
      const errorMessage: ChatMessage = { sender: 'ai', text: 'Desculpe, não consegui processar sua pergunta. Tente novamente.' };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleOpenPdfModal = (finalQuote: Quote) => {
    setQuoteForPdf(finalQuote);
    setIsPdfModalOpen(true);
  };

  const handleGeneratePdf = (pdfInfo: PdfInfo) => {
    if (quoteForPdf) {
      generateProposalPdf(pdfInfo, quoteForPdf);
    }
    setIsPdfModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      <Header user={user} onLogout={onLogout} />
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {!quote ? (
            <QuoteForm onSubmit={handleGenerateQuote} isLoading={isLoadingQuote} />
          ) : (
            <ResultSection
              quote={quote}
              analysis={analysis}
              onAnalyzeCounterOffer={handleAnalyzeCounterOffer}
              isLoadingAnalysis={isLoadingAnalysis}
              onReset={handleReset}
              onOpenChat={() => setIsChatOpen(true)}
              onOpenPdfModal={handleOpenPdfModal}
            />
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-500/10 text-red-300 border border-red-500/30 rounded-lg text-center">
              {error}
            </div>
          )}
        </div>
      </main>



      {quote && (
        <>
          <ChatModal
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            messages={chatHistory}
            onSendMessage={handleSendMessage}
            isLoading={isChatLoading}
          />
          <PdfInfoModal
            isOpen={isPdfModalOpen}
            onClose={() => setIsPdfModalOpen(false)}
            onSubmit={handleGeneratePdf}
          />
        </>
      )}

      <footer className="text-center py-4 text-brand-text-secondary text-sm">
        <p>&copy; {new Date().getFullYear()} IA Budget Generator. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};