/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Upload, 
  Leaf, 
  Droplets, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw,
  Info,
  ChevronRight,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { analyzePlantImage, type PlantAnalysis } from '@/services/gemini';
import { cn } from '@/lib/utils';

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PlantAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setCameraError("Acesso à câmera negado. Por favor, permita o acesso nas configurações do seu navegador.");
      } else if (String(err).includes('dismissed')) {
        setCameraError("A permissão da câmera foi fechada. Tente clicar no botão abaixo para ativar manualmente.");
      } else {
        setCameraError("Não foi possível acessar a câmera. Tente abrir o app em uma nova aba.");
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Ensure video is playing when tab changes and element is ready
  React.useEffect(() => {
    if (activeTab === 'camera' && stream && videoRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = stream;
    }
  }, [activeTab, stream]);

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setImage(dataUrl);
        stopCamera();
        handleAnalyze(dataUrl);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setImage(dataUrl);
        handleAnalyze(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async (imgData: string) => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    try {
      const analysis = await analyzePlantImage(imgData);
      setResult(analysis);
    } catch (err) {
      setError("Ocorreu um erro ao analisar a imagem. Tente novamente.");
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setError(null);
    setIsAnalyzing(false);
    if (activeTab === 'camera') startCamera();
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary rounded-xl text-primary-foreground">
              <Leaf className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Planta Viva</h1>
          </div>
          <Badge variant="secondary" className="font-medium bg-secondary text-primary border-none px-3 py-1">
            Beta
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-12 max-w-4xl">
        <AnimatePresence mode="wait">
          {!image ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6 md:space-y-12"
            >
              <div className="text-center space-y-3 md:space-y-4 max-w-2xl mx-auto">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-primary leading-tight">
                  Cuide de suas plantas com inteligência
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground font-light px-2">
                  Capture uma foto da folha e receba diagnósticos precisos sobre a espécie, hidratação e possíveis doenças em segundos.
                </p>
              </div>

              <Tabs defaultValue="upload" className="w-full flex flex-col items-center" onValueChange={(v) => {
                setActiveTab(v);
                if (v === 'camera') startCamera();
                else stopCamera();
              }}>
                <TabsList className="flex w-full max-w-xs sm:max-w-md mb-6 md:mb-10 bg-muted/50 p-1 rounded-2xl h-auto">
                  <TabsTrigger 
                    value="upload" 
                    className="flex-1 rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground transition-all"
                  >
                    <Upload className="w-4 h-4 mr-2 shrink-0" />
                    <span className="text-sm font-bold">Upload</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="camera" 
                    className="flex-1 rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground transition-all"
                  >
                    <Camera className="w-4 h-4 mr-2 shrink-0" />
                    <span className="text-sm font-bold">Câmera</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="w-full">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="organic-card w-full min-h-[300px] flex flex-col items-center justify-center border-dashed border-2 border-primary/20 hover:border-primary/50 transition-all cursor-pointer group bg-card px-6 py-12"
                  >
                    <div className="p-5 md:p-6 bg-primary/5 rounded-full group-hover:scale-110 transition-transform">
                      <ImageIcon className="w-10 h-10 md:w-12 md:h-12 text-primary" />
                    </div>
                    <p className="mt-6 text-primary font-bold text-center text-lg md:text-xl leading-tight">
                      Clique para selecionar uma foto
                    </p>
                    <p className="text-sm text-muted-foreground mt-3">PNG, JPG ou JPEG</p>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleFileUpload} 
                    />
                  </div>
                </TabsContent>

                <TabsContent value="camera" className="w-full">
                  <div className="organic-card w-full aspect-square sm:aspect-video relative bg-black overflow-hidden flex flex-col items-center justify-center">
                    {activeTab === 'camera' && !cameraError && (
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        className="w-full h-full object-cover"
                      />
                    )}
                    
                    {cameraError ? (
                      <div className="p-6 md:p-8 text-center space-y-4">
                        <AlertTriangle className="w-10 h-10 md:w-12 md:h-12 text-red-400 mx-auto" />
                        <p className="text-red-200 text-sm md:text-base font-medium">{cameraError}</p>
                        <Button onClick={startCamera} className="bg-primary text-primary-foreground rounded-full px-6">
                          Tentar Ativar Câmera
                        </Button>
                      </div>
                    ) : !stream && activeTab === 'camera' ? (
                      <div className="text-center space-y-4">
                        <Camera className="w-10 h-10 md:w-12 md:h-12 text-primary/40 animate-pulse mx-auto" />
                        <p className="text-muted-foreground text-sm">Iniciando câmera...</p>
                      </div>
                    ) : null}

                    {stream && (
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
                        <Button 
                          size="lg" 
                          onClick={captureImage}
                          className="rounded-full w-14 h-14 md:w-16 md:h-16 p-0 bg-white hover:bg-white/90 text-primary shadow-xl"
                        >
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-4 border-primary/20 flex items-center justify-center">
                            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary" />
                          </div>
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-8 md:mt-12">
                {[
                  { icon: Leaf, title: "Identificação", desc: "Reconhecimento automático de milhares de espécies." },
                  { icon: Droplets, title: "Hidratação", desc: "Saiba exatamente quando e quanto regar." },
                  { icon: AlertTriangle, title: "Saúde", desc: "Detecte pragas e doenças precocemente." }
                ].map((item, i) => (
                  <div key={i} className="p-4 md:p-6 rounded-3xl bg-card/50 border border-primary/10 flex md:flex-col items-center md:text-center gap-4 md:space-y-3 hover:bg-card/80 transition-colors text-left">
                    <div className="p-3 bg-primary/10 rounded-2xl md:bg-transparent md:p-0">
                      <item.icon className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg md:text-xl font-bold text-primary">{item.title}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="analysis"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={reset} className="rounded-full hover:bg-primary/5 text-primary">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Nova Análise
                </Button>
                {isAnalyzing && (
                  <Badge variant="outline" className="animate-pulse bg-primary/5 text-primary border-primary/20">
                    Analisando imagem...
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                {/* Image Preview */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="organic-card aspect-square md:aspect-square relative max-w-md mx-auto lg:max-w-none">
                    <img src={image} alt="Planta capturada" className="w-full h-full object-cover" />
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center">
                        <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  
                  {error && (
                    <Card className="border-destructive/50 bg-destructive/5">
                      <CardContent className="p-4 flex items-start gap-3 text-destructive">
                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-bold">Erro na análise</p>
                          <p className="text-sm opacity-90">{error}</p>
                          <Button variant="link" onClick={() => handleAnalyze(image)} className="p-0 h-auto text-destructive underline">
                            Tentar novamente
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Results */}
                <div className="lg:col-span-7 space-y-6">
                  {!result && isAnalyzing ? (
                    <div className="space-y-6">
                      <Skeleton className="h-12 w-3/4 rounded-xl" />
                      <Skeleton className="h-32 w-full rounded-2xl" />
                      <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-24 rounded-2xl" />
                        <Skeleton className="h-24 rounded-2xl" />
                      </div>
                      <Skeleton className="h-40 w-full rounded-2xl" />
                    </div>
                  ) : result ? (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6"
                    >
                      {/* Species Info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-primary">
                          <Leaf className="w-4 h-4 md:w-5 md:h-5" />
                          <span className="text-[10px] md:text-sm font-medium uppercase tracking-widest">Identificação</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-primary leading-tight">{result.species.commonName}</h2>
                        <p className="text-base sm:text-lg font-display italic text-muted-foreground">{result.species.scientificName}</p>
                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{result.species.description}</p>
                      </div>

                      <Separator className="bg-border/50" />

                      {/* Hydration & Health Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card className="rounded-[1.5rem] border-none bg-secondary/40 shadow-none">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base md:text-lg flex items-center gap-2 text-primary">
                                <Droplets className="w-4 h-4" />
                                Hidratação
                              </CardTitle>
                              <Badge className="bg-primary/10 text-primary border-none text-[10px] md:text-xs">{result.hydration.status}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-xs md:text-sm text-muted-foreground leading-snug">{result.hydration.recommendation}</p>
                          </CardContent>
                        </Card>

                        <Card className={cn(
                          "rounded-[1.5rem] border-none shadow-none",
                          result.diseases.length > 0 ? "bg-red-500/10" : "bg-secondary/40"
                        )}>
                          <CardHeader className="pb-2">
                            <CardTitle className={cn(
                              "text-base md:text-lg flex items-center gap-2",
                              result.diseases.length > 0 ? "text-red-400" : "text-primary"
                            )}>
                              <AlertTriangle className="w-4 h-4" />
                              Saúde Geral
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center gap-2">
                              {result.diseases.length === 0 ? (
                                <div className="flex items-center gap-2 text-green-500">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span className="text-[10px] md:text-sm font-medium uppercase tracking-wider">Planta Saudável</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-red-400 text-xs md:text-sm font-medium">
                                  <AlertTriangle className="w-4 h-4" />
                                  <span>{result.diseases.length} problema(s) encontrado(s)</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Diseases Detail */}
                      {result.diseases.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-primary">
                            <AlertTriangle className="w-5 h-5" />
                            <span className="text-sm font-medium uppercase tracking-widest">Diagnóstico de Doenças</span>
                          </div>
                          <div className="space-y-3">
                            {result.diseases.map((disease, idx) => (
                              <div key={idx} className="p-4 rounded-2xl bg-card border border-red-500/30 space-y-2">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-bold text-red-400">{disease.name}</h4>
                                  <Badge variant={disease.severity === 'high' ? 'destructive' : 'secondary'} className={cn(
                                    "capitalize",
                                    disease.severity === 'high' ? "bg-red-500 text-white" : "bg-red-500/20 text-red-400 border-none"
                                  )}>
                                    {disease.severity}
                                  </Badge>
                                </div>
                                <p className="text-xs text-red-300/70 uppercase tracking-wider font-semibold">{disease.type}</p>
                                <div className="flex items-start gap-2 text-sm bg-red-500/5 p-3 rounded-xl">
                                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-red-400/60" />
                                  <p className="text-red-200/80">{disease.treatment}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* General Care */}
                      <Card className="rounded-[2rem] border-primary/10 bg-primary/5 shadow-none overflow-hidden">
                        <CardHeader className="bg-primary/10 pb-3 md:pb-4">
                          <CardTitle className="text-lg md:text-xl font-display text-primary flex items-center gap-2">
                            <Info className="w-4 h-4 md:w-5 md:h-5" />
                            Dicas de Cultivo
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-3 md:pt-4">
                          <p className="text-primary/80 text-sm md:text-base leading-relaxed italic">
                            "{result.generalCare}"
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ) : null}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <canvas ref={canvasRef} className="hidden" />
      
      {/* Footer */}
      <footer className="mt-12 md:mt-20 py-8 md:py-12 border-t bg-secondary/20">
        <div className="container mx-auto px-4 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-primary/40">
            <Leaf className="w-5 h-5" />
            <span className="font-display font-bold text-lg">Planta Viva</span>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground max-w-md mx-auto">
            Tecnologia a serviço da natureza. Diagnósticos baseados em inteligência artificial para um cultivo mais consciente.
          </p>
          <div className="pt-2 md:pt-4 flex justify-center gap-4 md:gap-6 text-xs md:text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Privacidade</a>
            <a href="#" className="hover:text-primary transition-colors">Termos</a>
            <a href="#" className="hover:text-primary transition-colors">Contato</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
