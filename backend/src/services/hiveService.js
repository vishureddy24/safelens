import axios from 'axios';
import config from '../config/env.js';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sightEngineService from './sightengineService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class HiveService {
  constructor() {
    this.apiKey = config.hiveApiKey;
    this.baseUrl = config.hiveApiUrl;
    this.isEnabled = config.features.hiveAi;
    
    if (this.isEnabled) {
      this.client = axios.create({
        baseURL: this.baseUrl,
        headers: {
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
    } else {
      console.warn('⚠️  Hive AI API is not properly configured. Using mock responses.');
    }
  }

  /**
   * Analyze media file (image or video)
   * @param {Buffer} file - File buffer
   * @param {string} fileName - Original file name
   * @returns {Promise<Object>} Analysis results
   */
  /**
   * Save file to temporary storage and get its URL
   * @private
   */
  async #saveTempFile(file, fileName) {
    const tempDir = path.join(__dirname, '../../tmp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempFilePath = path.join(tempDir, `${Date.now()}_${path.basename(fileName)}`);
    fs.writeFileSync(tempFilePath, file);
    return tempFilePath;
  }

  /**
   * Analyze media file (image or video)
   * @param {Buffer} file - File buffer
   * @param {string} fileName - Original file name
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeMedia(file, fileName) {
    if (!file || !fileName) {
      throw new Error('File and fileName are required');
    }

    const fileExt = path.extname(fileName).toLowerCase();
    const isVideo = ['.mp4', '.webm', '.mov', '.avi'].includes(fileExt);
    const isImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(fileExt);

    try {
      if (isVideo) {
        // Use Hive API for video analysis
        return await this.analyzeWithHive(file, fileName);
      } else if (isImage) {
        // Use Sightengine for image analysis
        const tempFilePath = await this.#saveTempFile(file, fileName);
        try {
          const localUrl = `${config.baseUrl || 'http://localhost:3001'}/tmp/${path.basename(tempFilePath)}`;
          
          // Check for both deepfake and NSFW content
          const [deepfakeResult, nsfwResult] = await Promise.all([
            sightEngineService.checkDeepfake(localUrl),
            sightEngineService.checkNsfw(localUrl)
          ]);

          // Clean up temp file
          fs.unlinkSync(tempFilePath);

          // Combine results
          const isSuspicious = deepfakeResult.isDeepfake || nsfwResult.isNsfw;
          const reasons = [];
          
          if (deepfakeResult.isDeepfake) {
            reasons.push('AI detected possible manipulation or deepfake indicators');
          }
          if (nsfwResult.isNsfw) {
            reasons.push('NSFW content detected');
          }
          if (reasons.length === 0) {
            reasons.push('No suspicious content detected');
          }

          return {
            verdict: isSuspicious ? 'suspicious' : 'safe',
            confidence: deepfakeResult.analysis.faces?.[0]?.quality?.score
              ? Math.round(deepfakeResult.analysis.faces[0].quality.score * 100)
              : 80,
            reasons,
            timestamp: new Date().toISOString(),
            analysisType: 'image',
            apiUsed: 'Sightengine',
            fileName,
            raw: {
              deepfake: deepfakeResult.analysis,
              nsfw: nsfwResult.analysis
            }
          };
        } catch (err) {
          // Clean up temp file on error
          if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
          throw err;
        }
      } else {
        throw new Error('Unsupported file type');
      }
    } catch (error) {
      console.error('Analysis Error:', error.message);
      console.warn('Falling back to mock analysis');
      return this.mockAnalysis(file, fileName);
    }
  }

  /**
   * Analyze video using Hive AI API
   * @private
   */
  /**
   * Analyze video using Hive AI API
   * @private
   */
  async analyzeWithHive(file, fileName) {
    if (!this.isEnabled) {
      return this.mockAnalysis(file, fileName);
    }

    const tempFilePath = await this.#saveTempFile(file, fileName);
    
    try {
      const form = new FormData();
      form.append('file', fs.createReadStream(tempFilePath));
      form.append('media_type', 'video');
      form.append('with_face_detection', 'true');
      form.append('with_deepfake_detection', 'true');
      form.append('with_content_moderation', 'true');

      const response = await this.client.post('/analyze', form, {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Token ${this.apiKey}`,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      // Process the response
      const analysis = response.data;
      const isSuspicious = this.#isSuspiciousVideo(analysis);

      return {
        verdict: isSuspicious ? 'suspicious' : 'safe',
        confidence: this.#calculateVideoConfidence(analysis),
        reasons: this.#getSuspiciousVideoReasons(analysis),
        timestamp: new Date().toISOString(),
        analysisType: 'video',
        apiUsed: 'Hive AI',
        fileName,
        raw: analysis
      };
    } catch (error) {
      console.error('Hive API error:', error);
      throw new Error('Failed to analyze video with Hive API');
    } finally {
      // Clean up temp file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  }

  /**
   * Analyze image using Finnhub API
   * @private
   */
  async analyzeWithFinnhub(file, fileName) {
    try {
      // Convert file to base64
      const base64Data = file.toString('base64');
      
      // Call Finnhub API for image analysis
      const response = await axios.post(
        'https://finnhub.io/api/v1/image/analysis',
        {
          image: base64Data,
          model: 'deepfake-detection'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Finnhub-Token': config.finnhubApiKey
          },
          timeout: 30000 // 30 seconds timeout
        }
      );

      // Process the response
      if (response.data && response.data.status === 'success') {
        return this.formatFinnhubResults(response.data, fileName);
      } else {
        throw new Error('Invalid response from Finnhub API');
      }
    } catch (error) {
      console.error('Finnhub API Error:', error.message);
      if (error.response) {
        console.error('API Response:', error.response.data);
        throw new Error(`Finnhub API error: ${error.response.data.error || 'Unknown error'}`);
      } else if (error.request) {
        console.error('No response received from Finnhub API');
        throw new Error('No response from Finnhub API. Please check your connection.');
      } else {
        console.error('Error setting up Finnhub API request:', error.message);
        throw new Error('Failed to process image analysis request');
      }
    }
  }

  /**
   * Get content type based on file extension
   * @private
   */
  /**
   * Check if video analysis indicates suspicious content
   * @private
   */
  #isSuspiciousVideo(analysis) {
    if (!analysis.status || analysis.status[0].type !== 'success') {
      return false;
    }

    // Check for deepfake indicators
    const deepfakeScore = analysis.response?.output?.[0]?.deepfake_detection?.score || 0;
    const faceCount = analysis.response?.output?.[0]?.face_detection?.length || 0;
    
    // Consider video suspicious if deepfake score is above threshold or no faces detected
    return deepfakeScore > 0.7 || faceCount === 0;
  }

  /**
   * Calculate confidence score for video analysis
   * @private
   */
  #calculateVideoConfidence(analysis) {
    if (!analysis.status || analysis.status[0].type !== 'success') {
      return 0;
    }
    
    const deepfakeScore = analysis.response?.output?.[0]?.deepfake_detection?.score || 0;
    // Convert to confidence percentage (higher is more confident in detection)
    return Math.round((1 - Math.abs(0.5 - deepfakeScore)) * 100);
  }

  /**
   * Get reasons for suspicious video content
   * @private
   */
  #getSuspiciousVideoReasons(analysis) {
    const reasons = [];
    
    if (analysis.status?.[0]?.type === 'success') {
      const output = analysis.response?.output?.[0];
      
      if (output?.deepfake_detection?.score > 0.7) {
        reasons.push('High probability of AI-generated or manipulated content');
      }
      
      if (output?.face_detection?.length === 0) {
        reasons.push('No faces detected in the video');
      }
      
      if (output?.content_moderation?.length > 0) {
        reasons.push('Potential inappropriate content detected');
      }
    } else {
      reasons.push('Analysis failed or incomplete');
    }
    
    return reasons.length > 0 ? reasons : ['No suspicious content detected'];
  }

  /**
   * Get content type based on file extension
   * @private
   */
  getContentType(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const types = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo'
    };
    
    return types[ext] || 'application/octet-stream';
  }

  /**
   * Generate mock analysis for development/testing
   * @private
   */
  async mockAnalysis(file, fileName) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get file extension and type
    const fileExt = path.extname(fileName).toLowerCase();
    const isVideo = ['.mp4', '.webm', '.mov', '.avi'].includes(fileExt);
    const isImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(fileExt);
    
    // Analyze file name and content for potential manipulation indicators
    const fileNameLower = fileName.toLowerCase();
    const isSuspiciousName = fileNameLower.includes('deepfake') || 
                            fileNameLower.includes('fake') ||
                            fileNameLower.includes('manipulated') ||
                            fileNameLower.includes('edited') ||
                            fileNameLower.includes('synthetic');
    
    // Analyze file content (simulated)
    let isSuspiciousContent = false;
    
    if (isVideo) {
      // For videos, check for common deepfake artifacts
      const videoAnalysis = this.analyzeVideo(file, fileName);
      isSuspiciousContent = videoAnalysis.isSuspicious;
      
      return {
        verdict: videoAnalysis.verdict,
        confidence: videoAnalysis.confidence,
        reasons: videoAnalysis.reasons,
        timestamp: new Date().toISOString(),
        mock: true,
        fileName,
        fileType: this.getContentType(fileName),
        fileSize: file.length ? (file.length / (1024 * 1024)).toFixed(2) + ' MB' : 'unknown',
        analysisType: 'video',
        metadata: videoAnalysis.metadata
      };
    } else if (isImage) {
      // For images, check for manipulation artifacts
      const imageAnalysis = this.analyzeImage(file, fileName);
      isSuspiciousContent = imageAnalysis.isSuspicious;
      
      return {
        verdict: imageAnalysis.verdict,
        confidence: imageAnalysis.confidence,
        reasons: imageAnalysis.reasons,
        timestamp: new Date().toISOString(),
        mock: true,
        fileName,
        fileType: this.getContentType(fileName),
        fileSize: file.length ? (file.length / (1024 * 1024)).toFixed(2) + ' MB' : 'unknown',
        analysisType: 'image',
        metadata: imageAnalysis.metadata
      };
    }
    
    // Default analysis for other file types
    const isSuspicious = isSuspiciousName || isSuspiciousContent || Math.random() > 0.8;
    
    return {
      verdict: isSuspicious ? 'suspicious' : 'safe',
      confidence: isSuspicious 
        ? Math.floor(Math.random() * 30) + 70 // 70-99% for suspicious
        : Math.floor(Math.random() * 20) + 80, // 80-99% for safe
      reasons: isSuspicious ? [
        'Potential manipulated content detected',
        'Unusual patterns found',
        'Further analysis recommended'
      ] : [
        'No signs of manipulation detected',
        'Content appears to be authentic',
        'No manipulation indicators found'
      ],
      timestamp: new Date().toISOString(),
      mock: true,
      fileName,
      fileType: this.getContentType(fileName),
      fileSize: file.length ? (file.length / (1024 * 1024)).toFixed(2) + ' MB' : 'unknown',
      analysisType: 'generic'
    };
  }
  
  /**
   * Analyze video file for signs of manipulation
   * @private
   */
  analyzeVideo(file, fileName) {
    // Simulate video analysis
    const hasFaceSwapping = fileName.toLowerCase().includes('face') || 
                           fileName.toLowerCase().includes('swap') ||
                           Math.random() > 0.7; // 70% chance of detecting face swap
    
    const hasInconsistentLighting = Math.random() > 0.5;
    const hasUnnaturalMovement = Math.random() > 0.6;
    const hasAudioArtifacts = Math.random() > 0.7;
    
    const isSuspicious = hasFaceSwapping || hasInconsistentLighting || hasUnnaturalMovement;
    
    const reasons = [];
    if (hasFaceSwapping) reasons.push('Potential face swapping detected');
    if (hasInconsistentLighting) reasons.push('Inconsistent lighting across frames');
    if (hasUnnaturalMovement) reasons.push('Unnatural facial or body movements');
    if (hasAudioArtifacts) reasons.push('Audio-visual sync issues detected');
    
    // If no specific issues found but file name suggests manipulation
    if (!isSuspicious && fileName.toLowerCase().match(/(deepfake|fake|manipulated|edited)/)) {
      reasons.push('File name suggests potential manipulation');
    }
    
    const confidence = isSuspicious 
      ? Math.floor(Math.random() * 25) + 70 // 70-95% for suspicious
      : Math.floor(Math.random() * 20) + 80; // 80-99% for safe
    
    return {
      isSuspicious,
      verdict: isSuspicious ? 'suspicious' : 'safe',
      confidence,
      reasons: reasons.length > 0 ? reasons : ['No manipulation indicators found'],
      metadata: {
        hasFaceSwapping,
        hasInconsistentLighting,
        hasUnnaturalMovement,
        hasAudioArtifacts,
        analysisDate: new Date().toISOString()
      }
    };
  }
  
  /**
   * Analyze image file for signs of manipulation
   * @private
   */
  analyzeImage(file, fileName) {
    // Simulate image analysis
    const hasFace = fileName.toLowerCase().includes('face') || Math.random() > 0.3;
    const hasManipulation = fileName.toLowerCase().includes('edited') || 
                           fileName.toLowerCase().includes('manipulated') ||
                           Math.random() > 0.8; // 20% chance of detecting manipulation
    
    const hasCloneStamp = hasManipulation && Math.random() > 0.5;
    const hasSplicing = hasManipulation && Math.random() > 0.5;
    const hasInconsistentShadows = hasManipulation && Math.random() > 0.6;
    
    const isSuspicious = hasManipulation || (hasFace && Math.random() > 0.7);
    
    const reasons = [];
    if (hasCloneStamp) reasons.push('Clone stamp artifacts detected');
    if (hasSplicing) reasons.push('Image splicing detected');
    if (hasInconsistentShadows) reasons.push('Inconsistent shadows/lighting');
    if (hasFace) reasons.push('Facial analysis performed');
    
    // If no specific issues found but file name suggests manipulation
    if (!isSuspicious && fileName.toLowerCase().match(/(deepfake|fake|manipulated|edited)/)) {
      reasons.push('File name suggests potential manipulation');
    }
    
    const confidence = isSuspicious 
      ? Math.floor(Math.random() * 25) + 70 // 70-95% for suspicious
      : Math.floor(Math.random() * 20) + 80; // 80-99% for safe
    
    return {
      isSuspicious,
      verdict: isSuspicious ? 'suspicious' : 'safe',
      confidence,
      reasons: reasons.length > 0 ? reasons : ['No manipulation indicators found'],
      metadata: {
        hasFace,
        hasCloneStamp,
        hasSplicing,
        hasInconsistentShadows,
        analysisDate: new Date().toISOString()
      }
    };
  }

  /**
   * Format Hive AI results into a standardized format
   * @private
   */
  formatHiveResults(data) {
    if (!data || !data.status || data.status.length === 0) {
      return {
        verdict: 'unknown',
        confidence: 0,
        reasons: ['No analysis results available'],
        apiUsed: 'Hive AI',
        raw: data
      };
    }

    const task = data.status[0].response.output[0];
    const deepfakeTask = task.tasks.find(t => t.task_name === 'deepfake_detection');
    
    if (!deepfakeTask) {
      return {
        verdict: 'unknown',
        confidence: 0,
        reasons: ['Deepfake detection not performed'],
        apiUsed: 'Hive AI',
        raw: data
      };
    }

    const predictions = deepfakeTask.predictions || [];
    const isDeepfake = predictions.some(p => p.label === 'deepfake');
    const confidence = isDeepfake 
      ? predictions.find(p => p.label === 'deepfake')?.probability || 0 
      : predictions.find(p => p.label === 'real')?.probability || 0;

    return {
      verdict: isDeepfake ? 'suspicious' : 'safe',
      confidence: Math.round(confidence * 100),
      reasons: isDeepfake ? [
        'AI-generated or manipulated content detected',
        'Facial inconsistencies found',
        'Potential deepfake indicators present'
      ] : [
        'No signs of manipulation detected',
        'Content appears to be authentic',
        'No deepfake indicators found'
      ],
      timestamp: new Date().toISOString(),
      analysisType: 'video',
      apiUsed: 'Hive AI',
      raw: data
    };
  }

  /**
   * Format Finnhub results into a standardized format
   * @private
   */
  formatFinnhubResults(data, fileName) {
    if (!data || data.status !== 'success') {
      return {
        verdict: 'unknown',
        confidence: 0,
        reasons: ['No analysis results available'],
        apiUsed: 'Finnhub',
        raw: data
      };
    }

    const { analysis } = data;
    const isManipulated = analysis.isManipulated;
    const confidence = analysis.confidence || 0;

    return {
      verdict: isManipulated ? 'suspicious' : 'safe',
      confidence: confidence,
      reasons: isManipulated ? [
        'Image manipulation detected',
        analysis.details.manipulationTechniques?.join(', ') || 'Manipulation artifacts found',
        'Potential digital alteration indicators present'
      ] : [
        'No signs of manipulation detected',
        'Image appears to be authentic',
        'No manipulation indicators found'
      ],
      timestamp: new Date().toISOString(),
      analysisType: 'image',
      apiUsed: 'Finnhub',
      fileName,
      metadata: {
        hasFace: analysis.details.hasFace || false,
        manipulationTechniques: analysis.details.manipulationTechniques || [],
        analysisDate: new Date().toISOString()
      },
      raw: data
    };
  }
}

export default new HiveService();
