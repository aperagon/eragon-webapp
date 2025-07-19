/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 * 
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @return {Function} Returns the new debounced function
 */
export function debounce(func, wait) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Creates a function that batches updates and executes them after a delay
 * Useful for preventing multiple rapid API calls
 * 
 * @param {Function} updateFunc - The update function to call
 * @param {number} delay - The delay in milliseconds (default: 500ms)
 * @return {Object} Returns an object with update and flush methods
 */
export function createBatchedUpdater(updateFunc, delay = 500) {
  let pendingUpdate = null;
  let timeoutId = null;
  
  const flush = () => {
    if (pendingUpdate !== null && timeoutId) {
      clearTimeout(timeoutId);
      // If pendingUpdate is a function, call it to get the latest data
      const dataToUpdate = typeof pendingUpdate === 'function' ? pendingUpdate() : pendingUpdate;
      updateFunc(dataToUpdate);
      pendingUpdate = null;
      timeoutId = null;
    }
  };
  
  const update = (data) => {
    // data can be either the actual data or a getter function
    pendingUpdate = data;
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      flush();
    }, delay);
  };
  
  return { update, flush };
}