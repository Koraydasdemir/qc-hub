-- Project Roadmap Table
CREATE TABLE IF NOT EXISTS project_roadmap (
  id BIGSERIAL PRIMARY KEY,
  spec_id TEXT NOT NULL UNIQUE,
  spec_no TEXT NOT NULL,
  contract_no TEXT,
  equipment_cost NUMERIC,
  payment_count INT DEFAULT 3,
  materials TEXT,
  shipping TEXT,
  start_date DATE,
  end_date DATE,
  location TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  FOREIGN KEY (spec_id) REFERENCES projects(kod)
);

-- Technical Queries (TQ) Table
CREATE TABLE IF NOT EXISTS technical_queries (
  id BIGSERIAL PRIMARY KEY,
  spec_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open',
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (spec_id) REFERENCES projects(kod)
);

-- FAT Tracking Table
CREATE TABLE IF NOT EXISTS fat_tracking (
  id BIGSERIAL PRIMARY KEY,
  spec_id TEXT NOT NULL,
  punch_list_status TEXT DEFAULT 'pending',
  completed_status TEXT DEFAULT 'pending',
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (spec_id) REFERENCES projects(kod)
);

-- Packing Tracking Table
CREATE TABLE IF NOT EXISTS packing_tracking (
  id BIGSERIAL PRIMARY KEY,
  spec_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (spec_id) REFERENCES projects(kod)
);

-- External Trade Table
CREATE TABLE IF NOT EXISTS external_trade (
  id BIGSERIAL PRIMARY KEY,
  spec_id TEXT NOT NULL,
  before_delivery TEXT DEFAULT 'pending',
  during_delivery TEXT DEFAULT 'pending',
  completed TEXT DEFAULT 'pending',
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (spec_id) REFERENCES projects(kod)
);

-- Workflow Substages Table
CREATE TABLE IF NOT EXISTS workflow_substages (
  id BIGSERIAL PRIMARY KEY,
  spec_id TEXT NOT NULL,
  stage_name TEXT NOT NULL,
  substage_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (spec_id) REFERENCES projects(kod)
);

-- Approval Queue Table
CREATE TABLE IF NOT EXISTS approval_queue (
  id BIGSERIAL PRIMARY KEY,
  spec_id TEXT NOT NULL,
  type TEXT NOT NULL,
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  content JSONB,
  status TEXT DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (spec_id) REFERENCES projects(kod)
);

-- User Permissions Table
CREATE TABLE IF NOT EXISTS user_permissions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  spec_id TEXT NOT NULL,
  permission_level TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (spec_id) REFERENCES projects(kod),
  UNIQUE(user_id, spec_id)
);

-- Enable RLS
ALTER TABLE project_roadmap ENABLE ROW LEVEL SECURITY;
ALTER TABLE technical_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE fat_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE packing_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_trade ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_substages ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
