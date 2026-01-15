-- Add role column to users table
ALTER TABLE users ADD COLUMN role ENUM('admin', 'user') NOT NULL DEFAULT 'user' AFTER email;

-- Set initial admin user
UPDATE users SET role = 'admin' WHERE email = 'duobinji@gmail.com';
