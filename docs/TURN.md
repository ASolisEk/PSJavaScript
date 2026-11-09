# Servidor TURN para las salas «Por Internet»

Las salas por Internet conectan a cada alumno directo con el equipo del maestro (WebRTC).
En muchas redes escolares los firewalls bloquean esas conexiones directas; un servidor
**TURN** las retransmite y la sala funciona igual. PeerJS trae uno público (puerto 3478),
pero es limitado y muchas escuelas bloquean ese puerto.

## ¿Lo necesito?

En **Salas en vivo → Por Internet**, presiona **Probar conexión** desde la red de la escuela:

- «Conexión directa (STUN)» con ✓: normalmente no hace falta TURN.
- «Conexión directa» con ✗ y TURN con ✗: los alumnos probablemente no podrán entrar. Usa un
  TURN propio o la opción **Red del aula** (`npm run sala`, sin Internet).

## Opción A: un proveedor de TURN

Varios servicios ofrecen TURN administrado (algunos con un plan gratuito pequeño). Te dan
una dirección (`turn:` / `turns:`), un usuario y una contraseña. Prefiere una dirección
`turns:…:443` (TLS por el puerto 443), que pasa la mayoría de los firewalls.

## Opción B: tu propio servidor con coturn

Necesitas un servidor con IP pública (un VPS sencillo basta) y un dominio, por ejemplo
`turn.escuela.mx`.

1. Abre en el firewall: 3478 (UDP y TCP), 443 (TCP) y 49152–65535 (UDP).
2. Consigue un certificado TLS para el dominio (por ejemplo con `certbot certonly --standalone -d turn.escuela.mx`)
   y copia `fullchain.pem` y `privkey.pem` a `scripts/turn/certs/`.
3. Copia `scripts/turn/turnserver.conf.ejemplo` a `scripts/turn/turnserver.conf` y cambia la
   IP pública, el dominio y la contraseña.
4. En el servidor: `cd scripts/turn && docker compose up -d`.

La configuración de ejemplo limita el uso (cuotas y ancho de banda) y no retransmite hacia
redes privadas, para que nadie pueda usar el servidor para otra cosa.

## Configurarlo en PSJavaScript

1. **Salas en vivo → Por Internet → Servidores propios (TURN)**.
2. Dirección: `turns:turn.escuela.mx:443?transport=tcp` (puedes agregar también
   `turn:turn.escuela.mx:3478`, separadas por comas), usuario y contraseña.
3. **Probar conexión**: «Tus servidores TURN» debe salir con ✓.
4. Abre la sala. La configuración se guarda para tus próximas salas y viaja en el enlace y
   el QR: tus alumnos la usan sin escribir nada.

> El usuario y la contraseña del TURN van en el enlace de la sala, así que los alumnos
> pueden verlos. Usa una cuenta exclusiva para esto, con los límites de la configuración de
> ejemplo, y cámbiala de vez en cuando.
