/**
 * Service for managing session storage with optional expiration
 */

const SESSION_STORAGE_PREFIX = 'eragon_';
const ENTITY_CACHE_KEY = `${SESSION_STORAGE_PREFIX}entity_data`;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

export const SessionStorageService = {
  /**
   * Get item from session storage with expiration check
   * @param {string} key - The storage key
   * @returns {any} - The stored value or null if expired/not found
   */
  getItem(key) {
    try {
      const item = sessionStorage.getItem(key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      
      // Check if data has expiration and if it's expired
      if (parsed.expires && Date.now() > parsed.expires) {
        sessionStorage.removeItem(key);
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.error('Error reading from session storage:', error);
      return null;
    }
  },

  /**
   * Set item in session storage with optional expiration
   * @param {string} key - The storage key
   * @param {any} data - The data to store
   * @param {number} expiresIn - Optional expiration time in milliseconds
   */
  setItem(key, data, expiresIn = null) {
    try {
      const item = {
        data,
        timestamp: Date.now(),
        expires: expiresIn ? Date.now() + expiresIn : null
      };
      sessionStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.error('Error writing to session storage:', error);
    }
  },

  /**
   * Remove item from session storage
   * @param {string} key - The storage key
   */
  removeItem(key) {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from session storage:', error);
    }
  },

  /**
   * Get cached entity data
   * @returns {object|null} - The cached entity data or null
   */
  getEntityData() {
    return this.getItem(ENTITY_CACHE_KEY);
  },

  /**
   * Set cached entity data with expiration
   * @param {object} data - The entity data to cache
   */
  setEntityData(data) {
    this.setItem(ENTITY_CACHE_KEY, data, CACHE_DURATION);
  },

  /**
   * Clear all entity data from cache
   */
  clearEntityData() {
    this.removeItem(ENTITY_CACHE_KEY);
  },

  /**
   * Check if entity data is cached and valid
   * @returns {boolean} - True if valid cached data exists
   */
  hasValidEntityData() {
    return this.getEntityData() !== null;
  }
};