-- AcquireJobs.pk Database Schema — Milestone 1 (MySQL 8 / MariaDB 10.4+)
--
-- Core authentication and user profile models:
--   users 1---1 job_seeker_profiles   (one profile per job seeker)
--   users 1---1 companies             (one company per employer)
--
-- The "sessions" table used for cookie sessions is created automatically
-- by express-mysql-session the first time the application starts.

CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('job_seeker', 'employer', 'admin') NOT NULL,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS job_seeker_profiles (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id          INT UNSIGNED NOT NULL,
  phone            VARCHAR(20) NULL,
  city             VARCHAR(50) NULL,
  education        VARCHAR(255) NULL,
  experience       VARCHAR(500) NULL,
  skills           VARCHAR(500) NULL,
  summary          TEXT NULL,
  cv_filename      VARCHAR(255) NULL,
  cv_original_name VARCHAR(255) NULL,
  cv_uploaded_at   TIMESTAMP NULL,
  updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_profiles_user (user_id),
  CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS companies (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       INT UNSIGNED NOT NULL,
  name          VARCHAR(150) NOT NULL,
  industry      VARCHAR(80) NULL,
  location      VARCHAR(50) NULL,
  website       VARCHAR(200) NULL,
  description   TEXT NULL,
  contact_email VARCHAR(150) NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_companies_user (user_id),
  CONSTRAINT fk_companies_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
