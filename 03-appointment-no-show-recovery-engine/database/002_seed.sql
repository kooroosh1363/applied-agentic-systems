INSERT INTO resources(id,name,timezone)VALUES('room-1','Consultation Room 1','Asia/Tbilisi'),('specialist-1','Specialist 1','Asia/Tbilisi')ON CONFLICT DO NOTHING;
INSERT INTO audit_log(actor,action,evidence_type,details)VALUES('seed','local_environment_initialized','simulated','{"note":"No real calendar, delivery, attendance, or revenue is claimed"}');
