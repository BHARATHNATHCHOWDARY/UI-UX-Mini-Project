// Application State
const appState = {
  currentSystemSize: 1,
  isNavOpen: false,
  isFormSubmitting: false,
  animatedCounters: new Set()
};

// Savings data
const savingsData = {
  1: { production: 1460, savings: 10220, co2: 1350 },
  2: { production: 2920, savings: 20440, co2: 2700 },
  3: { production: 4380, savings: 30660, co2: 4050 }
};

// DOM Elements
const elements = {
  navbar: document.getElementById('navbar'),
  navToggle: document.getElementById('navToggle'),
  navMenu: document.getElementById('navMenu'),
  contactForm: document.getElementById('contactForm'),
  successModal: document.getElementById('successModal'),
  btnLoader: document.getElementById('btnLoader')
};

// Utility Functions
function debounce(func, wait) {
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

function isInViewport(element, threshold = 0.1) {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  
  const vertInView = (rect.top <= windowHeight * (1 - threshold)) && ((rect.top + rect.height) >= (windowHeight * threshold));
  const horInView = (rect.left <= windowWidth * (1 - threshold)) && ((rect.left + rect.width) >= (windowWidth * threshold));
  
  return (vertInView && horInView);
}

function smoothScrollTo(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    const navHeight = elements.navbar.offsetHeight;
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset - navHeight - 20;
    
    window.scrollTo({
      top: elementPosition,
      behavior: 'smooth'
    });
  }
}

function formatNumber(number) {
  return number.toLocaleString('en-IN');
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
  return /^[6-9]\d{9}$/.test(phone.replace(/\D/g, ''));
}

function showError(fieldId, message) {
  const errorElement = document.getElementById(fieldId + 'Error');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
  
  const inputElement = document.getElementById(fieldId);
  if (inputElement) {
    inputElement.style.borderColor = 'var(--color-error)';
  }
}

function clearError(fieldId) {
  const errorElement = document.getElementById(fieldId + 'Error');
  if (errorElement) {
    errorElement.textContent = '';
    errorElement.style.display = 'none';
  }
  
  const inputElement = document.getElementById(fieldId);
  if (inputElement) {
    inputElement.style.borderColor = 'var(--color-border)';
  }
}

// Navigation Functions
function initNavigation() {
  if (elements.navToggle && elements.navMenu) {
    elements.navToggle.addEventListener('click', toggleMobileNav);
  }
  
  // Close mobile nav when clicking nav links
  const navLinks = elements.navMenu.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      smoothScrollTo(targetId);
      //closeMobileNav();
    });
  });
  
  // Handle navbar scroll effect
  window.addEventListener('scroll', debounce(handleNavbarScroll, 10));
}

function toggleMobileNav() {
  appState.isNavOpen = !appState.isNavOpen;
  
  if (appState.isNavOpen) {
    elements.navMenu.style.display = 'flex';
    elements.navToggle.classList.add('active');
    document.body.style.overflow = 'hidden';
  } else {
    closeMobileNav();
  }
}

function closeMobileNav() {
  appState.isNavOpen = false;
  elements.navMenu.style.display = 'none';
  elements.navToggle.classList.remove('active');
  document.body.style.overflow = 'auto';
}

function handleNavbarScroll() {
  const scrolled = window.scrollY > 50;
  if (scrolled) {
    elements.navbar.style.background = 'rgba(255, 255, 255, 0.95)';
    elements.navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
  } else {
    elements.navbar.style.background = 'rgba(255, 255, 255, 0.85)';
    elements.navbar.style.boxShadow = 'none';
  }
}

// Counter Animation
function animateCounter(element, target, duration = 2000, suffix = '') {
  const start = 0;
  const startTime = performance.now();
  
  function updateCounter(currentTime) {
    const elapsedTime = currentTime - startTime;
    const progress = Math.min(elapsedTime / duration, 1);
    const currentValue = Math.floor(progress * target);
    
    element.textContent = formatNumber(currentValue) + suffix;
    
    if (progress < 1) {
      requestAnimationFrame(updateCounter);
    } else {
      element.textContent = formatNumber(target) + suffix;
    }
  }
  
  requestAnimationFrame(updateCounter);
}

function initCounters() {
  const counters = document.querySelectorAll('.credential-number');
  
  const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px 0px -100px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !appState.animatedCounters.has(entry.target)) {
        appState.animatedCounters.add(entry.target);
        const target = parseInt(entry.target.dataset.target);
        let suffix = '';
        
        // Add appropriate suffix based on the value
        if (target >= 1000) {
          suffix = '+';
        }
        
        animateCounter(entry.target, target, 2000, suffix);
      }
    });
  }, observerOptions);
  
  counters.forEach(counter => {
    observer.observe(counter);
  });
}

