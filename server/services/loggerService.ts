/**
 * Simple logger service with colorful console output
 */
export class LoggerService {
  private readonly serviceName: string;
  private readonly colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    
    // Foreground colors
    fgBlack: "\x1b[30m",
    fgRed: "\x1b[31m",
    fgGreen: "\x1b[32m",
    fgYellow: "\x1b[33m",
    fgBlue: "\x1b[34m",
    fgMagenta: "\x1b[35m",
    fgCyan: "\x1b[36m",
    fgWhite: "\x1b[37m",
    
    // Background colors
    bgBlack: "\x1b[40m",
    bgRed: "\x1b[41m",
    bgGreen: "\x1b[42m",
    bgYellow: "\x1b[43m",
    bgBlue: "\x1b[44m",
    bgMagenta: "\x1b[45m",
    bgCyan: "\x1b[46m",
    bgWhite: "\x1b[47m"
  };
  
  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }
  
  /**
   * Format a message with timestamp, service name, and appropriate colors
   */
  private format(level: string, message: string, color: string): string {
    const timestamp = new Date().toLocaleTimeString();
    return `${this.colors.dim}[${timestamp}]${this.colors.reset} ${color}[${level}]${this.colors.reset} ${this.colors.fgCyan}${this.serviceName}:${this.colors.reset} ${message}`;
  }
  
  /**
   * Log an info message
   */
  info(message: string): void {
    console.log(this.format("INFO", message, this.colors.fgBlue));
  }
  
  /**
   * Log a success message
   */
  success(message: string): void {
    console.log(this.format("SUCCESS", message, this.colors.fgGreen));
  }
  
  /**
   * Log a warning message
   */
  warning(message: string): void {
    console.log(this.format("WARNING", message, this.colors.fgYellow));
  }
  
  /**
   * Log an error message
   */
  error(message: string): void {
    console.error(this.format("ERROR", message, this.colors.fgRed));
  }
  
  /**
   * Log a debug message
   */
  debug(message: string): void {
    if (process.env.NODE_ENV === "development") {
      console.log(this.format("DEBUG", message, this.colors.fgMagenta));
    }
  }
  
  /**
   * Log a raw message with custom styling
   */
  raw(message: string): void {
    console.log(message);
  }
  
  /**
   * Log a table
   */
  table(data: any): void {
    console.table(data);
  }
}