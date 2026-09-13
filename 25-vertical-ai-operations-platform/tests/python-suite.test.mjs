import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
test('Project 25 Python domain, persistence, race and HTTP suite', () => {
  const result = spawnSync('python3', ['-m', 'unittest', 'discover', '-s', 'tests', '-p', 'test_*.py', '-v'], {
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' }, cwd: fileURLToPath(new URL('..', import.meta.url)), encoding: 'utf8', timeout: 30000
  });
  assert.match(result.stderr, /Ran [1-9][0-9]* tests/, 'Python test discovery must not silently run zero tests');
  assert.equal(result.status, 0, `${result.error || ''}\n${result.stdout}\n${result.stderr}`);
});
