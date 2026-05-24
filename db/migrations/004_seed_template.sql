INSERT INTO email_templates (name, subject, body)
SELECT 'Contacto en frío', 'Colaboración con {{company_name}}', 'Hola {{contact_name}},

Me presento: soy {{my_name}}, {{my_role}}.

He estado siguiendo el trabajo de {{company_name}} y me encantaría explorar posibles colaboraciones. Creo que mi experiencia puede aportar valor a vuestro equipo.

Podéis ver mi trabajo en {{my_web}} o contactarme en {{my_email}}.

¿Tendríais disponibilidad para una charla rápida esta semana?

Un saludo,
{{my_name}}'
WHERE NOT EXISTS (SELECT 1 FROM email_templates WHERE name = 'Contacto en frío');
