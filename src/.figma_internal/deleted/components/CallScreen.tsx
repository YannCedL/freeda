import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Mic, Phone, PhoneOff, ArrowLeft } from 'lucide-react';
import callInterfaceImage from 'figma:asset/70f5aba0c586b4c1f9c8d316af73f4d579c520e5.png';

interface CallScreenProps {
  onBack: () => void;
}

export default function CallScreen({ onBack }: CallScreenProps) {
  const [callState, setCallState] = useState<'connecting' | 'calling' | 'ai-responding' | 'ended'>('connecting');
  const [timer, setTimer] = useState(20);
  const [isAnimating, setIsAnimating] = useState(true);

  // Phase 1: Connexion (2 secondes)
  useEffect(() => {
    const connectingTimer = setTimeout(() => {
      setCallState('calling');
    }, 2000);

    return () => clearTimeout(connectingTimer);
  }, []);

  // Phase 2: Appel (20 secondes avec countdown)
  useEffect(() => {
    if (callState === 'calling') {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCallState('ai-responding');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [callState]);

  // Phase 3: IA répond (10 secondes)
  useEffect(() => {
    if (callState === 'ai-responding') {
      const aiTimer = setTimeout(() => {
        setCallState('ended');
        setIsAnimating(false);
      }, 10000);

      return () => clearTimeout(aiTimer);
    }
  }, [callState]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch (callState) {
      case 'connecting':
        return 'Connexion en cours...';
      case 'calling':
        return 'Appel en cours';
      case 'ai-responding':
        return 'Assistant IA vous répond';
      case 'ended':
        return 'Appel terminé';
      default:
        return '';
    }
  };

  const getAIResponse = () => {
    if (callState === 'ai-responding') {
      return "Bonjour ! Je suis l'assistant virtuel Free. Comment puis-je vous aider aujourd'hui ? Je peux vous renseigner sur vos factures, votre consommation, ou résoudre un problème technique.";
    }
    if (callState === 'ended') {
      return "Merci d'avoir contacté Free. N'hésitez pas à nous recontacter si vous avez d'autres questions.";
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header avec bouton retour */}
      <div className="flex items-center justify-between mb-8">
        <Button
          variant="ghost"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">F</span>
          </div>
          <span className="text-lg font-bold text-foreground">ree</span>
        </div>
      </div>

      <div className="max-w-md mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-200px)] space-y-8">
        {/* Interface audio moderne */}
        <div className="relative flex flex-col items-center justify-center w-full">
          {/* Ondes sonores animées */}
          <div className="relative mb-16">
            {/* Ondes sonores basées sur l'image */}
            {isAnimating && (callState === 'connecting' || callState === 'calling' || callState === 'ai-responding') && (
              <div className="flex items-end justify-center space-x-1">
                {/* Création de 15 barres d'ondes sonores */}
                {Array.from({ length: 15 }).map((_, i) => {
                  const height = Math.random() * 40 + 20; // Hauteurs variables entre 20-60px
                  const delay = i * 0.1; // Délai progressif
                  const isCenter = i === 7; // Barre centrale plus haute
                  
                  return (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-all duration-300 ${
                        callState === 'ai-responding' 
                          ? 'bg-gradient-to-t from-cyan-400 to-blue-400' 
                          : 'bg-gradient-to-t from-blue-400 to-cyan-300'
                      }`}
                      style={{
                        height: `${isCenter ? height + 20 : height}px`,
                        animation: `waveAnimation 1.5s ease-in-out infinite ${delay}s`,
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Microphone principal */}
          <div className="relative mb-8">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 shadow-lg ${
              callState === 'ai-responding' 
                ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-green-400/40' 
                : callState === 'ended'
                ? 'bg-gradient-to-br from-gray-400 to-gray-600 shadow-gray-400/40'
                : 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-blue-400/40'
            }`}>
              <Mic className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Status et timer */}
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-gray-800 text-xl">{getStatusText()}</h2>
            {callState === 'calling' && (
              <p className="text-2xl font-mono text-blue-600">{formatTime(timer)}</p>
            )}
          </div>

          {/* Réponse IA */}
          {(callState === 'ai-responding' || callState === 'ended') && (
            <div className="w-full max-w-sm">
              <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-center gap-2 text-green-600 mb-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium text-sm">Assistant IA connecté</span>
                  </div>
                  <div className="text-sm text-gray-700 text-center">
                    <p>"{getAIResponse()}"</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-center gap-4 mt-8">
          {callState !== 'ended' ? (
            <Button
              variant="destructive"
              onClick={onBack}
              className="flex items-center gap-2 px-8 py-3 rounded-full"
            >
              <PhoneOff className="w-5 h-5" />
              Raccrocher
            </Button>
          ) : (
            <Button
              onClick={onBack}
              className="flex items-center gap-2 px-8 py-3 rounded-full bg-blue-600 hover:bg-blue-700"
            >
              <Phone className="w-5 h-5" />
              Nouvel appel
            </Button>
          )}
        </div>
      </div>

      {/* CSS pour l'animation des ondes */}
      <style jsx>{`
        @keyframes waveAnimation {
          0%, 100% { 
            transform: scaleY(0.4);
            opacity: 0.7;
          }
          50% { 
            transform: scaleY(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}