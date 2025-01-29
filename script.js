class QuizApp {
    constructor() {
        this.score = 0;
        this.currentQuestion = null;
        this.timer = null;
        this.timeLeft = 30;
        this.currentQuestionIndex = 0;
        this.questions = [];
        this.totalQuestions = 10;
        
        // DOM Elements
        this.startScreen = document.getElementById('start-screen');
        this.questionScreen = document.getElementById('question-screen');
        this.resultScreen = document.getElementById('result-screen');
        this.questionText = document.getElementById('question-text');
        this.optionsContainer = document.getElementById('options');
        this.scoreElement = document.getElementById('score');
        this.timerElement = document.getElementById('timer');
        this.finalScoreElement = document.getElementById('final-score');
        this.nextButton = document.getElementById('next-btn');
        this.currentQuestionElement = document.getElementById('current-question');
        this.totalQuestionsElement = document.getElementById('total-questions');
        
        // Event Listeners
        document.getElementById('start-btn').addEventListener('click', () => this.startQuiz());
        document.getElementById('restart-btn').addEventListener('click', () => this.resetQuiz());
        this.nextButton.addEventListener('click', () => this.loadNextQuestion());
    }

    async startQuiz() {
        this.score = 0;
        this.currentQuestionIndex = 0;
        this.scoreElement.textContent = '0';
        this.totalQuestions = parseInt(document.getElementById('question-count').value);
        this.totalQuestionsElement.textContent = this.totalQuestions;
        
        await this.loadAllQuestions();
        this.showScreen(this.questionScreen);
        this.displayCurrentQuestion();
    }

    resetQuiz() {
        this.showScreen(this.startScreen);
        this.clearTimer();
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.nextButton.style.display = 'none';
    }

    async loadAllQuestions() {
        const category = document.getElementById('category').value;
        const difficulty = document.getElementById('difficulty').value;
        this.questions = await this.fetchQuestions(category, difficulty);
    }

    async fetchQuestions(category, difficulty) {
        // OpenTDB API category IDs
        const categoryIds = {
            general: 9,
            science: 17,
            sports: 21,
            geography: 22,
            history: 23,
            movies: 11,
            technology: 18
        };

        try {
            const categoryId = categoryIds[category] || 9; // Default to general knowledge if category not found
            const amount = this.totalQuestions; // Get number of questions from user selection
            
            const response = await fetch(
                `https://opentdb.com/api.php?amount=${amount}&category=${categoryId}&difficulty=${difficulty}&type=multiple`
            );
            
            if (!response.ok) {
                throw new Error('Failed to fetch questions');
            }

            const data = await response.json();

            if (data.response_code !== 0) {
                throw new Error('Not enough questions available');
            }

            // Transform the API response into our question format
            return data.results.map(q => ({
                question: this.decodeHtml(q.question),
                options: this.shuffleArray([...q.incorrect_answers, q.correct_answer].map(this.decodeHtml)),
                correctAnswer: this.decodeHtml(q.correct_answer),
                timeLimit: difficulty === 'easy' ? 30 : difficulty === 'medium' ? 20 : 15,
                points: difficulty === 'easy' ? 10 : difficulty === 'medium' ? 15 : 20
            }));
        } catch (error) {
            console.error('Error fetching questions:', error);
            // Fallback to basic questions if API fails
            return [
                {
                    question: "What is the capital of France?",
                    options: ["London", "Berlin", "Paris", "Madrid"],
                    correctAnswer: "Paris",
                    timeLimit: 30,
                    points: 10
                },
                {
                    question: "Which planet is known as the Red Planet?",
                    options: ["Mars", "Venus", "Jupiter", "Saturn"],
                    correctAnswer: "Mars",
                    timeLimit: 30,
                    points: 10
                }
                // Add more fallback questions as needed
            ];
        }
    }

    // Helper function to decode HTML entities in API response
    decodeHtml(html) {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    displayCurrentQuestion() {
        this.nextButton.style.display = 'none';
        this.currentQuestion = this.questions[this.currentQuestionIndex];
        this.currentQuestionElement.textContent = this.currentQuestionIndex + 1;
        
        this.questionText.textContent = this.currentQuestion.question;
        this.optionsContainer.innerHTML = '';
        
        this.currentQuestion.options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'option';
            button.textContent = option;
            button.addEventListener('click', () => this.checkAnswer(option));
            this.optionsContainer.appendChild(button);
        });

        this.startTimer();
    }

    checkAnswer(selectedAnswer) {
        const options = this.optionsContainer.children;
        Array.from(options).forEach(option => {
            option.style.pointerEvents = 'none';
            if (option.textContent === this.currentQuestion.correctAnswer) {
                option.classList.add('correct');
            } else if (option.textContent === selectedAnswer) {
                option.classList.add('incorrect');
            }
        });

        if (selectedAnswer === this.currentQuestion.correctAnswer) {
            this.updateScore(this.currentQuestion.points || 10);
        }

        this.clearTimer();
        this.nextButton.style.display = 'block';
    }

    updateScore(points) {
        this.score += points;
        this.scoreElement.textContent = this.score;
    }

    startTimer() {
        this.clearTimer();
        this.timeLeft = this.currentQuestion.timeLimit || 30;
        this.timerElement.textContent = this.timeLeft;
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.timerElement.textContent = this.timeLeft;
            
            if (this.timeLeft <= 0) {
                this.clearTimer();
                this.checkAnswer(''); // Time's up, mark as incorrect
            }
        }, 1000);
    }

    clearTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    loadNextQuestion() {
        this.clearTimer();
        this.currentQuestionIndex++;
        
        if (this.currentQuestionIndex >= this.totalQuestions) {
            this.endQuiz();
        } else {
            this.displayCurrentQuestion();
        }
    }

    endQuiz() {
        this.clearTimer();
        this.finalScoreElement.textContent = this.score;
        this.showScreen(this.resultScreen);
    }

    showScreen(screen) {
        [this.startScreen, this.questionScreen, this.resultScreen].forEach(s => {
            s.classList.remove('active');
        });
        screen.classList.add('active');
    }
}

// Initialize the quiz when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new QuizApp();
});
