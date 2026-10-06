-- ============================================================================
-- MIGRATION : national_team_selections.club_id -> public.associations(id)
-- Plateforme : Commission Nationale Kyokushin Kai Algérie
-- Date : 2026-10-06
-- Objectif :
--   1) Créer/corriger la FK obligatoire qui permet la jointure
--      Supabase `association:associations!club_id (...)`
--   2) Nettoyer les enregistrements orphelins (club_id NULL)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0) DIAGNOSTIC : types concernés
-- ----------------------------------------------------------------------------
SELECT c.table_name, c.column_name, c.data_type, c.udt_name
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.table_name = 'national_team_selections'
  AND c.column_name = 'club_id';

SELECT c.table_name, c.column_name, c.data_type, c.udt_name
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.table_name = 'associations'
  AND c.column_name = 'id';

-- ----------------------------------------------------------------------------
-- 1) CRÉATION DE LA FOREIGN KEY (idempotent, tolérant au type)
--    L'ancienne FK éventuelle vers public.clubs(id) est supprimée.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_nts_type   text;
    v_assoc_type text;
BEGIN
    SELECT udt_name INTO v_nts_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'national_team_selections'
      AND column_name = 'club_id';

    SELECT udt_name INTO v_assoc_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'associations'
      AND column_name = 'id';

    IF v_nts_type IS NULL THEN
        RAISE NOTICE 'colonne national_team_selections.club_id introuvable';
        RETURN;
    END IF;
    IF v_assoc_type IS NULL THEN
        RAISE NOTICE 'colonne associations.id introuvable';
        RETURN;
    END IF;

    IF v_nts_type IS DISTINCT FROM v_assoc_type THEN
        RAISE NOTICE 'TYPES DIFFERENTS : club_id = %, associations.id = %', v_nts_type, v_assoc_type;
        RAISE NOTICE 'Exécuter d''abord : ALTER TABLE public.national_team_selections ALTER COLUMN club_id TYPE % USING club_id::%;',
                     v_assoc_type, v_assoc_type;
        RETURN;
    END IF;

    -- Suppression de l'ancienne contrainte (vers clubs ou n'importe quelle autre)
    FOR r IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.national_team_selections'::regclass
          AND contype = 'f'
          AND pg_get_constraintdef(oid) LIKE '%club_id%'
    LOOP
        EXECUTE format('ALTER TABLE public.national_team_selections DROP CONSTRAINT IF EXISTS %I', r.conname);
        RAISE NOTICE 'Ancienne FK supprimée : %', r.conname;
    END LOOP;

    ALTER TABLE public.national_team_selections
        ADD CONSTRAINT national_team_selections_club_id_fkey
        FOREIGN KEY (club_id) REFERENCES public.associations(id)
        ON DELETE SET NULL;

    RAISE NOTICE 'FK national_team_selections_club_id_fkey créée (club_id -> associations.id)';
END
$$;

-- ----------------------------------------------------------------------------
-- 2) INDEX
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_nts_club ON public.national_team_selections(club_id);

-- ----------------------------------------------------------------------------
-- 3) LIGNES ORPHELINES (club_id NULL) — état actuel
-- ----------------------------------------------------------------------------
SELECT count(*) AS orphelins
FROM public.national_team_selections
WHERE club_id IS NULL;

-- ----------------------------------------------------------------------------
-- 4) REQUIÊTE SQL MANUELLE DE RATTACHEMENT (alternative au bouton
--    "🔗 Associer en masse" de l'interface admin)
--
--    Voir d'abord de quels athlètes il s'agit :
-- ----------------------------------------------------------------------------
-- SELECT id, fullname, year, created_at
-- FROM public.national_team_selections
-- WHERE club_id IS NULL
-- ORDER BY fullname;

--    Rattacher TOUS les orphelins à une association :
-- UPDATE public.national_team_selections
-- SET club_id = (SELECT id FROM public.associations WHERE name = 'Nom exact de l''association' LIMIT 1)
-- WHERE club_id IS NULL;

--    Rattacher un lot par nom d'athlète :
-- UPDATE public.national_team_selections
-- SET club_id = '<uuid-de-associations.id>'
-- WHERE club_id IS NULL
--   AND fullname ILIKE '%nom%';

-- ----------------------------------------------------------------------------
-- 5) VÉRIFICATION FINALE
-- ----------------------------------------------------------------------------
SELECT
    a.id,
    a.name,
    a.wilaya,
    a.responsable,
    count(s.id)                 AS nb_athletes,
    max(s.created_at)           AS derniere_inscription
FROM public.associations a
LEFT JOIN public.national_team_selections s ON s.club_id = a.id
GROUP BY a.id, a.name, a.wilaya, a.responsable
ORDER BY nb_athletes DESC;
