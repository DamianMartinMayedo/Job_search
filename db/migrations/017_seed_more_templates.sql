-- Plantillas adicionales cubriendo casos típicos para perfil UX/UI en España.
-- Todas idempotentes via WHERE NOT EXISTS por nombre.

-- 1. Aplicación a oferta concreta (usa placeholders job_*)
INSERT INTO email_templates (name, subject, body)
SELECT 'Aplicación a oferta concreta',
       'Candidatura — {{job_title}} en {{company_name}}',
       'Hola equipo de {{company_name}},

He visto vuestra oferta de {{job_title}}{{job_location}} y me gustaría enviaros mi candidatura. Mi perfil como {{my_role}} encaja con lo que describís: trabajo end-to-end (investigación, arquitectura de información, UI, prototipado y handoff) y estoy acostumbrado a coordinarme con Producto y Desarrollo en entregas iterativas.

Adjunto CV y carta de presentación. Podéis ver más trabajo en {{my_web}}.

Referencia de la oferta: {{job_url}}

Si lo veis encaja, me encantaría conocer mejor el rol y el equipo.

Gracias por vuestro tiempo,
{{my_name}}'
WHERE NOT EXISTS (SELECT 1 FROM email_templates WHERE name = 'Aplicación a oferta concreta');

-- 2. Empresa pequeña / agencia de diseño
INSERT INTO email_templates (name, subject, body)
SELECT 'Agencia / estudio de diseño',
       'Hola {{company_name}} — perfil de diseño disponible',
       'Hola equipo de {{company_name}},

he estado siguiendo vuestro trabajo y me parece que tenéis una mezcla muy bonita entre estrategia visual y producto. Soy {{my_role}} y trabajo en proyectos donde branding, UI y producto digital van de la mano: identidad, sistemas, interfaces web/app y todo el delivery hasta WordPress o handoff a Desarrollo.

Os escribo por si estáis abiertos a sumar a alguien al equipo, ya sea en plantilla o freelance puntual. Adjunto CV y portafolio en {{my_web}}.

Si lo veis con sentido, una llamada breve para conoceros sería genial.

Un saludo,
{{my_name}}'
WHERE NOT EXISTS (SELECT 1 FROM email_templates WHERE name = 'Agencia / estudio de diseño');

-- 3. Estudio de producto / consultora digital
INSERT INTO email_templates (name, subject, body)
SELECT 'Estudio de producto / consultora',
       'Perfil UX/UI · {{company_name}}',
       'Hola equipo de {{company_name}},

os escribo porque me interesa la forma en que enfocáis el producto desde la consultoría: discovery, validación con usuarios y delivery iterativo. Soy {{my_role}}; trabajo UX/UI end-to-end con foco en colaboración multidisciplinar — me acoplo bien con PMs, ingeniería e investigación, y disfruto la fase de research tanto como la de pulir interfaz.

Adjunto CV y portafolio ({{my_web}}). Si tenéis hueco abierto o pinta de abrirlo a medio plazo, me encantaría una charla.

Gracias por vuestro tiempo,
{{my_name}}'
WHERE NOT EXISTS (SELECT 1 FROM email_templates WHERE name = 'Estudio de producto / consultora');

-- 4. Startup / scale-up tech
INSERT INTO email_templates (name, subject, body)
SELECT 'Startup / scale-up tech',
       'UX/UI para {{company_name}} — disponibilidad',
       'Hola {{company_name}},

vuestro producto me llama mucho la atención y me gustaría sumarme a un equipo en esta fase de crecimiento donde el diseño tiene impacto directo en métricas y velocidad de entrega. Soy {{my_role}}: experiencia llevando UI/UX desde primeros bocetos hasta producción, design system propio, ownership de discovery y comodidad iterando con ingeniería en sprints cortos.

Adjunto CV y mi portafolio en {{my_web}}. Si abrís vacante o conocéis a alguien que la abrirá pronto, me encantaría hablar.

Gracias,
{{my_name}}'
WHERE NOT EXISTS (SELECT 1 FROM email_templates WHERE name = 'Startup / scale-up tech');

-- 5. Empresa grande / corporate
INSERT INTO email_templates (name, subject, body)
SELECT 'Empresa grande / corporate',
       'Candidatura — Diseñador UX/UI · {{company_name}}',
       'Estimado equipo de {{company_name}},

les escribo para hacerles llegar mi candidatura como {{my_role}}. Mi experiencia incluye diseño UX/UI para productos enterprise, trabajo con design systems consolidados, coordinación con equipos multidisciplinares (Producto, Desarrollo, QA, Marketing) y entrega de proyectos con dependencias entre áreas y plazos cerrados.

Adjunto CV y carta de presentación. En {{my_web}} pueden encontrar el portafolio con casos detallados.

Quedo a su disposición para ampliar información o agendar una conversación cuando lo consideren oportuno.

Un cordial saludo,
{{my_name}}'
WHERE NOT EXISTS (SELECT 1 FROM email_templates WHERE name = 'Empresa grande / corporate');
