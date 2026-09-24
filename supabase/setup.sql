-- =============================================================================
--  ALTA DE LA BODA «susi-y-gonxo» EN SUPABASE
-- =============================================================================
--  Se ejecuta en el SQL Editor, por pasos y mirando el resultado de cada uno.
--  No pegues el archivo entero de golpe.
-- -----------------------------------------------------------------------------


-- =============================================================================
--  LO QUE HAY HOY EN LA BASE (comprobado contra el proyecto, 24/09/2026)
-- =============================================================================
--  Conviven dos sistemas de login, uno encima del otro:
--
--  · `client_credentials` — el bueno, y el que se usa de verdad. Tiene
--    `username` y `password_hash`, y compara con crypt() (bcrypt). Es también
--    el que mira `get_clients_list` para el acceso maestro.
--
--  · `clients` — el viejo. Contraseña en claro (columna `password`) y sin
--    columna `username`.
--
--  Hay DOS funciones `verify_client_password`, una por sistema, y se
--  distinguen por sus argumentos:
--
--      verify_client_password(input_username, input_password)  → client_credentials
--      verify_client_password(input_password)                  → clients
--
--  POR QUÉ FUNCIONA UNA BODA QUE SOLO ESTÁ EN `client_credentials`:
--  el código llama con los dos argumentos con nombre, y PostgREST elige la
--  función cuyos nombres de parámetro encajan exactamente. Con dos nombres
--  siempre cae en la de `client_credentials`. La vieja nunca entra por ahí:
--  necesita que la llamen con `input_password` a secas.
--
--  Por eso dar de alta en `client_credentials` es lo correcto, y por eso las
--  parejas que solo están ahí entran sin problema.
--
--  LO QUE SÍ CHIRRÍA de la función vieja, que es esta entera:
--
--      SELECT c.client_id, c.display_name, c.role
--      FROM clients c
--      WHERE c.password = input_password;
--
--  El WHERE no mira el usuario: le basta la contraseña. Y se puede llamar
--  desde fuera con la clave `anon` (comprobado: devuelve 200, no 404).
--  El daño está acotado porque las dos tablas de credenciales SÍ están
--  protegidas: una lectura con la clave `anon` devuelve 0 filas en las dos,
--  así que las contraseñas en claro no se pueden sacar desde fuera. Aun así
--  es una puerta que no comprueba quién llama y que no usa nadie: mejor
--  cerrarla (PASO 3).


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
--  PASO 3 · QUITAR LA FUNCIÓN VIEJA
-- =============================================================================
--  Confirma antes el tipo del argumento con el PASO 0b (debería ser `text`)
--  y comprueba que el oid que borras es el de la versión de una sola entrada.

drop function if exists public.verify_client_password(input_password text);

--  Repite el PASO 2 después: tiene que seguir funcionando igual, porque el
--  código llama a la de dos argumentos.
--
--  Y esta comprobación, desde fuera, debe pasar a devolver 404 en vez de 200:
--
--    curl -X POST "$SUPABASE_URL/rest/v1/rpc/verify_client_password" \
--      -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
--      -d '{"input_password":"lo-que-sea"}'
--
--  Cuando ya no la use nadie, la tabla vieja tampoco pinta nada. Mira antes
--  si queda alguna pareja que solo esté ahí:
--
-- select client_id, display_name, role from clients;
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
--  playlist. `clients` y `client_credentials` ya están bien: comprobado que
--  con la clave `anon` devuelven 0 filas.
