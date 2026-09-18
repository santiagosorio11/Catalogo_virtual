# Publicación del catálogo e integración con el CRM de Órbita IA

La misma aplicación expone dos entradas:

- Dashboard privado: `https://TU-DOMINIO/admin`
- Catálogo público: `https://TU-DOMINIO/`

## 1. Publicar la aplicación

Despliega el proyecto en un dominio HTTPS. En el proveedor de hosting configura las variables que aparecen en `.env.local.example` y agrega:

```env
ORBITA_ALLOWED_FRAME_ANCESTORS=https://TU-DOMINIO-WHITELABEL
ORBITA_STRICT_FRAME_ANCESTORS=false
```

Usa orígenes, no rutas: `https://dominio.com` es válido; `https://dominio.com/ruta` no lo es. Con `ORBITA_STRICT_FRAME_ANCESTORS=true` la cabecera solo autoriza los orígenes que declares, sin dominios del proveedor. Después de cambiar esta variable vuelve a desplegar, porque `next.config.ts` construye la política de iframe al iniciar la aplicación.

## 2. Preparar el acceso administrativo

El login público de registro fue retirado. Crea cada administrador desde Supabase Authentication o con el script local `scripts/create-admin-user.mjs`. No compartas la service role key con el navegador ni la guardes en el repositorio.

La sesión del panel usa cookies `SameSite=None; Secure; Partitioned` en producción. Esto permite conservar la sesión dentro del iframe del CRM y la separa por sitio superior en navegadores compatibles. La sesión se renueva con Supabase mientras siga siendo válida y solo se elimina al cerrar sesión o borrar los datos del navegador.

## 3. Agregar el iframe en el CRM

Debes entrar como administrador de agencia:

1. Abre `Agency view`.
2. Entra a `Settings` y luego a `Custom Menu Links`.
3. Selecciona `Create New`.
4. Usa un título como `Catálogo Virtual` y elige un icono de productos o tienda.
5. En `URL` pega `https://TU-DOMINIO/admin`.
6. En el modo de apertura selecciona `Open in an Embedded Page (iFrame)`.
7. En la visibilidad lateral activa `Sub-Account sidebar`.
8. Selecciona únicamente la subcuenta que administrará este catálogo.
9. En roles elige `Admin` si solo los administradores deben editar productos.
10. Deja cámara y micrófono desactivados y guarda.

La primera apertura sin sesión muestra el login. Después de autenticar, las siguientes aperturas en la misma subcuenta y navegador entran al dashboard mientras el refresh token siga vigente.

## 4. Probar antes de entregar

1. Abre el enlace desde el menú de la subcuenta, no solo en una pestaña normal.
2. Confirma que aparece el login y que las credenciales llevan a `/admin`.
3. Cierra el menú y vuelve a abrirlo; el dashboard debe conservar la sesión.
4. Edita un producto de prueba y confirma que el cambio aparece en `https://TU-DOMINIO/`.
5. Prueba el catálogo público en un móvil y completa un checkout de prueba controlado.

Si el navegador bloquea todas las cookies de terceros, permite cookies para el dominio del catálogo o abre `/admin` en una pestaña nueva. No envíes la URL `/admin` a clientes; comparte únicamente la raíz pública.

### Si aparece "vercel.com refused to connect"

Ese mensaje indica que Vercel está redirigiendo el iframe a su propia pantalla de autenticación. La pantalla de Vercel no admite ser cargada dentro de un iframe.

1. En Vercel abre el proyecto y entra a `Settings > Deployment Protection`.
2. En `Vercel Authentication`, selecciona `None` para la URL que vas a embeber y guarda.
3. Usa preferiblemente el dominio de producción listado en `Settings > Domains`; evita la URL de rama que contiene `git-main`.
4. Vuelve a desplegar después de cambiar `ORBITA_ALLOWED_FRAME_ANCESTORS`.
5. Comprueba que la URL ya no redirige a `vercel.com/sso-api` antes de pegar `https://TU-DOMINIO/admin` en el CRM.

