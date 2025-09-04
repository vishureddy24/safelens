import { useState, useRef, ChangeEvent } from "react";
import { Upload, Video, AlertTriangle, CheckCircle, Clock, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { jsPDF } from "jspdf";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const MediaScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [results, setResults] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const downloadReport = () => {
    if (!results) return;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const lineHeight = 8;
    let yPos = 20;
    
    // Add title
    doc.setFontSize(20);
    doc.text('Media Scan Report', pageWidth / 2, yPos, { align: 'center' });
    yPos += lineHeight * 2;
    
    // Add scan details
    doc.setFontSize(12);
    doc.text(`Scan Date: ${new Date().toLocaleString()}`, margin, yPos);
    yPos += lineHeight;
    doc.text(`File Name: ${selectedFile?.name || 'N/A'}`, margin, yPos);
    yPos += lineHeight;
    doc.text(`File Type: ${selectedFile?.type || 'N/A'}`, margin, yPos);
    yPos += lineHeight * 2;
    
    // Add verdict
    doc.setFontSize(16);
    doc.text('Verdict:', margin, yPos);
    yPos += lineHeight;
    doc.setFontSize(14);
    doc.setTextColor(results.verdict === 'real' ? '#10b981' : '#ef4444');
    doc.text(
      results.verdict === 'real' ? '✅ Authentic Media' : '❌ Potential Deepfake', 
      margin + 10, 
      yPos
    );
    doc.setTextColor('#000000');
    yPos += lineHeight * 1.5;
    
    // Add confidence
    doc.setFontSize(14);
    doc.text(`Confidence: ${results.confidence}%`, margin, yPos);
    yPos += lineHeight * 2;
    
    // Add detection reasons
    doc.setFontSize(14);
    doc.text('Detection Reasons:', margin, yPos);
    yPos += lineHeight * 1.5;
    
    doc.setFontSize(12);
    results.reasons.forEach((reason: string) => {
      if (yPos > 250) { // Add new page if needed
        doc.addPage();
        yPos = 20;
      }
      doc.text(`• ${reason}`, margin + 5, yPos);
      yPos += lineHeight;
    });
    
    // Save the PDF
    doc.save(`media-scan-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isVideo = SUPPORTED_VIDEO_TYPES.includes(file.type);
    const isImage = SUPPORTED_IMAGE_TYPES.includes(file.type);
    
    if (!isVideo && !isImage) {
      toast({
        title: "Unsupported file type",
        description: "Please upload a video (MP4, WebM, MOV) or image (JPEG, PNG, WebP)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Maximum file size is 100MB",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    
    // Auto-start scanning for demo purposes
    handleFileUpload(file);
  };

  const analyzeMedia = async (file: File) => {
    try {
      // Read file as base64
      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve, reject) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Call backend API
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/analyze/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file: fileData,
          fileName: file.name
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Analysis error:', error);
      throw error;
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsScanning(true);
    setScanProgress(0);
    setResults(null);
    
    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 90) { // Stop at 90%, wait for API response
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);
    
    try {
      const analysis = await analyzeMedia(file);
      
      setResults({
        ...analysis,
        timestamp: new Date().toLocaleString(),
        fileName: file.name,
        fileType: file.type,
        fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      });
      
      setScanProgress(100);
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Could not analyze the media file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
      clearInterval(progressInterval);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getVerdictConfig = (verdict: string) => {
    switch (verdict) {
      case "safe":
        return {
          color: "text-success",
          bg: "bg-success/10 border-success/20",
          icon: CheckCircle
        };
      case "suspicious":
        return {
          color: "text-warning",
          bg: "bg-warning/10 border-warning/20",
          icon: AlertTriangle
        };
      case "deepfake":
        return {
          color: "text-destructive",
          bg: "bg-destructive/10 border-destructive/20",
          icon: AlertTriangle
        };
      default:
        return {
          color: "text-muted-foreground",
          bg: "bg-muted",
          icon: Clock
        };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Media Scanner</h2>
          <p className="text-muted-foreground">
            Detect deepfakes and manipulated media using AI analysis
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Media for Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div 
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={triggerFileInput}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('border-primary/50');
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('border-primary/50');
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('border-primary/50');
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  const file = e.dataTransfer.files[0];
                  const event = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
                  handleFileChange(event);
                }
              }}
            >
              {previewUrl ? (
                <div className="relative mb-4">
                  {selectedFile?.type.startsWith('video/') ? (
                    <video 
                      src={previewUrl} 
                      controls 
                      className="max-h-48 mx-auto rounded-lg border"
                    />
                  ) : selectedFile?.type.startsWith('image/') ? (
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="max-h-48 mx-auto rounded-lg border"
                    />
                  ) : null}
                  <div className="absolute top-2 right-2 bg-background/80 rounded-full p-1">
                    {selectedFile?.type.startsWith('video/') ? (
                      <Video className="h-5 w-5" />
                    ) : (
                      <ImageIcon className="h-5 w-5" />
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="mx-auto h-12 w-12 text-muted-foreground mb-4 flex items-center justify-center">
                    <Upload className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Drag & drop your file here</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Supports videos (MP4, WebM, MOV) and images (JPEG, PNG, WebP)
                    <br />
                    Max file size: 100MB
                  </p>
                </>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept={[...SUPPORTED_VIDEO_TYPES, ...SUPPORTED_IMAGE_TYPES].join(',')}
                className="hidden"
              />
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  triggerFileInput();
                }}
                disabled={isScanning}
                className="w-full mt-2"
                type="button"
              >
                {isScanning ? "Scanning..." : selectedFile ? "Change File" : "Choose File"}
              </Button>
            </div>

            {isScanning && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Analyzing video content...</span>
                  <span>{scanProgress}%</span>
                </div>
                <Progress value={scanProgress} className="w-full" />
                <p className="text-xs text-muted-foreground">
                  AI is analyzing facial features, audio patterns, and visual artifacts
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!results ? (
              <div className="text-center py-8 text-muted-foreground">
                <Video className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Upload a video to see analysis results</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const config = getVerdictConfig(results.verdict);
                      const Icon = config.icon;
                      return (
                        <>
                          <Icon className={`h-5 w-5 ${config.color}`} />
                          <span className="font-semibold capitalize">{results.verdict}</span>
                        </>
                      );
                    })()}
                  </div>
                  <Badge 
                    variant="outline" 
                    className={getVerdictConfig(results.verdict).bg}
                  >
                    {results.confidence}% confidence
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Detection Reasons:</h4>
                  <ul className="space-y-1">
                    {results.reasons.map((reason: string, index: number) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-current" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Scanned: {results.timestamp}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={downloadReport}
                    disabled={!results}
                  >
                    Download Report
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Scans */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Media Scans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { 
                name: "promotional_video.mp4", 
                verdict: "deepfake", 
                confidence: 89, 
                time: "5 minutes ago" 
              },
              { 
                name: "ceo_interview.webm", 
                verdict: "safe", 
                confidence: 96, 
                time: "1 hour ago" 
              },
              { 
                name: "testimonial.mov", 
                verdict: "suspicious", 
                confidence: 67, 
                time: "3 hours ago" 
              },
            ].map((scan, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-3">
                  <Video className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{scan.name}</p>
                    <p className="text-xs text-muted-foreground">{scan.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={getVerdictConfig(scan.verdict).bg}
                  >
                    {scan.confidence}%
                  </Badge>
                  <Badge 
                    variant="outline"
                    className={`${getVerdictConfig(scan.verdict).color} capitalize`}
                  >
                    {scan.verdict}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
