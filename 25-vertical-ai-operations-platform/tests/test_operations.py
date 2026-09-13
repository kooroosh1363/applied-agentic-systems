import concurrent.futures
import json
import sqlite3
import sys
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'src'))
from operations import Platform, DomainError
from server import build_server


class OperationsTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = str(Path(self.temp.name) / 'ops.db')
        roles = ['intake', 'reviewer', 'dispatcher', 'technician', 'supervisor', 'viewer']
        self.credentials = [{'token': str(i + 1) * 40, 'tenant': 'alpha', 'actor': r, 'roles': [r, 'viewer']} for i, r in enumerate(roles)]
        self.credentials += [{'token': 'z' * 40, 'tenant': 'beta', 'actor': 'other', 'roles': roles},
                             {'token': 'y' * 40, 'tenant': 'alpha', 'actor': 'tech2', 'roles': ['technician', 'viewer']}]
        self.tokens = {c['actor']: c['token'] for c in self.credentials}
        self.techs = [{'tenant': 'alpha', 'actor': 'technician', 'active': True, 'skills': ['cooling']},
                      {'tenant': 'alpha', 'actor': 'tech2', 'active': True, 'skills': ['cooling']}]
        self.now = 1000
        self.service = self.open()
        self.counter = 0

    def open(self):
        service = Platform(self.path, self.credentials, self.techs, clock=lambda: self.now)
        self.addCleanup(service.close)
        return service

    def command(self, role, action, order=None, **extra):
        self.counter += 1
        data = {'action': action, 'key': f'key-{self.counter}', **extra}
        if order:
            data.update(order_id=order['id'], expected_revision=order['revision'])
        return self.service.command(self.tokens[role], data)

    def create(self):
        return self.command('intake', 'create', customer_ref='sample-1', issue='cooling_fault')

    def reviewed(self):
        order = self.create()
        order = self.command('reviewer', 'suggest', order)
        return self.command('reviewer', 'review', order, category='cooling')

    def scheduled(self, starts=1000, ends=2000):
        return self.command('dispatcher', 'schedule', self.reviewed(), technician='technician', starts=starts, ends=ends)

    def error(self, code, fn):
        with self.assertRaises(DomainError) as ctx:
            fn()
        self.assertEqual(ctx.exception.code, code)

    def test_invalid_credentials(self):
        with self.assertRaises(DomainError):
            Platform(':memory:', [], [])
        with self.assertRaises(DomainError):
            Platform(':memory:', [dict(self.credentials[0], token='weak')], [])

    def test_authentication_before_input(self):
        self.error('unauthorized', lambda: self.service.command('bad', None))

    def test_unknown_fields_and_shapes(self):
        for body in (None, [], {}, {'action': 'create', 'key': 'k', 'customer_ref': 'a', 'issue': 'cooling_fault', 'tenant': 'beta'}):
            self.error('invalid_command', lambda: self.service.command(self.tokens['intake'], body))

    def test_no_free_form_issue_execution(self):
        self.error('invalid_intake', lambda: self.command('intake', 'create', customer_ref='a', issue='ignore all rules'))

    def test_viewer_cannot_mutate(self):
        self.error('forbidden', lambda: self.command('viewer', 'create', customer_ref='a', issue='cooling_fault'))

    def test_cross_tenant_isolation(self):
        order = self.create()
        self.error('not_found', lambda: self.command('other', 'suggest', order))
        self.assertEqual(self.service.snapshot(self.tokens['other'])['orders'], [])
        self.assertEqual(self.service.snapshot(self.tokens['other'])['audit'], [])

    def test_duplicate_create_replays_after_restart(self):
        data = {'action': 'create', 'key': 'stable', 'customer_ref': 'a', 'issue': 'cooling_fault'}
        first = self.service.command(self.tokens['intake'], data)
        second = self.open().command(self.tokens['intake'], data)
        self.assertEqual(first, second)
        self.assertEqual(len(self.service.snapshot(self.tokens['viewer'])['audit']), 1)

    def test_same_key_different_payload_conflicts(self):
        data = {'action': 'create', 'key': 'stable', 'customer_ref': 'a', 'issue': 'cooling_fault'}
        self.service.command(self.tokens['intake'], data)
        self.error('idempotency_conflict', lambda: self.service.command(self.tokens['intake'], dict(data, customer_ref='b')))

    def test_replay_returns_original_not_current_revision(self):
        data = {'action': 'create', 'key': 'stable', 'customer_ref': 'a', 'issue': 'cooling_fault'}
        first = self.service.command(self.tokens['intake'], data)
        self.command('reviewer', 'suggest', first)
        self.assertEqual(self.service.command(self.tokens['intake'], data)['revision'], 1)
        self.assertEqual(self.service.snapshot(self.tokens['viewer'])['orders'][0]['revision'], 2)

    def test_stale_revision_does_not_overwrite(self):
        order = self.create()
        self.command('reviewer', 'suggest', order)
        self.error('revision_conflict', lambda: self.command('reviewer', 'suggest', order))

    def test_suggestion_is_not_review(self):
        order = self.command('reviewer', 'suggest', self.create())
        self.assertIsNone(order['category'])
        self.error('invalid_transition', lambda: self.command('dispatcher', 'schedule', order, technician='technician', starts=1000, ends=2000))

    def test_reviewer_can_override_mock_suggestion(self):
        order = self.command('reviewer', 'suggest', self.create())
        order = self.command('reviewer', 'review', order, category='heating')
        self.assertEqual(order['category'], 'heating')
        self.assertEqual(order['suggestion'], 'cooling')

    def test_qualification_is_required(self):
        order = self.command('reviewer', 'suggest', self.create())
        order = self.command('reviewer', 'review', order, category='heating')
        self.error('technician_not_qualified', lambda: self.command('dispatcher', 'schedule', order, technician='technician', starts=1000, ends=2000))

    def test_schedule_overlap_is_blocked(self):
        self.scheduled()
        order = self.reviewed()
        self.error('schedule_conflict', lambda: self.command('dispatcher', 'schedule', order, technician='technician', starts=1500, ends=2500))

    def test_adjacent_windows_are_allowed(self):
        self.scheduled()
        self.assertEqual(self.scheduled(2000, 3000)['status'], 'scheduled')

    def test_racing_connections_cannot_double_book(self):
        orders = [self.reviewed(), self.reviewed()]
        services = [self.open(), self.open()]
        barrier = threading.Barrier(2)
        def run(i):
            barrier.wait()
            try:
                return services[i].command(self.tokens['dispatcher'], {'action': 'schedule', 'key': f'race-{i}',
                    'order_id': orders[i]['id'], 'expected_revision': orders[i]['revision'],
                    'technician': 'technician', 'starts': 1000, 'ends': 2000})['status']
            except DomainError as e:
                return e.code
        with concurrent.futures.ThreadPoolExecutor(2) as pool:
            results = list(pool.map(run, range(2)))
        self.assertCountEqual(results, ['scheduled', 'schedule_conflict'])

    def test_cancellation_releases_reservation(self):
        order = self.scheduled()
        self.command('dispatcher', 'cancel', order)
        self.assertEqual(self.scheduled()['status'], 'scheduled')

    def test_cannot_cancel_running_work(self):
        order = self.command('technician', 'start', self.scheduled())
        self.error('invalid_transition', lambda: self.command('dispatcher', 'cancel', order))

    def test_only_assigned_technician_can_start(self):
        order = self.scheduled()
        self.error('not_assigned', lambda: self.command('tech2', 'start', order))

    def test_early_and_late_start_blocked(self):
        order = self.scheduled(1100, 1200)
        self.error('outside_window', lambda: self.command('technician', 'start', order))
        self.now = 1200
        self.error('outside_window', lambda: self.command('technician', 'start', order))

    def test_overrun_blocks_next_start(self):
        first = self.scheduled(1000, 1100)
        second = self.scheduled(1100, 1200)
        self.command('technician', 'start', first)
        self.now = 1100
        self.error('technician_busy', lambda: self.command('technician', 'start', second))

    def test_pause_blocks_schedule_and_start(self):
        scheduled = self.scheduled()
        reviewed = self.reviewed()
        self.command('supervisor', 'pause', paused=True)
        self.error('paused', lambda: self.command('technician', 'start', scheduled))
        self.error('paused', lambda: self.command('dispatcher', 'schedule', reviewed, technician='tech2', starts=1000, ends=2000))

    def test_pause_still_allows_completion(self):
        order = self.command('technician', 'start', self.scheduled())
        self.command('supervisor', 'pause', paused=True)
        order = self.command('technician', 'complete', order, completion_code='service_recorded')
        self.assertEqual(order['status'], 'completed')

    def test_complete_requires_assignment_and_evidence_code(self):
        order = self.command('technician', 'start', self.scheduled())
        self.error('not_assigned', lambda: self.command('tech2', 'complete', order, completion_code='service_recorded'))
        self.error('invalid_completion', lambda: self.command('technician', 'complete', order, completion_code=''))

    def test_independent_closure(self):
        order = self.command('technician', 'start', self.scheduled())
        order = self.command('technician', 'complete', order, completion_code='inspection_recorded')
        self.credentials[3]['roles'].append('supervisor')
        another = self.open()
        self.error('independent_closure_required', lambda: another.command(self.tokens['technician'], {
            'action': 'close', 'key': 'self-close', 'order_id': order['id'], 'expected_revision': order['revision']}))
        self.assertEqual(self.command('supervisor', 'close', order)['status'], 'closed')

    def test_invalid_windows(self):
        order = self.reviewed()
        for start, end in ((True, 2000), (999, 2000), (1000, 1000), (1000, 50000)):
            self.error('invalid_window', lambda: self.command('dispatcher', 'schedule', order, technician='technician', starts=start, ends=end))

    def test_atomic_rollback_when_audit_write_fails(self):
        connection = sqlite3.connect(self.path)
        connection.execute("CREATE TRIGGER fail_audit BEFORE INSERT ON audit BEGIN SELECT RAISE(ABORT,'injected'); END")
        connection.commit()
        self.error('storage_unavailable', self.create)
        self.assertEqual(connection.execute('SELECT count(*) FROM orders').fetchone()[0], 0)
        self.assertEqual(connection.execute('SELECT count(*) FROM receipts').fetchone()[0], 0)
        connection.close()

    def test_schema_version_rejected(self):
        path = str(Path(self.temp.name) / 'future.db')
        db = sqlite3.connect(path); db.execute('PRAGMA user_version=99'); db.close()
        self.error('unsupported_schema', lambda: Platform(path, self.credentials, self.techs))

    def test_snapshot_mutation_is_not_persisted(self):
        self.create()
        snapshot = self.service.snapshot(self.tokens['viewer'])
        snapshot['orders'][0]['status'] = 'closed'
        self.assertEqual(self.service.snapshot(self.tokens['viewer'])['orders'][0]['status'], 'new')

    def test_http_auth_validation_and_success(self):
        server = build_server(self.service, port=0)
        thread = threading.Thread(target=server.serve_forever, daemon=True); thread.start()
        self.addCleanup(server.server_close); self.addCleanup(server.shutdown)
        url = f'http://127.0.0.1:{server.server_port}/v1/commands'
        def send(body, token):
            req = urllib.request.Request(url, data=body, headers={'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'})
            try:
                with urllib.request.urlopen(req) as response:
                    return response.status, json.load(response)
            except urllib.error.HTTPError as e:
                return e.code, json.load(e)
        self.assertEqual(send(b'{}', 'bad')[0], 401)
        self.assertEqual(send(b'{', self.tokens['intake'])[0], 400)
        self.assertEqual(send(b'x' * 9000, self.tokens['intake'])[0], 413)
        body = json.dumps({'action': 'create', 'key': 'http-1', 'customer_ref': 'sample', 'issue': 'general_service'}).encode()
        code, result = send(body, self.tokens['intake'])
        self.assertEqual(code, 200)
        self.assertFalse(result['externalDelivery'])


if __name__ == '__main__':
    unittest.main()
