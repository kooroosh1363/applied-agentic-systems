import json
import secrets
import tempfile
from pathlib import Path
from operations import Platform


def demo():
    roles = ['intake', 'reviewer', 'dispatcher', 'technician', 'supervisor']
    credentials = [{'token': secrets.token_hex(32), 'tenant': 'demo', 'actor': r, 'roles': [r, 'viewer']} for r in roles]
    tokens = {c['actor']: c['token'] for c in credentials}
    technicians = [{'tenant': 'demo', 'actor': 'technician', 'active': True, 'skills': ['cooling']}]
    with tempfile.TemporaryDirectory() as directory:
        path = str(Path(directory) / 'demo.db')
        service = Platform(path, credentials, technicians, clock=lambda: 1000)
        order = service.command(tokens['intake'], {'action': 'create', 'key': 'intake-1', 'customer_ref': 'sample-customer', 'issue': 'cooling_fault'})
        for i, (role, action, extra) in enumerate([
            ('reviewer', 'suggest', {}), ('reviewer', 'review', {'category': 'cooling'}),
            ('dispatcher', 'schedule', {'technician': 'technician', 'starts': 1000, 'ends': 2000}),
            ('technician', 'start', {}), ('technician', 'complete', {'completion_code': 'service_recorded'}),
            ('supervisor', 'close', {})
        ]):
            order = service.command(tokens[role], {'action': action, 'key': f'command-{i}',
                                    'order_id': order['id'], 'expected_revision': order['revision'], **extra})
        snapshot = service.snapshot(tokens['supervisor'])
        service.close()
        reopened = Platform(path, credentials, technicians, clock=lambda: 1000)
        replay = reopened.command(tokens['intake'], {'action': 'create', 'key': 'intake-1', 'customer_ref': 'sample-customer', 'issue': 'cooling_fault'})
        print(json.dumps({'final_status': order['status'], 'revision': order['revision'],
                          'counts': snapshot['counts'], 'audit_events': len(snapshot['audit']),
                          'replay_after_restart_same_id': replay['id'] == order['id'],
                          'evidence': 'local-simulation', 'externalDelivery': False}, indent=2))
        reopened.close()


if __name__ == '__main__':
    demo()
