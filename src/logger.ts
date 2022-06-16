import { TimeOptions } from './utils'

type Color = 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white'

class Logger {
    private static colors = {
        black: '\x1b[30m',
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        white: '\x1b[37m'
    }

    private static chelp = {
        reset: '\x1b[0m',
        bright: '\x1b[1m',
        dim: '\x1b[2m',
        underscore: '\x1b[4m',
        blink: '\x1b[5m',
        reverse: '\x1b[7m',
        hidden: '\x1b[8m'
    }

    private static format (type: string, message: string) {
        const time = new Date().toLocaleString('en-US', TimeOptions)

        return `${this.chelp.dim}[${time}]${this.chelp.reset} [${type}]: ${message}`
    }

    private static wrapType (type: string, color: Color): string {
        return `${this.colors[color]}${type}${this.chelp.reset}`
    }

    public static info (message: string): void {
        console.log(this.format(`${this.wrapType('INF', 'cyan')}`, message))
    }

    public static ok (message: string): void {
        console.log(this.format(`${this.wrapType('OKK', 'green')}`, message))
    }

    public static warn (message: string): void {
        console.log(this.format(`${this.wrapType('WRN', 'yellow')}`, message))
    }

    public static error (message: string): void {
        console.log(this.format(`${this.wrapType('ERR', 'red')}`, message))
    }
}

export { Logger }
console.log()
