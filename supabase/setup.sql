-- =============================================================================
--  ALTA DE LA BODA «susi-y-gonxo» EN SUPABASE
-- =============================================================================
--  Se ejecuta en el SQL Editor del proyecto. El paso 0 solo MIRA: sirve para
--  no escribir a ciegas sobre un esquema que no conocemos desde el repo.
-- -----------------------------------------------------------------------------


-- PASO 0 · Ver cómo es la tabla de clientes y cómo valida la contraseña ------
--  Ejecuta esto primero y mira el resultado: los nombres de columna del
--  PASO 1 tienen que coincidir con los que salgan aquí.

select column_name, data_type, is_nullable
from information_schema.columns
where table_name = 'clients'
order by ordinal_position;

--  Y esto enseña el cuerpo de la función de login, que es quien decide si la
--  contraseña se guarda cifrada (verás `crypt(`) o en claro (verás `=`):

select prosrc
from pg_proc
where proname = 'verify_client_password';


-- PASO 1 · Dar de alta a Susi y Gonxo ---------------------------------------
--  ⚠️ Elige UNA de las dos versiones según lo que hayas visto en el PASO 0.

--  1a) Si `verify_client_password` usa crypt() → contraseña cifrada (lo suyo):
insert into clients (client_id, display_name, username, password_hash, role)
values (
  'novia-y-novio',
  'Susi & Gonxo',
  'susi',
  crypt('TU-CONTRASENA', gen_salt('bf')),
  'client'
)
on conflict (client_id) do update
  set display_name  = excluded.display_name,
      username      = excluded.username,
      password_hash = excluded.password_hash,
      role          = excluded.role;

--  1b) Si la función compara la contraseña tal cual → guardada en claro.
--      Descomenta esta y comenta la de arriba.
--
-- insert into clients (client_id, display_name, username, password, role)
-- values ('novia-y-novio', 'Susi & Gonxo', 'susi', 'TU-CONTRASENA', 'client')
-- on conflict (client_id) do update
--   set display_name = excluded.display_name,
--       username     = excluded.username,
--       password     = excluded.password,
--       role         = excluded.role;

--  Si crypt() da error de función inexistente, falta la extensión:
--      create extension if not exists pgcrypto;


-- PASO 2 · Comprobar que el login funciona ----------------------------------
--  Tiene que devolver una fila con role / client_id / display_name.

select * from verify_client_password('susi', 'TU-CONTRASENA');


-- =============================================================================
--  PASO 3 · CERRAR LA LECTURA PÚBLICA DE `rsvps`   ← IMPORTANTE
-- =============================================================================
--  Hoy la tabla `rsvps` se puede leer entera con la clave `anon`, que viaja
--  dentro del JavaScript de la invitación y por tanto la tiene cualquiera que
--  abra la página. Comprobado contra el proyecto: una petición con esa clave
--  devuelve nombres de invitados, alergias y mensajes privados, de todas las
--  bodas del proyecto.
--
--  La invitación NO necesita leer: solo inserta confirmaciones. Quien lee es
--  el panel /admin, y lo hace después de pasar por verify_client_password.
--
--  Antes de aplicarlo, mira qué políticas hay ahora:

select policyname, cmd, roles, qual, with_check
from pg_policies
where tablename = 'rsvps';

--  Y luego deja solo la de insertar (ajusta el nombre de la política de
--  lectura al que te haya salido arriba):
--
-- alter table rsvps enable row level security;
-- drop policy if exists "Enable read access for all users" on rsvps;
--
-- create policy "invitados pueden confirmar"
--   on rsvps for insert to anon
--   with check (true);

--  Mismo repaso para `songs`: ahí la lectura pública SÍ hace falta, porque la
--  invitación enseña la playlist. Con que se pueda leer e insertar basta;
--  no debería poder borrarse ni actualizarse nada más que los votos.

select policyname, cmd, roles, qual, with_check
from pg_policies
where tablename = 'songs';
