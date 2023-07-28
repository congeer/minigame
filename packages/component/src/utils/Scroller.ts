import {app} from "@minigame/core";

export class Scroller {
    tickerStop = true;
    callback: (x: number, y: number) => void;
    onEnd?: () => void;
    range: { top: number; left: number; right: number; bottom: number } = {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    };
    coordinatePoint: [number, number] = [0, 0];
    positions: number[] = [];
    speedX = 0;
    speedY = 0;

    constructor(callback: (x: number, y: number) => void, onEnd?: () => void) {
        this.callback = callback;
        this.onEnd = onEnd;
    }

    doTouchStart(x: number, y: number) {
        this.tickerStop = true;
        this.positions = [];
        this.recordPoint(x, y);
    }

    doTouchMove(x: number, y: number, timestamp: number) {
        this.range.left -= x - this.coordinatePoint[0];
        this.range.top -= y - this.coordinatePoint[1];

        this.limitBoundary(this.callback);

        this.positions = this.positions || [];
        this.positions.push(this.range.left, this.range.top, timestamp);

        if (this.positions.length > 60) this.positions.splice(0, 30);

        this.recordPoint(x, y);
    }

    doTouchEnd(timestamp: number) {
        if (!this.positions.length) return;
        let scrollLeft, scrollTop, deltaT;
        for (let i = this.positions.length - 1; i > 0 && this.positions[i] > timestamp - 100; i -= 3) {
            scrollLeft = this.positions[i - 2];
            scrollTop = this.positions[i - 1];
            deltaT = timestamp - this.positions[i];
        }

        this.speedX = ((scrollLeft! - this.range.left) / deltaT!) * (1000 / 60);
        this.speedY = ((scrollTop! - this.range.top) / deltaT!) * (1000 / 60);

        if (Math.abs(this.speedX) > 1 || Math.abs(this.speedY) > 1) this.accelerateMotion();
    }

    recordPoint(x: number, y: number) {
        this.coordinatePoint[0] = x;
        this.coordinatePoint[1] = y;
    }

    limitBoundary(callback?: (x: number, y: number) => void) {
        if (this.range.left < 0) this.range.left = 0;
        if (this.range.top < 0) this.range.top = 0;

        if (this.range.left > this.range.right) this.range.left = this.range.right;
        if (this.range.top > this.range.bottom) this.range.top = this.range.bottom;

        callback && callback(-this.range.left, -this.range.top);
    }

    accelerateMotion() {
        let scrollLeft;
        let scrollTop;
        let delta = () => {
            if (Math.abs(this.speedX) >= 0.05 || Math.abs(this.speedY) >= 0.05) {
                scrollLeft = this.range.left;
                scrollTop = this.range.top;
                this.range.left -= this.speedX;
                this.range.top -= this.speedY;
                this.limitBoundary(this.callback);
                if (scrollLeft === this.range.left && scrollTop === this.range.top) return (this.tickerStop = true);
                this.speedX *= 0.95;
                this.speedY *= 0.95;
                return;
            }
            this.tickerStop = true;
        };
        this.tickerStart(delta);
    }

    timer?: any;

    wheel(deltaX: number, deltaY: number) {
        this.timer && clearTimeout(this.timer);
        this.tickerStop = true;
        this.range.left += deltaX
        this.range.top += deltaY
        this.limitBoundary(this.callback);
        this.timer = setTimeout(() => {
            this.onEnd && this.onEnd();
        }, 50)
    }

    contentSize(containerWidth: number, containerHeight: number, contentWidth: number, contentHeight: number) {
        this.range.right = Math.max(contentWidth - containerWidth, 0);
        this.range.bottom = Math.max(contentHeight - containerHeight, 0);
        let offsetX = this.range.left;
        let offsetY = this.range.top;
        let offsetLeft = (number: number) => this.range.left;
        let offsetTop = (number: number) => this.range.top;
        let duration = 20;
        this.limitBoundary();

        if (offsetX - this.range.left) {
            offsetLeft = this.easeOut.bind(null, 0, offsetX - this.range.left, duration);
        }

        if (offsetY - this.range.top) {
            offsetTop = this.easeOut.bind(null, 0, offsetY - this.range.top, duration);
        }

        if (!(offsetX - this.range.left) && !(offsetY - this.range.top)) return;

        let initialTime = 0;
        let delta = (t: number) => {
            !initialTime && (initialTime = t);

            if (duration <= ((t - initialTime) / 1000) * 60) {
                this.tickerStop = true;
                this.callback(this.range.left, this.range.top);
                return;
            }
            this.callback(offsetX - offsetLeft(((t - initialTime) / 1000) * 60), offsetY - offsetTop(((t - initialTime) / 1000) * 60));
        };

        this.tickerStart(delta);
    }

    easeOut(b: number, c: number, d: number, t: number) {
        //  b: beginning value（初始值）
        //  c: change in value（变化量）
        //  d: duration（持续时间）
        //  t: current time（当前时间）
        return -c * (t /= d) * (t - 2) + b;
    }

    tickerStart(callback: (timestamp: number) => void) {
        this.tickerStop = false;
        const fn = () => {
            callback(performance.now());
            this.tickerStop && app.ticker.remove(fn);
            this.tickerStop && this.onEnd && this.onEnd();
        };
        app.ticker.add(fn)
    }
}
