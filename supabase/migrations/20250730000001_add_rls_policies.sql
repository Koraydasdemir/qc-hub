-- ===== RLS POLICIES FOR PROJECT ROADMAP =====
-- Users can view roadmap if they have permission for the spec
CREATE POLICY "Users can view project_roadmap"
ON project_roadmap FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_permissions.spec_id = project_roadmap.spec_id
    AND user_permissions.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_permissions.spec_id = project_roadmap.spec_id
    AND user_permissions.permission_level = 'admin'
    AND user_permissions.user_id = auth.uid()
  )
);

-- Only editors and admins can update roadmap
CREATE POLICY "Editors can update project_roadmap"
ON project_roadmap FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_permissions.spec_id = project_roadmap.spec_id
    AND user_permissions.user_id = auth.uid()
    AND user_permissions.permission_level IN ('editor', 'admin')
  )
);

-- Only admins can delete roadmap
CREATE POLICY "Admins can delete project_roadmap"
ON project_roadmap FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_permissions.spec_id = project_roadmap.spec_id
    AND user_permissions.user_id = auth.uid()
    AND user_permissions.permission_level = 'admin'
  )
);

-- ===== RLS POLICIES FOR WORKFLOW SUBSTAGES =====
-- Users can view if they have permission
CREATE POLICY "Users can view workflow_substages"
ON workflow_substages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_permissions.spec_id = workflow_substages.spec_id
    AND user_permissions.user_id = auth.uid()
  )
);

-- Editors and admins can insert workflow substages
CREATE POLICY "Editors can insert workflow_substages"
ON workflow_substages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_permissions.spec_id = workflow_substages.spec_id
    AND user_permissions.user_id = auth.uid()
    AND user_permissions.permission_level IN ('editor', 'admin')
  )
);

-- Editors and assigned users can update workflow status
CREATE POLICY "Users can update workflow_substages"
ON workflow_substages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_permissions.spec_id = workflow_substages.spec_id
    AND user_permissions.user_id = auth.uid()
    AND user_permissions.permission_level IN ('editor', 'admin')
  )
  OR
  workflow_substages.assigned_to = auth.uid()
);

-- Only admins can delete workflow substages
CREATE POLICY "Admins can delete workflow_substages"
ON workflow_substages FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_permissions.spec_id = workflow_substages.spec_id
    AND user_permissions.user_id = auth.uid()
    AND user_permissions.permission_level = 'admin'
  )
);

-- ===== RLS POLICIES FOR FAT TRACKING =====
CREATE POLICY "Users can view fat_tracking"
ON fat_tracking FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_permissions.spec_id = fat_tracking.spec_id
    AND user_permissions.user_id = auth.uid()
  )
);

CREATE POLICY "QA users can update fat_tracking"
ON fat_tracking FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_permissions.spec_id = fat_tracking.spec_id
    AND user_permissions.user_id = auth.uid()
    AND user_permissions.permission_level IN ('editor', 'admin')
  )
  OR
  fat_tracking.assigned_to = auth.uid()
);

-- ===== RLS POLICIES FOR PACKING TRACKING =====
CREATE POLICY "Users can view packing_tracking"
ON packing_tracking FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_permissions.spec_id = packing_tracking.spec_id
    AND user_permissions.user_id = auth.uid()
  )
);

CREATE POLICY "Logistics users can update packing_tracking"
ON packing_tracking FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_permissions.spec_id = packing_tracking.spec_id
    AND user_permissions.user_id = auth.uid()
    AND user_permissions.permission_level IN ('editor', 'admin')
  )
  OR
  packing_tracking.assigned_to = auth.uid()
);

-- ===== RLS POLICIES FOR EXTERNAL TRADE =====
CREATE POLICY "Users can view external_trade"
ON external_trade FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_permissions.spec_id = external_trade.spec_id
    AND user_permissions.user_id = auth.uid()
  )
);

CREATE POLICY "Trade users can update external_trade"
ON external_trade FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_permissions.spec_id = external_trade.spec_id
    AND user_permissions.user_id = auth.uid()
    AND user_permissions.permission_level IN ('editor', 'admin')
  )
  OR
  external_trade.assigned_to = auth.uid()
);

-- ===== RLS POLICIES FOR TECHNICAL QUERIES =====
CREATE POLICY "Users can view technical_queries"
ON technical_queries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_permissions.spec_id = technical_queries.spec_id
    AND user_permissions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create technical_queries"
ON technical_queries FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_permissions.spec_id = technical_queries.spec_id
    AND user_permissions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own technical_queries"
ON technical_queries FOR UPDATE
USING (
  technical_queries.created_by = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_permissions.spec_id = technical_queries.spec_id
    AND user_permissions.user_id = auth.uid()
    AND user_permissions.permission_level = 'admin'
  )
);

-- ===== RLS POLICIES FOR APPROVAL QUEUE =====
CREATE POLICY "Admins can view approval_queue"
ON approval_queue FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_permissions.spec_id = approval_queue.spec_id
    AND user_permissions.user_id = auth.uid()
    AND user_permissions.permission_level = 'admin'
  )
);

CREATE POLICY "Users can create approval_queue requests"
ON approval_queue FOR INSERT
WITH CHECK (
  approval_queue.requested_by = auth.uid()
);

-- ===== RLS POLICIES FOR USER PERMISSIONS =====
-- Only admins can view and manage permissions
CREATE POLICY "Admins can view user_permissions"
ON user_permissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
  )
  AND (
    auth.uid() = user_permissions.user_id
    OR
    EXISTS (
      SELECT 1 FROM user_permissions AS up
      WHERE up.user_id = auth.uid()
      AND up.permission_level = 'admin'
    )
  )
);

CREATE POLICY "Admins can manage user_permissions"
ON user_permissions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_permissions.user_id = auth.uid()
    AND user_permissions.permission_level = 'admin'
  )
);

CREATE POLICY "Admins can update user_permissions"
ON user_permissions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_permissions AS up
    WHERE up.user_id = auth.uid()
    AND up.permission_level = 'admin'
  )
);

-- ===== Enable RLS on all tables =====
-- Already enabled in previous migration, but ensuring:
ALTER TABLE project_roadmap ENABLE ROW LEVEL SECURITY;
ALTER TABLE technical_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE fat_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE packing_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_trade ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_substages ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
