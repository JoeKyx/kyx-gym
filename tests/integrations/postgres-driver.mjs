import { spawn } from 'node:child_process';
// Disposable test container only. Never accepts arbitrary production connection strings.
export class Postgres {
  role = '';
  async exec(sql) {
    return this.send(sql);
  }
  async query(sql, args = []) {
    sql = sql.replace(/\$(\d+)/g, (_, n) => {
      const v = args[Number(n) - 1];
      return v == null
        ? 'null'
        : "'" +
            (typeof v === 'object' ? JSON.stringify(v) : String(v)).replaceAll(
              "'",
              "''"
            ) +
            "'";
    });
    if (/^select\b/i.test(sql.trim()))
      sql = 'select row_to_json(kyx_result.*) from (' + sql + ') kyx_result';
    if (
      /^(update|insert|delete)\b/i.test(sql.trim()) &&
      /\breturning\b/i.test(sql)
    )
      sql =
        'with changed as (' +
        sql +
        ') select row_to_json(changed.*) from changed';
    const output = await this.send(sql);
    return {
      rows: output.trim()
        ? output
            .trim()
            .split('\n')
            .map((line) => JSON.parse(line))
        : [],
    };
  }
  async send(sql) {
    if (sql === 'set role authenticated') {
      this.role = 'set role authenticated;';
      return '';
    }
    if (sql === 'reset role') {
      this.role = '';
      return '';
    }
    return new Promise((resolve, reject) => {
      const runtime =
        process.env.KYX_TEST_CONTAINER_RUNTIME === 'docker'
          ? 'docker'
          : 'podman';
      const child = spawn(runtime, [
        'exec',
        '-i',
        'kyx-gym-agent-test-db',
        'psql',
        '-U',
        'postgres',
        '-d',
        'postgres',
        '-qAt',
        '-v',
        'ON_ERROR_STOP=1',
      ]);
      let output = '',
        error = '';
      child.stdout.on('data', (d) => (output += d));
      child.stderr.on('data', (d) => (error += d));
      child.on('error', reject);
      child.on('close', (code) =>
        code === 0 ? resolve(output) : reject(new Error(error))
      );
      child.stdin.end(this.role + sql);
    });
  }
  async close() {}
}
