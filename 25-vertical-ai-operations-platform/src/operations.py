"""Durable local service-operations workflow; no external side effects."""
import hashlib
import json
import re
import sqlite3
import threading
import time
import uuid
from pathlib import Path


class DomainError(Exception):
    def __init__(self, code, status=400):
        super().__init__(code)
        self.code, self.status = code, status


def require(condition, code, status=400):
    if not condition:
        raise DomainError(code, status)


def identifier(value):
    return isinstance(value, str) and re.fullmatch(r'[A-Za-z0-9_-]{1,64}', value) is not None


def integer(value):
    return type(value) is int and 0 <= value <= 2**53 - 1


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), allow_nan=False)


ISSUES = {'cooling_fault': 'cooling', 'heating_fault': 'heating', 'general_service': 'general'}
ROLES = {'intake', 'reviewer', 'dispatcher', 'technician', 'supervisor', 'viewer'}
FIELDS = {
    'create': {'customer_ref', 'issue'}, 'suggest': {'order_id', 'expected_revision'},
    'review': {'order_id', 'expected_revision', 'category'},
    'schedule': {'order_id', 'expected_revision', 'technician', 'starts', 'ends'},
    'start': {'order_id', 'expected_revision'},
    'complete': {'order_id', 'expected_revision', 'completion_code'},
    'close': {'order_id', 'expected_revision'}, 'cancel': {'order_id', 'expected_revision'},
    'pause': {'paused'},
}
ACTION_ROLES = {'create': 'intake', 'suggest': 'reviewer', 'review': 'reviewer',
                'schedule': 'dispatcher', 'start': 'technician', 'complete': 'technician',
                'close': 'supervisor', 'cancel': 'dispatcher', 'pause': 'supervisor'}


