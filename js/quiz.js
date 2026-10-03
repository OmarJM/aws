/**
 * ============================================================
 * نظام الاختبارات الإلكترونية - منصتي التعليمية
 * الصف الثاني المتوسط | الفصل الأول | 1448هـ
 * مخصص للطالب: أوس عبد الجبار الأحمدي
 * ============================================================
 * 
 * @description نظام متكامل لإدارة الاختبارات الإلكترونية مع
 *              تصحيح تلقائي وحفظ إحصائيات وعرض نتائج تفصيلية
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
            BEST_SCORE: '_best_score',
            ATTEMPTS: '_attempts',
            LAST_RESULT: '_last_result',
            QUIZ_HISTORY: '_quiz_history'
        },
        
        // حدود النتائج
        MAX_HISTORY_ITEMS: 20,
        
        // أسماء العناصر
        ELEMENT_IDS: {
            WELCOME_SCREEN: 'welcomeScreen',
            QUIZ_CONTAINER: 'quizContainer',
            RESULTS_PANEL: 'resultsPanel',
            QUESTIONS_AREA: 'questionsArea',
            PROGRESS_TEXT: 'progressText',
            PROGRESS_FILL: 'progressFill',
            SCORE_CIRCLE: 'scoreCircle',
            SCORE_NUMBER: 'scoreNumber',
            SCORE_LABEL: 'scoreLabel',
            RESULT_MESSAGE: 'resultMessage',
            RESULT_DESCRIPTION: 'resultDescription',
            CORRECT_COUNT: 'correctCount',
            WRONG_COUNT: 'wrongCount',
            SKIPPED_COUNT: 'skippedCount',
            TOTAL_QUESTIONS: 'totalQuestions',
            TOTAL_LESSONS: 'totalLessons',
            BEST_SCORE: 'bestScore',
            ATTEMPTS_COUNT: 'attemptsCount'
        },
        
        // فئات CSS
        CLASSES: {
            ACTIVE: 'active',
            CORRECT: 'correct',
            WRONG: 'wrong',
            EXCELLENT: 'excellent',
            GOOD: 'good',
            POOR: 'poor'
        },
        
        // عتبات الأداء
        THRESHOLDS: {
            EXCELLENT: 90,
            GOOD: 70,
            ACCEPTABLE: 50
        },
        
        // تفعيل الميزات
        ENABLE_HISTORY: true,
        ENABLE_SAVE_STATS: true,
        ENABLE_CUSTOM_EVENTS: true,
        ENABLE_SOUND_EFFECTS: false,
        
        // وضع التطوير
        DEBUG_MODE: false
    };

    // ============================================================
    // 2. المتغيرات العامة (State)
    // ============================================================
    
    let currentQuestions = [];
    let userAnswers = {};
    let quizSubmitted = false;
    let currentSubject = '';
    let isInitialized = false;

    // ============================================================
    // 3. دوال مساعدة (Helper Functions)
    // ============================================================

    /**
     * تسجيل رسالة في console (فقط في وضع التطوير)
     */
    function debugLog(message, type = 'log') {
        if (CONFIG.DEBUG_MODE && console) {
            const prefix = '[Quiz]';
            console[type](prefix, message);
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
     * الحصول على مفتاح التخزين للمادة الحالية
     * @param {string} type - نوع البيانات (best_score, attempts, etc.)
     * @returns {string}
     */
    function getStorageKey(type) {
        if (!currentSubject) {
            debugLog('No subject set for storage key', 'warn');
            return type;
        }
        return `${currentSubject}${CONFIG.STORAGE_KEYS[type]}`;
    }

    /**
     * الحصول على عنصر من DOM
     * @param {string} id - معرف العنصر
     * @returns {HTMLElement|null}
     */
    function getElement(id) {
        return document.getElementById(id);
    }

    /**
     * حساب النسبة المئوية
     * @param {number} value - القيمة
     * @param {number} total - الإجمالي
     * @returns {number}
     */
    function calculatePercentage(value, total) {
        if (total === 0) return 0;
        return Math.round((value / total) * 100);
    }

    // ============================================================
    // 4. نظام حفظ الإحصائيات (Statistics System)
    // ============================================================

    /**
     * حفظ أفضل نتيجة
     * @param {number} percentage - النسبة المئوية
     */
    function saveBestScore(percentage) {
        if (!CONFIG.ENABLE_SAVE_STATS || !isLocalStorageAvailable()) return;
        
        try {
            const key = getStorageKey('BEST_SCORE');
            const currentBest = parseInt(localStorage.getItem(key) || '0');
            
            if (percentage > currentBest) {
                localStorage.setItem(key, percentage.toString());
                debugLog(`New best score saved: ${percentage}%`);
            }
        } catch (e) {
            debugLog('Failed to save best score', 'error');
        }
    }

    /**
     * حفظ عدد المحاولات
     */
    function saveAttempt() {
        if (!CONFIG.ENABLE_SAVE_STATS || !isLocalStorageAvailable()) return;
        
        try {
            const key = getStorageKey('ATTEMPTS');
            const attempts = parseInt(localStorage.getItem(key) || '0');
            localStorage.setItem(key, (attempts + 1).toString());
            debugLog(`Attempt saved. Total: ${attempts + 1}`);
        } catch (e) {
            debugLog('Failed to save attempt', 'error');
        }
    }

    /**
     * حفظ نتيجة الاختبار في السجل
     * @param {Object} result - نتيجة الاختبار
     */
    function saveToHistory(result) {
        if (!CONFIG.ENABLE_HISTORY || !isLocalStorageAvailable()) return;
        
        try {
            const key = getStorageKey('QUIZ_HISTORY');
            let history = [];
            
            const saved = localStorage.getItem(key);
            if (saved) {
                history = JSON.parse(saved);
            }
            
            // إضافة النتيجة الجديدة
            history.unshift({
                ...result,
                timestamp: Date.now()
            });
            
            // تحديد الحد الأقصى
            if (history.length > CONFIG.MAX_HISTORY_ITEMS) {
                history = history.slice(0, CONFIG.MAX_HISTORY_ITEMS);
            }
            
            localStorage.setItem(key, JSON.stringify(history));
            debugLog('Result saved to history');
        } catch (e) {
            debugLog('Failed to save to history', 'error');
        }
    }

    /**
     * تحميل الإحصائيات
     * @returns {Object}
     */
    function loadStats() {
        if (!isLocalStorageAvailable()) {
            return { bestScore: 0, attempts: 0 };
        }
        
        try {
            const bestScoreKey = getStorageKey('BEST_SCORE');
            const attemptsKey = getStorageKey('ATTEMPTS');
            
            return {
                bestScore: parseInt(localStorage.getItem(bestScoreKey) || '0'),
                attempts: parseInt(localStorage.getItem(attemptsKey) || '0')
            };
        } catch (e) {
            debugLog('Failed to load stats', 'error');
            return { bestScore: 0, attempts: 0 };
        }
    }

    /**
     * تحديث عرض الإحصائيات في الصفحة
     */
    function updateStatsDisplay() {
        const stats = loadStats();
        
        const bestScoreEl = getElement(CONFIG.ELEMENT_IDS.BEST_SCORE);
        const attemptsEl = getElement(CONFIG.ELEMENT_IDS.ATTEMPTS_COUNT);
        
        if (bestScoreEl) {
            bestScoreEl.textContent = stats.bestScore > 0 ? `${stats.bestScore}%` : '-';
        }
        
        if (attemptsEl) {
            attemptsEl.textContent = stats.attempts;
        }
        
        debugLog(`Stats displayed: Best ${stats.bestScore}%, Attempts ${stats.attempts}`);
    }

    /**
     * مسح الإحصائيات
     */
    function clearStats() {
        if (!isLocalStorageAvailable()) return;
        
        try {
            const bestScoreKey = getStorageKey('BEST_SCORE');
            const attemptsKey = getStorageKey('ATTEMPTS');
            const historyKey = getStorageKey('QUIZ_HISTORY');
            
            localStorage.removeItem(bestScoreKey);
            localStorage.removeItem(attemptsKey);
            localStorage.removeItem(historyKey);
            
            updateStatsDisplay();
            debugLog('Stats cleared');
        } catch (e) {
            debugLog('Failed to clear stats', 'error');
        }
    }

    // ============================================================
    // 5. نظام عرض الأسئلة (Question Display System)
    // ============================================================

    /**
     * عرض الأسئلة في الصفحة
     * @param {Array} questions - مصفوفة الأسئلة
     */
    function renderQuestions(questions) {
        const area = getElement(CONFIG.ELEMENT_IDS.QUESTIONS_AREA);
        if (!area) {
            debugLog('Questions area not found', 'error');
            return;
        }
        
        area.innerHTML = '';
        
        questions.forEach((q, index) => {
            const questionCard = document.createElement('div');
            questionCard.className = 'question-card';
            questionCard.id = `question-${index}`;
            
            let optionsHTML = '';
            q.options.forEach((opt, optIndex) => {
                optionsHTML += `
                    <label class="option-label" id="option-${index}-${optIndex}">
                        <input type="radio" name="q${index}" value="${optIndex}" 
                               onchange="QuizSystem.saveAnswer(${index}, ${optIndex})">
                        <span class="option-text">${opt}</span>
                    </label>
                `;
            });
            
            questionCard.innerHTML = `
                <div>
                    <span class="question-number">السؤال ${index + 1}</span>
                    <span class="question-lesson">${q.lesson}</span>
                </div>
                <div class="question-text">${q.question}</div>
                <div class="options-list">
                    ${optionsHTML}
                </div>
            `;
            
            area.appendChild(questionCard);
        });
        
        updateProgress();
        debugLog(`Rendered ${questions.length} questions`);
    }

    /**
     * تحديث شريط التقدم
     */
    function updateProgress() {
        const answered = Object.keys(userAnswers).length;
        const total = currentQuestions.length;
        const percentage = calculatePercentage(answered, total);
        
        const progressText = getElement(CONFIG.ELEMENT_IDS.PROGRESS_TEXT);
        const progressFill = getElement(CONFIG.ELEMENT_IDS.PROGRESS_FILL);
        
        if (progressText) {
            progressText.textContent = `تم الإجابة على ${answered} من ${total}`;
        }
        
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }
    }

    // ============================================================
    // 6. نظام التصحيح التلقائي (Auto-Correction System)
    // ============================================================

    /**
     * تصحيح الاختبار
     * @returns {Object} - نتائج التصحيح
     */
    function submitQuiz() {
        if (quizSubmitted) {
            debugLog('Quiz already submitted', 'warn');
            return null;
        }
        
        const answered = Object.keys(userAnswers).length;
        const total = currentQuestions.length;
        
        // تأكيد التسليم إذا لم يتم الإجابة على جميع الأسئلة
        if (answered < total) {
            const confirmed = confirm(`لم تجب على ${total - answered} سؤال بعد. هل تريد التسليم الآن؟`);
            if (!confirmed) return null;
        }
        
        quizSubmitted = true;
        
        let correct = 0;
        let wrong = 0;
        let skipped = 0;
        
        // تصحيح كل سؤال
        currentQuestions.forEach((q, index) => {
            const userAnswer = userAnswers[index];
            
            if (userAnswer === undefined) {
                skipped++;
            } else if (userAnswer === q.correct) {
                correct++;
            } else {
                wrong++;
            }
            
            // تلوين الإجابات
            q.options.forEach((opt, optIndex) => {
                const label = document.getElementById(`option-${index}-${optIndex}`);
                if (!label) return;
                
                if (optIndex === q.correct) {
                    label.classList.add(CONFIG.CLASSES.CORRECT);
                } else if (userAnswer === optIndex && optIndex !== q.correct) {
                    label.classList.add(CONFIG.CLASSES.WRONG);
                }
                
                // تعطيل الراديوات
                const radio = label.querySelector('input');
                if (radio) radio.disabled = true;
            });
        });
        
        const percentage = calculatePercentage(correct, total);
        
        const results = {
            correct,
            wrong,
            skipped,
            total,
            percentage,
            timestamp: Date.now()
        };
        
        // حفظ الإحصائيات
        saveBestScore(percentage);
        saveAttempt();
        saveToHistory(results);
        
        // عرض النتائج
        showResults(results);
        
        // تحديث عرض الإحصائيات
        updateStatsDisplay();
        
        // إطلاق حدث مخصص
        if (CONFIG.ENABLE_CUSTOM_EVENTS) {
            document.dispatchEvent(new CustomEvent('quizSubmitted', {
                detail: results
            }));
        }
        
        debugLog(`Quiz submitted: ${correct}/${total} correct (${percentage}%)`);
        
        return results;
    }

    // ============================================================
    // 7. نظام عرض النتائج (Results Display System)
    // ============================================================

    /**
     * عرض نتائج الاختبار
     * @param {Object} results - نتائج الاختبار
     */
    function showResults(results) {
        const { correct, wrong, skipped, total, percentage } = results;
        
        // إخفاء منطقة الأسئلة وإظهار النتائج
        const quizContainer = getElement(CONFIG.ELEMENT_IDS.QUIZ_CONTAINER);
        const resultsPanel = getElement(CONFIG.ELEMENT_IDS.RESULTS_PANEL);
        
        if (quizContainer) quizContainer.classList.remove(CONFIG.CLASSES.ACTIVE);
        if (resultsPanel) resultsPanel.classList.add(CONFIG.CLASSES.ACTIVE);
        
        // تحديث الأرقام
        const correctEl = getElement(CONFIG.ELEMENT_IDS.CORRECT_COUNT);
        const wrongEl = getElement(CONFIG.ELEMENT_IDS.WRONG_COUNT);
        const skippedEl = getElement(CONFIG.ELEMENT_IDS.SKIPPED_COUNT);
        const scoreNumberEl = getElement(CONFIG.ELEMENT_IDS.SCORE_NUMBER);
        
        if (correctEl) correctEl.textContent = correct;
        if (wrongEl) wrongEl.textContent = wrong;
        if (skippedEl) skippedEl.textContent = skipped;
        if (scoreNumberEl) scoreNumberEl.textContent = `${percentage}%`;
        
        // تحديد فئة الأداء
        const scoreCircle = getElement(CONFIG.ELEMENT_IDS.SCORE_CIRCLE);
        if (scoreCircle) {
            scoreCircle.classList.remove(
                CONFIG.CLASSES.EXCELLENT,
                CONFIG.CLASSES.GOOD,
                CONFIG.CLASSES.POOR
            );
            
            if (percentage >= CONFIG.THRESHOLDS.EXCELLENT) {
                scoreCircle.classList.add(CONFIG.CLASSES.EXCELLENT);
            } else if (percentage >= CONFIG.THRESHOLDS.GOOD) {
                scoreCircle.classList.add(CONFIG.CLASSES.GOOD);
            } else {
                scoreCircle.classList.add(CONFIG.CLASSES.POOR);
            }
        }
        
        // عرض الرسالة التحفيزية
        const { message, description } = getMotivationalMessage(percentage);
        
        const messageEl = getElement(CONFIG.ELEMENT_IDS.RESULT_MESSAGE);
        const descEl = getElement(CONFIG.ELEMENT_IDS.RESULT_DESCRIPTION);
        
        if (messageEl) messageEl.textContent = message;
        if (descEl) descEl.textContent = description;
        
        // التمرير إلى النتائج
        if (resultsPanel) {
            resultsPanel.scrollIntoView({ behavior: 'smooth' });
        }
        
        debugLog(`Results displayed: ${percentage}%`);
    }

    /**
     * الحصول على رسالة تحفيزية حسب النسبة
     * @param {number} percentage - النسبة المئوية
     * @returns {Object}
     */
    function getMotivationalMessage(percentage) {
        const messages = {
            excellent: {
                message: '🏆 ممتاز! أداء استثنائي',
                description: 'أنت متمكن من المادة بشكل ممتاز، استمر في هذا المستوى الرائع!'
            },
            good: {
                message: '👍 جيد جداً! أداء متميز',
                description: 'أداؤك رائع، راجع بعض النقاط البسيطة لتصل للامتياز!'
            },
            acceptable: {
                message: '📚 مقبول - يمكنك التحسن',
                description: 'تحتاج لمزيد من المراجعة والتركيز على الدروس الضعيفة.'
            },
            poor: {
                message: '💪 لا تيأس! واصل التعلم',
                description: 'راجع الدروس مرة أخرى وحاول مجدداً. الممارسة تصنع المعجزات!'
            }
        };
        
        if (percentage >= CONFIG.THRESHOLDS.EXCELLENT) {
            return messages.excellent;
        } else if (percentage >= CONFIG.THRESHOLDS.GOOD) {
            return messages.good;
        } else if (percentage >= CONFIG.THRESHOLDS.ACCEPTABLE) {
            return messages.acceptable;
        } else {
            return messages.poor;
        }
    }

    // ============================================================
    // 8. نظام المراجعة (Review System)
    // ============================================================

    /**
     * مراجعة الإجابات
     */
    function reviewAnswers() {
        const quizContainer = getElement(CONFIG.ELEMENT_IDS.QUIZ_CONTAINER);
        const resultsPanel = getElement(CONFIG.ELEMENT_IDS.RESULTS_PANEL);
        
        if (resultsPanel) resultsPanel.classList.remove(CONFIG.CLASSES.ACTIVE);
        if (quizContainer) quizContainer.classList.add(CONFIG.CLASSES.ACTIVE);
        
        if (quizContainer) {
            quizContainer.scrollIntoView({ behavior: 'smooth' });
        }
        
        debugLog('Review mode activated');
    }

    // ============================================================
    // 9. الدوال العامة (Public API)
    // ============================================================

    /**
     * حفظ إجابة المستخدم
     * @param {number} questionIndex - فهرس السؤال
     * @param {number} optionIndex - فهرس الخيار
     */
    function saveAnswer(questionIndex, optionIndex) {
        userAnswers[questionIndex] = optionIndex;
        updateProgress();
        debugLog(`Answer saved: Q${questionIndex} = ${optionIndex}`);
    }

    /**
     * بدء الاختبار
     * @param {Array} questions - مصفوفة الأسئلة
     * @param {string} subject - اسم المادة
     */
    function startQuiz(questions, subject = '') {
        if (!questions || questions.length === 0) {
            debugLog('No questions provided', 'error');
            alert('لا توجد أسئلة متاحة!');
            return;
        }
        
        currentQuestions = questions;
        currentSubject = subject;
        userAnswers = {};
        quizSubmitted = false;
        
        // إخفاء شاشة الترحيب وإظهار الاختبار
        const welcomeScreen = getElement(CONFIG.ELEMENT_IDS.WELCOME_SCREEN);
        const quizContainer = getElement(CONFIG.ELEMENT_IDS.QUIZ_CONTAINER);
        const resultsPanel = getElement(CONFIG.ELEMENT_IDS.RESULTS_PANEL);
        
        if (welcomeScreen) welcomeScreen.style.display = 'none';
        if (resultsPanel) resultsPanel.classList.remove(CONFIG.CLASSES.ACTIVE);
        if (quizContainer) {
            quizContainer.classList.add(CONFIG.CLASSES.ACTIVE);
            quizContainer.scrollIntoView({ behavior: 'smooth' });
        }
        
        // عرض الأسئلة
        renderQuestions(questions);
        
        // تحديث عرض الإحصائيات
        updateStatsDisplay();
        
        // تحديث عدد الأسئلة والدروس
        const totalQuestionsEl = getElement(CONFIG.ELEMENT_IDS.TOTAL_QUESTIONS);
        const totalLessonsEl = getElement(CONFIG.ELEMENT_IDS.TOTAL_LESSONS);
        
        if (totalQuestionsEl) {
            totalQuestionsEl.textContent = questions.length;
        }
        
        if (totalLessonsEl) {
            const uniqueLessons = [...new Set(questions.map(q => q.lesson))];
            totalLessonsEl.textContent = uniqueLessons.length;
        }
        
        // إطلاق حدث مخصص
        if (CONFIG.ENABLE_CUSTOM_EVENTS) {
            document.dispatchEvent(new CustomEvent('quizStarted', {
                detail: {
                    questionsCount: questions.length,
                    subject: subject
                }
            }));
        }
        
        debugLog(`Quiz started: ${questions.length} questions, subject: ${subject}`);
    }

    /**
     * إعادة تعيين الاختبار
     */
    function resetQuiz() {
        const welcomeScreen = getElement(CONFIG.ELEMENT_IDS.WELCOME_SCREEN);
        const quizContainer = getElement(CONFIG.ELEMENT_IDS.QUIZ_CONTAINER);
        const resultsPanel = getElement(CONFIG.ELEMENT_IDS.RESULTS_PANEL);
        
        if (resultsPanel) resultsPanel.classList.remove(CONFIG.CLASSES.ACTIVE);
        if (quizContainer) quizContainer.classList.remove(CONFIG.CLASSES.ACTIVE);
        if (welcomeScreen) {
            welcomeScreen.style.display = 'block';
            welcomeScreen.scrollIntoView({ behavior: 'smooth' });
        }
        
        currentQuestions = [];
        userAnswers = {};
        quizSubmitted = false;
        
        debugLog('Quiz reset');
    }

    /**
     * الحصول على إحصائيات الاختبار الحالي
     * @returns {Object}
     */
    function getQuizStats() {
        const answered = Object.keys(userAnswers).length;
        const total = currentQuestions.length;
        
        return {
            totalQuestions: total,
            answeredQuestions: answered,
            remainingQuestions: total - answered,
            progress: calculatePercentage(answered, total),
            isSubmitted: quizSubmitted,
            subject: currentSubject
        };
    }

    /**
     * الحصول على الإجابات الحالية
     * @returns {Object}
     */
    function getUserAnswers() {
        return { ...userAnswers };
    }

    /**
     * تعيين المادة الحالية
     * @param {string} subject - اسم المادة
     */
    function setSubject(subject) {
        currentSubject = subject;
        debugLog(`Subject set to: ${subject}`);
    }

    /**
     * الحصول على المادة الحالية
     * @returns {string}
     */
    function getSubject() {
        return currentSubject;
    }

    /**
     * تهيئة نظام الاختبارات
     */
    function initQuiz() {
        if (isInitialized) {
            debugLog('Quiz system already initialized', 'warn');
            return;
        }
        
        // تحديث عرض الإحصائيات
        updateStatsDisplay();
        
        isInitialized = true;
        debugLog('Quiz system initialized successfully');
    }

    // ============================================================
    // 10. التهيئة التلقائية (Auto Initialization)
    // ============================================================

    // تهيئة عند تحميل DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initQuiz);
    } else {
        initQuiz();
    }

    // ============================================================
    // 11. تصدير الدوال العامة (Export Public API)
    // ============================================================

    window.QuizSystem = {
        // الدوال الرئيسية
        start: startQuiz,
        submit: submitQuiz,
        reset: resetQuiz,
        review: reviewAnswers,
        init: initQuiz,
        
        // دوال الإجابات
        saveAnswer: saveAnswer,
        getAnswers: getUserAnswers,
        
        // دوال الإحصائيات
        getStats: getQuizStats,
        clearStats: clearStats,
        updateStatsDisplay: updateStatsDisplay,
        
        // دوال المادة
        setSubject: setSubject,
        getSubject: getSubject,
        
        // الإعدادات
        config: CONFIG
    };

    // جعل الدوال الرئيسية متاحة عالمياً (للتوافق مع الملفات السابقة)
    window.startQuiz = startQuiz;
    window.submitQuiz = submitQuiz;
    window.resetQuiz = resetQuiz;
    window.reviewAnswers = reviewAnswers;
    window.saveAnswer = saveAnswer;
    window.resetStats = clearStats;

    // ============================================================
    // 12. معلومات الإصدار (Version Info)
    // ============================================================
    
    debugLog('Quiz System v2.0.0 loaded');
    debugLog('Usage: QuizSystem.start(questions, subject)');
    debugLog('Keyboard shortcuts: None (use buttons)');

})();