// Calculator Functions
function initCalculator() {
  const sizeButtons = document.querySelectorAll('.size-btn');
  
  sizeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const size = parseInt(button.dataset.size);
      selectSystemSize(size);
    });
  });
  
  // Initialize with default size
  updateCalculatorResults(appState.currentSystemSize);
}

function selectSystemSize(size) {
  appState.currentSystemSize = size;
  
  // Update button states
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.classList.remove('active');
    if (parseInt(btn.dataset.size) === size) {
      btn.classList.add('active');
    }
  });
  
  // Update results with animation
  updateCalculatorResults(size);
}

function updateCalculatorResults(size) {
  const data = savingsData[size];
  if (!data) return;
  
  const elements = {
    production: document.getElementById('annualProduction'),
    savings: document.getElementById('annualSavings'),
    totalSavings: document.getElementById('totalSavings'),
    co2Savings: document.getElementById('co2Savings')
  };
  
  // Animate value changes
  if (elements.production) {
    animateValue(elements.production, formatNumber(data.production));
  }
  
  if (elements.savings) {
    animateValue(elements.savings, `₹${formatNumber(data.savings)}`);
  }
  
  if (elements.totalSavings) {
    const total = data.savings * 25; // 25 years
    animateValue(elements.totalSavings, `₹${formatNumber(total)}`);
  }
  
  if (elements.co2Savings) {
    animateValue(elements.co2Savings, formatNumber(data.co2));
  }
}

function animateValue(element, newValue) {
  if (!element) return;
  
  element.style.transform = 'scale(1.1)';
  element.style.color = 'var(--color-primary)';
  
  setTimeout(() => {
    element.textContent = newValue;
    element.style.transform = 'scale(1)';
  }, 150);
}

// Form Validation and Submission
function initContactForm() {
  if (!elements.contactForm) return;
  
  const inputs = elements.contactForm.querySelectorAll('input, select, textarea');
  
  // Add real-time validation
  inputs.forEach(input => {
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => {
      if (input.classList.contains('error')) {
        clearError(input.id);
        input.classList.remove('error');
      }
    });
  });
  
  elements.contactForm.addEventListener('submit', handleFormSubmission);
}

function validateField(field) {
  const value = field.value.trim();
  let isValid = true;
  
  clearError(field.id);
  
  switch (field.type || field.tagName.toLowerCase()) {
    case 'text':
      if (field.hasAttribute('required') && !value) {
        showError(field.id, 'This field is required');
        isValid = false;
      } else if (field.id === 'name' && value && value.length < 2) {
        showError(field.id, 'Name must be at least 2 characters');
        isValid = false;
      }
      break;
      
    case 'email':
      if (field.hasAttribute('required') && !value) {
        showError(field.id, 'Email is required');
        isValid = false;
      } else if (value && !validateEmail(value)) {
        showError(field.id, 'Please enter a valid email address');
        isValid = false;
      }
      break;
      
    case 'tel':
      if (field.hasAttribute('required') && !value) {
        showError(field.id, 'Phone number is required');
        isValid = false;
      } else if (value && !validatePhone(value)) {
        showError(field.id, 'Please enter a valid 10-digit phone number');
        isValid = false;
      }
      break;
      
    case 'select':
      if (field.hasAttribute('required') && !value) {
        showError(field.id, 'Please select an option');
        isValid = false;
      }
      break;
  }
  
  if (!isValid) {
    field.classList.add('error');
  }
  
  return isValid;
}

function validateForm(form) {
  const inputs = form.querySelectorAll('input[required], select[required]');
  let isValid = true;
  
  inputs.forEach(input => {
    if (!validateField(input)) {
      isValid = false;
    }
  });
  
  return isValid;
}

function handleFormSubmission(e) {
  e.preventDefault();
  
  if (appState.isFormSubmitting) return;
  
  const form = e.target;
  const submitButton = form.querySelector('button[type="submit"]');
  
  // Validate form
  if (!validateForm(form)) {
    return;
  }
  
  // Set loading state
  appState.isFormSubmitting = true;
  submitButton.classList.add('loading');
  submitButton.disabled = true;
  
  // Simulate form submission (replace with actual API call)
  setTimeout(() => {
    // Reset loading state
    appState.isFormSubmitting = false;
    submitButton.classList.remove('loading');
    submitButton.disabled = false;
    
    // Reset form
    form.reset();
    
    // Clear any errors
    const errorElements = form.querySelectorAll('.form-error');
    errorElements.forEach(error => {
      error.textContent = '';
      error.style.display = 'none';
    });
    
    // Show success modal
    showModal('successModal');
    
    // Track form submission (analytics would go here)
    console.log('Form submitted successfully');
  }, 2000);
}

