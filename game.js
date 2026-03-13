/**
 * 24点挑战 - 核心逻辑 (科技感升级版)
 */

class Game24 {
    constructor() {
        this.numbers = [];
        this.expression = [];
        this.usedIndices = new Set();
        this.timer = 60;
        this.timerInterval = null;
        this.level = 1;
        this.solution = "";
        this.isGameOver = false;

        this.init();
    }

    init() {
        this.bindEvents();
        // 初始显示引导页，不自动开始
    }

    bindEvents() {
        // 引导页开始按钮
        document.getElementById('btn-start-game').addEventListener('click', () => {
            document.getElementById('intro-overlay').style.display = 'none';
            this.level = 1;
            this.startLevel();
        });

        // 数字按钮点击
        document.querySelectorAll('.num-btn').forEach((btn, index) => {
            btn.addEventListener('click', () => this.handleNumberClick(index));
        });

        // 运算符按钮点击
        document.querySelectorAll('.op-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleOperatorClick(btn.dataset.op));
        });

        // 功能按钮
        document.getElementById('btn-delete').addEventListener('click', () => this.handleDelete());
        document.getElementById('btn-clear').addEventListener('click', () => this.handleClear());
        document.getElementById('btn-submit').addEventListener('click', () => this.handleSubmit());
        document.getElementById('btn-hint').addEventListener('click', () => this.showHint());
        
        // 结算页按钮
        document.getElementById('btn-next-level').addEventListener('click', () => {
            document.getElementById('success-overlay').style.display = 'none';
            this.level++;
            this.startLevel();
        });

        document.getElementById('btn-share').addEventListener('click', () => {
            this.handleShare();
        });

