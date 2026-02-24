-- Default country for new profiles: Mexico (MX)
alter table public.profiles alter column country_code set default 'MX';
