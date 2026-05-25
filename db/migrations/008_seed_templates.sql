INSERT INTO email_templates (name, subject, body)
SELECT 'Perfil diseñador general',
       'Perfil de diseñador – disponible para nuevos retos',
       'Hola,

Estoy buscando nuevos retos y oportunidades para sumarme a un equipo creativo donde pueda aportar mi experiencia como diseñador gráfico y de UI/UX. He trabajado en identidad visual, branding, diseño de interfaz y desarrollo de materiales tanto digitales como impresos. Adjunto mi CV donde pueden encontrar mi portafolio ({{my_web}}) para que puedan revisarlo si buscan ampliar el equipo o requieren apoyo en proyectos de diseño.

Si lo veis oportuno, me gustaría una breve conversación.

Gracias por el tiempo y la atención,
{{my_name}}'
WHERE NOT EXISTS (SELECT 1 FROM email_templates WHERE name = 'Perfil diseñador general');

INSERT INTO email_templates (name, subject, body)
SELECT 'Perfil diseñador UI/UX',
       'Perfil de diseñador UI/UX – disponible para nuevos retos',
       'Hola,

Soy diseñador especializado en UI/UX, con experiencia en desarrollo de productos digitales, diseño de apps, webs y sistemas visuales para diferentes sectores. Adjunto mi CV donde pueden encontrar mi portafolio ({{my_web}}) ya que me gustaría formar parte de su equipo y colaborar en proyectos donde aporten valor tanto la creatividad como la experiencia en diseño centrado en el usuario.

Quedo atento por si desean ampliar información o agendar una breve charla.

Gracias por el tiempo y la atención,
{{my_name}}'
WHERE NOT EXISTS (SELECT 1 FROM email_templates WHERE name = 'Perfil diseñador UI/UX');

INSERT INTO email_templates (name, subject, body)
SELECT 'Candidatura empresa',
       'Candidatura — Diseñador UI/UX · {{company_name}}',
       'Hola equipo de {{company_name}},

comparto mi candidatura para roles de diseño en {{company_name}}. Trabajo UI/UX y diseño digital end‑to‑end (branding, interfaces app/web, arquitectura de información, prototipado, testing y WordPress), coordinándome con Producto, Desarrollo y Operaciones. Me interesan especialmente vuestros proyectos enterprise/sector público y el delivery end‑to‑end con equipos multidisciplinares; creo que puedo sumar en flujos complejos, design systems y handoff para acelerar la entrega con calidad.

Adjunto CV y carta de presentación ({{my_web}}). Si lo veis oportuno, me gustaría una breve conversación para conocer mejor el rol y el equipo.

Gracias por vuestro tiempo,
{{my_name}}'
WHERE NOT EXISTS (SELECT 1 FROM email_templates WHERE name = 'Candidatura empresa');

INSERT INTO email_templates (name, subject, body)
SELECT 'Web actualizada – sigo interesado',
       'Web actualizada — Interés en {{company_name}}',
       'Hola equipo de {{company_name}},

os escribo para comentaros que he actualizado mi web y portafolio ({{my_web}}) y quería retomar el contacto. Sigo interesado en formar parte de vuestro equipo y creo que mi perfil como {{my_role}} puede encajar en los proyectos que tenéis en marcha.

Si tenéis disponibilidad, me encantaría retomar la conversación.

Gracias de nuevo por vuestro tiempo,
{{my_name}}'
WHERE NOT EXISTS (SELECT 1 FROM email_templates WHERE name = 'Web actualizada – sigo interesado');