        // 失败/提示后的重置按钮
        document.getElementById('btn-restart').addEventListener('click', () => {
            document.getElementById('hint-overlay').style.display = 'none';
            this.level = 1;
            this.startLevel();
        });
    }

    startLevel() {
        this.stopTimer();
        this.generateSolvableNumbers();
        this.handleClear();
        this.updateUI();
        this.startTimer();
        document.getElementById('level-val').innerText = this.level;
        this.isGameOver = false;
    }

    // 生成确保有解的4个数字，并根据关卡调整难度
    generateSolvableNumbers() {
        let found = false;
        while (!found) {
            const nums = [];
            for (let i = 0; i < 4; i++) {
                nums.push(Math.floor(Math.random() * 9) + 1);
            }
            const sol = this.solve24(nums);
            if (sol) {
                // 简单难度过滤：前3关确保有加减乘除直接能算的解，或者包含8, 3, 4, 6等
                if (this.level <= 3) {
                    const hasEasyNums = nums.some(n => [8, 3, 4, 6].includes(n));
                    if (!hasEasyNums && Math.random() > 0.3) continue;
                }
                this.numbers = nums;
                this.solution = sol;
                found = true;
            }
        }
    }

    solve24(nums) {
        const ops = ['+', '-', '*', '/'];
        const solve = (currentNums) => {
            if (currentNums.length === 1) {
                if (Math.abs(currentNums[0].val - 24) < 1e-6) return currentNums[0].expr;
                return null;
            }
            for (let i = 0; i < currentNums.length; i++) {
                for (let j = 0; j < currentNums.length; j++) {
                    if (i === j) continue;
                    const nextNums = [];
                    for (let k = 0; k < currentNums.length; k++) {
                        if (k !== i && k !== j) nextNums.push(currentNums[k]);
                    }
                    const n1 = currentNums[i];
                    const n2 = currentNums[j];
                    for (let op of ops) {
                        if ((op === '+' || op === '*') && i > j) continue;
                        if (op === '/' && Math.abs(n2.val) < 1e-6) continue;
                        let resVal, resExpr;
                        if (op === '+') { resVal = n1.val + n2.val; resExpr = `(${n1.expr}+${n2.expr})`; }
                        else if (op === '-') { resVal = n1.val - n2.val; resExpr = `(${n1.expr}-${n2.expr})`; }
                        else if (op === '*') { resVal = n1.val * n2.val; resExpr = `(${n1.expr}*${n2.expr})`; }
                        else if (op === '/') { resVal = n1.val / n2.val; resExpr = `(${n1.expr}/${n2.expr})`; }
                        const res = solve([...nextNums, { val: resVal, expr: resExpr }]);
                        if (res) return res;
                    }
                }
            }
            return null;
        };
        const initial = nums.map(n => ({ val: n, expr: n.toString() }));
        let sol = solve(initial);
        return sol ? sol.replace(/\*/g, '×').replace(/\//g, '÷') : null;
    }

    handleNumberClick(index) {
        if (this.usedIndices.has(index) || this.isGameOver) return;
        this.expression.push({ type: 'num', value: this.numbers[index], index: index });
        this.usedIndices.add(index);
        this.updateUI();
        this.playEffect(document.querySelectorAll('.num-btn')[index]);
    }

    handleOperatorClick(op) {
        if (this.isGameOver) return;
        this.expression.push({ type: 'op', value: op });
        this.updateUI();
        const btns = document.querySelectorAll('.op-btn');
        for(let btn of btns) {
            if(btn.dataset.op === op) {
                this.playEffect(btn);
                break;
            }
        }
    }

    handleDelete() {
        const last = this.expression.pop();
        if (last && last.type === 'num') this.usedIndices.delete(last.index);
        this.updateUI();
    }

    handleClear() {
        this.expression = [];
        this.usedIndices.clear();
        this.updateUI();
    }

    handleSubmit() {
        if (this.usedIndices.size < 4) {
            this.showToast("请使用全部四个数字！");
            return;
        }
        const exprStr = this.expression.map(item => item.value).join('');
        const calcExpr = exprStr.replace(/×/g, '*').replace(/÷/g, '/');
        try {
            const result = new Function(`return ${calcExpr}`)();
            if (Math.abs(result - 24) < 1e-6) {
                this.stopTimer();
                this.showSuccess();
            } else {
                this.showToast(`结果是 ${parseFloat(result.toFixed(2))}，不是24哦`);
            }
        } catch (e) {
            this.showToast("表达式不合法！");
        }
    }

    showHint() {
        this.stopTimer();
        this.isGameOver = true;
        document.getElementById('hint-text').innerHTML = `参考答案：<br><span class="highlight">${this.solution} = 24</span><br><br><small>查看答案后，进度将重置回第1关</small>`;
        document.getElementById('hint-overlay').style.display = 'flex';
    }

    showSuccess() {
        this.isGameOver = true;
        document.getElementById('success-level').innerText = this.level;
        document.getElementById('success-time').innerText = 60 - this.timer;
        document.getElementById('success-overlay').style.display = 'flex';
        this.createParticles();
    }

    handleShare() {
        const text = `我在《24点挑战》中成功闯到了第 ${this.level} 关！快来挑战我吧！`;
        if (navigator.share) {
            navigator.share({ title: '24点挑战', text: text, url: window.location.href });
        } else {
            this.showToast("已复制成绩，快去分享吧！");
            navigator.clipboard.writeText(text);
        }
    }

    updateUI() {
        const numBtns = document.querySelectorAll('.num-btn');
        numBtns.forEach((btn, i) => {
            btn.innerText = this.numbers[i];
            btn.classList.toggle('disabled', this.usedIndices.has(i));
        });
        const display = document.getElementById('expression-display');
        display.innerText = this.expression.map(item => item.value).join('') || "READY_TO_COMPUTE_";
    }

    startTimer() {
        this.timer = 60;
        document.getElementById('timer-val').innerText = this.timer;
        this.timerInterval = setInterval(() => {
            this.timer--;
            document.getElementById('timer-val').innerText = this.timer;
            if (this.timer <= 0) {
                this.stopTimer();
                this.showToast("时间到！挑战失败");
                setTimeout(() => this.showHint(), 1500);
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
    }

    showToast(msg) {
        const toast = document.getElementById('toast');
        toast.innerText = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    }

    playEffect(btn) {
        btn.style.transform = 'scale(0.9)';
        setTimeout(() => btn.style.transform = '', 100);
    }

    createParticles() {
        const container = document.getElementById('success-overlay');
        for (let i = 0; i < 50; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            p.style.left = Math.random() * 100 + 'vw';
            p.style.top = Math.random() * 100 + 'vh';
            p.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
            p.style.setProperty('--tx', (Math.random() - 0.5) * 200 + 'px');
            p.style.setProperty('--ty', (Math.random() - 0.5) * 200 + 'px');
            container.appendChild(p);
            setTimeout(() => p.remove(), 2000);
        }
    }
}

window.onload = () => new Game24();
