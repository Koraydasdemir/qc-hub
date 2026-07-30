import { createClient } from './client';

// ===== PROJECT ROADMAP QUERIES =====

export async function getProjectRoadmap(specId: string) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('project_roadmap')
      .select('*')
      .eq('spec_id', specId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (err) {
    console.error('Error fetching roadmap:', err);
    return null;
  }
}

export async function updateProjectRoadmap(
  specId: string,
  updates: Record<string, any>
) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('project_roadmap')
      .update({ ...updates, updated_at: new Date() })
      .eq('spec_id', specId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error updating roadmap:', err);
    throw err;
  }
}

// ===== WORKFLOW QUERIES =====

export async function getWorkflowStages(specId: string) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('workflow_substages')
      .select('*')
      .eq('spec_id', specId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching workflow:', err);
    return [];
  }
}

export async function updateWorkflowStatus(
  specId: string,
  stageName: string,
  substageId: number,
  status: 'pending' | 'in_progress' | 'completed'
) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('workflow_substages')
      .update({ status, updated_at: new Date() })
      .eq('id', substageId)
      .eq('spec_id', specId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error updating workflow status:', err);
    throw err;
  }
}

export async function createWorkflowSubstage(
  specId: string,
  stageName: string,
  substageName: string
) {
  const supabase = createClient();
  try {
    const { data: userData } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('workflow_substages')
      .insert({
        spec_id: specId,
        stage_name: stageName,
        substage_name: substageName,
        status: 'pending',
        created_by: userData?.user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error creating workflow substage:', err);
    throw err;
  }
}

// ===== QA TRACKING QUERIES =====

export async function getFATTracking(specId: string) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('fat_tracking')
      .select('*')
      .eq('spec_id', specId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (err) {
    console.error('Error fetching FAT tracking:', err);
    return null;
  }
}

export async function getPackingTracking(specId: string) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('packing_tracking')
      .select('*')
      .eq('spec_id', specId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (err) {
    console.error('Error fetching packing tracking:', err);
    return null;
  }
}

export async function getExternalTradeTracking(specId: string) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('external_trade')
      .select('*')
      .eq('spec_id', specId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (err) {
    console.error('Error fetching external trade tracking:', err);
    return null;
  }
}

export async function updateQAStatus(
  tableName: 'fat_tracking' | 'packing_tracking' | 'external_trade',
  specId: string,
  field: string,
  status: 'pending' | 'submitted' | 'approved'
) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from(tableName)
      .update({ [field]: status, updated_at: new Date() })
      .eq('spec_id', specId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error(`Error updating ${tableName}:`, err);
    throw err;
  }
}

// ===== PERMISSIONS QUERIES =====

export async function getUserPermissions(userId: string, specId: string) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('user_permissions')
      .select('*')
      .eq('user_id', userId)
      .eq('spec_id', specId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.permission_level || 'viewer';
  } catch (err) {
    console.error('Error fetching permissions:', err);
    return 'viewer'; // Default: read-only
  }
}

export async function checkPermission(
  userId: string,
  specId: string,
  requiredLevel: 'admin' | 'editor' | 'viewer'
) {
  const permissionLevel = await getUserPermissions(userId, specId);

  const levels = { viewer: 1, editor: 2, admin: 3 };
  return levels[permissionLevel as keyof typeof levels] >=
         levels[requiredLevel];
}

export async function grantPermission(
  userId: string,
  specId: string,
  permissionLevel: 'admin' | 'editor' | 'viewer'
) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('user_permissions')
      .upsert({
        user_id: userId,
        spec_id: specId,
        permission_level: permissionLevel,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error granting permission:', err);
    throw err;
  }
}

// ===== TECHNICAL QUERIES =====

export async function getTechnicalQueries(specId: string) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('technical_queries')
      .select('*')
      .eq('spec_id', specId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching technical queries:', err);
    return [];
  }
}

export async function createTechnicalQuery(
  specId: string,
  title: string,
  description: string
) {
  const supabase = createClient();
  try {
    const { data: userData } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('technical_queries')
      .insert({
        spec_id: specId,
        title,
        description,
        status: 'open',
        created_by: userData?.user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error creating technical query:', err);
    throw err;
  }
}

export async function updateTechnicalQuery(
  queryId: number,
  updates: Record<string, any>
) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('technical_queries')
      .update({ ...updates, updated_at: new Date() })
      .eq('id', queryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error updating technical query:', err);
    throw err;
  }
}
