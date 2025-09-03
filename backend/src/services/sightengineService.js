import axios from 'axios';
import config from '../config/env.js';

class SightengineService {
  constructor() {
    if (!config.features.sightengine) {
      throw new Error('Sightengine is not properly configured. Please check your environment variables.');
    }
    
    this.client = axios.create({
      baseURL: config.sightengine.apiUrl,
      params: {
        api_user: config.sightengine.apiUser,
        api_secret: config.sightengine.apiSecret,
        models: 'face-attributes,face-attributes-quality,face-attributes-liveness'
      }
    });
  }

  /**
   * Check if an image contains deepfake content
   * @param {string} imageUrl - URL of the image to check
   * @returns {Promise<Object>} - Analysis results
   */
  async checkDeepfake(imageUrl) {
    try {
      const response = await this.client.get('', {
        params: {
          url: imageUrl
        }
      });
      
      return {
        isDeepfake: this.#isLikelyDeepfake(response.data),
        analysis: response.data
      };
    } catch (error) {
      console.error('Error checking deepfake:', error);
      throw new Error('Failed to analyze image for deepfake detection');
    }
  }

  /**
   * Determine if the image is likely a deepfake based on analysis
   * @private
   */
  #isLikelyDeepfake(analysis) {
    // Check for face analysis results
    if (!analysis.faces || analysis.faces.length === 0) {
      return false; // No faces detected
    }

    const face = analysis.faces[0];
    
    // Check for common deepfake indicators
    const lowQualityScore = face.quality?.score < 0.5;
    const lowLivenessScore = face.liveness?.score < 0.3;
    const hasSyntheticAttributes = face.attributes?.synthetic > 0.7;
    
    return lowQualityScore || lowLivenessScore || hasSyntheticAttributes;
  }

  /**
   * Check if an image contains NSFW content
   * @param {string} imageUrl - URL of the image to check
   * @returns {Promise<Object>} - NSFW analysis results
   */
  async checkNsfw(imageUrl) {
    try {
      const response = await this.client.get('', {
        params: {
          url: imageUrl,
          models: 'nudity-2.0'
        }
      });
      
      return {
        isNsfw: this.#isNsfwContent(response.data),
        analysis: response.data
      };
    } catch (error) {
      console.error('Error checking NSFW content:', error);
      throw new Error('Failed to analyze image for NSFW content');
    }
  }

  /**
   * Determine if the image contains NSFW content
   * @private
   */
  #isNsfwContent(analysis) {
    const nudity = analysis.nudity;
    if (!nudity) return false;
    
    // Thresholds can be adjusted based on your requirements
    return (
      nudity.erotica > 0.5 ||
      nudity.nonNude.porn > 0.7 ||
      nudity.sexualActivity > 0.5 ||
      nudity.sexualDisplay > 0.5
    );
  }
}

// Export a singleton instance
export default new SightengineService();
