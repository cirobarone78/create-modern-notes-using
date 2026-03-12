/**
 * utils.js - Utility Functions
 * Provides debounce, throttle, and other helper functions
 */

// ==========================================
// DEBOUNCE FUNCTION
// ==========================================
/**
 * Debounce function - delays execution until after wait time has elapsed
 * since last invocation. Perfect for auto-save functionality.
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Execute on leading edge
 * @returns {Function} Debounced function
 */
function debounce(func, wait = 300, immediate = false) {
    let timeout;
    
    return function executedFunction(...args) {
        const context = this;
        
        const later = () => {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        
        const callNow = immediate && !timeout;
        
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        
        if (callNow) func.apply(context, args);
    };
}

// ==========================================
// THROTTLE FUNCTION
// ==========================================
/**
 * Throttle function - ensures function is called at most once per specified time period
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit = 300) {
    let inThrottle;
    
    return function executedFunction(...args) {
        const context = this;
        
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => { inThrottle = false; }, limit);
        }
    };
}

// ==========================================
// GENERATE UNIQUE ID
// ==========================================
/**
 * Generates a unique ID using timestamp and random string
 * @returns {string} Unique identifier
 */
function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ==========================================
// SANITIZE TEXT INPUT
// ==========================================
/**
 * Sanitizes text input by removing dangerous characters
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
function sanitizeText(text) {
    if (typeof text !== 'string') return '';
    
    // Remove control characters except newline and tab
    return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

// ==========================================
// TRUNCATE TEXT
// ==========================================
/**
 * Truncates text to specified length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength = 100) {
    if (typeof text !== 'string') return '';
    if (text.length <= maxLength) return text;
    
    return text.substring(0, maxLength).trim() + '...';
}

// ==========================================
// FORMAT FILE SIZE
// ==========================================
/**
 * Formats byte size into human-readable string
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// ==========================================
// DEEP CLONE OBJECT
// ==========================================
/**
 * Creates a deep clone of an object
 * @param {*} obj - Object to clone
 * @returns {*} Cloned object
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    
    try {
        return JSON.parse(JSON.stringify(obj));
    } catch (error) {
        console.error('Deep clone failed:', error);
        return obj;
    }
}

// ==========================================
// CHECK LOCAL STORAGE AVAILABILITY
// ==========================================
/**
 * Checks if localStorage is available and working
 * @returns {boolean} True if localStorage is available
 */
function isLocalStorageAvailable() {
    try {
        const test = '__localStorage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (error) {
        return false;
    }
}

// ==========================================
// GET LOCAL STORAGE SIZE
// ==========================================
/**
 * Calculates approximate size of localStorage usage
 * @returns {number} Size in bytes
 */
function getLocalStorageSize() {
    let total = 0;
    
    try {
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length + key.length;
            }
        }
    } catch (error) {
        console.error('Error calculating localStorage size:', error);
    }
    
    return total;
}

// ==========================================
// DOWNLOAD JSON FILE
// ==========================================
/**
 * Triggers download of JSON data as file
 * @param {*} data - Data to download
 * @param {string} filename - Filename for download
 */
function downloadJSON(data, filename = 'export.json') {
    try {
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        return true;
    } catch (error) {
        console.error('Download failed:', error);
        return false;
    }
}

// ==========================================
// READ JSON FILE
// ==========================================
/**
 * Reads and parses JSON file from input element
 * @param {File} file - File object
 * @returns {Promise<*>} Parsed JSON data
 */
function readJSONFile(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('No file provided'));
            return;
        }
        
        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            reject(new Error('Invalid file type. Please select a JSON file.'));
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                resolve(data);
            } catch (error) {
                reject(new Error('Invalid JSON file'));
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Error reading file'));
        };
        
        reader.readAsText(file);
    });
}

// ==========================================
// ESCAPE HTML
// ==========================================
/**
 * Escapes HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==========================================
// COPY TO CLIPBOARD
// ==========================================
/**
 * Copies text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const success = document.execCommand('copy');
            textArea.remove();
            return success;
        }
    } catch (error) {
        console.error('Copy to clipboard failed:', error);
        return false;
    }
}

// ==========================================
// DATE UTILITIES
// ==========================================
/**
 * Formats date to ISO string
 * @param {Date} date - Date object
 * @returns {string} ISO date string
 */
function toISOString(date = new Date()) {
    return date.toISOString();
}

/**
 * Checks if date is today
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is today
 */
function isToday(date) {
    const d = new Date(date);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
}

/**
 * Checks if date is yesterday
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is yesterday
 */
function isYesterday(date) {
    const d = new Date(date);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return d.getDate() === yesterday.getDate() &&
           d.getMonth() === yesterday.getMonth() &&
           d.getFullYear() === yesterday.getFullYear();
}

// ==========================================
// ARRAY UTILITIES
// ==========================================
/**
 * Sorts array of objects by property
 * @param {Array} array - Array to sort
 * @param {string} property - Property to sort by
 * @param {boolean} ascending - Sort order
 * @returns {Array} Sorted array
 */
function sortByProperty(array, property, ascending = true) {
    return [...array].sort((a, b) => {
        const aVal = a[property];
        const bVal = b[property];
        
        if (aVal < bVal) return ascending ? -1 : 1;
        if (aVal > bVal) return ascending ? 1 : -1;
        return 0;
    });
}

/**
 * Groups array by property
 * @param {Array} array - Array to group
 * @param {string} property - Property to group by
 * @returns {Object} Grouped object
 */
function groupBy(array, property) {
    return array.reduce((acc, obj) => {
        const key = obj[property];
        if (!acc[key]) acc[key] = [];
        acc[key].push(obj);
        return acc;
    }, {});
}

// ==========================================
// KEYBOARD UTILITIES
// ==========================================
/**
 * Checks if key combination matches
 * @param {KeyboardEvent} event - Keyboard event
 * @param {string} key - Key to check
 * @param {Object} modifiers - Modifier keys (ctrl, shift, alt, meta)
 * @returns {boolean} True if matches
 */
function isKeyCombo(event, key, { ctrl = false, shift = false, alt = false, meta = false } = {}) {
    return event.key.toLowerCase() === key.toLowerCase() &&
           event.ctrlKey === ctrl &&
           event.shiftKey === shift &&
           event.altKey === alt &&
           event.metaKey === meta;
}

// ==========================================
// EXPORT UTILITIES
// ==========================================
window.Utils = {
    debounce,
    throttle,
    generateId,
    sanitizeText,
    truncateText,
    formatFileSize,
    deepClone,
    isLocalStorageAvailable,
    getLocalStorageSize,
    downloadJSON,
    readJSONFile,
    escapeHTML,
    copyToClipboard,
    toISOString,
    isToday,
    isYesterday,
    sortByProperty,
    groupBy,
    isKeyCombo
};

// Also export individual functions for tree-shaking
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.Utils;
}