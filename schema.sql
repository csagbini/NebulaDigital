-- Generated from src/lib/strings.ts — do not hand-edit.
-- Regenerate with: npm run db:sql

create extension if not exists pgcrypto;

create table if not exists client_intakes (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  status        text not null default 'new'
                check (status in ('new','reviewed','quoted')),
  internal_notes text not null default '',

  -- submission metadata
  lang          text not null default 'en',
  ip_hash       text,
  user_agent    text,
  files         jsonb not null default '[]'::jsonb,

  -- answers
  contact_name text,
  business_name text,
  email text,
  phone text,
  business_description text,
  years_in_business text,
  customer_location text,
  typical_customer text,
  differentiator text,
  has_website text,
  website_url text,
  website_dislikes text,
  primary_goal text,
  primary_goal_other text,
  success_metric text,
  sites_liked text,
  sites_disliked text,
  pages_needed text[],
  pages_other text,
  copy_status text,
  logo_status text,
  photo_status text,
  site_languages text[],
  site_languages_other text,
  brand_guidelines text,
  features_needed text[],
  existing_tools text,
  domain_status text,
  hosting_status text,
  budget_range text,
  budget_approved text,
  timeline text,
  deadline_reason text,
  decision_makers text,
  contact_preference text,
  referral_source text,
  anything_else text
);

create index if not exists client_intakes_created_at_idx
  on client_intakes (created_at desc);

create index if not exists client_intakes_status_idx
  on client_intakes (status);

-- Used by the rate limiter to count recent submissions per connection.
create index if not exists client_intakes_ip_recent_idx
  on client_intakes (ip_hash, created_at desc);

-- ---------------------------------------------------------------------------
-- Safe to run against an existing table: adds any question added since it was
-- created, and does nothing for columns that are already there.
-- ---------------------------------------------------------------------------

alter table client_intakes add column if not exists contact_name text;
alter table client_intakes add column if not exists business_name text;
alter table client_intakes add column if not exists email text;
alter table client_intakes add column if not exists phone text;
alter table client_intakes add column if not exists business_description text;
alter table client_intakes add column if not exists years_in_business text;
alter table client_intakes add column if not exists customer_location text;
alter table client_intakes add column if not exists typical_customer text;
alter table client_intakes add column if not exists differentiator text;
alter table client_intakes add column if not exists has_website text;
alter table client_intakes add column if not exists website_url text;
alter table client_intakes add column if not exists website_dislikes text;
alter table client_intakes add column if not exists primary_goal text;
alter table client_intakes add column if not exists primary_goal_other text;
alter table client_intakes add column if not exists success_metric text;
alter table client_intakes add column if not exists sites_liked text;
alter table client_intakes add column if not exists sites_disliked text;
alter table client_intakes add column if not exists pages_needed text[];
alter table client_intakes add column if not exists pages_other text;
alter table client_intakes add column if not exists copy_status text;
alter table client_intakes add column if not exists logo_status text;
alter table client_intakes add column if not exists photo_status text;
alter table client_intakes add column if not exists site_languages text[];
alter table client_intakes add column if not exists site_languages_other text;
alter table client_intakes add column if not exists brand_guidelines text;
alter table client_intakes add column if not exists features_needed text[];
alter table client_intakes add column if not exists existing_tools text;
alter table client_intakes add column if not exists domain_status text;
alter table client_intakes add column if not exists hosting_status text;
alter table client_intakes add column if not exists budget_range text;
alter table client_intakes add column if not exists budget_approved text;
alter table client_intakes add column if not exists timeline text;
alter table client_intakes add column if not exists deadline_reason text;
alter table client_intakes add column if not exists decision_makers text;
alter table client_intakes add column if not exists contact_preference text;
alter table client_intakes add column if not exists referral_source text;
alter table client_intakes add column if not exists anything_else text;
