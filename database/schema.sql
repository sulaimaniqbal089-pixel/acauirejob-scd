-- AcquireJobs.pk database schema (MySQL 8 / MariaDB 10.4+)
--
-- Relationships:
--   users 1---1 job_seeker_profiles   (one profile per job seeker)
--   users 1---1 companies             (one company per employer)
--   companies 1---* jobs
--   jobs 1---* applications *---1 users (the job seeker who applied)
--
-- The "sessions" table used for login sessions is created automatically
-- by the express-mysql-session package the first time the app starts.

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS job_seeker_profiles (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id          INT UNSIGNED NOT NULL,
  phone            VARCHAR(20) NULL,
  city             VARCHAR(50) NULL,
  education        VARCHAR(255) NULL,
  experience       VARCHAR(500) NULL,
  skills           VARCHAR(500) NULL,
  summary          TEXT NULL,
  cv_filename      VARCHAR(255) NULL,   -- random name of the file inside uploads/cvs
  cv_original_name VARCHAR(255) NULL,   -- name the user uploaded, shown on screen
  cv_uploaded_at   TIMESTAMP NULL,
  updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_profiles_user (user_id),
  CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS jobs (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id          INT UNSIGNED NOT NULL,
  title               VARCHAR(120) NOT NULL,
  description         TEXT NOT NULL,
  requirements        TEXT NOT NULL,
  location            VARCHAR(50) NOT NULL,
  employment_type     ENUM('Full-Time', 'Part-Time', 'Internship', 'Contract') NOT NULL,
  experience_required VARCHAR(30) NOT NULL,
  salary_min          INT UNSIGNED NULL,
  salary_max          INT UNSIGNED NULL,
  deadline            DATE NULL,
  status              ENUM('active', 'closed') NOT NULL DEFAULT 'active',  -- set by the employer
  is_hidden           TINYINT(1) NOT NULL DEFAULT 0,                       -- set by the admin
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_jobs_company (company_id),
  KEY idx_jobs_listing (status, is_hidden, created_at),
  KEY idx_jobs_location (location),
  CONSTRAINT fk_jobs_company FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS applications (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  job_id        INT UNSIGNED NOT NULL,
  seeker_id     INT UNSIGNED NOT NULL,
  cover_message VARCHAR(1000) NULL,
  status        ENUM('Pending', 'Shortlisted', 'Rejected', 'Hired') NOT NULL DEFAULT 'Pending',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_applications_job_seeker (job_id, seeker_id),   -- blocks duplicate applications
  KEY idx_applications_seeker (seeker_id),
  KEY idx_applications_status (status),
  CONSTRAINT fk_applications_job FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE CASCADE,
  CONSTRAINT fk_applications_seeker FOREIGN KEY (seeker_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
