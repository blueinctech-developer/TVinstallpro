/*
 * Database schema, applied in order and recorded in schema_migrations.
 * Never edit a released migration: add a new one. Keep them additive (no DROP of data).
 * Plain TS with no imports, so the CLI scripts can load it directly with Node.
 */

export type Migration = { version: number; name: string; sql: string };

export const migrations: Migration[] = [
  {
    version: 1,
    name: "initial schema",
    sql: `
      create table admin_users (
        id integer generated always as identity primary key,
        email text not null unique,
        name text not null,
        password_hash text not null,
        role text not null default 'admin' check (role in ('admin', 'staff', 'viewer')),
        disabled boolean not null default false,
        created_at timestamptz not null default now(),
        last_login_at timestamptz
      );

      -- id is a SHA-256 of the cookie token, so a leaked table can't be replayed as cookies.
      create table admin_sessions (
        id text primary key,
        user_id integer not null references admin_users(id) on delete cascade,
        created_at timestamptz not null default now(),
        expires_at timestamptz not null,
        ip text,
        user_agent text
      );
      create index admin_sessions_user on admin_sessions(user_id);

      create table customers (
        id integer generated always as identity primary key,
        name text not null,
        email text,
        phone text,
        email_key text,  -- lower-cased email, for matching
        phone_key text,  -- last 10 digits, for matching
        area text,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
      create index customers_email_key on customers(email_key);
      create index customers_phone_key on customers(phone_key);

      create table requests (
        id integer generated always as identity primary key,
        kind text not null check (kind in ('booking', 'contact', 'partner')),
        service text,
        status text not null default 'new',
        customer_id integer references customers(id),
        name text not null,
        email text,
        phone text,
        area text,
        summary text not null default '',
        details jsonb not null default '{}',
        estimate numeric(10, 2),
        preferred_date text,
        source text not null default 'website' check (source in ('website', 'wordpress')),
        legacy_form_id integer,
        legacy_entry_id integer,
        ip text,
        submitted_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        seen_at timestamptz,
        unique (legacy_form_id, legacy_entry_id)
      );
      create index requests_status on requests(status);
      create index requests_submitted on requests(submitted_at desc);
      create index requests_customer on requests(customer_id);

      create table request_events (
        id integer generated always as identity primary key,
        request_id integer not null references requests(id) on delete cascade,
        type text not null check (type in ('created', 'imported', 'status', 'note')),
        body text,
        from_status text,
        to_status text,
        actor_id integer references admin_users(id),
        created_at timestamptz not null default now()
      );
      create index request_events_request on request_events(request_id, created_at);

      -- Admin actions (sign-ins, status changes, exports). Never holds passwords or tokens.
      create table activity_log (
        id integer generated always as identity primary key,
        actor_id integer references admin_users(id),
        action text not null,
        target text,
        meta jsonb not null default '{}',
        created_at timestamptz not null default now()
      );
      create index activity_log_created on activity_log(created_at desc);

      create table rate_limits (
        key text primary key,
        count integer not null,
        window_start timestamptz not null
      );
    `,
  },
  {
    version: 2,
    name: "users, settings, media and site content",
    sql: `
      -- WordPress usernames sign in too; source shows which accounts came from the old site.
      alter table admin_users add column username text unique;
      alter table admin_users add column source text not null default 'admin' check (source in ('admin', 'wordpress'));

      -- One-time links to set or reset a password. id is the SHA-256 of the token in the link.
      create table admin_tokens (
        id text primary key,
        user_id integer not null references admin_users(id) on delete cascade,
        purpose text not null check (purpose in ('setup', 'reset')),
        created_by integer references admin_users(id),
        created_at timestamptz not null default now(),
        expires_at timestamptz not null,
        used_at timestamptz
      );

      -- Editable site settings (business details, prices, tracking, email). Secrets stay in env vars.
      create table settings (
        key text primary key,
        value jsonb not null,
        updated_at timestamptz not null default now(),
        updated_by integer references admin_users(id)
      );

      create table media (
        id integer generated always as identity primary key,
        url text not null,
        pathname text,
        filename text not null,
        content_type text,
        size integer,
        alt text not null default '',
        source text not null default 'upload' check (source in ('upload', 'wordpress')),
        legacy_url text unique,
        created_by integer references admin_users(id),
        created_at timestamptz not null default now()
      );
      create index media_created on media(created_at desc);

      create table posts (
        id integer generated always as identity primary key,
        slug text not null unique,
        title text not null,
        excerpt text not null default '',
        body text not null default '',  -- Markdown
        status text not null default 'draft' check (status in ('draft', 'published')),
        cover_media_id integer references media(id) on delete set null,
        comments_open boolean not null default true,
        seo_title text,
        seo_description text,
        author_id integer references admin_users(id),
        legacy_id integer unique,
        published_at timestamptz,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );

      create table comments (
        id integer generated always as identity primary key,
        post_id integer references posts(id) on delete cascade,
        author_name text not null,
        author_email text,
        body text not null,
        status text not null default 'pending' check (status in ('pending', 'approved', 'spam', 'trash')),
        ip text,
        user_agent text,
        legacy_id integer unique,
        created_at timestamptz not null default now()
      );
      create index comments_status on comments(status, created_at desc);
      create index comments_post on comments(post_id, created_at);

      create table portfolio (
        id integer generated always as identity primary key,
        slug text not null unique,
        title text not null,
        description text not null default '',
        service text,
        media_ids integer[] not null default '{}',
        status text not null default 'draft' check (status in ('draft', 'published')),
        sort integer not null default 0,
        legacy_id integer unique,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );

      create table team (
        id integer generated always as identity primary key,
        name text not null,
        role_title text not null default '',
        bio text not null default '',
        photo_media_id integer references media(id) on delete set null,
        status text not null default 'draft' check (status in ('draft', 'published')),
        sort integer not null default 0,
        legacy_id integer unique,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );

      create table testimonials (
        id integer generated always as identity primary key,
        author text not null,
        location text not null default '',
        body text not null,
        rating integer check (rating between 1 and 5),
        source text not null default '',
        status text not null default 'draft' check (status in ('draft', 'published')),
        sort integer not null default 0,
        legacy_id integer unique,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );

      create table email_log (
        id integer generated always as identity primary key,
        to_addr text not null,
        subject text not null,
        status text not null check (status in ('sent', 'failed', 'skipped')),
        error text,
        request_id integer references requests(id) on delete set null,
        created_at timestamptz not null default now()
      );
      create index email_log_created on email_log(created_at desc);
    `,
  },
];