class Platform:
    def __init__(self, database, credentials, technicians, clock=time.time):
        require(isinstance(credentials, list) and bool(credentials), 'invalid_credentials')
        self._credentials = {}
        for entry in credentials:
            require(isinstance(entry, dict), 'invalid_credentials')
            token, tenant, actor, roles = (entry.get(k) for k in ('token', 'tenant', 'actor', 'roles'))
            require(isinstance(token, str) and len(token) >= 32 and identifier(tenant) and identifier(actor), 'invalid_credentials')
            require(isinstance(roles, list) and bool(roles) and all(isinstance(r, str) and r in ROLES for r in roles), 'invalid_roles')
            digest = hashlib.sha256(token.encode()).hexdigest()
            require(digest not in self._credentials, 'duplicate_credential')
            self._credentials[digest] = (tenant, actor, frozenset(roles))
        require(isinstance(technicians, list), 'invalid_technicians')
        self._technicians = {}
        for t in technicians:
            require(isinstance(t, dict) and identifier(t.get('tenant')) and identifier(t.get('actor')), 'invalid_technicians')
            require(type(t.get('active')) is bool and isinstance(t.get('skills'), list) and
                    all(isinstance(s, str) and s in ISSUES.values() for s in t['skills']), 'invalid_technicians')
            key = (t['tenant'], t['actor'])
            require(key not in self._technicians, 'duplicate_technician')
            require(any(p[0:2] == key and 'technician' in p[2] for p in self._credentials.values()), 'technician_identity_missing')
            self._technicians[key] = (t['active'], frozenset(t['skills']))
        self._clock = clock
        self._lock = threading.RLock()
        self._db = sqlite3.connect(database, timeout=5, isolation_level=None, check_same_thread=False)
        self._db.row_factory = sqlite3.Row
        self._db.execute('PRAGMA foreign_keys=ON')
        version = self._db.execute('PRAGMA user_version').fetchone()[0]
        if version not in (0, 1):
            self._db.close()
            raise DomainError('unsupported_schema', 503)
        if version == 0:
            self._db.executescript(Path(__file__).with_name('schema.sql').read_text())

    def close(self):
        self._db.close()

    def authenticate(self, token, role=None):
        require(isinstance(token, str), 'unauthorized', 401)
        principal = self._credentials.get(hashlib.sha256(token.encode()).hexdigest())
        require(principal is not None, 'unauthorized', 401)
        require(role is None or role in principal[2], 'forbidden', 403)
        return principal

    def _order(self, tenant, order_id):
        require(identifier(order_id), 'invalid_order_id')
        row = self._db.execute('SELECT * FROM orders WHERE tenant=? AND id=?', (tenant, order_id)).fetchone()
        require(row is not None, 'not_found', 404)
        return dict(row)

    def snapshot(self, token):
        tenant, _, _ = self.authenticate(token, 'viewer')
        with self._lock:
            # Snapshot consistency across this process and other connections.
            self._db.execute('BEGIN')
            try:
                orders = [dict(r) for r in self._db.execute('SELECT * FROM orders WHERE tenant=? ORDER BY id', (tenant,))]
                audit = [dict(r) for r in self._db.execute('SELECT * FROM audit WHERE tenant=? ORDER BY sequence', (tenant,))]
                paused = self._db.execute('SELECT paused FROM tenant_state WHERE tenant=?', (tenant,)).fetchone()
                result = {'orders': orders, 'audit': audit, 'paused': bool(paused and paused[0]),
                          'counts': {s: sum(o['status'] == s for o in orders) for s in sorted({o['status'] for o in orders})},
                          'evidence': 'local-simulation', 'externalDelivery': False}
                self._db.execute('COMMIT')
                return result
            except Exception:
                self._db.execute('ROLLBACK')
                raise

    def command(self, token, data):
        self.authenticate(token)
        require(isinstance(data, dict) and isinstance(data.get('action'), str) and data['action'] in FIELDS, 'invalid_command')
        action = data['action']
        require(set(data) == {'action', 'key'} | FIELDS[action] and identifier(data.get('key')), 'invalid_command')
        tenant, actor, _ = self.authenticate(token, ACTION_ROLES[action])
        try:
            fingerprint = hashlib.sha256(canonical(data).encode()).hexdigest()
        except (ValueError, TypeError):
            raise DomainError('invalid_command') from None
        with self._lock:
            try:
                self._db.execute('BEGIN IMMEDIATE')
                cached = self._db.execute('SELECT fingerprint,response FROM receipts WHERE tenant=? AND actor=? AND command_key=?',
                                          (tenant, actor, data['key'])).fetchone()
                if cached:
                    require(cached['fingerprint'] == fingerprint, 'idempotency_conflict', 409)
                    result = json.loads(cached['response'])
                    self._db.execute('COMMIT')
                    return result
                self._db.execute('INSERT OR IGNORE INTO tenant_state(tenant) VALUES(?)', (tenant,))
                now = self._clock()
                require(isinstance(now, (int, float)) and 0 <= now < 2**53, 'invalid_clock', 503)
                if action == 'pause':
                    require(type(data['paused']) is bool, 'invalid_pause')
                    self._db.execute('UPDATE tenant_state SET paused=? WHERE tenant=?', (int(data['paused']), tenant))
                    result = {'paused': data['paused']}
                elif action == 'create':
                    require(identifier(data['customer_ref']) and isinstance(data['issue'], str) and data['issue'] in ISSUES, 'invalid_intake')
                    order_id = uuid.uuid4().hex
                    self._db.execute("INSERT INTO orders(tenant,id,revision,status,customer_ref,issue) VALUES(?,?,1,'new',?,?)",
                                     (tenant, order_id, data['customer_ref'], data['issue']))
                    result = self._order(tenant, order_id)
                else:
                    order = self._order(tenant, data['order_id'])
                    require(integer(data['expected_revision']) and order['revision'] == data['expected_revision'], 'revision_conflict', 409)
                    result = self._transition(tenant, actor, action, data, order, int(now))
                self._db.execute('INSERT INTO audit(tenant,actor,action,order_id,revision,at) VALUES(?,?,?,?,?,?)',
                                 (tenant, actor, action, result.get('id'), result.get('revision'), int(now)))
                response = {**result, 'evidence': 'local-simulation', 'externalDelivery': False}
                self._db.execute('INSERT INTO receipts VALUES(?,?,?,?,?)', (tenant, actor, data['key'], fingerprint, canonical(response)))
                self._db.execute('COMMIT')
                return response
            except Exception as exc:
                if self._db.in_transaction:
                    self._db.execute('ROLLBACK')
                if isinstance(exc, sqlite3.Error):
                    raise DomainError('storage_unavailable', 503) from None
                raise

    def _transition(self, tenant, actor, action, data, order, now):
        status = order['status']
        if action == 'suggest':
            require(status == 'new', 'invalid_transition', 409)
            order.update(status='suggested', suggestion=ISSUES[order['issue']])
        elif action == 'review':
            require(status == 'suggested', 'invalid_transition', 409)
            require(isinstance(data['category'], str) and data['category'] in ISSUES.values(), 'invalid_category')
            order.update(status='reviewed', category=data['category'], reviewer=actor)
        elif action == 'schedule':
            require(status == 'reviewed', 'invalid_transition', 409)
            require(not self._db.execute('SELECT paused FROM tenant_state WHERE tenant=?', (tenant,)).fetchone()[0], 'paused', 423)
            require(identifier(data['technician']), 'invalid_technician')
            tech = self._technicians.get((tenant, data['technician']))
            require(tech and tech[0] and order['category'] in tech[1], 'technician_not_qualified', 409)
            start, end = data['starts'], data['ends']
            require(integer(start) and integer(end) and start >= now and 0 < end - start <= 8 * 3600, 'invalid_window')
            overlap = self._db.execute("SELECT 1 FROM orders WHERE tenant=? AND technician=? AND status IN ('scheduled','in_progress') AND starts < ? AND ends > ?",
                                       (tenant, data['technician'], end, start)).fetchone()
            require(not overlap, 'schedule_conflict', 409)
            order.update(status='scheduled', technician=data['technician'], starts=start, ends=end)
        elif action == 'start':
            require(status == 'scheduled', 'invalid_transition', 409)
            require(actor == order['technician'], 'not_assigned', 403)
            require(not self._db.execute('SELECT paused FROM tenant_state WHERE tenant=?', (tenant,)).fetchone()[0], 'paused', 423)
            tech = self._technicians.get((tenant, actor))
            require(tech and tech[0] and order['category'] in tech[1], 'technician_not_qualified', 409)
            require(order['starts'] <= now < order['ends'], 'outside_window', 409)
            active = self._db.execute("SELECT 1 FROM orders WHERE tenant=? AND technician=? AND status='in_progress'", (tenant, actor)).fetchone()
            require(not active, 'technician_busy', 409)
            order['status'] = 'in_progress'
        elif action == 'complete':
            require(status == 'in_progress', 'invalid_transition', 409)
            require(actor == order['technician'], 'not_assigned', 403)
            require(isinstance(data['completion_code'], str) and data['completion_code'] in ('service_recorded', 'inspection_recorded'), 'invalid_completion')
            order.update(status='completed', completion_code=data['completion_code'], completed_by=actor)
        elif action == 'close':
            require(status == 'completed', 'invalid_transition', 409)
            require(actor != order['completed_by'], 'independent_closure_required', 403)
            order['status'] = 'closed'
        elif action == 'cancel':
            require(status in ('new', 'suggested', 'reviewed', 'scheduled'), 'invalid_transition', 409)
            order['status'] = 'cancelled'
        order['revision'] += 1
        columns = ['revision', 'status', 'suggestion', 'category', 'reviewer', 'technician', 'starts', 'ends', 'completion_code', 'completed_by']
        self._db.execute('UPDATE orders SET ' + ','.join(c + '=?' for c in columns) + ' WHERE tenant=? AND id=?',
                         [order[c] for c in columns] + [tenant, order['id']])
        return order
