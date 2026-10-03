/**
 * ============================================================
 * نظام البحث الذكي - منصتي التعليمية
 * الصف الثاني المتوسط | الفصل الأول | 1448هـ
 * مخصص للطالب: أوس عبد الجبار الأحمدي
 * ============================================================
 * 
 * @description نظام بحث ذكي ومتقدم يدعم البحث في جميع صفحات الموقع
 *              مع تمييز النتائج واقتراحات تلقائية وسجل بحث
 * @version 2.0.0
 * @author منصتي التعليمية
 */

(function() {
    'use strict';

    // ============================================================
    // 1. الثوابت والإعدادات (Configuration)
    // ============================================================
    
    const CONFIG = {
        // مفاتيح التخزين
        STORAGE_KEYS: {
            SEARCH_HISTORY: 'search_history',
            RECENT_SEARCHES: 'recent_searches'
        },
        
        // إعدادات البحث
        MIN_SEARCH_LENGTH: 2,
        MAX_HISTORY_ITEMS: 10,
        DEBOUNCE_DELAY: 300, // مللي ثانية
        
        // حدود النتائج
        MAX_RESULTS: 20,
        MAX_SUGGESTIONS: 5,
        
        // أسماء العناصر
        SEARCH_INPUT_IDS: ['mainSearch', 'lessonSearch'],
        RESULTS_CONTAINER_IDS: ['searchResults', 'lessonsContainer'],
        
        // فئات CSS
        CLASSES: {
            HIDDEN: 'hidden',
            HIGHLIGHT: 'search-highlight',
            SEARCH_RESULT: 'search-result-item',
            NO_RESULTS: 'no-results-message',
            SUGGESTION: 'search-suggestion'
        },
        
        // محددات العناصر
        SELECTORS: {
            SUBJECT_CARD: '.subject-card',
            LESSON_CARD: '.lesson-card, .question-card',
            QUESTION_CARD: '.question-card',
            QUIZ_OPTION: '.option-text',
            LESSON_TITLE: '.lesson-title, .subject-name, .question-text',
            LESSON_DESC: '.lesson-desc, .subject-desc',
            SECTION_TITLE: '.section-title'
        },
        
        // تفعيل الميزات
        ENABLE_HISTORY: true,
        ENABLE_SUGGESTIONS: true,
        ENABLE_HIGHLIGHTING: true,
        ENABLE_FUZZY_SEARCH: true,
        
        // وضع التطوير
        DEBUG_MODE: false
    };

    // ============================================================
    // 2. قاعدة بيانات البحث (Search Database)
    // ============================================================
    
    const SEARCH_DATABASE = {
        // المواد الدراسية
        subjects: [
            { id: 'arabic', name: 'لغتي الخالدة', nameEn: 'Arabic Language', icon: 'language', url: 'subjects/arabic.html', quizUrl: 'quizzes/arabic-quiz.html', keywords: ['لغة', 'عربية', 'نحو', 'صرف', 'بلاغة', 'قواعد', 'إملاء'] },
            { id: 'math', name: 'الرياضيات', nameEn: 'Mathematics', icon: 'square-root-alt', url: 'subjects/math.html', quizUrl: 'quizzes/math-quiz.html', keywords: ['رياضيات', 'حساب', 'جبر', 'هندسة', 'أعداد', 'كسور', 'نسب'] },
            { id: 'science', name: 'العلوم', nameEn: 'Science', icon: 'flask', url: 'subjects/science.html', quizUrl: 'quizzes/science-quiz.html', keywords: ['علوم', 'فيزياء', 'كيمياء', 'أحياء', 'طاقة', 'مادة', 'جسم'] },
            { id: 'islamic', name: 'الدراسات الإسلامية', nameEn: 'Islamic Studies', icon: 'mosque', url: 'subjects/islamic.html', quizUrl: 'quizzes/islamic-quiz.html', keywords: ['إسلام', 'قرآن', 'حديث', 'توحيد', 'تفسير', 'فقه', 'عبادات'] },
            { id: 'social', name: 'الدراسات الاجتماعية', nameEn: 'Social Studies', icon: 'globe-americas', url: 'subjects/social.html', quizUrl: 'quizzes/social-quiz.html', keywords: ['تاريخ', 'جغرافيا', 'دول', 'حضارات', 'خرائط', 'مناخ'] },
            { id: 'english', name: 'اللغة الإنجليزية', nameEn: 'English Language', icon: 'language', url: 'subjects/english.html', quizUrl: 'quizzes/english-quiz.html', keywords: ['إنجليزي', 'English', 'قواعد', 'مفردات', 'محادثات'] },
            { id: 'chinese', name: 'اللغة الصينية', nameEn: 'Chinese Language', icon: 'yin-yang', url: 'subjects/chinese.html', quizUrl: 'quizzes/chinese-quiz.html', keywords: ['صيني', 'Chinese', 'حروف', 'أرقام', 'ثقافة'] },
            { id: 'digital', name: 'المهارات الرقمية', nameEn: 'Digital Skills', icon: 'laptop-code', url: 'subjects/digital.html', quizUrl: 'quizzes/digital-quiz.html', keywords: ['رقمي', 'بايثون', 'Python', 'قواعد بيانات', 'تصميم', 'برمجة'] },
            { id: 'life', name: 'المهارات الحياتية والأسرية', nameEn: 'Life Skills', icon: 'heart', url: 'subjects/life.html', quizUrl: 'quizzes/life-quiz.html', keywords: ['حياتية', 'أسرية', 'تغذية', 'صحة', 'وجبات'] },
            { id: 'art', name: 'التربية الفنية', nameEn: 'Art Education', icon: 'palette', url: 'subjects/art.html', quizUrl: 'quizzes/art-quiz.html', keywords: ['فن', 'رسم', 'ألوان', 'تصميم', 'إبداع'] },
            { id: 'pe', name: 'التربية البدنية', nameEn: 'Physical Education', icon: 'running', url: 'subjects/pe.html', quizUrl: 'quizzes/pe-quiz.html', keywords: ['رياضة', 'بدنية', 'لياقة', 'دفاع', 'كرة', 'تايكوندو'] }
        ],
        
        // الدروس (يتم تحميلها ديناميكياً)
        lessons: [],
        
        // المواضيع الشائعة
        topics: [
            'المفعول لأجله', 'المفعول فيه', 'الألف اللينة', 'نظرية فيثاغورس',
            'الأعداد النسبية', 'النسبة المئوية', 'الطاقة', 'الحرارة',
            'الجهاز الهضمي', 'الجهاز الدوري', 'الأحماض والقواعد',
            'التوحيد', 'الإخلاص', 'تفسير القرآن', 'الدولة الأموية',
            'الدولة العباسية', 'الغلاف الجوي', 'الطقس والمناخ',
            'البايثون', 'قواعد البيانات', 'التغذية السليمة',
            'نظرية الألوان', 'اللياقة البدنية', 'التايكوندو'
        ]
    };

    // ============================================================
    // 3. المتغيرات العامة (State)
    // ============================================================
    
    let searchIndex = [];
    let currentSearchTerm = '';
    let searchHistory = [];
    let debounceTimer = null;
    let isInitialized = false;

    // ============================================================
    // 4. دوال مساعدة (Helper Functions)
    // ============================================================

    /**
     * تسجيل رسالة في console (فقط في وضع التطوير)
     */
    function debugLog(message, type = 'log') {
        if (CONFIG.DEBUG_MODE && console) {
            const prefix = '[Search]';
            console[type](prefix, message);
        }
    }

    /**
     * إزالة التشكيل من النص العربي
     * @param {string} text - النص المراد معالجته
     * @returns {string} - النص بدون تشكيل
     */
    function removeDiacritics(text) {
        if (!text) return '';
        return text.replace(/[\u0610-\u061A\u064B-\u065F\u0670]/g, '');
    }

    /**
     * تطبيع النص (إزالة المسافات الزائدة وتحويل لحروف صغيرة)
     * @param {string} text - النص المراد معالجته
     * @returns {string} - النص المطبع
     */
    function normalizeText(text) {
        if (!text) return '';
        return removeDiacritics(text)
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * حساب درجة التشابه (Fuzzy Matching)
     * @param {string} str1 - النص الأول
     * @param {string} str2 - النص الثاني
     * @returns {number} - درجة التشابه (0-1)
     */
    function fuzzyMatch(str1, str2) {
        if (!CONFIG.ENABLE_FUZZY_SEARCH) return 0;
        
        str1 = normalizeText(str1);
        str2 = normalizeText(str2);
        
        if (str1 === str2) return 1;
        if (str1.includes(str2) || str2.includes(str1)) return 0.8;
        
        // خوارزمية Levenshtein Distance المبسطة
        const len1 = str1.length;
        const len2 = str2.length;
        const matrix = [];
        
        for (let i = 0; i <= len1; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= len2; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + cost
                );
            }
        }
        
        const distance = matrix[len1][len2];
        const maxLength = Math.max(len1, len2);
        return 1 - (distance / maxLength);
    }

    /**
     * تمييز النص المطابق
     * @param {string} text - النص الأصلي
     * @param {string} searchTerm - مصطلح البحث
     * @returns {string} - النص مع تمييز HTML
     */
    function highlightText(text, searchTerm) {
        if (!CONFIG.ENABLE_HIGHLIGHTING || !searchTerm || !text) return text;
        
        const normalizedText = normalizeText(text);
        const normalizedSearch = normalizeText(searchTerm);
        
        if (!normalizedText.includes(normalizedSearch)) return text;
        
        const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
        return text.replace(regex, `<mark class="${CONFIG.CLASSES.HIGHLIGHT}">$1</mark>`);
    }

    /**
     * هروب الأحرف الخاصة في Regex
     * @param {string} str - النص المراد معالجته
     * @returns {string} - النص المهروب
     */
    function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

    // ============================================================
    // 5. بناء فهرس البحث (Search Index)
    // ============================================================

    /**
     * بناء فهرس البحث من محتوى الصفحة
     */
    function buildSearchIndex() {
        searchIndex = [];
        
        // إضافة المواد الدراسية
        SEARCH_DATABASE.subjects.forEach(subject => {
            searchIndex.push({
                type: 'subject',
                id: subject.id,
                title: subject.name,
                titleEn: subject.nameEn,
                description: '',
                url: subject.url,
                quizUrl: subject.quizUrl,
                keywords: subject.keywords,
                searchText: normalizeText(`${subject.name} ${subject.nameEn} ${subject.keywords.join(' ')}`)
            });
        });
        
        // إضافة الدروس من الصفحة الحالية
        const lessonCards = document.querySelectorAll(CONFIG.SELECTORS.LESSON_CARD);
        lessonCards.forEach((card, index) => {
            const titleEl = card.querySelector(CONFIG.SELECTORS.LESSON_TITLE);
            const descEl = card.querySelector(CONFIG.SELECTORS.LESSON_DESC);
            
            if (titleEl) {
                const title = titleEl.textContent.trim();
                const desc = descEl ? descEl.textContent.trim() : '';
                const lessonData = card.getAttribute('data-title') || title;
                
                searchIndex.push({
                    type: 'lesson',
                    id: `lesson-${index}`,
                    title: title,
                    description: desc,
                    element: card,
                    searchText: normalizeText(`${title} ${desc} ${lessonData}`)
                });
            }
        });
        
        // إضافة المواضيع الشائعة
        SEARCH_DATABASE.topics.forEach(topic => {
            searchIndex.push({
                type: 'topic',
                id: `topic-${topic}`,
                title: topic,
                searchText: normalizeText(topic)
            });
        });
        
        debugLog(`Search index built with ${searchIndex.length} items`);
    }

    // ============================================================
    // 6. دوال البحث (Search Functions)
    // ============================================================

    /**
     * البحث في الفهرس
     * @param {string} searchTerm - مصطلح البحث
     * @returns {Array} - نتائج البحث
     */
    function search(searchTerm) {
        if (!searchTerm || searchTerm.length < CONFIG.MIN_SEARCH_LENGTH) {
            return [];
        }
        
        const normalizedSearch = normalizeText(searchTerm);
        const results = [];
        
        searchIndex.forEach(item => {
            let score = 0;
            let matchType = '';
            
            // بحث مطابق تام
            if (item.searchText === normalizedSearch) {
                score = 100;
                matchType = 'exact';
            }
            // بحث يحتوي على
            else if (item.searchText.includes(normalizedSearch)) {
                score = 80;
                matchType = 'contains';
            }
            // بحث يبدأ بـ
            else if (item.searchText.startsWith(normalizedSearch)) {
                score = 90;
                matchType = 'starts';
            }
            // بحث fuzzy
            else if (CONFIG.ENABLE_FUZZY_SEARCH) {
                const fuzzyScore = fuzzyMatch(item.searchText, normalizedSearch);
                if (fuzzyScore > 0.6) {
                    score = fuzzyScore * 70;
                    matchType = 'fuzzy';
                }
            }
            
            // البحث في الكلمات المفتاحية
            if (item.keywords) {
                item.keywords.forEach(keyword => {
                    if (normalizeText(keyword).includes(normalizedSearch)) {
                        score += 20;
                        matchType = 'keyword';
                    }
                });
            }
            
            if (score > 0) {
                results.push({
                    ...item,
                    score: score,
                    matchType: matchType
                });
            }
        });
        
        // ترتيب النتائج حسب الدرجة
        results.sort((a, b) => b.score - a.score);
        
        // تحديد عدد النتائج
        return results.slice(0, CONFIG.MAX_RESULTS);
    }

    /**
     * الحصول على اقتراحات البحث
     * @param {string} searchTerm - مصطلح البحث
     * @returns {Array} - الاقتراحات
     */
    function getSuggestions(searchTerm) {
        if (!CONFIG.ENABLE_SUGGESTIONS || !searchTerm || searchTerm.length < 1) {
            return [];
        }
        
        const normalizedSearch = normalizeText(searchTerm);
        const suggestions = [];
        
        // اقتراحات من المواضيع الشائعة
        SEARCH_DATABASE.topics.forEach(topic => {
            if (normalizeText(topic).includes(normalizedSearch)) {
                suggestions.push({
                    text: topic,
                    type: 'topic'
                });
            }
        });
        
        // اقتراحات من المواد
        SEARCH_DATABASE.subjects.forEach(subject => {
            if (normalizeText(subject.name).includes(normalizedSearch)) {
                suggestions.push({
                    text: subject.name,
                    type: 'subject'
                });
            }
        });
        
        // اقتراحات من سجل البحث
        searchHistory.forEach(historyItem => {
            if (normalizeText(historyItem).includes(normalizedSearch)) {
                suggestions.push({
                    text: historyItem,
                    type: 'history'
                });
            }
        });
        
        return suggestions.slice(0, CONFIG.MAX_SUGGESTIONS);
    }

    // ============================================================
    // 7. عرض النتائج (Display Results)
    // ============================================================

    /**
     * عرض النتائج في الصفحة
     * @param {Array} results - نتائج البحث
     * @param {string} searchTerm - مصطلح البحث
     */
    function displayResults(results, searchTerm) {
        // إخفاء جميع بطاقات الدروس أولاً
        const allCards = document.querySelectorAll(CONFIG.SELECTORS.LESSON_CARD);
        allCards.forEach(card => card.classList.add(CONFIG.CLASSES.HIDDEN));
        
        // إزالة رسائل "لا توجد نتائج" السابقة
        const existingNoResults = document.querySelector(`.${CONFIG.CLASSES.NO_RESULTS}`);
        if (existingNoResults) {
            existingNoResults.remove();
        }
        
        if (results.length === 0) {
            // عرض رسالة "لا توجد نتائج"
            showNoResultsMessage(searchTerm);
            return;
        }
        
        // عرض النتائج المطابقة
        results.forEach(result => {
            if (result.type === 'lesson' && result.element) {
                result.element.classList.remove(CONFIG.CLASSES.HIDDEN);
                
                // تمييز النص
                if (CONFIG.ENABLE_HIGHLIGHTING) {
                    const titleEl = result.element.querySelector(CONFIG.SELECTORS.LESSON_TITLE);
                    const descEl = result.element.querySelector(CONFIG.SELECTORS.LESSON_DESC);
                    
                    if (titleEl) {
                        titleEl.innerHTML = highlightText(result.title, searchTerm);
                    }
                    if (descEl) {
                        descEl.innerHTML = highlightText(result.description, searchTerm);
                    }
                }
            }
        });
        
        // التمرير إلى أول نتيجة
        const firstResult = document.querySelector(`${CONFIG.SELECTORS.LESSON_CARD}:not(.${CONFIG.CLASSES.HIDDEN})`);
        if (firstResult) {
            firstResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    /**
     * عرض رسالة "لا توجد نتائج"
     * @param {string} searchTerm - مصطلح البحث
     */
    function showNoResultsMessage(searchTerm) {
        const container = document.querySelector('#lessonsContainer') || 
                         document.querySelector('.lessons-grid') ||
                         document.querySelector('.subjects-grid');
        
        if (!container) return;
        
        const noResultsDiv = document.createElement('div');
        noResultsDiv.className = CONFIG.CLASSES.NO_RESULTS;
        noResultsDiv.style.cssText = `
            text-align: center;
            padding: 40px 20px;
            background: var(--card-bg);
            border-radius: 15px;
            border: 2px dashed var(--border-color);
            margin: 20px 0;
        `;
        
        noResultsDiv.innerHTML = `
            <i class="fas fa-search" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 15px;"></i>
            <h3 style="color: var(--text-color); margin-bottom: 10px;">لم يتم العثور على نتائج</h3>
            <p style="color: var(--text-muted);">لا توجد نتائج مطابقة لـ "<strong>${searchTerm}</strong>"</p>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 10px;">
                جرب كلمات بحث مختلفة أو تصفح المواد من القائمة
            </p>
        `;
        
        container.appendChild(noResultsDiv);
    }

    /**
     * عرض اقتراحات البحث
     * @param {Array} suggestions - الاقتراحات
     */
    function displaySuggestions(suggestions) {
        // إزالة الاقتراحات السابقة
        const existingSuggestions = document.querySelectorAll(`.${CONFIG.CLASSES.SUGGESTION}`);
        existingSuggestions.forEach(el => el.remove());
        
        if (suggestions.length === 0) return;
        
        const searchInput = getSearchInput();
        if (!searchInput) return;
        
        // إنشاء حاوية الاقتراحات
        const suggestionsContainer = document.createElement('div');
        suggestionsContainer.className = 'search-suggestions-container';
        suggestionsContainer.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 10px;
            margin-top: 5px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            z-index: 1000;
            max-height: 300px;
            overflow-y: auto;
        `;
        
        suggestions.forEach(suggestion => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = CONFIG.CLASSES.SUGGESTION;
            suggestionItem.style.cssText = `
                padding: 10px 15px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 10px;
                transition: background-color 0.2s;
            `;
            
            let icon = 'fa-search';
            if (suggestion.type === 'history') icon = 'fa-history';
            else if (suggestion.type === 'subject') icon = 'fa-book';
            
            suggestionItem.innerHTML = `
                <i class="fas ${icon}" style="color: var(--primary-color);"></i>
                <span>${suggestion.text}</span>
            `;
            
            suggestionItem.addEventListener('mouseenter', () => {
                suggestionItem.style.backgroundColor = 'var(--bg-color)';
            });
            
            suggestionItem.addEventListener('mouseleave', () => {
                suggestionItem.style.backgroundColor = 'transparent';
            });
            
            suggestionItem.addEventListener('click', () => {
                searchInput.value = suggestion.text;
                performSearch(suggestion.text);
                suggestionsContainer.remove();
            });
            
            suggestionsContainer.appendChild(suggestionItem);
        });
        
        // إضافة الحاوية إلى DOM
        const searchBox = searchInput.closest('.search-box');
        if (searchBox) {
            searchBox.style.position = 'relative';
            searchBox.appendChild(suggestionsContainer);
        }
    }

    // ============================================================
    // 8. سجل البحث (Search History)
    // ============================================================

    /**
     * إضافة بحث إلى السجل
     * @param {string} searchTerm - مصطلح البحث
     */
    function addToHistory(searchTerm) {
        if (!CONFIG.ENABLE_HISTORY || !isLocalStorageAvailable()) return;
        
        try {
            // إزالة التكرارات
            searchHistory = searchHistory.filter(item => item !== searchTerm);
            
            // إضافة في البداية
            searchHistory.unshift(searchTerm);
            
            // تحديد الحد الأقصى
            if (searchHistory.length > CONFIG.MAX_HISTORY_ITEMS) {
                searchHistory = searchHistory.slice(0, CONFIG.MAX_HISTORY_ITEMS);
            }
            
            // حفظ في localStorage
            localStorage.setItem(CONFIG.STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(searchHistory));
            
            debugLog(`Search added to history: ${searchTerm}`);
        } catch (e) {
            debugLog('Failed to save search history', 'error');
        }
    }

    /**
     * تحميل سجل البحث
     */
    function loadHistory() {
        if (!CONFIG.ENABLE_HISTORY || !isLocalStorageAvailable()) return;
        
        try {
            const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.SEARCH_HISTORY);
            if (saved) {
                searchHistory = JSON.parse(saved);
                debugLog(`Search history loaded: ${searchHistory.length} items`);
            }
        } catch (e) {
            debugLog('Failed to load search history', 'error');
        }
    }

    /**
     * مسح سجل البحث
     */
    function clearHistory() {
        if (!isLocalStorageAvailable()) return;
        
        try {
            localStorage.removeItem(CONFIG.STORAGE_KEYS.SEARCH_HISTORY);
            searchHistory = [];
            debugLog('Search history cleared');
        } catch (e) {
            debugLog('Failed to clear search history', 'error');
        }
    }

    // ============================================================
    // 9. الدوال العامة (Public API)
    // ============================================================

    /**
     * الحصول على عنصر البحث
     * @returns {HTMLElement|null}
     */
    function getSearchInput() {
        for (const id of CONFIG.SEARCH_INPUT_IDS) {
            const input = document.getElementById(id);
            if (input) return input;
        }
        return null;
    }

    /**
     * تنفيذ البحث
     * @param {string} searchTerm - مصطلح البحث
     */
    function performSearch(searchTerm) {
        currentSearchTerm = searchTerm;
        
        if (!searchTerm || searchTerm.length < CONFIG.MIN_SEARCH_LENGTH) {
            // إعادة عرض جميع العناصر
            const allCards = document.querySelectorAll(CONFIG.SELECTORS.LESSON_CARD);
            allCards.forEach(card => card.classList.remove(CONFIG.CLASSES.HIDDEN));
            
            // إزالة رسائل "لا توجد نتائج"
            const noResults = document.querySelector(`.${CONFIG.CLASSES.NO_RESULTS}`);
            if (noResults) noResults.remove();
            
            return;
        }
        
        // البحث
        const results = search(searchTerm);
        
        // عرض النتائج
        displayResults(results, searchTerm);
        
        // إضافة إلى السجل
        addToHistory(searchTerm);
        
        // إطلاق حدث مخصص
        document.dispatchEvent(new CustomEvent('searchPerformed', {
            detail: {
                searchTerm: searchTerm,
                resultsCount: results.length,
                timestamp: Date.now()
            }
        }));
        
        debugLog(`Search performed: "${searchTerm}" - ${results.length} results`);
    }

    /**
     * معالج إدخال البحث (مع Debounce)
     * @param {Event} event - حدث الإدخال
     */
    function handleSearchInput(event) {
        const searchTerm = event.target.value.trim();
        
        // إلغاء المؤقت السابق
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        
        // عرض الاقتراحات فوراً
        if (CONFIG.ENABLE_SUGGESTIONS && searchTerm.length >= 1) {
            const suggestions = getSuggestions(searchTerm);
            displaySuggestions(suggestions);
        } else {
            const existingSuggestions = document.querySelectorAll(`.${CONFIG.CLASSES.SUGGESTION}`);
            existingSuggestions.forEach(el => el.remove());
        }
        
        // تأخير تنفيذ البحث
        debounceTimer = setTimeout(() => {
            performSearch(searchTerm);
        }, CONFIG.DEBOUNCE_DELAY);
    }

    /**
     * معالج الضغط على Escape (لإخفاء الاقتراحات)
     * @param {KeyboardEvent} event
     */
    function handleEscapeKey(event) {
        if (event.key === 'Escape') {
            const suggestions = document.querySelectorAll(`.${CONFIG.CLASSES.SUGGESTION}`);
            suggestions.forEach(el => el.remove());
        }
    }

    /**
     * معالج النقر خارج مربع البحث (لإخفاء الاقتراحات)
     * @param {MouseEvent} event
     */
    function handleOutsideClick(event) {
        const searchBox = event.target.closest('.search-box');
        if (!searchBox) {
            const suggestions = document.querySelectorAll(`.${CONFIG.CLASSES.SUGGESTION}`);
            suggestions.forEach(el => el.remove());
        }
    }

    /**
     * تهيئة نظام البحث
     */
    function initSearch() {
        if (isInitialized) {
            debugLog('Search already initialized', 'warn');
            return;
        }
        
        // تحميل السجل
        loadHistory();
        
        // بناء فهرس البحث
        buildSearchIndex();
        
        // إضافة مستمعي الأحداث
        const searchInput = getSearchInput();
        if (searchInput) {
            searchInput.addEventListener('input', handleSearchInput);
            searchInput.addEventListener('keydown', handleEscapeKey);
            
            debugLog('Search input found and initialized');
        } else {
            debugLog('No search input found on this page', 'warn');
        }
        
        // إغلاق الاقتراحات عند النقر خارجها
        document.addEventListener('click', handleOutsideClick);
        
        isInitialized = true;
        debugLog('Search system initialized successfully');
    }

    /**
     * إعادة تعيين البحث
     */
    function resetSearch() {
        const searchInput = getSearchInput();
        if (searchInput) {
            searchInput.value = '';
        }
        
        // إعادة عرض جميع العناصر
        const allCards = document.querySelectorAll(CONFIG.SELECTORS.LESSON_CARD);
        allCards.forEach(card => card.classList.remove(CONFIG.CLASSES.HIDDEN));
        
        // إزالة رسائل "لا توجد نتائج"
        const noResults = document.querySelector(`.${CONFIG.CLASSES.NO_RESULTS}`);
        if (noResults) noResults.remove();
        
        // إزالة الاقتراحات
        const suggestions = document.querySelectorAll(`.${CONFIG.CLASSES.SUGGESTION}`);
        suggestions.forEach(el => el.remove());
        
        currentSearchTerm = '';
        debugLog('Search reset');
    }

    /**
     * الحصول على إحصائيات البحث
     * @returns {Object}
     */
    function getSearchStats() {
        return {
            indexSize: searchIndex.length,
            historySize: searchHistory.length,
            currentTerm: currentSearchTerm,
            subjectsCount: SEARCH_DATABASE.subjects.length,
            topicsCount: SEARCH_DATABASE.topics.length
        };
    }

    // ============================================================
    // 10. التهيئة التلقائية (Auto Initialization)
    // ============================================================

    // تهيئة عند تحميل DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSearch);
    } else {
        initSearch();
    }

    // ============================================================
    // 11. تصدير الدوال العامة (Export Public API)
    // ============================================================

    window.SearchSystem = {
        search: search,
        performSearch: performSearch,
        reset: resetSearch,
        getStats: getSearchStats,
        clearHistory: clearHistory,
        getSuggestions: getSuggestions,
        init: initSearch,
        config: CONFIG
    };

    // جعل الدالة الرئيسية متاحة عالمياً (للتوافق مع الملفات السابقة)
    window.searchLessons = function() {
        const searchInput = getSearchInput();
        if (searchInput) {
            performSearch(searchInput.value.trim());
        }
    };

    // ============================================================
    // 12. معلومات الإصدار (Version Info)
    // ============================================================
    
    debugLog('Search System v2.0.0 loaded');
    debugLog('Usage: SearchSystem.search("term") or searchLessons()');

})();