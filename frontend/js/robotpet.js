class RobotPet {
    constructor(svgId) {
        this.svg = document.getElementById(svgId);
        if (!this.svg) return;
        this.mouth = this.svg.querySelector('#pet-mouth-path');
        this.eyes = this.svg.querySelectorAll('.pet-eye');
        this.antenna = this.svg.querySelector('.pet-antenna-glow');
        this.bellyLed = this.svg.querySelector('.pet-belly-led');
        this.joints = this.svg.querySelectorAll('.pet-joint'); // Шарниры рук
        
        // Элементы, которые меняют цвет
        this.neonElements = [...this.eyes, this.mouth, this.antenna, this.bellyLed, ...this.joints];
        this.currentState = 'neutral';
        
        // Жизненный цикл авто-настроений
        this.stateInterval = null;
        this.resetTimeout = null;
        this.isExternalControl = false; // Флаг, блокирующий рандомные переходы
    }

    // Вспомогательный метод для обновления цвета всех неоновых элементов
    _setNeonColor(color) {
        if (!this.svg) return;
        this.neonElements.forEach(el => {
            if (el.tagName === 'path' || el.tagName === 'line') {
                el.style.stroke = color;
            } else {
                el.style.fill = color;
            }
        });
        // Обновляем CSS переменную для drop-shadow в анимациях
        this.svg.style.setProperty('--glow-color', color);
    }

    _resetEyes() {
        if (!this.svg) return;
        this.eyes.forEach(eye => {
            eye.style.transform = 'scale(1)';
            eye.setAttribute('r', '4.5');
        });
    }

    // --- Метод для приостановки авто-цикла перед ручной командой ---
    _pauseRandomCycle() {
        this.isExternalControl = true;
        if (this.stateInterval) {
            clearInterval(this.stateInterval);
            this.stateInterval = null;
        }
        if (this.resetTimeout) {
            clearTimeout(this.resetTimeout);
            this.resetTimeout = null;
        }
    }

    // --- Метод для возобновления авто-цикла ---
    _resumeRandomCycleAfterDelay(delayMs = 4000) {
        if (this.resetTimeout) {
            clearTimeout(this.resetTimeout);
        }
        this.resetTimeout = setTimeout(() => {
            this.isExternalControl = false;
            this.toNeutral();
            this.startRandomCycle();
        }, delayMs);
    }

    // Запуск случайного изменения настроений
    startRandomCycle() {
        if (this.stateInterval) {
            clearInterval(this.stateInterval);
        }
        this.stateInterval = setInterval(() => {
            if (this.isExternalControl) return; // Защита
            
            const rand = Math.random();
            if (rand < 0.6) {
                this.toNeutralInternal();
            } else if (rand < 0.85) {
                this.toThinkingInternal();
            } else {
                this.toHappyInternal();
            }
        }, 8000);
    }

    // Внутренние методы смены настроения (без сброса внешнего контроля)
    toNeutralInternal() {
        if (!this.svg) return;
        this.currentState = 'neutral';
        this._resetEyes();
        this._setNeonColor('#00f0ff');
        this.mouth.setAttribute('d', 'M 43 46 Q 50 46 57 46');
        this.antenna.style.animationDuration = '1.5s';
        this.bellyLed.style.animationDuration = '2s';
    }

    toThinkingInternal() {
        if (!this.svg) return;
        this.currentState = 'thinking';
        this._resetEyes();
        this._setNeonColor('#f1c40f');
        this.mouth.setAttribute('d', 'M 45 46 Q 50 46 55 46');
        this.eyes.forEach(eye => eye.setAttribute('r', '3'));
        this.antenna.style.animationDuration = '0.4s';
        this.bellyLed.style.animationDuration = '0.8s';
    }

    toHappyInternal() {
        if (!this.svg) return;
        this.currentState = 'happy';
        this._resetEyes();
        this._setNeonColor('#2ecc71');
        this.mouth.setAttribute('d', 'M 41 43 Q 50 53 59 43');
        this.eyes.forEach(eye => eye.setAttribute('r', '5.5'));
        this.antenna.style.animationDuration = '1s';
        this.bellyLed.style.animationDuration = '1.5s';
    }

    // --- Внешние (публичные) методы смены состояний ---
    
    toNeutral() {
        this.toNeutralInternal();
    }

    toThinking() {
        this._pauseRandomCycle();
        this.toThinkingInternal();
    }

    toHappy() {
        this._pauseRandomCycle();
        this.toHappyInternal();
        this._resumeRandomCycleAfterDelay(3000); // Вернуться к обычной жизни через 3 секунды
    }

    toError() {
        this._pauseRandomCycle();
        if (!this.svg) return;
        this.currentState = 'error';
        this._resetEyes();
        this._setNeonColor('#e74c3c');
        this.mouth.setAttribute('d', 'M 43 49 Q 50 41 57 49');
        this.antenna.style.animationDuration = '0.2s';
        this.bellyLed.style.animationDuration = '0.4s';
        
        this._resumeRandomCycleAfterDelay(6000); // Ошибка длится подольше - 6 секунд
    }
}

// Авто-инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.robot-pet-container');
    const svg = document.getElementById('robot-pet-svg');
    if (!container || !svg) return;

    const pet = new RobotPet('robot-pet-svg');
    window.robotPet = pet;
    
    pet.toNeutral();
    pet.startRandomCycle();

    // Реакция на клик
    container.addEventListener('click', () => {
        pet.toHappy();
    });
});
