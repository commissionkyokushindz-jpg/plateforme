-- ============================================================================
-- SCRIPT SQL : Table national_team_selections + Bucket Storage diplomas
-- Plateforme : Commission Nationale Kyokushin Kai Algérie
-- Auteur : Benaissa.Zakaria
-- Date : 2026-10-05
-- Objectif : Gérer la sélection de l'équipe nationale avec gestion de diplômes
-- ============================================================================

-- ============================================================================
-- 1. CRÉATION DE LA TABLE public.national_team_selections
-- ============================================================================

-- Table principale pour la sélection de l'équipe nationale
CREATE TABLE IF NOT EXISTS public.national_team_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    fullname TEXT NOT NULL,
    -- Nom complet de l'athlète (obligatoire)

    date_of_birth DATE NOT NULL,
    -- Date de naissance (obligatoire)

    year INTEGER NOT NULL
    CHECK (year IN (2024, 2025, 2026)),
    -- Année de participation (2024, 2025 ou 2026)

    category TEXT NOT NULL
    CHECK (category IN ('benjamin', 'minim', 'cadet', 'junior', 'senior')),
    -- Catégorie : Benjamin / Minim / Cadet / Junior / Senior

    weight_sign TEXT NOT NULL
    CHECK (weight_sign IN ('+', '-')),
    -- Sens du poids : + ou -

    weight_value NUMERIC(5,2) NOT NULL
    CHECK (weight_value > 0 AND weight_value < 250),
    -- Valeur du poids en kg (0 < poids < 250)

    diploma_url TEXT,
    -- URL du diplôme stocké (base64 ou chemin Supabase Storage)

    diploma_type TEXT,
    -- Type de diplôme (image ou pdf)

    diploma_name TEXT,
    -- Nom du fichier du diplôme

    club_id UUID
    REFERENCES public.clubs(id) ON DELETE SET NULL,
    -- Référence optionnelle vers un club existant

    created_by UUID
    REFERENCES auth.users(id) ON DELETE SET NULL,
    -- Utilisateur ayant créé l'enregistrement

    created_at TIMESTAMPTZ DEFAULT now(),
    -- Date de création

    updated_at TIMESTAMPTZ DEFAULT now()
    -- Date de dernière mise à jour
);

-- Commentaire sur la table
COMMENT ON TABLE public.national_team_selections IS
'Sélection de l\'équipe nationale Kyokushin Kai - Athlètes inscrits pour participation';

-- ============================================================================
-- 2. INDEXS POUR LES PERFORMANCES
-- ============================================================================

-- Index sur l'année de participation
CREATE INDEX IF NOT EXISTS idx_nts_year ON public.national_team_selections (year);

-- Index sur la catégorie
CREATE INDEX IF NOT EXISTS idx_nts_category ON public.national_team_selections (category);

-- Index sur le club (optionnel)
CREATE INDEX IF NOT EXISTS idx_nts_club ON public.national_team_selections (club_id);

-- ============================================================================
-- 3. TRIGGER : Mise à jour automatique de updated_at
-- ============================================================================

-- Fonction pour mettre à jour la colonne updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mise à jour automatique (ON CONFLICT pour idempotence)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'nts_updated_at') THEN
        CREATE TRIGGER nts_updated_at
            BEFORE UPDATE ON public.national_team_selections
            FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;
END
$$ LANGUAGE plpgsql;

-- Commentaire sur le trigger
COMMENT ON TRIGGER nts_updated_at ON public.national_team_selections IS
'Met à jour automatiquement la colonne updated_at à chaque modification';

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) SUR LA TABLE
-- ============================================================================

-- Activer le RLS sur la table
ALTER TABLE public.national_team_selections ENABLE ROW LEVEL SECURITY;

-- Politique SELECT : publique (tout le monde peut lire)
DROP POLICY IF EXISTS nts_select_public ON public.national_team_selections;
CREATE POLICY nts_select_public ON public.national_team_selections
    FOR SELECT USING (true);

