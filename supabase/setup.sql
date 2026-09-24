-- =============================================================================
--  ALTA DE LA BODA «susi-y-gonxo» EN SUPABASE
-- =============================================================================
--  Se ejecuta en el SQL Editor, por pasos y mirando el resultado de cada uno.
--  No pegues el archivo entero de golpe.
-- -----------------------------------------------------------------------------


-- =============================================================================
--  LO QUE HAY HOY EN LA BASE (diagnóstico del 24/09/2026)
-- =============================================================================
--  Conviven dos sistemas de login, uno encima del otro:
--
--  · `client_credentials` — el bueno. Tiene `username` y `password_hash`, y la
--    función que lo usa compara con crypt(), o sea bcrypt. Es también el que
--    mira `get_clients_list` para el acceso maestro.
--
--  · `clients` — el viejo. Guarda la contraseña en claro (columna `password`,
--    sin hashear) y NO tiene columna `username`.
--
--  Y hay DOS funciones `verify_client_password`, una por sistema. La vieja es:
--
--      SELECT c.client_id, c.display_name, c.role
--      FROM clients c
--      WHERE c.password = input_password;
--
--  Fíjate en que el WHERE no mira el usuario: le basta la contraseña. Quien
--  acierte la contraseña de cualquier pareja entra como esa pareja, escriba lo
--  que escriba en el campo de usuario. Y como están en claro, quien pueda leer
--  `clients` las tiene todas.
--
--  Damos de alta a Susi y Gonxo en `client_credentials`, que es el sistema
--  bueno. El PASO 3 se ocupa de la función vieja.


-- PASO 0 · Confirmar el terreno ---------------------------------------------
--  0a) Columnas de la tabla buena (para que el INSERT del PASO 1 cuadre):

select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_name = 'client_credentials'
order by ordinal_position;

--  0b) Qué argumentos tiene cada una de las dos funciones. Esto dice cuál de
--      las dos responde cuando la invitación llama con
--      (input_username, input_password), que es como la llama el código:

select p.oid,
       p.proname,
       pg_get_function_identity_arguments(p.oid) as argumentos,
       pg_get_function_result(p.oid)             as devuelve
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('verify_client_password', 'get_clients_list')
order by p.proname;

--  0c) Quién hay ya dado de alta (sin enseñar las contraseñas):

select client_id, display_name, username, role
from client_credentials
order by client_id;


-- PASO 1 · Dar de alta a Susi y Gonxo ---------------------------------------
--  Ajusta los nombres de columna si el PASO 0a devolvió otros.
--  Si crypt() da «function does not exist»:
--      create extension if not exists pgcrypto;

insert into client_credentials (client_id, display_name, username, password_hash, role)
values (
  'susi-y-gonxo',
  'Susi & Gonxo',
  'susi',
  crypt('TU-CONTRASENA', gen_salt('bf')),
  'client'
);


-- PASO 2 · Comprobar que el login funciona ----------------------------------
--  Tiene que devolver una fila: client / susi-y-gonxo / Susi & Gonxo.

select * from verify_client_password('susi', 'TU-CONTRASENA');

--  Y esta NO debería devolver nada (usuario correcto, contraseña inventada):

select * from verify_client_password('susi', 'contrasena-que-no-es');


-- =============================================================================
--  PASO 3 · QUITAR LA FUNCIÓN VIEJA          ← hazlo antes de publicar
-- =============================================================================
--  Mientras siga existiendo la versión que entra solo con la contraseña, el
--  panel tiene dos puertas y una no comprueba el usuario.
--
--  Con los argumentos que te dio el PASO 0b, borra la que lee de `clients`.
--  Va con la firma completa porque hay dos funciones con el mismo nombre y
--  Postgres necesita saber cuál:
--
-- drop function public.verify_client_password(<argumentos que diga el paso 0b>);
--
--  Repite el PASO 2 después de borrarla: tiene que seguir funcionando igual,
--  porque el código llama a la de `client_credentials`.
--
--  Cuando ya no la use nadie, la tabla vieja tampoco pinta nada:
--
-- drop table if exists public.clients;


-- =============================================================================
--  PASO 4 · CERRAR LA LECTURA PÚBLICA DE `rsvps`
-- =============================================================================
--  La tabla `rsvps` se puede leer entera con la clave `anon`, que viaja dentro
--  del JavaScript de la invitación y por tanto la tiene cualquiera que abra la
--  página. Comprobado: devuelve nombres de invitados, alergias y mensajes
--  privados, de todas las bodas del proyecto.
--
--  La invitación NO necesita leer: solo inserta confirmaciones. Quien lee es
--  el panel /admin, y lo hace después de pasar por verify_client_password.
--
--  Mira primero qué políticas hay:

select policyname, cmd, roles, qual, with_check
from pg_policies
where tablename in ('rsvps', 'songs', 'clients', 'client_credentials')
order by tablename, policyname;

--  Y luego deja solo la de insertar (ajusta el nombre de la política de
--  lectura al que te haya salido arriba):
--
-- alter table rsvps enable row level security;
-- drop policy if exists "Enable read access for all users" on rsvps;
--
-- create policy "invitados pueden confirmar"
--   on rsvps for insert to anon
--   with check (true);
--
--  En `songs` la lectura pública sí hace falta: la invitación enseña la
--  playlist. Y comprueba que ni `clients` ni `client_credentials` sean
--  legibles por `anon`.