// Modal Functions
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Focus management for accessibility
    const closeButton = modal.querySelector('.modal-close');
    if (closeButton) {
      closeButton.focus();
    }
  }
}

function closeModal() {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    modal.classList.remove('show');
  });
  document.body.style.overflow = 'auto';
}

function initModals() {
  // Close modal when clicking outside or on close button
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal') || e.target.classList.contains('modal-close')) {
      closeModal();
    }
  });
  
  // Close modal with escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });
}

// Scroll Animations
function initScrollAnimations() {
  const animatedElements = document.querySelectorAll('.credential-card, .feature-card, .benefit-card, .diagram-step');
  
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in', 'visible');
      }
    });
  }, observerOptions);
  
  animatedElements.forEach(element => {
    element.classList.add('fade-in');
    observer.observe(element);
  });
}

// Global Functions (called from HTML)
function scrollToSection(sectionId) {
  smoothScrollTo(sectionId);
}

// Utility function to handle CTA clicks
function handleCTAClick(action) {
  switch (action) {
    case 'quote':
      smoothScrollTo('contact');
      break;
    case 'calculator':
      smoothScrollTo('calculator');
      break;
    case 'phone':
      window.location.href = 'tel:1800-25-77777';
      break;
    default:
      console.log('Unknown CTA action:', action);
  }
}

// Performance Optimization
function initPerformanceOptimizations() {
  // Lazy load images (if any were added later)
  const images = document.querySelectorAll('img[data-src]');
  if (images.length > 0 && 'IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    });
    
    images.forEach(img => {
      imageObserver.observe(img);
    });
  }
  
  // Prefetch critical resources
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // Prefetch any critical resources here
      console.log('Idle time available for prefetching');
    });
  }
}

// Error Handling
function initErrorHandling() {
  window.addEventListener('error', (event) => {
    console.error('JavaScript error:', event.error);
    // In production, you might want to send this to an error tracking service
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // In production, you might want to send this to an error tracking service
  });
}

// Analytics (placeholder for tracking)
function trackEvent(category, action, label) {
  console.log('Track event:', { category, action, label });
  // In production, integrate with Google Analytics, GTM, or other analytics
}

// Accessibility Enhancements
function initAccessibility() {
  // Skip link for keyboard navigation
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.textContent = 'Skip to main content';
  skipLink.className = 'skip-link sr-only';
  skipLink.style.position = 'fixed';
  skipLink.style.top = '10px';
  skipLink.style.left = '10px';
  skipLink.style.zIndex = '9999';
  skipLink.style.background = 'var(--color-primary)';
  skipLink.style.color = 'white';
  skipLink.style.padding = '8px 16px';
  skipLink.style.textDecoration = 'none';
  skipLink.style.borderRadius = '4px';
  
  skipLink.addEventListener('focus', () => {
    skipLink.classList.remove('sr-only');
  });
  
  skipLink.addEventListener('blur', () => {
    skipLink.classList.add('sr-only');
  });
  
  document.body.insertBefore(skipLink, document.body.firstChild);
  
  // Announce page changes for screen readers
  const announcer = document.createElement('div');
  announcer.setAttribute('aria-live', 'polite');
  announcer.setAttribute('aria-atomic', 'true');
  announcer.className = 'sr-only';
  announcer.id = 'announcer';
  document.body.appendChild(announcer);
}

function announceToScreenReader(message) {
  const announcer = document.getElementById('announcer');
  if (announcer) {
    announcer.textContent = message;
  }
}

// Initialize Application
function initApp() {
  try {
    // Core functionality
    initNavigation();
    initCalculator();
    initContactForm();
    initModals();
    initCounters();
    initScrollAnimations();
    
    // Enhancements
    initPerformanceOptimizations();
    initErrorHandling();
    initAccessibility();
    
    // Track page load
    trackEvent('Page', 'Load', 'Homepage');
    
    console.log('Tata Power Solaroof website initialized successfully');
  } catch (error) {
    console.error('Error initializing application:', error);
  }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Service Worker Registration (for PWA capabilities)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('ServiceWorker registration successful');
      })
      .catch((error) => {
        console.log('ServiceWorker registration failed');
      });
  });
}

// Export functions for global access
window.scrollToSection = scrollToSection;
window.handleCTAClick = handleCTAClick;
window.closeModal = closeModal;
window.trackEvent = trackEvent;
