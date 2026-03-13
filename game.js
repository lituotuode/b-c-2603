/**
 * 24点挑战 - 核心逻辑
 */

class Game24 {
    constructor() {
        this.numbers = []; // 当前题目生成的4个数字
        this.expression = []; // 玩家当前输入的表达式（存储对象，包含类型和值）
        this.usedIndices = new Set(); // 已使用的数字索引
        this.timer = 60;
        this.timerInterval = null;
        this.score = 0;
        this.level = 1;
        this.solution = ""; // 当前题目的参考答案

        this.init();
    }

    init() {
        this.bindEvents();
        this.nextLevel();
    }

    // 绑定按钮事件
    bindEvents() {
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
        document.getElementById('btn-next').addEventListener('click', () => this.nextLevel());
        
        // 弹窗关闭
        document.getElementById('modal-close').addEventListener('click', () => {
            document.getElementById('modal').style.display = 'none';
        });
    }

    // 生成新关卡
    nextLevel() {
        this.stopTimer();
        this.generateSolvableNumbers();
        this.handleClear();
        this.updateUI();
        this.startTimer();
        this.level++;
        document.getElementById('level-val').innerText = this.level - 1;
        document.getElementById('modal').style.display = 'none';
    }

    // 生成确保有解的4个数字
    generateSolvableNumbers() {
        let found = false;
        while (!found) {
            const nums = [];
            for (let i = 0; i < 4; i++) {
                nums.push(Math.floor(Math.random() * 9) + 1);
            }
            const sol = this.solve24(nums);
            if (sol) {
                this.numbers = nums;
                this.solution = sol;
                found = true;
            }
        }
    }

    // 24点求解算法 (递归回溯)
    solve24(nums) {
        const ops = ['+', '-', '*', '/'];
        const results = [];

        // 辅助函数：尝试所有可能的计算组合
        const solve = (currentNums) => {
            if (currentNums.length === 1) {
                if (Math.abs(currentNums[0].val - 24) < 1e-6) {
                    return currentNums[0].expr;
                }
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

                    // 尝试四种运算
                    for (let op of ops) {
                        // 减法和除法不满足交换律，所以 i, j 的顺序很重要
                        if ((op === '+' || op === '*') && i > j) continue;
                        if (op === '/' && Math.abs(n2.val) < 1e-6) continue;

                        let resVal;
                        let resExpr;
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
        if (sol) {
            // 美化输出，将 * / 换回 × ÷
            return sol.replace(/\*/g, '×').replace(/\//g, '÷');
        }
        return null;
    }

    handleNumberClick(index) {
        if (this.usedIndices.has(index)) return;
        
        this.expression.push({ type: 'num', value: this.numbers[index], index: index });
        this.usedIndices.add(index);
        this.updateUI();
        this.animateButton(document.querySelectorAll('.num-btn')[index]);
    }

    handleOperatorClick(op) {
        this.expression.push({ type: 'op', value: op });
        this.updateUI();
        // 找到对应的按钮加动画
        const btns = document.querySelectorAll('.op-btn');
        for(let btn of btns) {
            if(btn.dataset.op === op) {
                this.animateButton(btn);
                break;
            }
        }
    }

    handleDelete() {
        const last = this.expression.pop();
        if (last && last.type === 'num') {
            this.usedIndices.delete(last.index);
        }
        this.updateUI();
    }

    handleClear() {
        this.expression = [];
        this.usedIndices.clear();
        this.updateUI();
    }

    handleSubmit() {
        if (this.usedIndices.size < 4) {
            this.showMessage("请使用全部四个数字！");
            return;
        }

        const exprStr = this.getExpressionString();
        // 将显示符号转为计算符号
        const calcExpr = exprStr.replace(/×/g, '*').replace(/÷/g, '/');

        try {
            // 使用 Function 代替 eval 更安全一点点，虽然都是前端环境
            const result = new Function(`return ${calcExpr}`)();
            if (Math.abs(result - 24) < 1e-6) {
                this.stopTimer();
                this.showModal("恭喜你！答案正确！", true);
            } else {
                this.showMessage(`当前结果是 ${parseFloat(result.toFixed(2))}，再试试吧！`);
            }
        } catch (e) {
            this.showMessage("表达式不合法，请检查括号或运算符！");
        }
    }

    showHint() {
        this.showModal(`参考答案：<br><span class="sol-text">${this.solution} = 24</span>`, false);
    }

    getExpressionString() {
        return this.expression.map(item => item.value).join('');
    }

    updateUI() {
        // 更新数字按钮状态
        const numBtns = document.querySelectorAll('.num-btn');
        numBtns.forEach((btn, i) => {
            btn.innerText = this.numbers[i];
            if (this.usedIndices.has(i)) {
                btn.classList.add('disabled');
            } else {
                btn.classList.remove('disabled');
            }
        });

        // 更新表达式显示
        const display = document.getElementById('expression-display');
        display.innerText = this.getExpressionString() || "等待输入...";
        display.style.color = this.expression.length > 0 ? "#333" : "#999";
    }

    startTimer() {
        this.timer = 60;
        document.getElementById('timer-val').innerText = this.timer;
        this.timerInterval = setInterval(() => {
            this.timer--;
            document.getElementById('timer-val').innerText = this.timer;
            if (this.timer <= 0) {
                this.stopTimer();
                this.showModal("时间到啦！看看参考答案吧。", false);
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
    }

    showMessage(msg) {
        const toast = document.getElementById('toast');
        toast.innerText = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    }

    showModal(content, isSuccess) {
        const modal = document.getElementById('modal');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');
        
        title.innerText = isSuccess ? "太棒了！" : "提示";
        body.innerHTML = content;
        modal.style.display = 'flex';
        
        if (isSuccess) {
            confetti(); // 简单的成功效果
        }
    }

    animateButton(btn) {
        btn.classList.add('btn-pop');
        setTimeout(() => btn.classList.remove('btn-pop'), 200);
    }
}

// 简单的纸屑效果（模拟成功动画）
function confetti() {
    const colors = ['#FF5722', '#FFC107', '#4CAF50', '#2196F3', '#9C27B0'];
    for (let i = 0; i < 30; i++) {
        const div = document.createElement('div');
        div.className = 'confetti';
        div.style.left = Math.random() * 100 + 'vw';
        div.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        div.style.animationDelay = Math.random() * 2 + 's';
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 3000);
    }
}

// 启动游戏
window.onload = () => {
    new Game24();
};
