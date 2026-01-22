import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';
import { materialSchema } from '@/lib/validations';

type StudyMaterial = Database['public']['Tables']['study_materials']['Row'];

interface MaterialWithAuthor extends StudyMaterial {
  author?: { full_name: string; avatar_url: string | null };
  subject?: { name: string; color: string } | null;
}

export function useMaterials(userId: string | undefined) {
  const { toast } = useToast();
  const [materials, setMaterials] = useState<MaterialWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMaterials = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    
    const { data: materialsData } = await supabase
      .from('study_materials')
      .select('*')
      .order('created_at', { ascending: false });

    if (!materialsData) {
      setMaterials([]);
      setIsLoading(false);
      return;
    }

    // Fetch authors and subjects
    const authorIds = [...new Set(materialsData.map(m => m.user_id))];
    const subjectIds = materialsData
      .filter(m => m.subject_id)
      .map(m => m.subject_id!)
      .filter((id, index, arr) => arr.indexOf(id) === index);

    const [{ data: authors }, subjectsResult] = await Promise.all([
      supabase.from('profiles').select('id, full_name, avatar_url').in('id', authorIds),
      subjectIds.length > 0 
        ? supabase.from('subjects').select('id, name, color').in('id', subjectIds)
        : Promise.resolve({ data: [] as { id: string; name: string; color: string }[] })
    ]);

    const authorMap = new Map<string, { full_name: string; avatar_url: string | null }>();
    authors?.forEach(a => authorMap.set(a.id, { full_name: a.full_name, avatar_url: a.avatar_url }));
    
    const subjectMap = new Map<string, { name: string; color: string }>();
    subjectsResult.data?.forEach(s => subjectMap.set(s.id, { name: s.name, color: s.color }));

    const materialsWithDetails: MaterialWithAuthor[] = materialsData.map(m => ({
      ...m,
      author: authorMap.get(m.user_id),
      subject: m.subject_id ? subjectMap.get(m.subject_id) || null : null
    }));

    setMaterials(materialsWithDetails);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const addMaterial = async (
    title: string,
    description: string,
    type: 'pdf' | 'link',
    url: string,
    subjectId?: string,
    groupId?: string
  ) => {
    if (!userId) return null;

    // Validate input
    const validation = materialSchema.safeParse({ title, description, type, url });
    if (!validation.success) {
      toast({ variant: 'destructive', title: 'Validation Error', description: validation.error.errors[0]?.message || 'Invalid input' });
      return null;
    }

    const { data, error } = await supabase
      .from('study_materials')
      .insert({
        user_id: userId,
        title: validation.data.title,
        description: validation.data.description,
        type: validation.data.type,
        url: validation.data.url,
        subject_id: subjectId || null,
        group_id: groupId || null
      })
      .select()
      .single();

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return null;
    }

    toast({ title: 'Material added!', description: 'Your resource has been saved.' });
    await fetchMaterials();
    return data;
  };

  const deleteMaterial = async (id: string) => {
    const { error } = await supabase
      .from('study_materials')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return false;
    }

    setMaterials(prev => prev.filter(m => m.id !== id));
    toast({ title: 'Material deleted' });
    return true;
  };

  const markUseful = async (id: string) => {
    const material = materials.find(m => m.id === id);
    if (!material) return false;

    const { error } = await supabase
      .from('study_materials')
      .update({ useful_count: material.useful_count + 1 })
      .eq('id', id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return false;
    }

    setMaterials(prev => 
      prev.map(m => m.id === id ? { ...m, useful_count: m.useful_count + 1 } : m)
    );
    
    return true;
  };

  const shareMaterialToGroup = async (materialId: string, groupId: string) => {
    const material = materials.find(m => m.id === materialId);
    if (!material || !userId) return false;

    const { error } = await supabase
      .from('study_materials')
      .update({ group_id: groupId })
      .eq('id', materialId)
      .eq('user_id', userId);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return false;
    }

    toast({ title: 'Material shared to group!' });
    await fetchMaterials();
    return true;
  };

  return {
    materials,
    isLoading,
    refetch: fetchMaterials,
    addMaterial,
    deleteMaterial,
    markUseful,
    shareMaterialToGroup
  };
}
