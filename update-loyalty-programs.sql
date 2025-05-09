-- Add new values to loyalty_program enum
ALTER TYPE loyalty_program ADD VALUE IF NOT EXISTS 'VELOCITY';
ALTER TYPE loyalty_program ADD VALUE IF NOT EXISTS 'AMEX';
ALTER TYPE loyalty_program ADD VALUE IF NOT EXISTS 'FLYBUYS';
ALTER TYPE loyalty_program ADD VALUE IF NOT EXISTS 'HILTON';
ALTER TYPE loyalty_program ADD VALUE IF NOT EXISTS 'MARRIOTT';
ALTER TYPE loyalty_program ADD VALUE IF NOT EXISTS 'AIRBNB';
ALTER TYPE loyalty_program ADD VALUE IF NOT EXISTS 'DELTA';

-- Create trade_offers table if it doesn't exist
CREATE TABLE IF NOT EXISTS trade_offers (
  id SERIAL PRIMARY KEY,
  created_by INTEGER REFERENCES users(id),
  from_program loyalty_program NOT NULL,
  to_program loyalty_program NOT NULL,
  amount_offered REAL NOT NULL,
  amount_requested REAL NOT NULL,
  custom_rate NUMERIC NOT NULL,
  market_rate NUMERIC NOT NULL,
  savings NUMERIC NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  description TEXT
);

-- Create trade_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS trade_transactions (
  id SERIAL PRIMARY KEY,
  trade_offer_id INTEGER REFERENCES trade_offers(id),
  seller_id INTEGER REFERENCES users(id),
  buyer_id INTEGER REFERENCES users(id),
  completed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  seller_wallet_id INTEGER REFERENCES wallets(id),
  buyer_wallet_id INTEGER REFERENCES wallets(id),
  amount_sold REAL NOT NULL,
  amount_bought REAL NOT NULL,
  rate NUMERIC NOT NULL,
  seller_fee REAL DEFAULT 0 NOT NULL,
  buyer_fee REAL DEFAULT 0 NOT NULL,
  status TEXT DEFAULT 'completed' NOT NULL
);

-- Create wallets for new loyalty programs for existing users
INSERT INTO wallets (user_id, program, balance)
SELECT u.id, 'VELOCITY', 0
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM wallets w WHERE w.user_id = u.id AND w.program = 'VELOCITY'
);

INSERT INTO wallets (user_id, program, balance)
SELECT u.id, 'AMEX', 0
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM wallets w WHERE w.user_id = u.id AND w.program = 'AMEX'
);

INSERT INTO wallets (user_id, program, balance)
SELECT u.id, 'FLYBUYS', 0
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM wallets w WHERE w.user_id = u.id AND w.program = 'FLYBUYS'
);

INSERT INTO wallets (user_id, program, balance)
SELECT u.id, 'HILTON', 0
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM wallets w WHERE w.user_id = u.id AND w.program = 'HILTON'
);

INSERT INTO wallets (user_id, program, balance)
SELECT u.id, 'MARRIOTT', 0
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM wallets w WHERE w.user_id = u.id AND w.program = 'MARRIOTT'
);

INSERT INTO wallets (user_id, program, balance)
SELECT u.id, 'AIRBNB', 0
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM wallets w WHERE w.user_id = u.id AND w.program = 'AIRBNB'
);

INSERT INTO wallets (user_id, program, balance)
SELECT u.id, 'DELTA', 0
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM wallets w WHERE w.user_id = u.id AND w.program = 'DELTA'
);