"""Generate random local demo credentials; output contains secrets, do not commit."""
import json
import secrets
roles = ['intake', 'reviewer', 'dispatcher', 'technician', 'supervisor', 'viewer']
print(json.dumps({
    'credentials': [{'token': secrets.token_hex(32), 'tenant': 'demo', 'actor': role,
                     'roles': [role, 'viewer']} for role in roles],
    'technicians': [{'tenant': 'demo', 'actor': 'technician', 'active': True,
                     'skills': ['cooling', 'heating', 'general']}]
}))