-- Politique INSERT : uniquement authentifiés
DROP POLICY IF EXISTS nts_insert_authenticated ON public.national_team_selections;
CREATE POLICY nts_insert_authenticated ON public.national_team_selections
    FOR INSERT TO authenticated WITH CHECK (true);

-- Politique UPDATE : uniquement authentifiés
DROP POLICY IF EXISTS nts_update_authenticated ON public.national_team_selections;
CREATE POLICY nts_update_authenticated ON public.national_team_selections
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Politique DELETE : uniquement authentifiés
DROP POLICY IF EXISTS nts_delete_authenticated ON public.national_team_selections;
CREATE POLICY nts_delete_authenticated ON public.national_team_selections
    FOR DELETE TO authenticated USING (true);

-- Commentaires sur les policies
COMMENT ON POLICY nts_select_public ON public.national_team_selections IS
'Permet la lecture publique des sélections d\'équipe nationale';
COMMENT ON POLICY nts_insert_authenticated ON public.national_team_selections IS
'Permet l\'insertion uniquement aux utilisateurs authentifiés';
COMMENT ON POLICY nts_update_authenticated ON public.national_team_selections IS
'Permet la modification uniquement aux utilisateurs authentifiés';
COMMENT ON POLICY nts_delete_authenticated ON public.national_team_selections IS
'Permet la suppression uniquement aux utilisateurs authentifiés';

-- ============================================================================
-- 5. STORAGE BUCKET : diplomas
-- ============================================================================

-- Créer le bucket "diplomas" s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('diplomas', 'diplomas', true)
ON CONFLICT (id) DO NOTHING;

-- Commentaire sur le bucket
COMMENT ON storage.bucket 'diplomas' IS
'Bucket public contenant les diplômes des athlètes sélectionnés';

-- ============================================================================
-- 6. POLICIES STORAGE BUCKET "diplomas"
-- ============================================================================

-- Politique de lecture publique
DROP POLICY IF EXISTS diplomas_select_public ON storage.objects;
CREATE POLICY diplomas_select_public ON storage.objects
    FOR SELECT USING (bucket_id = 'diplomas');

-- Politique d'upload pour authenticated
DROP POLICY IF EXISTS diplomas_insert_authenticated ON storage.objects;
CREATE POLICY diplomas_insert_authenticated ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'diplomas');

-- Politique de mise à jour pour authenticated
DROP POLICY IF EXISTS diplomas_update_authenticated ON storage.objects;
CREATE POLICY diplomas_update_authenticated ON storage.objects
    FOR UPDATE TO authenticated USING (bucket_id = 'diplomas') WITH CHECK (bucket_id = 'diplomas');

-- Politique de suppression pour authenticated
DROP POLICY IF EXISTS diplomas_delete_authenticated ON storage.objects;
CREATE POLICY diplomas_delete_authenticated ON storage.objects
    FOR DELETE TO authenticated USING (bucket_id = 'diplomas');

-- Commentaires sur les policies storage
COMMENT ON POLICY diplomas_select_public ON storage.objects IS
'Autorise la lecture publique des diplômes dans le bucket diplomas';
COMMENT ON POLICY diplomas_insert_authenticated ON storage.objects IS
'Autorise l\'upload de diplômes uniquement aux utilisateurs authentifiés';
COMMENT ON POLICY diplomas_update_authenticated ON storage.objects IS
'Autorise la modification de diplômes uniquement aux utilisateurs authentifiés';
COMMENT ON POLICY diplomas_delete_authenticated ON storage.objects IS
'Autorise la suppression de diplômes uniquement aux utilisateurs authentifiés';

-- ============================================================================
-- 7. VERIFICATION : Vérification du script créé
-- ============================================================================

-- Requête de vérification (optionnelle)
SELECT
    'national_team_selections table' AS object_name,
    (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'national_team_selections') AS exists;

SELECT
    'idx_nts_year index' AS object_name,
    (SELECT count(*) FROM pg_indexes WHERE indexname = 'idx_nts_year') AS exists;

SELECT
    'diplomas bucket' AS object_name,
    (SELECT count(*) FROM storage.buckets WHERE name = 'diplomas') AS exists;

-- Fin du script SQL