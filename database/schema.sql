-- HomeStride Services database schema

CREATE TABLE users (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(30) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'customer',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_user_role
    CHECK (role IN ('customer', 'technician', 'admin'))
);

CREATE TABLE customer_addresses (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  label VARCHAR(50) NOT NULL,
  address_line TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  region VARCHAR(100) NOT NULL,
  landmark TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT customer_addresses_customer_fk
    FOREIGN KEY (customer_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE TABLE services (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  base_price NUMERIC(12, 2) NOT NULL,
  estimated_duration_minutes INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT non_negative_service_price
    CHECK (base_price >= 0),

  CONSTRAINT positive_service_duration
    CHECK (estimated_duration_minutes > 0)
);

CREATE TABLE technician_profiles (
  user_id INTEGER PRIMARY KEY,
  employee_code VARCHAR(30) NOT NULL UNIQUE,
  specialization VARCHAR(120) NOT NULL,
  availability_status VARCHAR(20) NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT technician_profiles_user_fk
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT valid_availability_status
    CHECK (
      availability_status IN (
        'available',
        'assigned',
        'unavailable'
      )
    )
);

CREATE TABLE technician_skills (
  technician_id INTEGER NOT NULL,
  service_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (technician_id, service_id),

  CONSTRAINT technician_skills_technician_fk
    FOREIGN KEY (technician_id)
    REFERENCES technician_profiles(user_id)
    ON DELETE CASCADE,

  CONSTRAINT technician_skills_service_fk
    FOREIGN KEY (service_id)
    REFERENCES services(id)
    ON DELETE CASCADE
);

CREATE TABLE service_requests (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  service_id INTEGER NOT NULL,
  address_id INTEGER NOT NULL,
  assigned_technician_id INTEGER,
  preferred_date DATE NOT NULL,
  preferred_time TIME NOT NULL,
  problem_description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMPTZ,

  CONSTRAINT service_requests_customer_fk
    FOREIGN KEY (customer_id)
    REFERENCES users(id)
    ON DELETE RESTRICT,

  CONSTRAINT service_requests_service_fk
    FOREIGN KEY (service_id)
    REFERENCES services(id)
    ON DELETE RESTRICT,

  CONSTRAINT service_requests_address_fk
    FOREIGN KEY (address_id)
    REFERENCES customer_addresses(id)
    ON DELETE RESTRICT,

  CONSTRAINT service_requests_technician_fk
    FOREIGN KEY (assigned_technician_id)
    REFERENCES technician_profiles(user_id)
    ON DELETE SET NULL,

  CONSTRAINT valid_request_status
    CHECK (
      status IN (
        'pending',
        'confirmed',
        'assigned',
        'in_progress',
        'completed',
        'cancelled'
      )
    ),

  CONSTRAINT sufficient_problem_description
    CHECK (char_length(trim(problem_description)) >= 20),

  CONSTRAINT completed_request_has_date
    CHECK (
      status <> 'completed'
      OR completed_at IS NOT NULL
    )
);

CREATE TABLE status_history (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  request_id INTEGER NOT NULL,
  changed_by INTEGER,
  previous_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT status_history_request_fk
    FOREIGN KEY (request_id)
    REFERENCES service_requests(id)
    ON DELETE CASCADE,

  CONSTRAINT status_history_user_fk
    FOREIGN KEY (changed_by)
    REFERENCES users(id)
    ON DELETE SET NULL,

  CONSTRAINT valid_previous_status
    CHECK (
      previous_status IS NULL
      OR previous_status IN (
        'pending',
        'confirmed',
        'assigned',
        'in_progress',
        'completed',
        'cancelled'
      )
    ),

  CONSTRAINT valid_new_status
    CHECK (
      new_status IN (
        'pending',
        'confirmed',
        'assigned',
        'in_progress',
        'completed',
        'cancelled'
      )
    )
);

-- Indexes for commonly searched columns

CREATE INDEX customer_addresses_customer_idx
  ON customer_addresses(customer_id);

CREATE INDEX technician_skills_service_idx
  ON technician_skills(service_id);

CREATE INDEX service_requests_customer_idx
  ON service_requests(customer_id);

CREATE INDEX service_requests_technician_idx
  ON service_requests(assigned_technician_id);

CREATE INDEX service_requests_status_idx
  ON service_requests(status);

CREATE INDEX service_requests_date_idx
  ON service_requests(preferred_date);

CREATE INDEX status_history_request_idx
  ON status_history(request_id);

-- Automatically maintain updated_at values

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER services_set_updated_at
BEFORE UPDATE ON services
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER technician_profiles_set_updated_at
BEFORE UPDATE ON technician_profiles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER service_requests_set_updated_at
BEFORE UPDATE ON service_requests
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();