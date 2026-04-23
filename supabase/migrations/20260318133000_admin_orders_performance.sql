create index if not exists idx_orders_user_id
on public.orders (user_id);

create index if not exists idx_orders_created_at
on public.orders (created_at desc);

create index if not exists idx_orders_status
on public.orders (status);

create or replace function public.admin_fetch_orders(
  p_limit integer default 20,
  p_offset integer default 0,
  p_status text default null,
  p_search text default null
)
returns table (
  id uuid,
  order_id text,
  user_id uuid,
  customer_name text,
  customer_phone text,
  shipping_address text,
  shipping_city text,
  shipping_state text,
  shipping_pincode text,
  items jsonb,
  subtotal numeric,
  tax numeric,
  shipping numeric,
  total numeric,
  payment_method text,
  status text,
  estimated_delivery text,
  created_at timestamptz,
  updated_at timestamptz,
  cancelled_at timestamptz
)
language sql
security invoker
set search_path = public
as $$
  select
    o.id,
    o.order_id,
    o.user_id,
    o.customer_name,
    o.customer_phone,
    o.shipping_address,
    o.shipping_city,
    o.shipping_state,
    o.shipping_pincode,
    o.items,
    o.subtotal,
    o.tax,
    o.shipping,
    o.total,
    o.payment_method,
    o.status,
    o.estimated_delivery,
    o.created_at,
    o.updated_at,
    o.cancelled_at
  from public.orders o
  where
    (p_status is null or o.status = p_status)
    and (
      p_search is null
      or o.order_id ilike '%' || p_search || '%'
      or o.customer_name ilike '%' || p_search || '%'
    )
  order by o.created_at desc
  limit greatest(coalesce(p_limit, 20), 1)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

grant execute on function public.admin_fetch_orders(integer, integer, text, text) to authenticated;
