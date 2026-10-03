/**
 * ============================================================
 * نظام الوضع الليلي - منصتي التعليمية
 * الصف الثاني المتوسط | الفصل الأول | 1448هـ
 * مخصص للطالب: أوس عبد الجبار الأحمدي
 * ============================================================
 * 
 * @description نظام متكامل لتبديل الوضع الليلي/النهاري مع حفظ
 *              التفضيلات ودعم تفضيلات النظام واختصارات لوحة المفاتيح
 * @version 2.0.0
 * @author منصتي التعليمية
 */

(function() {
    'use strict';

    // ============================================================
    // 1. الثوابت والإعدادات (Configuration)
    // ============================================================
    
    const CONFIG = {
        // مفتاح التخزين في localStorage
        STORAGE_KEY: 'theme',
        
        // قيم الوضع
        THEME_DARK: 'dark',
        THEME_LIGHT: 'light',
        
        // سمة البيانات المستخدمة على عنصر body
        DATA_ATTRIBUTE: 'data-theme',
        
        // أسماء العناصر (IDs)
        ICON_ELEMENT_ID: 'themeIcon',
        TEXT_ELEMENT_ID: 'themeText',
        
        // أيقونات Font Awesome
        ICON_MOON: 'fa-moon',
        ICON_SUN: 'fa-sun',
        
        // نصوص الأزرار
        TEXT_DARK_MODE: 'الوضع الليلي',
        TEXT_LIGHT_MODE: 'الوضع النهاري',
        
        // مفتاح الاختصار (Ctrl/Cmd + D)
        SHORTCUT_KEY: 'd',
        
        // مدة الانتقال بالمللي ثانية
        TRANSITION_DURATION: 300,
        
        // تفعيل دعم تفضيلات النظام
        ENABLE_SYSTEM_PREFERENCE: true,
        
        // تفعيل اختصارات لوحة المفاتيح
        ENABLE_KEYBOARD_SHORTCUT: true,
        
        // تفعيل الأحداث المخصصة
        ENABLE_CUSTOM_EVENTS: true,
        
        // تفعيل رسائل console (للتطوير)
        DEBUG_MODE: false
    };

    // ============================================================
    // 2. المتغيرات العامة (State)
    // ============================================================
    
    let currentTheme = CONFIG.THEME_LIGHT;
    let isInitialized = false;

    // ============================================================
    // 3. دوال مساعدة (Helper Functions)
    // ============================================================

    /**
     * تسجيل رسالة في console (فقط في وضع التطوير)
     * @param {string} message - الرسالة
     * @param {string} type - نوع الرسالة (log, warn, error)
     */
    function debugLog(message, type = 'log') {
        if (CONFIG.DEBUG_MODE && console) {
            const prefix = '[DarkMode]';
            switch(type) {
                case 'warn':
                    console.warn(prefix, message);
                    break;
                case 'error':
                    console.error(prefix, message);
                    break;
                default:
                    console.log(prefix, message);
            }
        }
    }

    /**
     * التحقق من توفر localStorage
     * @returns {boolean}
     */
    function isLocalStorageAvailable() {
        try {
            const testKey = '__test_storage__';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * الحصول على تفضيل النظام
     * @returns {string|null} - 'dark' أو 'light' أو null
     */
    function getSystemPreference() {
        if (!CONFIG.ENABLE_SYSTEM_PREFERENCE) return null;
        
        if (window.matchMedia) {
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return CONFIG.THEME_DARK;
            } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
                return CONFIG.THEME_LIGHT;
            }
        }
        return null;
    }

    /**
     * حفظ التفضيل في localStorage
     * @param {string} theme - الوضع المراد حفظه
     */
    function saveTheme(theme) {
        if (isLocalStorageAvailable()) {
            try {
                localStorage.setItem(CONFIG.STORAGE_KEY, theme);
                debugLog(`Theme saved: ${theme}`);
            } catch (e) {
                debugLog('Failed to save theme to localStorage', 'error');
            }
        }
    }

    /**
     * استرجاع التفضيل من localStorage
     * @returns {string|null}
     */
    function loadTheme() {
        if (isLocalStorageAvailable()) {
            try {
                const savedTheme = localStorage.getItem(CONFIG.STORAGE_KEY);
                if (savedTheme === CONFIG.THEME_DARK || savedTheme === CONFIG.THEME_LIGHT) {
                    debugLog(`Theme loaded: ${savedTheme}`);
                    return savedTheme;
                }
            } catch (e) {
                debugLog('Failed to load theme from localStorage', 'error');
            }
        }
        return null;
    }

    /**
     * تحديث أيقونة الزر
     * @param {string} theme - الوضع الحالي
     */
    function updateIcon(theme) {
        const iconElement = document.getElementById(CONFIG.ICON_ELEMENT_ID);
        if (iconElement) {
            if (theme === CONFIG.THEME_DARK) {
                iconElement.classList.remove(CONFIG.ICON_MOON);
                iconElement.classList.add(CONFIG.ICON_SUN);
            } else {
                iconElement.classList.remove(CONFIG.ICON_SUN);
                iconElement.classList.add(CONFIG.ICON_MOON);
            }
        }
    }

    /**
     * تحديث نص الزر
     * @param {string} theme - الوضع الحالي
     */
    function updateText(theme) {
        const textElement = document.getElementById(CONFIG.TEXT_ELEMENT_ID);
        if (textElement) {
            textElement.textContent = theme === CONFIG.THEME_DARK 
                ? CONFIG.TEXT_LIGHT_MODE 
                : CONFIG.TEXT_DARK_MODE;
        }
    }

    /**
     * تحديث جميع الأزرار في الصفحة (يدعم وجود عدة أزرار)
     * @param {string} theme - الوضع الحالي
     */
    function updateAllButtons(theme) {
        const buttons = document.querySelectorAll('.theme-toggle');
        buttons.forEach(button => {
            const icon = button.querySelector(`#${CONFIG.ICON_ELEMENT_ID}`) || 
                         button.querySelector('i');
            const text = button.querySelector(`#${CONFIG.TEXT_ELEMENT_ID}`) || 
                         button.querySelector('span');
            
            if (icon) {
                if (theme === CONFIG.THEME_DARK) {
                    icon.classList.remove(CONFIG.ICON_MOON);
                    icon.classList.add(CONFIG.ICON_SUN);
                } else {
                    icon.classList.remove(CONFIG.ICON_SUN);
                    icon.classList.add(CONFIG.ICON_MOON);
                }
            }
            
            if (text) {
                text.textContent = theme === CONFIG.THEME_DARK 
                    ? CONFIG.TEXT_LIGHT_MODE 
                    : CONFIG.TEXT_DARK_MODE;
            }
        });
    }

    /**
     * إطلاق حدث مخصص
     * @param {string} theme - الوضع الجديد
     */
    function dispatchThemeEvent(theme) {
        if (!CONFIG.ENABLE_CUSTOM_EVENTS) return;
        
        try {
            const event = new CustomEvent('themeChanged', {
                detail: {
                    theme: theme,
                    isDark: theme === CONFIG.THEME_DARK,
                    timestamp: Date.now()
                },
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(event);
            debugLog(`Theme event dispatched: ${theme}`);
        } catch (e) {
            debugLog('Failed to dispatch theme event', 'error');
        }
    }

    // ============================================================
    // 4. الدوال العامة (Public API)
    // ============================================================

    /**
     * تبديل الوضع الليلي/النهاري
     * هذه هي الدالة الرئيسية المستخدمة في جميع الصفحات
     */
    function toggleDarkMode() {
        const body = document.body;
        const newTheme = body.getAttribute(CONFIG.DATA_ATTRIBUTE) === CONFIG.THEME_DARK 
            ? CONFIG.THEME_LIGHT 
            : CONFIG.THEME_DARK;
        
        setDarkMode(newTheme === CONFIG.THEME_DARK);
    }

    /**
     * تعيين الوضع بشكل مباشر
     * @param {boolean} isDark - true للوضع الليلي، false للوضع النهاري
     */
    function setDarkMode(isDark) {
        const body = document.body;
        const newTheme = isDark ? CONFIG.THEME_DARK : CONFIG.THEME_LIGHT;
        
        // تطبيق السمة على body
        if (isDark) {
            body.setAttribute(CONFIG.DATA_ATTRIBUTE, CONFIG.THEME_DARK);
        } else {
            body.removeAttribute(CONFIG.DATA_ATTRIBUTE);
        }
        
        // تحديث الحالة
        currentTheme = newTheme;
        
        // تحديث عناصر الواجهة
        updateIcon(newTheme);
        updateText(newTheme);
        updateAllButtons(newTheme);
        
        // حفظ التفضيل
        saveTheme(newTheme);
        
        // إطلاق الحدث المخصص
        dispatchThemeEvent(newTheme);
        
        debugLog(`Theme set to: ${newTheme}`);
    }

    /**
     * الحصول على الوضع الحالي
     * @returns {boolean} - true إذا كان الوضع ليلي
     */
    function isDarkMode() {
        return currentTheme === CONFIG.THEME_DARK;
    }

    /**
     * الحصول على اسم الوضع الحالي
     * @returns {string} - 'dark' أو 'light'
     */
    function getCurrentTheme() {
        return currentTheme;
    }

    /**
     * تهيئة نظام الوضع الليلي
     * تُستدعى عند تحميل الصفحة
     */
    function initDarkMode() {
        if (isInitialized) {
            debugLog('DarkMode already initialized', 'warn');
            return;
        }
        
        // تحديد الوضع الأولي
        let initialTheme = loadTheme();
        
        // إذا لم يكن هناك تفضيل محفوظ، استخدم تفضيل النظام
        if (!initialTheme && CONFIG.ENABLE_SYSTEM_PREFERENCE) {
            initialTheme = getSystemPreference();
            debugLog(`Using system preference: ${initialTheme}`);
        }
        
        // إذا لم يكن هناك أي تفضيل، استخدم الوضع النهاري افتراضياً
        if (!initialTheme) {
            initialTheme = CONFIG.THEME_LIGHT;
        }
        
        // تطبيق الوضع
        setDarkMode(initialTheme === CONFIG.THEME_DARK);
        
        // الاستماع لتغيرات تفضيل النظام
        if (CONFIG.ENABLE_SYSTEM_PREFERENCE && window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            const handleChange = (e) => {
                // فقط إذا لم يكن لدى المستخدم تفضيل محفوظ
                if (!loadTheme()) {
                    setDarkMode(e.matches);
                    debugLog(`System preference changed: ${e.matches ? 'dark' : 'light'}`);
                }
            };
            
            // دعم المتصفحات الحديثة والقديمة
            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', handleChange);
            } else if (mediaQuery.addListener) {
                mediaQuery.addListener(handleChange);
            }
        }
        
        // تفعيل اختصار لوحة المفاتيح
        if (CONFIG.ENABLE_KEYBOARD_SHORTCUT) {
            document.addEventListener('keydown', handleKeyboardShortcut);
        }
        
        isInitialized = true;
        debugLog('DarkMode initialized successfully');
    }

    /**
     * معالج اختصار لوحة المفاتيح (Ctrl/Cmd + D)
     * @param {KeyboardEvent} event
     */
    function handleKeyboardShortcut(event) {
        // تحقق من ضغط Ctrl (Windows/Linux) أو Cmd (Mac) + D
        if ((event.ctrlKey || event.metaKey) && 
            event.key.toLowerCase() === CONFIG.SHORTCUT_KEY) {
            
            // منع السلوك الافتراضي للمتصفح
            event.preventDefault();
            
            // تبديل الوضع
            toggleDarkMode();
            
            debugLog('Keyboard shortcut triggered');
        }
    }

    /**
     * مسح التفضيلات المحفوظة والعودة للوضع الافتراضي
     */
    function resetTheme() {
        if (isLocalStorageAvailable()) {
            try {
                localStorage.removeItem(CONFIG.STORAGE_KEY);
                debugLog('Theme preferences cleared');
            } catch (e) {
                debugLog('Failed to clear theme preferences', 'error');
            }
        }
        
        // العودة لتفضيل النظام أو الوضع النهاري
        const systemPreference = getSystemPreference();
        setDarkMode(systemPreference === CONFIG.THEME_DARK);
    }

    // ============================================================
    // 5. التهيئة التلقائية (Auto Initialization)
    // ============================================================

    /**
     * تهيئة فورية لتجنب وميض الشاشة (FOUC)
     * تُنفذ قبل تحميل DOM كاملاً
     */
    function applyThemeImmediately() {
    const savedTheme = loadTheme();
    const systemPreference = getSystemPreference();
    const themeToApply = savedTheme || systemPreference || CONFIG.THEME_LIGHT;
    
    if (themeToApply === CONFIG.THEME_DARK) {
        document.body.setAttribute(CONFIG.DATA_ATTRIBUTE, CONFIG.THEME_DARK);
    }
}

    // تطبيق فوري لتجنب الوميض
    applyThemeImmediately();

    // تهيئة كاملة عند تحميل DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDarkMode);
    } else {
        // DOM جاهز بالفعل
        initDarkMode();
    }

    // ============================================================
    // 6. تصدير الدوال العامة (Export Public API)
    // ============================================================

    // جعل الدوال متاحة على نطاق window
    window.DarkMode = {
        toggle: toggleDarkMode,
        set: setDarkMode,
        isDark: isDarkMode,
        getTheme: getCurrentTheme,
        reset: resetTheme,
        init: initDarkMode,
        config: CONFIG
    };

    // جعل الدالة الرئيسية toggleDarkMode متاحة عالمياً
    // (للتوافق مع الملفات السابقة)
    window.toggleDarkMode = toggleDarkMode;

    // ============================================================
    // 7. معلومات الإصدار (Version Info)
    // ============================================================
    
    debugLog('DarkMode System v2.0.0 loaded');
    debugLog('Usage: toggleDarkMode() or DarkMode.toggle()');
    debugLog('Keyboard shortcut: Ctrl/Cmd + D');

})();