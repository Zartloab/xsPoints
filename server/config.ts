/**
 * Application configuration
 */
export const config = {
  server: {
    port: process.env.PORT || 5000,
    sessionSecret: process.env.SESSION_SECRET || 'xpoints-session-secret',
  },
  blockchain: {
    enabled: process.env.BLOCKCHAIN_ENABLED === 'true',
    network: process.env.BLOCKCHAIN_NETWORK || 'mumbai', // polygon testnet
    rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'https://polygon-mumbai.infura.io/v3/your-infura-key',
    adminPrivateKey: process.env.ADMIN_PRIVATE_KEY || '',
    tokenContractAddress: process.env.TOKEN_CONTRACT_ADDRESS || '',
  },
  tokenization: {
    enableBlockchain: process.env.ENABLE_BLOCKCHAIN === 'true' || false,
    minConversionAmount: 100,
    maxConversionAmount: 100000,
    feePercentage: 0.5,
    feeThreshold: 10000, // No fees below this amount
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'xpoints-jwt-secret',
    jwtExpiresIn: '1d',
    bcryptSaltRounds: 10,
  },
  fees: {
    tradingFeePercentage: 0.5, // Minimum fee percentage
    tradingFeeMaxPercentage: 3.0, // Maximum fee percentage
    tradingFeeSavingsPercentage: 10.0, // Fee as percentage of savings
  },
  email: {
    enabled: process.env.EMAIL_ENABLED === 'true' || false,
    from: process.env.EMAIL_FROM || 'noreply@xpoints.exchange',
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
  },
  audit: {
    logRequests: process.env.LOG_REQUESTS === 'true' || true,
    logTransactions: true,
  }
};