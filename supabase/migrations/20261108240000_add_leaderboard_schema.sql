-- Gamified Leaderboard schema

-- 1. Add points column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS points integer DEFAULT 0 NOT NULL;

-- 2. Create the secure global leaderboard view
CREATE OR REPLACE VIEW public.global_leaderboard AS
SELECT 
    p.id,
    p.username,
    p.avatar_url,
    p.points,
    t.team_type,
    c.name AS country_name,
    c.code AS country_code
FROM public.profiles p
JOIN public.teams t ON p.team_id = t.id
LEFT JOIN public.countries c ON t.country_id = c.id
WHERE p.role = 'member'
ORDER BY p.points DESC;

-- 3. Grant permissions
GRANT SELECT ON public.global_leaderboard TO authenticated;
