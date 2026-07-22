# RepuesTop Backoffice — App Móvil (Android)

Extensión móvil del [backoffice web](../backoffice_sistema) de RepuesTop. Apunta al **mismo backend** (`RespuesTop-mono-repo/backend`) y a la **misma base de datos** — cualquier acción hecha desde el celular (pagar un retiro, responder un ticket, resolver una mediación) queda reflejada de inmediato en la web, y viceversa. No hay sincronización adicional: ambos clientes consumen la misma API `/api/v1/*`.

Construida con **Expo (React Native) + TypeScript**, reutilizando literalmente los tipos, la lógica de llamadas a la API y las reglas de permisos ya validadas en el backoffice web, con una interfaz rediseñada desde cero para pantallas táctiles.

## Áreas incluidas

- **Selector de área** (home post-login) + **Permisos** (solo `SUPER_ADMIN`): asignación por correo, listado de usuarios, gestión de vendedores fundadores.
- **Administración Contable**: resumen del ciclo, pedidos, retiros (con documento de liquidación: adjuntar/ver PDF), pagos por ciclo (gestión + historial).
- **Soporte**: workspace, tickets con filtros, chat con adjuntos (cámara/galería/documento), reportes QA.
- **Confianza y Mediación**: dashboard, vendedores (perfil/bloqueos/reportes/documentos/actividad), validaciones (aprobar/corregir/rechazar), mediaciones (chat + iniciar/bloquear/resolver/reactivar con documento), alertas de riesgo, bitácora de auditoría, reportes.

## Requisitos

- Node.js 18+ y npm.
- Un dispositivo Android físico (recomendado) o un emulador Android.
- El backend (`RespuesTop-mono-repo/backend`) corriendo localmente con `SPRING_PROFILES_ACTIVE=dev,local` (puerto 8080 por defecto).
- Cuenta gratuita de [Expo](https://expo.dev) para generar builds con EAS (solo necesaria para compilar el APK, no para desarrollar).

## Configuración del backend (desarrollo)

El celular **no puede usar `localhost`** para llegar a tu PC — necesita la IP de tu computador en la red local (WiFi).

1. Obtén tu IP LAN:
   ```bash
   ipconfig
   ```
   Busca la "Dirección IPv4" del adaptador activo (ej. `192.168.1.14`).
2. Edita [`.env.development`](.env.development) y reemplaza `<COMPLETAR_IP_LAN>`:
   ```
   EXPO_PUBLIC_API_URL=http://192.168.1.14:8080/api/v1
   ```
3. Si usas el **emulador de Android Studio** en vez de un dispositivo físico, usa `http://10.0.2.2:8080/api/v1` en su lugar.
4. Asegúrate de que el backend esté corriendo (`./mvnw spring-boot:run` con las variables de entorno del perfil local) y que tu celular esté en la **misma red WiFi** que tu PC.

## Desarrollo

```bash
npm install
npm run dev-client
```

Esto requiere un **development build** instalado en tu dispositivo (no Expo Go, porque el proyecto usa módulos nativos como `expo-secure-store`, `expo-image-picker` y `expo-document-picker`). Para generar el development build la primera vez:

```bash
npx eas build --platform android --profile development
```

Instala el `.apk` resultante en tu dispositivo, luego corre `npm run dev-client` y escanea el QR — los cambios de código se recargan en caliente igual que con Expo Go.

## Generar el APK

**Opción recomendada — EAS Build (nube, no requiere Android Studio):**

```bash
npx eas login
npx eas build --platform android --profile preview
```

Esto genera un `.apk` instalable descargable por link/QR desde el dashboard de Expo. Antes de compilar, actualiza en [`eas.json`](eas.json) la variable `EXPO_PUBLIC_API_URL` del perfil `preview` con la IP LAN o URL del backend que se probará.

**Alternativa — build local con Gradle** (sin depender de servicios cloud de Expo, requiere JDK 17 y Android SDK instalados):

```bash
npx expo prebuild
cd android
./gradlew assembleRelease
```

El `.apk` queda en `android/app/build/outputs/apk/release/`.

**Producción**: el perfil `production` de `eas.json` genera un `.aab` para Play Store, con `EXPO_PUBLIC_API_URL` apuntando a la URL real del backend desplegado (a confirmar con el equipo — no hay dominio de producción documentado en el backend todavía).

## Estructura del proyecto

```
src/
├── api/            # Llamadas a la API, un archivo por módulo (mismo mapeo que el web)
├── types/          # Tipos TS portados literalmente desde el backoffice web
├── hooks/          # usePermissions (hasBackofficePermission), hooks de datos
├── context/        # AuthContext (JWT en expo-secure-store)
├── navigation/      # RootNavigator + navigators por área + guards (Area/SuperAdmin)
├── features/        # Pantallas por módulo: auth, area-selector, permissions,
│                     # administration, support, trust-safety
├── components/
│   ├── shared/       # Design system: Card, Button, Badge, ListItemCard, FilterSheet, etc.
│   └── layout/       # AppHeader
├── theme/            # Paleta de colores, tipografía, espaciado
└── utils/            # Formatters y utilidades puras portadas del web
```

## Notas de implementación

- El login soporta email/contraseña. El botón de Google queda visible pero deshabilitado hasta contar con el Android OAuth Client ID (requiere `google-services.json` y configuración en Google Cloud Console).
- El JWT se guarda cifrado con `expo-secure-store` (Android Keystore), no en almacenamiento plano.
- La subida de archivos (documentos de liquidación, adjuntos de tickets, evidencias de mediación) usa `expo-image-picker` y `expo-document-picker`; las descargas usan `expo-file-system` + `expo-sharing`.
- No se replicaron las herramientas de importación CSV / seguimiento de gastos y retiros de socios del backoffice web (funcionalidad de escritorio orientada a power-users, fuera del alcance del rediseño móvil); el flujo de pagos a proveedores (retiros/pagos por ciclo) sí está completo.