Un enlace compartible de preview no es apropiado como URL permanente del iframe: depende de cookies de Vercel y puede romperse en sesiones o navegadores distintos. El login que debe proteger el panel es `/admin/login`, servido por esta aplicación, no el login de Vercel.

## 5. MCP de Supabase para este proyecto

El servidor quedó declarado en `.codex/config.toml` con el nombre `supabase_catalogo_virtual` y limitado al proyecto `xoztabrfvxandlvjkbhs`.

Desde una terminal abierta en esta carpeta:

```powershell
codex mcp login supabase_catalogo_virtual --oauth-client-registration dcr
codex mcp list
```

La autenticación abre OAuth en el navegador. No requiere guardar un PAT en el repositorio. Los scopes compatibles con Supabase están declarados en la configuración y las herramientas de escritura quedan configuradas para pedir aprobación.

## 6. Sincronización de contactos y cotizaciones por SMS

El checkout y la creación manual de pedidos sincronizan el cliente con la subcuenta del CRM al guardar la solicitud. El pedido completo también se agrega como nota del contacto. El botón `Enviar cotización` envía un SMS a través del proveedor externo configurado en la subcuenta; no abre ningún enlace ni expone el token al navegador.

Configura estas variables en el entorno del servidor:

```env
ORBITA_CRM_API_KEY=pit-REEMPLAZAR
ORBITA_CRM_LOCATION_ID=REEMPLAZAR_ID_SUBCUENTA
ORBITA_CRM_DEFAULT_PHONE_COUNTRY_CODE=57
ORBITA_CRM_CONTACT_COUNTRY=CO
ORBITA_CRM_MESSAGE_TYPE=Custom
ORBITA_CRM_CONVERSATION_PROVIDER_ID=REEMPLAZAR_ID_PROVEEDOR
```

El Private Integration Token debe pertenecer a la subcuenta y tener, como mínimo, los scopes `contacts.write` y `conversations/message.write`. Si deseas guardar la cédula como un campo visible independiente, crea el custom field en el CRM y agrega su id como `ORBITA_CRM_CEDULA_CUSTOM_FIELD_ID`; de todas formas, la cédula y el resto del pedido quedan incluidos en la nota.

### Canal de envío

La cotización sale por SMS, no por WhatsApp. Hay dos formas de enrutarla y dependen de cómo quedó dado de alta tu proveedor externo:

- **Proveedor adicional** (convive con el SMS nativo): deja `ORBITA_CRM_MESSAGE_TYPE=Custom` y define `ORBITA_CRM_CONVERSATION_PROVIDER_ID` con el id que genera el proveedor al crearlo en el marketplace. Sin ese id la aplicación no envía y marca el pedido como CRM sin configurar, en vez de mandar el mensaje por el canal equivocado.
- **Proveedor predeterminado** (reemplaza al SMS nativo en Settings > Phone Numbers > Advanced Settings > SMS Provider): define `ORBITA_CRM_MESSAGE_TYPE=SMS` y deja vacío el id del proveedor.

El número remitente lo decide siempre el proveedor; la aplicación no lo envía. Sin `ORBITA_CRM_LOCATION_ID` el pedido se guarda igual, pero queda marcado como CRM sin configurar.

El texto de la cotización se arma en texto plano, sin viñetas ni `*negrita*`, porque en SMS esos caracteres se ven literales y los que salen de GSM-7 obligan a codificar en UCS-2 (el segmento baja de 153 a 67 caracteres). El panel muestra el conteo de segmentos junto al cuadro de texto.

Antes de operar en producción, aplica la migración `supabase/migrations/0006_orders_quotes_ghl.sql`, vuelve a desplegar las variables y prueba con un contacto autorizado. Un estado HTTP exitoso confirma que el CRM aceptó el mensaje; la entrega final depende del proveedor de SMS y de sus propias reglas.
